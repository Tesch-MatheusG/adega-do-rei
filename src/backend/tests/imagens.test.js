// Fotos de produtos: upload pelo painel do admin, validação do arquivo, entrega pública e remoção.
// Mesmo esquema dos outros testes: SQLite em memória no lugar do MySQL.
jest.mock('../src/config/database', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize('sqlite::memory:', { logging: false });
});

process.env.JWT_SECRET = 'segredo-de-teste';

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const { sequelize, User, Product, Categoria, ProdutoImagem } = require('../src/models');

const auth = (t) => ({ Authorization: `Bearer ${t}` });

// Arquivos mínimos com a assinatura (primeiros bytes) de cada formato
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40, 1)]);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(40, 2)]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([40, 0, 0, 0]), Buffer.from('WEBP'), Buffer.alloc(40, 3)]);
const GIF = Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(40, 4)]);

let adminToken;
let clienteToken;
let produtoId;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await Categoria.create({ nome: 'Whisky' });
  await User.create({
    nome: 'Administrador', email: 'admin@exemplo.com', cpf: '52998224725',
    dataNascimento: '1990-01-01', senha: await bcrypt.hash('admin1234', 10), role: 'admin',
  });
  adminToken = (await request(app).post('/api/auth/login').send({ email: 'admin@exemplo.com', senha: 'admin1234' })).body.token;

  await request(app).post('/api/auth/register').send({
    nome: 'Maria Souza', email: 'maria@exemplo.com', cpf: '111.444.777-35', dataNascimento: '1995-05-20', senha: 'senha1234',
  });
  clienteToken = (await request(app).post('/api/auth/login').send({ email: 'maria@exemplo.com', senha: 'senha1234' })).body.token;

  const criado = await request(app).post('/api/produtos').set(auth(adminToken))
    .send({ nome: 'Whisky Red Label', categoria: 'Whisky', preco: 89.9, volumeMl: 1000, estoque: 5 });
  produtoId = criado.body.id;
});
afterAll(() => sequelize.close());

describe('Foto do produto — envio pelo admin', () => {
  test('produto novo não tem foto (imagemUrl nulo) e a rota da foto responde 404', async () => {
    const lista = await request(app).get('/api/produtos');
    expect(lista.body[0].imagemUrl).toBeNull();
    expect((await request(app).get(`/api/produtos/${produtoId}/imagem`)).status).toBe(404);
  });

  test.each([
    ['PNG', PNG, 'image/png', 'foto.png'],
    ['JPEG', JPEG, 'image/jpeg', 'foto.jpg'],
    ['WebP', WEBP, 'image/webp', 'foto.webp'],
  ])('aceita %s e passa a servir o arquivo com o tipo certo', async (_, arquivo, tipo, nome) => {
    const res = await request(app).put(`/api/produtos/${produtoId}/imagem`).set(auth(adminToken)).attach('imagem', arquivo, nome);
    expect(res.status).toBe(200);
    expect(res.body.imagemUrl).toMatch(new RegExp(`^/produtos/${produtoId}/imagem\\?v=\\d+$`));

    const foto = await request(app).get(`/api/produtos/${produtoId}/imagem`).buffer(true).parse((r, cb) => {
      const partes = []; r.on('data', (c) => partes.push(c)); r.on('end', () => cb(null, Buffer.concat(partes)));
    });
    expect(foto.status).toBe(200);
    expect(foto.headers['content-type']).toContain(tipo);
    expect(foto.headers['cache-control']).toContain('max-age');
    expect(Buffer.compare(foto.body, arquivo)).toBe(0);
  });

  test('a troca mantém uma única foto por produto', async () => {
    expect(await ProdutoImagem.count({ where: { produtoId } })).toBe(1);
  });

  test('a listagem e a busca por id trazem o imagemUrl', async () => {
    const lista = await request(app).get('/api/produtos');
    expect(lista.body[0].imagemUrl).toMatch(/imagem\?v=/);
    const um = await request(app).get(`/api/produtos/${produtoId}`);
    expect(um.body.imagemUrl).toMatch(/imagem\?v=/);
    expect(um.body.dados).toBeUndefined(); // os bytes nunca vão no JSON do produto
  });

  test('rejeita GIF (formato fora da lista) com 415', async () => {
    const res = await request(app).put(`/api/produtos/${produtoId}/imagem`).set(auth(adminToken)).attach('imagem', GIF, 'foto.gif');
    expect(res.status).toBe(415);
  });

  test('rejeita arquivo que finge ser imagem (texto com nome .png) com 415', async () => {
    const res = await request(app).put(`/api/produtos/${produtoId}/imagem`).set(auth(adminToken))
      .attach('imagem', Buffer.from('isto nao e uma imagem de verdade, so texto'), { filename: 'foto.png', contentType: 'image/png' });
    expect(res.status).toBe(415);
  });

  test('rejeita imagem acima de 2 MB com 413', async () => {
    const grande = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024, 7)]);
    const res = await request(app).put(`/api/produtos/${produtoId}/imagem`).set(auth(adminToken)).attach('imagem', grande, 'grande.png');
    expect(res.status).toBe(413);
  });

  test('rejeita requisição sem arquivo (400) e produto inexistente (404)', async () => {
    expect((await request(app).put(`/api/produtos/${produtoId}/imagem`).set(auth(adminToken)).field('x', 'y')).status).toBe(400);
    expect((await request(app).put('/api/produtos/9999/imagem').set(auth(adminToken)).attach('imagem', PNG, 'a.png')).status).toBe(404);
  });

  test('só admin envia foto: sem token 401, cliente 403', async () => {
    expect((await request(app).put(`/api/produtos/${produtoId}/imagem`).attach('imagem', PNG, 'a.png')).status).toBe(401);
    expect((await request(app).put(`/api/produtos/${produtoId}/imagem`).set(auth(clienteToken)).attach('imagem', PNG, 'a.png')).status).toBe(403);
  });

  test('id inválido na rota da foto retorna 400', async () => {
    expect((await request(app).get('/api/produtos/abc/imagem')).status).toBe(400);
  });
});

describe('Foto do produto — envio no formato que o navegador usa', () => {
  test('FormData + Blob (como o frontend faz) é aceito e a foto fica disponível', async () => {
    const servidor = app.listen(0);
    const base = `http://127.0.0.1:${servidor.address().port}/api`;
    try {
      const form = new FormData();
      form.append('imagem', new Blob([WEBP], { type: 'image/webp' }), 'foto.webp');
      const envio = await fetch(`${base}/produtos/${produtoId}/imagem`, { method: 'PUT', headers: auth(adminToken), body: form });
      expect(envio.status).toBe(200);
      const json = await envio.json();

      const foto = await fetch(`${base}${json.imagemUrl}`);
      expect(foto.status).toBe(200);
      expect(foto.headers.get('content-type')).toContain('image/webp');
      expect(Buffer.compare(Buffer.from(await foto.arrayBuffer()), WEBP)).toBe(0);
    } finally {
      servidor.close();
    }
  });
});

describe('Foto do produto — remoção e exclusão lógica', () => {
  test('só admin remove a foto; depois o produto volta a ficar sem foto', async () => {
    expect((await request(app).delete(`/api/produtos/${produtoId}/imagem`).set(auth(clienteToken))).status).toBe(403);
    expect((await request(app).delete(`/api/produtos/${produtoId}/imagem`).set(auth(adminToken))).status).toBe(204);
    expect((await request(app).get(`/api/produtos/${produtoId}`)).body.imagemUrl).toBeNull();
    expect((await request(app).get(`/api/produtos/${produtoId}/imagem`)).status).toBe(404);
    expect((await request(app).delete(`/api/produtos/${produtoId}/imagem`).set(auth(adminToken))).status).toBe(404);
  });

  test('produto removido do catálogo não serve mais a foto', async () => {
    await request(app).put(`/api/produtos/${produtoId}/imagem`).set(auth(adminToken)).attach('imagem', PNG, 'a.png');
    await request(app).delete(`/api/produtos/${produtoId}`).set(auth(adminToken));
    expect((await request(app).get(`/api/produtos/${produtoId}/imagem`)).status).toBe(404);
    expect((await Product.findByPk(produtoId)).ativo).toBe(false);
  });
});
