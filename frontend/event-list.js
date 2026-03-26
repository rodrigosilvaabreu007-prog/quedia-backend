// Exibe eventos cadastrados em cards
async function carregarEventos() {
  const container = document.getElementById('event-cards');
  if (!container) return;
  
  container.innerHTML = '<p style="color: #00bfff;">⏳ Carregando eventos...</p>';

  try {
    const resposta = await fetch(`${window.API_URL}/eventos`);
    const eventos = await resposta.json();
    
    if (!Array.isArray(eventos) || eventos.length === 0) {
      container.innerHTML = '<p>Nenhum evento encontrado no momento.</p>';
      return;
    }

    container.innerHTML = ''; // Limpa o carregando

    eventos.forEach(evento => {
      // AJUSTE: O backend agora envia um array 'imagens'. Pegamos a primeira [0].
      const imagemExibida = (evento.imagens && evento.imagens.length > 0) 
        ? evento.imagens[0] 
        : 'https://via.placeholder.com/400x200?text=Sem+Imagem';

      const card = document.createElement('div');
      card.className = 'event-card';
      
      // AJUSTE: Usamos evento._id que é o padrão do MongoDB
      card.innerHTML = `
        <img src="${imagemExibida}" alt="${evento.nome}" class="event-img">
        <div class="event-info">
          <h2>${evento.nome}</h2>
          <p>${evento.descricao}</p>
          <div class="event-details">
            <span class="event-date">📅 ${evento.data} às ${evento.horario}</span>
            <span class="event-city">📍 ${evento.cidade} - ${evento.estado}</span>
            <span class="event-price">${evento.gratuito ? '✅ Gratuito' : '💰 R$ ' + evento.preco}</span>
          </div>
          <div class="interest-section">
            <span class="interest-count" id="interest-count-${evento._id}">Carregando interessados...</span>
            <button class="interest-btn" data-id="${evento._id}">⭐ Tenho Interesse</button>
          </div>
        </div>
      `;
      container.appendChild(card);

      // Buscar contador de interessados real do banco
      fetch(`${window.API_URL}/interesses/${evento._id}`)
        .then(res => res.json())
        .then(data => {
          const countEl = document.getElementById(`interest-count-${evento._id}`);
          if (countEl) countEl.textContent = `${data.total || 0} interessados`;
        })
        .catch(() => {
          const countEl = document.getElementById(`interest-count-${evento._id}`);
          if (countEl) countEl.textContent = "0 interessados";
        });
    });

  } catch (err) {
    console.error("Erro ao carregar lista:", err);
    container.innerHTML = '<p>❌ Erro ao conectar com o servidor.</p>';
  }
}

// Delegar evento de clique para o container (mais eficiente)
document.getElementById('event-cards')?.addEventListener('click', async e => {
  if (e.target.classList.contains('interest-btn')) {
    const btn = e.target;
    const eventoId = btn.dataset.id;
    const token = localStorage.getItem('eventhub-token');

    if (!token) {
      alert("⚠️ Você precisa estar logado para marcar interesse!");
      return;
    }

    try {
      btn.disabled = true;
      const resposta = await fetch(`${window.API_URL}/interesses/${eventoId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });

      const data = await resposta.json();
      const countEl = document.getElementById(`interest-count-${eventoId}`);
      if (countEl) countEl.textContent = `${data.total} interessados`;
      
      btn.style.backgroundColor = "#28a745";
      btn.textContent = "✅ Marcado!";
    } catch (err) {
      alert("Erro ao registrar interesse.");
    } finally {
      btn.disabled = false;
    }
  }
});

window.addEventListener('DOMContentLoaded', carregarEventos);