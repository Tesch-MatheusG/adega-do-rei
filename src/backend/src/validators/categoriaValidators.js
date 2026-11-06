const { body } = require('express-validator');
const { normalizeCategoria } = require('../utils/normalize');

const createRules = [
  body('nome')
    .customSanitizer(normalizeCategoria)
    .notEmpty().withMessage('Nome da categoria é obrigatório.')
    .isLength({ max: 60 }).withMessage('Categoria deve ter no máximo 60 caracteres.')
    .bail()
    .matches(/\p{L}/u).withMessage('Categoria deve conter ao menos uma letra.'),
];

module.exports = { createRules };
