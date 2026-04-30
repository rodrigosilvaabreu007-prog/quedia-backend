const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccount = require('./firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
  } catch (error) {
    console.log('Usando credenciais padrão do Firebase...');
    admin.initializeApp();
  }
}

const db = admin.firestore();
const ADMIN_EMAIL = 'rodrigo.silva.abreu554466@gmail.com';

async function limparUsuarios() {
  try {
    console.log('🧹 Iniciando limpeza de usuários...');
    console.log(`⚠️  Preservando admin: ${ADMIN_EMAIL}`);
    console.log('');

    // Buscar todos os usuários
    const snapshot = await db.collection('usuarios').get();
    
    if (snapshot.empty) {
      console.log('ℹ️  Nenhum usuário encontrado no banco.');
      return;
    }

    console.log(`📊 Total de usuários encontrados: ${snapshot.size}`);
    console.log('');

    let deletados = 0;
    let preservados = 0;
    const emailsDeletados = [];
    const emailsPreservados = [];

    // Processar cada usuário
    for (const doc of snapshot.docs) {
      const usuario = doc.data();
      const email = String(usuario.email || '').toLowerCase();

      if (email === ADMIN_EMAIL.toLowerCase()) {
        console.log(`✅ Preservando admin: ${email}`);
        emailsPreservados.push(email);
        preservados++;
      } else {
        // Deletar o usuário
        await db.collection('usuarios').doc(doc.id).delete();
        console.log(`🗑️  Deletado: ${email}`);
        emailsDeletados.push(email);
        deletados++;
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Usuários deletados: ${deletados}`);
    console.log(`✅ Usuários preservados: ${preservados}`);
    console.log('═══════════════════════════════════════');
    console.log('');
    
    if (emailsDeletados.length > 0) {
      console.log('📋 Emails deletados:');
      emailsDeletados.forEach(email => console.log(`   - ${email}`));
    }

    console.log('');
    console.log('📋 Emails preservados:');
    emailsPreservados.forEach(email => console.log(`   - ${email}`));

    console.log('');
    console.log('✨ Limpeza concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
    process.exit(1);
  }
}

// Executar
limparUsuarios().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
