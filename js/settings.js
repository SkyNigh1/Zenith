// ===== SETTINGS MODULE =====
// Gestion des paramètres de personnalisation

// Paramètres par défaut
const defaultSettings = {
    theme: 'dark',
    accentColor: '#ffffff',
    animationType: 'unsplash-landscape',
    animationColor1: '#ff6030',
    animationColor2: '#1b3984'
};

// Charger les paramètres
function loadSettings() {
    const stored = localStorage.getItem('zenithSettings');
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : { ...defaultSettings };
}

// Sauvegarder les paramètres
function saveSettings(settings) {
    localStorage.setItem('zenithSettings', JSON.stringify(settings));
}

// Appliquer le thème
function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'light') {
        root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.15)');
        root.style.setProperty('--glass-bg-hover', 'rgba(255, 255, 255, 0.25)');
        root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.3)');
        root.style.setProperty('--text-primary', 'rgba(255, 255, 255, 0.95)');
    } else {
        root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.08)');
        root.style.setProperty('--glass-bg-hover', 'rgba(255, 255, 255, 0.15)');
        root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.15)');
        root.style.setProperty('--text-primary', 'rgba(255, 255, 255, 0.9)');
    }
}

// Appliquer la couleur d'accentuation
function applyAccentColor(color) {
    // Convertir hex en rgba
    const hexToRgba = (hex, alpha = 0.1) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    document.documentElement.style.setProperty('--accent-color', color);
    document.documentElement.style.setProperty('--accent-color-alpha', hexToRgba(color, 0.1));
}

// Appliquer les couleurs de l'animation
function applyAnimationColors(color1, color2) {
    if (window.animationManager) {
        window.animationManager.updateColors(color1, color2);
    }
}

// Initialiser les paramètres au chargement
function initSettings() {
    const currentSettings = loadSettings();
    applyTheme(currentSettings.theme);
    applyAccentColor(currentSettings.accentColor);
}

// Fonction utilitaire pour les modales
function closeModalWithAnimation(modalElement) {
    modalElement.classList.add('closing');
    setTimeout(() => {
        modalElement.classList.remove('active', 'closing');
    }, 300);
}

// Export
window.SettingsModule = {
    loadSettings,
    saveSettings,
    applyTheme,
    applyAccentColor,
    applyAnimationColors,
    initSettings,
    getDefaultSettings: () => ({ ...defaultSettings })
};

// Export pour les animations de modale
window.ModalModule = {
    closeModalWithAnimation
};
