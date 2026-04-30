const API_URL = 'https://us-central1-quedia-backend.cloudfunctions.net/api';

// Função para aprovar todos os eventos pendentes
async function aprovarTodosEventos() {
    try {
        // Primeiro, buscar eventos pendentes (precisa de token admin)
        console.log('Buscando eventos pendentes...');

        // Como não temos token aqui, vamos fazer uma requisição direta ao banco
        // Mas como é Cloud Function, melhor criar um endpoint temporário

        console.log('Para aprovar eventos, acesse: https://quedia-bd2fb.web.app/admin-eventos.html');
        console.log('Login como admin: rodrigo.silva.abreu554466@gmail.com');
        console.log('Senha: Rdrg_2007');

    } catch (error) {
        console.error('Erro:', error);
    }
}

aprovarTodosEventos();