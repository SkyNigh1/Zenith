// ===== MAIN ENTRY POINT =====
// Point d'entrée principal de l'application Zenith

// Instance globale du gestionnaire d'animations
window.animationManager = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialiser la traduction
    if (window.TranslationModule) {
        window.TranslationModule.translatePage();
    }
    
    // 2. Initialiser les paramètres (thème, couleurs)
    if (window.SettingsModule) {
        window.SettingsModule.initSettings();
    }
    
    // 3. Initialiser le gestionnaire d'animations
    const settings = window.SettingsModule?.loadSettings() || { animationType: 'galaxy' };
    const canvas = document.getElementById('galaxyCanvas');
    
    if (canvas && window.AnimationManager) {
        window.animationManager = new AnimationManager();
        await window.animationManager.init(canvas, settings.animationType);
        
        // Appliquer les couleurs de l'animation
        if (settings.animationColor1 && settings.animationColor2) {
            window.animationManager.updateColors(settings.animationColor1, settings.animationColor2);
        }
    }
    
    // 4. Initialiser l'horloge
    if (window.ClockModule) {
        window.ClockModule.initClock();
    }
    
    // 5. Initialiser la recherche
    if (window.SearchModule) {
        window.SearchModule.initSearch();
    }
    
    // 6. Initialiser les raccourcis
    if (window.ShortcutsModule) {
        window.ShortcutsModule.init();
    }
    
    // 7. Initialiser la modale d'informations
    if (window.InfoModalModule) {
        window.InfoModalModule.initInfoModal();
    }
    
    // 8. Initialiser la modale de personnalisation
    if (window.CustomizeModalModule) {
        window.CustomizeModalModule.initCustomizeModal();
    }

    // 9. Initialiser la météo
    if (window.WeatherModule) {
        window.WeatherModule.init();
    }

    // 10. Initialiser les notes
    if (window.NotesModule) {
        window.NotesModule.init();
    }

    // 11. Initialiser le calendrier
    if (window.CalendarModule) {
        window.CalendarModule.init();
    }
    
    // 12. Initialiser le menu
    const menuBtn = document.getElementById('menuBtn');
    const menuDropdown = document.getElementById('menuDropdown');
    
    if (menuBtn && menuDropdown) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!menuDropdown.contains(e.target) && !menuBtn.contains(e.target)) {
                menuDropdown.classList.remove('active');
            }
        });

        // Close menu when an item is clicked
        const menuItems = menuDropdown.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                menuDropdown.classList.remove('active');
            });
        });
    }
    
    console.log('Zenith initialized successfully');
});
