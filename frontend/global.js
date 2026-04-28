
const DEFAULT_BASE_URL = window.BASE_URL || window.location.origin;
const FALLBACK_API_URL = 'https://eventhub-api-649702844549.us-central1.run.app/api';
const API_URL = window.API_URL || ((/localhost|127\.0\.0\.1|192\.168\.|::1/.test(window.location.hostname)) ? `${DEFAULT_BASE_URL}/api` : FALLBACK_API_URL);

window.BASE_URL = DEFAULT_BASE_URL;
window.API_URL = API_URL;

console.log('🚀 API QueDia Conectada com Sucesso:', window.API_URL);
console.log('🚀 QueDia API conectada em:', window.API_URL);

// Redirecionamento de rota curta para arquivo HTML (ajusta deploy sem .html)
function normalizeSimplePath() {
    const path = window.location.pathname.replace(/\/$/, '');
    const map = {
        '/login': '/login.html',
        '/cadastro': '/cadastro.html',
        '/meus-eventos': '/meus-eventos.html',
        '/event-form': '/event-form.html',
        '/perfil': '/perfil.html',
        '/contato': '/contato.html',
        '/sobre': '/sobre.html',
        '/': '/index.html'
    };

    if (map[path] && map[path] !== window.location.pathname) {
        window.location.replace(map[path] + window.location.search + window.location.hash);
    }
}

function getUsuarioData() {
    try {
        return JSON.parse(localStorage.getItem('eventhub-usuario') || 'null');
    } catch {
        return null;
    }
}

function parseJwt(token) {
    if (!token) return null;
    const partes = token.split('.');
    if (partes.length !== 3) return null;

    try {
        const payload = partes[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(Array.prototype.map.call(atob(payload), c => '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function getTokenPayload() {
    const token = localStorage.getItem('eventhub-token');
    return token ? parseJwt(token) : null;
}

function getUsuarioCargo() {
    const usuario = getUsuarioData();
    if (usuario && usuario.cargo) {
        return usuario.cargo;
    }

    const payload = getTokenPayload();
    return payload?.cargo || null;
}

function normalizarCargoUsuario() {
    const usuario = getUsuarioData();
    const cargo = getUsuarioCargo();
    if (usuario && cargo && usuario.cargo !== cargo) {
        usuario.cargo = cargo;
        localStorage.setItem('eventhub-usuario', JSON.stringify(usuario));
    }
    return cargo;
}

function isAdminUser() {
    const cargo = normalizarCargoUsuario();
    console.log('🔍 Verificando se usuário é admin:', cargo);
    const isAdmin = cargo === 'adm';
    console.log('🔍 Resultado isAdminUser():', isAdmin);
    return isAdmin;
}

function ajustarNavegacaoAdmin() {
    console.log('🧭 Executando ajustarNavegacaoAdmin()');
    const navElements = document.querySelectorAll('nav.menu, .mobile-menu');
    if (!navElements.length) {
        console.log('❌ Elemento de navegação não encontrado');
        return;
    }

    const publicNav = [
        '<a href="index.html">Início</a>',
        '<a href="event-form.html">Cadastrar Evento</a>',
        '<a href="sobre.html">Sobre</a>',
        '<a href="contato.html">Contato</a>',
        '<a href="meus-eventos.html">Seus Eventos</a>',
        '<a href="login.html">Login</a>',
        '<a href="cadastro.html">Cadastro</a>'
    ].join('');

    const adminNav = [
        '<a href="admin-inicio.html">Início</a>',
        '<a href="admin-perfil.html">Perfil Admin</a>',
        '<a href="admin-meus-eventos.html">Meus Eventos</a>',
        '<a href="admin-eventos.html">Aprovações</a>',
        '<a href="admin-contato.html">Contato</a>',
        '<a href="#" onclick="logout()">Sair</a>'
    ].join('');

    const admin = isAdminUser();
    if (admin) {
        console.log('👑 Usuário é admin, aplicando navegação admin');
        navElements.forEach(nav => nav.innerHTML = adminNav);
        return;
    }

    console.log('👤 Usuário não é admin, aplicando navegação pública');
    navElements.forEach(nav => nav.innerHTML = publicNav);
}

function protegerRotasAdmin() {
    console.log('🛡️ Executando protegerRotasAdmin()');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('📄 Página atual:', currentPage);
    const adminOnlyPages = ['admin-inicio.html', 'admin-perfil.html', 'admin-meus-eventos.html', 'admin-eventos.html', 'admin-contato.html'];
    const userOnlyPagesForAdmin = ['perfil.html', 'meus-eventos.html', 'event-form.html', 'editar-evento.html', 'evento-detalhes.html', 'contato.html', 'sobre.html'];

    const admin = isAdminUser();
    if (admin) {
        console.log('👑 Usuário é admin, aplicando proteção de rotas');
        if (currentPage === 'contato.html') {
            console.log('🔄 Redirecionando contato.html para admin-contato.html');
            window.location.replace('admin-contato.html');
            return;
        }

        if (userOnlyPagesForAdmin.includes(currentPage) || currentPage === 'login.html' || currentPage === 'cadastro.html' || currentPage === 'index.html') {
            console.log('🔄 Redirecionando página de usuário para admin-inicio.html');
            window.location.replace('admin-inicio.html');
            return;
        }
    } else {
        console.log('👤 Usuário não é admin, nenhuma proteção aplicada');
    }

    if (!admin && adminOnlyPages.includes(currentPage)) {
        window.location.replace('login.html');
        return;
    }
}

function inicializarIconePerfil() {
    const iconePerfil = document.getElementById('icone-perfil');
    const iconePerfilImg = document.getElementById('icone-perfil-img');
    const token = localStorage.getItem('eventhub-token');
    const usuario = localStorage.getItem('eventhub-usuario');

    if (!iconePerfil || !iconePerfilImg) return;

    if (token && usuario) {
        try {
            const usuarioData = JSON.parse(usuario);
            // Tenta pegar a foto salva localmente ou a que veio do objeto usuário
            let usuarioId = usuarioData.id || usuarioData._id || '';
            if (usuarioId && typeof usuarioId === 'object' && typeof usuarioId.toString === 'function') {
                usuarioId = usuarioId.toString();
            }
            usuarioId = String(usuarioId || '');
            const fotoPerfil = localStorage.getItem(`foto-perfil-${usuarioId}`) || usuarioData.foto;

            if (fotoPerfil && fotoPerfil !== 'undefined' && fotoPerfil !== 'null') {
                iconePerfilImg.src = fotoPerfil;
                iconePerfilImg.style.display = 'block';
                iconePerfil.classList.add('has-image');
                
                // Se a imagem falhar ao carregar, limpa o ícone
                iconePerfilImg.onerror = () => {
                    iconePerfilImg.style.display = 'none';
                    iconePerfil.classList.remove('has-image');
                };
            } else {
                iconePerfilImg.style.display = 'none';
                iconePerfil.classList.remove('has-image');
            }
        } catch (error) {
            console.error('Erro ao processar dados do usuário:', error);
            iconePerfilImg.style.display = 'none';
            iconePerfil.classList.remove('has-image');
        }
    } else {
        // Se não estiver logado, mostra apenas o ícone e não exibe <img>
        iconePerfilImg.style.display = 'none';
        iconePerfil.classList.remove('has-image');
    }
    
    // Sempre mostra o botão do perfil
    iconePerfil.style.display = 'grid';
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        normalizeSimplePath();
        protegerRotasAdmin();
        ajustarNavegacaoAdmin();
    });
} else {
    normalizeSimplePath();
    protegerRotasAdmin();
    ajustarNavegacaoAdmin();
    inicializarIconePerfil();
}

function inicializarBotoesAutenticacao() {
    const token = localStorage.getItem('eventhub-token');
    const usuario = localStorage.getItem('eventhub-usuario');
    
    const linksLogin = document.querySelectorAll('a[href="login.html"]');
    const linksCadastro = document.querySelectorAll('a[href="cadastro.html"]');
    
    if (token && usuario) {
        // Usuário logado: esconder botões de login e cadastro
        linksLogin.forEach(link => link.style.display = 'none');
        linksCadastro.forEach(link => link.style.display = 'none');
    } else {
        // Usuário não logado: mostrar botões
        linksLogin.forEach(link => link.style.display = 'block');
        linksCadastro.forEach(link => link.style.display = 'block');
    }
}

function irParaPerfil() {
    const token = localStorage.getItem('eventhub-token');
    const usuario = localStorage.getItem('eventhub-usuario');
    
    if (!token || !usuario) {
        window.location.href = 'login.html';
        return;
    }

    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'perfil.html' || currentPage === 'perfil') {
        return;
    }

    window.location.href = 'perfil.html';
}

async function mostrarModalPerfil() {
    const usuario = JSON.parse(localStorage.getItem('eventhub-usuario'));
    if (!usuario) return;
    
    // Buscar dados atualizados do usuário
    try {
const usuarioId = usuario.id || usuario._id || '';
    const response = await fetch(`${API_URL}/usuario/${usuarioId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('eventhub-token')}`
            }
        });
        
        if (response.ok) {
            const dadosAtualizados = await response.json();
            usuarioAtual = dadosAtualizados;
        }
    } catch (err) {
        console.error('Erro ao buscar dados do usuário:', err);
    }
    
    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'modal-perfil';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); z-index: 10000; display: flex;
        align-items: center; justify-content: center; font-family: Arial, sans-serif;
    `;
    
    // Verificar preferências
    let preferenciasArray = [];
    if (usuarioAtual.preferencias) {
        if (typeof usuarioAtual.preferencias === 'string') {
            try {
                preferenciasArray = JSON.parse(usuarioAtual.preferencias);
            } catch {
                preferenciasArray = [];
            }
        } else if (Array.isArray(usuarioAtual.preferencias)) {
            preferenciasArray = usuarioAtual.preferencias;
        }
    }
    
    const preferenciasHTML = preferenciasArray.length > 0 
        ? preferenciasArray.map(pref => `<span style="background: rgba(0,191,255,0.1); padding: 4px 8px; border-radius: 4px; margin: 2px; display: inline-block;">${pref}</span>`).join('')
        : '<span style="color: #888;">Nenhuma preferência configurada</span>';
    
    modal.innerHTML = `
        <div style="background: #1a2332; border: 2px solid #00bfff; border-radius: 12px; padding: 32px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative;">
            <button onclick="fecharModalPerfil()" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; cursor: pointer; color: #00bfff;">✕</button>
            
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #00bfff; margin: 0 auto 16px; background: #00bfff; display: flex; align-items: center; justify-content: center; font-size: 36px;">
                    ${usuarioAtual.nome.charAt(0).toUpperCase()}
                </div>
                <h2 style="margin: 0 0 8px 0; color: #00bfff;">${usuarioAtual.nome}</h2>
                <p style="margin: 0; color: #aaa;">${usuarioAtual.email}</p>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px 0; color: #00bfff;">Informações do Perfil</h3>
                <div style="display: grid; gap: 12px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #888;">Estado:</span>
                        <span style="color: #fff;">${usuarioAtual.estado || 'Não informado'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #888;">Cidade:</span>
                        <span style="color: #fff;">${usuarioAtual.cidade || 'Não informado'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #888;">Data de Cadastro:</span>
                        <span style="color: #fff;">${new Date(usuarioAtual.data_cadastro).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px 0; color: #00bfff;">Preferências de Eventos</h3>
                <div style="line-height: 1.6;">
                    ${preferenciasHTML}
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button onclick="fazerLogout()" style="padding: 10px 20px; background: #ff4444; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Logout</button>
                <button onclick="fecharModalPerfil()" style="padding: 10px 20px; background: #00bfff; color: #000; border: none; border-radius: 4px; cursor: pointer;">Fechar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function fecharModalPerfil() {
    const modal = document.getElementById('modal-perfil');
    if (modal) {
        modal.remove();
    }
}

function fazerLogout() {
    localStorage.removeItem('eventhub-token');
    localStorage.removeItem('eventhub-usuario');
    window.location.href = 'index.html';
}

// Exporta as funções para o objeto window
window.irParaPerfil = irParaPerfil;
window.fazerLogout = fazerLogout;
window.inicializarIconePerfil = inicializarIconePerfil;
window.inicializarBotoesAutenticacao = inicializarBotoesAutenticacao;
window.mostrarModalPerfil = mostrarModalPerfil;
window.fecharModalPerfil = fecharModalPerfil;

// --- UTILITÁRIOS DE LOCALIZAÇÃO (Fallback robusto para falhas de rede) ---

const CIDADES_POR_ESTADO = {
    "SP": ["São Paulo", "Campinas", "Santos", "São José dos Campos", "Ribeirão Preto"],
    "RJ": ["Rio de Janeiro", "Niterói", "Búzios", "Cabo Frio", "Petrópolis"],
    "MG": ["Belo Horizonte", "Uberlândia", "Ouro Preto", "Juiz de Fora"],
    "GO": ["Goiânia", "Anápolis", "Rio Verde"],
    "PR": ["Curitiba", "Londrina", "Maringá"],
    "ES": ["Vitória", "Vila Velha", "Cachoeiro de Itapemirim", "Linhares"],
    "SC": ["Florianópolis", "Joinville", "Blumenau"],
    "RS": ["Porto Alegre", "Caxias do Sul", "Pelotas"]
};

window.obterCidades = function(siglaEstado) {
    console.log("Buscando cidades (Fallback) para:", siglaEstado);
    // Retorna a lista local se a API do IBGE falhar
    return CIDADES_POR_ESTADO[siglaEstado] || ["Outra"];
};

// Inicializa o perfil automaticamente
document.addEventListener('DOMContentLoaded', () => {
    inicializarIconePerfil();
    inicializarBotoesAutenticacao();
});

// Notificação discreta para feedback no UI
function showNotification(message, type = 'info') {
    const existing = document.getElementById('app-notification');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'app-notification';
    container.style.position = 'fixed';
    container.style.top = '100px';
    container.style.right = '16px';
    container.style.zIndex = '10001';
    container.style.padding = '12px 16px';
    container.style.background = type === 'error' ? 'rgba(255, 68, 68, 0.95)' : type === 'success' ? 'rgba(40, 167, 69, 0.95)' : 'rgba(33, 150, 243, 0.95)';
    container.style.color = '#fff';
    container.style.borderRadius = '8px';
    container.style.boxShadow = '0 4px 16px rgba(0,0,0,0.35)';
    container.style.fontSize = '0.9rem';
    container.style.fontWeight = '600';
    container.textContent = message;

    document.body.appendChild(container);

    setTimeout(() => {
        container.style.opacity = '0';
        setTimeout(() => container.remove(), 300);
    }, 2600);
}

window.showNotification = showNotification;

// Override de todos os links login/cadastro para garantir navegação direta
document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href="login.html"], a[href="cadastro.html"]');
    if (!link) return;

    event.preventDefault();
    const target = link.getAttribute('href');
    window.location.href = target;
});
