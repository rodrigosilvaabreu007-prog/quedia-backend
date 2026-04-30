const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('🚀 API QUE DIA - ONLINE');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 8080;
console.log(`🚀 Iniciando servidor na porta ${PORT}...`);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Escutando em 0.0.0.0:${PORT}`);
});