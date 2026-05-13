// ===== WIDGET DRAG & DROP =====
// Deux colonnes fixes (gauche / droite de la search bar).
// Un seul dragover sur document → colonne ciblée par position X (la plus proche),
// ce qui rend le drop naturel même en colonne vide ou en traversant l'espace entre colonnes.

const WIDGET_DRAG_KEY   = 'zenithWidgetLayout';
const DEFAULT_LAYOUT    = { left: ['weather'], right: ['calendar'] };
const DRAGGABLE_WIDGETS = ['weather', 'calendar', 'news', 'market', 'f1'];

function widgetElId(id)  { return id + 'Widget'; }
function getWidgetEl(id) { return document.getElementById(widgetElId(id)); }

// ─── Layout persistence ──────────────────────────────────────────────────────

function loadWidgetLayout() {
    try {
        const s = localStorage.getItem(WIDGET_DRAG_KEY);
        if (s) {
            const parsed = JSON.parse(s);
            const placed = [...(parsed.left || []), ...(parsed.right || [])];
            DRAGGABLE_WIDGETS.forEach(id => {
                if (!placed.includes(id)) parsed.right.push(id);
            });
            return parsed;
        }
    } catch {}
    return JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
}

function saveWidgetLayout() {
    localStorage.setItem(WIDGET_DRAG_KEY, JSON.stringify(getCurrentLayout()));
}

function getCurrentLayout() {
    const layout = { left: [], right: [] };
    ['Left', 'Right'].forEach(side => {
        const col = document.getElementById('widgetCol' + side);
        if (!col) return;
        col.querySelectorAll('[data-widget-id]').forEach(el => {
            layout[side.toLowerCase()].push(el.dataset.widgetId);
        });
    });
    return layout;
}

// ─── Apply layout ────────────────────────────────────────────────────────────

function applyWidgetLayout(layout) {
    const colLeft  = document.getElementById('widgetColLeft');
    const colRight = document.getElementById('widgetColRight');
    if (!colLeft || !colRight) return;
    (layout.left  || []).forEach(id => { const el = getWidgetEl(id); if (el) colLeft.appendChild(el); });
    (layout.right || []).forEach(id => { const el = getWidgetEl(id); if (el) colRight.appendChild(el); });
}

// ─── Edit mode ───────────────────────────────────────────────────────────────

let _editModeActive = false;

function setWidgetEditMode(active) {
    _editModeActive = active;
    DRAGGABLE_WIDGETS.forEach(id => {
        const el = getWidgetEl(id);
        if (!el) return;
        const visible = el.style.display !== 'none';
        el.classList.toggle('widget-edit-mode', active && visible);
    });
    // Afficher les placeholders dans les colonnes vides
    document.querySelectorAll('.widget-col').forEach(col => {
        updateEmptyPlaceholder(col, active);
    });
}

window._setWidgetEditMode = setWidgetEditMode;
window._isWidgetEditMode  = () => _editModeActive;

// ─── Drag state ──────────────────────────────────────────────────────────────

let _draggingId    = null;
let _targetCol     = null;
let _dropIndicator = null;
let _cols          = [];

// ─── Empty column placeholder ────────────────────────────────────────────────

function updateEmptyPlaceholder(col, editMode) {
    let ph = col.querySelector('.widget-col-placeholder');
    const hasWidgets = col.querySelectorAll('[data-widget-id]').length > 0;
    if (editMode && !hasWidgets) {
        if (!ph) {
            ph = document.createElement('div');
            ph.className = 'widget-col-placeholder';
            ph.textContent = 'Déposer ici';
        }
        col.appendChild(ph);
    } else {
        ph?.remove();
    }
}

// ─── Nearest column by X ─────────────────────────────────────────────────────

function nearestCol(clientX) {
    let best = null, minDist = Infinity;
    _cols.forEach(col => {
        const r = col.getBoundingClientRect();
        // Distance horizontale : 0 si le curseur est dans la colonne, sinon distance au bord
        const dist = clientX < r.left ? r.left - clientX
                   : clientX > r.right ? clientX - r.right : 0;
        if (dist < minDist) { minDist = dist; best = col; }
    });
    return best;
}

// ─── Drop indicator ───────────────────────────────────────────────────────────

function getOrCreateIndicator() {
    if (!_dropIndicator) {
        _dropIndicator = document.createElement('div');
        _dropIndicator.className = 'widget-drop-indicator';
    }
    return _dropIndicator;
}

function placeIndicator(col, clientY) {
    const ind = getOrCreateIndicator();
    const widgets = [...col.querySelectorAll('[data-widget-id]')]
        .filter(el => el.dataset.widgetId !== _draggingId);

    let insertBefore = null;
    for (const w of widgets) {
        const rect = w.getBoundingClientRect();
        if (clientY < rect.top + rect.height / 2) { insertBefore = w; break; }
    }
    insertBefore ? col.insertBefore(ind, insertBefore) : col.appendChild(ind);
}

function removeIndicator() { _dropIndicator?.remove(); }

// ─── Glass helpers ────────────────────────────────────────────────────────────

function hideWidgetGlass(widgetId) {
    document.querySelectorAll(`[data-glass-for="${widgetElId(widgetId)}"]`)
        .forEach(g => { g.style.visibility = 'hidden'; });
}

function showAllWidgetGlass() {
    DRAGGABLE_WIDGETS.forEach(id => {
        document.querySelectorAll(`[data-glass-for="${widgetElId(id)}"]`)
            .forEach(g => { g.style.visibility = ''; });
    });
}

async function rebuildGlassAfterDrop() {
    if (typeof destroyOverlays !== 'function') return;
    destroyOverlays();
    await buildAndApplyOverlays();
    if (typeof preWarmModalGlass === 'function') await preWarmModalGlass();
}

// ─── Per-widget drag events ───────────────────────────────────────────────────

function setupDraggable(widgetEl, widgetId) {
    widgetEl.setAttribute('draggable', 'true');

    widgetEl.addEventListener('dragstart', e => {
        if (!_editModeActive) {
            e.preventDefault();
            return;
        }
        _draggingId = widgetId;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', widgetId);
        widgetEl.classList.add('widget-dragging');

        const rect = widgetEl.getBoundingClientRect();
        e.dataTransfer.setDragImage(widgetEl, rect.width / 2, 24);

        requestAnimationFrame(() => {
            hideWidgetGlass(widgetId);
            // Afficher placeholder dans les colonnes qui deviendraient vides
            _cols.forEach(col => updateEmptyPlaceholder(col, true));
        });
    });

    widgetEl.addEventListener('dragend', () => {
        widgetEl.classList.remove('widget-dragging');
        _draggingId = null;
        _targetCol  = null;
        removeIndicator();
        _cols.forEach(col => {
            col.classList.remove('drop-target');
            updateEmptyPlaceholder(col, _editModeActive);
        });
        showAllWidgetGlass();
    });
}

// ─── Document-level drag routing ─────────────────────────────────────────────

function initDocumentDragHandlers() {
    document.addEventListener('dragover', e => {
        if (!_draggingId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const col = nearestCol(e.clientX);
        if (!col) return;

        if (_targetCol !== col) {
            _cols.forEach(c => c.classList.remove('drop-target'));
            col.classList.add('drop-target');
            _targetCol = col;
        }
        placeIndicator(col, e.clientY);
    });

    document.addEventListener('drop', e => {
        if (!_draggingId) return;
        e.preventDefault();

        const col = _targetCol || nearestCol(e.clientX);
        if (!col) { removeIndicator(); return; }

        const widgetEl = getWidgetEl(_draggingId);
        if (widgetEl) {
            if (_dropIndicator?.parentElement === col) {
                col.insertBefore(widgetEl, _dropIndicator);
            } else {
                col.appendChild(widgetEl);
            }
        }

        removeIndicator();
        _cols.forEach(c => c.classList.remove('drop-target'));

        saveWidgetLayout();
        rebuildGlassAfterDrop();
    });
}

// ─── Public init ──────────────────────────────────────────────────────────────

function initWidgetDrag() {
    const colLeft  = document.getElementById('widgetColLeft');
    const colRight = document.getElementById('widgetColRight');
    if (!colLeft || !colRight) return;

    _cols = [colLeft, colRight];

    applyWidgetLayout(loadWidgetLayout());

    DRAGGABLE_WIDGETS.forEach(id => {
        const el = getWidgetEl(id);
        if (!el) return;
        el.dataset.widgetId = id;
        setupDraggable(el, id);
    });

    initDocumentDragHandlers();
}
