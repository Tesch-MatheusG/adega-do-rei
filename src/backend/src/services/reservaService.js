const { Op } = require('sequelize');
const { Product, StockMovement, Reserva, ReservaItem, sequelize } = require('../models');

const VINTE_E_QUATRO_HORAS = 24 * 3600 * 1000;

// Erro "esperado" (regra de negócio): vira resposta HTTP com o status indicado,
// em vez de virar um 500 genérico.
class ErroNegocio extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

// Devolve ao estoque os itens de uma reserva que NÃO foi retirada (cancelada ou
// expirada) e registra cada devolução no histórico (RN03, RN06).
// Precisa rodar dentro de uma transação `t`.
async function devolverEstoque(reserva, t, motivo, usuarioId) {
  const itens = await ReservaItem.findAll({
    where: { reservaId: reserva.id },
    order: [['produtoId', 'ASC']], // ordem fixa evita deadlock entre transações
    transaction: t,
  });

  for (const item of itens) {
    const produto = await Product.findByPk(item.produtoId, { transaction: t, lock: t.LOCK.UPDATE });
    const saldoAnterior = produto.estoque;
    await produto.increment('estoque', { by: item.quantidade, transaction: t });
    await StockMovement.create(
      {
        produtoId: produto.id, usuarioId: usuarioId ?? null, tipo: 'ajuste',
        quantidade: item.quantidade, saldoAnterior, saldoPosterior: saldoAnterior + item.quantidade,
        motivo,
      },
      { transaction: t }
    );
  }
}

// Passa para "expirada" toda reserva ativa cujo prazo (retirada + 24h) já venceu
// e devolve o estoque (RN03). Chamada por um agendador no servidor e também antes
// de listar/alterar reservas — assim o resultado fica correto mesmo se o servidor
// ficou "dormindo" (plano gratuito do Render) e o agendador não rodou.
async function expirarReservas() {
  const vencidas = await Reserva.findAll({
    where: { status: { [Op.in]: ['pendente', 'pronta'] }, expiraEm: { [Op.lt]: new Date() } },
    attributes: ['id'],
  });

  let expiradas = 0;
  for (const { id } of vencidas) {
    await sequelize.transaction(async (t) => {
      // Relê com trava: se alguém cancelou/retirou nesse meio-tempo, não mexe de novo.
      const reserva = await Reserva.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!reserva || !['pendente', 'pronta'].includes(reserva.status)) return;
      await devolverEstoque(reserva, t, `Reserva #${reserva.id} expirada`, null);
      await reserva.update({ status: 'expirada' }, { transaction: t });
      expiradas += 1;
    });
  }
  return expiradas;
}

// Inicia a verificação periódica. Chamada só pelo server.js (nunca nos testes).
function iniciarAgendadorExpiracao(intervaloMin = 10) {
  const timer = setInterval(() => {
    expirarReservas().catch((err) => console.error('Falha ao expirar reservas:', err.message));
  }, intervaloMin * 60 * 1000);
  timer.unref(); // não impede o processo de encerrar
  expirarReservas().catch((err) => console.error('Falha ao expirar reservas:', err.message));
  return timer;
}

module.exports = { ErroNegocio, devolverEstoque, expirarReservas, iniciarAgendadorExpiracao, VINTE_E_QUATRO_HORAS };
