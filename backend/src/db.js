const mongoose = require('mongoose');

async function connectDB() {
  // Se já estiver conectado, não tenta de novo
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection.db;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ ERRO: Variável MONGO_URI não definida!");
    throw new Error("MONGO_URI is missing");
  }

  try {
    // Configurações para evitar timeout no Cloud Run
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10 segundos para achar o banco
      socketTimeoutMS: 45000,         // 45 segundos para operações longas
    });

    console.log("✅ Mongoose conectado com sucesso ao MongoDB!");
    return mongoose.connection.db;
  } catch (err) {
    console.error("❌ Erro fatal na conexão Mongoose:", err.message);
    throw err;
  }
}

module.exports = connectDB;