const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Exposer le chemin du webview-preload pour le renderer
const webviewPreloadPath = path.join(__dirname, 'webview-preload.js');

contextBridge.exposeInMainWorld('zenithAPI', {
  webviewPreloadPath: webviewPreloadPath,
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  getAdBlockerStatus: () => ipcRenderer.invoke('get-adblocker-status'),
  toggleAdBlocker: () => ipcRenderer.invoke('toggle-adblocker'),
  getCookies: (url) => ipcRenderer.invoke('get-cookies', url),
  clearCookies: () => ipcRenderer.invoke('clear-cookies'),
  getThirdPartyCookiesBlocked: () => ipcRenderer.invoke('get-third-party-cookies-blocked'),
  toggleThirdPartyCookies: () => ipcRenderer.invoke('toggle-third-party-cookies'),
  getDefaultPage: () => ipcRenderer.invoke('get-default-page'),
  clearBrowsingData: () => ipcRenderer.invoke('clear-browsing-data'),
  onShortcut: (callback) => ipcRenderer.on('shortcut', (e, action) => callback(action)),
  
  // Système de permissions
  getSitePermissions: (origin) => ipcRenderer.invoke('get-site-permissions', origin),
  getAllPermissions: () => ipcRenderer.invoke('get-all-permissions'),
  setSitePermission: (origin, permission, value) => ipcRenderer.invoke('set-site-permission', { origin, permission, value }),
  removeSitePermissions: (origin) => ipcRenderer.invoke('remove-site-permissions', origin),
  clearAllPermissions: () => ipcRenderer.invoke('clear-all-permissions'),
  checkPermission: (origin, permission) => ipcRenderer.invoke('check-permission', { origin, permission }),
  requestPermission: (origin, permission, permissionLabel) => ipcRenderer.invoke('request-permission', { origin, permission, permissionLabel }),
  onPermissionRequest: (callback) => ipcRenderer.on('permission-request', (e, data) => callback(data)),
  sendPermissionResponse: (origin, permission, granted) => ipcRenderer.send('permission-response', { origin, permission, granted }),
  
  // Thème du navigateur pour la page d'accueil
  getBrowserTheme: () => ipcRenderer.invoke('get-browser-theme'),
  setBrowserTheme: (theme) => ipcRenderer.send('set-browser-theme', theme),
  
  // DevTools intégrés avec BrowserView
  openDevToolsInPanel: (targetWebContentsId, bounds) => 
    ipcRenderer.invoke('open-devtools-in-panel', { targetWebContentsId, bounds }),
  closeDevToolsPanel: (webContentsId) => 
    ipcRenderer.invoke('close-devtools-panel', { webContentsId }),
  resizeDevToolsPanel: (bounds) => 
    ipcRenderer.invoke('resize-devtools-panel', { bounds }),
  
  // Système de téléchargements
  getDownloads: () => ipcRenderer.invoke('get-downloads'),
  pauseDownload: (id) => ipcRenderer.invoke('pause-download', id),
  resumeDownload: (id) => ipcRenderer.invoke('resume-download', id),
  cancelDownload: (id) => ipcRenderer.invoke('cancel-download', id),
  openDownload: (path) => ipcRenderer.invoke('open-download', path),
  showDownloadInFolder: (path) => ipcRenderer.invoke('show-download-in-folder', path),
  clearDownloadHistory: () => ipcRenderer.invoke('clear-download-history'),
  removeDownloadFromList: (id) => ipcRenderer.invoke('remove-download-from-list', id),
  onDownloadStarted: (callback) => ipcRenderer.on('download-started', (e, data) => callback(data)),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (e, data) => callback(data)),
  onDownloadCompleted: (callback) => ipcRenderer.on('download-completed', (e, data) => callback(data)),
  
  // Système d'historique
  addToHistory: (entry) => ipcRenderer.invoke('add-to-history', entry),
  getHistory: () => ipcRenderer.invoke('get-history'),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  deleteHistoryEntry: (timestamp) => ipcRenderer.invoke('delete-history-entry', timestamp),
  getHistorySettings: () => ipcRenderer.invoke('get-history-settings'),
  setHistoryEnabled: (enabled) => ipcRenderer.invoke('set-history-enabled', enabled),
  searchHistory: (query) => ipcRenderer.invoke('search-history', query)
});
