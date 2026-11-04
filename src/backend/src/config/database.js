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
  // O certificado pode vir de duas formas (a que for mais fácil na hospedagem):
  //  - DB_SSL_CA      : o TEXTO do ca.pem colado direto na variável (ideal no Render,
  //                     que não tem como "subir" arquivos fora do Git);
  //  - DB_SSL_CA_PATH : caminho de um arquivo ca.pem (ideal na sua máquina).
  // Sem nenhum dos dois, a conexão ainda é criptografada, só não valida a cadeia.
  const caTexto = process.env.DB_SSL_CA && process.env.DB_SSL_CA.replace(/\\n/g, '\n');
  const caArquivo = process.env.DB_SSL_CA_PATH && fs.readFileSync(process.env.DB_SSL_CA_PATH);
  const ca = caTexto || caArquivo || undefined;
  dialectOptions.ssl = { rejectUnauthorized: Boolean(ca), ca };
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
