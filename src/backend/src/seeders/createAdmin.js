// Uso: npm run seed:admin
// Cria o usuário administrador (dono da adega) a partir das variáveis do .env
require('dotenv').config({ quiet: true });
const bcrypt = require('bcrypt');
const { sequelize, User } = require('../models');

async function run() {
  await sequelize.sync();

  const email = process.env.ADMIN_EMAIL;
  const existente = await User.findOne({ where: { email } });
  if (existente) {
    console.log('Admin já existe:', email);
    return;
  }

  await User.create({
    nome: process.env.ADMIN_NOME || 'Administrador',
    email,
    cpf: '52998224725', // CPF de teste (válido, gerado para testes)
    dataNascimento: '1990-01-01',
    senha: await bcrypt.hash(process.env.ADMIN_SENHA, 10),
    role: 'admin',
  });
  console.log('Admin criado:', email);
}

run()
  .catch((e) => console.error('Erro:', e.message))
  .finally(() => sequelize.close());
