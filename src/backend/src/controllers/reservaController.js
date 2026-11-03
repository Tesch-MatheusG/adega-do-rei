const { User, Product, StockMovement, Reserva, ReservaItem, sequelize } = require('../models');
const { isAdult } = require('../utils/cpf');
const { ErroNegocio, devolverEstoque, expirarReservas, VINTE_E_QUATRO_HORAS } = require('../services/reservaService');

// O que devolvemos de cada reserva: itens com nome do produto. Do cliente só
// id/nome/e-mail (CPF e nascimento NÃO saem aqui — RN08).
const incluirDetalhes = [
  { model: ReservaItem, as: 'itens', include: [{ model: Product, as: 'produto', attributes: ['id', 'nome', 'categoria', 'volumeMl'] }] },
];
const incluirCliente = { model: User, as: 'usuario', attributes: ['id', 'nome', 'email'] };

// Converte ErroNegocio em resposta HTTP; qualquer outro erro vira 500.
function responderErro(res, err, mensagemPadrao) {
  if (err instanceof ErroNegocio) return res.status(err.status).json({ erro: err.message });
  console.error(err);
  return res.status(500).json({ erro: mensagemPadrao });
}

// POST /api/reservas   (cliente logado)
// Valida maioridade (RN01), confere e baixa o estoque (RN05, RF15, RN09) e grava
// reserva + itens + movimentações na MESMA transação: ou grava tudo, ou nada (RN06).
async function criar(req, res) {
  try {
    const usuario = await User.findByPk(req.user.id);
    if (!usuario) return res.status(401).json({ erro: 'Usuário não encontrado.' });
    if (!isAdult(usuario.dataNascimento)) {
      return res.status(403).json({ erro: 'Somente maiores de 18 anos podem reservar.' });
    }

    // Se o mesmo produto veio em duas linhas, soma as quantidades
    const porProduto = new Map();
    for (const { produtoId, quantidade } of req.body.itens) {
      porProduto.set(produtoId, (porProduto.get(produtoId) || 0) + quantidade);
    }
    const pedidos = [...porProduto.entries()].sort((a, b) => a[0] - b[0]); // ordem fixa = sem deadlock

    const retiradaPrevista = req.body.retiradaPrevista ? new Date(req.body.retiradaPrevista) : new Date();
    const expiraEm = new Date(retiradaPrevista.getTime() + VINTE_E_QUATRO_HORAS);

    const reservaId = await sequelize.transaction(async (t) => {
      const reserva = await Reserva.create(
        { usuarioId: usuario.id, retiradaPrevista, expiraEm, total: 0 },
        { transaction: t }
      );

      let total = 0;
      for (const [produtoId, quantidade] of pedidos) {
        const produto = await Product.findOne({
          where: { id: produtoId, ativo: true }, transaction: t, lock: t.LOCK.UPDATE,
        });
        if (!produto) throw new ErroNegocio(404, `Produto ${produtoId} não encontrado.`);
        if (produto.estoque < quantidade) {
          throw new ErroNegocio(
            409,
            produto.estoque === 0
              ? `"${produto.nome}" está indisponível.`
              : `Estoque insuficiente de "${produto.nome}": restam ${produto.estoque}.`
          );
        }

        const saldoAnterior = produto.estoque;
        await produto.decrement('estoque', { by: quantidade, transaction: t });
        await ReservaItem.create(
          { reservaId: reserva.id, produtoId, quantidade, precoUnitario: produto.preco },
          { transaction: t }
        );
        await StockMovement.create(
          {
            produtoId, usuarioId: usuario.id, tipo: 'reserva', quantidade,
            saldoAnterior, saldoPosterior: saldoAnterior - quantidade,
            motivo: `Reserva #${reserva.id}`,
          },
          { transaction: t }
        );
        total += Number(produto.preco) * quantidade;
      }

      await reserva.update({ total: Math.round((total + Number.EPSILON) * 100) / 100 }, { transaction: t });
      return reserva.id;
    });

    const reserva = await Reserva.findByPk(reservaId, { include: incluirDetalhes });
    return res.status(201).json(reserva);
  } catch (err) {
    return responderErro(res, err, 'Erro interno ao criar reserva.');
  }
}

// GET /api/reservas/minhas   (cliente logado) — RF05
async function minhas(req, res) {
  try {
    await expirarReservas();
    const reservas = await Reserva.findAll({
      where: { usuarioId: req.user.id }, include: incluirDetalhes, order: [['id', 'DESC']],
    });
    return res.json(reservas);
  } catch (err) {
    return responderErro(res, err, 'Erro interno ao listar reservas.');
  }
}

// GET /api/reservas?status=pendente   (admin) — RF12
async function listarTodas(req, res) {
  try {
    await expirarReservas();
    const where = req.query.status ? { status: req.query.status } : {};
    const reservas = await Reserva.findAll({
      where, include: [...incluirDetalhes, incluirCliente], order: [['id', 'DESC']],
    });
    return res.json(reservas);
  } catch (err) {
    return responderErro(res, err, 'Erro interno ao listar reservas.');
  }
}

// GET /api/reservas/:id   (dono ou admin)
async function buscar(req, res) {
  try {
    await expirarReservas();
    const reserva = await Reserva.findByPk(req.reserva.id, { include: [...incluirDetalhes, incluirCliente] });
    return res.json(reserva);
  } catch (err) {
    return responderErro(res, err, 'Erro interno ao buscar reserva.');
  }
}

// Aplica uma mudança de status relendo a reserva com trava, para duas ações
// simultâneas (ex.: cancelar + expirar) nunca devolverem o estoque duas vezes.
async function mudarStatus(req, res, { permitidos, novoStatus, aoMudar, mensagemOk, erroPadrao }) {
  try {
    await expirarReservas();
    const resultado = await sequelize.transaction(async (t) => {
      const reserva = await Reserva.findByPk(req.reserva.id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!permitidos.includes(reserva.status)) {
        throw new ErroNegocio(409, `Reserva já está "${reserva.status}"; ação não permitida.`);
      }
      if (aoMudar) await aoMudar(reserva, t);
      await reserva.update({ status: novoStatus }, { transaction: t });
      return reserva.id;
    });
    const reserva = await Reserva.findByPk(resultado, { include: incluirDetalhes });
    return res.json({ mensagem: mensagemOk, reserva });
  } catch (err) {
    return responderErro(res, err, erroPadrao);
  }
}

// PATCH /api/reservas/:id/cancelar   (dono ou admin) — RF06
// Devolve o estoque reservado (RN03/RN06).
const cancelar = (req, res) => mudarStatus(req, res, {
  permitidos: ['pendente', 'pronta'],
  novoStatus: 'cancelada',
  aoMudar: (reserva, t) => devolverEstoque(reserva, t, `Reserva #${reserva.id} cancelada`, req.user.id),
  mensagemOk: 'Reserva cancelada.',
  erroPadrao: 'Erro interno ao cancelar reserva.',
});

// PATCH /api/reservas/:id/pronta   (admin) — separou os produtos
const marcarPronta = (req, res) => mudarStatus(req, res, {
  permitidos: ['pendente'],
  novoStatus: 'pronta',
  mensagemOk: 'Reserva pronta para retirada.',
  erroPadrao: 'Erro interno ao atualizar reserva.',
});

// PATCH /api/reservas/:id/retirada   (admin) — cliente buscou e pagou no balcão (RN04)
// O estoque já foi baixado na reserva, então aqui só muda o status.
const confirmarRetirada = (req, res) => mudarStatus(req, res, {
  permitidos: ['pendente', 'pronta'],
  novoStatus: 'retirada',
  mensagemOk: 'Retirada confirmada.',
  erroPadrao: 'Erro interno ao confirmar retirada.',
});

module.exports = { criar, minhas, listarTodas, buscar, cancelar, marcarPronta, confirmarRetirada };
