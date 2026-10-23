const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();

// CORS_ORIGIN vem do .env (local) ou das variáveis de ambiente do Render (produção).
// Aceita uma URL única ou várias separadas por vírgula — útil para liberar ao mesmo
// tempo o frontend local (localhost:5173) e o frontend publicado.
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origem) => origem.trim())
  : '*';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/', (req, res) => res.json({ api: 'Adega do Rei', status: 'online' }));
app.use('/api/auth', authRoutes);
app.use('/api/produtos', productRoutes);

// Rota inexistente
app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// JSON malformado no body e demais erros
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }
  console.error(err);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
});

module.exports = app;
