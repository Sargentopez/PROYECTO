/* ============================================================
   home.js — Lógica de la página de inicio
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Redirigir "Crea tu cómic" a editor (con o sin sesión)
  const createBtn = document.getElementById('createBtn');
  if (createBtn) {
    createBtn.addEventListener('click', (e) => {
      if (!Auth.isLogged()) {
        e.preventDefault();
        window.location.href = 'pages/login.html?redirect=editor';
      }
    });
  }

  renderComics();
  setupFilters();
});

function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderComics(btn.dataset.filter);
    });
  });
}

function renderComics(filter = 'all') {
  const grid   = document.getElementById('comicsGrid');
  const empty  = document.getElementById('emptyState');
  if (!grid) return;

  let comics = ComicStore.getPublished();

  if (filter === 'recent') {
    comics = [...comics].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 12);
  }

  // Eliminar tarjetas anteriores (no el empty state)
  grid.querySelectorAll('.comic-card').forEach(el => el.remove());

  if (comics.length === 0) {
    empty && empty.classList.remove('hidden');
    return;
  }
  empty && empty.classList.add('hidden');

  const currentUser = Auth.currentUser();

  comics.forEach(comic => {
    const card = buildCard(comic, currentUser);
    grid.appendChild(card);
  });
}

function buildCard(comic, currentUser) {
  const isOwner = currentUser && currentUser.id === comic.userId;
  const firstPanel = comic.panels && comic.panels[0];
  const thumbSrc   = firstPanel ? firstPanel.dataUrl : null;

  const card = document.createElement('div');
  card.className = 'comic-card';
  card.innerHTML = `
    <div class="comic-card-thumb">
      ${thumbSrc
        ? `<img src="${thumbSrc}" alt="${escHtml(comic.title)}">`
        : `<span>🖼️</span>`}
    </div>
    <div class="comic-card-body">
      <div class="comic-card-title">${escHtml(comic.title || 'Sin título')}</div>
      <div class="comic-card-author">
        <span data-i18n="by"></span> <span>${escHtml(comic.username || '')}</span>
      </div>
      ${comic.desc ? `<div class="comic-card-desc">${escHtml(comic.desc)}</div>` : ''}
    </div>
    <div class="comic-card-actions">
      <a href="pages/reader.html?id=${comic.id}" class="btn btn-primary" data-i18n="read">${I18n.t('read')}</a>
      ${isOwner ? `<a href="pages/editor.html?id=${comic.id}" class="btn btn-outline" data-i18n="edit">${I18n.t('edit')}</a>` : ''}
    </div>
  `;
  return card;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
