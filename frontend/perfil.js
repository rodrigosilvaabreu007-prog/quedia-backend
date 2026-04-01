// Variável para armazenar dados do usuário
let usuarioAtual = null;

function getUsuarioId(usuario) {
  if (!usuario) {
    // Se não passou usuário, tenta do localStorage
    try {
      const usuarioStorage = JSON.parse(localStorage.getItem('eventhub-usuario') || 'null');
      return usuarioStorage?.id || usuarioStorage?._id || '';
    } catch {
      return '';
    }
  }
  return usuario.id || usuario._id || '';
}

// Função para carregar perfil
async function carregarPerfil() {
  const token = localStorage.getItem('eventhub-token');
  const usuario = localStorage.getItem('eventhub-usuario');
  
  const container = document.getElementById('conteudo-perfil');
  if (!container) {
    throw new Error('Container de perfil não encontrado');
  }
  
  // Se não estiver logado, mostrar tela de login
  if (!token || !usuario) {
    if (token && !usuario) {
      // Limpa token antigo caso exista sem usuário válido (evita cycle de redirecionamento no login)
      localStorage.removeItem('eventhub-token');
    }

    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <h2 style="color: var(--cor-principal, #00bfff); margin-bottom: 20px;">Você não está logado</h2>
        <p style="color: #aaa; margin-bottom: 30px;">Faça login ou crie uma conta para acessar seu perfil</p>
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
          <button id="btn-abrir-login" style="padding: 12px 24px; background: var(--cor-principal, #00bfff); color: #000; border-radius: 4px; font-weight: bold; cursor: pointer; border: none;">Login</button>
          <button id="btn-abrir-cadastro" style="padding: 12px 24px; background: transparent; color: var(--cor-principal, #00bfff); border: 2px solid var(--cor-principal, #00bfff); border-radius: 4px; font-weight: bold; cursor: pointer;">Cadastro</button>
        </div>
        <p style="color: #ffcc00; margin-top: 18px; font-size: 0.9rem;">Se não abrir, limpe o cache do browser ou use o botão abaixo.</p>
        <button id="btn-limpar-sessao" style="padding: 10px 16px; background: #444; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Limpar sessão</button>
      </div>
    `;

    document.getElementById('btn-abrir-login')?.addEventListener('click', () => {
      window.location.href = 'login.html';
    });

    document.getElementById('btn-abrir-cadastro')?.addEventListener('click', () => {
      window.location.href = 'cadastro.html';
    });

    document.getElementById('btn-limpar-sessao')?.addEventListener('click', () => {
      localStorage.removeItem('eventhub-token');
      localStorage.removeItem('eventhub-usuario');
      location.reload();
    });

    return;
  }
  
  try {
    usuarioAtual = JSON.parse(usuario);
    
    // Carregar foto de perfil (se existir na página)
    const usuarioId = getUsuarioId(usuarioAtual);
    const fotoPerfil = localStorage.getItem(`foto-perfil-${usuarioId}`);
    const iconePerfilImg = document.getElementById('icone-perfil-img');
    if (fotoPerfil && iconePerfilImg) {
      iconePerfilImg.src = fotoPerfil;
    }
    
    // Construir HTML do perfil
    const container = document.getElementById('conteudo-perfil');
    if (!container) {
      throw new Error('Container de perfil não encontrado');
    }
    
    // Verificar se preferências é string (vinda do banco) ou array
    let preferenciasArray = [];
    if (usuarioAtual.preferencias) {
      if (typeof usuarioAtual.preferencias === 'string') {
        try {
          preferenciasArray = JSON.parse(usuarioAtual.preferencias);
        } catch {
          preferenciasArray = [];
        }
      } else if (Array.isArray(usuarioAtual.preferencias)) {
        preferenciasArray = usuarioAtual.preferencias;
      }
    }
    
    // Obter nome das preferências (categorias)
    let preferenciasHTML = '<p style="margin: 8px 0; font-size: 14px; color: #aaa;"><strong>Preferências de Eventos:</strong></p>';
    
    if (preferenciasArray && preferenciasArray.length > 0) {
      preferenciasHTML += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin: 12px 0;">';
      preferenciasArray.forEach(pref => {
        preferenciasHTML += `<div style="background: rgba(0, 191, 255, 0.1); padding: 8px 12px; border-radius: 4px; border-left: 3px solid var(--cor-principal, #00bfff);">${pref}</div>`;
      });
      preferenciasHTML += '</div>';
    } else {
      preferenciasHTML += '<p style="margin: 8px 0; font-size: 14px; color: #888;">Nenhuma preferência configurada</p>';
    }
    
    container.innerHTML = `
      <div style="background: var(--bg-secondary, #1a2332); border: 2px solid var(--cor-principal, #00bfff); border-radius: 12px; padding: 32px; margin-bottom: 24px; position: relative;">
        <button onclick="fecharPerfil()" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-primary, #00bfff);">✕</button>
        
        <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 32px;">
          <div style="position: relative; width: 100px; height: 100px; flex-shrink: 0;">
            <div id="foto-container" style="width: 100%; height: 100%; border-radius: 50%; border: 3px solid var(--cor-principal, #00bfff); overflow: hidden; cursor: pointer;" onclick="document.getElementById('foto-perfil-input').click();" title="Clique para alterar foto de perfil">
              <img id="foto-perfil-display" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='8' r='4' fill='%2300bfff'/%3E%3Cpath d='M12 14c-4 0-6 2-6 2v6h12v-6s-2-2-6-2z' fill='%2300bfff'/%3E%3C/svg%3E" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <input type="file" id="foto-perfil-input" accept="image/*" style="display: none;" onchange="trocarFotoPerfil(event)">
          </div>
          <div>
            <h2 style="margin: 0 0 8px 0; color: var(--text-primary, #00bfff);">${usuarioAtual.nome}</h2>
            <p style="margin: 0; color: #aaa; font-size: 14px;">${usuarioAtual.email}</p>
          </div>
        </div>
        
        <h2 style="margin: 0 0 24px 0; color: var(--text-primary, #00bfff);">Informações do Perfil</h2>
        
        <div style="display: grid; gap: 16px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #888;">ESTADO</p>
              <p style="margin: 0; font-size: 16px; color: var(--text-color, #fff);">${usuarioAtual.estado || 'Não informado'}</p>
            </div>
            
            <div>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #888;">CIDADE</p>
              <p style="margin: 0; font-size: 16px; color: var(--text-color, #fff);">${usuarioAtual.cidade || 'Não informado'}</p>
            </div>
          </div>
          
          <div>
            ${preferenciasHTML}
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 32px;">
          <button onclick="abrirModalEditar()" style="padding: 12px 24px; background: var(--cor-principal, #00bfff); border: none; border-radius: 4px; color: #000; font-weight: 600; cursor: pointer; font-size: 16px;">Editar Perfil</button>
          <button onclick="abrirModalDeletar()" style="padding: 12px 24px; background: #ff4444; border: none; border-radius: 4px; color: #fff; font-weight: 600; cursor: pointer; font-size: 16px;">Deletar Conta</button>
          <button onclick="logout(event)" style="padding: 12px 24px; background: #666; border: none; border-radius: 4px; color: #fff; font-weight: 600; cursor: pointer; font-size: 16px;">Sair da Conta</button>
        </div>
      </div>
    `;
    
    // Atualizar foto no ícone se existir
    if (fotoPerfil) {
      const fotaDisplay = document.getElementById('foto-perfil-display');
      if (fotaDisplay) {
        fotaDisplay.src = fotoPerfil;
      }
    }
    
  } catch (erro) {
    console.error('Erro ao carregar perfil:', erro);
    const container = document.getElementById('conteudo-perfil');
    if (container) {
      container.innerHTML = `
        <div style="background: var(--bg-secondary, #1a2332); border: 2px solid #ff4444; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
          <h2 style="color: #ff4444; margin-top: 0;">Erro ao Carregar Perfil</h2>
          <p style="color: #aaa; margin-bottom: 20px;">Desculpe, ocorreu um erro ao carregar suas informações. Por favor, tente novamente.</p>
          <button onclick="location.reload()" style="padding: 12px 24px; background: var(--cor-principal, #00bfff); border: none; border-radius: 4px; color: #000; font-weight: 600; cursor: pointer;">Tentar Novamente</button>
          <button onclick="window.location.href='index.html';" style="padding: 12px 24px; background: #666; border: none; border-radius: 4px; color: #fff; font-weight: 600; cursor: pointer; margin-left: 12px;">Voltar ao Início</button>
        </div>
      `;
    }
  }
}

// Função para fechar perfil
function fecharPerfil() {
  window.location.href = 'index.html';
}

// Função para atualizar foto de perfil clicando na imagem
function trocarFotoPerfil(event) {
  const arquivo = event.target.files?.[0];
  if (!arquivo || !usuarioAtual) {
    return;
  }

  const leitor = new FileReader();
  leitor.onload = function(e) {
    const imagemBase64 = e.target.result;
    const exibir = document.getElementById('foto-perfil-display');
    if (exibir) exibir.src = imagemBase64;

    const usuarioId = getUsuarioId(usuarioAtual);
    if (usuarioId) {
      localStorage.setItem(`foto-perfil-${usuarioId}`, imagemBase64);
    }

    const iconePerfilImg = document.getElementById('icone-perfil-img');
    if (iconePerfilImg) iconePerfilImg.src = imagemBase64;
  };

  leitor.readAsDataURL(arquivo);
}

// Função para abrir modal de edição
function abrirModalEditar() {
  const modal = document.getElementById('modal-editar');
  
  // Preencher campos com dados atuais
  document.getElementById('editar-nome').value = usuarioAtual.nome;
  document.getElementById('editar-email').value = usuarioAtual.email;
  
  // Preencher dropdown de estados primeiro
  preencherEstadosEditar();
  
  // Definir estado selecionado após preencher dropdown
  document.getElementById('editar-estado').value = usuarioAtual.estado || '';
  
  // Atualizar cidades se houver estado
  if (usuarioAtual.estado) {
    atualizarCidadesEditar(usuarioAtual.estado);
    // Aguardar um pouco para garantir que as cidades sejam carregadas antes de definir o valor
    setTimeout(() => {
      document.getElementById('editar-cidade').value = usuarioAtual.cidade || '';
    }, 10);
  }
  
  // Preencher preferências
  preencherPreferenciasEditar();
  
  modal.style.display = 'flex';
}

// Função para preencher preferências no modal
function preencherPreferenciasEditar() {
  const container = document.getElementById('editar-preferencias-container');
  
  if (!container) return;
  
  // Obter preferências atuais como array
  let preferenciasAtuais = [];
  if (usuarioAtual.preferencias) {
    if (typeof usuarioAtual.preferencias === 'string') {
      try {
        preferenciasAtuais = JSON.parse(usuarioAtual.preferencias);
      } catch {
        preferenciasAtuais = [];
      }
    } else if (Array.isArray(usuarioAtual.preferencias)) {
      preferenciasAtuais = usuarioAtual.preferencias;
    }
  }
  
  container.innerHTML = '';
  const categoriasDiv = document.createElement('div');
  categoriasDiv.style.cssText = 'display: grid; grid-template-columns: 1fr; gap: 16px;';
  
  const subcategoriaLabel = document.createElement('label');
  subcategoriaLabel.textContent = 'Subcategoria(s):';
  subcategoriaLabel.style.cssText = 'display: block; margin-bottom: 8px; color: #aaa; font-size: 12px; text-transform: uppercase;';
  
  const subcategoriaContainer = document.createElement('div');
  subcategoriaContainer.id = 'editar-preferencia-subcategorias';
  subcategoriaContainer.style.cssText = 'display: flex; flex-direction: column; gap: 12px; margin-top: 8px; align-items: flex-start; max-height: 200px; overflow-y: auto;';
  
  // Criar checkboxes para subcategorias
  obterCategoriasPrincipais().forEach(cat => {
    const headerCategoria = document.createElement('div');
    headerCategoria.style.cssText = 'font-weight: 600; color: var(--text-primary, #00bfff); margin-top: 8px; font-size: 12px; text-transform: uppercase;';
    headerCategoria.textContent = cat;
    subcategoriaContainer.appendChild(headerCategoria);
    
    const subcategorias = obterSubcategorias(cat);
    subcategorias.forEach(sub => {
      const div2 = document.createElement('div');
      div2.style.cssText = 'display: grid; grid-template-columns: auto 1fr; gap: 8px; align-items: start; margin-left: 12px;';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'editar-preferencia-subcategoria';
      checkbox.value = sub;
      checkbox.id = `editar-pref-${sub.replace(/\s+/g, '-')}`;
      
      // Marcar como checked se já está nas preferências
      if (preferenciasAtuais.includes(sub)) {
        checkbox.checked = true;
      }
      
      const label = document.createElement('label');
      label.htmlFor = checkbox.id;
      label.textContent = sub;
      label.style.cssText = 'cursor: pointer; margin: 0; font-size: 13px;';
      
      div2.appendChild(checkbox);
      div2.appendChild(label);
      subcategoriaContainer.appendChild(div2);
    });
  });
  
  categoriasDiv.appendChild(subcategoriaLabel);
  categoriasDiv.appendChild(subcategoriaContainer);
  container.appendChild(categoriasDiv);
}

// Função para fechar modal de edição
function fecharModalEditar() {
  document.getElementById('modal-editar').style.display = 'none';
}

// Função para preencher dropdown de estados no modal
function preencherEstadosEditar() {
  const select = document.getElementById('editar-estado');
  
  // Limpar opções anteriores, mantendo apenas a primeira
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  const estados = obterEstados();
  estados.forEach(estado => {
    const option = document.createElement('option');
    option.value = estado.sigla;
    option.textContent = estado.nome;
    select.appendChild(option);
  });
  
  // Adicionar event listener para mudança de estado
  select.addEventListener('change', (e) => {
    atualizarCidadesEditar(e.target.value);
  });
}

// Função para atualizar cidades no modal
function atualizarCidadesEditar(estado) {
  const select = document.getElementById('editar-cidade');
  select.innerHTML = '<option value="">Selecione uma cidade</option>';
  
  if (!estado) {
    select.disabled = true;
    return;
  }
  
  const cidades = obterCidades(estado);
  cidades.forEach(cidade => {
    const option = document.createElement('option');
    option.value = cidade;
    option.textContent = cidade;
    select.appendChild(option);
  });
  
  select.disabled = false;
}

// Função para fechar modal de deletar
function fecharModalDeletar() {
  document.getElementById('modal-deletar').style.display = 'none';
}
async function salvarAlteracoes(e) {
  e.preventDefault();
  
  const token = localStorage.getItem('eventhub-token');
  
  // Validar campos obrigatórios
  const nome = document.getElementById('editar-nome').value.trim();
  const email = document.getElementById('editar-email').value.trim();
  const estado = document.getElementById('editar-estado').value;
  const cidade = document.getElementById('editar-cidade').value;
  
  if (!nome || !email || !estado || !cidade) {
    window.showNotification('Por favor, preencha todos os campos obrigatórios', 'error');
    return;
  }
  
  // Coletar preferências selecionadas  
  const checkboxesSelecionados = document.querySelectorAll('input[name="editar-preferencia-subcategoria"]:checked');
  const preferencias = Array.from(checkboxesSelecionados).map(cb => cb.value);
  
  const dadosAtualizados = {
    nome: nome,
    email: email,
    estado: estado,
    cidade: cidade,
    preferencias: preferencias
  };
  
  try {
    const usuarioId = getUsuarioId(usuarioAtual);
    if (!usuarioId) {
      throw new Error('ID do usuário não encontrado. Recarregue a página.');
    }
    const resposta = await fetch(`${window.API_URL}/usuario/${usuarioId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dadosAtualizados)
    });
    
    if (tratarErroAutenticacao(resposta)) return;
    
    if (!resposta.ok) {
      const erro = await resposta.json();
      throw new Error(erro.erro || 'Erro ao atualizar perfil');
    }
    
    const usuarioAtualizado = await resposta.json();
    
    // Atualizar usuário atual em memória
    usuarioAtual = usuarioAtualizado;
    localStorage.setItem('eventhub-usuario', JSON.stringify(usuarioAtualizado));
    
    fecharModalEditar();
    
    // Recarregar o perfil
    await carregarPerfil();
    
  } catch (erro) {
    console.error('Erro ao salvar alterações:', erro);
    window.showNotification(erro.message || 'Erro ao atualizar perfil', 'error');
  }
}

// Função para abrir modal de confirmação de deletar
function abrirModalDeletar() {
  document.getElementById('modal-deletar').style.display = 'flex';
}

// Função para fechar modal de deletar
function fecharModalDeletar() {
  document.getElementById('modal-deletar').style.display = 'none';
}

// Função para confirmar e executar exclusão de conta
async function confirmarDelecao() {
  const token = localStorage.getItem('eventhub-token');
  
  try {
    const usuarioId = getUsuarioId(usuarioAtual);
    if (!usuarioId) {
      throw new Error('ID do usuário não encontrado. Recarregue a página.');
    }
    
    const resposta = await fetch(`${window.API_URL}/usuario/${usuarioId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (tratarErroAutenticacao(resposta)) return;
    
    if (resposta.ok) {
      // Limpar dados do localStorage
      localStorage.removeItem('eventhub-token');
      localStorage.removeItem('eventhub-usuario');
      
      window.showNotification('Conta deletada com sucesso', 'success');
      setTimeout(() => window.location.href = 'index.html', 800);
    } else {
      const erro = await resposta.json();
      window.showNotification(erro.erro || 'Erro ao deletar conta', 'error');
    }
  } catch (erro) {
    console.error('Erro:', erro);
    window.showNotification('Erro ao conectar com o servidor', 'error');
  }
}

// Função para fazer logout
function logout(event) {
  event.preventDefault();
  localStorage.removeItem('eventhub-token');
  localStorage.removeItem('eventhub-usuario');
  window.location.href = 'index.html';
}

function tratarErroAutenticacao(response) {
  if (response && (response.status === 401 || response.status === 403)) {
    localStorage.removeItem('eventhub-token');
    localStorage.removeItem('eventhub-usuario');
    window.showNotification('Sessão inválida. Faça login novamente.', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 800);
    return true;
  }
  return false;
}

// Carregar perfil quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
  // Carrega o perfil mas NÃO abre nenhum modal
  carregarPerfil();
  
  // Adicionar listener para form de edição
  const form = document.getElementById('form-editar');
  if (form) {
    form.addEventListener('submit', salvarAlteracoes);
  }
  
  // Garantir que os modais começam fechados
  const modalEditar = document.getElementById('modal-editar');
  const modalDeletar = document.getElementById('modal-deletar');
  if (modalEditar) modalEditar.style.display = 'none';
  if (modalDeletar) modalDeletar.style.display = 'none';
});

