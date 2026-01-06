// ===== CLOCK MODULE =====
// Horloge et date en temps réel

function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeElement = document.getElementById('time');
    if (timeElement) {
        timeElement.textContent = `${hours}:${minutes}`;
    }
}

function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const isFrench = window.TranslationModule?.isFrench || false;
    const locale = isFrench ? 'fr-FR' : 'en-US';
    const dateStr = now.toLocaleDateString(locale, options);
    const dateElement = document.getElementById('date');
    if (dateElement) {
        dateElement.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    }
}

function initClock() {
    updateTime();
    updateDate();
    setInterval(updateTime, 1000);
    setInterval(updateDate, 60000);
}

// Export
window.ClockModule = {
    initClock
};
