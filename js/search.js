// ===== SEARCH MODULE =====
// Barre de recherche avec animation de caméra

function initSearch() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    
    if (!searchForm || !searchInput) return;
    
    // Animation de la caméra quand on focus/blur la barre de recherche
    searchInput.addEventListener('focus', () => {
        if (window.animationManager) {
            window.animationManager.focusCamera();
        }
    });
    
    searchInput.addEventListener('blur', () => {
        if (window.animationManager) {
            window.animationManager.unfocusCamera();
        }
    });
    
    // Soumission du formulaire
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            // Utilise le moteur de recherche Brave
            window.location.href = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
        }
    });
}

// Export
window.SearchModule = {
    initSearch
};
