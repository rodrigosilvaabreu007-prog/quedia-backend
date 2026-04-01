// CONFIGURAÇÃO DA API
// Usa a URL definida no global.js

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function getRedirectTarget() {
    const raw = getQueryParam('redirectTo') || getQueryParam('next');
    if (!raw) return 'index.html';

    try {
        const url = new URL(raw, window.location.origin);
        if (url.origin !== window.location.origin) return 'index.html';
        return url.pathname.endsWith('.html') ? url.pathname.replace(/^\//, '') : 'index.html';
    } catch {
        return 'index.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const mensagem = document.getElementById('mensagem-login');
    const redirectTarget = getRedirectTarget();

    // Se já estiver logado, mostrar uma mensagem e deixar o usuário escolher
    const token = localStorage.getItem('eventhub-token');
    const usuario = localStorage.getItem('eventhub-usuario');

    if (token && !usuario) {
        localStorage.removeItem('eventhub-token');
    }

    if (token && usuario) {
        const statusMsg = document.getElementById('mensagem-login');
        if (statusMsg) {
            statusMsg.innerHTML = 'Você já está logado. <a href="perfil.html" style="color:#00bfff; text-decoration:underline;">Ver perfil</a> ou <a href="#" id="logout-link" style="color:#00bfff; text-decoration:underline;">sair</a>.';
            statusMsg.style.color = '#00bfff';
        }

        document.getElementById('logout-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('eventhub-token');
            localStorage.removeItem('eventhub-usuario');
            window.location.reload();
        });
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

                    // Redireciona após 1 segundo para destino de origem (ou index)
                    setTimeout(() => {
                        window.location.href = redirectTarget;
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