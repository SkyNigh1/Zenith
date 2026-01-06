// ===== WEATHER MODULE =====
// Gestion de la météo avec Open-Meteo API

class WeatherModule {
    constructor() {
        this.isEnabled = false;
        this.card = null;
        this.updateInterval = null;
        this.searchTimeout = null;
    }

    init() {
        this.card = document.getElementById('weatherCard');
        if (!this.card) return;

        // Load saved state
        const settings = localStorage.getItem('zenithSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.isEnabled = parsed.weatherEnabled || false;
        }

        // Initial render
        if (this.isEnabled) {
            this.enable();
        }

        // Setup toggle button
        const toggleBtn = document.getElementById('weatherToggleBtn');
        if (toggleBtn) {
            this.updateToggleButton(toggleBtn);
            toggleBtn.addEventListener('click', () => this.toggle());
        }
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        
        // Save state
        const settings = JSON.parse(localStorage.getItem('zenithSettings') || '{}');
        settings.weatherEnabled = this.isEnabled;
        localStorage.setItem('zenithSettings', JSON.stringify(settings));

        // Update UI
        const toggleBtn = document.getElementById('weatherToggleBtn');
        if (toggleBtn) this.updateToggleButton(toggleBtn);

        if (this.isEnabled) {
            this.enable();
        } else {
            this.disable();
        }
    }

    updateToggleButton(btn) {
        const tooltip = document.getElementById('weatherTooltip');
        if (this.isEnabled) {
            btn.classList.add('active');
            btn.style.background = 'var(--glass-bg-hover)';
            btn.style.color = 'white';
            if (tooltip) {
                tooltip.setAttribute('data-fr', 'Désactiver la météo en temps réel');
                tooltip.setAttribute('data-en', 'Disable real-time weather');
                // Update current text based on language (simple check)
                const isEn = document.documentElement.lang === 'en';
                tooltip.textContent = isEn ? 'Disable real-time weather' : 'Désactiver la météo en temps réel';
            }
        } else {
            btn.classList.remove('active');
            btn.style.background = '';
            btn.style.color = '';
            if (tooltip) {
                tooltip.setAttribute('data-fr', 'Activer la météo en temps réel');
                tooltip.setAttribute('data-en', 'Enable real-time weather');
                const isEn = document.documentElement.lang === 'en';
                tooltip.textContent = isEn ? 'Enable real-time weather' : 'Activer la météo en temps réel';
            }
        }
    }

    enable() {
        const calendarCard = document.querySelector('.calendar-card.active');
        
        if (typeof gsap !== 'undefined') {
            this.card.classList.add('active');
            
            const tl = gsap.timeline();
            
            // Animer l'apparition de la météo (expansion)
            tl.fromTo(this.card, 
                {
                    opacity: 0,
                    height: 0,
                    minHeight: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                    marginTop: 0,
                    marginBottom: 0,
                    borderWidth: 0,
                    overflow: 'hidden'
                },
                {
                    opacity: 1,
                    height: "auto",
                    minHeight: "350px",
                    paddingTop: "2rem",
                    paddingBottom: "2rem",
                    marginTop: 0,
                    marginBottom: 0,
                    borderWidth: "1px",
                    duration: 0.4,
                    ease: 'power2.out',
                    onComplete: () => {
                        gsap.set(this.card, { clearProps: "height,minHeight,paddingTop,paddingBottom,marginTop,marginBottom,borderWidth,overflow" });
                    }
                }, 0
            );
            
            // Animer le margin du calendrier si actif
            if (calendarCard) {
                tl.to(calendarCard, {
                    marginBottom: -80,
                    duration: 0.4,
                    ease: 'power2.out'
                }, 0);
            }
        } else {
            this.card.style.opacity = '1';
            this.card.classList.add('active');
            if (calendarCard) {
                calendarCard.style.marginBottom = '-80px';
            }
        }
        
        this.fetchWeather();
        
        // Update every 30 minutes
        this.updateInterval = setInterval(() => this.fetchWeather(), 30 * 60 * 1000);
    }

    disable() {
        const calendarCard = document.querySelector('.calendar-card.active');
        
        if (typeof gsap !== 'undefined') {
            // Créer une timeline pour synchroniser les animations
            const tl = gsap.timeline();
            
            // Animer la disparition de la météo et le déplacement du calendrier simultanément
            tl.to(this.card, {
                opacity: 0,
                height: 0,
                minHeight: 0,
                paddingTop: 0,
                paddingBottom: 0,
                marginTop: 0,
                marginBottom: 0,
                borderWidth: 0,
                duration: 0.4,
                ease: 'power2.out',
                onComplete: () => {
                    this.card.classList.remove('active');
                    gsap.set(this.card, { clearProps: "all" });
                }
            }, 0);
            
            if (calendarCard) {
                tl.to(calendarCard, {
                    marginBottom: 0,
                    duration: 0.4,
                    ease: 'power2.out'
                }, 0); // Démarrer en même temps (position 0)
            }
        } else {
            this.card.style.opacity = '0';
            this.card.classList.remove('active');
            if (calendarCard) {
                calendarCard.style.marginBottom = '0';
            }
        }
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    async fetchWeather() {
        this.renderLoading();

        // Check for manual location override
        const settings = JSON.parse(localStorage.getItem('zenithSettings') || '{}');
        if (settings.weatherLocation) {
            const { lat, lon, name } = settings.weatherLocation;
            this.fetchWeatherData(lat, lon, name);
            return;
        }

        // Options for geolocation
        const options = {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 0
        };

        if (!navigator.geolocation) {
            this.fetchByIP();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                this.fetchWeatherData(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.warn("Geolocation failed, trying IP fallback:", error);
                this.fetchByIP();
            },
            options
        );
    }

    async fetchByIP() {
        try {
            // Fallback to IP-based location using ipwho.is (CORS friendly)
            const res = await fetch('https://ipwho.is/');
            if (!res.ok) throw new Error('IP API failed');
            const data = await res.json();
            
            if (!data.success) {
                throw new Error('IP Geolocation failed: ' + data.message);
            }

            this.fetchWeatherData(data.latitude, data.longitude, data.city);
        } catch (error) {
            console.error("IP Geolocation error:", error);
            // Try backup service if primary fails
            try {
                const backupRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
                if (!backupRes.ok) throw new Error('Backup IP API failed');
                const backupData = await backupRes.json();
                this.fetchWeatherData(parseFloat(backupData.latitude), parseFloat(backupData.longitude), backupData.city);
            } catch (backupError) {
                console.error("Backup IP Geolocation error:", backupError);
                this.renderError("Position indisponible");
            }
        }
    }

    async fetchWeatherData(latitude, longitude, cityName = null) {
        try {
            // 1. Get City Name if not provided
            let city = cityName;
            if (!city) {
                const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`);
                const geoData = await geoRes.json();
                city = geoData.city || geoData.locality || "Ma Position";
            }

            // 2. Get Weather Data (Open-Meteo)
            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&daily=sunset&timezone=auto`
            );
            const weatherData = await weatherRes.json();

            this.render(city, weatherData);
        } catch (error) {
            console.error("Weather error:", error);
            this.renderError("Erreur météo");
        }
    }

    renderLoading() {
        this.card.innerHTML = '<div class="weather-loading">Chargement météo...</div>';
    }

    renderError(msg) {
        this.card.innerHTML = `<div class="weather-loading">${msg}</div>`;
    }

    render(city, data) {
        const current = data.current;
        const daily = data.daily;
        
        // Format sunset time
        const sunsetTime = new Date(daily.sunset[0]);
        const hours = sunsetTime.getHours();
        const minutes = sunsetTime.getMinutes().toString().padStart(2, '0');
        const sunsetText = `${hours}h${minutes}`;

        // Get animation HTML
        const animationHtml = this.getWeatherAnimation(current.weather_code, current.is_day);

        this.card.innerHTML = `
            <div class="weather-header">
                <div class="weather-location" id="weatherLocation">
                    <h2>${city}</h2>
                    <input type="text" class="weather-location-input" value="${city}" autocomplete="off">
                    <div class="weather-suggestions"></div>
                </div>
            </div>
            
            <div class="weather-main">
                <div class="weather-temp">
                    ${Math.round(current.temperature_2m)}<span>°</span>
                </div>
                <div class="weather-icon-container">
                    ${animationHtml}
                </div>
            </div>
            
            <div class="weather-details">
                <div class="detail-item">
                    <div class="detail-icon"><i class="fas fa-wind"></i></div>
                    <div class="detail-value">${Math.round(current.wind_speed_10m)} <span style="font-size:0.7em">km/h</span></div>
                    <div class="detail-label">Vent</div>
                </div>
                <div class="detail-item">
                    <div class="detail-icon"><i class="fas fa-tint"></i></div>
                    <div class="detail-value">${current.relative_humidity_2m}%</div>
                    <div class="detail-label">Humidité</div>
                </div>
                <div class="detail-item">
                    <div class="detail-icon"><i class="fas fa-moon"></i></div>
                    <div class="detail-value">${sunsetText}</div>
                    <div class="detail-label">Coucher</div>
                </div>
            </div>
        `;

        this.attachLocationListeners();
    }

    attachLocationListeners() {
        const container = this.card.querySelector('.weather-location');
        const input = this.card.querySelector('.weather-location-input');
        const h2 = this.card.querySelector('h2');
        const suggestions = this.card.querySelector('.weather-suggestions');

        if (!container || !input || !h2) return;

        // Switch to edit mode
        container.addEventListener('click', (e) => {
            if (container.classList.contains('editing') || e.target.closest('.weather-suggestions')) return;
            container.classList.add('editing');
            input.value = h2.textContent;
            input.focus();
            input.select();
        });

        // Handle input
        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length < 2) {
                suggestions.classList.remove('active');
                return;
            }

            if (this.searchTimeout) clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => this.fetchCitySuggestions(query), 300);
        });

        // Handle blur (click outside)
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                container.classList.remove('editing');
                suggestions.classList.remove('active');
            }
        });
        
        // Handle keys
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.fetchCitySuggestions(input.value);
            }
            if (e.key === 'Escape') {
                container.classList.remove('editing');
                suggestions.classList.remove('active');
            }
        });
    }

    async fetchCitySuggestions(query) {
        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=fr&format=json`);
            const data = await res.json();
            
            if (data.results) {
                this.renderSuggestions(data.results);
            } else {
                this.card.querySelector('.weather-suggestions').classList.remove('active');
            }
        } catch (error) {
            console.error("Search error:", error);
        }
    }

    renderSuggestions(results) {
        const suggestions = this.card.querySelector('.weather-suggestions');
        if (!suggestions) return;

        suggestions.innerHTML = results.map(place => `
            <div class="weather-suggestion-item" data-lat="${place.latitude}" data-lon="${place.longitude}" data-name="${place.name}" data-country="${place.country || ''}">
                <span class="name">${place.name}</span>
                <span class="country">${place.admin1 || ''} ${place.country ? '- ' + place.country : ''}</span>
            </div>
        `).join('');

        suggestions.classList.add('active');

        suggestions.querySelectorAll('.weather-suggestion-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const lat = item.dataset.lat;
                const lon = item.dataset.lon;
                const name = item.dataset.name;
                
                this.updateLocation(lat, lon, name);
                
                suggestions.classList.remove('active');
                this.card.querySelector('.weather-location').classList.remove('editing');
            });
        });
    }

    updateLocation(lat, lon, name) {
        // Save to settings
        const settings = JSON.parse(localStorage.getItem('zenithSettings') || '{}');
        settings.weatherLocation = { lat, lon, name };
        localStorage.setItem('zenithSettings', JSON.stringify(settings));

        // Fetch new weather
        this.fetchWeatherData(lat, lon, name);
    }

    getWeatherAnimation(code, isDay) {
        const isNight = isDay === 0;
        
        // Helper to generate stars
        const getStars = () => {
            if (!isNight) return '';
            let stars = '<div class="weather-stars">';
            for(let i=0; i<25; i++) {
                const top = Math.random() * 100;
                const left = Math.random() * 100;
                const delay = Math.random() * 3;
                const duration = 1.5 + Math.random() * 2;
                const size = Math.random() > 0.7 ? 'large' : '';
                stars += `<div class="star ${size}" style="top:${top}%; left:${left}%; animation-delay:${delay}s; --duration:${duration}s"></div>`;
            }
            stars += '</div>';
            return stars;
        };

        // Helper to generate rain
        const getRain = (intensity = 'moderate') => {
            let count = intensity === 'light' ? 15 : (intensity === 'heavy' ? 40 : 25);
            // Position rain container under clouds (approx top 45%)
            let rain = '<div class="weather-rain" style="top: 45%; height: 55%;">';
            for(let i=0; i<count; i++) {
                // Restrict drops to cloud area (20% - 80%)
                const left = 20 + Math.random() * 60;
                const delay = Math.random() * 1;
                const duration = 0.6 + Math.random() * 0.3;
                const heavyClass = intensity === 'heavy' ? 'heavy' : '';
                rain += `<div class="rain-drop ${heavyClass}" style="left:${left}%; animation-delay:${delay}s; animation-duration:${duration}s"></div>`;
            }
            rain += '</div>';
            return rain;
        };

        // Helper to generate snow
        const getSnow = (intensity = 'moderate') => {
            let count = intensity === 'light' ? 15 : (intensity === 'heavy' ? 40 : 25);
            // Position snow container under clouds
            let snow = '<div class="weather-snow" style="top: 45%; height: 55%;">';
            for(let i=0; i<count; i++) {
                // Restrict flakes to cloud area
                const left = 20 + Math.random() * 60;
                const delay = Math.random() * 5;
                const duration = 3 + Math.random() * 4;
                const size = 0.6 + Math.random() * 0.8;
                snow += `<div class="snow-flake" style="left:${left}%; animation-delay:${delay}s; animation-duration:${duration}s; transform: scale(${size})"></div>`;
            }
            snow += '</div>';
            return snow;
        };

        // Helper to generate hail
        const getHail = () => {
            let hail = '<div class="weather-hail" style="top: 45%; height: 55%;">';
            for(let i=0; i<15; i++) {
                const left = 20 + Math.random() * 60;
                const delay = Math.random();
                const duration = 0.4 + Math.random() * 0.2;
                hail += `<div class="hail-stone" style="left:${left}%; animation-delay:${delay}s; animation-duration:${duration}s"></div>`;
            }
            hail += '</div>';
            return hail;
        };

        // Helper to generate fog
        const getFog = () => {
            let fog = '<div class="weather-fog">';
            for(let i=0; i<4; i++) {
                const top = 30 + (i * 20);
                const delay = i * 1.5;
                fog += `<div class="fog-layer" style="top:${top}%; animation-delay:${delay}s"></div>`;
            }
            fog += '</div>';
            return fog;
        };

        // Helper for Sun/Moon
        const getCelestial = () => {
            if (isNight) {
                return `
                    <div class="weather-moon-container">
                        <div class="weather-moon">
                            <div class="crater c1"></div>
                            <div class="crater c2"></div>
                            <div class="crater c3"></div>
                        </div>
                        <div class="moon-glow"></div>
                    </div>
                    ${getStars()}
                `;
            } else {
                return `
                    <div class="weather-sun-container">
                        <div class="weather-sun"></div>
                        <div class="sun-rays"></div>
                    </div>
                `;
            }
        };

        // Helper for Clouds
        const getClouds = (type = 'few', isDark = false, isStorm = false) => {
            const darkClass = isDark ? 'dark' : '';
            let html = '<div class="weather-clouds-container">';
            
            if (type === 'few') {
                html += `<div class="weather-cloud ${darkClass} small" style="--d:0s; top: 50%; left: 65%"></div>`;
            } else if (type === 'scattered') {
                html += `<div class="weather-cloud ${darkClass} small" style="--d:-2s; top: 40%; left: 75%"></div>`;
                html += `<div class="weather-cloud ${darkClass}" style="--d:0s; top: 55%; left: 45%"></div>`;
            } else if (type === 'broken' || type === 'overcast') {
                if (isStorm) {
                    // For storms: position clouds higher, only two clouds
                    html += `<div class="weather-cloud ${darkClass} small" style="--d:-3s; top: 25%; left: 30%"></div>`;
                    html += `<div class="weather-cloud ${darkClass}" style="--d:-1s; top: 35%; left: 60%"></div>`;
                } else {
                    // Normal overcast
                    html += `<div class="weather-cloud ${darkClass} small" style="--d:-3s; top: 35%; left: 25%"></div>`;
                    html += `<div class="weather-cloud ${darkClass}" style="--d:-1s; top: 45%; left: 65%"></div>`;
                    html += `<div class="weather-cloud ${darkClass} large" style="--d:0s; top: 60%; left: 40%"></div>`;
                }
            }
            
            html += '</div>';
            return html;
        };

        // Helper for Lightning
        const getLightning = () => {
            return `
                <div class="weather-lightning-container">
                    <div class="lightning l1"></div>
                    <div class="lightning l2"></div>
                    <div class="lightning l3"></div>
                    <div class="lightning l4"></div>
                </div>
            `;
        };

        // --- LOGIC ---

        // 0: Clear sky
        if (code === 0) {
            return getCelestial();
        }

        // 1, 2, 3: Mainly clear, partly cloudy, and overcast
        if (code === 1) { // Mainly clear
            return getCelestial() + getClouds('few', isNight);
        }
        if (code === 2) { // Partly cloudy
            return getCelestial() + getClouds('scattered', isNight);
        }
        if (code === 3) { // Overcast
            return getClouds('overcast', true); // Always darkish for overcast
        }

        // 45, 48: Fog
        if (code === 45 || code === 48) {
            return getFog() + (isNight ? '' : '<div class="weather-sun-container weak"><div class="weather-sun"></div></div>');
        }

        // 51, 53, 55: Drizzle
        if (code >= 51 && code <= 55) {
            return getClouds('broken', true) + getRain('light');
        }

        // 61, 63, 65: Rain
        if (code === 61) return getClouds('broken', true) + getRain('light');
        if (code === 63) return getClouds('overcast', true) + getRain('moderate');
        if (code === 65) return getClouds('overcast', true) + getRain('heavy');

        // 80, 81, 82: Rain showers
        if (code >= 80 && code <= 82) {
            return getClouds('scattered', true) + getRain('moderate');
        }

        // 71, 73, 75: Snow
        if (code === 71) return getClouds('broken', true) + getSnow('light');
        if (code === 73) return getClouds('overcast', true) + getSnow('moderate');
        if (code === 75) return getClouds('overcast', true) + getSnow('heavy');

        // 85, 86: Snow showers
        if (code === 85 || code === 86) {
            return getClouds('scattered', true) + getSnow('moderate');
        }

        // 95: Thunderstorm
        if (code === 95) {
            return getClouds('overcast', true, true) + getLightning();
        }

        // 96, 99: Thunderstorm with hail
        if (code === 96 || code === 99) {
            return getClouds('overcast', true, true) + getLightning() + getHail();
        }

        // Default
        return getCelestial();
    }
}

// Export
window.WeatherModule = new WeatherModule();
