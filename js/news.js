// ===== NEWS WIDGET =====
// Multi-feed par thème — rss2json.com (CORS, sans clé API)

const NEWS_THEME_KEY  = 'zenithNewsTheme';
const NEWS_CACHE_KEY  = 'zenithNewsCache';
const NEWS_CACHE_TTL  = 15 * 60 * 1000;
const NEWS_AUTO_DELAY = 6000;
const DEFAULT_THEME   = 'international';

const NEWS_THEMES = {
    french: {
        label: 'Médias français',
        feeds: [
            'https://www.lemonde.fr/rss/une.xml',
            'https://www.lefigaro.fr/rss/figaro_actualites.xml',
            'https://www.francetvinfo.fr/titres.rss',
        ],
    },
    international: {
        label: 'International',
        feeds: [
            'https://feeds.bbci.co.uk/news/world/rss.xml',
            'https://www.theguardian.com/world/rss',
            'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
            'https://www.aljazeera.com/xml/rss/all.xml',
        ],
    },
    tech: {
        label: 'Tech & IA',
        feeds: [
            'https://venturebeat.com/category/ai/feed/',
            'https://techcrunch.com/feed/',
            'https://www.wired.com/feed/rss',
            'https://www.engadget.com/rss.xml',
        ],
    },
    space: {
        label: 'Spatial',
        feeds: [
            'https://www.space.com/feeds/all',
            'https://spacenews.com/feed/',
            'https://www.universetoday.com/feed/',
        ],
    },
    esport: {
        label: 'Esport',
        feeds: [
            'https://dotesports.com/feed',
            'https://esportsinsider.com/feed/',
        ],
    },
};

class NewsWidget {
    constructor() {
        this.container = document.getElementById('newsWidget');
        this.articles  = [];
        this.index     = 0;
        this.timer     = null;
        this.trackEl   = null;
        this.sourceEl  = null;
        this._paused   = false;
        this.theme     = localStorage.getItem(NEWS_THEME_KEY) || DEFAULT_THEME;
    }

    async init() {
        if (!this.container) return;
        await this.fetchNews();
        setInterval(() => this.fetchNews(), 30 * 60 * 1000);
    }

    // ─── Fetch ──────────────────────────────────────────────────────────────

    async fetchNews() {
        try {
            const cached = JSON.parse(localStorage.getItem(NEWS_CACHE_KEY) || 'null');
            if (cached && cached.theme === this.theme && Date.now() - cached.ts < NEWS_CACHE_TTL) {
                this.articles = cached.items;
                this.index = 0;
                this.render();
                this.startTimer();
                return;
            }
        } catch {}

        this.renderLoading();

        const theme = NEWS_THEMES[this.theme] || NEWS_THEMES[DEFAULT_THEME];
        const perFeed = Math.ceil(12 / theme.feeds.length);

        const results = await Promise.all(theme.feeds.map(url => this._fetchOneFeed(url, perFeed)));
        const articles = results.flat().filter(a => a.title);

        // Trier par date décroissante, limiter à 12
        articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        const final = articles.slice(0, 12);

        if (final.length) {
            this.articles = final;
            this.index = 0;
            this.render();
            this.startTimer();
            this._prefetchMissingImages().then(() => {
                try {
                    localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({
                        theme: this.theme, ts: Date.now(), items: this.articles,
                    }));
                } catch {}
            });
        } else {
            this.renderError();
        }
    }

    async _fetchOneFeed(feedUrl, maxItems = 4) {
        // Strategy 1: rss2json
        try {
            const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=${maxItems}`;
            const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            if (data.status !== 'ok' || !data.items?.length) throw new Error(data.message);
            return data.items.filter(it => it.title).slice(0, maxItems).map(it => ({
                title:     it.title.trim(),
                link:      it.link || '',
                thumbnail: it.thumbnail
                         || it.enclosure?.link
                         || this._extractFirstImg(it.content || it.description || '')
                         || data.feed?.image || '',
                source:    data.feed?.title || '',
                pubDate:   it.pubDate || '',
            }));
        } catch (e1) {
            // Strategy 2: corsproxy + XML
            try {
                const proxy = `https://corsproxy.io/?url=${encodeURIComponent(feedUrl)}`;
                const res2 = await fetch(proxy, { signal: AbortSignal.timeout(8000) });
                if (!res2.ok) throw new Error('HTTP ' + res2.status);
                const xml = new DOMParser().parseFromString(await res2.text(), 'text/xml');
                const items = [...xml.querySelectorAll('item')];
                if (!items.length) throw new Error('no items');
                const feedTitle = xml.querySelector('channel > title')?.textContent || '';
                const mediaNs   = 'http://search.yahoo.com/mrss/';
                return items.slice(0, maxItems).map(it => {
                    const enc     = it.querySelector('enclosure');
                    const rawDesc = it.querySelector('encoded')?.textContent
                                 || it.querySelector('description')?.textContent || '';
                    return {
                        title:     it.querySelector('title')?.textContent?.trim() || '',
                        link:      it.querySelector('link')?.textContent || '',
                        thumbnail: it.getElementsByTagNameNS(mediaNs, 'thumbnail')[0]?.getAttribute('url')
                                || it.getElementsByTagNameNS(mediaNs, 'content')[0]?.getAttribute('url')
                                || (enc?.getAttribute('type')?.startsWith('image') ? enc.getAttribute('url') : '')
                                || this._extractFirstImg(rawDesc)
                                || '',
                        source:  feedTitle,
                        pubDate: it.querySelector('pubDate')?.textContent || '',
                    };
                }).filter(it => it.title);
            } catch { return []; }
        }
    }

    // ─── og:image prefetch ───────────────────────────────────────────────────

    async _prefetchMissingImages() {
        const OG_KEY = 'zenithNewsOgCache';
        let ogCache = {};
        try { ogCache = JSON.parse(localStorage.getItem(OG_KEY) || '{}'); } catch {}

        const missing = this.articles.map((art, i) => ({ art, i })).filter(({ art }) => !art.thumbnail && art.link);
        if (!missing.length) return;

        const queue = [...missing];
        await Promise.all(Array.from({ length: 4 }, () => this._ogWorker(queue, ogCache)));
        try { localStorage.setItem(OG_KEY, JSON.stringify(ogCache)); } catch {}
    }

    async _ogWorker(queue, ogCache) {
        while (queue.length) {
            const { art, i } = queue.shift();
            if (ogCache[art.link]) {
                art.thumbnail = ogCache[art.link];
                this._injectSlideImage(i, art.thumbnail);
                continue;
            }
            try {
                const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(art.link)}`, { signal: AbortSignal.timeout(6000) });
                if (!res.ok) continue;
                const html = await res.text();
                const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                       || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
                       || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
                       || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
                if (m?.[1]) { art.thumbnail = m[1]; ogCache[art.link] = m[1]; this._injectSlideImage(i, m[1]); }
            } catch {}
        }
    }

    _injectSlideImage(index, url) {
        const slide = this.trackEl?.querySelectorAll('.news-slide')[index];
        if (!slide || slide.querySelector('.news-bg-img')) return;
        const img = document.createElement('img');
        img.className = 'news-bg-img';
        img.alt = ''; img.loading = 'lazy';
        img.onerror = () => img.remove();
        img.src = url;
        slide.insertBefore(img, slide.firstChild);
    }

    // ─── Render ──────────────────────────────────────────────────────────────

    renderLoading() {
        this.container.innerHTML = `
            <div class="news-loading">
                <i class="fas fa-newspaper"></i>
                <span>Chargement des actualités…</span>
            </div>`;
    }

    renderError() {
        this.container.innerHTML = `
            <div class="news-loading news-error">
                <i class="fas fa-exclamation-circle"></i>
                <div>
                    <div style="margin-bottom:0.4rem">Actualités indisponibles</div>
                    <button class="news-retry-btn">
                        <i class="fas fa-redo" style="margin-right:0.3rem"></i>Réessayer
                    </button>
                </div>
            </div>`;
        this.container.querySelector('.news-retry-btn')
            ?.addEventListener('click', () => { localStorage.removeItem(NEWS_CACHE_KEY); this.fetchNews(); });
    }

    render() {
        if (!this.articles.length) return;

        this.container.innerHTML = `
            <div class="news-carousel-viewport">
                <div class="news-track"></div>
            </div>
            <div class="news-ui-top">
                <i class="fas fa-rss news-rss-icon"></i>
                <span class="news-source-label"></span>
            </div>
            <button class="news-arrow news-arrow-prev" aria-label="Précédent">
                <i class="fas fa-chevron-left"></i>
            </button>
            <button class="news-arrow news-arrow-next" aria-label="Suivant">
                <i class="fas fa-chevron-right"></i>
            </button>`;

        this.trackEl  = this.container.querySelector('.news-track');
        this.sourceEl = this.container.querySelector('.news-source-label');

        this.articles.forEach(art => {
            const slide = document.createElement('div');
            slide.className = 'news-slide';
            slide.innerHTML = `
                ${art.thumbnail ? `<img class="news-bg-img" src="${this._escHtml(art.thumbnail)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
                <div class="news-gradient"></div>
                <div class="news-slide-body">
                    <p class="news-title">${this._escHtml(art.title)}</p>
                </div>`;
            slide.addEventListener('click', () => this._openSearch(art.title));
            this.trackEl.appendChild(slide);
        });

        this.container.querySelector('.news-arrow-prev')
            .addEventListener('click', e => { e.stopPropagation(); this.prev(); this.startTimer(); });
        this.container.querySelector('.news-arrow-next')
            .addEventListener('click', e => { e.stopPropagation(); this.next(); this.startTimer(); });

        this.container.addEventListener('mouseenter', () => { this._paused = true; });
        this.container.addEventListener('mouseleave', () => { this._paused = false; });

        this.updateSlide(false);
    }

    // ─── Navigation ──────────────────────────────────────────────────────────

    goTo(i, animate = true) {
        this.index = (i + this.articles.length) % this.articles.length;
        this.updateSlide(animate);
    }

    next() { this.goTo(this.index + 1); }
    prev() { this.goTo(this.index - 1); }

    updateSlide(animate = true) {
        if (!this.trackEl) return;
        if (!animate) this.trackEl.classList.add('no-transition');
        this.trackEl.style.transform = `translateX(${-this.index * 100}%)`;
        if (!animate) requestAnimationFrame(() => this.trackEl.classList.remove('no-transition'));

        // Mettre à jour le label source selon l'article courant
        if (this.sourceEl && this.articles[this.index]) {
            this.sourceEl.textContent = this.articles[this.index].source || '';
        }
    }

    startTimer() {
        clearInterval(this.timer);
        this.timer = setInterval(() => { if (!this._paused) this.next(); }, NEWS_AUTO_DELAY);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    _openSearch(title) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(title)}`, '_blank', 'noopener');
    }

    _extractFirstImg(html) {
        if (!html) return '';
        const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        return m ? m[1] : '';
    }

    _escHtml(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
}

// ─── Init ────────────────────────────────────────────────────────────────────

function initNewsWidget() {
    window._newsWidgetInstance = new NewsWidget();
    window._newsWidgetInstance.init();
}
