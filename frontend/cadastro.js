// ✅ URL DA API (definida no global.js)

// Função para mostrar/esconder senha
function toggleSenha(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ✅ VALIDAÇÃO DE EMAIL COM DEBOUNCE (Evita excesso de requisições)
let timeoutEmail;
function validarEmail() {
  clearTimeout(timeoutEmail);
  const emailInput = document.getElementById('email');
  if (!emailInput) return;
  
  const email = emailInput.value.trim();
  const erroDiv = document.getElementById('email-erro');
  
  if (email.length === 0) {
    erroDiv.style.display = 'none';
    return;
  }

  // Regex básico de validação
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    erroDiv.textContent = 'Email inválido';
    erroDiv.style.display = 'block';
    return;
  }

  // Espera 500ms depois que o usuário para de digitar para consultar o banco
  timeoutEmail = setTimeout(() => {
    fetch(`${window.API_URL}/verificar-email?email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.disponivel === false) {
          erroDiv.textContent = 'Email já cadastrado';
          erroDiv.style.display = 'block';
        } else {
          erroDiv.style.display = 'none';
        }
      })
      .catch(err => console.error('Erro ao verificar email:', err));
  }, 500);
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

// Inicialização da página (Estados e Categorias)
document.addEventListener('DOMContentLoaded', () => {
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

  // Inicializa seletor de categorias igual ao formulário de evento
  if (typeof inicializarSeletorCategorias === 'function') {
    inicializarSeletorCategorias('categorias-cadastro');
  }

});

// ✅ SUBMIT DO FORMULÁRIO DE CADASTRO
const form = document.getElementById('cadastro-form');
const mensagem = document.getElementById('mensagem-cadastro');

if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    
    // Feedback visual de carregando
    const btnSubmit = form.querySelector('button[type="submit"]');
    if (btnSubmit) btnSubmit.disabled = true;

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;
    const nomeInput = document.querySelector('input[name="nome"]');

    if (senha !== confirmarSenha) {
      mensagem.textContent = 'As senhas não coincidem.';
      mensagem.style.color = '#ff4444';
      if (btnSubmit) btnSubmit.disabled = false;
      return;
    }
    
    const dados = {
      nome: nomeInput ? nomeInput.value.trim() : 'Usuário',
      email: email,
      senha: senha,
      estado: document.getElementById('estado').value,
      cidade: document.getElementById('cidade').value,
      preferencias: Array.from(document.querySelectorAll('input[name^="subcat-"]:checked')).map(cb => cb.value)
    };

    try {
      const resposta = await fetch(`${window.API_URL}/cadastro`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      
      const resultado = await resposta.json();

      if (resposta.ok) {
        mensagem.textContent = 'Cadastro realizado com sucesso! Redirecionando...';
        mensagem.style.color = '#00ff00';
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
      } else {
        mensagem.textContent = resultado.erro || 'Erro ao cadastrar.';
        mensagem.style.color = '#ff4444';
        if (btnSubmit) btnSubmit.disabled = false;
      }
    } catch (err) {
      console.error('💥 Erro Crítico:', err);
      mensagem.textContent = 'Erro ao conectar com o servidor.';
      mensagem.style.color = '#ff4444';
      if (btnSubmit) btnSubmit.disabled = false;
    }
  });
}