/**
 * DEAL TRADING — marcas.js
 * Carrega marcas via src/data/brands.xml, renderiza cards com filtro por categoria
 * e abre modal com informações + botões de catálogo (visualizar / baixar).
 *
 * Estrutura de arquivos esperada:
 *   src/data/brands.xml
 *   src/imgs/logos/<logo>.png
 *   src/catalogos/<catalogo>.pdf
 *   src/assets/js/marcas.js  ← este arquivo
 */

document.addEventListener('DOMContentLoaded', init);

// ─── Configuração ───────────────────────────────────────────────
const BRANDS_XML  = 'src/data/brands.xml';
const LOGOS_BASE  = 'src/imgs/logos/';

// ─── Estado global ──────────────────────────────────────────────
let allMarcas    = [];
let activeFilter = 'todos';

// ─── Inicialização ───────────────────────────────────────────────
async function init() {
  initMobileMenu();
  await loadBrandsFromXML();
  initModal();
}

// ─── Carregamento e parse do XML ─────────────────────────────────
async function loadBrandsFromXML() {
  try {
    const res = await fetch(BRANDS_XML);
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const text   = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');

    const err = xmlDoc.querySelector('parsererror');
    if (err) throw new Error('XML inválido: ' + err.textContent);

    allMarcas = parseMarcas(xmlDoc);

    buildFilters(allMarcas);
    renderCards(allMarcas);

  } catch (e) {
    console.error('Erro ao carregar marcas:', e);
    const grid = document.getElementById('marcas-grid');
    if (grid) {
      grid.innerHTML =
        '<p style="grid-column:1/-1;padding:2rem 0;color:var(--text-muted);text-align:center">' +
        'Não foi possível carregar as marcas.<br>Certifique-se de acessar via servidor HTTP.' +
        '</p>';
    }
  }
}

function parseMarcas(xmlDoc) {
  const list    = [];
  const marcaEls = xmlDoc.getElementsByTagName('marca');

  for (let i = 0; i < marcaEls.length; i++) {
    const el = marcaEls[i];
    // garante que é filho direto de <brands>
    if (el.parentNode.nodeName.toLowerCase() !== 'brands') continue;

    const nome = getText(el, 'nome');
    if (!nome) continue;

    list.push({
      nome:      nome,
      categoria: getText(el, 'categoria') || '',
      logo:      getText(el, 'logo')      || null,
      descricao: getText(el, 'descricao') || '',
      url:       getText(el, 'url')       || null,
      catalogo:  getText(el, 'catalogo')  || null,
    });
  }
  return list;
}

function getText(parent, tag) {
  const el = parent.getElementsByTagName(tag)[0];
  return el ? (el.textContent || '').trim() : '';
}

// ─── Filtros ─────────────────────────────────────────────────────
function buildFilters(marcas) {
  const container = document.getElementById('filters-container');
  if (!container) return;

  // Categorias únicas (ignora vazias), ordenadas
  const cats = [...new Set(marcas.map(m => m.categoria).filter(Boolean))].sort();

  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className   = 'filter-btn';
    btn.dataset.filter = cat;
    btn.type        = 'button';
    btn.textContent = cat;
    btn.addEventListener('click', () => setFilter(cat));
    container.appendChild(btn);
  });

  // Botão "Todos" já existe no HTML — apenas conecta o evento
  const todosBtn = container.querySelector('[data-filter="todos"]');
  if (todosBtn) todosBtn.addEventListener('click', () => setFilter('todos'));

  // Botão reset do estado vazio
  const emptyReset = document.getElementById('empty-reset');
  if (emptyReset) emptyReset.addEventListener('click', () => setFilter('todos'));
}

function setFilter(cat) {
  activeFilter = cat;

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.filter === cat);
  });

  const filtered = cat === 'todos'
    ? allMarcas
    : allMarcas.filter(m => m.categoria === cat);

  renderCards(filtered);
}

// ─── Renderização dos cards ───────────────────────────────────────
function renderCards(marcas) {
  const grid     = document.getElementById('marcas-grid');
  const emptyEl  = document.getElementById('brands-empty');
  const countEl  = document.getElementById('marcas-count');

  if (!grid) return;

  grid.innerHTML = '';

  if (marcas.length === 0) {
    if (emptyEl)  emptyEl.style.display  = 'block';
    if (countEl)  countEl.innerHTML      = '';
    return;
  }

  if (emptyEl)  emptyEl.style.display = 'none';

  if (countEl) {
    countEl.innerHTML = marcas.length === allMarcas.length
      ? '<strong>' + allMarcas.length + '</strong> marcas no portfólio'
      : 'Exibindo <strong>' + marcas.length + '</strong> de <strong>' + allMarcas.length + '</strong> marcas';
  }

  marcas.forEach((marca, i) => {
    grid.appendChild(createCard(marca, i));
  });
}

function createCard(marca, index) {
  const card = document.createElement('article');
  card.className = 'brand-card';
  card.setAttribute('role', 'listitem');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', 'Ver detalhes de ' + marca.nome);

  // Área do logo
  const logoWrap = document.createElement('div');
  logoWrap.className = 'brand-card__logo-wrap';

  if (marca.logo) {
    const img = document.createElement('img');
    img.src   = LOGOS_BASE + marca.logo;
    img.alt   = marca.nome;
    img.onerror = () => {
      img.remove();
      logoWrap.textContent = marca.nome.charAt(0).toUpperCase();
      logoWrap.classList.add('logo-placeholder');
    };
    logoWrap.appendChild(img);
  } else {
    logoWrap.textContent = marca.nome.charAt(0).toUpperCase();
    logoWrap.classList.add('logo-placeholder');
  }

  // Body
  const body = document.createElement('div');
  body.className = 'brand-card__body';

  if (marca.categoria) {
    const cat = document.createElement('span');
    cat.className   = 'brand-card__cat';
    cat.textContent = marca.categoria;
    body.appendChild(cat);
  }

  const name = document.createElement('h3');
  name.className   = 'brand-card__name';
  name.textContent = marca.nome;
  body.appendChild(name);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'brand-card__footer';

  const cta = document.createElement('span');
  cta.className = 'brand-card__cta';
  cta.innerHTML = 'Ver detalhes <i class="fa-solid fa-arrow-right fa-xs"></i>';

  const catIcon = document.createElement('span');
  catIcon.className = 'brand-card__catalog-icon' + (marca.catalogo ? ' has-catalog' : '');
  catIcon.innerHTML = marca.catalogo
    ? '<i class="fa-solid fa-file-pdf"></i>'
    : '<i class="fa-regular fa-file"></i>';
  catIcon.title = marca.catalogo ? 'Catálogo disponível' : 'Sem catálogo';

  footer.appendChild(cta);
  footer.appendChild(catIcon);

  card.appendChild(logoWrap);
  card.appendChild(body);
  card.appendChild(footer);

  // Eventos de abertura do modal
  card.addEventListener('click', () => openModal(marca));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal(marca);
    }
  });

  return card;
}

// ─── Modal ───────────────────────────────────────────────────────
function initModal() {
  const overlay  = document.getElementById('modal-overlay');
  const closeBtn = document.getElementById('modal-close');
  if (!overlay) return;

  // Fecha ao clicar fora (no overlay)
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });

  // Fecha pelo botão X
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Fecha com Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

function openModal(marca) {
  const overlay   = document.getElementById('modal-overlay');
  const logoEl    = document.getElementById('modal-logo');
  const catEl     = document.getElementById('modal-cat');
  const nameEl    = document.getElementById('modal-name');
  const descEl    = document.getElementById('modal-desc');
  const metaEl    = document.getElementById('modal-meta');
  const catalogEl = document.getElementById('modal-catalog');

  if (!overlay) return;

  // ── Logo
  logoEl.innerHTML = '';
  logoEl.className = 'modal__logo';

  if (marca.logo) {
    const img = document.createElement('img');
    img.src   = LOGOS_BASE + marca.logo;
    img.alt   = marca.nome;
    img.onerror = () => {
      img.remove();
      logoEl.textContent = marca.nome.charAt(0).toUpperCase();
      logoEl.classList.add('logo-placeholder');
    };
    logoEl.appendChild(img);
  } else {
    logoEl.textContent = marca.nome.charAt(0).toUpperCase();
    logoEl.classList.add('logo-placeholder');
  }

  // ── Textos
  catEl.textContent  = marca.categoria || 'Marca';
  nameEl.textContent = marca.nome;
  descEl.textContent = marca.descricao || 'Informações detalhadas disponíveis sob consulta.';

  // ── Meta
  metaEl.innerHTML = '';
  if (marca.categoria) {
    metaEl.appendChild(metaItem('Segmento', marca.categoria));
  }
  if (marca.url) {
    const urlFull = marca.url.startsWith('http') ? marca.url : 'https://' + marca.url;
    const a = document.createElement('a');
    a.href   = urlFull;
    a.target = '_blank';
    a.rel    = 'noopener noreferrer';
    a.textContent = marca.url;
    metaEl.appendChild(metaItem('Site oficial', a));
  }
  metaEl.style.display = metaEl.children.length ? 'flex' : 'none';

  // ── Área catálogo
  catalogEl.innerHTML = '';
  if (marca.catalogo) {
    const wrap = document.createElement('div');
    wrap.className = 'modal__catalog-actions';

    // Botão visualizar
    const view = document.createElement('a');
    view.href      = marca.catalogo;
    view.target    = '_blank';
    view.rel       = 'noopener noreferrer';
    view.className = 'btn btn--primary';
    view.innerHTML = '<i class="fa-solid fa-eye"></i> Visualizar catálogo';

    // Botão baixar
    const dl = document.createElement('a');
    dl.href      = marca.catalogo;
    dl.download  = '';
    dl.className = 'btn btn--ghost';
    dl.innerHTML = '<i class="fa-solid fa-download"></i> Baixar catálogo';

    wrap.appendChild(view);
    wrap.appendChild(dl);
    catalogEl.appendChild(wrap);
  } else {
    const nocat = document.createElement('p');
    nocat.className = 'modal__no-catalog';
    nocat.innerHTML =
      '<i class="fa-solid fa-circle-info" style="margin-right:.35rem"></i>' +
      'Catálogo disponível sob consulta. ' +
      '<a href="index.html#contato">Fale conosco</a>.';
    catalogEl.appendChild(nocat);
  }

  // ── Abre
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  // Foco para acessibilidade
  setTimeout(() => {
    const closeBtn = document.getElementById('modal-close');
    if (closeBtn) closeBtn.focus();
  }, 50);
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('is-open');
  document.body.style.overflow = '';
}

/** Cria um item de metadado para o modal */
function metaItem(label, valueOrEl) {
  const item = document.createElement('div');
  item.className = 'modal__meta-item';

  const lbl = document.createElement('span');
  lbl.className   = 'modal__meta-label';
  lbl.textContent = label;

  const val = document.createElement('span');
  val.className = 'modal__meta-value';

  if (typeof valueOrEl === 'string') {
    val.textContent = valueOrEl;
  } else {
    val.appendChild(valueOrEl);
  }

  item.appendChild(lbl);
  item.appendChild(val);
  return item;
}

// ─── Menu mobile ─────────────────────────────────────────────────
function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav    = document.querySelector('.nav-mobile');
  if (!toggle || !nav) return;

  const setOpen = open => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') setOpen(false);
  });
}