const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabela "movimentacoes_estoque": histórico de TODA alteração de saldo (RN06 / RF13).
// Cada linha guarda o saldo antes e depois, permitindo auditar qualquer divergência.
const StockMovement = sequelize.define(
  'StockMovement',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    produtoId: { type: DataTypes.INTEGER, allowNull: false },
    usuarioId: { type: DataTypes.INTEGER, allowNull: true },
    tipo: { type: DataTypes.ENUM('entrada', 'saida', 'reserva', 'ajuste'), allowNull: false },
    quantidade: { type: DataTypes.INTEGER, allowNull: false },
    saldoAnterior: { type: DataTypes.INTEGER, allowNull: false },
    saldoPosterior: { type: DataTypes.INTEGER, allowNull: false },
    motivo: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: 'movimentacoes_estoque' }
);

module.exports = StockMovement;
