const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { connectDB } = require('./db'); 
const { registrarUsuario, autenticarUsuario, buscarUsuarioPorId, atualizarUsuario, deletarUsuario } = require('./autenticacao');

// 1. IMPORTAÇÃO DOS MODELS (Caminho corrigido para a pasta models)
const { cadastrarEvento, listarEventos, deletarEvento } = require('./models/eventos');
const { adicionarInteresse, removerInteresse, usuarioTemInteresse, contarInteresses, listarInteressesUsuario, removerInteressesPorUsuario } = require('./models/interesses');

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

// 3. MIDDLEWARE DE CONEXÃO (Garante banco ativo em cada chamada)
router.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error("Erro de conexão no middleware:", err.message);
        res.status(500).json({ erro: "Erro de conexão com o banco de dados" });
    }
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
        const dadosEvento = {
            nome: req.body.nome || "Evento sem nome",
            descricao: req.body.descricao || "",
            cidade: req.body.cidade || "",
            estado: req.body.estado || "",
            local: req.body.local || "", // Mapeado do campo 'endereco' do frontend
            data: req.body.data || "",
            horario: req.body.horario || "",
            categoria: req.body.categoria || "Outros",
            subcategorias: Array.isArray(req.body.subcategorias) 
                ? req.body.subcategorias 
                : [req.body.subcategorias].filter(Boolean),
            imagens: linksImagens,
            preco: precoLimpo,
            gratuito: String(req.body.gratuito) === 'true' || precoLimpo === 0,
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
    try {
        const eventos = await listarEventos(req.query);
        res.json(eventos || []);
    } catch (err) {
        console.error("Erro na rota GET /eventos:", err.message);
        res.status(500).json({ erro: 'Erro ao buscar eventos.' });
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
        const tokenUserId = String(req.usuario.id);
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

// 10. ROTA DELETE: DELETAR USUÁRIO (COM AUTENTICAÇÃO)
router.delete('/usuario/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ erro: 'ID do usuário é obrigatório' });
        }

        // Verificar se o usuário está tentando deletar sua própria conta
        // Converter para string para comparar (ObjectId vs string da URL)
        const tokenUserId = String(req.usuario.id);
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

// --- ROTAS DE INTERESSES ---

// Middleware para verificar token JWT
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ erro: 'Token de acesso necessário' });
    }

    try {
        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'secret_key_fixa');
        req.usuario = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ erro: 'Token inválido' });
    }
}

// 11. ROTA POST: TOGGLE INTERESSE (adicionar/remover)
router.post('/interesses', verificarToken, async (req, res) => {
    try {
        const { evento_id } = req.body;
        const usuario_id = req.usuario.id;

        if (!evento_id) {
            return res.status(400).json({ erro: 'ID do evento é obrigatório' });
        }

        // Verificar se já tem interesse
        const jaTemInteresse = await usuarioTemInteresse(usuario_id, evento_id);

        let resultado;
        if (jaTemInteresse) {
            // Remover interesse
            resultado = await removerInteresse(usuario_id, evento_id);
            return res.json({ 
                mensagem: 'Interesse removido', 
                acao: 'removido',
                contador: await contarInteresses(evento_id)
            });
        } else {
            // Adicionar interesse
            resultado = await adicionarInteresse(usuario_id, evento_id);
            if (resultado) {
                return res.json({ 
                    mensagem: 'Interesse adicionado', 
                    acao: 'adicionado',
                    contador: await contarInteresses(evento_id)
                });
            } else {
                return res.status(409).json({ erro: 'Interesse já existe' });
            }
        }
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
        const usuario_id = req.usuario.id;

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

        // Verificar se o usuário está pedindo seus próprios interesses
        if (usuario_id !== req.usuario.id) {
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