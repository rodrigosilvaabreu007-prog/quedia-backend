const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/eventos/debug',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(chunk.toString());
  });
});

req.on('error', (e) => {
  console.error(`Erro: ${e.message}`);
});

req.end();