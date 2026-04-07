/**
 * Script de teste para simular o fluxo completo de coordenadas
 * Testa: Form -> FormData -> Response -> JSON -> Frontend render
 */

// Simulando FormData
class MockFormData {
    constructor() {
        this.data = {};
    }
    append(key, value) {
        if (!this.data[key]) {
            this.data[key] = [];
        }
        this.data[key].push(value);
    }
    toJSON() {
        const result = {};
        for (const [key, values] of Object.entries(this.data)) {
            result[key] = values.length === 1 ? values[0] : values;
        }
        return result;
    }
}

// Teste 1: FormData com latitude/longitude
console.log('=== TESTE 1: FormData ===');
const formData = new MockFormData();
const latitude = "-23.550520";
const longitude = "-46.633309";

formData.append('nome', 'Evento Teste');
formData.append('latitude', latitude);
formData.append('longitude', longitude);

const formDataJSON = formData.toJSON();
console.log('FormData enviado:', formDataJSON);
console.log('Tipo latitude:', typeof formDataJSON.latitude);
console.log('Tipo longitude:', typeof formDataJSON.longitude);

// Teste 2: Backend processamento
console.log('\n=== TESTE 2: Backend processamento ===');
const reqBody = formDataJSON;
const latNumber = Number(reqBody.latitude);
const lonNumber = Number(reqBody.longitude);
console.log('Convertido para Number:', { latNumber, lonNumber });
console.log('isFinite latitude:', Number.isFinite(latNumber));
console.log('isFinite longitude:', Number.isFinite(lonNumber));

const dadosTratados = {
    nome: reqBody.nome,
    latitude: Number.isFinite(latNumber) ? latNumber : null,
    longitude: Number.isFinite(lonNumber) ? lonNumber : null
};
console.log('Dados a salvar:', dadosTratados);

// Teste 3: Simulando resposta do backend
console.log('\n=== TESTE 3: Resposta do backend ===');
const eventoSalvo = {
    _id: '650a1234567890abcdef1234',
    nome: 'Evento Teste',
    latitude: -23.50520,
    longitude: -46.633309,
    local: 'São Paulo, SP'
};
console.log('Evento salvo no BD:', eventoSalvo);

// Teste 4: Frontend recebendo
console.log('\n=== TESTE 4: Frontend recebendo ===');
const evento = eventoSalvo;
console.log('evento.latitude:', evento.latitude, 'type:', typeof evento.latitude);
console.log('evento.longitude:', evento.longitude, 'type:', typeof evento.longitude);

// Teste 5: configurarMapa parsing
console.log('\n=== TESTE 5: configurarMapa parsing ===');
let lat = Number(evento.latitude);
let lon = Number(evento.longitude);
const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);
console.log('lat:', lat, 'lon:', lon, 'hasCoords:', hasCoords);

if (Number.isFinite(lat) && Number.isFinite(lon)) {
    console.log('✅ SUCESSO: marcador será renderizado em [' + lat + ', ' + lon + ']');
} else {
    console.log('❌ ERRO: coordenadas inválidas!');
}

// Teste 6: Problema potencial - undefined/null
console.log('\n=== TESTE 6: Casos problemáticos ===');
const testCases = [
    { name: 'undefined', value: undefined },
    { name: 'null', value: null },
    { name: 'string vazia', value: '' },
    { name: 'NaN', value: NaN },
    { name: '"123.45"', value: '123.45' },
    { name: 'objeto vazio', value: {} },
    { name: 'array', value: [] }
];

testCases.forEach(test => {
    const num = Number(test.value);
    const isFinite = Number.isFinite(num);
    console.log(`${test.name}: Number() = ${num}, isFinite = ${isFinite}`);
});
