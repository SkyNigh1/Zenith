// ===== SHORTCUTS MODULE (new design) =====
// Raccourcis avec icônes carrées + raccourcis par défaut

const DEFAULT_SHORTCUTS = [
    { id: 1, name: 'Google',   url: 'https://google.com' },
    { id: 2, name: 'YouTube',  url: 'https://youtube.com' },
    { id: 3, name: 'Notion',   url: 'https://notion.so' },
    { id: 4, name: 'GitHub',   url: 'https://github.com' },
    { id: 5, name: 'Behance',  url: 'https://behance.net' },
    { id: 6, name: 'Dribbble', url: 'https://dribbble.com' },
];

class NewShortcutManager {
    constructor() {
        this.shortcuts = this.loadShortcuts();
        this.modal = document.getElementById('modalOverlay');
        this.form = document.getElementById('shortcutForm');
        this.addBtn = document.getElementById('addShortcutBtn');
        this.closeBtn = document.getElementById('modalClose');
        this.cancelBtn = document.getElementById('btnCancel');
        this.grid = document.getElementById('shortcutsGrid');

        if (!this.modal || !this.form || !this.grid) return;

        this.initListeners();
        this.render();
    }

    initListeners() {
        this.addBtn?.addEventListener('click', () => this.openModal());
        this.closeBtn?.addEventListener('click', () => this.closeModal());
        this.cancelBtn?.addEventListener('click', () => this.closeModal());

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addShortcut();
        });
    }

    loadShortcuts() {
        const stored = localStorage.getItem('zenithShortcutsNew');
        if (stored) return JSON.parse(stored);
        // First visit: seed default shortcuts
        const defaults = DEFAULT_SHORTCUTS.map(s => ({ ...s, id: Date.now() + Math.random() }));
        localStorage.setItem('zenithShortcutsNew', JSON.stringify(defaults));
        return defaults;
    }

    save() {
        localStorage.setItem('zenithShortcutsNew', JSON.stringify(this.shortcuts));
    }

    modalCardOrigin() {
        const btn  = document.getElementById('addShortcutBtn');
        const card = this.modal?.querySelector('.modal-card');
        if (!btn || !card) return '50% 100%';
        const br = btn.getBoundingClientRect();
        const cr = card.getBoundingClientRect();
        const ox = ((br.left + br.width  / 2) - cr.left) / cr.width  * 100;
        const oy = ((br.top  + br.height / 2) - cr.top)  / cr.height * 100;
        return `${ox}% ${oy}%`;
    }

    openModal() {
        this.modal.classList.add('active');
        this.modal.style.pointerEvents = 'auto';
        if (window.gsap) gsap.fromTo(this.modal, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
        else this.modal.style.opacity = '1';
        requestAnimationFrame(() => {
            const card = this.modal.querySelector('.modal-card');
            if (!card || !window.gsap) return;
            const cg = window._glassCache?.['modalOverlay'];
            if (cg) {
                cg.element.style.opacity = '';
                cg.stopRenderLoop?.();
                cg.render?.();
            }
            const origin = this.modalCardOrigin();
            gsap.fromTo(card,
                { scale: 0.04, transformOrigin: origin },
                { scale: 1,    transformOrigin: origin, duration: 0.4, ease: 'expo.out',
                  onComplete: () => { if (cg) cg.startRenderLoop?.(); }
                }
            );
        });
        document.getElementById('shortcutName').value = '';
        document.getElementById('shortcutUrl').value = '';
        setTimeout(() => document.getElementById('shortcutName').focus(), 420);
    }

    closeModal() {
        const card = this.modal.querySelector('.modal-card');
        const origin = card ? this.modalCardOrigin() : '50% 100%';
        const cg = window._glassCache?.['modalOverlay'];
        const finish = () => {
            this.modal.classList.remove('active');
            this.modal.style.pointerEvents = 'none';
            if (cg) cg.element.style.opacity = '0';
            if (card && window.gsap) gsap.set(card, { scale: 1, clearProps: 'transformOrigin' });
        };
        if (window.gsap) {
            if (cg) cg.stopRenderLoop?.();
            if (card) gsap.to(card, { scale: 0.04, transformOrigin: origin, duration: 0.22, ease: 'expo.in' });
            gsap.to(this.modal, { opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: finish });
        } else { finish(); }
    }

    addShortcut() {
        const name = document.getElementById('shortcutName').value.trim();
        let url = document.getElementById('shortcutUrl').value.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
        if (!name || !url) return;

        this.shortcuts.push({ id: Date.now(), name, url });
        this.save();
        this.render();
        this.closeModal();
    }

    deleteShortcut(id) {
        this.shortcuts = this.shortcuts.filter(s => s.id !== id);
        this.save();
        this.render();
    }

    getFaviconUrl(url) {
        try {
            const { hostname } = new URL(url);
            return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
        } catch { return 'assets/img/planet.svg'; }
    }

    getFaviconFallbacks(url) {
        try {
            const { hostname } = new URL(url);
            return [
                `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
                `https://${hostname}/favicon.ico`,
                `https://logo.clearbit.com/${hostname}`,
                'assets/img/planet.svg'
            ];
        } catch { return ['assets/img/planet.svg']; }
    }

    render() {
        if (!this.grid) return;
        this.grid.innerHTML = '';

        this.shortcuts.forEach(shortcut => {
            const item = document.createElement('a');
            item.className = 'shortcut-item';
            item.href = shortcut.url;
            item.target = '_blank';
            item.rel = 'noopener noreferrer';

            const iconWrap = document.createElement('div');
            iconWrap.className = 'shortcut-icon-wrap';

            const img = document.createElement('img');
            img.className = 'shortcut-icon';
            img.alt = shortcut.name;

            const fallbacks = this.getFaviconFallbacks(shortcut.url);
            let idx = 0;
            const tryNext = () => {
                if (idx < fallbacks.length) img.src = fallbacks[idx++];
                else img.src = 'assets/img/planet.svg';
            };
            img.onerror = tryNext;
            img.onload = () => {
                if (img.naturalWidth <= 16 && img.naturalHeight <= 16) tryNext();
            };
            tryNext();

            iconWrap.appendChild(img);

            const nameEl = document.createElement('span');
            nameEl.className = 'shortcut-name';
            nameEl.textContent = shortcut.name;

            const delBtn = document.createElement('button');
            delBtn.className = 'shortcut-delete';
            delBtn.innerHTML = '<i class="fas fa-times"></i>';
            delBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.deleteShortcut(shortcut.id);
            };

            item.appendChild(delBtn);
            item.appendChild(iconWrap);
            item.appendChild(nameEl);
            this.grid.appendChild(item);
        });
    }
}

window.ShortcutManager = new NewShortcutManager();
