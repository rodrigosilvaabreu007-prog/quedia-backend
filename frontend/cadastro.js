// ✅ NOVO SISTEMA DE CADASTRO COM VERIFICAÇÃO DE EMAIL E SMS

// Estado global do cadastro
let estadoCadastro = {
  emailConfirmado: false,
  emailValidado: '',
  codigoEnviado: false,
  tentativasValidacao: 0,
  maxTentativas: 3,
  // SMS
  telefonePara: '',
  codigoSMSEnviado: false,
  tentativasSMS: 0,
  maxTentativasSMS: 3
};

// ============ FUNÇÕES AUXILIARES ============

function toggleSenha(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ✅ Formatar e validar telefone brasileiro
function formatarTelefone(telefone) {
  // Remove tudo que não é número
  const apenasNumeros = telefone.replace(/\D/g, '');
  
  // Valida se tem 11 dígitos (código de área + 9 dígitos)
  if (apenasNumeros.length !== 11) {
    return null;
  }
  
  // Formata: (XX) 9XXXX-XXXX
  const formatted = apenasNumeros.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  return formatted !== apenasNumeros ? formatted : null;
}

function validarTelefone(telefone) {
  const apenasNumeros = telefone.replace(/\D/g, '');
  
  // Deve ter 11 dígitos
  if (apenasNumeros.length !== 11) {
    return { valido: false, mensagem: 'Telefone deve ter 11 dígitos (XX) 9XXXX-XXXX' };
  }
  
  // Primeiro dígito do código de área não pode ser 0
  if (apenasNumeros[0] === '0') {
    return { valido: false, mensagem: 'Código de área inválido' };
  }
  
  // Segundo dígito do código de área não pode ser 0
  if (apenasNumeros[1] === '0') {
    return { valido: false, mensagem: 'Código de área inválido' };
  }
  
  // Nono dígito (primeiro após código de área) deve ser 9 para celular
  if (apenasNumeros[2] !== '9') {
    return { valido: false, mensagem: 'Deve ser um celular (9XXXX-XXXX)' };
  }
  
  return { valido: true, telefone: apenasNumeros };
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
  document.getElementById('passo3').classList.remove('active');
  
  // Mostrar passo desejado
  document.getElementById(`passo${numero}`).classList.add('active');
  
  // Atualizar indicador visual
  document.getElementById('step1-circle').classList.remove('completed');
  document.getElementById('step2-circle').classList.remove('completed');
  document.getElementById('step2-circle').classList.remove('active');
  document.getElementById('step3-circle').classList.remove('active');
  document.getElementById('step-line-1').classList.remove('completed');
  document.getElementById('step-line-2').classList.remove('completed');
  
  if (numero === 1) {
    document.getElementById('step1-circle').classList.add('active');
  } else if (numero === 2) {
    document.getElementById('step1-circle').classList.add('completed');
    document.getElementById('step-line-1').classList.add('completed');
    document.getElementById('step2-circle').classList.add('active');
  } else if (numero === 3) {
    document.getElementById('step1-circle').classList.add('completed');
    document.getElementById('step2-circle').classList.add('completed');
    document.getElementById('step-line-1').classList.add('completed');
    document.getElementById('step-line-2').classList.add('completed');
    document.getElementById('step3-circle').classList.add('active');
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
    estadoCadastro.tentativasSMS = 0;
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

  // Validação automática do código SMS
  const codigoSMSField = document.getElementById('codigo-sms');
  if (codigoSMSField) {
    codigoSMSField.addEventListener('input', async (e) => {
      const codigo = e.target.value.trim();
      
      // Se atingiu 6 dígitos, valida automaticamente
      if (codigo.length === 6 && /^\d{6}$/.test(codigo)) {
        await validarCodigoSMSAutomatico();
      }
    });
  }

  // Formatação automática de telefone
  const telefoneInput = document.getElementById('telefone-input');
  if (telefoneInput) {
    telefoneInput.addEventListener('input', (e) => {
      const telefone = e.target.value;
      const apenasNumeros = telefone.replace(/\D/g, '');
      
      // Limita a 11 dígitos
      if (apenasNumeros.length > 11) {
        e.target.value = apenasNumeros.slice(0, 11).replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        return;
      }
      
      // Formata enquanto digita
      if (apenasNumeros.length === 11) {
        e.target.value = apenasNumeros.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
      } else if (apenasNumeros.length > 7) {
        e.target.value = apenasNumeros.replace(/^(\d{2})(\d{5})(\d{0,4})$/, '($1) $2-$3').replace(/-$/, '');
      } else if (apenasNumeros.length > 2) {
        e.target.value = apenasNumeros.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
      } else if (apenasNumeros.length > 0) {
        e.target.value = apenasNumeros.replace(/^(\d{0,2})$/, '($1');
      }
    });

    // Validação ao sair do campo
    telefoneInput.addEventListener('blur', (e) => {
      const telefone = e.target.value.trim();
      const telefoneErro = document.getElementById('telefone-erro');
      
      if (telefone === '') {
        if (telefoneErro) telefoneErro.style.display = 'none';
        return;
      }
      
      const validacao = validarTelefone(telefone);
      if (!validacao.valido) {
        if (telefoneErro) {
          telefoneErro.textContent = validacao.mensagem;
          telefoneErro.style.display = 'block';
        }
      } else {
        if (telefoneErro) telefoneErro.style.display = 'none';
      }
    });
  }

  // Form para enviar SMS
  const formularioSMS = document.getElementById('formulario-sms');
  if (formularioSMS) {
    formularioSMS.addEventListener('submit', async (e) => {
      e.preventDefault();
      await finalizarCadastro();
    });
  }

  // Reenviar SMS
  document.getElementById('reenviar-sms-link')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await enviarCodigoSMS(estadoCadastro.telefonePara, true);
  });
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

// ============ PASSO 2: COMPLETAR CADASTRO ============

function irParaPasso3() {
  const form = document.getElementById('cadastro-form');
  
  // Validações do passo 2
  const nome = document.querySelector('input[name="nome"]').value.trim();
  const telefone = document.getElementById('telefone-input').value.trim();
  const senha = document.getElementById('senha').value;
  const confirmarSenha = document.getElementById('confirmar-senha').value;
  const estado = document.getElementById('estado').value;
  const cidade = document.getElementById('cidade').value;

  // Verificar se email foi confirmado
  if (!estadoCadastro.emailConfirmado) {
    mostrarMensagem('passo2-status', 
      '❌ Você deve confirmar seu email primeiro.', 
      'error');
    return;
  }

  if (!nome) {
    mostrarMensagem('passo2-status', '❌ Nome é obrigatório.', 'error');
    return;
  }

  if (!telefone) {
    mostrarMensagem('passo2-status', '❌ Telefone é obrigatório.', 'error');
    return;
  }

  // Validar telefone
  const validacaoTelefone = validarTelefone(telefone);
  if (!validacaoTelefone.valido) {
    mostrarMensagem('passo2-status', `❌ ${validacaoTelefone.mensagem}`, 'error');
    return;
  }

  if (senha !== confirmarSenha) {
    mostrarMensagem('passo2-status', '❌ As senhas não coincidem.', 'error');
    return;
  }

  if (senha.length < 6) {
    mostrarMensagem('passo2-status', '❌ Senha deve ter no mínimo 6 caracteres.', 'error');
    return;
  }

  // Guardar dados para usar depois
  estadoCadastro.telefonePara = validacaoTelefone.telefone;
  
  // Exibir telefone formatado
  const telefoneMascarado = `(${validacaoTelefone.telefone.slice(0, 2)}) ${validacaoTelefone.telefone.slice(2, 7)}-${validacaoTelefone.telefone.slice(7)}`;
  document.getElementById('telefone-display').textContent = telefoneMascarado;

  // Ir para passo 3
  ocultarMensagem('passo2-status');
  irParaPasso(3);
  mostrarMensagem('passo3-status', '📱 Código de SMS será enviado para seu telefone', 'info');
  
  // Enviar código SMS
  enviarCodigoSMS(validacaoTelefone.telefone);
}

async function enviarCodigoSMS(telefone, reenviar = false) {
  try {
    const mensagem = reenviar ? '⏳ Reenviando...' : '⏳ Enviando código...';
    mostrarMensagem('passo3-status', mensagem, 'info');

    const resposta = await fetch(`${window.API_URL}/enviar-codigo-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      estadoCadastro.codigoSMSEnviado = true;
      
      if (dados.codigo_demo) {
        mostrarMensagem('passo3-status', 
          `✅ Código enviado por SMS! (Demo: ${dados.codigo_demo})`, 
          'info');
      } else {
        mostrarMensagem('passo3-status', 
          '✅ Código enviado por SMS. Verifique sua caixa de mensagens!', 
          'success');
      }

      // Limpar campo e focar
      const codigoSMSInput = document.getElementById('codigo-sms');
      codigoSMSInput.value = '';
      codigoSMSInput.disabled = false;
      codigoSMSInput.focus();
    } else {
      mostrarMensagem('passo3-status', 
        `❌ ${dados.erro || 'Erro ao enviar código por SMS'}`, 
        'error');
    }
  } catch (err) {
    console.error('Erro ao enviar SMS:', err);
    mostrarMensagem('passo3-status', 
      '❌ Erro ao enviar SMS. Tente novamente.', 
      'error');
  }
}

async function validarCodigoSMSAutomatico() {
  const codigoInput = document.getElementById('codigo-sms');
  const codigo = codigoInput.value.trim();

  if (!codigo || codigo.length !== 6 || isNaN(codigo)) {
    return;
  }

  if (!estadoCadastro.telefonePara) {
    mostrarMensagem('passo3-status', '❌ Telefone não foi configurado.', 'error');
    return;
  }

  // Verificar tentativas
  if (estadoCadastro.tentativasSMS >= estadoCadastro.maxTentativasSMS) {
    mostrarMensagem('passo3-status', 
      '❌ Muitas tentativas. Solicite um novo código.', 
      'error');
    codigoInput.disabled = true;
    return;
  }

  try {
    const resposta = await fetch(`${window.API_URL}/validar-codigo-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telefone: estadoCadastro.telefonePara,
        codigo: codigo
      })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      mostrarMensagem('passo3-status', '✅ Código SMS validado!', 'success');
      codigoInput.disabled = true;
      
      // Finalizar cadastro após 1 segundo
      setTimeout(() => {
        finalizarCadastro();
      }, 1000);
    } else {
      estadoCadastro.tentativasSMS++;
      const tentativasRestantes = estadoCadastro.maxTentativasSMS - estadoCadastro.tentativasSMS;
      
      codigoInput.value = '';
      
      if (tentativasRestantes > 0) {
        mostrarMensagem('passo3-status', 
          `❌ Código SMS incorreto. ${tentativasRestantes} tentativa${tentativasRestantes !== 1 ? 's' : ''} restante${tentativasRestantes !== 1 ? 's' : ''}.`, 
          'error');
      } else {
        mostrarMensagem('passo3-status', 
          '❌ Muitas tentativas. Solicite um novo código.', 
          'error');
        codigoInput.disabled = true;
      }
    }
  } catch (err) {
    console.error('Erro ao validar SMS:', err);
    mostrarMensagem('passo3-status', 
      '❌ Erro ao validar SMS. Tente novamente.', 
      'error');
  }
}

// ============ PASSO 3: FINALIZAR CADASTRO ============

async function finalizarCadastro() {
  const nome = document.querySelector('input[name="nome"]').value.trim();
  const email = estadoCadastro.emailValidado;
  const telefone = estadoCadastro.telefonePara;
  const senha = document.getElementById('senha').value;
  const estado = document.getElementById('estado').value;
  const cidade = document.getElementById('cidade').value;
  const preferencias = Array.from(
    document.querySelectorAll('input[name^="subcat-"]:checked')
  ).map(cb => cb.value);

  const btnSubmit = document.getElementById('btn-finalizar');
  btnSubmit.disabled = true;
  btnSubmit.textContent = '⏳ Finalizando cadastro...';
  ocultarMensagem('passo3-status');

  const dados = {
    nome: nome,
    email: email,
    telefone: telefone,
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
      mostrarMensagem('passo3-status', 
        '✅ Cadastro realizado com sucesso! Redirecionando...', 
        'success');
      
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else {
      mostrarMensagem('passo3-status', 
        resultado.erro || '❌ Erro ao cadastrar.', 
        'error');
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Finalizar Cadastro';
    }
  } catch (err) {
    console.error('Erro crítico:', err);
    mostrarMensagem('passo3-status', 
      '❌ Erro ao conectar com o servidor.', 
      'error');
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Finalizar Cadastro';
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
