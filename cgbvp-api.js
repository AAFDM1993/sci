// ============================================================
//  CGBVP — Cliente API · cgbvp-api.js
//  Conecta el frontend con el backend Google Apps Script
//  Incluir este archivo en todas las páginas HTML del proyecto
// ============================================================

const CGBVP_API = (() => {

  // ── Configuración ─────────────────────────────────────────
  // Reemplaza con tu URL de despliegue de GAS
  const API_URL = 'https://script.google.com/macros/s/AKfycby28q1jnDUUam5E3AnnYcHjj0gaSqT0RXrHYGQDc4XlBN1Tey_YvpOwpWnwP-TCqr8URg/exec';

  const STORAGE_KEYS = {
    TOKEN   : 'cgbvp_token',
    USER    : 'cgbvp_user',
    EXPIRES : 'cgbvp_expires',
  };

  // ── Request base ──────────────────────────────────────────
  async function request(action, data = {}, method = 'POST') {
    const token = getToken();

    // GET: parámetros en query string
    if (method === 'GET') {
      const qs = new URLSearchParams({ action, token, ...data }).toString();
      const res = await fetch(`${API_URL}?${qs}`);
      return res.json();
    }

    // POST: body JSON
    const res = await fetch(API_URL, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ action, token, ...data }),
    });
    return res.json();
  }

  // ── Token helpers ─────────────────────────────────────────
  function getToken()   { return localStorage.getItem(STORAGE_KEYS.TOKEN) || ''; }
  function getUser()    {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }
  function isLoggedIn() {
    const exp = localStorage.getItem(STORAGE_KEYS.EXPIRES);
    return !!getToken() && (!exp || Date.now() < parseInt(exp));
  }
  function saveSession(token, user) {
    localStorage.setItem(STORAGE_KEYS.TOKEN,   token);
    localStorage.setItem(STORAGE_KEYS.USER,    JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.EXPIRES, String(Date.now() + 8 * 3600 * 1000));
  }
  function clearSession() {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  }

  // ── Auth ──────────────────────────────────────────────────
  async function login(usuario, password, compania_id) {
    const res = await request('login', { usuario, password, compania_id });
    if (res.ok) saveSession(res.token, res.user);
    return res;
  }

  function logout() {
    clearSession();
    window.location.href = 'index.html';
  }

  // ── Usuarios ──────────────────────────────────────────────
  const usuarios = {
    getAll   : ()       => request('getUsuarios',   {}, 'GET'),
    create   : (data)   => request('createUsuario', data),
    update   : (data)   => request('updateUsuario', data),
    remove   : (id)     => request('deleteUsuario', { id }),
  };

  // ── Comandancias y Compañías ──────────────────────────────
  const estructura = {
    getComandancias : ()               => request('getComandancias', {}, 'GET'),
    getCompanias    : (comandancia_id) => request('getCompanias', { comandancia_id }, 'GET'),
  };

  // ── Incidentes ────────────────────────────────────────────
  const incidentes = {
    getAll  : (filtros = {}) => request('getIncidentes',   filtros, 'GET'),
    get     : (id)           => request('getIncidente',    { id }, 'GET'),
    create  : (data)         => request('createIncidente', data),
    update  : (data)         => request('updateIncidente', data),
    close   : (data)         => request('closeIncidente',  data),
  };

  // ── Anexos ────────────────────────────────────────────────
  const anexos = {
    get     : (incidente_id, numero)         => request('getAnexo', { incidente_id, numero }, 'GET'),
    getAll  : (incidente_id)                 => request('getAnexosByIncidente', { incidente_id }, 'GET'),
    save    : (incidente_id, numero, datos, completado = true) =>
                request('saveAnexo', { incidente_id, numero, datos, completado }),
  };

  // ── Chat ──────────────────────────────────────────────────
  const chat = {
    getMensajes : (incidente_id, canal, desde_id) =>
                    request('getChatMensajes', { incidente_id, canal, desde_id }, 'GET'),
    send        : (incidente_id, canal, texto, tipo = 'msg') =>
                    request('sendChatMensaje', { incidente_id, canal, texto, tipo }),
  };

  // ── Drive ─────────────────────────────────────────────────
  const drive = {
    upload   : (incidente_id, subfolder, filename, base64data, mimetype) =>
                 request('uploadFile', { incidente_id, subfolder, filename, base64data, mimetype }),
    getFiles : (incidente_id, subfolder) =>
                 request('getFiles', { incidente_id, subfolder }, 'GET'),

    // Convierte File a base64
    fileToBase64: (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }),

    // Sube imagen desde input[type=file]
    uploadImage: async (incidente_id, subfolder, fileInput) => {
      const file     = fileInput.files[0];
      if (!file) return { ok: false, error: 'No se seleccionó archivo' };
      const base64   = await drive.fileToBase64(file);
      return drive.upload(incidente_id, subfolder, file.name, base64, file.type);
    },

    // Exporta canvas como imagen y la sube a Drive
    uploadCanvas: async (incidente_id, canvasId) => {
      const canvas   = document.getElementById(canvasId);
      if (!canvas)   return { ok: false, error: 'Canvas no encontrado' };
      const base64   = canvas.toDataURL('image/png').split(',')[1];
      const filename = `croquis_${incidente_id}_${Date.now()}.png`;
      return drive.upload(incidente_id, 'Croquis', filename, base64, 'image/png');
    },
  };

  // ── Estadísticas ──────────────────────────────────────────
  const stats = {
    get  : (desde, hasta) => request('getEstadisticas', { desde, hasta }, 'GET'),
    logs : (limit = 100)  => request('getLogs', { limit }, 'GET'),
  };

  // ── Ping ──────────────────────────────────────────────────
  const ping = () => request('ping', {}, 'GET');

  // API pública
  return {
    ping, login, logout,
    isLoggedIn, getUser, getToken,
    usuarios, estructura, incidentes,
    anexos, chat, drive, stats,
  };

})();
