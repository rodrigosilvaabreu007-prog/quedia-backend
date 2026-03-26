let todosEventos = [];

// 1. Formata a data para o padrão brasileiro (DD/MM/AAAA)
function formatarData(data) {
    if (!data) return "A definir";
    const d = new Date(data);
    // Usamos UTC para garantir que a data salva no banco não mude por fuso horário
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

// 2. Cria o elemento HTML do Card (Sua estrutura original)
function criarCardEvento(evento) {
    const div = document.createElement('div');
    div.className = 'event-card';
    
    // Lógica de Imagem: Prioriza o array 'imagens' do Cloudinary
    let imagemFinal = 'https://via.placeholder.com/400x200?text=Sem+Imagem';
    
    if (evento.imagens && evento.imagens.length > 0) {
        imagemFinal = evento.imagens[0]; 
    } else if (evento.imagem_url) {
        imagemFinal = evento.imagem_url;
    }

    // Lógica de Preço formatado
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
    
    // Configura o clique para abrir o modal
    div.onclick = () => window.abrirPrevia(evento, imagemFinal);
    return div;
}

// 3. Função do Modal (Ajustada para os campos do seu index.html)
window.abrirPrevia = function(evento, imgResolvida) {
    const modal = document.getElementById('event-modal');
    const body = document.getElementById('modal-body');
    
    if (!modal || !body) return;

    const localizacao = evento.endereco || evento.local || 'Endereço não informado';

    body.innerHTML = `
        <div class="modal-header">
            <img src="${imgResolvida}" class="modal-header-img" style="width:100%; max-height:300px; object-fit:cover; border-radius:8px;">
        </div>
        <div class="modal-padding" style="padding:20px; color: white;">
            <h2 style="color:#00bfff; margin-bottom:10px;">${evento.nome}</h2>
            <p><strong>🕒 Horário:</strong> ${evento.horario || '--:--'}</p>
            <p><strong>📍 Local:</strong> ${localizacao} - ${evento.cidade}/${evento.estado}</p>
            <hr style="border:0; border-top:1px solid #333; margin:15px 0;">
            <p style="color:#ccc; line-height:1.6;">${evento.descricao || 'Sem descrição disponível.'}</p>
        </div>
    `;
    
    window.currentEventId = evento._id;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

// 4. Fecha o Modal
window.fecharModal = () => {
    const modal = document.getElementById('event-modal');
    if(modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
};

// --- 🔍 LÓGICA DE FILTROS E BUSCA EM TEMPO REAL ---

function filtrarEventos() {
    const termo = document.getElementById('search-input').value.toLowerCase();
    const estado = document.getElementById('filtro-estado').value;
    const cidade = document.getElementById('filtro-cidade').value;
    const categoria = document.getElementById('filtro-categoria').value;
    const precoMax = parseFloat(document.getElementById('filtro-preco').value) || Infinity;

    const filtrados = todosEventos.filter(ev => {
        // Busca por Nome ou Cidade
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
        container.innerHTML = '<p style="color:#ccc; text-align:center; width:100%; padding: 20px;">Nenhum evento encontrado para esses filtros.</p>';
        return;
    }

    lista.forEach(ev => container.appendChild(criarCardEvento(ev)));
}

// Funções para os botões do HTML
window.toggleFiltros = () => {
    const f = document.getElementById('filtros-container');
    f.style.display = f.style.display === 'none' ? 'grid' : 'none';
};

window.limparFiltros = () => {
    document.getElementById('search-input').value = '';
    document.getElementById('filtro-estado').value = '';
    document.getElementById('filtro-cidade').value = '';
    document.getElementById('filtro-categoria').value = '';
    document.getElementById('filtro-preco').value = '';
    renderizarGrid(todosEventos);
};

// 5. Busca os dados no Backend (Cloud Run)
async function carregarEventos() {
    const container = document.getElementById('event-cards');
    if (!container) return;

    try {
        container.innerHTML = '<p style="color:white;">Buscando eventos...</p>';
        
        const response = await fetch(`${window.API_URL}/eventos`);
        if (!response.ok) throw new Error('Erro na resposta do servidor');
        
        const dados = await response.json();
        todosEventos = Array.isArray(dados) ? dados : [];
        
        renderizarGrid(todosEventos);

        // Adiciona os ouvintes de evento para filtrar enquanto o usuário interage
        document.getElementById('search-input').addEventListener('input', filtrarEventos);
        document.getElementById('filtro-estado').addEventListener('change', filtrarEventos);
        document.getElementById('filtro-cidade').addEventListener('change', filtrarEventos);
        document.getElementById('filtro-categoria').addEventListener('change', filtrarEventos);
        document.getElementById('filtro-preco').addEventListener('input', filtrarEventos);

    } catch (err) {
        console.error("Erro ao carregar eventos:", err);
        container.innerHTML = '<p style="color:#ff4444;">Erro ao conectar com o servidor. Tente recarregar a página.</p>';
    }
}

// Inicia tudo
document.addEventListener('DOMContentLoaded', carregarEventos);