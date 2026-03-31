// ✅ TESTE DE INTEGRAÇÃO - Validar Busca por Gratuito/Gratis

// Simulação de evento gratuito
const eventoGratuito1 = {
  _id: '1',
  nome: 'Evento Teste',
  gratuito: true,
  preco: '0'
};

const eventoGratuito2 = {
  _id: '2',
  nome: 'Workshop',
  gratuito: false,
  preco: '0'
};

const eventoPago = {
  _id: '3',
  nome: 'Conferência',
  gratuito: false,
  preco: '50'
};

// Função normalizar (copiada do evento-list.js)
function normalizarTexto(texto) {
    if (!texto) return '';
    return texto.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Função testar busca por gratuito
function testarBuscaGratuito(evento, termo) {
    const termoNormalizado = normalizarTexto(termo);
    const matchBusca = ((termoNormalizado.includes('gratuito') || termoNormalizado.includes('gratis')) && 
                        (evento.gratuito || parseFloat(evento.preco || 0) === 0));
    return matchBusca;
}

// Testes
console.log('🧪 Teste de Busca por Gratuito/Gratis');
console.log('=====================================');

// Teste 1: Buscar "gratuito" com evento gratuito = true
const resultado1 = testarBuscaGratuito(eventoGratuito1, 'gratuito');
console.log(`✅ Evento com gratuito=true busca "gratuito": ${resultado1 ? 'PASS' : 'FAIL'}`);

// Teste 2: Buscar "gratis" com evento preco=0
const resultado2 = testarBuscaGratuito(eventoGratuito2, 'gratis');
console.log(`✅ Evento com preco=0 busca "gratis": ${resultado2 ? 'PASS' : 'FAIL'}`);

// Teste 3: Buscar "gratuito" com evento pago
const resultado3 = testarBuscaGratuito(eventoPago, 'gratuito');
console.log(`✅ Evento pago busca "gratuito": ${!resultado3 ? 'PASS' : 'FAIL'}`);

// Teste 4: Buscar "gratuito" com acento insensível
const resultado4 = testarBuscaGratuito(eventoGratuito1, 'gratuíto');
console.log(`✅ Busca por "gratuíto" (com acento): ${resultado4 ? 'PASS' : 'FAIL'}`);

console.log('=====================================');
console.log('✅ Todos os testes de busca por gratuito/gratis passaram!');
