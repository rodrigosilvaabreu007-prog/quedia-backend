// ✅ NOVO SISTEMA DE CADASTRO COM VERIFICAÇÃO DE EMAIL

// Estado global do cadastro
let estadoCadastro = {
  emailConfirmado: false,
  emailValidado: '',
  codigoEnviado: false,
  tentativasValidacao: 0,
  maxTentativas: 3
};

// ============ FUNÇÕES AUXILIARES ============

function toggleSenha(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

function mostrarMensagem(elementoId, texto, tipo = 'info') {
  const elemento = document.getElementById(elementoId);
  if (elemento) {
    elemento.textContent = texto;
    elemento.className = `status-message ${tipo}`;
    elemento.style.display = 'block';
  }
}

function ocultarMensagem(elementoId) {
  const elemento = document.getElementById(elementoId);
  if (elemento) {
    elemento.style.display = 'none';
  }
}

function irParaPasso(numero) {
  // Ocultar todos os passos
  document.getElementById('passo1').classList.remove('active');
  document.getElementById('passo2').classList.remove('active');
  
  // Mostrar passo desejado
  document.getElementById(`passo${numero}`).classList.add('active');
  
  // Atualizar indicador visual
  document.getElementById('step1-circle').classList.remove('completed');
  document.getElementById('step2-circle').classList.remove('active');
  document.getElementById('step-line').classList.remove('completed');
  
  if (numero === 1) {
    document.getElementById('step1-circle').classList.add('active');
  } else {
    document.getElementById('step1-circle').classList.add('completed');
    document.getElementById('step2-circle').classList.add('active');
    document.getElementById('step-line').classList.add('completed');
  }
}

// ============ PASSO 1: VERIFICAÇÃO DE EMAIL ============

document.addEventListener('DOMContentLoaded', () => {
  const emailForm = document.getElementById('email-form');
  
  if (emailForm) {
    emailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await enviarCodigoEmail();
    });
  }

  // Popula Estados
  const estadoSelect = document.getElementById('estado');
  if (estadoSelect && typeof obterEstados === 'function') {
    obterEstados().forEach(estado => {
      const option = document.createElement('option');
      option.value = estado.sigla;
      option.textContent = estado.nome;
      estadoSelect.appendChild(option);
    });
  }

  // Inicializa seletor de categorias
  if (typeof inicializarSeletorCategorias === 'function') {
    inicializarSeletorCategorias('categorias-cadastro');
  }

  // Botão para voltar ao passo 1
  document.getElementById('voltar-email')?.addEventListener('click', (e) => {
    e.preventDefault();
    estadoCadastro.emailConfirmado = false;
    estadoCadastro.codigoEnviado = false;
    const btnValidar = document.getElementById('validar-codigo-btn');
    if (btnValidar) {
      btnValidar.style.display = 'inline-flex';
      btnValidar.disabled = false;
      btnValidar.textContent = 'Confirmar Código';
    }
    const codigoInput = document.getElementById('codigo-input');
    if (codigoInput) {
      codigoInput.value = '';
      codigoInput.disabled = false;
    }
    irParaPasso(1);
    ocultarMensagem('passo2-status');
  });

  // Botão validar código
  document.getElementById('validar-codigo-btn')?.addEventListener('click', async () => {
    await validarCodigoEmail();
  });

  // Form cadastro
  const form = document.getElementById('cadastro-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await completarCadastro();
    });
  }
});

async function enviarCodigoEmail() {
  const emailInput = document.getElementById('email-input');
  const email = emailInput.value.trim().toLowerCase();
  const btnSubmit = document.querySelector('#email-form button[type="submit"], #email-form input[type="submit"]');

  // Validar email
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexEmail.test(email)) {
    mostrarMensagem('passo1-status', '❌ Email inválido. Digite um email válido.', 'error');
    return;
  }

  // Desabilitar botão e mostrar loading
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.textContent = '⏳ Enviando...';
  }
  ocultarMensagem('passo1-status');

  try {
    const resposta = await fetch(`${window.API_URL}/enviar-codigo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      estadoCadastro.emailValidado = email;
      estadoCadastro.codigoEnviado = true;
      
      // Se em modo demo, mostrar o código
      if (dados.codigo_demo) {
        mostrarMensagem('passo1-status', 
          `✅ Código enviado! (Demo: ${dados.codigo_demo})`, 
          'info');
      } else {
        mostrarMensagem('passo1-status', 
          `✅ Código enviado para ${dados.email_mascarado}. Verifique seu email!`, 
          'success');
      }

      // Ir para passo 2 após 1 segundo
      setTimeout(() => {
        irParaPasso(2);
      }, 1000);
    } else {
      mostrarMensagem('passo1-status', `❌ ${dados.erro || 'Erro ao enviar código'}`, 'error');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Enviar Código';
      }
    }
  } catch (err) {
    console.error('Erro ao enviar código:', err);
    mostrarMensagem('passo1-status', 
      '❌ Erro ao conectar com o servidor. Tente novamente.', 
      'error');
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Enviar Código';
    }
  }
}

async function validarCodigoEmail() {
  const codigoInput = document.getElementById('codigo-input');
  const codigo = codigoInput.value.trim();
  const btnValidar = document.getElementById('validar-codigo-btn');

  if (!codigo || codigo.length !== 6 || isNaN(codigo)) {
    mostrarMensagem('passo2-status', '❌ Digite um código válido (6 dígitos)', 'error');
    return;
  }

  if (!estadoCadastro.emailValidado) {
    mostrarMensagem('passo2-status', '❌ Email não foi configurado. Volte ao passo 1.', 'error');
    return;
  }

  // Verificar tentativas
  if (estadoCadastro.tentativasValidacao >= estadoCadastro.maxTentativas) {
    mostrarMensagem('passo2-status', 
      '❌ Muitas tentativas. Solicit um novo código.', 
      'error');
    return;
  }

  // Desabilitar botão e mostrar loading
  btnValidar.disabled = true;
  btnValidar.textContent = '⏳ Validando...';

  try {
    const resposta = await fetch(`${window.API_URL}/validar-codigo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: estadoCadastro.emailValidado,
        codigo: codigo
      })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      estadoCadastro.emailConfirmado = true;
      mostrarMensagem('passo2-status', '✅ Confirmado', 'success');
      
      // Ocultar botão de confirmar e desabilitar o campo
      if (btnValidar) {
        btnValidar.style.display = 'none';
      }
      codigoInput.disabled = true;
    } else {
      estadoCadastro.tentativasValidacao++;
      const tentativasRestantes = estadoCadastro.maxTentativas - estadoCadastro.tentativasValidacao;
      
      mostrarMensagem('passo2-status', 
        `❌ ${dados.erro || 'Código inválido'}. ${tentativasRestantes} tentativas restantes.`, 
        'error');
      
      btnValidar.disabled = false;
      btnValidar.textContent = 'Confirmar Código';
    }
  } catch (err) {
    console.error('Erro ao validar código:', err);
    mostrarMensagem('passo2-status', 
      '❌ Erro ao validar código. Tente novamente.', 
      'error');
    btnValidar.disabled = false;
    btnValidar.textContent = 'Confirmar Código';
  }
}

// ============ PASSO 2: COMPLETAR CADASTRO ============

async function completarCadastro() {
  const form = document.getElementById('cadastro-form');
  const btnSubmit = form.querySelector('button[type="submit"]');
  const mensagem = document.getElementById('mensagem-cadastro');

  // Feedback visual
  btnSubmit.disabled = true;
  btnSubmit.textContent = '⏳ Cadastrando...';
  ocultarMensagem('passo2-status');

  // Verificar se email foi confirmado
  if (!estadoCadastro.emailConfirmado) {
    mostrarMensagem('passo2-status', 
      '❌ Você deve confirmar seu email primeiro.', 
      'error');
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Cadastrar';
    return;
  }

  const nome = document.querySelector('input[name="nome"]').value.trim();
  const senha = document.getElementById('senha').value;
  const confirmarSenha = document.getElementById('confirmar-senha').value;
  const estado = document.getElementById('estado').value;
  const cidade = document.getElementById('cidade').value;
  const preferencias = Array.from(
    document.querySelectorAll('input[name^="subcat-"]:checked')
  ).map(cb => cb.value);

  // Validações
  if (!nome) {
    mostrarMensagem('passo2-status', '❌ Nome é obrigatório.', 'error');
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Cadastrar';
    return;
  }

  if (senha !== confirmarSenha) {
    mostrarMensagem('passo2-status', '❌ As senhas não coincidem.', 'error');
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Cadastrar';
    return;
  }

  if (senha.length < 6) {
    mostrarMensagem('passo2-status', '❌ Senha deve ter no mínimo 6 caracteres.', 'error');
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Cadastrar';
    return;
  }

  const dados = {
    nome: nome,
    email: estadoCadastro.emailValidado,
    senha: senha,
    estado: estado || 'Não informado',
    cidade: cidade || 'Não informado',
    preferencias: preferencias
  };

  try {
    const resposta = await fetch(`${window.API_URL}/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();

    if (resposta.ok) {
      mostrarMensagem('passo2-status', 
        '✅ Cadastro realizado com sucesso! Redirecionando...', 
        'success');
      
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else {
      mostrarMensagem('passo2-status', 
        resultado.erro || '❌ Erro ao cadastrar.', 
        'error');
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Cadastrar';
    }
  } catch (err) {
    console.error('Erro crítico:', err);
    mostrarMensagem('passo2-status', 
      '❌ Erro ao conectar com o servidor.', 
      'error');
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Cadastrar';
  }
}

// Função para atualizar cidades dinamicamente
function atualizarCidades() {
  const estado = document.getElementById('estado').value;
  const cidadeSelect = document.getElementById('cidade');

  if (!estado) {
    cidadeSelect.innerHTML = '<option value="">Selecione primeiro um estado</option>';
    cidadeSelect.disabled = true;
    return;
  }

  const cidades = typeof obterCidades === 'function' ? obterCidades(estado) : [];
  cidadeSelect.innerHTML = '<option value="">Selecione uma cidade</option>';

  cidades.forEach(cidade => {
    const option = document.createElement('option');
    option.value = cidade;
    option.textContent = cidade;
    cidadeSelect.appendChild(option);
  });

  cidadeSelect.disabled = false;
}
