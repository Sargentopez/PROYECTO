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

    // Dropdown avatar / nombre usuario
    const avatarBtn  = document.getElementById('avatarBtn');
    const avatarMenu = document.getElementById('avatarMenu');
    if (avatarBtn && avatarMenu) {
      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        avatarMenu.classList.toggle('open');
        document.getElementById('dotsMenu')?.classList.remove('open');
      });
    }

    // Dropdown ⋮ tres puntos
    const dotsBtn  = document.getElementById('dotsBtn');
    const dotsMenu = document.getElementById('dotsMenu');
    if (dotsBtn && dotsMenu) {
      dotsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dotsMenu.classList.toggle('open');
        avatarMenu?.classList.remove('open');
      });
    }

    // Cerrar todos los dropdowns al hacer clic fuera
    document.addEventListener('click', () => {
      avatarMenu?.classList.remove('open');
      dotsMenu?.classList.remove('open');
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
    const users = JSON.parse(localStorage.getItem('cs_users') || '[]')
      .filter(u => u.id !== user.id);
    localStorage.setItem('cs_users', JSON.stringify(users));
    localStorage.removeItem('cs_session');
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
