/* =========================================================
   IMV SOLUTIONS — main.js
   ---------------------------------------------------------
   >>> CONFIGURAÇÃO: altere apenas o bloco CONFIG abaixo. <<<
   ========================================================= */

const CONFIG = {
  /* Link do evento no Calendly (conversa gratuita de 30 minutos). */
  calendlyUrl: "https://calendly.com/contato-imv/30min",

  /* Parâmetros de origem, para identificar de onde veio o agendamento. */
  calendlyUtm: {
    utm_source: "landing",
    utm_medium: "site",
    utm_content: "conversa-gratuita-embed",
  },

  /* Cores do calendário, alinhadas à identidade IMV. */
  calendly: {
    backgroundColor: "ffffff",
    textColor: "0f1a28",
    primaryColor: "1d3b66",
    hideEventTypeDetails: false,
    hideGdprBanner: true,
  },

  /* Altura do calendário em pixels. */
  calendlyHeight: 700,
};

/* =========================================================
   A partir daqui não é necessário alterar nada.
   ========================================================= */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNav));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        navToggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1200) closeNav();
    });
  }

  /* ---------------- Header ao rolar ---------------- */
  const header = document.getElementById("header");

  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------- Revelação das seções ---------------- */
  const revealItems = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (!entry.isIntersecting) return;
          setTimeout(() => entry.target.classList.add("is-visible"), index * 60);
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );

    revealItems.forEach((el) => revealObserver.observe(el));

    // Rede de segurança: o conteúdo aparece mesmo se o observador não disparar.
    window.addEventListener("load", () => {
      setTimeout(() => revealItems.forEach((el) => el.classList.add("is-visible")), 2500);
    });
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
            link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sections.forEach((section) => navObserver.observe(section));
  }

  /* ---------------- Demonstração do IMV Vision ----------------
     Sem JavaScript as abas não aparecem e todos os painéis ficam
     empilhados (regra no CSS). Aqui elas passam a funcionar. */
  const abas = Array.from(document.querySelectorAll('.vtabs [role="tab"]'));

  if (abas.length) {
    const painelDa = (aba) => document.getElementById(aba.getAttribute("aria-controls"));

    const ativar = (aba, moverFoco) => {
      abas.forEach((a) => {
        const selecionada = a === aba;
        a.setAttribute("aria-selected", String(selecionada));
        a.tabIndex = selecionada ? 0 : -1;

        const painel = painelDa(a);
        if (painel) {
          painel.hidden = !selecionada;
          painel.classList.toggle("is-active", selecionada);
        }
      });
      if (moverFoco) aba.focus();
    };

    abas.forEach((aba, i) => {
      aba.addEventListener("click", () => ativar(aba, false));

      aba.addEventListener("keydown", (e) => {
        const passos = { ArrowRight: 1, ArrowLeft: -1 };

        if (e.key in passos) {
          e.preventDefault();
          ativar(abas[(i + passos[e.key] + abas.length) % abas.length], true);
        } else if (e.key === "Home") {
          e.preventDefault();
          ativar(abas[0], true);
        } else if (e.key === "End") {
          e.preventDefault();
          ativar(abas[abas.length - 1], true);
        }
      });
    });
  }

  /* ---------------- Simulação do IMV Vision ----------------
     Função pura sobre o mês fechado de referência, como no produto:
     mesma entrada, mesma saída. O baseline vem nos data- do HTML, que
     sai do mesmo dataset dos gráficos — assim o cenário nunca
     discorda do resto da tela. */
  const sim = document.querySelector(".vsim");
  const faixaSim = document.getElementById("vsim-range");

  if (sim && faixaSim) {
    const base = {
      receitaLiquida: Number(sim.dataset.rl),
      lucroBruto: Number(sim.dataset.lb),
      despesas: Number(sim.dataset.opex),
      depreciacao: Number(sim.dataset.da),
      financeiro: Number(sim.dataset.fin),
      impostos: Number(sim.dataset.imp),
      caixa: Number(sim.dataset.caixa),
      custoFixo: Number(sim.dataset.fixo),
    };

    /* Margem de contribuição: o que sobra de cada real de receita depois
       dos custos variáveis. É o divisor do retorno necessário. */
    const contribuicao = base.lucroBruto / base.receitaLiquida;

    const MENOS = "−";
    const mil = (n) => Math.round(Math.abs(n)).toLocaleString("pt-BR");
    const brl = (n) => (n < 0 ? MENOS : "") + "R$ " + mil(n);
    const umaCasa = (n) => Math.abs(n).toFixed(1).replace(".", ",");
    const pct = (v) => umaCasa(v * 100) + "%";
    const delta = (valor, texto) => (valor === 0 ? "—" : (valor > 0 ? "+" : MENOS) + texto);

    const escrever = (id, texto) => {
      const el = document.getElementById(id);
      if (el) el.textContent = texto;
    };

    const margemBase =
      (base.lucroBruto - base.despesas - base.depreciacao + base.financeiro - base.impostos) /
      base.receitaLiquida;
    const mesesBase = base.caixa / base.custoFixo;

    const recalcular = () => {
      const economia = Math.round(base.despesas * (Number(faixaSim.value) / 100));

      const despesas = base.despesas - economia;
      const ebitda = base.lucroBruto - despesas;
      /* Lucro presumido: o imposto incide sobre a receita, não sobre o
         resultado. A economia de custo chega inteira ao lucro. */
      const lucro = ebitda - base.depreciacao + base.financeiro - base.impostos;
      const margem = lucro / base.receitaLiquida;
      const custoFixo = base.custoFixo - economia;
      const meses = base.caixa / custoFixo;

      escrever("vsim-pct", faixaSim.value + "%");
      escrever("vsim-opex", brl(despesas));
      escrever("vsim-eco", economia === 0 ? "—" : brl(-economia));
      escrever("vsim-ebitda", brl(ebitda));
      escrever("vsim-debitda", delta(economia, brl(economia)));
      escrever("vsim-lucro", brl(lucro));
      escrever("vsim-dlucro", delta(economia, brl(economia)));
      escrever("vsim-margem", pct(margem));
      escrever("vsim-dmargem", delta(economia, umaCasa((margem - margemBase) * 100) + " p.p."));
      escrever("vsim-meses", umaCasa(meses));
      escrever("vsim-dmeses", delta(economia, umaCasa(meses - mesesBase) + " meses"));
      escrever("vsim-r-lucro", brl(lucro));
      escrever("vsim-r-margem", pct(margem));
      escrever("vsim-ano", brl(economia * 12));
      escrever("vsim-necessaria", brl(Math.round((economia * 12) / contribuicao)));
    };

    faixaSim.addEventListener("input", recalcular);
    recalcular();
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
      container.style.minHeight = "0";
      container.classList.remove("is-loading");
    }
    if (fallback) fallback.hidden = false;
  };

  const isConfigured = (url) =>
    typeof url === "string" && url.startsWith("https://calendly.com/") && !url.includes("SEU-USUARIO");

  const buildCalendlyUrl = () => {
    const url = new URL(CONFIG.calendlyUrl);
    const c = CONFIG.calendly || {};

    Object.entries(CONFIG.calendlyUtm || {}).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });

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
      showFallback();
      return;
    }

    container.classList.add("is-loading");
    container.textContent = "Carregando agenda…";

    const widget = document.createElement("div");
    widget.className = "calendly-inline-widget";
    widget.setAttribute("data-url", buildCalendlyUrl());
    widget.setAttribute("data-resize", "true");
    widget.style.minWidth = "280px";
    widget.style.height = CONFIG.calendlyHeight + "px";

    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;

    // Se o script não carregar (offline, bloqueador, rede), mostra o botão direto.
    const timeout = setTimeout(showFallback, 10000);

    script.addEventListener("load", () => {
      clearTimeout(timeout);
      container.classList.remove("is-loading");
      container.textContent = "";
      container.appendChild(widget);

      if (window.Calendly && typeof window.Calendly.initInlineWidget === "function") {
        window.Calendly.initInlineWidget({ url: buildCalendlyUrl(), parentElement: widget });
      }
    });

    script.addEventListener("error", () => {
      clearTimeout(timeout);
      showFallback();
    });

    document.head.appendChild(script);
  };

  // Carrega a agenda só quando a seção se aproxima da tela.
  const bookingSection = document.getElementById("agendar");

  if (bookingSection && "IntersectionObserver" in window) {
    const bookingObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        bookingObserver.disconnect();
        initCalendly();
      },
      { rootMargin: "500px 0px" }
    );
    bookingObserver.observe(bookingSection);
  } else {
    initCalendly();
  }
})();
