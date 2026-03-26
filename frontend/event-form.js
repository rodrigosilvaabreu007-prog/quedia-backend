// ✅ URL DA API (definida no global.js)

const ESTADOS_BRASIL = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const CATEGORIAS_JSON = {
    "Música": ["Sertanejo", "Rock", "Eletrônico", "Pagode", "Funk"],
    "Cultura": ["Teatro", "Exposição", "Cinema", "Workshop"],
    "Outros": ["Gastronomia", "Esporte", "Religioso"]
};

// --- FUNÇÕES DE INTERFACE (MANTIDAS EXATAMENTE COMO AS SUAS) ---

window.togglePreco = () => {
    const isPago = document.getElementById('gratuito-nao').checked;
    const containerPreco = document.getElementById('container-preco');
    if (containerPreco) containerPreco.style.display = isPago ? 'block' : 'none';
};

window.mostrarPreviewImagens = () => {
    const input = document.getElementById('imagens');
    const preview = document.getElementById('preview-imagens');
    if (input?.files?.[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" style="width: 120px; border-radius: 8px; border: 2px solid #00bfff; margin-top: 10px;">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.atualizarCidades = async () => {
    const estado = document.getElementById('evento-estado').value;
    const select = document.getElementById('evento-cidade');
    if (!estado || !select) return;

    select.disabled = false;
    select.innerHTML = '<option>Carregando...</option>';
    
    try {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`);
        const cidades = await res.json();
        select.innerHTML = cidades.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
    } catch (e) {
        select.innerHTML = '<option value="">Erro ao carregar cidades</option>';
    }
};

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    const estSelect = document.getElementById('evento-estado');
    if (estSelect) {
        estSelect.innerHTML = '<option value="">UF</option>' + ESTADOS_BRASIL.map(uf => `<option value="${uf}">${uf}</option>`).join('');
    }

    const catDiv = document.getElementById('categorias-evento');
    if (catDiv) {
        catDiv.innerHTML = "";
        Object.entries(CATEGORIAS_JSON).forEach(([pai, subs]) => {
            let html = `<div style="color:#00bfff; font-weight:bold; margin-top:10px; grid-column: 1/-1;">${pai}</div>`;
            subs.forEach(s => {
                html += `<label style="display:block;"><input type="checkbox" name="subcat" value="${s}"> ${s}</label>`;
            });
            catDiv.innerHTML += html;
        });
    }
});

// --- ENVIO DO FORMULÁRIO (BLINDADO) ---
document.getElementById('cadastro-evento').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('mensagem-evento');
    const btn = document.getElementById('btn-submit');
    const token = localStorage.getItem('eventhub-token');

    if (!token) {
        msg.style.color = "yellow";
        msg.textContent = "⚠️ Você precisa estar logado para publicar.";
        return;
    }

    const formData = new FormData();
    
    // Captura dos campos do seu formulário
    formData.append('nome', document.getElementById('nome').value);
    formData.append('descricao', document.getElementById('descricao').value);
    formData.append('data', document.getElementById('data').value);
    formData.append('horario', document.getElementById('horario').value);
    formData.append('cidade', document.getElementById('evento-cidade').value);
    formData.append('estado', document.getElementById('evento-estado').value);
    
    // Sincronizado com o Schema 'local' do backend
    formData.append('local', document.getElementById('endereco').value);
    
    const precoVal = document.getElementById('preco').value;
    formData.append('preco', precoVal || 0);
    formData.append('gratuito', document.getElementById('gratuito-sim').checked);

    // Tratamento de categorias
    const selecionadas = Array.from(document.querySelectorAll('input[name="subcat"]:checked')).map(el => el.value);
    // Adicionamos as subcategorias uma a uma no formData
    selecionadas.forEach(s => formData.append('subcategorias', s));
    // Define a categoria principal (a primeira selecionada ou Outros)
    formData.append('categoria', selecionadas[0] || "Outros");

    // Upload de Fotos (Sincronizado com o Multer do backend)
    const inputFoto = document.getElementById('imagens');
    if (inputFoto?.files?.length > 0) {
        for (let i = 0; i < inputFoto.files.length; i++) {
            formData.append('imagens', inputFoto.files[i]);
        }
    }

    try {
        btn.disabled = true;
        msg.style.color = "#00bfff";
        msg.textContent = "🚀 Publicando evento no servidor...";

        const res = await fetch(`${window.API_URL}/eventos`, {
            method: 'POST',
            headers: { 
                // IMPORTANTE: Com FormData não enviamos Content-Type manual, o navegador faz isso
                'Authorization': `Bearer ${token}` 
            },
            body: formData
        });

        const dados = await res.json();

        if (res.ok) {
            msg.style.color = "lightgreen";
            msg.textContent = "✅ EVENTO PUBLICADO COM SUCESSO!";
            setTimeout(() => window.location.href = 'index.html', 2000);
        } else {
            msg.style.color = "red";
            msg.textContent = `❌ Erro: ${dados.erro || dados.detalhe || 'Falha no servidor'}`;
            console.error("Erro retornado pelo backend:", dados);
        }
    } catch (err) {
        msg.style.color = "red";
        msg.textContent = "❌ Falha de conexão. O servidor pode estar iniciando.";
        console.error("Erro de fetch:", err);
    } finally {
        btn.disabled = false;
    }
});