// ─── LiquidGlass overlays (dashersw/liquid-glass-js) ─────────────────────────

if (typeof html2canvas === 'undefined') {
    window.html2canvas = () => Promise.resolve(document.createElement('canvas'));
}

// ─── Snapshot direct depuis l'image de fond ───────────────────────────────────

function buildBackgroundSnapshot() {
    const bgEl = document.getElementById('backgroundImage');
    if (!bgEl) return Promise.resolve(null);

    const bgStyle = bgEl.style.backgroundImage || getComputedStyle(bgEl).backgroundImage;
    const match   = bgStyle.match(/url\(["']?([^"')]+)["']?\)/);
    if (!match) return Promise.resolve(null);

    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, -20, -20, canvas.width + 40, canvas.height + 40);
            ctx.fillStyle = 'rgba(4, 4, 14, 0.4)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Pre-cache toDataURL as JPEG — shared by all containers, avoids 7× slow PNG encode
            const cached = canvas.toDataURL('image/jpeg', 0.85);
            canvas.toDataURL = () => cached;
            resolve(canvas);
        };
        img.onerror = () => resolve(null);
        img.src = match[1];
    });
}

// ─── Overlay en position absolue dans #glass-root (éléments statiques) ───────

function createGlassOverlay(targetEl, borderRadius) {
    if (!targetEl) return null;
    if (typeof Container === 'undefined') return null;

    const rect = targetEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const glassRoot = document.getElementById('glass-root');
    if (!glassRoot) return null;

    const actualRadius = Math.min(borderRadius, Math.floor(rect.height / 2));
    const container = new Container({ borderRadius: actualRadius, tintOpacity: 0.05 });
    const el = container.element;

    el.style.position  = 'absolute';
    el.style.top       = rect.top    + 'px';
    el.style.left      = rect.left   + 'px';
    el.style.width     = rect.width  + 'px';
    el.style.height    = rect.height + 'px';
    el.style.minWidth  = rect.width  + 'px';
    el.style.minHeight = rect.height + 'px';
    el.style.padding   = '0';

    glassRoot.appendChild(el);
    return container;
}

// ─── Overlay embarqué dans l'élément (suit les CSS transforms/hover) ─────────

function createGlassOverlayInline(targetEl, borderRadius) {
    if (!targetEl) return null;
    if (typeof Container === 'undefined') return null;

    const rect = targetEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    // S'assurer que position: relative est présent pour les enfants absolus
    if (getComputedStyle(targetEl).position === 'static') {
        targetEl.style.position = 'relative';
    }

    const actualRadius = Math.min(borderRadius, Math.floor(rect.height / 2));
    const container = new Container({ borderRadius: actualRadius, tintOpacity: 0.05 });
    const el = container.element;

    el.style.position  = 'absolute';
    el.style.top       = '0';
    el.style.left      = '0';
    el.style.width     = '100%';
    el.style.height    = '100%';
    el.style.padding   = '0';
    el.style.zIndex    = '-1'; // derrière les enfants (icon, nom)

    targetEl.appendChild(el);
    return container;
}

// ─── Appliquer le glass aux favoris (inline) ──────────────────────────────────

function applyShortcutGlass() {
    document.querySelectorAll('#shortcutsGrid .shortcut-item').forEach(item => {
        if (item.querySelector('.glass-container')) return; // déjà appliqué
        item.style.background           = 'transparent';
        item.style.backdropFilter       = 'none';
        item.style.webkitBackdropFilter = 'none';
        item.style.boxShadow            = 'none';
        createGlassOverlayInline(item, 20);
    });
}

// ─── Détruire tous les overlays existants ────────────────────────────────────

function destroyOverlays() {
    // Overlays dans glass-root
    const glassRoot = document.getElementById('glass-root');
    if (glassRoot) glassRoot.innerHTML = '';

    // Overlays inline dans les favoris
    document.querySelectorAll('#shortcutsGrid .shortcut-item .glass-container').forEach(el => el.remove());
    const addBtn = document.getElementById('addShortcutBtn');
    addBtn?.querySelector('.glass-container')?.remove();

    Container.pageSnapshot       = null;
    Container.isCapturing        = false;
    Container.waitingForSnapshot = [];
}

// ─── Construire et appliquer tous les overlays ───────────────────────────────

async function buildAndApplyOverlays() {
    if (typeof Container === 'undefined') return;

    const snapshotPromise = buildBackgroundSnapshot();
    await new Promise(r => setTimeout(r, 200));

    const els = {
        weather:     document.getElementById('weatherWidget'),
        calendar:    document.getElementById('calendarWidget'),
        expand:      document.getElementById('expandBtn'),
        image:       document.getElementById('imageBtn'),
        customize:   document.getElementById('customizeBtn'),
        search:      document.querySelector('.search-wrapper'),
        shortcutsWrap: document.querySelector('.shortcuts-wrapper'),
        addShortcut: document.getElementById('addShortcutBtn'),
    };

    const shortcutItems = Array.from(
        document.querySelectorAll('#shortcutsGrid .shortcut-item')
    );

    // Retirer le CSS glass des éléments statiques AVANT de créer les containers
    [els.weather, els.calendar, els.expand, els.image, els.customize, els.search, els.shortcutsWrap].forEach(el => {
        if (!el) return;
        el.style.background           = 'transparent';
        el.style.backdropFilter       = 'none';
        el.style.webkitBackdropFilter = 'none';
        el.style.boxShadow            = 'none';
    });

    // Retirer le CSS glass des favoris et du bouton Ajouter
    [...shortcutItems, els.addShortcut].forEach(el => {
        if (!el) return;
        el.style.background           = 'transparent';
        el.style.backdropFilter       = 'none';
        el.style.webkitBackdropFilter = 'none';
        el.style.boxShadow            = 'none';
    });

    await new Promise(r => requestAnimationFrame(r));

    const snapshot = await snapshotPromise;
    if (snapshot) {
        Container.pageSnapshot = snapshot;
        Container.isCapturing  = false;
    }

    // Éléments statiques → overlay dans glass-root
    createGlassOverlay(els.weather,   20);
    createGlassOverlay(els.calendar,  20);
    createGlassOverlay(els.expand,    12);
    createGlassOverlay(els.image,     12);
    createGlassOverlay(els.customize, 12);
    createGlassOverlay(els.search,    50); // clamped → pill

    // Favoris → overlay inline (suit le hover translateY)
    shortcutItems.forEach(item => createGlassOverlayInline(item, 20));
    createGlassOverlayInline(els.addShortcut, 20);
}

// ─── Init ────────────────────────────────────────────────────────────────────

async function initLiquidGlass() {
    if (typeof Container === 'undefined') return;
    if (document.fonts?.ready) await document.fonts.ready;

    await buildAndApplyOverlays();

    // Suivre les ajouts/suppressions de favoris
    const grid = document.getElementById('shortcutsGrid');
    if (grid) {
        let shortcutDebounce;
        new MutationObserver(() => {
            clearTimeout(shortcutDebounce);
            shortcutDebounce = setTimeout(applyShortcutGlass, 50);
        }).observe(grid, { childList: true });
    }

    // Reconstruire sur resize / zoom
    let resizeDebounce;
    window.addEventListener('resize', () => {
        clearTimeout(resizeDebounce);
        resizeDebounce = setTimeout(async () => {
            destroyOverlays();
            await buildAndApplyOverlays();
        }, 250);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLiquidGlass);
} else {
    initLiquidGlass();
}
