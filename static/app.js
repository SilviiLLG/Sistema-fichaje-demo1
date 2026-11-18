(() => {
  "use strict";
  const STORAGE_KEY = "teknovya_sistema_fichaje_demo_v1";
  const seed = {
    pasantes: [
      { id: 1, nombre: "Camila Torres", turno: "Mañana", horas_turno: 4 },
      { id: 2, nombre: "Mateo Ruiz", turno: "Tarde", horas_turno: 5 },
      { id: 3, nombre: "Valentina López", turno: "Mañana", horas_turno: 4 }
    ],
    fichajes: [
      { id: 1, pasante_id: 1, fecha: dateOffset(-2), hora: "09:02:00", horas: 4 },
      { id: 2, pasante_id: 2, fecha: dateOffset(-2), hora: "13:05:00", horas: 5 },
      { id: 3, pasante_id: 1, fecha: dateOffset(-1), hora: "09:00:00", horas: 4 },
      { id: 4, pasante_id: 3, fecha: dateOffset(-1), hora: "08:57:00", horas: 4 }
    ]
  };

  function dateOffset(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return localDate(d);
  }
  function localDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.pasantes) && Array.isArray(parsed.fichajes)) return parsed;
      }
    } catch (_) {}
    const initial = JSON.parse(JSON.stringify(seed));
    saveState(initial);
    return initial;
  }
  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
  function byId(id) { return document.getElementById(id); }
  function showMessage(target, text, kind) {
    if (!target) return;
    target.textContent = text;
    target.className = `inline-message ${kind || ""}`;
  }
  function findPasante(state, id) {
    return state.pasantes.find(p => Number(p.id) === Number(id));
  }
  function renderPublicPasantes() {
    const target = byId("public-pasantes");
    if (!target) return;
    const state = loadState();
    target.innerHTML = state.pasantes.length ? state.pasantes.map(p =>
      `<div class="person"><strong>#${p.id} · ${escapeHtml(p.nombre)}</strong><small>${escapeHtml(p.turno)} · ${p.horas_turno} horas</small></div>`
    ).join("") : '<p class="empty-state">Todavía no hay pasantes cargados.</p>';
  }

  const ficharForm = byId("fichar-form");
  if (ficharForm) {
    renderPublicPasantes();
    ficharForm.addEventListener("submit", event => {
      event.preventDefault();
      const id = Number(byId("fichar-id").value);
      const state = loadState();
      const person = findPasante(state, id);
      const message = byId("fichar-message");
      if (!person) return showMessage(message, "No encontramos ese ID. Revisá la lista de pasantes.", "error");
      const today = localDate(new Date());
      if (state.fichajes.some(f => Number(f.pasante_id) === id && f.fecha === today)) {
        return showMessage(message, `${person.nombre}, ya tenés un fichaje registrado hoy.`, "error");
      }
      const now = new Date();
      state.fichajes.push({
        id: Date.now(),
        pasante_id: id,
        fecha: today,
        hora: now.toTimeString().slice(0, 8),
        horas: Number(person.horas_turno)
      });
      saveState(state);
      showMessage(message, `¡Fichaje registrado para ${person.nombre}!`, "success");
      ficharForm.reset();
    });
  }

  function historyMarkup(state, id) {
    const person = findPasante(state, id);
    if (!person) return '<p class="empty-state">No encontramos un pasante con ese ID.</p>';
    const rows = state.fichajes.filter(f => Number(f.pasante_id) === Number(id))
      .sort((a,b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`));
    const total = rows.reduce((sum, f) => sum + Number(f.horas || 0), 0);
    return `<div class="panel-heading"><div><span class="eyebrow">PASANTE #${person.id}</span><h2>${escapeHtml(person.nombre)}</h2></div><span class="muted small">${rows.length} fichajes</span></div>
      <p class="muted small">Turno ${escapeHtml(person.turno)} · ${person.horas_turno} horas por turno · Total: ${total} hs</p>
      ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Hora</th><th>Horas</th></tr></thead><tbody>${rows.map(f => `<tr><td>${escapeHtml(f.fecha)}</td><td>${escapeHtml(f.hora)}</td><td>${Number(f.horas).toFixed(1)}</td></tr>`).join("")}</tbody></table></div>` : '<p class="empty-state">Todavía no hay fichajes para este pasante.</p>'}`;
  }
  const historyForms = document.querySelectorAll("#historial-form");
  historyForms.forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();
      const id = Number(byId("historial-id").value);
      const result = byId("historial-result") || byId("fichar-message");
      if (byId("historial-result")) result.innerHTML = historyMarkup(loadState(), id);
      else window.location.href = `/historial?id=${encodeURIComponent(id)}`;
    });
  });

  const historyResult = byId("historial-result");
  if (historyResult) {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));
    if (id) {
      byId("historial-id").value = id;
      historyResult.innerHTML = historyMarkup(loadState(), id);
    }
  }

  const addForm = byId("add-pasante-form");
  if (addForm) {
    const state = loadState();
    const renderAdmin = () => {
      const current = loadState();
      byId("stat-pasantes").textContent = current.pasantes.length;
      byId("stat-fichajes").textContent = current.fichajes.length;
      byId("stat-horas").textContent = current.fichajes.reduce((s,f) => s + Number(f.horas || 0), 0).toFixed(1);
      const target = byId("admin-pasantes");
      target.innerHTML = current.pasantes.length ? `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Nombre</th><th>Turno</th><th>Horas</th><th>Acción</th></tr></thead><tbody>${current.pasantes.map(p => `<tr><td>${p.id}</td><td>${escapeHtml(p.nombre)}</td><td>${escapeHtml(p.turno)}</td><td>${p.horas_turno}</td><td><button class="remove-button" data-remove="${p.id}" type="button">Quitar</button></td></tr>`).join("")}</tbody></table></div>` : '<p class="empty-state">No hay pasantes cargados.</p>';
    };
    renderAdmin();
    addForm.addEventListener("submit", event => {
      event.preventDefault();
      const current = loadState();
      const nombre = byId("nombre").value.trim();
      const turno = byId("turno").value;
      const horas = Number(byId("horas").value);
      if (!nombre || !turno || !Number.isFinite(horas) || horas <= 0 || horas > 24) {
        return showMessage(byId("admin-message"), "Completá todos los campos con valores válidos.", "error");
      }
      const nextId = current.pasantes.reduce((max,p) => Math.max(max, Number(p.id)), 0) + 1;
      current.pasantes.push({ id: nextId, nombre, turno, horas_turno: horas });
      saveState(current);
      addForm.reset();
      byId("horas").value = "4";
      showMessage(byId("admin-message"), "Pasante agregado correctamente.", "success");
      renderAdmin();
    });
    byId("admin-pasantes").addEventListener("click", event => {
      const button = event.target.closest("[data-remove]");
      if (!button) return;
      const id = Number(button.dataset.remove);
      if (!confirm("¿Querés quitar este pasante y sus fichajes de esta demo?")) return;
      const current = loadState();
      current.pasantes = current.pasantes.filter(p => Number(p.id) !== id);
      current.fichajes = current.fichajes.filter(f => Number(f.pasante_id) !== id);
      saveState(current);
      renderAdmin();
    });
    const exportButton = byId("export-button");
    exportButton.addEventListener("click", async () => {
      exportButton.disabled = true;
      exportButton.textContent = "Preparando archivo…";
      try {
        const response = await fetch("/exportar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loadState())
        });
        if (!response.ok) throw new Error("No se pudo generar el Excel.");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "fichajes_demo.xlsx";
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        alert(error.message || "Ocurrió un error al exportar.");
      } finally {
        exportButton.disabled = false;
        exportButton.innerHTML = '<span><b>Exportar a Excel</b><small>Descargar todos los fichajes</small></span><strong>↓</strong>';
      }
    });
  }

  const summary = byId("summary-table");
  if (summary) {
    const state = loadState();
    const rows = state.pasantes.map(p => {
      const total = state.fichajes.filter(f => Number(f.pasante_id) === Number(p.id))
        .reduce((sum,f) => sum + Number(f.horas || 0), 0);
      return { ...p, total, viatico: total * 500 };
    });
    summary.innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Nombre</th><th>Total horas</th><th>Viático estimado</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.id}</td><td>${escapeHtml(r.nombre)}</td><td>${r.total.toFixed(1)} hs</td><td>$${r.viatico.toLocaleString("es-AR")}</td></tr>`).join("")}</tbody></table></div><p class="muted small">Cálculo ilustrativo: $500 por hora.</p>` : '<p class="empty-state">No hay pasantes para mostrar.</p>';
  }
})();
