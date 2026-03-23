const Evento = require('./models/Evento');

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dbSql = require('./db-sql');
const nodemailer = require('nodemailer');

// 🔍 Rota de verificação de email
router.get('/verificar-email', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ erro: 'Email é obrigatório' });
        
        const existe = await dbSql.verificarEmailExistente(email);
        res.json({ existe });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao verificar email', detalhes: err.message });
    }
});

// 📝 Rota de cadastro
router.post('/cadastro', async (req, res) => {
    try {
        const { nome, email, senha, estado, cidade, preferencias } = req.body;
        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
        }

        const id = await dbSql.registrarUsuario({
            nome, email, senha,
            estado: estado || 'Não informado',
            cidade: cidade || 'Não informado',
            preferencias
        });

        res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!', id });
    } catch (err) {
        if (err.message.includes('Email já cadastrado')) {
            return res.status(400).json({ erro: 'Email já cadastrado' });
        }
        res.status(500).json({ erro: 'Erro ao cadastrar usuário', detalhes: err.message });
    }
});

// 🔑 Rota de login
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const usuario = await dbSql.autenticarUsuario(email, senha);
        
        if (!usuario) {
            return res.status(401).json({ erro: 'Email ou senha inválidos' });
        }

        const token = jwt.sign(
            { id: usuario.id, tipo: usuario.tipo },
            process.env.JWT_SECRET || 'chave_mestra_eventhub',
            { expiresIn: '24h' }
        );
        
        res.json({ usuario, token });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao autenticar', detalhes: err.message });
    }
});

// 📅 Rota para listar eventos
router.get('/eventos', async (req, res) => {
    try {
        const { organizador_id } = req.query;
        let eventos;
        
        // Valida se o organizador_id é um número válido antes de consultar
        if (organizador_id && !isNaN(organizador_id)) {
            eventos = await dbSql.obterEventosPorOrganizador(parseInt(organizador_id));
        } else {
            eventos = await dbSql.listarEventos();
        }
        
        res.json(eventos || []);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar eventos', detalhes: err.message });
    }
});

// ➕ Rota para cadastrar evento
router.post('/eventos', async (req, res) => {
    try {
        const evento = new Evento({
            ...req.body,
            organizador_id: parseInt(req.body.organizador_id) || 1,
            preco: parseFloat(req.body.preco) || 0,
            gratuito: req.body.gratuito === 'true' || req.body.gratuito === true
        });

        await evento.save();

        res.status(201).json({ 
            mensagem: 'Evento cadastrado com sucesso!', 
            id: evento._id 
        });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao cadastrar evento' });
    }
});

// 🔄 Rota para atualizar evento
router.put('/eventos/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ erro: 'ID inválido' });

        await dbSql.atualizarEvento(id, req.body);
        res.json({ mensagem: 'Evento atualizado com sucesso!' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao atualizar evento', detalhes: err.message });
    }
});

// 🗑️ Rota para deletar evento
router.delete('/eventos/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ erro: 'ID inválido' });

        await dbSql.deletarEvento(id);
        res.json({ mensagem: 'Evento deletado com sucesso!' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao deletar evento', detalhes: err.message });
    }
});

// ❤️ Marcar interesse
router.post('/eventos/:id/interesse', async (req, res) => {
    try {
        const evento_id = parseInt(req.params.id);
        const usuario_id = parseInt(req.body.usuario_id);

        if (!usuario_id) return res.status(400).json({ erro: 'ID do usuário é obrigatório' });

        await dbSql.marcarInteresse(usuario_id, evento_id);
        const total = await dbSql.contarInteressados(evento_id);
        res.json({ total });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao marcar interesse' });
    }
});

// 👤 Obter perfil do usuário
router.get('/usuarios/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        // Ajustado para usar uma lógica de busca segura (simulando que seu db-sql tenha uma busca por ID)
        const usuario = await dbSql.obterUsuarioId ? await dbSql.obterUsuarioId(id) : null;
        
        if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });
        
        // Remove a senha antes de enviar para o front por segurança
        delete usuario.senha;
        res.json(usuario);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar usuário' });
    }
});

// 📧 Rota de contato
router.post('/contato', async (req, res) => {
    const { nome, email, mensagem } = req.body;
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("⚠️ Serviço de e-mail não configurado nas variáveis de ambiente.");
        return res.status(503).json({ erro: 'Serviço de e-mail temporariamente indisponível.' });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        await transporter.sendMail({
            from: email,
            to: process.env.EMAIL_USER,
            subject: `Contato EventHub de ${nome}`,
            text: `Mensagem de: ${nome} (${email})\n\n${mensagem}`
        });

        res.json({ mensagem: 'Mensagem enviada com sucesso!' });
    } catch (err) {
        console.error("Erro no Nodemailer:", err);
        res.status(500).json({ erro: 'Erro ao enviar e-mail. Tente novamente mais tarde.' });
    }
});

module.exports = router;