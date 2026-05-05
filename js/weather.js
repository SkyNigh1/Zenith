// ===== WEATHER WIDGET (new design) =====
// Météo avec prévisions 5 jours — design compact

class WeatherWidget {
    constructor() {
        this.container = document.getElementById('weatherWidget');
        this.updateInterval = null;
        this.searchTimeout = null;
        this._lat = null;
        this._lon = null;
        this._city = null;
    }

    async init() {
        if (!this.container) return;
        await this.fetchWeather();
        this.updateInterval = setInterval(() => this.fetchWeather(), 30 * 60 * 1000);
    }

    async fetchWeather() {
        this.renderLoading();

        const settings = JSON.parse(localStorage.getItem('zenithSettings') || '{}');
        if (settings.weatherLocation) {
            const { lat, lon, name } = settings.weatherLocation;
            return this.fetchData(lat, lon, name);
        }

        if (!navigator.geolocation) return this.fetchByIP();

        navigator.geolocation.getCurrentPosition(
            (pos) => this.fetchData(pos.coords.latitude, pos.coords.longitude),
            () => this.fetchByIP(),
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
        );
    }

    async fetchByIP() {
        try {
            const res = await fetch('https://ipwho.is/');
            const data = await res.json();
            if (data.success) return this.fetchData(data.latitude, data.longitude, data.city);
            throw new Error();
        } catch {
            try {
                const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
                const data = await res.json();
                this.fetchData(parseFloat(data.latitude), parseFloat(data.longitude), data.city);
            } catch {
                this.renderError('Position indisponible');
            }
        }
    }

    async fetchData(lat, lon, cityName = null) {
        this._lat = lat;
        this._lon = lon;

        try {
            if (!cityName) {
                const geoRes = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`
                );
                const geoData = await geoRes.json();
                cityName = geoData.city || geoData.locality || 'Ma position';
            }
            this._city = cityName;

            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day` +
                `&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5`
            );
            const data = await weatherRes.json();
            this.render(cityName, data);
        } catch {
            this.renderError('Erreur météo');
        }
    }

    renderLoading() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="weather-loading">
                <i class="fas fa-cloud-sun"></i>
                <span>Chargement météo...</span>
            </div>
        `;
    }

    renderError(msg) {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="weather-loading">
                <i class="fas fa-exclamation-circle"></i>
                <span>${msg}</span>
            </div>
        `;
    }

    getWeatherDesc(code) {
        if (code === 0) return 'Ciel dégagé';
        if (code === 1) return 'Principalement dégagé';
        if (code === 2) return 'Partiellement nuageux';
        if (code === 3) return 'Couvert';
        if (code <= 48) return 'Brouillard';
        if (code <= 57) return 'Bruine';
        if (code <= 65) return 'Pluie';
        if (code <= 67) return 'Pluie verglaçante';
        if (code <= 77) return 'Neige';
        if (code <= 82) return 'Averses';
        if (code <= 86) return 'Averses de neige';
        if (code <= 99) return 'Orage';
        return 'Nuageux';
    }

    getForecastEmoji(code) {
        if (code === 0) return '☀️';
        if (code <= 2) return '⛅';
        if (code === 3) return '☁️';
        if (code <= 48) return '🌫️';
        if (code <= 57) return '🌧️';
        if (code <= 67) return '🌦️';
        if (code <= 77) return '❄️';
        if (code <= 82) return '🌧️';
        if (code <= 86) return '🌨️';
        if (code <= 99) return '⛈️';
        return '☁️';
    }

    getForecastDayLabel(dateStr) {
        const days = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
        const d = new Date(dateStr + 'T12:00:00');
        return days[d.getDay()];
    }

    // Reuse animation helpers from parent design
    getWeatherAnimation(code, isDay) {
        const isNight = isDay === 0;

        const getStars = () => {
            if (!isNight) return '';
            let stars = '<div class="weather-stars">';
            for (let i = 0; i < 20; i++) {
                const top = Math.random() * 100;
                const left = Math.random() * 100;
                const delay = Math.random() * 3;
                const duration = 1.5 + Math.random() * 2;
                const size = Math.random() > 0.7 ? 'large' : '';
                stars += `<div class="star ${size}" style="top:${top}%;left:${left}%;animation-delay:${delay}s;--duration:${duration}s"></div>`;
            }
            return stars + '</div>';
        };

        const getRain = (intensity = 'moderate') => {
            const count = intensity === 'light' ? 15 : intensity === 'heavy' ? 35 : 22;
            let rain = '<div class="weather-rain" style="top:45%;height:55%;">';
            for (let i = 0; i < count; i++) {
                const left = 20 + Math.random() * 60;
                const delay = Math.random();
                const dur = 0.6 + Math.random() * 0.3;
                const heavy = intensity === 'heavy' ? 'heavy' : '';
                rain += `<div class="rain-drop ${heavy}" style="left:${left}%;animation-delay:${delay}s;animation-duration:${dur}s"></div>`;
            }
            return rain + '</div>';
        };

        const getSnow = (intensity = 'moderate') => {
            const count = intensity === 'light' ? 12 : intensity === 'heavy' ? 32 : 20;
            let snow = '<div class="weather-snow" style="top:45%;height:55%;">';
            for (let i = 0; i < count; i++) {
                const left = 20 + Math.random() * 60;
                const delay = Math.random() * 5;
                const dur = 3 + Math.random() * 4;
                const scale = 0.6 + Math.random() * 0.8;
                snow += `<div class="snow-flake" style="left:${left}%;animation-delay:${delay}s;animation-duration:${dur}s;transform:scale(${scale})"></div>`;
            }
            return snow + '</div>';
        };

        const getFog = () => {
            let fog = '<div class="weather-fog">';
            for (let i = 0; i < 4; i++) {
                fog += `<div class="fog-layer" style="top:${30 + i * 20}%;animation-delay:${i * 1.5}s"></div>`;
            }
            return fog + '</div>';
        };

        const getCelestial = () => isNight
            ? `<div class="weather-moon-container"><div class="weather-moon"><div class="crater c1"></div><div class="crater c2"></div><div class="crater c3"></div></div><div class="moon-glow"></div></div>${getStars()}`
            : `<div class="weather-sun-container"><div class="weather-sun"></div><div class="sun-rays"></div></div>`;

        const getClouds = (type = 'few', isDark = false, isStorm = false) => {
            const dc = isDark ? 'dark' : '';
            let html = '<div class="weather-clouds-container">';
            if (type === 'few') {
                html += `<div class="weather-cloud ${dc} small" style="--d:0s;top:50%;left:65%"></div>`;
            } else if (type === 'scattered') {
                html += `<div class="weather-cloud ${dc} small" style="--d:-2s;top:40%;left:75%"></div>`;
                html += `<div class="weather-cloud ${dc}" style="--d:0s;top:55%;left:45%"></div>`;
            } else {
                if (isStorm) {
                    html += `<div class="weather-cloud ${dc} small" style="--d:-3s;top:25%;left:30%"></div>`;
                    html += `<div class="weather-cloud ${dc}" style="--d:-1s;top:35%;left:60%"></div>`;
                } else {
                    html += `<div class="weather-cloud ${dc} small" style="--d:-3s;top:35%;left:25%"></div>`;
                    html += `<div class="weather-cloud ${dc}" style="--d:-1s;top:45%;left:65%"></div>`;
                    html += `<div class="weather-cloud ${dc} large" style="--d:0s;top:60%;left:40%"></div>`;
                }
            }
            return html + '</div>';
        };

        const getLightning = () => `<div class="weather-lightning-container"><div class="lightning l1"></div><div class="lightning l2"></div><div class="lightning l3"></div><div class="lightning l4"></div></div>`;

        if (code === 0) return getCelestial();
        if (code === 1) return getCelestial() + getClouds('few', isNight);
        if (code === 2) return getCelestial() + getClouds('scattered', isNight);
        if (code === 3) return getClouds('overcast', true);
        if (code <= 48) return getFog() + (!isNight ? '<div class="weather-sun-container weak"><div class="weather-sun"></div></div>' : '');
        if (code >= 51 && code <= 57) return getClouds('broken', true) + getRain('light');
        if (code === 61) return getClouds('broken', true) + getRain('light');
        if (code === 63) return getClouds('overcast', true) + getRain('moderate');
        if (code === 65) return getClouds('overcast', true) + getRain('heavy');
        if (code >= 71 && code <= 75) {
            const i = code === 71 ? 'light' : code === 73 ? 'moderate' : 'heavy';
            return getClouds('overcast', true) + getSnow(i);
        }
        if (code >= 80 && code <= 82) return getClouds('scattered', true) + getRain('moderate');
        if (code === 85 || code === 86) return getClouds('scattered', true) + getSnow('moderate');
        if (code === 95) return getClouds('overcast', true, true) + getLightning();
        if (code === 96 || code === 99) return getClouds('overcast', true, true) + getLightning();
        return getCelestial();
    }

    render(city, data) {
        if (!this.container) return;

        const current = data.current;
        const daily = data.daily;

        const animHtml = this.getWeatherAnimation(current.weather_code, current.is_day);
        const desc = this.getWeatherDesc(current.weather_code);

        // Build 4-day forecast (skip day 0 = today)
        let forecastHtml = '';
        const daysAvailable = daily?.time?.length || 0;
        for (let i = 1; i <= 4 && i < daysAvailable; i++) {
            const dayLabel = this.getForecastDayLabel(daily.time[i]);
            const emoji = this.getForecastEmoji(daily.weather_code[i]);
            const maxT = Math.round(daily.temperature_2m_max[i]);
            const minT = Math.round(daily.temperature_2m_min[i]);
            forecastHtml += `
                <div class="forecast-item">
                    <span class="forecast-day-name">${dayLabel}</span>
                    <span class="forecast-emoji">${emoji}</span>
                    <span class="forecast-temps">
                        <span class="fmax">${maxT}°</span><span class="fmin">/${minT}°</span>
                    </span>
                </div>
            `;
        }

        this.container.innerHTML = `
            <div class="weather-top">
                <div class="weather-temp-block">
                    <div class="weather-temp">${Math.round(current.temperature_2m)}<span class="unit">°C</span></div>
                    <div class="weather-desc">${desc}</div>
                </div>
                <div class="weather-anim-wrapper">
                    <div class="weather-icon-container">${animHtml}</div>
                </div>
            </div>

            <div class="weather-details-row">
                <div class="weather-detail">
                    <i class="fas fa-wind"></i>
                    <span>${Math.round(current.wind_speed_10m)} km/h</span>
                </div>
                <div class="weather-detail">
                    <i class="fas fa-tint"></i>
                    <span>${current.relative_humidity_2m}%</span>
                </div>
                <div class="weather-detail weather-location-clickable" id="weatherLocationDisplay">
                    <i class="fas fa-map-marker-alt"></i>
                    <span class="city-name">${city}</span>
                </div>
            </div>

            <div id="weatherLocationEdit" style="display:none;">
                <div class="weather-location-input-row">
                    <input type="text" class="weather-location-input-field" id="weatherSearchInput" placeholder="Rechercher une ville..." autocomplete="off">
                </div>
                <div class="weather-suggestions-list" id="weatherSuggestions"></div>
            </div>

            ${forecastHtml ? `<div class="weather-forecast">${forecastHtml}</div>` : ''}
        `;

        this.attachLocationListeners();
    }

    attachLocationListeners() {
        const displayRow = this.container.querySelector('#weatherLocationDisplay');
        const editSection = this.container.querySelector('#weatherLocationEdit');
        const searchInput = this.container.querySelector('#weatherSearchInput');
        const suggestions = this.container.querySelector('#weatherSuggestions');

        if (!displayRow || !editSection) return;

        displayRow.addEventListener('click', () => {
            displayRow.style.display = 'none';
            editSection.style.display = 'block';
            searchInput?.focus();
        });

        searchInput?.addEventListener('input', (e) => {
            const q = e.target.value.trim();
            if (q.length < 2) { suggestions.classList.remove('active'); return; }
            if (this.searchTimeout) clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => this.fetchSuggestions(q), 300);
        });

        searchInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                editSection.style.display = 'none';
                displayRow.style.display = 'flex';
                suggestions.classList.remove('active');
            }
        });

        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                if (editSection) editSection.style.display = 'none';
                if (displayRow) displayRow.style.display = 'flex';
                if (suggestions) suggestions.classList.remove('active');
            }
        }, { once: false });
    }

    async fetchSuggestions(query) {
        try {
            const res = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=fr&format=json`
            );
            const data = await res.json();
            this.renderSuggestions(data.results || []);
        } catch {
            // silently ignore
        }
    }

    renderSuggestions(results) {
        const suggestions = this.container.querySelector('#weatherSuggestions');
        if (!suggestions) return;

        if (results.length === 0) { suggestions.classList.remove('active'); return; }

        suggestions.innerHTML = results.map(p => `
            <div class="weather-suggestion-item" data-lat="${p.latitude}" data-lon="${p.longitude}" data-name="${p.name}">
                ${p.name}
                <span class="suggestion-country">${p.admin1 || ''} ${p.country ? '— ' + p.country : ''}</span>
            </div>
        `).join('');

        suggestions.classList.add('active');

        suggestions.querySelectorAll('.weather-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const lat = item.dataset.lat;
                const lon = item.dataset.lon;
                const name = item.dataset.name;

                const settings = JSON.parse(localStorage.getItem('zenithSettings') || '{}');
                settings.weatherLocation = { lat, lon, name };
                localStorage.setItem('zenithSettings', JSON.stringify(settings));

                this.fetchData(lat, lon, name);
            });
        });
    }
}

window.WeatherWidget = new WeatherWidget();
