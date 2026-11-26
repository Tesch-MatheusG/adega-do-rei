// Edição do próprio perfil (nome/e-mail) e troca de senha.
jest.mock('../src/config/database', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize('sqlite::memory:', { logging: false });
});
process.env.JWT_SECRET = 'segredo-de-teste';

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const { sequelize, User } = require('../src/models');

const auth = (t) => ({ Authorization: `Bearer ${t}` });
let ana, bia;
const login = async (email, senha) => (await request(app).post('/api/auth/login').send({ email, senha })).body.token;
const editar = (corpo, token = ana) => request(app).patch('/api/auth/me').set(auth(token)).send(corpo);
const trocarSenha = (corpo, token = ana) => request(app).patch('/api/auth/senha').set(auth(token)).send(corpo);

beforeAll(async () => {
  await sequelize.sync({ force: true });
  const hash = await bcrypt.hash('senha1234', 10);
  await User.create({ nome: 'Ana Souza', email: 'ana@x.com', cpf: '11144477735', dataNascimento: '1995-05-20', senha: hash, role: 'cliente' });
  await User.create({ nome: 'Bia Lima', email: 'bia@x.com', cpf: '52998224725', dataNascimento: '1990-01-01', senha: hash, role: 'cliente' });
  ana = await login('ana@x.com', 'senha1234');
  bia = await login('bia@x.com', 'senha1234');
});
afterAll(() => sequelize.close());

describe('PATCH /api/auth/me — editar perfil', () => {
  test('exige login (401)', async () => {
    expect((await request(app).patch('/api/auth/me').send({ nome: 'X Y Z' })).status).toBe(401);
  });

  test('altera o nome, padronizando espaços e removendo tags, sem exigir senha', async () => {
    const r = await editar({ nome: '  Ana   <b>Maria</b>  Souza ' });
    expect(r.status).toBe(200);
    expect(r.body.nome).toBe('Ana Maria Souza');
    expect(r.body).not.toHaveProperty('senha');
    expect((await User.findOne({ where: { cpf: '11144477735' } })).nome).toBe('Ana Maria Souza');
  });

  test('corpo vazio é rejeitado (400)', async () => {
    expect((await editar({})).status).toBe(400);
  });

  test('trocar o e-mail exige a senha atual (403 sem ela ou com senha errada)', async () => {
    expect((await editar({ email: 'novo@x.com' })).status).toBe(403);
    expect((await editar({ email: 'novo@x.com', senhaAtual: 'errada123' })).status).toBe(403);
    expect((await User.findOne({ where: { cpf: '11144477735' } })).email).toBe('ana@x.com');
  });

  test('troca o e-mail com a senha atual e o novo e-mail passa a ser o login', async () => {
    const r = await editar({ email: 'Ana.Nova@X.com', senhaAtual: 'senha1234' });
    expect(r.status).toBe(200);
    expect(r.body.email).toBe('ana.nova@x.com'); // normalizado
    expect(await login('ana.nova@x.com', 'senha1234')).toBeTruthy();
    expect(await login('ana@x.com', 'senha1234')).toBeUndefined();
  });

  test('e-mail de outra conta é recusado (409), mesmo com maiúsculas', async () => {
    const r = await editar({ email: 'BIA@x.com', senhaAtual: 'senha1234' });
    expect(r.status).toBe(409);
  });

  test('mandar o próprio e-mail de novo não exige senha nem dá conflito', async () => {
    const r = await editar({ email: 'ana.nova@x.com', nome: 'Ana M. Souza' });
    expect(r.status).toBe(200);
    expect(r.body.nome).toBe('Ana M. Souza');
  });

  test('CPF, nascimento e papel enviados no corpo são ignorados', async () => {
    const r = await editar({ nome: 'Ana Souza', cpf: '52998224725', dataNascimento: '2010-01-01', role: 'admin', id: 99 });
    expect(r.status).toBe(200);
    const u = await User.findOne({ where: { email: 'ana.nova@x.com' } });
    expect(u).toMatchObject({ cpf: '11144477735', role: 'cliente' });
    expect(String(u.dataNascimento)).toBe('1995-05-20');
    expect(u.id).not.toBe(99);
  });

  test.each([
    ['nome curto', { nome: 'Al' }],
    ['nome vazio', { nome: '   ' }],
    ['nome longo', { nome: 'x'.repeat(101) }],
    ['e-mail inválido', { email: 'sem-arroba', senhaAtual: 'senha1234' }],
  ])('rejeita %s (400)', async (_n, corpo) => {
    expect((await editar(corpo)).status).toBe(400);
  });

  test('cada usuário só altera a própria conta (o token define quem é)', async () => {
    await editar({ nome: 'Bia Editada' }, bia);
    expect((await User.findOne({ where: { cpf: '52998224725' } })).nome).toBe('Bia Editada');
    expect((await User.findOne({ where: { cpf: '11144477735' } })).nome).toBe('Ana Souza');
  });

  test('GET /me devolve os dados atualizados', async () => {
    const r = await request(app).get('/api/auth/me').set(auth(ana));
    expect(r.body).toMatchObject({ nome: 'Ana Souza', email: 'ana.nova@x.com' });
  });
});

describe('PATCH /api/auth/senha — alterar senha', () => {
  test('exige login (401)', async () => {
    expect((await request(app).patch('/api/auth/senha').send({ senhaAtual: 'a', novaSenha: 'novasenha1' })).status).toBe(401);
  });

  test('senha atual errada (403) e nada muda', async () => {
    expect((await trocarSenha({ senhaAtual: 'errada123', novaSenha: 'novasenha1' })).status).toBe(403);
    expect(await login('ana.nova@x.com', 'senha1234')).toBeTruthy();
  });

  test.each([
    ['curta', 'abc12'],
    ['sem número', 'somenteletras'],
    ['sem letra', '123456789'],
  ])('nova senha %s é rejeitada (400)', async (_n, novaSenha) => {
    expect((await trocarSenha({ senhaAtual: 'senha1234', novaSenha })).status).toBe(400);
  });

  test('nova senha igual à atual é rejeitada (400)', async () => {
    expect((await trocarSenha({ senhaAtual: 'senha1234', novaSenha: 'senha1234' })).status).toBe(400);
  });

  test('troca a senha: a antiga para de funcionar, a nova funciona, e é guardada como hash', async () => {
    const r = await trocarSenha({ senhaAtual: 'senha1234', novaSenha: 'NovaSenha99' });
    expect(r.status).toBe(200);
    expect(await login('ana.nova@x.com', 'senha1234')).toBeUndefined();
    expect(await login('ana.nova@x.com', 'NovaSenha99')).toBeTruthy();
    const u = await User.scope('comSenha').findOne({ where: { email: 'ana.nova@x.com' } });
    expect(u.senha).not.toBe('NovaSenha99');
    expect(u.senha).toHaveLength(60);
  });
});
