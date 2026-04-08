// Banco de dados em memória para fallback quando MONGO_URI não estiver configurado
const usuarios = [];
const eventos = [];

module.exports = {
    usuarios,
    eventos
};
