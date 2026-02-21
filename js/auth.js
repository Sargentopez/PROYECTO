/* ============================================================
   auth.js — Sistema de autenticación (localStorage)
   ============================================================ */

const Auth = (() => {
  const KEY_USERS   = 'cs_users';
  const KEY_SESSION = 'cs_session';

  // ── Helpers de persistencia ──
  function getUsers()  { return JSON.parse(localStorage.getItem(KEY_USERS)  || '{}'); }
  function saveUsers(u){ localStorage.setItem(KEY_USERS, JSON.stringify(u)); }
  function getSession(){ return JSON.parse(localStorage.getItem(KEY_SESSION)|| 'null'); }
  function saveSession(s){ localStorage.setItem(KEY_SESSION, JSON.stringify(s)); }

  // ── Hash simple (no criptográfico, solo para demo local) ──
  function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return 'h' + Math.abs(h).toString(36);
  }

  // ── Registro ──
  function register(username, email, password) {
    const users = getUsers();
    const key = email.toLowerCase().trim();
    if (users[key]) return { ok: false, err: 'errUserExists' };
    users[key] = {
      id:       'u_' + Date.now(),
      username: username.trim(),
      email:    key,
      passHash: simpleHash(password),
      createdAt: new Date().toISOString()
    };
    saveUsers(users);
    return { ok: true };
  }

  // ── Login ──
  function login(email, password) {
    const users = getUsers();
    const key = email.toLowerCase().trim();
    const user = users[key];
    if (!user || user.passHash !== simpleHash(password)) {
      return { ok: false, err: 'errUserNotFound' };
    }
    const session = { id: user.id, username: user.username, email: user.email };
    saveSession(session);
    return { ok: true, user: session };
  }

  // ── Logout ──
  function logout() {
    localStorage.removeItem(KEY_SESSION);
  }

  // ── Estado actual ──
  function currentUser() { return getSession(); }
  function isLogged()    { return !!getSession(); }

  // ── Actualizar UI de nav dependiendo de sesión ──
  function updateNavUI() {
    const user = currentUser();
    const guestEl  = document.getElementById('navGuest');
    const loggedEl = document.getElementById('navLogged');
    const nameEl   = document.getElementById('navUsername');
    const initEl   = document.getElementById('avatarInitial');
    if (!guestEl) return;
    if (user) {
      guestEl.classList.add('hidden');
      loggedEl.classList.remove('hidden');
      if (nameEl)  nameEl.textContent = user.username;
      if (initEl)  initEl.textContent = user.username[0].toUpperCase();
    } else {
      guestEl.classList.remove('hidden');
      loggedEl.classList.add('hidden');
    }
  }

  // ── Wiring de botones comunes ──
  document.addEventListener('DOMContentLoaded', () => {
    updateNavUI();

    // Hamburger
    const ham   = document.getElementById('hamburgerBtn');
    const nav   = document.getElementById('mainNav');
    if (ham && nav) {
      ham.addEventListener('click', () => {
        ham.classList.toggle('open');
        nav.classList.toggle('open');
      });
    }

    // ── Dropdowns: avatar y ⋮ ──
    // Usamos mousedown en lugar de click para evitar que el
    // listener del documento los cierre en el mismo evento
    function toggleMenu(btn, menu) {
      if (!btn || !menu) return;
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault(); // evita que el foco cambie y dispare blur
        e.stopPropagation();
        const isOpen = menu.classList.contains('open');
        // Cerrar todos
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
        // Abrir este si estaba cerrado
        if (!isOpen) menu.classList.add('open');
      });
      // Touch support
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = menu.classList.contains('open');
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
        if (!isOpen) menu.classList.add('open');
      });
    }

    toggleMenu(document.getElementById('avatarBtn'), document.getElementById('avatarMenu'));
    toggleMenu(document.getElementById('dotsBtn'),   document.getElementById('dotsMenu'));

    // Cerrar al hacer clic fuera (en mousedown para consistencia)
    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
      }
    });
    document.addEventListener('touchend', (e) => {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
      }
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
        showToast(I18n.t('logoutOk'));
        setTimeout(() => { window.location.href = getRootPath() + 'index.html'; }, 800);
      });
    }

    // Eliminar cuenta (si existe el botón)
    const deleteAccountBtn = document.getElementById('dotsDeleteAccount');
    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isLogged()) { showToast('No hay sesión iniciada'); return; }
        if (confirm('Si eliminas tu cuenta se borrarán todos tus datos y cómics.\n\nEsta acción no se puede deshacer.')) {
          const user = currentUser();
          // Eliminar cómics del usuario
          const ComicStoreRef = window.ComicStore;
          if (ComicStoreRef) ComicStoreRef.getByUser(user.id).forEach(c => ComicStoreRef.remove(c.id));
          deleteAccount();
          window.location.reload();
        }
      });
    }
  });

  // ── Utilidad de rutas ──
  function getRootPath() {
    const p = window.location.pathname;
    return p.includes('/pages/') ? '../' : '';
  }

  function deleteAccount() {
    const user = currentUser();
    if (!user) return;
    const users = getUsers(); // object keyed by email
    Object.keys(users).forEach(k => { if (users[k].id === user.id) delete users[k]; });
    saveUsers(users);
    logout();
  }

  return { register, login, logout, deleteAccount, currentUser, isLogged, updateNavUI, getRootPath };
})();

// ── Toast global ──
function showToast(msg, duration=2500) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}
