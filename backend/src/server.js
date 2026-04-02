require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const apiRoutes = require('./routes');
const { connectDB } = require('./db');
const mongoose = require('mongoose');

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (req, res) => {
  res.send('🚀 API QUE DIA - ONLINE');
});

app.get('/debug', async (req, res) => {
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});