const { connectDB } = require('./src/db');

async function testConnection() {
    try {
        console.log('Testando conexão...');
        await connectDB();
        console.log('Conexão OK');
    } catch (err) {
        console.error('Erro na conexão:', err.message);
    }
}

testConnection();