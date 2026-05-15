const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { connectDB } = require('./db'); 
const { registrarUsuario, autenticarUsuario, buscarUsuarioPorId, atualizarUsuario, deletarUsuario } = require('./autenticacao');

// 1. IMPORTAÇÃO DOS MODELS (Caminho corrigido para a pasta models)
const { cadastrarEvento, listarEventos, deletarEvento, buscarEventoPorId } = require('./models/eventos');
const Usuario = require('./models/usuarios');
const Mensagem = require('./models/mensagens');

// 2. CONFIGURAÇÃO DO CLOUDINARY
cloudinary.config({
    cloud_name: 'dphg1u2i7',
    api_key: '727437553221359',
    api_secret: 'ZHFHP0BAGjldGes6Uz8Ur6RBEb0'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'quedia_eventos',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const upload = multer({ storage: storage });

// 3. MIDDLEWARE DE CONEXÃO (Tenta conectar, mas permite próximas rotas)
router.use(async (req, res, next) => {
    try {
        console.log('[DEBUG middleware] Tentando conectar ao banco...');
        await connectDB();
        console.log('[DEBUG middleware] Conexão estabelecida');
    } catch (err) {
        console.error("⚠️ Conexão com banco não disponível no middleware:", err.message);
        // Continua mesmo se banco não conectar - algumas rotas podem funcionar sem banco
    }
    next();
});

(async () => {
    try {
        await connectDB();
        await Usuario.inicializarAdmins();
    } catch (err) {
        console.error('❌ Falha ao inicializar admins:', err.message);
    }
})();

// 4. ROTA POST: CRIAR EVENTO
router.post('/eventos', upload.any(), async (req, res) => {
    try {
        // Tratamento das Imagens vindas do Cloudinary
        const linksImagens = (req.files && req.files.length > 0) 
            ? req.files.map(f => f.path) 
            : [];
        
        // Limpeza de Preço (Trata R$, espaços e vírgulas)
        let precoLimpo = 0;
        if (req.body.preco) {
            const strPreco = String(req.body.preco).replace(/R\$|\s/g, '').replace(',', '.');
            precoLimpo = parseFloat(strPreco) || 0;
        }

        // Montagem do objeto conforme o Schema do MongoDB
        const latitude = Number(req.body.latitude);
        const longitude = Number(req.body.longitude);
        console.log('[DEBUG] Backend recebeu:', {
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            latitudeNumber: latitude,
            longitudeNumber: longitude,
            isFiniteLatitude: Number.isFinite(latitude),
            isFiniteLongitude: Number.isFinite(longitude)
        });
        let datasRecebidas = [];
        if (req.body.datas) {
            if (Array.isArray(req.body.datas)) {
                datasRecebidas = req.body.datas;
            } else if (typeof req.body.datas === 'string') {
                try {
                    const parsed = JSON.parse(req.body.datas);
                    if (Array.isArray(parsed)) datasRecebidas = parsed;
                } catch (err) {
                    datasRecebidas = [];
                }
            }
        }

        const primeiraData = Array.isArray(datasRecebidas) && datasRecebidas.length > 0
            ? datasRecebidas[0]
            : { data: req.body.data || '', horario_inicio: req.body.horario || '', horario_fim: req.body.horario_fim || '' };

        const dadosEvento = {
            nome: req.body.nome || "Evento sem nome",
            descricao: req.body.descricao || "",
            cidade: req.body.cidade || "",
            estado: req.body.estado || "",
            local: req.body.local || req.body.endereco || "",
            latitude: Number.isFinite(latitude) ? latitude : null,
            longitude: Number.isFinite(longitude) ? longitude : null,
            data: primeiraData.data || req.body.data || "",
            horario: primeiraData.horario_inicio || req.body.horario || "",
            horario_fim: primeiraData.horario_fim || req.body.horario_fim || "",
            datas: datasRecebidas,
            categoria: req.body.categoria || "Outros",
            subcategorias: Array.isArray(req.body.subcategorias) 
                ? req.body.subcategorias 
                : [req.body.subcategorias].filter(Boolean),
            imagens: linksImagens,
            preco: precoLimpo,
            gratuito: String(req.body.gratuito) === 'true' || precoLimpo === 0,
            organizador: req.body.organizador || 'Não informado',
            organizador_id: req.body.organizador_id || "sistema"
        };

        // Salva no Banco de Dados via Model
        const novoEvento = await cadastrarEvento(dadosEvento);
        
        return res.status(201).json({ 
            mensagem: '✅ Evento criado com sucesso!', 
            evento: novoEvento 
        });

    } catch (err) {
        console.error("Erro na rota POST /eventos:", err.message);
        res.status(500).json({ 
            erro: "Falha ao salvar evento", 
            detalhe: err.message 
        });
    }
});

// 5. ROTA GET: LISTAR EVENTOS
router.get('/eventos', async (req, res) => {
    console.log('[DEBUG] Rota /eventos chamada');
    try {
        const eventos = await listarEventos(req.query);
        res.json(eventos || []);
    } catch (err) {
        console.error("Erro na rota GET /eventos:", err.message);
        res.status(500).json({ erro: 'Erro ao buscar eventos.' });
    }
});

// DEBUG: LISTAR TODOS OS EVENTOS SEM FILTRO
router.get('/eventos/all', async (req, res) => {
    console.log('[DEBUG] Rota /eventos/all chamada');
    try {
        const { EventoModel } = require('./models/eventos');
        const eventos = await EventoModel.find({}).sort({ criadoEm: -1 }).limit(10);
        res.json(eventos || []);
    } catch (err) {
        console.error("Erro na rota GET /eventos/all:", err.message);
        res.status(500).json({ erro: 'Erro ao buscar eventos.' });
    }
});

// DEBUG: LISTAR EVENTOS COM STATUS ATIVO
router.get('/eventos-debug', (req, res) => {
    console.log('[DEBUG] Rota /eventos-debug foi chamada!');
    res.json({ status: 'Rota funcionando', timestamp: new Date().toISOString() });
});

// 5.1. ROTA GET: BUSCAR EVENTO POR ID
router.get('/eventos/:id', async (req, res) => {
    console.log(`[DEBUG] Rota /eventos/:id chamada com id: ${req.params.id}`);
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ erro: 'ID do evento é obrigatório' });
        }

        const evento = await buscarEventoPorId(id);
        if (!evento) {
            return res.status(404).json({ erro: 'Evento não encontrado' });
        }

        return res.json(evento);
    } catch (err) {
        console.error('Erro na rota GET /eventos/:id:', err.message);
        res.status(500).json({ erro: 'Erro ao buscar evento.' });
    }
});

// DEBUG: Inspecionar últimos eventos
router.get('/debug/ultimos-eventos', async (req, res) => {
    try {
        const eventos = await listarEventos({});
        const ultimos = eventos.slice(-3).map(e => ({
            _id: e._id,
            nome: e.nome,
            latitude: e.latitude,
            longitude: e.longitude,
            latitudeType: typeof e.latitude,
            longitudeType: typeof e.longitude
        }));
        res.json({ ultimos });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// 6. ROTA DELETE: DELETAR EVENTO
router.delete('/eventos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ erro: 'ID do evento é obrigatório' });
        }

        const eventoDeletado = await deletarEvento(id);
        if (!eventoDeletado) {
            return res.status(404).json({ erro: 'Evento não encontrado' });
        }

        return res.json({ mensagem: 'Evento deletado com sucesso' });
    } catch (err) {
        console.error("Erro na rota DELETE /eventos/:id:", err.message);
        res.status(500).json({ erro: 'Erro ao deletar evento.' });
    }
});

// ============ ARMAZENAMENTO DE CÓDIGOS DE CONFIRMAÇÃO (Em memória) ============
const codigosConfirmacao = {};

function gerarCodigoConfirmacao(email) {
  const codigo = String(Math.floor(100000 + Math.random() * 900000));
  const dataExpiracao = Date.now() + (15 * 60 * 1000); // 15 minutos
  codigosConfirmacao[email] = { codigo, dataExpiracao, usado: false };
  return codigo;
}

async function validarCodigoConfirmacaoMongo(email, codigo) {
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

function verificarEmailConfirmadoMongo(email) {
  const dado = codigosConfirmacao[email];
  return dado && dado.usado && Date.now() <= dado.dataExpiracao;
}

// ============ ROTA: ENVIAR CÓDIGO DE CONFIRMAÇÃO ============
router.post('/enviar-codigo', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ erro: 'Email é obrigatório' });
    }

    // Verificar se email já está cadastrado
    const usuarioExistente = await Usuario.findOne({ email: email.toLowerCase() });
    if (usuarioExistente) {
      return res.status(400).json({ erro: 'Este email já está cadastrado' });
    }

    const codigo = gerarCodigoConfirmacao(email.toLowerCase());
    
    console.log(`📧 Código gerado para ${email}: ${codigo} (modo MongoDB)`);
    
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

    const codigoValido = await validarCodigoConfirmacaoMongo(email.toLowerCase(), codigo);
    
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

// 6. ROTA POST: CADASTRO DE USUÁRIO
router.post('/cadastro', async (req, res) => {
    try {
        const { nome, email, senha, estado, cidade, preferencias } = req.body;
        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
        }

        // Verificar se email foi confirmado
        if (!verificarEmailConfirmadoMongo(email.toLowerCase())) {
            return res.status(400).json({
                erro: 'Email não confirmado. Por favor, confirme seu email com o código enviado.',
                codigoNaoConfirmado: true
            });
        }

        const id = await registrarUsuario({ nome, email, senha, estado, cidade, preferencias });
        return res.status(201).json({ mensagem: '✅ Usuário cadastrado com sucesso!', id });
    } catch (err) {
        console.error('Erro na rota POST /cadastro:', err.message);
        return res.status(400).json({ erro: err.message || 'Erro ao cadastrar usuário' });
    }
});

// 7. ROTA POST: LOGIN DE USUÁRIO
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
        }

        const login = await autenticarUsuario(email, senha);
        if (!login) {
            return res.status(401).json({ erro: 'Email ou senha inválidos' });
        }

        return res.json(login);
    } catch (err) {
        console.error('Erro na rota POST /login:', err.message);
        return res.status(400).json({ erro: err.message || 'Erro ao autenticar usuário' });
    }
});

// 7.1. ROTA POST: ENVIAR MENSAGEM DE CONTATO
router.post('/contato', verificarToken, async (req, res) => {
    try {
        const { nome, email, mensagem } = req.body;
        if (!nome || !email || !mensagem) {
            return res.status(400).json({ erro: 'Nome, email e mensagem são obrigatórios' });
        }

        const novaMensagem = new Mensagem({
            nome,
            email,
            mensagem,
            usuario_id: req.usuario?.id || '',
            usuario_email: req.usuario?.email || ''
        });

        await novaMensagem.save();
        return res.json({ mensagem: 'Mensagem enviada com sucesso!' });
    } catch (err) {
        console.error('Erro na rota POST /contato:', err.message);
        return res.status(500).json({ erro: 'Erro ao enviar mensagem.', detalhe: err.message });
    }
});

// 8. ROTA GET: BUSCAR USUÁRIO POR ID
router.get('/usuario/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ erro: 'ID do usuário é obrigatório' });
        }

        const usuario = await buscarUsuarioPorId(id);
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        return res.json(usuario);
    } catch (err) {
        console.error('Erro na rota GET /usuario/:id:', err.message);
        return res.status(500).json({ erro: err.message || 'Erro ao buscar usuário' });
    }
});

router.get('/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ erro: 'ID do usuário é obrigatório' });
        }

        const usuario = await buscarUsuarioPorId(id);
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        return res.json(usuario);
    } catch (err) {
        console.error('Erro na rota GET /usuarios/:id:', err.message);
        return res.status(500).json({ erro: err.message || 'Erro ao buscar usuário' });
    }
});

// 10. ROTA GET: LISTAR EVENTOS PENDENTES DE APROVAÇÃO (ADMIN)
router.get('/admin/eventos', verificarAdmin, async (req, res) => {
    try {
        const eventosPendentes = await require('./models/eventos').EventoModel.find({ status: 'pendente' }).sort({ criadoEm: -1 });
        return res.json(eventosPendentes);
    } catch (err) {
        console.error('Erro na rota GET /admin/eventos:', err.message);
        return res.status(500).json({ erro: 'Erro ao buscar eventos pendentes.', detalhe: err.message });
    }
});

// 10.1. ROTA POST: APROVAR EVENTO (ADMIN)
router.post('/admin/eventos/:id/aprovar', verificarAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ erro: 'ID do evento é obrigatório' });
        }

        const eventoAprovado = await require('./models/eventos').EventoModel.findByIdAndUpdate(
            id,
            { status: 'aprovado', motivo_rejeicao: '' },
            { new: true }
        );

        if (!eventoAprovado) {
            return res.status(404).json({ erro: 'Evento não encontrado' });
        }

        return res.json({ mensagem: 'Evento aprovado com sucesso', evento: eventoAprovado });
    } catch (err) {
        console.error('Erro na rota POST /admin/eventos/:id/aprovar:', err.message);
        return res.status(500).json({ erro: 'Erro ao aprovar evento.', detalhe: err.message });
    }
});

// 10.2. ROTA POST: REJEITAR EVENTO (ADMIN)
router.post('/admin/eventos/:id/rejeitar', verificarAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        if (!id) {
            return res.status(400).json({ erro: 'ID do evento é obrigatório' });
        }

        if (!motivo || !motivo.trim()) {
            return res.status(400).json({ erro: 'Motivo da rejeição é obrigatório' });
        }

        const eventoRejeitado = await require('./models/eventos').EventoModel.findByIdAndUpdate(
            id,
            { status: 'rejeitado', motivo_rejeicao: motivo.trim() },
            { new: true }
        );

        if (!eventoRejeitado) {
            return res.status(404).json({ erro: 'Evento não encontrado' });
        }

        return res.json({ mensagem: 'Evento rejeitado com sucesso', evento: eventoRejeitado });
    } catch (err) {
        console.error('Erro na rota POST /admin/eventos/:id/rejeitar:', err.message);
        return res.status(500).json({ erro: 'Erro ao rejeitar evento.', detalhe: err.message });
    }
});

// TEMPORÁRIO: APROVAR TODOS OS EVENTOS PENDENTES
router.post('/admin/aprovar-todos', verificarAdmin, async (req, res) => {
    try {
        const { EventoModel } = require('./models/eventos');
        const resultado = await EventoModel.updateMany(
            { status: 'pendente' },
            { status: 'aprovado', motivo_rejeicao: '' }
        );

        return res.json({
            mensagem: `Aprovados ${resultado.modifiedCount} eventos`,
            modificados: resultado.modifiedCount
        });
    } catch (err) {
        console.error('Erro ao aprovar todos:', err.message);
        return res.status(500).json({ erro: 'Erro ao aprovar eventos.', detalhe: err.message });
    }
});

// 11. ROTA GET: LISTAR MENSAGENS DE CONTATO (ADMIN)
router.get('/admin/mensagens', verificarAdmin, async (req, res) => {
    try {
        const mensagens = await Mensagem.find({}).sort({ respondida: 1, criadoEm: -1 });
        return res.json(mensagens);
    } catch (err) {
        console.error('Erro na rota GET /admin/mensagens:', err.message);
        return res.status(500).json({ erro: 'Erro ao buscar mensagens.', detalhe: err.message });
    }
});

// 11.2. ROTA GET: ESTATÍSTICAS DE ADMIN (COMPATIBILIDADE)
router.get('/admin/stats', verificarAdmin, async (req, res) => {
    try {
        const eventosPendentes = await require('./models/eventos').EventoModel.countDocuments({ status: 'pendente' });
        const mensagens = await Mensagem.find({}).sort({ respondida: 1, criadoEm: -1 });
        const respostasPendentes = Array.isArray(mensagens) ? mensagens.filter(msg => !msg.respondida).length : 0;

        return res.json({
            eventosPendentes,
            respostasPendentes,
            totalMensagens: Array.isArray(mensagens) ? mensagens.length : 0
        });
    } catch (err) {
        console.error('Erro na rota GET /admin/stats:', err.message);
        return res.status(500).json({ erro: 'Erro ao buscar estatísticas de admin.', detalhe: err.message });
    }
});

// 11.1. ROTA POST: RESPONDER MENSAGEM (ADMIN)
router.post('/admin/mensagens/:id/responder', verificarAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { resposta } = req.body;

        if (!id) {
            return res.status(400).json({ erro: 'ID da mensagem é obrigatório' });
        }

        if (!resposta || !resposta.trim()) {
            return res.status(400).json({ erro: 'Resposta é obrigatória' });
        }

        const mensagemAtualizada = await Mensagem.findByIdAndUpdate(
            id,
            { resposta: resposta.trim(), respondida: true, respondidoEm: new Date() },
            { new: true }
        );

        if (!mensagemAtualizada) {
            return res.status(404).json({ erro: 'Mensagem não encontrada' });
        }

        return res.json({ mensagem: 'Resposta enviada com sucesso', mensagem: mensagemAtualizada });
    } catch (err) {
        console.error('Erro na rota POST /admin/mensagens/:id/responder:', err.message);
        return res.status(500).json({ erro: 'Erro ao responder mensagem.', detalhe: err.message });
    }
});

// 9. ROTA PUT: ATUALIZAR USUÁRIO (COM AUTENTICAÇÃO)
router.put('/usuario/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, estado, cidade, preferencias } = req.body;
        
        if (!id) {
            return res.status(400).json({ erro: 'ID do usuário é obrigatório' });
        }

        // Verificar se o usuário está tentando atualizar sua própria conta
        // Converter para string para comparar (ObjectId vs string da URL)
        const tokenUserId = String(req.usuario?.id?.toString ? req.usuario.id.toString() : req.usuario?.id || '');
        const paramUserId = String(id);
        
        if (tokenUserId !== paramUserId) {
            return res.status(403).json({ erro: 'Você não tem permissão para atualizar esta conta' });
        }

        const updateData = { nome, estado, cidade, preferencias };
        if (typeof email !== 'undefined') updateData.email = email;

        const usuarioAtualizado = await atualizarUsuario(id, updateData);
        if (!usuarioAtualizado) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        return res.json(usuarioAtualizado);
    } catch (err) {
        console.error('Erro na rota PUT /usuario/:id:', err.message);
        return res.status(500).json({ erro: err.message || 'Erro ao atualizar usuário' });
    }
});

router.put('/usuarios/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, estado, cidade, preferencias } = req.body;
        
        if (!id) {
            return res.status(400).json({ erro: 'ID do usuário é obrigatório' });
        }

        // Verificar se o usuário está tentando atualizar sua própria conta
        // Converter para string para comparar (ObjectId vs string da URL)
        const tokenUserId = String(req.usuario?.id?.toString ? req.usuario.id.toString() : req.usuario?.id || '');
        const paramUserId = String(id);
        
        if (tokenUserId !== paramUserId) {
            return res.status(403).json({ erro: 'Você não tem permissão para atualizar esta conta' });
        }

        const updateData = { nome, estado, cidade, preferencias };
        if (typeof email !== 'undefined') updateData.email = email;

        const usuarioAtualizado = await atualizarUsuario(id, updateData);
        if (!usuarioAtualizado) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        return res.json(usuarioAtualizado);
    } catch (err) {
        console.error('Erro na rota PUT /usuarios/:id:', err.message);
        return res.status(500).json({ erro: err.message || 'Erro ao atualizar usuário' });
    }
});

// 10. ROTA DELETE: DELETAR USUÁRIO (COM AUTENTICAÇÃO)
router.delete('/usuario/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ erro: 'ID do usuário é obrigatório' });
        }

        // Verificar se o usuário está tentando deletar sua própria conta
        // Converter para string para comparar (ObjectId vs string da URL)
        const tokenUserId = String(req.usuario?.id?.toString ? req.usuario.id.toString() : req.usuario?.id || '');
        const paramUserId = String(id);
        
        if (tokenUserId !== paramUserId) {
            return res.status(403).json({ erro: 'Você não tem permissão para deletar esta conta' });
        }

        // Aqui você precisa implementar a função deletarUsuario
        const usuarioDeletado = await deletarUsuario(id);
        if (!usuarioDeletado) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        return res.json({ mensagem: 'Usuário deletado com sucesso' });
    } catch (err) {
        console.error('Erro na rota DELETE /usuario/:id:', err.message);
        return res.status(500).json({ erro: err.message || 'Erro ao deletar usuário' });
    }
});

router.delete('/usuarios/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ erro: 'ID do usuário é obrigatório' });
        }

        const tokenUserId = String(req.usuario?.id?.toString ? req.usuario.id.toString() : req.usuario?.id || '');
        const paramUserId = String(id);
        
        if (tokenUserId !== paramUserId) {
            return res.status(403).json({ erro: 'Você não tem permissão para deletar esta conta' });
        }

        const usuarioDeletado = await deletarUsuario(id);
        if (!usuarioDeletado) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        return res.json({ mensagem: 'Usuário deletado com sucesso' });
    } catch (err) {
        console.error('Erro na rota DELETE /usuarios/:id:', err.message);
        return res.status(500).json({ erro: err.message || 'Erro ao deletar usuário' });
    }
});

// Rota de debug para checar token
router.get('/auth/check', verificarToken, async (req, res) => {
    return res.json({
        status: 'token_valid',
        usuario: req.usuario,
        jwtSecretLength: (process.env.JWT_SECRET || '').length,
        now: new Date().toISOString()
    });
});

// Rota de debug para mostrar JWT_SECRET (sem autenticação)
router.get('/debug/jwt-secret-status', (req, res) => {
    const jwtSecret = process.env.JWT_SECRET || 'secret_key_fixa';
    return res.json({
        status: 'ok',
        jwtSecretLength: jwtSecret.length,
        hasJWT_SECRET: !!process.env.JWT_SECRET,
        jwtSecretPrefix: jwtSecret.substring(0, 10) + '...',
        allEnvVars: {
            NODE_ENV: process.env.NODE_ENV,
            JWT_SECRET: process.env.JWT_SECRET ? '***SET***' : 'NOT SET (usando fallback)',
            MONGO_URI: process.env.MONGO_URI ? '***SET***' : 'NOT SET',
            CORS_ORIGIN: process.env.CORS_ORIGIN
        }
    });
});

// Middleware para verificar token JWT
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        console.warn('⚠️ verificarToken: sem token no header');
        return res.status(401).json({ erro: 'Token de acesso necessário' });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET || 'secret_key_fixa';
        console.log(`🔐 verificarToken: tentando verificar com JWT_SECRET:`, jwtSecret.substring(0, 5) + '...');
        const decoded = require('jsonwebtoken').verify(token, jwtSecret);
        console.log(`✅ verificarToken: token válido`, decoded);
        req.usuario = decoded;
        next();
    } catch (err) {
        console.error(`❌ verificarToken erro:`, err.message, 'jurSecret length:', (process.env.JWT_SECRET || '').length);
        return res.status(403).json({ erro: 'Token inválido', details: err.message });
    }
}

async function verificarAdmin(req, res, next) {
    if (req.usuario?.cargo === 'adm') {
        return next();
    }

    try {
        if (req.usuario?.id) {
            const usuario = await Usuario.findById(req.usuario.id).lean();
            if (usuario && usuario.cargo === 'adm') {
                req.usuario.cargo = 'adm';
                return next();
            }
        }
    } catch (err) {
        console.error('Erro ao verificar admin:', err.message);
    }

    return res.status(403).json({ erro: 'Acesso negado. Você não é administrador.' });
}

module.exports = router;