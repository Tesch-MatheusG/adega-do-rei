// Testes da baixa manual de estoque (quebra, perda, vencimento...).
jest.mock('../src/config/database', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize('sqlite::memory:', { logging: false });
});
process.env.JWT_SECRET = 'segredo-de-teste';

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const { sequelize, User, Product, StockMovement, Categoria } = require('../src/models');

const auth = (t) => ({ Authorization: `Bearer ${t}` });
let admin, cliente, produtoId;
const baixa = (id, corpo, token = admin) => request(app).patch(`/api/produtos/${id}/baixa`).set(auth(token)).send(corpo);

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await Categoria.create({ nome: 'Vinho' });
  await User.create({ nome: 'Dono', email: 'dono@x.com', cpf: '52998224725', dataNascimento: '1980-01-01', senha: await bcrypt.hash('senha1234', 10), role: 'admin' });
  await User.create({ nome: 'Ana', email: 'ana@x.com', cpf: '11144477735', dataNascimento: '1995-05-20', senha: await bcrypt.hash('senha1234', 10), role: 'cliente' });
  admin = (await request(app).post('/api/auth/login').send({ email: 'dono@x.com', senha: 'senha1234' })).body.token;
  cliente = (await request(app).post('/api/auth/login').send({ email: 'ana@x.com', senha: 'senha1234' })).body.token;
  const p = await request(app).post('/api/produtos').set(auth(admin))
    .send({ nome: 'Vinho Teste', categoria: 'Vinho', preco: 50, volumeMl: 750, descricao: null, estoque: 10 });
  produtoId = p.body.id;
});
afterAll(() => sequelize.close());

describe('Baixa manual de estoque', () => {
  test('exige login (401) e papel de admin (403)', async () => {
    expect((await request(app).patch(`/api/produtos/${produtoId}/baixa`).send({ quantidade: 1, motivo: 'quebra' })).status).toBe(401);
    expect((await baixa(produtoId, { quantidade: 1, motivo: 'quebra' }, cliente)).status).toBe(403);
    expect((await Product.findByPk(produtoId)).estoque).toBe(10);
  });

  test('admin dá baixa: subtrai do saldo e registra saída com saldo antes/depois', async () => {
    const r = await baixa(produtoId, { quantidade: '3', motivo: 'Quebra', observacao: '  caiu   na   reposição ' });
    expect(r.status).toBe(200);
    expect(r.body.produto.estoque).toBe(7);

    const mov = await StockMovement.findOne({ where: { produtoId, tipo: 'saida' } });
    expect(mov.quantidade).toBe(3);
    expect(mov.saldoAnterior).toBe(10);
    expect(mov.saldoPosterior).toBe(7);
    expect(mov.motivo).toBe('Quebra: caiu na reposição');
    expect(mov.usuarioId).not.toBeNull();
  });

  test('não permite baixa maior que o estoque (409) e não altera nada', async () => {
    const movs = await StockMovement.count({ where: { produtoId } });
    const r = await baixa(produtoId, { quantidade: 8, motivo: 'perda' });
    expect(r.status).toBe(409);
    expect(r.body.erro).toMatch(/restam 7/);
    expect((await Product.findByPk(produtoId)).estoque).toBe(7);
    expect(await StockMovement.count({ where: { produtoId } })).toBe(movs);
  });

  test('pode zerar o estoque exatamente', async () => {
    const r = await baixa(produtoId, { quantidade: 7, motivo: 'vencimento' });
    expect(r.status).toBe(200);
    expect(r.body.produto.estoque).toBe(0);
    expect((await baixa(produtoId, { quantidade: 1, motivo: 'perda' })).status).toBe(409);
  });

  test.each([
    ['quantidade zero', { quantidade: 0, motivo: 'quebra' }],
    ['quantidade negativa', { quantidade: -2, motivo: 'quebra' }],
    ['quantidade decimal', { quantidade: 1.5, motivo: 'quebra' }],
    ['quantidade ausente', { motivo: 'quebra' }],
    ['motivo ausente', { quantidade: 1 }],
    ['motivo fora da lista', { quantidade: 1, motivo: 'presente' }],
    ['"outro" sem observação', { quantidade: 1, motivo: 'outro' }],
    ['observação longa demais', { quantidade: 1, motivo: 'quebra', observacao: 'x'.repeat(151) }],
  ])('rejeita %s (400)', async (_nome, corpo) => {
    await Product.update({ estoque: 5 }, { where: { id: produtoId } });
    const r = await baixa(produtoId, corpo);
    expect(r.status).toBe(400);
    expect((await Product.findByPk(produtoId)).estoque).toBe(5);
  });

  test('"outro" com observação é aceito e aparece no histórico', async () => {
    const r = await baixa(produtoId, { quantidade: 1, motivo: 'outro', observacao: 'Degustação' });
    expect(r.status).toBe(200);
    const hist = await request(app).get(`/api/produtos/${produtoId}/movimentacoes`).set(auth(admin));
    expect(hist.body[0]).toMatchObject({ tipo: 'saida', quantidade: 1, motivo: 'Outro: Degustação' });
  });

  test('produto inexistente (404) e id inválido (400)', async () => {
    expect((await baixa(9999, { quantidade: 1, motivo: 'quebra' })).status).toBe(404);
    expect((await baixa('abc', { quantidade: 1, motivo: 'quebra' })).status).toBe(400);
  });
});
