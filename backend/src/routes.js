const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { connectDB } = require('./db'); 
const { registrarUsuario, autenticarUsuario, buscarUsuarioPorId, atualizarUsuario, deletarUsuario } = require('./autenticacao');

// 1. IMPORTAÇÃO DOS MODELS (Caminho corrigido para a pasta models)
const { cadastrarEvento, listarEventos, listarEventosComInteresses, deletarEvento, buscarEventoPorId } = require('./models/eventos');
const { adicionarInteresse, removerInteresse, usuarioTemInteresse, contarInteresses, listarInteressesUsuario, removerInteressesPorUsuario, listarInteressesEvento } = require('./models/interesses');

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
const nodemailer = require('nodemailer');

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'quedia.com.br@gmail.com';
const SMTP_USER = process.env.SMTP_USER || process.env.SMTP_EMAIL || 'quedia.com.br@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || '';

const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    }
});

async function enviarEmailContato({ nome, email, mensagem }) {
    if (!SMTP_PASS) {
        throw new Error('SMTP credentials não configuradas. Defina SMTP_PASS ou SMTP_PASSWORD.');
    }

    const mailOptions = {
        from: `Quedia Contato <${SMTP_USER}>`,
        to: CONTACT_EMAIL,
        replyTo: `${nome} <${email}>`,
        subject: `Contato do site: ${nome}`,
        text: `Nova mensagem de contato\n\nNome: ${nome}\nEmail: ${email}\nMensagem:\n${mensagem}`
    };

    return mailTransporter.sendMail(mailOptions);
}

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
        const eventos = await listarEventosComInteresses(req.query);
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

// 6. ROTA POST: CADASTRO DE USUÁRIO
router.post('/cadastro', async (req, res) => {
    try {
        const { nome, email, senha, estado, cidade, preferencias } = req.body;
        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
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

// 8. ROTA POST: CONTATO (apenas usuários logados podem enviar)
router.post('/contato', verificarToken, async (req, res) => {
    try {
        const { nome, email, mensagem } = req.body;
        if (!nome || !email || !mensagem) {
            return res.status(400).json({ erro: 'Nome, email e mensagem são obrigatórios' });
        }

        await enviarEmailContato({ nome, email, mensagem });
        return res.json({ mensagem: 'Mensagem enviada com sucesso! Entraremos em contato em breve.' });
    } catch (err) {
        console.error('Erro na rota POST /contato:', err.message);
        return res.status(500).json({ erro: 'Erro ao enviar mensagem. Verifique a configuração de e-mail.', detalhe: err.message });
    }
});

// 9. ROTA GET: BUSCAR USUÁRIO POR ID
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

        // Aqui você precisa implementar a função atualizarUsuario
        // Por enquanto, vou usar uma implementação simples
        const usuarioAtualizado = await atualizarUsuario(id, { nome, email, estado, cidade, preferencias });
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

        const tokenUserId = String(req.usuario?.id?.toString ? req.usuario.id.toString() : req.usuario?.id || '');
        const paramUserId = String(id);
        
        if (tokenUserId !== paramUserId) {
            return res.status(403).json({ erro: 'Você não tem permissão para atualizar esta conta' });
        }

        const usuarioAtualizado = await atualizarUsuario(id, { nome, email, estado, cidade, preferencias });
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

        // Limpar interesses relacionados (evita interesses fantasmas após exclusão)
        await removerInteressesPorUsuario(id);

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

        await removerInteressesPorUsuario(id);

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

// --- ROTAS DE INTERESSES ---

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

// 11. ROTA POST: TOGGLE INTERESSE (adicionar/remover)
router.post('/interesses', verificarToken, async (req, res) => {
    try {
        const { evento_id } = req.body;
        
        // Extrair usuario_id do token com validação rigorosa
        let usuario_id = req.usuario?.id;
        if (!usuario_id) {
            console.warn('⚠️ POST /interesses: usuario_id inválido no token:', req.usuario);
            return res.status(401).json({ erro: 'Usuario_id inválido no token' });
        }
        usuario_id = String(usuario_id).trim();
        
        if (!usuario_id) {
            console.warn('⚠️ POST /interesses: usuario_id vazio após conversão');
            return res.status(401).json({ erro: 'Usuario_id vazio' });
        }

        if (!evento_id) {
            return res.status(400).json({ erro: 'ID do evento é obrigatório' });
        }

        // Verificar se já tem interesse
        const jaTemInteresse = await usuarioTemInteresse(usuario_id, evento_id);

        let resultado;
        if (jaTemInteresse) {
            // Remover interesse
            resultado = await removerInteresse(usuario_id, evento_id);
        } else {
            // Adicionar interesse
            resultado = await adicionarInteresse(usuario_id, evento_id);
        }

        // Retornar dados atualizados
        const contador = await contarInteresses(evento_id);
        const interessesIds = await listarInteressesEvento(evento_id);
        const temInteresse = !jaTemInteresse;
        
        return res.json({ 
            mensagem: jaTemInteresse ? 'Interesse removido' : 'Interesse adicionado', 
            acao: jaTemInteresse ? 'removido' : 'adicionado',
            temInteresse,
            contador: contador,
            interesses: interessesIds
        });
    } catch (err) {
        console.error('Erro na rota POST /interesses:', err.message);
        return res.status(500).json({ erro: err.message || 'Erro ao processar interesse' });
    }
});

// 12.1 ROTA GET: CONTADOR PÚBLICO DE INTERESSES (SEM AUTENTICAÇÃO)
router.get('/interesses/contador/:evento_id', async (req, res) => {
    try {
        const { evento_id } = req.params;
        if (!evento_id) {
            return res.status(400).json({ erro: 'ID do evento é obrigatório' });
        }

        const contador = await contarInteresses(evento_id);
        return res.json({ contador });
    } catch (err) {
        console.error('Erro na rota GET /interesses/contador/:evento_id:', err.message);
        return res.status(500).json({ erro: err.message || 'Erro ao contar interesses' });
    }
});

// 12. ROTA GET: VERIFICAR SE USUÁRIO TEM INTERESSE
router.get('/interesses/:evento_id', verificarToken, async (req, res) => {
    try {
        const { evento_id } = req.params;
        
        // Extrair usuario_id do token com validação
        let usuario_id = req.usuario?.id;
        if (!usuario_id) {
            return res.status(401).json({ erro: 'Usuario_id inválido no token' });
        }
        usuario_id = String(usuario_id).trim();

        const temInteresse = await usuarioTemInteresse(usuario_id, evento_id);
        const contador = await contarInteresses(evento_id);

        return res.json({ 
            temInteresse, 
            contador,
            evento_id,
            usuario_id 
        });
    } catch (err) {
        console.error('Erro na rota GET /interesses/:evento_id:', err.message);
        return res.status(500).json({ erro: err.message || 'Erro ao verificar interesse' });
    }
});

// 13. ROTA GET: LISTAR INTERESSES DO USUÁRIO
router.get('/interesses/usuario/:usuario_id', verificarToken, async (req, res) => {
    try {
        const { usuario_id } = req.params;
        
        // Extrair usuario_id do token com validação
        let tokenUserId = req.usuario?.id;
        if (!tokenUserId) {
            return res.status(401).json({ erro: 'Usuario_id inválido no token' });
        }
        tokenUserId = String(tokenUserId).trim();

        // Verificar se o usuário está pedindo seus próprios interesses
        if (String(usuario_id).trim() !== tokenUserId) {
            return res.status(403).json({ erro: 'Acesso negado' });
        }

        const interesses = await listarInteressesUsuario(usuario_id);
        return res.json({ interesses });
    } catch (err) {
        console.error('Erro na rota GET /interesses/usuario/:usuario_id:', err.message);
        return res.status(500).json({ erro: err.message || 'Erro ao listar interesses' });
    }
});

module.exports = router;