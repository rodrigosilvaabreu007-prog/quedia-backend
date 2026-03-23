// --- FUNÇÕES DE INTERFACE ---
window.togglePreco = function() {
    const gratuitoSim = document.getElementById('gratuito-sim');
    const campoPrecoContainer = document.getElementById('container-preco');
    const inputPreco = document.getElementById('preco');

    if (gratuitoSim && gratuitoSim.checked) {
        if (campoPrecoContainer) campoPrecoContainer.style.display = 'none';
        if (inputPreco) { inputPreco.required = false; inputPreco.value = '0'; }
    } else {
        if (campoPrecoContainer) campoPrecoContainer.style.display = 'block';
        if (inputPreco) { inputPreco.required = true; inputPreco.value = ''; }
    }
};

window.mostrarPreviewImagens = function() {
    const input = document.getElementById('imagens');
    const preview = document.getElementById('preview-imagens');
    if (!preview || !input) return;
    preview.innerHTML = '';
    if (input.files) {
        Array.from(input.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.cssText = 'width: 80px; height: 80px; object-fit: cover; border-radius: 5px; margin: 5px; border: 1px solid #00bfff;';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }
};

window.atualizarCidadesEvento = function() {
    const estadoSelect = document.getElementById('evento-estado');
    const cidadeSelect = document.getElementById('evento-cidade');
    if (!estadoSelect || !cidadeSelect) return;
    const estado = estadoSelect.value;
    
    // Verifica se a função existe no outro arquivo
    const obterCidades = window.obterCidades || (typeof obterCidades !== 'undefined' ? obterCidades : null);
    
    if (!estado || !obterCidades) {
        cidadeSelect.innerHTML = '<option value="">Selecione primeiro um estado</option>';
        cidadeSelect.disabled = true;
        return;
    }
    const cidades = obterCidades(estado);
    cidadeSelect.innerHTML = '<option value="">Selecione uma cidade</option>';
    cidades.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        cidadeSelect.appendChild(opt);
    });
    cidadeSelect.disabled = false;
};

// --- INICIALIZAÇÃO (Onde as categorias aparecem) ---
document.addEventListener('DOMContentLoaded', () => {
    // Pequeno delay para garantir que categorias.js e estados.js carregaram
    setTimeout(() => {
        // Carregar Estados
        const estadoSelect = document.getElementById('evento-estado');
        const funcEstados = window.obterEstados || (typeof obterEstados !== 'undefined' ? obterEstados : null);
        if (estadoSelect && funcEstados) {
            funcEstados().forEach(e => {
                const opt = document.createElement('option');
                opt.value = e.sigla; opt.textContent = e.nome;
                estadoSelect.appendChild(opt);
            });
        }

        // Carregar Categorias
        const container = document.getElementById('categorias-evento');
        const funcCat = window.obterCategoriasPrincipais || (typeof obterCategoriasPrincipais !== 'undefined' ? obterCategoriasPrincipais : null);
        const funcSub = window.obterSubcategorias || (typeof obterSubcategorias !== 'undefined' ? obterSubcategorias : null);

        if (container && funcCat && funcSub) {
            container.innerHTML = ''; // Limpa o "carregando"
            funcCat().forEach(cat => {
                const h = document.createElement('div');
                h.style.cssText = 'font-weight: bold; color: #00bfff; margin-top: 10px; font-size: 14px;';
                h.textContent = cat;
                container.appendChild(h);

                funcSub(cat).forEach(sub => {
                    const div = document.createElement('div');
                    div.style.margin = '5px 0 5px 15px';
                    div.innerHTML = `
                        <input type="checkbox" name="evento-subcategoria" value="${sub}" id="cat-${sub}">
                        <label for="cat-${sub}" style="font-size: 13px;">${sub}</label>
                    `;
                    container.appendChild(div);
                });
            });
        } else {
            console.error("Arquivos de categorias ou estados não foram encontrados!");
        }
    }, 200); // 200ms de folga pro navegador respirar
});

// Lógica de envio (Submit)
const form = document.getElementById('cadastro-evento');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = document.getElementById('mensagem-evento');
        const token = localStorage.getItem('eventhub-token');
        if (!token) { alert("Logue novamente!"); return; }

        const formData = new FormData(form);
        const dados = Object.fromEntries(formData);
        
        // Pega as subcategorias marcadas
        const subs = Array.from(document.querySelectorAll('input[name="evento-subcategoria"]:checked')).map(cb => cb.value);
        if (subs.length === 0) {
            msg.textContent = "Selecione ao menos uma categoria!";
            msg.style.color = "orange";
            return;
        }

        dados.subcategorias = subs;
        dados.categoria = subs[0];
        dados.gratuito = document.getElementById('gratuito-sim').checked;
        dados.preco = dados.gratuito ? 0 : Number(dados.preco);

        try {
            const res = await fetch(`/api/eventos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dados)
            });
            if (res.ok) {
                msg.textContent = "Sucesso!";
                setTimeout(() => window.location.href = 'index.html', 1500);
            } else {
                msg.textContent = "Erro no cadastro.";
            }
        } catch (err) { console.error(err); }
    });
}