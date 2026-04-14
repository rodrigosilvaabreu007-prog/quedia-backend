// Sistema de temas avançado com sincronização entre abas

// Funções de aplicar/restaurar tema
function shadeColor(hex, percent) {
  if (!hex) return '#5a6d86';
  let color = hex.trim();
  if (color.startsWith('#')) color = color.slice(1);
  if (color.length === 3) color = color.split('').map(ch => ch + ch).join('');
  const num = parseInt(color, 16);
  if (Number.isNaN(num)) return '#5a6d86';
  const r = Math.min(255, Math.max(0, Math.round(((num >> 16) & 255) * (100 + percent) / 100)));
  const g = Math.min(255, Math.max(0, Math.round(((num >> 8) & 255) * (100 + percent) / 100)));
  const b = Math.min(255, Math.max(0, Math.round((num & 255) * (100 + percent) / 100)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function aplicarTema(tema) {
  if (tema) {
    const corPrincipal = tema.corPrincipal || '#00bfff';
    document.body.style.setProperty('--cor-principal', corPrincipal);
    document.body.style.setProperty('--cor-principal-hover', shadeColor(corPrincipal, -18));
    document.body.style.setProperty('--cor-principal-active', shadeColor(corPrincipal, -36));
    document.body.style.setProperty('--cor-principal-pressed', '#5a6d86');
    document.body.style.setProperty('--bg-primary', tema.corFundo || '#181a20');
    document.body.style.setProperty('--text-primary', tema.corTexto || '#ffffff');
    document.body.style.setProperty('--bg-secondary', tema.bgSecundario || '#1a2332');
    document.body.style.setProperty('--bg-tertiary', tema.bgTerciario || '#0f1419');
    document.body.style.setProperty('--text-secondary', tema.textoSecundario || '#c7d2ff');
    document.body.style.setProperty('--text-muted', tema.textoMutado || '#aaa');
    document.body.style.setProperty('--glass', tema.glass || 'rgba(255,255,255,0.05)');
    document.body.style.setProperty('--border', tema.borda || 'rgba(255,255,255,0.12)');
    document.body.style.setProperty('--accent', tema.accent || '#00ffdd');
    document.body.style.setProperty('--success', tema.success || '#28a745');
    document.body.style.setProperty('--error', tema.error || '#ff4444');
    document.body.style.setProperty('--warning', tema.warning || '#ffcc00');
    
    // Definir valores nos inputs se existirem
    const mainInput = document.getElementById('theme-main');
    const bgInput = document.getElementById('theme-bg');
    const textInput = document.getElementById('theme-text');
    
    if (mainInput) mainInput.value = corPrincipal;
    if (bgInput) bgInput.value = tema.corFundo || '#181a20';
    if (textInput) textInput.value = tema.corTexto || '#ffffff';
  }
}

function obterTemaSalvo() {
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
      try {
        tema = JSON.parse(savedTheme);
      } catch (err) {
        console.error('Erro ao parsear tema salvo:', err);
      }
    }
  }

  return tema;
}

function restaurarTema() {
  const tema = obterTemaSalvo();
  aplicarTema(tema);
}

// Inicializar tema ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
  restaurarTema();

  // Sincronizar tema entre abas
  window.addEventListener('storage', function(e) {
    if (e.key === 'eventhub-theme' || e.key === 'eventhub-usuario') {
      restaurarTema();
    }
  });
});

// Criar elementos do modal após DOMContentLoaded
function initializeThemeModal() {
  // Verificar se já foi inicializado
  if (document.getElementById('theme-modal-container')) return;

  const themeBtn = document.createElement('button');
  themeBtn.textContent = '🎨 Tema';
  themeBtn.className = 'theme-btn';
  document.body.appendChild(themeBtn);

  const themeModal = document.createElement('div');
  themeModal.id = 'theme-modal-container';
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

    const temaSalvo = { corPrincipal, corFundo, corTexto };
    aplicarTema(temaSalvo);

    // Salvar localmente
    localStorage.setItem('eventhub-theme', JSON.stringify(temaSalvo));

    const token = localStorage.getItem('eventhub-token');
    const usuarioStr = localStorage.getItem('eventhub-usuario');
    if (token && usuarioStr) {
      try {
        const usuario = JSON.parse(usuarioStr);
        let preferencias = usuario.preferencias || {};
        if (typeof preferencias === 'string') {
          preferencias = JSON.parse(preferencias);
        }

        preferencias.tema = { corPrincipal, corFundo, corTexto };

        const usuarioId = usuario.id || usuario._id || '';
        const response = await fetch(`${window.API_URL}/usuario/${usuarioId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ preferencias })
        });

        if (response.ok) {
          usuario.preferencias = preferencias;
          localStorage.setItem('eventhub-usuario', JSON.stringify(usuario));
        }
      } catch (err) {
        console.error('Erro ao salvar tema no backend:', err);
      }
    }

    themeModal.style.display = 'none';
    window.showNotification('Tema salvo com sucesso!', 'success');
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
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeThemeModal);

