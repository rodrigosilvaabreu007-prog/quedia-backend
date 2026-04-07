#!/usr/bin/env node
/**
 * Script para testar o fluxo COMPLETO de coordenadas:
 * 1. Simula envio do frontend (FormData com lat/lon como strings)
 * 2. Verifica se o backend processa corretamente
 * 3. Consulta MongoDB para confirmar salvamento
 * 4. Simula GET da página de detalhes
 */

const mongoose = require('mongoose');
const { connectDB } = require('./backend/src/db');
const { cadastrarEvento, buscarEventoPorId, listarEventos } = require('./backend/src/models/eventos');

async function testarFluxoCompleto() {
    console.log('\n🔍 TESTE COMPLETO: FLUXO DE COORDENADAS\n');
    console.log('='.repeat(60));

    try {
        // Passo 1: Conectar ao banco
        console.log('\n[PASSO 1] Conectando ao MongoDB...');
        await connectDB();
        console.log('✅ Conectado ao MongoDB');

        // Passo 2: Simular dados do Frontend (strings, como vêm do FormData)
        console.log('\n[PASSO 2] Simulando dados do Frontend (strings do FormData)...');
        const dadosFrontend = {
            nome: 'TESTE COORDENADAS ' + new Date().toISOString(),
            descricao: 'Teste de fluxo de coordenadas',
            local: 'Cachoeiro de Itapemirim, ES',
            endereco: 'Av. Jones dos Santos Neves - Cachoeiro de Itapemirim, ES',
            latitude: '-20.847831',  // STRING (como vem do input.value do frontend)
            longitude: '-41.146524',  // STRING (como vem do input.value do frontend)
            data: new Date().toISOString().split('T')[0],
            horario: '14:00',
            categoria: 'Teste',
            preco: '0',
            gratuito: 'true'
        };
        console.log('📦 Dados que o backend vai receber:');
        console.log(`   latitude: ${dadosFrontend.latitude} (type: ${typeof dadosFrontend.latitude})`);
        console.log(`   longitude: ${dadosFrontend.longitude} (type: ${typeof dadosFrontend.longitude})`);

        // Passo 3: Processar como o backend faz
        console.log('\n[PASSO 3] Processando no backend (convertendo para Number)...');
        const latitudeNumber = Number(dadosFrontend.latitude);
        const longitudeNumber = Number(dadosFrontend.longitude);
        console.log(`✓ Após Number():`);
        console.log(`   latitude: ${latitudeNumber} (type: ${typeof latitudeNumber})`);
        console.log(`   longitude: ${longitudeNumber} (type: ${typeof longitudeNumber})`);
        console.log(`   isFinite(latitude): ${Number.isFinite(latitudeNumber)}`);
        console.log(`   isFinite(longitude): ${Number.isFinite(longitudeNumber)}`);

        // Passo 4: Salvar no banco
        console.log('\n[PASSO 4] Salvando no MongoDB...');
        const eventoSalvo = await cadastrarEvento({
            ...dadosFrontend,
            latitude: latitudeNumber,
            longitude: longitudeNumber
        });
        const eventoId = eventoSalvo._id;
        console.log(`✅ Evento salvo com ID: ${eventoId}`);
        console.log(`   Latitude no banco: ${eventoSalvo.latitude} (type: ${typeof eventoSalvo.latitude})`);
        console.log(`   Longitude no banco: ${eventoSalvo.longitude} (type: ${typeof eventoSalvo.longitude})`);

        // Passo 5: Consultar pelo ID (como faz o frontend)
        console.log('\n[PASSO 5] Consultando evento pelo ID (como faz evento-detalhes.js)...');
        const eventoRecuperado = await buscarEventoPorId(eventoId);
        if (!eventoRecuperado) {
            console.error('❌ ERRO: Evento não encontrado no banco!');
            return;
        }
        console.log('✅ Evento recuperado:');
        console.log(`   Latitude: ${eventoRecuperado.latitude} (type: ${typeof eventoRecuperado.latitude})`);
        console.log(`   Longitude: ${eventoRecuperado.longitude} (type: ${typeof eventoRecuperado.longitude})`);
        console.log(`   isFinite(latitude): ${Number.isFinite(Number(eventoRecuperado.latitude))}`);
        console.log(`   isFinite(longitude): ${Number.isFinite(Number(eventoRecuperado.longitude))}`);

        // Passo 6: Simular validação do frontend (evento-detalhes.js)
        console.log('\n[PASSO 6] Simulando validação do frontend (como faz evento-detalhes.js)...');
        let lat = Number(eventoRecuperado.latitude);
        let lon = Number(eventoRecuperado.longitude);
        const hasFiniteCoords = Number.isFinite(lat) && Number.isFinite(lon);
        console.log(`   lat = ${lat}`);
        console.log(`   lon = ${lon}`);
        console.log(`   hasFiniteCoords: ${hasFiniteCoords}`);
        
        if (hasFiniteCoords) {
            console.log('✅ SUCESSO: Marcador DEVERIA aparecer no mapa!');
            console.log(`   L.marker([${lat}, ${lon}]).addTo(mapa)`);
        } else {
            console.error('❌ ERRO: Marcador NÃO vai aparecer - coordenadas inválidas');
        }

        // Passo 7: Listar últimos 3 eventos para debug
        console.log('\n[PASSO 7] Listando últimos 3 eventos no banco...');
        const ultimos = await listarEventos({});
        if (ultimos && ultimos.length > 0) {
            console.log(`Total de eventos: ${ultimos.length}`);
            console.log('\nÚltimos 3:');
            ultimos.slice(-3).forEach((evt, idx) => {
                console.log(`${idx + 1}. ${evt.nome}`);
                console.log(`   ID: ${evt._id}`);
                console.log(`   Lat: ${evt.latitude} | Lon: ${evt.longitude}`);
            });
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ TESTE CONCLUÍDO COM SUCESSO\n');

    } catch (err) {
        console.error('\n❌ ERRO DURANTE TESTE:', err.message);
        console.error(err.stack);
    } finally {
        // Desconectar
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log('Desconectado do MongoDB');
        }
        process.exit(0);
    }
}

// Executar
testarFluxoCompleto();
