const { body, param } = require('express-validator');

const idRule = param('id').isInt({ min: 1 }).withMessage('ID inválido.').toInt();

const createRules = [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório.').isLength({ max: 120 }).escape(),
  body('categoria').trim().notEmpty().withMessage('Categoria é obrigatória.').isLength({ max: 60 }).escape(),
  body('preco').isFloat({ gt: 0 }).withMessage('Preço deve ser maior que zero.').toFloat(),
  body('volumeMl').optional().isInt({ min: 1 }).withMessage('Volume deve ser um inteiro positivo (ml).').toInt(),
  body('descricao').optional().trim().escape(),
  body('estoque').optional().isInt({ min: 0 }).withMessage('Estoque não pode ser negativo.').toInt(),
];

// Na atualização todos os campos são opcionais
const updateRules = [
  idRule,
  body('nome').optional().trim().notEmpty().withMessage('Nome não pode ficar vazio.').isLength({ max: 120 }).escape(),
  body('categoria').optional().trim().notEmpty().withMessage('Categoria não pode ficar vazia.').isLength({ max: 60 }).escape(),
  body('preco').optional().isFloat({ gt: 0 }).withMessage('Preço deve ser maior que zero.').toFloat(),
  body('volumeMl').optional().isInt({ min: 1 }).withMessage('Volume deve ser um inteiro positivo (ml).').toInt(),
  body('descricao').optional().trim().escape(),
];

const idOnlyRules = [idRule];

const stockEntryRules = [
  idRule,
  body('quantidade').isInt({ min: 1 }).withMessage('Quantidade deve ser um inteiro maior que zero.').toInt(),
];

module.exports = { createRules, updateRules, idOnlyRules, stockEntryRules };
