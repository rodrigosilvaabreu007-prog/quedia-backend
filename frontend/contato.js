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
  const apiUrl = window.API_URL || `${window.BASE_URL || window.location.origin}/api`;
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
      return;
    }

    if (resposta.status === 401 || resposta.status === 403) {
      localStorage.removeItem('eventhub-token');
      localStorage.removeItem('eventhub-usuario');
      mensagem.style.color = 'red';
      mensagem.textContent = 'Sessão inválida ou expirada. Faça login novamente para enviar a mensagem.';
      return;
    }

    mensagem.style.color = 'red';
    mensagem.textContent = resultado.erro || 'Erro ao enviar mensagem.';
  } catch (err) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Erro de conexão com o servidor.';
  }
});

