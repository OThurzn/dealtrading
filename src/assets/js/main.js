(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');
  var mobileNav = document.querySelector('.nav-mobile');
  var navLinks = mobileNav ? mobileNav.querySelectorAll('a[href^="#"]') : [];
  var brandXmlPath = 'src/assets/data/brands.xml';
  var brandLogoBase = 'src/imgs/logos/';
  var teamCarouselRoot = document.querySelector('[data-team-carousel]');
  var TEAM_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

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

  initTeamCarousel();

function initTeamCarousel() {
  if (!teamCarouselRoot) return;

  var viewport = teamCarouselRoot.querySelector('.team-carousel__viewport');
  var track = teamCarouselRoot.querySelector('.team-carousel__track');
  var prevButton = teamCarouselRoot.querySelector('.team-carousel__btn--prev');
  var nextButton = teamCarouselRoot.querySelector('.team-carousel__btn--next');

  if (!viewport || !track || !prevButton || !nextButton) return;

  var items = [
    {
      src: 'src/imgs/galeria/deal-evento-01.jpg',
      alt: 'Feira internacional — Equipe em networking e negociações no evento',
      title: 'Feira internacional',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-02.jpg',
      alt: 'Conexões estratégicas — Registros com parceiros e distribuidores',
      title: 'Conexões estratégicas',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-03.jpg',
      alt: 'Visita à fábrica — Imersão em planta industrial e cadeia produtiva',
      title: 'Visita à fábrica',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-04.jpg',
      alt: 'Bastidores da operação — Acompanhamento de processos e soluções técnicas',
      title: 'Bastidores da operação',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-05.jpg',
      alt: 'Encontro comercial — Time alinhado para novas oportunidades',
      title: 'Encontro comercial',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-06.jpg',
      alt: 'Portfólio em destaque — Produtos e parcerias em ambiente de feira',
      title: 'Portfólio em destaque',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-07.jpg',
      alt: 'Equipe em campo — Presença da DEAL em evento do setor',
      title: 'Equipe em campo',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-08.jpg',
      alt: 'Relacionamento com parceiros — Troca de experiências com fabricantes',
      title: 'Relacionamento com parceiros',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-09.jpg',
      alt: 'Momento de visita técnica — Análise de estrutura e operação',
      title: 'Momento de visita técnica',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-10.jpg',
      alt: 'Negociação e expansão — Agenda comercial voltada a crescimento',
      title: 'Negociação e expansão',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-11.jpg',
      alt: 'Missão internacional — Contato direto com mercado e indústria',
      title: 'Missão internacional',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-12.jpg',
      alt: 'Rede de parceiros — Conexões que fortalecem a operação',
      title: 'Rede de parceiros',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-13.jpg',
      alt: 'Visita institucional — Agenda para ampliar relacionamento',
      title: 'Visita institucional',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-14.jpg',
      alt: 'Time DEAL em ação — Pessoas e resultado em movimento',
      title: 'Time DEAL em ação',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-15.jpg',
      alt: 'Estrutura e escala — O ambiente certo para crescer com eficiência',
      title: 'Estrutura e escala',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-16.jpg',
      alt: 'Feira do setor — Presença em eventos e oportunidades',
      title: 'Feira do setor',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-17.jpg',
      alt: 'Imersão operacional — Aprendizado e relacionamento no mercado',
      title: 'Imersão operacional',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-18.jpg',
      alt: 'Parceria em destaque — Fotos com parceiros e representantes',
      title: 'Parceria em destaque',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-19.jpg',
      alt: 'Visão de mercado — Observação direta de tendências e produtos',
      title: 'Visão de mercado',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-20.jpg',
      alt: 'Reconhecimento e networking — Momento de conexão com o setor',
      title: 'Reconhecimento e networking',
      width: 1400,
      height: 1050
    },
    {
      src: 'src/imgs/galeria/deal-evento-21.jpg',
      alt: 'Portfólio global — Ampliação de relações e novas frentes',
      title: 'Portfólio global',
      width: 1400,
      height: 1050
    }
  ];

  items = shuffleArray(items.slice());
  renderSlides(items);

  var slides = track.querySelectorAll('.team-slide');
  var observer = null;

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var img = entry.target.querySelector('img[data-src]');
        if (img) {
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
        }

        observer.unobserve(entry.target);
      });
    }, {
      root: viewport,
      rootMargin: '180px 80px',
      threshold: 0.12
    });

    slides.forEach(function (slide) {
      observer.observe(slide);
    });
  } else {
    slides.forEach(function (slide) {
      var img = slide.querySelector('img[data-src]');
      if (img) {
        img.src = img.getAttribute('data-src');
        img.removeAttribute('data-src');
      }
    });
  }

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

  function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
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
