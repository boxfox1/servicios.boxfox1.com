/* =========================================================
   Boxfox1 — diag-engine.js (Frontend)
   - MAP por giro: NOMs + brigadas + módulos
   - Checklist por módulos (acordeón)
   - Progreso total y por sección
   - Score + urgencia + semáforo + acciones
   - Envío a Apps Script (info@) con detalle completo
   ========================================================= */

(function () {
  const ENDPOINT =
    "https://script.google.com/macros/s/AKfycbz_h9zikslQu7CTliHpiuIl85-k-MTfe4WEjT5y6yTjCYrPYXi4CzF0ebm9tmmC1OdX/exec";
  const TOKEN = "BXF1_DIAG_TOKEN_2026"; // debe coincidir con Apps Script

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const el = {
    giro: $("#giro"),
    turnoCount: $("#turnoCount"),
    turnos: $("#turnos"),
    name: $("#name"),
    company: $("#company"),
    phone: $("#phone"),
    email: $("#email"),
    nota: $("#nota"),

    noms: $("#noms"),
    brigadas: $("#brigadas"),
    checklist: $("#checklist"),
    resultado: $("#resultado"),

    btnCalc: $("#btnCalc"),
    btnSave: $("#btnSave"),
    btnReset: $("#btnReset"),
  };

  // --------- Config por giro (módulos = qué secciones de checklist aparecen)
  const MAP = {
    manufactura: {
      noms: ["NOM-004", "NOM-017", "NOM-002", "NOM-030"],
      brigadas: ["Incendio", "Evacuación", "Primeros auxilios"],
      modules: ["doc", "cap", "epp", "incendio", "senal", "maquinaria", "quimicos"],
    },
    logistica: {
      noms: ["NOM-006", "NOM-017", "NOM-002", "NOM-030"],
      brigadas: ["Evacuación", "Incendio"],
      modules: ["doc", "cap", "epp", "incendio", "senal", "montacargas", "izaje"],
    },
    hospital: {
      noms: ["NOM-005", "NOM-010", "NOM-017", "NOM-035"],
      brigadas: ["Evacuación", "Primeros auxilios", "Bioseguridad"],
      modules: ["doc", "cap", "epp", "incendio", "bioseg", "psicosocial", "quimicos"],
    },
    consultorio: {
      noms: ["NOM-005", "NOM-017", "NOM-030"],
      brigadas: ["Primeros auxilios", "Evacuación"],
      modules: ["doc", "cap", "epp", "incendio", "senal", "bioseg"],
    },
    hotel: {
      noms: ["NOM-002", "NOM-019", "NOM-030"],
      brigadas: ["Evacuación", "Incendio", "Primeros auxilios"],
      modules: ["doc", "cap", "incendio", "senal", "psicosocial"],
    },
    comercio: {
      noms: ["NOM-002", "NOM-026", "NOM-030"],
      brigadas: ["Evacuación", "Incendio"],
      modules: ["doc", "cap", "incendio", "senal"],
    },
    escuela: {
      noms: ["NOM-002", "NOM-019", "NOM-030", "NOM-035"],
      brigadas: ["Evacuación", "Primeros auxilios", "Incendio"],
      modules: ["doc", "cap", "incendio", "senal", "psicosocial"],
    },
  };

  // --------- Checklist base (puedes crecerlo sin cambiar motor)
  // NOTA: redFlag = “No” en esto sube urgencia fuerte (interno)
  const CHECKLIST = {
    doc: [
      { id: "doc_prog", q: "Programa/Comisión de seguridad con actas, responsables y plan anual", peso: 16, redFlag: true },
      { id: "doc_bit", q: "Bitácoras / registros (simulacros, extintores, capacitaciones, inspecciones)", peso: 10 },
    ],
    cap: [
      { id: "cap_evid", q: "Capacitación con evidencia (listas, constancias/DC-3, fotos)", peso: 18, redFlag: true },
      { id: "cap_brig", q: "Brigadas integradas y capacitadas por rol (incendio/evacuación/PA)", peso: 14, redFlag: true },
    ],
    epp: [
      { id: "epp_ctrl", q: "EPP controlado (matriz por puesto, entrega, reposición)", peso: 12 },
    ],
    incendio: [
      { id: "fire_ext", q: "Extintores con mantenimiento vigente y cobertura adecuada", peso: 14, redFlag: true },
      { id: "fire_sim", q: "Simulacros y plan de emergencia (frecuencia, roles, lecciones aprendidas)", peso: 12, redFlag: true },
    ],
    senal: [
      { id: "evac_rutas", q: "Rutas de evacuación, señalización y puntos de reunión definidos", peso: 14, redFlag: true },
    ],
    maquinaria: [
      { id: "mach_guard", q: "Máquinas/equipos con guardas y condiciones seguras", peso: 12, redFlag: true },
      { id: "mach_loto", q: "Control LOTO/procedimientos para mantenimiento (si aplica)", peso: 12, redFlag: true },
    ],
    quimicos: [
      { id: "chem_sds", q: "SDS/HDS disponibles, compatibilidad y almacenamiento seguro", peso: 12, redFlag: true },
    ],
    montacargas: [
      { id: "mhe_check", q: "Montacargas con checklist diario y mantenimiento", peso: 12, redFlag: true },
      { id: "mhe_op", q: "Operadores autorizados/capacitados y control de llaves", peso: 12 },
    ],
    izaje: [
      { id: "rig_plan", q: "Plan de izaje / maniobras y responsables definidos", peso: 14, redFlag: true },
      { id: "rig_esl", q: "Eslingas, grilletes y accesorios certificados e inspeccionados", peso: 12 },
    ],
    bioseg: [
      { id: "bio_pp", q: "Protocolos de bioseguridad y control de residuos/biológico-infecciosos", peso: 14, redFlag: true },
    ],
    psicosocial: [
      { id: "psi_nom35", q: "NOM-035: política, evaluación y medidas de control implementadas", peso: 12 },
    ],
  };

  const STORAGE_KEY = "bxf1_diag_v1";

  // --------- Utils
  function uid() {
    return "BXF1-" + Math.random().toString(16).slice(2, 10).toUpperCase();
  }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // --------- Badges (no muestra peso al cliente)
  function riskBadge(it) {
    let tier = "MEDIO";
    if (it.peso >= 14) tier = "ALTO";
    if (it.redFlag) tier = "CRÍTICO";
    const cls =
      tier === "CRÍTICO" ? "pill pill--r" :
      tier === "ALTO" ? "pill pill--y" :
      "pill";
    return `<span class="${cls}">${tier}</span>`;
  }

  // --------- Render NOM/Brigadas + Checklist
  function paintBase() {
    const v = MAP[el.giro.value];
    if (!v) {
      el.noms.innerHTML = "";
      el.brigadas.innerHTML = "";
      el.checklist.innerHTML = `<div class="p">Selecciona un giro para activar checklist.</div>`;
      return;
    }
    el.noms.innerHTML = v.noms.map((n) => `<span class="tag">${escapeHtml(n)}</span>`).join("");
    el.brigadas.innerHTML = v.brigadas.map((b) => `<span class="tag">${escapeHtml(b)}</span>`).join("");
    renderChecklist();
  }

  function renderChecklist() {
    const v = MAP[el.giro.value];
    if (!v) return;

    const modules = v.modules || [];
    const modMeta = {
      doc: { t: "Documentación / Evidencia", k: "DOC" },
      cap: { t: "Capacitación / Brigadas", k: "CAP" },
      epp: { t: "EPP", k: "EPP" },
      incendio: { t: "Incendio / Emergencias", k: "FIRE" },
      senal: { t: "Señalización / Evacuación", k: "EVAC" },
      maquinaria: { t: "Maquinaria / LOTO", k: "MACH" },
      quimicos: { t: "Químicos / SDS", k: "CHEM" },
      montacargas: { t: "Montacargas", k: "MHE" },
      izaje: { t: "Izaje / Maniobras", k: "RIG" },
      bioseg: { t: "Bioseguridad", k: "BIO" },
      psicosocial: { t: "Psicosocial", k: "NOM-035" },
    };

    const blocks = modules
      .map((m) => {
        const items = (CHECKLIST[m] || []).map((it) => ({ ...it, _module: m }));
        return { m, meta: modMeta[m] || { t: m, k: "MOD" }, items };
      })
      .filter((b) => b.items.length);

    if (!blocks.length) {
      el.checklist.innerHTML = `<div class="p">Sin checklist para este giro (pendiente).</div>`;
      return;
    }

    el.checklist.innerHTML = blocks
      .map((b, idx) => {
        const open = idx === 0 ? " open" : "";
        const total = b.items.length;

        return `
          <details class="diagAcc"${open} data-mod="${b.m}">
            <summary>
              <div>
                <div class="acc__meta">${b.meta.k}</div>
                <div style="font-weight:900;">${escapeHtml(b.meta.t)}</div>
                <div class="acc__mini">
                  <span class="acc__count" data-count="${b.m}">0/${total}</span>
                  <span class="acc__pct" data-pct="${b.m}">0%</span>
                </div>
              </div>
              <div class="acc__caret">+</div>
            </summary>

            <div class="acc__body">
              ${b.items.map((it) => renderQ(it)).join("")}
            </div>
          </details>
        `;
      })
      .join("");

    // restaurar respuestas guardadas si existen
    hydrateAnswers();

    updateSectionProgress();
    updateProgress();
  }

  function renderQ(it) {
    return `
      <div class="diagQ" data-qid="${it.id}" data-mod="${it._module}">
        <div class="diagQ__top">
          <div class="diagQ__q">${escapeHtml(it.q)}</div>
          ${riskBadge(it)}
        </div>

        <div class="diagQ__opts">
          ${radio(it.id, "ok", "OK")}
          ${radio(it.id, "parcial", "Parcial")}
          ${radio(it.id, "no", "No")}
        </div>
      </div>
    `;
  }

  function radio(name, val, label) {
    return `
      <label class="opt">
        <input type="radio" name="${name}" value="${val}" />
        <span>${label}</span>
      </label>
    `;
  }

  // --------- Progreso total / por sección
  function updateProgress() {
    const total = $$("[data-qid]").length;
    const answered = $$("[data-qid] input[type=radio]:checked").length;
    const pct = total ? Math.round((answered / total) * 100) : 0;

    const pctTxt = $("#pctTxt");
    const pctBar = $("#pctBar");
    const statusTxt = $("#statusTxt");

    if (pctTxt) pctTxt.textContent = `${pct}%`;
    if (pctBar) pctBar.style.width = `${pct}%`;

    const hasGiro = el.giro.value !== "";
    const hasSize = el.turnoCount.value !== "";
    if (!hasGiro || !hasSize) {
      if (statusTxt) statusTxt.textContent = "Preparando análisis… selecciona giro + personal por turno.";
      return;
    }
    if (pct < 40) statusTxt.textContent = "Análisis en curso… completa el checklist para precisión.";
    else if (pct < 90) statusTxt.textContent = "Modelo operativo activo… casi listo para generar resultado.";
    else statusTxt.textContent = "Listo para generar resultado operativo ✔";
  }

  function updateSectionProgress() {
    const sections = new Set($$(".diagAcc").map((d) => d.getAttribute("data-mod")));
    sections.forEach((m) => {
      const total = $$(`[data-qid][data-mod="${m}"]`).length;
      const answered = $$(`[data-qid][data-mod="${m}"] input[type=radio]:checked`).length;
      const pct = total ? Math.round((answered / total) * 100) : 0;

      const countEl = $(`[data-count="${m}"]`);
      const pctEl = $(`[data-pct="${m}"]`);
      if (countEl) countEl.textContent = `${answered}/${total}`;
      if (pctEl) pctEl.textContent = `${pct}%`;
    });
  }

  // --------- Estado (guardar local)
  function getState() {
    const answers = {};
    $$("[data-qid]").forEach((q) => {
      const id = q.getAttribute("data-qid");
      const checked = q.querySelector("input[type=radio]:checked");
      if (checked) answers[id] = checked.value;
    });

    return {
      giro: el.giro.value,
      turnoCount: el.turnoCount.value,
      turnos: el.turnos.value,
      name: el.name.value.trim(),
      company: el.company.value.trim(),
      phone: el.phone.value.trim(),
      email: el.email.value.trim(),
      nota: el.nota.value.trim(),
      answers,
    };
  }

  function saveLocal() {
    const s = getState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function hydrateForm() {
    const s = loadLocal();
    if (!s) return;

    el.giro.value = s.giro || "";
    el.turnoCount.value = s.turnoCount || "";
    el.turnos.value = s.turnos || "";
    el.name.value = s.name || "";
    el.company.value = s.company || "";
    el.phone.value = s.phone || "";
    el.email.value = s.email || "";
    el.nota.value = s.nota || "";

    paintBase();
    setTimeout(() => {
      hydrateAnswers();
      updateSectionProgress();
      updateProgress();
    }, 0);
  }

  function hydrateAnswers() {
    const s = loadLocal();
    if (!s || !s.answers) return;
    Object.entries(s.answers).forEach(([qid, val]) => {
      const inp = document.querySelector(`input[name="${qid}"][value="${val}"]`);
      if (inp) inp.checked = true;
    });
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    el.giro.value = "";
    el.turnoCount.value = "";
    el.turnos.value = "";
    el.name.value = "";
    el.company.value = "";
    el.phone.value = "";
    el.email.value = "";
    el.nota.value = "";
    el.noms.innerHTML = "";
    el.brigadas.innerHTML = "";
    el.checklist.innerHTML = `<div class="p">Selecciona un giro para activar checklist.</div>`;
    el.resultado.innerHTML = `<div class="outTitle">Resultado (resumen)</div><div class="small">Completa el checklist y presiona “Generar resultado operativo”.</div>`;
    $("#outCard")?.classList.remove("is-ready");
    updateProgress();
  }

  // --------- Motor score / urgencia
  function sizeLevel(shiftSize) {
    // personal simultáneo por turno → nivel operativo
    if (!shiftSize) return 0;
    if (shiftSize === "1-25") return 1;
    if (shiftSize === "26-50") return 2;
    if (shiftSize === "51-100") return 3;
    if (shiftSize === "101-250") return 4;
    if (shiftSize === "251-600") return 5;
    if (shiftSize === "601-1200") return 6;
    if (shiftSize === "1201+") return 7; // macro real
    return 0;
  }

  function compute() {
    const s = getState();
    const v = MAP[s.giro];
    const id = uid();

    // score base
    let score = 100;
    let redFlags = [];
    let noCount = 0;

    // penalizaciones por respuesta
    Object.entries(s.answers).forEach(([qid, ans]) => {
      // encuentra item
      let item = null;
      for (const mod of Object.keys(CHECKLIST)) {
        item = (CHECKLIST[mod] || []).find((x) => x.id === qid);
        if (item) break;
      }
      if (!item) return;

      if (ans === "parcial") score -= Math.round(item.peso * 0.45);
      if (ans === "no") {
        score -= item.peso;
        noCount++;
        if (item.redFlag) redFlags.push(qid);
      }
    });

    // ajuste por tamaño (operación grande exige más)
    const lvl = sizeLevel(s.turnoCount);
    score -= Math.max(0, (lvl - 3) * 3); // leve penal por complejidad

    // clamp
    score = Math.max(0, Math.min(100, score));

    // semáforo
    let sem = "VERDE";
    if (score < 80) sem = "AMARILLO";
    if (score < 60) sem = "ROJO";

    // urgencia (simple, pero efectiva)
    let urg = "BAJA";
    if (noCount >= 3 || score < 80) urg = "MEDIA";
    if (redFlags.length >= 1 || score < 60) urg = "ALTA";

    // acciones recomendadas (cliente ve esto)
    const accionesNow = [];
    if (urg === "ALTA") accionesNow.push("Visita técnica en sitio (72h) para cierre de brechas críticas.");
    if (redFlags.length) accionesNow.push("Activar plan correctivo inmediato para puntos Red Flag (evidencia y control).");
    accionesNow.push("Calendarizar simulacro + verificación de extintores y rutas.");
    accionesNow.push("Integrar carpeta de evidencia (actas, registros, fotos, DC-3 según aplique).");
    if (lvl >= 6) accionesNow.push("Operación macro: coordinación por turno + macro-simulacros y responsables por área.");

    // resumen cliente (sin detallar lógica)
    const clientSummary = [
      `Semáforo: ${sem} | Urgencia: ${urg} | Score: ${score}/100`,
      `Nivel operativo: ${lvl} (${s.turnoCount || "-"})`,
      `Recomendación: ${urg === "ALTA" ? "Atención inmediata" : urg === "MEDIA" ? "Atención prioritaria" : "Planificación"}`
    ].join("\n");

    // resumen interno (para tu correo)
    const internalSummary = [
      `Nivel operativo: ${lvl}`,
      `NoCount: ${noCount}`,
      `RedFlags(qid): ${redFlags.join(", ") || "-"}`,
    ].join("\n");

    return { id, s, v, score, sem, urg, redFlags, accionesNow, clientSummary, internalSummary, lvl };
  }

  function paintResult(r) {
    $("#outCard")?.classList.add("is-ready");

    const semPill =
      r.sem === "VERDE" ? `<span class="pill pill--g">VERDE</span>` :
      r.sem === "AMARILLO" ? `<span class="pill pill--y">AMARILLO</span>` :
      `<span class="pill pill--r">ROJO</span>`;

    el.resultado.innerHTML = `
      <div class="outTitle">Resultado generado ✔</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:6px;">
        ${semPill}
        <span class="pill">Urgencia: ${escapeHtml(r.urg)}</span>
        <span class="pill">Score: ${r.score}/100</span>
      </div>

      <div class="softHr" style="margin:12px 0;"></div>

      <div class="small">Acciones recomendadas (resumen)</div>
      <ul class="listT">
        ${r.accionesNow.slice(0, 5).map((a) => `<li>${escapeHtml(a)}</li>`).join("")}
      </ul>

      <div class="small" style="margin-top:10px;">Nota: este resumen no incluye detalle interno del checklist.</div>
    `;
  }

  // --------- Envío a Apps Script (reporte completo)
  async function sendLead(r) {
    const payload = {
      token: TOKEN,

      id: r.id,
      name: r.s.name || "",
      company: r.s.company || "",
      phone: r.s.phone || "",
      email: r.s.email || "",

      giro: r.s.giro || "",
      shiftSize: r.s.turnoCount || "",
      shifts: r.s.turnos || "",

      score: r.score,
      semaphore: r.sem,
      urgency: r.urg,

      noms: (r.v?.noms || []),
      brigadas: (r.v?.brigadas || []),

      note: r.s.nota || "",

      // cliente (corto)
      clientSummary: r.clientSummary,

      // interno (completo)
      internalSummary: r.internalSummary + "\nAccionesNow: " + r.accionesNow.join(" | "),

      answers: r.s.answers || {},
    };

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Apps Script a veces no responde JSON perfecto; toleramos
      const txt = await res.text();
      return txt && txt.includes("ok") ? true : true; // si responde, lo damos por ok
    } catch (e) {
      return false;
    }
  }

  // --------- Events
  el.giro.addEventListener("change", () => {
    paintBase();
    saveLocal();
    updateProgress();
  });

  el.turnoCount.addEventListener("change", () => {
    saveLocal();
    updateProgress();
  });

  el.turnos.addEventListener("change", saveLocal);

  document.addEventListener("change", (e) => {
    if (e.target && e.target.matches('input[type="radio"]')) {
      saveLocal();
      updateSectionProgress();
      updateProgress();
    }
  });

  el.btnSave.addEventListener("click", () => {
    saveLocal();
    const s = $("#statusTxt");
    if (s) s.textContent = "Guardado ✔";
  });

  el.btnReset.addEventListener("click", () => {
    resetAll();
  });

  el.btnCalc.addEventListener("click", async () => {
    // validación mínima (sin molestar)
    if (!el.giro.value || !el.turnoCount.value) {
      const s = $("#statusTxt");
      if (s) s.textContent = "Completa giro + personal por turno para generar resultado.";
      return;
    }

    const r = compute();
    paintResult(r);
    saveLocal();

    const ok = await sendLead(r);
    const st = $("#statusTxt");
    if (st) st.textContent = ok ? "Resultado generado ✔ Registro enviado a Boxfox1" : "Resultado generado ✔ (registro pendiente)";
  });

  // init
  hydrateForm();
  updateProgress();
})();