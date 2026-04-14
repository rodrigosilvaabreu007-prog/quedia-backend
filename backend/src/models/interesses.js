const mongoose = require('mongoose');

// Schema para Interesses
const InteresseSchema = new mongoose.Schema({
    usuario_id: { type: String, required: true },
    evento_id: { type: String, required: true },
    criadoEm: { type: Date, default: Date.now }
}, {
    bufferCommands: false
});

// Índice composto para evitar duplicatas
InteresseSchema.index({ usuario_id: 1, evento_id: 1 }, { unique: true });

const Interesse = mongoose.models.Interesse || mongoose.model('Interesse', InteresseSchema);

// Função para adicionar interesse (toggle on)
async function adicionarInteresse(usuario_id, evento_id) {
    if (mongoose.connection.readyState !== 1) {
        throw new Error("Conexão com MongoDB não está pronta.");
    }

    usuario_id = String(usuario_id);
    evento_id = String(evento_id);

    try {
        await Interesse.updateOne(
            { usuario_id, evento_id },
            { $setOnInsert: { usuario_id, evento_id, criadoEm: new Date() } },
            { upsert: true }
        );
        return true;
    } catch (err) {
        throw err;
    }
}

// Função para remover interesse
async function removerInteresse(usuario_id, evento_id) {
    if (mongoose.connection.readyState !== 1) {
        throw new Error("Conexão com MongoDB não está pronta.");
    }

    usuario_id = String(usuario_id);
    evento_id = String(evento_id);

    const resultado = await Interesse.deleteMany({ usuario_id, evento_id });
    return resultado.deletedCount > 0;
}

// Função para verificar se usuário tem interesse no evento
async function usuarioTemInteresse(usuario_id, evento_id) {
    if (mongoose.connection.readyState !== 1) {
        throw new Error("Conexão com MongoDB não está pronta.");
    }

    usuario_id = String(usuario_id);
    evento_id = String(evento_id);

    const interesse = await Interesse.findOne({ usuario_id, evento_id });
    return !!interesse;
}

// Função para contar interesses de um evento
async function contarInteresses(evento_id) {
    if (mongoose.connection.readyState !== 1) {
        throw new Error("Conexão com MongoDB não está pronta.");
    }

    evento_id = String(evento_id);
    const usuariosUnicos = await Interesse.distinct('usuario_id', { evento_id });
    return Array.isArray(usuariosUnicos) ? usuariosUnicos.length : 0;
}

// Função para listar eventos que usuário tem interesse
async function listarInteressesUsuario(usuario_id) {
    if (mongoose.connection.readyState !== 1) {
        throw new Error("Conexão com MongoDB não está pronta.");
    }

    usuario_id = String(usuario_id);
    const interesses = await Interesse.find({ usuario_id }, { evento_id: 1, _id: 0 }).lean();
    return Array.from(new Set(interesses.map(i => String(i.evento_id))));
}

// Função para remover todos os interesses de um usuário (quando conta é excluída)
async function removerInteressesPorUsuario(usuario_id) {
    if (mongoose.connection.readyState !== 1) {
        throw new Error("Conexão com MongoDB não está pronta.");
    }

    usuario_id = String(usuario_id);
    const resultado = await Interesse.deleteMany({ usuario_id });
    return resultado.deletedCount;
}

// Função para listar IDs de usuários que tem interesse em um evento
async function listarInteressesEvento(evento_id) {
    if (mongoose.connection.readyState !== 1) {
        throw new Error("Conexão com MongoDB não está pronta.");
    }

    evento_id = String(evento_id);
    const interesses = await Interesse.find({ evento_id }, { usuario_id: 1, _id: 0 }).lean();
    return Array.from(new Set(interesses.map(i => String(i.usuario_id))));
}

module.exports = {
    adicionarInteresse,
    removerInteresse,
    usuarioTemInteresse,
    contarInteresses,
    listarInteressesUsuario,
    removerInteressesPorUsuario,
    listarInteressesEvento
};