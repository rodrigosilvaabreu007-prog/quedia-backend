const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializar Firebase Admin SDK para Functions
if (!admin.apps.length) {
  admin.initializeApp();
}

const app = require('./backend/src/server');

exports.api = functions.https.onRequest(app);