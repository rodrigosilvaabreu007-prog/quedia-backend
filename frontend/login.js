// Login de usuário
const form = document.getElementById('login-form');
const mensagem = document.getElementById('mensagem-login');

// Verifica se o formulário existe na página antes de adicionar o evento
if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    
    // Pega os dados do formulário de forma limpa
    const formData = new FormData(form);
    const dados = Object.fromEntries(formData);
    
    console.log('Tentando login com email:', dados.email);
    
    try {
      // ✅ CORREÇÃO: Usando window.API_URL para garantir que pegue o valor do global.js
      const resposta = await fetch(`${window.API_URL}/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(dados)
      });

      // Tratamento para caso o servidor não retorne um JSON (ex: erro 404 em HTML)
      const textoResposta = await resposta.text();
      let resultado;
      try {
          resultado = JSON.parse(textoResposta);
      } catch(e) {
          throw new Error("Resposta do servidor inválida.");
      }
      
      if (resposta.ok) {
        mensagem.textContent = 'Login realizado com sucesso! Entrando...';
        mensagem.style.color = '#4CAF50';
        
        // Salva token e usuário no localStorage
        localStorage.setItem('eventhub-token', resultado.token);
        localStorage.setItem('eventhub-usuario', JSON.stringify(resultado.usuario));
        
        // Inicializa o ícone de perfil (função que está no seu global.js)
        if (typeof inicializarIconePerfil === 'function') {
            inicializarIconePerfil();
        }

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } else {
        mensagem.textContent = resultado.erro || 'Email ou senha incorretos.';
        mensagem.style.color = '#ff6b6b';
        console.error('Erro de login:', resultado.erro);
      }
    } catch (err) {
      mensagem.textContent = 'Erro de conexão com o servidor. Tente novamente.';
      mensagem.style.color = '#ff6b6b';
      console.error('Erro de conexão:', err);
    }
  });
}