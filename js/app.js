// ===== APP INIT — Zenith New Design =====

// ---- Horloge 12h/24h ----
let use24h = localStorage.getItem('zenithClockFormat') !== '12';

function updateClock() {
    const d = new Date();
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    let ampm = '';

    if (!use24h) {
        ampm = h >= 12 ? ' PM' : ' AM';
        h = h % 12 || 12;
    } else {
        h = String(h).padStart(2, '0');
    }

    const digits = document.getElementById('timeDigits');
    const ampmEl = document.getElementById('timeAmpm');
    if (digits) digits.textContent = `${h}:${m}`;
    if (ampmEl) ampmEl.textContent = ampm;
}

function updateDate() {
    const now = new Date();
    const str = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const el = document.getElementById('dateDisplay');
    if (el) el.textContent = str.charAt(0).toUpperCase() + str.slice(1);
}

function initClock() {
    updateClock();
    updateDate();
    setInterval(updateClock, 1000);
    setInterval(updateDate, 60000);

    const timeDisplay = document.querySelector('.time-display');
    if (timeDisplay) {
        timeDisplay.style.cursor = 'pointer';
        timeDisplay.title = "Changer le format 12h/24h";
        timeDisplay.addEventListener('click', () => {
            use24h = !use24h;
            localStorage.setItem('zenithClockFormat', use24h ? '24' : '12');
            updateClock();
        });
    }
}

// ---- Background (image locale/custom) ----
const DEFAULT_BG_IMAGE_PATH = 'assets/img/background.png';

function loadBackground() {
    const bgEl = document.getElementById('backgroundImage');
    if (!bgEl) return;
    const settings = JSON.parse(localStorage.getItem('zenithSettings') || '{}');
    if (settings.customBackgroundDataUrl) {
        bgEl.style.backgroundImage = `url('${settings.customBackgroundDataUrl}')`;
    } else {
        bgEl.style.backgroundImage = `url('${encodeURI(DEFAULT_BG_IMAGE_PATH)}')`;
    }
}

function initBackgroundPicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png, image/jpeg, image/webp, image/gif';
    input.style.display = 'none';
    document.body.appendChild(input);

    function applyBackground(dataUrl) {
        const settings = JSON.parse(localStorage.getItem('zenithSettings') || '{}');
        settings.customBackgroundDataUrl = dataUrl || null;
        try {
            localStorage.setItem('zenithSettings', JSON.stringify(settings));
            loadBackground();
            updateBgPreview();
            if (typeof destroyOverlays === 'function' && typeof buildAndApplyOverlays === 'function') {
                destroyOverlays();
                buildAndApplyOverlays();
            }
        } catch (err) {
            alert("L'image est trop volumineuse pour être sauvegardée dans le navigateur (limite souvent à 5MB).");
        }
    }

    function updateBgPreview() {
        const preview = document.getElementById('bgPreview');
        if (!preview) return;
        const settings = JSON.parse(localStorage.getItem('zenithSettings') || '{}');
        const url = settings.customBackgroundDataUrl || `${encodeURI(DEFAULT_BG_IMAGE_PATH)}`;
        preview.style.backgroundImage = `url('${url}')`;
    }

    document.getElementById('changeBgBtn')?.addEventListener('click', () => input.click());

    document.getElementById('resetBgBtn')?.addEventListener('click', () => applyBackground(null));

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => applyBackground(event.target.result);
        reader.readAsDataURL(file);
        input.value = '';
    });

    // Mettre à jour la preview quand le modal s'ouvre
    document.getElementById('customizeBtn')?.addEventListener('click', updateBgPreview);
    updateBgPreview();
}

// Parallax doux sur fond
function initParallax() {
    // Parallax désactivé — le snapshot glass est statique, bouger le fond
    // créerait un décalage visible entre fond et reflet.
}

// ---- Recherche ----
function initSearch() {
    const form = document.getElementById('searchForm');
    const input = document.getElementById('searchInput');
    if (!form || !input) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = input.value.trim();
        if (q) window.location.href = `https://search.brave.com/search?q=${encodeURIComponent(q)}`;
    });
}

// ---- Modal personnalisation ----
function renderGroqKeys() {
    const list = document.getElementById('groqKeysList');
    if (!list || !window.ZenithAI) return;
    const mgr = window.ZenithAI.keys;
    if (mgr.count() === 0) {
        list.innerHTML = '<p style="font-size:0.72rem;color:var(--text-tertiary);padding:0.2rem 0;">Aucune clé ajoutée</p>';
        return;
    }
    list.innerHTML = mgr.keys.map((_, i) => `
        <div class="groq-key-row">
            <span class="groq-key-index">#${i + 1}</span>
            <span class="groq-key-label">${mgr.masked(i)}</span>
            <button class="groq-key-del" data-idx="${i}" title="Supprimer">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    list.querySelectorAll('.groq-key-del').forEach(btn => {
        btn.addEventListener('click', () => {
            mgr.remove(+btn.dataset.idx);
            renderGroqKeys();
            window.ZenithAI?._render();
        });
    });
}

// ---- Accent color ----
const ACCENT_COLOR_KEY = 'zenithAccentColor';
const DEFAULT_ACCENT   = '#5c62ff';

function _hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function applyAccentColor(hex) {
    document.documentElement.style.setProperty('--accent-color', hex);
    const [r,g,b] = _hexToRgb(hex);
    document.documentElement.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.25)`);
    localStorage.setItem(ACCENT_COLOR_KEY, hex);
}

function initAccentColor() {
    applyAccentColor(localStorage.getItem(ACCENT_COLOR_KEY) || DEFAULT_ACCENT);
}

function initAccentPicker() {
    const container = document.getElementById('accentSwatches');
    if (!container) return;
    const colorInput = document.getElementById('accentColorInput');
    const current = localStorage.getItem(ACCENT_COLOR_KEY) || DEFAULT_ACCENT;
    if (colorInput) colorInput.value = current;

    const updateActive = (color) => {
        container.querySelectorAll('.accent-swatch[data-color]').forEach(s => {
            s.classList.toggle('active', s.dataset.color.toLowerCase() === color.toLowerCase());
        });
    };
    updateActive(current);

    container.addEventListener('click', (e) => {
        const swatch = e.target.closest('.accent-swatch[data-color]');
        if (!swatch) return;
        applyAccentColor(swatch.dataset.color);
        updateActive(swatch.dataset.color);
        if (colorInput) colorInput.value = swatch.dataset.color;
    });

    colorInput?.addEventListener('input', (e) => {
        applyAccentColor(e.target.value);
        updateActive(e.target.value);
    });
}

// ---- UI Style (glass / classic) ----
const UI_STYLE_KEY = 'zenithUiStyle';

function applyUiStyle(style) {
    document.body.classList.toggle('ui-classic', style === 'classic');
    localStorage.setItem(UI_STYLE_KEY, style);
}

function initUiStyle() {
    const saved = localStorage.getItem(UI_STYLE_KEY) || 'glass';
    applyUiStyle(saved);
}

function initUiStyleToggle() {
    const toggle = document.getElementById('uiStyleToggle');
    if (!toggle) return;

    const current = localStorage.getItem(UI_STYLE_KEY) || 'glass';
    toggle.querySelectorAll('.ui-style-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.style === current);
    });

    toggle.addEventListener('click', async (e) => {
        const btn = e.target.closest('.ui-style-btn');
        if (!btn) return;
        const style = btn.dataset.style;
        applyUiStyle(style);
        toggle.querySelectorAll('.ui-style-btn').forEach(b => b.classList.toggle('active', b.dataset.style === style));
        // If switching to glass and modal containers were never created, warm them up now
        if (style === 'glass' && typeof preWarmModalGlass === 'function') {
            const hasGlass = !!document.querySelector('.modal-card .glass-container');
            if (!hasGlass) await preWarmModalGlass();
        }
    });
}

function initCustomizeModal() {
    const openBtn  = document.getElementById('customizeBtn');
    const overlay  = document.getElementById('customizeModalOverlay');
    const closeBtn = document.getElementById('customizeModalClose');
    const icsInput = document.getElementById('ecalendarUrl');
    const icsSaveBtn  = document.getElementById('ecalendarSaveBtn');
    const newKeyInput = document.getElementById('newGroqKeyInput');
    const addKeyBtn   = document.getElementById('addGroqKeyBtn');

    if (!overlay) return;

    const settings = JSON.parse(localStorage.getItem('zenithSettings') || '{}');
    if (icsInput && settings.ecalendarUrl) icsInput.value = settings.ecalendarUrl;

    function modalCardOrigin() {
        const btn  = document.getElementById('customizeBtn');
        const card = overlay.querySelector('.modal-card');
        if (!btn || !card) return '50% 100%';
        const br = btn.getBoundingClientRect();
        const cr = card.getBoundingClientRect();
        const ox = ((br.left + br.width  / 2) - cr.left) / cr.width  * 100;
        const oy = ((br.top  + br.height / 2) - cr.top)  / cr.height * 100;
        return `${ox}% ${oy}%`;
    }

    const openModal = () => {
        overlay.classList.add('active');
        overlay.style.pointerEvents = 'auto';
        if (window.gsap) gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
        else overlay.style.opacity = '1';
        requestAnimationFrame(() => {
            const card = overlay.querySelector('.modal-card');
            if (!card || !window.gsap) return;
            const cg = window._glassCache?.['customizeModalOverlay'];
            if (cg) { 
                cg.element.style.opacity = ''; 
                cg.stopRenderLoop?.(); 
                // Force a single render frame to capture background correctly at scale 1 before animating
                cg.render?.(); 
            }
            const origin = modalCardOrigin();
            gsap.fromTo(card,
                { scale: 0.04, transformOrigin: origin },
                { scale: 1,    transformOrigin: origin, duration: 0.4, ease: 'expo.out',
                  onComplete: () => { if (cg) cg.startRenderLoop?.(); }
                }
            );
        });
    };

    const closeModal = () => {
        const card = overlay.querySelector('.modal-card');
        const origin = card ? modalCardOrigin() : '50% 100%';
        const cg = window._glassCache?.['customizeModalOverlay'];
        const finish = () => {
            overlay.classList.remove('active');
            overlay.style.pointerEvents = 'none';
            if (cg) cg.element.style.opacity = '0';
            if (card) gsap.set(card, { scale: 1, clearProps: 'transformOrigin' });
        };
        if (window.gsap) {
            if (cg) cg.stopRenderLoop?.();
            if (card) gsap.to(card, { scale: 0.04, transformOrigin: origin, duration: 0.22, ease: 'expo.in' });
            gsap.to(overlay, { opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: finish });
        } else { finish(); }
        const url = icsInput?.value.trim() || '';
        if (window.CalendarWidget) window.CalendarWidget.setEcalendarUrl(url);
    };

    // News feed select
    const newsFeedSelect = document.getElementById('newsFeedSelect');
    if (newsFeedSelect) {
        const saved = localStorage.getItem('zenithNewsTheme');
        if (saved) {
            const opt = [...newsFeedSelect.options].find(o => o.value === saved);
            if (opt) opt.selected = true;
        }
        newsFeedSelect.addEventListener('change', () => {
            const val = newsFeedSelect.value;
            localStorage.setItem('zenithNewsTheme', val);
            localStorage.removeItem('zenithNewsCache');
            if (window._newsWidgetInstance) {
                window._newsWidgetInstance.theme = val;
                window._newsWidgetInstance.fetchNews();
            }
        });
    }

    // Market asset select
    const marketAssetSelect = document.getElementById('marketAssetSelect');
    if (marketAssetSelect) {
        const saved = localStorage.getItem('zenithMarketAsset');
        if (saved) {
            const opt = [...marketAssetSelect.options].find(o => o.value === saved);
            if (opt) opt.selected = true;
        }
        marketAssetSelect.addEventListener('change', () => {
            const val = marketAssetSelect.value;
            localStorage.setItem('zenithMarketAsset', val);
            localStorage.removeItem('zenithMarketCache');
            if (window._marketWidgetInstance) {
                window._marketWidgetInstance.assetId = val;
                window._marketWidgetInstance.refresh();
            }
        });
    }

    openBtn?.addEventListener('click', () => { renderGroqKeys(); renderMemory(); openModal(); });
    closeBtn?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    icsSaveBtn?.addEventListener('click', () => {
        const url = icsInput?.value.trim() || '';
        if (window.CalendarWidget) window.CalendarWidget.setEcalendarUrl(url);
        closeModal();
    });

    // Groq key add
    const doAddKey = () => {
        const val = newKeyInput?.value.trim();
        if (!val) return;
        if (window.ZenithAI?.keys.add(val)) {
            if (newKeyInput) newKeyInput.value = '';
            renderGroqKeys();
            window.loadGroqModels?.();
            window.ZenithAI?._render();
        } else {
            if (newKeyInput) newKeyInput.style.borderColor = 'rgba(255,80,80,0.5)';
            setTimeout(() => { if (newKeyInput) newKeyInput.style.borderColor = ''; }, 1200);
        }
    };
    addKeyBtn?.addEventListener('click', doAddKey);
    newKeyInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doAddKey(); } });

    // Mémoire
    const newMemoryInput = document.getElementById('newMemoryInput');
    const addMemoryBtn   = document.getElementById('addMemoryBtn');
    const doAddMemory = () => {
        const val = newMemoryInput?.value.trim();
        if (!val) return;
        window.ZenithAI?.addMemory(val);
        if (newMemoryInput) newMemoryInput.value = '';
        renderMemory();
    };
    addMemoryBtn?.addEventListener('click', doAddMemory);
    newMemoryInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doAddMemory(); } });
}

function renderMemory() {
    const list = document.getElementById('memoryList');
    if (!list || !window.ZenithAI) return;
    const items = window.ZenithAI._loadMemory();
    if (!items.length) {
        list.innerHTML = '<p style="font-size:0.72rem;color:var(--text-tertiary);padding:0.2rem 0;">Aucun souvenir enregistré</p>';
        return;
    }
    list.innerHTML = items.map(m => `
        <div class="groq-key-row">
            <span class="groq-key-label" style="font-family:inherit;white-space:normal;">${m.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>
            <button class="groq-key-del" data-id="${m.id}" title="Oublier">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    list.querySelectorAll('.groq-key-del').forEach(btn => {
        btn.addEventListener('click', () => {
            window.ZenithAI.removeMemory(btn.dataset.id);
            renderMemory();
        });
    });
}
window.renderMemory = renderMemory;

// Accessible globalement pour les messages d'erreur inline du chat
window.openSettings = () => {
    document.getElementById('customizeBtn')?.click();
};

// ---- Helpers d'animation macOS ----
function btnOrigin(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return '50% 50%';
    const r = btn.getBoundingClientRect();
    return `${r.left + r.width / 2}px ${r.top + r.height / 2}px`;
}

function macOpen(panel, btnId, bgEls) {
    if (!window.gsap) { panel.style.transform = 'scale(1)'; panel.style.opacity = '1'; return; }
    const origin = btnOrigin(btnId);
    gsap.fromTo(panel,
        { scale: 0.04, opacity: 0, transformOrigin: origin },
        { scale: 1,    opacity: 1, duration: 0.42, ease: 'expo.out', transformOrigin: origin }
    );
    gsap.to(bgEls.filter(Boolean), { opacity: 0, duration: 0.22, ease: 'power2.out' });
}

function macClose(panel, btnId, bgEls, onDone) {
    if (!window.gsap) { panel.style.transform = 'scale(0.04)'; panel.style.opacity = '0'; onDone?.(); return; }
    const origin = btnOrigin(btnId);
    gsap.to(panel, { scale: 0.04, opacity: 0, duration: 0.26, ease: 'expo.in', transformOrigin: origin, onComplete: onDone });
    gsap.to(bgEls.filter(Boolean), { opacity: 1, duration: 0.3, ease: 'power2.out', delay: 0.1 });
}

// ---- Chat panel (transitions + input) ----
function initChat() {
    const chatPanel   = document.getElementById('chatPanel');
    const mainContent = document.getElementById('mainContent');
    const glassRoot   = document.getElementById('glass-root');
    const leftPanel   = document.getElementById('widgetColLeft');
    const rightPanel  = document.getElementById('widgetColRight');
    const backBtn     = document.getElementById('chatBackBtn');
    const sendBtn     = document.getElementById('chatSendBtn');
    const textarea    = document.getElementById('chatInput');
    const clearBtn    = document.getElementById('newConvBtn');
    const bgEls       = [mainContent, glassRoot, leftPanel, rightPanel];

    if (!chatPanel) return;

    let isOpen = false;

    const openChat = () => {
        if (isOpen) return;
        isOpen = true;
        chatPanel.style.pointerEvents = 'auto';
        window._dockState = { activePanel: 'chat', close: closeChat };

        window.ZenithAI?._render();
        window.ZenithAI?.renderSidebar();
        syncSendBtn();

        macOpen(chatPanel, 'chatBtn', bgEls);
        setTimeout(() => textarea?.focus(), 420);
    };

    const closeChat = () => {
        if (!isOpen) return;
        isOpen = false;
        window._dockState = null;
        window._hideDock?.(false);
        macClose(chatPanel, 'chatBtn', bgEls, () => {
            chatPanel.style.pointerEvents = 'none';
        });
    };

    document.getElementById('chatBtn')?.addEventListener('click', () => {
        const state = window._dockState;
        if (state?.activePanel === 'chat') { closeChat(); }
        else if (state?.activePanel) { state.close(); setTimeout(openChat, 380); }
        else { openChat(); }
    });

    backBtn?.addEventListener('click', closeChat);

    // Textarea auto-resize + send button state
    const syncSendBtn = () => {
        if (!sendBtn || !textarea) return;
        const noKey = !window.ZenithAI?.keys.hasKeys();
        const hasAttachments = (window.ZenithAI?.attachments?.length || 0) > 0;
        sendBtn.disabled = (textarea.value.trim() === '' && !hasAttachments) || window.ZenithAI?.streaming || noKey;
        sendBtn.title = noKey ? 'Ajoutez une clé API dans les paramètres' : '';
    };

    textarea?.addEventListener('input', () => {
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
        syncSendBtn();
    });

    const doSend = () => {
        const text = textarea?.value.trim();
        const hasAttachments = (window.ZenithAI?.attachments?.length || 0) > 0;
        if ((!text && !hasAttachments) || window.ZenithAI?.streaming) return;
        window.ZenithAI?.send(text);
        if (textarea) { textarea.value = ''; textarea.style.height = 'auto'; }
        syncSendBtn();
    };

    sendBtn?.addEventListener('click', doSend);

    textarea?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            doSend();
        }
    });

    clearBtn?.addEventListener('click', () => {
        window.ZenithAI?.newConversation();
        syncSendBtn();
    });

    // Sparkle button in search bar → open chat
    document.querySelector('.search-sparkle-btn')?.addEventListener('click', openChat);
}

// ---- Entrée principale ----
// Apply visual preferences as early as possible (before DOMContentLoaded paints)
initAccentColor();
initUiStyle();

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Charger le fond
    loadBackground();
    initBackgroundPicker();

    // 2. Parallax
    initParallax();

    // 3. Horloge
    initClock();

    // 4. Recherche
    initSearch();

    // 5. Météo
    if (window.WeatherWidget) {
        window.WeatherWidget.init();
    }

    // 6. Calendrier
    if (window.CalendarWidget) {
        await window.CalendarWidget.init();
    }

    // 7. Modal personnalisation
    initCustomizeModal();
    initUiStyleToggle();
    initAccentPicker();

    // 8. Chat IA
    initChat();
    window.ZenithAI?._render(); // état initial correct dès le chargement

    // 9. Notes
    initNotes();

    // 10. Widget drag & drop
    if (typeof initWidgetDrag === 'function') initWidgetDrag();

    // 10b. News widget
    if (typeof initNewsWidget === 'function') initNewsWidget();

    // 10c. Market widget
    if (typeof initMarketWidget === 'function') initMarketWidget();
    if (typeof initF1Widget    === 'function') initF1Widget();

    // 11. Widget toggles
    initWidgetsToggle();

    // 12. Dock magnification
    initDockEffect();

});

function initNotes() {
    const notesPanel  = document.getElementById('notesPanel');
    const notesBtn    = document.getElementById('notesBtn');
    const notesBackBtn = document.getElementById('notesBackBtn');
    const mainContent = document.getElementById('mainContent');
    const glassRoot   = document.getElementById('glass-root');
    const leftPanel   = document.getElementById('widgetColLeft');
    const rightPanel  = document.getElementById('widgetColRight');

    if (!notesPanel) return;

    let isOpen = false;

    const bgEls = [mainContent, glassRoot, leftPanel, rightPanel];

    const openNotes = () => {
        if (isOpen) return;
        isOpen = true;
        notesPanel.style.pointerEvents = 'auto';
        window._dockState = { activePanel: 'notes', close: closeNotes };
        macOpen(notesPanel, 'notesBtn', bgEls);
        setTimeout(() => window.ZenithNotes?.showGraph(), 420);
    };

    const closeNotes = async () => {
        if (!isOpen) return;
        isOpen = false;
        window._dockState = null;
        window._hideDock?.(false);
        await window.ZenithNotes?.flushSave?.();
        macClose(notesPanel, 'notesBtn', bgEls, () => {
            notesPanel.style.pointerEvents = 'none';
        });
    };

    notesBtn?.addEventListener('click', () => {
        const state = window._dockState;
        if (state?.activePanel === 'notes') { closeNotes(); }
        else if (state?.activePanel) { state.close(); setTimeout(openNotes, 380); }
        else { openNotes(); }
    });
    notesBackBtn?.addEventListener('click', closeNotes);
}

// ---- Dock magnification ----

function initDockEffect() {
    const bar  = document.querySelector('.top-controls');
    if (!bar) return;
    const btns = Array.from(bar.querySelectorAll('.ctrl-btn'));
    if (!btns.length) return;

    const MAX_SCALE = 1.52;
    const H_RANGE   = 72; // px d'influence horizontale depuis le centre du bouton
    const V_RANGE   = 90;  // px sous la barre où l'effet commence à s'appliquer

    let centers = [], naturalW = 44, gap = 12, barRect = null, isActive = false;

    function cacheLayout() {
        btns.forEach(b => { b.style.transition = ''; b.style.transform = ''; });
        barRect = bar.getBoundingClientRect();
        const rects = btns.map(b => b.getBoundingClientRect());
        naturalW = rects[0]?.width  || 44;
        gap      = rects.length > 1 ? rects[1].left - rects[0].right : 12;
        centers  = rects.map(r => r.left + r.width / 2);
    }
    setTimeout(cacheLayout, 150);
    window.addEventListener('resize', () => setTimeout(cacheLayout, 150));

    // Smootherstep C² — transition sans dérivée brusque
    function ss(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

    // Calcule les translateX pour maintenir l'espacement après scale
    function computeTranslations(scales) {
        const n = scales.length;
        const totalMagW  = scales.reduce((s, sc) => s + sc * naturalW, 0) + (n - 1) * gap;
        const groupCenter = (centers[0] + centers[n - 1]) / 2;
        const magnLeft    = groupCenter - totalMagW / 2;
        let x = magnLeft;
        return scales.map((sc, i) => {
            x += sc * naturalW / 2;
            const newCenter = x;
            x += sc * naturalW / 2 + gap;
            return newCenter - centers[i];
        });
    }

    function reset() {
        isActive = false;
        btns.forEach(b => {
            b.style.transition = 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease';
            b.style.transform  = '';
        });
    }

    // ── Dock reveal over full-screen panels ──────────────────────────────────
    let revealedOverPanel = false;

    function revealDock() {
        if (revealedOverPanel) return;
        revealedOverPanel = true;
        bar.style.zIndex = '65';
        window._activatePanelSnapshot?.();
        if (window.gsap) {
            gsap.killTweensOf(bar);
            gsap.fromTo(bar,
                { y: 28, opacity: 0 },
                { y: 0,  opacity: 1, duration: 0.28, ease: 'power3.out' }
            );
        }
    }

    // animate=true  → slide out (user moved mouse away, panel still open)
    // animate=false → instant reset (panel is closing, dock reappears naturally under it)
    function hideDock(animate = true) {
        if (!revealedOverPanel) return;
        revealedOverPanel = false;
        if (!animate || !window.gsap) {
            gsap?.killTweensOf(bar);
            gsap?.set(bar, { clearProps: 'y,opacity' });
            bar.style.zIndex = '';
            window._deactivatePanelSnapshot?.();
        } else {
            gsap.killTweensOf(bar);
            gsap.to(bar, { y: 28, opacity: 0, duration: 0.22, ease: 'power3.in', onComplete: () => {
                bar.style.zIndex = '';
                gsap.set(bar, { clearProps: 'y,opacity' });
                window._deactivatePanelSnapshot?.();
            }});
        }
    }

    // Expose so panel close handlers can call it
    // hideDock(false) = instant reset (panel closing), hideDock(true) = animated (mouse left)
    window._hideDock = hideDock;

    // Close dock when mouse leaves the bar area while revealed
    document.addEventListener('mouseleave', () => { if (revealedOverPanel) hideDock(true); });

    // État partagé mousemove → rAF (évite les DOM-writes à la fréquence souris)
    let rafPending  = false;
    let pendingMx   = 0, pendingMy = 0;
    let needsReset  = false;

    function applyDockFrame() {
        rafPending = false;
        const mx = pendingMx, my = pendingMy;

        // Hot zone panel reveal
        if (window._dockState?.activePanel) {
            const dockLeft  = barRect.left  - 20;
            const dockRight = barRect.right + 20;
            if (my >= window.innerHeight - 10 && mx >= dockLeft && mx <= dockRight) {
                revealDock();
            } else if (revealedOverPanel) {
                const inBar = mx >= barRect.left - 30 && mx <= barRect.right + 30
                           && my >= barRect.top  - 20 && my <= barRect.bottom + 30;
                if (!inBar) hideDock(true);
            }
        } else if (revealedOverPanel) {
            hideDock(true);
        }

        if (needsReset) { reset(); needsReset = false; return; }

        // Proximité verticale
        let vProx = 0;
        if (my >= barRect.top && my <= barRect.bottom) {
            vProx = 1;
        } else if (my > barRect.bottom && my <= barRect.bottom + V_RANGE) {
            vProx = ss(1 - (my - barRect.bottom) / V_RANGE);
        } else if (my >= barRect.top - V_RANGE && my < barRect.top) {
            vProx = ss(1 - (barRect.top - my) / V_RANGE);
        }

        if (vProx <= 0) { if (isActive) reset(); return; }

        isActive = true;
        const scales = centers.map(c => {
            const t = Math.max(0, 1 - Math.abs(mx - c) / H_RANGE);
            const w = ss(t) * ss(t);
            return 1 + (MAX_SCALE - 1) * w * vProx;
        });
        const tx = computeTranslations(scales);

        btns.forEach((btn, i) => {
            btn.style.transition = 'color 0.2s ease';
            btn.style.transform  = `translateX(${tx[i].toFixed(2)}px) scale(${scales[i].toFixed(3)})`;
        });
        // Positions des boutons ont changé → invalider le cache getBCR des glass containers
        window._invalidateGlassPositions?.();
    }

    document.addEventListener('mousemove', e => {
        if (!barRect || !centers.length) return;
        pendingMx = e.clientX;
        pendingMy = e.clientY;

        // Vérification légère hors rAF pour le reset (évite un frame de lag perceptible)
        const my = pendingMy;
        const inRange = (my >= barRect.top - V_RANGE && my <= barRect.bottom + V_RANGE);
        if (!inRange && isActive) needsReset = true;

        if (!rafPending) {
            rafPending = true;
            requestAnimationFrame(applyDockFrame);
        }
    });
}

// ---- Widget toggles ----

function initWidgetsToggle() {
    const btn   = document.getElementById('widgetsBtn');
    const popup = document.getElementById('widgetsPopup');
    if (!btn || !popup) return;

    const WIDGETS = {
        shortcuts: {
            el: () => document.querySelector('.shortcuts-wrapper'),
            key: 'zenithWidget_shortcuts',
        },
        calendar: {
            el: () => document.getElementById('calendarWidget'),
            key: 'zenithWidget_calendar',
        },
        weather: {
            el: () => document.getElementById('weatherWidget'),
            key: 'zenithWidget_weather',
        },
        news: {
            el: () => document.getElementById('newsWidget'),
            key: 'zenithWidget_news',
        },
        market: {
            el: () => document.getElementById('marketWidget'),
            key: 'zenithWidget_market',
        },
        f1: {
            el: () => document.getElementById('f1Widget'),
            key: 'zenithWidget_f1',
        },
    };

    function isEnabled(id) {
        const v = localStorage.getItem(WIDGETS[id].key);
        return v === null ? true : v === '1';
    }

    function setEnabled(id, on) {
        localStorage.setItem(WIDGETS[id].key, on ? '1' : '0');
        applyVisibility(id, on);
        updateToggleUI(id, on);
        // Recalculer les overlays glass si besoin
        if (typeof destroyOverlays === 'function' && typeof buildAndApplyOverlays === 'function') {
            setTimeout(async () => {
                destroyOverlays();
                await buildAndApplyOverlays();
                if (typeof preWarmModalGlass === 'function') await preWarmModalGlass();
            }, 50);
        }
    }

    function applyVisibility(id, on) {
        const el = WIDGETS[id].el();
        if (!el) return;
        el.style.display = on ? '' : 'none';
    }

    function updateToggleUI(id, on) {
        const toggle = popup.querySelector(`.wp-toggle[data-widget="${id}"]`);
        if (toggle) toggle.classList.toggle('on', on);
    }

    // Appliquer l'état sauvegardé au chargement
    Object.keys(WIDGETS).forEach(id => {
        const on = isEnabled(id);
        applyVisibility(id, on);
        updateToggleUI(id, on);
    });

    // Clic sur les toggles
    popup.querySelectorAll('.wp-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = toggle.dataset.widget;
            setEnabled(id, !isEnabled(id));
        });
    });

    // Ouvrir / fermer le popup + activer/désactiver le mode édition widgets
    let open = false;

    function closeWidgetPopup() {
        open = false;
        popup.classList.remove('open');
        btn.classList.remove('active');
        window._setWidgetEditMode?.(false);
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        open = !open;
        popup.classList.toggle('open', open);
        btn.classList.toggle('active', open);
        window._setWidgetEditMode?.(open);
    });

    // Fermer sur clic extérieur SEULEMENT si le mode édition n'est pas actif
    document.addEventListener('click', (e) => {
        if (!open) return;
        if (window._isWidgetEditMode?.()) return; // ne pas fermer pendant le drag
        closeWidgetPopup();
    });

    popup.addEventListener('click', e => e.stopPropagation());
}
