/* =========================================================
   Boxfox1 — main.js (CORREGIDO)
   - Header shadow on scroll
   - Panel móvil toggle
   - Smooth scroll con offset por cabecera
   - Modal privacidad (delegación + aceptar cierra)
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

  // sombra ligera header
  const syncHeader = () => {
    if (!cabecera) return;
    cabecera.classList.toggle("is-scrolled", window.scrollY > 6);
  };

  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();

  // panel móvil
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

    // cerrar panel al click de links internos
    $$("a[href^='#']", panel).forEach((a) => {
      a.addEventListener("click", () => openPanel(false));
    });

    // ESC cierra panel
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") openPanel(false);
    });
  }

  // scroll suave con compensación
  const goToHash = (hash) => {
    if (!hash || hash.length < 2) return;
    const el = document.getElementById(hash.slice(1));
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const headerH = cabecera ? cabecera.getBoundingClientRect().height : 0;
    const y = window.scrollY + el.getBoundingClientRect().top - headerH - 10;

    window.scrollTo({
      top: Math.max(0, y),
      behavior: reduced ? "auto" : "smooth",
    });
  };

  // intercepta solo anchors (#)
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
   Modal Privacidad (delegación)
   ========================= */
(function () {
  const modal = document.getElementById("privacyModal");
  if (!modal) return;

  const acceptBtn = document.getElementById("privacyAccept");

  const open = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");

    // foco al botón aceptar si existe
    if (acceptBtn && typeof acceptBtn.focus === "function") {
      setTimeout(() => acceptBtn.focus(), 100);
    }
  };

  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-modal-open");
  };

  // Delegación global: sirve en footer/panel/etc.
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-open-privacy]");
    if (trigger) {
      e.preventDefault();
      open();
      return;
    }

    // cerrar por backdrop o botón X (data-modal-close)
    if (e.target.closest("[data-modal-close]")) {
      e.preventDefault();
      close();
      return;
    }

    // Aceptar (si existe)
    if (acceptBtn && e.target.closest("#privacyAccept")) {
      e.preventDefault();
      close();
      return;
    }
  });

  // ESC cierra
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) close();
  });

  // respaldo: click directo al botón aceptar (por si no pasa por delegación)
  if (acceptBtn) {
    acceptBtn.addEventListener("click", (e) => {
      e.preventDefault();
      close();
    });
  }
})();