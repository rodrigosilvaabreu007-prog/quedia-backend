// Página de edição de evento
const form = document.getElementById('editar-evento-form');
const mensagem = document.getElementById('mensagem-editar');

const params = new URLSearchParams(window.location.search);
const eventoId = params.get('id');
const usuarioId = 1; // Usuário fictício para teste

async function carregarEvento() {
  try {
    const resposta = await fetch(`/api/eventos?organizador_id=${usuarioId}`);
    const eventos = await resposta.json();
    const evento = eventos.find(ev => ev.id == eventoId);
    if (!evento) {
      form.innerHTML = '<p>Evento não encontrado ou não autorizado.</p>';
      return;
    }
    form.innerHTML = `
      <label>Nome<input type="text" name="nome" value="${evento.nome}" required></label>
      <label>Descrição<textarea name="descricao" required>${evento.descricao}</textarea></label>
      <label>Cidade<input type="text" name="cidade" value="${evento.cidade}" required></label>
      <label>Endereço<input type="text" name="endereco" value="${evento.endereco}" required></label>
      <label>Data<input type="date" name="data" value="${evento.data}" required></label>
      <label>Horário<input type="time" name="horario" value="${evento.horario}" required></label>
      <label>Categoria principal<input type="text" name="categoria_principal" value="${evento.categoria_principal}" required></label>
      <label>Subcategoria<input type="text" name="subcategoria" value="${evento.subcategoria}" required></label>
      <label>Evento gratuito?<input type="checkbox" name="gratuito" ${evento.gratuito ? 'checked' : ''}></label>
      <label>Preço<input type="number" name="preco" min="0" step="0.01" value="${evento.preco}"></label>
      <label>Imagem<input type="url" name="imagem" value="${evento.imagem || ''}"></label>
      <button type="submit">Salvar Alterações</button>
    `;
  } catch (err) {
    form.innerHTML = '<p>Erro ao carregar evento.</p>';
  }
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(form));
  dados.gratuito = form.querySelector('[name=gratuito]').checked;
  try {
    const resposta = await fetch(`/api/eventos/${eventoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const resultado = await resposta.json();
    if (resposta.ok) {
      mensagem.textContent = 'Evento atualizado com sucesso!';
    } else {
      mensagem.textContent = resultado.erro || 'Erro ao atualizar evento.';
    }
  } catch (err) {
    mensagem.textContent = 'Erro de conexão com o servidor.';
  }
});

window.addEventListener('DOMContentLoaded', carregarEvento);

