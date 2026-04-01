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

// Função para adicionar interesse (se não existir)
async function adicionarInteresse(usuario_id, evento_id) {
    if (mongoose.connection.readyState !== 1) {
        throw new Error("Conexão com MongoDB não está pronta.");
    }

    usuario_id = String(usuario_id);
    evento_id = String(evento_id);

    try {
        const interesse = new Interesse({ usuario_id, evento_id });
        await interesse.save();
        return interesse;
    } catch (err) {
        if (err.code === 11000) { // Duplicata
            return null; // Já existe
        }
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

    const resultado = await Interesse.deleteOne({ usuario_id, evento_id });
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
    const count = await Interesse.countDocuments({ evento_id });
    return count;
}

// Função para listar eventos que usuário tem interesse
async function listarInteressesUsuario(usuario_id) {
    if (mongoose.connection.readyState !== 1) {
        throw new Error("Conexão com MongoDB não está pronta.");
    }

    usuario_id = String(usuario_id);
    const interesses = await Interesse.find({ usuario_id }, { evento_id: 1, _id: 0 });
    return interesses.map(i => i.evento_id);
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

module.exports = {
    adicionarInteresse,
    removerInteresse,
    usuarioTemInteresse,
    contarInteresses,
    listarInteressesUsuario,
    removerInteressesPorUsuario
};