const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dbFirestore = require('./db-firestore');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_fixa';

// ============ AUTENTICAÇÃO ============

// Middleware para verificar token JWT
function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ erro: 'Token ausente' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario_id = decoded.id;
    req.tipo = decoded.tipo || decoded.cargo || decoded.role;
    next();
  } catch (err) {
    console.error('❌ verificarToken erro:', err.message);
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

function verificarAdmin(req, res, next) {
  if (req.tipo && String(req.tipo).toLowerCase() === 'adm') {
    return next();
  }
  return res.status(403).json({ erro: 'Acesso negado. Você não é administrador.' });
}

// ============ USUÁRIOS ============

// Verificar se email existe
router.get('/verificar-email', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ erro: 'Email é obrigatório' });
    }
    const existe = await dbFirestore.verificarEmailExistente(email);
    return res.json({ existe });
  } catch (err) {
    console.error('Erro na rota GET /verificar-email:', err.message);
    return res.status(400).json({ erro: 'Erro ao verificar email', detalhes: err.message });
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
      {
        id: usuario.id,
        tipo: usuario.tipo || usuario.cargo || 'usuario',
        cargo: usuario.cargo || usuario.tipo || 'usuario'
      },
      JWT_SECRET,
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
router.get('/eventos', async (req, res) => {
  try {
    const organizador_id = req.query.organizador_id;
    const eventos = organizador_id
      ? await dbFirestore.obterEventosPorOrganizador(organizador_id)
      : await dbFirestore.listarEventos();
    return res.json(eventos);
  } catch (err) {
    console.error('Erro na rota GET /eventos:', err.message);
    return res.status(500).json({ erro: 'Erro ao listar eventos', detalhes: err.message });
  }
});

// Criar evento
router.post('/eventos', verificarToken, async (req, res) => {
  try {
    const { nome, descricao, estado, cidade, endereco, data, horario, horario_fim, gratuito, preco, categoria, subcategorias, imagem, organizador, datas, auto_aprovado } = req.body;
    if (!nome || !descricao || !cidade || !categoria) {
      return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
    }

    let datasRecebidas = [];
    if (datas) {
      try {
        datasRecebidas = typeof datas === 'string' ? JSON.parse(datas) : datas;
      } catch (err) {
        datasRecebidas = [];
      }
    }
    if (!Array.isArray(datasRecebidas) || datasRecebidas.length === 0) {
      datasRecebidas = [{ data: data || '', horario_inicio: horario || '', horario_fim: horario_fim || '' }];
    }

    // Definir status: se admin e auto_aprovado=true, aprovar automaticamente
    let statusEvento = 'pendente';
    if (req.tipo && String(req.tipo).toLowerCase() === 'adm' && (auto_aprovado === 'true' || auto_aprovado === true)) {
      statusEvento = 'aprovado';
    }

    const id = await dbFirestore.cadastrarEvento({
      nome,
      descricao,
      estado: estado || 'Não informado',
      cidade,
      endereco: endereco || '',
      data: datasRecebidas[0].data || data,
      horario: datasRecebidas[0].horario_inicio || horario,
      horario_fim: datasRecebidas[0].horario_fim || horario_fim || '',
      gratuito: gratuito === 'on' || gratuito === true,
      preco: Number(preco) || 0,
      organizador: organizador || 'Não informado',
      organizador_id: req.usuario_id,
      categoria,
      subcategorias,
      imagem,
      datas: datasRecebidas,
      status: statusEvento
    });

    const mensagem = statusEvento === 'aprovado' 
      ? 'Evento publicado instantaneamente com sucesso!' 
      : 'Evento cadastrado com sucesso!';
    res.status(201).json({ mensagem, id });
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

// ============ ADMIN ============

router.get('/admin/eventos', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const eventosPendentes = await dbFirestore.listarEventosPendentes();
    return res.json(eventosPendentes);
  } catch (err) {
    console.error('Erro na rota GET /admin/eventos:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar eventos pendentes.', detalhe: err.message });
  }
});

router.post('/admin/eventos/:id/aprovar', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ erro: 'ID do evento é obrigatório' });
    }

    await dbFirestore.atualizarStatusEvento(id, 'aprovado', '');
    return res.json({ mensagem: 'Evento aprovado com sucesso!' });
  } catch (err) {
    console.error('Erro na rota POST /admin/eventos/:id/aprovar:', err.message);
    return res.status(500).json({ erro: 'Erro ao aprovar evento.', detalhe: err.message });
  }
});

router.post('/admin/eventos/:id/rejeitar', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!id) {
      return res.status(400).json({ erro: 'ID do evento é obrigatório' });
    }

    if (!motivo || !motivo.trim()) {
      return res.status(400).json({ erro: 'Motivo da rejeição é obrigatório' });
    }

    await dbFirestore.atualizarStatusEvento(id, 'rejeitado', motivo.trim());
    return res.json({ mensagem: 'Evento rejeitado com sucesso!' });
  } catch (err) {
    console.error('Erro na rota POST /admin/eventos/:id/rejeitar:', err.message);
    return res.status(500).json({ erro: 'Erro ao rejeitar evento.', detalhe: err.message });
  }
});

router.get('/admin/mensagens', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const mensagens = await dbFirestore.listarMensagens();
    return res.json(mensagens);
  } catch (err) {
    console.error('Erro na rota GET /admin/mensagens:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar mensagens pendentes.', detalhe: err.message });
  }
});

router.get('/admin/stats', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const eventosPendentes = await dbFirestore.listarEventosPendentes();
    const mensagens = await dbFirestore.listarMensagens();
    const respostasPendentes = Array.isArray(mensagens) ? mensagens.filter(msg => !msg.respondida).length : 0;

    return res.json({
      eventosPendentes: Array.isArray(eventosPendentes) ? eventosPendentes.length : eventosPendentes,
      respostasPendentes,
      totalMensagens: Array.isArray(mensagens) ? mensagens.length : 0
    });
  } catch (err) {
    console.error('Erro na rota GET /admin/stats:', err.message);
    return res.status(500).json({ erro: 'Erro ao buscar estatísticas de admin.', detalhe: err.message });
  }
});

module.exports = router;
