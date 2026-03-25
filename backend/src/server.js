require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db'); 

const app = express();

// --- MIDDLEWARES ---
app.use(cors()); // Libera o acesso para o seu frontend
app.use(express.json()); // Essencial para ler o JSON que o cadastro envia
app.use(express.urlencoded({ extended: true })); 

// --- ROTAS ---
// Importa o arquivo routes.js que corrigimos
const routes = require('./routes'); 

// Define que TODAS as rotas do arquivo routes começam com /api
// Ex: seu-site.com/api/cadastro
app.use('/api', routes);

// Rota de teste para ver se o servidor acordou
app.get('/', (req, res) => {
  res.status(200).send('🚀 API QUE DIA - ONLINE E OPERANTE');
});

// --- PORTA (CONFIGURAÇÃO PARA CLOUD RUN) ---
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n---------------------------------`);
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  
  // Conecta no Banco de Dados
  connectDB().then(db => {
    if (db) {
      console.log("✅ MongoDB Conectado com sucesso!");
    } else {
      console.log("⚠️  Atenção: Banco não conectou. Cheque o seu .env");
    }
  }).catch(err => {
    console.error("❌ Erro ao conectar no banco:", err);
  });
  console.log(`---------------------------------\n`);
});