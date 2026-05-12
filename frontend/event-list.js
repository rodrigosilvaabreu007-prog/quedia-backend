// Exibe eventos cadastrados em cards
async function carregarEventos() {
  const container = document.getElementById('event-cards');
  if (!container) return;
  
  container.innerHTML = '<p style="color: var(--cor-principal, #00bfff);">⏳ Carregando eventos...</p>';

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
        </div>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error("Erro ao carregar lista:", err);
    container.innerHTML = '<p>❌ Erro ao conectar com o servidor.</p>';
  }
}

window.addEventListener('DOMContentLoaded', carregarEventos);