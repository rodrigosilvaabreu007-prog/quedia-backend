require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Configuração do CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK',
    mensagem: 'API EventHub funcionando!',
    versao: '1.0.0'
  });
});

// Rotas da API
const routes = require('./routes-sql');
app.use('/api', routes);

// 🚀 CONFIG CORRETA PRO CLOUD RUN
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Servidor rodando na porta ${PORT}`);
  console.log(`✓ Ambiente: ${process.env.NODE_ENV || 'development'}`);
});