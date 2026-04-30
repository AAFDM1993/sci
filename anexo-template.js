// ============================================================
//  CGBVP — Template reutilizable para Anexos 02 al 11
//  Archivo: anexo-template.js
//
//  Este archivo genera la estructura HTML base de cualquier
//  anexo con topbar, barra de incidente, progress y footer.
//  Solo incluirlo en la página y llamar a initAnexoPage().
// ============================================================

function initAnexoPage(config) {
  /*
    config = {
      numero     : '02',            // número del anexo
      ics        : 'ICS 202',       // código ICS
      titulo     : 'Objetivos del Incidente',
      siguiente  : { num:'03', label:'Organización' },
      anterior   : { num:'01', label:'Resumen' },
      required   : ['f-campo1', 'f-campo2'],  // IDs requeridos
      onGuardar  : () => {},        // función que devuelve datos
      onCargar   : (datos) => {},   // función que recibe datos del servidor
    }
  */

  // ── Inyectar topbar si no existe ─────────────────────────
  if (!document.getElementById('cgbvp-topbar')) {
    const topbar = document.createElement('div');
    topbar.id = 'cgbvp-topbar';
    topbar.innerHTML = `
      <style>
        #cgbvp-topbar{display:flex;align-items:center;justify-content:space-between;
          background:#CC1E1E;padding:10px 20px;position:sticky;top:0;z-index:100;}
        .tb-left{display:flex;align-items:center;gap:10px;}
        .tb-badge{background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);
          border-radius:6px;padding:3px 10px;font-size:11px;font-weight:700;color:white;letter-spacing:.08em;}
        .tb-title{font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:700;color:white;}
        .tb-sub{font-size:11px;color:rgba(255,255,255,.7);}
        .tb-right{display:flex;align-items:center;gap:8px;}
        .btn-back-tb{padding:5px 12px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);
          border-radius:6px;color:white;font-size:12px;font-weight:600;cursor:pointer;
          font-family:'Source Sans 3',sans-serif;}
        .btn-back-tb:hover{background:rgba(255,255,255,.25);}
        #cgbvp-inc-bar{background:white;border-bottom:1px solid #EDECE8;padding:8px 20px;
          display:flex;align-items:center;gap:10px;font-size:12px;min-height:36px;
          font-family:'Source Sans 3',sans-serif;}
      </style>
      <div class="tb-left">
        <div class="tb-badge">${config.ics}</div>
        <div>
          <div class="tb-title">Anexo ${config.numero} — ${config.titulo}</div>
          <div class="tb-sub">CGBVP · Sistema de Comando de Incidentes</div>
        </div>
      </div>
      <div class="tb-right">
        <div style="width:8px;height:8px;border-radius:50%;background:#4ADE80;"></div>
        <span style="font-size:12px;color:rgba(255,255,255,.85);">En registro</span>
        <button class="btn-back-tb" onclick="
          if (window.parent !== window && window.parent.cerrarDrawer) {
            window.parent.cerrarDrawer();
          } else {
            window.location.href='dashboard.html';
          }
        ">← Dashboard</button>
      </div>`;
    document.body.insertBefore(topbar, document.body.firstChild);

    const incBar = document.createElement('div');
    incBar.id = 'inc-info-bar';
    incBar.id = 'cgbvp-inc-bar';
    incBar.innerHTML = '<span style="color:#6B7280;">Cargando incidente...</span>';
    document.body.insertBefore(incBar, topbar.nextSibling);
  }

  // ── Inyectar footer si no existe ─────────────────────────
  if (!document.getElementById('cgbvp-footer')) {
    const footer = document.createElement('div');
    footer.id = 'cgbvp-footer';
    footer.style.cssText = `max-width:860px;margin:0 auto;padding:0 16px 40px;`;
    footer.innerHTML = `
      <style>
        .cgbvp-footer-inner{background:white;border:0.5px solid #EDECE8;border-radius:10px;
          padding:16px 18px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;
          font-family:'Source Sans 3',sans-serif;}
        .btn-save-f{padding:10px 24px;background:#CC1E1E;color:white;border:none;border-radius:8px;
          font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;transition:background .12s;}
        .btn-save-f:hover{background:#A01515;}
        .btn-outline-f{padding:10px 18px;background:transparent;border:1px solid #EDECE8;
          border-radius:8px;font-size:13px;cursor:pointer;color:#1A1917;}
        .btn-outline-f:hover{background:#F8F7F5;}
        .btn-nav-f{padding:10px 16px;background:transparent;border:1px solid #EDECE8;
          border-radius:8px;font-size:12px;cursor:pointer;color:#6B7280;display:flex;align-items:center;gap:6px;}
        .btn-nav-f:hover{background:#F8F7F5;}
      </style>
      <div class="cgbvp-footer-inner">
        ${config.anterior ? `
          <button class="btn-nav-f" onclick="irAnexo('${config.anterior.num}')">
            ← Anexo ${config.anterior.num}: ${config.anterior.label}
          </button>` : ''}
        <button class="btn-save-f" onclick="_cgbvpGuardar()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="white" stroke-width="2"/>
            <path d="M17 21v-8H7v8M7 3v5h8" stroke="white" stroke-width="2"/>
          </svg>
          Guardar Anexo ${config.numero}
        </button>
        <button class="btn-outline-f" onclick="_cgbvpLimpiar()">Limpiar</button>
        ${config.siguiente ? `
          <button class="btn-nav-f" style="margin-left:auto;"
            onclick="irAnexo('${config.siguiente.num}')">
            Siguiente: Anexo ${config.siguiente.num} — ${config.siguiente.label} →
          </button>` : ''}
      </div>`;
    document.querySelector('.form-wrap')?.appendChild(footer);
  }

  // ── Inicializar el módulo de formulario ───────────────────
  CGBVP_FORM.init(config.numero);

  // ── Escuchar carga de datos del servidor ──────────────────
  if (config.onCargar) {
    document.addEventListener('cgbvp:campo-json', e => {
      config.onCargar(e.detail);
    });
  }

  // ── Exponer funciones globales necesarias ─────────────────
  window.irAnexo = (num) => {
    // Si estamos dentro del drawer del dashboard, navegar en el drawer
    if (window.parent !== window && window.parent.abrirDrawerAnexo) {
      window.parent.abrirDrawerAnexo(num);
    } else {
      window.location.href = `anexo${num}.html?incidente_id=${CGBVP_FORM.getIncidenteId()}`;
    }
  };

  window._cgbvpGuardar = async () => {
    if (!config.required?.length) {
      await CGBVP_FORM.guardar(config.onGuardar?.() || CGBVP_FORM.recolectarDatos());
      return;
    }
    let valido = true;
    config.required.forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.value.trim()) {
        el.style.borderColor = '#EF4444';
        setTimeout(()=>el.style.borderColor='',2500);
        valido = false;
      }
    });
    if (!valido) {
      CGBVP_FORM.showBanner('error','Completa los campos obligatorios marcados');
      return;
    }
    await CGBVP_FORM.guardar(config.onGuardar?.() || CGBVP_FORM.recolectarDatos());
  };

  window._cgbvpLimpiar = () => {
    if (!confirm('¿Limpiar todos los campos del formulario?')) return;
    document.querySelectorAll('input:not([type=hidden]),textarea,select')
      .forEach(el => { el.value=''; el.style.borderColor=''; el.style.background=''; });
    document.querySelectorAll('input[type=checkbox],input[type=radio]')
      .forEach(el => el.checked = false);
    if (typeof calcProg === 'function') calcProg();
  };
}

// ── Helper: barra de progreso estándar ───────────────────────
function calcProgStd(requiredIds) {
  const filled = requiredIds.filter(id => {
    const el = document.getElementById(id);
    return el && el.value.trim();
  }).length;
  const pct = Math.round(filled / requiredIds.length * 100);
  const fill = document.getElementById('prog-fill');
  const lbl  = document.getElementById('prog-lbl');
  if (fill) fill.style.width = pct + '%';
  if (lbl)  lbl.textContent  = pct + '% completado';
  return pct;
}

// ── Helper: recolectar tabla dinámica ─────────────────────────
function recolectarTabla(tbodyId, columnas) {
  return Array.from(document.querySelectorAll(`#${tbodyId} tr`)).map(tr => {
    const inputs  = tr.querySelectorAll('input');
    const selects = tr.querySelectorAll('select');
    const obj = {};
    let inputIdx = 0, selectIdx = 0;
    columnas.forEach(col => {
      if (col.type === 'select') {
        obj[col.key] = selects[selectIdx++]?.value || '';
      } else if (col.type === 'checkbox') {
        obj[col.key] = inputs[inputIdx++]?.checked || false;
      } else {
        obj[col.key] = inputs[inputIdx++]?.value || '';
      }
    });
    return obj;
  });
}

// ── Helper: recolectar checkboxes de un grupo ─────────────────
function recolectarChks(groupId) {
  return Array.from(document.querySelectorAll(`#${groupId} input:checked`))
    .map(cb => cb.value).join(', ');
}

// ── Helper: recolectar checklist booleano ─────────────────────
function recolectarChecklist(selector) {
  return Array.from(document.querySelectorAll(selector))
    .map(cb => ({ label: cb.closest('.chk-row')?.querySelector('.chk-txt')?.textContent || cb.value, checked: cb.checked }));
}
