const bcrypt = require('bcryptjs'); // ✅ Trocado para evitar erro no Build do Cloud Run
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
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

    // Normalizar ID e gerar token JWT
    const usuarioIdStr = String(usuario._id);
    const token = jwt.sign(
        { id: usuarioIdStr, email: usuario.email }, 
        process.env.JWT_SECRET || 'secret_key_fixa', 
        { expiresIn: '2h' }
    );

    // Remove a senha do objeto antes de enviar por segurança e normaliza IDs
    const usuarioSemSenha = { ...usuario, _id: usuarioIdStr, id: usuarioIdStr };
    delete usuarioSemSenha.senha;
    
    return { usuario: usuarioSemSenha, token };
}

// Função para buscar usuário por ID (MONGODB)
async function buscarUsuarioPorId(id) {
    const db = await connectDB();
    if (!db) throw new Error("Não foi possível conectar ao banco de dados.");

    // Busca o usuário pelo ID
    try {
        if (!ObjectId.isValid(id)) {
            return null;
        }

        const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(id) });
    
        if (!usuario) {
            return null;
        }

        // Remove a senha do objeto antes de enviar por segurança e normaliza IDs
        const usuarioSemSenha = { ...usuario, _id: String(usuario._id), id: String(usuario._id) };
        delete usuarioSemSenha.senha;
        
        return usuarioSemSenha;
    } catch (err) {
        console.error('Erro ao buscar usuário por ID:', err.message);
        throw err;
    }
}

// Função para atualizar usuário (MONGODB)
async function atualizarUsuario(id, dados) {
    const db = await connectDB();
    if (!db) throw new Error("Não foi possível conectar ao banco de dados.");

    const { nome, email, estado, cidade, preferencias } = dados;

    try {
        const resultado = await db.collection('usuarios').updateOne(
            { _id: new ObjectId(id) },
            { $set: { nome, email, estado, cidade, preferencias } }
        );

        if (resultado.matchedCount === 0) {
            return null;
        }

        // Retorna o usuário atualizado (com ID normalizado)
        const usuarioAtualizado = await buscarUsuarioPorId(id);
        return usuarioAtualizado;
    } catch (err) {
        console.error('Erro ao atualizar usuário:', err.message);
        throw err;
    }
}

// Função para deletar usuário (MONGODB)
async function deletarUsuario(id) {
    const db = await connectDB();
    if (!db) throw new Error("Não foi possível conectar ao banco de dados.");

    const resultado = await db.collection('usuarios').deleteOne(
        { _id: new ObjectId(id) }
    );

    return resultado.deletedCount > 0;
}

module.exports = {
    registrarUsuario,
    autenticarUsuario,
    buscarUsuarioPorId,
    atualizarUsuario,
    deletarUsuario
};