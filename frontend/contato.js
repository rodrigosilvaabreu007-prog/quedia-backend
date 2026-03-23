// Envio de contato por email
const form = document.getElementById('contato-form');
const mensagem = document.getElementById('mensagem-contato');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(form));
  try {
    const resposta = await fetch('/api/contato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const resultado = await resposta.json();
    if (resposta.ok) {
      mensagem.textContent = 'Mensagem enviada com sucesso!';
      form.reset();
    } else {
      mensagem.textContent = resultado.erro || 'Erro ao enviar mensagem.';
    }
  } catch (err) {
    mensagem.textContent = 'Erro de conexão com o servidor.';
  }
});

