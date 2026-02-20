/* ============================================================
   editor.js — Editor con menús desplegables
   ============================================================ */

const EditorState = {
  comic:          null,
  activePanelIdx: -1,
  pendingTailCb:  null,
  draggingPanel:  null,
};

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isLogged()) {
    window.location.href = 'login.html?redirect=editor';
    return;
  }
  Auth.updateNavUI();

  const params  = new URLSearchParams(window.location.search);
  const comicId = params.get('id');

  if (comicId) {
    const c = ComicStore.getById(comicId);
    if (c && c.userId === Auth.currentUser().id) {
      EditorState.comic = c;
      loadProjectForm();
      showProjectFormSection(true);
      showUploadSection(true);
      renderPanelsList();
      if (c.panels.length > 0) selectPanel(0);
    } else {
      showToast('No tienes permiso para editar este cómic');
      setTimeout(() => { window.location.href = '../index.html'; }, 1500);
      return;
    }
  }

  setupDropdowns();
  setupEventListeners();
  I18n.applyAll();
});

// ── MENÚS DESPLEGABLES ──
function setupDropdowns() {
  const menus = [
    { btnId: 'btnMenuProyecto', panelId: 'panelProyecto' },
    { btnId: 'btnMenuVinetas',  panelId: 'panelVinetas'  },
    { btnId: 'btnMenuTextos',   panelId: 'panelTextos'   },
  ];

  menus.forEach(({ btnId, panelId }) => {
    const btn   = document.getElementById(btnId);
    const panel = document.getElementById(panelId);
    if (!btn || !panel) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = panel.classList.contains('open');
      // Cerrar todos
      menus.forEach(m => {
        document.getElementById(m.panelId)?.classList.remove('open');
        document.getElementById(m.btnId)?.classList.remove('open');
      });
      // Abrir el pulsado si estaba cerrado
      if (!isOpen) {
        panel.classList.add('open');
        btn.classList.add('open');
        // Activar capa de texto si es menú textos
        const textLayer = document.getElementById('textLayer');
        if (panelId === 'panelTextos' && textLayer) {
          textLayer.classList.add('editable');
        } else if (textLayer) {
          textLayer.classList.remove('editable');
        }
      }
    });
  });

  // Cerrar al pulsar fuera
  document.addEventListener('click', () => {
    menus.forEach(m => {
      document.getElementById(m.panelId)?.classList.remove('open');
      document.getElementById(m.btnId)?.classList.remove('open');
    });
  });

  // Evitar cierre al hacer clic dentro del panel
  document.querySelectorAll('.editor-dropdown-panel').forEach(panel => {
    panel.addEventListener('click', e => e.stopPropagation());
  });
}

// ── EVENT LISTENERS ──
function setupEventListeners() {
  // Nuevo proyecto
  document.getElementById('newProjectBtn').addEventListener('click', () => {
    const user = Auth.currentUser();
    EditorState.comic = ComicStore.createNew(user.id, user.username);
    showProjectFormSection(true);
    showUploadSection(true);
    loadProjectForm();
  });

  // Guardar y publicar
  document.getElementById('saveBtn').addEventListener('click', saveComic);
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

  // Orientación
  document.getElementById('panelOrientation').addEventListener('change', (e) => {
    if (EditorState.activePanelIdx < 0) return;
    EditorState.comic.panels[EditorState.activePanelIdx].orientation = e.target.value;
    saveComic();
  });

  // Botones de texto
  document.getElementById('addDialogBtn').addEventListener('click', () => addBubble());
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
}

// ── PROYECTO ──
function showProjectFormSection(show) {
  const s = document.getElementById('projectFormSection');
  if (s) s.style.display = show ? 'block' : 'none';
}

function loadProjectForm() {
  if (!EditorState.comic) return;
  document.getElementById('comicTitleInput').value = EditorState.comic.title || '';
  document.getElementById('comicDescInput').value  = EditorState.comic.desc  || '';
}

function showUploadSection(show) {
  const section = document.getElementById('uploadSection');
  const hint    = document.getElementById('uploadHint');
  if (!show) { if (hint) hint.style.display = 'block'; return; }
  if (hint) hint.style.display = 'none';

  // Evitar duplicar la zona de subida
  if (document.getElementById('uploadZone')) return;

  const zone = document.createElement('div');
  zone.className = 'upload-zone';
  zone.id = 'uploadZone';
  zone.innerHTML = `
    <div style="font-size:1.8rem;margin-bottom:4px">📁</div>
    <strong>Subir viñeta</strong>
    <p style="font-size:.78rem;margin-top:4px;color:var(--gray-500)">JPG, PNG, GIF</p>
  `;
  zone.addEventListener('click', () => document.getElementById('fileInput').click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = 'var(--blue)'; });
  zone.addEventListener('dragleave', () => zone.style.borderColor = '');
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.style.borderColor = '';
    processFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
  });
  section.appendChild(zone);

  // Mostrar selector de orientación
  const orientSection = document.getElementById('orientationSection');
  if (orientSection) orientSection.style.display = 'block';
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
  processFiles(Array.from(e.target.files));
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
      renderPanelsList();
      selectPanel(EditorState.comic.panels.length - 1);
      saveComic();
    };
    reader.readAsDataURL(file);
  });
}

// ── LISTA DE VIÑETAS ──
function renderPanelsList() {
  const list = document.getElementById('panelsList');
  list.innerHTML = '';
  if (!EditorState.comic || EditorState.comic.panels.length === 0) return;

  EditorState.comic.panels.forEach((panel, idx) => {
    const item = document.createElement('div');
    item.className = 'panel-thumb-item' + (idx === EditorState.activePanelIdx ? ' active' : '');
    item.draggable = true;
    item.innerHTML = `
      <span class="drag-handle">⠿</span>
      <img class="panel-thumb-img" src="${panel.dataUrl}" alt="Viñeta ${idx+1}">
      <div class="panel-thumb-info">
        <div class="panel-thumb-num">Viñeta ${idx + 1}</div>
      </div>
      <div class="panel-thumb-actions">
        <button data-action="del" style="color:var(--red)" title="Eliminar">🗑</button>
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="del"]')) { deletePanel(idx); return; }
      selectPanel(idx);
      // Cerrar menú al seleccionar viñeta en móvil
      document.getElementById('panelVinetas')?.classList.remove('open');
      document.getElementById('btnMenuVinetas')?.classList.remove('open');
    });

    item.addEventListener('dragstart', () => { EditorState.draggingPanel = idx; item.classList.add('dragging'); });
    item.addEventListener('dragend',   () => item.classList.remove('dragging'));
    item.addEventListener('dragover',  (e) => { e.preventDefault(); item.classList.add('drag-over'); });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const from = EditorState.draggingPanel;
      const to   = idx;
      if (from !== null && from !== to) {
        const [moved] = EditorState.comic.panels.splice(from, 1);
        EditorState.comic.panels.splice(to, 0, moved);
        EditorState.activePanelIdx = to;
        renderPanelsList();
        renderPanelViewer();
        saveComic();
      }
    });

    list.appendChild(item);
  });
}

// ── SELECCIONAR VIÑETA ──
function selectPanel(idx) {
  EditorState.activePanelIdx = idx;
  renderPanelsList();
  renderPanelViewer();
  updateTextTools();
  // Actualizar selector de orientación
  const panel = EditorState.comic.panels[idx];
  if (panel) document.getElementById('panelOrientation').value = panel.orientation || 'h';
}

function deletePanel(idx) {
  if (!EditorState.comic) return;
  EditorState.comic.panels.splice(idx, 1);
  if (EditorState.activePanelIdx >= EditorState.comic.panels.length) {
    EditorState.activePanelIdx = EditorState.comic.panels.length - 1;
  }
  renderPanelsList();
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

  renderTextLayer();
}

// ── CAPA DE TEXTOS ──
function renderTextLayer() {
  const idx = EditorState.activePanelIdx;
  if (idx < 0 || !EditorState.comic) return;
  const panel = EditorState.comic.panels[idx];
  const layer = document.getElementById('textLayer');
  layer.innerHTML = '';

  (panel.texts || []).forEach(textObj => {
    if (textObj.type === 'dialog') renderBubble(textObj, layer, panel);
    else renderTextBlock(textObj, layer, panel);
  });
}

// ── BOCADILLO ──
function addBubble() {
  if (EditorState.activePanelIdx < 0) { showToast('Selecciona una viñeta primero'); return; }
  EditorState.pendingTailCb = (tail) => {
    const panel = EditorState.comic.panels[EditorState.activePanelIdx];
    if (!panel.texts) panel.texts = [];
    panel.texts.push({
      id:    't_' + Date.now(),
      type:  'dialog',
      text:  I18n.t('writeText'),
      tail,
      x: 10, y: 10,
      order: panel.texts.filter(t => t.type === 'dialog').length
    });
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

  makeDraggable(wrapper, textObj, panel);

  wrapper.querySelector('[data-action="editText"]').addEventListener('click', (e) => {
    e.stopPropagation();
    const span = wrapper.querySelector('.bubble-text');
    if (span.contentEditable === 'true') {
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
  // La punta del triángulo (vértice inferior) apunta siempre HACIA FUERA del bocadillo
  const cls = 'bubble-tail tail-' + (tail || 'bottom');
  return `<svg class="${cls}" viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 0 L14 20 L24 0" fill="white" stroke="black" stroke-width="2.5" stroke-linejoin="round"/>
  </svg>`;
}

function makeDraggable(wrapper, textObj, panel) {
  let startX, startY, startLeft, startTop;

  function startDrag(e) {
    if (e.target.tagName === 'BUTTON' || (e.target.contentEditable === 'true')) return;
    e.preventDefault();
    const stage = document.getElementById('panelStage');
    const rect  = stage.getBoundingClientRect();
    startX    = e.touches ? e.touches[0].clientX : e.clientX;
    startY    = e.touches ? e.touches[0].clientY : e.clientY;
    startLeft = textObj.x;
    startTop  = textObj.y;

    function onDrag(ev) {
      ev.preventDefault();
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      textObj.x = Math.max(0, Math.min(80, startLeft + ((cx - startX) / rect.width)  * 100));
      textObj.y = Math.max(0, Math.min(90, startTop  + ((cy - startY) / rect.height) * 100));
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
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
  }

  wrapper.addEventListener('mousedown', startDrag);
  wrapper.addEventListener('touchstart', startDrag, { passive: false });
}

// ── TEXTO CABECERA / PIE ──
function addTextBlock(type) {
  if (EditorState.activePanelIdx < 0) { showToast('Selecciona una viñeta primero'); return; }
  const panel = EditorState.comic.panels[EditorState.activePanelIdx];
  if (!panel.texts) panel.texts = [];
  if (panel.texts.find(t => t.type === type)) { showToast('Ya existe un ' + type + ' en esta viñeta'); return; }
  panel.texts.push({ id: 't_' + Date.now(), type, text: I18n.t('writeText') });
  renderTextLayer();
  saveComic();
}

function renderTextBlock(textObj, layer, panel) {
  const block = document.createElement('div');
  block.className = 'panel-text-block ' + (textObj.type === 'header' ? 'header-block' : 'footer-block');
  block.innerHTML = `
    <button class="block-del" title="Eliminar">✕</button>
    <span contenteditable="true">${escHtml(textObj.text)}</span>
  `;
  block.querySelector('span').addEventListener('blur', (e) => { textObj.text = e.target.textContent; saveComic(); });
  block.querySelector('.block-del').addEventListener('click', () => {
    panel.texts = panel.texts.filter(t => t.id !== textObj.id);
    renderTextLayer();
    saveComic();
  });
  layer.appendChild(block);
}

// ── HERRAMIENTAS DE TEXTO ──
function updateTextTools() {
  const idx   = EditorState.activePanelIdx;
  const hint  = document.getElementById('textsHint');
  const tools = document.getElementById('textTools');
  const hasPanel = EditorState.comic && idx >= 0;
  if (hint)  hint.style.display  = hasPanel ? 'none'  : 'block';
  if (tools) tools.style.display = hasPanel ? 'block' : 'none';
  if (hasPanel) updateDialogOrderList();
}

function updateDialogOrderList() {
  const idx    = EditorState.activePanelIdx;
  const listEl = document.getElementById('dialogOrderList');
  if (!listEl || !EditorState.comic || idx < 0) return;

  const panel   = EditorState.comic.panels[idx];
  const dialogs = (panel.texts || []).filter(t => t.type === 'dialog').sort((a,b) => (a.order||0)-(b.order||0));
  listEl.innerHTML = '';

  dialogs.forEach((d, i) => {
    const item = document.createElement('div');
    item.className = 'dialog-order-item';
    item.draggable = true;
    item.innerHTML = `<div class="order-num">${i+1}</div><div class="order-text">${escHtml(d.text||'...')}</div>`;
    let dragSrc = null;
    item.addEventListener('dragstart', () => { dragSrc = i; });
    item.addEventListener('dragover',  e => e.preventDefault());
    item.addEventListener('drop', () => {
      if (dragSrc === null || dragSrc === i) return;
      const [moved] = dialogs.splice(dragSrc, 1);
      dialogs.splice(i, 0, moved);
      dialogs.forEach((d, j) => d.order = j);
      updateDialogOrderList();
      saveComic();
    });
    listEl.appendChild(item);
  });
}

// ── UTILS ──
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
