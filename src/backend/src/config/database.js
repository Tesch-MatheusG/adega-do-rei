require('dotenv').config({ quiet: true });
const fs = require('fs');
const { Sequelize } = require('sequelize');

// DB_SSL=true liga a conexão criptografada exigida por bancos gerenciados
// na nuvem (ex: Aiven). Em desenvolvimento local (MySQL do seu computador),
// deixe DB_SSL de fora do .env ou como "false" — nada muda.
const sslEnabled = String(process.env.DB_SSL).toLowerCase() === 'true';

const dialectOptions = {};
if (sslEnabled) {
  // A Aiven disponibiliza um certificado CA (ca.pem) no painel do serviço.
  // Baixe esse arquivo, salve-o no projeto (fora do Git) e aponte
  // DB_SSL_CA_PATH para ele — assim a conexão valida o certificado de verdade.
  // Sem esse arquivo, a conexão ainda é criptografada, só sem validar a
  // cadeia do certificado (aceitável para desenvolvimento/entrega da disciplina).
  const caPath = process.env.DB_SSL_CA_PATH;
  dialectOptions.ssl = {
    rejectUnauthorized: Boolean(caPath),
    ca: caPath ? fs.readFileSync(caPath) : undefined,
  };
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    dialectOptions,
    logging: false,
  }
);

module.exports = sequelize;
