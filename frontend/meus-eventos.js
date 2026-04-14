async function carregarMeusEventos() {
    const container = document.getElementById('meus-eventos-cards');
    if (!container) return;

    container.innerHTML = '<p style="color: #aaa;">Carregando seus eventos...</p>';

    // 1. Recupera o usuário logado do LocalStorage
    const token = localStorage.getItem('eventhub-token');
    const usuarioStr = localStorage.getItem('eventhub-usuario');

    if (!token || !usuarioStr) {
        const redirect = encodeURIComponent('meus-eventos.html');
        container.innerHTML = `<p>Você precisa estar logado para ver seus eventos. <a href="login.html?redirectTo=${redirect}" style="color: var(--cor-principal, #00bfff);">Fazer Login</a></p>`;
        return;
    }

    const usuario = JSON.parse(usuarioStr);
    const usuarioId = String(usuario.id || usuario._id || '');

    if (!usuarioId) {
        container.innerHTML = '<p>Usuário não identificado. Faça login novamente.</p>';
        return;
    }

    try {
        // Primeiro tenta buscar eventos filtrados por organizador_id
        const resposta = await fetch(`${window.API_URL}/eventos?organizador_id=${encodeURIComponent(usuarioId)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        let eventos = [];
        if (resposta.ok) {
            eventos = await resposta.json();
            if (!Array.isArray(eventos)) {
                throw new Error('Resposta inválida do servidor');
            }
        } else {
            // Se falhar, busca todos os eventos e filtra no frontend
            console.warn('Busca filtrada falhou, tentando buscar todos os eventos...');
            const todosResposta = await fetch(`${window.API_URL}/eventos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (todosResposta.ok) {
                const todosEventos = await todosResposta.json();
                if (Array.isArray(todosEventos)) {
                    eventos = todosEventos.filter(ev =>
                        String(ev.organizador_id) === usuarioId ||
                        String(ev.organizador_id) === String(usuario._id) ||
                        ev.organizador_id === usuarioId ||
                        ev.organizador_id === usuario._id
                    );
                }
            }
        }

        let meusEventos = eventos.filter(ev =>
            String(ev.organizador_id) === usuarioId ||
            String(ev.organizador_id) === String(usuario._id) ||
            ev.organizador_id === usuarioId ||
            ev.organizador_id === usuario._id
        );
        }

        container.innerHTML = '';

        if (meusEventos.length === 0) {
            container.innerHTML = '<p>Você ainda não cadastrou nenhum evento.</p>';
            return;
        }

        meusEventos.forEach(evento => {
            const card = document.createElement('div');
            card.className = 'event-card';
            
            const eventoId = evento.id || evento._id || '';
            const precoExibicao = evento.gratuito ? 'Gratuito' : `R$ ${evento.preco}`;
            const imagemExibicao = evento.imagem || 'https://via.placeholder.com/400x200?text=Evento+Sem+Foto';

            card.innerHTML = `
                <div class="event-img-container">
                    <img src="${imagemExibicao}" alt="${evento.nome}" class="event-img">
                </div>
                <div class="event-info">
                    <h3>${evento.nome}</h3>
                    <span class="category-tag">${evento.categoria || 'Sem categoria'}</span>
                    <p class="event-description">${(evento.descricao || '').substring(0, 100)}...</p>
                    <div class="event-details">📅 ${evento.data || 'Data não definida'} | 📍 ${evento.cidade || 'Cidade não definida'}</div>
                    <div class="event-price">${precoExibicao}</div>
                    <div class="card-actions">
                        <button class="edit-btn" data-id="${eventoId}">Editar</button>
                        <button class="delete-btn" data-id="${eventoId}">Excluir</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p>Erro ao carregar seus eventos. Tente novamente mais tarde.</p>';
    }
}

let pendingDeleteEventoId = null;

function abrirConfirmModal(eventoId, eventoNome) {
    pendingDeleteEventoId = eventoId;
    const modal = document.getElementById('confirm-modal');
    const message = document.getElementById('confirm-delete-message');

    if (message) {
        message.textContent = `Tem certeza que deseja excluir o evento "${eventoNome}"? Esta ação não pode ser desfeita.`;
    }

    if (modal) {
        modal.style.display = 'flex';
    }
}

function fecharConfirmModal() {
    pendingDeleteEventoId = null;
    const modal = document.getElementById('confirm-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function confirmarExclusao() {
    if (!pendingDeleteEventoId) {
        fecharConfirmModal();
        return;
    }

    const token = localStorage.getItem('eventhub-token');
    try {
        const res = await fetch(`${window.API_URL}/eventos/${pendingDeleteEventoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            window.showNotification('Evento excluído com sucesso!', 'success');
            carregarMeusEventos();
        } else {
            window.showNotification('Erro ao excluir evento.', 'error');
        }
    } catch (error) {
        window.showNotification('Erro de conexão ao tentar excluir.', 'error');
    } finally {
        fecharConfirmModal();
    }
}

function setupConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    const btnYes = document.getElementById('confirm-delete-yes');
    const btnNo = document.getElementById('confirm-delete-no');

    if (btnYes) btnYes.addEventListener('click', confirmarExclusao);
    if (btnNo) btnNo.addEventListener('click', fecharConfirmModal);

    if (modal) {
        modal.addEventListener('click', event => {
            if (event.target === modal) {
                fecharConfirmModal();
            }
        });
    }
}

// Delegando eventos para os botões de Editar e Excluir
document.getElementById('meus-eventos-cards')?.addEventListener('click', async e => {
    const token = localStorage.getItem('eventhub-token');
    const eventoId = e.target.dataset.id;

    if (e.target.classList.contains('delete-btn')) {
        const card = e.target.closest('.event-card');
        const nomeEvento = card?.querySelector('h3')?.textContent || 'este evento';
        abrirConfirmModal(eventoId, nomeEvento);
    }

    if (e.target.classList.contains('edit-btn')) {
        // Redireciona para a página de edição dedicada
        window.location.href = `editar-evento.html?id=${eventoId}`;
    }
});

// Inicia a carga
window.addEventListener('DOMContentLoaded', () => {
    carregarMeusEventos();
    setupConfirmModal();
});