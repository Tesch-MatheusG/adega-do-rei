const { body, param } = require('express-validator');
const { cleanText, normalizeCategoria, emptyToNull, roundMoney } = require('../utils/normalize');

const idRule = param('id').isInt({ min: 1 }).withMessage('ID inválido.').toInt();

// "null" e "undefined" contam como campo ausente (o frontend envia null quando o campo fica vazio)
const opt = { values: 'null' };

const nome = (obrigatorio) => {
  const chain = obrigatorio ? body('nome') : body('nome').optional(opt);
  return chain
    .customSanitizer(cleanText)
    .notEmpty().withMessage(obrigatorio ? 'Nome é obrigatório.' : 'Nome não pode ficar vazio.')
    .isLength({ max: 120 }).withMessage('Nome deve ter no máximo 120 caracteres.');
};

const categoria = (obrigatorio) => {
  const chain = obrigatorio ? body('categoria') : body('categoria').optional(opt);
  return chain
    .customSanitizer(normalizeCategoria)
    .notEmpty().withMessage(obrigatorio ? 'Categoria é obrigatória.' : 'Categoria não pode ficar vazia.')
    .isLength({ max: 60 }).withMessage('Categoria deve ter no máximo 60 caracteres.');
};

const preco = (obrigatorio) => {
  const chain = obrigatorio ? body('preco') : body('preco').optional(opt);
  return chain
    .isFloat({ gt: 0 }).withMessage('Preço deve ser maior que zero.')
    .toFloat()
    .customSanitizer(roundMoney);
};

const volumeMl = body('volumeMl').optional(opt).isInt({ min: 1 }).withMessage('Volume deve ser um inteiro positivo (ml).').toInt();
const descricao = body('descricao').optional(opt).customSanitizer(emptyToNull);

const createRules = [
  nome(true),
  categoria(true),
  preco(true),
  volumeMl,
  descricao,
  body('estoque').optional(opt).isInt({ min: 0 }).withMessage('Estoque não pode ser negativo.').toInt(),
];

// Na atualização todos os campos são opcionais
const updateRules = [idRule, nome(false), categoria(false), preco(false), volumeMl, descricao];

const idOnlyRules = [idRule];

const stockEntryRules = [
  idRule,
  body('quantidade').isInt({ min: 1 }).withMessage('Quantidade deve ser um inteiro maior que zero.').toInt(),
  body('motivo').optional(opt).customSanitizer(emptyToNull),
];

module.exports = { createRules, updateRules, idOnlyRules, stockEntryRules };
