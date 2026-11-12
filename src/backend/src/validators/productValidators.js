const { body, param } = require('express-validator');
const { fn, col, where: sqlWhere } = require('sequelize');
const { cleanText, normalizeCategoria, emptyToNull, roundMoney } = require('../utils/normalize');
const Categoria = require('../models/Categoria');

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
    .isLength({ max: 60 }).withMessage('Categoria deve ter no máximo 60 caracteres.')
    .bail()
    // A categoria precisa estar na lista oficial (tabela "categorias"). Guardamos o nome
    // oficial em req.categoriaOficial para o controller gravar sempre com a mesma grafia.
    .custom(async (valor, { req }) => {
      const oficial = await Categoria.findOne({ where: sqlWhere(fn('LOWER', col('nome')), valor.toLowerCase()) });
      if (!oficial) throw new Error('Categoria inexistente. Escolha uma da lista ou cadastre uma nova.');
      req.categoriaOficial = oficial.nome;
      return true;
    });
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

// Baixa manual (quebra, perda...): o motivo vem de uma lista fixa para os relatórios ficarem consistentes
const MOTIVOS_BAIXA = { quebra: 'Quebra', perda: 'Perda', vencimento: 'Vencimento', furto: 'Furto/extravio', outro: 'Outro' };

const stockWriteOffRules = [
  idRule,
  body('quantidade').isInt({ min: 1 }).withMessage('Quantidade deve ser um inteiro maior que zero.').toInt(),
  body('motivo')
    .customSanitizer((v) => String(v ?? '').trim().toLowerCase())
    .isIn(Object.keys(MOTIVOS_BAIXA)).withMessage(`Motivo deve ser um de: ${Object.keys(MOTIVOS_BAIXA).join(', ')}.`),
  body('observacao')
    .optional(opt)
    .customSanitizer(emptyToNull)
    .isLength({ max: 150 }).withMessage('Observação deve ter no máximo 150 caracteres.'),
  // "Outro" não diz nada sozinho: exigimos uma explicação para a auditoria
  body('observacao').custom((valor, { req }) => {
    if (req.body.motivo === 'outro' && !valor) throw new Error('Descreva o motivo na observação.');
    return true;
  }),
];

module.exports = { createRules, updateRules, idOnlyRules, stockEntryRules, stockWriteOffRules, MOTIVOS_BAIXA };
