const express = require('express');
const cors = require('cors');
const app = express();
const apiRoutes = require('./routes');

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (req, res) => {
  res.send('🚀 API QUE DIA - ONLINE');
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