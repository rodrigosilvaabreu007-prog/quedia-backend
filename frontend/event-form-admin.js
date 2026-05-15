// Flag para prevenir múltiplos envios do formulário
let estahEnviandoFormulario = false;

const ESTADOS_BRASIL = [
    { uf: 'AC', nome: 'Acre' },
    { uf: 'AL', nome: 'Alagoas' },
    { uf: 'AP', nome: 'Amapa' },
    { uf: 'AM', nome: 'Amazonas' },
    { uf: 'BA', nome: 'Bahia' },
    { uf: 'CE', nome: 'Ceara' },
    { uf: 'DF', nome: 'Distrito Federal' },
    { uf: 'ES', nome: 'Espirito Santo' },
    { uf: 'GO', nome: 'Goias' },
    { uf: 'MA', nome: 'Maranhao' },
    { uf: 'MT', nome: 'Mato Grosso' },
    { uf: 'MS', nome: 'Mato Grosso do Sul' },
    { uf: 'MG', nome: 'Minas Gerais' },
    { uf: 'PA', nome: 'Para' },
    { uf: 'PB', nome: 'Paraiba' },
    { uf: 'PR', nome: 'Parana' },
    { uf: 'PE', nome: 'Pernambuco' },
    { uf: 'PI', nome: 'Piaui' },
    { uf: 'RJ', nome: 'Rio de Janeiro' },
    { uf: 'RN', nome: 'Rio Grande do Norte' },
    { uf: 'RS', nome: 'Rio Grande do Sul' },
    { uf: 'RO', nome: 'Rondonia' },
    { uf: 'RR', nome: 'Roraima' },
    { uf: 'SC', nome: 'Santa Catarina' },
    { uf: 'SP', nome: 'Sao Paulo' },
    { uf: 'SE', nome: 'Sergipe' },
    { uf: 'TO', nome: 'Tocantins' }
];

window.togglePreco = () => {
    const isPago = document.getElementById('gratuito-nao')?.checked;
    const containerPreco = document.getElementById('container-preco');
    if (containerPreco) {
        containerPreco.style.display = isPago ? 'block' : 'none';
    }
};

window.mostrarPreviewCapa = () => {
    const input = document.getElementById('imagem-capa');
    const preview = document.getElementById('preview-capa');
    if (!preview) return;
    preview.innerHTML = '';

    if (input?.files?.[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target.result;
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
    if (!preview) return;
    preview.innerHTML = '';

    if (input?.files?.length > 0) {
        Array.from(input.files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.alt = file.name;
                img.className = 'preview-thumb';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }
};

window.atualizarCidades = async () => {
    const estado = document.getElementById('evento-estado')?.value;
    const select = document.getElementById('evento-cidade');
    if (!estado || !select) return;

    select.disabled = true;
    select.innerHTML = '<option>Carregando...</option>';

    try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`);
        const cidades = await response.json();
        select.innerHTML = cidades.map((item) => `<option value="${item.nome}">${item.nome}</option>`).join('');
        select.disabled = false;
    } catch (error) {
        select.innerHTML = '<option value="">Erro ao carregar cidades</option>';
        console.error('Erro ao carregar cidades:', error);
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

function criarLinhaData(dataValue = '', horarioInicio = '', horarioFim = '') {
    const row = document.createElement('div');
    row.className = 'schedule-row';
    row.dataset.index = Date.now().toString();
    row.innerHTML = `
        <label>Data <input type="date" class="data-item" value="${dataValue}" required></label>
        <label>Inicio <input type="time" class="horario-inicio-item" value="${horarioInicio}" required></label>
        <label>Fim (opcional) <input type="time" class="horario-fim-item" value="${horarioFim}"></label>
        <button type="button" class="btn-remover-data" onclick="removerLinhaData(this)">Remover</button>
    `;
    return row;
}

window.adicionarLinhaData = function () {
    const lista = document.getElementById('datas-list');
    if (!lista) return;
    if (lista.querySelectorAll('.schedule-row').length >= 8) return;
    lista.appendChild(criarLinhaData());
    atualizarBotoesRemoverData();
};

window.removerLinhaData = function (button) {
    const row = button.closest('.schedule-row');
    const lista = document.getElementById('datas-list');
    if (!row || !lista) return;
    if (lista.querySelectorAll('.schedule-row').length <= 1) return;
    row.remove();
    atualizarBotoesRemoverData();
};

function obterDatasDoFormulario() {
    const rows = Array.from(document.querySelectorAll('.schedule-row'));
    return rows
        .map((row) => ({
            data: row.querySelector('.data-item')?.value || '',
            horario_inicio: row.querySelector('.horario-inicio-item')?.value || '',
            horario_fim: row.querySelector('.horario-fim-item')?.value || ''
        }))
        .filter((entry) => entry.data && entry.horario_inicio);
}

function validarDatasFormulario() {
    const rows = Array.from(document.querySelectorAll('.schedule-row'));
    if (rows.length === 0) {
        return { valido: false, mensagem: 'Adicione ao menos uma data com horario de inicio.' };
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
            return { valido: false, mensagem: 'Cada linha precisa informar o horario de inicio.' };
        }
        if (fimItem && inicioItem && fimItem < inicioItem) {
            return { valido: false, mensagem: 'O horario de termino nao pode ser anterior ao horario de inicio.' };
        }
        const inicioData = new Date(`${dataItem}T${inicioItem}`);
        if (Number.isNaN(inicioData.getTime())) {
            return { valido: false, mensagem: 'Data ou horario invalido em uma das linhas.' };
        }
        if (inicioData < new Date()) {
            return { valido: false, mensagem: 'Datas e horarios nao podem estar no passado.' };
        }
    }

    const dadosValidos = obterDatasDoFormulario();
    if (dadosValidos.length === 0) {
        return { valido: false, mensagem: 'Adicione ao menos uma data com horario de inicio.' };
    }

    return { valido: true, dados: dadosValidos };
}

let mapaEvento = null;
let marcadorEvento = null;
let marcadorIcon = null;

async function buscarCoordenadas(endereco) {
    if (!endereco) return null;
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json;&q=${encodeURIComponent(endereco)};&limit=1;&addressdetails=1;&countrycodes=br`;
        const res = await fetch(url, {
            headers: {
                'Accept-Language': 'pt-BR,pt;q=0.9',
                'User-Agent': 'EventHub/1.0 (contato@eventhub.app)'
            }
        });
        const dados = await res.json();
        if (Array.isArray(dados) && dados.length > 0) {
            return {
                lat: parseFloat(dados[0].lat),
                lon: parseFloat(dados[0].lon),
                display_name: dados[0].display_name
            };
        }
    } catch (error) {
        console.warn('Erro ao buscar coordenadas:', error);
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
        if (latInput) latInput.value = coords.lat;
        if (lonInput) lonInput.value = coords.lon;
        if (geoStatus) {
            geoStatus.textContent = `Coordenadas encontradas: ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`;
        }
        if (mapaEvento) {
            mapaEvento.setView([coords.lat, coords.lon], 16);
            if (marcadorEvento) {
                marcadorEvento.setLatLng([coords.lat, coords.lon]);
            } else {
                marcadorEvento = L.marker([coords.lat, coords.lon]).addTo(mapaEvento);
            }
        }
    } else if (geoStatus) {
        geoStatus.textContent = 'Nao foi possivel encontrar coordenadas automáticas. Ajuste manualmente.';
    }
}

function limparAvisosFormulario() {
    ['warning-mapa', 'warning-categorias', 'warning-capa'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });
}

function mostrarAvisoCampo(id, mensagem) {
    const el = document.getElementById(id);
    if (el) el.textContent = mensagem;
}

function inicializarMapaEvento() {
    if (!window.L || !document.getElementById('mapa-evento')) {
        return;
    }

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

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapaEvento);

    setTimeout(() => {
        if (mapaEvento) mapaEvento.invalidateSize();
    }, 300);

    mapaEvento.on('click', (event) => {
        const lat = event.latlng.lat;
        const lon = event.latlng.lng;
        const latitudeInput = document.getElementById('latitude');
        const longitudeInput = document.getElementById('longitude');
        const geoStatus = document.getElementById('geo-status');

        if (latitudeInput) latitudeInput.value = lat.toFixed(6);
        if (longitudeInput) longitudeInput.value = lon.toFixed(6);
        if (geoStatus) geoStatus.textContent = `Local definido em: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;

        mapaEvento.setView([lat, lon], 16);

        if (marcadorEvento) {
            marcadorEvento.setLatLng([lat, lon]);
            marcadorEvento.setIcon(marcadorIcon);
            marcadorEvento.setPopupContent('Local do evento');
            marcadorEvento.openPopup();
        } else {
            marcadorEvento = L.marker([lat, lon], { icon: marcadorIcon, title: 'Local do evento' }).addTo(mapaEvento);
            marcadorEvento.bindPopup('Local do evento').openPopup();
        }
    });
}

async function inicializarFormulario() {
    const estSelect = document.getElementById('evento-estado');
    if (estSelect) {
        estSelect.innerHTML = '<option value="">Estado</option>' + ESTADOS_BRASIL.map((estado) => `<option value="${estado.uf}">${estado.nome} (${estado.uf})</option>`).join('');
    }

    const enderecoInput = document.getElementById('endereco');
    if (enderecoInput) {
        enderecoInput.addEventListener('blur', () => {
            const geoStatus = document.getElementById('geo-status');
            if (geoStatus) {
                geoStatus.textContent = 'Clique no mapa para marcar o local exato.';
            }
        });
    }

    const cidadeSelect = document.getElementById('evento-cidade');
    if (cidadeSelect) {
        cidadeSelect.addEventListener('change', () => {
            const geoStatus = document.getElementById('geo-status');
            if (geoStatus) {
                geoStatus.textContent = 'Clique no mapa para marcar o local exato.';
            }
        });
    }

    const adicionarDataBtn = document.getElementById('btn-adicionar-data');
    if (adicionarDataBtn) {
        adicionarDataBtn.onclick = window.adicionarLinhaData;
    }

    atualizarBotoesRemoverData();
    inicializarSeletorCategorias();
    inicializarMapaEvento();

    const form = document.getElementById('cadastro-evento');
    if (form) {
        form.addEventListener('submit', async (e) => {
            // Prevenir múltiplos envios
            if (estahEnviandoFormulario) {
                e.preventDefault();
                return;
            }

            e.preventDefault();
            const msg = document.getElementById('mensagem-evento');
            const btn = document.getElementById('btn-submit');
            const token = localStorage.getItem('eventhub-token');

            if (!token) {
                if (msg) {
                    msg.style.color = 'yellow';
                    msg.textContent = 'Voce precisa estar logado para publicar.';
                }
                return;
            }

            limparAvisosFormulario();
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
                if (msg) {
                    msg.style.color = 'red';
                    msg.textContent = validacaoDatas.mensagem;
                }
                return;
            }

            const datas = validacaoDatas.dados;
            const primeiraData = datas[0] || {};

            if (!nome) {
                if (msg) { msg.style.color = 'red'; msg.textContent = 'Insira o nome do evento.'; }
                return;
            }
            if (!descricao) {
                if (msg) { msg.style.color = 'red'; msg.textContent = 'Insira a descricao do evento.'; }
                return;
            }
            if (!organizador) {
                if (msg) { msg.style.color = 'red'; msg.textContent = 'Insira o organizador do evento.'; }
                return;
            }
            if (!estado) {
                if (msg) { msg.style.color = 'red'; msg.textContent = 'Insira o estado do evento.'; }
                return;
            }
            if (!cidade) {
                if (msg) { msg.style.color = 'red'; msg.textContent = 'Insira a cidade do evento.'; }
                return;
            }
            if (!endereco) {
                if (msg) { msg.style.color = 'red'; msg.textContent = 'Insira o endereco ou local do evento.'; }
                return;
            }
            if (!latitude || !longitude) {
                if (msg) { msg.style.color = 'red'; msg.textContent = 'Defina a localizacao no mapa clicando no mapa.'; }
                mostrarAvisoCampo('warning-mapa', 'Localizacao obrigatoria. Clique no mapa para marcar o ponto do evento.');
                return;
            }

            const selecionadas = obterSubcategoriasSeleccionadas();
            if (selecionadas.length === 0) {
                if (msg) { msg.style.color = 'red'; msg.textContent = 'Selecione ao menos uma categoria para o evento.'; }
                mostrarAvisoCampo('warning-categorias', 'Selecione ao menos uma categoria para que o evento seja encontrado.');
                return;
            }

            const categoriaPrincipal = obterCategoriaPrincipalSelecionada();
            const capaInput = document.getElementById('imagem-capa');
            if (!capaInput || !capaInput.files || capaInput.files.length === 0) {
                if (msg) { msg.style.color = 'red'; msg.textContent = 'Selecione a imagem de capa do evento.'; }
                mostrarAvisoCampo('warning-capa', 'A imagem de capa e obrigatoria para publicar o evento.');
                return;
            }

            const formData = new FormData();
            formData.append('nome', nome);
            formData.append('descricao', descricao);
            formData.append('organizador', organizador);
            formData.append('cidade', cidade);
            formData.append('estado', estado);
            formData.append('endereco', endereco);
            formData.append('latitude', latitude);
            formData.append('longitude', longitude);
            formData.append('datas', JSON.stringify(datas));
            formData.append('data', primeiraData.data || '');
            formData.append('horario', primeiraData.horario_inicio || '');
            if (primeiraData.horario_fim) {
                formData.append('horario_fim', primeiraData.horario_fim);
            }
            const precoVal = document.getElementById('preco').value;
            formData.append('preco', precoVal || 0);
            formData.append('gratuito', document.getElementById('gratuito-sim').checked);
            selecionadas.forEach((s) => formData.append('subcategorias', s));
            formData.append('categoria', categoriaPrincipal);
            formData.append('imagemCapa', capaInput.files[0]);
            // IMPORTANTE: Enviar flag de auto aprovação para admin
            formData.append('auto_aprovado', 'true');

            const inputFotosEvento = document.getElementById('imagens-evento');
            if (inputFotosEvento?.files?.length > 0) {
                Array.from(inputFotosEvento.files).forEach((file) => formData.append('imagens', file));
            }

            try {
                estahEnviandoFormulario = true;
                btn.disabled = true;
                if (msg) {
                    msg.style.color = 'var(--cor-principal)';
                    msg.textContent = 'Publicando evento no servidor...';
                }

                const res = await fetch(`${window.API_URL}/eventos`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                });

                const dados = await res.json().catch(() => ({}));
                if (res.ok) {
                    if (msg) {
                        msg.style.color = 'lightgreen';
                        msg.textContent = dados.mensagem || 'Evento publicado instantaneamente com sucesso!';
                    }
                    setTimeout(() => {
                        window.location.href = 'admin-inicio.html';
                    }, 2000);
                } else {
                    if (res.status === 401) {
                        localStorage.removeItem('eventhub-token');
                        localStorage.removeItem('eventhub-usuario');
                        window.location.href = 'login.html';
                        return;
                    }
                    if (msg) {
                        msg.style.color = 'red';
                        msg.textContent = dados.erro || dados.detalhe || dados.message || 'Falha no servidor';
                    }
                    console.error('Erro retornado pelo backend:', dados);
                    estahEnviandoFormulario = false;
                    btn.disabled = false;
                }
            } catch (error) {
                if (msg) {
                    msg.style.color = 'red';
                    msg.textContent = 'Falha de conexao. O servidor pode estar iniciando.';
                }
                console.error('Erro de fetch:', error);
                estahEnviandoFormulario = false;
                btn.disabled = false;
            }
        });
    }
}

window.addEventListener('DOMContentLoaded', inicializarFormulario);
