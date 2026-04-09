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
        const resposta = await fetch(`${window.API_URL}/eventos?organizador_id=${encodeURIComponent(usuarioId)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!resposta.ok) {
            throw new Error('Erro ao buscar dados do servidor');
        }

        let eventos = await resposta.json();
        if (!Array.isArray(eventos)) eventos = [];

        let meusEventos = eventos.filter(ev =>
            String(ev.organizador_id) === usuarioId || String(ev.organizador_id) === String(usuario._id)
        );

        if (meusEventos.length === 0) {
            const todos = await fetch(`${window.API_URL}/eventos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (todos.ok) {
                const eventosTodos = await todos.json();
                if (Array.isArray(eventosTodos)) {
                    meusEventos = eventosTodos.filter(ev =>
                        String(ev.organizador_id) === usuarioId || String(ev.organizador_id) === String(usuario._id)
                    );
                }
            }
        }

        container.innerHTML = '';

        if (meusEventos.length === 0) {
            container.innerHTML = '<p>Você ainda não cadastrou nenhum evento.</p>';
            return;
        }

        meusEventos.forEach(evento => {
            const card = document.createElement('div');
            card.className = 'event-card';
            
            // Tratamento de preço e imagem
            const precoExibicao = evento.gratuito ? 'Gratuito' : `R$ ${evento.preco}`;
            const imagemExibicao = evento.imagem || 'https://via.placeholder.com/400x200?text=Evento+Sem+Foto';

            card.innerHTML = `
                <img src="${imagemExibicao}" alt="${evento.nome}" class="event-img" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px 8px 0 0;">
                <div class="event-info" style="padding: 15px;">
                    <h3 style="color: var(--text-primary, #00bfff); margin: 0;">${evento.nome}</h3>
                    <p style="font-size: 13px; color: #ccc; margin: 8px 0;">${evento.descricao.substring(0, 80)}...</p>
                    <div style="font-size: 12px; color: #aaa;">
                        <span>📅 ${evento.data}</span> | <span>📍 ${evento.cidade}</span>
                    </div>
                    <div style="margin-top: 10px; font-weight: bold; color: var(--text-primary, #00bfff);">${precoExibicao}</div>
                    
                    <div class="card-actions" style="margin-top: 15px; display: flex; gap: 10px;">
                        <button class="edit-btn" data-id="${evento.id}" style="flex: 1; padding: 8px; cursor: pointer; background: transparent; border: 1px solid #00bfff; color: #00bfff; border-radius: 4px;">Editar</button>
                        <button class="delete-btn" data-id="${evento.id}" style="flex: 1; padding: 8px; cursor: pointer; background: #ff4444; border: none; color: white; border-radius: 4px;">Excluir</button>
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

// Delegando eventos para os botões de Editar e Excluir
document.getElementById('meus-eventos-cards')?.addEventListener('click', async e => {
    const token = localStorage.getItem('eventhub-token');
    const eventoId = e.target.dataset.id;

    if (e.target.classList.contains('delete-btn')) {
        if (confirm('Deseja realmente excluir este evento? Esta ação não pode ser desfeita.')) {
            try {
                const res = await fetch(`${window.API_URL}/eventos/${eventoId}`, {
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
            }
        }
    }

    if (e.target.classList.contains('edit-btn')) {
        // Redireciona para a página de edição do evento usando o formulário existente
        window.location.href = `event-form.html?id=${eventoId}`;
    }
});

// Inicia a carga
window.addEventListener('DOMContentLoaded', carregarMeusEventos);