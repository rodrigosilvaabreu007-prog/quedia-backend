const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const connectDB = require(path.join(__dirname, 'db')); // Importa sua conexão do db.js
require('dotenv').config();

// Função para registrar usuário (MONGODB)
async function registrarUsuario(dados) {
    const db = await connectDB();
    if (!db) throw new Error("Não foi possível conectar ao banco de dados.");

    const { nome, email, senha, estado, cidade, preferencias } = dados;

    // Criptografa a senha
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const novoUsuario = {
        nome,
        email,
        senha: senhaCriptografada,
        estado,
        cidade,
        preferencias: preferencias || [],
        data_cadastro: new Date()
    };

    const resultado = await db.collection('usuarios').insertOne(novoUsuario);
    return resultado.insertedId;
}

// Função para autenticar usuário (MONGODB)
async function autenticarUsuario(email, senha) {
    const db = await connectDB();
    if (!db) throw new Error("Não foi possível conectar ao banco de dados.");

    // Busca o usuário pelo e-mail
    const usuario = await db.collection('usuarios').findOne({ email });
    
    if (!usuario) {
        console.log("❌ Usuário não encontrado:", email);
        return null;
    }

    // Compara a senha digitada com a criptografada
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
        console.log("❌ Senha incorreta para:", email);
        return null;
    }

    // Gerar token JWT
    const token = jwt.sign(
        { id: usuario._id, email: usuario.email }, 
        process.env.JWT_SECRET || 'secret_key_fixa', 
        { expiresIn: '2h' }
    );

    // Remove a senha do objeto antes de enviar para o frontend por segurança
    delete usuario.senha;
    
    return { usuario, token };
}

module.exports = {
    registrarUsuario,
    autenticarUsuario
};