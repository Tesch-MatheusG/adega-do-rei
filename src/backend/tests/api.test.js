// Testes de integração da API (Express + Sequelize) com banco SQLite em memória.
// O banco real (MySQL na Aiven) é substituído apenas aqui, para os testes serem
// rápidos e não alterarem dados de produção. Regras, validators e controllers são os reais.
jest.mock('../src/config/database', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize('sqlite::memory:', { logging: false });
});

process.env.JWT_SECRET = 'segredo-de-teste';

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const { sequelize, User, Product, StockMovement } = require('../src/models');

const CPF_OK = '111.444.777-35';
let adminToken;
let clienteToken;

const maiorDeIdade = '1995-05-20';
const clienteBase = {
  nome: 'Maria Souza', email: 'maria@exemplo.com', cpf: CPF_OK,
  dataNascimento: maiorDeIdade, senha: 'senha1234',
};
const produtoBase = { nome: 'Whisky Red Label', categoria: 'Whisky', preco: 89.9, volumeMl: 1000, descricao: null, estoque: 0 };
const auth = (t) => ({ Authorization: `Bearer ${t}` });

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await User.create({
    nome: 'Administrador', email: 'admin@exemplo.com', cpf: '52998224725',
    dataNascimento: '1990-01-01', senha: await bcrypt.hash('admin1234', 10), role: 'admin',
  });
  adminToken = (await request(app).post('/api/auth/login').send({ email: 'admin@exemplo.com', senha: 'admin1234' })).body.token;
});
afterAll(() => sequelize.close());

describe('Cadastro de cliente — validação e tratamento (RF02, RN01, RN08)', () => {
  test('aceita cadastro válido, grava CPF só com dígitos e e-mail em minúsculas', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...clienteBase, email: 'Maria@Exemplo.COM' });
    expect(res.status).toBe(201);
    expect(res.body.usuario.role).toBe('cliente');
    const salvo = await User.findOne({ where: { email: 'maria@exemplo.com' } });
    expect(salvo.cpf).toBe('11144477735');
  });

  test('senha é gravada como hash bcrypt e nunca devolvida', async () => {
    const comSenha = await User.scope('comSenha').findOne({ where: { email: 'maria@exemplo.com' } });
    expect(comSenha.senha).toMatch(/^\$2[aby]\$10\$/);
    expect(comSenha.senha).not.toContain('senha1234');
    const login = await request(app).post('/api/auth/login').send({ email: 'maria@exemplo.com', senha: 'senha1234' });
    clienteToken = login.body.token;
    const me = await request(app).get('/api/auth/me').set(auth(clienteToken));
    expect(me.body.senha).toBeUndefined();
  });

  test('rejeita CPF inválido (400 com detalhe do campo)', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...clienteBase, email: 'a@a.com', cpf: '111.444.777-36' });
    expect(res.status).toBe(400);
    expect(res.body.detalhes).toEqual(expect.arrayContaining([{ campo: 'cpf', mensagem: 'CPF inválido.' }]));
  });

  test('rejeita menor de 18 anos (RN01)', async () => {
    const ano = new Date().getFullYear() - 16;
    const res = await request(app).post('/api/auth/register').send({ ...clienteBase, email: 'b@b.com', cpf: '52998224725', dataNascimento: `${ano}-01-01` });
    expect(res.status).toBe(400);
    expect(res.body.detalhes[0].mensagem).toMatch(/18 anos/);
  });

  test('rejeita data inexistente no calendário (30/02)', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...clienteBase, email: 'c@c.com', dataNascimento: '1990-02-30' });
    expect(res.status).toBe(400);
  });

  test('rejeita senha fraca (sem número / curta)', async () => {
    for (const senha of ['abcdefgh', '12345678', 'ab1']) {
      const res = await request(app).post('/api/auth/register').send({ ...clienteBase, email: 'd@d.com', senha });
      expect(res.status).toBe(400);
    }
  });

  test('rejeita e-mail duplicado ou CPF duplicado (409)', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...clienteBase, email: 'outro@exemplo.com' });
    expect(res.status).toBe(409);
  });

  test('ignora tentativa de se cadastrar como admin (escalada de privilégio)', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...clienteBase, email: 'hacker@exemplo.com', cpf: '12345678909', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.usuario.role).toBe('cliente');
  });

  test("preserva apóstrofo no nome, remove tags HTML e espaços repetidos", async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...clienteBase, nome: "  João   D'Ávila <script>x</script> ", email: 'joao@exemplo.com', cpf: '39053344705',
    });
    expect(res.status).toBe(201);
    expect(res.body.usuario.nome).toBe("João D'Ávila x");
  });
});

describe('Login — tratamento de inconsistências (RNF02)', () => {
  test('mensagem idêntica para e-mail inexistente e senha errada (não revela qual falhou)', async () => {
    const a = await request(app).post('/api/auth/login').send({ email: 'maria@exemplo.com', senha: 'errada123' });
    const b = await request(app).post('/api/auth/login').send({ email: 'ninguem@exemplo.com', senha: 'errada123' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.erro).toBe(b.body.erro);
  });
  test('rejeita corpo sem e-mail/senha (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
  test('token inválido é recusado (401)', async () => {
    const res = await request(app).get('/api/auth/me').set(auth('token.falso.aqui'));
    expect(res.status).toBe(401);
  });
});

describe('Produtos — controle de acesso (RN07, RNF03)', () => {
  test('sem token: 401', async () => {
    expect((await request(app).post('/api/produtos').send(produtoBase)).status).toBe(401);
  });
  test('cliente autenticado: 403', async () => {
    expect((await request(app).post('/api/produtos').set(auth(clienteToken)).send(produtoBase)).status).toBe(403);
    expect((await request(app).patch('/api/produtos/1/estoque').set(auth(clienteToken)).send({ quantidade: 1 })).status).toBe(403);
  });
  test('catálogo é público', async () => {
    expect((await request(app).get('/api/produtos')).status).toBe(200);
  });
});

describe('Produtos — validação e transformação', () => {
  test('aceita o payload exato do frontend (volumeMl e descricao = null)', async () => {
    const res = await request(app).post('/api/produtos').set(auth(adminToken))
      .send({ nome: 'Cerveja Pilsen', categoria: 'Cerveja', preco: 6.5, volumeMl: null, descricao: null, estoque: 0 });
    expect(res.status).toBe(201);
    expect(res.body.volumeMl).toBeNull();
    expect(res.body.descricao).toBeNull();
  });

  test('arredonda preço para 2 casas e devolve preço como número (não texto)', async () => {
    const res = await request(app).post('/api/produtos').set(auth(adminToken))
      .send({ ...produtoBase, nome: 'Vodka Premium', categoria: 'Vodka', preco: '59.999' });
    expect(res.status).toBe(201);
    expect(res.body.preco).toBe(60);
    expect(typeof res.body.preco).toBe('number');
    const lista = await request(app).get('/api/produtos');
    expect(lista.body.every((p) => typeof p.preco === 'number')).toBe(true);
  });

  test('padroniza categoria e preserva apóstrofo no nome', async () => {
    const res = await request(app).post('/api/produtos').set(auth(adminToken))
      .send({ ...produtoBase, nome: "  Jack   Daniel's  ", categoria: '  vinho   tinto ' });
    expect(res.status).toBe(201);
    expect(res.body.nome).toBe("Jack Daniel's");
    expect(res.body.categoria).toBe('Vinho Tinto');
  });

  test('filtro por categoria é tolerante a maiúsculas/minúsculas', async () => {
    const res = await request(app).get('/api/produtos').query({ categoria: 'vinho tinto' });
    expect(res.body.map((p) => p.nome)).toEqual(["Jack Daniel's"]);
  });

  test.each([
    ['preço zero', { preco: 0 }],
    ['preço negativo', { preco: -5 }],
    ['preço não numérico', { preco: 'abc' }],
    ['nome vazio', { nome: '   ' }],
    ['categoria vazia', { categoria: '' }],
    ['estoque negativo', { estoque: -1 }],
    ['volume zero', { volumeMl: 0 }],
    ['nome acima de 120 caracteres', { nome: 'x'.repeat(121) }],
  ])('rejeita %s (400)', async (_, alteracao) => {
    const res = await request(app).post('/api/produtos').set(auth(adminToken)).send({ ...produtoBase, nome: 'Teste Inválido', ...alteracao });
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Dados inválidos.');
  });

  test('rejeita produto duplicado (mesmo nome e volume) — 409', async () => {
    await request(app).post('/api/produtos').set(auth(adminToken)).send({ ...produtoBase, nome: 'Gin Tônica Pronto', volumeMl: 275 });
    const res = await request(app).post('/api/produtos').set(auth(adminToken)).send({ ...produtoBase, nome: '  gin   TÔNICA pronto ', volumeMl: 275 });
    expect(res.status).toBe(409);
  });

  test('atualização parcial mantém os demais campos', async () => {
    const criado = (await request(app).post('/api/produtos').set(auth(adminToken))
      .send({ ...produtoBase, nome: 'Rum Dourado', categoria: 'Rum', preco: 70, volumeMl: 700 })).body;
    const res = await request(app).put(`/api/produtos/${criado.id}`).set(auth(adminToken)).send({ preco: 75.5 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ nome: 'Rum Dourado', categoria: 'Rum', preco: 75.5, volumeMl: 700 });
  });

  test('id inválido (400), produto inexistente (404), JSON malformado (400), rota inexistente (404)', async () => {
    expect((await request(app).get('/api/produtos/abc')).status).toBe(400);
    expect((await request(app).get('/api/produtos/99999')).status).toBe(404);
    const json = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email": ');
    expect(json.status).toBe(400);
    expect(json.body.erro).toMatch(/JSON inválido/);
    expect((await request(app).get('/api/nao-existe')).status).toBe(404);
  });
});

describe('Estoque — integridade e histórico (RN06, RF13, RNF10)', () => {
  let produtoId;
  beforeAll(async () => {
    const res = await request(app).post('/api/produtos').set(auth(adminToken))
      .send({ ...produtoBase, nome: 'Espumante Brut', categoria: 'Espumante', preco: 45, volumeMl: 750, estoque: 10 });
    produtoId = res.body.id;
  });

  test('estoque inicial gera movimentação de entrada', async () => {
    const hist = await StockMovement.findAll({ where: { produtoId } });
    expect(hist).toHaveLength(1);
    expect(hist[0]).toMatchObject({ tipo: 'entrada', quantidade: 10, saldoAnterior: 0, saldoPosterior: 10, motivo: 'Estoque inicial' });
  });

  test('entrada de estoque soma ao saldo e registra saldo antes/depois', async () => {
    const res = await request(app).patch(`/api/produtos/${produtoId}/estoque`).set(auth(adminToken)).send({ quantidade: '5', motivo: '  Compra   fornecedor X ' });
    expect(res.status).toBe(200);
    expect(res.body.produto.estoque).toBe(15);
    const hist = await request(app).get(`/api/produtos/${produtoId}/movimentacoes`).set(auth(adminToken));
    expect(hist.body[0]).toMatchObject({ tipo: 'entrada', quantidade: 5, saldoAnterior: 10, saldoPosterior: 15, motivo: 'Compra fornecedor X' });
    expect(hist.body[0].usuarioId).toBeTruthy();
  });

  test.each([[0], [-3], ['abc'], [1.5]])('rejeita quantidade inválida (%p)', async (quantidade) => {
    const res = await request(app).patch(`/api/produtos/${produtoId}/estoque`).set(auth(adminToken)).send({ quantidade });
    expect(res.status).toBe(400);
  });

  test('transação: se o histórico falhar, o saldo NÃO é alterado (rollback)', async () => {
    const spy = jest.spyOn(StockMovement, 'create').mockRejectedValueOnce(new Error('falha simulada'));
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    const antes = (await Product.findByPk(produtoId)).estoque;
    const res = await request(app).patch(`/api/produtos/${produtoId}/estoque`).set(auth(adminToken)).send({ quantidade: 7 });
    spy.mockRestore();
    log.mockRestore();
    expect(res.status).toBe(500);
    expect((await Product.findByPk(produtoId)).estoque).toBe(antes);
  });

  test('saldo atual = soma das movimentações (consistência saldo x histórico)', async () => {
    const hist = await StockMovement.findAll({ where: { produtoId } });
    const soma = hist.reduce((s, m) => s + m.quantidade, 0);
    expect((await Product.findByPk(produtoId)).estoque).toBe(soma);
  });

  test('histórico é restrito ao admin', async () => {
    expect((await request(app).get(`/api/produtos/${produtoId}/movimentacoes`).set(auth(clienteToken))).status).toBe(403);
  });

  test('exclusão lógica: some do catálogo, mas o registro e o histórico permanecem', async () => {
    const del = await request(app).delete(`/api/produtos/${produtoId}`).set(auth(adminToken));
    expect(del.status).toBe(204);
    expect((await request(app).get(`/api/produtos/${produtoId}`)).status).toBe(404);
    const registro = await Product.findByPk(produtoId);
    expect(registro.ativo).toBe(false);
    expect(await StockMovement.count({ where: { produtoId } })).toBeGreaterThan(0);
  });
});
