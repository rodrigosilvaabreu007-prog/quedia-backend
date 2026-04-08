const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dbFirestore = require('./db-firestore');

// ============ AUTENTICAÇÃO ============

// Middleware para verificar token JWT
function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ erro: 'Token ausente' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.usuario_id = decoded.id;
    req.tipo = decoded.tipo;
    next();
  } catch (err) {
    res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

// ============ USUÁRIOS ============

// Verificar se email existe
router.get('/verificar-email', (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ erro: 'Email é obrigatório' });
    }
    dbFirestore.verificarEmailExistente(email).then(existe => {
      res.json({ existe });
    });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao verificar email', detalhes: err.message });
  }
});

// Cadastro
router.post('/cadastro', async (req, res) => {
  try {
    console.log('📝 Cadastro recebido:', { email: req.body.email, nome: req.body.nome });
    const { nome, email, senha, estado, cidade, preferencias } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
    }

    const id = await dbFirestore.registrarUsuario({
      nome,
      email,
      senha,
      estado: estado || 'Não informado',
      cidade: cidade || 'Não informado',
      preferencias
    });

    console.log('✓ Usuário cadastrado com sucesso! ID:', id);
    res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!', id });
  } catch (err) {
    console.error('❌ Erro ao cadastrar:', err.message);
    if (err.message.includes('Email já cadastrado')) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }
    res.status(400).json({ erro: 'Erro ao cadastrar usuário', detalhes: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    console.log('🔐 Tentativa de login:', email);

    const usuario = await dbFirestore.autenticarUsuario(email, senha);
    if (!usuario) {
      return res.status(401).json({ erro: 'Email ou senha inválidos' });
    }

    const token = jwt.sign(
      { id: usuario.id, tipo: usuario.tipo },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '2h' }
    );
    
    res.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cidade: usuario.cidade,
        estado: usuario.estado,
        preferencias: usuario.preferencias || []
      },
      token
    });
  } catch (err) {
    console.error('❌ Erro ao autenticar:', err.message);
    res.status(400).json({ erro: 'Erro ao autenticar', detalhes: err.message });
  }
});

// ============ EVENTOS ============

// Listar eventos
router.get('/eventos', (req, res) => {
  try {
    const organizador_id = req.query.organizador_id;
    
    if (organizador_id) {
      dbFirestore.obterEventosPorOrganizador(organizador_id).then(eventos => {
        res.json(eventos);
      });
    } else {
      dbFirestore.listarEventos().then(eventos => {
        res.json(eventos);
      });
    }
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao listar eventos', detalhes: err.message });
  }
});

// Criar evento
router.post('/eventos', verificarToken, async (req, res) => {
  try {
    const { nome, descricao, estado, cidade, endereco, data, horario, gratuito, preco, categoria, subcategorias, imagem, organizador } = req.body;
    if (!nome || !descricao || !cidade || !categoria) {
      return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
    }

    const id = await dbFirestore.cadastrarEvento({
      nome,
      descricao,
      estado: estado || 'Não informado',
      cidade,
      endereco: endereco || '',
      data,
      horario,
      gratuito: gratuito === 'on' || gratuito === true,
      preco: Number(preco) || 0,
      organizador: organizador || 'Não informado',
      organizador_id: req.usuario_id,
      categoria,
      subcategorias,
      imagem
    });

    res.status(201).json({ mensagem: 'Evento cadastrado com sucesso!', id });
  } catch (err) {
    console.error('❌ Erro ao cadastrar evento:', err.message);
    res.status(400).json({ erro: 'Erro ao cadastrar evento', detalhes: err.message });
  }
});

// Obter evento específico
router.get('/eventos/:id', async (req, res) => {
  try {
    const evento = await dbFirestore.obterEvento(req.params.id);
    if (!evento) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }
    res.json(evento);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao obter evento', detalhes: err.message });
  }
});

// Atualizar evento
router.put('/eventos/:id', verificarToken, async (req, res) => {
  try {
    const evento = await dbFirestore.obterEvento(req.params.id);
    if (!evento) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }

    // Verificar se é o organizador
    if (evento.organizador_id !== req.usuario_id) {
      return res.status(403).json({ erro: 'Não autorizado a editar este evento' });
    }

    await dbFirestore.atualizarEvento(req.params.id, req.body);
    res.json({ mensagem: 'Evento atualizado com sucesso!' });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao atualizar evento', detalhes: err.message });
  }
});

// Deletar evento
router.delete('/eventos/:id', verificarToken, async (req, res) => {
  try {
    const evento = await dbFirestore.obterEvento(req.params.id);
    if (!evento) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }

    // Verificar se é o organizador
    if (evento.organizador_id !== req.usuario_id) {
      return res.status(403).json({ erro: 'Não autorizado a deletar este evento' });
    }

    await dbFirestore.deletarEvento(req.params.id);
    res.json({ mensagem: 'Evento deletado com sucesso!' });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao deletar evento', detalhes: err.message });
  }
});

// ============ INTERESSES ============

// Obter número de interessados
router.get('/eventos/:id/interesse', async (req, res) => {
  try {
    const total = await dbFirestore.contarInteresses(req.params.id);
    res.json({ evento_id: req.params.id, total });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao contar interesses', detalhes: err.message });
  }
});

// Marcar interesse
router.post('/eventos/:id/interesse', verificarToken, async (req, res) => {
  try {
    const { usuario_id } = req.body;
    const eventoId = req.params.id;
    
    // Usar ID do token se não fornecido no body
    const uid = usuario_id || req.usuario_id;

    await dbFirestore.adicionarInteresse(uid, eventoId);
    const total = await dbFirestore.contarInteresses(eventoId);
    
    res.json({ evento_id: eventoId, usuario_id: uid, total });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao marcar interesse', detalhes: err.message });
  }
});

// Remover interesse
router.delete('/eventos/:id/interesse', verificarToken, async (req, res) => {
  try {
    const eventoId = req.params.id;
    
    await dbFirestore.removerInteresse(req.usuario_id, eventoId);
    const total = await dbFirestore.contarInteresses(eventoId);
    
    res.json({ evento_id: eventoId, usuario_id: req.usuario_id, total });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao remover interesse', detalhes: err.message });
  }
});

module.exports = router;
