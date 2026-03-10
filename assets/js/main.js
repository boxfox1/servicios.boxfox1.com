/* =========================================================
   Boxfox1 — main.js
   - Header shadow on scroll
   - Panel móvil toggle
   - Smooth scroll con offset por cabecera
   - Modal privacidad
   - Breadcrumbs dinámicos + Schema JSON-LD
   ========================================================= */

/* =========================
   Navegación estable
   ========================= */
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const cabecera = $("[data-cabecera]");
  const navbtn = $("[data-navbtn]");
  const panel = $("[data-panel]");

  const syncHeader = () => {
    if (!cabecera) return;
    cabecera.classList.toggle("is-scrolled", window.scrollY > 6);
  };

  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();

  const openPanel = (open) => {
    if (!panel || !navbtn) return;
    panel.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    navbtn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  if (navbtn && panel) {
    navbtn.addEventListener("click", () => {
      openPanel(!panel.classList.contains("is-open"));
    });

    $$("a", panel).forEach((a) => {
      a.addEventListener("click", () => openPanel(false));
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") openPanel(false);
    });
  }

  const goToHash = (hash) => {
    if (!hash || hash.length < 2) return;
    const el = document.getElementById(hash.slice(1));
    if (!el) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const headerH = cabecera ? cabecera.getBoundingClientRect().height : 0;
    const y = window.scrollY + el.getBoundingClientRect().top - headerH - 10;

    window.scrollTo({
      top: Math.max(0, y),
      behavior: reduced ? "auto" : "smooth",
    });
  };

  $$("a[href^='#']").forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      e.preventDefault();
      history.pushState(null, "", href);
      goToHash(href);
    });
  });

  window.addEventListener("load", () => {
    if (location.hash) goToHash(location.hash);
  });
})();

/* =========================
   Modal Privacidad
   ========================= */
(function () {
  const modal = document.getElementById("privacyModal");
  if (!modal) return;

  const acceptBtn = document.getElementById("privacyAccept");

  const open = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");

    if (acceptBtn && typeof acceptBtn.focus === "function") {
      setTimeout(() => acceptBtn.focus(), 100);
    }
  };

  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-modal-open");
  };

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-open-privacy]");
    if (trigger) {
      e.preventDefault();
      open();
      return;
    }

    if (e.target.closest("[data-modal-close]")) {
      e.preventDefault();
      close();
      return;
    }

    if (acceptBtn && e.target.closest("#privacyAccept")) {
      e.preventDefault();
      close();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) close();
  });

  if (acceptBtn) {
    acceptBtn.addEventListener("click", (e) => {
      e.preventDefault();
      close();
    });
  }
})();

/* =========================
   Breadcrumbs dinámicos + Schema
   ========================= */
(function () {
  const root = document.getElementById("breadcrumbs");
  const schemaEl = document.getElementById("breadcrumbs-schema");

  if (!root && !schemaEl) return;

  const origin = window.location.origin;

  const path = window.location.pathname.replace(/index\.html$/, "");
  const cleanPath =
    path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;

  const parts = cleanPath.split("/").filter(Boolean);

  const nameMap = {
    stps: "Industrial",
    comercial: "Comercial",
    recursos: "Recursos",
    capacitacion: "Capacitación",
    maquinados: "Maquinados",
    imprenta: "Imprenta",
    clientes: "Clientes",
    brigadas: "Brigadas",
    cursos: "Cursos",
    checklists: "Checklists",
    diagnostico: "Diagnóstico",
    reportes: "Reportes",
    documentacion: "Documentación",
    sistema: "Sistema",
  };

  const pageMap = {
    "diagnostico-industrial.html": "Diagnóstico industrial",
    "documentacion-para-dc3.html": "Documentación para DC-3",
    "brigadas-por-tamano-o-giro.html": "Brigadas por tamaño o giro",
    "incidentes.html": "Incidentes",
    "reporte-de-incidentes.html": "Incidentes",
    "nom-002.html": "NOM-002",
    "nom-004.html": "NOM-004",
    "nom-006.html": "NOM-006",
    "nom-009.html": "NOM-009",
    "nom-018.html": "NOM-018",
    "nom-020.html": "NOM-020",
    "nom-033.html": "NOM-033",
    "cursos-noms.html": "Cursos NOM-STPS",
    "cursos-para-la-industria.html": "Capacitación industrial",
    "ocupaciones-especificas.html": "Ocupaciones específicas",
    "normatividad-mexicana.html": "Normatividad mexicana",
    "contacto.html": "Contacto",
    "index.html": "Inicio",
  };

  function prettifySlug(slug) {
    if (pageMap[slug]) return pageMap[slug];
    if (nameMap[slug]) return nameMap[slug];

    return slug
      .replace(/\.html$/, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const items = [{ name: "Inicio", href: "/" }];

  let acc = "";
  parts.forEach((part, i) => {
    acc += `/${part}`;
    const isLast = i === parts.length - 1;
    const isFile = /\.html$/i.test(part);

    items.push({
      name: prettifySlug(part),
      href: isLast && isFile ? null : acc + (isFile ? "" : "/"),
    });
  });

  /* ---------- Breadcrumb visual ---------- */
  if (root) {
    const inner = document.createElement("div");
    inner.className = "wrap breadcrumbs__inner";

    items.forEach((item, i) => {
      const isLast = i === items.length - 1;

      if (isLast || !item.href) {
        const span = document.createElement("span");
        span.className = "breadcrumbs__current";
        span.setAttribute("aria-current", "page");
        span.textContent = item.name;
        inner.appendChild(span);
      } else {
        const a = document.createElement("a");
        a.className = "breadcrumbs__link";
        a.href = item.href;
        a.textContent = item.name;
        inner.appendChild(a);
      }

      if (i < items.length - 1) {
        const sep = document.createElement("span");
        sep.className = "breadcrumbs__sep";
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = "/";
        inner.appendChild(sep);
      }
    });

    root.innerHTML = "";
    root.appendChild(inner);
  }

  /* ---------- Breadcrumb schema ---------- */
  if (schemaEl) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => {
        const finalUrl =
          item.href === "/"
            ? `${origin}/`
            : item.href
              ? `${origin}${item.href}`
              : `${origin}${window.location.pathname}`;

        return {
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: finalUrl,
        };
      }),
    };

    schemaEl.textContent = JSON.stringify(schema, null, 2);
  }
})();

/* =========================
   Modal documentación NOM
   ========================= */
(function () {
  const docsModal = document.getElementById("docsModal");
  const docButtons = document.querySelectorAll("[data-open-doc]");
  const docsTitle = document.getElementById("docsTitle");

  if (!docsModal || !docButtons.length) return;

  const openDocsModal = (nomName = "") => {
    docsModal.classList.add("is-open");
    docsModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");

    if (docsTitle && nomName) {
      docsTitle.textContent = `Solicitud de documentación — ${nomName}`;
    } else if (docsTitle) {
      docsTitle.textContent = "Solicitud de documentación";
    }
  };

  const closeDocsModal = () => {
    docsModal.classList.remove("is-open");
    docsModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-modal-open");

    if (docsTitle) {
      docsTitle.textContent = "Solicitud de documentación";
    }
  };

  docButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const nomName = btn.getAttribute("data-nom") || "";
      openDocsModal(nomName);
    });
  });

  docsModal.addEventListener("click", (e) => {
    if (e.target.closest("[data-modal-close]")) {
      e.preventDefault();
      closeDocsModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && docsModal.classList.contains("is-open")) {
      closeDocsModal();
    }
  });
})();

/* =========================
   Biblioteca NOM: búsqueda + filtros
   ========================= */

(function () {
  const searchInput = document.getElementById("nomSearchInput");
  const countEl = document.getElementById("nomCount");
  const cards = Array.from(document.querySelectorAll(".nomCard"));
  const filterButtons = Array.from(document.querySelectorAll(".nomFilter"));

  if (!cards.length) return;

  const state = {
    categoria: "all",
    curso: "all",
    q: "",
  };

  function normalize(text) {
    return (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function updateCount(visibleCount) {
    if (!countEl) return;
    countEl.textContent = `${visibleCount} norma${visibleCount === 1 ? "" : "s"} visible${visibleCount === 1 ? "" : "s"}`;
  }

  function applyFilters() {
    let visible = 0;
    const q = normalize(state.q);

    cards.forEach((card) => {
      const categoria = card.dataset.categoria || "";
      const curso = card.dataset.curso || "";
      const search = normalize(card.dataset.search || card.textContent || "");

      const matchCategoria =
        state.categoria === "all" || categoria === state.categoria;
      const matchCurso = state.curso === "all" || curso === state.curso;
      const matchSearch = !q || search.includes(q);

      const show = matchCategoria && matchCurso && matchSearch;

      card.classList.toggle("is-hidden", !show);
      if (show) visible += 1;
    });

    updateCount(visible);
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.q = e.target.value || "";
      applyFilters();
    });
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.dataset.filterGroup;
      const value = btn.dataset.filterValue;

      state[group] = value;

      filterButtons
        .filter((b) => b.dataset.filterGroup === group)
        .forEach((b) => b.classList.remove("is-active"));

      btn.classList.add("is-active");
      applyFilters();
    });
  });

  applyFilters();
})();

/* =========================
   Portal de clientes → acceso por correo
   ========================= */
(function () {
  const form = document.getElementById("clientAccessForm");
  const emailInput = document.getElementById("clientEmail");
  const msg = document.getElementById("clientAccessMsg");

  if (!form || !emailInput) return;

  const clientFolders = {
    "cliente1@empresa.com":
      "https://drive.google.com/drive/folders/AAAAAAAAAAAAAAAAAAAAA",
    "cliente2@empresa.com":
      "https://drive.google.com/drive/folders/BBBBBBBBBBBBBBBBBBBBB",
    "compras@empresa3.com":
      "https://drive.google.com/drive/folders/CCCCCCCCCCCCCCCCCCCCC",
  };

  const setMsg = (text = "", isError = false) => {
    if (!msg) return;
    msg.textContent = text;
    msg.style.color = isError ? "#b42318" : "rgba(15, 23, 42, 0.72)";
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = (emailInput.value || "").trim().toLowerCase();

    if (!email) {
      setMsg("Ingresa un correo válido.", true);
      return;
    }

    const folderUrl = clientFolders[email];

    if (folderUrl) {
      setMsg("Acceso encontrado. Abriendo carpeta...");
      window.location.href = folderUrl;
      return;
    }

    setMsg(
      "Este correo no tiene acceso habilitado todavía. Solicita tu acceso con tu asesor de ventas.",
      true,
    );
  });
})();
