
const BASE_URL = window.BASE_URL || "https://eventhub-api-649702844549.us-central1.run.app";
const API_URL = window.API_URL || `${BASE_URL}/api`;

window.BASE_URL = BASE_URL;
window.API_URL = API_URL;

console.log('🚀 API QueDia Conectada com Sucesso:', window.API_URL);
console.log('🚀 QueDia API conectada em:', window.API_URL);

// --- FUNÇÕES DE PERFIL E NAVEGAÇÃO ---

function inicializarIconePerfil() {
    const token = localStorage.getItem('eventhub-token');
    const usuario = localStorage.getItem('eventhub-usuario');
    const iconePerfilImg = document.getElementById('icone-perfil-img');
    const iconePerfil = document.getElementById('icone-perfil');

    // Se não houver os elementos na página atual, sai da função
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

// Exporta as funções para o objeto window
window.irParaPerfil = irParaPerfil;
window.fazerLogout = fazerLogout;
window.inicializarIconePerfil = inicializarIconePerfil;

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
document.addEventListener('DOMContentLoaded', inicializarIconePerfil);