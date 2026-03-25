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
  if (!emailInput) return;
  const email = emailInput.value.trim();
  const erroDiv = document.getElementById('email-erro');
  
  if (email.length === 0) {
    erroDiv.style.display = 'none';
    return;
  }
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    erroDiv.textContent = 'Email inválido';
    erroDiv.style.display = 'block';
    return;
  }
  
  // ✅ Usando a rota que acabamos de criar no backend
  fetch(`${window.API_URL}/verificar-email?email=${encodeURIComponent(email)}`)
    .then(res => res.json())
    .then(data => {
      // O backend agora retorna { disponivel: true }
      if (data.disponivel === false) {
        erroDiv.textContent = 'Email já cadastrado';
        erroDiv.style.display = 'block';
      } else {
        erroDiv.style.display = 'none';
      }
    })
    .catch(err => console.error('Erro ao verificar email:', err));
}

// Função para atualizar cidades
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
  
  // Gerar categorias de preferência
  const containerPreferencias = document.getElementById('preferencias-categorias');
  if (containerPreferencias && typeof obterCategoriasPrincipais === 'function') {
    containerPreferencias.innerHTML = ''; // Limpa antes de gerar
    const subcategoriaContainer = document.createElement('div');
    subcategoriaContainer.style.cssText = 'display: flex; flex-direction: column; gap: 10px; margin-top: 8px;';
    
    obterCategoriasPrincipais().forEach(cat => {
      const header = document.createElement('div');
      header.style.cssText = 'font-weight: bold; color: #00bfff; font-size: 12px; margin-top: 10px;';
      header.textContent = cat;
      subcategoriaContainer.appendChild(header);
      
      const subcategorias = obterSubcategorias(cat);
      subcategorias.forEach(sub => {
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-left: 10px;';
        div.innerHTML = `
          <input type="checkbox" name="preferencia-subcategoria" value="${sub}" id="pref-${sub.replace(/\s+/g, '-')}">
          <label for="pref-${sub.replace(/\s+/g, '-')}" style="font-size: 13px;">${sub}</label>
        `;
        subcategoriaContainer.appendChild(div);
      });
    });
    containerPreferencias.appendChild(subcategoriaContainer);
  }
});

// ✅ CADASTRO DE USUÁRIO
const form = document.getElementById('cadastro-form');
const mensagem = document.getElementById('mensagem-cadastro');

if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;
    const nomeInput = document.querySelector('input[name="nome"]');

    if (senha !== confirmarSenha) {
      mensagem.textContent = 'As senhas não coincidem.';
      mensagem.style.color = '#ff4444';
      return;
    }
    
    // Montando os dados exatamente como o backend espera
    const dados = {
      nome: nomeInput ? nomeInput.value : 'Usuário',
      email: email,
      senha: senha,
      estado: document.getElementById('estado').value,
      cidade: document.getElementById('cidade').value,
      preferencias: Array.from(document.querySelectorAll('input[name="preferencia-subcategoria"]:checked')).map(cb => cb.value)
    };

    console.log('📦 Enviando dados para o servidor:', dados);

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
        console.error('❌ Erro do Servidor:', resultado);
        mensagem.textContent = resultado.erro || 'Erro ao cadastrar.';
        mensagem.style.color = '#ff4444';
      }
    } catch (err) {
      console.error('💥 Erro Crítico no Fetch:', err);
      mensagem.textContent = 'Erro ao conectar com o servidor.';
      mensagem.style.color = '#ff4444';
    }
  });
}