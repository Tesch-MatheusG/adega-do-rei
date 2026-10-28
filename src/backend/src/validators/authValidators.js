const { body } = require('express-validator');
const { isValidCPF, isAdult } = require('../utils/cpf');
const { cleanText } = require('../utils/normalize');

const registerRules = [
  // cleanText: remove tags/espaços repetidos sem escapar apóstrofos (ex: D'Ávila)
  body('nome')
    .customSanitizer(cleanText)
    .notEmpty().withMessage('Nome é obrigatório.')
    .isLength({ min: 3, max: 100 }).withMessage('Nome deve ter de 3 a 100 caracteres.'),

  body('email')
    .trim()
    .isEmail().withMessage('E-mail inválido.')
    .normalizeEmail(),

  // Sanitização: remove pontos e traço (123.456.789-09 -> 12345678909)
  body('cpf')
    .customSanitizer((v) => String(v || '').replace(/\D/g, ''))
    .custom((v) => {
      if (!isValidCPF(v)) throw new Error('CPF inválido.');
      return true;
    }),

  body('dataNascimento')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Data inválida. Use o formato AAAA-MM-DD.')
    .isISO8601({ strict: true }).withMessage('Data inexistente no calendário.')
    .custom((v) => {
      if (!isAdult(v)) throw new Error('É necessário ter 18 anos ou mais.');
      return true;
    }),

  body('senha')
    .isLength({ min: 8 }).withMessage('A senha deve ter no mínimo 8 caracteres.')
    .matches(/[A-Za-z]/).withMessage('A senha deve conter ao menos uma letra.')
    .matches(/\d/).withMessage('A senha deve conter ao menos um número.'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('E-mail inválido.').normalizeEmail(),
  body('senha').notEmpty().withMessage('Senha é obrigatória.'),
];

module.exports = { registerRules, loginRules };
