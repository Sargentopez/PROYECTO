/* ============================================================
   editor.js — Lógica completa del editor de cómics
   ============================================================ */

// ── Estado global del editor ──
const EditorState = {
  comic:          null,   // objeto cómic actual
  activePanelIdx: -1,     // índice de viñeta activa
  pendingTailCb:  null,   // callback cola bocadillo
  draggingPanel:  null,
  draggingBubble: null,
};

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  // Verificar sesión
  if (!Auth.isLogged()) {
    window.location.href = 'login.html?redirect=editor';
    return;
  }
  Auth.updateNavUI();

  const params  = new URLSearchParams(window.location.search);
  const comicId = params.get('id');

  if (comicId) {
    const c = ComicStore.getById(comicId);
    // Solo el autor puede editar
    if (c && c.userId === Auth.currentUser().id) {
      EditorState.comic = c;
      renderSidebarPanels();
      loadProjectForm();
      showProjectForm(true);
    } else {
      showToast('No tienes permiso para editar este cómic');
      setTimeout(() => { window.location.href = '../index.html'; }, 1500);
      return;
    }
  }

  setupEventListeners();
  I18n.applyAll();
});

function setupEventListeners() {
  // Tabs
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Nuevo proyecto
  document.getElementById('newProjectBtn').addEventListener('click', () => {
    const user = Auth.currentUser();
    EditorState.comic = ComicStore.createNew(user.id, user.username);
    showProjectForm(true);
    showUploadSection(true);
  });

  // Guardar
  document.getElementById('saveBtn').addEventListener('click', saveComic);

  // Publicar
  document.getElementById('publishBtn').addEventListener('click', () => {
    saveComic();
    if (EditorState.comic) {
      EditorState.comic.published = true;
      ComicStore.save(EditorState.comic);
      showToast(I18n.t('publishOk'));
    }
  });

  // Subir archivo
  document.getElementById('fileInput').addEventListener('change', handleFileUpload);

  // Orientación de viñeta
  document.getElementById('panelOrientation').addEventListener('change', (e) => {
    if (EditorState.activePanelIdx < 0) return;
    EditorState.comic.panels[EditorState.activePanelIdx].orientation = e.target.value;
    saveComic();
  });

  // Botones de texto
  document.getElementById('addDialogBtn').addEventListener('click', () => addBubble('dialog'));
  document.getElementById('addHeaderBtn').addEventListener('click', () => addTextBlock('header'));
  document.getElementById('addFooterBtn').addEventListener('click', () => addTextBlock('footer'));

  // Modal cola
  document.getElementById('tailModalClose').addEventListener('click', () => {
    document.getElementById('tailModal').classList.remove('open');
    EditorState.pendingTailCb = null;
  });
  document.querySelectorAll('.tail-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const tail = btn.dataset.tail;
      document.getElementById('tailModal').classList.remove('open');
      if (EditorState.pendingTailCb) {
        EditorState.pendingTailCb(tail);
        EditorState.pendingTailCb = null;
      }
    });
  });

  // FAB sidebar móvil
  addSidebarFAB();
}

// ── TABS ──
function switchTab(tabName) {
  document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab' + capitalize(tabName)));

  if (tabName === 'texts') {
    const textLayer = document.getElementById('textLayer');
    if (textLayer) textLayer.classList.add('editable');
    updateTextTools();
  } else {
    const textLayer = document.getElementById('textLayer');
    if (textLayer) textLayer.classList.remove('editable');
  }
}

// ── PROYECTO ──
function showProjectForm(show) {
  document.getElementById('projectForm').classList.toggle('hidden', !show);
}
function showUploadSection(show) {
  const section = document.getElementById('uploadSection');
  if (!show) { section.innerHTML = '<p class="sidebar-hint" data-i18n="noProjectYet">' + I18n.t('noProjectYet') + '</p>'; return; }
  section.innerHTML = `
    <div class="upload-zone" id="uploadZone">
      <div style="font-size:1.8rem;margin-bottom:4px">📁</div>
      <strong>${I18n.t('uploadPanel')}</strong>
      <p style="font-size:.78rem;margin-top:4px;color:var(--gray-500)">JPG, PNG, GIF — arrastrar o click</p>
    </div>
  `;
  document.getElementById('uploadZone').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });
  document.getElementById('uploadZone').addEventListener('dragover', e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--blue)'; });
  document.getElementById('uploadZone').addEventListener('dragleave', e => { e.currentTarget.style.borderColor = ''; });
  document.getElementById('uploadZone').addEventListener('drop', e => {
    e.preventDefault();
    e.currentTarget.style.borderColor = '';
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    processFiles(files);
  });
}
function loadProjectForm() {
  if (!EditorState.comic) return;
  document.getElementById('comicTitleInput').value = EditorState.comic.title || '';
  document.getElementById('comicDescInput').value   = EditorState.comic.desc  || '';
}

// ── GUARDAR ──
function saveComic() {
  if (!EditorState.comic) return;
  EditorState.comic.title = document.getElementById('comicTitleInput').value;
  EditorState.comic.desc  = document.getElementById('comicDescInput').value;
  ComicStore.save(EditorState.comic);
  showToast(I18n.t('saveOk'));
}

// ── UPLOAD ──
function handleFileUpload(e) {
  const files = Array.from(e.target.files);
  processFiles(files);
  e.target.value = '';
}
function processFiles(files) {
  if (!EditorState.comic) { showToast(I18n.t('noProjectYet')); return; }
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const panel = {
        id:          'p_' + Date.now() + '_' + Math.random().toString(36).slice(2),
        dataUrl:     ev.target.result,
        orientation: 'h',
        texts:       []
      };
      EditorState.comic.panels.push(panel);
      renderSidebarPanels();
      selectPanel(EditorState.comic.panels.length - 1);
      saveComic();
    };
    reader.readAsDataURL(file);
  });
}

// ── RENDERIZAR LISTA LATERAL ──
function renderSidebarPanels() {
  const list = document.getElementById('panelsList');
  list.innerHTML = '';
  if (!EditorState.comic || EditorState.comic.panels.length === 0) return;

  EditorState.comic.panels.forEach((panel, idx) => {
    const item = document.createElement('div');
    item.className = 'panel-thumb-item' + (idx === EditorState.activePanelIdx ? ' active' : '');
    item.draggable = true;
    item.dataset.idx = idx;
    item.innerHTML = `
      <span class="drag-handle" title="Arrastrar">⠿</span>
      <img class="panel-thumb-img" src="${panel.dataUrl}" alt="Viñeta ${idx+1}">
      <div class="panel-thumb-info">
        <div class="panel-thumb-num">Viñeta ${idx + 1}</div>
      </div>
      <div class="panel-thumb-actions">
        <button title="Eliminar" data-action="del" style="color:var(--red)">🗑</button>
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="del"]')) {
        deletePanel(idx); return;
      }
      selectPanel(idx);
    });

    // Drag-and-drop para reordenar
    item.addEventListener('dragstart', () => {
      EditorState.draggingPanel = idx;
      item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => item.classList.remove('dragging'));
    item.addEventListener('dragover', (e) => { e.preventDefault(); item.classList.add('drag-over'); });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const from = EditorState.draggingPanel;
      const to   = idx;
      if (from !== null && from !== to) {
        const panels = EditorState.comic.panels;
        const [moved] = panels.splice(from, 1);
        panels.splice(to, 0, moved);
        EditorState.activePanelIdx = to;
        renderSidebarPanels();
        saveComic();
        renderPanelViewer();
      }
    });

    list.appendChild(item);
  });
}

// ── SELECCIONAR VIÑETA ──
function selectPanel(idx) {
  EditorState.activePanelIdx = idx;
  renderSidebarPanels();
  renderPanelViewer();
  updateTextTools();
}

function deletePanel(idx) {
  if (!EditorState.comic) return;
  EditorState.comic.panels.splice(idx, 1);
  if (EditorState.activePanelIdx >= EditorState.comic.panels.length) {
    EditorState.activePanelIdx = EditorState.comic.panels.length - 1;
  }
  renderSidebarPanels();
  renderPanelViewer();
  saveComic();
}

// ── VISOR DE VIÑETA ──
function renderPanelViewer() {
  const placeholder = document.getElementById('canvasPlaceholder');
  const viewer      = document.getElementById('panelViewer');
  const idx = EditorState.activePanelIdx;

  if (!EditorState.comic || idx < 0 || !EditorState.comic.panels[idx]) {
    placeholder.classList.remove('hidden');
    viewer.classList.add('hidden');
    return;
  }

  placeholder.classList.add('hidden');
  viewer.classList.remove('hidden');

  const panel = EditorState.comic.panels[idx];
  document.getElementById('panelImage').src = panel.dataUrl;
  document.getElementById('panelViewerTitle').textContent = `Viñeta ${idx + 1}`;
  document.getElementById('panelOrientation').value = panel.orientation || 'h';

  renderTextLayer();
}

// ── CAPA DE TEXTOS ──
function renderTextLayer() {
  const idx = EditorState.activePanelIdx;
  if (idx < 0) return;
  const panel = EditorState.comic.panels[idx];
  const layer = document.getElementById('textLayer');
  layer.innerHTML = '';

  // Determinar si estamos en modo textos
  const inTextMode = document.getElementById('tabTexts').classList.contains('... ');
  layer.classList.toggle('editable', document.querySelector('.sidebar-tab[data-tab="texts"]')?.classList.contains('active'));

  (panel.texts || []).forEach(textObj => {
    if (textObj.type === 'dialog') {
      renderBubble(textObj, layer, panel);
    } else {
      renderTextBlock(textObj, layer, panel);
    }
  });
}

// ── BOCADILLO ──
function addBubble(type) {
  if (EditorState.activePanelIdx < 0) { showToast('Selecciona una viñeta'); return; }
  // Pedir cola
  EditorState.pendingTailCb = (tail) => {
    const panel = EditorState.comic.panels[EditorState.activePanelIdx];
    const textObj = {
      id:     't_' + Date.now(),
      type:   'dialog',
      text:   I18n.t('writeText'),
      tail,
      x: 30, y: 20, // % del tamaño de la viñeta
      order: (panel.texts || []).filter(t => t.type === 'dialog').length
    };
    if (!panel.texts) panel.texts = [];
    panel.texts.push(textObj);
    renderTextLayer();
    updateDialogOrderList();
    saveComic();
  };
  document.getElementById('tailModal').classList.add('open');
}

function renderBubble(textObj, layer, panel) {
  const wrapper = document.createElement('div');
  wrapper.className = 'bubble-wrapper';
  wrapper.style.left = textObj.x + '%';
  wrapper.style.top  = textObj.y + '%';
  wrapper.dataset.id = textObj.id;

  wrapper.innerHTML = `
    <div class="bubble-inner">
      <span class="bubble-text" contenteditable="false">${escHtml(textObj.text)}</span>
      ${buildTailSVG(textObj.tail)}
    </div>
    <div class="bubble-controls">
      <button class="bubble-ctrl-btn blue" data-action="editText">${I18n.t('editBtn')}</button>
      <button class="bubble-ctrl-btn" data-action="changeTail">↙ Cola</button>
      <button class="bubble-ctrl-btn danger" data-action="del">${I18n.t('deleteBtn')}</button>
    </div>
  `;

  // Drag para mover
  makeDraggable(wrapper, textObj, panel);

  // Botones
  wrapper.querySelector('[data-action="editText"]').addEventListener('click', (e) => {
    e.stopPropagation();
    const span = wrapper.querySelector('.bubble-text');
    const isEditing = span.contentEditable === 'true';
    if (isEditing) {
      textObj.text = span.textContent;
      span.contentEditable = 'false';
      e.target.textContent = I18n.t('editBtn');
      saveComic();
      updateDialogOrderList();
    } else {
      span.contentEditable = 'true';
      span.focus();
      e.target.textContent = I18n.t('save');
    }
  });

  wrapper.querySelector('[data-action="changeTail"]').addEventListener('click', (e) => {
    e.stopPropagation();
    EditorState.pendingTailCb = (tail) => {
      textObj.tail = tail;
      renderTextLayer();
      saveComic();
    };
    document.getElementById('tailModal').classList.add('open');
  });

  wrapper.querySelector('[data-action="del"]').addEventListener('click', (e) => {
    e.stopPropagation();
    panel.texts = panel.texts.filter(t => t.id !== textObj.id);
    renderTextLayer();
    updateDialogOrderList();
    saveComic();
  });

  layer.appendChild(wrapper);
}

function buildTailSVG(tail) {
  const cls = 'bubble-tail tail-' + (tail || 'bottom');
  return `
    <svg class="${cls}" viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 0 L14 20 L24 0" fill="white" stroke="black" stroke-width="2.5" stroke-linejoin="round"/>
    </svg>`;
}

// ── ARRASTRAR BOCADILLO ──
function makeDraggable(wrapper, textObj, panel) {
  let startX, startY, startLeft, startTop;
  const stage = document.getElementById('panelStage');

  wrapper.addEventListener('mousedown', startDrag);
  wrapper.addEventListener('touchstart', startDrag, { passive: false });

  function startDrag(e) {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SPAN' && e.target.contentEditable === 'true') return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = stage.getBoundingClientRect();
    startX    = clientX;
    startY    = clientY;
    startLeft = textObj.x;
    startTop  = textObj.y;

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', endDrag);

    function onDrag(ev) {
      ev.preventDefault();
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const dx = ((cx - startX) / rect.width) * 100;
      const dy = ((cy - startY) / rect.height) * 100;
      textObj.x = Math.max(0, Math.min(80, startLeft + dx));
      textObj.y = Math.max(0, Math.min(90, startTop  + dy));
      wrapper.style.left = textObj.x + '%';
      wrapper.style.top  = textObj.y + '%';
    }
    function endDrag() {
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', endDrag);
      document.removeEventListener('touchmove', onDrag);
      document.removeEventListener('touchend', endDrag);
      saveComic();
    }
  }
}

// ── TEXTO CABECERA / PIE ──
function addTextBlock(type) {
  if (EditorState.activePanelIdx < 0) { showToast('Selecciona una viñeta'); return; }
  const panel = EditorState.comic.panels[EditorState.activePanelIdx];
  // Solo uno de cada tipo
  if ((panel.texts || []).find(t => t.type === type)) return;
  const textObj = { id: 't_' + Date.now(), type, text: I18n.t('writeText') };
  if (!panel.texts) panel.texts = [];
  panel.texts.push(textObj);
  renderTextLayer();
  saveComic();
}

function renderTextBlock(textObj, layer, panel) {
  const block = document.createElement('div');
  block.className = 'panel-text-block ' + (textObj.type === 'header' ? 'header-block' : 'footer-block');
  block.dataset.id = textObj.id;
  block.innerHTML = `
    <button class="block-del" data-action="del" title="${I18n.t('deleteBtn')}">✕</button>
    <span contenteditable="true">${escHtml(textObj.text)}</span>
  `;

  const span = block.querySelector('span');
  span.addEventListener('blur', () => {
    textObj.text = span.textContent;
    saveComic();
  });

  block.querySelector('[data-action="del"]').addEventListener('click', () => {
    panel.texts = panel.texts.filter(t => t.id !== textObj.id);
    renderTextLayer();
    saveComic();
  });

  layer.appendChild(block);
}

// ── ORDEN DE DIÁLOGOS ──
function updateTextTools() {
  const idx = EditorState.activePanelIdx;
  const hint    = document.getElementById('textsHint');
  const tools   = document.getElementById('textTools');

  if (!EditorState.comic || idx < 0) {
    hint && hint.classList.remove('hidden');
    tools && tools.classList.add('hidden');
    return;
  }
  hint && hint.classList.add('hidden');
  tools && tools.classList.remove('hidden');
  updateDialogOrderList();
}

function updateDialogOrderList() {
  const idx = EditorState.activePanelIdx;
  const listEl = document.getElementById('dialogOrderList');
  if (!listEl || !EditorState.comic || idx < 0) return;

  const panel   = EditorState.comic.panels[idx];
  const dialogs = (panel.texts || []).filter(t => t.type === 'dialog');
  dialogs.sort((a, b) => (a.order||0) - (b.order||0));
  listEl.innerHTML = '';

  dialogs.forEach((d, i) => {
    const item = document.createElement('div');
    item.className = 'dialog-order-item';
    item.draggable = true;
    item.dataset.id = d.id;
    item.innerHTML = `
      <div class="order-num">${i+1}</div>
      <div class="order-text">${escHtml(d.text || '...')}</div>
    `;
    let dragSrc = null;
    item.addEventListener('dragstart', () => { dragSrc = i; });
    item.addEventListener('dragover', e => { e.preventDefault(); });
    item.addEventListener('drop', () => {
      if (dragSrc === null || dragSrc === i) return;
      const [moved] = dialogs.splice(dragSrc, 1);
      dialogs.splice(i, 0, moved);
      dialogs.forEach((d, idx) => d.order = idx);
      updateDialogOrderList();
      saveComic();
    });
    listEl.appendChild(item);
  });
}

// ── FAB SIDEBAR MÓVIL ──
function addSidebarFAB() {
  const fab = document.createElement('button');
  fab.className = 'sidebar-open-fab';
  fab.innerHTML = '🗂';
  fab.title = 'Herramientas';
  document.body.appendChild(fab);

  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  const sidebar = document.getElementById('editorSidebar');
  fab.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
}

// ── UTILS ──
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
