const mongoose = require('mongoose');

// Definindo o Schema
const EventoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    descricao: String,
    cidade: String,
    estado: String,
    endereco: String,
    data: String,
    horario: String,
    categoria: String,
    subcategorias: [String],
    gratuito: { type: Boolean, default: false },
    preco: { type: Number, default: 0 },
    imagens: [String], // Aqui ficarão os links do Cloudinary
    organizador_id: mongoose.Schema.Types.ObjectId,
    criadoEm: { type: Date, default: Date.now }
});

// Evita erro de sobrescrever model se o Node reiniciar
const Evento = mongoose.models.Evento || mongoose.model('Evento', EventoSchema);

async function cadastrarEvento(dados) {
    try {
        const novoEvento = new Evento(dados);
        const salvo = await novoEvento.save();
        return salvo;
    } catch (err) {
        throw new Error("Erro ao salvar no MongoDB: " + err.message);
    }
}

async function listarEventos(filtros = {}) {
    try {
        let query = {};
        if (filtros.cidade) query.cidade = filtros.cidade;
        if (filtros.categoria) query.categoria = filtros.categoria;
        
        // Retorna todos se não houver filtro
        return await Evento.find(query).sort({ data: 1 });
    } catch (err) {
        throw new Error("Erro ao buscar eventos: " + err.message);
    }
}

// Funções de Editar e Excluir permanecem iguais, 
// apenas garanta que exportou o Evento se precisar em outros lugares
module.exports = {
    cadastrarEvento,
    listarEventos,
    editarEvento: async (id, dados) => await Evento.findByIdAndUpdate(id, dados, { new: true }),
    excluirEvento: async (id) => await Evento.findByIdAndDelete(id)
};