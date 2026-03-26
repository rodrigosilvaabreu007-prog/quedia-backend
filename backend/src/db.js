const mongoose = require('mongoose');

const connectDB = async () => {
  // Verifica se já está conectado (readyState 1 = conectado)
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI não definida nas variáveis de ambiente!");
  }

  try {
    console.log("⏳ Tentando conectar ao MongoDB Atlas...");

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000, // Aumentei para 15s pro Atlas respirar
      socketTimeoutMS: 45000,
      family: 4, // Mantém IPv4 que é mais estável no Google
      heartbeatFrequencyMS: 10000, // Manda um "oi" pro banco a cada 10s pra não cair
    });

    console.log("✅ MongoDB Conectado!");
    return mongoose.connection;
  } catch (err) {
    console.error("❌ Erro de conexão:", err.message);
    // Força o encerramento para o Cloud Run tentar de novo do zero
    throw err;
  }
};

module.exports = connectDB;