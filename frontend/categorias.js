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

function fecharCategoriasAbertas() {
  document.querySelectorAll('.subcategorias-container.visible').forEach(container => {
    container.classList.remove('visible');
    container.classList.add('hidden');
  });
  document.querySelectorAll('.btn-categoria.active').forEach(btn => {
    btn.classList.remove('active');
  });
}

// ===== INTERFACE INTERATIVA =====

function inicializarSeletorCategorias(containerId = 'categorias-evento', selectedSubcategorias = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  container.classList.add('seletor-categorias-container');

  if (!window.__seletorCategoriasOutsideClickInitialized) {
    window.__seletorCategoriasOutsideClickInitialized = true;
    document.addEventListener('click', (event) => {
      const selectors = document.querySelectorAll('.seletor-categorias-container');
      if (selectors.length === 0) return;
      const clickedInside = Array.from(selectors).some(selector => selector.contains(event.target));
      if (!clickedInside) {
        fecharCategoriasAbertas();
      }
    });
  }

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

      // Fechar todas as categorias abertas
      fecharCategoriasAbertas();

      if (isHidden) {
        subcatContainer.classList.remove('hidden');
        subcatContainer.classList.add('visible');
        btnCategoria.classList.add('active');
      }
    });

    cardWrapper.addEventListener('mouseleave', () => {
      if (subcatContainer.classList.contains('visible')) {
        subcatContainer.classList.remove('visible');
        subcatContainer.classList.add('hidden');
        btnCategoria.classList.remove('active');
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

      label.appendChild(span);
      label.appendChild(checkbox);
      subcatContainer.appendChild(label);
    });

    cardWrapper.appendChild(btnCategoria);
    cardWrapper.appendChild(subcatContainer);
    container.appendChild(cardWrapper);
  });

  if (Array.isArray(selectedSubcategorias) && selectedSubcategorias.length > 0) {
    restaurarSubcategoriasEdicao(selectedSubcategorias);
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

