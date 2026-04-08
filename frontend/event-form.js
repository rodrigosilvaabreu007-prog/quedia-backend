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

function atualizarBotoesRemoverData() {
    const linhas = Array.from(document.querySelectorAll('.schedule-row'));
    linhas.forEach((linha) => {
        const botao = linha.querySelector('.btn-remover-data');
        if (botao) {
            botao.style.display = linhas.length > 1 ? 'inline-flex' : 'none';
        }
    });
}

function criarLinhaData() {
    const row = document.createElement('div');
    row.className = 'schedule-row';
    row.dataset.index = Date.now().toString();
    row.innerHTML = `
        <label>Data <input type="date" class="data-item" required></label>
        <label>Início <input type="time" class="horario-inicio-item" required></label>
        <label>Fim (opcional) <input type="time" class="horario-fim-item"></label>
        <button type="button" class="btn-remover-data" onclick="removerLinhaData(this)">Remover</button>
    `;
    return row;
}

window.adicionarLinhaData = function() {
    const lista = document.getElementById('datas-list');
    if (!lista) return;
    if (lista.querySelectorAll('.schedule-row').length >= 8) return;
    lista.appendChild(criarLinhaData());
    atualizarBotoesRemoverData();
};

window.removerLinhaData = function(button) {
    const row = button.closest('.schedule-row');
    const lista = document.getElementById('datas-list');
    if (!row || !lista) return;
    if (lista.querySelectorAll('.schedule-row').length <= 1) return;
    row.remove();
    atualizarBotoesRemoverData();
};

function obterDatasDoFormulario() {
    const rows = Array.from(document.querySelectorAll('.schedule-row'));
    return rows.map(row => {
        return {
            data: row.querySelector('.data-item')?.value || '',
            horario_inicio: row.querySelector('.horario-inicio-item')?.value || '',
            horario_fim: row.querySelector('.horario-fim-item')?.value || ''
        };
    }).filter(entry => entry.data && entry.horario_inicio);
}

function validarDatasFormulario() {
    const rows = Array.from(document.querySelectorAll('.schedule-row'));
    if (rows.length === 0) {
        return { valido: false, mensagem: 'Adicione ao menos uma data com horário de início.' };
    }

    for (const row of rows) {
        const dataItem = row.querySelector('.data-item')?.value;
        const inicioItem = row.querySelector('.horario-inicio-item')?.value;
        const fimItem = row.querySelector('.horario-fim-item')?.value;
        const anyFilled = dataItem || inicioItem || fimItem;

        if (!anyFilled) {
            continue;
        }
        if (!dataItem) {
            return { valido: false, mensagem: 'Cada linha precisa informar a data.' };
        }
        if (!inicioItem) {
            return { valido: false, mensagem: 'Cada linha precisa informar o horário de início.' };
        }
        if (fimItem && inicioItem && fimItem < inicioItem) {
            return { valido: false, mensagem: 'O horário de término não pode ser anterior ao horário de início.' };
        }
        const inicioData = new Date(`${dataItem}T${inicioItem}`);
        if (Number.isNaN(inicioData.getTime())) {
            return { valido: false, mensagem: 'Data ou horário inválido em uma das linhas.' };
        }
        if (inicioData < new Date()) {
            return { valido: false, mensagem: 'Datas e horários não podem estar no passado.' };
        }
    }

    const dadosValidos = obterDatasDoFormulario();
    if (dadosValidos.length === 0) {
        return { valido: false, mensagem: 'Adicione ao menos uma data com horário de início.' };
    }

    return { valido: true, dados: dadosValidos };
}

// --- MAPA E LOCALIZAÇÃO ---
let mapaEvento = null;
let marcadorEvento = null;
let marcadorIcon = null;

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
    console.log('[MAPA-FORM-01] Inicializando mapa do formulário');
    if (!window.L || !document.getElementById('mapa-evento')) {
        console.error('[MAPA-FORM-02] ERRO: Leaflet não disponível ou container não existe');
        return;
    }
    
    console.log('[MAPA-FORM-03] Leaflet disponível, criando mapa');
    mapaEvento = L.map('mapa-evento', {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
        tap: true
    }).setView([-15.7801, -47.9292], 4);

    marcadorIcon = L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    console.log('[MAPA-FORM-04] Ícone do marcador criado');

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapaEvento);
    console.log('[MAPA-FORM-05] Tile layer adicionado');

    setTimeout(() => {
        if (mapaEvento) {
            mapaEvento.invalidateSize();
            console.log('[MAPA-FORM-06] invalidateSize chamado');
        }
    }, 300);

    console.log('[MAPA-FORM-07] Registrando click listener no mapa');
    mapaEvento.on('click', function(event) {
        const lat = event.latlng.lat;
        const lon = event.latlng.lng;
        console.log('[MAPA-FORM-CLICK] Usuário clicou no mapa:', { lat, lon });
        
        const latitudeInput = document.getElementById('latitude');
        const longitudeInput = document.getElementById('longitude');
        const geoStatus = document.getElementById('geo-status');

        console.log('[MAPA-FORM-CLICK-02] Inputs encontrados:', { 
            latitudeInput: !!latitudeInput, 
            longitudeInput: !!longitudeInput, 
            geoStatus: !!geoStatus 
        });

        if (latitudeInput) {
            latitudeInput.value = lat.toFixed(6);
            console.log('[MAPA-FORM-CLICK-03] Latitude preenchida:', latitudeInput.value);
        }
        if (longitudeInput) {
            longitudeInput.value = lon.toFixed(6);
            console.log('[MAPA-FORM-CLICK-04] Longitude preenchida:', longitudeInput.value);
        }
        if (geoStatus) {
            geoStatus.textContent = `📍 Local definido em: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
            console.log('[MAPA-FORM-CLICK-05] Mensagem de status atualizada');
        }

        mapaEvento.setView([lat, lon], 16);

        if (marcadorEvento) {
            marcadorEvento.setLatLng([lat, lon]);
            marcadorEvento.setIcon(marcadorIcon);
            marcadorEvento.setPopupContent('Local do evento');
            marcadorEvento.openPopup();
            console.log('[MAPA-FORM-CLICK-06] Marcador existente movido');
        } else {
            marcadorEvento = L.marker([lat, lon], { icon: marcadorIcon, title: 'Local do evento' }).addTo(mapaEvento);
            marcadorEvento.bindPopup('Local do evento').openPopup();
            console.log('[MAPA-FORM-CLICK-07] Novo marcador criado e adicionado ao mapa');
        }
        console.log('[MAPA-FORM-CLICK-FIM] Click handler completado');
    });
}

// --- INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', () => {
    const estSelect = document.getElementById('evento-estado');
    if (estSelect) {
        estSelect.innerHTML = '<option value="">Estado</option>' + ESTADOS_BRASIL.map(estado => `<option value="${estado.uf}">${estado.nome} (${estado.uf})</option>`).join('');
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

    const adicionarDataBtn = document.getElementById('btn-adicionar-data');
    if (adicionarDataBtn) {
        adicionarDataBtn.addEventListener('click', adicionarLinhaData);
    }
    atualizarBotoesRemoverData();
    inicializarMapaEvento();
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
    const estado = document.getElementById('evento-estado').value;
    const cidade = document.getElementById('evento-cidade').value;
    const endereco = document.getElementById('endereco').value.trim();
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;

    const validacaoDatas = validarDatasFormulario();
    if (!validacaoDatas.valido) {
        msg.style.color = 'red';
        msg.textContent = `🚨 ${validacaoDatas.mensagem}`;
        return;
    }
    const datas = validacaoDatas.dados;
    const primeiraData = datas[0];

    if (!nome) {
        msg.style.color = 'red';
        msg.textContent = '🚨 Insira o nome do evento.';
        return;
    }
    if (!descricao) {
        msg.style.color = 'red';
        msg.textContent = '🚨 Insira a descrição do evento.';
        return;
    }
    if (!organizador) {
        msg.style.color = 'red';
        msg.textContent = '🚨 Insira o organizador do evento.';
        return;
    }
    if (!estado) {
        msg.style.color = 'red';
        msg.textContent = '🚨 Insira o estado do evento.';
        return;
    }
    if (!cidade) {
        msg.style.color = 'red';
        msg.textContent = '🚨 Insira a cidade do evento.';
        return;
    }
    if (!endereco) {
        msg.style.color = 'red';
        msg.textContent = '🚨 Insira o endereço ou local do evento.';
        return;
    }
    if (!latitude || !longitude) {
        msg.style.color = 'red';
        msg.textContent = '🚨 Defina a localização no mapa clicando no mapa.';
        return;
    }

    const selecionadas = Array.from(document.querySelectorAll('input[name="subcat"]:checked')).map(el => el.value);
    if (selecionadas.length === 0) {
        msg.style.color = 'red';
        msg.textContent = '🚨 Insira pelo menos uma categoria para o evento.';
        return;
    }

    const capaInput = document.getElementById('imagem-capa');
    if (!capaInput || !capaInput.files || capaInput.files.length === 0) {
        msg.style.color = 'red';
        msg.textContent = '🚨 Selecione a imagem de capa do evento.';
        return;
    }

    formData.append('nome', nome);
    formData.append('descricao', descricao);
    formData.append('organizador', organizador);
    formData.append('cidade', cidade);
    formData.append('estado', estado);
    formData.append('endereco', endereco);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    formData.append('datas', JSON.stringify(datas));
    formData.append('data', primeiraData.data);
    formData.append('horario', primeiraData.horario_inicio);
    if (primeiraData.horario_fim) {
        formData.append('horario_fim', primeiraData.horario_fim);
    }
    console.log('[DEBUG] FormData enviado:', {
        latitude: latitude,
        longitude: longitude,
        latitudeType: typeof latitude,
        longitudeType: typeof longitude,
        datasCount: datas.length
    });

    const precoVal = document.getElementById('preco').value;
    formData.append('preco', precoVal || 0);
    formData.append('gratuito', document.getElementById('gratuito-sim').checked);

    // Tratamento de categorias
    const categoriasSelecionadas = Array.from(document.querySelectorAll('input[name="subcat"]:checked')).map(el => el.value);
    categoriasSelecionadas.forEach(s => formData.append('subcategorias', s));
    formData.append('categoria', categoriasSelecionadas[0] || 'Outros');

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
            msg.textContent = "✅ Evento publicado";
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