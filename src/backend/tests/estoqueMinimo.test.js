// Limite de alerta de estoque baixo por produto (campo estoqueMinimo) e migração da coluna.
jest.mock('../src/config/database', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize('sqlite::memory:', { logging: false });
});
process.env.JWT_SECRET = 'segredo-de-teste';

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const { sequelize, User, Product, Categoria } = require('../src/models');
const { aplicarMigracoes } = require('../src/services/migracaoService');

const auth = (t) => ({ Authorization: `Bearer ${t}` });
let admin, cliente;
const novo = (extra = {}) => ({ nome: 'Produto', categoria: 'Vinho', preco: 50, volumeMl: 750, descricao: null, estoque: 10, ...extra });

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await Categoria.create({ nome: 'Vinho' });
  await User.create({ nome: 'Dono', email: 'dono@x.com', cpf: '52998224725', dataNascimento: '1980-01-01', senha: await bcrypt.hash('senha1234', 10), role: 'admin' });
  await User.create({ nome: 'Ana', email: 'ana@x.com', cpf: '11144477735', dataNascimento: '1995-05-20', senha: await bcrypt.hash('senha1234', 10), role: 'cliente' });
  admin = (await request(app).post('/api/auth/login').send({ email: 'dono@x.com', senha: 'senha1234' })).body.token;
  cliente = (await request(app).post('/api/auth/login').send({ email: 'ana@x.com', senha: 'senha1234' })).body.token;
});
afterAll(() => sequelize.close());

describe('Estoque mínimo por produto', () => {
  test('sem informar, o produto nasce com o padrão 5', async () => {
    const r = await request(app).post('/api/produtos').set(auth(admin)).send(novo({ nome: 'Padrão' }));
    expect(r.status).toBe(201);
    expect(r.body.estoqueMinimo).toBe(5);
  });

  test('admin define o mínimo ao cadastrar (e aceita texto numérico)', async () => {
    const r = await request(app).post('/api/produtos').set(auth(admin)).send(novo({ nome: 'Heineken', estoqueMinimo: '48' }));
    expect(r.status).toBe(201);
    expect(r.body.estoqueMinimo).toBe(48);
    expect((await Product.findByPk(r.body.id)).estoqueMinimo).toBe(48);
  });

  test('null no cadastro vale como ausente (usa o padrão)', async () => {
    const r = await request(app).post('/api/produtos').set(auth(admin)).send(novo({ nome: 'Nulo', estoqueMinimo: null }));
    expect(r.status).toBe(201);
    expect(r.body.estoqueMinimo).toBe(5);
  });

  test('0 é válido (alerta só quando acabar)', async () => {
    const r = await request(app).post('/api/produtos').set(auth(admin)).send(novo({ nome: 'Zero', estoqueMinimo: 0 }));
    expect(r.status).toBe(201);
    expect(r.body.estoqueMinimo).toBe(0);
  });

  test('altera o mínimo de um produto existente sem mexer no resto', async () => {
    const p = (await request(app).post('/api/produtos').set(auth(admin)).send(novo({ nome: 'Royal Salute', preco: 1200, estoqueMinimo: 5 }))).body;
    const r = await request(app).put(`/api/produtos/${p.id}`).set(auth(admin)).send({ estoqueMinimo: 2 });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ estoqueMinimo: 2, nome: 'Royal Salute', preco: 1200, estoque: 10 });
  });

  test('null na atualização mantém o valor atual (coluna obrigatória)', async () => {
    const p = (await request(app).post('/api/produtos').set(auth(admin)).send(novo({ nome: 'Mantém', estoqueMinimo: 7 }))).body;
    const r = await request(app).put(`/api/produtos/${p.id}`).set(auth(admin)).send({ estoqueMinimo: null, preco: 60 });
    expect(r.status).toBe(200);
    expect(r.body.estoqueMinimo).toBe(7);
  });

  test.each([
    ['negativo', -1],
    ['decimal', 2.5],
    ['texto', 'muito'],
    ['acima do limite', 10000],
  ])('rejeita mínimo %s (400)', async (_n, valor) => {
    expect((await request(app).post('/api/produtos').set(auth(admin)).send(novo({ nome: `X${String(valor)}`, estoqueMinimo: valor }))).status).toBe(400);
    const p = await Product.findOne();
    expect((await request(app).put(`/api/produtos/${p.id}`).set(auth(admin)).send({ estoqueMinimo: valor })).status).toBe(400);
  });

  test('só admin altera (401 sem login, 403 como cliente)', async () => {
    const p = await Product.findOne();
    expect((await request(app).put(`/api/produtos/${p.id}`).send({ estoqueMinimo: 1 })).status).toBe(401);
    expect((await request(app).put(`/api/produtos/${p.id}`).set(auth(cliente)).send({ estoqueMinimo: 1 })).status).toBe(403);
  });

  test('o catálogo público devolve o estoqueMinimo de cada produto', async () => {
    const r = await request(app).get('/api/produtos');
    expect(r.body.every((p) => Number.isInteger(p.estoqueMinimo))).toBe(true);
  });
});

describe('Migração da coluna estoqueMinimo (banco que já existia sem ela)', () => {
  test('cria a coluna, os produtos antigos ficam com 5, e rodar de novo não faz nada', async () => {
    const qi = sequelize.getQueryInterface();
    // Simula o banco antigo: tira a coluna e deixa um produto cadastrado
    await qi.removeColumn('produtos', 'estoqueMinimo');
    expect((await qi.describeTable('produtos')).estoqueMinimo).toBeUndefined();
    await sequelize.query("INSERT INTO produtos (nome, categoria, preco, estoque, ativo, createdAt, updatedAt) VALUES ('Antigo', 'Vinho', 10, 3, 1, datetime('now'), datetime('now'))");

    expect(await aplicarMigracoes()).toBe(1);
    expect((await qi.describeTable('produtos')).estoqueMinimo).toBeDefined();
    expect((await Product.findOne({ where: { nome: 'Antigo' } })).estoqueMinimo).toBe(5);

    expect(await aplicarMigracoes()).toBe(0); // idempotente
  });
});
