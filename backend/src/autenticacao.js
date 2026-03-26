const bcrypt = require('bcryptjs'); // ✅ Trocado para evitar erro no Build do Cloud Run
const jwt = require('jsonwebtoken');
const { connectDB, getDatabase } = require('./db');
require('dotenv').config();

// Função para registrar usuário (MONGODB)
async function registrarUsuario(dados) {
    await connectDB();
    const db = await getDatabase();
    if (!db) throw new Error("Não foi possível conectar ao banco de dados.");

    const { nome, email, senha, estado, cidade, preferencias } = dados;

    // Criptografa a senha (o funcionamento do bcryptjs é idêntico)
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

    // Note: Se você estiver usando Mongoose, o comando seria novoUsuario.save()
    // Como você está usando a coleção direto (Native Driver), mantive seu insertOne
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

    // Remove a senha do objeto antes de enviar por segurança
    const usuarioSemSenha = { ...usuario };
    delete usuarioSemSenha.senha;
    
    return { usuario: usuarioSemSenha, token };
}

module.exports = {
    registrarUsuario,
    autenticarUsuario
};