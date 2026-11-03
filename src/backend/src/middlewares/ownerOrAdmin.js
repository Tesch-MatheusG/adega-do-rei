const { Reserva } = require('../models');

// Carrega a reserva de :id em req.reserva e só deixa passar o dono ou o admin.
// Para quem não é dono respondemos 404 (e não 403) para não revelar que o id existe.
async function loadReserva(req, res, next) {
  try {
    const reserva = await Reserva.findByPk(req.params.id);
    if (!reserva || (req.user.role !== 'admin' && reserva.usuarioId !== req.user.id)) {
      return res.status(404).json({ erro: 'Reserva não encontrada.' });
    }
    req.reserva = reserva;
    return next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}

module.exports = loadReserva;
