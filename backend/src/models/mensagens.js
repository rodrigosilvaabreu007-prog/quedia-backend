const mongoose = require('mongoose');

// Schema para Mensagens de Contato
const MensagemSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true },
    mensagem: { type: String, required: true },
    resposta: { type: String, default: "" }, // Resposta do admin
    respondida: { type: Boolean, default: false },
    criadoEm: { type: Date, default: Date.now },
    respondidoEm: { type: Date, default: null }
}, {
    bufferCommands: false
});

const Mensagem = mongoose.models.Mensagem || mongoose.model('Mensagem', MensagemSchema);

module.exports = Mensagem;