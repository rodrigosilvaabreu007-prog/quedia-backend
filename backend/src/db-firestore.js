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

// ============ PROTEÇÕES DE SEGURANÇA ============

/**
 * Valida operações perigosas que podem causar perda de dados
 */
async function validarOperacaoPerigosa(operacao, dados = {}) {
  console.log(`🛡️ [SEGURANÇA] Validando operação: ${operacao}`, dados);

  // Verificar se é uma operação de limpeza ou remoção em massa
  if (operacao === 'LIMPAR_COLECAO' || operacao === 'DELETAR_TUDO') {
    console.error(`🚨 [SEGURANÇA] Operação perigosa bloqueada: ${operacao}`);
    throw new Error(`Operação perigosa bloqueada: ${operacao}. Eventos não podem ser deletados em massa.`);
  }

  // Verificar se há filtros muito amplos
  if (operacao === 'DELETAR_MULTIPLOS' && dados.filtro === 'TODOS') {
    console.error(`🚨 [SEGURANÇA] Operação perigosa bloqueada: deletar todos os eventos`);
    throw new Error('Operação perigosa bloqueada: não é permitido deletar todos os eventos.');
  }

  console.log(`✅ [SEGURANÇA] Operação validada: ${operacao}`);
  return true;
}

/**
 * Log detalhado de operações nos eventos
 */
function logOperacaoEvento(operacao, eventoId, dados = {}) {
  const timestamp = new Date().toISOString();
  console.log(`📝 [EVENTO ${operacao}] ${timestamp} - ID: ${eventoId || 'N/A'}`, {
    operacao,
    eventoId,
    dados: JSON.stringify(dados).substring(0, 200) + '...',
    timestamp
  });
}

// ============ USUÁRIOS ============

async function verificarEmailExistente(email) {
  try {
    // Normalizar email para lowercase
    const emailNormalizado = String(email || '').trim().toLowerCase();
    const snapshot = await db.collection('usuarios').where('email', '==', emailNormalizado).limit(1).get();
    return !snapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    throw error;
  }
}

async function registrarUsuario(dados) {
  try {
    const { nome, email, senha, estado, cidade, preferencias } = dados;

    // Normalizar email para lowercase
    const emailNormalizado = String(email || '').trim().toLowerCase();
    console.log('📝 Registrando usuário com email normalizado:', emailNormalizado);

    // Verificar se email já existe
    const emailExiste = await verificarEmailExistente(emailNormalizado);
    if (emailExiste) {
      throw new Error('Email já cadastrado');
    }

    const usuario = {
      nome,
      email: emailNormalizado,
      senha, // Já deve estar hasheada
      estado: estado || '',
      cidade: cidade || '',
      preferencias: preferencias || [],
      tipo: 'usuario', // padrão
      criado_em: admin.firestore.FieldValue.serverTimestamp(),
      atualizado_em: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('usuarios').add(usuario);
    console.log('✅ Usuário registrado com sucesso:', emailNormalizado);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    throw error;
  }
}

async function autenticarUsuario(email, senha) {
  try {
    // Normalizar email para lowercase
    const emailNormalizado = String(email || '').trim().toLowerCase();
    console.log('🔐 Autenticando com email normalizado:', emailNormalizado);
    
    const snapshot = await db.collection('usuarios').where('email', '==', emailNormalizado).limit(1).get();

    if (snapshot.empty) {
      console.log('❌ Email não encontrado:', emailNormalizado);
      return null;
    }

    const usuarioDoc = snapshot.docs[0];
    const usuario = { id: usuarioDoc.id, ...usuarioDoc.data() };

    // Verificar senha (deve estar hasheada no banco)
    const bcrypt = require('bcryptjs');
    console.log('🔍 Comparando senhas...');
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      console.log('❌ Senha incorreta para:', emailNormalizado);
      return null;
    }

    console.log('✅ Autenticação bem-sucedida para:', emailNormalizado);
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
    const snapshot = await db.collection('eventos')
      .where('status', '==', 'aprovado')
      .orderBy('criado_em', 'desc')
      .get();
    const eventos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`📊 Eventos aprovados listados: ${eventos.length} encontrados`);

    // Verificar integridade básica
    const eventosInvalidos = eventos.filter(e => !e.nome || !e.categoria);
    if (eventosInvalidos.length > 0) {
      console.warn(`⚠️ Eventos com dados inválidos encontrados: ${eventosInvalidos.length}`);
    }

    return eventos;
  } catch (error) {
    console.error('❌ Erro ao listar eventos:', error);
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
    // Validar operação
    await validarOperacaoPerigosa('CADASTRAR_EVENTO', dados);

    const evento = {
      ...dados,
      status: dados.status || 'pendente',
      motivo_rejeicao: dados.motivo_rejeicao || '',
      criado_em: admin.firestore.FieldValue.serverTimestamp(),
      atualizado_em: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('eventos').add(evento);

    // Log da operação
    logOperacaoEvento('CRIADO', docRef.id, { nome: dados.nome, organizador: dados.organizador });

    console.log(`✅ Evento cadastrado com sucesso: ${docRef.id} - ${dados.nome}`);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erro ao cadastrar evento:', error);
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

async function listarEventosPendentes() {
  try {
    const snapshot = await db.collection('eventos')
      .where('status', '==', 'pendente')
      .orderBy('criado_em', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erro ao listar eventos pendentes:', error);
    throw error;
  }
}

async function atualizarStatusEvento(id, status, motivo_rejeicao = '') {
  try {
    const atualizacao = {
      status,
      motivo_rejeicao: motivo_rejeicao || '' ,
      atualizado_em: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('eventos').doc(id).update(atualizacao);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status do evento:', error);
    throw error;
  }
}

async function deletarEvento(id) {
  try {
    // Validar operação perigosa
    await validarOperacaoPerigosa('DELETAR_EVENTO', { id });

    // Verificar se o evento existe antes de deletar
    const evento = await obterEvento(id);
    if (!evento) {
      throw new Error(`Evento não encontrado: ${id}`);
    }

    // Log da operação ANTES de deletar
    logOperacaoEvento('DELETAR_INICIADO', id, {
      nome: evento.nome,
      organizador: evento.organizador,
      status: evento.status
    });

    // Permitir que o organizador ou administrador apague o evento, mesmo que esteja ativo.
    await db.collection('eventos').doc(id).delete();

    // Log da operação concluída
    logOperacaoEvento('DELETADO', id, { nome: evento.nome });

    console.log(`🗑️ Evento deletado com segurança: ${id} - ${evento.nome}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar evento:', error);
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

// ============ VERIFICAÇÃO DE INTEGRIDADE ============

/**
 * Verifica a integridade dos dados no Firestore
 * Deve ser chamada após operações importantes
 */
async function verificarIntegridadeDados() {
  try {
    console.log('🔍 Iniciando verificação de integridade dos dados...');

    const resultados = {
      eventos: { total: 0, validos: 0, invalidos: 0 },
      usuarios: { total: 0, validos: 0, invalidos: 0 },
      timestamp: new Date().toISOString()
    };

    // Verificar eventos
    const eventosSnapshot = await db.collection('eventos').get();
    resultados.eventos.total = eventosSnapshot.size;

    for (const doc of eventosSnapshot.docs) {
      const data = doc.data();
      const isValido = data.nome && data.categoria && data.organizador_id;

      if (isValido) {
        resultados.eventos.validos++;
      } else {
        resultados.eventos.invalidos++;
        console.warn(`⚠️ Evento inválido encontrado: ${doc.id}`, {
          nome: data.nome,
          categoria: data.categoria,
          organizador_id: data.organizador_id
        });
      }
    }

    // Verificar usuários
    const usuariosSnapshot = await db.collection('usuarios').get();
    resultados.usuarios.total = usuariosSnapshot.size;

    for (const doc of usuariosSnapshot.docs) {
      const data = doc.data();
      const isValido = data.nome && data.email;

      if (isValido) {
        resultados.usuarios.validos++;
      } else {
        resultados.usuarios.invalidos++;
        console.warn(`⚠️ Usuário inválido encontrado: ${doc.id}`, {
          nome: data.nome,
          email: data.email
        });
      }
    }

    console.log('✅ Verificação de integridade concluída:', resultados);
    return resultados;

  } catch (error) {
    console.error('❌ Erro na verificação de integridade:', error);
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
  listarEventosPendentes,
  atualizarStatusEvento,
  deletarEvento,
  listarInteresses,
  adicionarInteresse,
  removerInteresse,
  listarMensagens,
  enviarMensagem,
  marcarMensagemComoRespondida,
  verificarIntegridadeDados
};