const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const jwt = require('jsonwebtoken');
const connectDB = require('./db'); 
const { cadastrarEvento, listarEventos } = require('./eventos');

// Configuração do Cloudinary (usando suas credenciais)
cloudinary.config({
    cloud_name: 'dphg1u2i7',
    api_key: '727437553221359',
    api_secret: 'ZHFHP0BAGjldGes6Uz8Ur6RBEb0'
});

// Configuração do Storage para o Multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'quedia_eventos',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const upload = multer({ storage: storage });

// Rota para Cadastrar Evento
router.post('/eventos', upload.any(), async (req, res) => {
    try {
        // Garante conexão com o banco para evitar o erro de "buffering timed out"
        await connectDB();

        let linksImagens = req.files ? req.files.map(f => f.path) : [];
        let organizador_id = "sistema";
        
        // Verifica se há um token de usuário para vincular o evento
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'quedia_secret_123');
                organizador_id = decoded.id;
            } catch (e) {
                console.log("Token não processado ou inválido");
            }
        }

        // Monta o objeto final para o banco
        const dadosEvento = {
            ...req.body,
            imagens: linksImagens,
            organizador_id: String(organizador_id),
            // Força a conversão de tipos para evitar erros de busca no frontend
            preco: parseFloat(req.body.preco) || 0,
            gratuito: req.body.gratuito === 'true' || req.body.gratuito === true
        };

        const novoEvento = await cadastrarEvento(dadosEvento);
        res.status(201).json({ mensagem: 'Evento criado com sucesso!', evento: novoEvento });
    } catch (err) {
        console.error("Erro ao salvar evento:", err);
        res.status(500).json({ erro: "Erro interno ao salvar no banco de dados." });
    }
});

// Rota para Listar Eventos
router.get('/eventos', async (req, res) => {
    try {
        await connectDB();
        const eventos = await listarEventos(req.query);
        res.json(eventos || []);
    } catch (err) {
        console.error("Erro ao listar eventos:", err);
        res.status(500).json({ erro: 'Erro ao buscar eventos no servidor.' });
    }
});

module.exports = router;