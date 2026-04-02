// evento-detalhes.js
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se usuário está logado
    const usuario = JSON.parse(localStorage.getItem('eventhub-usuario'));
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }

    // Atualizar link de login/logout
    const loginLink = document.getElementById('login-link');
    if (usuario) {
        loginLink.textContent = 'Logout';
        loginLink.href = '#';
        loginLink.onclick = function() {
            localStorage.removeItem('eventhub-usuario');
            window.location.href = 'index.html';
        };
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
        const response = await fetch(`${API_BASE_URL}/eventos/${eventoId}`);
        if (!response.ok) {
            throw new Error('Erro ao carregar evento');
        }
        const evento = await response.json();

        // Armazenar evento atual para uso no toggle
        window.eventoAtual = evento;

        // Preencher dados na página
        document.getElementById('evento-nome').textContent = evento.nome;
        document.getElementById('evento-data').textContent = `📅 Data: ${formatarData(evento.data)}`;
        document.getElementById('evento-horario').textContent = `⏰ Horário: ${evento.horario}`;
        document.getElementById('evento-local').textContent = `📍 Local: ${evento.local}`;
        document.getElementById('evento-categoria').textContent = `🏷️ Categoria: ${evento.categoria || 'Geral'}`;
        document.getElementById('evento-preco').textContent = `💰 Preço: ${evento.preco || 'GRATUITO'}`;
        document.getElementById('evento-descricao').textContent = evento.descricao || 'Sem descrição disponível.';
        document.getElementById('evento-organizador-info').textContent = `Organizado por: ${evento.organizador || 'Não informado'}`;

        // Imagem
        if (evento.imagem) {
            document.getElementById('evento-imagem').src = evento.imagem;
        } else {
            document.getElementById('evento-imagem').src = 'https://via.placeholder.com/600x300?text=Evento';
        }

        // Contador de interesses
        const interessesCount = evento.interesses ? evento.interesses.length : 0;
        document.getElementById('interesses-count').textContent = `👥 ${interessesCount} pessoa${interessesCount !== 1 ? 's' : ''} interessada${interessesCount !== 1 ? 's' : ''}`;

        // Verificar se usuário demonstrou interesse
        const usuario = JSON.parse(localStorage.getItem('eventhub-usuario'));
        const demonstrouInteresse = evento.interesses && evento.interesses.includes(usuario._id);
        const btnInteresse = document.getElementById('btn-interesse');
        btnInteresse.textContent = demonstrouInteresse ? '★ Interesse Demonstrado' : '☆ Demonstrar Interesse';
        btnInteresse.classList.toggle('demonstrou-interesse', demonstrouInteresse);

        // Configurar mapa
        configurarMapa(evento.local, evento.endereco);

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
    button.textContent = novoEstado ? '★ Interesse Demonstrado' : '☆ Demonstrar Interesse';
    button.classList.toggle('demonstrou-interesse', novoEstado);

    // Atualizar contador
    const interessesCountEl = document.getElementById('interesses-count');
    let count = parseInt(interessesCountEl.textContent.match(/\d+/)[0]);
    count = novoEstado ? count + 1 : count - 1;
    interessesCountEl.textContent = `👥 ${count} pessoa${count !== 1 ? 's' : ''} interessada${count !== 1 ? 's' : ''}`;

    try {
        const response = await fetch(`${API_BASE_URL}/eventos/${eventoId}/interesse`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${usuario.token}`
            },
            body: JSON.stringify({ usuarioId: usuario._id })
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
        button.textContent = demonstrouInteresse ? '★ Interesse Demonstrado' : '☆ Demonstrar Interesse';
        button.classList.toggle('demonstrou-interesse', demonstrouInteresse);
        const count = parseInt(interessesCountEl.textContent.match(/\d+/)[0]);
        const revertCount = demonstrouInteresse ? count + 1 : count - 1;
        interessesCountEl.textContent = `👥 ${revertCount} pessoa${revertCount !== 1 ? 's' : ''} interessada${revertCount !== 1 ? 's' : ''}`;
        alert('Erro ao atualizar interesse. Tente novamente.');
    }
}