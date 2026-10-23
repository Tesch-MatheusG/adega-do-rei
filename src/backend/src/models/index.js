const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');

module.exports = { sequelize, User, Product };
