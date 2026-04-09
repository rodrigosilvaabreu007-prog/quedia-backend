const fetch = require('node-fetch');

async function testPostEvento() {
    const formData = new FormData();
    formData.append('nome', 'Evento Teste');
    formData.append('descricao', 'Descrição teste');
    formData.append('cidade', 'São Paulo');
    formData.append('estado', 'SP');
    formData.append('local', 'Local teste');
    formData.append('latitude', '-23.5505');
    formData.append('longitude', '-46.6333');
    formData.append('data', '2026-04-15');
    formData.append('horario', '14:00');
    formData.append('horario_fim', '16:00');
    formData.append('categoria', 'Teste');
    formData.append('preco', '0');
    formData.append('gratuito', 'true');
    formData.append('organizador', 'Teste');
    formData.append('datas', JSON.stringify([{ data: '2026-04-15', horario_inicio: '14:00', horario_fim: '16:00' }]));

    try {
        const response = await fetch('http://localhost:8080/api/eventos', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Resposta:', result);
    } catch (err) {
        console.error('Erro:', err.message);
    }
}

testPostEvento();