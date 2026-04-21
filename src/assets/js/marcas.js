/**
 * DEAL TRADING — marcas.js  (v3)
 *
 * Novidades v3:
 *  - Pasta base de arquivos centralizada: src/arquivos/<NOME-MARCA>/<arquivo>
 *  - XML usa apenas <nome> do arquivo; JS monta o path completo automaticamente
 *  - Parse tolerante a erro humano: barras mistas, espaços, case incorreto, tags erradas
 *  - Paginação nos arquivos do modal (5 por página desktop / 3 mobile)
 *  - Layout de arquivos redesenhado para mobile-first
 */

document.addEventListener('DOMContentLoaded', init);

// ── Constantes ───────────────────────────────────────────────────────────────
const BRANDS_XML = 'src/assets/data/brands.xml';
const LOGOS_BASE = 'src/imgs/logos/';
const ARQUIVOS_BASE = 'src/arquivos/';   // <-- única fonte da verdade para paths

// Paginação
const PAGE_SIZE_DESKTOP = 5;
const PAGE_SIZE_MOBILE = 3;

// Ícone FA por tipo
const TYPE_ICON = {
  pdf: 'fa-solid fa-file-pdf',
  video: 'fa-solid fa-circle-play',
  imagem: 'fa-solid fa-image',
  link: 'fa-solid fa-arrow-up-right-from-square',
};

const TYPE_COLOR_CLASS = {
  pdf: 'media-badge--pdf',
  video: 'media-badge--video',
  imagem: 'media-badge--imagem',
  link: 'media-badge--link',
};

// ── Estado global ─────────────────────────────────────────────────────────────
let allMarcas = [];
let activeFilter = 'todos';

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function init() {
  initModal();
  await loadBrandsFromXML();
}

// ── XML ───────────────────────────────────────────────────────────────────────
async function loadBrandsFromXML() {
  const grid = document.getElementById('marcas-grid');
  const emptyEl = document.getElementById('brands-empty');
  const countEl = document.getElementById('marcas-count');
  try {
    const res = await fetch(BRANDS_XML, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
    if (xml.querySelector('parsererror')) throw new Error('XML malformado');
    allMarcas = parseMarcas(xml);
    buildFilters(allMarcas);
    renderCards(allMarcas);
  } catch (err) {
    console.error('[marcas.js] Falha ao carregar marcas:', err);
    if (grid) grid.innerHTML = errorHTML();
    if (emptyEl) emptyEl.hidden = true;
    if (countEl) countEl.textContent = '';
  }
}

function errorHTML() {
  return `<div class="brands-empty brands-empty--visible" style="grid-column:1/-1">
    <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
    <p>Não foi possível carregar as marcas.</p>
    <button type="button" onclick="location.reload()" class="brands-empty__action">Tentar novamente</button>
  </div>`;
}

/**
 * Converte nomes de marcas em slugs de pasta.
 * "Porto Tyres" → "PORTO-TYRES"
 * "AGATE"       → "AGATE"
 */
function marcaToFolderSlug(nome) {
  return nome
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')       // espaços → hífens
    .replace(/[^\w-]/g, '');    // remove caracteres inválidos em nome de pasta
}

/**
 * Normaliza um nome de arquivo vindo do XML:
 *  - Remove barras e diretórios (caso alguém cole um path completo por engano)
 *  - Normaliza separadores \\ → /
 *  - Trim
 * Retorna apenas o filename limpo, ou '' se inválido.
 */
function sanitizeFileName(raw) {
  if (!raw) return '';
  // normaliza separadores, pega só o último segmento (filename)
  const clean = raw.trim().replace(/\\/g, '/');
  const parts = clean.split('/');
  return parts[parts.length - 1].trim();
}

/**
 * Monta o path completo de um arquivo.
 * Para tipo "link" devolve a URL como está (pode ser http/https).
 */
function buildFilePath(tipo, nomeArquivo, marcaNome) {
  if (tipo === 'link') return nomeArquivo; // URL externa — usa direto
  const folder = marcaToFolderSlug(marcaNome);
  const filename = sanitizeFileName(nomeArquivo);
  if (!filename) return null;
  return `${ARQUIVOS_BASE}${folder}/${filename}`;
}

/**
 * Parseia o XML em objetos JS.
 * Tolerante a: tags <path> legadas, barras mistas, tags <arquivos> aninhadas incorretamente.
 * Shape: { nome, categoria, logo, descricao, url, arquivos: [{ tipo, label, path }] }
 */
function parseMarcas(xml) {
  const list = [];

  for (const node of xml.getElementsByTagName('marca')) {
    if (node.parentNode?.nodeName?.toLowerCase() !== 'brands') continue;

    const nome = tagText(node, 'nome');
    if (!nome) continue;

    const arquivos = [];

    // Suporta tanto <nome> (novo) quanto <path> (legado) dentro de <arquivo>
    // Pega o nó <arquivos> imediato desta marca (não de marcas filhas)
    const arquivosNode = findDirectChild(node, 'arquivos');
    if (arquivosNode) {
      for (const arq of arquivosNode.getElementsByTagName('arquivo')) {
        // Garante que o <arquivo> pertence a este <arquivos>, não um aninhado errôneo
        if (arq.parentNode !== arquivosNode) continue;

        const tipo = (tagText(arq, 'tipo') || '').toLowerCase().trim();
        const label = tagText(arq, 'label') || '';

        // Aceita <nome> (novo) ou <path> (legado) — o que estiver preenchido
        const nomeArq = tagText(arq, 'nome') || tagText(arq, 'path') || '';

        if (!tipo || !nomeArq) continue;
        if (!TYPE_ICON[tipo]) {
          console.warn(`[marcas.js] Tipo desconhecido ignorado: "${tipo}" em ${nome}`);
          continue;
        }

        const path = buildFilePath(tipo, nomeArq, nome);
        if (!path) {
          console.warn(`[marcas.js] Nome de arquivo inválido ignorado em ${nome}: "${nomeArq}"`);
          continue;
        }

        arquivos.push({ tipo, label: label || nomeArq, path });
      }
    }

    list.push({
      nome,
      categoria: tagText(node, 'categoria') || null,
      logo: tagText(node, 'logo') || null,
      descricao: tagText(node, 'descricao') || null,
      url: tagText(node, 'url') || null,
      arquivos,
    });
  }
  return list;
}

/** Retorna o primeiro filho direto com o tagName dado (case-insensitive) */
function findDirectChild(parent, tagName) {
  const lower = tagName.toLowerCase();
  for (const child of parent.childNodes) {
    if (child.nodeName && child.nodeName.toLowerCase() === lower) return child;
  }
  return null;
}

function tagText(parent, tag) {
  try {
    const node = parent.getElementsByTagName(tag)[0];
    return node ? node.textContent.trim() : '';
  } catch (_) { return ''; }
}

// ── Filtros ───────────────────────────────────────────────────────────────────
function buildFilters(marcas) {
  const container = document.getElementById('filters-container');
  if (!container) return;
  container.querySelectorAll('.filter-btn[data-dynamic]').forEach(b => b.remove());

  const cats = [...new Set(marcas.map(m => m.categoria).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-btn';
    btn.dataset.filter = cat;
    btn.dataset.dynamic = 'true';
    btn.textContent = cat;
    btn.addEventListener('click', () => setFilter(cat));
    container.appendChild(btn);
  });

  document.getElementById('empty-reset')?.addEventListener('click', () => setFilter('todos'));
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b =>
    b.classList.toggle('is-active', b.dataset.filter === filter)
  );
  renderCards(filter === 'todos' ? allMarcas : allMarcas.filter(m => m.categoria === filter));
}

// ── Cards ─────────────────────────────────────────────────────────────────────
function renderCards(marcas) {
  const grid = document.getElementById('marcas-grid');
  const emptyEl = document.getElementById('brands-empty');
  const countEl = document.getElementById('marcas-count');
  if (!grid) return;

  grid.innerHTML = '';

  if (!marcas.length) {
    emptyEl?.classList.add('brands-empty--visible');
    if (emptyEl) emptyEl.hidden = false;
    if (countEl) countEl.textContent = '';
    return;
  }

  emptyEl?.classList.remove('brands-empty--visible');
  if (emptyEl) emptyEl.hidden = true;

  if (countEl) {
    countEl.innerHTML = marcas.length === allMarcas.length
      ? `<strong>${allMarcas.length}</strong> marcas no portfólio`
      : `Exibindo <strong>${marcas.length}</strong> de <strong>${allMarcas.length}</strong>`;
  }

  marcas.forEach(m => grid.appendChild(createCard(m)));
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
  footer.append(cta, buildCardMediaIndicator(marca.arquivos));
  card.append(logoWrap, body, footer);

  const open = () => openModal(marca);
  card.addEventListener('click', open);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
  return card;
}

function buildCardMediaIndicator(arquivos) {
  const wrap = document.createElement('span');
  wrap.className = 'brand-card__media-indicator';

  if (!arquivos.length) {
    wrap.classList.add('no-media');
    wrap.title = 'Sem arquivos disponíveis';
    wrap.innerHTML = '<i class="fa-regular fa-folder-open"></i>';
    return wrap;
  }
  if (arquivos.length === 1) {
    const tipo = arquivos[0].tipo;
    wrap.classList.add('has-media', TYPE_COLOR_CLASS[tipo] || '');
    wrap.title = arquivos[0].label || tipoLabel(tipo);
    wrap.innerHTML = `<i class="${TYPE_ICON[tipo]}"></i>`;
    return wrap;
  }
  wrap.classList.add('has-media', 'has-media--multi');
  wrap.title = `${arquivos.length} arquivos disponíveis`;
  wrap.innerHTML = `<i class="fa-solid fa-layer-group"></i><span class="media-count">${arquivos.length}</span>`;
  return wrap;
}

function tipoLabel(tipo) {
  return { pdf: 'PDF', video: 'Vídeo', imagem: 'Imagem', link: 'Link' }[tipo] || tipo;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function initModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

function openModal(marca) {
  const overlay = document.getElementById('modal-overlay');
  const logoEl = document.getElementById('modal-logo');
  const catEl = document.getElementById('modal-cat');
  const nameEl = document.getElementById('modal-name');
  const descEl = document.getElementById('modal-desc');
  const metaEl = document.getElementById('modal-meta');
  const filesEl = document.getElementById('modal-files');
  if (!overlay || !logoEl || !nameEl) return;

  renderLogo(logoEl, marca.logo, marca.nome, true);
  catEl.textContent = marca.categoria || '';
  catEl.hidden = !marca.categoria;
  nameEl.textContent = marca.nome;

  if (descEl) {
    descEl.textContent = marca.descricao || '';
    descEl.hidden = !marca.descricao;
  }

  if (metaEl) {
    metaEl.innerHTML = '';
    if (marca.categoria) metaEl.appendChild(metaItem('Segmento', marca.categoria));
    if (marca.url) {
      const a = document.createElement('a');
      a.href = normalizeUrl(marca.url);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = marca.url;
      metaEl.appendChild(metaItem('Site oficial', a));
    }
    metaEl.hidden = !metaEl.children.length;
  }

  if (filesEl) {
    filesEl.innerHTML = '';
    if (!marca.arquivos.length) {
      filesEl.appendChild(emptyFilesMessage());
    } else {
      filesEl.appendChild(buildFilesPaginated(marca.arquivos));
    }
  }

  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  document.getElementById('modal-close')?.focus();
}

function closeModal() {
  document.getElementById('modal-overlay')?.classList.remove('is-open');
  document.body.style.overflow = '';
  document.querySelectorAll('#modal-files video').forEach(v => v.pause());
}

// ── Seção de arquivos com paginação ───────────────────────────────────────────

function emptyFilesMessage() {
  const p = document.createElement('p');
  p.className = 'modal__no-files';
  p.innerHTML = '<i class="fa-regular fa-folder-open"></i> Nenhum arquivo disponível para esta marca.';
  return p;
}

/**
 * Detecta se é mobile (≤ 640px) e retorna o page size adequado.
 */
function getPageSize() {
  try {
    return window.matchMedia('(max-width: 640px)').matches
      ? PAGE_SIZE_MOBILE
      : PAGE_SIZE_DESKTOP;
  } catch (_) {
    return PAGE_SIZE_DESKTOP;
  }
}

/**
 * Constrói a seção de arquivos com paginação.
 * Se couber numa só página, não mostra controles de paginação.
 */
function buildFilesPaginated(arquivos) {
  const wrap = document.createElement('div');
  wrap.className = 'modal__files-wrap';

  const pageSize = getPageSize();
  const total = arquivos.length;
  const pages = Math.ceil(total / pageSize);

  // Estado de página local (closure)
  let currentPage = 0;

  // Cabeçalho
  const header = document.createElement('div');
  header.className = 'modal__files-header';

  const countSpan = document.createElement('span');
  countSpan.className = 'modal__files-count';
  header.appendChild(countSpan);

  // Controles de paginação (só renderiza se necessário)
  let paginationEl = null;
  if (pages > 1) {
    paginationEl = document.createElement('div');
    paginationEl.className = 'modal__files-pagination';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'modal__page-btn modal__page-btn--prev';
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prevBtn.setAttribute('aria-label', 'Página anterior');

    const pageInfo = document.createElement('span');
    pageInfo.className = 'modal__page-info';

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'modal__page-btn modal__page-btn--next';
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    nextBtn.setAttribute('aria-label', 'Próxima página');

    prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
    nextBtn.addEventListener('click', () => goToPage(currentPage + 1));

    paginationEl.append(prevBtn, pageInfo, nextBtn);
    header.appendChild(paginationEl);
  }

  // Lista de arquivos
  const list = document.createElement('div');
  list.className = 'modal__files-list';

  wrap.append(header, list);

  function goToPage(page) {
    currentPage = Math.max(0, Math.min(pages - 1, page));
    render();
  }

  function render() {
    list.innerHTML = '';

    const start = currentPage * pageSize;
    const slice = arquivos.slice(start, start + pageSize);

    // Atualiza cabeçalho
    if (pages > 1) {
      countSpan.textContent = `${start + 1}–${Math.min(start + pageSize, total)} de ${total} arquivo${total !== 1 ? 's' : ''}`;
    } else {
      countSpan.textContent = `${total} arquivo${total !== 1 ? 's' : ''}`;
    }

    // Atualiza info de página e estado dos botões
    if (paginationEl) {
      paginationEl.querySelector('.modal__page-info').textContent = `${currentPage + 1} / ${pages}`;
      paginationEl.querySelector('.modal__page-btn--prev').disabled = currentPage === 0;
      paginationEl.querySelector('.modal__page-btn--next').disabled = currentPage === pages - 1;
    }

    // Renderiza os cards de arquivo desta página
    slice.forEach(arq => list.appendChild(buildFileCard(arq)));
  }

  render();
  return wrap;
}

/**
 * Card de arquivo — layout redesenhado para mobile-first.
 * Ícone grande, label proeminente, botões full-width no mobile.
 */
function buildFileCard(arq) {
  const card = document.createElement('div');
  card.className = `modal__file-card modal__file-card--${arq.tipo}`;

  // Ícone de tipo
  const iconWrap = document.createElement('div');
  iconWrap.className = 'modal__file-card__icon';
  iconWrap.setAttribute('aria-hidden', 'true');
  iconWrap.innerHTML = `<i class="${TYPE_ICON[arq.tipo] || 'fa-solid fa-file'}"></i>`;

  // Info
  const info = document.createElement('div');
  info.className = 'modal__file-card__info';

  const labelEl = document.createElement('span');
  labelEl.className = 'modal__file-card__label';
  labelEl.textContent = arq.label || tipoLabel(arq.tipo);

  const typeEl = document.createElement('span');
  typeEl.className = 'modal__file-card__type';
  typeEl.textContent = tipoLabel(arq.tipo).toUpperCase();

  info.append(labelEl, typeEl);

  // Ações
  const actions = document.createElement('div');
  actions.className = 'modal__file-card__actions';

  switch (arq.tipo) {
    case 'pdf':
      actions.appendChild(makeLink(arq.path, '_blank', 'fa-solid fa-eye', 'Visualizar'));
      actions.appendChild(makeDownload(arq.path, 'fa-solid fa-download', 'Baixar'));
      break;

    case 'video': {
      const toggleBtn = makeButton('fa-solid fa-play', 'Reproduzir', 'modal__file-action-btn');
      actions.appendChild(toggleBtn);
      card.append(iconWrap, info, actions);

      const playerWrap = document.createElement('div');
      playerWrap.className = 'modal__file-card__player modal__file-card__player--video';
      playerWrap.hidden = true;
      const video = document.createElement('video');
      video.src = arq.path;
      video.controls = true;
      video.preload = 'metadata';
      playerWrap.appendChild(video);
      card.appendChild(playerWrap);

      let expanded = false;
      toggleBtn.addEventListener('click', () => {
        expanded = !expanded;
        playerWrap.hidden = !expanded;
        toggleBtn.innerHTML = expanded
          ? '<i class="fa-solid fa-chevron-up"></i> Fechar'
          : '<i class="fa-solid fa-play"></i> Reproduzir';
        if (!expanded) video.pause();
      });
      return card;
    }

    case 'imagem': {
      const toggleBtn = makeButton('fa-solid fa-expand', 'Visualizar', 'modal__file-action-btn');
      actions.appendChild(toggleBtn);
      card.append(iconWrap, info, actions);

      const previewWrap = document.createElement('div');
      previewWrap.className = 'modal__file-card__player modal__file-card__player--imagem';
      previewWrap.hidden = true;
      const img = document.createElement('img');
      img.src = arq.path;
      img.alt = arq.label || 'Imagem';
      img.loading = 'lazy';
      previewWrap.appendChild(img);
      card.appendChild(previewWrap);

      let expanded = false;
      toggleBtn.addEventListener('click', () => {
        expanded = !expanded;
        previewWrap.hidden = !expanded;
        toggleBtn.innerHTML = expanded
          ? '<i class="fa-solid fa-compress"></i> Fechar'
          : '<i class="fa-solid fa-expand"></i> Visualizar';
      });
      return card;
    }

    case 'link':
      actions.appendChild(makeLink(arq.path, '_blank', 'fa-solid fa-arrow-up-right-from-square', 'Acessar'));
      break;

    default:
      actions.appendChild(makeLink(arq.path, '_blank', 'fa-solid fa-external-link', 'Abrir'));
  }

  card.append(iconWrap, info, actions);
  return card;
}

// ── Helpers de DOM ────────────────────────────────────────────────────────────
function makeLink(href, target, iconClass, label) {
  const a = document.createElement('a');
  a.href = href;
  a.target = target;
  a.rel = 'noopener noreferrer';
  a.className = 'modal__file-action-btn';
  a.innerHTML = `<i class="${iconClass}"></i><span>${label}</span>`;
  return a;
}

function makeDownload(href, iconClass, label) {
  const a = document.createElement('a');
  a.href = href;
  a.download = '';
  a.className = 'modal__file-action-btn modal__file-action-btn--ghost';
  a.innerHTML = `<i class="${iconClass}"></i><span>${label}</span>`;
  return a;
}

function makeButton(iconClass, label, className = '') {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.innerHTML = `<i class="${iconClass}"></i><span>${label}</span>`;
  return btn;
}

function metaItem(label, valueOrNode) {
  const item = document.createElement('div');
  item.className = 'modal__meta-item';
  const lbl = document.createElement('span');
  lbl.className = 'modal__meta-label';
  lbl.textContent = label;
  const val = document.createElement('span');
  val.className = 'modal__meta-value';
  typeof valueOrNode === 'string' ? (val.textContent = valueOrNode) : val.appendChild(valueOrNode);
  item.append(lbl, val);
  return item;
}

// ── Logo ──────────────────────────────────────────────────────────────────────
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

function normalizeUrl(url) {
  const v = String(url || '').trim();
  if (!v) return '#';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}
