const { query } = require('express-validator');

const opt = { values: 'falsy' }; // "?dias=" vazio conta como ausente

const maisReservadosRules = [
  query('dias').optional(opt).isInt({ min: 1, max: 365 }).withMessage('dias deve ser um inteiro de 1 a 365.').toInt(),
  query('limite').optional(opt).isInt({ min: 1, max: 20 }).withMessage('limite deve ser um inteiro de 1 a 20.').toInt(),
];

// Sugestões públicas (página do produto)
const sugestoesRules = [
  query('limite').optional(opt).isInt({ min: 1, max: 12 }).withMessage('limite deve ser um inteiro de 1 a 12.').toInt(),
  query('excluir').optional(opt).isInt({ min: 1 }).withMessage('excluir deve ser um ID válido.').toInt(),
];

module.exports = { maisReservadosRules, sugestoesRules };
