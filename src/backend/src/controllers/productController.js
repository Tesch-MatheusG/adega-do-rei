const { fn, col, where: sqlWhere, Op } = require('sequelize');
const { Product, StockMovement, sequelize } = require('../models');
const { normalizeCategoria } = require('../utils/normalize');

// GET /api/produtos?categoria=Cerveja   (público)
async function listar(req, res) {
  try {
    const where = { ativo: true };
    if (req.query.categoria) where.categoria = normalizeCategoria(req.query.categoria);

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
// Produto + movimentação do estoque inicial gravados na MESMA transação (RN06, RNF10)
async function criar(req, res) {
  try {
    const { nome, categoria, preco, volumeMl, descricao, estoque } = req.body;

    // Duplicidade ignorando maiúsculas/minúsculas (não depende da collation do banco)
    const duplicado = await Product.findOne({
      where: {
        [Op.and]: [
          sqlWhere(fn('LOWER', col('nome')), nome.toLowerCase()),
          { volumeMl: volumeMl ?? null, ativo: true },
        ],
      },
    });
    if (duplicado) {
      return res.status(409).json({ erro: 'Já existe um produto com esse nome e volume.' });
    }

    const produto = await sequelize.transaction(async (t) => {
      const novo = await Product.create(
        { nome, categoria, preco, volumeMl, descricao, estoque: estoque ?? 0 },
        { transaction: t }
      );
      if (novo.estoque > 0) {
        await StockMovement.create(
          {
            produtoId: novo.id, usuarioId: req.user.id, tipo: 'entrada',
            quantidade: novo.estoque, saldoAnterior: 0, saldoPosterior: novo.estoque,
            motivo: 'Estoque inicial',
          },
          { transaction: t }
        );
      }
      return novo;
    });

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

    // Só atualiza campos permitidos e realmente enviados (estoque muda pela rota de entrada).
    // Campo ausente = mantém o valor atual; evita gravar undefined/NULL por engano.
    const campos = {};
    for (const campo of ['nome', 'categoria', 'preco', 'volumeMl', 'descricao']) {
      if (req.body[campo] !== undefined) campos[campo] = req.body[campo];
    }
    await produto.update(campos);
    return res.json(produto);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao atualizar produto.' });
  }
}

// PATCH /api/produtos/:id/estoque   (admin) - entrada de mercadoria
// Saldo e histórico mudam juntos: se um falhar, nenhum é gravado (RN06, RNF10)
async function entradaEstoque(req, res) {
  try {
    const { quantidade, motivo } = req.body;

    const produto = await sequelize.transaction(async (t) => {
      const atual = await Product.findOne({
        where: { id: req.params.id, ativo: true },
        transaction: t,
        lock: t.LOCK.UPDATE, // trava a linha: dois acessos simultâneos não se sobrepõem
      });
      if (!atual) return null;

      const saldoAnterior = atual.estoque;
      await atual.increment('estoque', { by: quantidade, transaction: t });
      await StockMovement.create(
        {
          produtoId: atual.id, usuarioId: req.user.id, tipo: 'entrada', quantidade,
          saldoAnterior, saldoPosterior: saldoAnterior + quantidade,
          motivo: motivo || 'Entrada de mercadoria',
        },
        { transaction: t }
      );
      await atual.reload({ transaction: t });
      return atual;
    });

    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });
    return res.json({ mensagem: 'Entrada registrada.', produto });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao registrar entrada.' });
  }
}

// GET /api/produtos/:id/movimentacoes   (admin) - histórico do estoque
async function movimentacoes(req, res) {
  try {
    const produto = await Product.findOne({ where: { id: req.params.id, ativo: true } });
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

    const historico = await StockMovement.findAll({
      where: { produtoId: produto.id },
      order: [['id', 'DESC']],
    });
    return res.json(historico);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao listar movimentações.' });
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

module.exports = { listar, buscar, criar, atualizar, entradaEstoque, movimentacoes, remover };
