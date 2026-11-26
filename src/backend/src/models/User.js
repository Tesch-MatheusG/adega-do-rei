const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabela "usuarios": clientes (reservam produtos) e admin (dono da adega)
const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    cpf: { type: DataTypes.STRING(11), allowNull: false, unique: true },
    dataNascimento: { type: DataTypes.DATEONLY, allowNull: false },
    // bcrypt gera hash com 60 caracteres. Nunca guardamos a senha pura.
    senha: { type: DataTypes.STRING(60), allowNull: false },
    role: {
      type: DataTypes.ENUM('cliente', 'admin'),
      allowNull: false,
      defaultValue: 'cliente',
    },
  },
  {
    tableName: 'usuarios',
    // Por padrão, o hash da senha NUNCA sai nas consultas.
    defaultScope: { attributes: { exclude: ['senha'] } },
    // Scope usado somente no login, quando precisamos comparar o hash.
    scopes: { comSenha: { attributes: { exclude: [] } } },
  }
);

module.exports = User;
