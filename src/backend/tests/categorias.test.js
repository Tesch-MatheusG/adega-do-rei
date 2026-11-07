// Testes do cadastro de categorias e da regra "produto só usa categoria da lista oficial".
jest.mock('../src/config/database', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize('sqlite::memory:', { logging: false });
});
process.env.JWT_SECRET = 'segredo-de-teste';

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const { sequelize, User, Product, Categoria } = require('../src/models');
const { sincronizarCategorias, CATEGORIAS_PADRAO } = require('../src/services/categoriaService');

const auth = (t) => ({ Authorization: `Bearer ${t}` });
let admin, cliente;
const produto = (extra = {}) => ({ nome: 'Produto Teste', categoria: 'Vinho', preco: 50, volumeMl: 750, descricao: null, estoque: 0, ...extra });

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await User.create({ nome: 'Dono', email: 'dono@x.com', cpf: '52998224725', dataNascimento: '1980-01-01', senha: await bcrypt.hash('senha1234', 10), role: 'admin' });
  await User.create({ nome: 'Ana', email: 'ana@x.com', cpf: '11144477735', dataNascimento: '1995-05-20', senha: await bcrypt.hash('senha1234', 10), role: 'cliente' });
  admin = (await request(app).post('/api/auth/login').send({ email: 'dono@x.com', senha: 'senha1234' })).body.token;
  cliente = (await request(app).post('/api/auth/login').send({ email: 'ana@x.com', senha: 'senha1234' })).body.token;
});
afterAll(() => sequelize.close());

describe('Categorias — listar e cadastrar', () => {
  test('lista é pública e começa vazia', async () => {
    const r = await request(app).get('/api/categorias');
    expect(r.status).toBe(200);
    expect(r.body).toEqual([]);
  });

  test('cadastrar exige login (401) e papel de admin (403)', async () => {
    expect((await request(app).post('/api/categorias').send({ nome: 'Vinho' })).status).toBe(401);
    expect((await request(app).post('/api/categorias').set(auth(cliente)).send({ nome: 'Vinho' })).status).toBe(403);
  });

  test('admin cadastra; o nome é padronizado (maiúsculas e espaços)', async () => {
    const r = await request(app).post('/api/categorias').set(auth(admin)).send({ nome: '  vinho   tinto ' });
    expect(r.status).toBe(201);
    expect(r.body.nome).toBe('Vinho Tinto');
  });

  test('mantém siglas e acentos', async () => {
    const r = await request(app).post('/api/categorias').set(auth(admin)).send({ nome: 'cerveja IPA' });
    expect(r.body.nome).toBe('Cerveja IPA');
    expect((await request(app).post('/api/categorias').set(auth(admin)).send({ nome: 'água mineral' })).body.nome).toBe('Água Mineral');
  });

  test('duplicada (sem diferenciar maiúsculas) responde 409', async () => {
    const r = await request(app).post('/api/categorias').set(auth(admin)).send({ nome: 'VINHO TINTO' });
    expect(r.status).toBe(409);
    expect(r.body.erro).toMatch(/Vinho Tinto/);
    expect(await Categoria.count({ where: { nome: 'Vinho Tinto' } })).toBe(1);
  });

  test.each([
    ['vazio', { nome: '' }],
    ['só espaços', { nome: '    ' }],
    ['ausente', {}],
    ['só números', { nome: '12345' }],
    ['tag HTML sem texto', { nome: '<b></b>' }],
    ['longo demais', { nome: 'a'.repeat(61) }],
  ])('rejeita nome %s (400)', async (_n, corpo) => {
    const r = await request(app).post('/api/categorias').set(auth(admin)).send(corpo);
    expect(r.status).toBe(400);
    expect(r.body.erro).toBe('Dados inválidos.');
  });

  test('tags HTML são removidas do nome', async () => {
    const r = await request(app).post('/api/categorias').set(auth(admin)).send({ nome: '<script>x</script>Licor' });
    expect(r.status).toBe(201);
    expect(r.body.nome).not.toMatch(/[<>]/);
  });

  test('a lista volta em ordem alfabética', async () => {
    const nomes = (await request(app).get('/api/categorias')).body.map((c) => c.nome);
    expect(nomes).toEqual(expect.arrayContaining(['Vinho Tinto', 'Cerveja IPA', 'Água Mineral']));
    // Compara só os nomes sem acento: o SQLite dos testes ordena acentos diferente do MySQL.
    const simples = nomes.filter((n) => /^[A-Za-z ]+$/.test(n));
    expect(simples).toEqual([...simples].sort());
  });
});

describe('Produto só aceita categoria da lista oficial', () => {
  test('categoria inexistente: 400 com detalhe no campo, e nada é gravado', async () => {
    const r = await request(app).post('/api/produtos').set(auth(admin)).send(produto({ categoria: 'Categoria Fantasma' }));
    expect(r.status).toBe(400);
    expect(r.body.detalhes).toEqual(expect.arrayContaining([expect.objectContaining({ campo: 'categoria', mensagem: expect.stringMatching(/inexistente/) })]));
    expect(await Product.count()).toBe(0);
  });

  test('categoria da lista: grava com o nome oficial, mesmo se digitado diferente', async () => {
    const r = await request(app).post('/api/produtos').set(auth(admin)).send(produto({ categoria: 'vinho TINTO' }));
    expect(r.status).toBe(201);
    expect(r.body.categoria).toBe('Vinho Tinto');
  });

  test('atualizar para categoria inexistente: 400; para existente: ok; sem enviar categoria: mantém', async () => {
    const criado = (await request(app).post('/api/produtos').set(auth(admin)).send(produto({ nome: 'Outro Vinho', categoria: 'Vinho Tinto' }))).body;
    expect((await request(app).put(`/api/produtos/${criado.id}`).set(auth(admin)).send({ categoria: 'Nada' })).status).toBe(400);

    const ok = await request(app).put(`/api/produtos/${criado.id}`).set(auth(admin)).send({ categoria: 'cerveja ipa' });
    expect(ok.status).toBe(200);
    expect(ok.body.categoria).toBe('Cerveja IPA');

    const manteve = await request(app).put(`/api/produtos/${criado.id}`).set(auth(admin)).send({ preco: 60 });
    expect(manteve.body.categoria).toBe('Cerveja IPA');
    expect((await request(app).put(`/api/produtos/${criado.id}`).set(auth(admin)).send({ categoria: null })).body.categoria).toBe('Cerveja IPA');
  });

  test('cliente continua sem poder cadastrar produto (403)', async () => {
    expect((await request(app).post('/api/produtos').set(auth(cliente)).send(produto({ categoria: 'Vinho Tinto' }))).status).toBe(403);
  });
});

describe('sincronizarCategorias (roda ao iniciar o servidor)', () => {
  beforeAll(async () => {
    await Product.destroy({ where: {} });
    await Categoria.destroy({ where: {} });
  });

  test('traz para a lista as categorias dos produtos que já existiam, sem duplicar', async () => {
    await Product.bulkCreate([
      { nome: 'A', categoria: 'Whisky', preco: 10, estoque: 1 },
      { nome: 'B', categoria: 'Whisky', preco: 10, estoque: 1 },
      { nome: 'C', categoria: 'gin', preco: 10, estoque: 1 },
    ]);
    expect(await sincronizarCategorias()).toBe(2);
    const nomes = (await Categoria.findAll()).map((c) => c.nome).sort();
    expect(nomes).toEqual(['Gin', 'Whisky']);
  });

  test('é idempotente: rodar de novo não cria nada', async () => {
    expect(await sincronizarCategorias()).toBe(0);
    expect(await Categoria.count()).toBe(2);
  });

  test('banco sem categorias e sem produtos recebe as categorias padrão', async () => {
    await Product.destroy({ where: {} });
    await Categoria.destroy({ where: {} });
    expect(await sincronizarCategorias()).toBe(CATEGORIAS_PADRAO.length);
    expect(await Categoria.count()).toBe(CATEGORIAS_PADRAO.length);
  });
});
