const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const app = express();

const mongoUri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : '';
const useMemoryBackend = !mongoUri;

// Importar dependências apenas quando necessário
let mongoose, connectDB;
if (!useMemoryBackend) {
  mongoose = require('mongoose');
  ({ connectDB } = require('./db'));
}

// Permitir modo memory em produção também (para testes e falhas de conexão)
console.log(`🔧 Modo do backend: ${useMemoryBackend ? 'MEMÓRIA' : 'MONGODB'}`);
console.log(`🔧 MONGO_URI configurado: ${mongoUri ? 'SIM' : 'NÃO'}`);

const apiRoutes = useMemoryBackend ? require('./routes-memory') : require('./routes');

if (useMemoryBackend) {
  console.warn('⚠️ MONGO_URI não configurado. Iniciando backend em modo memória (não persistente).');
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

  try {
    const db = await connectDB();
    return res.json({
      status: 'ok',
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
app.use('/api', apiRoutes);

app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

const PORT = process.env.PORT || 8080;
console.log(`🚀 Iniciando servidor na porta ${PORT}...`);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Escutando em 0.0.0.0:${PORT}`);
});