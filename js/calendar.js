// ===== CALENDAR WIDGET (new design) =====
// Calendrier compact avec preview d'événements

class CalendarWidget {
    constructor() {
        this.container = document.getElementById('calendarWidget');
        this.displayDate = new Date();
        this.currentDate = new Date();
        this.events = [];
        this.ecalendarUrl = '';
        this.db = null;
        this.DB_NAME = 'ZenithCalendarDB';
        this.DB_STORE = 'calendarCache';
    }

    async init() {
        if (!this.container) return;

        await this.initDB();

        const settings = JSON.parse(localStorage.getItem('zenithSettings') || '{}');
        this.ecalendarUrl = settings.ecalendarUrl || '';

        if (this.ecalendarUrl) {
            await this.fetchEvents();
        }

        this.render();
    }

    async initDB() {
        return new Promise((resolve) => {
            try {
                const req = indexedDB.open(this.DB_NAME, 1);
                req.onerror = () => resolve(null);
                req.onsuccess = (e) => { this.db = e.target.result; resolve(); };
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(this.DB_STORE)) {
                        db.createObjectStore(this.DB_STORE, { keyPath: 'id' });
                    }
                };
            } catch { resolve(null); }
        });
    }

    async saveEventsToCache(events) {
        if (!this.db) return;
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction([this.DB_STORE], 'readwrite');
                tx.objectStore(this.DB_STORE).put({
                    id: 'calendar_events',
                    events,
                    timestamp: Date.now(),
                    url: this.ecalendarUrl
                });
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            } catch { resolve(false); }
        });
    }

    async loadEventsFromCache() {
        if (!this.db) return null;
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction([this.DB_STORE], 'readonly');
                const req = tx.objectStore(this.DB_STORE).get('calendar_events');
                req.onsuccess = () => {
                    const data = req.result;
                    if (data && data.url === this.ecalendarUrl) resolve(data.events);
                    else resolve(null);
                };
                req.onerror = () => resolve(null);
            } catch { resolve(null); }
        });
    }

    setEcalendarUrl(url) {
        this.ecalendarUrl = url;
        const settings = JSON.parse(localStorage.getItem('zenithSettings') || '{}');
        settings.ecalendarUrl = url;
        localStorage.setItem('zenithSettings', JSON.stringify(settings));
        if (url) this.fetchEvents().then(() => this.render());
        else { this.events = []; this.render(); }
    }

    async fetchEvents() {
        if (!this.ecalendarUrl) return;

        const proxies = [
            (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
            (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
            (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
        ];

        let icsData = null;
        for (const proxyFn of proxies) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10000);
                const res = await fetch(proxyFn(this.ecalendarUrl), { signal: controller.signal });
                clearTimeout(timeout);
                if (!res.ok) continue;
                const text = await res.text();
                if (text.includes('BEGIN:VCALENDAR')) { icsData = text; break; }
            } catch { continue; }
        }

        if (icsData) {
            this.events = this.parseICS(icsData);
            await this.saveEventsToCache(this.events);
        } else {
            const cached = await this.loadEventsFromCache();
            if (cached) {
                this.events = cached.map(e => ({
                    ...e,
                    start: e.start ? new Date(e.start) : null,
                    end: e.end ? new Date(e.end) : null
                }));
            }
        }
    }

    parseICS(icsData) {
        const events = [];
        const blocks = icsData.split('BEGIN:VEVENT');
        for (let i = 1; i < blocks.length; i++) {
            const block = blocks[i].split('END:VEVENT')[0];
            const unfolded = block.replace(/\r?\n[ \t]/g, '');
            const lines = unfolded.split(/\r?\n/);
            const event = {};
            for (const line of lines) {
                if (!line.trim()) continue;
                const m = line.match(/^([^:;]+)(;[^:]*)?:(.*)/);
                if (!m) continue;
                const key = m[1].toUpperCase();
                const val = m[3];
                if (key === 'SUMMARY') event.title = this.unescapeICS(val);
                else if (key === 'DTSTART') event.start = this.parseICSDate(val);
                else if (key === 'DTEND') event.end = this.parseICSDate(val);
                else if (key === 'LOCATION') event.location = this.unescapeICS(val);
            }
            if (event.start) events.push(event);
        }
        return events;
    }

    unescapeICS(str) {
        return str.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
    }

    parseICSDate(s) {
        const isUTC = s.endsWith('Z');
        s = s.replace(/[^0-9T]/g, '');
        if (s.length === 8) {
            return new Date(+s.substring(0, 4), +s.substring(4, 6) - 1, +s.substring(6, 8));
        }
        if (s.length >= 15) {
            const Y = +s.substring(0, 4), M = +s.substring(4, 6) - 1, D = +s.substring(6, 8);
            const h = +s.substring(9, 11), m = +s.substring(11, 13);
            return isUTC ? new Date(Date.UTC(Y, M, D, h, m)) : new Date(Y, M, D, h, m);
        }
        return new Date(s);
    }

    getEventsForDate(date) {
        const ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return this.events.filter(e => {
            if (!e.start) return false;
            const es = `${e.start.getFullYear()}-${String(e.start.getMonth() + 1).padStart(2, '0')}-${String(e.start.getDate()).padStart(2, '0')}`;
            return es === ds;
        }).sort((a, b) => a.start - b.start);
    }

    getUpcomingEvents(limit = 2) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return this.events
            .filter(e => e.start && e.start >= now)
            .sort((a, b) => a.start - b.start)
            .slice(0, limit);
    }

    render() {
        if (!this.container) return;

        const year = this.displayDate.getFullYear();
        const month = this.displayDate.getMonth();

        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

        const firstDay = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let startDay = firstDay.getDay() - 1;
        if (startDay === -1) startDay = 6;

        const today = new Date();

        let daysHtml = '';
        for (let i = 0; i < startDay; i++) {
            daysHtml += '<div class="cal-day empty"></div>';
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = today.getMonth() === month && today.getFullYear() === year && d === today.getDate();
            const dayDate = new Date(year, month, d);
            const hasEvents = this.events.length > 0 && this.getEventsForDate(dayDate).length > 0;
            daysHtml += `<div class="cal-day${isToday ? ' today' : ''}${hasEvents ? ' has-event' : ''}" data-day="${d}" data-month="${month}" data-year="${year}">${d}</div>`;
        }

        // Upcoming events preview
        const upcoming = this.getUpcomingEvents(2);
        let eventsHtml = '';
        if (this.ecalendarUrl && upcoming.length > 0) {
            eventsHtml = upcoming.map(e => {
                const timeStr = (e.start.getHours() !== 0 || e.start.getMinutes() !== 0)
                    ? `${String(e.start.getHours()).padStart(2, '0')}:${String(e.start.getMinutes()).padStart(2, '0')}`
                    : 'Journée';
                const endStr = (e.end && (e.end.getHours() !== 0 || e.end.getMinutes() !== 0))
                    ? ` - ${String(e.end.getHours()).padStart(2, '0')}:${String(e.end.getMinutes()).padStart(2, '0')}`
                    : '';
                return `
                    <div class="cal-upcoming-event">
                        <div class="cal-event-dot"></div>
                        <div>
                            <div class="cal-event-title">${e.title || 'Sans titre'}</div>
                            <div class="cal-event-time">${timeStr}${endStr}</div>
                        </div>
                    </div>
                `;
            }).join('');
            eventsHtml += `<button class="cal-view-all">Voir tous les événements <i class="fas fa-chevron-right" style="font-size:0.55rem;"></i></button>`;
        } else if (this.ecalendarUrl) {
            eventsHtml = '<div class="cal-no-events">Aucun événement à venir</div>';
        }

        this.container.innerHTML = `
            <div class="cal-header">
                <button class="cal-nav-btn" id="calPrev"><i class="fas fa-chevron-left"></i></button>
                <span class="cal-month-title">${monthNames[month]} ${year}</span>
                <button class="cal-nav-btn" id="calNext"><i class="fas fa-chevron-right"></i></button>
            </div>
            <div class="cal-weekdays">
                <div class="cal-weekday">Lu</div>
                <div class="cal-weekday">Ma</div>
                <div class="cal-weekday">Me</div>
                <div class="cal-weekday">Je</div>
                <div class="cal-weekday">Ve</div>
                <div class="cal-weekday">Sa</div>
                <div class="cal-weekday">Di</div>
            </div>
            <div class="cal-grid">${daysHtml}</div>
            ${eventsHtml ? `<div class="cal-events-preview">${eventsHtml}</div>` : ''}
        `;

        this.container.querySelector('#calPrev').addEventListener('click', () => {
            this.displayDate.setMonth(this.displayDate.getMonth() - 1);
            this.render();
        });

        this.container.querySelector('#calNext').addEventListener('click', () => {
            this.displayDate.setMonth(this.displayDate.getMonth() + 1);
            this.render();
        });
    }
}

window.CalendarWidget = new CalendarWidget();
