/* ============================================================
   header.js — Cabecera global inyectada en todas las páginas
   excepto reader (pantalla completa)
   ============================================================ */

(function () {
  // Detectar ruta base según si estamos en /pages/ o en raíz
  const inPages = window.location.pathname.includes('/pages/');
  const root    = inPages ? '../' : '';

  // ── HTML de la cabecera ──
  const headerHTML = `
    <header class="site-header home-header" id="siteHeader">
      <div class="home-header-inner">

        <div class="home-logo-area">
          <a href="${root}index.html" class="logo-link">
            <span class="logo-main">Comic<span class="logo-accent">Show</span></span>
          </a>
          <span class="home-tagline">Crea y comparte tus cómics</span>
        </div>

        <div class="home-user-area">

          <!-- Sin sesión -->
          <div id="navGuest" class="home-guest">
            <a href="${root}pages/register.html" class="home-user-link">Regístrate</a>
            <span class="home-user-sep">·</span>
            <a href="${root}pages/login.html" class="home-user-link">Entrar</a>
          </div>

          <!-- Con sesión -->
          <div id="navLogged" class="home-logged" style="display:none">
            <div class="dropdown">
              <button class="home-user-link" id="avatarBtn"
                style="background:none;border:none;cursor:pointer;font-size:.8rem;font-weight:700;color:var(--ink);padding:0">
                <span id="navUsername"></span> ▾
              </button>
              <div class="dropdown-menu" id="avatarMenu">
                <a href="${root}pages/editor.html" class="dropdown-item">Mis cómics</a>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item" id="logoutBtn">Cerrar sesión</a>
              </div>
            </div>
          </div>

          <!-- ⋮ opciones generales -->
          <div class="dropdown">
            <button class="home-dots-btn" id="dotsBtn" title="Más opciones">⋮</button>
            <div class="dropdown-menu dropdown-menu-right" id="dotsMenu">
              <a href="${root}pages/register.html" class="dropdown-item" id="dotsRegister">Registrarse</a>
              <a href="#" class="dropdown-item danger-item" id="dotsDeleteAccount" style="display:none">Eliminar mi cuenta</a>
              <div class="dropdown-divider"></div>
              <span class="dropdown-item disabled-item">ℹ️ Info</span>
              <span class="dropdown-item disabled-item">✉️ Contacto</span>
              <span class="dropdown-item disabled-item">☕ Invítame a un café</span>
            </div>
          </div>

        </div>
      </div>
    </header>`;

  // ── Inyectar cabecera al inicio del body ──
  document.body.insertAdjacentHTML('afterbegin', headerHTML);

  // ── Esperar a que el DOM esté listo y luego inicializar ──
  function init() {
    const user = Auth.currentUser();

    // Mostrar estado de sesión
    const navGuest  = document.getElementById('navGuest');
    const navLogged = document.getElementById('navLogged');
    const navName   = document.getElementById('navUsername');
    const dotsReg   = document.getElementById('dotsRegister');
    const dotsDel   = document.getElementById('dotsDeleteAccount');

    if (user) {
      navGuest.style.display  = 'none';
      navLogged.style.display = 'flex';
      if (navName) navName.textContent = user.username;
      if (dotsReg) dotsReg.style.display = 'none';
      if (dotsDel) dotsDel.style.display = 'block';
    } else {
      navGuest.style.display  = 'flex';
      navLogged.style.display = 'none';
      if (dotsReg) dotsReg.style.display = 'block';
      if (dotsDel) dotsDel.style.display = 'none';
    }

    // ── Dropdowns ──
    function bindDropdown(btnId, menuId) {
      const btn  = document.getElementById(btnId);
      const menu = document.getElementById(menuId);
      if (!btn || !menu) return;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menu.classList.contains('open');
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
        if (!isOpen) menu.classList.add('open');
      });
    }

    bindDropdown('avatarBtn', 'avatarMenu');
    bindDropdown('dotsBtn',   'dotsMenu');

    // Cerrar al clicar fuera
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
      }
    });

    // ── Cerrar sesión ──
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
      window.location.href = root + 'index.html';
    });

    // ── Eliminar cuenta ──
    document.getElementById('dotsDeleteAccount')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (!Auth.isLogged()) return;
      if (confirm('Si eliminas tu cuenta se borrarán todos tus datos y cómics.\n\nEsta acción no se puede deshacer.')) {
        const u = Auth.currentUser();
        if (window.ComicStore) ComicStore.getByUser(u.id).forEach(c => ComicStore.remove(c.id));
        Auth.deleteAccount();
        window.location.href = root + 'index.html';
      }
    });
  }

  // Ejecutar init cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
