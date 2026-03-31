const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/', (req, res) => {
  res.send('🚀 API QUE DIA - ONLINE');
});

app.get('/api/eventos', (req, res) => {
  res.json([
    {
      _id: '1',
      nome: 'Evento de Teste',
      categoria: 'Teste',
      data: '2024-12-31',
      horario: '20:00',
      cidade: 'São Paulo',
      estado: 'SP',
      preco: '50.00',
      descricao: 'Evento para testar o deploy',
      gratuito: false
    }
  ]);
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});