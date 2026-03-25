const mongoose = require('mongoose');

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
});

const Evento = mongoose.models.Evento || mongoose.model('Evento', EventoSchema);

async function cadastrarEvento(dados) {
    try {
        // Importante: O Mongoose precisa que a conexão esteja aberta.
        // O save() usará a conexão global que abrimos no connectDB().
        const novoEvento = new Evento(dados);
        const salvo = await novoEvento.save();
        return salvo;
    } catch (err) {
        console.error("Erro no save do Mongoose:", err.message);
        throw new Error("Erro ao salvar no MongoDB: " + err.message);
    }
}

async function listarEventos(filtros = {}) {
    try {
        let query = {};
        if (filtros.cidade) query.cidade = filtros.cidade;
        if (filtros.categoria) query.categoria = filtros.categoria;
        return await Evento.find(query).sort({ data: 1 });
    } catch (err) {
        throw new Error("Erro ao buscar eventos: " + err.message);
    }
}

module.exports = {
    cadastrarEvento,
    listarEventos,
    editarEvento: async (id, dados) => await Evento.findByIdAndUpdate(id, dados, { new: true }),
    excluirEvento: async (id) => await Evento.findByIdAndDelete(id)
};