const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken'); // Para ler o ID do organizador do token

const { registrarUsuario, autenticarUsuario } = require(path.join(__dirname, 'autenticacao.js'));
const { cadastrarEvento, listarEventos } = require(path.join(__dirname, 'eventos.js'));
const { marcarInteresse, contarInteressados } = require(path.join(__dirname, 'interesse.js'));

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
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }] 
    },
});

const upload = multer({ storage: storage });

// --- ROTA DE VERIFICAÇÃO DE EMAIL ---
router.get('/verificar-email', async (req, res) => {
    res.json({ disponivel: true });
});

// --- ROTAS DE AUTENTICAÇÃO ---
router.post('/cadastro', async (req, res) => {
    try {
        const id = await registrarUsuario(req.body);
        res.status(201).json({ mensagem: 'Usuário cadastrado!', id });
    } catch (err) {
        res.status(400).json({ erro: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const resultado = await autenticarUsuario(email, senha);
        if (!resultado) return res.status(401).json({ erro: 'Inválido' });
        res.json({ usuario: resultado.usuario, token: resultado.token });
    } catch (err) {
        res.status(400).json({ erro: err.message });
    }
});

// --- ROTA DE EVENTOS (Ajustada para pegar o ID do dono) ---
router.post('/eventos', upload.array('imagens', 5), async (req, res) => {
    try {
        let linksImagens = [];
        if (req.files) linksImagens = req.files.map(f => f.path);

        // EXTRAIR ID DO USUÁRIO DO TOKEN
        let organizador_id = null;
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.decode(token); // Decodifica o token enviado pelo front
            organizador_id = decoded ? decoded.id : null;
        }

        const dadosEvento = {
            ...req.body,
            imagens: linksImagens,
            organizador_id: organizador_id, // Vincula o evento ao dono
            gratuito: req.body.gratuito === 'true', // Garante que vire booleano
            preco: parseFloat(req.body.preco) || 0
        };

        const novoEvento = await cadastrarEvento(dadosEvento);
        res.status(201).json({ mensagem: 'Evento criado!', evento: novoEvento });
    } catch (err) {
        console.error(err);
        res.status(400).json({ erro: 'Erro ao cadastrar', detalhes: err.message });
    }
});

router.get('/eventos', async (req, res) => {
    try {
        const eventos = await listarEventos(req.query);
        res.json(eventos || []); // Nunca retorna erro, retorna lista vazia se não achar
    } catch (err) {
        res.json([]); 
    }
});

module.exports = router;