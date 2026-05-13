// ===== MARKET WIDGET =====
// Crypto : CoinGecko (gratuit, sans clé)
// Actions / Indices : Yahoo Finance v8 (via CORS proxy)

const MARKET_ASSET_KEY = 'zenithMarketAsset';
const MARKET_CACHE_KEY = 'zenithMarketCache';
const MARKET_CACHE_TTL = 10 * 60 * 1000; // 10 min
const DEFAULT_ASSET    = 'crypto:bitcoin';

// ─── Catalogue d'actifs ───────────────────────────────────────────────────────

const MARKET_ASSETS = [
    // Crypto (id CoinGecko)
    { id: 'crypto:bitcoin',        name: 'Bitcoin',    sym: 'BTC',   cur: '€', type: 'crypto' },
    { id: 'crypto:ethereum',       name: 'Ethereum',   sym: 'ETH',   cur: '€', type: 'crypto' },
    { id: 'crypto:solana',         name: 'Solana',     sym: 'SOL',   cur: '€', type: 'crypto' },
    { id: 'crypto:binancecoin',    name: 'BNB',        sym: 'BNB',   cur: '€', type: 'crypto' },
    { id: 'crypto:ripple',         name: 'XRP',        sym: 'XRP',   cur: '€', type: 'crypto' },
    { id: 'crypto:dogecoin',       name: 'Dogecoin',   sym: 'DOGE',  cur: '€', type: 'crypto' },
    { id: 'crypto:cardano',        name: 'Cardano',    sym: 'ADA',   cur: '€', type: 'crypto' },
    { id: 'crypto:avalanche-2',    name: 'Avalanche',  sym: 'AVAX',  cur: '€', type: 'crypto' },
    // Actions (ticker Yahoo Finance)
    { id: 'stock:AAPL',  name: 'Apple',     sym: 'AAPL',  cur: '$', type: 'stock' },
    { id: 'stock:MSFT',  name: 'Microsoft', sym: 'MSFT',  cur: '$', type: 'stock' },
    { id: 'stock:NVDA',  name: 'Nvidia',    sym: 'NVDA',  cur: '$', type: 'stock' },
    { id: 'stock:TSLA',  name: 'Tesla',     sym: 'TSLA',  cur: '$', type: 'stock' },
    { id: 'stock:AMZN',  name: 'Amazon',    sym: 'AMZN',  cur: '$', type: 'stock' },
    { id: 'stock:GOOGL', name: 'Google',    sym: 'GOOGL', cur: '$', type: 'stock' },
    { id: 'stock:META',  name: 'Meta',      sym: 'META',  cur: '$', type: 'stock' },
    // Indices (ticker Yahoo Finance)
    { id: 'index:^FCHI',  name: 'CAC 40',  sym: 'CAC40', cur: '',  type: 'index' },
    { id: 'index:^GSPC',  name: 'S&P 500', sym: 'SPX',   cur: '',  type: 'index' },
    { id: 'index:^IXIC',  name: 'Nasdaq',  sym: 'NDX',   cur: '',  type: 'index' },
    { id: 'index:^GDAXI', name: 'DAX',     sym: 'DAX',   cur: '',  type: 'index' },
    { id: 'index:^N225',  name: 'Nikkei',  sym: 'N225',  cur: '¥', type: 'index' },
];

// ─── Widget ───────────────────────────────────────────────────────────────────

class MarketWidget {
    constructor() {
        this.container = document.getElementById('marketWidget');
        this.assetId   = localStorage.getItem(MARKET_ASSET_KEY) || DEFAULT_ASSET;
        this._timer    = null;
    }

    get _asset() {
        return MARKET_ASSETS.find(a => a.id === this.assetId) || MARKET_ASSETS[0];
    }

    async init() {
        if (!this.container) return;
        await this.refresh();
        this._timer = setInterval(() => this.refresh(), MARKET_CACHE_TTL);
    }

    async refresh() {
        // Cache
        try {
            const c = JSON.parse(localStorage.getItem(MARKET_CACHE_KEY) || 'null');
            if (c && c.id === this.assetId && Date.now() - c.ts < MARKET_CACHE_TTL) {
                this._render(c.data);
                return;
            }
        } catch {}

        this._renderLoading();
        const asset = this._asset;
        try {
            const data = asset.type === 'crypto'
                ? await this._fetchCrypto(asset)
                : await this._fetchYahoo(asset);

            try {
                localStorage.setItem(MARKET_CACHE_KEY, JSON.stringify({ id: this.assetId, ts: Date.now(), data }));
            } catch {}
            this._render(data);
        } catch (e) {
            console.error('[MarketWidget]', e);
            this._renderError();
        }
    }

    // ─── Fetch Binance (gratuit, sans clé, CORS natif, 1200 req/min) ────────────

    async _fetchCrypto(asset) {
        const pair = `${asset.sym}EUR`;
        const base = 'https://api.binance.com/api/v3';

        const [tickerRes, klinesRes] = await Promise.all([
            fetch(`${base}/ticker/24hr?symbol=${pair}`,            { signal: AbortSignal.timeout(8000) }),
            fetch(`${base}/klines?symbol=${pair}&interval=1h&limit=24`, { signal: AbortSignal.timeout(8000) }),
        ]);

        if (!tickerRes.ok || !klinesRes.ok) throw new Error('Binance ' + (tickerRes.ok ? klinesRes.status : tickerRes.status));
        const [ticker, klines] = await Promise.all([tickerRes.json(), klinesRes.json()]);

        return {
            name:   asset.name,
            sym:    asset.sym,
            cur:    '€',
            type:   'crypto',
            price:  parseFloat(ticker.lastPrice),
            change: parseFloat(ticker.priceChangePercent),
            high:   parseFloat(ticker.highPrice),
            low:    parseFloat(ticker.lowPrice),
            vol:    parseFloat(ticker.quoteVolume),       // volume en EUR
            prices: klines.map(k => parseFloat(k[4])),   // close de chaque heure
        };
    }

    // ─── Fetch Yahoo Finance ──────────────────────────────────────────────────

    async _fetchYahoo(asset) {
        const ticker = asset.id.replace(/^(stock|index):/, '');
        const url    = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1h&range=1d&includePrePost=false`;
        const proxy  = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;

        const res = await fetch(proxy, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error('Yahoo HTTP ' + res.status);
        const json = await res.json();

        const result = json.chart?.result?.[0];
        if (!result) throw new Error('No result');

        const meta    = result.meta;
        const closes  = result.indicators?.quote?.[0]?.close || [];
        const prevClose = meta.chartPreviousClose || meta.previousClose || meta.regularMarketPreviousClose;
        const price   = meta.regularMarketPrice;
        const change  = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

        return {
            name:   asset.name,
            sym:    asset.sym,
            cur:    asset.cur,
            type:   asset.type,
            price,
            change,
            high:   meta.regularMarketDayHigh   || null,
            low:    meta.regularMarketDayLow     || null,
            vol:    meta.regularMarketVolume     || null,
            prices: closes.filter(v => v != null),
        };
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    _renderLoading() {
        this.container.innerHTML = `
            <div class="mkt-loading">
                <i class="fas fa-chart-line"></i>
                <span>Chargement…</span>
            </div>`;
    }

    _renderError() {
        this.container.innerHTML = `
            <div class="mkt-loading mkt-error">
                <i class="fas fa-exclamation-circle"></i>
                <div>
                    <div style="margin-bottom:0.35rem">Marché indisponible</div>
                    <button class="mkt-retry-btn"><i class="fas fa-redo" style="margin-right:.3rem"></i>Réessayer</button>
                </div>
            </div>`;
        this.container.querySelector('.mkt-retry-btn')
            ?.addEventListener('click', () => { localStorage.removeItem(MARKET_CACHE_KEY); this.refresh(); });
    }

    _render(data) {
        const up     = data.change >= 0;
        const color  = up ? '#34d399' : '#f87171';
        const arrow  = up ? '↑' : '↓';
        const sign   = up ? '+' : '';
        const change = `${sign}${data.change.toFixed(2)}% ${arrow}`;

        const priceStr  = this._fmtPrice(data.price, data.cur);
        const highStr   = data.high  != null ? this._fmtPrice(data.high,  data.cur) : '–';
        const lowStr    = data.low   != null ? this._fmtPrice(data.low,   data.cur) : '–';
        const volStr    = data.vol   != null ? this._fmtVol(data.vol, data.cur)      : '–';
        const sparkline = this._buildSparkline(data.prices, 280, 58, color);

        this.container.innerHTML = `
            <div class="mkt-header">
                <div class="mkt-name-wrap">
                    <span class="mkt-name">${this._esc(data.name)}</span>
                    <span class="mkt-sym">${this._esc(data.sym)}</span>
                </div>
                <span class="mkt-badge">${data.type === 'crypto' ? 'Crypto' : data.type === 'stock' ? 'Action' : 'Indice'}</span>
            </div>
            <div class="mkt-price-row">
                <span class="mkt-price">${priceStr}</span>
                <span class="mkt-change" style="color:${color}">${change}</span>
            </div>
            <div class="mkt-chart">${sparkline}</div>
            <div class="mkt-stats">
                <div class="mkt-stat"><span class="mkt-stat-lbl">Haut 24h</span><span class="mkt-stat-val">${highStr}</span></div>
                <div class="mkt-stat"><span class="mkt-stat-lbl">Bas 24h</span><span class="mkt-stat-val">${lowStr}</span></div>
                <div class="mkt-stat"><span class="mkt-stat-lbl">Volume</span><span class="mkt-stat-val">${volStr}</span></div>
            </div>`;
    }

    // ─── Sparkline SVG ────────────────────────────────────────────────────────

    _buildSparkline(prices, w, h, color) {
        if (!prices?.length) return `<div style="height:${h}px"></div>`;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min || 1;
        const pad   = 3;

        const pts = prices.map((p, i) => {
            const x = (i / (prices.length - 1)) * w;
            const y = pad + (1 - (p - min) / range) * (h - pad * 2);
            return [x, y];
        });

        const line  = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
        const fill  = `${line} L${w},${h} L0,${h} Z`;
        const gradId = 'mktGrad';

        return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${color}" stop-opacity="0.28"/>
                    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
                </linearGradient>
            </defs>
            <path d="${fill}" fill="url(#${gradId})"/>
            <path d="${line}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    _fmtPrice(val, cur) {
        if (val == null) return '–';
        const decimals = val >= 100 ? 2 : val >= 1 ? 3 : 5;
        return `${cur}${val.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    }

    _fmtVol(val, cur) {
        if (val == null) return '–';
        if (val >= 1e12) return `${cur}${(val / 1e12).toFixed(1)}T`;
        if (val >= 1e9)  return `${cur}${(val / 1e9).toFixed(1)}Md`;
        if (val >= 1e6)  return `${cur}${(val / 1e6).toFixed(1)}M`;
        return `${cur}${val.toLocaleString('fr-FR')}`;
    }

    _esc(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
}

// ─── Init ────────────────────────────────────────────────────────────────────

function initMarketWidget() {
    window._marketWidgetInstance = new MarketWidget();
    window._marketWidgetInstance.init();
}
