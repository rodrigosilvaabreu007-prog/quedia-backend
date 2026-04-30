// Banco de dados em memória para fallback quando MONGO_URI não estiver configurado
const usuarios = [];
const eventos = [];
const contatos = []; // Array de mensagens de contato
const mensagens = []; // Array de mensagens de contato (novo)
const interesses = []; // Array de interesses

module.exports = {
    usuarios,
    eventos,
    contatos,
    mensagens,
    interesses
};
