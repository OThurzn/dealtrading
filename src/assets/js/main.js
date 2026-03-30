(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".menu-toggle");
  var mobileNav = document.querySelector(".nav-mobile");
  var navLinks = mobileNav ? mobileNav.querySelectorAll("a[href^='#']") : [];

  function setMenuOpen(open) {
    if (!toggle || !mobileNav) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    mobileNav.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      setMenuOpen(!expanded);
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      setMenuOpen(false);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenuOpen(false);
  });

  // Scroll spy leve para aria-current no desktop
  var sections = document.querySelectorAll("main section[id]");
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

  // Contato: mensagem personalizada (e-mail e WhatsApp)
  var form = document.getElementById("contact-message-form");
  var statusEl = document.getElementById("contact-message-status");
  var emailBtn = document.getElementById("open-email-btn");
  var waBtn = document.getElementById("open-wa-btn");

  function normalize(str) {
    return (str || "").toString().trim();
  }

  function clearStatus() {
    if (!statusEl) return;
    statusEl.textContent = "";
    statusEl.classList.remove("is-visible", "form-status--ok", "form-status--err");
  }

  function setStatus(text, variant) {
    if (!statusEl) return;
    statusEl.textContent = text || "";
    statusEl.classList.remove("is-visible", "form-status--ok", "form-status--err");
    if (variant) statusEl.classList.add("is-visible", variant);
  }

  function buildLinks() {
    var emailTo = normalize(form.getAttribute("data-email-to"));
    var waNumber = normalize(form.getAttribute("data-whatsapp-number")).replace(/\D/g, "");

    var name = normalize((form.querySelector('[name="name"]') || {}).value);
    var profile = normalize((form.querySelector('[name="profile"]') || {}).value);
    var city = normalize((form.querySelector('[name="city"]') || {}).value);
    var uf = normalize((form.querySelector('[name="uf"]') || {}).value).toUpperCase();
    var message = normalize((form.querySelector('[name="message"]') || {}).value);

    var subject = "Cotação — DEAL TRADING (Atacado)";

    var profileMap = {
      "Revendedor": "sou revendedor",
      "Distribuidor": "sou distribuidor",
      "Frota": "trabalho com gestão de frota",
      "Outro": "tenho interesse em parceria"
    };
    var profilePhrase = profileMap[profile] || profile;
    var location = city && uf ? city + "/" + uf : city || uf;

    var intro = "Olá! Me chamo " + name + ", " + profilePhrase + " e sou de " + location + ".";
    var body = intro + "\n\n" + message + "\n\nAguardo retorno. Obrigado!";

    var emailHref = "mailto:" + emailTo + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    var waHref = "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(body);

    return {
      subject: subject,
      bodyText: body,
      emailHref: emailHref,
      waHref: waHref,
      name: name,
      profile: profile,
      city: city,
      uf: uf,
      message: message
    };
  }

  function wireButton(buttonEl, handler) {
    if (!buttonEl) return;
    buttonEl.addEventListener("click", handler);
  }

  if (form && statusEl && emailBtn && waBtn) {
    var messageField = form.querySelector('textarea[name="message"]');
    var fields = form.querySelectorAll("input, select, textarea");
    fields.forEach(function (el) {
      el.addEventListener("input", function () {
        clearStatus();
        if (messageField && normalize(messageField.value)) {
          // Mantém o status limpo enquanto o usuário digita.
        }
      });
    });

    wireButton(emailBtn, function () {
      var links = buildLinks();
      if (!links.name || !links.profile || !links.city || !links.uf || !links.message) {
        setStatus("Preencha todos os campos antes de prosseguir.", "form-status--err");
        return;
      }
      clearStatus();
      window.location.href = links.emailHref;
    });

    wireButton(waBtn, function () {
      var links = buildLinks();
      if (!links.name || !links.profile || !links.city || !links.uf || !links.message) {
        setStatus("Preencha todos os campos antes de prosseguir.", "form-status--err");
        return;
      }
      clearStatus();
      window.open(links.waHref, "_blank", "noopener,noreferrer");
    });
  }
})();