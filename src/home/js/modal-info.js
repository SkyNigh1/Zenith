// ===== INFO MODAL MODULE =====
// Modale d'informations et d'installation

function initInfoModal() {
    const infoBtn = document.getElementById('infoBtn');
    const infoModal = document.getElementById('infoModalOverlay');
    const infoModalClose = document.getElementById('infoModalClose');
    const copyUrlBtn = document.getElementById('copyUrlBtn');
    const zenithUrlInput = document.getElementById('zenithUrl');
    
    if (!infoBtn || !infoModal) return;
    
    // Définir l'URL actuelle dans le champ
    if (zenithUrlInput) {
        zenithUrlInput.value = window.location.href;
    }
    
    // Ouvrir la modale d'informations
    infoBtn.addEventListener('click', () => {
        infoModal.classList.add('active');
    });
    
    // Fermer la modale d'informations
    function closeInfoModal() {
        if (window.ModalModule?.closeModalWithAnimation) {
            window.ModalModule.closeModalWithAnimation(infoModal);
        } else {
            infoModal.classList.remove('active');
        }
    }
    
    infoModalClose?.addEventListener('click', closeInfoModal);
    
    infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) {
            closeInfoModal();
        }
    });
    
    // Copier l'URL
    copyUrlBtn?.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(zenithUrlInput.value);
            copyUrlBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyUrlBtn.classList.add('copied');
            
            setTimeout(() => {
                copyUrlBtn.innerHTML = '<i class="fas fa-copy"></i>';
                copyUrlBtn.classList.remove('copied');
            }, 2000);
        } catch (err) {
            // Fallback pour les navigateurs plus anciens
            zenithUrlInput.select();
            document.execCommand('copy');
            copyUrlBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyUrlBtn.classList.add('copied');
            
            setTimeout(() => {
                copyUrlBtn.innerHTML = '<i class="fas fa-copy"></i>';
                copyUrlBtn.classList.remove('copied');
            }, 2000);
        }
    });
}

// Export
window.InfoModalModule = {
    initInfoModal
};
