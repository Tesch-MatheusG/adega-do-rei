const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabela "produto_imagens": a foto de cada produto, guardada no próprio banco (MySQL na Aiven).
// Fica separada de "produtos" para as listagens do catálogo não carregarem os bytes das imagens,
// e porque o disco do Render (plano gratuito) é apagado a cada deploy — o banco não.
const ProdutoImagem = sequelize.define(
  'ProdutoImagem',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    produtoId: { type: DataTypes.INTEGER, allowNull: false, unique: true }, // 1 foto por produto
    tipo: { type: DataTypes.STRING(30), allowNull: false }, // image/jpeg | image/png | image/webp
    tamanho: { type: DataTypes.INTEGER, allowNull: false }, // bytes
    dados: { type: DataTypes.BLOB('medium'), allowNull: false }, // até 16 MB (o limite da API é 2 MB)
  },
  { tableName: 'produto_imagens' }
);

module.exports = ProdutoImagem;
