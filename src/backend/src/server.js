require('dotenv').config({ quiet: true });
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Conectado ao MySQL.');

    // Cria/atualiza as tabelas a partir dos Models (suficiente para o PI)
    await sequelize.sync();

    app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
  } catch (err) {
    console.error('Falha ao iniciar:', err.message);
    process.exit(1);
  }
}

start();
