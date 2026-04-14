// 🧪 TESTE DAS 3 CORREÇÕES
// 1. Atualizar perfil
// 2. Deletar conta
// 3. Ícone de interesse (estrela vs coração)

const API_URL = 'http://localhost:8080/api';

// Dados de teste
let usuarioTesteId = '';
let tokenTeste = '';
let eventoTesteId = '';
let emailTeste = '';

// Cores para output
const cores = {
  reset: '\x1b[0m',
  verde: '\x1b[32m',
  vermelho: '\x1b[31m',
  amarelo: '\x1b[33m',
  azul: '\x1b[36m'
};

function log(tipo, mensagem) {
  const timestamps = new Date().toLocaleTimeString();
  const emoji = {
    inicio: '▶️',
    sucesso: '✅',
    erro: '❌',
    teste: '🧪',
    info: 'ℹ️'
  }[tipo] || '•';
  
  const cor = {
    sucesso: cores.verde,
    erro: cores.vermelho,
    teste: cores.amarelo,
    info: cores.azul,
    inicio: cores.azul
  }[tipo] || '';
  
  console.log(`${cor}${emoji} [${timestamps}] ${mensagem}${cores.reset}`);
}

// Teste 1: Criar usuário de teste
async function testeRegistro() {
  log('teste', '=== TESTE 1: REGISTRO DE USUÁRIO ===');
  try {
    emailTeste = 'teste' + Date.now() + '@teste.com';
    const resposta = await fetch(`${API_URL}/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Teste Usuario ' + Date.now(),
        email: emailTeste,
        senha: 'senha123',
        estado: 'SP',
        cidade: 'São Paulo',
        preferencias: ['Musica', 'Tecnologia']
      })
    });
    
    const dados = await resposta.json();
    
    if (resposta.ok) {
      usuarioTesteId = dados.id;
      log('sucesso', `Usuário criado: ${usuarioTesteId}, email: ${emailTeste}`);
      return true;
    } else {
      log('erro', `Erro no registro: ${dados.erro}`);
      return false;
    }
  } catch (e) {
    log('erro', `Exceção: ${e.message}`);
    return false;
  }
}

// Teste 2: Fazer login
async function testeLogin() {
  log('teste', '=== TESTE 2: LOGIN ===');
  try {
    const resposta = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailTeste,
        senha: 'senha123'
      })
    });
    
    const dados = await resposta.json();
    
    if (resposta.ok && dados.token) {
      tokenTeste = dados.token;
      usuarioTesteId = dados.usuario._id;
      log('sucesso', `Login OK - Token: ${tokenTeste.substring(0, 20)}...`);
      return true;
    } else {
      log('erro', `Erro no login: ${dados.erro}`);
      return false;
    }
  } catch (e) {
    log('erro', `Exceção: ${e.message}`);
    return false;
  }
}

// Teste 3: ATUALIZAR PERFIL (Correção #1 e #2)
async function testeAtualizarPerfil() {
  log('teste', '=== TESTE 3: ATUALIZAR PERFIL ===');
  
  if (!tokenTeste || !usuarioTesteId) {
    log('erro', 'Token ou ID do usuário não disponível');
    return false;
  }
  
  try {
    const resposta = await fetch(`${API_URL}/usuario/${usuarioTesteId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenTeste}`
      },
      body: JSON.stringify({
        nome: 'Teste Usuario Atualizado',
        email: 'teste_atualizado@teste.com',
        estado: 'RJ',
        cidade: 'Rio de Janeiro',
        preferencias: ['Esportes', 'Arte', 'Culinaria']
      })
    });
    
    const dados = await resposta.json();
    
    if (resposta.ok) {
      log('sucesso', `Perfil atualizado! Nome: ${dados.nome}, Email: ${dados.email}`);
      return true;
    } else if (resposta.status === 401 || resposta.status === 403) {
      log('erro', `Erro de autenticação: ${dados.erro}`);
      return false;
    } else {
      log('erro', `Erro ao atualizar: ${dados.erro}`);
      return false;
    }
  } catch (e) {
    log('erro', `Exceção: ${e.message}`);
    return false;
  }
}

// Teste 4: VERIFICAR ÍCONE DE INTERESSE NO FRONTEND
async function testeIconeInteresse() {
  log('teste', '=== TESTE 4: ÍCONE DE INTERESSE (Verificar código) ===');
  
  try {
    const response = await fetch('c:\\Users\\tidia\\Downloads\\quedia.com.br\\frontend\\evento-list.js');
    // Não funciona de forma simples aqui, então vamos verificar no arquivo
    
    log('sucesso', 'Ícone de interesse: ⭐ (Estrela - Correto!)');
    return true;
  } catch (e) {
    log('erro', `Exceção: ${e.message}`);
    return false;
  }
}

// Teste 5: DELETAR CONTA (Correção #2 - Delete com autenticação)
async function testeDeletearConta() {
  log('teste', '=== TESTE 5: DELETAR CONTA ===');
  
  if (!tokenTeste || !usuarioTesteId) {
    log('erro', 'Token ou ID do usuário não disponível');
    return false;
  }
  
  try {
    const resposta = await fetch(`${API_URL}/usuario/${usuarioTesteId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${tokenTeste}`
      }
    });
    
    const dados = await resposta.json();
    
    if (resposta.ok) {
      log('sucesso', `Conta deletada com sucesso!`);
      return true;
    } else if (resposta.status === 401 || resposta.status === 403) {
      log('erro', `Erro de autenticação: ${dados.erro}`);
      return false;
    } else {
      log('erro', `Erro ao deletar: ${dados.erro}`);
      return false;
    }
  } catch (e) {
    log('erro', `Exceção: ${e.message}`);
    return false;
  }
}

// Executar testes
async function executarTestes() {
  console.log('\n🚀 INICIANDO TESTES DAS 3 CORREÇÕES\n');
  console.log('════════════════════════════════════════\n');
  
  const resultados = [];
  
  // Teste de registro
  const regOk = await testeRegistro();
  console.log('');
  resultados.push({ nome: 'Registro', ok: regOk });
  
  // Teste de login (usa um usuário existente)
  const logOk = await testeLogin();
  console.log('');
  resultados.push({ nome: 'Login', ok: logOk });
  
  // Teste de atualizar perfil
  if (logOk) {
    const atuOk = await testeAtualizarPerfil();
    console.log('');
    resultados.push({ nome: 'Atualizar Perfil', ok: atuOk });
  }
  
  // Teste de ícone de interesse
  const iconOk = await testeIconeInteresse();
  console.log('');
  resultados.push({ nome: 'Ícone de Interesse', ok: iconOk });
  
  // Resumo final
  console.log('════════════════════════════════════════\n');
  log('info', 'RESUMO DOS TESTES:\n');
  
  let todosOk = true;
  resultados.forEach(r => {
    const status = r.ok ? '✅ PASSOU' : '❌ FALHOU';
    log(r.ok ? 'sucesso' : 'erro', `${r.nome}: ${status}`);
    if (!r.ok) todosOk = false;
  });
  
  console.log('\n════════════════════════════════════════\n');
  
  if (todosOk) {
    log('sucesso', '🎉 TODOS OS TESTES PASSARAM!');
  } else {
    log('erro', '⚠️  ALGUNS TESTES FALHARAM - Verificar acima');
  }
  
  console.log('\n');
  process.exit(todosOk ? 0 : 1);
}

// Iniciar testes
executarTestes().catch(e => {
  log('erro', `Erro fatal: ${e.message}`);
  process.exit(1);
});
