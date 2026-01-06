// ===== CALENDAR MODULE =====
// Gestion du calendrier avec intégration eCalendar

class CalendarModule {
    constructor() {
        this.isEnabled = false;
        this.card = null;
        this.currentDate = new Date();
        this.displayDate = new Date();
        this.events = [];
        this.ecalendarUrl = '';
        this.focusedDay = null;
        this.db = null;
        this.DB_NAME = 'ZenithCalendarDB';
        this.DB_STORE = 'calendarCache';
        
        // Planning properties
        this.planningContainer = null;
        this.planningDate = new Date(); // Current week reference
        this.isPlanningOpen = false;
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, 1);
            
            request.onerror = () => {
                console.error('Failed to open IndexedDB');
                resolve(null);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.DB_STORE)) {
                    db.createObjectStore(this.DB_STORE, { keyPath: 'id' });
                }
            };
        });
    }

    async saveEventsToCache(events) {
        if (!this.db) return;
        
        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction([this.DB_STORE], 'readwrite');
                const store = transaction.objectStore(this.DB_STORE);
                
                const data = {
                    id: 'calendar_events',
                    events: events,
                    timestamp: Date.now(),
                    url: this.ecalendarUrl
                };
                
                store.put(data);
                
                transaction.oncomplete = () => {
                    console.log('Calendar events saved to cache');
                    resolve(true);
                };
                
                transaction.onerror = () => {
                    console.error('Failed to save events to cache');
                    resolve(false);
                };
            } catch (e) {
                console.error('Error saving to cache:', e);
                resolve(false);
            }
        });
    }

    async loadEventsFromCache() {
        if (!this.db) return null;
        
        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction([this.DB_STORE], 'readonly');
                const store = transaction.objectStore(this.DB_STORE);
                const request = store.get('calendar_events');
                
                request.onsuccess = () => {
                    const data = request.result;
                    if (data && data.url === this.ecalendarUrl) {
                        console.log('Loaded events from cache, saved at:', new Date(data.timestamp).toLocaleString());
                        resolve(data.events);
                    } else {
                        resolve(null);
                    }
                };
                
                request.onerror = () => {
                    console.error('Failed to load events from cache');
                    resolve(null);
                };
            } catch (e) {
                console.error('Error loading from cache:', e);
                resolve(null);
            }
        });
    }

    async init() {
        this.card = document.getElementById('calendarCard');
        if (!this.card) return;

        // Initialize IndexedDB
        await this.initDB();

        // Load saved state
        const settings = localStorage.getItem('zenithSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.isEnabled = parsed.calendarEnabled || false;
            this.ecalendarUrl = parsed.ecalendarUrl || '';
        }

        // Initial render
        if (this.isEnabled) {
            this.enable();
        }

        // Setup toggle button
        const toggleBtn = document.getElementById('calendarToggleBtn');
        if (toggleBtn) {
            this.updateToggleButton(toggleBtn);
            toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Load events if URL is set
        if (this.ecalendarUrl) {
            this.fetchEvents();
        }

        // Planning Init
        this.initPlanning();

        // Global click listener to close events panel when clicking outside or on empty space
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('calendarEventsPanel');
            
            if (!panel || !panel.classList.contains('active')) return;

            // Don't close if clicking inside the panel
            if (panel.contains(e.target)) return;

            // Don't close if clicking on a day (handled by day listener)
            if (e.target.closest('.calendar-day')) return;

            // Don't close if clicking on nav buttons (handled by their listeners)
            if (e.target.closest('.calendar-nav')) return;

            // Close for any other click (outside wrapper or inside wrapper but on background)
            this.clearFocusAndHidePanel();
        });
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        
        // Save state
        const settings = JSON.parse(localStorage.getItem('zenithSettings') || '{}');
        settings.calendarEnabled = this.isEnabled;
        localStorage.setItem('zenithSettings', JSON.stringify(settings));

        // Update UI
        const toggleBtn = document.getElementById('calendarToggleBtn');
        if (toggleBtn) this.updateToggleButton(toggleBtn);

        if (this.isEnabled) {
            this.enable();
        } else {
            this.disable();
        }
    }

    updateToggleButton(btn) {
        const tooltip = document.getElementById('calendarTooltip');
        if (this.isEnabled) {
            btn.classList.add('active');
            btn.style.background = 'var(--glass-bg-hover)';
            btn.style.color = 'white';
            if (tooltip) {
                tooltip.setAttribute('data-fr', 'Désactiver le calendrier');
                tooltip.setAttribute('data-en', 'Disable calendar');
                const isEn = document.documentElement.lang === 'en';
                tooltip.textContent = isEn ? 'Disable calendar' : 'Désactiver le calendrier';
            }
        } else {
            btn.classList.remove('active');
            btn.style.background = '';
            btn.style.color = '';
            if (tooltip) {
                tooltip.setAttribute('data-fr', 'Activer le calendrier');
                tooltip.setAttribute('data-en', 'Enable calendar');
                const isEn = document.documentElement.lang === 'en';
                tooltip.textContent = isEn ? 'Enable calendar' : 'Activer le calendrier';
            }
        }
    }

    enable() {
        const wrapper = this.card.closest('.calendar-wrapper');
        if (wrapper) wrapper.classList.add('active');
        
        // Déterminer le margin cible selon l'état de la météo
        const weatherActive = document.querySelector('.weather-card.active');
        const targetMargin = weatherActive ? -80 : 0;
        
        if (typeof gsap !== 'undefined') {
            // Définir l'état initial avant l'animation
            gsap.set(this.card, { opacity: 0, marginBottom: targetMargin });
            this.card.classList.add('active');
            
            // Animer l'apparition
            gsap.to(this.card, {
                opacity: 1,
                duration: 0.4,
                ease: 'power2.out'
            });
        } else {
            this.card.style.marginBottom = targetMargin + 'px';
            this.card.style.opacity = '1';
            this.card.classList.add('active');
        }
        
        this.render();
    }

    disable() {
        const wrapper = this.card.closest('.calendar-wrapper');
        
        if (typeof gsap !== 'undefined') {
            gsap.to(this.card, {
                opacity: 0,
                marginBottom: 0,
                duration: 0.3,
                ease: 'power2.in',
                onComplete: () => {
                    this.card.classList.remove('active');
                    if (wrapper) wrapper.classList.remove('active');
                }
            });
        } else {
            this.card.style.opacity = '0';
            this.card.style.marginBottom = '0';
            this.card.classList.remove('active');
            if (wrapper) wrapper.classList.remove('active');
        }
        
        this.hideEventsPanel();
    }

    setEcalendarUrl(url) {
        this.ecalendarUrl = url;
        const settings = JSON.parse(localStorage.getItem('zenithSettings') || '{}');
        settings.ecalendarUrl = url;
        localStorage.setItem('zenithSettings', JSON.stringify(settings));
        
        if (url) {
            this.fetchEvents();
        } else {
            this.events = [];
            this.render();
        }
    }

    async fetchEvents() {
        if (!this.ecalendarUrl) return;
        
        let fetchSuccess = false;
        
        try {
            // Try multiple CORS proxies
            const proxies = [
                (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
                (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
                (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
                (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
                (url) => `https://api.cors.lol/?url=${encodeURIComponent(url)}`
            ];
            
            let icsData = null;
            let lastError = null;
            
            for (const proxyFn of proxies) {
                try {
                    const proxyUrl = proxyFn(this.ecalendarUrl);
                    console.log('Trying proxy:', proxyUrl);
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
                    
                    const response = await fetch(proxyUrl, {
                        signal: controller.signal,
                        headers: {
                            'Accept': 'text/calendar, text/plain, */*'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        console.log('Proxy returned status:', response.status);
                        continue;
                    }
                    
                    const data = await response.text();
                    console.log('Response preview:', data.substring(0, 200));
                    
                    // Check if we got valid ICS data with events
                    if (data.includes('BEGIN:VCALENDAR') && data.includes('BEGIN:VEVENT')) {
                        icsData = data;
                        console.log('Successfully fetched with events!');
                        break;
                    } else if (data.includes('BEGIN:VCALENDAR')) {
                        // Valid ICS but no events - might be empty calendar or wrong period
                        console.log('ICS received but no events found. Calendar might be empty for current period.');
                        icsData = data;
                        break;
                    } else {
                        console.log('Response does not contain valid ICS data');
                    }
                } catch (e) {
                    console.log('Proxy failed:', e.message);
                    lastError = e;
                }
            }
            
            if (!icsData) {
                throw new Error('All proxies failed' + (lastError ? ': ' + lastError.message : ''));
            }
            
            console.log('ICS data received, length:', icsData.length);
            console.log('ICS preview:', icsData.substring(0, 1000));
            
            this.events = this.parseICS(icsData);
            console.log('Parsed events:', this.events.length, this.events);
            fetchSuccess = true;
            
            // Save to cache on successful fetch
            await this.saveEventsToCache(this.events);
            
            this.render();
            this.updatePlanningButtonVisibility();
        } catch (error) {
            console.error('Error fetching eCalendar:', error);
            
            // Try to load from cache
            console.log('Attempting to load events from cache...');
            const cachedEvents = await this.loadEventsFromCache();
            
            if (cachedEvents && cachedEvents.length > 0) {
                console.log('Using cached events:', cachedEvents.length);
                this.events = cachedEvents.map(event => {
                    // Restore Date objects from cached data
                    return {
                        ...event,
                        start: event.start ? new Date(event.start) : null,
                        end: event.end ? new Date(event.end) : null
                    };
                });
                this.render();
                this.updatePlanningButtonVisibility();
            } else {
                console.log('No cached events available');
                this.events = [];
                this.render();
                this.updatePlanningButtonVisibility();
            }
        }
    }

    parseICS(icsData) {
        const events = [];
        
        // Split by VEVENT blocks
        const eventBlocks = icsData.split('BEGIN:VEVENT');
        console.log('Found event blocks:', eventBlocks.length - 1);
        
        for (let i = 1; i < eventBlocks.length; i++) {
            const block = eventBlocks[i].split('END:VEVENT')[0];
            const event = {};
            
            // Unfold lines (lines starting with space are continuations)
            const unfoldedBlock = block.replace(/\r?\n[ \t]/g, '');
            const lines = unfoldedBlock.split(/\r?\n/);
            
            for (const line of lines) {
                if (!line.trim()) continue;
                
                // Find the first colon that's not part of a parameter
                const colonMatch = line.match(/^([^:;]+)(;[^:]*)?:(.*)/);
                if (!colonMatch) continue;
                
                const key = colonMatch[1].toUpperCase();
                const value = colonMatch[3];
                
                switch (key) {
                    case 'SUMMARY':
                        event.title = this.unescapeICS(value);
                        break;
                    case 'DTSTART':
                        event.start = this.parseICSDate(value);
                        break;
                    case 'DTEND':
                        event.end = this.parseICSDate(value);
                        break;
                    case 'LOCATION':
                        event.location = this.unescapeICS(value);
                        break;
                    case 'DESCRIPTION':
                        event.description = this.unescapeICS(value);
                        break;
                }
            }
            
            if (event.start) {
                events.push(event);
            }
        }
        
        return events;
    }

    processICSProperty(event, key, value) {
        // Remove parameters from key (e.g., DTSTART;VALUE=DATE becomes DTSTART)
        const baseKey = key.split(';')[0];
        
        switch (baseKey) {
            case 'SUMMARY':
                event.title = this.unescapeICS(value);
                break;
            case 'DTSTART':
                event.start = this.parseICSDate(value);
                break;
            case 'DTEND':
                event.end = this.parseICSDate(value);
                break;
            case 'LOCATION':
                event.location = this.unescapeICS(value);
                break;
            case 'DESCRIPTION':
                event.description = this.unescapeICS(value);
                break;
        }
    }

    unescapeICS(str) {
        return str
            .replace(/\\n/g, '\n')
            .replace(/\\,/g, ',')
            .replace(/\\;/g, ';')
            .replace(/\\\\/g, '\\');
    }

    parseICSDate(dateStr) {
        // Handle different date formats
        // YYYYMMDD or YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
        
        // Check if the date is in UTC (ends with Z)
        const isUTC = dateStr.endsWith('Z');
        
        // Clean the string but remember if it was UTC
        dateStr = dateStr.replace(/[^0-9T]/g, '');
        
        if (dateStr.length === 8) {
            // All-day event: YYYYMMDD
            const year = parseInt(dateStr.substring(0, 4));
            const month = parseInt(dateStr.substring(4, 6)) - 1;
            const day = parseInt(dateStr.substring(6, 8));
            return new Date(year, month, day);
        } else if (dateStr.length >= 15) {
            // DateTime: YYYYMMDDTHHMMSS
            const year = parseInt(dateStr.substring(0, 4));
            const month = parseInt(dateStr.substring(4, 6)) - 1;
            const day = parseInt(dateStr.substring(6, 8));
            const hour = parseInt(dateStr.substring(9, 11));
            const minute = parseInt(dateStr.substring(11, 13));
            
            if (isUTC) {
                // If the date was in UTC, create it as UTC and let JavaScript convert to local time
                return new Date(Date.UTC(year, month, day, hour, minute));
            } else {
                // Local time
                return new Date(year, month, day, hour, minute);
            }
        }
        
        return new Date(dateStr);
    }

    getEventsForDate(date) {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        return this.events.filter(event => {
            if (!event.start) return false;
            const eventDateStr = `${event.start.getFullYear()}-${String(event.start.getMonth() + 1).padStart(2, '0')}-${String(event.start.getDate()).padStart(2, '0')}`;
            return eventDateStr === dateStr;
        }).sort((a, b) => a.start - b.start);
    }

    getEventTypeColor(eventTitle) {
        if (!eventTitle) return 'default';
        const title = eventTitle.toLowerCase();
        
        if (title.includes('cm')) return 'cm';
        if (title.includes('tp')) return 'tp';
        if (title.includes('sae')) return 'sae';
        if (title.includes('td')) return 'td';
        
        return 'default';
    }

    showEventsPanel(date, dayElement, isClick = false) {
        const panel = document.getElementById('calendarEventsPanel');
        const dateDisplay = document.getElementById('eventsPanelDate');
        const content = document.getElementById('eventsPanelContent');
        
        if (!panel || !dateDisplay || !content) return;

        // If it's a click, toggle focus
        if (isClick) {
            if (this.focusedDay === dayElement) {
                // Clicking on the same day unfocuses it
                this.focusedDay = null;
                this.hideEventsPanel();
                return;
            } else {
                // Remove focus class from previous day
                if (this.focusedDay) {
                    this.focusedDay.classList.remove('focused');
                }
                // Set new focused day
                this.focusedDay = dayElement;
                dayElement.classList.add('focused');
            }
        }

        const events = this.getEventsForDate(date);
        const isEn = document.documentElement.lang === 'en';
        
        // Format date
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        dateDisplay.textContent = date.toLocaleDateString(isEn ? 'en-US' : 'fr-FR', options);
        
        // Generate events HTML
        if (events.length === 0) {
            content.innerHTML = `<div class="no-events">${isEn ? 'No events' : 'Aucun événement'}</div>`;
        } else {
            content.innerHTML = events.map(event => {
                const timeStr = event.start.getHours() !== 0 || event.start.getMinutes() !== 0
                    ? `${String(event.start.getHours()).padStart(2, '0')}:${String(event.start.getMinutes()).padStart(2, '0')}`
                    : (isEn ? 'All day' : 'Journée');
                
                const endTimeStr = event.end && (event.end.getHours() !== 0 || event.end.getMinutes() !== 0)
                    ? ` - ${String(event.end.getHours()).padStart(2, '0')}:${String(event.end.getMinutes()).padStart(2, '0')}`
                    : '';
                
                const eventType = this.getEventTypeColor(event.title);
                
                return `
                    <div class="event-item event-type-${eventType}">
                        <div class="event-time">${timeStr}${endTimeStr}</div>
                        <div class="event-title">${event.title || (isEn ? 'No title' : 'Sans titre')}</div>
                        ${event.location ? `<div class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</div>` : ''}
                    </div>
                `;
            }).join('');
        }
        
        // Position logic
        const wrapper = this.card.closest('.calendar-wrapper');
        const wrapperRect = wrapper.getBoundingClientRect();
        const dayRect = dayElement.getBoundingClientRect();
        
        // Calculate position relative to wrapper
        const panelWidth = 250; // approx width with padding/border
        
        // Check if there is space on the right of the day
        const spaceOnRight = window.innerWidth - dayRect.right;
        
        let left, top;
        
        // Default to right if space permits, else left
        if (spaceOnRight >= panelWidth) {
            left = dayRect.right - wrapperRect.left + 10;
        } else {
            left = dayRect.left - wrapperRect.left - panelWidth - 10;
        }
        
        // Align top
        top = dayRect.top - wrapperRect.top;
        
        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
        
        panel.classList.add('active');
    }

    hideEventsPanel() {
        // Don't hide if a day is focused
        if (this.focusedDay) return;
        
        const panel = document.getElementById('calendarEventsPanel');
        if (panel) {
            panel.classList.remove('active');
        }
    }

    clearFocusAndHidePanel() {
        // Remove focus class from focused day
        if (this.focusedDay) {
            this.focusedDay.classList.remove('focused');
            this.focusedDay = null;
        }
        
        const panel = document.getElementById('calendarEventsPanel');
        if (panel) {
            panel.classList.remove('active');
        }
    }

    // ===== PLANNING FEATURES =====

    initPlanning() {
        this.planningContainer = document.getElementById('planningContainer');
        const planningBtn = document.getElementById('planningBtn');
        const closePlanningBtn = document.getElementById('closePlanningBtn');
        const prevWeekBtn = document.getElementById('prevWeekBtn');
        const nextWeekBtn = document.getElementById('nextWeekBtn');
        const todayBtn = document.getElementById('planningTodayBtn');

        if (planningBtn) {
            planningBtn.addEventListener('click', () => this.openPlanning());
        }

        if (closePlanningBtn) {
            closePlanningBtn.addEventListener('click', () => this.closePlanning());
        }

        if (prevWeekBtn) {
            prevWeekBtn.addEventListener('click', () => {
                this.planningDate.setDate(this.planningDate.getDate() - 7);
                this.renderPlanning();
            });
        }

        if (nextWeekBtn) {
            nextWeekBtn.addEventListener('click', () => {
                this.planningDate.setDate(this.planningDate.getDate() + 7);
                this.renderPlanning();
            });
        }

        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                this.planningDate = new Date();
                this.renderPlanning();
            });
        }

        // Initial check for button visibility
        this.updatePlanningButtonVisibility();
    }

    updatePlanningButtonVisibility() {
        const planningBtn = document.getElementById('planningBtn');
        if (planningBtn) {
            if (this.ecalendarUrl && this.events.length > 0) {
                planningBtn.style.display = 'flex';
            } else {
                planningBtn.style.display = 'none';
            }
        }
    }

    openPlanning() {
        if (!this.planningContainer) return;
        
        this.planningContainer.style.display = 'flex';
        this.isPlanningOpen = true;
        
        // Hide other UI elements
        document.querySelector('.widgets-container').style.display = 'none';
        document.querySelector('.menu-container').style.display = 'none';
        document.querySelector('.zenith-branding').style.display = 'none';
        
        this.renderPlanning();
    }

    closePlanning() {
        if (!this.planningContainer) return;
        
        this.planningContainer.style.display = 'none';
        this.isPlanningOpen = false;
        
        // Show other UI elements
        document.querySelector('.widgets-container').style.display = 'flex';
        document.querySelector('.menu-container').style.display = 'block';
        document.querySelector('.zenith-branding').style.display = 'flex';
    }

    getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
        return new Date(d.setDate(diff));
    }

    renderPlanning() {
        if (!this.isPlanningOpen) return;

        const startOfWeek = this.getStartOfWeek(this.planningDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        // Update Title
        const isEn = document.documentElement.lang === 'en';
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        const titleEl = document.getElementById('planningTitle');
        if (titleEl) {
            titleEl.textContent = `${isEn ? 'Week of' : 'Semaine du'} ${startOfWeek.toLocaleDateString(isEn ? 'en-US' : 'fr-FR', options)}`;
        }

        // Render Time Column (8:00 to 20:00)
        const timeColumn = document.getElementById('planningTimeColumn');
        if (timeColumn) {
            let timeHtml = '';
            for (let i = 8; i <= 20; i++) {
                timeHtml += `<div class="time-slot-label">${i}:00</div>`;
            }
            timeColumn.innerHTML = timeHtml;
        }

        // Render Grid
        const daysHeader = document.getElementById('planningDaysHeader');
        const grid = document.getElementById('planningGrid');
        
        if (daysHeader && grid) {
            daysHeader.innerHTML = '';
            grid.innerHTML = '';
            
            for (let i = 0; i < 7; i++) {
                const currentDay = new Date(startOfWeek);
                currentDay.setDate(startOfWeek.getDate() + i);
                
                const isToday = new Date().toDateString() === currentDay.toDateString();
                
                // Render Header
                const dayHeader = document.createElement('div');
                dayHeader.className = `planning-day-header ${isToday ? 'today' : ''}`;
                
                const dayName = currentDay.toLocaleDateString(isEn ? 'en-US' : 'fr-FR', { weekday: 'short' });
                const dayDate = currentDay.getDate();
                
                dayHeader.innerHTML = `
                    <div class="day-name">${dayName}</div>
                    <div class="day-date">${dayDate}</div>
                `;
                daysHeader.appendChild(dayHeader);
                
                // Render Content Column
                const dayColumn = document.createElement('div');
                dayColumn.className = 'planning-day-column';
                
                grid.appendChild(dayColumn);
                
                // Render Events for this day
                const dayEvents = this.getEventsForDate(currentDay);
                
                dayEvents.forEach(event => {
                    if (!event.start || !event.end) return;
                    
                    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
                    const endHour = event.end.getHours() + event.end.getMinutes() / 60;
                    
                    // Filter out events outside 8:00 - 21:00 range roughly
                    if (endHour < 8 || startHour > 21) return;
                    
                    // Calculate position (relative to 8:00 start)
                    const top = (startHour - 8) * 60; // 60px per hour
                    const height = (endHour - startHour) * 60;
                    
                    const eventEl = document.createElement('div');
                    const eventType = this.getEventTypeColor(event.title);
                    eventEl.className = `planning-event event-type-${eventType}`;
                    eventEl.style.top = `${top}px`;
                    eventEl.style.height = `${height}px`;
                    
                    const timeStr = `${String(event.start.getHours()).padStart(2, '0')}:${String(event.start.getMinutes()).padStart(2, '0')}`;
                    const endTimeStr = `${String(event.end.getHours()).padStart(2, '0')}:${String(event.end.getMinutes()).padStart(2, '0')}`;
                    
                    eventEl.innerHTML = `
                        <div class="event-time">${timeStr} - ${endTimeStr}</div>
                        <div class="event-title">${event.title}</div>
                        ${event.location ? `<div class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</div>` : ''}
                    `;
                    
                    dayColumn.appendChild(eventEl);
                });
            }
        }
    }

    render() {
        const year = this.displayDate.getFullYear();
        const month = this.displayDate.getMonth();
        
        // Month names
        const monthNamesFr = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        const isEn = document.documentElement.lang === 'en';
        const monthName = isEn ? monthNamesEn[month] : monthNamesFr[month];

        // Days in month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Day of week for first day (0 = Sunday, 1 = Monday, etc.)
        // Adjust for Monday start (0 = Monday, 6 = Sunday)
        let startDay = firstDay.getDay() - 1;
        if (startDay === -1) startDay = 6;

        // Generate grid
        let daysHtml = '';
        
        // Empty cells for previous month
        for (let i = 0; i < startDay; i++) {
            daysHtml += `<div class="calendar-day empty"></div>`;
        }

        // Days
        const today = new Date();
        const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = isCurrentMonth && i === today.getDate();
            const activeClass = isToday ? 'today' : '';
            
            // Check if day has events
            const dayDate = new Date(year, month, i);
            const dayEvents = this.getEventsForDate(dayDate);
            const hasEvents = dayEvents.length > 0 ? 'has-events' : '';
            
            daysHtml += `<div class="calendar-day ${activeClass} ${hasEvents}" data-day="${i}" data-month="${month}" data-year="${year}">${i}</div>`;
        }

        this.card.innerHTML = `
            <div class="calendar-header">
                <button class="calendar-nav" id="prevMonth"><i class="fas fa-chevron-left"></i></button>
                <h3>${monthName} ${year}</h3>
                <button class="calendar-nav" id="nextMonth"><i class="fas fa-chevron-right"></i></button>
            </div>
            <div class="calendar-weekdays">
                <div>${isEn ? 'Mo' : 'Lu'}</div>
                <div>${isEn ? 'Tu' : 'Ma'}</div>
                <div>${isEn ? 'We' : 'Me'}</div>
                <div>${isEn ? 'Th' : 'Je'}</div>
                <div>${isEn ? 'Fr' : 'Ve'}</div>
                <div>${isEn ? 'Sa' : 'Sa'}</div>
                <div>${isEn ? 'Su' : 'Di'}</div>
            </div>
            <div class="calendar-grid">
                ${daysHtml}
            </div>
        `;

        // Attach listeners
        this.card.querySelector('#prevMonth').addEventListener('click', () => {
            this.clearFocusAndHidePanel();
            this.displayDate.setMonth(this.displayDate.getMonth() - 1);
            this.render();
        });

        this.card.querySelector('#nextMonth').addEventListener('click', () => {
            this.clearFocusAndHidePanel();
            this.displayDate.setMonth(this.displayDate.getMonth() + 1);
            this.render();
        });

        // Attach hover and click listeners for events panel
        this.card.querySelectorAll('.calendar-day:not(.empty)').forEach(dayEl => {
            dayEl.addEventListener('mouseenter', () => {
                // Only show on hover if not already focused on another day
                if (!this.focusedDay || this.focusedDay === dayEl) {
                    const day = parseInt(dayEl.dataset.day);
                    const month = parseInt(dayEl.dataset.month);
                    const year = parseInt(dayEl.dataset.year);
                    const date = new Date(year, month, day);
                    this.showEventsPanel(date, dayEl, false);
                }
            });

            dayEl.addEventListener('click', () => {
                const day = parseInt(dayEl.dataset.day);
                const month = parseInt(dayEl.dataset.month);
                const year = parseInt(dayEl.dataset.year);
                const date = new Date(year, month, day);
                this.showEventsPanel(date, dayEl, true);
            });
        });

        // Hide panel when leaving calendar (only if no day is focused)
        this.card.addEventListener('mouseleave', () => {
            this.hideEventsPanel();
        });
    }
}

window.CalendarModule = new CalendarModule();
