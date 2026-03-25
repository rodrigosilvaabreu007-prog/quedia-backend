const mongoose = require('mongoose');

const EventoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    descricao: { type: String, required: true },
    cidade: { type: String, required: true },
    estado: { type: String, required: true },
    
    // Padronizei como 'local'. 
    // No próximo passo, vamos garantir que o Frontend envie 'local' também.
    local: { type: String, required: true }, 
    
    data: { type: String, required: true },
    horario: { type: String, required: true },
    categoria: { type: String, default: "Outros" },
    subcategorias: { type: [String], default: [] },
    
    gratuito: { type: Boolean, default: false },
    preco: { type: Number, default: 0 },
    
    // Array de strings para as URLs do Cloudinary
    imagens: { type: [String], default: [] }, 
    
    // Usando String para aceitar qualquer ID ou o "sistema" sem quebrar o banco
    organizador_id: { type: String, default: "sistema" }, 
    
    criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Evento', EventoSchema);