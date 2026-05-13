const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const nodemailer = require('nodemailer');
const dns = require('dns').promises;
const dbFirestore = require('./db-firestore');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_fixa';
const EMAIL_DEMO_MODE = String(process.env.ALLOW_EMAIL_DEMO || process.env.EMAIL_DEMO || 'false').toLowerCase() === 'true';

// ============ CONFIGURAÇÃO DE EMAIL ============
let transporter = null;

function configurarEmail() {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailService = process.env.EMAIL_SERVICE || 'gmail';

  if (!emailUser || !emailPassword) {
    console.warn('⚠️ Credenciais de email não configuradas. Modo demo:', EMAIL_DEMO_MODE);
    return false;
  }

  transporter = nodemailer.createTransport({
    service: emailService,
    auth: {
      user: emailUser,
      pass: emailPassword
    }
  });

  transporter.verify((err, success) => {
    if (err) {
      transporter = null;
      console.warn('⚠️ Falha ao verificar o transporte de email:', err.message);
      return;
    }
    console.log('✅ Email configurado com sucesso');
  });

  return true;
}

function pertenceAProviderGoogleOuMicrosoft(dominio) {
  const provedor = dominio.toLowerCase();
  return [
    'gmail.com',
    'googlemail.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'msn.com',
    'office365.com',
    'outlook.com.br'
  ].some(item => provedor === item || provedor.endsWith(`.${item}`));
}

async function verificarDominioEmail(email) {
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexEmail.test(email)) {
    return { valido: false, erro: 'Email inválido' };
  }

  const dominio = email.split('@')[1].toLowerCase();

  try {
    const registrosMx = await dns.resolveMx(dominio);
    if (!registrosMx || registrosMx.length === 0) {
      throw new Error('Sem registros MX');
    }

    if (pertenceAProviderGoogleOuMicrosoft(dominio)) {
      const providerValido = registrosMx.some(mx => {
        return /google\.com$|googlemail\.com$|gmail-smtp-in\.l\.google\.com$|protection\.outlook\.com$|hotmail\.com$|outlook\.com$|msn\.com$/i.test(mx.exchange);
      });
      if (!providerValido) {
        return { valido: false, erro: 'Email não corresponde a um provedor válido do Google ou Microsoft' };
      }
    }

    return { valido: true };
  } catch (err) {
    try {
      await dns.resolve(dominio, 'A');
      return { valido: true };
    } catch (errA) {}

    try {
      await dns.resolve(dominio, 'AAAA');
      return { valido: true };
    } catch (errAAAA) {}

    return { valido: false, erro: 'Domínio de email sem registros válidos de MX/A/AAAA' };
  }
}

async function enviarCodigoEmail(email, codigo) {
  if (!transporter) {
    throw new Error('Servidor de email não configurado');
  }

  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: 'Seu código de confirmação de cadastro',
    text: `Seu código de confirmação é: ${codigo}. Ele expira em 15 minutos.`,
    html: `<p>Seu código de confirmação é: <strong>${codigo}</strong></p><p>Ele expira em 15 minutos.</p>`
  };

  await transporter.sendMail(mailOptions);
}

configurarEmail();

// ============ CONFIGURAÇÃO DO CLOUDINARY ============
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dphg1u2i7',
  api_key: process.env.CLOUDINARY_API_KEY || '727437553221359',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'ZHFHP0BAGjldGes6Uz8Ur6RBEb0'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'quedia_eventos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limite por arquivo
  }
});

function uploadEventImages(req, res, next) {
  upload.fields([
    { name: 'imagemCapa', maxCount: 1 },
    { name: 'imagens' }
  ])(req, res, function(err) {
    if (err) {
      console.error('Erro de upload de imagens:', err.message);
      if (err instanceof multer.MulterError) {
        let mensagem = 'Erro ao processar imagens.';
        if (err.code === 'LIMIT_FILE_COUNT') {
          mensagem = 'Você pode enviar no máximo 9 imagens extras além da capa.';
        } else if (err.code === 'LIMIT_FILE_SIZE') {
          mensagem = 'Cada imagem deve ter no máximo 10 MB.';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          mensagem = 'Um ou mais arquivos não são permitidos.';
        }
        return res.status(400).json({ erro: mensagem, detalhe: err.message });
      }
      return res.status(400).json({ erro: 'Erro ao processar imagens.', detalhe: err.message });
    }
    next();
  });
}

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

function verificarTokenOpcional(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario_id = decoded.id;
    req.tipo = decoded.tipo || decoded.cargo || decoded.role;
  } catch (err) {
    console.error('❌ verificarTokenOpcional erro:', err.message);
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }

  next();
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

// ✅ NOVO: Solicitar código de confirmação por email
router.post('/enviar-codigo', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ erro: 'Email é obrigatório' });
    }

    const resultadoDominio = await verificarDominioEmail(email);
    if (!resultadoDominio.valido) {
      return res.status(400).json({ erro: resultadoDominio.erro });
    }

    const emailExiste = await dbFirestore.verificarEmailExistente(email);
    if (emailExiste) {
      return res.status(400).json({ erro: 'Este email já está cadastrado' });
    }

    const { codigo } = await dbFirestore.gerarEArmazenarCodigoConfirmacao(email);

    if (!transporter) {
      if (EMAIL_DEMO_MODE) {
        console.warn('⚠️ Email não configurado. Retornando código demo.');
        return res.status(200).json({
          mensagem: 'Código gerado em modo demo. Configure SMTP para envio real.',
          codigo_demo: codigo
        });
      }

      return res.status(503).json({ erro: 'Servidor de email não configurado. Fale com o administrador.' });
    }

    try {
      await enviarCodigoEmail(email, codigo);
      console.log(`📧 Código enviado para: ${email}`);
      return res.status(200).json({
        mensagem: 'Código enviado para seu email. Válido por 15 minutos.',
        email_mascarado: email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      });
    } catch (err) {
      console.warn(`⚠️ Erro ao enviar email, mas código gerado: ${codigo}`, err.message);
      if (EMAIL_DEMO_MODE) {
        return res.status(200).json({
          mensagem: 'Não foi possível enviar email. Modo demo ativado.',
          codigo_demo: codigo
        });
      }

      return res.status(500).json({ erro: 'Não foi possível enviar o código por email. Tente novamente mais tarde.' });
    }
  } catch (err) {
    console.error('❌ Erro ao enviar código:', err.message);
    res.status(500).json({ erro: 'Erro ao enviar código', detalhes: err.message });
  }
});

// ✅ NOVO: Validar código de confirmação
router.post('/validar-codigo', async (req, res) => {
  try {
    const { email, codigo } = req.body;
    
    if (!email || !codigo) {
      return res.status(400).json({ erro: 'Email e código são obrigatórios' });
    }

    // Validar código
    const codigoValido = await dbFirestore.validarCodigoConfirmacao(email, codigo);
    
    if (!codigoValido) {
      return res.status(400).json({ erro: 'Código inválido ou expirado' });
    }

    res.status(200).json({ 
      mensagem: 'Email confirmado com sucesso!',
      confirmado: true
    });

  } catch (err) {
    console.error('❌ Erro ao validar código:', err.message);
    res.status(500).json({ erro: 'Erro ao validar código', detalhes: err.message });
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

    const emailConfirmado = await dbFirestore.verificarEmailConfirmado(email);
    if (!emailConfirmado) {
      return res.status(400).json({
        erro: 'Email não confirmado. Por favor, confirme seu email com o código enviado.',
        codigoNaoConfirmado: true
      });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const id = await dbFirestore.registrarUsuario({
      nome,
      email,
      senha: senhaCriptografada,
      estado: estado || 'Não informado',
      cidade: cidade || 'Não informado',
      preferencias,
      email_confirmado_em: new Date().toISOString()
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
    const email = String(req.body.email || '').trim().toLowerCase();
    const { senha } = req.body;
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
router.get('/eventos', verificarTokenOpcional, async (req, res) => {
  try {
    const organizador_id = req.query.organizador_id;
    const tokenUsuarioId = req.usuario_id;
    const tokenTipo = req.tipo && String(req.tipo).toLowerCase();
    const isAdmin = tokenTipo === 'adm';

    if (organizador_id) {
      if (!tokenUsuarioId) {
        return res.status(401).json({ erro: 'Token de autenticação necessário para listar eventos do organizador.' });
      }

      if (!isAdmin && String(organizador_id) !== String(tokenUsuarioId)) {
        return res.status(403).json({ erro: 'Não autorizado a listar eventos de outro organizador.' });
      }

      const eventos = await dbFirestore.obterEventosPorOrganizador(organizador_id);
      return res.json(eventos);
    }

    const eventos = await dbFirestore.listarEventos();
    return res.json(eventos);
  } catch (err) {
    console.error('Erro na rota GET /eventos:', err.message);
    return res.status(500).json({ erro: 'Erro ao listar eventos', detalhes: err.message });
  }
});

// Criar evento
router.post('/eventos', verificarToken, uploadEventImages, async (req, res) => {
  try {
    // Extrair dados do FormData
    const {
      nome,
      descricao,
      estado,
      cidade,
      endereco,
      data,
      horario,
      horario_fim,
      gratuito,
      preco,
      categoria,
      organizador,
      latitude,
      longitude
    } = req.body;

    // Processar subcategorias (podem vir como array ou string JSON)
    let subcategorias = [];
    if (req.body.subcategorias) {
      if (Array.isArray(req.body.subcategorias)) {
        subcategorias = req.body.subcategorias;
      } else if (typeof req.body.subcategorias === 'string') {
        try {
          subcategorias = JSON.parse(req.body.subcategorias);
        } catch (e) {
          subcategorias = [req.body.subcategorias];
        }
      }
    }

    // Processar datas (vem como string JSON)
    let datasRecebidas = [];
    if (req.body.datas) {
      try {
        datasRecebidas = JSON.parse(req.body.datas);
      } catch (err) {
        console.warn('Erro ao parsear datas:', err.message);
        datasRecebidas = [];
      }
    }
    if (!Array.isArray(datasRecebidas) || datasRecebidas.length === 0) {
      datasRecebidas = [{ data: data || '', horario_inicio: horario || '', horario_fim: horario_fim || '' }];
    }

    // Validação detalhada dos campos obrigatórios
    const camposFaltando = [];
    if (!nome || nome.trim() === '') camposFaltando.push('nome');
    if (!descricao || descricao.trim() === '') camposFaltando.push('descrição');
    if (!organizador || organizador.trim() === '') camposFaltando.push('organizador');
    if (!estado || estado.trim() === '') camposFaltando.push('estado');
    if (!cidade || cidade.trim() === '') camposFaltando.push('cidade');
    if (!endereco || endereco.trim() === '') camposFaltando.push('endereço');
    if (!latitude || !longitude) camposFaltando.push('localização no mapa');
    if (!categoria || categoria.trim() === '') camposFaltando.push('categoria principal');
    if (!subcategorias || subcategorias.length === 0) camposFaltando.push('pelo menos uma subcategoria');
    if (!req.files || !req.files.imagemCapa || req.files.imagemCapa.length === 0) camposFaltando.push('imagem de capa');

    if (camposFaltando.length > 0) {
      return res.status(400).json({
        erro: 'Campos obrigatórios faltando',
        campos_faltando: camposFaltando,
        mensagem: `Os seguintes campos são obrigatórios: ${camposFaltando.join(', ')}`
      });
    }

    // Remover duplicação - datasRecebidas já foi processada acima
    if (!Array.isArray(datasRecebidas) || datasRecebidas.length === 0) {
      datasRecebidas = [{ data: data || '', horario_inicio: horario || '', horario_fim: horario_fim || '' }];
    }

    const urlsImagens = [];
    const imagemCapaArquivo = req.files?.imagemCapa?.[0];
    const imagensExtras = req.files?.imagens || [];

    if (imagemCapaArquivo && imagemCapaArquivo.path) {
      urlsImagens.push(imagemCapaArquivo.path);
    }
    imagensExtras.forEach((file) => {
      if (file && file.path) {
        urlsImagens.push(file.path);
      }
    });

    const id = await dbFirestore.cadastrarEvento({
      nome,
      descricao,
      estado: estado || 'Não informado',
      cidade,
      endereco: endereco || '',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      data: datasRecebidas[0].data || data,
      horario: datasRecebidas[0].horario_inicio || horario,
      horario_fim: datasRecebidas[0].horario_fim || horario_fim || '',
      gratuito: gratuito === 'on' || gratuito === true || gratuito === 'true',
      preco: Number(preco) || 0,
      organizador: organizador || 'Não informado',
      organizador_id: req.usuario_id,
      categoria,
      subcategorias,
      imagem: urlsImagens.length > 0 ? urlsImagens[0] : null,
      imagens: urlsImagens,
      datas: datasRecebidas
    });

    res.status(201).json({ mensagem: 'Evento cadastrado com sucesso!', id });
  } catch (err) {
    console.error('❌ Erro ao cadastrar evento:', err.message);
    res.status(400).json({ erro: 'Erro ao cadastrar evento', detalhes: err.message });
  }
});

// Obter evento específico
router.get('/eventos/:id', verificarTokenOpcional, async (req, res) => {
  try {
    const evento = await dbFirestore.obterEvento(req.params.id);
    if (!evento) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }

    const isAdmin = req.tipo && String(req.tipo).toLowerCase() === 'adm';
    const isOrganizador = String(evento.organizador_id) === String(req.usuario_id);

    if (!isAdmin && !isOrganizador && String(evento.status).toLowerCase() !== 'aprovado') {
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

    // Verificar se é o organizador ou um administrador
    const isAdmin = req.tipo && String(req.tipo).toLowerCase() === 'adm';
    if (evento.organizador_id !== req.usuario_id && !isAdmin) {
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

    // Verificar se é o organizador ou admin (permitir ambos)
    const isOrganizador = String(evento.organizador_id) === String(req.usuario_id);
    const isAdmin = req.tipo && String(req.tipo).toLowerCase() === 'adm';

    if (!isOrganizador && !isAdmin) {
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

router.get('/interesses/:eventoId', verificarTokenOpcional, async (req, res) => {
  try {
    const { eventoId } = req.params;
    if (!eventoId) {
      return res.status(400).json({ erro: 'ID do evento é obrigatório' });
    }

    const interesses = await dbFirestore.listarInteresses(eventoId);
    const usuarios = Array.from(new Set(interesses.map(i => String(i.usuario_id))));
    const contador = usuarios.length;
    const temInteresse = req.usuario_id ? usuarios.includes(String(req.usuario_id)) : false;

    return res.json({ contador, interesses: usuarios, temInteresse });
  } catch (err) {
    console.error('Erro na rota GET /interesses/:eventoId:', err.message);
    return res.status(400).json({ erro: 'Erro ao obter interesses', detalhes: err.message });
  }
});

router.post('/interesses', verificarToken, async (req, res) => {
  try {
    const { evento_id } = req.body;
    if (!evento_id) {
      return res.status(400).json({ erro: 'evento_id é obrigatório' });
    }

    const interessesAtuais = await dbFirestore.listarInteresses(evento_id);
    const usuarios = interessesAtuais.map(i => String(i.usuario_id));
    const jaInteressado = usuarios.includes(String(req.usuario_id));
    let acao;

    if (jaInteressado) {
      await dbFirestore.removerInteresse(evento_id, req.usuario_id);
      acao = 'removido';
    } else {
      await dbFirestore.adicionarInteresse(evento_id, req.usuario_id);
      acao = 'adicionado';
    }

    const interessesAtualizados = await dbFirestore.listarInteresses(evento_id);
    const usuariosAtualizados = Array.from(new Set(interessesAtualizados.map(i => String(i.usuario_id))));
    const contador = usuariosAtualizados.length;

    return res.json({
      sucesso: true,
      acao,
      contador,
      interesses: usuariosAtualizados,
      mensagem: acao === 'adicionado' ? 'Interesse adicionado' : 'Interesse removido'
    });
  } catch (err) {
    console.error('Erro na rota POST /interesses:', err.message);
    return res.status(400).json({ erro: 'Erro ao atualizar interesse', detalhes: err.message });
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

module.exports = router;
