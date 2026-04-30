// ============================================================
//  CGBVP — Módulo de formularios de Anexos
//  Archivo: anexo-form.js
//  Incluir en todas las páginas de anexos junto con cgbvp-api.js
// ============================================================

const CGBVP_FORM = (() => {

  // ── Estado actual del formulario ──────────────────────────
  let _incidenteId = null;
  let _numeroAnexo = null;
  let _guardando   = false;

  // ── Inicializar formulario desde URL params ───────────────
  function init(numero) {
    _numeroAnexo = numero;

    // Leer incidente_id de la URL
    const params = new URLSearchParams(window.location.search);
    _incidenteId = params.get('incidente_id') || '';

    if (!CGBVP_API.isLoggedIn()) {
      window.location.href = 'index.html';
      return;
    }

    if (!_incidenteId) {
      showBanner('error', 'No se especificó un incidente. Regresa al dashboard.');
      return;
    }

    // Cargar datos existentes del anexo
    cargarAnexo();
    renderInfoBar();
  }

  // ── Renderizar barra de info del incidente ────────────────
  async function renderInfoBar() {
    try {
      const res = await CGBVP_API.incidentes.get(_incidenteId);
      if (res.ok) {
        const inc = res.data;
        const bar = document.getElementById('inc-info-bar');
        if (bar) {
          bar.innerHTML = `
            <span style="font-weight:700;">📋 ${inc.nombre}</span>
            <span style="color:var(--gt);font-size:12px;">${inc.tipo?.toUpperCase()} · ${inc.ubicacion}</span>
            <span class="badge b-${inc.estado}" style="font-size:10px;">${inc.estado}</span>`;
        }
        // Rellenar campo de referencia si existe
        const refEl = document.getElementById('f-incidente-ref') || document.getElementById('f-ref');
        if (refEl && !refEl.value) refEl.value = inc.nombre;
      }
    } catch (_) {}
  }

  // ── Cargar datos del anexo desde la API ───────────────────
  async function cargarAnexo() {
    try {
      showBanner('loading', 'Cargando datos guardados...');
      const res = await CGBVP_API.anexos.get(_incidenteId, _numeroAnexo);

      if (res.ok && res.data) {
        rellenarFormulario(res.data);
        showBanner('success', `Anexo ${_numeroAnexo} cargado — última actualización: ${
          res.data.updated_at
            ? new Date(res.data.updated_at).toLocaleString('es-PE')
            : '–'
        }`);
      } else {
        hideBanner();
      }
    } catch (e) {
      hideBanner();
    }
  }

  // ── Guardar anexo en la API ───────────────────────────────
  async function guardar(datos, completado = true) {
    if (_guardando) return;
    if (!_incidenteId) {
      showBanner('error', 'No hay incidente seleccionado');
      return;
    }

    _guardando = true;
    showBanner('loading', 'Guardando anexo...');

    try {
      const res = await CGBVP_API.anexos.save(
        _incidenteId,
        _numeroAnexo,
        datos,
        completado
      );

      if (res.ok) {
        showBanner('success', `✓ Anexo ${_numeroAnexo} guardado correctamente · ${
          new Date().toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' })
        } hrs`);
      } else {
        showBanner('error', res.error || 'Error al guardar');
      }
    } catch (e) {
      showBanner('error', 'Error de conexión: ' + e.message);
    } finally {
      _guardando = false;
    }
  }

  // ── Rellenar formulario con datos cargados ────────────────
  function rellenarFormulario(datos) {
    Object.entries(datos).forEach(([campo, valor]) => {
      const el = document.getElementById('f-' + campo) ||
                 document.querySelector(`[name="${campo}"]`);
      if (!el) return;

      if (el.type === 'checkbox') {
        el.checked = !!valor;
      } else if (el.tagName === 'SELECT') {
        el.value = valor;
      } else if (typeof valor === 'object' && valor !== null) {
        // Los campos JSON se rellenan por lógica específica del formulario
        // Emitir evento para que el formulario lo procese
        document.dispatchEvent(new CustomEvent('cgbvp:campo-json', {
          detail: { campo, valor }
        }));
      } else {
        el.value = valor;
      }
    });

    // Calcular progreso si el formulario tiene esa función
    if (typeof calcProg === 'function') calcProg();
  }

  // ── Recolectar datos de todos los campos del formulario ───
  function recolectarDatos(camposExtra = {}) {
    const datos = { ...camposExtra };

    // Inputs y selects con id que empiece por "f-"
    document.querySelectorAll('[id^="f-"]').forEach(el => {
      const campo = el.id.replace('f-', '').replace(/-/g, '_');
      if (el.type === 'checkbox') {
        datos[campo] = el.checked;
      } else {
        datos[campo] = el.value;
      }
    });

    return datos;
  }

  // ── Banner de estado del formulario ───────────────────────
  function showBanner(tipo, mensaje) {
    let el = document.getElementById('cgbvp-status-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cgbvp-status-banner';
      el.style.cssText = `
        position:fixed;top:58px;left:50%;transform:translateX(-50%);
        padding:8px 20px;border-radius:8px;font-size:12px;font-weight:600;
        font-family:'Source Sans 3',sans-serif;z-index:500;
        transition:all .3s;white-space:nowrap;
        display:flex;align-items:center;gap:8px;
      `;
      document.body.appendChild(el);
    }

    const estilos = {
      loading : 'background:#EFF6FF;color:#1E40AF;border:1px solid #93C5FD;',
      success : 'background:#D1FAE5;color:#065F46;border:1px solid #6EE7B7;',
      error   : 'background:#FEE2E2;color:#991B1B;border:1px solid #FCA5A5;',
      warn    : 'background:#FEF9C3;color:#78350F;border:1px solid #FDE047;',
    };

    const iconos = {
      loading : '<div style="width:12px;height:12px;border:2px solid rgba(30,64,175,.3);border-top-color:#1E40AF;border-radius:50%;animation:cgbvp-spin .7s linear infinite;"></div>',
      success : '✓',
      error   : '✕',
      warn    : '⚠',
    };

    if (!document.getElementById('cgbvp-spin-style')) {
      const style = document.createElement('style');
      style.id = 'cgbvp-spin-style';
      style.textContent = '@keyframes cgbvp-spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(style);
    }

    el.style.cssText += estilos[tipo] || estilos.success;
    el.innerHTML = `${iconos[tipo]} ${mensaje}`;

    if (tipo === 'success') {
      setTimeout(() => { if (el) el.style.opacity = '0'; }, 4000);
      setTimeout(() => { if (el) el.style.display = 'none'; }, 4400);
    } else {
      el.style.opacity = '1';
      el.style.display = 'flex';
    }
  }

  function hideBanner() {
    const el = document.getElementById('cgbvp-status-banner');
    if (el) el.style.display = 'none';
  }

  // ── Subir croquis canvas a Drive ──────────────────────────
  async function guardarCroquis(canvasId = 'croquis-canvas') {
    if (!_incidenteId) return { ok: false, error: 'Sin incidente' };
    showBanner('loading', 'Subiendo croquis a Drive...');
    const res = await CGBVP_API.drive.uploadCanvas(_incidenteId, canvasId);
    if (res.ok) {
      showBanner('success', `Croquis guardado en Drive · ${res.data.filename}`);
    } else {
      showBanner('error', res.error || 'Error al subir croquis');
    }
    return res;
  }

  // ── Subir foto desde input file ───────────────────────────
  async function subirFoto(fileInputId, subfolder = 'Fotografias') {
    if (!_incidenteId) return { ok: false, error: 'Sin incidente' };
    const input = document.getElementById(fileInputId);
    if (!input?.files?.length) return { ok: false, error: 'No se seleccionó archivo' };
    showBanner('loading', `Subiendo ${input.files[0].name}...`);
    const res = await CGBVP_API.drive.uploadImage(_incidenteId, subfolder, input);
    if (res.ok) {
      showBanner('success', `Foto subida: ${res.data.filename}`);
    } else {
      showBanner('error', res.error || 'Error al subir foto');
    }
    return res;
  }

  // ── Cargar fotos de Drive y mostrar en grid ───────────────
  async function cargarFotos(gridId, subfolder = 'Fotografias') {
    if (!_incidenteId) return;
    try {
      const res = await CGBVP_API.drive.getFiles(_incidenteId, subfolder);
      if (!res.ok || !res.data.length) return;
      const grid = document.getElementById(gridId);
      if (!grid) return;
      res.data.forEach(f => {
        const div = document.createElement('div');
        div.style.cssText = 'position:relative;border-radius:8px;overflow:hidden;border:1px solid var(--g2);';
        div.innerHTML = `
          <img src="${f.thumbnail}" alt="${f.filename}"
            style="width:100%;height:120px;object-fit:cover;display:block;">
          <div style="padding:6px 8px;font-size:10px;color:var(--gt);">${f.filename}</div>
          <a href="${f.url}" target="_blank"
            style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.5);color:white;
                   border-radius:4px;padding:2px 6px;font-size:10px;text-decoration:none;">Ver</a>`;
        grid.appendChild(div);
      });
    } catch (_) {}
  }

  // ── Chat inline por incidente ─────────────────────────────
  let _chatPollingTimer = null;
  let _lastMsgId        = null;

  function iniciarChat(canal = 'general') {
    if (!_incidenteId) return;
    cargarMensajes(canal);
    _chatPollingTimer = setInterval(() => cargarMensajes(canal), 5000);
  }

  function detenerChat() {
    if (_chatPollingTimer) clearInterval(_chatPollingTimer);
  }

  async function cargarMensajes(canal) {
    try {
      const res = await CGBVP_API.chat.getMensajes(
        _incidenteId, canal, _lastMsgId
      );
      if (res.ok && res.data.length) {
        res.data.forEach(m => {
          appendMensaje(m);
          _lastMsgId = m.id;
        });
      }
    } catch (_) {}
  }

  async function enviarMensaje(canal, texto) {
    if (!texto?.trim()) return;
    const res = await CGBVP_API.chat.send(_incidenteId, canal, texto);
    if (res.ok) appendMensaje(res.data);
    return res;
  }

  function appendMensaje(m) {
    const area = document.getElementById('chat-messages');
    if (!area) return;
    const user = CGBVP_API.getUser();
    const isMe = m.autor_id === user?.id;
    const div  = document.createElement('div');
    div.style.cssText = `display:flex;flex-direction:${isMe?'row-reverse':'row'};gap:8px;margin-bottom:8px;`;
    div.innerHTML = `
      <div style="background:${isMe?'#CC1E1E':'var(--g1)'};color:${isMe?'white':'inherit'};
           padding:8px 11px;border-radius:10px;max-width:70%;font-size:12px;line-height:1.4;">
        ${!isMe?`<div style="font-size:10px;font-weight:700;color:#CC1E1E;margin-bottom:3px;">${m.autor_nombre}</div>`:''}
        ${m.texto}
        <div style="font-size:10px;opacity:.6;margin-top:4px;">
          ${new Date(m.created_at).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}
        </div>
      </div>`;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
  }

  // API pública del módulo
  return {
    init,
    guardar,
    recolectarDatos,
    rellenarFormulario,
    guardarCroquis,
    subirFoto,
    cargarFotos,
    iniciarChat,
    detenerChat,
    enviarMensaje,
    showBanner,
    getIncidenteId: () => _incidenteId,
    getNumeroAnexo: () => _numeroAnexo,
  };

})();
