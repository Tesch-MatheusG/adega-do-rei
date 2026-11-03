// Testes de integração do módulo de Reservas (RF04-RF06, RF12, RF15, RN01, RN03, RN05, RN06, RN09).
// Mesmo esquema do api.test.js: SQLite em memória no lugar do MySQL.
jest.mock('../src/config/database', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize('sqlite::memory:', { logging: false });
});
process.env.JWT_SECRET = 'segredo-de-teste';

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const { sequelize, User, Product, StockMovement, Reserva } = require('../src/models');
const { expirarReservas } = require('../src/services/reservaService');

const auth = (t) => ({ Authorization: `Bearer ${t}` });
let admin, ana, bia, menor, vinho, cerveja;

async function criarUsuario(nome, email, cpf, nasc, role = 'cliente') {
  await User.create({ nome, email, cpf, dataNascimento: nasc, senha: await bcrypt.hash('senha1234', 10), role });
  const r = await request(app).post('/api/auth/login').send({ email, senha: 'senha1234' });
  return r.body.token;
}
const saldo = async (id) => (await Product.findByPk(id)).estoque;
const reservar = (token, itens, extra = {}) => request(app).post('/api/reservas').set(auth(token)).send({ itens, ...extra });

beforeAll(async () => {
  await sequelize.sync({ force: true });
  admin = await criarUsuario('Dono', 'dono@x.com', '52998224725', '1980-01-01', 'admin');
  ana = await criarUsuario('Ana', 'ana@x.com', '11144477735', '1995-05-20');
  bia = await criarUsuario('Bia', 'bia@x.com', '12345678909', '1990-03-10');
  const ano = new Date().getFullYear() - 16; // 16 anos
  menor = await criarUsuario('Caio', 'caio@x.com', '93541134780', `${ano}-06-15`);
  vinho = await Product.create({ nome: 'Vinho Tinto', categoria: 'Vinho', preco: 50, estoque: 10 });
  cerveja = await Product.create({ nome: 'Cerveja IPA', categoria: 'Cerveja', preco: 12.5, estoque: 3 });
});
afterAll(() => sequelize.close());

describe('Criar reserva', () => {
  test('exige login (401)', async () => {
    const r = await request(app).post('/api/reservas').send({ itens: [{ produtoId: vinho.id, quantidade: 1 }] });
    expect(r.status).toBe(401);
  });

  test('cria reserva, baixa o estoque, calcula total e registra movimentação "reserva"', async () => {
    const r = await reservar(ana, [{ produtoId: vinho.id, quantidade: 2 }, { produtoId: cerveja.id, quantidade: 1 }]);
    expect(r.status).toBe(201);
    expect(r.body.status).toBe('pendente');
    expect(r.body.total).toBe(112.5);
    expect(r.body.itens).toHaveLength(2);
    expect(r.body.itens[0].precoUnitario).toEqual(expect.any(Number));
    expect(await saldo(vinho.id)).toBe(8);
    expect(await saldo(cerveja.id)).toBe(2);

    const mov = await StockMovement.findOne({ where: { produtoId: vinho.id, tipo: 'reserva' } });
    expect(mov.quantidade).toBe(2);
    expect([mov.saldoAnterior, mov.saldoPosterior]).toEqual([10, 8]);
    expect(mov.motivo).toBe(`Reserva #${r.body.id}`);
  });

  test('expiraEm = retirada prevista + 24h (RN03)', async () => {
    const r = await reservar(ana, [{ produtoId: vinho.id, quantidade: 1 }]);
    const dif = new Date(r.body.expiraEm) - new Date(r.body.retiradaPrevista);
    expect(dif).toBe(24 * 3600 * 1000);
    await request(app).patch(`/api/reservas/${r.body.id}/cancelar`).set(auth(ana)); // devolve
  });

  test('mesmo produto em duas linhas soma as quantidades', async () => {
    const antes = await saldo(vinho.id);
    const r = await reservar(ana, [{ produtoId: vinho.id, quantidade: 1 }, { produtoId: vinho.id, quantidade: 2 }]);
    expect(r.status).toBe(201);
    expect(r.body.itens).toHaveLength(1);
    expect(r.body.itens[0].quantidade).toBe(3);
    expect(await saldo(vinho.id)).toBe(antes - 3);
    await request(app).patch(`/api/reservas/${r.body.id}/cancelar`).set(auth(ana));
  });

  test('estoque insuficiente: 409 e NADA é gravado, nem do item que tinha estoque (RN05, RF15)', async () => {
    const antesV = await saldo(vinho.id);
    const antesC = await saldo(cerveja.id);
    const totalAntes = await Reserva.count();
    const r = await reservar(bia, [{ produtoId: vinho.id, quantidade: 1 }, { produtoId: cerveja.id, quantidade: 99 }]);
    expect(r.status).toBe(409);
    expect(r.body.erro).toMatch(/Estoque insuficiente de "Cerveja IPA"/);
    expect(await saldo(vinho.id)).toBe(antesV);
    expect(await saldo(cerveja.id)).toBe(antesC);
    expect(await Reserva.count()).toBe(totalAntes);
  });

  test('produto com estoque zerado fica indisponível (RN09)', async () => {
    const zerado = await Product.create({ nome: 'Raro', categoria: 'Whisky', preco: 300, estoque: 0 });
    const r = await reservar(bia, [{ produtoId: zerado.id, quantidade: 1 }]);
    expect(r.status).toBe(409);
    expect(r.body.erro).toMatch(/indisponível/);
  });

  test('produto inexistente ou removido: 404', async () => {
    expect((await reservar(bia, [{ produtoId: 9999, quantidade: 1 }])).status).toBe(404);
    const removido = await Product.create({ nome: 'Velho', categoria: 'Vinho', preco: 10, estoque: 5, ativo: false });
    expect((await reservar(bia, [{ produtoId: removido.id, quantidade: 1 }])).status).toBe(404);
  });

  test('menor de 18 anos não reserva (RN01)', async () => {
    const r = await reservar(menor, [{ produtoId: vinho.id, quantidade: 1 }]);
    expect(r.status).toBe(403);
    expect(r.body.erro).toMatch(/18 anos/);
  });

  test.each([
    ['sem itens', { itens: [] }],
    ['itens ausente', {}],
    ['quantidade zero', { itens: [{ produtoId: 1, quantidade: 0 }] }],
    ['quantidade negativa', { itens: [{ produtoId: 1, quantidade: -2 }] }],
    ['quantidade decimal', { itens: [{ produtoId: 1, quantidade: 1.5 }] }],
    ['quantidade absurda', { itens: [{ produtoId: 1, quantidade: 1000 }] }],
    ['produtoId inválido', { itens: [{ produtoId: 'abc', quantidade: 1 }] }],
    ['data no passado', { itens: [{ produtoId: 1, quantidade: 1 }], retiradaPrevista: '2020-01-01T10:00:00Z' }],
    ['data > 7 dias', { itens: [{ produtoId: 1, quantidade: 1 }], retiradaPrevista: new Date(Date.now() + 30 * 864e5).toISOString() }],
    ['data malformada', { itens: [{ produtoId: 1, quantidade: 1 }], retiradaPrevista: 'amanhã' }],
  ])('validação rejeita %s (400)', async (_nome, corpo) => {
    const r = await request(app).post('/api/reservas').set(auth(ana)).send(corpo);
    expect(r.status).toBe(400);
    expect(r.body.erro).toBe('Dados inválidos.');
  });

  // Nota: a concorrência real (dois pedidos no mesmo milissegundo) é protegida por
  // transação + SELECT ... FOR UPDATE no MySQL. O SQLite em memória usado nos testes
  // tem uma única conexão e ignora travas, então aqui testamos a regra em sequência.
  test('quem reserva o último item leva; o seguinte recebe 409 e o saldo nunca fica negativo', async () => {
    const ultimo = await Product.create({ nome: 'Último', categoria: 'Vinho', preco: 99, estoque: 1 });
    const a = await reservar(ana, [{ produtoId: ultimo.id, quantidade: 1 }]);
    const b = await reservar(bia, [{ produtoId: ultimo.id, quantidade: 1 }]);
    expect([a.status, b.status]).toEqual([201, 409]);
    expect(await saldo(ultimo.id)).toBe(0);
  });
});

describe('Consultar reservas', () => {
  let reservaAna, reservaBia;
  beforeAll(async () => {
    reservaAna = (await reservar(ana, [{ produtoId: vinho.id, quantidade: 1 }])).body;
    reservaBia = (await reservar(bia, [{ produtoId: vinho.id, quantidade: 1 }])).body;
  });

  test('/minhas devolve só as reservas do próprio cliente (RF05)', async () => {
    const r = await request(app).get('/api/reservas/minhas').set(auth(bia));
    expect(r.status).toBe(200);
    expect(r.body.length).toBeGreaterThan(0);
    expect(r.body.every((x) => x.usuarioId === r.body[0].usuarioId)).toBe(true);
    expect(r.body.map((x) => x.id)).toContain(reservaBia.id);
    expect(r.body.map((x) => x.id)).not.toContain(reservaAna.id);
  });

  test('cliente NÃO vê reserva de outro cliente: 404 (sem revelar que existe)', async () => {
    const r = await request(app).get(`/api/reservas/${reservaAna.id}`).set(auth(bia));
    expect(r.status).toBe(404);
  });

  test('dono vê a própria reserva; admin vê qualquer uma', async () => {
    expect((await request(app).get(`/api/reservas/${reservaAna.id}`).set(auth(ana))).status).toBe(200);
    const r = await request(app).get(`/api/reservas/${reservaAna.id}`).set(auth(admin));
    expect(r.status).toBe(200);
    expect(r.body.usuario.nome).toBe('Ana');
  });

  test('lista geral é só do admin (403 para cliente) e NÃO expõe CPF/nascimento (RN08)', async () => {
    expect((await request(app).get('/api/reservas').set(auth(ana))).status).toBe(403);
    const r = await request(app).get('/api/reservas').set(auth(admin));
    expect(r.status).toBe(200);
    expect(JSON.stringify(r.body)).not.toMatch(/cpf|dataNascimento|senha/);
  });

  test('filtro por status e status inválido', async () => {
    const r = await request(app).get('/api/reservas?status=pendente').set(auth(admin));
    expect(r.body.every((x) => x.status === 'pendente')).toBe(true);
    expect((await request(app).get('/api/reservas?status=banana').set(auth(admin))).status).toBe(400);
  });

  test('id inválido: 400; id inexistente: 404', async () => {
    expect((await request(app).get('/api/reservas/abc').set(auth(ana))).status).toBe(400);
    expect((await request(app).get('/api/reservas/99999').set(auth(ana))).status).toBe(404);
  });
});

describe('Cancelar, preparar e retirar', () => {
  test('cliente cancela a própria reserva e o estoque volta com histórico (RF06, RN06)', async () => {
    const antes = await saldo(vinho.id);
    const r = await reservar(ana, [{ produtoId: vinho.id, quantidade: 4 }]);
    expect(await saldo(vinho.id)).toBe(antes - 4);

    const c = await request(app).patch(`/api/reservas/${r.body.id}/cancelar`).set(auth(ana));
    expect(c.status).toBe(200);
    expect(c.body.reserva.status).toBe('cancelada');
    expect(await saldo(vinho.id)).toBe(antes);
    const mov = await StockMovement.findOne({ where: { motivo: `Reserva #${r.body.id} cancelada` } });
    expect([mov.tipo, mov.quantidade]).toEqual(['ajuste', 4]);
  });

  test('cancelar duas vezes: 2ª retorna 409 e o estoque NÃO é devolvido em dobro', async () => {
    const r = await reservar(ana, [{ produtoId: vinho.id, quantidade: 2 }]);
    await request(app).patch(`/api/reservas/${r.body.id}/cancelar`).set(auth(ana));
    const antes = await saldo(vinho.id);
    const again = await request(app).patch(`/api/reservas/${r.body.id}/cancelar`).set(auth(ana));
    expect(again.status).toBe(409);
    expect(await saldo(vinho.id)).toBe(antes);
  });

  test('cliente não cancela reserva alheia (404); admin cancela qualquer uma', async () => {
    const r = await reservar(ana, [{ produtoId: vinho.id, quantidade: 1 }]);
    expect((await request(app).patch(`/api/reservas/${r.body.id}/cancelar`).set(auth(bia))).status).toBe(404);
    expect((await request(app).patch(`/api/reservas/${r.body.id}/cancelar`).set(auth(admin))).status).toBe(200);
  });

  test('fluxo do admin: pendente -> pronta -> retirada; estoque não muda na retirada', async () => {
    const r = await reservar(ana, [{ produtoId: vinho.id, quantidade: 1 }]);
    expect((await request(app).patch(`/api/reservas/${r.body.id}/pronta`).set(auth(ana))).status).toBe(403);

    const p = await request(app).patch(`/api/reservas/${r.body.id}/pronta`).set(auth(admin));
    expect(p.body.reserva.status).toBe('pronta');
    expect((await request(app).patch(`/api/reservas/${r.body.id}/pronta`).set(auth(admin))).status).toBe(409);

    const antes = await saldo(vinho.id);
    const ret = await request(app).patch(`/api/reservas/${r.body.id}/retirada`).set(auth(admin));
    expect(ret.body.reserva.status).toBe('retirada');
    expect(await saldo(vinho.id)).toBe(antes);
  });

  test('reserva retirada não pode mais ser cancelada nem retirada de novo', async () => {
    const r = await reservar(ana, [{ produtoId: vinho.id, quantidade: 1 }]);
    await request(app).patch(`/api/reservas/${r.body.id}/retirada`).set(auth(admin));
    expect((await request(app).patch(`/api/reservas/${r.body.id}/cancelar`).set(auth(ana))).status).toBe(409);
    expect((await request(app).patch(`/api/reservas/${r.body.id}/retirada`).set(auth(admin))).status).toBe(409);
  });
});

describe('Expiração automática (RN03)', () => {
  test('reserva vencida vira "expirada" e o estoque retorna; não vencida e retirada ficam intactas', async () => {
    const vencida = (await reservar(ana, [{ produtoId: vinho.id, quantidade: 2 }])).body;
    const viva = (await reservar(ana, [{ produtoId: vinho.id, quantidade: 1 }])).body;
    const retirada = (await reservar(ana, [{ produtoId: vinho.id, quantidade: 1 }])).body;
    await request(app).patch(`/api/reservas/${retirada.id}/retirada`).set(auth(admin));

    const passado = new Date(Date.now() - 3600 * 1000);
    await Reserva.update({ expiraEm: passado }, { where: { id: [vencida.id, retirada.id] } });

    const antes = await saldo(vinho.id);
    expect(await expirarReservas()).toBe(1);
    expect(await saldo(vinho.id)).toBe(antes + 2);
    expect((await Reserva.findByPk(vencida.id)).status).toBe('expirada');
    expect((await Reserva.findByPk(viva.id)).status).toBe('pendente');
    expect((await Reserva.findByPk(retirada.id)).status).toBe('retirada');
    expect(await StockMovement.count({ where: { motivo: `Reserva #${vencida.id} expirada` } })).toBe(1);

    // rodar de novo não devolve em dobro
    expect(await expirarReservas()).toBe(0);
    expect(await saldo(vinho.id)).toBe(antes + 2);
  });

  test('ao listar, a expiração é aplicada na hora (servidor "dormindo" no Render)', async () => {
    const r = (await reservar(bia, [{ produtoId: cerveja.id, quantidade: 1 }])).body;
    await Reserva.update({ expiraEm: new Date(Date.now() - 1000) }, { where: { id: r.id } });
    const lista = await request(app).get('/api/reservas/minhas').set(auth(bia));
    expect(lista.body.find((x) => x.id === r.id).status).toBe('expirada');
  });

  test('não dá para marcar como retirada uma reserva já vencida', async () => {
    const r = (await reservar(bia, [{ produtoId: vinho.id, quantidade: 1 }])).body;
    await Reserva.update({ expiraEm: new Date(Date.now() - 1000) }, { where: { id: r.id } });
    const ret = await request(app).patch(`/api/reservas/${r.id}/retirada`).set(auth(admin));
    expect(ret.status).toBe(409);
  });
});

describe('Integridade do estoque (RN06)', () => {
  test('saldo atual de cada produto = soma das movimentações (reservas, cancelamentos e expirações incluídos)', async () => {
    // o Product.create dos testes não gera movimentação; usamos saldoPosterior da última linha
    for (const p of [vinho, cerveja]) {
      const ultima = await StockMovement.findOne({ where: { produtoId: p.id }, order: [['id', 'DESC']] });
      expect(ultima.saldoPosterior).toBe(await saldo(p.id));
    }
    // encadeamento: o saldoAnterior de cada linha é o saldoPosterior da anterior
    for (const p of [vinho, cerveja]) {
      const linhas = await StockMovement.findAll({ where: { produtoId: p.id }, order: [['id', 'ASC']] });
      for (let i = 1; i < linhas.length; i++) expect(linhas[i].saldoAnterior).toBe(linhas[i - 1].saldoPosterior);
    }
  });
});
