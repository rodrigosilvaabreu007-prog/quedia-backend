const admin = require('firebase-admin');

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  // Em produção, usar credenciais do ambiente Firebase Functions
  if (process.env.FIREBASE_CONFIG || process.env.GCLOUD_PROJECT) {
    admin.initializeApp();
  } else {
    // Para desenvolvimento local, usar service account key se disponível
    try {
      const serviceAccount = require('../firebase-service-account.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    } catch (error) {
      console.warn('⚠️ Firebase service account key não encontrada. Usando credenciais padrão.');
      admin.initializeApp();
    }
  }
}

const db = admin.firestore();

// ============ USUÁRIOS ============

async function verificarEmailExistente(email) {
  try {
    const snapshot = await db.collection('usuarios').where('email', '==', email).limit(1).get();
    return !snapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    throw error;
  }
}

async function registrarUsuario(dados) {
  try {
    const { nome, email, senha, estado, cidade, preferencias } = dados;

    // Verificar se email já existe
    const emailExiste = await verificarEmailExistente(email);
    if (emailExiste) {
      throw new Error('Email já cadastrado');
    }

    const usuario = {
      nome,
      email,
      senha, // Já deve estar hasheada
      estado: estado || '',
      cidade: cidade || '',
      preferencias: preferencias || [],
      tipo: 'usuario', // padrão
      criado_em: admin.firestore.FieldValue.serverTimestamp(),
      atualizado_em: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('usuarios').add(usuario);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    throw error;
  }
}

async function autenticarUsuario(email, senha) {
  try {
    const snapshot = await db.collection('usuarios').where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    const usuarioDoc = snapshot.docs[0];
    const usuario = { id: usuarioDoc.id, ...usuarioDoc.data() };

    // Verificar senha (assumindo que está hasheada)
    const bcrypt = require('bcryptjs');
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return null;
    }

    // Remover senha do retorno
    delete usuario.senha;
    return usuario;
  } catch (error) {
    console.error('Erro ao autenticar usuário:', error);
    throw error;
  }
}

async function obterUsuario(id) {
  try {
    const doc = await db.collection('usuarios').doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    throw error;
  }
}

async function atualizarUsuario(id, dados) {
  try {
    await db.collection('usuarios').doc(id).update({
      ...dados,
      atualizado_em: admin.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
}

// ============ EVENTOS ============

async function listarEventos() {
  try {
    const snapshot = await db.collection('eventos').orderBy('criado_em', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    throw error;
  }
}

async function obterEventosPorOrganizador(organizadorId) {
  try {
    const snapshot = await db.collection('eventos')
      .where('organizador_id', '==', organizadorId)
      .orderBy('criado_em', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erro ao obter eventos por organizador:', error);
    throw error;
  }
}

async function cadastrarEvento(dados) {
  try {
    const evento = {
      ...dados,
      criado_em: admin.firestore.FieldValue.serverTimestamp(),
      atualizado_em: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('eventos').add(evento);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao cadastrar evento:', error);
    throw error;
  }
}

async function obterEvento(id) {
  try {
    const doc = await db.collection('eventos').doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Erro ao obter evento:', error);
    throw error;
  }
}

async function atualizarEvento(id, dados) {
  try {
    await db.collection('eventos').doc(id).update({
      ...dados,
      atualizado_em: admin.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    throw error;
  }
}

async function deletarEvento(id) {
  try {
    await db.collection('eventos').doc(id).delete();
    return true;
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    throw error;
  }
}

// ============ INTERESSES ============

async function listarInteresses(eventoId) {
  try {
    const snapshot = await db.collection('interesses')
      .where('evento_id', '==', eventoId)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erro ao listar interesses:', error);
    throw error;
  }
}

async function adicionarInteresse(eventoId, usuarioId) {
  try {
    // Verificar se já existe
    const existing = await db.collection('interesses')
      .where('evento_id', '==', eventoId)
      .where('usuario_id', '==', usuarioId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return existing.docs[0].id;
    }

    const interesse = {
      evento_id: eventoId,
      usuario_id: usuarioId,
      criado_em: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('interesses').add(interesse);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar interesse:', error);
    throw error;
  }
}

async function removerInteresse(eventoId, usuarioId) {
  try {
    const snapshot = await db.collection('interesses')
      .where('evento_id', '==', eventoId)
      .where('usuario_id', '==', usuarioId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      await db.collection('interesses').doc(snapshot.docs[0].id).delete();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao remover interesse:', error);
    throw error;
  }
}

// ============ MENSAGENS ============

async function listarMensagens() {
  try {
    const snapshot = await db.collection('mensagens').orderBy('criado_em', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erro ao listar mensagens:', error);
    throw error;
  }
}

async function enviarMensagem(dados) {
  try {
    const mensagem = {
      ...dados,
      criado_em: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('mensagens').add(mensagem);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
}

async function marcarMensagemComoRespondida(id) {
  try {
    await db.collection('mensagens').doc(id).update({
      respondida: true,
      respondida_em: admin.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Erro ao marcar mensagem como respondida:', error);
    throw error;
  }
}

module.exports = {
  verificarEmailExistente,
  registrarUsuario,
  autenticarUsuario,
  obterUsuario,
  atualizarUsuario,
  listarEventos,
  obterEventosPorOrganizador,
  cadastrarEvento,
  obterEvento,
  atualizarEvento,
  deletarEvento,
  listarInteresses,
  adicionarInteresse,
  removerInteresse,
  listarMensagens,
  enviarMensagem,
  marcarMensagemComoRespondida
};