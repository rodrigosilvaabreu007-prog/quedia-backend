let todosEventos = [];

// Formata data para o padrão BR
function formatarData(data) {
    if (!data) return "A definir";
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
}

// Cria o Card
function criarCardEvento(evento) {
    const div = document.createElement('div');
    div.className = 'event-card';
    
    const titulo = evento.nome || "Evento sem nome";
    const precoTexto = (evento.gratuito || evento.preco === 0) ? 'GRATUITO' : `R$ ${evento.preco}`;
    
    // 🖼️ LÓGICA DE IMAGEM (Cloudinary + Local + Placeholder)
    let imagemFinal = 'https://via.placeholder.com/400x200?text=Sem+Imagem';
    
    // Tenta pegar a imagem de qualquer um desses campos (comum no MongoDB/Cloudinary)
    const foto = evento.imagem_url || evento.imagem || (evento.imagens && evento.imagens[0]);

    if (foto) {
        if (foto.startsWith('http')) {
            imagemFinal = foto; // Cloudinary já manda o link completo
        } else {
            // Caso ainda existam fotos locais no seu servidor
            const baseUrl = window.API_URL.replace('/api', '');
            const caminhoLimpo = foto.startsWith('/') ? foto : `/${foto}`;
            imagemFinal = `${baseUrl}${caminhoLimpo}`;
        }
    }

    div.innerHTML = `
        <img src="${imagemFinal}" class="event-img" alt="${titulo}" 
             onerror="this.onerror=null;this.src='https://via.placeholder.com/400x200?text=Erro+na+Imagem';">
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

// Abre o Modal
window.abrirPrevia = function(evento, imgResolvida) {
    const modal = document.getElementById('event-modal');
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    body.innerHTML = `
        <img src="${imgResolvida}" class="modal-header-img" style="width:100%; max-height:300px; object-fit:cover;">
        <div class="modal-body" style="padding:20px; color: white;">
            <h2 style="color:#00bfff; margin-bottom:10px;">${evento.nome}</h2>
            <p><strong>🕒 Horário:</strong> ${evento.horario || '--:--'}</p>
            <p><strong>📍 Local:</strong> ${evento.endereco || 'Não informado'} - ${evento.cidade}/${evento.estado}</p>
            <hr style="border:0; border-top:1px solid #333; margin:15px 0;">
            <p style="color:#ccc; line-height:1.6;">${evento.descricao || 'Sem descrição disponível.'}</p>
        </div>
    `;
    
    // MongoDB usa _id. Se não tiver, tenta id.
    window.currentEventId = evento._id || evento.id;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

// Fecha Modal
window.fecharModal = () => {
    const modal = document.getElementById('event-modal');
    if(modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
};

// Busca Eventos no Backend
async function carregarEventos() {
    const container = document.getElementById('event-cards');
    const msg = document.getElementById('mensagem-eventos');
    
    if (!container) return;

    try {
        container.innerHTML = '<p style="color:white;">Carregando eventos...</p>';
        
        const res = await fetch(`${window.API_URL}/eventos`);
        
        // Se a rota não existir ou der erro, tratamos aqui
        if (!res.ok) {
            console.warn("Rota /eventos ainda não retornando dados.");
            container.innerHTML = '<p style="color:#ccc;">Crie o primeiro evento para começar!</p>';
            return;
        }
        
        const dados = await res.json();
        todosEventos = Array.isArray(dados) ? dados : [];
        
        container.innerHTML = '';
        
        if (todosEventos.length === 0) {
            container.innerHTML = '<p style="color:#ccc;">Nenhum evento encontrado no momento.</p>';
        } else {
            todosEventos.forEach(ev => container.appendChild(criarCardEvento(ev)));
        }
    } catch (err) {
        console.error("Erro ao carregar:", err);
        if (container) container.innerHTML = '<p style="color:#ff4444;">Erro ao conectar com o servidor.</p>';
    }
}

document.addEventListener('DOMContentLoaded', carregarEventos);