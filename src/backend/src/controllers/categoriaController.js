const { fn, col, where: sqlWhere } = require('sequelize');
const { Categoria } = require('../models');

// GET /api/categorias   (público: o catálogo e o formulário do admin usam a mesma lista)
async function listar(req, res) {
  try {
    const categorias = await Categoria.findAll({ order: [['nome', 'ASC']] });
    return res.json(categorias);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao listar categorias.' });
  }
}

// POST /api/categorias   (admin)
async function criar(req, res) {
  try {
    const { nome } = req.body;

    // Duplicidade ignorando maiúsculas/minúsculas (não depende da collation do banco)
    const existente = await Categoria.findOne({ where: sqlWhere(fn('LOWER', col('nome')), nome.toLowerCase()) });
    if (existente) return res.status(409).json({ erro: `A categoria "${existente.nome}" já existe.` });

    const categoria = await Categoria.create({ nome });
    return res.status(201).json(categoria);
  } catch (err) {
    // Duas requisições juntas, ou "Água" x "Agua" no MySQL: o índice único barra.
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ erro: 'Essa categoria já existe.' });
    }
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao cadastrar categoria.' });
  }
}

module.exports = { listar, criar };
