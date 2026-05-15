// ✅ NOVO SISTEMA DE CADASTRO COM VERIFICAÇÃO DE EMAIL + SMS

// ============ FIREBASE SMS SETUP ============
let confirmationResult = null;

// Carregar Firebase SDK dinamicamente
async function setupFirebase() {
  try {
    if (window.firebase) {
      console.log('✅ Firebase já carregado');
      return;
    }

    // Importar Firebase
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
    const { getAuth, RecaptchaVerifier, signInWithPhoneNumber } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
    
    window.firebase = { initializeApp, getAuth, RecaptchaVerifier, signInWithPhoneNumber };
    console.log('✅ Firebase SDK carregado');
  } catch (err) {
    console.warn('⚠️ Erro ao carregar Firebase SDK:', err.message);
    console.log('Continuando com SMS backend apenas...');
  }
}

async function setupRecaptchaFirebase() {
  try {
    if (!window.firebase) {
      console.warn('⚠️ Firebase não carregado para reCAPTCHA');
      return false;
    }

    const firebaseConfig = {
      apiKey: "AIzaSyAAFUAkXoeD1v52vdnLftdBcJ67KMXc3QQ",
      authDomain: "quedia-bd2fb.firebaseapp.com",
      projectId: "quedia-bd2fb",
      storageBucket: "quedia-bd2fb.firebasestorage.app",
      messagingSenderId: "71335996069",
      appId: "1:71335996069:web:ccac46471636450355bb4c"
    };

    const app = window.firebase.initializeApp(firebaseConfig);
    const auth = window.firebase.getAuth(app);
    auth.languageCode = 'pt-BR';
    window.firebaseAuth = auth;

    const container = document.getElementById('recaptcha-container');
    if (!container) {
      console.warn('⚠️ Container reCAPTCHA não encontrado');
      return false;
    }

    window.recaptchaVerifier = new window.firebase.RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        console.log('✅ reCAPTCHA verificado');
      },
      'error-callback': () => {
        console.warn('⚠️ Erro no reCAPTCHA');
        window.recaptchaVerifier = null;
      }
    });

    console.log('✅ reCAPTCHA Firebase configurado');
    return true;
  } catch (err) {
    console.warn('⚠️ Erro ao setup reCAPTCHA:', err.message);
    return false;
  }
}

// ============ ESTADO GLOBAL ============
// Estado global do cadastro
let estadoCadastro = {
  emailConfirmado: false,
  emailValidado: '',
  codigoEnviado: false,
  tentativasValidacao: 0,
  maxTentativas: 3,
  telefonePara: '',
  codigoSMSEnviado: false,
  dadosCadastro: {}
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
  document.getElementById('passo1')?.classList.remove('active');
  document.getElementById('passo2')?.classList.remove('active');
  document.getElementById('passo3')?.classList.remove('active');
  
  // Mostrar passo desejado
  const passoAtual = document.getElementById(`passo${numero}`);
  if (passoAtual) passoAtual.classList.add('active');
  
  // Atualizar indicador visual
  document.getElementById('step1-circle')?.classList.remove('completed', 'active');
  document.getElementById('step2-circle')?.classList.remove('completed', 'active');
  document.getElementById('step3-circle')?.classList.remove('active');
  document.getElementById('step-line-1')?.classList.remove('completed');
  document.getElementById('step-line-2')?.classList.remove('completed');
  
  if (numero === 1) {
    document.getElementById('step1-circle')?.classList.add('active');
  } else if (numero === 2) {
    document.getElementById('step1-circle')?.classList.add('completed');
    document.getElementById('step-line-1')?.classList.add('completed');
    document.getElementById('step2-circle')?.classList.add('active');
  } else if (numero === 3) {
    document.getElementById('step1-circle')?.classList.add('completed');
    document.getElementById('step2-circle')?.classList.add('completed');
    document.getElementById('step-line-1')?.classList.add('completed');
    document.getElementById('step-line-2')?.classList.add('completed');
    document.getElementById('step3-circle')?.classList.add('active');
  }

  window.scrollTo(0, 0);
}

// ============ PASSO 1: VERIFICAÇÃO DE EMAIL ============

document.addEventListener('DOMContentLoaded', () => {
  // Setup Firebase
  setupFirebase().then(() => {
    setupRecaptchaFirebase();
  });

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
    estadoCadastro.tentativasValidacao = 0;
    const codigoInput = document.getElementById('codigo-input');
    if (codigoInput) {
      codigoInput.value = '';
      codigoInput.disabled = false;
    }
    irParaPasso(1);
    ocultarMensagem('passo2-status');
  });

  // Botão para voltar ao passo 2
  document.getElementById('voltar-dados')?.addEventListener('click', (e) => {
    e.preventDefault();
    estadoCadastro.codigoSMSEnviado = false;
    const codigoSMSInput = document.getElementById('codigo-sms');
    if (codigoSMSInput) {
      codigoSMSInput.value = '';
      codigoSMSInput.disabled = false;
    }
    irParaPasso(2);
    ocultarMensagem('passo3-status');
  });

  // Validação automática do código quando digita 6 dígitos
  const codigoInputField = document.getElementById('codigo-input');
  if (codigoInputField) {
    codigoInputField.addEventListener('input', async (e) => {
      const codigo = e.target.value.trim();
      
      // Se atingiu 6 dígitos, valida automaticamente
      if (codigo.length === 6 && /^\d{6}$/.test(codigo)) {
        await validarCodigoEmailAutomatico();
      }
    });
  }

  // Form cadastro
  const form = document.getElementById('cadastro-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await irParaPasso3();
    });
  }

  // Form SMS
  const formularioSMS = document.getElementById('formulario-sms');
  if (formularioSMS) {
    formularioSMS.addEventListener('submit', async (e) => {
      e.preventDefault();
      await finalizarCadastroComSMS();
    });
  }

  // Reenviar SMS
  document.getElementById('reenviar-sms-link')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await enviarCodigoSMS(estadoCadastro.telefonePara);
  });

  // Formatação de telefone
  const telefoneInput = document.querySelector('input[name="telefone"]');
  if (telefoneInput) {
    telefoneInput.addEventListener('input', (e) => {
      const apenasNumeros = e.target.value.replace(/\D/g, '');
      
      if (apenasNumeros.length === 11) {
        e.target.value = apenasNumeros.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
      } else if (apenasNumeros.length > 7) {
        e.target.value = apenasNumeros.replace(/^(\d{2})(\d{5})(\d{0,4})$/, '($1) $2-$3').replace(/-$/, '');
      } else if (apenasNumeros.length > 2) {
        e.target.value = apenasNumeros.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
      }
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
        mostrarMensagem('passo2-status', '📧 Insira o código de confirmação recebido em seu email', 'info');
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

async function validarCodigoEmailAutomatico() {
  const codigoInput = document.getElementById('codigo-input');
  const codigo = codigoInput.value.trim();

  if (!codigo || codigo.length !== 6 || isNaN(codigo)) {
    return;
  }

  if (!estadoCadastro.emailValidado) {
    mostrarMensagem('passo2-status', '❌ Email não foi configurado. Volte ao passo 1.', 'error');
    return;
  }

  // Verificar tentativas
  if (estadoCadastro.tentativasValidacao >= estadoCadastro.maxTentativas) {
    mostrarMensagem('passo2-status', 
      '❌ Muitas tentativas. Solicite um novo código.', 
      'error');
    codigoInput.disabled = true;
    return;
  }

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
      mostrarMensagem('passo2-status', '✅ Código correto!', 'success');
      
      // Desabilitar o campo de código
      codigoInput.disabled = true;
    } else {
      estadoCadastro.tentativasValidacao++;
      const tentativasRestantes = estadoCadastro.maxTentativas - estadoCadastro.tentativasValidacao;
      
      // Limpar o campo para o usuário digitar novamente
      codigoInput.value = '';
      
      if (tentativasRestantes > 0) {
        mostrarMensagem('passo2-status', 
          `❌ Código incorreto. ${tentativasRestantes} tentativa${tentativasRestantes !== 1 ? 's' : ''} restante${tentativasRestantes !== 1 ? 's' : ''}.`, 
          'error');
      } else {
        mostrarMensagem('passo2-status', 
          '❌ Muitas tentativas. Solicite um novo código.', 
          'error');
        codigoInput.disabled = true;
      }
    }
  } catch (err) {
    console.error('Erro ao validar código:', err);
    mostrarMensagem('passo2-status', 
      '❌ Erro ao validar código. Tente novamente.', 
      'error');
  }
}

// ============ PASSO 3: SMS ============

async function enviarCodigoSMS(telefone) {
  try {
    const apenasNumeros = telefone.replace(/\D/g, '');
    
    console.log('📱 Enviando código SMS para:', apenasNumeros);
    mostrarMensagem('passo3-status', '⏳ Enviando SMS...', 'info');

    const resposta = await fetch(`${window.API_URL}/enviar-codigo-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone: apenasNumeros })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      estadoCadastro.codigoSMSEnviado = true;
      if (dados.codigo_demo) {
        mostrarMensagem('passo3-status', `✅ SMS enviado! (Demo: ${dados.codigo_demo})`, 'info');
      } else {
        mostrarMensagem('passo3-status', '✅ Código SMS enviado!', 'success');
      }
      return true;
    } else {
      mostrarMensagem('passo3-status', `❌ ${dados.erro || 'Erro ao enviar SMS'}`, 'error');
      return false;
    }
  } catch (err) {
    console.error('Erro ao enviar SMS:', err);
    mostrarMensagem('passo3-status', '❌ Erro ao enviar SMS. Tente novamente.', 'error');
    return false;
  }
}

async function irParaPasso3() {
  const form = document.getElementById('cadastro-form');
  const btnSubmit = form.querySelector('button[type="submit"]');
  
  // Feedback visual
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.textContent = '⏳ Processando...';
  }

  try {
    // Verificar se email foi confirmado
    if (!estadoCadastro.emailConfirmado) {
      mostrarMensagem('passo2-status', 
        '❌ Você deve confirmar seu email primeiro.', 
        'error');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Cadastrar';
      }
      return;
    }

    const nome = document.querySelector('input[name="nome"]').value.trim();
    const telefoneInput = document.querySelector('input[name="telefone"]').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;
    const estado = document.getElementById('estado').value;
    const cidade = document.getElementById('cidade').value;

    // Validações
    if (!nome) {
      mostrarMensagem('passo2-status', '❌ Nome é obrigatório.', 'error');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Cadastrar';
      }
      return;
    }

    if (!telefoneInput) {
      mostrarMensagem('passo2-status', '❌ Telefone é obrigatório.', 'error');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Cadastrar';
      }
      return;
    }

    // Validar telefone
    const apenasNumerosTel = telefoneInput.replace(/\D/g, '');
    if (apenasNumerosTel.length !== 11) {
      mostrarMensagem('passo2-status', '❌ Telefone inválido (11 dígitos obrigatório).', 'error');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Cadastrar';
      }
      return;
    }

    if (senha !== confirmarSenha) {
      mostrarMensagem('passo2-status', '❌ As senhas não coincidem.', 'error');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Cadastrar';
      }
      return;
    }

    if (senha.length < 6) {
      mostrarMensagem('passo2-status', '❌ Senha deve ter no mínimo 6 caracteres.', 'error');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Cadastrar';
      }
      return;
    }

    // Guardar dados para o passo 3
    estadoCadastro.telefonePara = apenasNumerosTel;
    estadoCadastro.dadosCadastro = {
      nome,
      email: estadoCadastro.emailValidado,
      telefone: apenasNumerosTel,
      senha,
      estado,
      cidade
    };

    // Atualizar display do telefone
    const telefoneMascarado = `(${apenasNumerosTel.slice(0,2)}) ${apenasNumerosTel.slice(2,7)}-${apenasNumerosTel.slice(7)}`;
    document.getElementById('telefone-display').textContent = telefoneMascarado;

    // Ir para passo 3
    irParaPasso(3);

    // Enviar SMS
    await enviarCodigoSMS(apenasNumerosTel);

  } catch (err) {
    console.error('Erro:', err);
    mostrarMensagem('passo2-status', '❌ Erro ao processar. Tente novamente.', 'error');
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Cadastrar';
    }
  }
}

async function finalizarCadastroComSMS() {
  const codigoSMSInput = document.getElementById('codigo-sms');
  const codigoSMS = codigoSMSInput.value.trim();
  const btnFinalizar = document.getElementById('btn-finalizar');

  if (!codigoSMS || codigoSMS.length !== 6 || isNaN(codigoSMS)) {
    mostrarMensagem('passo3-status', '❌ Código deve ter 6 dígitos.', 'error');
    return;
  }

  if (btnFinalizar) {
    btnFinalizar.disabled = true;
    btnFinalizar.textContent = '⏳ Finalizando...';
  }

  try {
    // Validar SMS com backend
    console.log('🔐 Validando código SMS...');
    const respostaValidacao = await fetch(`${window.API_URL}/validar-codigo-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telefone: estadoCadastro.telefonePara,
        codigo: codigoSMS
      })
    });

    const dadosValidacao = await respostaValidacao.json();

    if (!respostaValidacao.ok) {
      mostrarMensagem('passo3-status', `❌ ${dadosValidacao.erro || 'Código inválido'}`, 'error');
      if (btnFinalizar) {
        btnFinalizar.disabled = false;
        btnFinalizar.textContent = 'Finalizar Cadastro';
      }
      return;
    }

    // SMS validado! Completar cadastro
    mostrarMensagem('passo3-status', '✅ SMS validado!', 'success');

    const dadosCadastro = {
      nome: estadoCadastro.dadosCadastro.nome,
      email: estadoCadastro.dadosCadastro.email,
      telefone: estadoCadastro.dadosCadastro.telefone,
      senha: estadoCadastro.dadosCadastro.senha,
      estado: estadoCadastro.dadosCadastro.estado || 'Não informado',
      cidade: estadoCadastro.dadosCadastro.cidade || 'Não informado',
      telefone_verificado: true,
      sms_codigo: codigoSMS
    };

    console.log('📤 Enviando cadastro final...', dadosCadastro);

    const resposta = await fetch(`${window.API_URL}/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosCadastro)
    });

    const resultado = await resposta.json();

    if (resposta.ok) {
      mostrarMensagem('passo3-status', '✅ Cadastro finalizado com sucesso!', 'success');
      console.log('✅ Usuário criado:', resultado);
      
      setTimeout(() => {
        localStorage.setItem('usuario', JSON.stringify(resultado.usuario || { email: dadosCadastro.email }));
        window.location.href = 'login.html';
      }, 2000);
    } else {
      mostrarMensagem('passo3-status', `❌ ${resultado.erro || 'Erro ao finalizar cadastro'}`, 'error');
      if (btnFinalizar) {
        btnFinalizar.disabled = false;
        btnFinalizar.textContent = 'Finalizar Cadastro';
      }
    }
  } catch (err) {
    console.error('Erro:', err);
    mostrarMensagem('passo3-status', `❌ Erro ao finalizar: ${err.message}`, 'error');
    if (btnFinalizar) {
      btnFinalizar.disabled = false;
      btnFinalizar.textContent = 'Finalizar Cadastro';
    }
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
