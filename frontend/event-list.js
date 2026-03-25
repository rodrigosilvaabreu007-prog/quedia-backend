// Exibe eventos cadastrados em cards
async function carregarEventos() {
  const container = document.getElementById('event-cards');
  container.innerHTML = '';
  try {
    const resposta = await fetch(`${window.API_URL}/eventos`);
    const eventos = await resposta.json();
    if (!Array.isArray(eventos)) return;
    eventos.forEach(evento => {
      const card = document.createElement('div');
      card.className = 'event-card';
      card.innerHTML = `
        <img src="${evento.imagem || 'https://via.placeholder.com/400x200?text=Evento'}" alt="${evento.nome}" class="event-img">
        <div class="event-info">
          <h2>${evento.nome}</h2>
          <p>${evento.descricao}</p>
          <span class="event-date">${evento.data} ${evento.horario}</span>
          <span class="event-city">${evento.cidade}</span>
          <span class="event-price">${evento.gratuito ? 'Gratuito' : 'R$ ' + evento.preco}</span>
            <span class="interest-count" id="interest-count-${evento.id}">0 interessados</span>
            <button class="interest-btn" data-id="${evento.id}">&#9733; Interessado</button>
        </div>
      `;
      container.appendChild(card);
        // Buscar contador de interessados
        fetch(`${window.API_URL}/interesses/${evento.id}`)
          .then(res => res.json())
          .then(data => {
            document.getElementById(`interest-count-${evento.id}`).textContent = `${data.total} interessados`;
          });
    });
    // Marcar interesse
    container.addEventListener('click', async e => {
      if (e.target.classList.contains('interest-btn')) {
        const eventoId = e.target.dataset.id;
        // Usuário fictício para teste
        const usuarioId = 1;
        const resposta = await fetch(`${window.API_URL}/interesses/${eventoId}`, {
          method: 'POST',

          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario_id: usuarioId })
        });
        const data = await resposta.json();
        document.getElementById(`interest-count-${eventoId}`).textContent = `${data.total} interessados`;
      }
    });
  } catch (err) {
    container.innerHTML = '<p>Erro ao carregar eventos.</p>';
  }
}

window.addEventListener('DOMContentLoaded', carregarEventos);

