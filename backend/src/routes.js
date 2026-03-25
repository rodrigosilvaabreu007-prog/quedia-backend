const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const jwt = require('jsonwebtoken');
const connectDB = require('./db'); 

const { registrarUsuario, autenticarUsuario } = require('./autenticacao');
const { cadastrarEvento, listarEventos } = require('./eventos');

cloudinary.config({
    cloud_name: 'dphg1u2i7',
    api_key: '727437553221359',
    api_secret: 'ZHFHP0BAGjldGes6Uz8Ur6RBEb0'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'quedia_eventos',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'jfif'],
    },
});

const upload = multer({ storage: storage });

// Rota de teste para ver se o back responde rápido
router.get('/ping', (req, res) => res.send('pong'));

router.get('/verificar-email', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ erro: 'Email não fornecido' });

        const db = await connectDB(); // GARANTE A CONEXÃO AQUI
        const usuario = await db.collection('usuarios').findOne({ email: email.trim() });
        res.json({ disponivel: !usuario });
    } catch (err) {
        console.error("Erro verificar-email:", err);
        res.status(500).json({ erro: 'Erro no servidor ao verificar email' });
    }
});

router.post('/cadastro', async (req, res) => {
    try {
        await connectDB(); // GARANTE A CONEXÃO
        const id = await registrarUsuario(req.body);
        res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!', id });
    } catch (err) {
        res.status(400).json({ erro: err.message || 'Erro ao realizar cadastro' });
    }
});

router.post('/login', async (req, res) => {
    try {
        await connectDB();
        const { email, senha } = req.body;
        const resultado = await autenticarUsuario(email, senha);
        if (!resultado) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
        res.json({ usuario: resultado.usuario, token: resultado.token });
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
});

router.post('/eventos', upload.any(), async (req, res) => {
    try {
        await connectDB(); // O PULO DO GATO: Espera o banco antes de tentar salvar
        let linksImagens = req.files ? req.files.map(f => f.path) : [];
        let organizador_id = "sistema";
        
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_fixa');
                organizador_id = decoded.id;
            } catch (e) {
                console.log("Token inválido");
            }
        }

        const dadosEvento = {
            ...req.body,
            imagens: linksImagens,
            organizador_id: organizador_id,
            preco: parseFloat(req.body.preco) || 0,
            gratuito: req.body.gratuito === 'true' || req.body.gratuito === true
        };

        const novoEvento = await cadastrarEvento(dadosEvento);
        res.status(201).json({ mensagem: 'Evento criado!', evento: novoEvento });
    } catch (err) {
        console.error("Erro ao criar evento:", err);
        res.status(500).json({ erro: "Erro ao salvar no banco. Tente novamente em instantes." });
    }
});

router.get('/eventos', async (req, res) => {
    try {
        await connectDB();
        const eventos = await listarEventos(req.query);
        res.json(eventos || []);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar eventos' });
    }
});

module.exports = router;