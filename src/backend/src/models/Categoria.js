const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabela "categorias": lista oficial de categorias que o admin escolhe ao cadastrar
// um produto. Evita variações de digitação ("Vinho", "vinho ", "Vinhos") no catálogo.
const Categoria = sequelize.define(
  'Categoria',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING(60), allowNull: false, unique: true },
  },
  { tableName: 'categorias' }
);

module.exports = Categoria;
