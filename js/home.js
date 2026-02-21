/* ============================================================
   home.js — Lógica de la página de inicio
   ============================================================ */

const homeState = {
  searchTerm: '',
  recentOnly: true
};

document.addEventListener('DOMContentLoaded', () => {
  renderComics();
  setupFilters();

  // Botón Crear
  document.getElementById('createBtn').addEventListener('click', () => {
    if (!Auth.isLogged()) {
      window.location.href = 'pages/login.html?redirect=editor';
    } else {
      window.location.href = 'pages/editor.html';
    }
  });

  // Mostrar/ocultar opciones según sesión
  const dotsRegister = document.getElementById('dotsRegister');
  const dotsDelete   = document.getElementById('dotsDeleteAccount');
  if (Auth.isLogged()) {
    if (dotsRegister) dotsRegister.style.display = 'none';
    if (dotsDelete)   dotsDelete.style.display   = 'block';
  } else {
    if (dotsRegister) dotsRegister.style.display = 'block';
    if (dotsDelete)   dotsDelete.style.display   = 'none';
  }
});

// ── FILTROS ──
function setupFilters() {
  document.querySelectorAll('.home-filter[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.filter;

      if (mode === 'create') return;

      if (mode === 'filter') {
        const value = prompt('Filtrar por autor, estilo o nombre de la obra:', homeState.searchTerm || '');
        if (value === null) return;
        homeState.searchTerm = value.trim();
        homeState.recentOnly = false;
      }

      if (mode === 'recent') {
        homeState.searchTerm = '';
        homeState.recentOnly = true;
      }

      document.querySelectorAll('.home-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderComics();
    });
  });
}

// ── RENDER ──
function renderComics() {
  const grid  = document.getElementById('comicsGrid');
  const empty = document.getElementById('emptyState');
  grid.querySelectorAll('.comic-row').forEach(el => el.remove());

  let comics = [...ComicStore.getPublished()]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

  if (homeState.searchTerm) {
    const needle = homeState.searchTerm.toLowerCase();
    comics = comics.filter(comic => {
      const title = (comic.title || '').toLowerCase();
      const author = (comic.username || '').toLowerCase();
      const style = (comic.style || comic.desc || '').toLowerCase();
      return title.includes(needle) || author.includes(needle) || style.includes(needle);
    });
  }

  if (homeState.recentOnly) comics = comics.slice(0, 20);

  if (comics.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  const currentUser = Auth.currentUser();
  comics.forEach(comic => grid.appendChild(buildRow(comic, currentUser)));
}

// ── CONSTRUIR FILA ──
function buildRow(comic, currentUser) {
  const isOwner    = currentUser && currentUser.id === comic.userId;
  const firstPanel = comic.panels && comic.panels[0];
  const thumbSrc   = firstPanel ? firstPanel.dataUrl : null;

  const row = document.createElement('div');
  row.className = 'comic-row';

  // Miniatura
  const thumb = document.createElement('div');
  thumb.className = 'comic-row-thumb';
  if (thumbSrc) {
    const img = document.createElement('img');
    img.src = thumbSrc;
    img.alt = comic.title || '';
    thumb.appendChild(img);
  } else {
    thumb.textContent = '🖼️';
  }

  // Info
  const info = document.createElement('div');
  info.className = 'comic-row-info';

  const title = document.createElement('div');
  title.className = 'comic-row-title';
  title.textContent = comic.title || 'Sin título';

  const author = document.createElement('div');
  author.className = 'comic-row-author';
  if (comic.contactUrl) {
    author.innerHTML = `${escHtml(comic.username || '')} · <a href="${escHtml(comic.contactUrl)}" target="_blank">Contacto</a>`;
  } else {
    author.textContent = comic.username || '';
  }

  // Botones
  const actions = document.createElement('div');
  actions.className = 'comic-row-actions';

  const readBtn = document.createElement('a');
  readBtn.className = 'comic-row-btn';
  readBtn.href = `pages/reader.html?id=${comic.id}`;
  readBtn.textContent = I18n.t('read');
  actions.appendChild(readBtn);

  if (isOwner) {
    const editBtn = document.createElement('a');
    editBtn.className = 'comic-row-btn edit';
    editBtn.href = `pages/editor.html?id=${comic.id}`;
    editBtn.textContent = I18n.t('edit');
    actions.appendChild(editBtn);

    const unpubBtn = document.createElement('button');
    unpubBtn.className = 'comic-row-btn unpub';
    unpubBtn.textContent = 'Dejar de publicar';
    unpubBtn.addEventListener('click', () => {
      if (confirm('¿Quieres retirar este cómic del índice?\n\nPodrás seguir editándolo desde "Crear" → "Mis cómics".')) {
        comic.published = false;
        ComicStore.save(comic);
        renderComics();
        showToast(I18n.t('comicUnpublished'));
      }
    });
    actions.appendChild(unpubBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'comic-row-btn del';
    delBtn.textContent = 'Eliminar';
    delBtn.addEventListener('click', () => {
      if (confirm('Si eliminas este proyecto, ya no podrás acceder a él.\n\nSi solo quieres que no esté publicado pero quieres seguir editándolo, elige "Dejar de publicar".')) {
        ComicStore.remove(comic.id);
        renderComics();
        showToast('Cómic eliminado');
      }
    });
    actions.appendChild(delBtn);
  }

  info.appendChild(title);
  info.appendChild(author);
  info.appendChild(actions);
  row.appendChild(thumb);
  row.appendChild(info);
  return row;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
