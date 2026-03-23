let todosEventos = [];
let usuarioAtual = null;

// Função para formatar a data padrão Brasil
function formatarData(data) {
    if (!data) return "A definir";
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
}

// Cria o Card que aparece na Home
function criarCardEvento(evento) {
    const div = document.createElement('div');
    div.className = 'event-card';
    
    const titulo = evento.nome || "Evento sem nome";
    const precoTexto = evento.gratuito ? 'GRATUITO' : `R$ ${evento.preco}`;
    
    // 1. Pega o que o banco de dados mandou (pode ser 'imagem', 'imagem_url' ou 'imagens')
    let fotoDoBanco = evento.imagem || evento.imagem_url || (evento.imagens && evento.imagens[0]);
    let imagemFinal = "";

    if (fotoDoBanco) {
        if (fotoDoBanco.startsWith('http')) {
            // Se for um link completo
            imagemFinal = fotoDoBanco;
        } else {
            // SE FOR UPLOAD: Aqui é onde o bicho pega. 
            // Precisamos do caminho da pasta de uploads do seu servidor backend.
            imagemFinal = `${window.API_URL}/uploads/${fotoDoBanco}`;
        }
    }

    div.innerHTML = `
        <img src="${imagemFinal}" class="event-img" alt="${titulo}" 
             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <div class="error-placeholder" style="display:none; height:180px; background:#333; color:#ff4444; text-align:center; padding-top:70px; font-size:12px;">
            ⚠️ Erro ao carregar imagem<br>Verifique a pasta /uploads
        </div>
        <div class="event-info">
            <h3>${titulo}</h3>
            <div class="event-details">
                <span>📅 ${formatarData(evento.data)}</span><br>
                <span>📍 ${evento.cidade || 'Local não informado'}</span>
            </div>
            <p class="event-price">${precoTexto}</p>
        </div>
    `;
    
    div.onclick = () => window.abrirPrevia(evento, imagemFinal);
    return div;
}

// Abre o Modal (Janela preta)
window.abrirPrevia = function(evento, imgResolvida) {
    const modal = document.getElementById('event-modal');
    const body = document.getElementById('modal-body');
    
    if (!modal || !body) return;

    body.innerHTML = `
        <img src="${imgResolvida}" class="modal-header-img">
        <div class="modal-body">
            <h2>${evento.nome}</h2>
            <p><strong>🕒 Horário:</strong> ${evento.horario || '--:--'}</p>
            <p><strong>📍 Local:</strong> ${evento.endereco || 'Não informado'} - ${evento.cidade}/${evento.estado}</p>
            <hr style="border:0; border-top:1px solid #333; margin:15px 0;">
            <p style="color:#ccc; line-height:1.6;">${evento.descricao || 'Sem descrição.'}</p>
        </div>
    `;
    
    window.currentEventId = evento.id || evento._id;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.fecharModal = () => {
    document.getElementById('event-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
};

window.irParaDetalhes = () => {
    if (window.currentEventId) window.location.href = `detalhes-evento.html?id=${window.currentEventId}`;
};

// Busca os eventos no Banco de Dados
async function carregarEventos() {
    const container = document.getElementById('event-cards');
    const msg = document.getElementById('mensagem-eventos');
    
    try {
        const urlBusca = '/api/eventos';
        const res = await fetch(urlBusca);
        const dados = await res.json();
        
        todosEventos = Array.isArray(dados) ? dados : [];
        
        if (container) {
            container.innerHTML = '';
            if (todosEventos.length === 0) {
                msg.textContent = "Nenhum evento encontrado.";
            } else {
                todosEventos.forEach(ev => container.appendChild(criarCardEvento(ev)));
            }
        }
    } catch (err) {
        console.error("Erro ao carregar:", err);
        if (msg) msg.textContent = "Erro ao conectar com o servidor.";
    }
}

document.addEventListener('DOMContentLoaded', carregarEventos);