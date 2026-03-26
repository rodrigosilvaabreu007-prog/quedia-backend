require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db'); 
const routes = require('./routes'); 

const app = express();

// --- MIDDLEWARES ---
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// --- ROTAS ---
app.use('/api', routes);

app.get('/', (req, res) => {
  res.status(200).send('🚀 API QUE DIA - ONLINE E OPERANTE');
});

const PORT = process.env.PORT || 8080;

// --- INICIALIZAÇÃO "BLINDADA" ---
async function startServer() {
  try {
    console.log("⏳ Aguardando conexão com MongoDB...");
    
    // Força a conexão ANTES de subir o servidor
    await connectDB();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n---------------------------------`);
      console.log(`🚀 Servidor ON na porta ${PORT}`);
      console.log(`✅ Banco de Dados: PRONTO`);
      console.log(`---------------------------------\n`);
    });
  } catch (err) {
    console.error("\n❌ ERRO CRÍTICO AO INICIAR:");
    console.error(err.message);
    console.log("---------------------------------\n");
    // Se o banco não conectar, a gente não sobe o servidor "capengo"
    process.exit(1); 
  }
}

startServer();