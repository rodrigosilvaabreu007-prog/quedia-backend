let todosEventos = [];

// Controle do calendário
let calendarioMes = new Date().getMonth();
let calendarioAno = new Date().getFullYear();

// 1. Formata a data corrigindo o problema de fuso horário
function formatarData(dataStr) {
    if (!dataStr) return "A definir";
    // Adicionamos o horário para evitar que o fuso horário mude o dia
    const d = new Date(dataStr + "T12:00:00Z"); 
    return d.toLocaleDateString('pt-BR');
}

function normalizarTexto(texto) {
    if (!texto) return '';
    return texto.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// 2. Cria o elemento HTML do Card
function criarCardEvento(evento, mostrarFavorito = true) {
    const div = document.createElement('div');
    div.className = 'event-card';
    div.setAttribute('data-evento-id', evento._id || '');
    
    // Verificar se o evento está favoritado pelo usuário atual (localStorage)
    const favoritos = JSON.parse(localStorage.getItem('eventos-favoritos') || '[]');
    const isFavoritado = favoritos.includes(evento._id);
    
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

    // Contador de interesses: deriva do localStorage global por evento
    const contadorInteresses = Math.max(0, getContadorInteressesEvento(evento._id));

    div.innerHTML = `
        <div class="event-img-container">
            <img src="${imagemFinal}" class="event-img" alt="${evento.nome}" 
                 onerror="this.onerror=null;this.src='https://via.placeholder.com/400x200?text=Imagem+Indisponível';">
            ${mostrarFavorito ? `<button class="favorito-btn ${isFavoritado ? 'favoritado' : ''}" onclick="event.stopPropagation(); toggleFavorito('${evento._id}', this)" title="${isFavoritado ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                ${isFavoritado ? '⭐' : '☆'}
            </button>` : ''}
        </div>
        <div class="event-info">
            <h3>${evento.nome || 'Evento sem Nome'}</h3>
            <span class="category-tag">${evento.categoria || 'Geral'}</span>
            <div class="event-details">
                <span>📅 ${formatarData(evento.data)}</span><br>
                <span>📍 ${evento.cidade || 'Local não informado'}</span>
            </div>
            <div class="event-stats">
                <span class="interesses-count">👥 ${contadorInteresses} interessados</span>
            </div>
            <p class="event-price">${precoTexto}</p>
        </div>
    `;
    
    div.onclick = () => window.abrirPrevia(evento, imagemFinal);
    return div;
}

// --- FUNÇÕES DE FAVORITOS ---
window.toggleFavorito = function(eventoId, btnElement) {
    if (!isUsuarioLogado()) {
        window.showNotification('Você precisa estar logado para favoritar eventos.', 'info');
        window.location.href = 'login.html';
        return;
    }

    const favoritos = JSON.parse(localStorage.getItem('eventos-favoritos') || '[]');
    const index = favoritos.indexOf(eventoId);
    const tinhaFavorito = index > -1;

    if (tinhaFavorito) {
        favoritos.splice(index, 1);
        btnElement.classList.remove('favoritado');
        btnElement.innerHTML = '☆';
        btnElement.title = 'Adicionar aos favoritos';
    } else {
        favoritos.push(eventoId);
        btnElement.classList.add('favoritado');
        btnElement.innerHTML = '⭐';
        btnElement.title = 'Remover dos favoritos';
    }
    localStorage.setItem('eventos-favoritos', JSON.stringify(favoritos));

    // Atualiza interesse global compartilhado por usuário
    const novoContador = toggleInteresseGlobal(eventoId);

    // Refresca contador nos cards da página
    document.querySelectorAll('.event-card').forEach(card => {
        if (card.getAttribute('data-evento-id') === eventoId) {
            const q = card.querySelector('.interesses-count');
            if (q) q.textContent = `👥 ${novoContador} interessados`;
        }
    });

    // Atualiza contador no modal se estiver aberto
    const contadorModal = document.querySelector('.interesses-count-modal');
    if (contadorModal) {
        contadorModal.textContent = `👥 ${novoContador} pessoas interessadas`;
    }
};

window.toggleInteresse = function(eventoId, btnElement) {
    if (!isUsuarioLogado()) {
        window.showNotification('Atenção: é necessário estar logado para demonstrar interesse.', 'info');
        window.location.href = 'login.html';
        return;
    }

    const usuario = getUsuarioId();
    const interessadoAtual = usuarioInteressadoNoEvento(eventoId);
    const novoContador = toggleInteresseGlobal(eventoId);

    if (interessadoAtual) {
        btnElement.classList.remove('demonstrou-interesse');
        btnElement.innerHTML = '🤍 Demonstrar Interesse';
    } else {
        btnElement.classList.add('demonstrou-interesse');
        btnElement.innerHTML = '❤️ Interessado';
    }

    const contadorEl = btnElement.parentElement.querySelector('.interesses-count-modal');
    if (contadorEl) {
        contadorEl.textContent = `👥 ${novoContador} pessoas interessadas`;
    }

    // Atualizar quantificador no card principal caso renderizado
    document.querySelectorAll('.event-card').forEach(card => {
        const id = card.getAttribute('data-evento-id');
        if (id === eventoId) {
            const q = card.querySelector('.interesses-count');
            if (q) q.textContent = `👥 ${novoContador} interessados`;
        }
    });
};

// --- FUNÇÕES DE PREFERÊNCIAS ---
function getPreferenciasUsuario() {
    const usuario = localStorage.getItem('eventhub-usuario');
    if (!usuario) return [];
    
    try {
        const dadosUsuario = JSON.parse(usuario);
        return dadosUsuario.preferencias || [];
    } catch (e) {
        return [];
    }
}

function getLocalizacaoUsuario() {
    const usuario = localStorage.getItem('eventhub-usuario');
    if (!usuario) return { estado: '', cidade: '' };
    
    try {
        const dadosUsuario = JSON.parse(usuario);
        return {
            estado: dadosUsuario.estado || '',
            cidade: dadosUsuario.cidade || ''
        };
    } catch (e) {
        return { estado: '', cidade: '' };
    }
}

function getUsuarioId() {
    const usuario = localStorage.getItem('eventhub-usuario');
    if (!usuario) return 'anonimo';
    try {
        const dados = JSON.parse(usuario);
        return dados.id ? String(dados.id) : (dados._id ? String(dados._id) : 'anonimo');
    } catch {
        return 'anonimo';
    }
}

function isUsuarioLogado() {
    const usuarioId = getUsuarioId();
    return usuarioId && usuarioId !== 'anonimo';
}

function getInteressesGlobais() {
    const data = localStorage.getItem('eventos-interesses-globais');
    return data ? JSON.parse(data) : {};
}

function setInteressesGlobais(obj) {
    localStorage.setItem('eventos-interesses-globais', JSON.stringify(obj));
}

function getContadorInteressesEvento(eventoId) {
    const globais = getInteressesGlobais();
    return Array.isArray(globais[eventoId]) ? globais[eventoId].length : 0;
}

function usuarioInteressadoNoEvento(eventoId) {
    const user = getUsuarioId();
    const globais = getInteressesGlobais();
    const lista = Array.isArray(globais[eventoId]) ? globais[eventoId] : [];
    return lista.includes(user);
}

function toggleInteresseGlobal(eventoId) {
    if (!isUsuarioLogado()) {
        return 0; // Proteção extra: ações inválidas não devem ser persistidas
    }

    const user = getUsuarioId();
    const globais = getInteressesGlobais();
    const lista = Array.isArray(globais[eventoId]) ? globais[eventoId] : [];

    if (lista.includes(user)) {
        globais[eventoId] = lista.filter(uid => uid !== user);
    } else {
        globais[eventoId] = [...lista, user];
    }

    setInteressesGlobais(globais);
    return globais[eventoId].length;
}

function filtrarEventosParaVoce() {
    const preferencias = getPreferenciasUsuario();
    const localizacao = getLocalizacaoUsuario();
    
    // Se não tem preferências nem localização, mostrar todos os eventos
    if (preferencias.length === 0 && (!localizacao.estado && !localizacao.cidade)) {
        return todosEventos.slice(0, 6);
    }
    
    // Se tem preferências, filtrar por elas
    if (preferencias.length > 0) {
        return todosEventos.filter(ev => 
            preferencias.some(pref => 
                ev.categoria && ev.categoria.toLowerCase().includes(pref.toLowerCase())
            )
        ).slice(0, 6);
    }
    
    // Se tem localização, filtrar por ela
    if (localizacao.estado || localizacao.cidade) {
        return todosEventos.filter(ev => 
            ev.estado === localizacao.estado || ev.cidade === localizacao.cidade
        ).slice(0, 6);
    }
    
    return todosEventos.slice(0, 6);
}

// 3. Modal Detalhado
window.abrirPrevia = function(evento, imgResolvida) {
    const modal = document.getElementById('event-modal');
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    // Padronização com o backend: prioriza 'local'
    const localizacao = evento.local || evento.endereco || 'Endereço não informado';
    
    // Verificar se o usuário já demonstrou interesse
    const interesses = JSON.parse(localStorage.getItem('eventos-interesses') || '[]');
    const jaDemonstrouInteresse = interesses.includes(evento._id);
    
    // Contador de interesses (global por evento)
    const contadorInteresses = getContadorInteressesEvento(evento._id);
    body.innerHTML = `
        <div class="modal-header">
            <img src="${imgResolvida}" class="modal-header-img" style="width:100%; max-height:300px; object-fit:cover; border-radius:8px;">
        </div>
        <div class="modal-padding" style="padding:20px; color: white;">
            <h2 style="color:#00bfff; margin-bottom:10px;">${evento.nome}</h2>
            <div class="evento-stats-modal">
                <span class="interesses-count-modal">👥 ${contadorInteresses} pessoas interessadas</span>
                <button class="btn-interesse ${jaDemonstrouInteresse ? 'demonstrou-interesse' : ''}" onclick="toggleInteresse('${evento._id}', this)">
                    ${jaDemonstrouInteresse ? '❤️ Interessado' : '🤍 Demonstrar Interesse'}
                </button>
            </div>
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
    const dataFiltro = document.getElementById('filtro-data')?.value || "";
    const horarioFiltro = document.getElementById('filtro-horario')?.value || "";

    // Não forçar filtro por local do usuário, pois isso pode ocultar eventos ao entrar logado.
    const estadoFiltro = estado;
    const cidadeFiltro = cidade;

    const filtrados = todosEventos.filter(ev => {
        // Busca por nome, cidade, categoria, estado, data, horário ou preço
        let matchesBusca = true;
        if (termo) {
            const termoNormalizado = normalizarTexto(termo);
        const termoDataISO = converterDataParaISO(termo);

        matchesBusca = 
            (ev.nome && normalizarTexto(ev.nome).includes(termoNormalizado)) || 
            (ev.cidade && normalizarTexto(ev.cidade).includes(termoNormalizado)) ||
            (ev.categoria && normalizarTexto(ev.categoria).includes(termoNormalizado)) ||
            (ev.estado && normalizarTexto(ev.estado).includes(termoNormalizado)) ||
            (termoDataISO && ev.data === termoDataISO) ||
            (ev.data && ev.data.includes(termo)) ||
            (ev.horario && ev.horario.includes(termo)) ||
            ((termoNormalizado.includes('gratuito') || termoNormalizado.includes('gratis')) && (ev.gratuito || parseFloat(ev.preco || 0) === 0)) ||
            filtrarPorPrecoTexto(ev, termoNormalizado);
        }
        
        const matchesEstado = estadoFiltro === "" || ev.estado === estadoFiltro;
        const matchesCidade = cidadeFiltro === "" || ev.cidade === cidadeFiltro;
        const matchesCat = categoria === "" || ev.categoria === categoria;
        const matchesPreco = ev.gratuito ? true : (parseFloat(ev.preco) <= precoMax);
        const matchesData = dataFiltro === "" || ev.data === dataFiltro;
        const matchesHorario = horarioFiltro === "" || ev.horario?.startsWith(horarioFiltro);
        
        return matchesBusca && matchesEstado && matchesCidade && matchesCat && matchesPreco && matchesData && matchesHorario;
    });
    
    // Se estiver no calendário, atualizar também
    if (currentView === 'calendario') {
        renderizarCalendario();
    }

    // Dividir eventos entre 'Para Você' e 'Todos'
    const eventosParaVoce = filtrarEventosParaVoce().filter(ev => filtrados.some(f => f._id === ev._id));
    const idsParaVoce = new Set(eventosParaVoce.map(ev => ev._id));
    const eventosDestacados = filtrados.filter(ev => !idsParaVoce.has(ev._id));

    const containerParaVoce = document.getElementById('eventos-para-voce');
    const mensagemParaVoce = document.getElementById('mensagem-para-voce');
    if (containerParaVoce) {
        containerParaVoce.innerHTML = '';
        if (eventosParaVoce.length === 0) {
            mensagemParaVoce.textContent = 'Nenhum evento encontrado para suas preferências.';
            mensagemParaVoce.style.display = 'block';
        } else {
            mensagemParaVoce.style.display = 'none';
            eventosParaVoce.forEach(ev => containerParaVoce.appendChild(criarCardEvento(ev, true)));
        }
    }

    const containerTodos = document.getElementById('event-cards');
    const mensagemTodos = document.getElementById('mensagem-eventos');
    if (containerTodos) {
        containerTodos.innerHTML = '';
        if (eventosDestacados.length === 0) {
            mensagemTodos.textContent = 'Nenhum outro evento encontrado.';
            mensagemTodos.style.display = 'block';
        } else {
            mensagemTodos.style.display = 'none';
            eventosDestacados.forEach(ev => containerTodos.appendChild(criarCardEvento(ev, true)));
        }
    }
}


function converterDataParaISO(texto) {
    if (!texto) return null;
    const match = texto.match(/(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})/);
    if (!match) return null;
    const [, dia, mes, ano] = match;
    return `${ano}-${mes}-${dia}`;
}

function filtrarPorPrecoTexto(evento, termo) {
    // Verificar se o termo contém indicações de preço
    const precoIndicadores = ['r$', 'r', '$', 'real', 'reais'];
    const temIndicadorPreco = precoIndicadores.some(ind => termo.includes(ind.replace('$', '\\$')));
    
    if (!temIndicadorPreco) return false;
    
    // Extrair valor numérico do termo
    const numeroMatch = termo.match(/(\d+(?:[.,]\d+)?)/);
    if (!numeroMatch) return false;
    
    const valorBuscado = parseFloat(numeroMatch[1].replace(',', '.'));
    
    if (evento.gratuito) {
        return termo.includes('gratuito') || termo.includes('0');
    }
    
    const precoEvento = parseFloat(evento.preco) || 0;
    
    // Se buscar "gratuito", mostrar apenas gratuitos
    if (termo.includes('gratuito')) {
        return evento.gratuito;
    }
    
    // Se buscar um valor, mostrar eventos com preço <= ao buscado
    return precoEvento <= valorBuscado;
}

function renderizarGrid(lista, mostrarFavorito = true) {
    const container = document.getElementById('event-cards');
    if (!container) return;
    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = '<p style="color:#ccc; text-align:center; width:100%; padding: 20px;">Nenhum evento encontrado.</p>';
        return;
    }
    lista.forEach(ev => container.appendChild(criarCardEvento(ev, mostrarFavorito)));
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
        
        // Carregar eventos para "Eventos para Você"
        const eventosParaVoce = filtrarEventosParaVoce();
        const containerParaVoce = document.getElementById('eventos-para-voce');
        if (containerParaVoce) {
            containerParaVoce.innerHTML = '';
            if (eventosParaVoce.length === 0) {
                containerParaVoce.innerHTML = '<p style="color:#ccc; text-align:center; width:100%; padding: 20px;">Nenhum evento encontrado para suas preferências.</p>';
            } else {
                eventosParaVoce.forEach(ev => containerParaVoce.appendChild(criarCardEvento(ev, true)));
            }
        }
        
        // Popular os filtros de seleção
        popularFiltros();

        // Aplicar filtros iniciais e renderizar
        filtrarEventos();

        // Adiciona ouvintes de busca e filtros
        const inputs = ['search-input', 'filtro-estado', 'filtro-cidade', 'filtro-categoria', 'filtro-preco', 'filtro-data', 'filtro-horario'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (id === 'search-input' || id === 'filtro-preco') {
                    el.addEventListener('input', filtrarEventos);
                } else {
                    el.addEventListener('change', filtrarEventos);
                }
            }
        });
        
        // Adiciona ouvintes para os botões de visualização
        const btnFiltros = document.getElementById('toggle-filtros');
        if (btnFiltros) {
            btnFiltros.addEventListener('click', () => window.toggleFiltros());
        }
        
        const btnEventos = document.getElementById('view-eventos');
        if (btnEventos) {
            btnEventos.addEventListener('click', () => window.setView('eventos'));
        }
        
        const btnCalendario = document.getElementById('view-calendario');
        if (btnCalendario) {
            btnCalendario.addEventListener('click', () => window.setView('calendario'));
        }

    } catch (err) {
        console.error("Erro ao carregar:", err);
        container.innerHTML = '<p style="color:#ff4444;">❌ Falha ao conectar na API.</p>';
    } finally {
        // Sempre adicionar event listeners aos botões, mesmo se a API falhar
        const btnFiltros = document.getElementById('toggle-filtros');
        if (btnFiltros && !btnFiltros.hasListener) {
            btnFiltros.addEventListener('click', () => window.toggleFiltros());
            btnFiltros.hasListener = true;
        }
        
        const btnEventos = document.getElementById('view-eventos');
        if (btnEventos && !btnEventos.hasListener) {
            btnEventos.addEventListener('click', () => window.setView('eventos'));
            btnEventos.hasListener = true;
        }
        
        const btnCalendario = document.getElementById('view-calendario');
        if (btnCalendario && !btnCalendario.hasListener) {
            btnCalendario.addEventListener('click', () => window.setView('calendario'));
            btnCalendario.hasListener = true;
        }
    }
}

function popularFiltros() {
    // Popular estados únicos
    const estadosUnicos = [...new Set(todosEventos.map(ev => ev.estado).filter(Boolean))].sort();
    const selectEstado = document.getElementById('filtro-estado');
    if (selectEstado) {
        selectEstado.innerHTML = '<option value="">Todos</option>';
        estadosUnicos.forEach(estado => {
            selectEstado.innerHTML += `<option value="${estado}">${estado}</option>`;
        });
    }
    
    // Popular categorias únicas
    const categoriasUnicas = [...new Set(todosEventos.map(ev => ev.categoria).filter(Boolean))].sort();
    const selectCategoria = document.getElementById('filtro-categoria');
    if (selectCategoria) {
        selectCategoria.innerHTML = '<option value="">Todas</option>';
        categoriasUnicas.forEach(cat => {
            selectCategoria.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
    }
    
    // Adicionar listener para popular cidades quando estado mudar
    const selectEstadoEl = document.getElementById('filtro-estado');
    if (selectEstadoEl) {
        selectEstadoEl.addEventListener('change', function() {
            const estadoSelecionado = this.value;
            const selectCidade = document.getElementById('filtro-cidade');
            if (selectCidade) {
                if (estadoSelecionado) {
                    const cidadesUnicas = [...new Set(todosEventos.filter(ev => ev.estado === estadoSelecionado).map(ev => ev.cidade).filter(Boolean))].sort();
                    selectCidade.innerHTML = '<option value="">Todas</option>';
                    cidadesUnicas.forEach(cidade => {
                        selectCidade.innerHTML += `<option value="${cidade}">${cidade}</option>`;
                    });
                } else {
                    selectCidade.innerHTML = '<option value="">Todas</option>';
                }
            }
            filtrarEventos();
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await carregarEventos();
    // Inicializar visualização padrão após carregar eventos
    if (typeof window.setView === 'function') {
        window.setView('eventos');
    }
});

// --- FUNÇÕES DE VISUALIZAÇÃO ---
let currentView = 'eventos';

window.setView = function(view) {
    currentView = view;
    
    // Atualizar botões
    const btnEventos = document.getElementById('view-eventos');
    const btnCalendario = document.getElementById('view-calendario');
    
    btnEventos.classList.toggle('active', view === 'eventos');
    btnCalendario.classList.toggle('active', view === 'calendario');
    
    // Mostrar/ocultar seções
    document.getElementById('section-para-voce').style.display = view === 'eventos' ? 'block' : 'none';
    document.getElementById('section-todos').style.display = view === 'eventos' ? 'block' : 'none';
    document.getElementById('section-calendario').style.display = view === 'calendario' ? 'block' : 'none';
    
    if (view === 'calendario') {
        renderizarCalendario();
    }
};

window.limparFiltros = function() {
    document.getElementById('search-input').value = '';
    document.getElementById('filtro-estado').value = '';
    document.getElementById('filtro-cidade').value = '';
    document.getElementById('filtro-categoria').value = '';
    document.getElementById('filtro-preco').value = '';
    document.getElementById('filtro-data').value = '';
    document.getElementById('filtro-horario').value = '';
    filtrarEventos();
};

window.toggleFiltros = function() {
    const container = document.getElementById('filtros-container');
    if (!container) return;
    const isHidden = container.style.display === 'none' || !container.style.display;
    container.style.display = isHidden ? 'grid' : 'none';
    if (!isHidden) {
        // botão rápido: aplicar filtro quando fecha o painel
        filtrarEventos();
    }
};

// --- CALENDÁRIO ---
function renderizarCalendario() {
    const container = document.getElementById('calendario-container');
    if (!container) return;
    
    // Usar a mesma lógica de filtragem
    const termo = document.getElementById('search-input')?.value.toLowerCase() || "";
    const estado = document.getElementById('filtro-estado')?.value || "";
    const cidade = document.getElementById('filtro-cidade')?.value || "";
    const categoria = document.getElementById('filtro-categoria')?.value || "";
    const precoMax = parseFloat(document.getElementById('filtro-preco')?.value) || Infinity;
    const dataFiltro = document.getElementById('filtro-data')?.value || "";
    const horarioFiltro = document.getElementById('filtro-horario')?.value || "";
    
    const eventosFiltrados = todosEventos.filter(ev => {
        const matchesBusca = !termo || 
            ev.nome?.toLowerCase().includes(termo) || 
            ev.cidade?.toLowerCase().includes(termo) ||
            ev.categoria?.toLowerCase().includes(termo) ||
            ev.estado?.toLowerCase().includes(termo) ||
            ev.data?.includes(termo) ||
            ev.horario?.includes(termo) ||
            (ev.gratuito && termo.includes('gratuito')) ||
            filtrarPorPrecoTexto(ev, termo);
        
        const matchesEstado = estado === "" || ev.estado === estado;
        const matchesCidade = cidade === "" || ev.cidade === cidade;
        const matchesCat = categoria === "" || ev.categoria === categoria;
        const matchesPreco = ev.gratuito ? true : (parseFloat(ev.preco) <= precoMax);
        const matchesData = dataFiltro === "" || ev.data === dataFiltro;
        const matchesHorario = horarioFiltro === "" || ev.horario?.startsWith(horarioFiltro);
        
        return matchesBusca && matchesEstado && matchesCidade && matchesCat && matchesPreco && matchesData && matchesHorario;
    });
    
    // Agrupar eventos por data
    const eventosPorData = {};
    eventosFiltrados.forEach(ev => {
        const data = ev.data;
        if (!eventosPorData[data]) eventosPorData[data] = [];
        eventosPorData[data].push(ev);
    });
    
    // Data atual
    const hoje = new Date();
    const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    
    // Gerar calendário
    const primeiroDia = new Date(calendarioAno, calendarioMes, 1);
    const ultimoDia = new Date(calendarioAno, calendarioMes + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay();
    
    let html = `
        <div class="calendario-header">
            <button onclick="mudarMes(-1)">◀</button>
            <h3>${primeiroDia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
            <button onclick="mudarMes(1)">▶</button>
        </div>
        <div class="calendario-grid">
            <div class="dia-semana">Dom</div>
            <div class="dia-semana">Seg</div>
            <div class="dia-semana">Ter</div>
            <div class="dia-semana">Qua</div>
            <div class="dia-semana">Qui</div>
            <div class="dia-semana">Sex</div>
            <div class="dia-semana">Sáb</div>
    `;
    
    // Dias vazios no início
    for (let i = 0; i < diaSemanaInicio; i++) {
        html += '<div class="dia-vazio"></div>';
    }
    
    // Dias do mês
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const dataStr = `${calendarioAno}-${String(calendarioMes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const eventosDia = eventosPorData[dataStr] || [];
        const temEventos = eventosDia.length > 0;
        const ehHoje = dataStr === hojeStr;
        
        let classes = 'dia-calendario';
        if (temEventos) classes += ' tem-eventos';
        if (ehHoje) classes += ' dia-atual';
        
        html += `
            <div class="${classes}" onclick="mostrarEventosDia('${dataStr}')">
                <div class="numero-dia">${dia}</div>
                ${temEventos ? `<div class="eventos-count">${eventosDia.length}</div>` : ''}
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

window.mudarMes = function(delta) {
    calendarioMes += delta;
    if (calendarioMes < 0) {
        calendarioMes = 11;
        calendarioAno--;
    } else if (calendarioMes > 11) {
        calendarioMes = 0;
        calendarioAno++;
    }
    renderizarCalendario();
};

window.mostrarEventosDia = function(data) {
    const eventosDia = todosEventos.filter(ev => ev.data === data);
    if (eventosDia.length === 0) return;
    
    const modal = document.getElementById('event-modal');
    const body = document.getElementById('modal-body');
    
    // Lógica de Imagem e preço igual ao criarCardEvento
    const eventosHtml = eventosDia.map(ev => {
        let imagemFinal = ev.imagens && ev.imagens.length > 0 ? ev.imagens[0] : (ev.imagem_url || 'https://via.placeholder.com/400x200?text=Sem+Imagem');
        const preco = parseFloat(ev.preco) || 0;
        const precoTexto = (ev.gratuito || preco === 0) ? 'GRATUITO' : `R$ ${preco.toFixed(2)}`;
        
        return `
            <div class="evento-calendario-item" onclick="window.abrirPreviaCalendario('${JSON.stringify(ev).replace(/'/g, "\\'").replace(/"/g, '\\"')}', '${imagemFinal}')">
                <img src="${imagemFinal}" alt="${ev.nome}" class="evento-calendario-img" onerror="this.src='https://via.placeholder.com/400x200?text=Imagem+Indisponível';">
                <div class="evento-calendario-info">
                    <h3>${ev.nome}</h3>
                    <p class="evento-categoria">${ev.categoria || 'Geral'}</p>
                    <p class="evento-horario">🕒 ${ev.horario || '--:--'}</p>
                    <p class="evento-preco">${precoTexto}</p>
                </div>
            </div>
        `;
    }).join('');
    
    body.innerHTML = `
        <div class="modal-padding" style="padding:20px; color: white;">
            <h2 style="color:#00bfff; margin-bottom:20px;">Eventos em ${new Date(data).toLocaleDateString('pt-BR')}</h2>
            <div class="eventos-calendario-lista">
                ${eventosHtml}
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.abrirPreviaCalendario = function(eventoStr, imgUrl) {
    const ev = JSON.parse(eventoStr);
    window.abrirPrevia(ev, imgUrl);
};