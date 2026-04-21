(function () {
  'use strict';

  // layout.js injeta o header via DOMContentLoaded com defer.
  // main.js também usa defer, portanto ambos rodam após o DOM estar pronto
  // e o header já existe quando este código executa.

  var TEAM_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

  // Scroll spy — só faz sentido na home onde há seções com âncoras.
  var sections = document.querySelectorAll('main section[id]');
  var desktopLinks = document.querySelectorAll('.nav a[href^="#"]');

  if (sections.length && desktopLinks.length) {
    function updateCurrent() {
      var header = document.querySelector('.site-header');
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
  }

  var teamCarouselRoot = document.querySelector('[data-team-carousel]');
  initTeamCarousel();

  function initTeamCarousel() {
    if (!teamCarouselRoot) return;

    var viewport = teamCarouselRoot.querySelector('.team-carousel__viewport');
    var track = teamCarouselRoot.querySelector('.team-carousel__track');
    var prevButton = teamCarouselRoot.querySelector('.team-carousel__btn--prev');
    var nextButton = teamCarouselRoot.querySelector('.team-carousel__btn--next');

    if (!viewport || !track || !prevButton || !nextButton) return;

    // Descobre e carrega TODAS as imagens da galeria pelo padrão deal-evento-NN.jpg.
    // Tolerante a falhas: fotos com erro ou número errado são silenciosamente ignoradas,
    // as demais são exibidas normalmente em ordem numérica.
    // Para adicionar fotos basta nomear deal-evento-22.jpg, 23.jpg etc.
    var GALLERY_BASE = 'src/imgs/galeria/deal-evento-';
    var GALLERY_EXT = '.jpg';
    var GALLERY_MAX = 99;   // teto de varredura — ajuste se precisar de mais
    var GALLERY_WIDTH = 1400;
    var GALLERY_HEIGHT = 1050;

    function padIndex(n) {
      return n < 10 ? '0' + n : '' + n;
    }

    // Dispara todas as sondagens em paralelo e aguarda o resultado de cada uma.
    // Imagens que carregam entram na lista; as que falham são descartadas.
    // Ao final renderiza em ordem crescente de índice.
    (function loadAllGalleryImages() {
      var pending = GALLERY_MAX;
      var results = [];   // { index, src }

      function onDone() {
        pending -= 1;
        if (pending > 0) return;

        // Ordena por índice e monta a lista final
        results.sort(function (a, b) { return a.index - b.index; });
        if (!results.length) return;

        var items = results.map(function (r) {
          var n = padIndex(r.index);
          return {
            src: r.src,
            alt: 'Evento DEAL TRADING — foto ' + n,
            title: 'Evento ' + n,
            width: GALLERY_WIDTH,
            height: GALLERY_HEIGHT
          };
        });

        renderSlides(items);

        var slides = track.querySelectorAll('.team-slide');

        if ('IntersectionObserver' in window) {
          var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;
              var lazyImg = entry.target.querySelector('img[data-src]');
              if (lazyImg) {
                lazyImg.src = lazyImg.getAttribute('data-src');
                lazyImg.removeAttribute('data-src');
              }
              observer.unobserve(entry.target);
            });
          }, { root: viewport, rootMargin: '180px 80px', threshold: 0.12 });
          slides.forEach(function (slide) { observer.observe(slide); });
        } else {
          slides.forEach(function (slide) {
            var lazyImg = slide.querySelector('img[data-src]');
            if (lazyImg) {
              lazyImg.src = lazyImg.getAttribute('data-src');
              lazyImg.removeAttribute('data-src');
            }
          });
        }
      }

      for (var i = 1; i <= GALLERY_MAX; i++) {
        (function (index) {
          var src = GALLERY_BASE + padIndex(index) + GALLERY_EXT;
          var probe = new Image();
          probe.onload = function () {
            results.push({ index: index, src: src });
            onDone();
          };
          probe.onerror = function () {
            onDone(); // falha: ignora silenciosamente
          };
          probe.src = src;
        })(i);
      }
    })();


    function renderSlides(list) {
      track.innerHTML = '';

      list.forEach(function (item, index) {
        var slide = document.createElement('article');
        slide.className = 'team-slide';
        slide.setAttribute('aria-label', item.title);

        var figure = document.createElement('figure');
        figure.className = 'team-slide__media';

        var img = document.createElement('img');
        img.alt = item.alt;
        img.width = item.width;
        img.height = item.height;
        img.decoding = 'async';
        img.loading = index < 3 ? 'eager' : 'lazy';

        if (index < 3) {
          img.src = item.src;
          img.fetchPriority = 'high';
        } else {
          img.src = TEAM_PLACEHOLDER;
          img.dataset.src = item.src;
        }

        figure.appendChild(img);
        slide.appendChild(figure);
        track.appendChild(slide);
      });
    }

    function scrollByDirection(direction) {
      var distance = Math.max(viewport.clientWidth * 0.85, 320);
      viewport.scrollBy({
        left: direction * distance,
        behavior: 'smooth'
      });
    }

    prevButton.addEventListener('click', function () {
      scrollByDirection(-1);
    });

    nextButton.addEventListener('click', function () {
      scrollByDirection(1);
    });

    viewport.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollByDirection(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollByDirection(1);
      }
    });
  }

})();
