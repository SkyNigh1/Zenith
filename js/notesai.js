// ─── Zenith Notes — Assistant IA (Groq OpenAI-compatible) ─────────────────────

(function () {
    'use strict';

    var GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';
    var KEYS_KEY     = 'groqApiKeys';
    var MODEL_KEY    = 'groqModel';
    var MODEL_FALLBACK = 'llama-3.3-70b-versatile';

    var currentMode = 'ask';   // 'ask' | 'agent'
    var messages    = [];      // historique OpenAI complet (inclut tool_calls / tool résultats)
    var isStreaming = false;
    var keyIndex    = 0;

    // ── Clés Groq (partagées avec le chat principal) ──────────────────────────

    function getKeys() {
        try { return JSON.parse(localStorage.getItem(KEYS_KEY) || '[]'); } catch (_) { return []; }
    }

    function getKey() {
        var keys = getKeys();
        if (!keys.length) return null;
        var k = keys[keyIndex % keys.length];
        keyIndex = (keyIndex + 1) % keys.length;
        return k;
    }

    function rotateKey() {
        var keys = getKeys();
        if (keys.length > 1) keyIndex = (keyIndex + 1) % keys.length;
    }

    function getModel() {
        return localStorage.getItem(MODEL_KEY) || MODEL_FALLBACK;
    }

    // ── Panel ─────────────────────────────────────────────────────────────────

    function showPanel() {
        var panel = document.getElementById('notesAiPanel');
        var btn   = document.getElementById('notesAiToggleBtn');
        if (panel) panel.style.display = 'flex';
        if (btn)   btn.classList.add('active');
        scrollBottom();
    }

    function hidePanel() {
        var panel = document.getElementById('notesAiPanel');
        var btn   = document.getElementById('notesAiToggleBtn');
        if (panel) panel.style.display = 'none';
        if (btn)   btn.classList.remove('active');
    }

    function scrollBottom() {
        var el = document.getElementById('notesAiMessages');
        if (el) el.scrollTop = el.scrollHeight;
    }

    // ── Mode ──────────────────────────────────────────────────────────────────

    function setMode(mode) {
        currentMode = mode;
        document.querySelectorAll('.notes-ai-mode-btn').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }

    // ── Utilitaires ───────────────────────────────────────────────────────────

    function escHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function mdToHtml(text) {
        var parts = [];
        var re    = /```(\w*)\n?([\s\S]*?)```/g;
        var last  = 0;
        var m;
        while ((m = re.exec(text)) !== null) {
            parts.push(inlineFmt(text.slice(last, m.index)));
            parts.push('<pre><code>' + escHtml(m[2]) + '</code></pre>');
            last = m.index + m[0].length;
        }
        parts.push(inlineFmt(text.slice(last)));
        return parts.join('');
    }

    function inlineFmt(text) {
        return escHtml(text)
            .replace(/`([^`\n]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    function setSendEnabled(on) {
        var btn = document.getElementById('notesAiSend');
        if (btn) btn.disabled = !on;
    }

    function resizeInput(el) {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }

    // ── Rendu des messages ────────────────────────────────────────────────────

    function appendBubble(role, html, id) {
        var container = document.getElementById('notesAiMessages');
        if (!container) return null;
        var wrap   = document.createElement('div');
        wrap.className = 'nai-msg nai-msg-' + role;
        if (id) wrap.id = id;
        var bubble = document.createElement('div');
        bubble.className = 'nai-bubble';
        bubble.innerHTML = html;
        wrap.appendChild(bubble);
        container.appendChild(wrap);
        scrollBottom();
        return bubble;
    }

    function appendToolRow(name, input) {
        var container = document.getElementById('notesAiMessages');
        if (!container) return null;
        var row = document.createElement('div');
        row.className = 'nai-tool-row';
        var icon = 'fa-cog';
        var label = name;
        if (name === 'list_files') {
            icon = 'fa-sitemap'; label = 'Lecture de l\'arborescence';
        } else if (name === 'read_file') {
            icon = 'fa-file-alt'; label = 'Lecture fichier #' + (input && input.file_id !== undefined ? input.file_id : '?');
        } else if (name === 'write_file') {
            icon = 'fa-edit';
            var nodes = window.ZenithNotes ? window.ZenithNotes.getNodes() : [];
            var wid = input && input.file_id;
            var wnode = null;
            for (var i = 0; i < nodes.length; i++) { if (nodes[i].id === wid) { wnode = nodes[i]; break; } }
            label = 'Écriture de ' + (wnode ? wnode.name : 'fichier #' + wid);
        }
        row.dataset.icon  = icon;
        row.dataset.label = label;
        row.innerHTML = '<i class="fas fa-spinner fa-spin" style="opacity:0.4"></i> <span>' + escHtml(label) + '</span>';
        container.appendChild(row);
        scrollBottom();
        return row;
    }

    function updateToolRow(row, result) {
        if (!row) return;
        var icon  = row.dataset.icon  || 'fa-cog';
        var label = row.dataset.label || '';
        var isErr = result && result.indexOf('Error') === 0;
        row.innerHTML = '<i class="fas ' + icon + '"></i> <span>' + escHtml(label) + '</span>'
            + ' <span class="' + (isErr ? 'nai-tool-err' : 'nai-tool-ok') + '">'
            + escHtml((result || '').slice(0, 60)) + '</span>';
        scrollBottom();
    }

    // ── Définitions des outils (format OpenAI) ────────────────────────────────

    var TOOLS = [
        {
            type: 'function',
            function: {
                name: 'list_files',
                description: 'Liste tous les fichiers et dossiers de l\'arborescence avec leur id numérique.',
                parameters: { type: 'object', properties: {}, required: [] }
            }
        },
        {
            type: 'function',
            function: {
                name: 'create_file',
                description: 'Crée un nouveau fichier et y écrit son contenu en une seule opération. TOUJOURS passer le contenu complet ici — ne jamais appeler write_file sur un fichier nouvellement créé car l\'id n\'est pas connu à l\'avance.',
                parameters: {
                    type: 'object',
                    properties: {
                        name:      { type: 'string', description: 'Nom du fichier avec extension, ex: index.html' },
                        content:   { type: 'string', description: 'Contenu complet du fichier — à écrire maintenant, pas dans un appel write_file séparé' },
                        parent_id: { type: 'number', description: 'Id du dossier parent (omettre pour la racine)' }
                    },
                    required: ['name', 'content']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'create_folder',
                description: 'Crée un nouveau dossier et retourne son id (pour l\'utiliser comme parent_id lors de créations dans ce dossier).',
                parameters: {
                    type: 'object',
                    properties: {
                        name:      { type: 'string', description: 'Nom du dossier' },
                        parent_id: { type: 'number', description: 'Id du dossier parent (omettre pour la racine)' }
                    },
                    required: ['name']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'read_file',
                description: 'Lit le contenu complet d\'un fichier par son id numérique.',
                parameters: {
                    type: 'object',
                    properties: {
                        file_id: { type: 'number', description: 'Id numérique du fichier' }
                    },
                    required: ['file_id']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'write_file',
                description: 'Modifie le contenu d\'un fichier EXISTANT dont l\'id est connu (obtenu via list_files). NE PAS utiliser sur un fichier que l\'on vient de créer — passer le contenu directement à create_file à la place.',
                parameters: {
                    type: 'object',
                    properties: {
                        file_id: { type: 'number', description: 'Id numérique d\'un fichier déjà existant' },
                        content: { type: 'string', description: 'Nouveau contenu complet' }
                    },
                    required: ['file_id', 'content']
                }
            }
        }
    ];

    // ── Exécution des outils ──────────────────────────────────────────────────

    function executeTool(name, argsStr) {
        var input = {};
        try { input = JSON.parse(argsStr || '{}'); } catch (_) {}

        var notes = window.ZenithNotes;
        if (!notes) return Promise.resolve('Error: ZenithNotes non disponible');

        if (name === 'create_file') {
            var pid = (input.parent_id !== undefined && input.parent_id !== null) ? input.parent_id : null;
            return notes.createNodeByAI('file', input.name, pid, input.content || '').then(function (newId) {
                return 'Fichier "' + input.name + '" créé avec id=' + newId + '.';
            }).catch(function (e) { return 'Error: ' + e.message; });
        }

        if (name === 'create_folder') {
            var fpid = (input.parent_id !== undefined && input.parent_id !== null) ? input.parent_id : null;
            return notes.createNodeByAI('folder', input.name, fpid, '').then(function (newId) {
                return 'Dossier "' + input.name + '" créé avec id=' + newId + '.';
            }).catch(function (e) { return 'Error: ' + e.message; });
        }

        if (name === 'list_files') {
            var nodes = notes.getNodes();
            function buildTree(pid, depth) {
                var pad = '';
                for (var d = 0; d < depth; d++) pad += '  ';
                var out = '';
                for (var i = 0; i < nodes.length; i++) {
                    var n = nodes[i];
                    if (n.parentId !== pid) continue;
                    out += pad + (n.type === 'folder' ? '[folder] ' : '[file]   ') + n.name + '  (id:' + n.id + ')\n';
                    if (n.type === 'folder') out += buildTree(n.id, depth + 1);
                }
                return out;
            }
            return Promise.resolve(buildTree(null, 0) || '(arborescence vide)');
        }

        if (name === 'read_file') {
            var fid    = Number(input.file_id);
            var nodes2 = notes.getNodes();
            var found  = null;
            for (var j = 0; j < nodes2.length; j++) {
                if (nodes2[j].id === fid) { found = nodes2[j]; break; }
            }
            if (!found)                  return Promise.resolve('Error: fichier introuvable id=' + fid);
            if (found.type === 'folder') return Promise.resolve('Error: id=' + fid + ' est un dossier');
            return Promise.resolve('# ' + found.name + '\n' + (found.content || '(vide)'));
        }

        if (name === 'write_file') {
            var wid = Number(input.file_id);
            return notes.writeFileById(wid, input.content || '').then(function () {
                return 'Fichier écrit avec succès.';
            }).catch(function (e) {
                return 'Error: ' + e.message;
            });
        }

        return Promise.resolve('Error: outil inconnu ' + name);
    }

    // ── Prompt système ────────────────────────────────────────────────────────

    function buildSystem() {
        var s = 'Tu es un assistant IA intégré dans Zenith, une application de prise de notes personnelle dans le navigateur. '
              + 'Tu aides l\'utilisateur à écrire, réviser et gérer ses notes et fichiers de code. '
              + 'Réponds toujours en français sauf si l\'utilisateur écrit dans une autre langue. ';
        if (currentMode === 'agent') {
            s += 'Tu es en mode AGENT. Outils disponibles : list_files, create_file, create_folder, read_file, write_file.\n'
               + 'RÈGLES STRICTES :\n'
               + '1. Pour créer un fichier avec du contenu, utilise create_file avec le paramètre "content" rempli. NE JAMAIS appeler write_file sur un fichier que tu viens de créer — l\'id n\'est pas connu avant la réponse.\n'
               + '2. Pour créer des fichiers dans un dossier : crée le dossier d\'abord (tu obtiens son id), puis crée les fichiers avec parent_id = cet id dans la PROCHAINE série d\'appels.\n'
               + '3. write_file sert uniquement à modifier un fichier dont tu as obtenu l\'id via list_files.\n'
               + '4. Ne suppose jamais qu\'un id existe — commence toujours par list_files si des fichiers pourraient déjà exister.\n'
               + 'Enchaîne les appels sans demander de confirmation. Résume brièvement à la fin.';
        } else {
            s += 'Tu es en mode ASK. Réponds de façon concise. Tu peux suggérer des modifications mais ne peux pas les appliquer directement.';
        }
        return s;
    }

    // ── Appel API Groq avec streaming ─────────────────────────────────────────

    function callGroq(apiMessages, onChunk, onDone, onError, attempt) {
        attempt = attempt || 0;
        var key = getKey();
        if (!key) {
            onError('Aucune clé Groq configurée. Ajoute-en une dans les Paramètres (⚙️).');
            return;
        }

        var body = {
            model: getModel(),
            messages: apiMessages,
            stream: true,
            max_tokens: 4096,
            temperature: 0.7
        };
        if (currentMode === 'agent') {
            body.tools           = TOOLS;
            body.tool_choice     = 'auto';
            body.parallel_tool_calls = false;  // séquentiel : l'agent voit les résultats avant le prochain appel
        }

        fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + key,
                'Content-Type':  'application/json'
            },
            body: JSON.stringify(body)
        }).then(function (res) {

            if (res.status === 401) { onError('Clé API invalide ou expirée.'); return; }

            if (res.status === 429) {
                rotateKey();
                var keys = getKeys();
                if (attempt < keys.length) {
                    callGroq(apiMessages, onChunk, onDone, onError, attempt + 1);
                } else {
                    onError('Quota Groq atteint sur toutes vos clés — réessayez plus tard.');
                }
                return;
            }

            if (!res.ok) {
                res.text().then(function (t) {
                    try { var e = JSON.parse(t); onError('API ' + res.status + ': ' + (e.error && e.error.message || t)); }
                    catch (_) { onError('API ' + res.status + ': ' + t); }
                });
                return;
            }

            var reader   = res.body.getReader();
            var decoder  = new TextDecoder();
            var buf      = '';
            var fullText = '';
            var toolMap  = {};   // index → {id, name, argumentsStr}
            var finishReason = '';

            function read() {
                reader.read().then(function (chunk) {
                    if (chunk.done) {
                        // Convertir toolMap en tableau ordonné
                        var toolCalls = [];
                        Object.keys(toolMap).sort(function (a, b) { return a - b; }).forEach(function (idx) {
                            toolCalls.push(toolMap[idx]);
                        });
                        onDone(fullText, toolCalls, finishReason);
                        return;
                    }

                    buf += decoder.decode(chunk.value, { stream: true });
                    var lines = buf.split('\n');
                    buf = lines.pop();

                    for (var i = 0; i < lines.length; i++) {
                        var line = lines[i];
                        if (!line.startsWith('data: ')) continue;
                        var raw = line.slice(6).trim();
                        if (raw === '[DONE]') continue;
                        try {
                            var evt = JSON.parse(raw);
                            var choice = evt.choices && evt.choices[0];
                            if (!choice) continue;

                            if (choice.finish_reason) finishReason = choice.finish_reason;

                            var delta = choice.delta;
                            if (!delta) continue;

                            // Texte
                            if (delta.content) {
                                fullText += delta.content;
                                onChunk(delta.content);
                            }

                            // Tool calls (format OpenAI streaming)
                            if (delta.tool_calls) {
                                for (var k = 0; k < delta.tool_calls.length; k++) {
                                    var tc = delta.tool_calls[k];
                                    var idx = tc.index || 0;
                                    if (!toolMap[idx]) toolMap[idx] = { id: '', name: '', argumentsStr: '' };
                                    if (tc.id)                      toolMap[idx].id = tc.id;
                                    if (tc.function && tc.function.name) toolMap[idx].name += tc.function.name;
                                    if (tc.function && tc.function.arguments) toolMap[idx].argumentsStr += tc.function.arguments;
                                }
                            }
                        } catch (_) {}
                    }
                    read();
                }).catch(function (e) { onError(e.message || String(e)); });
            }
            read();

        }).catch(function (e) { onError(e.message || String(e)); });
    }

    // ── Tour de conversation (boucle outil) ───────────────────────────────────

    function runTurn(apiMsgs) {
        var bubble  = appendBubble('assistant', '<span class="nai-thinking"><span></span><span></span><span></span></span>');
        var accum   = '';

        callGroq(apiMsgs,
            function onChunk(text) {
                accum += text;
                if (bubble) bubble.innerHTML = mdToHtml(accum);
                scrollBottom();
            },
            function onDone(fullText, toolCalls, finishReason) {
                if (bubble) bubble.innerHTML = mdToHtml(fullText || (toolCalls.length ? '' : '…'));

                // Message assistant dans l'historique (format OpenAI)
                var assistantMsg = { role: 'assistant', content: fullText || null };
                if (toolCalls.length) {
                    assistantMsg.tool_calls = toolCalls.map(function (tc) {
                        return { id: tc.id, type: 'function', function: { name: tc.name, arguments: tc.argumentsStr } };
                    });
                }
                apiMsgs.push(assistantMsg);
                messages = apiMsgs.slice();

                // Pas d'outil → fin
                if (!toolCalls.length || finishReason === 'stop') {
                    isStreaming = false;
                    setSendEnabled(true);
                    return;
                }

                // Exécuter les outils puis continuer
                var results  = new Array(toolCalls.length);
                var pending  = toolCalls.length;

                for (var j = 0; j < toolCalls.length; j++) {
                    (function (tc, idx) {
                        var parsedInput = (function () {
                            try { return JSON.parse(tc.argumentsStr || '{}'); } catch (_) { return {}; }
                        }());
                        var displayRow = appendToolRow(tc.name, parsedInput);

                        executeTool(tc.name, tc.argumentsStr).then(function (result) {
                            updateToolRow(displayRow, result);
                            results[idx] = { role: 'tool', tool_call_id: tc.id, content: String(result) };
                            pending--;
                            if (pending === 0) {
                                // Ajouter tous les résultats et relancer
                                for (var r = 0; r < results.length; r++) apiMsgs.push(results[r]);
                                messages = apiMsgs.slice();
                                runTurn(apiMsgs);
                            }
                        });
                    }(toolCalls[j], j));
                }
            },
            function onError(err) {
                if (bubble) bubble.innerHTML = '<span class="nai-error"><i class="fas fa-exclamation-triangle"></i> ' + escHtml(err) + '</span>';
                isStreaming = false;
                setSendEnabled(true);
            }
        );
    }

    function sendMessage() {
        if (isStreaming) return;
        var input = document.getElementById('notesAiInput');
        if (!input) return;
        var text = input.value.trim();
        if (!text) return;
        input.value = '';
        resizeInput(input);

        var apiMsgs = [{ role: 'system', content: buildSystem() }].concat(
            messages.filter(function (m) { return m.role !== 'system'; })
        );
        apiMsgs.push({ role: 'user', content: text });
        messages = apiMsgs.slice();

        appendBubble('user', escHtml(text));
        isStreaming = true;
        setSendEnabled(false);
        runTurn(apiMsgs);
    }

    // ── Bindings UI ───────────────────────────────────────────────────────────

    function bindUI() {
        var toggleBtn = document.getElementById('notesAiToggleBtn');
        var sendBtn   = document.getElementById('notesAiSend');
        var inputEl   = document.getElementById('notesAiInput');
        var clearBtn  = document.getElementById('notesAiClearBtn');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', function () {
                var panel = document.getElementById('notesAiPanel');
                if (panel && panel.style.display === 'none') showPanel();
                else hidePanel();
            });
        }

        if (sendBtn)  sendBtn.addEventListener('click', sendMessage);

        if (inputEl) {
            inputEl.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            });
            inputEl.addEventListener('input', function () { resizeInput(inputEl); });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                messages = [];
                var el = document.getElementById('notesAiMessages');
                if (el) el.innerHTML = '';
            });
        }

        document.querySelectorAll('.notes-ai-mode-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { setMode(btn.dataset.mode); });
        });
    }

    function init() { bindUI(); }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.ZenithAI = { showPanel: showPanel, hidePanel: hidePanel };
}());
