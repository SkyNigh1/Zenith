/**
 * Zenith Browser - Main Process
 */

const { app, BrowserWindow, ipcMain, session, globalShortcut, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Désactiver les avertissements de sécurité en développement
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// Amélioration du rendu - désactiver le throttling et améliorer l'accélération matérielle
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,VaapiVideoEncoder');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-accelerated-video-decode');
app.commandLine.appendSwitch('force-color-profile', 'srgb');

const DEFAULT_PAGE = `file://${path.join(__dirname, 'home', 'index.html')}`;

// Système de permissions chiffrées
const PERMISSIONS_FILE = path.join(app.getPath('userData'), 'permissions.enc');
const ENCRYPTION_KEY = crypto.scryptSync('zenith-browser-key', 'zenith-salt', 32);
const IV_LENGTH = 16;

function encryptData(data) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptData(encryptedData) {
  try {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (e) {
    return {};
  }
}

function loadPermissions() {
  try {
    if (fs.existsSync(PERMISSIONS_FILE)) {
      const data = fs.readFileSync(PERMISSIONS_FILE, 'utf8');
      return decryptData(data);
    }
  } catch (e) {
    console.error('Error loading permissions:', e);
  }
  return {};
}

function savePermissions(permissions) {
  try {
    const encrypted = encryptData(permissions);
    fs.writeFileSync(PERMISSIONS_FILE, encrypted, 'utf8');
  } catch (e) {
    console.error('Error saving permissions:', e);
  }
}

let sitePermissions = {};

const AD_BLOCK_LIST = [
  '*://*.doubleclick.net/*',
  '*://*.googlesyndication.com/*',
  '*://*.googleadservices.com/*',
  '*://*.google-analytics.com/*',
  '*://*.adservice.google.com/*',
  '*://*.adnxs.com/*',
  '*://*.adsrvr.org/*',
  '*://*.advertising.com/*',
  '*://*.outbrain.com/*',
  '*://*.taboola.com/*',
  '*://*.criteo.com/*',
  '*://*.pubmatic.com/*',
  '*://*.rubiconproject.com/*',
  '*://*.openx.net/*',
  '*://*.moatads.com/*',
  '*://*.scorecardresearch.com/*',
  '*://*.quantserve.com/*',
  '*://*.facebook.com/tr/*',
  '*://*.facebook.net/signals/*',
  '*://pagead2.googlesyndication.com/*',
  '*://*.amazon-adsystem.com/*',
  '*://*.hotjar.com/*',
  '*://*.mixpanel.com/*',
  '*://*.popads.net/*',
  '*://*.propellerads.com/*'
];

let mainWindow;
let devToolsView = null;
let adBlockerEnabled = true;
let blockThirdPartyCookies = true;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    icon: path.join(__dirname, '..', 'assets', 'logo.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      enableRemoteModule: false,
      sandbox: false
    },
    backgroundColor: '#141414',
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  Menu.setApplicationMenu(null);

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });
  mainWindow.on('focus', registerShortcuts);
  mainWindow.on('blur', unregisterShortcuts);
  mainWindow.on('closed', () => { mainWindow = null; });
}

function registerShortcuts() {
  globalShortcut.register('CommandOrControl+T', () => {
    mainWindow?.webContents.send('shortcut', 'new-tab');
  });
  globalShortcut.register('CommandOrControl+W', () => {
    mainWindow?.webContents.send('shortcut', 'close-tab');
  });
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    mainWindow?.webContents.send('shortcut', 'reopen-tab');
  });
  globalShortcut.register('CommandOrControl+Tab', () => {
    mainWindow?.webContents.send('shortcut', 'next-tab');
  });
  globalShortcut.register('CommandOrControl+Shift+Tab', () => {
    mainWindow?.webContents.send('shortcut', 'prev-tab');
  });
  globalShortcut.register('CommandOrControl+R', () => {
    mainWindow?.webContents.send('shortcut', 'refresh');
  });
  globalShortcut.register('F5', () => {
    mainWindow?.webContents.send('shortcut', 'refresh');
  });
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    mainWindow?.webContents.send('shortcut', 'hard-refresh');
  });
  globalShortcut.register('CommandOrControl+F5', () => {
    mainWindow?.webContents.send('shortcut', 'hard-refresh');
  });
  globalShortcut.register('CommandOrControl+L', () => {
    mainWindow?.webContents.send('shortcut', 'focus-url');
  });
  globalShortcut.register('Alt+D', () => {
    mainWindow?.webContents.send('shortcut', 'focus-url');
  });
  globalShortcut.register('Escape', () => {
    mainWindow?.webContents.send('shortcut', 'stop');
  });
  globalShortcut.register('F12', () => {
    mainWindow?.webContents.send('shortcut', 'toggle-devtools');
  });
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    mainWindow?.webContents.send('shortcut', 'toggle-devtools');
  });
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    mainWindow?.webContents.send('shortcut', 'inspect-element');
  });
  globalShortcut.register('CommandOrControl+Shift+J', () => {
    mainWindow?.webContents.send('shortcut', 'open-console');
  });
  globalShortcut.register('CommandOrControl+J', () => {
    mainWindow?.webContents.send('shortcut', 'toggle-downloads');
  });
  globalShortcut.register('CommandOrControl+H', () => {
    mainWindow?.webContents.send('shortcut', 'open-history');
  });
  for (let i = 1; i <= 9; i++) {
    globalShortcut.register(`CommandOrControl+${i}`, () => {
      mainWindow?.webContents.send('shortcut', `goto-tab-${i}`);
    });
  }
}

function unregisterShortcuts() {
  globalShortcut.unregisterAll();
}

function setupAdBlocker() {
  session.defaultSession.webRequest.onBeforeRequest({ urls: AD_BLOCK_LIST }, (details, callback) => {
    callback({ cancel: adBlockerEnabled });
  });
}

function setupPermissionHandlers() {
  // Gérer les demandes de permission des webviews
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const url = details.requestingUrl || webContents.getURL();
    let origin;
    try {
      origin = new URL(url).origin;
    } catch {
      callback(false);
      return;
    }

    // Mapper les permissions Electron vers nos noms
    const permissionMap = {
      'geolocation': 'geolocation',
      'notifications': 'notifications',
      'media': 'media',
      'mediaKeySystem': 'media',
      'midi': 'midi',
      'midiSysex': 'midi',
      'pointerLock': 'pointerLock',
      'fullscreen': 'fullscreen',
      'clipboard-read': 'clipboard',
      'clipboard-write': 'clipboard',
      'clipboard-sanitized-write': 'clipboard'
    };

    const mappedPermission = permissionMap[permission] || permission;
    
    // Vérifier si déjà défini
    if (sitePermissions[origin] && sitePermissions[origin][mappedPermission] !== undefined) {
      callback(sitePermissions[origin][mappedPermission] === true);
      return;
    }

    // Permissions auto-accordées (non sensibles)
    const autoGranted = ['fullscreen'];
    if (autoGranted.includes(mappedPermission)) {
      callback(true);
      return;
    }

    // Demander à l'utilisateur
    const permissionLabels = {
      'geolocation': 'votre localisation',
      'notifications': 'envoyer des notifications',
      'media': 'accéder à la caméra/microphone',
      'clipboard': 'accéder au presse-papiers',
      'midi': 'accéder aux appareils MIDI',
      'pointerLock': 'verrouiller le pointeur'
    };

    mainWindow?.webContents.send('permission-request', {
      origin,
      permission: mappedPermission,
      permissionLabel: permissionLabels[mappedPermission] || mappedPermission
    });

    // Attendre la réponse de l'utilisateur
    let callbackCalled = false;
    const handler = (event, { origin: respOrigin, permission: respPerm, granted }) => {
      if (respOrigin === origin && respPerm === mappedPermission && !callbackCalled) {
        callbackCalled = true;
        ipcMain.removeListener('permission-response', handler);
        
        // Sauvegarder la décision
        if (!sitePermissions[origin]) {
          sitePermissions[origin] = {};
        }
        sitePermissions[origin][mappedPermission] = granted;
        savePermissions(sitePermissions);
        
        callback(granted);
      }
    };
    
    ipcMain.on('permission-response', handler);

    // Timeout: bloquer après 60 secondes sans réponse
    setTimeout(() => {
      if (!callbackCalled) {
        callbackCalled = true;
        ipcMain.removeListener('permission-response', handler);
        callback(false);
      }
    }, 60000);
  });

  // Vérifier les permissions pour les accès automatiques
  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    const permissionMap = {
      'geolocation': 'geolocation',
      'notifications': 'notifications',
      'media': 'media',
      'midi': 'midi',
      'pointerLock': 'pointerLock',
      'fullscreen': 'fullscreen',
      'clipboard-read': 'clipboard',
      'clipboard-write': 'clipboard'
    };

    const mappedPermission = permissionMap[permission] || permission;
    
    // Permissions auto-accordées
    if (['fullscreen'].includes(mappedPermission)) {
      return true;
    }

    // Vérifier dans les permissions sauvegardées
    if (sitePermissions[requestingOrigin] && sitePermissions[requestingOrigin][mappedPermission] !== undefined) {
      return sitePermissions[requestingOrigin][mappedPermission] === true;
    }

    // Par défaut: refuser (sera demandé via setPermissionRequestHandler)
    return false;
  });
}

function setupIPC() {
  // Ignorer les erreurs GUEST_VIEW_MANAGER_CALL (ERR_ABORTED est normal lors de navigations)
  process.on('uncaughtException', (error) => {
    // Ignorer ERR_ABORTED qui est normal lors des redirections
    if (error.code === 'ERR_ABORTED' || error.errno === -3) return;
    console.error('Uncaught Exception:', error);
  });

  // Bloquer les navigations non autorisées
  app.on('web-contents-created', (event, contents) => {
    // Ignorer les erreurs de console des webviews (comme dragEvent)
    contents.on('console-message', (event, level, message) => {
      if (message.includes('dragEvent')) return;
    });

    // Sécurité: bloquer l'ouverture de nouvelles fenêtres non contrôlées
    contents.setWindowOpenHandler(({ url }) => {
      // Autoriser uniquement les URLs sûres
      if (url.startsWith('https://') || url.startsWith('http://')) {
        return { action: 'deny' }; // Géré par le renderer via new-window event
      }
      return { action: 'deny' };
    });

    // Bloquer la navigation vers des protocoles dangereux
    contents.on('will-navigate', (event, url) => {
      try {
        const parsedUrl = new URL(url);
        if (!['http:', 'https:', 'about:', 'file:'].includes(parsedUrl.protocol)) {
          event.preventDefault();
        }
      } catch (e) {
        // URL invalide, ignorer
      }
    });
  });

  // Désactiver les certificats invalides en production (commenté pour dev)
  // app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  //   event.preventDefault();
  //   callback(false);
  // });

  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => {
    mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize();
  });
  ipcMain.on('window-close', () => mainWindow?.close());

  ipcMain.handle('get-adblocker-status', () => adBlockerEnabled);
  ipcMain.handle('toggle-adblocker', () => { adBlockerEnabled = !adBlockerEnabled; return adBlockerEnabled; });
  ipcMain.handle('get-cookies', async (e, url) => {
    try { return await session.defaultSession.cookies.get({ url }); } catch { return []; }
  });
  ipcMain.handle('clear-cookies', async () => {
    try { await session.defaultSession.clearStorageData({ storages: ['cookies'] }); return true; } catch { return false; }
  });
  ipcMain.handle('get-third-party-cookies-blocked', () => blockThirdPartyCookies);
  ipcMain.handle('toggle-third-party-cookies', () => { blockThirdPartyCookies = !blockThirdPartyCookies; return blockThirdPartyCookies; });
  ipcMain.handle('get-default-page', () => DEFAULT_PAGE);
  ipcMain.handle('clear-browsing-data', async () => {
    try {
      await session.defaultSession.clearStorageData({ storages: ['cookies', 'localstorage', 'cachestorage', 'indexdb', 'shadercache', 'websql', 'serviceworkers'] });
      await session.defaultSession.clearCache();
      return true;
    } catch { return false; }
  });

  // Système de permissions
  sitePermissions = loadPermissions();

  ipcMain.handle('get-site-permissions', (event, origin) => {
    return sitePermissions[origin] || {};
  });

  ipcMain.handle('get-all-permissions', () => {
    return sitePermissions;
  });

  ipcMain.handle('set-site-permission', (event, { origin, permission, value }) => {
    if (!sitePermissions[origin]) {
      sitePermissions[origin] = {};
    }
    sitePermissions[origin][permission] = value;
    savePermissions(sitePermissions);
    return true;
  });

  ipcMain.handle('remove-site-permissions', (event, origin) => {
    delete sitePermissions[origin];
    savePermissions(sitePermissions);
    return true;
  });

  ipcMain.handle('clear-all-permissions', () => {
    sitePermissions = {};
    savePermissions(sitePermissions);
    return true;
  });

  ipcMain.handle('check-permission', (event, { origin, permission }) => {
    if (sitePermissions[origin] && sitePermissions[origin][permission] !== undefined) {
      return sitePermissions[origin][permission];
    }
    return null; // null = jamais demandé
  });

  // Gestionnaires pour le thème de la page d'accueil
  let currentBrowserTheme = 'dark';
  
  ipcMain.handle('get-browser-theme', () => {
    return currentBrowserTheme;
  });
  
  ipcMain.on('set-browser-theme', (event, theme) => {
    currentBrowserTheme = theme;
    // Notifier toutes les webviews (pages d'accueil) du changement
    const { webContents } = require('electron');
    webContents.getAllWebContents().forEach(contents => {
      if (contents.getURL().startsWith('file://') && contents.getURL().includes('home/index.html')) {
        contents.send('theme-changed', theme);
      }
    });
  });

  // Gérer les demandes de permission des webviews
  ipcMain.handle('request-permission', async (event, { origin, permission, permissionLabel }) => {
    // Vérifier si déjà défini
    if (sitePermissions[origin] && sitePermissions[origin][permission] !== undefined) {
      return sitePermissions[origin][permission];
    }
    
    // Envoyer la demande au renderer pour afficher le dialog
    mainWindow?.webContents.send('permission-request', { origin, permission, permissionLabel });
    
    return new Promise((resolve) => {
      const handler = (event, { origin: respOrigin, permission: respPerm, granted }) => {
        if (respOrigin === origin && respPerm === permission) {
          ipcMain.removeListener('permission-response', handler);
          resolve(granted);
        }
      };
      ipcMain.on('permission-response', handler);
      
      // Timeout après 60 secondes
      setTimeout(() => {
        ipcMain.removeListener('permission-response', handler);
        resolve(false);
      }, 60000);
    });
  });

  // DevTools intégrés dans un panneau avec BrowserView
  ipcMain.handle('open-devtools-in-panel', async (event, { targetWebContentsId, bounds }) => {
    try {
      const { webContents, BrowserView } = require('electron');
      const targetId = parseInt(targetWebContentsId);
      const targetContents = webContents.fromId(targetId);
      
      if (!targetContents) {
        console.error('Target webContents not found:', targetId);
        return false;
      }
      
      // Fermer l'ancienne vue DevTools si elle existe
      if (devToolsView) {
        mainWindow.removeBrowserView(devToolsView);
        devToolsView.webContents.destroy();
        devToolsView = null;
      }
      
      // Fermer les anciens DevTools de la cible
      if (targetContents.isDevToolsOpened()) {
        targetContents.closeDevTools();
        await new Promise(r => setTimeout(r, 50));
      }
      
      // Créer une nouvelle BrowserView pour les DevTools
      devToolsView = new BrowserView({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });
      
      mainWindow.addBrowserView(devToolsView);
      devToolsView.setBounds(bounds);
      devToolsView.setAutoResize({ width: false, height: true });
      
      // Lier les DevTools à cette vue
      targetContents.setDevToolsWebContents(devToolsView.webContents);
      targetContents.openDevTools({ mode: 'detach' });
      
      return true;
    } catch (e) {
      console.error('Error opening devtools in panel:', e);
      return false;
    }
  });

  ipcMain.handle('close-devtools-panel', async (event, { webContentsId }) => {
    try {
      const { webContents } = require('electron');
      
      if (webContentsId) {
        const targetContents = webContents.fromId(parseInt(webContentsId));
        if (targetContents && targetContents.isDevToolsOpened()) {
          targetContents.closeDevTools();
        }
      }
      
      // Supprimer la BrowserView
      if (devToolsView) {
        mainWindow.removeBrowserView(devToolsView);
        try {
          devToolsView.webContents.destroy();
        } catch (e) {}
        devToolsView = null;
      }
      
      return true;
    } catch (e) {
      console.error('Error closing devtools:', e);
      return false;
    }
  });

  ipcMain.handle('resize-devtools-panel', async (event, { bounds }) => {
    try {
      if (devToolsView) {
        devToolsView.setBounds(bounds);
      }
      return true;
    } catch (e) {
      return false;
    }
  });
}

// Système de téléchargements
let downloads = new Map();
let downloadCounter = 0;

function setupDownloads() {
  session.defaultSession.on('will-download', (event, item, webContents) => {
    const downloadId = ++downloadCounter;
    const fileName = item.getFilename();
    const totalBytes = item.getTotalBytes();
    const savePath = path.join(app.getPath('downloads'), fileName);
    
    item.setSavePath(savePath);
    
    const downloadInfo = {
      id: downloadId,
      filename: fileName,
      savePath: savePath,
      totalBytes: totalBytes,
      receivedBytes: 0,
      state: 'progressing',
      startTime: Date.now(),
      url: item.getURL(),
      isPaused: false,
      speed: 0,
      lastReceivedBytes: 0,
      lastSpeedUpdate: Date.now()
    };
    
    downloads.set(downloadId, { item, info: downloadInfo });
    
    // Notifier le renderer du début du téléchargement
    mainWindow?.webContents.send('download-started', downloadInfo);
    
    item.on('updated', (event, state) => {
      const download = downloads.get(downloadId);
      if (!download) return;
      
      const now = Date.now();
      const timeDiff = (now - download.info.lastSpeedUpdate) / 1000; // en secondes
      const bytesDiff = item.getReceivedBytes() - download.info.lastReceivedBytes;
      
      // Calculer la vitesse (moyenne glissante)
      if (timeDiff >= 0.5) { // Mettre à jour toutes les 500ms minimum
        download.info.speed = Math.round(bytesDiff / timeDiff);
        download.info.lastReceivedBytes = item.getReceivedBytes();
        download.info.lastSpeedUpdate = now;
      }
      
      download.info.receivedBytes = item.getReceivedBytes();
      download.info.state = state;
      download.info.isPaused = item.isPaused();
      
      mainWindow?.webContents.send('download-progress', {
        id: downloadId,
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
        state: state,
        isPaused: item.isPaused(),
        speed: download.info.speed
      });
    });
    
    item.once('done', (event, state) => {
      const download = downloads.get(downloadId);
      if (!download) return;
      
      download.info.state = state;
      download.info.endTime = Date.now();
      
      mainWindow?.webContents.send('download-completed', {
        id: downloadId,
        state: state,
        savePath: savePath,
        filename: fileName
      });
    });
  });
  
  // IPC handlers pour les téléchargements
  ipcMain.handle('get-downloads', () => {
    return Array.from(downloads.values()).map(d => d.info);
  });
  
  ipcMain.handle('pause-download', (event, downloadId) => {
    const download = downloads.get(downloadId);
    if (download && download.item) {
      download.item.pause();
      return true;
    }
    return false;
  });
  
  ipcMain.handle('resume-download', (event, downloadId) => {
    const download = downloads.get(downloadId);
    if (download && download.item && download.item.canResume()) {
      download.item.resume();
      return true;
    }
    return false;
  });
  
  ipcMain.handle('cancel-download', (event, downloadId) => {
    const download = downloads.get(downloadId);
    if (download && download.item) {
      download.item.cancel();
      return true;
    }
    return false;
  });
  
  ipcMain.handle('open-download', (event, savePath) => {
    const { shell } = require('electron');
    shell.openPath(savePath);
  });
  
  ipcMain.handle('show-download-in-folder', (event, savePath) => {
    const { shell } = require('electron');
    shell.showItemInFolder(savePath);
  });
  
  ipcMain.handle('clear-download-history', () => {
    // Garder seulement les téléchargements en cours
    for (const [id, download] of downloads.entries()) {
      if (download.info.state !== 'progressing') {
        downloads.delete(id);
      }
    }
    return true;
  });
  
  ipcMain.handle('remove-download-from-list', (event, downloadId) => {
    const download = downloads.get(downloadId);
    if (download && download.info.state !== 'progressing') {
      downloads.delete(downloadId);
      return true;
    }
    return false;
  });
}

// Système d'historique
const HISTORY_FILE = path.join(app.getPath('userData'), 'history.json');
const HISTORY_SETTINGS_FILE = path.join(app.getPath('userData'), 'history-settings.json');

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading history:', e);
  }
  return [];
}

function saveHistory(history) {
  try {
    // Garder seulement les 10000 dernières entrées
    const trimmedHistory = history.slice(-10000);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmedHistory), 'utf8');
  } catch (e) {
    console.error('Error saving history:', e);
  }
}

function loadHistorySettings() {
  try {
    if (fs.existsSync(HISTORY_SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_SETTINGS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading history settings:', e);
  }
  return { enabled: true };
}

function saveHistorySettings(settings) {
  try {
    fs.writeFileSync(HISTORY_SETTINGS_FILE, JSON.stringify(settings), 'utf8');
  } catch (e) {
    console.error('Error saving history settings:', e);
  }
}

let browsingHistory = [];
let historySettings = { enabled: true };

function setupHistory() {
  browsingHistory = loadHistory();
  historySettings = loadHistorySettings();
  
  ipcMain.handle('add-to-history', (event, entry) => {
    if (!historySettings.enabled) return false;
    // Ne pas ajouter les pages internes ou file://
    if (entry.url.startsWith('file://') || entry.url.startsWith('zenith://')) return false;
    
    browsingHistory.push({
      ...entry,
      timestamp: Date.now()
    });
    saveHistory(browsingHistory);
    return true;
  });
  
  ipcMain.handle('get-history', () => {
    return browsingHistory;
  });
  
  ipcMain.handle('clear-history', () => {
    browsingHistory = [];
    saveHistory(browsingHistory);
    return true;
  });
  
  ipcMain.handle('delete-history-entry', (event, timestamp) => {
    browsingHistory = browsingHistory.filter(h => h.timestamp !== timestamp);
    saveHistory(browsingHistory);
    return true;
  });
  
  ipcMain.handle('get-history-settings', () => {
    return historySettings;
  });
  
  ipcMain.handle('set-history-enabled', (event, enabled) => {
    historySettings.enabled = enabled;
    saveHistorySettings(historySettings);
    return true;
  });
  
  ipcMain.handle('search-history', (event, query) => {
    const lowerQuery = query.toLowerCase();
    return browsingHistory.filter(h => 
      h.title?.toLowerCase().includes(lowerQuery) || 
      h.url.toLowerCase().includes(lowerQuery)
    );
  });
}

app.whenReady().then(() => {
  sitePermissions = loadPermissions();
  createWindow();
  setupAdBlocker();
  setupPermissionHandlers();
  setupDownloads();
  setupHistory();
  setupIPC();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('will-quit', () => globalShortcut.unregisterAll());
