// ===== TRANSLATION MODULE =====
// Système de traduction FR/EN

const userLang = navigator.language || navigator.userLanguage;
const isFrench = userLang.toLowerCase().startsWith('fr');
const currentLang = isFrench ? 'fr' : 'en';

// Fonction pour traduire la page
function translatePage() {
    const htmlRoot = document.getElementById('htmlRoot');
    htmlRoot.lang = currentLang;
    
    // Traduire tous les éléments avec data-fr et data-en
    document.querySelectorAll('[data-fr]').forEach(element => {
        const text = element.getAttribute(`data-${currentLang}`);
        if (text) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                // Pour les inputs, ne pas changer le textContent
            } else if (element.innerHTML.includes('<')) {
                // Si l'élément contient du HTML, utiliser innerHTML
                element.innerHTML = text;
            } else {
                element.textContent = text;
            }
        }
    });
    
    // Traduire les placeholders
    document.querySelectorAll('[data-fr-placeholder]').forEach(element => {
        const placeholder = element.getAttribute(`data-${currentLang}-placeholder`);
        if (placeholder) {
            element.placeholder = placeholder;
        }
    });
    
    // Traduire les boutons avec data-fr/data-en
    document.querySelectorAll('button[data-fr]').forEach(button => {
        const text = button.getAttribute(`data-${currentLang}`);
        if (text) {
            button.textContent = text;
        }
    });
}

// Export
window.TranslationModule = {
    currentLang,
    isFrench,
    translatePage
};
