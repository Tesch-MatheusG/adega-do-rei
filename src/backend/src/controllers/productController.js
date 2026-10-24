const { Product } = require('../models');

// GET /api/produtos?categoria=Cerveja   (público)
async function listar(req, res) {
  try {
    const where = { ativo: true };
    if (req.query.categoria) where.categoria = req.query.categoria;

    const produtos = await Product.findAll({ where, order: [['nome', 'ASC']] });
    return res.json(produtos);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao listar produtos.' });
  }
}

// GET /api/produtos/:id   (público)
async function buscar(req, res) {
  try {
    const produto = await Product.findOne({ where: { id: req.params.id, ativo: true } });
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });
    return res.json(produto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}

// POST /api/produtos   (admin)
async function criar(req, res) {
  try {
    const { nome, categoria, preco, volumeMl, descricao, estoque } = req.body;
    const produto = await Product.create({ nome, categoria, preco, volumeMl, descricao, estoque });
    return res.status(201).json(produto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao cadastrar produto.' });
  }
}

// PUT /api/produtos/:id   (admin)
async function atualizar(req, res) {
  try {
    const produto = await Product.findOne({ where: { id: req.params.id, ativo: true } });
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

    // Só atualiza campos permitidos (estoque muda pela rota de entrada)
    const { nome, categoria, preco, volumeMl, descricao } = req.body;
    await produto.update({ nome, categoria, preco, volumeMl, descricao });
    return res.json(produto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao atualizar produto.' });
  }
}

// PATCH /api/produtos/:id/estoque   (admin) - entrada de mercadoria
async function entradaEstoque(req, res) {
  try {
    const produto = await Product.findOne({ where: { id: req.params.id, ativo: true } });
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

    await produto.increment('estoque', { by: req.body.quantidade });
    await produto.reload();
    return res.json({ mensagem: 'Entrada registrada.', produto });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao registrar entrada.' });
  }
}

// DELETE /api/produtos/:id   (admin) - exclusão lógica
async function remover(req, res) {
  try {
    const produto = await Product.findOne({ where: { id: req.params.id, ativo: true } });
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

    await produto.update({ ativo: false });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao remover produto.' });
  }
}

module.exports = { listar, buscar, criar, atualizar, entradaEstoque, remover };
