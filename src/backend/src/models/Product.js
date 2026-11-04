const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabela "produtos": catálogo da adega com saldo de estoque
const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING(120), allowNull: false },
    categoria: { type: DataTypes.STRING(60), allowNull: false },
    preco: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    volumeMl: { type: DataTypes.INTEGER, allowNull: true },
    descricao: { type: DataTypes.TEXT, allowNull: true },
    estoque: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    // "Exclusão lógica": o produto some do catálogo, mas o histórico é mantido
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: 'produtos' }
);

// Transformação na saída: o MySQL devolve DECIMAL como texto ("89.90").
// Convertemos para número para o JSON bater com o tipo Produto do frontend.
Product.prototype.toJSON = function toJSON() {
  const dados = { ...this.get() };
  dados.preco = Number(dados.preco);
  return dados;
};

module.exports = Product;
