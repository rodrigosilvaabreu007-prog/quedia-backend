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
            const aTime = parseBrazilDateTime(a.data, a.horario_inicio || '00:00')?.getTime() || 0;
            const bTime = parseBrazilDateTime(b.data, b.horario_inicio || '00:00')?.getTime() || 0;
            return aTime - bTime;
        });
}

function parseBrazilDateTime(data, hora = '00:00') {
    if (!data) return null;
    const [year, month, day] = data.split('-').map(Number);
    const [hours, minutes] = (hora || '00:00').split(':').map(Number);
    if (![year, month, day, hours, minutes].every(Number.isFinite)) return null;
    // Converte horário local do Brasil (UTC-3) para UTC adicionando 3 horas
    return new Date(Date.UTC(year, month - 1, day, hours + 3, minutes, 0));
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
    console.log(`[DEBUG eventoEstaAtivo] Verificando evento ${evento._id} - título: ${evento.titulo || evento.nome}`);
    console.log(`[DEBUG eventoEstaAtivo] Agora: ${agora.toISOString()}`);
    console.log(`[DEBUG eventoEstaAtivo] Datas do evento:`, datas);
    
    const ativo = datas.some(item => {
        const inicio = parseBrazilDateTime(item.data, item.horario_inicio || '00:00');
        const fim = item.horario_fim ? parseBrazilDateTime(item.data, item.horario_fim) : null;
        console.log(`[DEBUG eventoEstaAtivo] Item: data=${item.data}, inicio=${item.horario_inicio}, fim=${item.horario_fim}`);
        console.log(`[DEBUG eventoEstaAtivo] Parsed: inicio=${inicio?.toISOString()}, fim=${fim?.toISOString()}`);
        
        if (!inicio) {
            console.log(`[DEBUG eventoEstaAtivo] Sem horário de início válido`);
            return false;
        }

        if (fim && !Number.isNaN(fim.getTime())) {
            const result = fim > agora;
            console.log(`[DEBUG eventoEstaAtivo] Comparação fim > agora: ${fim.toISOString()} > ${agora.toISOString()} = ${result}`);
            return result;
        } else {
            // Se não há horário de fim, o evento aparece sempre (disponível indefinidamente)
            console.log(`[DEBUG eventoEstaAtivo] Sem horário de fim, evento sempre ativo`);
            return true;
        }
    });
    
    console.log(`[DEBUG eventoEstaAtivo] Evento ${ativo ? 'ATIVO' : 'INATIVO'}`);
    return ativo;
}

async function removerEventosExpirados() {
    // Desabilitado para evitar exclusões acidentais de eventos.
    // Eventos não devem ser removidos automaticamente apenas porque o sistema foi atualizado
    // ou porque a data/hora pode ter sido interpretada de forma incorreta.
    return;
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

        console.log('[DEBUG cadastrarEvento] dados recebidos:', { latitude, longitude, datasNormalizadas, horario_fim: dados.horario_fim });

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
        return evento;
    } catch (err) {
        throw new Error("Erro ao buscar evento: " + err.message);
    }
}

module.exports = { cadastrarEvento, listarEventos, deletarEvento, buscarEventoPorId, eventoEstaAtivo, EventoModel: Evento };