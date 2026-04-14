const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db-memory');

const upload = multer({ storage: multer.memoryStorage() });

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
    res.json({ usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, estado: usuario.estado, cidade: usuario.cidade, preferencias: usuario.preferencias || [] }, token });
  } catch (err) {
    console.error('❌ Erro ao autenticar:', err);
    res.status(400).json({ erro: 'Erro ao autenticar', detalhes: err.message });
  }
});

// Rota para listar eventos
router.get('/eventos', (req, res) => {
  try {
    const organizadorId = req.query.organizador_id;
    let eventosFiltrados = db.eventos;

    if (organizadorId) {
      eventosFiltrados = eventosFiltrados.filter(evento =>
        String(evento.organizador_id) === String(organizadorId)
      );
    }

    const eventosComInteresses = eventosFiltrados.map(evento => ({
      ...evento,
      interesses: db.interesses
        .filter(i => i.evento_id === evento.id || i.evento_id === String(evento.id))
        .map(i => i.usuario_id)
    }));
    res.json(eventosComInteresses);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao listar eventos', detalhes: err.message });
  }
});

// Rota para buscar evento por ID
router.get('/eventos/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id) || req.params.id;
    const evento = db.eventos.find(e => e.id === id || e._id === id);
    if (!evento) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }
    // Enriquecer com os usuários interessados
    const eventoComInteresses = {
      ...evento,
      interesses: db.interesses
        .filter(i => i.evento_id === evento.id || i.evento_id === String(evento.id))
        .map(i => i.usuario_id)
    };
    res.json(eventoComInteresses);
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao buscar evento', detalhes: err.message });
  }
});

// Rota para cadastrar evento
router.post('/eventos', upload.any(), (req, res) => {
  try {
    const { nome, descricao, estado, cidade, endereco, data, horario, horario_fim, gratuito, preco, organizador, organizador_id, categoria, subcategorias, latitude, longitude } = req.body;
    const imagens = [];
    let imagemCapaUrl = '';
    let organizadorIdFinal = organizador_id;

    if (req.headers.authorization && !organizadorIdFinal) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'chave-secreta');
        organizadorIdFinal = decoded.id || decoded._id;
      } catch (e) {
        console.warn('JWT inválido ao cadastrar evento:', e.message);
      }
    }

    (req.files || []).forEach(file => {
      const mime = file.mimetype || 'image/jpeg';
      const base64 = file.buffer.toString('base64');
      const dataUrl = `data:${mime};base64,${base64}`;

      if (file.fieldname === 'imagemCapa') {
        imagemCapaUrl = dataUrl;
      } else if (file.fieldname === 'imagens') {
        imagens.push(dataUrl);
      }
    });

    if (!nome || !descricao || !cidade || !categoria) {
      return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
    }
    const lat = Number(latitude);
    const lon = Number(longitude);
    let datasRecebidas = [];
    if (req.body.datas) {
      try {
        const parsed = typeof req.body.datas === 'string' ? JSON.parse(req.body.datas) : req.body.datas;
        if (Array.isArray(parsed)) datasRecebidas = parsed;
      } catch (err) {
        datasRecebidas = [];
      }
    }
    if (datasRecebidas.length === 0 && data) {
      datasRecebidas = [{ data, horario_inicio: horario || '', horario_fim: horario_fim || '' }];
    }
    const primeiraData = datasRecebidas[0] || { data: data || '', horario_inicio: horario || '' };
    const parseBoolean = value => value === true || value === 'true' || value === 'on' || value === 1 || value === '1';
    const novoEvento = {
      id: db.eventos.length + 1,
      nome,
      descricao,
      estado: estado || 'Não informado',
      cidade,
      local: endereco || '',
      endereco: endereco || '',
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lon) ? lon : null,
      data: primeiraData.data,
      horario: primeiraData.horario_inicio,
      horario_fim: primeiraData.horario_fim || '',
      datas: datasRecebidas,
      gratuito: parseBoolean(gratuito),
      preco: Number(preco) || 0,
      organizador: organizador || 'Não informado',
      organizador_id: organizadorIdFinal || organizador_id || 1,
      categoria: categoria,
      subcategorias: Array.isArray(subcategorias) ? subcategorias : [subcategorias || ''],
      imagem: imagemCapaUrl,
      imagens: imagens,
      interesses: [],
      criado_em: new Date()
    };
    db.eventos.push(novoEvento);
    res.status(201).json({ mensagem: 'Evento cadastrado com sucesso!', id: novoEvento.id });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao cadastrar evento', detalhes: err.message });
  }
});

// Rota para atualizar evento
router.put('/eventos/:id', upload.any(), (req, res) => {
  try {
    const evento = db.eventos.find(e => e.id === parseInt(req.params.id));
    if (!evento) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }

    const { nome, descricao, estado, cidade, endereco, data, horario, horario_fim, gratuito, preco, organizador, organizador_id, categoria, subcategorias, latitude, longitude } = req.body;
    const imagens = [];
    let imagemCapaUrl = '';

    (req.files || []).forEach(file => {
      const mime = file.mimetype || 'image/jpeg';
      const base64 = file.buffer.toString('base64');
      const dataUrl = `data:${mime};base64,${base64}`;

      if (file.fieldname === 'imagemCapa') {
        imagemCapaUrl = dataUrl;
      } else if (file.fieldname === 'imagens') {
        imagens.push(dataUrl);
      }
    });

    const parseBoolean = value => value === true || value === 'true' || value === 'on' || value === 1 || value === '1';
    let datasRecebidas = [];
    if (req.body.datas) {
      try {
        const parsed = typeof req.body.datas === 'string' ? JSON.parse(req.body.datas) : req.body.datas;
        if (Array.isArray(parsed)) datasRecebidas = parsed;
      } catch (err) {
        datasRecebidas = [];
      }
    }
    if (datasRecebidas.length === 0 && data) {
      datasRecebidas = [{ data, horario_inicio: horario || '', horario_fim: horario_fim || '' }];
    }
    const primeiraData = datasRecebidas[0] || { data: data || '', horario_inicio: horario || '', horario_fim: horario_fim || '' };

    const camposAtualizados = {
      nome: nome || evento.nome,
      descricao: descricao || evento.descricao,
      estado: estado || evento.estado,
      cidade: cidade || evento.cidade,
      local: endereco || evento.local || evento.endereco || '',
      endereco: endereco || evento.endereco || '',
      latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : evento.latitude,
      longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : evento.longitude,
      data: primeiraData.data || evento.data,
      horario: primeiraData.horario_inicio || evento.horario,
      horario_fim: primeiraData.horario_fim || evento.horario_fim,
      datas: datasRecebidas.length > 0 ? datasRecebidas : evento.datas,
      gratuito: parseBoolean(gratuito) || evento.gratuito,
      preco: Number(preco) || evento.preco,
      organizador: organizador || evento.organizador,
      organizador_id: organizador_id || evento.organizador_id,
      categoria: categoria || evento.categoria,
      subcategorias: Array.isArray(subcategorias) ? subcategorias : (subcategorias ? [subcategorias] : evento.subcategorias)
    };

    Object.assign(evento, camposAtualizados);
    if (imagemCapaUrl) evento.imagem = imagemCapaUrl;
    if (imagens.length > 0) evento.imagens = imagens;

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
router.get('/usuario/:id', (req, res) => {
  try {
    const usuario = db.usuarios.find(u => u.id === parseInt(req.params.id));
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
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
router.put('/usuario/:id', (req, res) => {
  try {
    const usuario = db.usuarios.find(u => u.id === parseInt(req.params.id));
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    
    if (req.body.nome) usuario.nome = req.body.nome;
    if (req.body.email) usuario.email = req.body.email;
    if (req.body.estado) usuario.estado = req.body.estado;
    if (req.body.cidade) usuario.cidade = req.body.cidade;
    if (req.body.preferencias) usuario.preferencias = req.body.preferencias;
    
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
router.delete('/usuario/:id', (req, res) => {
  try {
    const index = db.usuarios.findIndex(u => u.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    db.usuarios.splice(index, 1);
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

// Endpoints de interesses
// GET /interesses/contador/:eventoId - Contar interesses de um evento
router.get('/interesses/contador/:eventoId', (req, res) => {
  try {
    const eventoId = parseInt(req.params.eventoId) || req.params.eventoId;
    const interessados = db.interesses
      .filter(i => i.evento_id === eventoId || i.evento_id === String(eventoId))
      .map(i => String(i.usuario_id));
    const contador = Array.from(new Set(interessados)).length;
    res.json({ contador });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao contar interesses', detalhes: err.message });
  }
});

// GET /interesses/usuario/:usuarioId - Obter interesses do usuário
router.get('/interesses/usuario/:usuarioId', (req, res) => {
  try {
    const usuarioId = parseInt(req.params.usuarioId) || req.params.usuarioId;
    const interessesDoUsuario = Array.from(new Set(
      db.interesses
        .filter(i => i.usuario_id === usuarioId || i.usuario_id === String(usuarioId))
        .map(i => String(i.evento_id))
    ));
    res.json({ interesses: interessesDoUsuario });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao obter interesses do usuário', detalhes: err.message });
  }
});

// GET /interesses/:eventoId - Obter contador e interesses de um evento
router.get('/interesses/:eventoId', (req, res) => {
  try {
    const eventoId = parseInt(req.params.eventoId) || req.params.eventoId;
    const interessados = Array.from(new Set(
      db.interesses
        .filter(i => i.evento_id === eventoId || i.evento_id === String(eventoId))
        .map(i => String(i.usuario_id))
    ));
    const contador = interessados.length;
    res.json({ contador, interessados });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao obter interesses', detalhes: err.message });
  }
});

// POST /interesses - Adicionar ou remover interesse
router.post('/interesses', (req, res) => {
  try {
    const { evento_id, usuario_id } = req.body;
    
    if (!evento_id) {
      return res.status(400).json({ erro: 'evento_id é obrigatório' });
    }

    // Se não houver usuario_id no body, tenta extrair do JWT
    let uid = usuario_id;
    if (!uid && req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'chave-secreta');
        uid = decoded.id;
      } catch (e) {
        // Se não conseguir decodificar, vai usar uma ID temporária
      }
    }

    // ID genérica para usuários não autenticados
    if (!uid) {
      uid = `anon_${Date.now()}`;
    }

    const eventoIdNum = parseInt(evento_id) || evento_id;
    const especificacaoId = `${uid}_${eventoIdNum}`;

    // Verificar se interesse já existe
    const interesseExistente = db.interesses.some(i => 
      (i.usuario_id === uid || i.usuario_id === String(uid)) && 
      (i.evento_id === eventoIdNum || i.evento_id === String(eventoIdNum))
    );

    if (interesseExistente) {
      // Remover interesse (toggle off) e limpar duplicatas
      db.interesses = db.interesses.filter(i => !(
        (i.usuario_id === uid || i.usuario_id === String(uid)) && 
        (i.evento_id === eventoIdNum || i.evento_id === String(eventoIdNum))
      ));
    } else {
      // Adicionar interesse (toggle on)
      db.interesses.push({
        usuario_id: uid,
        evento_id: eventoIdNum,
        data: new Date()
      });
    }

    // Retornar novo contador (conta usuários únicos)
    const interessesParaEvento = db.interesses.filter(i => 
      i.evento_id === eventoIdNum || i.evento_id === String(eventoIdNum)
    );
    const interessesIds = Array.from(new Set(interessesParaEvento.map(i => String(i.usuario_id))));
    const contador = interessesIds.length;
    const acao = interesseExistente ? 'removido' : 'adicionado';

    res.json({ 
      sucesso: true, 
      acao,
      contador,
      interesses: interessesIds,
      mensagem: interesseExistente ? 'Interesse removido' : 'Interesse adicionado'
    });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao atualizar interesse', detalhes: err.message });
  }
});

module.exports = router;
