// Envio de contato por email
const form = document.getElementById('contato-form');
const mensagem = document.getElementById('mensagem-contato');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(form));
  try {
    const resposta = await fetch(`${window.API_URL}/contato`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const resultado = await resposta.json();
    if (resposta.ok) {
      mensagem.style.color = 'green';
      mensagem.textContent = resultado.mensagem + ' (Mensagens são salvas e revisadas manualmente)';
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

