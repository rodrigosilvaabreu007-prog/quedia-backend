const fs = require('fs');
const path = require('path');

// Caminho do arquivo de dados
const DB_FILE = path.join(__dirname, '../data.json');

// Estrutura padrão do banco
const DEFAULT_DB = {
  usuarios: [],
  eventos: [],
  contatos: [],
  mensagens: [],
  interesses: []
};

// Garantir que o diretório existe
function ensureDataDir() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Carregar dados do arquivo ou criar novo
function loadDatabase() {
  ensureDataDir();
  
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      console.log('✅ Banco de dados carregado do arquivo');
      return parsed;
    }
  } catch (err) {
    console.error('⚠️ Erro ao carregar banco de dados:', err.message);
  }

  console.log('📝 Criando novo banco de dados');
  return { ...DEFAULT_DB };
}

// Salvar dados no arquivo
function saveDatabase(db) {
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Erro ao salvar banco de dados:', err.message);
  }
}

// Carregar na inicialização
const db = loadDatabase();

// Adicionar função de save automático ao objeto db
db.save = () => saveDatabase(db);

module.exports = db;
