// Preload script pour les webviews
const { ipcRenderer, contextBridge } = require('electron');

// Capturer F12 dans la webview et envoyer au renderer parent
window.addEventListener('keydown', (e) => {
  if (e.key === 'F12') {
    e.preventDefault();
    e.stopPropagation();
    // Envoyer au renderer parent via sendToHost
    ipcRenderer.sendToHost('toggle-devtools');
  }
}, true);

// Exposer l'API pour la page d'accueil via contextBridge
contextBridge.exposeInMainWorld('zenithHome', {
  // Obtenir le thème actuel du navigateur
  getTheme: () => ipcRenderer.invoke('get-browser-theme'),
  
  // Écouter les changements de thème
  onThemeChange: (callback) => {
    ipcRenderer.on('theme-changed', (event, theme) => callback(theme));
  }
});
