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
const DEFAULT_BG_IMAGE_PATH = 'ChatGPT Image 5 mai 2026, 14_45_44.png';

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
    const btn = document.getElementById('imageBtn');
    if (!btn) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png, image/jpeg, image/webp, image/gif';
    input.style.display = 'none';
    document.body.appendChild(input);
    
    btn.addEventListener('click', () => input.click());
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            const settings = JSON.parse(localStorage.getItem('zenithSettings') || '{}');
            settings.customBackgroundDataUrl = dataUrl;
            try {
                localStorage.setItem('zenithSettings', JSON.stringify(settings));
                loadBackground();
            } catch (err) {
                alert("L'image est trop volumineuse pour être sauvegardée dans le navigateur (limite souvent à 5MB).");
            }
        };
        reader.readAsDataURL(file);
    });
}

// Parallax doux sur fond
function initParallax() {
    const bg = document.getElementById('backgroundImage');
    if (!bg) return;

    let target = { x: 0, y: 0 };
    let current = { x: 0, y: 0 };

    document.addEventListener('mousemove', (e) => {
        const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        target.x = ((e.clientX - cx) / cx) * 10;
        target.y = ((e.clientY - cy) / cy) * 10;
    });

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

    const closeModal = () => {
        overlay.classList.remove('active');
        const url = icsInput?.value.trim() || '';
        if (window.CalendarWidget) window.CalendarWidget.setEcalendarUrl(url);
    };

    openBtn?.addEventListener('click', () => {
        renderGroqKeys();
        overlay.classList.add('active');
    });
    closeBtn?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    icsSaveBtn?.addEventListener('click', () => {
        const url = icsInput?.value.trim() || '';
        if (window.CalendarWidget) window.CalendarWidget.setEcalendarUrl(url);
        overlay.classList.remove('active');
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
}

// Accessible globalement pour les messages d'erreur inline du chat
window.openSettings = () => {
    const overlay = document.getElementById('customizeModalOverlay');
    if (overlay) { renderGroqKeys(); overlay.classList.add('active'); }
};

// ---- Chat panel (transitions + input) ----
function initChat() {
    const chatPanel   = document.getElementById('chatPanel');
    const mainContent = document.getElementById('mainContent');
    const leftPanel   = document.querySelector('.left-panel');
    const rightPanel  = document.querySelector('.right-panel');
    const scrollHint  = document.getElementById('scrollHint');
    const backBtn     = document.getElementById('chatBackBtn');
    const sendBtn     = document.getElementById('chatSendBtn');
    const textarea    = document.getElementById('chatInput');
    const clearBtn    = document.getElementById('newConvBtn');

    if (!chatPanel) return;

    let isOpen = false;

    const openChat = () => {
        if (isOpen) return;
        isOpen = true;
        chatPanel.style.pointerEvents = 'auto';

        // Sync le rendu + sidebar + état du bouton
        window.ZenithAI?._render();
        window.ZenithAI?.renderSidebar();
        syncSendBtn();

        if (window.gsap) {
            gsap.to(chatPanel, { y: '0%', duration: 0.45, ease: 'power3.out' });
            gsap.to([mainContent, leftPanel, rightPanel, scrollHint].filter(Boolean),
                { opacity: 0, duration: 0.3, ease: 'power2.out' });
        } else {
            chatPanel.style.transform = 'translateY(0%)';
        }

        setTimeout(() => textarea?.focus(), 460);
    };

    const closeChat = () => {
        if (!isOpen) return;
        isOpen = false;
        chatPanel.style.pointerEvents = 'none';

        if (window.gsap) {
            gsap.to(chatPanel, { y: '100%', duration: 0.45, ease: 'power3.in' });
            gsap.to([mainContent, leftPanel, rightPanel, scrollHint].filter(Boolean),
                { opacity: 1, duration: 0.35, ease: 'power2.out', delay: 0.15 });
        } else {
            chatPanel.style.transform = 'translateY(100%)';
        }
    };

    scrollHint?.addEventListener('click', openChat);

    // Wheel down sur homepage → ouvrir ; wheel up en haut du chat → fermer
    const chatMessages = document.getElementById('chatMessages');
    document.addEventListener('wheel', (e) => {
        if (!isOpen && e.deltaY > 30) {
            openChat();
        } else if (isOpen && e.deltaY < -30 && chatMessages && chatMessages.scrollTop === 0) {
            closeChat();
        }
    }, { passive: true });

    // Touch swipe up → ouvrir ; swipe down en haut du chat → fermer
    let touchStartY = 0;
    document.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
    document.addEventListener('touchend', (e) => {
        const dy = touchStartY - e.changedTouches[0].clientY;
        if (!isOpen && dy > 60) openChat();
        else if (isOpen && dy < -60 && chatMessages && chatMessages.scrollTop === 0) closeChat();
    }, { passive: true });

    backBtn?.addEventListener('click', closeChat);

    // Textarea auto-resize + send button state
    const syncSendBtn = () => {
        if (!sendBtn || !textarea) return;
        const noKey = !window.ZenithAI?.keys.hasKeys();
        sendBtn.disabled = textarea.value.trim() === '' || window.ZenithAI?.streaming || noKey;
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
        if (!text || window.ZenithAI?.streaming) return;
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

});
