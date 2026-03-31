const express = require('express');
const app = express();

app.use(express.json());

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