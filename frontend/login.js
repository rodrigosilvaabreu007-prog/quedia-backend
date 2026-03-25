// CONFIGURAÇÃO DA API - Link direto do seu Google Cloud Run
// Se o global.js falhar, esse valor garante que o login funcione
window.API_URL = window.API_URL || "https://backend-649702844549.southamerica-east1.run.app/api";

const form = document.getElementById('login-form');
const mensagem = document.getElementById('mensagem-login');

if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const dados = Object.fromEntries(formData);
    
    try {
      // Feedback visual imediato
      mensagem.textContent = 'Verificando dados...';
      mensagem.style.color = '#00bfff';

      const resposta = await fetch(`${window.API_URL}/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(dados)
      });

      // Lendo a resposta como texto primeiro para evitar erro de JSON inválido
      const textoResposta = await resposta.text();
      let resultado;
      try {
          resultado = JSON.parse(textoResposta);
      } catch(e) {
          throw new Error("O servidor retornou uma resposta inválida.");
      }
      
      if (resposta.ok) {
        mensagem.textContent = '✅ Login realizado! Entrando...';
        mensagem.style.color = '#4CAF50';
        
        // Salva os dados para manter o usuário logado
        localStorage.setItem('eventhub-token', resultado.token);
        localStorage.setItem('eventhub-usuario', JSON.stringify(resultado.usuario));
        
        // Se houver a função de ícone no global.js, ela é chamada aqui
        if (typeof window.inicializarIconePerfil === 'function') {
            window.inicializarIconePerfil();
        }

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } else {
        mensagem.textContent = resultado.erro || '❌ Email ou senha incorretos.';
        mensagem.style.color = '#ff6b6b';
      }
    } catch (err) {
      mensagem.textContent = '❌ Erro de conexão com o servidor.';
      mensagem.style.color = '#ff6b6b';
      console.error('Erro detalhado:', err);
    }
  });
}