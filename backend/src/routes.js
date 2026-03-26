const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const connectDB = require('./db'); 
const { cadastrarEvento, listarEventos } = require('./eventos');

// Configuração do Cloudinary
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

// Middleware para garantir banco conectado em TODAS as rotas deste arquivo
router.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(500).json({ erro: "Erro de conexão com o banco de dados" });
    }
});

router.post('/eventos', upload.any(), async (req, res) => {
    try {
        // Se chegou aqui, o middleware acima já garantiu o banco.
        // O upload.any() já terminou de subir pro Cloudinary.

        const linksImagens = req.files ? req.files.map(f => f.path) : [];
        
        // --- LIMPEZA DE DADOS "ANTI-ERRO 400" ---
        // O parseFloat ou Number falha se a string vier com "R$" ou pontos decimais errados
        let precoLimpo = 0;
        if (req.body.preco) {
            precoLimpo = Number(String(req.body.preco).replace('R$', '').replace(',', '.').trim()) || 0;
        }

        const dadosEvento = {
            nome: req.body.nome || "Evento sem nome",
            descricao: req.body.descricao || "",
            cidade: req.body.cidade || "",
            estado: req.body.estado || "",
            local: req.body.local || "",
            data: req.body.data || "",
            horario: req.body.horario || "",
            categoria: req.body.categoria || "Outros",
            subcategorias: req.body.subcategorias || [],
            imagens: linksImagens,
            preco: precoLimpo,
            gratuito: req.body.gratuito === 'true' || precoLimpo === 0,
            organizador_id: req.body.organizador_id || "sistema"
        };

        const novoEvento = await cadastrarEvento(dadosEvento);
        res.status(201).json({ mensagem: 'Evento criado!', evento: novoEvento });

    } catch (err) {
        console.error("Erro ao salvar:", err.message);
        res.status(500).json({ erro: "Falha ao salvar evento: " + err.message });
    }
});

router.get('/eventos', async (req, res) => {
    try {
        const eventos = await listarEventos(req.query);
        res.json(eventos || []);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar eventos.' });
    }
});

module.exports = router;