const mongoose = require('mongoose');

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) return;

    try {
        console.log("⏳ Tentando conectar ao MongoDB...");
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // Desiste em 5s se o IP estiver bloqueado
            socketTimeoutMS: 45000,
            family: 4 
        });
        console.log("✅ MongoDB Conectado com Sucesso!");
    } catch (err) {
        console.error("❌ ERRO DE CONEXÃO NO BANCO:", err.message);
        // Não deixa o app rodar "cego" sem banco
        throw err; 
    }
};

module.exports = connectDB;