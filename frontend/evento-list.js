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

// 2. Cria o elemento HTML do Card
function criarCardEvento(evento, mostrarFavorito = true) {
    const div = document.createElement('div');
    div.className = 'event-card';
    
    // Verificar se o evento está favoritado
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

    // Contador de interesses (simulado por enquanto)
    const contadorInteresses = evento.interesses || Math.floor(Math.random() * 50) + 1;

    div.innerHTML = `
        <div class="event-img-container">
            <img src="${imagemFinal}" class="event-img" alt="${evento.nome}" 
                 onerror="this.onerror=null;this.src='https://via.placeholder.com/400x200?text=Imagem+Indisponível';">
            ${mostrarFavorito ? `<button class="favorito-btn ${isFavoritado ? 'favoritado' : ''}" onclick="event.stopPropagation(); toggleFavorito('${evento._id}', this)" title="${isFavoritado ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                ${isFavoritado ? '⭐' : '☆'}
            </button>` : ''}
        </div>
        <div class="event-info">
            <span class="category-tag">${evento.categoria || 'Geral'}</span>
            <h3>${evento.nome || 'Evento sem Nome'}</h3>
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
    const favoritos = JSON.parse(localStorage.getItem('eventos-favoritos') || '[]');
    const index = favoritos.indexOf(eventoId);
    
    if (index > -1) {
        // Remover dos favoritos
        favoritos.splice(index, 1);
        btnElement.classList.remove('favoritado');
        btnElement.innerHTML = '☆';
        btnElement.title = 'Adicionar aos favoritos';
    } else {
        // Adicionar aos favoritos
        favoritos.push(eventoId);
        btnElement.classList.add('favoritado');
        btnElement.innerHTML = '⭐';
        btnElement.title = 'Remover dos favoritos';
    }
    
    localStorage.setItem('eventos-favoritos', JSON.stringify(favoritos));
};

window.toggleInteresse = function(eventoId, btnElement) {
    const interesses = JSON.parse(localStorage.getItem('eventos-interesses') || '[]');
    const index = interesses.indexOf(eventoId);
    
    if (index > -1) {
        // Remover interesse
        interesses.splice(index, 1);
        btnElement.classList.remove('demonstrou-interesse');
        btnElement.innerHTML = '🤍 Demonstrar Interesse';
        // Atualizar contador no modal
        const contadorEl = btnElement.parentElement.querySelector('.interesses-count-modal');
        if (contadorEl) {
            const currentCount = parseInt(contadorEl.textContent.match(/\d+/)[0]);
            contadorEl.textContent = `👥 ${currentCount - 1} pessoas interessadas`;
        }
    } else {
        // Adicionar interesse
        interesses.push(eventoId);
        btnElement.classList.add('demonstrou-interesse');
        btnElement.innerHTML = '❤️ Interessado';
        // Atualizar contador no modal
        const contadorEl = btnElement.parentElement.querySelector('.interesses-count-modal');
        if (contadorEl) {
            const currentCount = parseInt(contadorEl.textContent.match(/\d+/)[0]);
            contadorEl.textContent = `👥 ${currentCount + 1} pessoas interessadas`;
        }
    }
    
    localStorage.setItem('eventos-interesses', JSON.stringify(interesses));
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

function filtrarEventosParaVoce() {
    const preferencias = getPreferenciasUsuario();
    const localizacao = getLocalizacaoUsuario();
    
    if (preferencias.length === 0 && (!localizacao.estado && !localizacao.cidade)) {
        // Se não tem preferências nem localização, mostrar eventos aleatórios ou recentes
        return todosEventos.slice(0, 6);
    }
    
    if (preferencias.length === 0) {
        // Se não tem preferências, mostrar eventos da localização
        return todosEventos.filter(ev => 
            ev.estado === localizacao.estado || ev.cidade === localizacao.cidade
        ).slice(0, 6); // Limitar a 6 eventos
    }
    
    // Filtrar por preferências
    const eventosFiltrados = todosEventos.filter(ev => {
        // Verificar se a categoria do evento está nas preferências
        return preferencias.some(pref => 
            ev.categoria && ev.categoria.toLowerCase().includes(pref.toLowerCase())
        );
    });
    
    return eventosFiltrados.slice(0, 6); // Limitar a 6 eventos
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
    
    // Contador de interesses (simulado)
    const contadorInteresses = (evento.interesses || Math.floor(Math.random() * 50) + 1) + (jaDemonstrouInteresse ? 1 : 0);

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

    // Se não há filtros aplicados, usar localização do usuário como padrão
    const localizacaoUsuario = getLocalizacaoUsuario();
    const estadoFiltro = estado || (localizacaoUsuario.estado && !termo && !cidade && !categoria && !dataFiltro && !horarioFiltro && precoMax === Infinity ? localizacaoUsuario.estado : "");
    const cidadeFiltro = cidade || (localizacaoUsuario.cidade && !termo && !estado && !categoria && !dataFiltro && !horarioFiltro && precoMax === Infinity ? localizacaoUsuario.cidade : "");

    const filtrados = todosEventos.filter(ev => {
        // Busca por nome, cidade, categoria, estado, data, horário ou preço
        let matchesBusca = true;
        if (termo) {
            const termoLower = termo.toLowerCase();
        const termoDataISO = converterDataParaISO(termo);

        matchesBusca = 
            ev.nome?.toLowerCase().includes(termoLower) || 
            ev.cidade?.toLowerCase().includes(termoLower) ||
            ev.categoria?.toLowerCase().includes(termoLower) ||
            ev.estado?.toLowerCase().includes(termoLower) ||
            (termoDataISO && ev.data === termoDataISO) ||
            ev.data?.includes(termo) ||
            ev.horario?.includes(termo) ||
            (ev.gratuito && termoLower.includes('gratuito')) ||
            filtrarPorPrecoTexto(ev, termoLower);
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
    
    // Renderizar os eventos filtrados
    renderizarGrid(filtrados, true);
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
        
        // Carregar "Todos os Eventos" - mostrar todos, mas priorizar os que não estão em "Para Você"
        const idsParaVoce = eventosParaVoce.map(ev => ev._id);
        const eventosNaoParaVoce = todosEventos.filter(ev => !idsParaVoce.includes(ev._id));
        const todosOrdenados = [...eventosParaVoce, ...eventosNaoParaVoce]; // Para Você primeiro, depois os outros
        
        renderizarGrid(todosOrdenados, true);

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

document.addEventListener('DOMContentLoaded', () => {
    carregarEventos();
    // Inicializar visualização padrão
    window.setView('eventos');
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
    container.style.display = container.style.display === 'none' ? 'grid' : 'none';
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