/* ============================================================
<<<<<<< HEAD
   editor.js — Editor completo con menús desplegables
=======
   editor.js — Editor con menús desplegables
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
   ============================================================ */

const EditorState = {
  comic:          null,
  activePanelIdx: -1,
<<<<<<< HEAD
=======
  pendingTailCb:  null,
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
  draggingPanel:  null,
};

// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isLogged()) {
    window.location.href = 'login.html?redirect=editor';
    return;
  }
  Auth.updateNavUI();

  // ¿Viene con ID de cómic para editar?
  const params  = new URLSearchParams(window.location.search);
  const comicId = params.get('id');
  if (comicId) {
    const c = ComicStore.getById(comicId);
    if (c && c.userId === Auth.currentUser().id) {
<<<<<<< HEAD
      openComic(c);
=======
      EditorState.comic = c;
      loadProjectForm();
      showProjectFormSection(true);
      showUploadSection(true);
      renderPanelsList();
      if (c.panels.length > 0) selectPanel(0);
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
    } else {
      showToast('No tienes permiso para editar este cómic');
      setTimeout(() => { window.location.href = '../index.html'; }, 1500);
      return;
    }
  } else {
    renderProjectsScreen();
  }

  setupDropdowns();
<<<<<<< HEAD
  setupGlobalListeners();
  I18n.applyAll();
});

// ════════════════════════════════════════
// PANTALLA DE PROYECTOS
// ════════════════════════════════════════
function renderProjectsScreen() {
  showScreen('projects');
  const user = Auth.currentUser();
  const grid = document.getElementById('projectsGrid');
  const comics = ComicStore.getByUser(user.id);
  grid.innerHTML = '';

  if (comics.length === 0) {
    grid.innerHTML = `<div class="projects-empty"><span>📚</span><p>Aún no tienes ningún cómic.<br>¡Crea el primero!</p></div>`;
    return;
  }

  comics.forEach(comic => {
    const thumb = comic.panels && comic.panels[0] ? comic.panels[0].dataUrl : null;
    const panelCount = comic.panels ? comic.panels.length : 0;
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <div class="project-card-thumb">
        ${thumb ? `<img src="${thumb}" alt="${escHtml(comic.title)}">` : '📖'}
      </div>
      <div class="project-card-body">
        <div class="project-card-title">${escHtml(comic.title || 'Sin título')}</div>
        <div class="project-card-meta">${panelCount} viñeta${panelCount !== 1 ? 's' : ''} · ${comic.published ? '✅ Publicado' : '📝 Borrador'}</div>
      </div>
      <div class="project-card-actions">
        <button class="btn btn-primary" data-action="edit">✏️ Editar</button>
        <button class="btn btn-outline" data-action="delete" style="color:var(--red)">🗑</button>
      </div>
    `;
    card.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
      e.stopPropagation();
      openComic(comic);
    });
    card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('¿Eliminar este cómic?')) {
        ComicStore.remove(comic.id);
        renderProjectsScreen();
      }
    });
    card.addEventListener('click', () => openComic(comic));
    grid.appendChild(card);
  });
}

function openComic(comic) {
  EditorState.comic = comic;
  showScreen('editor');
  // Mostrar menús y acciones
  document.getElementById('editorMenus').style.display = 'flex';
  document.getElementById('editorActions').style.display = 'flex';
  // Activar zona de subida
  setupUploadZone();
  document.getElementById('orientationSection').style.display = 'block';
  renderPanelsList();
  // Si hay viñetas, mostrar la primera
  if (comic.panels && comic.panels.length > 0) {
    selectPanel(0);
  }
}

// ════════════════════════════════════════
// MENÚS DESPLEGABLES
// ════════════════════════════════════════
function setupDropdowns() {
  document.querySelectorAll('.editor-menu-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menuId = btn.dataset.menu;
      const panel  = document.getElementById(menuId);
      const isOpen = panel.classList.contains('open');
      closeAllDropdowns();
=======
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
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
      if (!isOpen) {
        panel.classList.add('open');
        btn.classList.add('open');
        // Activar capa de texto si es menú textos
        const textLayer = document.getElementById('textLayer');
<<<<<<< HEAD
        if (textLayer) textLayer.classList.toggle('editable', menuId === 'menuTextos');
=======
        if (panelId === 'panelTextos' && textLayer) {
          textLayer.classList.add('editable');
        } else if (textLayer) {
          textLayer.classList.remove('editable');
        }
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
      }
    });
  });

<<<<<<< HEAD
  document.addEventListener('click', closeAllDropdowns);
  document.querySelectorAll('.editor-dropdown-panel').forEach(p => {
    p.addEventListener('click', e => e.stopPropagation());
  });
}

function closeAllDropdowns() {
  document.querySelectorAll('.editor-dropdown-panel').forEach(p => p.classList.remove('open'));
  document.querySelectorAll('.editor-menu-btn').forEach(b => b.classList.remove('open'));
}

// ════════════════════════════════════════
// EVENT LISTENERS GLOBALES
// ════════════════════════════════════════
function setupGlobalListeners() {
  // Nuevo proyecto
  document.getElementById('newProjectBtn').addEventListener('click', () => {
    document.getElementById('comicTitleInput').value = '';
    document.getElementById('comicDescInput').value  = '';
    document.getElementById('projectModal').classList.add('open');
  });

  document.getElementById('projectModalClose').addEventListener('click', () => {
    document.getElementById('projectModal').classList.remove('open');
  });

  document.getElementById('projectModalSave').addEventListener('click', () => {
    const title = document.getElementById('comicTitleInput').value.trim();
    if (!title) { showToast('Escribe un título'); return; }
    const user  = Auth.currentUser();
    const comic = ComicStore.createNew(user.id, user.username);
    comic.title = title;
    comic.desc  = document.getElementById('comicDescInput').value.trim();
    ComicStore.save(comic);
    document.getElementById('projectModal').classList.remove('open');
    openComic(ComicStore.getById(comic.id));
  });

=======
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

>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
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

<<<<<<< HEAD
=======
  // Subir archivo
  document.getElementById('fileInput').addEventListener('change', handleFileUpload);

>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
  // Orientación
  document.getElementById('panelOrientation').addEventListener('change', (e) => {
    if (EditorState.activePanelIdx < 0) return;
    const orient = e.target.value;
    EditorState.comic.panels[EditorState.activePanelIdx].orientation = orient;
    // Refrescar clase del canvas
    const stage = document.getElementById('panelStage');
    stage.classList.remove('orient-h', 'orient-v');
    stage.classList.add('orient-' + orient);
    saveComic();
  });

  // Botones de texto
<<<<<<< HEAD
  document.getElementById('addDialogBtn').addEventListener('click', () => { closeAllDropdowns(); addBubble(); });
  document.getElementById('addHeaderBtn').addEventListener('click', () => { closeAllDropdowns(); addTextBlock('header'); });
  document.getElementById('addFooterBtn').addEventListener('click', () => { closeAllDropdowns(); addTextBlock('footer'); });
=======
  document.getElementById('addDialogBtn').addEventListener('click', () => addBubble());
  document.getElementById('addHeaderBtn').addEventListener('click', () => addTextBlock('header'));
  document.getElementById('addFooterBtn').addEventListener('click', () => addTextBlock('footer'));
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef

  // Subida de archivo
  document.getElementById('fileInput').addEventListener('change', handleFileUpload);

  // Modal cola (legacy, por si se usa)
  document.getElementById('tailModalClose').addEventListener('click', () => {
    document.getElementById('tailModal').classList.remove('open');
<<<<<<< HEAD
  });
}
=======
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
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef

// ════════════════════════════════════════
// GUARDAR
// ════════════════════════════════════════
function saveComic() {
  if (!EditorState.comic) return;
  ComicStore.save(EditorState.comic);
  showToast(I18n.t('saveOk'));
}

// ════════════════════════════════════════
// UPLOAD
// ════════════════════════════════════════
function setupUploadZone() {
  const section = document.getElementById('uploadSection');
  if (document.getElementById('uploadZone')) return; // ya existe
  section.innerHTML = '';

  const zone = document.createElement('div');
  zone.className = 'upload-zone';
  zone.id = 'uploadZone';
  zone.innerHTML = `<div style="font-size:1.8rem;margin-bottom:4px">📁</div><strong>Subir viñeta</strong><p style="font-size:.82rem;margin-top:4px;color:var(--gray-500)">JPG, PNG, GIF — click o arrastrar</p>`;
  zone.addEventListener('click', () => document.getElementById('fileInput').click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor='var(--blue)'; });
  zone.addEventListener('dragleave', () => zone.style.borderColor='');
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.style.borderColor='';
    processFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
  });
  section.appendChild(zone);
}

function handleFileUpload(e) {
  processFiles(Array.from(e.target.files));
  e.target.value = '';
}

function processFiles(files) {
  if (!EditorState.comic) { showToast(I18n.t('noProjectYet')); return; }
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      // Detectar orientación automáticamente según dimensiones reales de la imagen
      const img = new Image();
      img.onload = () => {
        const orientation = img.naturalWidth >= img.naturalHeight ? 'h' : 'v';
        EditorState.comic.panels.push({
          id: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2),
          dataUrl,
          orientation,
          texts: []
        });
        renderPanelsList();
        selectPanel(EditorState.comic.panels.length - 1);
        saveComic();
      };
<<<<<<< HEAD
      img.src = dataUrl;
=======
      EditorState.comic.panels.push(panel);
      renderPanelsList();
      selectPanel(EditorState.comic.panels.length - 1);
      saveComic();
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
    };
    reader.readAsDataURL(file);
  });
}

<<<<<<< HEAD
// ════════════════════════════════════════
// LISTA DE VIÑETAS
// ════════════════════════════════════════
=======
// ── LISTA DE VIÑETAS ──
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
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
<<<<<<< HEAD
      <img class="panel-thumb-img" src="${panel.dataUrl}" alt="">
      <div class="panel-thumb-info"><div class="panel-thumb-num">Viñeta ${idx+1}</div></div>
=======
      <img class="panel-thumb-img" src="${panel.dataUrl}" alt="Viñeta ${idx+1}">
      <div class="panel-thumb-info">
        <div class="panel-thumb-num">Viñeta ${idx + 1}</div>
      </div>
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
      <div class="panel-thumb-actions">
        <button data-action="del" style="color:var(--red)" title="Eliminar">🗑</button>
      </div>
    `;
    item.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="del"]')) { deletePanel(idx); return; }
      selectPanel(idx);
<<<<<<< HEAD
      closeAllDropdowns();
    });
    item.addEventListener('dragstart', () => { EditorState.draggingPanel = idx; item.classList.add('dragging'); });
    item.addEventListener('dragend',   () => item.classList.remove('dragging'));
    item.addEventListener('dragover',  e => { e.preventDefault(); item.classList.add('drag-over'); });
=======
      // Cerrar menú al seleccionar viñeta en móvil
      document.getElementById('panelVinetas')?.classList.remove('open');
      document.getElementById('btnMenuVinetas')?.classList.remove('open');
    });

    item.addEventListener('dragstart', () => { EditorState.draggingPanel = idx; item.classList.add('dragging'); });
    item.addEventListener('dragend',   () => item.classList.remove('dragging'));
    item.addEventListener('dragover',  (e) => { e.preventDefault(); item.classList.add('drag-over'); });
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', e => {
      e.preventDefault(); item.classList.remove('drag-over');
      const from = EditorState.draggingPanel, to = idx;
      if (from !== null && from !== to) {
        const [moved] = EditorState.comic.panels.splice(from, 1);
        EditorState.comic.panels.splice(to, 0, moved);
        EditorState.activePanelIdx = to;
<<<<<<< HEAD
        renderPanelsList(); renderPanelViewer(); saveComic();
=======
        renderPanelsList();
        renderPanelViewer();
        saveComic();
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
      }
    });
    list.appendChild(item);
  });
}

// ════════════════════════════════════════
// SELECCIONAR / ELIMINAR VIÑETA
// ════════════════════════════════════════
function selectPanel(idx) {
  EditorState.activePanelIdx = idx;
  renderPanelsList();
  renderPanelViewer();
  updateTextTools();
<<<<<<< HEAD
=======
  // Actualizar selector de orientación
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
  const panel = EditorState.comic.panels[idx];
  if (panel) document.getElementById('panelOrientation').value = panel.orientation || 'h';
}

function deletePanel(idx) {
  EditorState.comic.panels.splice(idx, 1);
<<<<<<< HEAD
  EditorState.activePanelIdx = Math.min(EditorState.activePanelIdx, EditorState.comic.panels.length - 1);
  renderPanelsList(); renderPanelViewer(); saveComic();
=======
  if (EditorState.activePanelIdx >= EditorState.comic.panels.length) {
    EditorState.activePanelIdx = EditorState.comic.panels.length - 1;
  }
  renderPanelsList();
  renderPanelViewer();
  saveComic();
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
}

// ════════════════════════════════════════
// VISOR DE VIÑETA
// ════════════════════════════════════════
function renderPanelViewer() {
  const placeholder = document.getElementById('canvasPlaceholder');
  const viewer      = document.getElementById('panelViewer');
  const stage       = document.getElementById('panelStage');
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
<<<<<<< HEAD
  document.getElementById('panelNumBar').textContent = `Viñeta ${idx+1} de ${EditorState.comic.panels.length}`;

  // Canvas con proporción fija según orientación: 20:9 horizontal / 9:20 vertical
  stage.classList.remove('orient-h', 'orient-v');
  stage.classList.add('orient-' + (panel.orientation || 'h'));
=======
  document.getElementById('panelViewerTitle').textContent = `Viñeta ${idx + 1}`;
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef

  renderTextLayer();
}

// ════════════════════════════════════════
// CAPA DE TEXTOS
// ════════════════════════════════════════
function renderTextLayer() {
  const idx = EditorState.activePanelIdx;
  if (idx < 0 || !EditorState.comic) return;
  const panel = EditorState.comic.panels[idx];
  const layer = document.getElementById('textLayer');
  layer.innerHTML = '';
<<<<<<< HEAD
  (panel.texts || []).forEach(t => {
    if (t.type === 'dialog') renderBubble(t, layer, panel);
    else renderTextBlock(t, layer, panel);
  });
}

// ════════════════════════════════════════
// BOCADILLO
// ════════════════════════════════════════
function addBubble() {
  if (EditorState.activePanelIdx < 0) { showToast('Selecciona una viñeta primero'); return; }
  const panel = EditorState.comic.panels[EditorState.activePanelIdx];
  if (!panel.texts) panel.texts = [];
  const textObj = {
    id: 't_' + Date.now(), type: 'dialog', text: '',
    tail: 'bottom', x: 30, y: 20,
    order: panel.texts.filter(t => t.type === 'dialog').length
=======

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
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
  };
  panel.texts.push(textObj);
  renderTextLayer();
  updateDialogOrderList();
  saveComic();
  // Activar modo edición en el nuevo bocadillo
  setTimeout(() => {
    const wrapper = document.querySelector(`.bubble-wrapper[data-id="${textObj.id}"]`);
    if (wrapper) enterEditMode(wrapper, textObj, panel);
  }, 50);
}

function renderBubble(textObj, layer, panel) {
  const wrapper = document.createElement('div');
  wrapper.className = 'bubble-wrapper';
  wrapper.style.left = textObj.x + '%';
  wrapper.style.top  = textObj.y + '%';
  wrapper.dataset.id = textObj.id;

  // Texto del bocadillo
  const inner = document.createElement('div');
  inner.className = 'bubble-inner';

  const textSpan = document.createElement('div');
  textSpan.className = 'bubble-text';
  textSpan.dataset.placeholder = 'Escribe aquí...';
  textSpan.contentEditable = 'false';
  textSpan.textContent = textObj.text;

  inner.appendChild(textSpan);
  inner.appendChild(buildTailSVG(textObj.tail));

  // 8 puntos de cola
  const tailPoints = document.createElement('div');
  tailPoints.className = 'bubble-tail-points';
  const positions = ['top-left','top','top-right','right','bottom-right','bottom','bottom-left','left'];
  positions.forEach(pos => {
    const pt = document.createElement('div');
    pt.className = 'tail-point' + (textObj.tail === pos ? ' active' : '');
    pt.dataset.pos = pos;
    pt.title = pos;
    pt.addEventListener('click', (e) => {
      e.stopPropagation();
      textObj.tail = pos;
      // Actualizar cola SVG
      inner.querySelector('.bubble-tail')?.remove();
      inner.appendChild(buildTailSVG(pos));
      // Actualizar punto activo
      tailPoints.querySelectorAll('.tail-point').forEach(p => p.classList.toggle('active', p.dataset.pos === pos));
      saveComic();
    });
    tailPoints.appendChild(pt);
  });
  inner.appendChild(tailPoints);

  // Controles
  const controls = document.createElement('div');
  controls.className = 'bubble-controls';
  controls.innerHTML = `
    <button class="bubble-ctrl-btn save"   data-action="save">💾 Guardar</button>
    <button class="bubble-ctrl-btn"        data-action="txt">✏️ Txt</button>
    <button class="bubble-ctrl-btn danger" data-action="del">✕ Eliminar</button>
  `;

<<<<<<< HEAD
  controls.querySelector('[data-action="save"]').addEventListener('click', (e) => {
    e.stopPropagation();
    textObj.text = textSpan.textContent;
    exitEditMode(wrapper, textSpan);
    saveComic();
    updateDialogOrderList();
=======
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
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
  });

  controls.querySelector('[data-action="txt"]').addEventListener('click', (e) => {
    e.stopPropagation();
    textSpan.contentEditable = 'true';
    textSpan.focus();
    // Colocar cursor al final
    const range = document.createRange();
    range.selectNodeContents(textSpan);
    range.collapse(false);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  });

  controls.querySelector('[data-action="del"]').addEventListener('click', (e) => {
    e.stopPropagation();
    panel.texts = panel.texts.filter(t => t.id !== textObj.id);
    renderTextLayer();
    updateDialogOrderList();
    saveComic();
  });

  wrapper.appendChild(inner);
  wrapper.appendChild(controls);

  // Click en bocadillo: entrar en modo edición
  inner.addEventListener('click', (e) => {
    e.stopPropagation();
    // Cerrar otros bocadillos en edición
    document.querySelectorAll('.bubble-wrapper.editing').forEach(w => {
      if (w !== wrapper) {
        const s = w.querySelector('.bubble-text');
        const t = getBubbleTextObj(w.dataset.id, panel);
        if (t && s) t.text = s.textContent;
        exitEditMode(w, s);
      }
    });
    enterEditMode(wrapper, textObj, panel);
  });

  // Arrastrar (solo cuando está en modo edición y se arrastra desde la caja, no el texto)
  makeDraggable(wrapper, textObj);

  layer.appendChild(wrapper);
}

<<<<<<< HEAD
function enterEditMode(wrapper, textObj, panel) {
  wrapper.classList.add('editing');
}

function exitEditMode(wrapper, textSpan) {
  wrapper.classList.remove('editing');
  if (textSpan) textSpan.contentEditable = 'false';
}

function getBubbleTextObj(id, panel) {
  return (panel.texts || []).find(t => t.id === id) || null;
}

function buildTailSVG(tail) {
  // El triángulo: base arriba, punta abajo → apunta HACIA FUERA del bocadillo
  return Object.assign(document.createElementNS('http://www.w3.org/2000/svg','svg'), {
    className: { baseVal: 'bubble-tail tail-' + (tail||'bottom') }
  });
  // Usamos innerHTML en el wrapper para simplificar:
}

// Versión simplificada con innerHTML
function buildTailSVGStr(tail) {
  return `<svg class="bubble-tail tail-${tail||'bottom'}" viewBox="0 0 30 22" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 0 L15 22 L30 0 Z" fill="white" stroke="black" stroke-width="2.5" stroke-linejoin="round"/>
  </svg>`;
}

// Reemplazamos la función de render de cola por la versión string
function renderBubble(textObj, layer, panel) {
  const wrapper = document.createElement('div');
  wrapper.className = 'bubble-wrapper';
  wrapper.style.left = textObj.x + '%';
  wrapper.style.top  = textObj.y + '%';
  wrapper.dataset.id = textObj.id;

  const activePoints = ['top-left','top','top-right','right','bottom-right','bottom','bottom-left','left']
    .map(pos => `<div class="tail-point${textObj.tail===pos?' active':''}" data-pos="${pos}"></div>`)
    .join('');

  wrapper.innerHTML = `
    <div class="bubble-inner">
      <div class="bubble-text" data-placeholder="Escribe aquí...">${escHtml(textObj.text)}</div>
      ${buildTailSVGStr(textObj.tail)}
      <div class="bubble-tail-points">${activePoints}</div>
    </div>
    <div class="bubble-controls">
      <button class="bubble-ctrl-btn save"   data-action="save">💾 Guardar</button>
      <button class="bubble-ctrl-btn"        data-action="txt">✏️ Txt</button>
      <button class="bubble-ctrl-btn danger" data-action="del">✕ Eliminar</button>
    </div>
  `;

  const textDiv  = wrapper.querySelector('.bubble-text');
  const inner    = wrapper.querySelector('.bubble-inner');
  const controls = wrapper.querySelector('.bubble-controls');

  // Guardar
  wrapper.querySelector('[data-action="save"]').addEventListener('click', e => {
    e.stopPropagation();
    textObj.text = textDiv.textContent;
    textDiv.contentEditable = 'false';
    wrapper.classList.remove('editing');
    saveComic();
    updateDialogOrderList();
  });

  // Editar texto
  wrapper.querySelector('[data-action="txt"]').addEventListener('click', e => {
    e.stopPropagation();
    textDiv.contentEditable = 'true';
    textDiv.focus();
    const r = document.createRange();
    r.selectNodeContents(textDiv);
    r.collapse(false);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(r);
  });

  // Eliminar
  wrapper.querySelector('[data-action="del"]').addEventListener('click', e => {
    e.stopPropagation();
    panel.texts = panel.texts.filter(t => t.id !== textObj.id);
    renderTextLayer();
    updateDialogOrderList();
    saveComic();
  });

  // Puntos de cola
  wrapper.querySelectorAll('.tail-point').forEach(pt => {
    pt.addEventListener('click', e => {
      e.stopPropagation();
      const pos = pt.dataset.pos;
      textObj.tail = pos;
      // Reemplazar SVG de cola
      wrapper.querySelector('.bubble-tail')?.remove();
      inner.insertAdjacentHTML('beforeend', buildTailSVGStr(pos));
      // Actualizar punto activo
      wrapper.querySelectorAll('.tail-point').forEach(p => p.classList.toggle('active', p.dataset.pos === pos));
      // Mover la cola al lado correcto eliminando y volviendo a añadir el SVG
      const newSvg = inner.querySelector('.bubble-tail');
      // Asegurarse de que está antes de bubble-tail-points
      const tailPointsEl = inner.querySelector('.bubble-tail-points');
      inner.insertBefore(newSvg, tailPointsEl);
      saveComic();
    });
  });

  // Click en bocadillo: modo edición
  inner.addEventListener('click', e => {
    e.stopPropagation();
    // Cerrar otros
    document.querySelectorAll('.bubble-wrapper.editing').forEach(w => {
      if (w !== wrapper) {
        const s = w.querySelector('.bubble-text');
        const t = (panel.texts||[]).find(x => x.id === w.dataset.id);
        if (t && s) t.text = s.textContent;
        s && (s.contentEditable = 'false');
        w.classList.remove('editing');
      }
    });
    wrapper.classList.add('editing');
  });

  // Cerrar al hacer clic fuera
  document.addEventListener('click', () => {
    if (wrapper.classList.contains('editing')) {
      textObj.text = textDiv.textContent;
      textDiv.contentEditable = 'false';
      wrapper.classList.remove('editing');
      saveComic();
    }
  });

  makeDraggable(wrapper, textObj);
  layer.appendChild(wrapper);
}

// ════════════════════════════════════════
// ARRASTRAR BOCADILLO
// ════════════════════════════════════════
function makeDraggable(wrapper, textObj) {
  let startX, startY, startLeft, startTop, isDragging = false;

  function onStart(e) {
    // Solo arrastrar si está en modo edición y no se hace clic en botón/texto editable
    if (!wrapper.classList.contains('editing')) return;
    const target = e.target;
    if (target.tagName === 'BUTTON' || target.classList.contains('bubble-text') ||
        target.classList.contains('tail-point')) return;

    isDragging = true;
=======
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
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
    e.preventDefault();
    const stage = document.getElementById('panelStage');
    const rect  = stage.getBoundingClientRect();
    startX    = e.touches ? e.touches[0].clientX : e.clientX;
    startY    = e.touches ? e.touches[0].clientY : e.clientY;
    startLeft = textObj.x;
    startTop  = textObj.y;
    wrapper.style.cursor = 'grabbing';

<<<<<<< HEAD
    function onMove(ev) {
      if (!isDragging) return;
      ev.preventDefault();
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      textObj.x = Math.max(0, Math.min(95, startLeft + ((cx-startX)/rect.width)*100));
      textObj.y = Math.max(0, Math.min(95, startTop  + ((cy-startY)/rect.height)*100));
=======
    function onDrag(ev) {
      ev.preventDefault();
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      textObj.x = Math.max(0, Math.min(80, startLeft + ((cx - startX) / rect.width)  * 100));
      textObj.y = Math.max(0, Math.min(90, startTop  + ((cy - startY) / rect.height) * 100));
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
      wrapper.style.left = textObj.x + '%';
      wrapper.style.top  = textObj.y + '%';
    }
    function onEnd() {
      isDragging = false;
      wrapper.style.cursor = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      saveComic();
    }
<<<<<<< HEAD
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  wrapper.addEventListener('mousedown', onStart);
  wrapper.addEventListener('touchstart', onStart, { passive: false });
=======
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
  }

  wrapper.addEventListener('mousedown', startDrag);
  wrapper.addEventListener('touchstart', startDrag, { passive: false });
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
}

// ════════════════════════════════════════
// TEXTO CABECERA / PIE
// ════════════════════════════════════════
function addTextBlock(type) {
  if (EditorState.activePanelIdx < 0) { showToast('Selecciona una viñeta primero'); return; }
  const panel = EditorState.comic.panels[EditorState.activePanelIdx];
  if (!panel.texts) panel.texts = [];
<<<<<<< HEAD
  if (panel.texts.find(t => t.type === type)) { showToast('Ya existe un bloque de ' + type + ' en esta viñeta'); return; }
  panel.texts.push({ id: 't_' + Date.now(), type, text: '' });
=======
  if (panel.texts.find(t => t.type === type)) { showToast('Ya existe un ' + type + ' en esta viñeta'); return; }
  panel.texts.push({ id: 't_' + Date.now(), type, text: I18n.t('writeText') });
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
  renderTextLayer();
  saveComic();
}

function renderTextBlock(textObj, layer, panel) {
  const block = document.createElement('div');
  block.className = 'panel-text-block ' + (textObj.type === 'header' ? 'header-block' : 'footer-block');
  block.innerHTML = `
    <button class="block-del" title="Eliminar">✕</button>
<<<<<<< HEAD
    <span contenteditable="true" data-placeholder="Escribe aquí...">${escHtml(textObj.text)}</span>
  `;
  const span = block.querySelector('span');
  // Placeholder
  if (!textObj.text) span.textContent = '';
  span.addEventListener('focus', () => { if (!span.textContent) span.textContent = ''; });
  span.addEventListener('blur',  () => { textObj.text = span.textContent; saveComic(); });
=======
    <span contenteditable="true">${escHtml(textObj.text)}</span>
  `;
  block.querySelector('span').addEventListener('blur', (e) => { textObj.text = e.target.textContent; saveComic(); });
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
  block.querySelector('.block-del').addEventListener('click', () => {
    panel.texts = panel.texts.filter(t => t.id !== textObj.id);
    renderTextLayer(); saveComic();
  });
  layer.appendChild(block);
}

<<<<<<< HEAD
// ════════════════════════════════════════
// HERRAMIENTAS DE TEXTO
// ════════════════════════════════════════
=======
// ── HERRAMIENTAS DE TEXTO ──
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
function updateTextTools() {
  const idx   = EditorState.activePanelIdx;
  const hint  = document.getElementById('textsHint');
  const tools = document.getElementById('textTools');
<<<<<<< HEAD
  const has   = EditorState.comic && idx >= 0;
  if (hint)  hint.style.display  = has ? 'none'  : 'block';
  if (tools) tools.style.display = has ? 'block' : 'none';
  if (has) updateDialogOrderList();
=======
  const hasPanel = EditorState.comic && idx >= 0;
  if (hint)  hint.style.display  = hasPanel ? 'none'  : 'block';
  if (tools) tools.style.display = hasPanel ? 'block' : 'none';
  if (hasPanel) updateDialogOrderList();
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
}

function updateDialogOrderList() {
  const idx    = EditorState.activePanelIdx;
  const listEl = document.getElementById('dialogOrderList');
  if (!listEl || !EditorState.comic || idx < 0) return;
<<<<<<< HEAD
  const dialogs = (EditorState.comic.panels[idx].texts || [])
    .filter(t => t.type === 'dialog')
    .sort((a,b) => (a.order||0)-(b.order||0));
=======

  const panel   = EditorState.comic.panels[idx];
  const dialogs = (panel.texts || []).filter(t => t.type === 'dialog').sort((a,b) => (a.order||0)-(b.order||0));
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
  listEl.innerHTML = '';
  dialogs.forEach((d, i) => {
    const item = document.createElement('div');
    item.className = 'dialog-order-item';
    item.draggable = true;
<<<<<<< HEAD
    item.innerHTML = `<div class="order-num">${i+1}</div><div class="order-text">${escHtml(d.text||'(vacío)')}</div>`;
    let src = null;
    item.addEventListener('dragstart', () => src = i);
    item.addEventListener('dragover',  e => e.preventDefault());
    item.addEventListener('drop', () => {
      if (src === null || src === i) return;
      const [m] = dialogs.splice(src, 1);
      dialogs.splice(i, 0, m);
      dialogs.forEach((d,j) => d.order = j);
      updateDialogOrderList(); saveComic();
=======
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
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
    });
    listEl.appendChild(item);
  });
}

<<<<<<< HEAD
// ════════════════════════════════════════
// CAMBIO DE PANTALLA
// ════════════════════════════════════════
function showScreen(name) {
  document.getElementById('screenProjects').style.display = name === 'projects' ? 'block' : 'none';
  document.getElementById('screenEditor').style.display   = name === 'editor'   ? 'flex'  : 'none';
  if (name === 'projects') {
    document.getElementById('editorMenus').style.display  = 'none';
    document.getElementById('editorActions').style.display = 'none';
  }
}

// ════════════════════════════════════════
// UTILS
// ════════════════════════════════════════
=======
// ── UTILS ──
>>>>>>> 39a9abc58b104f57f8f93353a30bc860b54f76ef
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
