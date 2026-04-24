const functions = require('firebase-functions');
const app = require('./src/server');

exports.api = functions.https.onRequest(app);