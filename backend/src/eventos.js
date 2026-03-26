const mongoose = require('mongoose');

const EventoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    // ... todos os outros campos iguais ...
    criadoEm: { type: Date, default: Date.now }
}, { 
    bufferCommands: false // ADICIONE ISSO AQUI
});

const Evento = mongoose.models.Evento || mongoose.model('Evento', EventoSchema);

async function cadastrarEvento(dados) {
    try {
        // Trata os dados antes de criar a instância para evitar Erro 400
        const dadosTratados = {
            ...dados,
            // Garante que preço seja número, mesmo que venha string vazia do front
            preco: Number(dados.preco) || 0,
            // Garante que gratuito seja boolean real
            gratuito: String(dados.gratuito) === 'true'
        };

        const novoEvento = new Evento(dadosTratados);
        
        // O bufferCommands: false faz o Mongoose avisar na hora se não tiver conexão
        const salvo = await novoEvento.save();
        return salvo;
    } catch (err) {
        console.error("Erro no save do Mongoose:", err.message);
        throw err; // Lança o erro real para o routes.js capturar
    }
}

async function listarEventos(filtros = {}) {
    try {
        let query = {};
        if (filtros.cidade) query.cidade = new RegExp(filtros.cidade, 'i'); // Busca aproximada
        if (filtros.categoria) query.categoria = filtros.categoria;
        
        return await Evento.find(query).sort({ criadoEm: -1 }); // Mostra os novos primeiro
    } catch (err) {
        throw new Error("Erro ao buscar eventos: " + err.message);
    }
}

module.exports = {
    cadastrarEvento,
    listarEventos,
    // Exportando o modelo para caso precise em outros lugares
    EventoModel: Evento
};