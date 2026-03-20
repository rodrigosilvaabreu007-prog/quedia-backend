const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dbSql = require('./db-sql');
const nodemailer = require('nodemailer'); // Movido para o topo para evitar erros de runtime

// Rota de verificação de email
router.get('/verificar-email', (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ erro: 'Email é obrigatório' });
    }
    const existe = dbSql.verificarEmailExistente(email);
    res.json({ existe });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao verificar email', detalhes: err.message });
  }
});

// Rota de cadastro
router.post('/cadastro', async (req, res) => {
  try {
    console.log('📝 Cadastro recebido:', { email: req.body.email, nome: req.body.nome });
    const { nome, email, senha, estado, cidade, preferencias } = req.body;
    
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
    }

    const id = await dbSql.registrarUsuario({
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

// Rota de login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    console.log('🔐 Tentativa de login:', email);

    const usuario = await dbSql.autenticarUsuario(email, senha);
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

// Rota para listar eventos
router.get('/eventos', (req, res) => {
  try {
    const organizador_id = req.query.organizador_id;
    let eventos;
    
    if (organizador_id) {
      eventos = dbSql.obterEventosPorOrganizador(parseInt(organizador_id));
    } else {
      eventos = dbSql.listarEventos();
    }
    
    res.json(eventos);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao listar eventos', detalhes: err.message });
  }
});

// Rota para cadastrar evento
router.post('/eventos', async (req, res) => {
  try {
    const { nome, descricao, estado, cidade, endereco, data, horario, gratuito, preco, organizador_id, categoria, subcategorias, imagem } = req.body;
    if (!nome || !descricao || !cidade || !categoria) {
      return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
    }

    const id = dbSql.cadastrarEvento({
      nome,
      descricao,
      estado: estado || 'Não informado',
      cidade,
      endereco: endereco || '',
      data,
      horario,
      gratuito: gratuito === 'on' || gratuito === true,
      preco: Number(preco) || 0,
      organizador_id: organizador_id || 1,
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

// Rota para atualizar evento
router.put('/eventos/:id', (req, res) => {
  try {
    const evento = dbSql.obterEvento(parseInt(req.params.id));
    if (!evento) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }

    dbSql.atualizarEvento(parseInt(req.params.id), req.body);
    res.json({ mensagem: 'Evento atualizado com sucesso!' });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao atualizar evento', detalhes: err.message });
  }
});

// Rota para deletar evento
router.delete('/eventos/:id', (req, res) => {
  try {
    const evento = dbSql.obterEvento(parseInt(req.params.id));
    if (!evento) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }

    dbSql.deletarEvento(parseInt(req.params.id));
    res.json({ mensagem: 'Evento deletado com sucesso!' });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao deletar evento', detalhes: err.message });
  }
});

// Rota para marcar interesse
router.post('/eventos/:id/interesse', (req, res) => {
  try {
    const evento_id = parseInt(req.params.id);
    const usuario_id = req.body.usuario_id || 1;

    dbSql.marcarInteresse(usuario_id, evento_id);
    const total = dbSql.contarInteressados(evento_id);

    res.json({ mensagem: 'Interesse marcado', total });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao marcar interesse', detalhes: err.message });
  }
});

// Rota para contar interesses
router.get('/eventos/:id/interesse', (req, res) => {
  try {
    const evento_id = parseInt(req.params.id);
    const total = dbSql.contarInteressados(evento_id);
    res.json({ total });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao contar interesses', detalhes: err.message });
  }
});

// Rota para obter usuário por ID
router.get('/usuarios/:id', (req, res) => {
  try {
    res.status(404).json({ erro: 'Usuário não encontrado' });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao obter usuário', detalhes: err.message });
  }
});

// Rota para atualizar usuário
router.put('/usuarios/:id', (req, res) => {
  try {
    const usuario_id = parseInt(req.params.id);
    const { nome, email, estado, cidade, preferencias } = req.body;
    
    const usuarioAtualizado = dbSql.atualizarUsuario(usuario_id, {
      nome,
      email,
      estado,
      cidade,
      preferencias
    });
    
    if (!usuarioAtualizado) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    
    res.json(usuarioAtualizado);
  } catch (err) {
    if (err.message.includes('Email já cadastrado')) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }
    res.status(400).json({ erro: 'Erro ao atualizar usuário', detalhes: err.message });
  }
});

// Rota para deletar usuário
router.delete('/usuarios/:id', (req, res) => {
  try {
    const usuario_id = parseInt(req.params.id);
    const deletado = dbSql.deletarUsuario(usuario_id);
    
    if (!deletado) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    
    res.json({ mensagem: 'Usuário deletado com sucesso!' });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao deletar usuário', detalhes: err.message });
  }
});

// Rota de contato (CORRIGIDA)
router.post('/contato', async (req, res) => {
  const { nome, email, mensagem } = req.body;

  // Verificação de segurança para não quebrar o Cloud Run se as envs não existirem
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Credenciais de e-mail não configuradas no servidor.');
    return res.status(503).json({ erro: 'Serviço de e-mail temporariamente indisponível.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: email,
      to: process.env.EMAIL_USER,
      subject: `Contato EventHub de ${nome}`,
      text: `Mensagem enviada por: ${nome} (${email})\n\nConteúdo:\n${mensagem}`
    });

    res.json({ mensagem: 'Mensagem enviada com sucesso!' });
  } catch (err) {
    console.error('❌ Erro no envio de e-mail:', err.message);
    res.status(400).json({ erro: 'Erro ao enviar mensagem', detalhes: err.message });
  }
});

module.exports = router;