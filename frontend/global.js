// ✅ URL ÚNICA E ATUALIZADA (Google Cloud Run)
const BASE_URL = "https://backend-649702844549.southamerica-east1.run.app";
const API_URL = `${BASE_URL}/api`;

// Torna as variáveis globais para todos os outros arquivos JS (como event-form.js e login.js)
window.BASE_URL = BASE_URL;
window.API_URL = API_URL;

console.log('🚀 QueDia API conectada em:', window.API_URL);

// --- FUNÇÕES DE PERFIL E NAVEGAÇÃO ---

function inicializarIconePerfil() {
    const token = localStorage.getItem('eventhub-token');
    const usuario = localStorage.getItem('eventhub-usuario');
    const iconePerfilImg = document.getElementById('icone-perfil-img');
    const iconePerfil = document.getElementById('icone-perfil');

    // Se não houver os elementos na página atual (ex: algumas páginas podem não ter o ícone), sai da função
    if (!iconePerfil || !iconePerfilImg) return;

    if (token && usuario) {
        try {
            const usuarioData = JSON.parse(usuario);
            // Tenta pegar a foto salva localmente ou a que veio do objeto usuário
            const fotoPerfil = localStorage.getItem(`foto-perfil-${usuarioData.id}`) || usuarioData.foto;

            if (fotoPerfil && fotoPerfil !== 'undefined' && fotoPerfil !== 'null') {
                iconePerfilImg.src = fotoPerfil;
                iconePerfilImg.style.display = 'block';
                iconePerfil.classList.add('has-image');
                
                // Se a imagem falhar ao carregar (link quebrado), esconde o elemento
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
        }
    } else {
        // Se não estiver logado, garante que o ícone não apareça
        iconePerfilImg.style.display = 'none';
        iconePerfil.style.display = 'none'; 
    }
}

function irParaPerfil() {
    const token = localStorage.getItem('eventhub-token');
    // Se tiver token vai para o perfil, se não vai para o login
    window.location.href = token ? 'perfil.html' : 'login.html';
}

function fazerLogout() {
    localStorage.removeItem('eventhub-token');
    localStorage.removeItem('eventhub-usuario');
    window.location.href = 'index.html';
}

// Exporta as funções para o objeto window para garantir que o HTML as encontre
window.irParaPerfil = irParaPerfil;
window.fazerLogout = fazerLogout;
window.inicializarIconePerfil = inicializarIconePerfil;

// --- UTILITÁRIOS DE LOCALIZAÇÃO (Fallback caso a API do IBGE falhe) ---

const CIDADES_POR_ESTADO = {
    "SP": ["São Paulo", "Campinas", "Santos", "São José dos Campos"],
    "RJ": ["Rio de Janeiro", "Niterói", "Búzios", "Cabo Frio"],
    "MG": ["Belo Horizonte", "Uberlândia", "Ouro Preto"],
    "GO": ["Goiânia", "Anápolis", "Rio Verde"]
};

window.obterCidades = function(siglaEstado) {
    console.log("Buscando cidades para:", siglaEstado);
    return CIDADES_POR_ESTADO[siglaEstado] || ["Cidade não encontrada", "Outra"];
};

// Inicializa o perfil automaticamente sempre que qualquer página carregar
document.addEventListener('DOMContentLoaded', inicializarIconePerfil);