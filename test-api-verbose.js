const http = require('http');

console.log('Testando conexão com localhost:8080...');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/eventos',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log('✅ Conexão bem-sucedida!');
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response (primeiros 500 caracteres):');
    console.log(data.substring(0, 500));
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('❌ ERRO na conexão:');
  console.error(`   Tipo: ${e.code}`);
  console.error(`   Mensagem: ${e.message}`);
  if (e.code === 'ECONNREFUSED') {
    console.error('   → Servidor não está escutando na porta 8080');
  }
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Timeout na conexão');
  req.destroy();
  process.exit(1);
});

req.end();
