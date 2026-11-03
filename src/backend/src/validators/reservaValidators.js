const { body, param, query } = require('express-validator');
const Reserva = require('../models/Reserva');

const idRule = param('id').isInt({ min: 1 }).withMessage('ID inválido.').toInt();
const opt = { values: 'null' };

const MAX_DIAS_ANTECEDENCIA = 7;
const MAX_ITENS = 20;
const MAX_QTD_POR_ITEM = 99;

const createRules = [
  body('itens')
    .isArray({ min: 1, max: MAX_ITENS })
    .withMessage(`Informe de 1 a ${MAX_ITENS} itens na reserva.`),
  body('itens.*.produtoId').isInt({ min: 1 }).withMessage('produtoId inválido.').toInt(),
  body('itens.*.quantidade')
    .isInt({ min: 1, max: MAX_QTD_POR_ITEM })
    .withMessage(`Quantidade deve ser de 1 a ${MAX_QTD_POR_ITEM}.`)
    .toInt(),
  body('retiradaPrevista')
    .optional(opt)
    .isISO8601().withMessage('retiradaPrevista deve ser uma data/hora válida (ISO 8601).')
    .bail()
    .custom((valor) => {
      const data = new Date(valor);
      const agora = Date.now();
      // tolera 5 min de diferença de relógio entre navegador e servidor
      if (data.getTime() < agora - 5 * 60 * 1000) throw new Error('A data de retirada não pode estar no passado.');
      if (data.getTime() > agora + MAX_DIAS_ANTECEDENCIA * 24 * 3600 * 1000) {
        throw new Error(`A retirada deve ser agendada em até ${MAX_DIAS_ANTECEDENCIA} dias.`);
      }
      return true;
    }),
];

const idOnlyRules = [idRule];

const listRules = [
  query('status').optional().isIn(Reserva.STATUS).withMessage(`Status deve ser um de: ${Reserva.STATUS.join(', ')}.`),
];

module.exports = { createRules, idOnlyRules, listRules };
