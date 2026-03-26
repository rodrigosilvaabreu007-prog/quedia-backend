require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db'); 
const routes = require('./routes'); 

const app = express();

// --- MIDDLEWARES ---

// Configuração de CORS Robusta
app.use(cors({
  origin: '*', // Permite qualquer site acessar (ideal para resolver o erro de cara)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Log de requisições (ajuda a ver no gcloud logs se o clique chegou no server)
app.use((req, res, next) => {
  console.log(`📡 Recebido: ${req.method} ${req.url}`);
  next();
});

// --- ROTAS ---
app.use('/api', routes);

app.get('/', (req, res) => {
  res.status(200).send('🚀 API QUE DIA - ONLINE');
});

const PORT = process.env.PORT || 8080;

// --- INICIALIZAÇÃO ---
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  conectarAoBanco();
});

async function conectarAoBanco() {
  try {
    console.log("⏳ Tentando conectar ao MongoDB...");
    await connectDB();
    console.log("✅ MongoDB Conectado com Sucesso!");
  } catch (err) {
    console.error("❌ Erro ao conectar no MongoDB:", err.message);
  }
}