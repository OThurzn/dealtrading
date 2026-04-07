(function () {
  "use strict";

  var header  = document.querySelector(".site-header");
  var toggle  = document.querySelector(".menu-toggle");
  var mobileNav = document.querySelector(".nav-mobile");
  var navLinks  = mobileNav ? mobileNav.querySelectorAll("a[href^='#']") : [];

  function setMenuOpen(open) {
    if (!toggle || !mobileNav) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    mobileNav.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () { setMenuOpen(false); });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenuOpen(false);
  });

  // Scroll spy — aria-current no desktop
  var sections    = document.querySelectorAll("main section[id]");
  var desktopLinks = document.querySelectorAll(".nav a[href^='#']");

  function updateCurrent() {
    var y = window.scrollY + (header ? header.offsetHeight : 0) + 24;
    var current = "";
    sections.forEach(function (sec) {
      if (sec.offsetTop <= y) current = sec.id;
    });
    desktopLinks.forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === "#" + current) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  window.addEventListener("scroll", updateCurrent, { passive: true });
  updateCurrent();

  // Carrega preview de logos do XML na seção Marcas da index
  var previewContainer = document.getElementById("marcas-preview-logos");
  if (previewContainer) {
    fetch("src/data/brands.xml")
      .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
      .then(function (xml) {
        var doc  = new DOMParser().parseFromString(xml, "text/xml");
        var els  = doc.getElementsByTagName("marca");
        var shown = 0;
        var max   = 5;

        for (var i = 0; i < els.length && shown < max; i++) {
          var logo = getText(els[i], "logo");
          var nome = getText(els[i], "nome");
          if (!logo) continue;

          var pill = document.createElement("div");
          pill.className = "marcas-cta__logo-pill";

          var img = document.createElement("img");
          img.src = "src/imgs/logos/" + logo;
          img.alt = nome;
          img.onerror = (function(p, n) {
            return function() {
              var s = document.createElement("span");
              s.textContent = n;
              p.innerHTML = "";
              p.appendChild(s);
            };
          })(pill, nome);

          pill.appendChild(img);
          previewContainer.appendChild(pill);
          shown++;
        }

        if (els.length > max) {
          var more = document.createElement("span");
          more.className = "marcas-cta__more";
          more.textContent = "+" + (els.length - max) + " marcas";
          previewContainer.appendChild(more);
        }
      })
      .catch(function () { /* silently skip preview on error */ });
  }

  function getText(parent, tagName) {
    var el = parent.getElementsByTagName(tagName)[0];
    return el ? (el.textContent || "").trim() : "";
  }

})();