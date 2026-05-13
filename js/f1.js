// ===== F1 WIDGET =====
// Schedule : Google Calendar iCal (public)
// Standings : Jolpica API (Ergast successor, free, no key, CORS)
// Circuit images : Wikipedia pageimages API (free, CORS)

const F1_ICAL_URL  = 'https://calendar.google.com/calendar/ical/fa9bjl6tu13dd10b066stoo5do%40group.calendar.google.com/public/basic.ics';
const F1_CACHE_KEY  = 'zenithF1Cache';
const F1_IMG_CACHE  = 'zenithF1ImgCache_V11';
const F1_CACHE_TTL  = 30 * 60 * 1000; // 30 min

const F1_LOGO_BASE = 'https://bellmedia-images.stats.bellmedia.ca/resize/images/sports/auto_racing/f1/';

// ─── Circuits ────────────────────────────────────────────────────────────────

const F1_CIRCUITS = [
    { keys: ['bahrain'],                              label: 'Bahreïn',         gpName: 'Bahrain',          wiki: 'Bahrain_International_Circuit' },
    { keys: ['saudi', 'arabie'],                      label: 'Arabie Saoudite', gpName: 'Saudi_Arabian',    wiki: 'Jeddah_Street_Circuit' },
    { keys: ['australian', 'australia'],              label: 'Australie',       gpName: 'Australian',       wiki: 'Albert_Park_Circuit' },
    { keys: ['japanese', 'japan'],                    label: 'Japon',           gpName: 'Japanese',         wiki: 'Suzuka_International_Racing_Course' },
    { keys: ['chinese', 'china'],                     label: 'Chine',           gpName: 'Chinese',          wiki: 'Shanghai_International_Circuit' },
    { keys: ['miami'],                                label: 'Miami',           gpName: 'Miami',            wiki: 'Miami_International_Autodrome' },
    { keys: ['emilia', 'imola', 'romagna'],           label: 'Émilie-Romagne',  gpName: 'Emilia_Romagna',   wiki: 'Autodromo_Enzo_e_Dino_Ferrari' },
    { keys: ['monaco'],                               label: 'Monaco',          gpName: 'Monaco',           wiki: 'Circuit_de_Monaco' },
    { keys: ['spanish', 'spain'],                     label: 'Espagne',         gpName: 'Spanish',          wiki: 'Circuit_de_Barcelona-Catalunya' },
    { keys: ['canadian', 'canada'],                   label: 'Canada',          gpName: 'Canadian',         wiki: 'Circuit_Gilles_Villeneuve' },
    { keys: ['austrian', 'austria'],                  label: 'Autriche',        gpName: 'Austrian',         wiki: 'Red_Bull_Ring' },
    { keys: ['british', 'britain', 'silverstone'],    label: 'Grande-Bretagne', gpName: 'British',          wiki: 'Silverstone_Circuit' },
    { keys: ['belgian', 'belgium', 'spa'],            label: 'Belgique',        gpName: 'Belgian',          wiki: 'Circuit_de_Spa-Francorchamps' },
    { keys: ['hungarian', 'hungary'],                 label: 'Hongrie',         gpName: 'Hungarian',        wiki: 'Hungaroring' },
    { keys: ['dutch', 'netherlands', 'zandvoort'],    label: 'Pays-Bas',        gpName: 'Dutch',            wiki: 'Circuit_Zandvoort' },
    { keys: ['italian', 'italy', 'monza'],            label: 'Italie',          gpName: 'Italian',          wiki: 'Autodromo_Nazionale_Monza' },
    { keys: ['azerbaijan', 'baku'],                   label: 'Azerbaïdjan',     gpName: 'Azerbaijan',       wiki: 'Baku_City_Circuit' },
    { keys: ['singapore'],                            label: 'Singapour',       gpName: 'Singapore',        wiki: 'Marina_Bay_Street_Circuit' },
    { keys: ['united states', 'austin', 'cota'],      label: 'États-Unis',      gpName: 'United_States',    wiki: 'Circuit_of_the_Americas' },
    { keys: ['mexico', 'mexican'],                    label: 'Mexique',         gpName: 'Mexico_City',      wiki: 'Autodromo_Hermanos_Rodriguez' },
    { keys: ['brazil', 'brazilian', 'sao paulo', 'interlagos'], label: 'Brésil', gpName: 'São_Paulo',      wiki: 'Autodromo_Jose_Carlos_Pace' },
    { keys: ['las vegas'],                            label: 'Las Vegas',       gpName: 'Las_Vegas',        wiki: 'Las_Vegas_Street_Circuit' },
    { keys: ['qatar'],                                label: 'Qatar',           gpName: 'Qatar',            wiki: 'Lusail_International_Circuit' },
    { keys: ['abu dhabi'],                            label: 'Abu Dhabi',       gpName: 'Abu_Dhabi',        wiki: 'Yas_Marina_Circuit' },
];

// ─── Team colors, abbreviations & logos ──────────────────────────────────────

const F1_TEAMS = {
    red_bull:     { abbr: 'RBR', color: '#3671C6', logo: F1_LOGO_BASE + 'oracle-red-bull.webp' },
    ferrari:      { abbr: 'FER', color: '#E8002D', logo: F1_LOGO_BASE + 'scuderia-ferrari-hp.webp' },
    mercedes:     { abbr: 'MER', color: '#00A19C', logo: F1_LOGO_BASE + 'mercedes-amg-petronas.webp' },
    mclaren:      { abbr: 'MCL', color: '#FF8000', logo: F1_LOGO_BASE + 'mclaren.webp' },
    aston_martin: { abbr: 'AMR', color: '#229971', logo: F1_LOGO_BASE + 'aston-martin-aramco.webp' },
    alpine:       { abbr: 'ALP', color: '#0093CC', logo: F1_LOGO_BASE + 'bwt-alpine.webp' },
    williams:     { abbr: 'WIL', color: '#64C4FF', logo: F1_LOGO_BASE + 'atlassian-williams.webp' },
    rb:           { abbr: 'RB',  color: '#6692FF', logo: F1_LOGO_BASE + 'visa-cash-app-racing-bulls.webp' },
    alphatauri:   { abbr: 'AT',  color: '#4E7C9B', logo: F1_LOGO_BASE + 'visa-cash-app-racing-bulls.webp' },
    kick_sauber:  { abbr: 'SAU', color: '#52E252', logo: null },
    sauber:       { abbr: 'SAU', color: '#52E252', logo: null },
    haas:         { abbr: 'HAA', color: '#B6BABD', logo: F1_LOGO_BASE + 'moneygram-haas.webp' },
    audi:         { abbr: 'AUD', color: '#BB0A14', logo: F1_LOGO_BASE + 'revolut-audi.webp' },
    cadillac:     { abbr: 'CAD', color: '#1A3A5C', logo: F1_LOGO_BASE + 'cadillac.webp' },
};

function _teamInfo(constructorId) {
    const id = (constructorId || '').toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_');
    for (const [key, info] of Object.entries(F1_TEAMS)) {
        if (id === key || id.includes(key) || key.includes(id)) return { ...info, _key: key };
    }
    return { abbr: id.slice(0, 3).toUpperCase(), color: '#666', wikiLogo: null, _key: id };
}

// ─── Widget ───────────────────────────────────────────────────────────────────

class F1Widget {
    constructor() {
        this.container = document.getElementById('f1Widget');
        this._timer    = null;
    }

    async init() {
        if (!this.container) return;
        await this.refresh();
        this._timer = setInterval(() => this.refresh(), F1_CACHE_TTL);
    }

    async refresh() {
        try {
            const c = JSON.parse(localStorage.getItem(F1_CACHE_KEY) || 'null');
            if (c && Date.now() - c.ts < F1_CACHE_TTL) {
                this._render(c.race, c.standings);
                this._loadTeamLogos(c.standings);
                if (c.race?.circuitWiki) this._applyCircuitImg(c.race.circuitWiki, c.race.circuitGpName, new Date(c.race.start).getFullYear());
                return;
            }
        } catch {}

        this._renderLoading();
        try {
            const [race, standings] = await Promise.all([
                this._fetchNextRace(),
                this._fetchStandings(),
            ]);

            // circuitImg is never persisted in the main cache — image cache handles it
            try {
                localStorage.setItem(F1_CACHE_KEY, JSON.stringify({ ts: Date.now(), race, standings }));
            } catch {}

            this._render(race, standings);
            this._loadTeamLogos(standings);
            if (race?.circuitWiki) this._applyCircuitImg(race.circuitWiki, race.circuitGpName, new Date(race.start).getFullYear());
        } catch (e) {
            console.error('[F1Widget]', e);
            this._renderError();
        }
    }

    // ─── iCal ─────────────────────────────────────────────────────────────────

    async _fetchNextRace() {
        const proxy = `https://corsproxy.io/?url=${encodeURIComponent(F1_ICAL_URL)}`;
        const res = await fetch(proxy, { signal: AbortSignal.timeout(12000) });
        if (!res.ok) throw new Error('iCal HTTP ' + res.status);
        return this._parseNextRace(await res.text());
    }

    _parseNextRace(text) {
        // Unfold RFC 5545 line continuations
        const src = text.replace(/\r\n[ \t]/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const events = [];
        let ev = null;

        for (const raw of src.split('\n')) {
            const line = raw.trim();
            if (line === 'BEGIN:VEVENT') { ev = {}; continue; }
            if (line === 'END:VEVENT' && ev) { events.push(ev); ev = null; continue; }
            if (!ev) continue;
            const ci = line.indexOf(':');
            if (ci < 0) continue;
            const key = line.slice(0, ci).replace(/;[^:]*$/, '');
            const val = line.slice(ci + 1);
            if (key === 'SUMMARY') ev.summary = val;
            if (key === 'DTSTART') ev.start   = this._parseDate(val);
            if (key === 'DTEND')   ev.end     = this._parseDate(val);
        }

        const now = Date.now();
        const races = events.filter(e => {
            if (!e.summary || !e.start) return false;
            const s = e.summary.toLowerCase();
            if (!s.includes('grand prix')) return false;
            if (/practice\s*\d|qualifying|sprint shootout|warm.up|pit lane/i.test(s)) return false;
            return !e.end || e.end.getTime() > now;
        });

        races.sort((a, b) => a.start - b.start);
        const next = races[0];
        if (!next) return null;

        const circuit = F1_CIRCUITS.find(c => c.keys.some(k => next.summary.toLowerCase().includes(k)));
        return {
            summary:       next.summary,
            start:         next.start.toISOString(),
            circuitLabel:  circuit?.label  ?? null,
            circuitGpName: circuit?.gpName ?? null,
            circuitWiki:   circuit?.wiki   ?? null,
        };
    }

    _parseDate(val) {
        if (/^\d{8}$/.test(val)) {
            return new Date(+val.slice(0,4), +val.slice(4,6)-1, +val.slice(6,8));
        }
        if (/^\d{8}T\d{6}Z?$/.test(val)) {
            return new Date(Date.UTC(+val.slice(0,4), +val.slice(4,6)-1, +val.slice(6,8),
                                    +val.slice(9,11), +val.slice(11,13), +val.slice(13,15)));
        }
        return null;
    }

    // ─── Standings ────────────────────────────────────────────────────────────

    async _fetchStandings() {
        const url = 'https://api.jolpi.ca/ergast/f1/current/driverStandings.json';
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error('Standings HTTP ' + res.status);
        const json = await res.json();
        const list = json.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
        return list.slice(0, 3).map(ds => ({
            pos:           +ds.position,
            driver:        `${ds.Driver.givenName} ${ds.Driver.familyName}`,
            points:        parseFloat(ds.points),
            constructorId: ds.Constructors[0]?.constructorId ?? '',
        }));
    }

    // ─── Circuit image helpers ────────────────────────────────────────────────

    _applyCircuitImg(wikiPage, gpName, year) {
        this._fetchCircuitImg(wikiPage, gpName, year).then(imgUrl => {
            if (!imgUrl) return;
            const bgEl = this.container.querySelector('.f1-circuit-bg');
            if (bgEl) bgEl.style.backgroundImage = `url('${imgUrl}')`;
        });
    }

    // DuckDuckGo Images via corsproxy : vqd token → i.js → première URL image.

    async _fetchCircuitImg(wikiPage, gpName, year) {
        try {
            const ic = JSON.parse(localStorage.getItem(F1_IMG_CACHE) || '{}');
            if (ic[wikiPage]) return ic[wikiPage];
        } catch {}

        const name = gpName ? gpName.replace(/_/g, ' ') : wikiPage.replace(/_/g, ' ');
        const q    = `formula 1 ${name} grand prix race cars photo`;
        let imgUrl = null;

        try {
            const ddgPage = `https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=images&ia=images`;
            const pageRes = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(ddgPage)}`,
                { signal: AbortSignal.timeout(9000) });
            if (pageRes.ok) {
                const html = await pageRes.text();
                const vqd  = html.match(/vqd=['"]([^'"]+)['"]/)?.[1];
                if (vqd) {
                    const apiUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(q)}&vqd=${encodeURIComponent(vqd)}&p=1&type=photo&o=json`;
                    const imgRes = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(apiUrl)}`,
                        { signal: AbortSignal.timeout(9000) });
                    if (imgRes.ok) {
                        const data = await imgRes.json();
                        const hit  = (data.results ?? []).find(r =>
                            r.image && /^https?:\/\//i.test(r.image) && !/\.(svg|gif|webm)$/i.test(r.image)
                        );
                        if (hit) imgUrl = hit.image;
                    }
                }
            }
        } catch {}

        if (!imgUrl) return null;
        try {
            const ic = JSON.parse(localStorage.getItem(F1_IMG_CACHE) || '{}');
            ic[wikiPage] = imgUrl;
            localStorage.setItem(F1_IMG_CACHE, JSON.stringify(ic));
        } catch {}
        return imgUrl;
    }

    // ─── Team logos (static URLs) ─────────────────────────────────────────────

    _loadTeamLogos(standings) {
        for (const d of (standings ?? [])) {
            const { logo, abbr } = _teamInfo(d.constructorId);
            if (!logo) continue;
            this.container.querySelectorAll(`.f1-team-badge[data-cid="${d.constructorId}"]`).forEach(badge => {
                badge.innerHTML = `<img src="${logo}" alt="${abbr}">`;
            });
        }
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    _renderLoading() {
        this.container.innerHTML = `
            <div class="f1-loading">
                <i class="fas fa-flag-checkered"></i>
                <span>Chargement F1…</span>
            </div>`;
    }

    _renderError() {
        this.container.innerHTML = `
            <div class="f1-loading">
                <i class="fas fa-exclamation-circle"></i>
                <span>Données F1 indisponibles</span>
                <button class="mkt-retry-btn" style="margin-top:.4rem" onclick="window._f1WidgetInstance?.refresh()">
                    <i class="fas fa-redo" style="margin-right:.3rem"></i>Réessayer
                </button>
            </div>`;
    }

    _render(race, standings) {
        const now      = new Date();
        const raceDate = race?.start ? new Date(race.start) : null;
        const diffMs   = raceDate ? raceDate - now : 0;

        let countdown = '';
        if (diffMs > 0) {
            const d = Math.floor(diffMs / 86400000);
            const h = Math.floor((diffMs % 86400000) / 3600000);
            if (d > 0)    countdown = `dans ${d}j${h > 0 ? ` ${h}h` : ''}`;
            else if (h > 0) countdown = `dans ${h}h`;
            else           countdown = 'aujourd\'hui';
        } else if (raceDate) {
            countdown = 'en cours';
        }

        const dateStr = raceDate
            ? raceDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })
            : '';

        const raceHtml = race ? `
            <div class="f1-circuit-bg">
                <div class="f1-circuit-gradient"></div>
                <div class="f1-race-info">
                    <span class="f1-race-name">${this._esc(race.circuitLabel ?? race.summary)}</span>
                    ${dateStr ? `<span class="f1-race-date">${dateStr}${countdown ? ` · <b>${countdown}</b>` : ''}</span>` : ''}
                </div>
            </div>` : '';

        const standingsHtml = (standings ?? []).map(d => {
            const team = _teamInfo(d.constructorId);
            const pts  = Number.isInteger(d.points) ? d.points : d.points.toFixed(0);
            return `
            <div class="f1-driver-row">
                <div class="f1-team-badge" data-cid="${d.constructorId}">${team.abbr}</div>
                <span class="f1-pos">${d.pos}</span>
                <span class="f1-driver-name">${this._esc(d.driver)}</span>
                <span class="f1-points">${pts}<span class="f1-pts-unit"> pts</span></span>
            </div>`;
        }).join('');

        this.container.innerHTML = `
            ${raceHtml}
            <div class="f1-standings">
                <div class="f1-standings-title">Championnat Pilotes</div>
                ${standingsHtml || '<span class="f1-no-data">Données indisponibles</span>'}
            </div>`;
    }

    _esc(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function initF1Widget() {
    window._f1WidgetInstance = new F1Widget();
    window._f1WidgetInstance.init();
}
