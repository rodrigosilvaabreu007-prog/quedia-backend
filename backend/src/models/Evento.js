const mongoose = require('mongoose');

const EventoSchema = new mongoose.Schema({
    nome: String,
    data: String,
    cidade: String,
    estado: String,
    local: String,
    preco: Number,
    gratuito: Boolean,
    imagem: String,
    organizador_id: Number,
    interessados: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Evento', EventoSchema);