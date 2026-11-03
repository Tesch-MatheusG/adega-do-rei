const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabela "reservas": um pedido de reserva de um cliente (RF01-RF06, RF12).
// Ciclo de vida: pendente -> pronta -> retirada
//                pendente/pronta -> cancelada (cliente ou admin)
//                pendente/pronta -> expirada (automático, RN03)
const STATUS = ['pendente', 'pronta', 'retirada', 'expirada', 'cancelada'];

const Reserva = sequelize.define(
  'Reserva',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    usuarioId: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM(...STATUS), allowNull: false, defaultValue: 'pendente' },
    // Horário combinado para retirar. Se o cliente não informar, vale "agora".
    retiradaPrevista: { type: DataTypes.DATE, allowNull: false },
    // retiradaPrevista + 24h (RN03). Passou disso sem retirar, a reserva expira.
    expiraEm: { type: DataTypes.DATE, allowNull: false },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  },
  { tableName: 'reservas' }
);

// MySQL devolve DECIMAL como texto; convertemos para número no JSON.
Reserva.prototype.toJSON = function toJSON() {
  const dados = { ...this.get() };
  dados.total = Number(dados.total);
  return dados;
};

Reserva.STATUS = STATUS;
module.exports = Reserva;
