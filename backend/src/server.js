const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const app = express();

const mongoUri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : '';
const isFirebaseFunctions = !!process.env.FUNCTION_NAME || !!process.env.FUNCTION_TARGET || !!process.env.FUNCTION_SIGNATURE_TYPE || !!process.env.FIREBASE_CONFIG;
const isCloudRun = !!process.env.GCLOUD_PROJECT || !!process.env.GCP_PROJECT || !!process.env.GOOGLE_CLOUD_PROJECT || process.env.NODE_ENV === 'production';
const useMemoryBackend = !mongoUri && !isFirebaseFunctions && !isCloudRun;

// Importar dependências apenas quando necessário
let mongoose, connectDB;
if (!useMemoryBackend && mongoUri) {
  mongoose = require('mongoose');
  ({ connectDB } = require('./db'));
}

// Detectar modo do backend
let backendMode = 'MEMÓRIA';
if (isFirebaseFunctions || isCloudRun) {
  backendMode = 'FIRESTORE';
} else if (mongoUri) {
  backendMode = 'MONGODB';
}

console.log(`🔧 Modo do backend: ${backendMode}`);
console.log(`🔧 Firebase Functions: ${isFirebaseFunctions ? 'SIM' : 'NÃO'}`);
console.log(`🔧 Cloud Run: ${isCloudRun ? 'SIM' : 'NÃO'}`);
console.log(`🔧 MONGO_URI configurado: ${mongoUri ? 'SIM' : 'NÃO'}`);

let apiRoutes;
if (isFirebaseFunctions || isCloudRun) {
  apiRoutes = require('./routes-firestore');
} else if (mongoUri) {
  apiRoutes = require('./routes');
} else {
  apiRoutes = require('./routes-memory');
}

if (useMemoryBackend) {
  console.warn('⚠️ Nenhum banco persistente configurado. Iniciando backend em modo memória (não persistente).');
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Executando em MODO PRODUÇÃO SEM PERSISTÊNCIA. Dados não serão salvos!');
  }
}

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (req, res) => {
  res.send('🚀 API QUE DIA - ONLINE');
});

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/debug', async (req, res) => {
  if (useMemoryBackend) {
    return res.json({
      status: 'ok',
      backend: 'memory',
      connected: true,
      message: 'Rodando em modo memoria sem MONGO_URI configurado',
      hostname: require('os').hostname(),
      now: new Date().toISOString()
    });
  }

  if (isFirebaseFunctions || isCloudRun) {
    return res.json({
      status: 'ok',
      backend: 'firestore',
      readyState: 'n/a',
      connected: true,
      cloudRun: isCloudRun,
      project: process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || null,
      hostname: require('os').hostname(),
      now: new Date().toISOString()
    });
  }

  try {
    const db = await connectDB();
    return res.json({
      status: 'ok',
      backend: 'mongodb',
      mongoUri: process.env.MONGO_URI ? process.env.MONGO_URI.replace(/\?.*$/, '?...') : null,
      readyState: mongoose.connection.readyState,
      connected: mongoose.connection.readyState === 1,
      db: !!db,
      hostname: require('os').hostname(),
      now: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      erro: err.message,
      mongoUri: process.env.MONGO_URI ? process.env.MONGO_URI.replace(/\?.*$/, '?...') : null
    });
  }
});

// Uso do router de rotas API
if (isCloudRun) {
  app.use(apiRoutes);
  app.use('/api', apiRoutes);
} else if (isFirebaseFunctions) {
  app.use(apiRoutes);
} else {
  app.use('/api', apiRoutes);
}

app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

if (!isFirebaseFunctions) {
  const PORT = process.env.PORT || 8080;
  console.log(`🚀 Iniciando servidor na porta ${PORT}...`);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Escutando em 0.0.0.0:${PORT}`);
  });
} else {
  console.log('⚠️ Executando em modo Firebase Functions, não chamando app.listen().');
}

module.exports = app;