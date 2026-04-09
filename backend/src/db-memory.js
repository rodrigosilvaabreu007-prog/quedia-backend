// Banco de dados em memória para fallback quando MONGO_URI não estiver configurado
const usuarios = [];
const eventos = [];
const interesses = []; // Array de { usuario_id, evento_id, data }

module.exports = {
    usuarios,
    eventos,
    interesses
};
