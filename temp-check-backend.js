const https = require('https');
const url = 'https://quedia-backend-649702844549.us-central1.run.app/api/eventos';
https.get(url, res => {
  console.log('status', res.statusCode, res.statusMessage);
  console.log('content-type', res.headers['content-type']);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('body:', body.slice(0, 1000));
  });
}).on('error', err => {
  console.error('erro', err);
});
