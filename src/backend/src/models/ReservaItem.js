const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabela "reserva_itens": produtos de cada reserva.
// precoUnitario é uma "foto" do preço no momento da reserva: se o dono mudar o
// preço depois, reservas antigas continuam com o valor combinado.
const ReservaItem = sequelize.define(
  'ReservaItem',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    reservaId: { type: DataTypes.INTEGER, allowNull: false },
    produtoId: { type: DataTypes.INTEGER, allowNull: false },
    quantidade: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    precoUnitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  { tableName: 'reserva_itens' }
);

ReservaItem.prototype.toJSON = function toJSON() {
  const dados = { ...this.get() };
  dados.precoUnitario = Number(dados.precoUnitario);
  return dados;
};

module.exports = ReservaItem;
