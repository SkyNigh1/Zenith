const SEARCH_ENGINES = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
  brave: { name: 'Brave', url: 'https://search.brave.com/search?q=' },
  ecosia: { name: 'Ecosia', url: 'https://www.ecosia.org/search?q=' },
  qwant: { name: 'Qwant', url: 'https://www.qwant.com/?q=' },
  startpage: { name: 'Startpage', url: 'https://www.startpage.com/do/search?q=' },
  yahoo: { name: 'Yahoo', url: 'https://search.yahoo.com/search?p=' },
  yandex: { name: 'Yandex', url: 'https://yandex.com/search/?text=' }
};

let DEFAULT_PAGE = '';
let tabs = [];
let activeTabId = null;
let tabCounter = 0;
let currentSearchEngine = localStorage.getItem('searchEngine') || 'google';
let closedTabs = [];
let currentTheme = localStorage.getItem('theme') || 'dark';

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.style.setProperty('--bg-primary', '#ffffff');
    document.documentElement.style.setProperty('--bg-secondary', '#f0f0f0');
    document.documentElement.style.setProperty('--bg-tertiary', '#e8e8e8');
    document.documentElement.style.setProperty('--bg-hover', '#e0e0e0');
    document.documentElement.style.setProperty('--bg-active', '#d0d0d0');
    document.documentElement.style.setProperty('--text-primary', '#0a0a0a');
    document.documentElement.style.setProperty('--text-secondary', '#404040');
    document.documentElement.style.setProperty('--text-muted', '#737373');
    document.documentElement.style.setProperty('--border', '#d4d4d4');
  } else {
    document.documentElement.style.setProperty('--bg-primary', '#141414');
    document.documentElement.style.setProperty('--bg-secondary', '#1c1c1c');
    document.documentElement.style.setProperty('--bg-tertiary', '#0a0a0a');
    document.documentElement.style.setProperty('--bg-hover', '#252525');
    document.documentElement.style.setProperty('--bg-active', '#2f2f2f');
    document.documentElement.style.setProperty('--text-primary', '#f5f5f5');
    document.documentElement.style.setProperty('--text-secondary', '#a3a3a3');
    document.documentElement.style.setProperty('--text-muted', '#737373');
    document.documentElement.style.setProperty('--border', '#262626');
  }
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', currentTheme);
  applyTheme(currentTheme);
  updateThemeUI();
  // Notifier le process principal pour qu'il transmette aux pages d'accueil
  window.zenithAPI.setBrowserTheme(currentTheme);
}

function updateThemeUI() {
  const btn = document.getElementById('toggle-theme');
  if (!btn) return;
  btn.innerHTML = currentTheme === 'dark' 
    ? '<svg class="icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>Mode sombre<span class="status"></span>'
    : '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>Mode clair<span class="status"></span>';
  btn.classList.toggle('active', currentTheme === 'dark');
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Vérifier que zenithAPI est disponible
    if (!window.zenithAPI) {
      console.error('zenithAPI is not available. Preload script may not have loaded correctly.');
      alert('Erreur d\'initialisation: zenithAPI non disponible');
      return;
    }
    
    DEFAULT_PAGE = await window.zenithAPI.getDefaultPage();
    initializeUI();
    initializePermissions();
    initializeDevToolsPanel();
    initializeDownloads();
    applyTheme(currentTheme);
    // Envoyer le thème initial au process principal
    window.zenithAPI.setBrowserTheme(currentTheme);
    createNewTab();
    setupWindowControls();
    setupShortcutListener();
    setupGlobalKeyListener();
    await initializeSettings();
  } catch (error) {
    console.error('Initialization error:', error);
    alert('Erreur lors de l\'initialisation: ' + error.message);
  }
});

// Listener global pour intercepter F12 avant qu'il n'atteigne la webview
function setupGlobalKeyListener() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F12') {
      e.preventDefault();
      e.stopPropagation();
      toggleDevTools();
    }
  }, true); // Phase de capture pour intercepter avant la webview
}

function initializeUI() {
  document.getElementById('new-tab-btn').addEventListener('click', () => createNewTab());
  const urlBar = document.getElementById('url-bar');
  urlBar.addEventListener('keydown', handleUrlBarKeydown);
  urlBar.addEventListener('focus', () => urlBar.select());
  document.getElementById('back-btn').addEventListener('click', goBack);
  document.getElementById('forward-btn').addEventListener('click', goForward);
  document.getElementById('refresh-btn').addEventListener('click', refreshPage);
  document.getElementById('home-btn').addEventListener('click', goHome);
  document.getElementById('devtools-btn').addEventListener('click', toggleDevTools);
  document.getElementById('settings-btn').addEventListener('click', toggleSettingsMenu);
  document.getElementById('history-btn').addEventListener('click', openHistoryPage);
  document.getElementById('settings-overlay').addEventListener('click', closeSettingsMenu);
  document.getElementById('search-engine-select').addEventListener('change', (e) => {
    currentSearchEngine = e.target.value;
    localStorage.setItem('searchEngine', currentSearchEngine);
    updateSearchEnginePlaceholder();
  });
  updateSearchEnginePlaceholder();
  
  // Setup settings menu listeners
  setTimeout(() => {
    const adBlockerBtn = document.getElementById('toggle-adblocker');
    const cookiesBtn = document.getElementById('clear-cookies');
    const thirdPartyBtn = document.getElementById('toggle-third-party');
    const clearDataBtn = document.getElementById('clear-data');
    const themeBtn = document.getElementById('toggle-theme');
    const historyBtn = document.getElementById('open-history');
    
    if (adBlockerBtn) adBlockerBtn.addEventListener('click', toggleAdBlocker);
    if (cookiesBtn) cookiesBtn.addEventListener('click', clearCookies);
    if (thirdPartyBtn) thirdPartyBtn.addEventListener('click', toggleThirdPartyCookies);
    if (clearDataBtn) clearDataBtn.addEventListener('click', clearBrowsingData);
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    if (historyBtn) historyBtn.addEventListener('click', () => { closeSettingsMenu(); openHistoryPage(); });
  }, 0);
}

function setupShortcutListener() {
  window.zenithAPI.onShortcut((action) => {
    switch (action) {
      case 'new-tab': createNewTab(); break;
      case 'close-tab': if (activeTabId) closeTab(activeTabId); break;
      case 'reopen-tab': reopenLastClosedTab(); break;
      case 'next-tab': switchToNextTab(); break;
      case 'prev-tab': switchToPreviousTab(); break;
      case 'refresh': refreshPage(); break;
      case 'hard-refresh': hardRefreshPage(); break;
      case 'focus-url': focusUrlBar(); break;
      case 'stop': stopLoading(); closeSettingsMenu(); break;
      case 'toggle-devtools': toggleDevTools(); break;
      case 'inspect-element': openDevToolsInspect(); break;
      case 'open-console': openDevToolsConsole(); break;
      case 'toggle-downloads': toggleDownloadsPanel(); break;
      case 'open-history': openHistoryPage(); break;
      default:
        if (action.startsWith('goto-tab-')) {
          const num = parseInt(action.split('-')[2]);
          if (num === 9 && tabs.length > 0) switchToTab(tabs[tabs.length - 1].id);
          else if (num <= tabs.length) switchToTab(tabs[num - 1].id);
        }
    }
  });
}

function setupWindowControls() {
  document.getElementById('minimize-btn').addEventListener('click', () => window.zenithAPI.minimizeWindow());
  document.getElementById('maximize-btn').addEventListener('click', () => window.zenithAPI.maximizeWindow());
  document.getElementById('close-btn').addEventListener('click', () => window.zenithAPI.closeWindow());
}

async function initializeSettings() {
  const adBlockerEnabled = await window.zenithAPI.getAdBlockerStatus();
  updateAdBlockerUI(adBlockerEnabled);
  const thirdPartyBlocked = await window.zenithAPI.getThirdPartyCookiesBlocked();
  updateThirdPartyCookiesUI(thirdPartyBlocked);
  updateThemeUI();
  document.getElementById('search-engine-select').value = currentSearchEngine;
}

function createNewTab(url = null) {
  const tabId = `tab-${++tabCounter}`;
  const isNewTab = !url;
  const actualUrl = url || DEFAULT_PAGE;
  
  const tabElement = document.createElement('div');
  tabElement.className = 'tab';
  tabElement.id = tabId;
  tabElement.innerHTML = `
    <div class="tab-favicon"></div>
    <span class="tab-title">Nouvel onglet</span>
    <button class="tab-close" title="Fermer">
      <svg class="icon" viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
    </button>
  `;
  tabElement.addEventListener('click', (e) => { if (!e.target.closest('.tab-close')) switchToTab(tabId); });
  tabElement.querySelector('.tab-close').addEventListener('click', (e) => { e.stopPropagation(); closeTab(tabId); });
  
  // Clic molette pour fermer l'onglet
  tabElement.addEventListener('mousedown', (e) => {
    if (e.button === 1) { // Bouton molette
      e.preventDefault();
      closeTab(tabId);
    }
  });
  
  // Drag & Drop pour réorganiser les onglets
  setupTabDragAndDrop(tabElement, tabId);
  
  const newTabBtn = document.getElementById('new-tab-btn');
  document.getElementById('tabs-container').insertBefore(tabElement, newTabBtn);
  const webview = document.createElement('webview');
  webview.id = `webview-${tabId}`;
  webview.className = 'browser-view';
  webview.src = actualUrl;
  webview.setAttribute('allowpopups', 'true');
  webview.setAttribute('preload', window.zenithAPI.webviewPreloadPath);
  webview.setAttribute('webpreferences', 'contextIsolation=yes, javascript=yes, images=yes, webgl=yes, plugins=no, experimentalFeatures=no');
  webview.setAttribute('useragent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
  webview.setAttribute('disableblinkfeatures', 'Auxclick');
  setupWebviewEvents(webview, tabId);
  document.getElementById('webviews-container').appendChild(webview);
  tabs.push({ id: tabId, url: actualUrl, title: 'Nouvel onglet', webview, isNewTab });
  switchToTab(tabId);
  if (isNewTab) setTimeout(() => focusUrlBar(), 100);
}

function setupWebviewEvents(webview, tabId) {
  let firstNavigation = true;
  let lastHistoryUrl = '';
  
  webview.addEventListener('page-title-updated', (e) => {
    updateTabTitle(tabId, e.title);
    // Ajouter à l'historique quand on a le titre
    const tab = tabs.find(t => t.id === tabId);
    if (tab && tab.url && tab.url !== lastHistoryUrl && !isHomePage(tab.url)) {
      lastHistoryUrl = tab.url;
      window.zenithAPI.addToHistory({
        url: tab.url,
        title: e.title || tab.url,
        favicon: tab.favicon || ''
      });
    }
  });
  
  webview.addEventListener('did-navigate', (e) => { 
    updateTabUrl(tabId, e.url); 
    const tab = tabs.find(t => t.id === tabId);
    if (tab && !firstNavigation) {
      tab.isNewTab = isHomePage(e.url);
    }
    firstNavigation = false;
    if (tabId === activeTabId && tab) {
      document.getElementById('url-bar').value = isHomePage(e.url) ? '' : e.url;
    }
  });
  webview.addEventListener('did-navigate-in-page', (e) => { 
    if (e.isMainFrame) { 
      updateTabUrl(tabId, e.url); 
      const tab = tabs.find(t => t.id === tabId);
      if (tabId === activeTabId && tab) {
        document.getElementById('url-bar').value = isHomePage(e.url) ? '' : e.url;
      }
    }
  });
  webview.addEventListener('page-favicon-updated', (e) => { 
    if (e.favicons?.length) {
      updateTabFavicon(tabId, e.favicons[0]); 
    }
  });
  webview.addEventListener('did-start-loading', () => { if (tabId === activeTabId) updateRefreshButton(true); document.getElementById(tabId)?.classList.add('loading'); });
  webview.addEventListener('did-stop-loading', () => { 
    if (tabId === activeTabId) updateRefreshButton(false); 
    document.getElementById(tabId)?.classList.remove('loading');
    
    // Récupérer le favicon via plusieurs méthodes
    const tab = tabs.find(t => t.id === tabId);
    if (tab && tab.url) {
      // D'abord essayer via l'API Google (plus fiable)
      loadFaviconFromUrl(tabId, tab.url);
      
      // Ensuite essayer de récupérer le favicon depuis la page (peut remplacer si trouvé)
      setTimeout(() => {
        webview.executeJavaScript(`
          (function() {
            // Chercher les différents types de liens favicon
            const selectors = [
              'link[rel="icon"]',
              'link[rel="shortcut icon"]',
              'link[rel="apple-touch-icon"]',
              'link[rel="apple-touch-icon-precomposed"]'
            ];
            for (const selector of selectors) {
              const link = document.querySelector(selector);
              if (link && link.href) return link.href;
            }
            return null;
          })();
        `).then(faviconUrl => {
          if (faviconUrl) {
            updateTabFavicon(tabId, faviconUrl);
          }
        }).catch(() => {});
      }, 300);
    }
  });
  
  // Écouter les messages IPC depuis le preload de la webview
  webview.addEventListener('ipc-message', (event) => {
    if (event.channel === 'toggle-devtools') {
      toggleDevTools();
    }
  });
  
  webview.addEventListener('new-window', (e) => { e.preventDefault(); createNewTab(e.url); });
  webview.addEventListener('did-fail-load', (e) => {
    // Ignorer ERR_ABORTED (-3) qui est normal lors des redirections/annulations
    // Ignorer aussi ERR_BLOCKED_BY_CLIENT (-20) pour les blocages publicitaires
    const ignoredErrors = [-3, -20, -102, -105, -106, -118, -137, -2];
    if (!ignoredErrors.includes(e.errorCode) && e.isMainFrame && e.validatedURL) {
      console.warn(`Failed to load ${e.validatedURL}: ${e.errorDescription} (${e.errorCode})`);
    }
  });
  
  // Ignorer les erreurs de console non critiques
  webview.addEventListener('console-message', (e) => {
    // Ne pas propager certaines erreurs de console qui sont des bugs connus
    if (e.message && (e.message.includes('dragEvent') || e.message.includes('ReferenceError: dragEvent'))) return;
  });
  
  // Mettre à jour l'état du bouton DevTools quand on ferme les DevTools
  webview.addEventListener('devtools-closed', () => {
    document.getElementById('devtools-btn').classList.remove('active');
  });
  
  // Menu contextuel avec options DevTools
  webview.addEventListener('context-menu', (e) => {
    e.preventDefault();
    showContextMenu(e.params, webview);
  });
}

function updateRefreshButton(isLoading) {
  const btn = document.getElementById('refresh-btn');
  btn.innerHTML = isLoading
    ? '<svg class="icon" viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>'
    : '<svg class="icon" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>';
  btn.title = isLoading ? 'Arrêter' : 'Rafraîchir';
}

// Variables pour le drag & drop des onglets
let draggedTab = null;
let draggedTabId = null;
let dragStartX = 0;
let tabStartX = 0;
let isDragging = false;

function setupTabDragAndDrop(tabElement, tabId) {
  tabElement.setAttribute('draggable', 'false'); // Désactiver le drag natif
  
  tabElement.addEventListener('mousedown', (e) => {
    // Ignorer si c'est le bouton fermer ou clic droit/molette
    if (e.target.closest('.tab-close') || e.button !== 0) return;
    
    draggedTab = tabElement;
    draggedTabId = tabId;
    dragStartX = e.clientX;
    tabStartX = tabElement.offsetLeft;
    isDragging = false;
    
    // Ajouter les listeners sur document
    document.addEventListener('mousemove', handleTabDrag);
    document.addEventListener('mouseup', handleTabDragEnd);
    
    e.preventDefault();
  });
}

function handleTabDrag(e) {
  if (!draggedTab) return;
  
  const deltaX = e.clientX - dragStartX;
  
  // Commencer le drag seulement après un déplacement minimum
  if (!isDragging && Math.abs(deltaX) > 5) {
    isDragging = true;
    draggedTab.classList.add('dragging');
  }
  
  if (!isDragging) return;
  
  // Déplacer l'onglet horizontalement
  draggedTab.style.transform = `translateX(${deltaX}px)`;
  draggedTab.style.zIndex = '100';
  
  // Trouver la position actuelle de l'onglet
  const tabsContainer = document.getElementById('tabs-container');
  const allTabs = Array.from(tabsContainer.querySelectorAll('.tab:not(#new-tab-btn)'));
  const draggedIndex = allTabs.indexOf(draggedTab);
  const draggedRect = draggedTab.getBoundingClientRect();
  const draggedCenter = draggedRect.left + draggedRect.width / 2;
  
  // Réorganiser les autres onglets visuellement
  allTabs.forEach((tab, index) => {
    if (tab === draggedTab) return;
    
    const tabRect = tab.getBoundingClientRect();
    const tabCenter = tabRect.left + tabRect.width / 2;
    
    if (draggedIndex < index && draggedCenter > tabCenter) {
      tab.style.transform = `translateX(-${draggedRect.width + 4}px)`;
      tab.dataset.shifted = 'left';
    } else if (draggedIndex > index && draggedCenter < tabCenter) {
      tab.style.transform = `translateX(${draggedRect.width + 4}px)`;
      tab.dataset.shifted = 'right';
    } else {
      tab.style.transform = '';
      tab.dataset.shifted = '';
    }
  });
}

function handleTabDragEnd(e) {
  document.removeEventListener('mousemove', handleTabDrag);
  document.removeEventListener('mouseup', handleTabDragEnd);
  
  if (!draggedTab) return;
  
  const tabsContainer = document.getElementById('tabs-container');
  const allTabs = Array.from(tabsContainer.querySelectorAll('.tab:not(#new-tab-btn)'));
  
  if (isDragging) {
    // Trouver la nouvelle position
    let newIndex = allTabs.indexOf(draggedTab);
    
    allTabs.forEach((tab, index) => {
      if (tab === draggedTab) return;
      
      if (tab.dataset.shifted === 'left' && index > newIndex) {
        newIndex = index;
      } else if (tab.dataset.shifted === 'right' && index < newIndex) {
        newIndex = index;
      }
    });
    
    // Désactiver les transitions avant de reset les positions
    allTabs.forEach(tab => {
      tab.style.transition = 'none';
    });
    
    // Réorganiser le DOM si nécessaire AVANT de reset les transforms
    const currentIndex = allTabs.indexOf(draggedTab);
    if (newIndex !== currentIndex) {
      const referenceTab = allTabs[newIndex];
      if (newIndex > currentIndex) {
        tabsContainer.insertBefore(draggedTab, referenceTab.nextSibling);
      } else {
        tabsContainer.insertBefore(draggedTab, referenceTab);
      }
      
      // Mettre à jour le tableau tabs
      const draggedTabData = tabs.find(t => t.id === draggedTabId);
      if (draggedTabData) {
        const oldIndex = tabs.indexOf(draggedTabData);
        tabs.splice(oldIndex, 1);
        tabs.splice(newIndex, 0, draggedTabData);
      }
    }
    
    // Réinitialiser les styles de tous les onglets
    allTabs.forEach(tab => {
      tab.style.transform = '';
      tab.style.zIndex = '';
      tab.dataset.shifted = '';
    });
    
    draggedTab.classList.remove('dragging');
    
    // Forcer un reflow puis réactiver les transitions
    void tabsContainer.offsetHeight;
    allTabs.forEach(tab => {
      tab.style.transition = '';
    });
  }
  
  draggedTab = null;
  draggedTabId = null;
  isDragging = false;
}

function closeTab(tabId) {
  const tabIndex = tabs.findIndex(t => t.id === tabId);
  if (tabIndex === -1) return;
  const tab = tabs[tabIndex];
  closedTabs.push({ url: tab.url, title: tab.title });
  if (closedTabs.length > 10) closedTabs.shift();
  
  const tabElement = document.getElementById(tabId);
  const webviewElement = document.getElementById(`webview-${tabId}`);
  
  // Animation de fermeture
  if (tabElement) {
    tabElement.classList.add('closing');
    tabElement.addEventListener('animationend', () => {
      tabElement.remove();
      webviewElement?.remove();
    }, { once: true });
  } else {
    webviewElement?.remove();
  }
  
  tabs.splice(tabIndex, 1);
  if (activeTabId === tabId) {
    if (tabs.length > 0) {
      switchToTab(tabs[Math.min(tabIndex, tabs.length - 1)].id);
    } else {
      // Fermer le navigateur si c'était le dernier onglet
      window.zenithAPI.closeWindow();
    }
  }
}

function switchToTab(tabId) {
  // Fermer les DevTools de l'ancien onglet si ouverts
  if (activeTabId && devToolsOpen) {
    const oldTab = tabs.find(t => t.id === activeTabId);
    if (oldTab?.webview) {
      try {
        const oldId = oldTab.webview.getWebContentsId();
        window.zenithAPI.closeDevToolsPanel(oldId);
      } catch(e) {}
    }
  }
  
  if (activeTabId) {
    document.getElementById(activeTabId)?.classList.remove('active');
    document.getElementById(`webview-${activeTabId}`)?.classList.remove('active');
  }
  activeTabId = tabId;
  document.getElementById(tabId)?.classList.add('active');
  document.getElementById(`webview-${tabId}`)?.classList.add('active');
  const tab = tabs.find(t => t.id === tabId);
  if (tab) {
    document.getElementById('url-bar').value = (tab.isNewTab || isHomePage(tab.url)) ? '' : (tab.url || '');
  }
  
  // Rebrancher les DevTools sur le nouvel onglet si le panneau est ouvert
  if (devToolsOpen && tab?.webview) {
    setTimeout(async () => {
      try {
        const targetId = tab.webview.getWebContentsId();
        const bounds = getDevToolsBounds();
        await window.zenithAPI.openDevToolsInPanel(targetId, bounds);
      } catch (e) {
        console.error('Erreur switch DevTools:', e);
      }
    }, 100);
  }
}

function switchToNextTab() { if (tabs.length <= 1) return; const i = tabs.findIndex(t => t.id === activeTabId); switchToTab(tabs[(i + 1) % tabs.length].id); }
function switchToPreviousTab() { if (tabs.length <= 1) return; const i = tabs.findIndex(t => t.id === activeTabId); switchToTab(tabs[(i - 1 + tabs.length) % tabs.length].id); }
function reopenLastClosedTab() { if (!closedTabs.length) return; createNewTab(closedTabs.pop().url); }
function updateTabTitle(tabId, title) { const tab = tabs.find(t => t.id === tabId); if (tab) { tab.title = title; const el = document.getElementById(tabId); if (el) { el.querySelector('.tab-title').textContent = title; el.title = title; }}}
function updateTabUrl(tabId, url) { const tab = tabs.find(t => t.id === tabId); if (tab) tab.url = url; }

function updateTabFavicon(tabId, faviconUrl) { 
  const el = document.getElementById(tabId); 
  if (!el) return;
  
  const favContainer = el.querySelector('.tab-favicon');
  if (!favContainer) return;
  
  // Supprimer l'ancienne image si elle existe
  const oldImg = favContainer.querySelector('img');
  if (oldImg) oldImg.remove();
  
  const img = document.createElement('img');
  img.width = 16;
  img.height = 16;
  img.alt = '';
  img.src = faviconUrl;
  
  img.onerror = () => {
    // Fallback vers l'API Google Favicon
    const tab = tabs.find(t => t.id === tabId);
    if (tab && tab.url) {
      try {
        const urlObj = new URL(tab.url);
        const googleFavicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
        if (img.src !== googleFavicon) {
          img.src = googleFavicon;
        }
      } catch (e) {
        img.style.visibility = 'hidden';
      }
    }
  };
  
  favContainer.appendChild(img);
}

function loadFaviconFromUrl(tabId, pageUrl) {
  if (!pageUrl || pageUrl.startsWith('about:') || pageUrl.startsWith('file:')) return;
  try {
    const urlObj = new URL(pageUrl);
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    updateTabFavicon(tabId, faviconUrl);
  } catch (e) {
    // URL invalide, ignorer
  }
}

function handleUrlBarKeydown(e) { if (e.key === 'Enter') { e.preventDefault(); navigateToUrl(e.target.value); }}

function navigateToUrl(input) {
  if (!input.trim()) return;
  let url = input.trim();
  if (isValidUrl(url)) { if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url; }
  else url = SEARCH_ENGINES[currentSearchEngine].url + encodeURIComponent(url);
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab?.webview) { 
    tab.isNewTab = false;
    tab.webview.src = url; 
    tab.url = url; 
    document.getElementById('url-bar').value = url; 
  }
}

function isValidUrl(s) {
  return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i.test(s) ||
         /^(https?:\/\/)?localhost(:\d+)?(\/.*)?$/i.test(s) ||
         /^(https?:\/\/)?\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?(\/.*)?$/i.test(s);
}

function isHomePage(url) {
  if (!url) return false;
  
  // Vérifier si c'est un fichier local pointant vers home/index.html
  if (url.startsWith('file://')) {
    // Normaliser le chemin (convertir backslashes en slashes et mettre en minuscule)
    const normalizedUrl = url.toLowerCase().replace(/\\/g, '/').replace(/\/$/, '');
    return normalizedUrl.includes('/src/home/index.html') || normalizedUrl.includes('/home/index.html');
  }
  
  // Pour les URLs http/https, comparer avec DEFAULT_PAGE
  const normalizedUrl = url.replace(/\/$/, '');
  const normalizedDefault = DEFAULT_PAGE.replace(/\/$/, '');
  return normalizedUrl === normalizedDefault;
}

function goBack() { const tab = tabs.find(t => t.id === activeTabId); if (tab?.webview?.canGoBack()) tab.webview.goBack(); }
function goForward() { const tab = tabs.find(t => t.id === activeTabId); if (tab?.webview?.canGoForward()) tab.webview.goForward(); }
function refreshPage() { 
  const tab = tabs.find(t => t.id === activeTabId); 
  if (tab?.webview) {
    if (tab.webview.isLoading()) {
      tab.webview.stop();
    } else {
      tab.webview.reload();
    }
  }
}
function hardRefreshPage() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab?.webview) {
    tab.webview.reloadIgnoringCache();
  }
}
function stopLoading() { const tab = tabs.find(t => t.id === activeTabId); if (tab?.webview) tab.webview.stop(); }

// === DevTools Panel intégré avec BrowserView ===
let devToolsOpen = false;
let devToolsPanelWidth = parseInt(localStorage.getItem('devToolsWidth') || '450');
let isResizing = false;

function getDevToolsBounds() {
  const panel = document.getElementById('devtools-panel');
  const container = document.getElementById('devtools-container');
  const rect = container.getBoundingClientRect();
  
  return {
    x: Math.round(rect.left),
    y: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };
}

function initializeDevToolsPanel() {
  const resizer = document.getElementById('devtools-resizer');
  const panel = document.getElementById('devtools-panel');
  
  // Resize handler
  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.classList.add('resizing');
    resizer.classList.add('dragging');
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const mainContent = document.getElementById('main-content');
    const rect = mainContent.getBoundingClientRect();
    const newWidth = rect.right - e.clientX;
    
    // Limites min/max
    if (newWidth >= 280 && newWidth <= rect.width - 300) {
      devToolsPanelWidth = newWidth;
      panel.style.width = newWidth + 'px';
      
      // Mettre à jour la position du BrowserView
      if (devToolsOpen) {
        window.zenithAPI.resizeDevToolsPanel(getDevToolsBounds());
      }
    }
  });
  
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.classList.remove('resizing');
      document.getElementById('devtools-resizer').classList.remove('dragging');
      // Sauvegarder la taille
      localStorage.setItem('devToolsWidth', devToolsPanelWidth.toString());
    }
  });
  
  // Mettre à jour les bounds quand la fenêtre est redimensionnée
  window.addEventListener('resize', () => {
    if (devToolsOpen) {
      window.zenithAPI.resizeDevToolsPanel(getDevToolsBounds());
    }
  });
}

function toggleDevTools() {
  if (devToolsOpen) {
    closeDevToolsPanel();
  } else {
    openDevToolsPanel();
  }
}

async function openDevToolsPanel() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab?.webview) return;
  
  const panel = document.getElementById('devtools-panel');
  const resizer = document.getElementById('devtools-resizer');
  
  // Ouvrir le panneau UI d'abord
  panel.classList.add('open');
  panel.style.width = devToolsPanelWidth + 'px';
  resizer.classList.add('visible');
  devToolsOpen = true;
  document.getElementById('devtools-btn').classList.add('active');
  
  // Attendre que le panneau soit rendu
  await new Promise(r => setTimeout(r, 50));
  
  // Obtenir les bounds du container
  const bounds = getDevToolsBounds();
  
  // Lier les DevTools au panneau via le main process
  try {
    const targetId = tab.webview.getWebContentsId();
    const success = await window.zenithAPI.openDevToolsInPanel(targetId, bounds);
    if (!success) {
      console.error('Échec ouverture DevTools');
    }
  } catch (e) {
    console.error('DevTools error:', e);
  }
}

async function closeDevToolsPanel() {
  const tab = tabs.find(t => t.id === activeTabId);
  const panel = document.getElementById('devtools-panel');
  const resizer = document.getElementById('devtools-resizer');
  
  // Fermer les DevTools via le main process
  try {
    const targetId = tab?.webview?.getWebContentsId();
    await window.zenithAPI.closeDevToolsPanel(targetId);
  } catch (e) {
    console.error('Error closing devtools:', e);
  }
  
  // Fermer le panneau UI
  panel.classList.remove('open');
  resizer.classList.remove('visible');
  devToolsOpen = false;
  document.getElementById('devtools-btn').classList.remove('active');
}

function openDevToolsInspect() {
  // Ouvrir le panneau DevTools seulement, sans appeler inspectElement
  // qui ouvrirait une fenêtre séparée
  if (!devToolsOpen) {
    openDevToolsPanel();
  }
}

function openDevToolsConsole() {
  openDevToolsPanel();
}


function goHome() { 
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab?.webview) {
    tab.webview.src = DEFAULT_PAGE;
    document.getElementById('url-bar').value = '';
  }
}
function focusUrlBar() { const urlBar = document.getElementById('url-bar'); urlBar.focus(); urlBar.select(); }
function updateSearchEnginePlaceholder() { document.getElementById('url-bar').placeholder = `Rechercher avec ${SEARCH_ENGINES[currentSearchEngine].name} ou entrer une URL`; }

function toggleSettingsMenu() {
  const menu = document.getElementById('settings-menu');
  const overlay = document.getElementById('settings-overlay');
  closePermissionsMenu(); // Fermer le menu des permissions si ouvert
  menu.classList.contains('visible') ? closeSettingsMenu() : (menu.classList.add('visible'), overlay.classList.add('visible'));
}

function closeSettingsMenu() {
  document.getElementById('settings-menu').classList.remove('visible');
  document.getElementById('settings-overlay').classList.remove('visible');
}

// === Système de Permissions ===
const PERMISSION_TYPES = {
  geolocation: { label: 'Localisation', icon: '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' },
  notifications: { label: 'Notifications', icon: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' },
  media: { label: 'Caméra/Micro', icon: '<svg viewBox="0 0 24 24"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>' },
  clipboard: { label: 'Presse-papiers', icon: '<svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>' },
  midi: { label: 'Appareils MIDI', icon: '<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' },
  pointerLock: { label: 'Souris', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
  fullscreen: { label: 'Plein écran', icon: '<svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>' }
};

let currentPermissionRequest = null;

function initializePermissions() {
  // Bouton permissions
  document.getElementById('permissions-btn').addEventListener('click', togglePermissionsMenu);
  document.getElementById('permissions-overlay').addEventListener('click', closePermissionsMenu);
  document.getElementById('reset-site-permissions').addEventListener('click', resetCurrentSitePermissions);
  
  // Boutons du modal de permission
  document.getElementById('permission-allow').addEventListener('click', () => handlePermissionResponse(true));
  document.getElementById('permission-deny').addEventListener('click', () => handlePermissionResponse(false));
  
  // Écouter les demandes de permission du main process
  window.zenithAPI.onPermissionRequest((data) => {
    showPermissionModal(data.origin, data.permission, data.permissionLabel);
  });
}

function togglePermissionsMenu() {
  const menu = document.getElementById('permissions-menu');
  const overlay = document.getElementById('permissions-overlay');
  closeSettingsMenu(); // Fermer le menu des paramètres si ouvert
  
  if (menu.classList.contains('visible')) {
    closePermissionsMenu();
  } else {
    updatePermissionsMenu();
    menu.classList.add('visible');
    overlay.classList.add('visible');
  }
}

function closePermissionsMenu() {
  document.getElementById('permissions-menu').classList.remove('visible');
  document.getElementById('permissions-overlay').classList.remove('visible');
}

async function updatePermissionsMenu() {
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (!activeTab || !activeTab.url) return;
  
  let origin;
  try {
    origin = new URL(activeTab.url).origin;
  } catch {
    origin = activeTab.url;
  }
  
  document.getElementById('current-site-origin').textContent = origin;
  
  const permissions = await window.zenithAPI.getSitePermissions(origin);
  const listEl = document.getElementById('permissions-list');
  
  if (Object.keys(PERMISSION_TYPES).length === 0) {
    listEl.innerHTML = '<div class="no-permissions">Aucune permission configurée</div>';
    return;
  }
  
  listEl.innerHTML = Object.entries(PERMISSION_TYPES).map(([key, { label, icon }]) => {
    const value = permissions[key];
    const isAllowed = value === true;
    const isBlocked = value === false;
    const isAsk = value === undefined || value === null;
    
    return `
      <div class="permission-item" data-permission="${key}" data-origin="${origin}">
        <div class="permission-item-info">
          <div class="perm-icon">${icon}</div>
          <span class="permission-item-label">${label}</span>
        </div>
        <div class="permission-item-status">
          <button class="permission-status-btn blocked ${isBlocked ? 'active' : ''}" data-value="false" title="Bloquer">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <button class="permission-status-btn ask ${isAsk ? 'active' : ''}" data-value="null" title="Demander">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </button>
          <button class="permission-status-btn allowed ${isAllowed ? 'active' : ''}" data-value="true" title="Autoriser">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  // Ajouter les event listeners
  listEl.querySelectorAll('.permission-status-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const item = e.target.closest('.permission-item');
      const permission = item.dataset.permission;
      const origin = item.dataset.origin;
      const valueStr = e.target.dataset.value;
      const value = valueStr === 'true' ? true : valueStr === 'false' ? false : null;
      
      await window.zenithAPI.setSitePermission(origin, permission, value);
      
      // Mettre à jour l'UI
      item.querySelectorAll('.permission-status-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
    });
  });
}

async function resetCurrentSitePermissions() {
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (!activeTab || !activeTab.url) return;
  
  try {
    const origin = new URL(activeTab.url).origin;
    await window.zenithAPI.removeSitePermissions(origin);
    updatePermissionsMenu();
    showNotification('Permissions réinitialisées');
  } catch {
    showNotification('Erreur lors de la réinitialisation');
  }
}

function showPermissionModal(origin, permission, permissionLabel) {
  const modal = document.getElementById('permission-modal');
  const typeInfo = PERMISSION_TYPES[permission] || { label: permissionLabel || permission };
  
  document.getElementById('permission-origin').textContent = origin;
  document.getElementById('permission-type').textContent = typeInfo.label.toLowerCase();
  
  currentPermissionRequest = { origin, permission };
  modal.classList.remove('modal-hidden');
}

function hidePermissionModal() {
  document.getElementById('permission-modal').classList.add('modal-hidden');
  currentPermissionRequest = null;
}

async function handlePermissionResponse(granted) {
  if (!currentPermissionRequest) return;
  
  const { origin, permission } = currentPermissionRequest;
  
  // Sauvegarder la réponse
  await window.zenithAPI.setSitePermission(origin, permission, granted);
  
  // Envoyer la réponse au main process
  window.zenithAPI.sendPermissionResponse(origin, permission, granted);
  
  hidePermissionModal();
  
  // Notification
  showNotification(granted ? 'Permission accordée' : 'Permission bloquée');
}

async function toggleAdBlocker() { const enabled = await window.zenithAPI.toggleAdBlocker(); updateAdBlockerUI(enabled); }
function updateAdBlockerUI(enabled) { document.getElementById('toggle-adblocker').classList.toggle('active', enabled); }
async function clearCookies() { if (await window.zenithAPI.clearCookies()) showNotification('Cookies supprimés'); }
async function toggleThirdPartyCookies() { const blocked = await window.zenithAPI.toggleThirdPartyCookies(); updateThirdPartyCookiesUI(blocked); }
function updateThirdPartyCookiesUI(blocked) { document.getElementById('toggle-third-party').classList.toggle('active', blocked); }

async function clearBrowsingData() {
  if (confirm('Effacer toutes les données de navigation ?')) {
    if (await window.zenithAPI.clearBrowsingData()) { showNotification('Données effacées'); tabs.forEach(t => t.webview?.reload()); }
  }
}

function showNotification(message) {
  const n = document.createElement('div');
  n.className = 'notification';
  n.innerHTML = `<svg class="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>${message}`;
  document.body.appendChild(n);
  setTimeout(() => n.classList.add('show'), 10);
  setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 250); }, 2500);
}

// === Context Menu ===
let currentContextMenu = null;

function showContextMenu(params, webview) {
  // Fermer l'ancien menu s'il existe
  if (currentContextMenu) {
    currentContextMenu.remove();
    currentContextMenu = null;
  }
  
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  
  const items = [];
  
  // Si on a sélectionné du texte
  if (params.selectionText) {
    items.push({
      label: 'Copier',
      icon: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
      action: () => webview.copy()
    });
    items.push({
      label: `Rechercher "${params.selectionText.slice(0, 20)}${params.selectionText.length > 20 ? '...' : ''}"`,
      icon: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      action: () => {
        const searchUrl = SEARCH_ENGINES[currentSearchEngine].url + encodeURIComponent(params.selectionText);
        createNewTab(searchUrl);
      }
    });
    items.push({ separator: true });
  }
  
  // Si c'est un lien
  if (params.linkURL) {
    items.push({
      label: 'Ouvrir le lien dans un nouvel onglet',
      icon: '<svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
      action: () => createNewTab(params.linkURL)
    });
    items.push({
      label: 'Copier l\'adresse du lien',
      icon: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
      action: () => navigator.clipboard.writeText(params.linkURL)
    });
    items.push({ separator: true });
  }
  
  // Si c'est une image
  if (params.mediaType === 'image' && params.srcURL) {
    items.push({
      label: 'Ouvrir l\'image dans un nouvel onglet',
      icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
      action: () => createNewTab(params.srcURL)
    });
    items.push({
      label: 'Copier l\'adresse de l\'image',
      icon: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
      action: () => navigator.clipboard.writeText(params.srcURL)
    });
    items.push({ separator: true });
  }
  
  // Actions générales
  items.push({
    label: 'Retour',
    icon: '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>',
    action: () => webview.goBack(),
    disabled: !webview.canGoBack()
  });
  items.push({
    label: 'Avancer',
    icon: '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>',
    action: () => webview.goForward(),
    disabled: !webview.canGoForward()
  });
  items.push({
    label: 'Actualiser',
    icon: '<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
    action: () => webview.reload()
  });
  
  items.push({ separator: true });
  
  // DevTools
  items.push({
    label: 'Inspecter',
    icon: '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    action: async () => {
      if (!devToolsOpen) {
        await openDevToolsPanel();
      }
      // Attendre que le panneau soit ouvert avant d'inspecter
      setTimeout(() => {
        webview.inspectElement(params.x, params.y);
      }, 300);
    },
    shortcut: 'Ctrl+Shift+C'
  });
  items.push({
    label: 'Outils de développement',
    icon: '<svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    action: () => toggleDevTools(),
    shortcut: 'F12'
  });
  
  // Générer le HTML du menu
  items.forEach(item => {
    if (item.separator) {
      const sep = document.createElement('div');
      sep.className = 'context-menu-separator';
      menu.appendChild(sep);
    } else {
      const menuItem = document.createElement('div');
      menuItem.className = 'context-menu-item' + (item.disabled ? ' disabled' : '');
      menuItem.innerHTML = `
        <span class="context-menu-icon">${item.icon}</span>
        <span class="context-menu-label">${item.label}</span>
        ${item.shortcut ? `<span class="context-menu-shortcut">${item.shortcut}</span>` : ''}
      `;
      if (!item.disabled) {
        menuItem.addEventListener('click', () => {
          item.action();
          menu.remove();
          currentContextMenu = null;
        });
      }
      menu.appendChild(menuItem);
    }
  });
  
  document.body.appendChild(menu);
  currentContextMenu = menu;
  
  // Positionner le menu
  const rect = menu.getBoundingClientRect();
  let x = params.x;
  let y = params.y;
  
  // Ajuster si le menu dépasse de l'écran
  if (x + rect.width > window.innerWidth) {
    x = window.innerWidth - rect.width - 10;
  }
  if (y + rect.height > window.innerHeight) {
    y = window.innerHeight - rect.height - 10;
  }
  
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  
  // Fermer le menu quand on clique ailleurs
  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      currentContextMenu = null;
      document.removeEventListener('click', closeMenu);
      document.removeEventListener('contextmenu', closeMenu);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
    document.addEventListener('contextmenu', closeMenu);
  }, 10);
}

// ========== SYSTÈME DE TÉLÉCHARGEMENTS ==========
let downloads = new Map();
let downloadsPanelOpen = false;
let activeDownloadsCount = 0;

function initializeDownloads() {
  // Écouter les événements de téléchargement
  window.zenithAPI.onDownloadStarted((data) => {
    downloads.set(data.id, data);
    activeDownloadsCount++;
    updateDownloadsBadge();
    addDownloadToUI(data);
    // Ouvrir automatiquement le panneau si c'est le premier téléchargement actif
    if (activeDownloadsCount === 1 && !downloadsPanelOpen) {
      openDownloadsPanel();
    }
  });

  window.zenithAPI.onDownloadProgress((data) => {
    const download = downloads.get(data.id);
    if (download) {
      download.receivedBytes = data.receivedBytes;
      download.totalBytes = data.totalBytes;
      download.state = data.state;
      download.isPaused = data.isPaused;
      download.speed = data.speed || 0;
      updateDownloadUI(data.id);
    }
  });

  window.zenithAPI.onDownloadCompleted((data) => {
    const download = downloads.get(data.id);
    if (download) {
      download.state = data.state;
      download.savePath = data.savePath;
      updateDownloadUI(data.id);
      activeDownloadsCount = Math.max(0, activeDownloadsCount - 1);
      updateDownloadsBadge();
    }
  });

  // Bouton et overlay
  document.getElementById('downloads-btn').addEventListener('click', toggleDownloadsPanel);
  document.getElementById('downloads-overlay').addEventListener('click', closeDownloadsPanel);
  document.getElementById('close-downloads').addEventListener('click', closeDownloadsPanel);
  document.getElementById('clear-downloads').addEventListener('click', clearDownloadHistory);

  // Charger les téléchargements existants
  loadExistingDownloads();
}

async function loadExistingDownloads() {
  try {
    const existingDownloads = await window.zenithAPI.getDownloads();
    existingDownloads.forEach(d => {
      downloads.set(d.id, d);
      if (d.state === 'progressing') activeDownloadsCount++;
      addDownloadToUI(d);
    });
    updateDownloadsBadge();
  } catch (e) {
    console.error('Erreur chargement téléchargements:', e);
  }
}

function toggleDownloadsPanel() {
  if (downloadsPanelOpen) {
    closeDownloadsPanel();
  } else {
    openDownloadsPanel();
  }
}

function openDownloadsPanel() {
  document.getElementById('downloads-panel').classList.add('active');
  document.getElementById('downloads-overlay').classList.add('active');
  downloadsPanelOpen = true;
}

function closeDownloadsPanel() {
  document.getElementById('downloads-panel').classList.remove('active');
  document.getElementById('downloads-overlay').classList.remove('active');
  downloadsPanelOpen = false;
}

function updateDownloadsBadge() {
  const badge = document.getElementById('downloads-badge');
  if (activeDownloadsCount > 0) {
    badge.textContent = activeDownloadsCount;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function addDownloadToUI(download) {
  const list = document.getElementById('downloads-list');
  const empty = list.querySelector('.downloads-empty');
  if (empty) empty.remove();

  const item = document.createElement('div');
  item.className = 'download-item';
  item.id = `download-${download.id}`;
  item.innerHTML = getDownloadItemHTML(download);
  
  // Insérer au début
  list.insertBefore(item, list.firstChild);
  
  // Attacher les événements
  attachDownloadEvents(item, download.id);
}

function getDownloadItemHTML(download) {
  const isCompleted = download.state === 'completed';
  const isFailed = download.state === 'cancelled' || download.state === 'interrupted';
  const isProgressing = download.state === 'progressing';
  const isPaused = download.isPaused;
  
  const iconClass = isCompleted ? 'completed' : (isFailed ? 'failed' : 'progressing');
  const icon = isCompleted ? 
    '<svg class="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>' :
    (isFailed ? 
      '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' :
      '<svg class="icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>');
  
  const progress = download.totalBytes > 0 ? 
    Math.round((download.receivedBytes / download.totalBytes) * 100) : 0;
  
  const statusText = getDownloadStatusText(download);
  const statusClass = isCompleted ? 'completed' : (isFailed ? 'failed' : '');
  
  let controls = '';
  if (isProgressing) {
    if (isPaused) {
      controls = `
        <button class="download-ctrl-btn resume" title="Reprendre"><svg class="icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>
        <button class="download-ctrl-btn cancel" title="Annuler"><svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      `;
    } else {
      controls = `
        <button class="download-ctrl-btn pause" title="Pause"><svg class="icon" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg></button>
        <button class="download-ctrl-btn cancel" title="Annuler"><svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      `;
    }
  } else if (isCompleted) {
    controls = `
      <button class="download-ctrl-btn open" title="Ouvrir"><svg class="icon" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></button>
      <button class="download-ctrl-btn folder" title="Afficher dans le dossier"><svg class="icon" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></button>
      <button class="download-ctrl-btn remove" title="Supprimer de la liste"><svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    `;
  } else {
    controls = `
      <button class="download-ctrl-btn remove" title="Supprimer de la liste"><svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    `;
  }

  return `
    <div class="download-icon ${iconClass}">${icon}</div>
    <div class="download-info">
      <div class="download-filename" title="${download.filename}">${download.filename}</div>
      <div class="download-status ${statusClass}">${statusText}</div>
      ${isProgressing ? `<div class="download-progress-bar"><div class="download-progress-fill" style="width: ${progress}%"></div></div>` : ''}
    </div>
    <div class="download-controls">${controls}</div>
  `;
}

function getDownloadStatusText(download) {
  const isCompleted = download.state === 'completed';
  const isFailed = download.state === 'cancelled' || download.state === 'interrupted';
  const isProgressing = download.state === 'progressing';
  
  if (isCompleted) {
    return `Terminé - ${formatFileSize(download.totalBytes || download.receivedBytes)}`;
  }
  
  if (isFailed) {
    return download.state === 'cancelled' ? 'Annulé' : 'Interrompu';
  }
  
  if (isProgressing) {
    const progress = download.totalBytes > 0 ? 
      Math.round((download.receivedBytes / download.totalBytes) * 100) : 0;
    
    if (download.isPaused) {
      return `En pause - ${progress}% de ${formatFileSize(download.totalBytes)}`;
    }
    
    const speedText = download.speed > 0 ? ` - ${formatFileSize(download.speed)}/s` : '';
    return `${formatFileSize(download.receivedBytes)} / ${formatFileSize(download.totalBytes)} (${progress}%)${speedText}`;
  }
  
  return 'En attente...';
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function updateDownloadUI(downloadId) {
  const download = downloads.get(downloadId);
  if (!download) return;
  
  const item = document.getElementById(`download-${downloadId}`);
  if (item) {
    item.innerHTML = getDownloadItemHTML(download);
    attachDownloadEvents(item, downloadId);
  }
}

function attachDownloadEvents(item, downloadId) {
  const download = downloads.get(downloadId);
  if (!download) return;

  const pauseBtn = item.querySelector('.pause');
  const resumeBtn = item.querySelector('.resume');
  const cancelBtn = item.querySelector('.cancel');
  const openBtn = item.querySelector('.open');
  const folderBtn = item.querySelector('.folder');
  const removeBtn = item.querySelector('.remove');

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => window.zenithAPI.pauseDownload(downloadId));
  }
  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => window.zenithAPI.resumeDownload(downloadId));
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => window.zenithAPI.cancelDownload(downloadId));
  }
  if (openBtn) {
    openBtn.addEventListener('click', () => window.zenithAPI.openDownload(download.savePath));
  }
  if (folderBtn) {
    folderBtn.addEventListener('click', () => window.zenithAPI.showDownloadInFolder(download.savePath));
  }
  if (removeBtn) {
    removeBtn.addEventListener('click', async () => {
      await window.zenithAPI.removeDownloadFromList(downloadId);
      downloads.delete(downloadId);
      item.remove();
      checkEmptyDownloads();
    });
  }
}

async function clearDownloadHistory() {
  await window.zenithAPI.clearDownloadHistory();
  // Retirer tous les téléchargements terminés de l'UI
  for (const [id, download] of downloads.entries()) {
    if (download.state !== 'progressing') {
      downloads.delete(id);
      const item = document.getElementById(`download-${id}`);
      if (item) item.remove();
    }
  }
  checkEmptyDownloads();
}

function checkEmptyDownloads() {
  const list = document.getElementById('downloads-list');
  if (downloads.size === 0) {
    list.innerHTML = `
      <div class="downloads-empty">
        <svg class="icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>Aucun téléchargement</span>
      </div>
    `;
  }
}

// ========== SYSTÈME D'HISTORIQUE ==========
function openHistoryPage() {
  // Créer un nouvel onglet avec la page d'historique interne
  const tabId = `tab-${++tabCounter}`;
  
  const tabElement = document.createElement('div');
  tabElement.className = 'tab';
  tabElement.id = tabId;
  tabElement.innerHTML = `
    <div class="tab-favicon">
      <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    </div>
    <span class="tab-title">Historique</span>
    <button class="tab-close" title="Fermer">
      <svg class="icon" viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
    </button>
  `;
  tabElement.addEventListener('click', (e) => { if (!e.target.closest('.tab-close')) switchToTab(tabId); });
  tabElement.querySelector('.tab-close').addEventListener('click', (e) => { e.stopPropagation(); closeTab(tabId); });
  
  // Clic molette pour fermer l'onglet
  tabElement.addEventListener('mousedown', (e) => {
    if (e.button === 1) {
      e.preventDefault();
      closeTab(tabId);
    }
  });
  
  const newTabBtn = document.getElementById('new-tab-btn');
  document.getElementById('tabs-container').insertBefore(tabElement, newTabBtn);
  
  // Créer le conteneur pour la page d'historique
  const historyPage = document.createElement('div');
  historyPage.id = `webview-${tabId}`;
  historyPage.className = 'browser-view history-page';
  historyPage.innerHTML = getHistoryPageHTML();
  
  document.getElementById('webviews-container').appendChild(historyPage);
  
  tabs.push({ id: tabId, url: 'zenith://history', title: 'Historique', isHistoryPage: true, element: historyPage });
  switchToTab(tabId);
  
  // Initialiser la page d'historique
  initializeHistoryPage(historyPage);
}

function getHistoryPageHTML() {
  return `
    <div class="history-container">
      <div class="history-header">
        <h1>
          <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Historique
        </h1>
        <div class="history-actions">
          <div class="history-search-container">
            <svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="history-search" placeholder="Rechercher dans l'historique..." autocomplete="off">
          </div>
          <button id="clear-all-history" class="history-btn danger">
            <svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Effacer tout l'historique
          </button>
        </div>
      </div>
      <div class="history-settings-bar">
        <label class="history-toggle">
          <input type="checkbox" id="history-enabled-toggle">
          <span class="toggle-slider"></span>
          <span class="toggle-label">Enregistrer l'historique de navigation</span>
        </label>
      </div>
      <div id="history-content">
        <div class="history-loading">Chargement de l'historique...</div>
      </div>
    </div>
  `;
}

async function initializeHistoryPage(container) {
  const settings = await window.zenithAPI.getHistorySettings();
  const toggle = container.querySelector('#history-enabled-toggle');
  const searchInput = container.querySelector('#history-search');
  const clearBtn = container.querySelector('#clear-all-history');
  const content = container.querySelector('#history-content');
  
  toggle.checked = settings.enabled;
  
  toggle.addEventListener('change', async () => {
    await window.zenithAPI.setHistoryEnabled(toggle.checked);
    loadHistoryContent(content, toggle.checked);
  });
  
  searchInput.addEventListener('input', debounce(async () => {
    if (!toggle.checked) return;
    const query = searchInput.value.trim();
    if (query) {
      const results = await window.zenithAPI.searchHistory(query);
      renderHistoryList(content, results, true);
    } else {
      const history = await window.zenithAPI.getHistory();
      renderHistoryList(content, history, true);
    }
  }, 300));
  
  clearBtn.addEventListener('click', async () => {
    if (confirm('Voulez-vous vraiment effacer tout l\'historique ?')) {
      await window.zenithAPI.clearHistory();
      loadHistoryContent(content, toggle.checked);
    }
  });
  
  loadHistoryContent(content, settings.enabled);
}

async function loadHistoryContent(container, enabled) {
  if (!enabled) {
    container.innerHTML = `
      <div class="history-disabled">
        <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
        <h2>L'historique est désactivé</h2>
        <p>Activez l'enregistrement de l'historique pour voir vos pages visitées.</p>
      </div>
    `;
    return;
  }
  
  const history = await window.zenithAPI.getHistory();
  renderHistoryList(container, history, true);
}

function renderHistoryList(container, history, groupByDay = true) {
  if (!history || history.length === 0) {
    container.innerHTML = `
      <div class="history-empty">
        <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <h2>Aucun historique</h2>
        <p>Les pages que vous visitez apparaîtront ici.</p>
      </div>
    `;
    return;
  }
  
  // Trier par date décroissante
  const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp);
  
  if (groupByDay) {
    const grouped = groupHistoryByDay(sorted);
    container.innerHTML = '';
    
    for (const [dateKey, items] of Object.entries(grouped)) {
      const daySection = document.createElement('div');
      daySection.className = 'history-day-section';
      daySection.innerHTML = `
        <div class="history-day-header">
          <span class="history-day-title">${formatHistoryDate(dateKey)}</span>
          <span class="history-day-count">${items.length} page${items.length > 1 ? 's' : ''}</span>
        </div>
        <div class="history-day-items"></div>
      `;
      
      const itemsContainer = daySection.querySelector('.history-day-items');
      items.forEach(item => {
        itemsContainer.appendChild(createHistoryItemElement(item));
      });
      
      container.appendChild(daySection);
    }
  } else {
    container.innerHTML = '';
    sorted.forEach(item => {
      container.appendChild(createHistoryItemElement(item));
    });
  }
}

function groupHistoryByDay(history) {
  const groups = {};
  history.forEach(item => {
    const date = new Date(item.timestamp);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
  });
  return groups;
}

function formatHistoryDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return "Aujourd'hui";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Hier";
  } else {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  }
}

function createHistoryItemElement(item) {
  const div = document.createElement('div');
  div.className = 'history-item';
  
  const time = new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const domain = getDomainFromUrl(item.url);
  
  div.innerHTML = `
    <div class="history-item-favicon">
      ${item.favicon ? `<img src="${item.favicon}" onerror="this.style.display='none'">` : ''}
      <svg class="icon fallback" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
    </div>
    <div class="history-item-info">
      <div class="history-item-title" title="${item.title || item.url}">${item.title || item.url}</div>
      <div class="history-item-url" title="${item.url}">${domain}</div>
    </div>
    <div class="history-item-time">${time}</div>
    <div class="history-item-actions">
      <button class="history-item-btn open" title="Ouvrir">
        <svg class="icon" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </button>
      <button class="history-item-btn delete" title="Supprimer">
        <svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `;
  
  div.querySelector('.open').addEventListener('click', () => {
    createNewTab(item.url);
  });
  
  div.querySelector('.delete').addEventListener('click', async () => {
    await window.zenithAPI.deleteHistoryEntry(item.timestamp);
    div.remove();
  });
  
  // Double-clic pour ouvrir
  div.addEventListener('dblclick', () => {
    createNewTab(item.url);
  });
  
  return div;
}

function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
