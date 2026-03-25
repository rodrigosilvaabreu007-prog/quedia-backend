const { MongoClient } = require('mongodb');
require('dotenv').config();

// Sua string de conexão confirmada
const uri = "mongodb+srv://quedia:WFxUmzAq8a8oeO3v@quedia.2w3rnxo.mongodb.net/quedia?retryWrites=true&w=majority";

// Criamos o cliente fora da função para reaproveitar a conexão
const client = new MongoClient(uri, {
    connectTimeoutMS: 10000, // 10 segundos de limite para conectar
    serverSelectionTimeoutMS: 10000
});

let db = null;

async function connectDB() {
    try {
        // Se já existir uma conexão ativa, retorna ela na hora
        if (db) return db;

        console.log("Tentando conectar ao MongoDB Atlas...");
        
        await client.connect();
        db = client.db('quedia'); // Nome do banco: quedia
        
        console.log("✅ Conectado ao MongoDB!");
        return db;
    } catch (err) {
        console.error("❌ Erro na conexão com o banco:", err.message);
        // Não deixamos o erro travar o servidor, retornamos null
        db = null; 
        return null;
    }
}

module.exports = connectDB;