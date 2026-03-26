const mongoose = require('mongoose');

const connectDB = async () => {
    // Se já estiver conectado, não faz nada
    if (mongoose.connection.readyState === 1) return;

    try {
        console.log("⏳ Forçando conexão com MongoDB...");
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 15000, // Dá 15s pro Atlas responder
            socketTimeoutMS: 45000,
            family: 4 
        });
        console.log("✅ Conexão estabelecida com sucesso!");
    } catch (err) {
        console.error("❌ Falha crítica na conexão:", err.message);
        throw err;
    }
};

module.exports = connectDB;