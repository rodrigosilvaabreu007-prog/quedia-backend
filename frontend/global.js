// ✅ URL fixa da API no Google Cloud Run
const API_URL = 'https://quedia-api-649702844549.southamerica-east1.run.app/api';

// Torna a variável global e garante que não haja barra duplicada no final
window.API_URL = API_URL.replace(/\/$/, "");

console.log('🚀 EventHub API:', window.API_URL);

// Função para inicializar o ícone de perfil no cabeçalho
function inicializarIconePerfil() {
    const token = localStorage.getItem('eventhub-token');
    const usuario = localStorage.getItem('eventhub-usuario');
    const iconePerfilImg = document.getElementById('icone-perfil-img');
    const iconePerfil = document.getElementById('icone-perfil');

    if (token && usuario) {
        try {
            const usuarioData = JSON.parse(usuario);
            // Busca a foto específica do usuário ou usa uma padrão se não existir
            const fotoPerfil = localStorage.getItem(`foto-perfil-${usuarioData.id}`);

            if (iconePerfilImg) {
                if (fotoPerfil && fotoPerfil !== 'undefined') {
                    iconePerfilImg.src = fotoPerfil;
                    iconePerfilImg.style.display = 'block';
                    iconePerfil?.classList.add('has-image');
                    
                    // Caso a imagem dê erro ao carregar (link quebrado)
                    iconePerfilImg.onerror = () => {
                        iconePerfilImg.style.display = 'none';
                        iconePerfil?.classList.remove('has-image');
                    };
                } else {
                    iconePerfilImg.style.display = 'none';
                    iconePerfil?.classList.remove('has-image');
                }
            }
        } catch (error) {
            console.error('Erro ao inicializar ícone de perfil:', error);
        }
    } else {
        // Se não está logado, garante que o ícone esteja limpo
        if (iconePerfilImg) iconePerfilImg.style.display = 'none';
    }
}

// Função para navegar para o perfil ou login
function irParaPerfil() {
    const token = localStorage.getItem('eventhub-token');
    window.location.href = token ? 'perfil.html' : 'login.html';
}

// ✅ Função Global de Logout (Útil para o botão "Sair")
function fazerLogout() {
    localStorage.removeItem('eventhub-token');
    localStorage.removeItem('eventhub-usuario');
    // Você pode manter as fotos de perfil no cache para agilizar o próximo login
    window.location.href = 'index.html';
}

// Torna as funções de navegação globais
window.irParaPerfil = irParaPerfil;
window.fazerLogout = fazerLogout;

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', inicializarIconePerfil);