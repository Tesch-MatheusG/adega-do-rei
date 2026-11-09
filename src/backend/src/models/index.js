const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const StockMovement = require('./StockMovement');
const Reserva = require('./Reserva');
const ReservaItem = require('./ReservaItem');
const Categoria = require('./Categoria');
const ProdutoImagem = require('./ProdutoImagem');

Product.hasMany(StockMovement, { foreignKey: 'produtoId', as: 'movimentacoes' });
StockMovement.belongsTo(Product, { foreignKey: 'produtoId' });

Product.hasOne(ProdutoImagem, { foreignKey: 'produtoId', as: 'imagem' });
ProdutoImagem.belongsTo(Product, { foreignKey: 'produtoId' });

User.hasMany(Reserva, { foreignKey: 'usuarioId', as: 'reservas' });
Reserva.belongsTo(User, { foreignKey: 'usuarioId', as: 'usuario' });

Reserva.hasMany(ReservaItem, { foreignKey: 'reservaId', as: 'itens' });
ReservaItem.belongsTo(Reserva, { foreignKey: 'reservaId' });

Product.hasMany(ReservaItem, { foreignKey: 'produtoId' });
ReservaItem.belongsTo(Product, { foreignKey: 'produtoId', as: 'produto' });

module.exports = { sequelize, User, Product, StockMovement, Reserva, ReservaItem, Categoria, ProdutoImagem };
