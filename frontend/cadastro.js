// Função para mostrar/esconder senha
function toggleSenha(inputId) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}

// Função para validar email
function validarEmail() {
  const emailInput = document.getElementById('email');
  const email = emailInput.value.trim();
  const erroDiv = document.getElementById('email-erro');
  
  if (email.length === 0) {
    erroDiv.style.display = 'none';
    erroDiv.textContent = '';
    return;
  }
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    erroDiv.textContent = 'Email inválido';
    erroDiv.style.display = 'block';
    return;
  }
  
  // ✅ Usando a rota correta de verificação
  fetch(`/api/verificar-email?email=${encodeURIComponent(email)}`)
    .then(res => res.json())
    .then(data => {
      if (data.existe) {
        erroDiv.textContent = 'Email já cadastrado';
        erroDiv.style.display = 'block';
      } else {
        erroDiv.style.display = 'none';
        erroDiv.textContent = '';
      }
    })
    .catch(err => console.error('Erro ao verificar email:', err));
}

// Função para atualizar cidades quando estado muda
function atualizarCidades() {
  const estado = document.getElementById('estado').value;
  const cidadeSelect = document.getElementById('cidade');
  
  if (!estado) {
    cidadeSelect.innerHTML = '<option value="">Selecione primeiro um estado</option>';
    cidadeSelect.disabled = true;
    return;
  }
  
  // Assumindo que obterCidades vem do estados-cidades.js
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

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
  const estadoSelect = document.getElementById('estado');
  if (estadoSelect && typeof obterEstados === 'function') {
    const estados = obterEstados();
    estados.forEach(estado => {
      const option = document.createElement('option');
      option.value = estado.sigla;
      option.textContent = estado.nome;
      estadoSelect.appendChild(option);
    });
  }
  
  const containerPreferencias = document.getElementById('preferencias-categorias');
  if (containerPreferencias && typeof obterCategoriasPrincipais === 'function') {
    const subcategoriaContainer = document.createElement('div');
    subcategoriaContainer.style.cssText = 'display: flex; flex-direction: column; gap: 10px; margin-top: 8px;';
    
    obterCategoriasPrincipais().forEach(cat => {
      const header = document.createElement('div');
      header.style.cssText = 'font-weight: bold; color: var(--cor-principal, #00bfff); font-size: 12px; margin-top: 10px;';
      header.textContent = cat;
      subcategoriaContainer.appendChild(header);
      
      const subcategorias = obterSubcategorias(cat);
      subcategorias.forEach(sub => {
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-left: 10px;';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'preferencia-subcategoria';
        checkbox.value = sub;
        checkbox.id = `pref-${sub.replace(/\s+/g, '-')}`;
        
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = sub;
        label.style.fontSize = '13px';
        
        div.appendChild(checkbox);
        div.appendChild(label);
        subcategoriaContainer.appendChild(div);
      });
    });
    containerPreferencias.appendChild(subcategoriaContainer);
  }
});

// ✅ CADASTRO DE USUÁRIO CORRIGIDO
const form = document.getElementById('cadastro-form');
const mensagem = document.getElementById('mensagem-cadastro');

if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;
    
    // Validação básica antes de enviar
    const erroDiv = document.getElementById('email-erro');
    if (erroDiv && erroDiv.style.display !== 'none') {
      mensagem.textContent = 'Corrija o erro no email antes de prosseguir.';
      mensagem.style.color = '#ff4444';
      return;
    }
    
    if (senha !== confirmarSenha) {
      mensagem.textContent = 'As senhas não coincidem.';
      mensagem.style.color = '#ff4444';
      return;
    }
    
    const dados = {
      nome: document.querySelector('input[name="nome"]').value,
      email: email,
      senha: senha,
      estado: document.getElementById('estado').value,
      cidade: document.getElementById('cidade').value,
      preferencias: Array.from(document.querySelectorAll('input[name="preferencia-subcategoria"]:checked')).map(cb => cb.value)
    };
    
    try {
      // ✅ ALTERAÇÃO CRUCIAL: Rota alterada de /usuarios para /cadastro
      const resposta = await fetch(`/api/cadastro`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      
      const resultado = await resposta.json();

      if (resposta.ok) {
        mensagem.textContent = 'Cadastro realizado com sucesso! Redirecionando...';
        mensagem.style.color = '#00ff00';
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      } else {
        mensagem.textContent = resultado.erro || 'Erro ao cadastrar.';
        mensagem.style.color = '#ff4444';
      }
    } catch (err) {
      console.error('Erro no fetch:', err);
      mensagem.textContent = 'Erro ao conectar com o servidor. Verifique sua conexão.';
      mensagem.style.color = '#ff4444';
    }
  });
}