// Ranking de produtos mais reservados: relatório do admin e sugestões públicas da página do produto.
jest.mock('../src/config/database', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize('sqlite::memory:', { logging: false });
});
process.env.JWT_SECRET = 'segredo-de-teste';

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const { sequelize, User, Product, Reserva, ReservaItem, Categoria } = require('../src/models');

const auth = (t) => ({ Authorization: `Bearer ${t}` });
let admin, cliente, ana;
const P = {}; // produtos por apelido

async function produto(apelido, nome, extra = {}) {
  P[apelido] = await Product.create({ nome, categoria: 'Cerveja', preco: 10, estoque: 100, ...extra });
}
// Cria uma reserva já com o status desejado (sem passar pela API, para controlar status e data)
async function reserva(status, itens, { diasAtras = 0 } = {}) {
  const agora = new Date();
  const r = await Reserva.create({ usuarioId: ana.id, status, retiradaPrevista: agora, expiraEm: new Date(agora.getTime() + 864e5), total: 0 });
  for (const [apelido, quantidade] of itens) {
    await ReservaItem.create({ reservaId: r.id, produtoId: P[apelido].id, quantidade, precoUnitario: 10 });
  }
  if (diasAtras) {
    const quando = new Date(Date.now() - diasAtras * 864e5).toISOString().replace('T', ' ').replace('Z', '');
    await sequelize.query(`UPDATE reservas SET createdAt = '${quando}' WHERE id = ${r.id}`);
  }
  return r;
}
const relatorio = (qs = '') => request(app).get(`/api/relatorios/mais-reservados${qs}`).set(auth(admin));
const sugestoes = (qs = '') => request(app).get(`/api/produtos/mais-reservados${qs}`);

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await Categoria.create({ nome: 'Cerveja' });
  const senha = await bcrypt.hash('senha1234', 10);
  await User.create({ nome: 'Dono', email: 'dono@x.com', cpf: '52998224725', dataNascimento: '1980-01-01', senha, role: 'admin' });
  ana = await User.create({ nome: 'Ana', email: 'ana@x.com', cpf: '11144477735', dataNascimento: '1995-05-20', senha, role: 'cliente' });
  admin = (await request(app).post('/api/auth/login').send({ email: 'dono@x.com', senha: 'senha1234' })).body.token;
  cliente = (await request(app).post('/api/auth/login').send({ email: 'ana@x.com', senha: 'senha1234' })).body.token;
});
afterAll(() => sequelize.close());

describe('Sem nenhuma reserva ainda', () => {
  test('relatório vazio e sugestões completadas com produtos disponíveis', async () => {
    await produto('A', 'Heineken');
    await produto('B', 'Brahma');
    expect((await relatorio()).body).toEqual([]);
    const s = await sugestoes();
    expect(s.status).toBe(200);
    expect(s.body.map((p) => p.nome)).toEqual(['Brahma', 'Heineken']); // alfabética, já que ninguém reservou
  });
});

describe('Com reservas', () => {
  beforeAll(async () => {
    await produto('C', 'Skol');
    await produto('D', 'Corona');
    await produto('E', 'Esgotada', { estoque: 0 });
    await produto('F', 'Inativa', { ativo: false });
    await produto('G', 'Zeta');

    await reserva('retirada', [['A', 5], ['B', 2]]);
    await reserva('pendente', [['A', 3], ['C', 4]]);
    await reserva('pronta', [['B', 3]]);
    await reserva('cancelada', [['D', 50]]);   // não conta
    await reserva('expirada', [['D', 50]]);    // não conta
    await reserva('retirada', [['C', 10]], { diasAtras: 60 }); // antiga: só no "todo o período"
    await reserva('retirada', [['E', 30], ['F', 30]]);         // sem estoque / inativo
  });

  test('relatório exige login (401) e admin (403)', async () => {
    expect((await request(app).get('/api/relatorios/mais-reservados')).status).toBe(401);
    expect((await request(app).get('/api/relatorios/mais-reservados').set(auth(cliente))).status).toBe(403);
  });

  test('soma unidades por produto, conta reservas e ignora canceladas/expiradas', async () => {
    const r = await relatorio();
    expect(r.status).toBe(200);
    const resumo = r.body.map((x) => [x.nome, x.unidades, x.reservas]);
    // Esgotada (30, mas ativa) aparece no relatório do admin; Inativa não; Corona (só canceladas/expiradas) não
    expect(resumo).toEqual([['Esgotada', 30, 1], ['Skol', 14, 2], ['Heineken', 8, 2], ['Brahma', 5, 2]]);
    expect(r.body[0]).toMatchObject({ nome: 'Esgotada', categoria: 'Cerveja', estoque: 0 });
    expect(r.body.find((x) => x.nome === 'Corona')).toBeUndefined();
    expect(r.body.find((x) => x.nome === 'Inativa')).toBeUndefined();
  });

  test('filtro de período: ?dias=30 não considera a reserva de 60 dias atrás', async () => {
    const r = await relatorio('?dias=30');
    expect(r.body.find((x) => x.nome === 'Skol')).toMatchObject({ unidades: 4, reservas: 1 });
  });

  test('?limite corta o ranking', async () => {
    const r = await relatorio('?limite=2');
    expect(r.body).toHaveLength(2);
    expect(r.body.map((x) => x.nome)).toEqual(['Esgotada', 'Skol']);
  });

  test.each([['dias=0'], ['dias=366'], ['dias=abc'], ['limite=0'], ['limite=21']])('rejeita ?%s (400)', async (qs) => {
    expect((await relatorio(`?${qs}`)).status).toBe(400);
  });

  test('sugestões públicas: mais reservados e disponíveis, sem esgotado, inativo ou contagens', async () => {
    const s = await sugestoes();
    expect(s.status).toBe(200);
    expect(s.body.map((p) => p.nome)).toEqual(['Skol', 'Heineken', 'Brahma']);
    expect(s.body[0]).not.toHaveProperty('unidades');
    expect(s.body[0]).toHaveProperty('estoqueMinimo');
  });

  test('sugestões não repetem o produto que o cliente está vendo (?excluir) e completam com outros', async () => {
    const s = await sugestoes(`?excluir=${P.C.id}`);
    expect(s.body.map((p) => p.nome)).toEqual(['Heineken', 'Brahma', 'Corona']);
  });

  test('?limite maior que o ranking completa com disponíveis, em ordem alfabética', async () => {
    const s = await sugestoes('?limite=6');
    expect(s.body.map((p) => p.nome)).toEqual(['Skol', 'Heineken', 'Brahma', 'Corona', 'Zeta']);
  });

  test.each([['limite=0'], ['limite=13'], ['excluir=0'], ['excluir=abc']])('sugestões rejeitam ?%s (400)', async (qs) => {
    expect((await sugestoes(`?${qs}`)).status).toBe(400);
  });

  test('a rota /mais-reservados não é confundida com /:id', async () => {
    expect((await sugestoes()).status).toBe(200);
    expect((await request(app).get(`/api/produtos/${P.A.id}`)).body.nome).toBe('Heineken');
  });
});
