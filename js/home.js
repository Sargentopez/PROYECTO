/* ============================================================
   home.js — Lógica de la página de inicio
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  Auth.updateNavUI();
  Auth.setupDropdowns(); // registrar listeners tras mostrar navLogged
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
    if (btn.id === 'createBtn') return;
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
  readBtn.textContent = 'Leer';
  actions.appendChild(readBtn);

  if (isOwner) {
    // Editar
    const editBtn = document.createElement('a');
    editBtn.className = 'comic-row-btn edit';
    editBtn.href = `pages/editor.html?id=${comic.id}`;
    editBtn.textContent = 'Editar';
    actions.appendChild(editBtn);

    // Dejar de publicar
    const unpubBtn = document.createElement('button');
    unpubBtn.className = 'comic-row-btn unpub';
    unpubBtn.textContent = 'Dejar de publicar';
    unpubBtn.addEventListener('click', () => {
      if (confirm('¿Quieres retirar este cómic del índice?\n\nPodrás seguir editándolo desde "Crear" → "Mis cómics".')) {
        comic.published = false;
        ComicStore.save(comic);
        renderComics(document.querySelector('.home-filter.active')?.dataset.filter || 'all');
        showToast('Cómic retirado del índice');
      }
    });
    actions.appendChild(unpubBtn);

    // Eliminar
    const delBtn = document.createElement('button');
    delBtn.className = 'comic-row-btn del';
    delBtn.textContent = 'Eliminar';
    delBtn.addEventListener('click', () => {
      if (confirm('Si eliminas este proyecto, ya no podrás acceder a él.\n\nSi solo quieres que no esté publicado pero quieres seguir editándolo, elige "Dejar de publicar".')) {
        ComicStore.remove(comic.id);
        renderComics(document.querySelector('.home-filter.active')?.dataset.filter || 'all');
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
