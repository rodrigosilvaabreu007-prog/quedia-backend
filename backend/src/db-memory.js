// Banco de dados em memória para fallback quando MONGO_URI não estiver configurado
const usuarios = [];
const eventos = [];
const contatos = []; // Array de mensagens de contato

module.exports = {
    usuarios,
    eventos,
    contatos
};
