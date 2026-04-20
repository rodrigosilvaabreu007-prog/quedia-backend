const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/eventos',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('RESPONSE:');
    console.log(data.substring(0, 300));
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`ERRO: ${e.message}`);
  process.exit(1);
});

req.end();
