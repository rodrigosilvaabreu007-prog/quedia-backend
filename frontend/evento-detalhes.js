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
        configurarMapa(evento.local, evento.endereco);

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

function configurarMapa(local, endereco) {
    const enderecoCompleto = endereco || local;
    document.getElementById('endereco-completo').textContent = enderecoCompleto;

    // Usar Google Maps embed
    const mapaIframe = document.getElementById('mapa-iframe');
    const enderecoEncoded = encodeURIComponent(enderecoCompleto);
    mapaIframe.src = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dOMLD0k8XKTQ&zoom=15&q=${enderecoEncoded}`;
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
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

async function toggleInteresse(eventoId, button) {
    const usuario = JSON.parse(localStorage.getItem('eventhub-usuario'));
    if (!usuario) {
        alert('Você precisa estar logado para demonstrar interesse.');
        return;
    }

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
        const response = await fetch(`${window.API_URL}/interesses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${usuario.token}`
            },
            body: JSON.stringify({ evento_id: eventoId })
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar interesse');
        }

        // Atualizar evento atual
        const evento = await response.json();
        window.eventoAtual = evento;

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

        alert('Erro ao atualizar interesse. Tente novamente.');
    }
}