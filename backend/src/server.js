require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db'); 

const app = express();

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos (segurança para legado)
const uploadPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadPath));

// Importando as rotas
const routes = require('./routes');
app.use('/api', routes);

// Rota de teste (Crucial para o Health Check do Google)
app.get('/', (req, res) => {
  res.status(200).send('API ONLINE');
});

const PORT = process.env.PORT || 8080;

// ✅ O SEGREDO: Abrimos a porta IMEDIATAMENTE.
// O Google Cloud Run verá que o app subiu em milissegundos.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor ouvindo na porta ${PORT}`);
  
  // Conectamos ao banco logo após o servidor estar de pé
  console.log("Iniciando conexão com o banco de dados em segundo plano...");
  connectDB().then(db => {
    if (db) {
      console.log("✅ Banco de dados conectado com sucesso!");
    } else {
      console.log("⚠️ Servidor rodando, mas banco falhou. Verifique as credenciais.");
    }
  }).catch(err => {
    console.error("❌ Erro na tentativa de conexão:", err);
  });
});