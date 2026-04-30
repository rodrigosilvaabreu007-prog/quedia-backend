const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'quedia-backend'
  });
}

const db = admin.firestore();

async function verificarAdmin() {
  try {
    const usuariosRef = db.collection('usuarios');
    const snapshot = await usuariosRef.where('email', '==', 'rodrigo.silva.abreu554466@gmail.com').get();

    if (snapshot.empty) {
      console.log('❌ Admin não encontrado');
      return;
    }

    snapshot.forEach(doc => {
      console.log('✅ Admin encontrado:', doc.data());
    });
  } catch (error) {
    console.error('Erro:', error);
  }
}

verificarAdmin();