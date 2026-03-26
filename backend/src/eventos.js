const mongoose = require('mongoose');

// 1. Definição do Schema (Onde o banco entende o que você está salvando)
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
    // Isso aqui impede que o servidor fique tentando conectar por 10s se o banco cair
    bufferCommands: false 
});

const Evento = mongoose.models.Evento || mongoose.model('Evento', EventoSchema);

// 2. Função para SALVAR o evento
async function cadastrarEvento(dados) {
    try {
        // Tratamento de dados "limpa-sujeira"
        const dadosTratados = {
            ...dados,
            // Converte preço pra número (ex: "10.50" vira 10.5)
            preco: Number(String(dados.preco).replace(',', '.')) || 0,
            // Converte o "true" que vem do formulário em Boolean real
            gratuito: String(dados.gratuito) === 'true'
        };

        const novoEvento = new Evento(dadosTratados);
        
        // Salva de fato no MongoDB Atlas
        const salvo = await novoEvento.save();
        return salvo;
    } catch (err) {
        console.error("❌ Erro no save do Mongoose:", err.message);
        throw err; 
    }
}

// 3. Função para LISTAR os eventos na Home
async function listarEventos(filtros = {}) {
    try {
        let query = {};
        if (filtros.cidade) query.cidade = new RegExp(filtros.cidade, 'i');
        if (filtros.categoria) query.categoria = filtros.categoria;
        
        // Retorna ordenado pelo mais novo (criadoEm: -1)
        return await Evento.find(query).sort({ criadoEm: -1 });
    } catch (err) {
        throw new Error("Erro ao buscar eventos: " + err.message);
    }
}

module.exports = {
    cadastrarEvento,
    listarEventos,
    EventoModel: Evento
};