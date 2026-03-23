const connectDB = require('./db');
connectDB();

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // 1. IMPORTANTE: Adicione o path
const app = express();

app.use(cors());
app.use(express.json());

// ✅ 2. A LINHA MÁGICA: Torna a pasta 'uploads' pública para o navegador ver as fotos
// Sem isso, o frontend recebe erro 404 ao tentar carregar a imagem
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.json({ status: 'OK', mensagem: 'API EventHub Rodando!' });
});

const routes = require('./routes-sql');
app.use('/api', routes);

app.use((req, res) => {
  console.log(`⚠️ Rota não encontrada: ${req.url}`);
  res.status(404).json({ erro: `Rota ${req.url} não encontrada no servidor.` });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Servidor online na porta ${PORT}`);
});

