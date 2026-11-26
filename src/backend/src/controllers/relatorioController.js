const { relatorioMaisReservados } = require('../services/relatorioService');

// GET /api/relatorios/mais-reservados?dias=30&limite=5   (admin)
async function maisReservados(req, res) {
  try {
    const itens = await relatorioMaisReservados({
      dias: req.query.dias ? Number(req.query.dias) : undefined,
      limite: Number(req.query.limite) || 5,
    });
    return res.json(itens);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao gerar o relatório.' });
  }
}

module.exports = { maisReservados };
