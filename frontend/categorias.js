// ⚠️ CATEGORIAS E SUBCATEGORIAS COMPLETAS - Atualizado em 10/04/2026
// Com interface interativa de seleção múltipla

const categoriasCompletas = {
  'Cultura & Educação': {
    id: 'cultura',
    subcategorias: [
      'Aula aberta',
      'Cinema ao ar livre',
      'Clube do livro',
      'Congresso científico',
      'Curso',
      'Encontro acadêmico',
      'Espetáculo teatral',
      'Exposição de arte',
      'Feira de ciência',
      'Feira literária',
      'Festival de cinema',
      'Lançamento de livro',
      'Mostra cultural',
      'Mostra de cinema',
      'Museu',
      'Olimpíada escolar',
      'Palestra educacional',
      'Sarau',
      'Teatro',
      'Workshop artístico'
    ]
  },
  'Esporte & Saúde': {
    id: 'esporte',
    subcategorias: [
      'Aula coletiva',
      'Caminhada',
      'Campeonato de MMA',
      'Campeonato de artes marciais',
      'Campeonato de basquete',
      'Campeonato de e-sports',
      'Campeonato de futebol',
      'Campeonato de futsal',
      'Campeonato de handebol',
      'Campeonato de jiu-jitsu',
      'Campeonato de karatê',
      'Campeonato de vôlei',
      'Campeonato escolar',
      'Campeonato universitário',
      'Ciclismo',
      'Corrida de rua',
      'Crossfit',
      'Evento fitness',
      'Funcional',
      'Maratona',
      'Meia maratona',
      'Natação',
      'Torneio de beach tennis',
      'Torneio de skate',
      'Torneio de surf',
      'Torneio de tênis',
      'Torneio esportivo',
      'Triatlo',
      'Yoga'
    ]
  },
  'Gastronomia': {
    id: 'gastronomia',
    subcategorias: [
      'Aula de culinária',
      'Competição culinária',
      'Degustação',
      'Feira gastronômica',
      'Festival de café',
      'Festival de cerveja',
      'Festival de churrasco',
      'Festival de doces',
      'Festival de food truck',
      'Festival de vinho',
      'Festival gastronômico',
      'Workshop gastronômico'
    ]
  },
  'Negócio & Conexão': {
    id: 'negocio',
    subcategorias: [
      'Apresentação de startup',
      'Bootcamp',
      'Conferência',
      'Congresso',
      'Convenção empresarial',
      'Curso profissional',
      'Encontro de empreendedores',
      'Encontro de startups',
      'Expo empresarial',
      'Feira de inovação',
      'Feira empresarial',
      'Fórum',
      'Hackathon',
      'Lançamento de produto',
      'Masterclass',
      'Meetup profissional',
      'Networking',
      'Painel de discussão',
      'Palestra',
      'Pitch de investidores',
      'Rodada de negócios',
      'Seminário',
      'Summit empresarial',
      'Treinamento corporativo',
      'Workshop'
    ]
  },
  'Política & Cidadania': {
    id: 'politica',
    subcategorias: [
      'Assembleia',
      'Audiência pública',
      'Campanha eleitoral',
      'Conferência estadual',
      'Conferência municipal',
      'Conferência nacional',
      'Consulta pública',
      'Convenção política',
      'Debate político',
      'Encontro comunitário',
      'Encontro partidário',
      'Evento governamental',
      'Fórum de cidadania',
      'Manifestação',
      'Mobilização social',
      'Protesto',
      'Reunião de bairro',
      'Reunião pública',
      'Sessão legislativa'
    ]
  },
  'Shows & Festas': {
    id: 'shows',
    subcategorias: [
      'Balada',
      'DJ set',
      'Evento em casa noturna',
      'Festa ao ar livre',
      'Festa de carnaval',
      'Festa de réveillon',
      'Festa junina',
      'Festa open bar',
      'Festa temática',
      'Festa universitária',
      'Festival cultural',
      'Festival de arte',
      'Festival de dança',
      'Festival de música',
      'Festival de rap',
      'Festival de reggae',
      'Festival de rock',
      'Festival eletrônico',
      'Festival gospel',
      'Festival multicultural',
      'Festival pop',
      'Festival sertanejo',
      'Show musical'
    ]
  },
  'Social & Comunidade': {
    id: 'social',
    subcategorias: [
      'Aniversário público',
      'Campanha solidária',
      'Casamento',
      'Comemoração municipal',
      'Culto especial',
      'Doação de sangue',
      'Encontro religioso',
      'Evento beneficente',
      'Evento de bairro',
      'Evento escolar',
      'Evento religioso',
      'Evento universitário',
      'Feira comunitária',
      'Feira cultural',
      'Feira de artesanato',
      'Feira de livros',
      'Feira de rua',
      'Feira gastronômica',
      'Festa de confraternização',
      'Festival comunitário',
      'Inauguração',
      'Mutirão comunitário',
      'Retiro espiritual'
    ]
  },
  'Tecnologia & Inovação': {
    id: 'tecnologia',
    subcategorias: [
      'Apresentação de produto tech',
      'Bootcamp de programação',
      'Conferência de tecnologia',
      'Evento de IA',
      'Evento de blockchain',
      'Evento de startups',
      'Expo tecnologia',
      'Feira de tecnologia',
      'Hackathon',
      'Lançamento de software',
      'Meetup de tecnologia',
      'Summit de inovação',
      'Workshop de programação'
    ]
  }
};

// ===== FUNÇÕES DE UTILIDADE =====

function obterCategoriasPrincipais() {
  return Object.keys(categoriasCompletas);
}

function obterSubcategorias(categoria) {
  if (categoriasCompletas[categoria]) {
    return categoriasCompletas[categoria].subcategorias;
  }
  return [];
}

function obterCategoriaPorSubcategoria(subcategoria) {
  for (const [categoria, dados] of Object.entries(categoriasCompletas)) {
    if (dados.subcategorias.includes(subcategoria)) {
      return categoria;
    }
  }
  return 'Outros';
}

function obterCategoriasSelecionadas() {
  return Array.from(new Set(obterSubcategoriasSeleccionadas().map(obterCategoriaPorSubcategoria)));
}

function obterCategoriaPrincipalSelecionada() {
  return obterCategoriasSelecionadas()[0] || 'Outros';
}

// ===== INTERFACE INTERATIVA =====

function inicializarSeletorCategorias(containerId = 'categorias-evento', selectedSubcategorias = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  container.classList.add('seletor-categorias-container');

  const categorias = obterCategoriasPrincipais();

  categorias.forEach(categoria => {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'categoria-card';

    // Botão da categoria
    const btnCategoria = document.createElement('button');
    btnCategoria.type = 'button';
    btnCategoria.className = 'btn-categoria';
    btnCategoria.textContent = categoria;
    btnCategoria.dataset.categoria = categoria;

    // Container de subcategorias (inicialmente oculto)
    const subcatContainer = document.createElement('div');
    subcatContainer.className = 'subcategorias-container hidden';
    subcatContainer.dataset.categoria = categoria;

    // Botão para expandir/recolher
    btnCategoria.addEventListener('click', (e) => {
      e.preventDefault();
      const isHidden = subcatContainer.classList.contains('hidden');
      
      // Recolher outras categorias abertas
      document.querySelectorAll('.subcategorias-container').forEach(container => {
        container.classList.add('hidden');
        container.classList.remove('visible');
      });
      document.querySelectorAll('.btn-categoria').forEach(btn => {
        btn.classList.remove('active');
      });

      // Expandir a clicada
      if (isHidden) {
        subcatContainer.classList.remove('hidden');
        subcatContainer.classList.add('visible');
        btnCategoria.classList.add('active');
      }
    });

    // Gerar checkboxes de subcategorias
    const subcategorias = obterSubcategorias(categoria);
    subcategorias.forEach(subcategoria => {
      const label = document.createElement('label');
      label.className = 'subcategoria-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = `subcat-${categoria}`;
      checkbox.value = subcategoria;

      const span = document.createElement('span');
      span.textContent = subcategoria;

      label.appendChild(checkbox);
      label.appendChild(span);
      subcatContainer.appendChild(label);
    });

    cardWrapper.appendChild(btnCategoria);
    cardWrapper.appendChild(subcatContainer);
    container.appendChild(cardWrapper);
  });

  if (Array.isArray(selectedSubcategorias) && selectedSubcategorias.length > 0) {
    restaurarSubcategoriasEdicao(selectedSubcategorias);
    abrirCategoriasSelecionadas(selectedSubcategorias);
  }
}

// Obter todas as subcategorias selecionadas (múltiplas categorias)
function obterSubcategoriasSeleccionadas() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"][name^="subcat-"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

function abrirCategoriasSelecionadas(subcategoriasSelecionadas = []) {
  const categoriasSelecionadas = new Set(subcategoriasSelecionadas.map(obterCategoriaPorSubcategoria));
  document.querySelectorAll('.subcategorias-container').forEach((container) => {
    const categoria = container.dataset.categoria;
    const btn = document.querySelector(`.btn-categoria[data-categoria="${categoria}"]`);
    if (categoriasSelecionadas.has(categoria)) {
      container.classList.remove('hidden');
      container.classList.add('visible');
      if (btn) btn.classList.add('active');
    } else {
      container.classList.add('hidden');
      container.classList.remove('visible');
      if (btn) btn.classList.remove('active');
    }
  });
}

// Restaurar subcategorias selecionadas em modo edição
function restaurarSubcategoriasEdicao(subcategoriasSelecionadas = []) {
  if (!Array.isArray(subcategoriasSelecionadas)) return;
  
  document.querySelectorAll('input[type="checkbox"][name^="subcat-"]').forEach((checkbox) => {
    checkbox.checked = subcategoriasSelecionadas.includes(checkbox.value);
  });
  abrirCategoriasSelecionadas(subcategoriasSelecionadas);
}

// Validar seleção (pelo menos uma subcategoria)
function validarSubcategorias() {
  const selecionadas = obterSubcategoriasSeleccionadas();
  return selecionadas.length > 0;
}

// CSS para o seletor (será injetado dinâmicamente)
function injetarEstilosSeletor() {
  const id = 'estilos-seletor-categorias';
  if (document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    .seletor-categorias-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }

    .categoria-card {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .btn-categoria {
      width: 100%;
      background: linear-gradient(135deg, #00bfff, #0099cc);
      color: #000;
      border: 2px solid rgba(255,255,255,0.12);
      padding: 14px 16px;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
      position: relative;
      font-size: 15px;
      box-shadow: inset 0 0 0 rgba(255,255,255,0);
    }
      background: linear-gradient(135deg, #00bfff, #0099cc);
      color: #000;
      border: none;
      padding: 14px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
      position: relative;
      font-size: 15px;
    }
    
    .btn-categoria:hover {
      background: linear-gradient(135deg, #00d9ff, #00aadd);
      transform: translateY(-2px);
      box-shadow: 0 4px 18px rgba(0, 191, 255, 0.25);
    }
    
    .btn-categoria.active {
      background: linear-gradient(135deg, #00d8ff, #0078c5);
      color: #fff;
      box-shadow: 0 10px 24px rgba(0, 191, 255, 0.28);
    }
      background: linear-gradient(135deg, #0077aa, #005588);
      color: #fff;
    }
    
    .btn-categoria::after {
      content: '▼';
      position: absolute;
      right: 12px;
      font-size: 12px;
      opacity: 0.6;
      transition: transform 0.3s ease;
    }
    
    .btn-categoria.active::after {
      transform: rotate(180deg);
    }
    
    .subcategorias-container {
      position: absolute;
      top: calc(100% + 10px);
      left: 0;
      right: 0;
      z-index: 20;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 10px;
      padding: 0 12px;
      background: rgba(10, 20, 40, 0.98);
      border-radius: 16px;
      border: 1px solid rgba(0, 191, 255, 0.18);
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.33);
      opacity: 0;
      max-height: 0;
      overflow: hidden;
      transition: all 0.28s ease;
      backdrop-filter: blur(12px);
    }
    
    .subcategorias-container.visible {
      opacity: 1;
      max-height: 420px;
      padding: 12px;
    }

    .subcategorias-container.hidden {
      opacity: 0;
      max-height: 0;
      padding-top: 0;
      padding-bottom: 0;
      border-color: transparent;
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .subcategoria-item {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 10px 12px;
      border-radius: 12px;
      transition: background 0.2s ease, transform 0.2s ease;
      font-size: 14px;
      color: #cfdcff;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
    }
    
    .subcategoria-item:hover {
      background: rgba(0, 191, 255, 0.12);
      transform: translateY(-1px);
    }
    
    .subcategoria-item input[type="checkbox"] {
      cursor: pointer;
      width: 18px;
      height: 18px;
      accent-color: #00bfff;
    }
    
    .subcategoria-item input[type="checkbox"]:checked + span {
      color: #00bfff;
      font-weight: 600;
    }
    
    .subcategoria-item span {
      user-select: none;
    }
  `;
  document.head.appendChild(style);
}

// Chamar ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  injetarEstilosSeletor();
});

