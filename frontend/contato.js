// Envio de contato por email
const form = document.getElementById('contato-form');
const mensagem = document.getElementById('mensagem-contato');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('eventhub-token');
  if (!token) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Você precisa estar logado para enviar uma mensagem de contato.';
    return;
  }

  const dados = Object.fromEntries(new FormData(form));
  const apiUrl = window.API_URL || '';
  if (!apiUrl) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Erro interno: API_URL não configurada.';
    return;
  }

  try {
    const resposta = await fetch(`${apiUrl}/contato`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dados)
    });
    const resultado = await resposta.json();
    if (resposta.ok) {
      mensagem.style.color = 'green';
      mensagem.textContent = resultado.mensagem;
      form.reset();
    } else {
      mensagem.style.color = 'red';
      mensagem.textContent = resultado.erro || 'Erro ao enviar mensagem.';
    }
  } catch (err) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Erro de conexão com o servidor.';
  }
});

