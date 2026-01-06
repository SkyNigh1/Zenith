// ===== CUSTOMIZE MODAL MODULE =====
// Modale de personnalisation des thèmes, couleurs et animations

function initCustomizeModal() {
    const customizeBtn = document.getElementById('customizeBtn');
    const customizeModal = document.getElementById('customizeModalOverlay');
    const customizeModalClose = document.getElementById('customizeModalClose');
    
    const themeDarkBtn = document.getElementById('themeDark');
    const themeLightBtn = document.getElementById('themeLight');
    const accentColorInput = document.getElementById('accentColor');
    const accentColorLabel = document.getElementById('accentColorLabel');
    const animationTypeSelect = document.getElementById('animationTypeSelect');
    const animationColor1Input = document.getElementById('animationColor1');
    const color1ValueLabel = document.getElementById('color1ValueLabel');
    const animationColor2Input = document.getElementById('animationColor2');
    const color2ValueLabel = document.getElementById('color2ValueLabel');
    const resetSettingsBtn = document.getElementById('resetSettings');
    const animationColorsSection = document.getElementById('animationColorsSection');
    const customImageInput = document.getElementById('customImageInput');
    
    // eCalendar elements
    const ecalendarSection = document.getElementById('ecalendarSection');
    const ecalendarUrlInput = document.getElementById('ecalendarUrl');
    const ecalendarSaveBtn = document.getElementById('ecalendarSaveBtn');
    
    if (!customizeBtn || !customizeModal) return;
    
    const settings = window.SettingsModule;
    if (!settings) {
        console.warn('SettingsModule not found');
        return;
    }
    
    const currentSettings = settings.loadSettings();

    // Helper to toggle color section
    const toggleColorSection = (type) => {
        if (animationColorsSection) {
            if (type === 'galaxy' || type === 'medusa') {
                animationColorsSection.style.display = 'block';
            } else {
                animationColorsSection.style.display = 'none';
            }
        }
    };

    // Helper to toggle eCalendar section based on calendar enabled state
    const updateEcalendarSection = () => {
        if (ecalendarSection) {
            const zenithSettings = JSON.parse(localStorage.getItem('zenithSettings') || '{}');
            if (zenithSettings.calendarEnabled) {
                ecalendarSection.style.display = 'block';
            } else {
                ecalendarSection.style.display = 'none';
            }
        }
    };
    
    // Initialiser les valeurs des inputs
    if (accentColorInput) {
        accentColorInput.value = currentSettings.accentColor;
        accentColorLabel.textContent = currentSettings.accentColor;
    }
    
    if (animationTypeSelect) {
        animationTypeSelect.value = currentSettings.animationType || 'galaxy';
        toggleColorSection(currentSettings.animationType || 'galaxy');
    }
    
    if (animationColor1Input) {
        animationColor1Input.value = currentSettings.animationColor1;
        color1ValueLabel.textContent = currentSettings.animationColor1;
    }
    
    if (animationColor2Input) {
        animationColor2Input.value = currentSettings.animationColor2;
        color2ValueLabel.textContent = currentSettings.animationColor2;
    }

    // Initialize eCalendar URL
    if (ecalendarUrlInput) {
        const zenithSettings = JSON.parse(localStorage.getItem('zenithSettings') || '{}');
        ecalendarUrlInput.value = zenithSettings.ecalendarUrl || '';
    }
    
    // Marquer le thème actif
    if (currentSettings.theme === 'dark') {
        themeDarkBtn?.classList.add('active');
    } else {
        themeLightBtn?.classList.add('active');
    }
    
    // Fonction publique pour mettre à jour l'UI du thème (appelée depuis browser-theme-sync)
    window.updateThemeUI = function(theme) {
        if (theme === 'dark') {
            themeDarkBtn?.classList.add('active');
            themeLightBtn?.classList.remove('active');
        } else {
            themeLightBtn?.classList.add('active');
            themeDarkBtn?.classList.remove('active');
        }
    };
    
    // Ouvrir la modale
    customizeBtn.addEventListener('click', () => {
        updateEcalendarSection();
        customizeModal.classList.add('active');
    });
    
    // Fermer la modale
    function closeCustomizeModal() {
        if (window.ModalModule?.closeModalWithAnimation) {
            window.ModalModule.closeModalWithAnimation(customizeModal);
        } else {
            customizeModal.classList.remove('active');
        }
    }
    
    customizeModalClose?.addEventListener('click', closeCustomizeModal);
    
    customizeModal.addEventListener('click', (e) => {
        if (e.target === customizeModal) {
            closeCustomizeModal();
        }
    });

    // Save eCalendar URL
    ecalendarSaveBtn?.addEventListener('click', () => {
        const url = ecalendarUrlInput?.value?.trim() || '';
        if (window.CalendarModule) {
            window.CalendarModule.setEcalendarUrl(url);
        }
        // Visual feedback
        ecalendarSaveBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            ecalendarSaveBtn.innerHTML = '<i class="fas fa-save"></i>';
        }, 1500);
    });

    // Also save on Enter key
    ecalendarUrlInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            ecalendarSaveBtn?.click();
        }
    });
    
    // Changer le thème
    themeDarkBtn?.addEventListener('click', () => {
        themeDarkBtn.classList.add('active');
        themeLightBtn?.classList.remove('active');
        currentSettings.theme = 'dark';
        settings.applyTheme('dark');
        settings.saveSettings(currentSettings);
    });
    
    themeLightBtn?.addEventListener('click', () => {
        themeLightBtn.classList.add('active');
        themeDarkBtn?.classList.remove('active');
        currentSettings.theme = 'light';
        settings.applyTheme('light');
        settings.saveSettings(currentSettings);
    });
    
    // Changer la couleur d'accentuation
    accentColorInput?.addEventListener('input', (e) => {
        const color = e.target.value;
        accentColorLabel.textContent = color;
        currentSettings.accentColor = color;
        settings.applyAccentColor(color);
        settings.saveSettings(currentSettings);
    });
    
    // Changer le type d'animation
    animationTypeSelect?.addEventListener('change', async (e) => {
        const newType = e.target.value;
        
        if (newType === 'custom') {
            customImageInput.click();
            // Reset select to previous value if user cancels (optional, but good UX)
            // For now we just wait for input change
            return;
        }

        currentSettings.animationType = newType;
        settings.saveSettings(currentSettings);
        toggleColorSection(newType);
        
        // Reload the page to properly switch animation
        // This avoids Three.js conflicts between Galaxy and Medusa
        window.location.reload();
    });

    // Handle Custom Image Upload
    customImageInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const maxSize = 20 * 1024 * 1024; // 20 Mo
            if (file.size > maxSize) {
                alert("L'image est trop volumineuse (max 20 Mo). Choisissez une image plus légère.");
                animationTypeSelect.value = currentSettings.animationType;
                return;
            }
            // Stockage dans IndexedDB
            const dbName = 'ZenithCustomBgDB';
            const storeName = 'backgrounds';
            const request = indexedDB.open(dbName, 1);
            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName);
                }
            };
            request.onsuccess = function(event) {
                const db = event.target.result;
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                // Supprimer l'ancienne image avant d'enregistrer la nouvelle
                const deleteRequest = store.delete('customBg');
                deleteRequest.onsuccess = function() {
                    // Ensuite, enregistrer la nouvelle image
                    store.put(file, 'customBg');
                };
                deleteRequest.onerror = function() {
                    // Même si la suppression échoue, on tente d'enregistrer la nouvelle image
                    store.put(file, 'customBg');
                };
                transaction.oncomplete = function() {
                    currentSettings.animationType = 'custom';
                    settings.saveSettings(currentSettings);
                    toggleColorSection('custom');
                    window.location.reload();
                };
                transaction.onerror = function() {
                    alert("Erreur lors de l'enregistrement de l'image dans IndexedDB.");
                };
            };
            request.onerror = function() {
                alert("Impossible d'accéder à IndexedDB.");
            };
        } else {
            // User cancelled, revert select if needed
            animationTypeSelect.value = currentSettings.animationType;
        }
    });
    
    // Changer les couleurs de l'animation
    animationColor1Input?.addEventListener('input', (e) => {
        const color = e.target.value;
        color1ValueLabel.textContent = color;
        currentSettings.animationColor1 = color;
        settings.applyAnimationColors(color, currentSettings.animationColor2);
        settings.saveSettings(currentSettings);
    });
    
    animationColor2Input?.addEventListener('input', (e) => {
        const color = e.target.value;
        color2ValueLabel.textContent = color;
        currentSettings.animationColor2 = color;
        settings.applyAnimationColors(currentSettings.animationColor1, color);
        settings.saveSettings(currentSettings);
    });
    
    // Réinitialiser les paramètres
    resetSettingsBtn?.addEventListener('click', async () => {
        const defaultSettings = settings.getDefaultSettings();
        
        // Réinitialiser les valeurs
        Object.assign(currentSettings, defaultSettings);
        settings.saveSettings(currentSettings);
        
        // Appliquer les paramètres par défaut
        settings.applyTheme(defaultSettings.theme);
        settings.applyAccentColor(defaultSettings.accentColor);
        settings.applyAnimationColors(defaultSettings.animationColor1, defaultSettings.animationColor2);
        
        // Changer l'animation si nécessaire
        if (window.animationManager && defaultSettings.animationType !== window.animationManager.getCurrentType()) {
            // Reload page to properly switch animation
            window.location.reload();
            return;
        }
        
        // Mettre à jour l'interface
        accentColorInput.value = defaultSettings.accentColor;
        accentColorLabel.textContent = defaultSettings.accentColor;
        animationTypeSelect.value = defaultSettings.animationType;
        animationColor1Input.value = defaultSettings.animationColor1;
        color1ValueLabel.textContent = defaultSettings.animationColor1;
        animationColor2Input.value = defaultSettings.animationColor2;
        color2ValueLabel.textContent = defaultSettings.animationColor2;
        
        if (defaultSettings.theme === 'dark') {
            themeDarkBtn?.classList.add('active');
            themeLightBtn?.classList.remove('active');
        } else {
            themeLightBtn?.classList.add('active');
            themeDarkBtn?.classList.remove('active');
        }
    });
}

// Export
window.CustomizeModalModule = {
    initCustomizeModal
};
