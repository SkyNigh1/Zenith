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
    const bg = document.getElementById('backgroundImage');
    if (!bg) return;

    let target = { x: 0, y: 0 };
    let current = { x: 0, y: 0 };

    // Parallax désactivé : le glass snapshot est statique (html2canvas),
    // bouger le fond créerait un décalage visible entre le fond et le reflet dans le glass.
    document.addEventListener('mousemove', () => {});

    const tick = () => {
        const ease = 0.03;
        current.x += (target.x - current.x) * ease;
        current.y += (target.y - current.y) * ease;
        bg.style.transform = `translate(${current.x}px, ${current.y}px)`;
        requestAnimationFrame(tick);
    };
    tick();
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
    const leftPanel   = document.querySelector('.left-panel');
    const rightPanel  = document.querySelector('.right-panel');
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

        window.ZenithAI?._render();
        window.ZenithAI?.renderSidebar();
        syncSendBtn();

        macOpen(chatPanel, 'chatBtn', bgEls);
        setTimeout(() => textarea?.focus(), 420);
    };

    const closeChat = () => {
        if (!isOpen) return;
        isOpen = false;
        macClose(chatPanel, 'chatBtn', bgEls, () => {
            chatPanel.style.pointerEvents = 'none';
        });
    };

    document.getElementById('chatBtn')?.addEventListener('click', openChat);

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

    // 8. Chat IA
    initChat();
    window.ZenithAI?._render(); // état initial correct dès le chargement

    // 9. Notes
    initNotes();

});

function initNotes() {
    const notesPanel  = document.getElementById('notesPanel');
    const notesBtn    = document.getElementById('notesBtn');
    const notesBackBtn = document.getElementById('notesBackBtn');
    const mainContent = document.getElementById('mainContent');
    const glassRoot   = document.getElementById('glass-root');
    const leftPanel   = document.querySelector('.left-panel');
    const rightPanel  = document.querySelector('.right-panel');

    if (!notesPanel) return;

    let isOpen = false;

    const bgEls = [mainContent, glassRoot, leftPanel, rightPanel];

    const openNotes = () => {
        if (isOpen) return;
        isOpen = true;
        notesPanel.style.pointerEvents = 'auto';
        macOpen(notesPanel, 'notesBtn', bgEls);
        setTimeout(() => window.ZenithNotes?.showGraph(), 420);
    };

    const closeNotes = async () => {
        if (!isOpen) return;
        isOpen = false;
        await window.ZenithNotes?.flushSave?.();
        macClose(notesPanel, 'notesBtn', bgEls, () => {
            notesPanel.style.pointerEvents = 'none';
        });
    };

    notesBtn?.addEventListener('click', openNotes);
    notesBackBtn?.addEventListener('click', closeNotes);
}
