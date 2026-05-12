// ─── Zenith Notes ─────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
//  Types de fichiers & couleurs
// ══════════════════════════════════════════════════════════════════════════════

var FILE_TYPES = {
    'js':    { rgb: '247,223,30',   icon: 'fab fa-js-square'  },
    'jsx':   { rgb: '97,218,251',   icon: 'fab fa-react'      },
    'ts':    { rgb: '49,120,198',   icon: 'fas fa-code'       },
    'tsx':   { rgb: '49,120,198',   icon: 'fas fa-code'       },
    'py':    { rgb: '53,114,165',   icon: 'fab fa-python'     },
    'java':  { rgb: '255,32,32',   icon: 'fab fa-java'       },
    'html':  { rgb: '227,76,38',    icon: 'fab fa-html5'      },
    'htm':   { rgb: '227,76,38',    icon: 'fab fa-html5'      },
    'css':   { rgb: '21,114,182',   icon: 'fab fa-css3-alt'   },
    'scss':  { rgb: '198,83,140',   icon: 'fab fa-sass'       },
    'sass':  { rgb: '198,83,140',   icon: 'fab fa-sass'       },
    'less':  { rgb: '29,54,93',     icon: 'fas fa-code'       },
    'php':   { rgb: '136,146,191',  icon: 'fab fa-php'        },
    'json':  { rgb: '203,203,65',   icon: 'fas fa-brackets-curly' },
    'xml':   { rgb: '227,121,51',   icon: 'fas fa-code'       },
    'yaml':  { rgb: '204,16,24',    icon: 'fas fa-code'       },
    'yml':   { rgb: '204,16,24',    icon: 'fas fa-code'       },
    'toml':  { rgb: '156,66,33',    icon: 'fas fa-code'       },
    'md':    { rgb: '81,154,186',   icon: 'fab fa-markdown'   },
    'txt':   { rgb: '160,160,160',  icon: 'fas fa-file-alt'   },
    'c':     { rgb: '85,85,200',    icon: 'fas fa-code'       },
    'cpp':   { rgb: '243,75,125',   icon: 'fas fa-code'       },
    'cc':    { rgb: '243,75,125',   icon: 'fas fa-code'       },
    'h':     { rgb: '160,116,196',  icon: 'fas fa-code'       },
    'hpp':   { rgb: '160,116,196',  icon: 'fas fa-code'       },
    'rs':    { rgb: '222,165,132',  icon: 'fas fa-code'       },
    'go':    { rgb: '0,173,216',    icon: 'fas fa-code'       },
    'swift': { rgb: '255,172,69',   icon: 'fas fa-code'       },
    'kt':    { rgb: '169,123,255',  icon: 'fas fa-code'       },
    'rb':    { rgb: '204,52,45',    icon: 'fas fa-gem'        },
    'sh':    { rgb: '137,224,81',   icon: 'fas fa-terminal'   },
    'bash':  { rgb: '137,224,81',   icon: 'fas fa-terminal'   },
    'zsh':   { rgb: '137,224,81',   icon: 'fas fa-terminal'   },
    'vue':   { rgb: '66,184,131',   icon: 'fab fa-vuejs'      },
    'sql':   { rgb: '227,140,0',    icon: 'fas fa-database'   },
    'r':     { rgb: '25,140,200',   icon: 'fas fa-chart-bar'  },
    'dart':  { rgb: '84,182,221',   icon: 'fas fa-code'       },
    'lua':   { rgb: '0,0,128',      icon: 'fas fa-code'       },
    'cs':    { rgb: '149,0,255',    icon: 'fas fa-code'       },
    '_folder': { rgb: '190,160,90', icon: 'fas fa-folder'     },
    '_default':{ rgb: '138,180,248',icon: 'fas fa-file-alt'   }
};

function getExt(name) {
    var dot = name ? name.lastIndexOf('.') : -1;
    if (dot <= 0) return '';
    return name.substring(dot + 1).toLowerCase();
}

function fileInfo(name) {
    var ext = getExt(name);
    return FILE_TYPES[ext] || FILE_TYPES['_default'];
}

function rgbStr(name, isFolder) {
    if (isFolder) return FILE_TYPES['_folder'].rgb;
    return fileInfo(name).rgb;
}

// ── Mapping extension → mime CodeMirror ──────────────────────────────────────
var CM_MODES = {
    'js':   'text/javascript',      'jsx':  'text/jsx',
    'ts':   'application/typescript','tsx': 'text/typescript-jsx',
    'json': 'application/json',
    'py':   'text/x-python',
    'java': 'text/x-java',
    'c':    'text/x-csrc',          'h':    'text/x-chdr',
    'cpp':  'text/x-c++src',        'cc':   'text/x-c++src',
    'hpp':  'text/x-c++hdr',
    'cs':   'text/x-csharp',
    'kt':   'text/x-kotlin',
    'scala':'text/x-scala',
    'html': 'text/html',            'htm':  'text/html',
    'css':  'text/css',
    'scss': 'text/x-scss',          'sass': 'text/x-sass',
    'less': 'text/x-less',
    'php':  'application/x-httpd-php',
    'xml':  'text/xml',
    'yaml': 'text/x-yaml',          'yml':  'text/x-yaml',
    'sh':   'text/x-sh',            'bash': 'text/x-sh',   'zsh': 'text/x-sh',
    'sql':  'text/x-sql',
    'rs':   'text/x-rustsrc',
    'go':   'text/x-go',
    'rb':   'text/x-ruby',
    'lua':  'text/x-lua',
    'vue':  'text/x-vue',
    'swift':'text/x-swift',
    'dart': 'application/dart',
    'r':    'text/x-rsrc',
};

function isCodeFile(name) { return !!CM_MODES[getExt(name)]; }
function getCMMime(name)   { return CM_MODES[getExt(name)] || 'text/plain'; }

// ══════════════════════════════════════════════════════════════════════════════
//  IndexedDB
// ══════════════════════════════════════════════════════════════════════════════

var NotesDB = (function () {
    var DB_NAME = 'zenith-notes';
    var STORE   = 'nodes';
    var _db     = null;

    function open() {
        return new Promise(function (resolve, reject) {
            if (_db) { resolve(_db); return; }
            var req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = function (e) {
                var d = e.target.result;
                if (!d.objectStoreNames.contains(STORE)) {
                    d.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
                }
            };
            req.onsuccess = function (e) { _db = e.target.result; resolve(_db); };
            req.onerror   = function (e) { reject(e.target.error); };
        });
    }

    function getAll() {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx  = db.transaction(STORE, 'readonly');
                var req = tx.objectStore(STORE).getAll();
                req.onsuccess = function ()  { resolve(req.result); };
                req.onerror   = function (e) { reject(e.target.error); };
            });
        });
    }

    function add(node) {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var now = Date.now();
                var tx  = db.transaction(STORE, 'readwrite');
                var req = tx.objectStore(STORE).add(
                    Object.assign({}, node, { createdAt: now, updatedAt: now })
                );
                req.onsuccess = function ()  { resolve(req.result); };
                req.onerror   = function (e) { reject(e.target.error); };
            });
        });
    }

    function put(node) {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx  = db.transaction(STORE, 'readwrite');
                var req = tx.objectStore(STORE).put(
                    Object.assign({}, node, { updatedAt: Date.now() })
                );
                req.onsuccess = function ()  { resolve(req.result); };
                req.onerror   = function (e) { reject(e.target.error); };
            });
        });
    }

    function remove(id) {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx  = db.transaction(STORE, 'readwrite');
                var req = tx.objectStore(STORE).delete(id);
                req.onsuccess = function ()  { resolve(); };
                req.onerror   = function (e) { reject(e.target.error); };
            });
        });
    }

    return { getAll: getAll, add: add, put: put, remove: remove };
}());

// ══════════════════════════════════════════════════════════════════════════════
//  3D Force-Graph
// ══════════════════════════════════════════════════════════════════════════════

function NotesGraph(canvas, nodes, onNodeClick) {
    this.canvas      = canvas;
    this.ctx         = canvas.getContext('2d');
    this.onNodeClick = onNodeClick || function () {};
    this.rotX        = 0.28;
    this.rotY        = 0;
    this.zoom        = 1;
    this.autoRotate  = true;
    this.isDragging  = false;
    this.lastMouse   = null;
    this.hoveredNode = null;
    this._resumeTimer = null;
    this.animId      = null;
    this.running     = false;
    this.simStep     = 0;

    var self = this;
    var N    = nodes.length;

    this.simNodes = nodes.map(function (n) {
        return {
            id:       n.id,
            type:     n.type,
            name:     n.name,
            parentId: n.parentId != null ? n.parentId : null,
            rgb:      n.type === 'folder' ? FILE_TYPES['_folder'].rgb : fileInfo(n.name).rgb,
            x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0
        };
    });

    this.simNodes.forEach(function (nd, i) {
        var phi   = Math.acos(1 - 2 * (i + 0.5) / Math.max(N, 1));
        var theta = Math.PI * (1 + Math.sqrt(5)) * i;
        nd.x = 90 * Math.sin(phi) * Math.cos(theta);
        nd.y = 90 * Math.sin(phi) * Math.sin(theta);
        nd.z = 90 * Math.cos(phi);
    });

    this.simEdges = [];
    var ids = this.simNodes.map(function (n) { return n.id; });
    this.simNodes.forEach(function (n) {
        if (n.parentId !== null && ids.indexOf(n.parentId) !== -1) {
            self.simEdges.push({ src: n.parentId, dst: n.id });
        }
    });

    this._tick(200);
}

NotesGraph.prototype._tick = function (steps) {
    var REP = 1100, ATT = 0.018, REST = 45, G = 0.009, D = 0.82;
    var ns = this.simNodes, es = this.simEdges;
    for (var s = 0; s < steps; s++) {
        for (var i = 0; i < ns.length; i++) {
            for (var j = i + 1; j < ns.length; j++) {
                var a = ns[i], b = ns[j];
                var dx = b.x-a.x, dy = b.y-a.y, dz = b.z-a.z;
                var d2 = dx*dx+dy*dy+dz*dz+1, d = Math.sqrt(d2), f = REP/d2;
                var fx = f*dx/d, fy = f*dy/d, fz = f*dz/d;
                a.vx -= fx; a.vy -= fy; a.vz -= fz;
                b.vx += fx; b.vy += fy; b.vz += fz;
            }
        }
        for (var k = 0; k < es.length; k++) {
            var na = null, nb = null;
            for (var m = 0; m < ns.length; m++) {
                if (ns[m].id === es[k].src) na = ns[m];
                if (ns[m].id === es[k].dst) nb = ns[m];
            }
            if (!na || !nb) continue;
            var edx = nb.x-na.x, edy = nb.y-na.y, edz = nb.z-na.z;
            var ed = Math.sqrt(edx*edx+edy*edy+edz*edz)||1, ef = ATT*(ed-REST);
            na.vx += ef*edx/ed; na.vy += ef*edy/ed; na.vz += ef*edz/ed;
            nb.vx -= ef*edx/ed; nb.vy -= ef*edy/ed; nb.vz -= ef*edz/ed;
        }
        for (var p = 0; p < ns.length; p++) {
            ns[p].vx = (ns[p].vx - ns[p].x*G)*D;
            ns[p].vy = (ns[p].vy - ns[p].y*G)*D;
            ns[p].vz = (ns[p].vz - ns[p].z*G)*D;
            ns[p].x += ns[p].vx; ns[p].y += ns[p].vy; ns[p].z += ns[p].vz;
        }
    }
};

NotesGraph.prototype._project = function (x, y, z) {
    var cy = Math.cos(this.rotY), sy = Math.sin(this.rotY);
    var x1 = x*cy-z*sy, z1 = x*sy+z*cy;
    var cx = Math.cos(this.rotX), sx = Math.sin(this.rotX);
    var y2 = y*cx-z1*sx, z2 = y*sx+z1*cx;
    var fov = 360*this.zoom, sc = fov/(fov+z2+200);
    return { sx: this.canvas.width/2+x1*sc, sy: this.canvas.height/2+y2*sc, scale: sc, z: z2 };
};

NotesGraph.prototype._draw = function () {
    var ctx = this.ctx, self = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    var proj = this.simNodes.map(function (n) {
        var p = self._project(n.x, n.y, n.z);
        return { id: n.id, type: n.type, name: n.name, rgb: n.rgb,
                 sx: p.sx, sy: p.sy, scale: p.scale, z: p.z };
    });
    proj.sort(function (a, b) { return a.z - b.z; });

    function findP(id) {
        for (var i = 0; i < proj.length; i++) if (proj[i].id === id) return proj[i];
        return null;
    }

    // Edges
    for (var ei = 0; ei < this.simEdges.length; ei++) {
        var ea = findP(this.simEdges[ei].src), eb = findP(this.simEdges[ei].dst);
        if (!ea || !eb) continue;
        ctx.beginPath();
        ctx.moveTo(ea.sx, ea.sy);
        ctx.lineTo(eb.sx, eb.sy);
        ctx.strokeStyle = 'rgba(255,255,255,' + Math.min(0.3, (ea.scale+eb.scale)*0.12) + ')';
        ctx.lineWidth = 0.8;
        ctx.stroke();
    }

    // Nodes
    var hid = this.hoveredNode ? this.hoveredNode.id : null;
    for (var ni = 0; ni < proj.length; ni++) {
        var n   = proj[ni];
        var isF = n.type === 'folder';
        var isH = n.id === hid;
        var r   = (isF ? 7 : 4.5) * n.scale * 2.2;
        var gr  = r * (isH ? 5 : 3.5);
        var rgb = n.rgb;

        var g = ctx.createRadialGradient(n.sx, n.sy, 0, n.sx, n.sy, Math.max(gr, 1));
        g.addColorStop(0,    'rgba('+rgb+','+(isH?0.95:0.7)+')');
        g.addColorStop(0.4,  'rgba('+rgb+','+(isH?0.25:0.12)+')');
        g.addColorStop(1,    'rgba('+rgb+',0)');
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, Math.max(gr, 1), 0, Math.PI*2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.sx, n.sy, Math.max(1.5, r), 0, Math.PI*2);
        ctx.fillStyle = 'rgba('+rgb+','+(0.75+n.scale*0.25)+')';
        ctx.fill();

        if (isH || (isF && r > 5) || r > 7) {
            var fs = Math.max(9, Math.min(13, 11*n.scale*1.8));
            ctx.font        = (isH?'500 ':'400 ')+fs+'px Inter,sans-serif';
            ctx.textAlign   = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.9)';
            ctx.shadowBlur  = 5;
            ctx.fillStyle   = 'rgba(255,255,255,'+(isH?0.95:0.6)+')';
            ctx.fillText(n.name, n.sx, n.sy - r - 5);
            ctx.shadowBlur  = 0;
        }
    }
};

NotesGraph.prototype._hit = function (mx, my) {
    for (var i = 0; i < this.simNodes.length; i++) {
        var n = this.simNodes[i], p = this._project(n.x, n.y, n.z);
        var r = (n.type==='folder'?7:4.5)*p.scale*2.2+10;
        if (Math.pow(p.sx-mx,2)+Math.pow(p.sy-my,2) <= r*r) return n;
    }
    return null;
};

NotesGraph.prototype.addNode = function (rawNode) {
    var rgb = rawNode.type === 'folder'
        ? FILE_TYPES['_folder'].rgb
        : fileInfo(rawNode.name).rgb;

    // Positionner près du parent s'il existe, sinon sur la sphère
    var px = 0, py = 0, pz = 0;
    if (rawNode.parentId !== null && rawNode.parentId !== undefined) {
        for (var i = 0; i < this.simNodes.length; i++) {
            if (this.simNodes[i].id === rawNode.parentId) {
                px = this.simNodes[i].x;
                py = this.simNodes[i].y;
                pz = this.simNodes[i].z;
                break;
            }
        }
    }
    var spread = 18;
    var sn = {
        id:       rawNode.id,
        type:     rawNode.type,
        name:     rawNode.name,
        parentId: rawNode.parentId != null ? rawNode.parentId : null,
        rgb:      rgb,
        x: px + (Math.random() - 0.5) * spread,
        y: py + (Math.random() - 0.5) * spread,
        z: pz + (Math.random() - 0.5) * spread,
        vx: 0, vy: 0, vz: 0
    };
    this.simNodes.push(sn);

    if (sn.parentId !== null) {
        var parentExists = false;
        for (var j = 0; j < this.simNodes.length; j++) {
            if (this.simNodes[j].id === sn.parentId) { parentExists = true; break; }
        }
        if (parentExists) this.simEdges.push({ src: sn.parentId, dst: sn.id });
    }

    // Quelques ticks pour intégrer le nouveau nœud
    this._tick(80);
    this.simStep = Math.max(this.simStep, 400);
};

NotesGraph.prototype.start = function () {
    this.running = true;
    var self = this;
    function loop() {
        if (!self.running) return;
        if (self.simStep < 600) { self._tick(2); self.simStep += 2; }
        if (self.autoRotate && !self.isDragging) self.rotY += 0.0025;
        self._draw();
        self.animId = requestAnimationFrame(loop);
    }
    loop();
};

NotesGraph.prototype.stop = function () {
    this.running = false;
    if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
    clearTimeout(this._resumeTimer);
};

NotesGraph.prototype.bindEvents = function () {
    var self = this, c = this.canvas;

    c.addEventListener('mousedown', function (e) {
        self.isDragging = true; self.autoRotate = false;
        clearTimeout(self._resumeTimer);
        self.lastMouse = { x: e.clientX, y: e.clientY };
        c.style.cursor = 'grabbing';
    });

    c.addEventListener('mousemove', function (e) {
        var rect = c.getBoundingClientRect();
        var mx = e.clientX-rect.left, my = e.clientY-rect.top;
        if (self.isDragging && self.lastMouse) {
            self.rotY += (e.clientX-self.lastMouse.x)*0.006;
            self.rotX += (e.clientY-self.lastMouse.y)*0.006;
            self.rotX  = Math.max(-Math.PI/2, Math.min(Math.PI/2, self.rotX));
            self.lastMouse = { x: e.clientX, y: e.clientY };
        } else {
            self.hoveredNode = self._hit(mx, my);
            c.style.cursor = self.hoveredNode ? 'pointer' : 'grab';
        }
    });

    c.addEventListener('mouseup', function (e) {
        if (!self.isDragging) return;
        var rect    = c.getBoundingClientRect();
        var clicked = self._hit(e.clientX-rect.left, e.clientY-rect.top);
        if (clicked) self.onNodeClick(clicked);
        self.isDragging = false;
        self._resumeTimer = setTimeout(function () { self.autoRotate = true; }, 2500);
        c.style.cursor = clicked ? 'pointer' : 'grab';
    });

    c.addEventListener('wheel', function (e) {
        e.preventDefault();
        self.zoom *= e.deltaY > 0 ? 0.92 : 1.09;
        self.zoom  = Math.max(0.25, Math.min(4, self.zoom));
    }, { passive: false });

    c.addEventListener('mouseleave', function () {
        self.isDragging = false; self.hoveredNode = null;
    });
};

// ══════════════════════════════════════════════════════════════════════════════
//  ZenithNotes
// ══════════════════════════════════════════════════════════════════════════════

var ZenithNotes = (function () {
    var allNodes        = [];
    var activeNoteId    = null;
    var activeNoteIsCode = false;
    var contextFolderId = null;
    var saveTimeout     = null;
    var expandedFolders = {};
    var graphInstance   = null;
    var cmInstance      = null;

    function $id(id) { return document.getElementById(id); }

    // ── Init ─────────────────────────────────────────────────────────────────
    function init() {
        NotesDB.getAll().then(function (nodes) {
            allNodes = nodes;
            renderTree();
            bindToolbar();
            bindEditorEvents();
            bindSidebarBtns();
            bindGraphViewBtn();
        }).catch(function (err) {
            console.error('[ZenithNotes] init error', err);
        });
    }

    // ── Graphe 3D ────────────────────────────────────────────────────────────
    function showGraph() {
        var canvas = $id('notesGraph');
        var editor = $id('notesEditor');
        var empty  = $id('notesEmpty');
        if (!canvas) return;

        if (editor) editor.style.display = 'none';
        setToolbarEnabled(false);
        setGraphViewBtn(false);

        if (allNodes.length === 0) {
            canvas.style.display = 'none';
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';
        canvas.style.display = 'block';

        var wrap = canvas.parentElement;
        if (wrap) wrap.style.overflow = 'hidden';
        canvas.width  = wrap ? wrap.clientWidth  : 800;
        canvas.height = wrap ? wrap.clientHeight : 500;

        if (graphInstance) graphInstance.stop();
        graphInstance = new NotesGraph(canvas, allNodes, function (node) {
            if (node.type === 'file') openNote(node.id);
            else { contextFolderId = node.id; toggleFolder(node.id); }
        });
        graphInstance.bindEvents();
        graphInstance.start();

        var ht = $id('notesHeaderTitle');
        if (ht) ht.textContent = 'Notes';
        activeNoteId = null;
        renderTree();
    }

    function hideGraph() {
        if (graphInstance) { graphInstance.stop(); graphInstance = null; }
        var canvas = $id('notesGraph');
        if (!canvas) return;
        canvas.style.display = 'none';
        var wrap = canvas.parentElement;
        if (wrap) wrap.style.overflow = '';
    }

    function refreshGraphIfVisible() {
        var canvas = $id('notesGraph');
        if (canvas && canvas.style.display === 'block') showGraph();
    }

    // ── Bouton "retour graphe" ────────────────────────────────────────────────
    function setGraphViewBtn(visible) {
        var btn = $id('notesGraphViewBtn');
        if (!btn) return;
        btn.style.display = visible ? 'flex' : 'none';
    }

    function bindGraphViewBtn() {
        var btn = $id('notesGraphViewBtn');
        if (!btn) return;
        btn.addEventListener('click', function () {
            flushSave().then(function () {
                activeNoteId = null;
                showGraph();
            });
        });
    }

    // ── Arbre ────────────────────────────────────────────────────────────────
    function renderTree() {
        var container = $id('notesTree');
        if (!container) return;
        container.innerHTML = '';
        renderChildren(null, container, 0);
    }

    function renderChildren(parentId, container, depth) {
        var children = allNodes.filter(function (n) {
            return (n.parentId != null ? n.parentId : null) === parentId;
        }).sort(function (a, b) {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

        children.forEach(function (node) {
            var item = document.createElement('div');
            item.className = 'ntr-item';

            var row = document.createElement('div');
            row.className     = 'ntr-row';
            row.style.paddingLeft = (0.65 + depth * 1.05) + 'rem';
            if (node.id === activeNoteId)    row.classList.add('active');
            if (node.id === contextFolderId) row.classList.add('context');

            if (node.type === 'folder') {
                var arrow = document.createElement('i');
                arrow.className = expandedFolders[node.id]
                    ? 'fas fa-chevron-down ntr-arrow'
                    : 'fas fa-chevron-right ntr-arrow';
                row.appendChild(arrow);

                var ficon = document.createElement('i');
                ficon.className = expandedFolders[node.id]
                    ? 'fas fa-folder-open ntr-icon' : 'fas fa-folder ntr-icon';
                ficon.style.color = 'rgb(' + FILE_TYPES['_folder'].rgb + ')';
                row.appendChild(ficon);
            } else {
                var spacer = document.createElement('span');
                spacer.className = 'ntr-spacer';
                row.appendChild(spacer);

                var info  = fileInfo(node.name);
                var dicon = document.createElement('i');
                // Fallback vers fa-file-alt si l'icône FA Brand n'est pas dispo
                dicon.className  = info.icon + ' ntr-icon';
                dicon.style.color = 'rgb(' + info.rgb + ')';
                row.appendChild(dicon);
            }

            var nameEl = document.createElement('span');
            nameEl.className   = 'ntr-name';
            nameEl.textContent = node.name;

            // Colorier l'extension dans le nom
            if (node.type === 'file') {
                var ext = getExt(node.name);
                if (ext) {
                    var base = node.name.substring(0, node.name.length - ext.length - 1);
                    nameEl.textContent = '';
                    var baseSpan = document.createElement('span');
                    baseSpan.textContent = base;
                    var dotSpan = document.createElement('span');
                    dotSpan.textContent = '.' + ext;
                    dotSpan.style.opacity = '0.45';
                    dotSpan.style.fontSize = '0.72em';
                    nameEl.appendChild(baseSpan);
                    nameEl.appendChild(dotSpan);
                }
            }
            row.appendChild(nameEl);

            var acts = document.createElement('div');
            acts.className = 'ntr-actions';

            var renBtn = document.createElement('button');
            renBtn.className = 'ntr-action-btn';
            renBtn.title     = 'Renommer';
            renBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
            (function (nid, nel) {
                renBtn.addEventListener('click', function (e) {
                    e.stopPropagation(); startRename(nid, nel);
                });
            }(node.id, nameEl));
            acts.appendChild(renBtn);

            var delBtn = document.createElement('button');
            delBtn.className = 'ntr-action-btn ntr-del';
            delBtn.title     = 'Supprimer';
            delBtn.innerHTML = '<i class="fas fa-trash"></i>';
            (function (nid) {
                delBtn.addEventListener('click', function (e) {
                    e.stopPropagation(); deleteNode(nid);
                });
            }(node.id));
            acts.appendChild(delBtn);

            row.appendChild(acts);
            item.appendChild(row);

            if (node.type === 'folder') {
                (function (nid) {
                    row.addEventListener('click', function () {
                        contextFolderId = nid; toggleFolder(nid);
                    });
                }(node.id));
                if (expandedFolders[node.id]) {
                    var sub = document.createElement('div');
                    sub.className = 'ntr-children';
                    item.appendChild(sub);
                    renderChildren(node.id, sub, depth + 1);
                }
            } else {
                (function (nid, pid) {
                    row.addEventListener('click', function () {
                        contextFolderId = pid != null ? pid : null;
                        openNote(nid);
                    });
                }(node.id, node.parentId));
            }

            container.appendChild(item);
        });
    }

    function toggleFolder(id) {
        if (expandedFolders[id]) delete expandedFolders[id];
        else expandedFolders[id] = true;
        renderTree();
    }

    // ── Détruire l'instance CodeMirror courante ───────────────────────────────
    function destroyCM() {
        if (!cmInstance) return;
        try {
            var wrapper = cmInstance.getWrapperElement();
            cmInstance.toTextArea();
            if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
        } catch (e) {}
        cmInstance = null;
        // Remettre la textarea en place pour la prochaine fois
        var ce = $id('notesCodeEditor');
        if (ce && !ce.querySelector('textarea')) {
            var ta = document.createElement('textarea');
            ta.id  = 'notesCodeTextarea';
            ce.appendChild(ta);
        }
    }

    // ── Ouvrir une note ──────────────────────────────────────────────────────
    function openNote(id) {
        flushSave().then(function () {
            var node = null;
            for (var i = 0; i < allNodes.length; i++) {
                if (allNodes[i].id === id) { node = allNodes[i]; break; }
            }
            if (!node || node.type !== 'file') return;

            activeNoteId     = id;
            activeNoteIsCode = isCodeFile(node.name);
            renderTree();
            hideGraph();
            setGraphViewBtn(true);

            var ed = $id('notesEditor');
            var ce = $id('notesCodeEditor');
            var em = $id('notesEmpty');
            if (em) em.style.display = 'none';

            var ht = $id('notesHeaderTitle');
            if (ht) ht.textContent = node.name;

            var wrap = $id('notesEditorWrap') || (ed && ed.parentElement);
            if (activeNoteIsCode) {
                // ── Éditeur de code ──
                if (ed) { ed.style.display = 'none'; ed.contentEditable = 'false'; }
                if (wrap) wrap.style.overflowY = 'hidden';
                setToolbarEnabled(false);
                destroyCM();
                if (ce) ce.style.display = 'flex';

                var ta = $id('notesCodeTextarea');
                if (ta && typeof CodeMirror !== 'undefined') {
                    cmInstance = CodeMirror.fromTextArea(ta, {
                        mode:             getCMMime(node.name),
                        theme:            'dracula',
                        lineNumbers:      true,
                        indentUnit:       4,
                        tabSize:          4,
                        indentWithTabs:   false,
                        lineWrapping:     false,
                        matchBrackets:    true,
                        autoCloseBrackets:true,
                        styleActiveLine:  true,
                        extraKeys: { 'Tab': function (cm) { cm.replaceSelection('    '); } }
                    });
                    cmInstance.setValue(node.content || '');
                    cmInstance.clearHistory();
                    cmInstance.on('change', scheduleSave);
                    setTimeout(function () { cmInstance.refresh(); cmInstance.focus(); }, 60);
                }
            } else {
                // ── Éditeur riche ──
                if (ce) { ce.style.display = 'none'; destroyCM(); }
                if (wrap) wrap.style.overflowY = 'auto';
                setToolbarEnabled(true);
                if (ed) {
                    ed.contentEditable = 'true';
                    ed.innerHTML       = node.content || '';
                    ed.style.display   = 'block';
                }
                setTimeout(function () {
                    if (!ed) return;
                    ed.focus();
                    try {
                        var range = document.createRange();
                        range.selectNodeContents(ed);
                        range.collapse(false);
                        window.getSelection().removeAllRanges();
                        window.getSelection().addRange(range);
                    } catch (e) {}
                }, 50);
            }
        });
    }

    // ── Sauvegarde ───────────────────────────────────────────────────────────
    function scheduleSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(flushSave, 900);
    }

    function flushSave() {
        if (saveTimeout) { clearTimeout(saveTimeout); saveTimeout = null; }
        if (activeNoteId === null) return Promise.resolve();
        var node = null;
        for (var i = 0; i < allNodes.length; i++) {
            if (allNodes[i].id === activeNoteId) { node = allNodes[i]; break; }
        }
        if (!node) return Promise.resolve();
        if (activeNoteIsCode) {
            node.content = cmInstance ? cmInstance.getValue() : '';
        } else {
            var ed = $id('notesEditor');
            if (!ed) return Promise.resolve();
            node.content = ed.innerHTML;
        }
        return NotesDB.put(node);
    }

    // ── Création programmatique (utilisé par l'IA) ───────────────────────────
    function createNodeByAI(type, name, parentId, content) {
        var pid = (parentId !== null && parentId !== undefined && parentId !== '') ? Number(parentId) : null;
        if (pid !== null) {
            var found = false;
            for (var i = 0; i < allNodes.length; i++) {
                if (allNodes[i].id === pid && allNodes[i].type === 'folder') { found = true; break; }
            }
            if (!found) pid = null;
        }
        if (pid !== null) expandedFolders[pid] = true;
        return NotesDB.add({ parentId: pid, type: type, name: name, content: content || '' })
            .then(function (newId) {
                return NotesDB.getAll().then(function (nodes) {
                    allNodes = nodes;
                    renderTree();
                    // Injection live dans le graphe si visible, sinon rebuild classique
                    var canvas = $id('notesGraph');
                    if (canvas && canvas.style.display === 'block' && graphInstance) {
                        var newNode = null;
                        for (var i = 0; i < allNodes.length; i++) {
                            if (allNodes[i].id === newId) { newNode = allNodes[i]; break; }
                        }
                        if (newNode) graphInstance.addNode(newNode);
                    } else {
                        refreshGraphIfVisible();
                    }
                    return newId;
                });
            });
    }

    // ── Écriture par ID (utilisé par l'IA) ───────────────────────────────────
    function writeFileById(id, content) {
        var node = null;
        for (var i = 0; i < allNodes.length; i++) {
            if (allNodes[i].id === id) { node = allNodes[i]; break; }
        }
        if (!node || node.type !== 'file') return Promise.reject(new Error('Fichier introuvable : ' + id));
        node.content = content;
        if (id === activeNoteId) {
            if (activeNoteIsCode) {
                if (cmInstance) {
                    var cursor = cmInstance.getCursor();
                    cmInstance.setValue(content);
                    try { cmInstance.setCursor(cursor); } catch (e) {}
                }
            } else {
                var ed = $id('notesEditor');
                if (ed) ed.innerHTML = content;
            }
        }
        return NotesDB.put(node);
    }

    // ── Créer ────────────────────────────────────────────────────────────────
    function createFile(parentId) {
        inlineCreate('file', parentId !== undefined ? parentId : contextFolderId);
    }
    function createFolder(parentId) {
        inlineCreate('folder', parentId !== undefined ? parentId : contextFolderId);
    }

    function inlineCreate(type, parentId) {
        var container = $id('notesTree');
        if (!container) return;
        var existing = container.querySelector('.ntr-create-row');
        if (existing) existing.remove();

        var pid = parentId != null ? parentId : null;

        var row = document.createElement('div');
        row.className     = 'ntr-row ntr-create-row';
        row.style.paddingLeft = '0.65rem';

        var icon = document.createElement('i');
        icon.className = type === 'file' ? 'fas fa-file-alt ntr-icon' : 'fas fa-folder ntr-icon';
        icon.style.color = type === 'folder'
            ? 'rgb(' + FILE_TYPES['_folder'].rgb + ')'
            : 'rgb(' + FILE_TYPES['_default'].rgb + ')';
        row.appendChild(icon);

        var input = document.createElement('input');
        input.className   = 'ntr-rename-input';
        input.placeholder = type === 'file' ? 'note.md' : 'dossier';
        input.style.flex  = '1';
        row.appendChild(input);

        var okBtn = document.createElement('button');
        okBtn.className = 'ntr-action-btn';
        okBtn.innerHTML = '<i class="fas fa-check"></i>';
        row.appendChild(okBtn);

        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'ntr-action-btn';
        cancelBtn.innerHTML = '<i class="fas fa-times"></i>';
        row.appendChild(cancelBtn);

        container.prepend(row);
        input.focus();

        var committed = false;
        function commit() {
            if (committed) return;
            committed = true;
            var name = input.value.trim();
            row.remove();
            if (!name) return;
            if (pid !== null) expandedFolders[pid] = true;
            NotesDB.add({ parentId: pid, type: type, name: name, content: '' })
                .then(function (newId) {
                    return NotesDB.getAll().then(function (nodes) {
                        allNodes = nodes;
                        renderTree();
                        if (type === 'file') openNote(newId);
                        else refreshGraphIfVisible();
                    });
                })
                .catch(function (e) { console.error('[ZenithNotes] create error', e); });
        }

        okBtn.addEventListener('mousedown',     function (e) { e.preventDefault(); commit(); });
        cancelBtn.addEventListener('mousedown', function (e) { e.preventDefault(); row.remove(); committed = true; });
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter')  { e.preventDefault(); commit(); }
            if (e.key === 'Escape') { row.remove(); committed = true; }
        });
        input.addEventListener('blur', function () {
            setTimeout(function () {
                if (!committed && document.activeElement !== okBtn) { row.remove(); committed = true; }
            }, 150);
        });
    }

    // ── Supprimer ────────────────────────────────────────────────────────────
    function deleteNode(id) {
        var toDelete = [];
        function collect(nid) {
            toDelete.push(nid);
            allNodes.forEach(function (n) {
                if ((n.parentId != null ? n.parentId : null) === nid) collect(n.id);
            });
        }
        collect(id);

        var chain = Promise.resolve();
        toDelete.forEach(function (nid) {
            chain = chain.then(function () { return NotesDB.remove(nid); });
        });

        chain.then(function () {
            var wasActive = toDelete.indexOf(activeNoteId) !== -1;
            if (wasActive) {
                activeNoteId = null;
                var ed = $id('notesEditor');
                if (ed) { ed.innerHTML = ''; ed.contentEditable = 'false'; ed.style.display = 'none'; }
                setToolbarEnabled(false);
                setGraphViewBtn(false);
                var ht = $id('notesHeaderTitle');
                if (ht) ht.textContent = 'Notes';
            }
            return NotesDB.getAll();
        }).then(function (nodes) {
            allNodes = nodes;
            renderTree();
            if (activeNoteId === null) refreshGraphIfVisible();
        });
    }

    // ── Renommer ─────────────────────────────────────────────────────────────
    function startRename(id, nameEl) {
        var node = null;
        for (var i = 0; i < allNodes.length; i++) {
            if (allNodes[i].id === id) { node = allNodes[i]; break; }
        }
        if (!node) return;

        var input = document.createElement('input');
        input.className = 'ntr-rename-input';
        input.value     = node.name;
        nameEl.replaceWith(input);
        input.focus(); input.select();

        function commit() {
            var newName = input.value.trim() || node.name;
            node.name = newName;
            NotesDB.put(node).then(function () {
                return NotesDB.getAll();
            }).then(function (nodes) {
                allNodes = nodes;
                if (activeNoteId === id) {
                    var ht = $id('notesHeaderTitle');
                    if (ht) ht.textContent = newName;
                }
                renderTree();
            });
        }

        input.addEventListener('blur', commit);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter')  { e.preventDefault(); input.blur(); }
            if (e.key === 'Escape') renderTree();
        });
    }

    // ── Toolbar ──────────────────────────────────────────────────────────────
    function bindToolbar() {
        var tb = $id('notesToolbar');
        if (!tb) return;
        setToolbarEnabled(false);
        tb.addEventListener('mousedown', function (e) {
            var btn = e.target.closest('[data-cmd]');
            if (!btn) return;
            e.preventDefault();
            document.execCommand(btn.dataset.cmd, false, btn.dataset.val || null);
            var ed = $id('notesEditor');
            if (ed) ed.focus();
            syncToolbar();
        });
    }

    function setToolbarEnabled(enabled) {
        var tb = $id('notesToolbar');
        if (!tb) return;
        tb.style.opacity       = enabled ? '1'    : '0.35';
        tb.style.pointerEvents = enabled ? 'auto' : 'none';
    }

    function syncToolbar() {
        var tb = $id('notesToolbar');
        if (!tb) return;
        var btns = tb.querySelectorAll('[data-cmd]');
        for (var i = 0; i < btns.length; i++) {
            var btn = btns[i], cmd = btn.dataset.cmd;
            try {
                btn.classList.toggle('active',
                    cmd === 'formatBlock'
                        ? document.queryCommandValue(cmd).toLowerCase() === (btn.dataset.val || '')
                        : document.queryCommandState(cmd));
            } catch (e) {}
        }
    }

    // ── Éditeur ──────────────────────────────────────────────────────────────
    function bindEditorEvents() {
        var ed = $id('notesEditor');
        if (!ed) return;
        ed.addEventListener('input',   scheduleSave);
        ed.addEventListener('keyup',   syncToolbar);
        ed.addEventListener('mouseup', syncToolbar);
        ed.addEventListener('keydown', function (e) {
            if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertHTML', false, '    '); }
        });
    }

    // ── Boutons sidebar ──────────────────────────────────────────────────────
    function bindSidebarBtns() {
        var nb = $id('newNoteBtn'), fb = $id('newFolderBtn');
        if (nb) nb.addEventListener('click', function () { createFile(); });
        if (fb) fb.addEventListener('click', function () { createFolder(); });
    }

    return {
        init:           init,
        showGraph:      showGraph,
        createFile:     createFile,
        createFolder:   createFolder,
        flushSave:      flushSave,
        writeFileById:  writeFileById,
        createNodeByAI: createNodeByAI,
        getNodes:       function () { return allNodes; }
    };
}());

window.ZenithNotes = ZenithNotes;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { ZenithNotes.init(); });
} else {
    ZenithNotes.init();
}
