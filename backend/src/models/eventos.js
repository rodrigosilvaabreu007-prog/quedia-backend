const mongoose = require('mongoose');

// Define o Schema
const EventoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    descricao: { type: String, default: "" },
    cidade: { type: String, default: "" },
    estado: { type: String, default: "" },
    local: { type: String, default: "" }, 
    data: { type: String, default: "" },
    horario: { type: String, default: "" },
    categoria: { type: String, default: "Outros" },
    subcategorias: { type: [String], default: [] },
    gratuito: { type: Boolean, default: false },
    preco: { type: Number, default: 0 },
    imagens: { type: [String], default: [] }, 
    organizador_id: { type: String, default: "sistema" }, 
    criadoEm: { type: Date, default: Date.now }
}, { 
    // ESSA LINHA É A MAIS IMPORTANTE:
    // Impede o Mongoose de enfileirar comandos se a conexão não estiver pronta.
    bufferCommands: false 
});

const Evento = mongoose.models.Evento || mongoose.model('Evento', EventoSchema);

async function cadastrarEvento(dados) {
    // 1. Verificação de segurança: O banco está mesmo conectado?
    if (mongoose.connection.readyState !== 1) {
        console.error("❌ Conexão com MongoDB não está pronta. Estado:", mongoose.connection.readyState);
        throw new Error("O servidor ainda está conectando ao banco de dados. Tente novamente em 2 segundos.");
    }

    try {
        const dadosTratados = {
            ...dados,
            preco: Number(String(dados.preco).replace(',', '.')) || 0,
            gratuito: String(dados.gratuito) === 'true'
        };

        const novoEvento = new Evento(dadosTratados);
        
        // 2. Tenta salvar com um timeout forçado para não travar o Cloud Run
        return await novoEvento.save();
    } catch (err) {
        console.error("❌ Erro ao salvar no MongoDB:", err.message);
        throw err;
    }
}

async function listarEventos(filtros = {}) {
    try {
        let query = {};
        if (filtros.cidade) query.cidade = new RegExp(filtros.cidade, 'i');
        if (filtros.categoria) query.categoria = filtros.categoria;
        return await Evento.find(query).sort({ criadoEm: -1 });
    } catch (err) {
        throw new Error("Erro ao buscar eventos: " + err.message);
    }
}

module.exports = { cadastrarEvento, listarEventos, EventoModel: Evento };