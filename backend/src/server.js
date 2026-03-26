require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { connectDB, isConnected } = require('./db'); 
const routes = require('./routes'); 

const app = express();

// --- MIDDLEWARES ---

// Garantir que nao atenda rotas sem o DB pronto (proteção extra em serverless)
app.use(async (req, res, next) => {
  if (isConnected()) return next();

  try {
    await connectDB();
    return next();
  } catch (err) {
    console.error('❌ Solicitação recebida mas MongoDB não está pronto:', err.message);
    return res.status(503).json({ erro: 'Banco de dados indisponível. Tente novamente em alguns segundos.' });
  }
});


// Configuração de CORS Robusta e configurável
const frontendOrigins = process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*'
  ? process.env.CORS_ORIGIN.split(',').map((u) => u.trim()).filter(Boolean)
  : [
      'https://quedia.com.br',
      'https://quedia.web.app',
      'https://quedia.firebaseapp.com',
      'https://quedia-bd2fb.web.app',
      'http://localhost:3000',
      'http://127.0.0.1:5500'
    ];

const globalAllowAll = process.env.CORS_ORIGIN === '*';

app.use(cors({
  origin: function (origin, callback) {
    // Requisições sem origem (e.g. mobile, curl) não são bloqueadas
    if (!origin) return callback(null, true);

    if (globalAllowAll || frontendOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`🚫 CORS bloqueado para origem: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));
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