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
            const dados = {
                email: String(formData.get('email') || '').trim().toLowerCase(),
                senha: String(formData.get('senha') || '')
            };
            
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
                    let usuarioData = resultado.usuario || resultado.user;

                    // Tenta obter cargo do token JWT quando não estiver presente no objeto do usuário
                    const getCargoFromToken = (token) => {
                        if (!token) return null;
                        const partes = token.split('.');
                        if (partes.length !== 3) return null;
                        try {
                            const payload = partes[1].replace(/-/g, '+').replace(/_/g, '/');
                            const json = decodeURIComponent(Array.prototype.map.call(atob(payload), c => '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                            const data = JSON.parse(json);
                            return data.cargo || null;
                        } catch {
                            return null;
                        }
                    };

                    const tokenCargo = getCargoFromToken(resultado.token);
                    if (usuarioData) {
                        let userId = usuarioData.id || usuarioData._id || '';
                        if (userId && typeof userId === 'object' && typeof userId.toString === 'function') {
                            userId = userId.toString();
                        }
                        userId = String(userId || '');
                        usuarioData = { ...usuarioData, id: userId, _id: userId };
                        if (tokenCargo && !usuarioData.cargo) {
                            usuarioData.cargo = tokenCargo;
                        }
                    }

                    localStorage.setItem('eventhub-usuario', JSON.stringify(usuarioData));
                    
                    // Atualiza interface se a função existir
                    if (typeof window.inicializarIconePerfil === 'function') {
                        window.inicializarIconePerfil();
                    }

                    // Verificar se é administrador e redirecionar para página apropriada
                    const isAdmin = (usuarioData && usuarioData.cargo === 'adm') || tokenCargo === 'adm';
                    const redirectPage = isAdmin ? 'admin-inicio.html' : redirectTarget;
                    
                    // Redireciona após 1 segundo para destino de origem (ou a home do admin para admins)
                    setTimeout(() => {
                        window.location.href = redirectPage;
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