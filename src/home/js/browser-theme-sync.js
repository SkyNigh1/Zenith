/**
 * Browser Theme Integration
 * Synchronise le thème de la page d'accueil avec le navigateur
 */

(async function() {
  // Attendre que l'API soit disponible
  if (!window.zenithHome) {
    console.log('[Zenith Home] Mode standalone - pas de synchronisation de thème');
    return;
  }

  // Attendre que SettingsModule soit disponible
  let attempts = 0;
  while (!window.SettingsModule && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (!window.SettingsModule) {
    console.error('[Zenith Home] SettingsModule non disponible');
    return;
  }

  // Fonction pour appliquer le thème du navigateur à la page d'accueil
  function applyBrowserTheme(browserTheme) {
    try {
      // Charger les paramètres actuels de la page d'accueil
      const settings = window.SettingsModule.loadSettings();
      
      // Mettre à jour le thème pour correspondre au navigateur
      settings.theme = browserTheme;
      
      // Sauvegarder et appliquer
      window.SettingsModule.saveSettings(settings);
      window.SettingsModule.applyTheme(browserTheme);
      
      // Mettre à jour l'UI de la modale de personnalisation si elle existe
      if (typeof window.updateThemeUI === 'function') {
        window.updateThemeUI(browserTheme);
      }
      
      console.log(`[Zenith Home] Thème synchronisé: ${browserTheme}`);
    } catch (error) {
      console.error('[Zenith Home] Erreur lors de l\'application du thème:', error);
    }
  }

  try {
    // Obtenir le thème initial du navigateur
    const initialTheme = await window.zenithHome.getTheme();
    console.log(`[Zenith Home] Thème initial reçu: ${initialTheme}`);
    applyBrowserTheme(initialTheme);

    // Écouter les changements de thème du navigateur
    window.zenithHome.onThemeChange((newTheme) => {
      console.log(`[Zenith Home] Changement de thème reçu: ${newTheme}`);
      applyBrowserTheme(newTheme);
    });
  } catch (error) {
    console.error('[Zenith Home] Erreur lors de la synchronisation du thème:', error);
  }
})();
