let todosEventos = [];

// 1. Formata a data corrigindo o problema de fuso horário
function formatarData(dataStr) {
    if (!dataStr) return "A definir";
    // Adicionamos o horário para evitar que o fuso horário mude o dia
    const d = new Date(dataStr + "T12:00:00Z"); 
    return d.toLocaleDateString('pt-BR');
}

// 2. Cria o elemento HTML do Card
function criarCardEvento(evento) {
    const div = document.createElement('div');
    div.className = 'event-card';
    
    // Lógica de Imagem: Pega a primeira do array do Cloudinary
    let imagemFinal = 'https://via.placeholder.com/400x200?text=Sem+Imagem';
    if (evento.imagens && evento.imagens.length > 0) {
        imagemFinal = evento.imagens[0]; 
    } else if (evento.imagem_url) {
        imagemFinal = evento.imagem_url;
    }

    // Preço formatado
    const preco = parseFloat(evento.preco) || 0;
    const precoTexto = (evento.gratuito || preco === 0) ? 'GRATUITO' : `R$ ${preco.toFixed(2)}`;

    div.innerHTML = `
        <div class="event-img-container">
            <img src="${imagemFinal}" class="event-img" alt="${evento.nome}" 
                 onerror="this.onerror=null;this.src='https://via.placeholder.com/400x200?text=Imagem+Indisponível';">
        </div>
        <div class="event-info">
            <span class="category-tag">${evento.categoria || 'Geral'}</span>
            <h3>${evento.nome || 'Evento sem Nome'}</h3>
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

// 3. Modal Detalhado
window.abrirPrevia = function(evento, imgResolvida) {
    const modal = document.getElementById('event-modal');
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    // Padronização com o backend: prioriza 'local'
    const localizacao = evento.local || evento.endereco || 'Endereço não informado';

    body.innerHTML = `
        <div class="modal-header">
            <img src="${imgResolvida}" class="modal-header-img" style="width:100%; max-height:300px; object-fit:cover; border-radius:8px;">
        </div>
        <div class="modal-padding" style="padding:20px; color: white;">
            <h2 style="color:#00bfff; margin-bottom:10px;">${evento.nome}</h2>
            <p><strong>🕒 Horário:</strong> ${evento.horario || '--:--'}</p>
            <p><strong>📍 Local:</strong> ${localizacao} - ${evento.cidade}/${evento.estado}</p>
            <hr style="border:0; border-top:1px solid #333; margin:15px 0;">
            <p style="color:#ccc; line-height:1.6; white-space: pre-wrap;">${evento.descricao || 'Sem descrição disponível.'}</p>
        </div>
    `;
    
    window.currentEventId = evento._id;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

// 4. Fechar Modal
window.fecharModal = () => {
    const modal = document.getElementById('event-modal');
    if(modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
};

// --- 🔍 FILTROS ---
function filtrarEventos() {
    const termo = document.getElementById('search-input')?.value.toLowerCase() || "";
    const estado = document.getElementById('filtro-estado')?.value || "";
    const cidade = document.getElementById('filtro-cidade')?.value || "";
    const categoria = document.getElementById('filtro-categoria')?.value || "";
    const precoMax = parseFloat(document.getElementById('filtro-preco')?.value) || Infinity;

    const filtrados = todosEventos.filter(ev => {
        const matchesBusca = ev.nome?.toLowerCase().includes(termo) || ev.cidade?.toLowerCase().includes(termo);
        const matchesEstado = estado === "" || ev.estado === estado;
        const matchesCidade = cidade === "" || ev.cidade === cidade;
        const matchesCat = categoria === "" || ev.categoria === categoria;
        const matchesPreco = ev.gratuito ? true : (parseFloat(ev.preco) <= precoMax);

        return matchesBusca && matchesEstado && matchesCidade && matchesCat && matchesPreco;
    });

    renderizarGrid(filtrados);
}

function renderizarGrid(lista) {
    const container = document.getElementById('event-cards');
    if (!container) return;
    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = '<p style="color:#ccc; text-align:center; width:100%; padding: 20px;">Nenhum evento encontrado.</p>';
        return;
    }
    lista.forEach(ev => container.appendChild(criarCardEvento(ev)));
}

// 5. Chamada à API
async function carregarEventos() {
    const container = document.getElementById('event-cards');
    if (!container) return;

    try {
        container.innerHTML = '<p style="color:white;">🚀 Buscando eventos...</p>';
        
        const response = await fetch(`${window.API_URL}/eventos`);
        if (!response.ok) throw new Error('Erro na resposta do servidor');
        
        const dados = await response.json();
        todosEventos = Array.isArray(dados) ? dados : [];
        
        renderizarGrid(todosEventos);

        // Adiciona ouvintes de busca
        const inputs = ['search-input', 'filtro-estado', 'filtro-cidade', 'filtro-categoria', 'filtro-preco'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(id.includes('search') || id.includes('preco') ? 'input' : 'change', filtrarEventos);
        });

    } catch (err) {
        console.error("Erro ao carregar:", err);
        container.innerHTML = '<p style="color:#ff4444;">❌ Falha ao conectar na API.</p>';
    }
}

document.addEventListener('DOMContentLoaded', carregarEventos);