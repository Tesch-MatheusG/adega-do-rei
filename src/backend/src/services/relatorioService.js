const { Op, fn, col, literal } = require('sequelize');
const { Product, Reserva, ReservaItem } = require('../models');

// Reservas que contam como "demanda de verdade": as ativas e as já retiradas.
// Canceladas e expiradas ficam de fora (o cliente desistiu ou não apareceu).
const STATUS_CONTADOS = ['pendente', 'pronta', 'retirada'];

// Ranking dos produtos mais reservados, somando as unidades de cada produto.
//  - dias:            só reservas feitas nos últimos N dias (omitido = todo o período)
//  - limite:          quantos produtos devolver
//  - apenasDisponiveis: só produtos ativos e com estoque (para sugerir ao cliente)
//  - excluirId:       tira um produto do ranking (o que o cliente está vendo)
// Retorna [{ produtoId, unidades, reservas }] do mais para o menos reservado.
async function rankingReservas({ dias, limite = 5, apenasDisponiveis = false, excluirId } = {}) {
  const whereReserva = { status: { [Op.in]: STATUS_CONTADOS } };
  if (dias) whereReserva.createdAt = { [Op.gte]: new Date(Date.now() - dias * 24 * 3600 * 1000) };

  const whereProduto = { ativo: true };
  if (apenasDisponiveis) whereProduto.estoque = { [Op.gt]: 0 };
  if (excluirId) whereProduto.id = { [Op.ne]: excluirId };

  const linhas = await ReservaItem.findAll({
    attributes: [
      'produtoId',
      [fn('SUM', col('ReservaItem.quantidade')), 'unidades'],
      [fn('COUNT', fn('DISTINCT', col('ReservaItem.reservaId'))), 'reservas'],
    ],
    include: [
      { model: Reserva, attributes: [], where: whereReserva, required: true },
      { model: Product, as: 'produto', attributes: [], where: whereProduto, required: true },
    ],
    group: ['ReservaItem.produtoId'],
    order: [[literal('unidades'), 'DESC'], ['produtoId', 'ASC']], // empate: o mais antigo primeiro
    limit: limite,
    raw: true,
  });

  return linhas.map((l) => ({ produtoId: l.produtoId, unidades: Number(l.unidades), reservas: Number(l.reservas) }));
}

// Sugestões para a página do produto: os mais reservados que estão disponíveis.
// Se ainda houver poucas reservas na loja, completa com outros produtos disponíveis (ordem alfabética).
async function sugestoesMaisReservados({ limite = 3, excluirId } = {}) {
  const ranking = await rankingReservas({ limite, apenasDisponiveis: true, excluirId });
  const ids = ranking.map((r) => r.produtoId);

  let produtos = ids.length ? await Product.findAll({ where: { id: ids } }) : [];
  produtos = ids.map((id) => produtos.find((p) => p.id === id)).filter(Boolean); // mantém a ordem do ranking

  if (produtos.length < limite) {
    const jaUsados = [...ids, ...(excluirId ? [excluirId] : [])];
    const extras = await Product.findAll({
      where: { ativo: true, estoque: { [Op.gt]: 0 }, ...(jaUsados.length && { id: { [Op.notIn]: jaUsados } }) },
      order: [['nome', 'ASC']],
      limit: limite - produtos.length,
    });
    produtos = [...produtos, ...extras];
  }
  return produtos;
}

// Relatório do admin: ranking com os nomes e as quantidades
async function relatorioMaisReservados({ dias, limite = 5 } = {}) {
  const ranking = await rankingReservas({ dias, limite });
  if (ranking.length === 0) return [];
  const produtos = await Product.findAll({ where: { id: ranking.map((r) => r.produtoId) } });
  return ranking.map((r) => {
    const p = produtos.find((x) => x.id === r.produtoId);
    return { produtoId: r.produtoId, nome: p.nome, categoria: p.categoria, estoque: p.estoque, unidades: r.unidades, reservas: r.reservas };
  });
}

module.exports = { STATUS_CONTADOS, rankingReservas, sugestoesMaisReservados, relatorioMaisReservados };
