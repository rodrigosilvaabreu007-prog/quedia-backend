const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
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

async function criarAdmin() {
  try {
    const ADMIN_EMAIL = 'raphaelladasilvaferreira@gmail.com';
    const ADMIN_SENHA = '16de2009@';
    const ADMIN_NOME = 'Raphaella';
    const ADMIN_ESTADO = 'Espirito Santo';
    const ADMIN_CIDADE = 'Cachoeiro de Itapemirim';

    console.log('👤 Criando usuário administrador...');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log('');

    // Verificar se admin já existe
    const snapshot = await db.collection('usuarios')
      .where('email', '==', ADMIN_EMAIL.toLowerCase())
      .limit(1)
      .get();

    if (!snapshot.empty) {
      console.log('ℹ️  Admin já existe no banco de dados');
      const adminData = snapshot.docs[0].data();
      console.log(`   ID: ${snapshot.docs[0].id}`);
      console.log(`   Email: ${adminData.email}`);
      console.log(`   Tipo: ${adminData.tipo || 'usuario'}`);
      return;
    }

    // Hasher a senha
    const senhaCriptografada = await bcrypt.hash(ADMIN_SENHA, 10);

    // Criar documento do admin
    const adminData = {
      nome: ADMIN_NOME,
      email: ADMIN_EMAIL.toLowerCase(),
      senha: senhaCriptografada,
      estado: ADMIN_ESTADO,
      cidade: ADMIN_CIDADE,
      preferencias: [],
      tipo: 'adm',
      cargo: 'adm',
      criado_em: admin.firestore.FieldValue.serverTimestamp(),
      atualizado_em: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('usuarios').add(adminData);
    
    console.log('✅ Administrador criado com sucesso!');
    console.log(`   ID: ${docRef.id}`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Tipo: adm`);
    console.log('');
    console.log('💡 Você pode fazer login com:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Senha: ${ADMIN_SENHA}`);
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error.message);
    process.exit(1);
  }
}

// Executar
criarAdmin().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
