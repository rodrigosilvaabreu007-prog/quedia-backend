// ✅ URL DA API (definida no global.js)

const ESTADOS_BRASIL = [
    { uf: 'AC', nome: 'Acre' },
    { uf: 'AL', nome: 'Alagoas' },
    { uf: 'AP', nome: 'Amapá' },
    { uf: 'AM', nome: 'Amazonas' },
    { uf: 'BA', nome: 'Bahia' },
    { uf: 'CE', nome: 'Ceará' },
    { uf: 'DF', nome: 'Distrito Federal' },
    { uf: 'ES', nome: 'Espírito Santo' },
    { uf: 'GO', nome: 'Goiás' },
    { uf: 'MA', nome: 'Maranhão' },
    { uf: 'MT', nome: 'Mato Grosso' },
    { uf: 'MS', nome: 'Mato Grosso do Sul' },
    { uf: 'MG', nome: 'Minas Gerais' },
    { uf: 'PA', nome: 'Pará' },
    { uf: 'PB', nome: 'Paraíba' },
    { uf: 'PR', nome: 'Paraná' },
    { uf: 'PE', nome: 'Pernambuco' },
    { uf: 'PI', nome: 'Piauí' },
    { uf: 'RJ', nome: 'Rio de Janeiro' },
    { uf: 'RN', nome: 'Rio Grande do Norte' },
    { uf: 'RS', nome: 'Rio Grande do Sul' },
    { uf: 'RO', nome: 'Rondônia' },
    { uf: 'RR', nome: 'Roraima' },
    { uf: 'SC', nome: 'Santa Catarina' },
    { uf: 'SP', nome: 'São Paulo' },
    { uf: 'SE', nome: 'Sergipe' },
    { uf: 'TO', nome: 'Tocantins' }
];
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
    preview.innerHTML = '';

    if (input?.files?.length > 0) {
        const files = Array.from(input.files).slice(0, 8);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                img.className = 'preview-thumb';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });

        if (input.files.length > 8) {
            const aviso = document.createElement('div');
            aviso.textContent = `Mostrando 8 de ${input.files.length} imagens. Remova algumas para ver todas.`;
            aviso.className = 'preview-aviso';
            preview.appendChild(aviso);
        }
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

// --- MAPA E LOCALIZAÇÃO ---
let mapaEvento = null;
let marcadorEvento = null;

async function buscarCoordenadas(endereco) {
    if (!endereco) return null;
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1&addressdetails=1&countrycodes=br`;
        const res = await fetch(url, {
            headers: { 'Accept-Language': 'pt-BR,pt;q=0.9', 'User-Agent': 'EventHub/1.0 (contato@eventhub.app)' }
        });
        const dados = await res.json();
        if (Array.isArray(dados) && dados.length > 0) {
            return {
                lat: parseFloat(dados[0].lat),
                lon: parseFloat(dados[0].lon),
                display_name: dados[0].display_name
            };
        }
    } catch (e) {
        console.warn('Erro geocodificando endereço:', e);
    }
    return null;
}

async function atualizarMapaPorEndereco() {
    const endereco = document.getElementById('endereco')?.value?.trim();
    const cidade = document.getElementById('evento-cidade')?.value?.trim();
    const estado = document.getElementById('evento-estado')?.value?.trim();
    const enderecoCompleto = [endereco, cidade, estado, 'Brasil'].filter(Boolean).join(', ');

    if (!endereco && !cidade) return;

    const coords = await buscarCoordenadas(enderecoCompleto);
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');
    const geoStatus = document.getElementById('geo-status');

    if (coords) {
        const { lat, lon } = coords;
        latInput.value = lat;
        lonInput.value = lon;
        geoStatus.textContent = `📍 Coordenadas encontradas: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        if (mapaEvento) {
            mapaEvento.setView([lat, lon], 16);
            if (marcadorEvento) marcadorEvento.setLatLng([lat, lon]);
            else marcadorEvento = L.marker([lat, lon]).addTo(mapaEvento);
        }
    } else {
        geoStatus.textContent = '⚠️ Não foi possível encontrar coordenadas automáticas. Ajuste manualmente.';
    }
}

function inicializarMapaEvento() {
    if (!window.L || !document.getElementById('mapa-evento')) return;
    mapaEvento = L.map('mapa-evento').setView([-15.7801, -47.9292], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapaEvento);

    marcadorEvento = L.marker([-15.7801, -47.9292], { draggable: true }).addTo(mapaEvento);
    marcadorEvento.on('moveend', function(event) {
        const latLng = event.target.getLatLng();
        document.getElementById('latitude').value = latLng.lat.toFixed(6);
        document.getElementById('longitude').value = latLng.lng.toFixed(6);
    });
}

// --- INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', () => {
    const estSelect = document.getElementById('evento-estado');
    if (estSelect) {
        estSelect.innerHTML = '<option value="">Estado</option>' + ESTADOS_BRASIL.map(estado => `<option value="${estado.uf}">${estado.nome} (${estado.uf})</option>`).join('');
        estSelect.addEventListener('change', atualizarMapaPorEndereco);
    }

    const catDiv = document.getElementById('categorias-evento');
    if (catDiv) {
        catDiv.innerHTML = "";
        Object.entries(CATEGORIAS_JSON).forEach(([pai, subs]) => {
            let html = `<div style="color:#00bfff; font-weight:bold; margin-top:10px; grid-column: 1/-1;">${pai}</div>`;
            subs.forEach(s => {
                html += `<label class="categoria-item"><input type="checkbox" name="subcat" value="${s}"> ${s}</label>`;
            });
            catDiv.innerHTML += html;
        });
    }

    const enderecoInput = document.getElementById('endereco');
    if (enderecoInput) {
        enderecoInput.addEventListener('change', atualizarMapaPorEndereco);
        enderecoInput.addEventListener('blur', atualizarMapaPorEndereco);
    }

    const cidadeSelect = document.getElementById('evento-cidade');
    if (cidadeSelect) {
        cidadeSelect.addEventListener('change', atualizarMapaPorEndereco);
    }

    inicializarMapaEvento();

    const botaoGeo = document.getElementById('btn-geolocalizar');
    if (botaoGeo) {
        botaoGeo.addEventListener('click', async (e) => {
            e.preventDefault();
            const endereco = document.getElementById('endereco').value;
            if (!endereco) {
                document.getElementById('geo-status').textContent = 'Informe o endereço antes de geolocalizar.';
                return;
            }
            await atualizarMapaPorEndereco();
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

    // Inserir coordenadas de geolocalização, se houver
    const lat = document.getElementById('latitude')?.value || '';
    const lon = document.getElementById('longitude')?.value || '';
    if (lat) formData.append('latitude', lat);
    if (lon) formData.append('longitude', lon);

    const dateValue = document.getElementById('data').value;
    const timeValue = document.getElementById('horario').value;
    if (dateValue && timeValue) {
        const scheduled = new Date(`${dateValue}T${timeValue}`);
        if (scheduled < new Date()) {
            msg.style.color = 'red';
            msg.textContent = '🚫 Data e horário não podem ser no passado.';
            return;
        }
    }
    
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