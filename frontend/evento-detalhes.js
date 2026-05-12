// evento-detalhes.js
document.addEventListener('DOMContentLoaded', function() {
    // Não bloquear acesso para usuário não logado (detalhes podem ser públicos)
    const usuario = JSON.parse(localStorage.getItem('eventhub-usuario')) || null;

    // Atualizar link de login/logout se disponível
    const loginLink = document.getElementById('login-link');
    if (loginLink) {
        if (usuario) {
            loginLink.textContent = 'Logout';
            loginLink.href = '#';
            loginLink.onclick = function() {
                localStorage.removeItem('eventhub-usuario');
                window.location.href = 'index.html';
            };
        } else {
            loginLink.textContent = 'Login';
            loginLink.href = 'login.html';
            loginLink.onclick = null;
        }
    }

    // Obter ID do evento da URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventoId = urlParams.get('id');

    if (!eventoId) {
        alert('ID do evento não encontrado.');
        window.location.href = 'index.html';
        return;
    }

    // Carregar detalhes do evento
    carregarDetalhesEvento(eventoId);
    
    // DEBUG: Função para visualizar dados na página
    window.verDebug = function() {
        const debugDiv = document.createElement('div');
        debugDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: black;
            color: #0f0;
            padding: 15px;
            border: 2px solid #0f0;
            font-family: monospace;
            font-size: 11px;
            max-width: 400px;
            max-height: 600px;
            overflow: auto;
            z-index: 99999;
            border-radius: 5px;
        `;
        
        let html = '<strong>DEBUG INFO</strong><br>';
        if (window.DEBUG_EVENTO) {
            html += `ID: ${window.DEBUG_EVENTO._id || window.DEBUG_EVENTO.id}<br>`;
            html += `Nome: ${window.DEBUG_EVENTO.nome}<br>`;
            html += `Latitude: <span style="color: yellow">${window.DEBUG_EVENTO.latitude}</span> (${typeof window.DEBUG_EVENTO.latitude})<br>`;
            html += `Longitude: <span style="color: yellow">${window.DEBUG_EVENTO.longitude}</span> (${typeof window.DEBUG_EVENTO.longitude})<br>`;
            html += `Local: ${window.DEBUG_EVENTO.local}<br>`;
            html += `Endereco: ${window.DEBUG_EVENTO.endereco}<br><br>`;
            html += `<button onclick="this.parentElement.remove()" style="padding:5px;background:#0f0;color:black;border:none;cursor:pointer;">Fechar</button>`;
        } else {
            html += 'DEBUG_EVENTO não disponível';
        }
        
        debugDiv.innerHTML = html;
        document.body.appendChild(debugDiv);
    };
    
    // Debug box removido - comentado
    // setTimeout(() => {
    //     window.verDebug();
    // }, 2000);
});

async function carregarDetalhesEvento(eventoId) {
    try {
        console.log('\\n==================== INICIO CARREGAMENTO ====================');
        console.log('[PASSO 1] eventoId:', eventoId);
        
        let evento = null;
        const urlEvento = `${window.API_URL}/eventos/${eventoId}`;
        console.log('[PASSO 2] URL fetch:', urlEvento);
        
        let response = await fetch(urlEvento, { headers: getAuthHeadersDetalhes() });
        console.log('[PASSO 3] Response status:', response.status, response.statusText);

        if (!response.ok) {
            console.warn('[PASSO 4] GET por ID falhou, usando fallback');
            // Fallback para versão que só lista eventos
            const lista = await fetch(`${window.API_URL}/eventos`, { headers: getAuthHeadersDetalhes() });
            if (lista.ok) {
                const todos = await lista.json();
                evento = todos.find(e => e._id === eventoId || e.id === eventoId);
            }
            if (!evento) {
                throw new Error('Evento não encontrado');
            }
        } else {
            evento = await response.json();
        }
        
        console.log('[PASSO 5] Evento recebido do servidor:');
        console.log('  - _id:', evento._id);
        console.log('  - nome:', evento.nome);
        console.log('  - latitude:', evento.latitude, '(type:', typeof evento.latitude + ')');
        console.log('  - longitude:', evento.longitude, '(type:', typeof evento.longitude + ')');
        console.log('  - local:', evento.local);
        console.log('  - endereco:', evento.endereco);
        window.DEBUG_EVENTO = evento;

        // Armazenar evento atual para uso no toggle
        window.eventoAtual = evento;

        // Preencher dados na página
        document.getElementById('evento-nome').textContent = evento.nome;
        const organizadorExibicao = evento.organizador || evento.organizador_id || 'Não informado';
        document.getElementById('subtitulo-organizador').textContent = `Organizador: ${organizadorExibicao}`;

        const datasEvento = normalizarDatasEvento(evento);
        const agora = new Date();
        const proximaData = datasEvento.find(d => {
            const tentativa = new Date(`${d.data}T${d.horario_inicio || '00:00'}`);
            return tentativa >= agora;
        }) || datasEvento[0] || { data: '', horario_inicio: '', horario_fim: '' };

        document.getElementById('evento-data').textContent = `📅 Data: ${formatarData(proximaData.data)}`;
        document.getElementById('evento-horario').textContent = `⏰ Horário: ${formatarHorario(proximaData.horario_inicio)}${proximaData.horario_fim ? ' - ' + proximaData.horario_fim : ''}`;
        const categoriasAgrupadas = agruparSubcategoriasPorCategoria(evento.subcategorias || []);
        document.getElementById('evento-categoria').textContent = '🏷️ Categorias:';
        const categoriasListEl = document.getElementById('evento-categorias-list');
        if (categoriasListEl) {
            if (evento.subcategorias && evento.subcategorias.length > 0) {
                const categoriasTexto = Object.keys(categoriasAgrupadas);
                categoriasListEl.innerHTML = categoriasTexto.map(categoria => {
                    const subcats = categoriasAgrupadas[categoria] || [];
                    return `
                        <div class="evento-categoria-grupo">
                            <strong>${categoria}</strong>
                            <div class="subcategoria-list">${subcats.map(s => `<span class="subcategoria-tag">${s}</span>`).join('')}</div>
                        </div>
                    `;
                }).join('');
            } else {
                categoriasListEl.innerHTML = '';
            }
        }
        document.getElementById('evento-preco').textContent = `💰 Preço: ${evento.preco || 'GRATUITO'}`;
        document.getElementById('evento-descricao').textContent = evento.descricao || 'Sem descrição disponível.';
        const enderecoCompleto = evento.local || evento.endereco || 'Endereço completo não informado.';
        const enderecoEl = document.getElementById('endereco-completo');
        if (enderecoEl) enderecoEl.textContent = enderecoCompleto;

        const listaDatas = document.getElementById('evento-datas-list');
        if (listaDatas) {
            if (datasEvento.length > 1) {
                listaDatas.innerHTML = datasEvento.map(d => {
                    return `<p>📅 ${formatarData(d.data)} ${d.horario_inicio ? `⏰ ${formatarHorario(d.horario_inicio)}${d.horario_fim ? ' - ' + d.horario_fim : ''}` : ''}</p>`;
                }).join('');
            } else {
                listaDatas.innerHTML = '';
            }
        }

        // Imagem
        const imagemUrl = (evento.imagens && evento.imagens.length > 0) ? evento.imagens[0] : (evento.imagem || 'https://via.placeholder.com/800x450?text=Evento');
        document.getElementById('evento-imagem').src = imagemUrl;

        await inicializarBotaoInteresse(eventoId);

        // Gallery
        const galeria = document.getElementById('evento-fotos');
        const galeriaContainer = document.getElementById('galeria-fotos');
        galeriaContainer.innerHTML = '';

        if (evento.imagens && evento.imagens.length > 1) {
            galeria.style.display = 'block';
            evento.imagens.slice(1).forEach(url => {
                const item = document.createElement('div');
                item.className = 'galeria-foto-item';
                item.innerHTML = `<img src="${url}" alt="Foto do evento" onclick="abrirModalImagem('${url}')">`;
                galeriaContainer.appendChild(item);
            });
        } else {
            galeria.style.display = 'none';
        }

        // Configurar mapa
        console.log('[PASSO 6] Sobre chamada configurarMapa:');
        console.log('  - local:', evento.local);
        console.log('  - endereco:', evento.endereco);
        console.log('  - latitude:', evento.latitude);
        console.log('  - longitude:', evento.longitude);
        await configurarMapa(evento.local, evento.endereco, evento.latitude, evento.longitude);

    } catch (error) {
        console.error('Erro ao carregar detalhes do evento:', error);
        alert('Erro ao carregar detalhes do evento. Tente novamente.');
        window.location.href = 'index.html';
    }
}

function atualizarBotaoInteresseDetalhes(temInteresse, contador) {
    const button = document.getElementById('btn-interesse-evento');
    const contadorEl = document.getElementById('contador-interesse');
    if (!button || !contadorEl) return;

    button.textContent = temInteresse ? '★' : '☆';
    button.classList.toggle('interessado', temInteresse);
    contadorEl.textContent = `👥 ${contador || 0}`;
    button.title = temInteresse ? 'Clique para remover interesse' : 'Clique para marcar interesse';
}

function isUsuarioLogadoDetalhes() {
    return !!localStorage.getItem('eventhub-token') && !!localStorage.getItem('eventhub-usuario');
}

function getAuthHeadersDetalhes() {
    const token = localStorage.getItem('eventhub-token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function isAuthErrorDetalhes(response) {
    return response && (response.status === 401 || response.status === 403);
}

function forcarLogoutPorTokenInvalidoDetalhes() {
    localStorage.removeItem('eventhub-token');
    localStorage.removeItem('eventhub-usuario');
    if (typeof window.showNotification === 'function') {
        window.showNotification('Sessão expirada ou token inválido. Faça login novamente.', 'error');
    }
    setTimeout(() => window.location.href = 'login.html', 900);
}

async function inicializarBotaoInteresse(eventoId) {
    const btn = document.getElementById('btn-interesse-evento');
    if (!btn) {
        console.warn('Botão de interesse não encontrado na página');
        return;
    }

    console.log('Inicializando botão de interesse para evento:', eventoId);
    console.log('Usuário logado:', isUsuarioLogadoDetalhes());

    btn.onclick = async () => {
        console.log('Botão de interesse clicado');
        if (!isUsuarioLogadoDetalhes()) {
            console.log('Usuário não logado, redirecionando para login');
            window.location.href = 'login.html';
            return;
        }
        btn.disabled = true;
        console.log('Chamando alternarInteresseDetalhes');
        await alternarInteresseDetalhes(eventoId);
        btn.disabled = false;
    };

    console.log('Carregando status de interesse');
    await carregarStatusInteresseDetalhes(eventoId);
}

async function carregarStatusInteresseDetalhes(eventoId) {
    const btn = document.getElementById('btn-interesse-evento');
    const contadorEl = document.getElementById('contador-interesse');
    if (!btn || !contadorEl) {
        console.warn('Elementos do botão de interesse não encontrados');
        return;
    }

    console.log('Carregando status de interesse para evento:', eventoId);
    try {
        const response = await fetch(`${window.API_URL}/interesses/${encodeURIComponent(eventoId)}`, {
            headers: getAuthHeadersDetalhes()
        });
        console.log('Resposta da API de interesse:', response.status, response.statusText);
        const data = await response.json();
        console.log('Dados recebidos:', data);
        if (response.ok) {
            atualizarBotaoInteresseDetalhes(data.temInteresse, data.contador);
        } else {
            if (isAuthErrorDetalhes(response)) {
                forcarLogoutPorTokenInvalidoDetalhes();
                return;
            }
            console.warn('Erro na resposta da API:', data);
            atualizarBotaoInteresseDetalhes(false, 0);
        }
    } catch (error) {
        console.error('Erro ao carregar status de interesse:', error);
        atualizarBotaoInteresseDetalhes(false, 0);
    }
}

async function alternarInteresseDetalhes(eventoId) {
    const btn = document.getElementById('btn-interesse-evento');
    if (!btn) return;

    console.log('Alternando interesse para evento:', eventoId);
    try {
        const response = await fetch(`${window.API_URL}/interesses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeadersDetalhes()
            },
            body: JSON.stringify({ evento_id: eventoId })
        });
        console.log('Resposta da API POST interesse:', response.status, response.statusText);
        const data = await response.json();
        console.log('Dados da resposta POST:', data);

        if (response.ok && data) {
            atualizarBotaoInteresseDetalhes(data.acao === 'adicionado', data.contador || 0);
            if (typeof window.showNotification === 'function') {
                window.showNotification(data.mensagem || 'Interesse atualizado', 'success');
            }
        } else {
            if (isAuthErrorDetalhes(response)) {
                forcarLogoutPorTokenInvalidoDetalhes();
                return;
            }
            console.error('Erro na resposta POST:', data);
            if (typeof window.showNotification === 'function') {
                window.showNotification(data?.erro || 'Falha ao atualizar interesse', 'error');
            }
        }
    } catch (error) {
        console.error('Erro ao alternar interesse:', error);
        if (typeof window.showNotification === 'function') {
            window.showNotification('Erro ao comunicar com o servidor', 'error');
        }
    }
}

function agruparSubcategoriasPorCategoria(subcategorias = []) {
    if (!Array.isArray(subcategorias) || subcategorias.length === 0) return {};
    const categorias = {};
    subcategorias.forEach((subcat) => {
        const categoria = typeof obterCategoriaPorSubcategoria === 'function' ? obterCategoriaPorSubcategoria(subcat) : 'Outros';
        if (!categorias[categoria]) categorias[categoria] = [];
        if (!categorias[categoria].includes(subcat)) categorias[categoria].push(subcat);
    });
    return categorias;
}

async function buscarCoordenadasDetalhes(endereco) {
    if (!endereco) return null;
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1&countrycodes=br`;
        console.log('[MAPA-GEO] Fazendo geocoding para:', endereco);
        const res = await fetch(url, {
            headers: { 'Accept-Language': 'pt-BR,pt;q=0.9', 'User-Agent': 'EventHub-Detalhes/1.0' }
        });
        const dados = await res.json();
        console.log('[MAPA-GEO] Geocoding resposta:', dados);
        if (Array.isArray(dados) && dados.length > 0) {
            return { lat: parseFloat(dados[0].lat), lon: parseFloat(dados[0].lon), display_name: dados[0].display_name };
        }
    } catch (err) {
        console.warn('Erro geocodificando evento:', err);
    }
    return null;
}

async function configurarMapa(local, endereco, latitude, longitude) {
    console.log('========== CONFIGURAR MAPA ==========');
    console.log('[MAPA-01] Parametros recebidos:', { local, endereco, latitude, longitude });
    
    const enderecoCompleto = (endereco || local || 'Local não informado').trim();
    document.getElementById('endereco-completo').textContent = enderecoCompleto;
    console.log('[MAPA-02] Endereco completo:', enderecoCompleto);

    const mapaIframe = document.getElementById('mapa-iframe');
    const mapaLeafletContainer = document.getElementById('mapa-leaflet');
    console.log('[MAPA-03] Elementos:', { mapaIframe: !!mapaIframe, mapaLeafletContainer: !!mapaLeafletContainer, L: !!window.L });

    if (mapaIframe) mapaIframe.style.display = 'none';
    if (!mapaLeafletContainer || !window.L) {
        console.warn('[MAPA-04] Leaflet não disponível ou container ausente');
        if (mapaIframe) {
            mapaIframe.style.display = 'block';
            mapaIframe.src = 'https://www.openstreetmap.org/export/embed.html?bbox=-54,-33,-46,-23&layer=mapnik';
        }
        return;
    }

    mapaLeafletContainer.style.display = 'block';
    console.log('[MAPA-05] Container Leaflet exibido');

    if (window.mapDetalhes) {
        window.mapDetalhes.remove();
        window.mapDetalhes = null;
    }
    console.log('[MAPA-06] Mapa anterior removido se existia');

    window.mapDetalhes = L.map('mapa-leaflet', {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
        tap: true
    }).setView([-15.7801, -47.9292], 4);
    console.log('[MAPA-07] Mapa Leaflet criado');
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(window.mapDetalhes);
    console.log('[MAPA-08] Tile layer adicionado');

    // Aguardar o mapa renderizar antes de adicionar marcador
    await new Promise(resolve => {
        setTimeout(() => {
            if (window.mapDetalhes) {
                window.mapDetalhes.invalidateSize();
                console.log('[MAPA-09] invalidateSize executado');
            }
            resolve();
        }, 100);
    });

    // Parsing com VALIDAÇÃO SIMPLES, evitando tratar null como 0
    let lat = latitude === null || latitude === undefined || latitude === '' ? NaN : Number(latitude);
    let lon = longitude === null || longitude === undefined || longitude === '' ? NaN : Number(longitude);
    console.log('[MAPA-10] Valores parseados:', { latitude, longitude, lat, lon, latitudeType: typeof latitude, longitudeType: typeof longitude });
    
    // VALIDAÇÃO CORRETA: latitude e longitude não devem ser null/'' e devem ser finitos
    const hasFiniteCoords = latitude !== null && longitude !== null && latitude !== '' && longitude !== '' && Number.isFinite(lat) && Number.isFinite(lon);
    console.log('[MAPA-11] hasFiniteCoords:', hasFiniteCoords);

    if (!hasFiniteCoords) {
        console.log('[MAPA-12] Coordenadas inválidas ou ausentes, tentando geocoding...');
        const geolocal = await buscarCoordenadasDetalhes(enderecoCompleto);
        if (geolocal) {
            lat = geolocal.lat;
            lon = geolocal.lon;
            console.log('[MAPA-13] Geocoding sucesso:', { lat, lon });
        } else {
            console.warn('[MAPA-13] Geocoding falhou');
        }
    } else {
        console.log('[MAPA-12] Coordenadas são válidas. lat=', lat, 'lon=', lon);
    }

    // Renderizar marcador se coordenadas forem números finitos
    console.log('[MAPA-14] Checagem final:', { lat, lon, isFinite: (Number.isFinite(lat) && Number.isFinite(lon)) });
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
        console.log('[MAPA-15] RENDERIZANDO MARCADOR EM:', [lat, lon]);
        window.mapDetalhes.invalidateSize(true);
        window.mapDetalhes.setView([lat, lon], 14, { animate: true, duration: 0.5 });

        const pinIcon = L.divIcon({
            className: 'custom-marker-icon',
            html: '<div style="width:28px;height:28px;border-radius:50%;background:#1493ff;border:4px solid white;box-shadow:0 0 12px rgba(20,147,255,0.9);"></div>',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -14]
        });

        const marcador = L.marker([lat, lon], { icon: pinIcon, title: 'Local do evento' })
            .addTo(window.mapDetalhes)
            .bindPopup(enderecoCompleto);

        window.mapDetalhes.whenReady(() => {
            window.mapDetalhes.invalidateSize(true);
            marcador.openPopup();
        });

        console.log('[MAPA-16] MARCADOR RENDERIZADO');
    } else {
        console.error('[MAPA-15] ERRO: Coordenadas inválidas para renderizar marcador. lat:', lat, 'lon:', lon);
    }
}

function abrirModalImagem(src) {
    const modal = document.getElementById('modal-imagem');
    const img = document.getElementById('imagem-modal-force');
    if (!modal || !img) return;

    modal.style.display = 'flex';
    img.src = src;
    img.style.transform = 'scale(1) translate(0px, 0px)';
    img.dataset.zoom = '1';
    img.dataset.translateX = '0';
    img.dataset.translateY = '0';
    img.classList.remove('grabbable', 'dragging');
    img.style.cursor = 'zoom-in';
}

function fecharModalImagem(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('modal-imagem');
    if (!modal) return;
    modal.style.display = 'none';
}

const imagemZoom = document.getElementById('imagem-modal-force');
if (imagemZoom) {
    let isDraggingImage = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let lastTranslateX = 0;
    let lastTranslateY = 0;

    imagemZoom.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    imagemZoom.addEventListener('wheel', (e) => {
        e.preventDefault();
        let zoom = parseFloat(imagemZoom.dataset.zoom || '1');
        const translateX = parseFloat(imagemZoom.dataset.translateX || '0');
        const translateY = parseFloat(imagemZoom.dataset.translateY || '0');

        zoom += e.deltaY * -0.005;
        zoom = Math.min(Math.max(1, zoom), 3);
        imagemZoom.style.transform = `scale(${zoom}) translate(${translateX}px, ${translateY}px)`;
        imagemZoom.dataset.zoom = zoom.toString();

        if (zoom > 1) {
            imagemZoom.classList.add('grabbable');
            imagemZoom.style.cursor = 'grab';
        } else {
            imagemZoom.classList.remove('grabbable', 'dragging');
            imagemZoom.style.cursor = 'zoom-in';
            imagemZoom.dataset.translateX = '0';
            imagemZoom.dataset.translateY = '0';
        }
    });

    imagemZoom.addEventListener('pointerdown', (e) => {
        const zoom = parseFloat(imagemZoom.dataset.zoom || '1');
        if (zoom <= 1) return;

        e.preventDefault();
        isDraggingImage = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        lastTranslateX = parseFloat(imagemZoom.dataset.translateX || '0');
        lastTranslateY = parseFloat(imagemZoom.dataset.translateY || '0');
        imagemZoom.classList.add('dragging');
        imagemZoom.setPointerCapture(e.pointerId);
    });

    imagemZoom.addEventListener('pointermove', (e) => {
        if (!isDraggingImage) return;

        e.preventDefault();
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        const translateX = lastTranslateX + dx;
        const translateY = lastTranslateY + dy;
        const zoom = parseFloat(imagemZoom.dataset.zoom || '1');

        imagemZoom.dataset.translateX = translateX.toString();
        imagemZoom.dataset.translateY = translateY.toString();
        imagemZoom.style.transform = `scale(${zoom}) translate(${translateX}px, ${translateY}px)`;
    });

    const stopDragging = (e) => {
        if (!isDraggingImage) return;
        isDraggingImage = false;
        imagemZoom.classList.remove('dragging');
        if (e && e.pointerId) imagemZoom.releasePointerCapture(e.pointerId);
    };

    imagemZoom.addEventListener('pointerup', stopDragging);
    imagemZoom.addEventListener('pointercancel', stopDragging);

    imagemZoom.addEventListener('dblclick', (e) => {
        e.preventDefault();
        imagemZoom.dataset.zoom = '1';
        imagemZoom.dataset.translateX = '0';
        imagemZoom.dataset.translateY = '0';
        imagemZoom.style.transform = 'scale(1) translate(0px, 0px)';
        imagemZoom.classList.remove('grabbable', 'dragging');
        imagemZoom.style.cursor = 'zoom-in';
    });
}

function formatarData(dataString) {
    if (!dataString) return 'Data não informada';

    // Parsear data ISO (YYYY-MM-DD) como LOCAL timezone, não UTC
    const isoMatch = dataString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    let data;
    if (isoMatch) {
        const ano = parseInt(isoMatch[1], 10);
        const mes = parseInt(isoMatch[2], 10);
        const dia = parseInt(isoMatch[3], 10);
        data = new Date(ano, mes - 1, dia); // Cria data em timezone LOCAL
    } else {
        data = new Date(dataString);
    }

    if (Number.isNaN(data.getTime())) {
        return dataString;
    }
    return data.toLocaleDateString('pt-BR');
}

function formatarHorario(horario) {
    if (!horario) return 'A definir';
    return horario;
}

function normalizarDatasEvento(evento) {
    let datas = [];

    if (Array.isArray(evento.datas) && evento.datas.length > 0) {
        datas = evento.datas
            .filter(item => item && item.data)
            .map(item => ({
                data: item.data,
                horario_inicio: item.horario_inicio || item.horario || '',
                horario_fim: item.horario_fim || ''
            }));
    }

    if (datas.length === 0 && evento.data) {
        datas.push({
            data: evento.data,
            horario_inicio: evento.horario || '',
            horario_fim: evento.horario_fim || ''
        });
    }

    datas.sort((a, b) => {
        const aTime = new Date(`${a.data}T${a.horario_inicio || '00:00'}`).getTime();
        const bTime = new Date(`${b.data}T${b.horario_inicio || '00:00'}`).getTime();
        return aTime - bTime;
    });

    return datas;
}


