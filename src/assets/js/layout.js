/**
 * DEAL TRADING — layout.js
 *
 * Injeta o <header> e o <footer> compartilhados em todas as páginas.
 *
 * USO: adicione no <head> de cada página:
 *   <script src="src/assets/js/layout.js" defer></script>
 *
 * A página deve ter:
 *   - Um elemento com id="site-header-mount"  → recebe o header
 *   - Um elemento com id="site-footer-mount"  → recebe o footer
 *
 * O script detecta automaticamente qual página está ativa e marca o
 * link correto com aria-current="page" na nav.
 *
 * Para adicionar uma nova página ao menu, edite apenas o array NAV_LINKS abaixo.
 */

(function () {
  'use strict';

  // ── Configuração de navegação ──────────────────────────────────────────────
  // Cada entrada: { label, href, isHome }
  // isHome = true → na página index.html os hrefs viram âncoras (#secao)
  var NAV_LINKS = [
    { label: 'Quem somos', href: 'quem-somos', isHome: true },
    { label: 'Marcas', href: 'marcas.html', isHome: false },
    { label: 'Valores', href: 'valores', isHome: true },
    { label: 'Galeria', href: 'galeria', isHome: true },
  ];
  var CTA = { label: 'Contato', href: 'contato', isHome: true };

  // ── Detecção de contexto ───────────────────────────────────────────────────
  var currentFile = window.location.pathname.split('/').pop() || 'index.html';
  var isHome = currentFile === '' || currentFile === 'index.html';
  var logoHref = isHome ? '#inicio' : 'index.html';

  function resolveHref(link) {
    if (link.isHome) {
      return isHome ? '#' + link.href : 'index.html#' + link.href;
    }
    return link.href;
  }

  function isActive(link) {
    if (!link.isHome && link.href === currentFile) return true;
    return false;
  }

  // ── Builders ──────────────────────────────────────────────────────────────
  function buildNavLinks(extraClass) {
    var html = '';
    NAV_LINKS.forEach(function (link) {
      var href = resolveHref(link);
      var active = isActive(link) ? ' aria-current="page"' : '';
      html += '<a href="' + href + '"' + active + '>' + link.label + '</a>';
    });
    var ctaHref = resolveHref(CTA);
    html += '<a href="' + ctaHref + '" class="btn btn--primary' +
      (extraClass ? ' ' + extraClass : '') + '">' + CTA.label + '</a>';
    return html;
  }

  function buildFooterLinks() {
    var all = NAV_LINKS.concat([CTA]);
    return all.map(function (link) {
      return '<a href="' + resolveHref(link) + '">' + link.label + '</a>';
    }).join(' · ');
  }

  // ── Header ─────────────────────────────────────────────────────────────────
  var headerHTML = '\
<a class="skip-link" href="#conteudo-principal">Ir para o conteúdo</a>\
<header class="site-header">\
  <div class="site-header__inner">\
    <a class="logo" href="' + logoHref + '" aria-label="DEAL TRADING — início">\
      <img class="logo__mark" src="src/imgs/logo.png" alt="DEAL TRADING" height="52">\
      <span class="logo__text"><span class="logo__name">Deal Trading</span></span>\
    </a>\
    <nav class="nav" aria-label="Principal">' +
    buildNavLinks() +
    '</nav>\
    <button class="menu-toggle" type="button" aria-expanded="false"\
      aria-controls="menu-mobile" aria-label="Abrir menu">\
      <span></span><span></span><span></span>\
    </button>\
  </div>\
  <nav id="menu-mobile" class="nav-mobile" aria-label="Mobile">' +
    buildNavLinks('btn--block') +
    '</nav>\
</header>';

  // ── Footer ─────────────────────────────────────────────────────────────────
  var footerHTML = '\
<footer class="site-footer">\
  <div class="container">\
    <div class="site-footer__grid">\
      <div>\
        <h2>DEAL TRADING</h2>\
        <p>Importadora para o mercado B2B. Atacado nacional com foco em parceria e performance logística.</p>\
      </div>\
      <div>\
        <h2>Endereços</h2>\
        <p>\
          <strong>Matriz:</strong> Itajaí · SC<br>\
          R. Dr. Pedro Ferreira, 333 - Sl 1206<br>\
          <strong>Filial:</strong> Curitiba · PR<br>\
          Av. Mal. Floriano Peixoto, 885 - Cj 210\
        </p>\
      </div>\
      <div>\
        <h2>Links</h2>\
        <p>' + buildFooterLinks() + '</p>\
      </div>\
    </div>\
    <div class="footer-bottom">\
      <p>© <span id="year"></span> DEAL TRADING. Todos os direitos reservados.</p>\
    </div>\
  </div>\
</footer>';

  // ── Injeção no DOM ─────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    var headerMount = document.getElementById('site-header-mount');
    var footerMount = document.getElementById('site-footer-mount');

    if (headerMount) headerMount.outerHTML = headerHTML;
    if (footerMount) footerMount.outerHTML = footerHTML;

    // Ano no footer
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ── Menu mobile (delegado aqui pois o header acabou de ser inserido) ──
    var toggle = document.querySelector('.menu-toggle');
    var mobileNav = document.querySelector('.nav-mobile');

    function setMenuOpen(open) {
      if (!toggle || !mobileNav) return;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      mobileNav.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }

    if (toggle && mobileNav) {
      toggle.addEventListener('click', function () {
        setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true');
      });
      mobileNav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { setMenuOpen(false); });
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenuOpen(false);
    });
  });
})();
