// Sistema de temas avançado
const themeBtn = document.createElement('button');
themeBtn.textContent = '🎨 Tema';
themeBtn.className = 'theme-btn';
document.body.appendChild(themeBtn);

const themeModal = document.createElement('div');
themeModal.className = 'theme-modal';
themeModal.innerHTML = `
  <div class="theme-modal-content">
    <div class="theme-header">
      <h2>🎨 Personalizar Tema</h2>
      <p>Customize as cores da sua experiência</p>
    </div>

    <div class="theme-grid">
      <div class="theme-section">
        <h3>🎯 Cores Principais</h3>
        <div class="color-group">
          <label class="color-label">
            <span>Cor Principal</span>
            <input type="color" id="theme-main" value="#00bfff">
            <div class="color-preview" id="preview-main"></div>
          </label>
          <small>Afeta botões, bordas e elementos visuais</small>
        </div>
      </div>

      <div class="theme-section">
        <h3>🏠 Plano de Fundo</h3>
        <div class="color-group">
          <label class="color-label">
            <span>Cor do Fundo</span>
            <input type="color" id="theme-bg" value="#181a20">
            <div class="color-preview" id="preview-bg"></div>
          </label>
          <small>Cor de fundo da página</small>
        </div>
      </div>

      <div class="theme-section">
        <h3>📝 Texto</h3>
        <div class="color-group">
          <label class="color-label">
            <span>Cor do Texto</span>
            <input type="color" id="theme-text" value="#ffffff">
            <div class="color-preview" id="preview-text"></div>
          </label>
          <small>Cor de todos os textos</small>
        </div>
      </div>
    </div>

    <div class="theme-actions">
      <button id="reset-theme" class="btn-secondary">🔄 Resetar</button>
      <button id="save-theme" class="btn-primary">💾 Salvar</button>
      <button id="close-theme" class="btn-secondary">❌ Fechar</button>
    </div>
  </div>
`;
document.body.appendChild(themeModal);
themeModal.style.display = 'none';

themeBtn.onclick = () => {
  themeModal.style.display = 'flex';
  updatePreviews();
};
document.getElementById('close-theme').onclick = () => themeModal.style.display = 'none';

document.getElementById('save-theme').onclick = async () => {
  const corPrincipal = document.getElementById('theme-main').value;
  const corFundo = document.getElementById('theme-bg').value;
  const corTexto = document.getElementById('theme-text').value;

  // Aplicar cores
  document.body.style.setProperty('--cor-principal', corPrincipal);
  document.body.style.setProperty('--bg-primary', corFundo);
  document.body.style.setProperty('--text-primary', corTexto);

  // Salvar localmente
  localStorage.setItem('eventhub-theme', JSON.stringify({ corPrincipal, corFundo, corTexto }));

  // Salvar no backend se usuário estiver logado
  const token = localStorage.getItem('eventhub-token');
  const usuarioStr = localStorage.getItem('eventhub-usuario');
  if (token && usuarioStr) {
    try {
      const usuario = JSON.parse(usuarioStr);
      const preferencias = usuario.preferencias || {};
      if (typeof preferencias === 'string') {
        preferencias = JSON.parse(preferencias);
      }

      preferencias.tema = { corPrincipal, corFundo, corTexto };

      const response = await fetch(`${window.API_URL}/usuario/${usuario._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ preferencias })
      });

      if (response.ok) {
        // Atualizar dados do usuário no localStorage
        usuario.preferencias = preferencias;
        localStorage.setItem('eventhub-usuario', JSON.stringify(usuario));
      }
    } catch (err) {
      console.error('Erro ao salvar tema no backend:', err);
    }
  }

  themeModal.style.display = 'none';
  showNotification('Tema salvo com sucesso!', 'success');
};

document.getElementById('reset-theme').onclick = () => {
  // Resetar para valores padrão
  document.getElementById('theme-main').value = '#00bfff';
  document.getElementById('theme-bg').value = '#181a20';
  document.getElementById('theme-text').value = '#ffffff';
  updatePreviews();
};

function updatePreviews() {
  document.getElementById('preview-main').style.backgroundColor = document.getElementById('theme-main').value;
  document.getElementById('preview-bg').style.backgroundColor = document.getElementById('theme-bg').value;
  document.getElementById('preview-text').style.backgroundColor = document.getElementById('theme-text').value;
}

// Atualizar previews em tempo real
document.getElementById('theme-main').addEventListener('input', updatePreviews);
document.getElementById('theme-bg').addEventListener('input', updatePreviews);
document.getElementById('theme-text').addEventListener('input', updatePreviews);

// Restaurar tema salvo
async function restaurarTema() {
  const usuarioStr = localStorage.getItem('eventhub-usuario');
  let tema = null;

  // Primeiro tentar carregar do backend se usuário estiver logado
  if (usuarioStr) {
    try {
      const usuario = JSON.parse(usuarioStr);
      const preferencias = usuario.preferencias;
      if (preferencias) {
        if (typeof preferencias === 'string') {
          const prefs = JSON.parse(preferencias);
          tema = prefs.tema;
        } else if (preferencias.tema) {
          tema = preferencias.tema;
        }
      }
    } catch (err) {
      console.error('Erro ao carregar tema do usuário:', err);
    }
  }

  // Se não tem tema do backend, tentar localStorage
  if (!tema) {
    const savedTheme = localStorage.getItem('eventhub-theme');
    if (savedTheme) {
      tema = JSON.parse(savedTheme);
    }
  }

  // Aplicar tema se encontrado
  if (tema) {
    document.body.style.setProperty('--cor-principal', tema.corPrincipal);
    document.body.style.setProperty('--bg-primary', tema.corFundo);
    document.body.style.setProperty('--text-primary', tema.corTexto);

    // Definir valores nos inputs
    document.getElementById('theme-main').value = tema.corPrincipal;
    document.getElementById('theme-bg').value = tema.corFundo;
    document.getElementById('theme-text').value = tema.corTexto;
  }
}

restaurarTema();

// Função para mostrar notificações
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

