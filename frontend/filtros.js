// Filtros avançados de eventos
const form = document.getElementById('filtros-eventos');
const container = document.getElementById('event-cards');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(form));
  let query = [];
  if (dados.cidade) query.push(`cidade=${encodeURIComponent(dados.cidade)}`);
  if (dados.data) query.push(`data=${encodeURIComponent(dados.data)}`);
  if (dados.categoria_principal) query.push(`categoria_principal=${encodeURIComponent(dados.categoria_principal)}`);
  if (dados.subcategoria) query.push(`subcategoria=${encodeURIComponent(dados.subcategoria)}`);
  if (dados.gratuito) query.push(`gratuito=true`);
  if (dados.preco_max) query.push(`preco_max=${encodeURIComponent(dados.preco_max)}`);
  const url = '/api/eventos' + (query.length > 0 ? '?' + query.join('&') : '');

  try {
    const resposta = await fetch(url);
    const eventos = await resposta.json();
    container.innerHTML = '';
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
          <button class="interest-btn">&#9733; Interessado</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = '<p>Erro ao carregar eventos.</p>';
  }
});

