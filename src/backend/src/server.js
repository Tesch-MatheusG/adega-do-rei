require('dotenv').config({ quiet: true });
const app = require('./app');
const { sequelize } = require('./models');
const { iniciarAgendadorExpiracao } = require('./services/reservaService');
const { sincronizarCategorias } = require('./services/categoriaService');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Conectado ao MySQL.');

    // Cria/atualiza as tabelas a partir dos Models (suficiente para o PI)
    await sequelize.sync();

    // Garante que as categorias dos produtos já existentes estejam na lista oficial
    const novas = await sincronizarCategorias();
    if (novas > 0) console.log(`Categorias cadastradas automaticamente: ${novas}.`);

    app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));

    // Expira reservas não retiradas em 24h (RN03). Intervalo configurável por .env.
    iniciarAgendadorExpiracao(Number(process.env.EXPIRACAO_INTERVALO_MIN) || 10);
  } catch (err) {
    console.error('Falha ao iniciar:', err.message);
    process.exit(1);
  }
}

start();
