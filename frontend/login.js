// CONFIGURAÇÃO DA API
// Usa a URL definida no global.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const mensagem = document.getElementById('mensagem-login');

    // Se já estiver logado, mostrar uma mensagem e deixar o usuário escolher
    const token = localStorage.getItem('eventhub-token');
    const usuario = localStorage.getItem('eventhub-usuario');

    if (token && !usuario) {
        localStorage.removeItem('eventhub-token');
    }

    if (token && usuario) {
        const statusMsg = document.getElementById('mensagem-login');
        if (statusMsg) {
            statusMsg.textContent = 'Você já está logado. Caso queira entrar com outra conta, faça logout primeiro.';
            statusMsg.style.color = '#00bfff';
        }
    }

    if (form) {
        form.addEventListener('submit', async e => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const dados = Object.fromEntries(formData);
            
            try {
                // Feedback visual
                mensagem.textContent = '⏳ Verificando dados...';
                mensagem.style.color = '#00bfff';

                const resposta = await fetch(`${window.API_URL}/login`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify(dados)
                });

                const textoResposta = await resposta.text();
                let resultado;
                
                try {
                    resultado = JSON.parse(textoResposta);
                } catch(e) {
                    throw new Error("Resposta inválida do servidor.");
                }
                
                if (resposta.ok) {
                    mensagem.textContent = '✅ Login realizado! Entrando...';
                    mensagem.style.color = '#4CAF50';
                    
                    // Salva o Token e os Dados do Usuário
                    localStorage.setItem('eventhub-token', resultado.token);
                    // Padronizado para 'eventhub-usuario' para bater com o global.js
                    localStorage.setItem('eventhub-usuario', JSON.stringify(resultado.usuario || resultado.user));
                    
                    // Atualiza interface se a função existir
                    if (typeof window.inicializarIconePerfil === 'function') {
                        window.inicializarIconePerfil();
                    }

                    // Redireciona após 1 segundo
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                } else {
                    mensagem.textContent = resultado.erro || '❌ Email ou senha incorretos.';
                    mensagem.style.color = '#ff6b6b';
                }
            } catch (err) {
                mensagem.textContent = '❌ Falha na conexão. Tente novamente.';
                mensagem.style.color = '#ff6b6b';
                console.error('Erro no login:', err);
            }
        });
    }
});