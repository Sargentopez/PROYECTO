/* ============================================================
   home.js — Lógica de la página de inicio
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  Auth.updateNavUI();
  renderComics('all');
  setupFilters();

  // Botón Crear
  document.getElementById('createBtn').addEventListener('click', () => {
    if (!Auth.isLogged()) {
      window.location.href = 'pages/login.html?redirect=editor';
    } else {
      window.location.href = 'pages/editor.html';
    }
  });

  // Botón 3 puntos (futuro)
  document.getElementById('dotsBtn').addEventListener('click', () => {
    showToast('Próximamente');
  });
});

// ── FILTROS ──
function setupFilters() {
  document.querySelectorAll('.home-filter[data-filter]').forEach(btn => {
    if (btn.id === 'createBtn') return; // ya tiene su propio listener
    btn.addEventListener('click', () => {
      document.querySelectorAll('.home-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderComics(btn.dataset.filter);
    });
  });
}

// ── RENDER ──
function renderComics(filter = 'all') {
  const grid  = document.getElementById('comicsGrid');
  const empty = document.getElementById('emptyState');

  // Limpiar filas anteriores (no el empty)
  grid.querySelectorAll('.comic-row').forEach(el => el.remove());

  let comics = ComicStore.getPublished();

  if (filter === 'recent') {
    comics = [...comics]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 20);
  }

  if (comics.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  const currentUser = Auth.currentUser();
  comics.forEach(comic => {
    grid.appendChild(buildRow(comic, currentUser));
  });
}

// ── CONSTRUIR FILA ──
function buildRow(comic, currentUser) {
  const isOwner   = currentUser && currentUser.id === comic.userId;
  const firstPanel = comic.panels && comic.panels[0];
  const thumbSrc   = firstPanel ? firstPanel.dataUrl : null;

  const row = document.createElement('div');
  row.className = 'comic-row';

  // Miniatura cuadrada
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

  // Título
  const title = document.createElement('div');
  title.className = 'comic-row-title';
  title.textContent = comic.title || 'Sin título';

  // Autor + contacto
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
  readBtn.textContent = 'Leer';

  actions.appendChild(readBtn);

  if (isOwner) {
    const editBtn = document.createElement('a');
    editBtn.className = 'comic-row-btn edit';
    editBtn.href = `pages/editor.html?id=${comic.id}`;
    editBtn.textContent = 'Editar';
    actions.appendChild(editBtn);
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
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
