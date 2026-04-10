(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');
  var mobileNav = document.querySelector('.nav-mobile');
  var navLinks = mobileNav ? mobileNav.querySelectorAll('a[href^="#"]') : [];
  var brandXmlPath = 'src/assets/data/brands.xml';
  var brandLogoBase = 'src/imgs/logos/';

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
  }

  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      setMenuOpen(false);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenuOpen(false);
  });

  // Scroll spy: destaca a seção atual no menu desktop.
  var sections = document.querySelectorAll('main section[id]');
  var desktopLinks = document.querySelectorAll('.nav a[href^="#"]');

  function updateCurrent() {
    var y = window.scrollY + (header ? header.offsetHeight : 0) + 24;
    var current = '';

    sections.forEach(function (sec) {
      if (sec.offsetTop <= y) current = sec.id;
    });

    desktopLinks.forEach(function (a) {
      var href = a.getAttribute('href');
      if (href === '#' + current) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  window.addEventListener('scroll', updateCurrent, { passive: true });
  updateCurrent();

  // Preview de logos na home.
  var previewContainer = document.getElementById('marcas-preview-logos');
  if (previewContainer) {
    fetch(brandXmlPath, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.text();
      })
      .then(function (xml) {
        var doc = new DOMParser().parseFromString(xml, 'text/xml');
        if (doc.querySelector('parsererror')) {
          throw new Error('XML malformado');
        }

        var brands = doc.getElementsByTagName('marca');
        var shown = 0;
        var max = 5;

        for (var i = 0; i < brands.length && shown < max; i += 1) {
          var logo = getText(brands[i], 'logo');
          var nome = getText(brands[i], 'nome');
          if (!nome) continue;

          var pill = document.createElement('div');
          pill.className = 'marcas-cta__logo-pill';

          if (logo) {
            var img = document.createElement('img');
            img.src = brandLogoBase + logo;
            img.alt = nome;
            img.loading = 'lazy';
            img.decoding = 'async';
            img.onerror = (function (container, label) {
              return function () {
                container.innerHTML = '';
                var fallback = document.createElement('span');
                fallback.textContent = label;
                container.appendChild(fallback);
              };
            })(pill, nome);
            pill.appendChild(img);
          } else {
            var fallbackSpan = document.createElement('span');
            fallbackSpan.textContent = nome;
            pill.appendChild(fallbackSpan);
          }

          previewContainer.appendChild(pill);
          shown += 1;
        }

        if (brands.length > max) {
          var more = document.createElement('span');
          more.className = 'marcas-cta__more';
          more.textContent = '+' + (brands.length - max) + ' marcas';
          previewContainer.appendChild(more);
        }
      })
      .catch(function (error) {
        console.warn('[main.js] Preview de marcas indisponível:', error);
      });
  }

  function getText(parent, tagName) {
    try {
      var el = parent.getElementsByTagName(tagName)[0];
      return el ? (el.textContent || '').trim() : '';
    } catch (_) {
      return '';
    }
  }
})();
