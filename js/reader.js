/* ============================================================
   reader.js — Lector de cómics
   ============================================================ */

const ReaderState = {
  comic:        null,
  currentPanel: 0,
  currentBubbleIdx: -1,  // índice del bocadillo mostrando
  touchStartX:  0,
  touchStartY:  0,
  animating:    false,
};

document.addEventListener('DOMContentLoaded', () => {
  const params  = new URLSearchParams(window.location.search);
  const comicId = params.get('id');

  if (!comicId) { window.location.href = '../index.html'; return; }

  const comic = ComicStore.getById(comicId);
  if (!comic || !comic.panels || comic.panels.length === 0) {
    showToast('Cómic no encontrado');
    setTimeout(() => { window.location.href = '../index.html'; }, 1500);
    return;
  }

  ReaderState.comic = comic;
  buildPanelElements();
  goToPanel(0);
  setupControls();
  showSwipeHint();
  requestOrientationLock(comic.panels[0].orientation);

  I18n.applyAll();
  // Título
  document.getElementById('readerComicTitle').textContent = comic.title || 'Cómic';
});

// ── CONSTRUIR VIÑETAS ──
function buildPanelElements() {
  const stage = document.getElementById('readerStage');
  stage.innerHTML = '';

  ReaderState.comic.panels.forEach((panel, idx) => {
    const div = document.createElement('div');
    div.className = 'reader-panel orient-' + (panel.orientation || 'h');
    div.id = 'rp_' + idx;

    const inner = document.createElement('div');
    inner.className = 'reader-panel-inner';

    const img = document.createElement('img');
    img.className = 'reader-panel-img';
    img.src = panel.dataUrl;
    img.draggable = false;
    inner.appendChild(img);

    // Capa de textos
    const textLayer = document.createElement('div');
    textLayer.className = 'reader-text-layer';
    buildReaderTexts(panel, textLayer);
    inner.appendChild(textLayer);

    div.appendChild(inner);
    stage.appendChild(div);
  });
}

function buildReaderTexts(panel, layer) {
  if (!panel.texts) return;

  // Cabecera/pie (siempre visibles al mostrar la viñeta)
  panel.texts.filter(t => t.type !== 'dialog').forEach(t => {
    const block = document.createElement('div');
    block.className = 'reader-text-block ' + (t.type === 'header' ? 'header' : 'footer');
    block.textContent = t.text;
    layer.appendChild(block);
  });

  // Bocadillos ordenados
  const dialogs = panel.texts
    .filter(t => t.type === 'dialog')
    .sort((a, b) => (a.order||0) - (b.order||0));

  dialogs.forEach((d, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'reader-bubble';
    wrapper.style.left = d.x + '%';
    wrapper.style.top  = d.y + '%';
    wrapper.dataset.bubbleIdx = i;

    wrapper.innerHTML = `
      <div class="reader-bubble-inner">
        <span>${escHtml(d.text)}</span>
        <svg class="reader-tail tail-${d.tail||'bottom'}" viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 0 L14 20 L24 0" fill="white" stroke="black" stroke-width="2.5" stroke-linejoin="round"/>
        </svg>
      </div>
    `;
    layer.appendChild(wrapper);
  });
}

// ── NAVEGAR ──
function goToPanel(idx) {
  if (ReaderState.animating) return;
  const panels = ReaderState.comic.panels;
  if (idx < 0 || idx >= panels.length) return;

  ReaderState.animating = true;
  const prev = ReaderState.currentPanel;

  // Quitar active anterior
  const prevEl = document.getElementById('rp_' + prev);
  if (prevEl) prevEl.classList.remove('active');

  // Activar nuevo
  const nextEl = document.getElementById('rp_' + idx);
  if (nextEl) nextEl.classList.add('active');

  ReaderState.currentPanel = idx;
  ReaderState.currentBubbleIdx = -1;

  // Actualizar info
  document.getElementById('readerPanelNum').textContent = (idx + 1) + ' / ' + panels.length;

  // Iniciar secuencia de bocadillos
  setTimeout(() => {
    ReaderState.animating = false;
    showNextBubble();

    // Orientación automática
    requestOrientationLock(panels[idx].orientation);
  }, 100);
}

function showNextBubble() {
  const panel   = ReaderState.comic.panels[ReaderState.currentPanel];
  const panelEl = document.getElementById('rp_' + ReaderState.currentPanel);
  if (!panelEl) return;

  const dialogs = panelEl.querySelectorAll('.reader-bubble');
  const nextIdx = ReaderState.currentBubbleIdx + 1;

  if (nextIdx < dialogs.length) {
    // Mostrar siguiente bocadillo
    dialogs[nextIdx].classList.add('visible');
    ReaderState.currentBubbleIdx = nextIdx;
    return true; // hay más bocadillos
  }
  return false; // no hay más
}

function advance() {
  // Primero avanzar bocadillos de la viñeta actual
  if (showNextBubble()) return;

  // Luego avanzar viñeta
  const nextIdx = ReaderState.currentPanel + 1;
  if (nextIdx >= ReaderState.comic.panels.length) {
    // Fin del cómic
    document.getElementById('endOverlay').classList.remove('hidden');
    return;
  }
  goToPanel(nextIdx);
}

function goBack() {
  if (ReaderState.currentPanel > 0) {
    goToPanel(ReaderState.currentPanel - 1);
  }
}

// ── CONTROLES ──
function setupControls() {
  // Botones PC
  document.getElementById('nextBtn')?.addEventListener('click', advance);
  document.getElementById('prevBtn')?.addEventListener('click', goBack);
  document.getElementById('restartBtn')?.addEventListener('click', () => {
    document.getElementById('endOverlay').classList.add('hidden');
    goToPanel(0);
  });

  // Teclado
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') advance();
    if (e.key === 'ArrowLeft') goBack();
    if (e.key === 'Escape') { window.location.href = '../index.html'; }
  });

  // Touch / Swipe
  const stage = document.getElementById('readerStage');
  stage.addEventListener('touchstart', (e) => {
    ReaderState.touchStartX = e.touches[0].clientX;
    ReaderState.touchStartY = e.touches[0].clientY;
  }, { passive: true });

  stage.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - ReaderState.touchStartX;
    const dy = e.changedTouches[0].clientY - ReaderState.touchStartY;
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
      // Tap simple: avanzar
      advance();
    } else if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < -40) advance();
      if (dx > 40)  goBack();
    }
  }, { passive: true });

  // Click en stage (PC)
  stage.addEventListener('click', (e) => {
    const w = stage.clientWidth;
    if (e.clientX > w * 0.6) advance();
    else if (e.clientX < w * 0.4) goBack();
  });

  // Zonas táctiles móvil
  addTouchZones();
}

function addTouchZones() {
  ['left','right'].forEach(side => {
    const zone = document.createElement('div');
    zone.className = 'touch-zone ' + side;
    zone.addEventListener('click', side === 'right' ? advance : goBack);
    document.body.appendChild(zone);
  });
}

// ── ORIENTACIÓN AUTOMÁTICA ──
function requestOrientationLock(orient) {
  if (!screen.orientation || !screen.orientation.lock) return;
  const type = orient === 'v' ? 'portrait' : 'landscape';
  screen.orientation.lock(type).catch(() => {}); // puede fallar si no hay permiso
}

// ── SWIPE HINT ──
function showSwipeHint() {
  const hint = document.getElementById('swipeHint');
  if (!hint) return;
  setTimeout(() => { hint.style.opacity = '0'; }, 3000);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
