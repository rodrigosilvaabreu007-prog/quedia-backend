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

window.mostrarPreviewCapa = () => {
    const input = document.getElementById('imagem-capa');
    const preview = document.getElementById('preview-capa');
    preview.innerHTML = '';

    if (input?.files?.[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = input.files[0].name;
            img.className = 'preview-thumb';
            preview.appendChild(img);
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.mostrarPreviewImagens = () => {
    const input = document.getElementById('imagens-evento');
    const preview = document.getElementById('preview-imagens');
    preview.innerHTML = '';

    if (input?.files?.length > 0) {
        const files = Array.from(input.files);
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

    mapaEvento.on('click', function(event) {
        const lat = event.latlng.lat;
        const lon = event.latlng.lng;
        document.getElementById('latitude').value = lat.toFixed(6);
        document.getElementById('longitude').value = lon.toFixed(6);
        document.getElementById('geo-status').textContent = `📍 Local definido em: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;

        mapaEvento.setView([lat, lon], 16);

        if (marcadorEvento) {
            marcadorEvento.setLatLng([lat, lon]);
        } else {
            marcadorEvento = L.marker([lat, lon]).addTo(mapaEvento);
        }
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
        enderecoInput.addEventListener('blur', () => {
            document.getElementById('geo-status').textContent = 'Clique no mapa para marcar o local exato.';
        });
    }

    const cidadeSelect = document.getElementById('evento-cidade');
    if (cidadeSelect) {
        cidadeSelect.addEventListener('change', () => {
            document.getElementById('geo-status').textContent = 'Clique no mapa para marcar o local exato.';
        });
    }

    inicializarMapaEvento();

    const botaoGeo = document.getElementById('btn-definir-endereco');
    if (botaoGeo) {
        botaoGeo.addEventListener('click', (e) => {
            e.preventDefault();
            if (marcadorEvento) {
                mapaEvento.setView(marcadorEvento.getLatLng(), 16);
                document.getElementById('geo-status').textContent = `📍 Local atual centralizado: ${marcadorEvento.getLatLng().lat.toFixed(6)}, ${marcadorEvento.getLatLng().lng.toFixed(6)}`;
            } else {
                document.getElementById('geo-status').textContent = 'Clique no mapa para definir o local exato do evento.';
            }
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

    // Campos obrigatórios
    const nome = document.getElementById('nome').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const organizador = document.getElementById('organizador').value.trim();
    const data = document.getElementById('data').value;
    const horario = document.getElementById('horario').value;
    const estado = document.getElementById('evento-estado').value;
    const cidade = document.getElementById('evento-cidade').value;
    const endereco = document.getElementById('endereco').value.trim();
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;

    if (!nome || !descricao || !organizador || !data || !horario || !estado || !cidade || !endereco || !latitude || !longitude) {
        msg.style.color = 'red';
        msg.textContent = '🚨 Preencha todos os campos obrigatórios e defina a localização no mapa.';
        return;
    }

    const capaInput = document.getElementById('imagem-capa');
    if (!capaInput || !capaInput.files || capaInput.files.length === 0) {
        msg.style.color = 'red';
        msg.textContent = '🚨 Imagem de capa é obrigatória.';
        return;
    }

    if (new Date(`${data}T${horario}`) < new Date()) {
        msg.style.color = 'red';
        msg.textContent = '🚫 Data e horário não podem ser no passado.';
        return;
    }

    formData.append('nome', nome);
    formData.append('descricao', descricao);
    formData.append('organizador', organizador);
    formData.append('data', data);
    formData.append('horario', horario);
    formData.append('cidade', cidade);
    formData.append('estado', estado);
    formData.append('local', endereco);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);

    const precoVal = document.getElementById('preco').value;
    formData.append('preco', precoVal || 0);
    formData.append('gratuito', document.getElementById('gratuito-sim').checked);

    // Tratamento de categorias
    const selecionadas = Array.from(document.querySelectorAll('input[name="subcat"]:checked')).map(el => el.value);
    selecionadas.forEach(s => formData.append('subcategorias', s));
    formData.append('categoria', selecionadas[0] || 'Outros');

    // Imagem de capa
    formData.append('imagemCapa', capaInput.files[0]);

    // Imagens do evento (opcional)
    const inputFotosEvento = document.getElementById('imagens-evento');
    if (inputFotosEvento?.files?.length > 0) {
        for (let i = 0; i < inputFotosEvento.files.length; i++) {
            formData.append('imagens', inputFotosEvento.files[i]);
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