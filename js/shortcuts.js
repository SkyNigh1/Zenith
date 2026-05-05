// ===== SHORTCUTS MODULE =====
// Gestion des raccourcis personnalisés

class ShortcutManager {
    constructor() {
        this.shortcuts = this.loadShortcuts();
        this.modal = document.getElementById('modalOverlay');
        this.form = document.getElementById('shortcutForm');
        this.addBtn = document.getElementById('addShortcutBtn');
        this.closeBtn = document.getElementById('modalClose');
        this.cancelBtn = document.getElementById('btnCancel');
        this.grid = document.getElementById('shortcutsGrid');
        
        if (!this.modal || !this.form || !this.grid) {
            console.warn('Shortcuts: Required elements not found');
            return;
        }
        
        this.initEventListeners();
        this.renderShortcuts();
    }
    
    initEventListeners() {
        this.addBtn?.addEventListener('click', () => this.openModal());
        this.closeBtn?.addEventListener('click', () => this.closeModal());
        this.cancelBtn?.addEventListener('click', () => this.closeModal());
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addShortcut();
        });
    }
    
    loadShortcuts() {
        const stored = localStorage.getItem('shortcuts');
        return stored ? JSON.parse(stored) : [];
    }
    
    saveShortcuts() {
        localStorage.setItem('shortcuts', JSON.stringify(this.shortcuts));
    }
    
    openModal() {
        this.modal.classList.add('active');
        document.getElementById('shortcutName').value = '';
        document.getElementById('shortcutUrl').value = '';
        document.getElementById('shortcutName').focus();
    }
    
    closeModal() {
        if (window.ModalModule?.closeModalWithAnimation) {
            window.ModalModule.closeModalWithAnimation(this.modal);
        } else {
            this.modal.classList.remove('active');
        }
    }
    
    addShortcut() {
        const name = document.getElementById('shortcutName').value.trim();
        let url = document.getElementById('shortcutUrl').value.trim();
        
        // Ajoute https:// si aucun protocole n'est spécifié
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        if (name && url) {
            const shortcut = {
                id: Date.now(),
                name: name,
                url: url,
            };
            
            this.shortcuts.push(shortcut);
            this.saveShortcuts();
            this.renderShortcuts();
            this.closeModal();
        }
    }
    
    deleteShortcut(id) {
        this.shortcuts = this.shortcuts.filter(s => s.id !== id);
        this.saveShortcuts();
        this.renderShortcuts();
    }
    
    getFaviconSources(url) {
        try {
            const { hostname } = new URL(url);
            const rootDomain = hostname.split('.').slice(-2).join('.');
            const wwwDomain = `www.${rootDomain}`;
            const sources = [
                `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
                `https://${hostname}/favicon.ico`,
                `https://logo.clearbit.com/${hostname}`,
            ];
            if (rootDomain !== hostname) {
                sources.push(
                    `https://www.google.com/s2/favicons?domain=${rootDomain}&sz=64`,
                    `https://${rootDomain}/favicon.ico`,
                    `https://logo.clearbit.com/${rootDomain}`,
                );
            }
            if (hostname !== wwwDomain && rootDomain !== wwwDomain) {
                sources.push(
                    `https://www.google.com/s2/favicons?domain=${wwwDomain}&sz=64`,
                    `https://${wwwDomain}/favicon.ico`,
                    `https://logo.clearbit.com/${wwwDomain}`,
                );
            }
            return sources;
        } catch (e) {
            return [];
        }
    }

    getFaviconUrl(url) {
        const sources = this.getFaviconSources(url);
        return sources[0] ?? 'assets/img/planet.svg';
    }

    renderShortcuts() {
        this.grid.innerHTML = '';

        this.shortcuts.forEach(shortcut => {
            const item = document.createElement('a');
            item.className = 'shortcut-item';
            item.href = shortcut.url;
            item.target = '_blank';

            const icon = document.createElement('img');
            icon.className = 'shortcut-icon';

            const fallbacks = [...this.getFaviconSources(shortcut.url), 'assets/img/planet.svg'];
            let fallbackIndex = 0;
            const tryNext = () => {
                icon.src = fallbacks[fallbackIndex++] ?? 'assets/img/planet.svg';
            };
            icon.onerror = tryNext;
            icon.onload = () => {
                if (icon.naturalWidth <= 16 && icon.naturalHeight <= 16) tryNext();
            };
            tryNext();
            
            const name = document.createElement('span');
            name.className = 'shortcut-name';
            name.textContent = shortcut.name;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'shortcut-delete';
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
            deleteBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.deleteShortcut(shortcut.id);
            };
            
            item.appendChild(deleteBtn);
            item.appendChild(icon);
            item.appendChild(name);
            this.grid.appendChild(item);
        });
    }
}

// Export et initialisation
window.ShortcutsModule = {
    init: () => {
        window.shortcutManager = new ShortcutManager();
    }
};
