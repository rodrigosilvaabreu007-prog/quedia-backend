// Página de edição de evento
const form = document.getElementById('editar-evento-form');
const mensagem = document.getElementById('mensagem-editar');
const params = new URLSearchParams(window.location.search);
const eventoId = params.get('id');

function mostrarMensagem(texto, tipo = 'info') {
  if (!mensagem) return;
  mensagem.textContent = texto;
  mensagem.style.color = tipo === 'success' ? '#7CFC00' : tipo === 'error' ? '#ff6b6b' : '#fff';
}

async function carregarEvento() {
  if (!eventoId) {
    mostrarMensagem('ID do evento não informado.', 'error');
    form.innerHTML = '<p>Evento não informado.</p>';
    return;
  }

  const token = localStorage.getItem('eventhub-token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch(`${window.API_URL}/eventos/${eventoId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      mostrarMensagem(errorData.erro || 'Não foi possível carregar o evento.', 'error');
      form.innerHTML = '<p>Evento não encontrado ou não autorizado.</p>';
      return;
    }

    const evento = await response.json();

    form.innerHTML = `
      <h1 style="font-size:2rem; color: var(--cor-principal); margin-bottom: 18px;">Editar Evento</h1>
      <p style="color:#999; margin-bottom: 22px">Atualize os dados do seu evento e salve as alterações.</p>
      <label>Nome do evento <input type="text" name="nome" value="${evento.nome || ''}" required></label>
      <label>Descrição <textarea name="descricao" required>${evento.descricao || ''}</textarea></label>
      <label>Organizador <input type="text" name="organizador" value="${evento.organizador || ''}" required></label>
      <label>Estado <input type="text" name="estado" value="${evento.estado || ''}" required></label>
      <label>Cidade <input type="text" name="cidade" value="${evento.cidade || ''}" required></label>
      <label>Endereço / Local <input type="text" name="endereco" value="${evento.endereco || ''}" required></label>
      <label>Data <input type="date" name="data" value="${evento.data || ''}" required></label>
      <label>Horário <input type="time" name="horario" value="${evento.horario || ''}" required></label>
      <label>Categoria principal <input type="text" name="categoria" value="${evento.categoria || ''}" required></label>
      <label>Subcategoria <input type="text" name="subcategoria" value="${(evento.subcategorias && evento.subcategorias[0]) || ''}" required></label>
      <label class="radio-item" style="margin-top: 12px;"><input type="checkbox" name="gratuito" ${evento.gratuito ? 'checked' : ''}> Evento gratuito</label>
      <label>Preço <input type="number" name="preco" min="0" step="0.01" value="${evento.preco || 0}"></label>
      <button type="submit" class="btn" style="margin-top: 16px; background: var(--cor-principal); color: #000;">Salvar Alterações</button>
    `;

  } catch (err) {
    console.error('Erro ao carregar evento:', err);
    mostrarMensagem('Erro ao carregar evento. Tente novamente.', 'error');
    form.innerHTML = '<p>Erro ao carregar evento.</p>';
  }
}

form.addEventListener('submit', async e => {
  e.preventDefault();

  if (!eventoId) {
    mostrarMensagem('ID do evento não informado.', 'error');
    return;
  }

  const token = localStorage.getItem('eventhub-token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());
  data.gratuito = form.querySelector('[name=gratuito]')?.checked || false;
  if (data.subcategoria) {
    data.subcategorias = [data.subcategoria];
  }

  try {
    const response = await fetch(`${window.API_URL}/eventos/${eventoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      mostrarMensagem('Evento atualizado com sucesso!', 'success');
      setTimeout(() => {
        window.location.href = 'meus-eventos.html';
      }, 1300);
    } else {
      mostrarMensagem(result.erro || 'Erro ao atualizar evento.', 'error');
    }
  } catch (err) {
    console.error('Erro ao salvar alterações:', err);
    mostrarMensagem('Erro de conexão com o servidor.', 'error');
  }
});

window.addEventListener('DOMContentLoaded', carregarEvento);

