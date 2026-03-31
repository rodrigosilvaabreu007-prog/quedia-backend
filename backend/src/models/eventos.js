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
        console.warn("⚠️ Conexão Mongoose não pronta. Estado:", mongoose.connection.readyState);
        await Promise.race([
            new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Timeout aguardando conexão com MongoDB')), 10000);
                mongoose.connection.once('connected', () => {
                    clearTimeout(timeout);
                    resolve();
                });
                mongoose.connection.once('error', (err) => {
                    clearTimeout(timeout);
                    reject(err);
                });
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout aguardando conexão com MongoDB')), 10000))
        ]);

        if (mongoose.connection.readyState !== 1) {
            throw new Error("Ainda não há conexão ativa com o MongoDB. Tente novamente em alguns segundos.");
        }
    }

    try {
        const dadosTratados = {
            ...dados,
            preco: Number(String(dados.preco).replace(',', '.')) || 0,
            gratuito: String(dados.gratuito) === 'true'
        };

        const novoEvento = new Evento(dadosTratados);
        
        // 2. Tenta salvar com um timeout forçado para não travar o Cloud Run
        const savedEvento = await Promise.race([
            novoEvento.save(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout ao salvar evento')), 10000)
            )
        ]);
        
        return savedEvento;
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

async function deletarEvento(id) {
    try {
        const resultado = await Evento.findByIdAndDelete(id);
        return resultado;
    } catch (err) {
        throw new Error("Erro ao deletar evento: " + err.message);
    }
}

module.exports = { cadastrarEvento, listarEventos, deletarEvento, EventoModel: Evento };