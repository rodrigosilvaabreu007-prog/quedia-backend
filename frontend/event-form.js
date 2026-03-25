// --- 1. CATEGORIAS E ESTADOS ---
const CATEGORIAS_FIXAS = {
    "Show e Música": ["Sertanejo", "Rock", "Eletrônico", "Pagode", "Funk", "Gospel", "Outros"],
    "Gastronomia": ["Festival", "Workshop", "Jantar", "Degustação", "Churrasco"],
    "Esporte": ["Corrida", "Campeonato", "Aula Aberta", "Trilha", "Futebol", "Vôlei"],
    "Cultura": ["Teatro", "Exposição", "Cinema", "Feira", "Dança", "Literatura"],
    "Religioso": ["Culto", "Missa", "Congresso", "Retiro"],
    "Outros": ["Networking", "Workshop", "Palestra", "Formatura", "Aniversário"]
};

const LISTA_ESTADOS = [
    { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
    { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
    { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
    { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
    { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
    { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
    { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' }
];

// --- 2. FUNÇÕES AUXILIARES (IBGE para cidades) ---
window.obterCidades = async function(sigla) {
    try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${sigla}/municipios`);
        const dados = await response.json();
        return dados.map(m => m.nome).sort();
    } catch (e) {
        return ["Erro ao carregar cidades"];
    }
};

window.togglePreco = function() {
    const isGratuito = document.getElementById('gratuito-sim')?.checked;
    const container = document.getElementById('container-preco');
    const input = document.getElementById('preco');
    if (container && input) {
        container.style.display = isGratuito ? 'none' : 'block';
        if (isGratuito) input.value = '0';
    }
};

window.mostrarPreviewImagens = function() {
    const input = document.getElementById('imagens');
    const preview = document.getElementById('preview-imagens');
    if (!preview || !input?.files) return;
    preview.innerHTML = '';
    Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin: 5px; border: 2px solid #00bfff;';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
};

window.atualizarCidadesEvento = async function() {
    const estado = document.getElementById('evento-estado')?.value;
    const cidadeSelect = document.getElementById('evento-cidade');
    if (!cidadeSelect) return;

    if (!estado) {
        cidadeSelect.innerHTML = '<option value="">Selecione o estado</option>';
        cidadeSelect.disabled = true;
        return;
    }

    cidadeSelect.innerHTML = '<option value="">Carregando...</option>';
    const cidades = await window.obterCidades(estado);
    cidadeSelect.innerHTML = '<option value="">Selecione a cidade</option>';
    cidades.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        cidadeSelect.appendChild(opt);
    });
    cidadeSelect.disabled = false;
};

// --- 3. INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    const estadoSelect = document.getElementById('evento-estado');
    if (estadoSelect) {
        estadoSelect.innerHTML = '<option value="">Selecione o estado</option>';
        LISTA_ESTADOS.forEach(e => {
            const opt = document.createElement('option');
            opt.value = e.sigla; opt.textContent = e.nome;
            estadoSelect.appendChild(opt);
        });
        estadoSelect.addEventListener('change', window.atualizarCidadesEvento);
    }

    const catContainer = document.getElementById('categorias-evento');
    if (catContainer) {
        catContainer.innerHTML = '';
        Object.keys(CATEGORIAS_FIXAS).forEach(titulo => {
            const h = document.createElement('div');
            h.style.cssText = 'font-weight: bold; color: #00bfff; margin-top: 15px; font-size: 14px;';
            h.textContent = titulo;
            catContainer.appendChild(h);
            CATEGORIAS_FIXAS[titulo].forEach(sub => {
                const div = document.createElement('div');
                div.style.margin = '5px 0 5px 15px';
                div.innerHTML = `<input type="checkbox" name="evento-subcategoria" value="${sub}" id="cat-${sub}">
                                <label for="cat-${sub}" style="font-size: 13px; cursor:pointer;">${sub}</label>`;
                catContainer.appendChild(div);
            });
        });
    }
});

// --- 4. ENVIO PARA O BACKEND ---
const form = document.getElementById('cadastro-evento');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = document.getElementById('mensagem-evento');
        const token = localStorage.getItem('eventhub-token'); // Pegando o token correto do seu global.js

        const formData = new FormData();
        
        // Função segura para pegar valores e evitar erro de 'null'
        const getVal = (id) => document.getElementById(id)?.value || "";

        formData.append('nome', getVal('nome'));
        formData.append('data', getVal('data'));
        formData.append('cidade', getVal('evento-cidade'));
        formData.append('estado', getVal('evento-estado'));
        
        // CORREÇÃO CRÍTICA: Tenta pegar por 'local' ou 'endereco'
        const localVal = document.getElementById('local')?.value || document.getElementById('endereco')?.value || "";
        formData.append('local', localVal); 

        formData.append('preco', Number(getVal('preco')) || 0);
        formData.append('gratuito', document.getElementById('gratuito-sim')?.checked || false);
        formData.append('organizador_id', 1);

        const inputFoto = document.getElementById('imagens');
        if (inputFoto?.files.length > 0) {
            formData.append('imagem', inputFoto.files[0]);
        }

        try {
            msg.textContent = "🚀 Cadastrando...";
            const res = await fetch(`${window.API_URL}/eventos`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                msg.textContent = "✅ Evento criado com sucesso!";
                setTimeout(() => window.location.href = 'index.html', 1500);
            } else {
                const erro = await res.json();
                msg.textContent = "❌ " + (erro.erro || "Verifique os dados.");
            }
        } catch (err) {
            msg.textContent = "❌ Erro de conexão com o servidor.";
        }
    });
}