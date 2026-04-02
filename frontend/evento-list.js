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
    
    // Verificar interesse usando cache
    const isInteressado = interessesCache[evento._id] || false;
    
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

    // Contador de interesses: valor inicial
    let contadorInteresses = 0;

    div.innerHTML = `
        <div class="event-img-container">
            <img src="${imagemFinal}" class="event-img" alt="${evento.nome}" 
                 onerror="this.onerror=null;this.src='https://via.placeholder.com/400x200?text=Imagem+Indisponível';">
            ${mostrarFavorito ? `<button class="favorito-btn ${isInteressado ? 'demonstrou-interesse' : ''}" data-evento-id="${evento._id}" onclick="event.stopPropagation(); toggleInteresse('${evento._id}', this)" title="${isInteressado ? 'Remover interesse' : 'Demonstrar interesse'}">
                ${isInteressado ? '⭐' : '☆'}
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

    // Atualiza contador assíncrono após renderizar o card
    getContadorInteressesEvento(evento._id).then(contador => {
        const contadorAtualizado = Math.max(0, contador);
        const interessesEl = div.querySelector('.interesses-count');
        if (interessesEl) {
            interessesEl.textContent = `👥 ${contadorAtualizado} interessados`;
        }
        contadorCache[evento._id] = contadorAtualizado;
    }).catch(() => {
        const interessesEl = div.querySelector('.interesses-count');
        if (interessesEl) {
            interessesEl.textContent = `👥 0 interessados`;
        }
    });

    div.onclick = () => window.abrirPrevia(evento, imagemFinal);
    return div;
}

// --- FUNÇÕES DE INTERESSE ---

window.toggleInteresse = async function(eventoId, btnElement) {
    if (!isUsuarioLogado()) {
        window.showNotification('Atenção: é necessário estar logado para demonstrar interesse.', 'info');
        const redirect = encodeURIComponent(window.location.pathname.replace(/^\//, '') || 'index.html');
        window.location.href = `login.html?redirectTo=${redirect}`;
        return;
    }

    // Atualização otimista: inverter estado imediatamente
    const estavaInteressado = btnElement.classList.contains('demonstrou-interesse');
    const novoEstado = !estavaInteressado;

    // Desabilitar botão temporariamente
    btnElement.disabled = true;
    btnElement.style.opacity = '0.6';

    // Atualizar UI otimisticamente
    const botoes = document.querySelectorAll(`button[data-evento-id="${eventoId}"]`);
    botoes.forEach(btn => {
        if (novoEstado) {
            btn.classList.add('demonstrou-interesse');
            btn.innerHTML = '⭐';
            btn.title = 'Remover interesse';
        } else {
            btn.classList.remove('demonstrou-interesse');
            btn.innerHTML = '☆';
            btn.title = 'Demonstrar interesse';
        }
    });

    // Atualizar cache otimisticamente
    if (novoEstado) {
        interessesCache[eventoId] = true;
    } else {
        delete interessesCache[eventoId];
    }

    try {
        const response = await fetch(`${window.API_URL}/interesses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('eventhub-token')}`
            },
            body: JSON.stringify({ evento_id: eventoId })
        });

        if (isAuthError(response)) {
            forcarLogoutPorTokenInvalido();
            // Reverter otimista
            botoes.forEach(btn => {
                if (!novoEstado) {
                    btn.classList.add('demonstrou-interesse');
                    btn.innerHTML = '⭐';
                    btn.title = 'Remover interesse';
                } else {
                    btn.classList.remove('demonstrou-interesse');
                    btn.innerHTML = '☆';
                    btn.title = 'Demonstrar interesse';
                }
            });
            if (!novoEstado) {
                interessesCache[eventoId] = true;
            } else {
                delete interessesCache[eventoId];
            }
            return;
        }

        if (response.ok) {
            const data = await response.json();
            const temInteresse = data.acao === 'adicionado';
            const contador = data.contador;

            // Atualizar cache final
            if (temInteresse) {
                interessesCache[eventoId] = true;
            } else {
                delete interessesCache[eventoId];
            }

            contadorCache[eventoId] = contador;

            // Garantir UI final (caso otimista estivesse errado)
            botoes.forEach(btn => {
                if (temInteresse) {
                    btn.classList.add('demonstrou-interesse');
                    btn.innerHTML = '⭐';
                } else {
                    btn.classList.remove('demonstrou-interesse');
                    btn.innerHTML = '☆';
                }
                btn.title = temInteresse ? 'Remover interesse' : 'Demonstrar interesse';
            });

            // Atualizar contador no modal ou card
            const contadorModal = document.querySelector('.interesses-count-modal');
            if (contadorModal) {
                contadorModal.textContent = `👥 ${contador} pessoas interessadas`;
            }

            document.querySelectorAll('.event-card').forEach(card => {
                const id = card.getAttribute('data-evento-id');
                if (id === eventoId) {
                    const q = card.querySelector('.interesses-count');
                    if (q) q.textContent = `👥 ${contador} interessados`;
                }
            });

            window.showNotification(data.mensagem, 'success');
        } else {
            const error = await response.json();
            window.showNotification(error.erro || 'Erro ao processar interesse', 'error');
            // Reverter otimista em caso de erro
            botoes.forEach(btn => {
                if (!novoEstado) {
                    btn.classList.add('demonstrou-interesse');
                    btn.innerHTML = '⭐';
                    btn.title = 'Remover interesse';
                } else {
                    btn.classList.remove('demonstrou-interesse');
                    btn.innerHTML = '☆';
                    btn.title = 'Demonstrar interesse';
                }
            });
            if (!novoEstado) {
                interessesCache[eventoId] = true;
            } else {
                delete interessesCache[eventoId];
            }
        }
    } catch (err) {
        console.error('Erro ao toggle interesse:', err);
        window.showNotification('Erro de conexão', 'error');
        // Reverter otimista em caso de erro
        botoes.forEach(btn => {
            if (!novoEstado) {
                btn.classList.add('demonstrou-interesse');
                btn.innerHTML = '⭐';
                btn.title = 'Remover interesse';
            } else {
                btn.classList.remove('demonstrou-interesse');
                btn.innerHTML = '☆';
                btn.title = 'Demonstrar interesse';
            }
        });
        if (!novoEstado) {
            interessesCache[eventoId] = true;
        } else {
            delete interessesCache[eventoId];
        }
    } finally {
        // Reabilitar botão
        btnElement.disabled = false;
        btnElement.style.opacity = '';
    }
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
        const rawId = dados.id || dados._id || 'anonimo';
        if (rawId && typeof rawId === 'object' && typeof rawId.toString === 'function') {
            return rawId.toString();
        }
        return String(rawId || 'anonimo');
    } catch {
        return 'anonimo';
    }
}

function isUsuarioLogado() {
    const usuarioId = getUsuarioId();
    return usuarioId && usuarioId !== 'anonimo';
}

function forcarLogoutPorTokenInvalido() {
    localStorage.removeItem('eventhub-token');
    localStorage.removeItem('eventhub-usuario');
    window.showNotification('Sessão expirada ou token inválido. Faça login novamente.', 'error');
    setTimeout(() => window.location.href = 'login.html', 900);
}

function isAuthError(response) {
    return response && (response.status === 401 || response.status === 403);
}

// --- FUNÇÕES DE INTERESSES (AGORA VIA BACKEND) ---

// Cache local para evitar muitas requisições
let interessesCache = {};
let contadorCache = {};

async function carregarInteressesUsuario() {
    if (!isUsuarioLogado()) return;

    const usuarioId = getUsuarioId();
    try {
        const response = await fetch(`${window.API_URL}/interesses/usuario/${usuarioId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('eventhub-token')}`
            }
        });

        if (isAuthError(response)) {
            forcarLogoutPorTokenInvalido();
            return;
        }

        if (response.ok) {
            const data = await response.json();
            interessesCache = {};
            data.interesses.forEach(eventoId => {
                interessesCache[eventoId] = true;
            });
        }
    } catch (err) {
        console.error('Erro ao carregar interesses do usuário:', err);
    }
}

async function verificarInteresse(eventoId) {
    if (!isUsuarioLogado()) return { temInteresse: false, contador: 0 };

    try {
        const response = await fetch(`${window.API_URL}/interesses/${eventoId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('eventhub-token')}`
            }
        });

        if (isAuthError(response)) {
            forcarLogoutPorTokenInvalido();
            return { temInteresse: false, contador: 0 };
        }

        if (response.ok) {
            const data = await response.json();
            contadorCache[eventoId] = data.contador;
            return { temInteresse: data.temInteresse, contador: data.contador };
        }
    } catch (err) {
        console.error('Erro ao verificar interesse:', err);
    }

    return { temInteresse: false, contador: 0 };
}

async function getContadorInteressesEvento(eventoId) {
    // Primeiro tenta usar cache
    if (contadorCache[eventoId] !== undefined) {
        return contadorCache[eventoId];
    }

    // Se não tem cache, faz requisição
    try {
        const token = localStorage.getItem('eventhub-token');
        let url = `${window.API_URL}/interesses/contador/${eventoId}`;
        let headers = {};

        // Se tem token, usa a rota autenticada para também verificar se o usuário tem interesse
        if (token) {
            url = `${window.API_URL}/interesses/${eventoId}`;
            headers = {
                'Authorization': `Bearer ${token}`
            };
        }

        const response = await fetch(url, { headers });

        if (isAuthError(response)) {
            forcarLogoutPorTokenInvalido();
            // Continua com contador público quando houver token inválido
            const fallback = await fetch(`${window.API_URL}/interesses/contador/${eventoId}`);
            if (fallback.ok) {
                const data = await fallback.json();
                contadorCache[eventoId] = data.contador;
                return data.contador;
            }
            return 0;
        }

        if (response.ok) {
            const data = await response.json();
            contadorCache[eventoId] = data.contador;
            return data.contador;
        }

        // Tenta fallback público
        const fallback = await fetch(`${window.API_URL}/interesses/contador/${eventoId}`);
        if (fallback.ok) {
            const data = await fallback.json();
            contadorCache[eventoId] = data.contador;
            return data.contador;
        }
    } catch (err) {
        console.error('Erro ao buscar contador de interesses:', err);
    }

    return 0;
}

function obterSiglaEstadoPorNome(nomeEstado) {
    if (!nomeEstado) return null;
    const termo = normalizarTexto(nomeEstado);
    for (const sigla in estadosCidades) {
        if (estadosCidades[sigla] && normalizarTexto(estadosCidades[sigla].nome) === termo) {
            return sigla;
        }
    }
    return null;
}

function consegueFiltrarPorLocal(termo, estadoFiltro, cidadeFiltro) {
    if (estadoFiltro || cidadeFiltro || !termo) return false;
    const termoNormalizado = normalizarTexto(termo);

    // Busca direto por nome de estado (ex.: "espirito santo" ou "sao paulo")
    if (obterSiglaEstadoPorNome(termoNormalizado)) {
        return true;
    }

    const cidades = todosEventos.map(ev => normalizarTexto(ev.cidade || ''));
    const estados = todosEventos.map(ev => normalizarTexto(ev.estado || ''));
    return cidades.some(c => c.includes(termoNormalizado)) || estados.some(s => s.includes(termoNormalizado));
}

function filtrarEventosParaVoce(eventosBase = todosEventos, termoBusca = '', estadoFiltro = '', cidadeFiltro = '') {
    const preferencias = getPreferenciasUsuario();
    const localizacao = getLocalizacaoUsuario();

    // Só mostra "Para Você" quando há pelo menos uma preferência de categoria no perfil
    if (!preferencias || preferencias.length === 0) {
        document.getElementById('section-para-voce').style.display = 'none';
        return [];
    }

    document.getElementById('section-para-voce').style.display = 'block';

    const preferenciaMatch = preferencias.map(p => p.toLowerCase());
    const aplicarFiltroLocal = !estadoFiltro && !cidadeFiltro && !consegueFiltrarPorLocal(termoBusca, estadoFiltro, cidadeFiltro);

    return eventosBase.filter(ev => {
        const categoriaMatch = ev.categoria && preferenciaMatch.some(pref => ev.categoria.toLowerCase().includes(pref));
        if (!categoriaMatch) return false;

        if (aplicarFiltroLocal && localizacao.cidade) {
            return ev.cidade === localizacao.cidade;
        }
        if (aplicarFiltroLocal && localizacao.estado) {
            return ev.estado === localizacao.estado;
        }

        return true;
    }).slice(0, 6);
}

// 3. Modal Detalhado
window.abrirPrevia = function(evento, imgResolvida) {
    const modal = document.getElementById('event-modal');
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    // Padronização com o backend: prioriza 'local'
    const localizacao = evento.local || evento.endereco || 'Endereço não informado';
    
    // Verificar se o usuário já demonstrou interesse (usando cache)
    const jaDemonstrouInteresse = interessesCache[evento._id] || false;
    
    // Contador de interesses (global por evento) - será atualizado depois
    let contadorInteresses = 0;
    getContadorInteressesEvento(evento._id).then(contador => {
        contadorInteresses = contador;
        const contadorEl = body.querySelector('.interesses-count-modal');
        if (contadorEl) {
            contadorEl.textContent = `👥 ${contador} pessoas interessadas`;
        }
    });
    body.innerHTML = `
        <div class="modal-header">
            <img src="${imgResolvida}" class="modal-header-img" style="width:100%; max-height:300px; object-fit:cover; border-radius:8px;">
        </div>
        <div class="modal-padding" style="padding:20px; color: white;">
            <h2 style="color:#00bfff; margin-bottom:10px;">${evento.nome}</h2>
            <div class="evento-stats-modal">
                <span class="interesses-count-modal">👥 ${contadorInteresses} pessoas interessadas</span>
                <button class="btn-interesse ${jaDemonstrouInteresse ? 'demonstrou-interesse' : ''}" data-evento-id="${evento._id}" onclick="toggleInteresse('${evento._id}', this)" title="${jaDemonstrouInteresse ? 'Remover interesse' : 'Demonstrar interesse'}">
                    ${jaDemonstrouInteresse ? '⭐' : '☆'}
                </button>
            </div>
            <p><strong>📅 Data:</strong> ${formatarData(evento.data)}</p>
            <p><strong>⏰ Horário:</strong> ${evento.horario || '--:--'}</p>
            <p><strong>📍 Local:</strong> ${localizacao} - ${evento.cidade}/${evento.estado}</p>
            <hr style="border:0; border-top:1px solid #333; margin:15px 0;">
            <p style="color:#ccc; line-height:1.6; white-space: pre-wrap;">${evento.descricao || 'Sem descrição disponível.'}</p>
        </div>
    `;
    
    window.currentEventId = evento._id;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.irParaDetalhes = function() {
    if (!window.currentEventId) {
        window.showNotification('Nenhum evento selecionado.', 'info');
        return;
    }

    // Se tiver uma rota de detalhes, usar ela.
    // Por enquanto, mostra notificação para manter sem erro.
    window.showNotification('Ação de "Mais Informações" não está implementada (pode ser rota de detalhes).', 'info');
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

    // Re-verificar preferências do usuário a cada renderização (para caso de deleção de preferências)
    const preferenciasAtuais = getPreferenciasUsuario();
    const sectionParaVoce = document.getElementById('section-para-voce');
    if (sectionParaVoce) {
        if (!preferenciasAtuais || preferenciasAtuais.length === 0) {
            sectionParaVoce.style.display = 'none';
        } else {
            sectionParaVoce.style.display = 'block';
        }
    }

    // Uso de filtro local do perfil: se o usuário estiver logado e não estiver pesquisando por outra cidade/estado
    const usuarioLocal = getLocalizacaoUsuario();
    const localAplicaPorPadrao = !estado && !cidade && termo && !consegueFiltrarPorLocal(termo, estado, cidade) ? false : !termo;

    const filtrados = todosEventos.filter(ev => {
        // Busca por nome, cidade, categoria, estado, data, horário ou preço
        let matchesBusca = true;
        if (termo) {
            const termoNormalizado = normalizarTexto(termo);
            const termoDataISO = converterDataParaISO(termo);
            const siglaEstadoPorNome = obterSiglaEstadoPorNome(termoNormalizado);
            const dataFormatoAnoMesDia = ev.data ? ev.data.replace(/-/g, '/') : '';
            const dataFormatoDiaMesAno = ev.data ? ev.data.split('-').reverse().join('/') : '';

            const evEstadoNormalizado = (ev.estado && normalizarTexto(ev.estado)) || '';
            const evEstadoSigla = (ev.estado && ev.estado.toUpperCase()) || '';
            const evEstadoPorNome = obterSiglaEstadoPorNome(evEstadoNormalizado);

            matchesBusca = 
                (ev.nome && normalizarTexto(ev.nome).includes(termoNormalizado)) || 
                (ev.cidade && normalizarTexto(ev.cidade).includes(termoNormalizado)) ||
                (ev.categoria && normalizarTexto(ev.categoria).includes(termoNormalizado)) ||
                (ev.estado && evEstadoNormalizado.includes(termoNormalizado)) ||
                (siglaEstadoPorNome && evEstadoSigla === siglaEstadoPorNome) ||
                (termoDataISO && ev.data === termoDataISO) ||
                (dataFormatoAnoMesDia && dataFormatoAnoMesDia.includes(termo)) ||
                (dataFormatoDiaMesAno && dataFormatoDiaMesAno.includes(termo)) ||
                (ev.horario && ev.horario.includes(termo)) ||
                ((termoNormalizado.includes('gratuito') || termoNormalizado.includes('gratis')) && (ev.gratuito || parseFloat(ev.preco || 0) === 0)) ||
                filtrarPorPrecoTexto(ev, termoNormalizado);
        }

        const matchesEstado = estado === "" || ev.estado === estado;
        const matchesCidade = cidade === "" || ev.cidade === cidade;
        const matchesCat = categoria === "" || ev.categoria === categoria;
        const matchesPreco = ev.gratuito ? true : (parseFloat(ev.preco) <= precoMax);
        const matchesData = dataFiltro === "" || ev.data === dataFiltro;
        const matchesHorario = horarioFiltro === "" || ev.horario?.startsWith(horarioFiltro);

        let matchesLocal = true;
        if (!estado && !cidade && !consegueFiltrarPorLocal(termo, estado, cidade) && usuarioLocal.cidade) {
            matchesLocal = ev.cidade === usuarioLocal.cidade;
        } else if (!estado && !cidade && !consegueFiltrarPorLocal(termo, estado, cidade) && usuarioLocal.estado) {
            matchesLocal = ev.estado === usuarioLocal.estado;
        }

        return matchesBusca && matchesEstado && matchesCidade && matchesCat && matchesPreco && matchesData && matchesHorario && matchesLocal;
    });
    
    // Se estiver no calendário, atualizar também
    if (currentView === 'calendario') {
        renderizarCalendario();
    }

    // Dividir eventos entre 'Para Você' e 'Todos'
    const eventosParaVoce = filtrarEventosParaVoce(filtrados, termo, estado, cidade).filter(ev => filtrados.some(f => f._id === ev._id));
    const idsParaVoce = new Set(eventosParaVoce.map(ev => ev._id));
    const eventosDestacados = filtrados.filter(ev => !idsParaVoce.has(ev._id));

    const containerParaVoce = document.getElementById('eventos-para-voce');
    const mensagemParaVoce = document.getElementById('mensagem-para-voce');

    if (!preferenciasAtuais || preferenciasAtuais.length === 0) {
        if (sectionParaVoce) sectionParaVoce.style.display = 'none';
        if (containerParaVoce) containerParaVoce.innerHTML = '';
        if (mensagemParaVoce) mensagemParaVoce.style.display = 'none';
    } else {
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
        const preferenciasAtuais = getPreferenciasUsuario();
        const eventoParaVoceSection = document.getElementById('section-para-voce');
        if (eventoParaVoceSection) {
            if (!preferenciasAtuais || preferenciasAtuais.length === 0) {
                eventoParaVoceSection.style.display = 'none';
            } else {
                eventoParaVoceSection.style.display = 'block';
            }
        }

        const eventosParaVoce = filtrarEventosParaVoce();
        const containerParaVoce = document.getElementById('eventos-para-voce');
        if (containerParaVoce) {
            containerParaVoce.innerHTML = '';
            if (!preferenciasAtuais || preferenciasAtuais.length === 0) {
                // Não exibir conteúdo se não há preferências
                containerParaVoce.innerHTML = '';
            } else if (eventosParaVoce.length === 0) {
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
        const erroMensagem = err?.message ? err.message : JSON.stringify(err);
        container.innerHTML = `<p style="color:#ff4444;">❌ Falha ao conectar na API: ${erroMensagem}</p>`;
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
    await carregarInteressesUsuario(); // Carregar interesses primeiro
    await carregarEventos();
    
    // Verificar se deve esconder section "Para Você" logo na carga
    const preferenciasAtuais = getPreferenciasUsuario();
    const sectionParaVoce = document.getElementById('section-para-voce');
    if (sectionParaVoce) {
        if (!preferenciasAtuais || preferenciasAtuais.length === 0) {
            sectionParaVoce.style.display = 'none';
        }
    }
    
    // Inicializar visualização padrão após carregar eventos
    if (typeof window.setView === 'function') {
        window.setView('eventos');
    }
});

// Monitorar mudanças no usuário via localStorage para atualizar filtros em tempo real
window.addEventListener('storage', (e) => {
    if (e.key === 'eventhub-usuario' && typeof filtrarEventos === 'function') {
        // Se usuário foi atualizado (ex: preferências mudadas), re-filtrar
        filtrarEventos();
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
    const sectionParaVoce = document.getElementById('section-para-voce');
    const preferenciasAtuais = getPreferenciasUsuario();
    const paraVoceVisivel = view === 'eventos' && preferenciasAtuais && preferenciasAtuais.length > 0;
    if (sectionParaVoce) {
        sectionParaVoce.style.display = paraVoceVisivel ? 'block' : 'none';
    }

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
        const dataFormatoDiaMesAno = ev.data ? ev.data.split('-').reverse().join('/') : '';
        const dataFormatoAnoMesDia = ev.data ? ev.data.replace(/-/g, '/') : '';

        const matchesBusca = !termo || 
            ev.nome?.toLowerCase().includes(termo) || 
            ev.cidade?.toLowerCase().includes(termo) ||
            ev.categoria?.toLowerCase().includes(termo) ||
            ev.estado?.toLowerCase().includes(termo) ||
            ev.data?.includes(termo) ||
            dataFormatoDiaMesAno.includes(termo) ||
            dataFormatoAnoMesDia.includes(termo) ||
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
    window.eventosDiaSelecionados = eventosDia;

    const eventosHtml = eventosDia.map((ev, idx) => {
        let imagemFinal = ev.imagens && ev.imagens.length > 0 ? ev.imagens[0] : (ev.imagem_url || 'https://via.placeholder.com/400x200?text=Sem+Imagem');
        const preco = parseFloat(ev.preco) || 0;
        const precoTexto = (ev.gratuito || preco === 0) ? 'GRATUITO' : `R$ ${preco.toFixed(2)}`;
        const interessado = interessesCache[ev._id];

        return `
            <div class="evento-calendario-item" onclick="window.abrirPreviaCalendario(${idx})">
                <img src="${imagemFinal}" alt="${ev.nome}" class="evento-calendario-img" onerror="this.src='https://via.placeholder.com/400x200?text=Imagem+Indisponível';">
                <div class="evento-calendario-info">
                    <h3>${ev.nome}</h3>
                    <p class="evento-categoria">${ev.categoria || 'Geral'}</p>
                    <p class="evento-data">📅 ${formatarData(ev.data)}</p>
                    <p class="evento-horario">🕒 ${ev.horario || '--:--'}</p>
                    <p class="evento-preco">${precoTexto}</p>
                </div>
                <button class="btn-calendario-fav ${interessado ? 'demonstrou-interesse' : ''}" data-evento-id="${ev._id}" onclick="event.stopPropagation(); toggleInteresse('${ev._id}', this)" title="${interessado ? 'Remover interesse' : 'Demonstrar interesse'}">${interessado ? '⭐' : '☆'}</button>
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

window.abrirPreviaCalendario = function(indice) {
    const ev = window.eventosDiaSelecionados?.[indice];
    if (!ev) return;

    const imagemFinal = ev.imagens && ev.imagens.length > 0 ? ev.imagens[0] : (ev.imagem_url || 'https://via.placeholder.com/400x200?text=Sem+Imagem');
    window.abrirPrevia(ev, imagemFinal);
};