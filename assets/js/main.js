/* =========================================================
   IMV Solutions — main.js
   ---------------------------------------------------------
   >>> CONFIGURAÇÃO: altere apenas o bloco CONFIG abaixo. <<<
   ========================================================= */

const CONFIG = {
  /* Cole aqui o link do seu evento no Calendly.
     Exemplo: "https://calendly.com/imv-solutions/diagnostico-gratuito"
     Enquanto estiver vazio ou com o valor de exemplo, a página exibe
     automaticamente os canais de contato alternativos (WhatsApp / e-mail). */
  calendlyUrl: "https://calendly.com/SEU-USUARIO/diagnostico-gratuito",

  /* Personalização visual do calendário (cores em hexadecimal, sem "#") */
  calendly: {
    backgroundColor: "ffffff",
    textColor: "10202f",
    primaryColor: "22705f",
    hideEventTypeDetails: false,
    hideGdprBanner: true,
  },

  /* Altura do calendário em pixels (desktop) */
  calendlyHeight: 700,
};

/* =========================================================
   A partir daqui não é necessário alterar nada.
   ========================================================= */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------------- Menu mobile ---------------- */
  const navToggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");

  if (navToggle && nav) {
    const closeNav = () => {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Abrir menu");
    };

    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
    });

    // Fecha ao clicar em um link do menu
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    // Fecha com ESC ou ao voltar para desktop
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        navToggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) closeNav();
    });
  }

  /* ---------------- Sombra do header ao rolar ---------------- */
  const header = document.getElementById("header");

  if (header) {
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------- Animação de entrada das seções ---------------- */
  const revealItems = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (!entry.isIntersecting) return;
          // Pequeno atraso em cascata para itens que aparecem juntos
          setTimeout(() => entry.target.classList.add("is-visible"), index * 70);
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    revealItems.forEach((el) => revealObserver.observe(el));

    // Rede de segurança: se por algum motivo o observador não disparar
    // (aba em segundo plano, renderização suspensa), o conteúdo aparece assim mesmo.
    window.addEventListener("load", () => {
      setTimeout(() => {
        revealItems.forEach((el) => el.classList.add("is-visible"));
      }, 2500);
    });
  }

  /* ---------------- Contadores da seção de resultados ---------------- */
  const counters = document.querySelectorAll(".stat__value[data-count]");

  const runCounter = (el) => {
    const target = Number(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || "";

    if (prefersReducedMotion) {
      el.textContent = target + suffix;
      return;
    }

    const duration = 1400;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  if (counters.length) {
    if (!("IntersectionObserver" in window)) {
      counters.forEach(runCounter);
    } else {
      const counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            runCounter(entry.target);
            counterObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach((el) => counterObserver.observe(el));
    }
  }

  /* ---------------- Link ativo na navegação ---------------- */
  const navLinks = Array.from(document.querySelectorAll(".nav__list a"));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === "#" + entry.target.id
            );
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sections.forEach((section) => navObserver.observe(section));
  }

  /* ---------------- Ano do rodapé ---------------- */
  const anoEl = document.getElementById("ano");
  if (anoEl) anoEl.textContent = new Date().getFullYear();

  /* ---------------- Calendly ---------------- */
  const container = document.getElementById("calendly-container");
  const fallback = document.getElementById("calendly-fallback");

  const showFallback = () => {
    if (container) {
      container.innerHTML = "";
      container.hidden = true;
      container.classList.remove("is-loading");
    }
    if (fallback) fallback.hidden = false;
  };

  const isConfigured = (url) =>
    typeof url === "string" &&
    url.startsWith("https://calendly.com/") &&
    !url.includes("SEU-USUARIO");

  const buildCalendlyUrl = () => {
    const url = new URL(CONFIG.calendlyUrl);
    const c = CONFIG.calendly || {};
    if (c.backgroundColor) url.searchParams.set("background_color", c.backgroundColor);
    if (c.textColor) url.searchParams.set("text_color", c.textColor);
    if (c.primaryColor) url.searchParams.set("primary_color", c.primaryColor);
    url.searchParams.set("hide_event_type_details", c.hideEventTypeDetails ? "1" : "0");
    url.searchParams.set("hide_gdpr_banner", c.hideGdprBanner ? "1" : "0");
    return url.toString();
  };

  const initCalendly = () => {
    if (!container) return;

    if (!isConfigured(CONFIG.calendlyUrl)) {
      // Aviso apenas no console, para quem estiver configurando o site.
      console.info(
        "[IMV Solutions] Calendly ainda não configurado. " +
          'Defina CONFIG.calendlyUrl em assets/js/main.js com o link do seu evento.'
      );
      showFallback();
      return;
    }

    container.classList.add("is-loading");
    container.textContent = "Carregando calendário…";

    const widget = document.createElement("div");
    widget.className = "calendly-inline-widget";
    widget.setAttribute("data-url", buildCalendlyUrl());
    widget.setAttribute("data-resize", "true");
    widget.style.minWidth = "280px";
    widget.style.height = CONFIG.calendlyHeight + "px";

    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;

    // Se o script não carregar (offline, bloqueador, rede), mostra os canais diretos.
    const timeout = setTimeout(showFallback, 10000);

    script.addEventListener("load", () => {
      clearTimeout(timeout);
      container.classList.remove("is-loading");
      container.textContent = "";
      container.appendChild(widget);

      if (window.Calendly && typeof window.Calendly.initInlineWidget === "function") {
        window.Calendly.initInlineWidget({
          url: buildCalendlyUrl(),
          parentElement: widget,
        });
      }
    });

    script.addEventListener("error", () => {
      clearTimeout(timeout);
      showFallback();
    });

    document.head.appendChild(script);
  };

  // Só carrega o Calendly quando a seção se aproxima da tela (mais leve no primeiro acesso).
  const bookingSection = document.getElementById("agendar");

  if (bookingSection && "IntersectionObserver" in window) {
    const bookingObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        bookingObserver.disconnect();
        initCalendly();
      },
      { rootMargin: "400px 0px" }
    );
    bookingObserver.observe(bookingSection);
  } else {
    initCalendly();
  }
})();
