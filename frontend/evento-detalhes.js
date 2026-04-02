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
});

async function carregarDetalhesEvento(eventoId) {
    try {
        let evento = null;
        let response = await fetch(`${window.API_URL}/eventos/${eventoId}`);

        if (!response.ok) {
            // Fallback para versão que só lista eventos
            const lista = await fetch(`${window.API_URL}/eventos`);
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

        // Armazenar evento atual para uso no toggle
        window.eventoAtual = evento;

        // Preencher dados na página
        document.getElementById('evento-nome').textContent = evento.nome;
        document.getElementById('subtitulo-organizador').textContent = `Organizador: ${evento.organizador || 'Não informado'}`;
        document.getElementById('evento-data').textContent = `📅 Data: ${formatarData(evento.data)}`;
        document.getElementById('evento-horario').textContent = `⏰ Horário: ${evento.horario}`;
        document.getElementById('evento-local').textContent = `📍 Local: ${evento.local}`;
        document.getElementById('evento-categoria').textContent = `🏷️ Categoria: ${evento.categoria || 'Geral'}`;
        document.getElementById('evento-preco').textContent = `💰 Preço: ${evento.preco || 'GRATUITO'}`;
        document.getElementById('evento-descricao').textContent = evento.descricao || 'Sem descrição disponível.';

        // Imagem
        const imagemUrl = (evento.imagens && evento.imagens.length > 0) ? evento.imagens[0] : (evento.imagem || 'https://via.placeholder.com/800x450?text=Evento');
        document.getElementById('evento-imagem').src = imagemUrl;

        // Contador de interesses
        const interessesCount = evento.interesses ? evento.interesses.length : 0;
        const contadorTexto = `👥 ${interessesCount}`;
        const contadorTopo = document.getElementById('interesses-count-top');
        if (contadorTopo) contadorTopo.textContent = contadorTexto;

        // Verificar se usuário demonstrou interesse (se houver evento.interesses)
        const usuario = JSON.parse(localStorage.getItem('eventhub-usuario')) || {};
        const idUsuario = usuario._id || usuario.id;
        const demonstrouInteresse = idUsuario && evento.interesses && evento.interesses.includes(idUsuario);
        const textoInteresse = demonstrouInteresse ? '★' : '☆';
        const btnInteresseTopo = document.getElementById('btn-interesse-top');
        if (btnInteresseTopo) {
            btnInteresseTopo.textContent = textoInteresse;
            btnInteresseTopo.classList.toggle('demonstrou-interesse', demonstrouInteresse);
        }

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
        configurarMapa(evento.local, evento.endereco, evento.latitude, evento.longitude);

        // atualizar botão topo só estrela:
        const botaoTopo = document.getElementById('btn-interesse-top');
        const textoEstrela = demonstrouInteresse ? '★' : '☆';
        if (botaoTopo) {
            botaoTopo.textContent = textoEstrela;
            botaoTopo.classList.toggle('demonstrou-interesse', demonstrouInteresse);
        }

    } catch (error) {
        console.error('Erro ao carregar detalhes do evento:', error);
        alert('Erro ao carregar detalhes do evento. Tente novamente.');
        window.location.href = 'index.html';
    }
}

function configurarMapa(local, endereco, latitude, longitude) {
    const enderecoCompleto = endereco || local || 'Local não informado';
    document.getElementById('endereco-completo').textContent = enderecoCompleto;

    const mapaIframe = document.getElementById('mapa-iframe');
    const mapaLeafletContainer = document.getElementById('mapa-leaflet');

    if (latitude && longitude && mapaLeafletContainer && window.L) {
        mapaIframe.style.display = 'none';
        mapaLeafletContainer.style.display = 'block';

        mapaLeafletContainer.innerHTML = '';
        const map = L.map('mapa-leaflet').setView([parseFloat(latitude), parseFloat(longitude)], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        L.marker([parseFloat(latitude), parseFloat(longitude)]).addTo(map)
            .bindPopup(enderecoCompleto)
            .openPopup();
        return;
    }

    // fallback para iframe do Google Maps
    if (mapaLeafletContainer) mapaLeafletContainer.style.display = 'none';
    if (mapaIframe) {
        mapaIframe.style.display = 'block';
        const enderecoEncoded = encodeURIComponent(enderecoCompleto);
        mapaIframe.src = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dOMLD0k8XKTQ&zoom=15&q=${enderecoEncoded}`;
    }
}

function abrirModalImagem(src) {
    const modal = document.getElementById('modal-imagem');
    const img = document.getElementById('imagem-modal-force');
    if (!modal || !img) return;

    modal.style.display = 'flex';
    img.src = src;
    img.style.transform = 'scale(1)';
    img.dataset.zoom = '1';
}

function fecharModalImagem(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('modal-imagem');
    if (!modal) return;
    modal.style.display = 'none';
}

const imagemZoom = document.getElementById('imagem-modal-force');
if (imagemZoom) {
    imagemZoom.addEventListener('wheel', (e) => {
        e.preventDefault();
        let zoom = parseFloat(imagemZoom.dataset.zoom || '1');
        zoom += e.deltaY * -0.005;
        zoom = Math.min(Math.max(1, zoom), 3);
        imagemZoom.style.transform = `scale(${zoom})`;
        imagemZoom.dataset.zoom = zoom.toString();
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

async function toggleInteresseClique(button) {
    // Pega ID da URL, não do objeto que pode ser undefined
    const urlParams = new URLSearchParams(window.location.search);
    const eventoId = urlParams.get('id');
    
    if (!eventoId || !window.eventoAtual) {
        console.error('eventoId=', eventoId, 'eventoAtual=', window.eventoAtual);
        alert('ID do evento não encontrado. Atualize a página e tente de novo.');
        return;
    }
    
    // Validar token antes de fazer chamada
    const token = localStorage.getItem('eventhub-token');
    const usuarioStr = localStorage.getItem('eventhub-usuario');
    
    console.log('=== TOGGLE CHECK ===');
    console.log('Token exists:', !!token);
    console.log('Usuario exists:', !!usuarioStr);
    console.log('eventoId:', eventoId);
    
    if (!token || !usuarioStr) {
        alert('Sessão expirada. Faça login novamente.');
        window.location.href = 'login.html?redirectTo=evento-detalhes.html%3Fid=' + eventoId;
        return;
    }
    
    // Verificar token em background (não bloqueia)
    try {
        const checkResp = await fetch(`${window.API_URL}/auth/check`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Token check response:', checkResp.status);
        if (checkResp.status === 403) {
            console.error('Token inválido');
            localStorage.removeItem('eventhub-token');
            localStorage.removeItem('eventhub-usuario');
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = 'login.html?redirectTo=evento-detalhes.html%3Fid=' + eventoId;
            return;
        }
    } catch (e) {
        console.warn('Não conseguiu verificar token:', e);
    }

    await toggleInteresse(eventoId, button);
}

async function toggleInteresse(eventoId, button) {
    console.log('=== toggleInteresse START ===');
    console.log('eventoId:', eventoId);
    console.log('button:', button);
    console.log('button classe:', button?.className);
    
    if (!eventoId) {
        alert('ID do evento não encontrado. Atualize a página e tente de novo.');
        return;
    }

    const usuarioStr = localStorage.getItem('eventhub-usuario');
    const token = localStorage.getItem('eventhub-token');
    
    console.log('token exists:', !!token);
    console.log('usuarioStr exists:', !!usuarioStr);

    let usuario = null;
    try {
        usuario = JSON.parse(usuarioStr);
    } catch (e) {
        console.error('Erro parse usuario:', e);
    }

    if (!usuario || !token) {
        alert('Você precisa estar logado para demonstrar interesse.');
        return;
    }
    
    console.log('usuario:', usuario);
    console.log('usuario.id:', usuario.id, 'usuario._id:', usuario._id);

    // Atualização otimista
    const demonstrouInteresse = button.classList.contains('demonstrou-interesse');
    const novoEstado = !demonstrouInteresse;

    // Atualizar UI imediatamente
    const btnInteresseTopo = document.getElementById('btn-interesse-top');
    const textoEstrela = novoEstado ? '★' : '☆';
    [button, btnInteresseTopo].forEach(b => {
        if (!b) return;
        b.textContent = textoEstrela;
        b.classList.toggle('demonstrou-interesse', novoEstado);
    });

    // Atualizar contador
    const interessesCountTopo = document.getElementById('interesses-count-top');
    let count = parseInt(interessesCountTopo?.textContent.match(/\d+/)?.[0] || '0');
    count = novoEstado ? count + 1 : Math.max(0, count - 1);
    const novoTextoContador = `👥 ${count}`;
    if (interessesCountTopo) interessesCountTopo.textContent = novoTextoContador;

    try {
        console.debug('toggleInteresse: eventoId=', eventoId, 'tokenExists=', Boolean(token), 'usuario=', usuario);

        const response = await fetch(`${window.API_URL}/interesses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ evento_id: eventoId })
        });

        if (!response.ok) {
            const detalhes = await response.text();
            throw new Error(`Erro ao atualizar interesse (${response.status}): ${detalhes}`);
        }

        const data = await response.json();
        const usuarioId = String(usuario.id || usuario._id || '');

        // Atualiza eventoAtual local se possível (manter consistência sem recarregar)
        if (window.eventoAtual) {
            if (!window.eventoAtual.interesses || !Array.isArray(window.eventoAtual.interesses)) {
                window.eventoAtual.interesses = [];
            }

            if (novoEstado) {
                if (usuarioId && !window.eventoAtual.interesses.includes(usuarioId)) {
                    window.eventoAtual.interesses.push(usuarioId);
                }
            } else {
                if (usuarioId) {
                    window.eventoAtual.interesses = window.eventoAtual.interesses.filter(id => String(id) !== usuarioId);
                }
            }
        }

        const contadorServidor = Number.isFinite(Number(data.contador)) ? Number(data.contador) : count;
        const interessesCountTopo2 = document.getElementById('interesses-count-top');
        if (interessesCountTopo2) interessesCountTopo2.textContent = `👥 ${contadorServidor}`;

    } catch (error) {
        console.error('Erro ao toggle interesse:', error);
        // Reverter UI em caso de erro
        const elementoTopo = document.getElementById('btn-interesse-top');
        const textoEstrela = demonstrouInteresse ? '★' : '☆';
        [button, elementoTopo].forEach(b => {
            if (!b) return;
            b.textContent = textoEstrela;
            b.classList.toggle('demonstrou-interesse', demonstrouInteresse);
        });

        const interessesCountTopo = document.getElementById('interesses-count-top');
        if (interessesCountTopo) {
            let count = parseInt(interessesCountTopo.textContent.match(/\d+/)?.[0] || '0');
            const revertCount = demonstrouInteresse ? count + 1 : Math.max(0, count - 1);
            interessesCountTopo.textContent = `👥 ${revertCount}`;
        }

        // Se erro 403, token está inválido
        if (error.message && error.message.includes('403')) {
            localStorage.removeItem('eventhub-token');
            localStorage.removeItem('eventhub-usuario');
            alert('Sessão expirou. Faça login novamente.');
            window.location.href = 'login.html';
        } else {
            alert(`Erro ao atualizar interesse: ${error.message}`);
        }
    }
}