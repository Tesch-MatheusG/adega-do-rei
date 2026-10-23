const { validationResult } = require('express-validator');

// Lê o resultado das regras do express-validator e devolve 400 se houver erro
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      erro: 'Dados inválidos.',
      detalhes: errors.array().map((e) => ({ campo: e.path, mensagem: e.msg })),
    });
  }
  return next();
}

module.exports = validate;
