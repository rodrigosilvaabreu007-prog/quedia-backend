const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

// Configuração do caminho do banco (Produção vs Local)
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/tmp/usuarios.db' 
    : path.join(__dirname, 'usuarios.db');

const db = new Database(dbPath);

// Criar tabelas se não existirem
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    estado TEXT,
    cidade TEXT,
    tipo TEXT DEFAULT 'comum',
    preferencias TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL,
    estado TEXT,
    cidade TEXT NOT NULL,
    endereco TEXT,
    data TEXT,
    horario TEXT,
    categoria TEXT,
    subcategorias TEXT,
    gratuito BOOLEAN,
    preco REAL,
    imagem TEXT,
    organizador_id INTEGER,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(organizador_id) REFERENCES usuarios(id)
  );

  CREATE TABLE IF NOT EXISTS interesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    evento_id INTEGER NOT NULL,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY(evento_id) REFERENCES eventos(id)
  );
`);

// Preparar consultas (STMTs)
const stmts = {
  // Usuários
  insertUsuario: db.prepare(`INSERT INTO usuarios (nome, email, senha, estado, cidade, preferencias, tipo) VALUES (?, ?, ?, ?, ?, ?, 'comum')`),
  selectUsuarioEmail: db.prepare('SELECT * FROM usuarios WHERE email = ?'),
  selectUsuarioId: db.prepare('SELECT id, nome, email, estado, cidade, tipo, preferencias FROM usuarios WHERE id = ?'),
  
  // Eventos
  insertEvento: db.prepare(`
    INSERT INTO eventos (nome, descricao, estado, cidade, endereco, data, horario, categoria, subcategorias, gratuito, preco, imagem, organizador_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  selectAllEventos: db.prepare('SELECT * FROM eventos ORDER BY criado_em DESC'),
  selectEventosPorOrganizador: db.prepare('SELECT * FROM eventos WHERE organizador_id = ?'),
  updateEvento: db.prepare(`
    UPDATE eventos SET nome=?, descricao=?, estado=?, cidade=?, endereco=?, data=?, horario=?, categoria=?, gratuito=?, preco=?, imagem=?
    WHERE id=?
  `),
  deleteEvento: db.prepare('DELETE FROM eventos WHERE id = ?'),
  
  // Interesses
  insertInteresse: db.prepare('INSERT INTO interesses (usuario_id, evento_id) VALUES (?, ?)'),
  countInteresses: db.prepare('SELECT COUNT(*) as total FROM interesses WHERE evento_id = ?')
};

module.exports = {
  registrarUsuario: async (dados) => {
    const { nome, email, senha, estado, cidade, preferencias } = dados;
    const senhaCriptografada = await bcrypt.hash(senha, 10);
    const prefs = Array.isArray(preferencias) ? JSON.stringify(preferencias) : '[]';
    try {
      const result = stmts.insertUsuario.run(nome, email, senhaCriptografada, estado, cidade, prefs);
      return result.lastID;
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) throw new Error('Email já cadastrado');
      throw err;
    }
  },

  autenticarUsuario: async (email, senha) => {
    const usuario = stmts.selectUsuarioEmail.get(email);
    if (!usuario) return null;
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) return null;
    return {
      id: usuario.id, nome: usuario.nome, email: usuario.email, 
      cidade: usuario.cidade, estado: usuario.estado,
      preferencias: usuario.preferencias ? JSON.parse(usuario.preferencias) : []
    };
  },

  obterUsuarioId: (id) => {
    const usuario = stmts.selectUsuarioId.get(id);
    if (usuario && usuario.preferencias) {
      usuario.preferencias = JSON.parse(usuario.preferencias);
    }
    return usuario;
  },

  cadastrarEvento: (dados) => {
    const { nome, descricao, estado, cidade, endereco, data, horario, gratuito, preco, organizador_id, categoria, subcategorias, imagem } = dados;
    const subJson = Array.isArray(subcategorias) ? subcategorias.join(',') : '';
    const isGratuito = (gratuito === true || gratuito === 'true' || gratuito === 1) ? 1 : 0;
    const result = stmts.insertEvento.run(nome, descricao, estado, cidade, endereco, data, horario, categoria, subJson, isGratuito, preco || 0, imagem || '', organizador_id || 1);
    return result.lastID;
  },

  atualizarEvento: (id, dados) => {
    const { nome, descricao, estado, cidade, endereco, data, horario, categoria, gratuito, preco, imagem } = dados;
    const isGratuito = (gratuito === true || gratuito === 'true' || gratuito === 1) ? 1 : 0;
    return stmts.updateEvento.run(nome, descricao, estado, cidade, endereco, data, horario, categoria, isGratuito, preco || 0, imagem || '', id);
  },

  deletarEvento: (id) => {
    return stmts.deleteEvento.run(id);
  },

  listarEventos: () => {
    return stmts.selectAllEventos.all().map(e => ({ ...e, gratuito: !!e.gratuito }));
  },

  obterEventosPorOrganizador: (id) => {
    return stmts.selectEventosPorOrganizador.all(id).map(e => ({ ...e, gratuito: !!e.gratuito }));
  },

  verificarEmailExistente: (email) => {
    return !!stmts.selectUsuarioEmail.get(email);
  },

  marcarInteresse: (usuario_id, evento_id) => {
    try { return stmts.insertInteresse.run(usuario_id, evento_id).lastID; } 
    catch (e) { return null; } // Ignora se o usuário já marcou interesse
  },

  contarInteressados: (evento_id) => {
    const res = stmts.countInteresses.get(evento_id);
    return res ? res.total : 0;
  }
};