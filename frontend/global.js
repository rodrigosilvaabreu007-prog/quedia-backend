// ✅ URL ÚNICA E CORRETA DA API (Google Cloud Run)
// ✅ URL ATUALIZADA DO GOOGLE CLOUD RUN
const BASE_URL = "https://backend-649702844549.southamerica-east1.run.app";
const API_URL = `${BASE_URL}/api`;

// Torna as variáveis globais
window.BASE_URL = BASE_URL;
window.API_URL = API_URL;

console.log('🚀 QueDia API Conectada em:', window.API_URL);

// Função para inicializar o ícone de perfil no cabeçalho
function inicializarIconePerfil() {
    const token = localStorage.getItem('eventhub-token');
    const usuario = localStorage.getItem('eventhub-usuario');
    const iconePerfilImg = document.getElementById('icone-perfil-img');
    const iconePerfil = document.getElementById('icone-perfil');

    if (token && usuario) {
        try {
            const usuarioData = JSON.parse(usuario);
            const fotoPerfil = localStorage.getItem(`foto-perfil-${usuarioData.id}`);

            if (iconePerfilImg) {
                if (fotoPerfil && fotoPerfil !== 'undefined') {
                    iconePerfilImg.src = fotoPerfil;
                    iconePerfilImg.style.display = 'block';
                    iconePerfil?.classList.add('has-image');
                    
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
        if (iconePerfilImg) iconePerfilImg.style.display = 'none';
    }
}

function irParaPerfil() {
    const token = localStorage.getItem('eventhub-token');
    window.location.href = token ? 'perfil.html' : 'login.html';
}

function fazerLogout() {
    localStorage.removeItem('eventhub-token');
    localStorage.removeItem('eventhub-usuario');
    window.location.href = 'index.html';
}

window.irParaPerfil = irParaPerfil;
window.fazerLogout = fazerLogout;

document.addEventListener('DOMContentLoaded', inicializarIconePerfil);

// --- ADICIONE ISSO AO FINAL DO SEU GLOBAL.JS ---

// Banco de dados simplificado de cidades (Exemplo para não quebrar o form)
const CIDADES_POR_ESTADO = {
    "SP": ["São Paulo", "Campinas", "Santos", "São Bernardo do Campo"],
    "RJ": ["Rio de Janeiro", "Niterói", "Búzios", "Angra dos Reis"],
    "MG": ["Belo Horizonte", "Uberlândia", "Ouro Preto"],
    "GO": ["Goiânia", "Anápolis", "Rio Verde"]
    // Você pode completar com mais cidades depois ou importar um JSON
};

window.obterCidades = function(siglaEstado) {
    // Se o estado existir no nosso banco acima, retorna as cidades. 
    // Se não, retorna um aviso ou busca de uma API externa (IBGE)
    console.log("Buscando cidades para:", siglaEstado);
    return CIDADES_POR_ESTADO[siglaEstado] || ["Cidade não encontrada", "Outra"];
};