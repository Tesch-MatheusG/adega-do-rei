// Horário de retirada: a adega funciona todos os dias, das 08h às 23h (horário de Brasília).
jest.mock('../src/config/database', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize('sqlite::memory:', { logging: false });
});
process.env.JWT_SECRET = 'segredo-de-teste';

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const { sequelize, User, Categoria } = require('../src/models');
const { dentroDoHorarioDeFuncionamento } = require('../src/utils/horario');

const auth = (t) => ({ Authorization: `Bearer ${t}` });
let admin, ana, produtoId;

// Instante de "amanhã" no horário de Brasília (UTC-3, sem horário de verão desde 2019)
function amanhaAs(hhmm) {
  const dia = new Date(Date.now() + 864e5).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  return `${dia}T${hhmm}:00-03:00`;
}
const reservar = (retiradaPrevista) =>
  request(app).post('/api/reservas').set(auth(ana)).send({ itens: [{ produtoId, quantidade: 1 }], retiradaPrevista });

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await Categoria.create({ nome: 'Vinho' });
  const ano = new Date().getFullYear() - 30;
  await User.create({ nome: 'Dono', email: 'dono@x.com', cpf: '52998224725', dataNascimento: '1980-01-01', senha: await bcrypt.hash('senha1234', 10), role: 'admin' });
  await User.create({ nome: 'Ana', email: 'ana@x.com', cpf: '11144477735', dataNascimento: `${ano}-05-20`, senha: await bcrypt.hash('senha1234', 10), role: 'cliente' });
  admin = (await request(app).post('/api/auth/login').send({ email: 'dono@x.com', senha: 'senha1234' })).body.token;
  ana = (await request(app).post('/api/auth/login').send({ email: 'ana@x.com', senha: 'senha1234' })).body.token;
  const p = await request(app).post('/api/produtos').set(auth(admin))
    .send({ nome: 'Vinho Teste', categoria: 'Vinho', preco: 50, volumeMl: 750, descricao: null, estoque: 100 });
  produtoId = p.body.id;
});
afterAll(() => sequelize.close());

describe('dentroDoHorarioDeFuncionamento (08h às 23h, Brasília)', () => {
  test.each([
    ['2026-11-20T08:00:00-03:00', true],
    ['2026-11-20T12:30:00-03:00', true],
    ['2026-11-20T22:59:00-03:00', true],
    ['2026-11-20T07:59:00-03:00', false],
    ['2026-11-20T23:00:00-03:00', false],
    ['2026-11-20T03:00:00-03:00', false],
    // O mesmo instante vale independentemente do fuso em que foi enviado: 15:00Z = 12:00 em Brasília
    ['2026-11-20T15:00:00Z', true],
    ['2026-11-20T10:00:00Z', false], // 07:00 em Brasília
    ['2026-11-21T02:30:00Z', false], // 23:30 em Brasília
  ])('%s -> %s', (iso, esperado) => {
    expect(dentroDoHorarioDeFuncionamento(new Date(iso))).toBe(esperado);
  });
});

describe('POST /api/reservas — horário de retirada', () => {
  test.each(['08:00', '12:30', '22:30', '22:59'])('aceita retirada às %s', async (hhmm) => {
    const r = await reservar(amanhaAs(hhmm));
    expect(r.status).toBe(201);
  });

  test.each(['07:59', '06:00', '23:00', '23:30', '02:00'])('rejeita retirada às %s (fora do horário)', async (hhmm) => {
    const r = await reservar(amanhaAs(hhmm));
    expect(r.status).toBe(400);
    expect(JSON.stringify(r.body)).toMatch(/08h às 23h/);
  });

  test('rejeição não baixa o estoque', async () => {
    const antes = (await request(app).get(`/api/produtos/${produtoId}`)).body.estoque;
    await reservar(amanhaAs('03:00'));
    expect((await request(app).get(`/api/produtos/${produtoId}`)).body.estoque).toBe(antes);
  });

  test('sem horário definido continua aceito (retirada = agora, vale por 24h)', async () => {
    const r = await request(app).post('/api/reservas').set(auth(ana)).send({ itens: [{ produtoId, quantidade: 1 }] });
    expect(r.status).toBe(201);
  });
});
