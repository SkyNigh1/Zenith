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

    openModal() {
        this.modal.classList.add('active');
        document.getElementById('shortcutName').value = '';
        document.getElementById('shortcutUrl').value = '';
        setTimeout(() => document.getElementById('shortcutName').focus(), 50);
    }

    closeModal() {
        this.modal.classList.remove('active');
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
