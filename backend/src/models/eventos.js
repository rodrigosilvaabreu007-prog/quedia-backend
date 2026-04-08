const mongoose = require('mongoose');

// Define o Schema
const EventoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    descricao: { type: String, default: "" },
    cidade: { type: String, default: "" },
    estado: { type: String, default: "" },
    local: { type: String, default: "" }, 
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    data: { type: String, default: "" },
    horario: { type: String, default: "" },
    horario_fim: { type: String, default: "" },
    datas: {
        type: [{
            data: { type: String, default: "" },
            horario_inicio: { type: String, default: "" },
            horario_fim: { type: String, default: "" }
        }],
        default: []
    },
    categoria: { type: String, default: "Outros" },
    subcategorias: { type: [String], default: [] },
    gratuito: { type: Boolean, default: false },
    preco: { type: Number, default: 0 },
    imagens: { type: [String], default: [] },
    interesses: { type: [String], default: [] },
    organizador: { type: String, default: 'Não informado' },
    organizador_id: { type: String, default: "sistema" }, 
    criadoEm: { type: Date, default: Date.now }
}, { 
    // ESSA LINHA É A MAIS IMPORTANTE:
    // Impede o Mongoose de enfileirar comandos se a conexão não estiver pronta.
    bufferCommands: false 
});

const Evento = mongoose.models.Evento || mongoose.model('Evento', EventoSchema);

function normalizarDatasEntrada(datasInput) {
    if (!datasInput) return [];
    let lista = [];
    if (Array.isArray(datasInput)) {
        lista = datasInput;
    } else if (typeof datasInput === 'string') {
        try {
            const parsed = JSON.parse(datasInput);
            if (Array.isArray(parsed)) lista = parsed;
        } catch (err) {
            lista = [];
        }
    }
    return lista
        .filter(item => item && item.data)
        .map(item => ({
            data: item.data,
            horario_inicio: item.horario_inicio || item.horario || '',
            horario_fim: item.horario_fim || ''
        }))
        .sort((a, b) => {
            const aTime = new Date(`${a.data}T${a.horario_inicio || '00:00'}`).getTime();
            const bTime = new Date(`${b.data}T${b.horario_inicio || '00:00'}`).getTime();
            return aTime - bTime;
        });
}

function eventoEstaAtivo(evento) {
    const datas = normalizarDatasEntrada(evento.datas || []);
    if (datas.length === 0 && evento.data) {
        datas.push({
            data: evento.data,
            horario_inicio: evento.horario || '00:00',
            horario_fim: evento.horario_fim || ''
        });
    }

    const agora = new Date();
    return datas.some(item => {
        const dataHora = new Date(`${item.data}T${item.horario_inicio || '00:00'}`);
        return !Number.isNaN(dataHora.getTime()) && dataHora >= agora;
    });
}

async function removerEventosExpirados() {
    try {
        const todos = await Evento.find({});
        const expirados = todos.filter(e => !eventoEstaAtivo(e));
        if (expirados.length > 0) {
            const ids = expirados.map(e => e._id);
            await Evento.deleteMany({ _id: { $in: ids } });
        }
    } catch (err) {
        console.warn('Não foi possível limpar eventos expirados:', err.message);
    }
}

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
        const latitude = Number(dados.latitude);
        const longitude = Number(dados.longitude);
        const datasNormalizadas = normalizarDatasEntrada(dados.datas || []);
        if (datasNormalizadas.length === 0 && dados.data) {
            datasNormalizadas.push({
                data: dados.data,
                horario_inicio: dados.horario || '',
                horario_fim: dados.horario_fim || ''
            });
        }

        console.log('[DEBUG] cadastrarEvento recebeu:', { latitude, longitude, isFiniteLatitude: Number.isFinite(latitude), isFiniteLongitude: Number.isFinite(longitude), datasCount: datasNormalizadas.length });
        const dadosTratados = {
            ...dados,
            organizador: dados.organizador || 'Não informado',
            preco: Number(String(dados.preco).replace(',', '.')) || 0,
            gratuito: String(dados.gratuito) === 'true',
            latitude: Number.isFinite(latitude) ? latitude : null,
            longitude: Number.isFinite(longitude) ? longitude : null,
            datas: datasNormalizadas,
            data: datasNormalizadas[0]?.data || dados.data || '',
            horario: datasNormalizadas[0]?.horario_inicio || dados.horario || '',
            horario_fim: datasNormalizadas[0]?.horario_fim || dados.horario_fim || ''
        };
        console.log('[DEBUG] dadosTratados:', { latitude: dadosTratados.latitude, longitude: dadosTratados.longitude });

        const novoEvento = new Evento(dadosTratados);
        
        // 2. Tenta salvar com um timeout forçado para não travar o Cloud Run
        const savedEvento = await Promise.race([
            novoEvento.save(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout ao salvar evento')), 10000)
            )
        ]);
        console.log('[DEBUG] Evento salvo:', { id: savedEvento._id, latitude: savedEvento.latitude, longitude: savedEvento.longitude });
        
        return savedEvento;
    } catch (err) {
        console.error("❌ Erro ao salvar no MongoDB:", err.message);
        throw err;
    }
}

async function listarEventos(filtros = {}) {
    try {
        await removerEventosExpirados();
        let query = {};
        if (filtros.cidade) query.cidade = new RegExp(filtros.cidade, 'i');
        if (filtros.categoria) query.categoria = filtros.categoria;
        const eventos = await Evento.find(query).sort({ criadoEm: -1 });
        return eventos.filter(eventoEstaAtivo);
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

async function buscarEventoPorId(id) {
    try {
        const evento = await Evento.findById(id);
        if (evento && !eventoEstaAtivo(evento)) {
            await Evento.findByIdAndDelete(id);
            return null;
        }
        
        // Se evento existe, popula interesses do banco Interesse
        if (evento) {
            const { contarInteresses, listarInteressesEvento } = require('./interesses');
            try {
                const interessesIds = await listarInteressesEvento(id);
                evento.interesses = interessesIds;
            } catch (err) {
                console.warn("Aviso: não conseguiu carregar interesses:", err.message);
                evento.interesses = [];
            }
        }
        
        return evento;
    } catch (err) {
        throw new Error("Erro ao buscar evento: " + err.message);
    }
}

async function listarEventosComInteresses(filtros = {}) {
    try {
        await removerEventosExpirados();
        let query = {};
        if (filtros.cidade) query.cidade = new RegExp(filtros.cidade, 'i');
        if (filtros.categoria) query.categoria = filtros.categoria;
        
        const eventos = await Evento.find(query).sort({ criadoEm: -1 });
        
        // Popula interesses em todos os eventos
        const { listarInteressesEvento } = require('./interesses');
        for (let evento of eventos) {
            try {
                const interessesIds = await listarInteressesEvento(evento._id.toString());
                evento.interesses = interessesIds;
            } catch (err) {
                console.warn("Aviso: não conseguiu carregar interesses para", evento._id);
                evento.interesses = [];
            }
        }
        
        return eventos.filter(eventoEstaAtivo);
    } catch (err) {
        throw new Error("Erro ao buscar eventos: " + err.message);
    }
}

module.exports = { cadastrarEvento, listarEventos, listarEventosComInteresses, deletarEvento, buscarEventoPorId, EventoModel: Evento };