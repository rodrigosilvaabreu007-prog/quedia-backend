const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('./db-memory');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'quedia.com.br@gmail.com';
const SMTP_USER = process.env.SMTP_USER || process.env.SMTP_EMAIL || process.env.EMAIL_USER || 'quedia.com.br@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD || '';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const upload = multer({ storage: multer.memoryStorage() });

// Lazy-load mail transporter only when needed
let mailTransporter = null;
function getMailTransporter() {
  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
  }
  return mailTransporter;
}

function parseLocalDateTime(data, hora) {
  if (!data) return null;
  const [year, month, day] = data.split('-').map(Number);
  const [hours, minutes] = (hora || '00:00').split(':').map(Number);
  if (![year, month, day, hours, minutes].every(Number.isFinite)) return null;
  return new Date(year, month - 1, day, hours, minutes, 0);
}

function calcularExpiracaoEventoMemory(item) {
  const inicio = parseLocalDateTime(item.data, item.horario_inicio || '00:00');
  if (!inicio || Number.isNaN(inicio.getTime())) return null;

  if (item.horario_fim) {
    const fim = parseLocalDateTime(item.data, item.horario_fim);
    if (fim && !Number.isNaN(fim.getTime())) {
      return new Date(fim.getTime() + 12 * 60 * 60 * 1000);
    }
  }

  return new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
}

function eventoEstaAtivoMemory(evento) {
  const datas = Array.isArray(evento.datas) && evento.datas.length > 0
    ? evento.datas
    : [{ data: evento.data, horario_inicio: evento.horario || '00:00', horario_fim: evento.horario_fim || '' }];

  const agora = new Date();
  return datas.some(item => {
    if (!item || !item.data) return false;
    const expiracao = calcularExpiracaoEventoMemory(item);
    return expiracao && expiracao > agora;
  });
}

function extrairToken(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.replace(/^Bearer\s+/i, '');
}

function verificarTokenMemory(req, res, next) {
  const token = extrairToken(req);
  if (!token) {
    return res.status(401).json({ erro: 'Token de acesso necessário' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ erro: 'Token inválido' });
  }
}

async function enviarEmailContatoMemory({ nome, email, mensagem }) {
  if (!SMTP_PASS) {
    throw new Error('SMTP credentials não configuradas. Defina SMTP_PASS, SMTP_PASSWORD ou EMAIL_PASSWORD.');
  }

  try {
    return await getMailTransporter().sendMail({
      from: `Quedia Contato <${SMTP_USER}>`,
      to: CONTACT_EMAIL,
      replyTo: `${nome} <${email}>`,
      subject: `Contato do site: ${nome}`,
      text: `Nome: ${nome}\nEmail: ${email}\nMensagem:\n${mensagem}`
    });
  } catch (err) {
    if (err.responseCode === 534 || /Application-specific password required/i.test(err.message)) {
      throw new Error('Erro de autenticação SMTP: o Gmail exige App Password para envio por SMTP. Gere um App Password em https://myaccount.google.com/apppasswords e configure-o em EMAIL_PASSWORD ou GMAIL_APP_PASSWORD.');
    }
    throw err;
  }
}

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

// Middleware: Inicializar admin automaticamente
(async () => {
  try {
    const ADMIN_EMAILS = [
      'rodrigo.silva.abreu554466@gmail.com',
      'rodrigo.silva.abreu@554466@gmail.com'
    ];
    const ADMIN_SENHA = 'Rdrg_2007';
    
    // Verificar se admin já existe em qualquer formato conhecido
    const adminExiste = db.usuarios.find(u => ADMIN_EMAILS.includes(String(u.email || '').toLowerCase()));
    if (!adminExiste) {
      console.log('🚀 Criando admin automaticamente...');
      const senhaCriptografada = await bcrypt.hash(ADMIN_SENHA, 10);
      const admin = {
        id: db.usuarios.length + 1,
        nome: 'Rodrigo',
        email: ADMIN_EMAILS[0],
        senha: senhaCriptografada,
        estado: 'Não informado',
        cidade: 'Não informado',
        preferencias: [],
        tipo: 'adm',
        criado_em: new Date()
      };
      db.usuarios.push(admin);
      console.log('✅ Admin criado com sucesso!');
    } else {
      console.log('✅ Admin já existe');
    }
  } catch (err) {
    console.error('❌ Erro ao inicializar admin:', err);
  }
})();

// ============ ARMAZENAMENTO DE CÓDIGOS DE CONFIRMAÇÃO (Em memória) ============
const codigosConfirmacao = {};

function gerarCodigoConfirmacao(email) {
  const codigo = String(Math.floor(100000 + Math.random() * 900000));
  const dataExpiracao = Date.now() + (15 * 60 * 1000); // 15 minutos
  codigosConfirmacao[email] = { codigo, dataExpiracao, usado: false };
  return codigo;
}

async function validarCodigoConfirmacaoMemory(email, codigo) {
  const dado = codigosConfirmacao[email];
  if (!dado) return false;
  if (dado.usado) return false;
  if (Date.now() > dado.dataExpiracao) {
    delete codigosConfirmacao[email];
    return false;
  }
  if (dado.codigo !== String(codigo).trim()) return false;
  dado.usado = true;
  return true;
}

function verificarEmailConfirmadoMemory(email) {
  const dado = codigosConfirmacao[email];
  return dado && dado.usado && Date.now() <= dado.dataExpiracao;
}

// ============ ARMAZENAMENTO DE CÓDIGOS SMS (Em memória) ============
const codigosSMS = {};

function gerarCodigoSMSMemory(telefone) {
  const codigo = String(Math.floor(100000 + Math.random() * 900000));
  const dataExpiracao = Date.now() + (15 * 60 * 1000); // 15 minutos
  codigosSMS[telefone] = { codigo, dataExpiracao, usado: false, tentativas: 0 };
  return codigo;
}

async function validarCodigoSMSMemory(telefone, codigo) {
  const dado = codigosSMS[telefone];
  if (!dado) return { valido: false, erro: 'Código não encontrado' };
  if (dado.usado) return { valido: false, erro: 'Código já foi utilizado' };
  if (Date.now() > dado.dataExpiracao) {
    delete codigosSMS[telefone];
    return { valido: false, erro: 'Código expirado' };
  }
  if (dado.codigo !== String(codigo).trim()) {
    dado.tentativas++;
    if (dado.tentativas >= 3) {
      delete codigosSMS[telefone];
      return { valido: false, erro: 'Muitas tentativas. Solicite um novo código.' };
    }
    return { valido: false, erro: 'Código incorreto' };
  }
  dado.usado = true;
  return { valido: true };
}

// ============ ROTA: ENVIAR CÓDIGO DE CONFIRMAÇÃO ============
router.post('/enviar-codigo', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ erro: 'Email é obrigatório' });
    }

    // Verificar se email já está cadastrado
    if (db.usuarios.some(u => u.email === email.toLowerCase())) {
      return res.status(400).json({ erro: 'Este email já está cadastrado' });
    }

    const codigo = gerarCodigoConfirmacao(email.toLowerCase());
    
    console.log(`📧 Código gerado para ${email}: ${codigo} (modo memória - sem envio real)`);
    
    res.status(200).json({
      mensagem: 'Código gerado com sucesso!',
      codigo_demo: codigo,
      email_mascarado: email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    });
  } catch (err) {
    console.error('❌ Erro ao enviar código:', err.message);
    res.status(500).json({ erro: 'Erro ao enviar código', detalhes: err.message });
  }
});

// ============ ROTA: VALIDAR CÓDIGO DE CONFIRMAÇÃO ============
router.post('/validar-codigo', async (req, res) => {
  try {
    const { email, codigo } = req.body;
    
    if (!email || !codigo) {
      return res.status(400).json({ erro: 'Email e código são obrigatórios' });
    }

    const codigoValido = await validarCodigoConfirmacaoMemory(email.toLowerCase(), codigo);
    
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

// ============ ROTA: ENVIAR CÓDIGO SMS ============
router.post('/enviar-codigo-sms', async (req, res) => {
  try {
    const { telefone } = req.body;

    if (!telefone) {
      return res.status(400).json({ erro: 'Telefone é obrigatório' });
    }

    const apenasNumeros = telefone.replace(/\D/g, '');
    
    if (apenasNumeros.length !== 11) {
      return res.status(400).json({ erro: 'Telefone inválido' });
    }

    const codigo = gerarCodigoSMSMemory(apenasNumeros);
    
    console.log(`📱 Código SMS gerado para ${apenasNumeros}: ${codigo} (modo memória - sem envio real)`);
    
    res.status(200).json({
      mensagem: 'Código gerado com sucesso!',
      codigo_demo: codigo,
      telefone_mascarado: `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-****`
    });
  } catch (err) {
    console.error('❌ Erro ao enviar código SMS:', err.message);
    res.status(500).json({ erro: 'Erro ao enviar código SMS', detalhes: err.message });
  }
});

// ============ ROTA: VALIDAR CÓDIGO SMS ============
router.post('/validar-codigo-sms', async (req, res) => {
  try {
    const { telefone, codigo } = req.body;
    
    if (!telefone || !codigo) {
      return res.status(400).json({ erro: 'Telefone e código são obrigatórios' });
    }

    const apenasNumeros = telefone.replace(/\D/g, '');
    const resultado = await validarCodigoSMSMemory(apenasNumeros, codigo);
    
    if (!resultado.valido) {
      return res.status(400).json({ erro: resultado.erro });
    }

    res.status(200).json({ 
      mensagem: 'Telefone confirmado com sucesso!',
      confirmado: true
    });
  } catch (err) {
    console.error('❌ Erro ao validar código SMS:', err.message);
    res.status(500).json({ erro: 'Erro ao validar código SMS', detalhes: err.message });
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
    
    // Verificar se email foi confirmado
    if (!verificarEmailConfirmadoMemory(email.toLowerCase())) {
      return res.status(400).json({
        erro: 'Email não confirmado. Por favor, confirme seu email com o código enviado.',
        codigoNaoConfirmado: true
      });
    }
    
    // Verifica se usuário já existe
    if (db.usuarios.some(u => u.email === email.toLowerCase())) {
      console.log('❌ Email já cadastrado:', email);
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }
    const senhaCriptografada = await bcrypt.hash(senha, 10);
    const novoUsuario = {
      id: db.usuarios.length + 1,
      nome,
      email: email.toLowerCase(),
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
    const tokenPayload = {
      id: usuario.id,
      tipo: usuario.tipo,
      cargo: usuario.tipo === 'adm' ? 'adm' : 'usuario'
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '2h' });
    res.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        estado: usuario.estado,
        cidade: usuario.cidade,
        preferencias: usuario.preferencias || [],
        tipo: usuario.tipo,
        cargo: tokenPayload.cargo
      },
      token
    });
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

    // Verificar se usuário é admin
    let isAdmin = false;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace(/^Bearer\s+/i, '');
        const decoded = jwt.verify(token, JWT_SECRET);
        const usuario = db.usuarios.find(u => u.id === decoded.id);
        isAdmin = usuario && usuario.tipo === 'adm';
      } catch (e) {
        // Token inválido, continua como não-admin
      }
    }

    // Filtrar por organizador se especificado
    if (organizadorId) {
      eventosFiltrados = eventosFiltrados.filter(evento =>
        String(evento.organizador_id) === String(organizadorId)
      );
    }

    // Se não for admin, mostrar apenas eventos aprovados
    if (!isAdmin) {
      eventosFiltrados = eventosFiltrados.filter(evento => evento.status === 'approved');
    }

    eventosFiltrados = eventosFiltrados.filter(eventoEstaAtivoMemory);

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
    if (!evento || !eventoEstaAtivoMemory(evento)) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }
    res.json(evento);
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
        const decoded = jwt.verify(token, JWT_SECRET);
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
      status: 'pending',
      criado_em: new Date()
    };
    db.eventos.push(novoEvento);
    res.status(201).json({ mensagem: 'Evento enviado para análise! Será aprovado ou rejeitado em até 24 horas.', id: novoEvento.id });
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
router.post('/contato', verificarTokenMemory, async (req, res) => {
  try {
    const { nome, email, mensagem } = req.body;

    if (!nome || !email || !mensagem) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
    }

    const novaMensagem = {
      id: (db.contatos || []).length + 1,
      nome,
      email,
      mensagem,
      usuario_id: req.usuario?.id || null,
      data: new Date().toISOString()
    };

    if (!db.contatos) db.contatos = [];
    db.contatos.push(novaMensagem);

    if (SMTP_PASS) {
      await enviarEmailContatoMemory({ nome, email, mensagem });
    } else {
      console.warn('SMTP não configurado: mensagem de contato ficará apenas em memória');
    }

    console.log('📧 Nova mensagem de contato recebida:', { nome, email, data: novaMensagem.data, usuario_id: novaMensagem.usuario_id });

    res.json({ mensagem: 'Mensagem recebida com sucesso! Entraremos em contato em breve.', id: novaMensagem.id });
  } catch (err) {
    console.error('❌ Erro ao processar contato:', err);
    res.status(500).json({ erro: 'Erro interno do servidor', detalhes: err.message });
  }
});

router.get('/debug/email-status', (req, res) => {
  return res.json({
    contactEmail: CONTACT_EMAIL,
    smtpUserSet: !!SMTP_USER,
    smtpPassSet: !!SMTP_PASS,
    smtpHost: SMTP_HOST,
    smtpPort: SMTP_PORT,
    smtpSecure: SMTP_SECURE,
    smtpConfigured: !!SMTP_PASS,
    smtpUserMasked: SMTP_USER ? `${SMTP_USER.slice(0, 3)}***${SMTP_USER.slice(-3)}` : null
  });
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

    let temInteresse = false;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace(/^Bearer\s+/i, '');
        const decoded = jwt.verify(token, JWT_SECRET);
        temInteresse = interessados.includes(String(decoded.id));
      } catch (e) {
        // Token inválido ou ausente: não altera o resultado
      }
    }

    res.json({ contador, interessados, temInteresse });
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
    if (!uid) {
      if (!req.headers.authorization) {
        return res.status(401).json({ erro: 'Token de autenticação necessário' });
      }

      try {
        const token = req.headers.authorization.replace(/^Bearer\s+/i, '');
        const decoded = jwt.verify(token, JWT_SECRET);
        uid = decoded.id;
      } catch (e) {
        return res.status(401).json({ erro: 'Token inválido' });
      }
    }

    if (!uid) {
      return res.status(401).json({ erro: 'Usuario_id inválido' });
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

// Middleware para verificar token JWT
async function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token de autenticação necessário' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido' });
  }
}

// Middleware para verificar se usuário é admin
async function verificarAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token de autenticação necessário' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const usuario = db.usuarios.find(u => u.id === decoded.id);
    if (!usuario || usuario.tipo !== 'adm') {
      return res.status(403).json({ erro: 'Acesso negado. Apenas administradores.' });
    }
    req.usuario = usuario;
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido' });
  }
}

// Função para enviar email de contato
async function enviarEmailContato(dados) {
  const { nome, email, mensagem } = dados;
  
  // Salvar mensagem no banco de memória
  const novaMensagem = {
    id: db.mensagens.length + 1,
    nome,
    email,
    mensagem,
    criadoEm: new Date(),
    respondida: false,
    resposta: null,
    respondidoEm: null
  };
  db.mensagens.push(novaMensagem);
  
  const mailOptions = {
    from: CONTACT_EMAIL,
    to: CONTACT_EMAIL,
    subject: `Nova mensagem de contato - ${nome}`,
    html: `
      <h2>Nova mensagem de contato</h2>
      <p><strong>Nome:</strong> ${nome}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Mensagem:</strong></p>
      <p>${mensagem.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><em>Enviado em: ${new Date().toLocaleString('pt-BR')}</em></p>
    `
  };

  try {
    const transporter = getMailTransporter();
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de contato enviado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao enviar email de contato:', error);
    throw error;
  }
}

// Rota POST: CONTATO (apenas usuários logados podem enviar)
router.post('/contato', verificarToken, async (req, res) => {
  try {
    const { nome, email, mensagem } = req.body;
    if (!nome || !email || !mensagem) {
      return res.status(400).json({ erro: 'Nome, email e mensagem são obrigatórios' });
    }

    await enviarEmailContato({ nome, email, mensagem });
    return res.json({ mensagem: 'Mensagem enviada com sucesso! Entraremos em contato em breve.' });
  } catch (err) {
    console.error('Erro na rota POST /contato:', err);
    return res.status(500).json({ erro: 'Erro ao enviar mensagem. Verifique a configuração de e-mail.', detalhe: err.message });
  }
});

// GET /admin/eventos - Listar eventos pendentes para aprovação
router.get('/admin/eventos', verificarAdmin, (req, res) => {
  try {
    const eventos = db.eventos.filter(e => e.status === 'pendente');
    res.json(eventos);
  } catch (err) {
    console.error('Erro ao listar eventos pendentes:', err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// POST /admin/eventos/:id/aprovar - Aprovar evento
router.post('/admin/eventos/:id/aprovar', verificarAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const evento = db.eventos.find(e => e.id === id);
    if (!evento) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }
    evento.status = 'approved';
    res.json({ mensagem: 'Evento aprovado com sucesso', evento });
  } catch (err) {
    console.error('Erro ao aprovar evento:', err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// POST /admin/eventos/:id/rejeitar - Rejeitar evento
router.post('/admin/eventos/:id/rejeitar', verificarAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { motivo } = req.body;
    
    const evento = db.eventos.find(e => e.id === id);
    if (!evento) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }
    
    evento.status = 'rejected';
    evento.motivo_rejeicao = motivo;
    
    // Adicionar mensagem de contato para o usuário
    const organizador = db.usuarios.find(u => u.id === evento.organizador_id);
    if (organizador) {
      const mensagemContato = {
        id: db.mensagens.length + 1,
        nome: organizador.nome,
        email: organizador.email,
        mensagem: `Seu evento "${evento.nome}" foi rejeitado. Motivo: ${motivo}`,
        criadoEm: new Date(),
        respondida: false,
        resposta: null,
        respondidoEm: null
      };
      db.mensagens.push(mensagemContato);
    }
    
    res.json({ mensagem: 'Evento rejeitado', evento });
  } catch (err) {
    console.error('Erro ao rejeitar evento:', err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// Simular modelo de mensagens para modo memória
if (!db.mensagens) {
  db.mensagens = [];
}

// GET /admin/mensagens - Listar mensagens de contato
router.get('/admin/mensagens', verificarAdmin, (req, res) => {
  try {
    const mensagens = db.mensagens.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
    res.json(mensagens);
  } catch (err) {
    console.error('Erro ao listar mensagens:', err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// POST /admin/mensagens/:id/responder - Responder mensagem
router.post('/admin/mensagens/:id/responder', verificarAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { resposta } = req.body;
    
    const mensagem = db.mensagens.find(m => m.id === id);
    if (!mensagem) {
      return res.status(404).json({ erro: 'Mensagem não encontrada' });
    }
    
    mensagem.resposta = resposta;
    mensagem.respondida = true;
    mensagem.respondidoEm = new Date();
    
    res.json({ mensagem: 'Resposta enviada com sucesso', mensagem });
  } catch (err) {
    console.error('Erro ao responder mensagem:', err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

module.exports = router;
