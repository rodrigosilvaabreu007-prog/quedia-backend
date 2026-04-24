require('dotenv').config();
const mongoose = require('mongoose');

let isConnected = false; // Flag para evitar reconexões desnecessárias

async function connectDB() {
    console.log('🔌 Iniciando connectDB...');
    if (isConnected && mongoose.connection.readyState === 1) {
        console.log("✅ Já conectado ao MongoDB via Mongoose!");
        return mongoose.connection.db;
    }

        if (!process.env.MONGO_URI || typeof process.env.MONGO_URI !== 'string') {
        throw new Error('MONGO_URI não está definida ou é inválida');
    }

    let mongoUri = process.env.MONGO_URI.trim();
    const mongoOptions = process.env.MONGO_URI_OPTIONS && typeof process.env.MONGO_URI_OPTIONS === 'string'
        ? process.env.MONGO_URI_OPTIONS.trim()
        : '';

    if (mongoOptions) {
        mongoUri += mongoUri.includes('?') ? `&${mongoOptions}` : `?${mongoOptions}`;
    }

    try {
        // Conecta usando Mongoose (compatível com o modelo eventos.js)
        await mongoose.connect(mongoUri, {
            // Opções para ambientes serverless
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            bufferCommands: true,
            maxPoolSize: 10
        });

        // Aguardar a conexão estar realmente pronta
        await new Promise((resolve) => {
            const checkReady = () => {
                if (mongoose.connection.readyState === 1) {
                    resolve();
                } else {
                    setTimeout(checkReady, 100);
                }
            };
            checkReady();
        });

        isConnected = true;
        console.log("✅ Conexão com MongoDB estabelecida via Mongoose!");
        return mongoose.connection.db;
    } catch (err) {
        console.error("❌ Erro ao conectar no MongoDB:", err.message);
        isConnected = false;
        throw err;
    }
}

async function getDatabase() {
    if (mongoose.connection.readyState !== 1) {
        await connectDB();
    }

    if (!mongoose.connection.db) {
        throw new Error('Banco de dados MongoDB não está disponível (mongoose.connection.db é null)');
    }

    return mongoose.connection.db;
}

// Evento para reconectar se a conexão cair
mongoose.connection.on('disconnected', () => {
    console.log('🔄 Conexão com MongoDB perdida. Tentando reconectar...');
    isConnected = false;
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Erro na conexão MongoDB:', err);
    isConnected = false;
});

module.exports = {
    connectDB,
    getDatabase,
    isConnected: () => isConnected
};