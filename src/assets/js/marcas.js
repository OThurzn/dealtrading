/**
 * DEAL TRADING — marcas.js
 * Carrega e exibe marcas a partir do XML, com filtro por categoria e modal.
 *
 * Regras aplicadas:
 * - nome é obrigatório; marca sem nome é ignorada.
 * - campos opcionais vazios não são renderizados.
 * - sem logo: mostra o nome da marca no lugar da imagem.
 * - sem catálogo: botões aparecem desabilitados.
 * - qualquer erro de dados é tratado sem quebrar a interface.
 */

document.addEventListener('DOMContentLoaded', init);

const BRANDS_XML = 'src/assets/data/brands.xml';
const LOGOS_BASE = 'src/imgs/logos/';

let allMarcas = [];
let activeFilter = 'todos';
let modalRequestToken = 0;

async function init() {
  initMobileMenu();
  initModal();
  await loadBrandsFromXML();
}

async function loadBrandsFromXML() {
  const grid = document.getElementById('marcas-grid');
  const emptyEl = document.getElementById('brands-empty');
  const countEl = document.getElementById('marcas-count');

  try {
    const response = await fetch(BRANDS_XML, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xmlText = await response.text();
    const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml');

    if (xmlDoc.querySelector('parsererror')) {
      throw new Error('XML malformado');
    }

    allMarcas = parseMarcas(xmlDoc);
    buildFilters(allMarcas);
    renderCards(allMarcas);
  } catch (error) {
    console.error('[marcas.js] Falha ao carregar marcas:', error);

    if (grid) {
      grid.innerHTML = `
        <div class="brands-empty brands-empty--visible" style="grid-column: 1 / -1; display: block;">
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
          <p>Não foi possível carregar as marcas.</p>
          <button type="button" id="empty-reset" style="margin-top:.75rem;background:none;border:none;color:var(--gold-dark);font-weight:600;font-size:.95rem;cursor:pointer;">
            Tentar novamente
          </button>
        </div>
      `;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (countEl) countEl.textContent = '';
  }
}

function parseMarcas(xmlDoc) {
  const list = [];
  const marcas = xmlDoc.getElementsByTagName('marca');

  for (let i = 0; i < marcas.length; i += 1) {
    const marcaNode = marcas[i];

    // Garante que só processamos marcas diretamente dentro de <brands>
    if (!marcaNode.parentNode || marcaNode.parentNode.nodeName.toLowerCase() !== 'brands') {
      continue;
    }

    const nome = getTagText(marcaNode, 'nome');
    if (!nome) {
      continue; // nome é obrigatório
    }

    list.push({
      nome,
      categoria: getTagText(marcaNode, 'categoria') || null,
      logo: getTagText(marcaNode, 'logo') || null,
      descricao: getTagText(marcaNode, 'descricao') || null,
      url: getTagText(marcaNode, 'url') || null,
      catalogo: getTagText(marcaNode, 'catalogo') || null,
    });
  }

  return list;
}

function getTagText(parent, tagName) {
  try {
    const node = parent.getElementsByTagName(tagName)[0];
    return node ? (node.textContent || '').trim() : '';
  } catch (_) {
    return '';
  }
}

function buildFilters(marcas) {
  const container = document.getElementById('filters-container');
  if (!container) return;

  // Evita duplicar botões se a função rodar mais de uma vez.
  container.querySelectorAll('.filter-btn[data-dynamic="true"]').forEach((btn) => btn.remove());

  const categories = [...new Set(marcas.map((m) => m.categoria).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );

  categories.forEach((category) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-btn';
    btn.dataset.filter = category;
    btn.dataset.dynamic = 'true';
    btn.textContent = category;
    btn.addEventListener('click', () => setFilter(category));
    container.appendChild(btn);
  });

  document.getElementById('empty-reset')?.addEventListener('click', () => setFilter('todos'));
}

function setFilter(filter) {
  activeFilter = filter;

  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.filter === filter);
  });

  const filtered = filter === 'todos'
    ? allMarcas
    : allMarcas.filter((marca) => marca.categoria === filter);

  renderCards(filtered);
}

function renderCards(marcas) {
  const grid = document.getElementById('marcas-grid');
  const emptyEl = document.getElementById('brands-empty');
  const countEl = document.getElementById('marcas-count');
  if (!grid) return;

  grid.innerHTML = '';

  if (!marcas.length) {
    if (emptyEl) emptyEl.style.display = 'block';
    if (countEl) countEl.textContent = '';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  if (countEl) {
    countEl.innerHTML = marcas.length === allMarcas.length
      ? `<strong>${allMarcas.length}</strong> marcas no portfólio`
      : `Exibindo <strong>${marcas.length}</strong> de <strong>${allMarcas.length}</strong>`;
  }

  marcas.forEach((marca) => {
    grid.appendChild(createCard(marca));
  });
}

function createCard(marca) {
  const card = document.createElement('article');
  card.className = 'brand-card';
  card.setAttribute('role', 'listitem');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Ver detalhes de ${marca.nome}`);

  const logoWrap = document.createElement('div');
  logoWrap.className = 'brand-card__logo-wrap';
  renderLogo(logoWrap, marca.logo, marca.nome, false);

  const body = document.createElement('div');
  body.className = 'brand-card__body';

  if (marca.categoria) {
    const cat = document.createElement('span');
    cat.className = 'brand-card__cat';
    cat.textContent = marca.categoria;
    body.appendChild(cat);
  }

  const title = document.createElement('h3');
  title.className = 'brand-card__name';
  title.textContent = marca.nome;
  body.appendChild(title);

  const footer = document.createElement('div');
  footer.className = 'brand-card__footer';

  const cta = document.createElement('span');
  cta.className = 'brand-card__cta';
  cta.innerHTML = 'Ver detalhes <i class="fa-solid fa-arrow-right fa-xs"></i>';

  const catalogIcon = document.createElement('span');
  catalogIcon.className = `brand-card__catalog-icon${marca.catalogo ? ' has-catalog' : ''}`;
  catalogIcon.title = marca.catalogo ? 'Catálogo disponível' : 'Sem catálogo';
  catalogIcon.innerHTML = marca.catalogo
    ? '<i class="fa-solid fa-file-pdf"></i>'
    : '<i class="fa-regular fa-file-pdf"></i>';

  footer.append(cta, catalogIcon);
  card.append(logoWrap, body, footer);

  const open = () => openModal(marca);
  card.addEventListener('click', open);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  });

  return card;
}

function renderLogo(wrap, logoFile, nome, isDark) {
  if (!wrap) return;

  wrap.innerHTML = '';
  wrap.classList.remove('logo-placeholder', 'logo-placeholder--dark');

  if (logoFile) {
    const img = document.createElement('img');
    img.src = `${LOGOS_BASE}${logoFile}`;
    img.alt = nome;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.onerror = () => setPlaceholder(wrap, nome, isDark);
    wrap.appendChild(img);
    return;
  }

  setPlaceholder(wrap, nome, isDark);
}

function setPlaceholder(wrap, nome, isDark) {
  if (!wrap) return;

  wrap.innerHTML = '';
  wrap.textContent = nome || 'Marca';
  wrap.classList.add('logo-placeholder');
  if (isDark) wrap.classList.add('logo-placeholder--dark');
}

function initModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });

  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });
}

async function openModal(marca) {
  const overlay = document.getElementById('modal-overlay');
  const logoEl = document.getElementById('modal-logo');
  const catEl = document.getElementById('modal-cat');
  const nameEl = document.getElementById('modal-name');
  const descEl = document.getElementById('modal-desc');
  const metaEl = document.getElementById('modal-meta');
  const catalogEl = document.getElementById('modal-catalog');

  if (!overlay || !logoEl || !catEl || !nameEl || !descEl || !metaEl || !catalogEl) {
    return;
  }

  const requestToken = ++modalRequestToken;

  renderLogo(logoEl, marca.logo, marca.nome, true);
  catEl.textContent = marca.categoria || '';
  catEl.style.display = marca.categoria ? '' : 'none';
  nameEl.textContent = marca.nome;

  if (marca.descricao) {
    descEl.textContent = marca.descricao;
    descEl.style.display = '';
  } else {
    descEl.textContent = '';
    descEl.style.display = 'none';
  }

  metaEl.innerHTML = '';
  if (marca.categoria) {
    metaEl.appendChild(createMetaItem('Segmento', marca.categoria));
  }
  if (marca.url) {
    const link = document.createElement('a');
    link.href = normalizeUrl(marca.url);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = marca.url;
    metaEl.appendChild(createMetaItem('Site oficial', link));
  }
  metaEl.style.display = metaEl.children.length ? 'flex' : 'none';

  renderCatalogActions(catalogEl, false);
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  document.getElementById('modal-close')?.focus();

  if (marca.catalogo) {
    const available = await isAssetAvailable(marca.catalogo);

    // Evita atualização atrasada se o modal já foi trocado/fechado.
    if (requestToken !== modalRequestToken || !overlay.classList.contains('is-open')) {
      return;
    }

    renderCatalogActions(catalogEl, available, marca.catalogo);
  }
}

function normalizeUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '#';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

async function isAssetAvailable(path) {
  const url = String(path || '').trim();
  if (!url) return false;

  try {
    const head = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (head.ok) return true;

    // Alguns servidores não aceitam HEAD. Fallback para GET.
    if (head.status === 405 || head.status === 501) {
      const get = await fetch(url, { method: 'GET', cache: 'no-store' });
      return get.ok;
    }

    return false;
  } catch (_) {
    return false;
  }
}

function renderCatalogActions(container, available, catalogUrl = '') {
  if (!container) return;
  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'modal__catalog-actions';

  const view = document.createElement(available ? 'a' : 'button');
  view.className = 'btn btn--primary';
  view.innerHTML = '<i class="fa-solid fa-eye"></i> Visualizar catálogo';

  const download = document.createElement(available ? 'a' : 'button');
  download.className = 'btn btn--ghost';
  download.innerHTML = '<i class="fa-solid fa-download"></i> Baixar catálogo';

  if (available && catalogUrl) {
    view.href = catalogUrl;
    view.target = '_blank';
    view.rel = 'noopener noreferrer';

    download.href = catalogUrl;
    download.download = '';
  } else {
    view.type = 'button';
    view.disabled = true;
    download.type = 'button';
    download.disabled = true;
  }

  wrap.append(view, download);
  container.appendChild(wrap);

  if (!available) {
    const note = document.createElement('p');
    note.className = 'modal__no-catalog';
    note.innerHTML = 'Catálogo indisponível no momento.';
    container.appendChild(note);
  }
}

function createMetaItem(label, valueOrNode) {
  const item = document.createElement('div');
  item.className = 'modal__meta-item';

  const labelEl = document.createElement('span');
  labelEl.className = 'modal__meta-label';
  labelEl.textContent = label;

  const valueEl = document.createElement('span');
  valueEl.className = 'modal__meta-value';

  if (typeof valueOrNode === 'string') {
    valueEl.textContent = valueOrNode;
  } else {
    valueEl.appendChild(valueOrNode);
  }

  item.append(labelEl, valueEl);
  return item;
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('is-open');
  }
  document.body.style.overflow = '';
  modalRequestToken += 1;
}

function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-mobile');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
}
