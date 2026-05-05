// ===== ZENITH AI — Groq Chat =====

// Liste de secours si l'API n'est pas encore accessible (pas de clé configurée)
const GROQ_MODELS_FALLBACK = [
    { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout' },
    { id: 'llama-3.3-70b-versatile',                   name: 'Llama 3.3 70B' },
    { id: 'llama-3.1-8b-instant',                      name: 'Llama 3.1 8B'  },
];

const SYSTEM_PROMPT = `Tu es Zenith AI, un assistant intégré dans une page d'accueil de navigateur. Tu es concis, précis et utile. Tu réponds par défaut en français, mais tu t'adaptes à la langue de l'utilisateur. Tu n'as pas besoin de te présenter à chaque message.`;

// ===== Stockage des conversations (IndexedDB) =====
class ConversationDB {
    constructor() {
        this.db = null;
        this._ready = this._open();
    }

    _open() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('zenith_ai', 1);
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('conversations'))
                    db.createObjectStore('conversations', { keyPath: 'id' });
            };
            req.onsuccess = e => { this.db = e.target.result; resolve(); };
            req.onerror = () => reject(req.error);
        });
    }

    async _tx(mode, fn) {
        await this._ready;
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('conversations', mode);
            const store = tx.objectStore('conversations');
            const req = fn(store);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    save(conv)   { return this._tx('readwrite', s => s.put(conv)); }
    get(id)      { return this._tx('readonly',  s => s.get(id)); }
    remove(id)   { return this._tx('readwrite', s => s.delete(id)); }

    async getAll() {
        await this._ready;
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('conversations', 'readonly');
            const req = tx.objectStore('conversations').getAll();
            req.onsuccess = () => resolve((req.result || []).sort((a, b) => b.updatedAt - a.updatedAt));
            req.onerror = () => reject(req.error);
        });
    }
}

// ===== Gestion des clés Groq =====
class GroqKeyManager {
    constructor() {
        this._load();
        this.index = 0;
    }

    _load() {
        try {
            this.keys = JSON.parse(localStorage.getItem('groqApiKeys') || '[]');
        } catch {
            this.keys = [];
        }
    }

    save() {
        localStorage.setItem('groqApiKeys', JSON.stringify(this.keys));
    }

    add(key) {
        key = key.trim();
        if (!key || this.keys.includes(key)) return false;
        this.keys.push(key);
        this.save();
        return true;
    }

    remove(i) {
        this.keys.splice(i, 1);
        this.index = 0;
        this.save();
    }

    // Retourne la clé courante et avance le curseur (round-robin)
    getAndAdvance() {
        if (!this.keys.length) return null;
        const key = this.keys[this.index];
        this.index = (this.index + 1) % this.keys.length;
        return key;
    }

    // Appelé sur 429 : avance sans retourner (la prochaine tentative utilisera la suivante)
    rotateOnRateLimit() {
        if (this.keys.length > 1) this.index = (this.index + 1) % this.keys.length;
    }

    hasKeys() { return this.keys.length > 0; }
    count()   { return this.keys.length; }

    // Clé masquée pour l'affichage
    masked(i) {
        const k = this.keys[i] || '';
        if (k.length <= 8) return '••••••••';
        return k.slice(0, 6) + '••••••••' + k.slice(-4);
    }
}

// ===== Moteur de chat =====
class ZenithAIChat {
    constructor() {
        this.keys  = new GroqKeyManager();
        this.db    = new ConversationDB();
        this.model = localStorage.getItem('groqModel') || GROQ_MODELS_FALLBACK[0].id;
        this.history  = [];
        this.streaming = false;
        this.convId   = null;
        this.convName = null;
    }

    setModel(id) {
        this.model = id;
        localStorage.setItem('groqModel', id);
    }

    // ---- Gestion des conversations ----
    newConversation() {
        this.history  = [];
        this.convId   = this._uid();
        this.convName = null;
        this._render();
        this.renderSidebar();
    }

    async loadConversation(id) {
        const conv = await this.db.get(id);
        if (!conv) return;
        this.history  = conv.messages || [];
        this.convId   = conv.id;
        this.convName = conv.name;
        this._render();
        this.renderSidebar();
    }

    async _saveConversation() {
        if (!this.convId) return;
        const msgs = this.history.filter(m => !m.streaming);
        if (!msgs.length) return;
        await this.db.save({
            id: this.convId,
            name: this.convName || 'Nouvelle conversation',
            messages: msgs,
            updatedAt: Date.now(),
        });
        this.renderSidebar();
    }

    // Nommage automatique via Groq (fire-and-forget sur le 1er message)
    async _autoName(firstMessage) {
        const key = this.keys.keys[0];
        if (!key) return;
        try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [{ role: 'user', content: `En 3 à 5 mots maximum, donne un titre court à cette conversation. Réponds UNIQUEMENT avec le titre, sans ponctuation ni guillemets ni explication : "${firstMessage}"` }],
                    max_tokens: 20,
                    temperature: 0.3,
                }),
            });
            if (!res.ok) return;
            const data = await res.json();
            const name = data.choices?.[0]?.message?.content?.trim();
            if (name) {
                this.convName = name;
                await this._saveConversation();
            }
        } catch { /* silencieux */ }
    }

    async renderSidebar() {
        const list = document.getElementById('convList');
        if (!list) return;
        const convs = await this.db.getAll();
        if (!convs.length) {
            list.innerHTML = '<p class="conv-empty">Aucune conversation</p>';
            return;
        }
        list.innerHTML = convs.map(c => `
            <div class="conv-item${c.id === this.convId ? ' active' : ''}" data-id="${c.id}">
                <span class="conv-name">${this._esc(c.name || 'Nouvelle conversation')}</span>
                <button class="conv-del" data-id="${c.id}" title="Supprimer"><i class="fas fa-times"></i></button>
            </div>
        `).join('');
        list.querySelectorAll('.conv-item').forEach(item => {
            item.addEventListener('click', e => {
                if (e.target.closest('.conv-del')) return;
                this.loadConversation(item.dataset.id);
            });
        });
        list.querySelectorAll('.conv-del').forEach(btn => {
            btn.addEventListener('click', async () => {
                await this.db.remove(btn.dataset.id);
                if (btn.dataset.id === this.convId) this.newConversation();
                this.renderSidebar();
            });
        });
    }

    // ---- Envoi d'un message ----
    async send(text) {
        text = text.trim();
        if (!text || this.streaming) return;

        if (!this.keys.hasKeys()) {
            this._render();
            return;
        }

        const isFirst = this.history.length === 0;
        if (!this.convId) this.convId = this._uid();

        // Message utilisateur
        this.history.push({ role: 'user', content: text, id: this._uid() });
        this._render();
        this._scrollBottom();

        // Nommer la conv sur le 1er message (concurrent, non-bloquant)
        if (isFirst) this._autoName(text);

        // Placeholder assistant
        const aiId = this._uid();
        this.history.push({ role: 'assistant', content: '', id: aiId, streaming: true });
        this._render();

        this.streaming = true;
        try {
            await this._stream(aiId);
        } catch (err) {
            const msg = this.history.find(m => m.id === aiId);
            if (msg) { msg.content = `❌ ${err.message}`; msg.streaming = false; msg.error = true; }
            this._render();
        }
        this.streaming = false;
        await this._saveConversation();
    }

    // ---- Appel Groq avec streaming SSE + rotation clés ----
    async _stream(aiId, attempt = 0) {
        const key = this.keys.getAndAdvance();
        if (!key) throw new Error('Plus de clés disponibles');

        // Construction du contexte (sans le placeholder vide)
        const apiMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...this.history
                .filter(m => !(m.id === aiId && m.content === ''))
                .map(m => ({ role: m.role, content: m.content }))
        ];

        let res;
        try {
            res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: apiMessages,
                    stream: true,
                    max_tokens: 2048,
                    temperature: 0.7,
                }),
            });
        } catch {
            throw new Error('Erreur réseau : vérifiez votre connexion');
        }

        // 429 Rate limit → essayer la clé suivante
        if (res.status === 429 && attempt < this.keys.count()) {
            this.keys.rotateOnRateLimit();
            return this._stream(aiId, attempt + 1);
        }

        if (res.status === 401) throw new Error('Clé API invalide ou expirée');
        if (!res.ok) {
            let detail = '';
            try { const j = await res.json(); detail = j.error?.message || ''; } catch {}
            throw new Error(`Erreur API ${res.status}${detail ? ': ' + detail : ''}`);
        }

        // Lecture du stream SSE
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buf += dec.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop(); // ligne incomplète → garder pour le prochain chunk

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const payload = line.slice(6).trim();
                if (payload === '[DONE]') continue;
                try {
                    const chunk = JSON.parse(payload);
                    const delta = chunk.choices?.[0]?.delta?.content;
                    if (delta) {
                        const msg = this.history.find(m => m.id === aiId);
                        if (msg) {
                            msg.content += delta;
                            this._patchStreamingBubble(aiId, msg.content);
                        }
                    }
                } catch { /* chunk malformé, on ignore */ }
            }
        }

        // Finaliser
        const msg = this.history.find(m => m.id === aiId);
        if (msg) { msg.streaming = false; }
        this._render(); // rendu final propre (sans curseur clignotant)
        this._scrollBottom();
    }

    // Met à jour la bulle en cours de stream sans re-rendre tout
    _patchStreamingBubble(id, content) {
        const el = document.querySelector(`[data-msg="${id}"] .msg-body`);
        if (el) {
            el.innerHTML = this._md(content) + '<span class="stream-cursor">▋</span>';
            this._scrollBottom();
        }
    }

    // ---- Rendu complet des messages ----
    _render() {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        if (!this.history.length) {
            if (!this.keys.hasKeys()) {
                container.innerHTML = `
                    <div class="chat-empty">
                        <div class="chat-empty-star">✦</div>
                        <p class="chat-empty-text">Aucune clé API configurée</p>
                        <p class="chat-empty-sub">Ajoutez une clé Groq dans les <button class="inline-link" onclick="window.openSettings()">paramètres</button> pour commencer.</p>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="chat-empty">
                        <div class="chat-empty-star">✦</div>
                        <p class="chat-empty-text">Bonjour, comment puis-je vous aider ?</p>
                        <div class="chat-suggestions" id="chatSuggestions">
                            <button class="chat-suggestion-chip">Résume les actualités tech d'aujourd'hui</button>
                            <button class="chat-suggestion-chip">Explique-moi un concept en IA</button>
                            <button class="chat-suggestion-chip">Écris un email professionnel</button>
                        </div>
                    </div>
                `;
                this._bindSuggestions();
            }
            return;
        }

        container.innerHTML = this.history.map(msg => {
            const isUser = msg.role === 'user';
            let bodyHtml;
            if (msg.streaming && msg.content === '') {
                bodyHtml = `<div class="typing-dots"><span></span><span></span><span></span></div>`;
            } else if (msg.streaming) {
                bodyHtml = this._md(msg.content) + '<span class="stream-cursor">▋</span>';
            } else {
                bodyHtml = this._md(msg.content);
            }

            if (isUser) {
                return `<div class="chat-msg chat-msg-user" data-msg="${msg.id}">
                    <div class="msg-bubble msg-bubble-user">
                        <div class="msg-body">${this._escText(msg.content)}</div>
                    </div>
                </div>`;
            }
            return `<div class="chat-msg chat-msg-ai" data-msg="${msg.id}">
                <div class="msg-body ai-body${msg.error ? ' ai-error' : ''}">${bodyHtml}</div>
            </div>`;
        }).join('');

        this._scrollBottom();
    }

    _appendError(html) {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'chat-msg chat-msg-ai';
        div.innerHTML = `<div class="msg-body ai-body ai-error">${html}</div>`;
        container.appendChild(div);
        this._scrollBottom();
    }

    _scrollBottom() {
        const c = document.getElementById('chatMessages');
        if (c) c.scrollTop = c.scrollHeight;
    }

    _bindSuggestions() {
        document.querySelectorAll('.chat-suggestion-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById('chatInput');
                const sendBtn = document.getElementById('chatSendBtn');
                if (input) {
                    input.value = btn.textContent;
                    input.dispatchEvent(new Event('input')); // déclenche syncSendBtn
                }
                sendBtn?.click(); // passe par doSend qui vide le textarea après envoi
            });
        });
    }

    // ---- Rendu Markdown ----
    _md(text) {
        if (!text) return '';

        // 1. Extraire les blocs de code pour les protéger
        const blocks = [];
        text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
            const i = blocks.length;
            blocks.push(`<pre class="code-block">${lang ? `<span class="code-lang">${this._esc(lang)}</span>` : ''}<code>${this._esc(code.trim())}</code></pre>`);
            return `\x00BLOCK${i}\x00`;
        });

        // 2. Parser ligne par ligne
        const lines = text.split('\n');
        const out = [];
        let ulOpen = false, olOpen = false;

        const closeLists = () => {
            if (ulOpen) { out.push('</ul>'); ulOpen = false; }
            if (olOpen) { out.push('</ol>'); olOpen = false; }
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Bloc de code placeholder
            if (/^\x00BLOCK\d+\x00$/.test(line.trim())) {
                closeLists();
                out.push(line.trim().replace(/\x00BLOCK(\d+)\x00/, (_, n) => blocks[+n]));
                continue;
            }

            // Titres
            const h = line.match(/^(#{1,3}) (.+)/);
            if (h) {
                closeLists();
                const lvl = h[1].length;
                out.push(`<h${lvl} class="md-h${lvl}">${this._inl(h[2])}</h${lvl}>`);
                continue;
            }

            // Liste non-ordonnée (-, *, +)
            const ul = line.match(/^[-*+] (.+)/);
            if (ul) {
                if (!ulOpen) { closeLists(); out.push('<ul>'); ulOpen = true; }
                out.push(`<li>${this._inl(ul[1])}</li>`);
                continue;
            }

            // Liste ordonnée
            const ol = line.match(/^(\d+)[\.)]\s+(.+)/);
            if (ol) {
                if (!olOpen) { closeLists(); out.push('<ol>'); olOpen = true; }
                out.push(`<li value="${ol[1]}">${this._inl(ol[2])}</li>`);
                continue;
            }

            // Citation (blockquote)
            const bq = line.match(/^>\s*(.*)/);
            if (bq) {
                closeLists();
                out.push(`<blockquote class="md-blockquote">${this._inl(bq[1])}</blockquote>`);
                continue;
            }

            // Ligne horizontale
            if (/^[-_*]{3,}$/.test(line.trim())) {
                closeLists();
                out.push('<hr class="md-hr">');
                continue;
            }

            // Ligne vide → fermer listes, espace entre paragraphes
            if (line.trim() === '') {
                closeLists();
                out.push('<div class="md-gap"></div>');
                continue;
            }

            // Ligne normale
            closeLists();
            out.push(`<p class="md-p">${this._inl(line)}</p>`);
        }

        closeLists();
        return out.join('');
    }

    // Formatage inline (gras, italique, code, liens)
    _inl(text) {
        return text
            .replace(/`([^`]+)`/g, (_, c) => `<code class="inline-code">${this._esc(c)}</code>`)
            .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/~~(.+?)~~/g, '<del>$1</del>')
            .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    }

    _esc(s)    { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    _escText(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }
    _uid()     { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
}

// ===== Export global =====
window.GroqKeyManager = GroqKeyManager;
window.ZenithAI = new ZenithAIChat();

// ---- Chargement dynamique des modèles depuis l'API Groq ----
async function loadGroqModels() {
    const sel = document.getElementById('modelSelect');
    if (!sel) return;

    // Éviter d'attacher plusieurs listeners lors des rechargements
    if (!sel._changeListenerBound) {
        sel.addEventListener('change', () => window.ZenithAI.setModel(sel.value));
        sel._changeListenerBound = true;
    }

    const key = window.ZenithAI.keys.keys[0];
    if (!key) {
        sel.innerHTML = '<option value="" disabled selected> aucune clé </option>';
        return;
    }

    let models = null;
    try {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${key}` }
        });
        if (res.ok) {
            const data = await res.json();
            models = (data.data || [])
                .filter(m => !m.id.includes('whisper') && !m.id.includes('tts') && !m.id.includes('vision'))
                .sort((a, b) => a.id.localeCompare(b.id))
                .map(m => ({ id: m.id, name: m.id }));
        }
    } catch { /* réseau indispo */ }

    if (!models || models.length === 0) models = GROQ_MODELS_FALLBACK;

    const current = window.ZenithAI.model;
    sel.innerHTML = '';
    models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        if (m.id === current) opt.selected = true;
        sel.appendChild(opt);
    });

    if (!models.find(m => m.id === current) && models.length > 0) {
        window.ZenithAI.setModel(models[0].id);
        sel.value = models[0].id;
    }
}

// Expose pour être rappelé depuis app.js quand une clé est ajoutée
window.loadGroqModels = loadGroqModels;

document.addEventListener('DOMContentLoaded', loadGroqModels);
