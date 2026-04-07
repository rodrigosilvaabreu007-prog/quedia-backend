const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db-memory');

// Rota de verificação de email
router.get('/verificar-email', (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ erro: 'Email é obrigatório' });
    }
    const existe = db.usuarios.some(u => u.email === email);
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
    // Verifica se usuário já existe
    if (db.usuarios.some(u => u.email === email)) {
      console.log('❌ Email já cadastrado:', email);
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }
    const senhaCriptografada = await bcrypt.hash(senha, 10);
    const novoUsuario = {
      id: db.usuarios.length + 1,
      nome,
      email,
      senha: senhaCriptografada,
      estado: estado || 'Não informado',
      cidade: cidade || 'Não informado',
      preferencias: Array.isArray(preferencias) ? preferencias : [],
      tipo: 'comum',
      criado_em: new Date()
    };
    db.usuarios.push(novoUsuario);
    console.log('✓ Usuário cadastrado com sucesso! Total de usuários:', db.usuarios.length);
    res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!', id: novoUsuario.id });
  } catch (err) {
    console.error('❌ Erro ao cadastrar:', err);
    res.status(400).json({ erro: 'Erro ao cadastrar usuário', detalhes: err.message });
  }
});

// Rota de login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    console.log('🔐 Tentativa de login:', email);
    console.log('👥 Usuários cadastrados:', db.usuarios.map(u => u.email));
    
    const usuario = db.usuarios.find(u => u.email === email);
    if (!usuario) {
      console.log('❌ Email não encontrado:', email);
      return res.status(401).json({ erro: 'Email ou senha inválidos' });
    }
    
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      console.log('❌ Senha inválida para:', email);
      return res.status(401).json({ erro: 'Email ou senha inválidos' });
    }
    
    console.log('✓ Login bem-sucedido:', email);
    const token = jwt.sign({ id: usuario.id, tipo: usuario.tipo }, process.env.JWT_SECRET || 'secret', { expiresIn: '2h' });
    res.json({ usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }, token });
  } catch (err) {
    console.error('❌ Erro ao autenticar:', err);
    res.status(400).json({ erro: 'Erro ao autenticar', detalhes: err.message });
  }
});

// Rota para listar eventos
router.get('/eventos', (req, res) => {
  try {
    res.json(db.eventos);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao listar eventos', detalhes: err.message });
  }
});

// Rota para cadastrar evento
router.post('/eventos', (req, res) => {
  try {
    const { nome, descricao, estado, cidade, endereco, data, horario, gratuito, preco, organizador_id, categoria, subcategorias, imagem, latitude, longitude } = req.body;
    if (!nome || !descricao || !cidade || !categoria) {
      return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
    }
    const lat = Number(latitude);
    const lon = Number(longitude);
    const novoEvento = {
      id: db.eventos.length + 1,
      nome,
      descricao,
      estado: estado || 'Não informado',
      cidade,
      endereco: endereco || '',
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lon) ? lon : null,
      data,
      horario,
      gratuito: gratuito === 'on' || gratuito === true,
      preco: Number(preco) || 0,
      organizador_id: organizador_id || 1,
      categoria: categoria,
      subcategorias: Array.isArray(subcategorias) ? subcategorias : [subcategorias || ''],
      imagem: imagem || '',
      criado_em: new Date()
    };
    db.eventos.push(novoEvento);
    res.status(201).json({ mensagem: 'Evento cadastrado com sucesso!', id: novoEvento.id });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao cadastrar evento', detalhes: err.message });
  }
});

// Rota para atualizar evento
router.put('/eventos/:id', (req, res) => {
  try {
    const evento = db.eventos.find(e => e.id === parseInt(req.params.id));
    if (!evento) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }
    Object.assign(evento, req.body);
    res.json({ mensagem: 'Evento atualizado com sucesso!' });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao atualizar evento', detalhes: err.message });
  }
});

// Rota para deletar evento
router.delete('/eventos/:id', (req, res) => {
  try {
    const index = db.eventos.findIndex(e => e.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }
    db.eventos.splice(index, 1);
    res.json({ mensagem: 'Evento deletado com sucesso!' });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao deletar evento', detalhes: err.message });
  }
});

// Rota para marcar/contar interesses
router.post('/eventos/:id/interesse', (req, res) => {
  res.json({ mensagem: 'Interesse marcado' });
});

router.get('/eventos/:id/interesse', (req, res) => {
  res.json({ interessados: Math.floor(Math.random() * 50) });
});

// Rota para obter usuário por ID
router.get('/usuarios/:id', (req, res) => {
  try {
    const usuario = db.usuarios.find(u => u.id === parseInt(req.params.id));
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    // Não retornar senha
    const { senha, ...usuarioSemSenha } = usuario;
    res.json(usuarioSemSenha);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao obter usuário', detalhes: err.message });
  }
});

// Rota para atualizar usuário
router.put('/usuarios/:id', (req, res) => {
  try {
    const usuario = db.usuarios.find(u => u.id === parseInt(req.params.id));
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    
    // Atualizar apenas campos específicos
    if (req.body.nome) usuario.nome = req.body.nome;
    if (req.body.email) usuario.email = req.body.email;
    if (req.body.estado) usuario.estado = req.body.estado;
    if (req.body.cidade) usuario.cidade = req.body.cidade;
    if (req.body.preferencias) usuario.preferencias = req.body.preferencias;
    
    // Não retornar senha
    const { senha, ...usuarioSemSenha } = usuario;
    res.json(usuarioSemSenha);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao atualizar usuário', detalhes: err.message });
  }
});

// Rota para deletar usuário
router.delete('/usuarios/:id', (req, res) => {
  try {
    const index = db.usuarios.findIndex(u => u.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    
    // Remover usuário
    db.usuarios.splice(index, 1);
    
    // Remover eventos do usuário
    db.eventos = db.eventos.filter(e => e.organizador_id !== parseInt(req.params.id));
    
    res.json({ mensagem: 'Usuário deletado com sucesso!' });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao deletar usuário', detalhes: err.message });
  }
});

// Rota de contato
router.post('/contato', (req, res) => {
  res.json({ mensagem: 'Mensagem recebida! Nos entraremos em contato em breve.' });
});

module.exports = router;
