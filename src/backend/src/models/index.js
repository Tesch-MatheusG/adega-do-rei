const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const StockMovement = require('./StockMovement');

Product.hasMany(StockMovement, { foreignKey: 'produtoId', as: 'movimentacoes' });
StockMovement.belongsTo(Product, { foreignKey: 'produtoId' });

module.exports = { sequelize, User, Product, StockMovement };
