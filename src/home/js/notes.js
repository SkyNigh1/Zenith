class NotesModule {
    constructor() {
        this.dbName = 'ZenithNotesDB';
        this.dbVersion = 1;
        this.db = null;
        this.currentFolderId = 'root';
        this.currentFileId = null;
        this.container = null;
        this.homepage = null;
        this.editor = null;
        this.fileTree = null;
        this.isOpen = false;
        this.undoStack = [];
    }

    async init() {
        this.container = document.getElementById('notesContainer');
        this.homepage = document.querySelector('.homepage-container');
        this.editor = document.getElementById('noteEditor');
        this.fileTree = document.getElementById('fileTree');
        this.emptyState = document.getElementById('emptyState');
        this.modal = document.getElementById('customModal');
        this.toastContainer = document.getElementById('toastContainer');
        this.undoBtn = document.getElementById('undoBtn');
        
        if (!this.container) return;

        await this.openDB();
        this.setupEventListeners();
        this.renderFileTree();
        this.updateEmptyState();
        this.updateUndoButton();
    }

    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error("Database error: " + event.target.errorCode);
                reject(event.target.errorCode);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store for folders
                if (!db.objectStoreNames.contains('folders')) {
                    const folderStore = db.createObjectStore('folders', { keyPath: 'id' });
                    folderStore.createIndex('parentId', 'parentId', { unique: false });
                }

                // Create object store for files
                if (!db.objectStoreNames.contains('files')) {
                    const fileStore = db.createObjectStore('files', { keyPath: 'id' });
                    fileStore.createIndex('parentId', 'parentId', { unique: false });
                }

                // Add root folder if not exists
                const transaction = event.target.transaction;
                const folderStore = transaction.objectStore('folders');
                folderStore.add({ id: 'root', parentId: null, name: 'Root' });
            };
        });
    }

    setupEventListeners() {
        // Toggle Notes View
        const notesBtn = document.getElementById('notesBtn');
        if (notesBtn) {
            notesBtn.addEventListener('click', () => this.openNotes());
        }

        const closeNotesBtn = document.getElementById('closeNotesBtn');
        if (closeNotesBtn) {
            closeNotesBtn.addEventListener('click', () => this.closeNotes());
        }

        // Editor Formatting
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Prevent focus loss
                const command = btn.dataset.command;
                const value = btn.dataset.value || null;
                document.execCommand(command, false, value);
                this.editor.focus();
                this.updateToolbarState();
            });
        });

            // Auto-save on input
        if (this.editor) {
            this.editor.addEventListener('input', (e) => {
                this.handleInput(e);
                this.saveCurrentFile();
                this.updateLogoOpacity();
            });            this.editor.addEventListener('keydown', (e) => {
                this.handleKeyDown(e);
                // Scroll on arrow keys
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    this.scrollToCursor();
                }
            });

            this.editor.addEventListener('keyup', (e) => {
                this.handleKeyUp(e);
                // Scroll on arrow keys (keyup for final position)
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    this.scrollToCursor();
                }
            });

            // Handle Ctrl+S to save as Markdown
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    if (this.isOpen) {
                        e.preventDefault();
                        if (this.currentFileId) {
                            this.downloadCurrentNoteAsMarkdown();
                        } else {
                            this.showToast("Aucune note sélectionnée", null, null, 'warning');
                        }
                    }
                }
            });

            // Logo Opacity on Scroll
            this.editor.addEventListener('scroll', () => this.updateLogoOpacity());
            
            // Selection change for button highlighting
            document.addEventListener('selectionchange', () => {
                this.updateToolbarState();
            });
        }

        // File/Folder Creation
        document.getElementById('newFolderBtn')?.addEventListener('click', () => this.createNewFolder());
        document.getElementById('newFileBtn')?.addEventListener('click', () => this.createNewFile());
        document.getElementById('createNoteEmptyBtn')?.addEventListener('click', () => this.createNewFile());
        
        // Collapse Tree
        const collapseBtn = document.getElementById('collapseTreeBtn');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                const expandedItems = document.querySelectorAll('.tree-item.expanded');
                const allFolders = document.querySelectorAll('.tree-item.folder');
                
                if (expandedItems.length > 0) {
                    // Collapse all
                    expandedItems.forEach(el => el.classList.remove('expanded'));
                } else {
                    // Expand all
                    allFolders.forEach(el => el.classList.add('expanded'));
                }
                this.updateCollapseButtonState();
            });
        }

        // Undo Button
        document.getElementById('undoBtn')?.addEventListener('click', () => this.undoLastAction());

        // Modal Events
        document.getElementById('modalCancelBtn')?.addEventListener('click', () => this.closeModal());
        document.getElementById('modalInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('modalConfirmBtn').click();
            if (e.key === 'Escape') this.closeModal();
        });

        // Rename current note from header
        document.getElementById('renameNoteBtn')?.addEventListener('click', () => {
            if (this.currentFileId) {
                const nameEl = document.getElementById('currentNoteName');
                if (nameEl) {
                    this.renameItem(this.currentFileId, 'file', nameEl);
                }
            }
        });

        // Drop on file tree background to move to root
        this.fileTree.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        this.fileTree.addEventListener('drop', async (e) => {
            e.preventDefault();
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            // Only move if not already in root (though moving to same parent is harmless but redundant)
            // We rely on folder drop handlers stopping propagation. 
            // If we reach here, it means we dropped on the "background" of the tree.
            if (data.id) {
                 await this.moveItem(data.id, data.type, 'root');
                 this.renderFileTree();
            }
        });
    }

    openNotes() {
        this.homepage.style.display = 'none';
        this.container.style.display = 'flex';
        this.isOpen = true;
        
        // Hide other UI elements
        document.querySelector('.widgets-container').style.display = 'none';
        document.querySelector('.menu-container').style.display = 'none';
        document.querySelector('.zenith-branding').style.display = 'none';
    }

    closeNotes() {
        this.container.style.display = 'none';
        this.homepage.style.display = 'flex'; // Restore flex display
        this.isOpen = false;
        
        // Show other UI elements
        document.querySelector('.widgets-container').style.display = 'flex';
        document.querySelector('.menu-container').style.display = 'block';
        document.querySelector('.zenith-branding').style.display = 'flex';
        
        // Reset note name
        const noteNameEl = document.getElementById('currentNoteName');
        if (noteNameEl) {
            noteNameEl.textContent = 'Nouvelle note';
        }
    }

    async getFolders(parentId) {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['folders'], 'readonly');
            const store = transaction.objectStore('folders');
            const index = store.index('parentId');
            const request = index.getAll(parentId);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async getFiles(parentId) {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const index = store.index('parentId');
            const request = index.getAll(parentId);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async renderFileTree() {
        if (!this.fileTree) return;
        this.fileTree.innerHTML = '';
        await this.renderFolderContent('root', this.fileTree);
    }

    async renderFolderContent(folderId, container) {
        const folders = await this.getFolders(folderId);
        const files = await this.getFiles(folderId);

        // Render Folders
        folders.forEach(folder => {
            if (folder.id === 'root') return; // Skip root self-reference if any

            const folderEl = document.createElement('div');
            folderEl.className = 'tree-item folder';
            folderEl.dataset.id = folder.id;
            folderEl.draggable = true;
            
            const header = document.createElement('div');
            header.className = 'tree-item-header';
            header.innerHTML = `
                <div class="item-content">
                    <i class="fas fa-folder"></i> 
                    <span class="item-name" contenteditable="false">${folder.name}</span>
                </div>
                <div class="item-actions">
                    <button class="rename-item-btn" title="Renommer"><i class="fas fa-pen"></i></button>
                    <button class="delete-item-btn" title="Supprimer"><i class="fas fa-times"></i></button>
                </div>
            `;
            
            // Folder click to toggle
            header.addEventListener('click', (e) => {
                e.stopPropagation();
                // Don't toggle if clicking buttons
                if (e.target.closest('.delete-item-btn') || e.target.closest('.rename-item-btn') || e.target.closest('.item-name[contenteditable="true"]')) return;
                folderEl.classList.toggle('expanded');
                this.updateCollapseButtonState();
            });

            // Rename button
            header.querySelector('.rename-item-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.renameItem(folder.id, 'folder', header.querySelector('.item-name'));
            });

            // Delete button
            header.querySelector('.delete-item-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.showConfirmModal(
                    'Supprimer le dossier ?',
                    'Voulez-vous vraiment supprimer ce dossier et tout son contenu ?',
                    () => this.deleteItem(folder.id, 'folder')
                );
            });

            // Drag events
            this.setupDragEvents(folderEl, 'folder');

            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-children';
            
            folderEl.appendChild(header);
            folderEl.appendChild(childrenContainer);
            container.appendChild(folderEl);

            // Recursively render children
            this.renderFolderContent(folder.id, childrenContainer);
        });

        // Render Files
        files.forEach(file => {
            const fileEl = document.createElement('div');
            fileEl.className = 'tree-item file';
            fileEl.dataset.id = file.id;
            fileEl.draggable = true;
            
            const header = document.createElement('div');
            header.className = 'tree-item-header';
            header.innerHTML = `
                <div class="item-content">
                    <i class="fas fa-file-alt"></i> 
                    <span class="item-name" contenteditable="false">${file.name}</span>
                </div>
                <div class="item-actions">
                    <button class="rename-item-btn" title="Renommer"><i class="fas fa-pen"></i></button>
                    <button class="delete-item-btn" title="Supprimer"><i class="fas fa-times"></i></button>
                </div>
            `;
            
            header.addEventListener('click', (e) => {
                e.stopPropagation();
                if (e.target.closest('.delete-item-btn') || e.target.closest('.rename-item-btn') || e.target.closest('.item-name[contenteditable="true"]')) return;
                this.loadFile(file.id);
            });

            // Rename button
            header.querySelector('.rename-item-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.renameItem(file.id, 'file', header.querySelector('.item-name'));
            });

            // Delete button
            header.querySelector('.delete-item-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.showConfirmModal(
                    'Supprimer le fichier ?',
                    'Voulez-vous vraiment supprimer ce fichier ?',
                    () => this.deleteItem(file.id, 'file')
                );
            });

            // Drag events
            this.setupDragEvents(fileEl, 'file');

            fileEl.appendChild(header);
            container.appendChild(fileEl);
        });
    }

    setupDragEvents(element, type) {
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                id: element.dataset.id,
                type: type
            }));
            e.stopPropagation();
        });

        if (type === 'folder') {
            element.addEventListener('dragover', (e) => {
                e.preventDefault();
                element.classList.add('drag-over');
                e.stopPropagation();
            });

            element.addEventListener('dragleave', (e) => {
                element.classList.remove('drag-over');
                e.stopPropagation();
            });

            element.addEventListener('drop', async (e) => {
                e.preventDefault();
                element.classList.remove('drag-over');
                e.stopPropagation();
                
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                const targetFolderId = element.dataset.id;

                if (data.id === targetFolderId) return; // Can't drop into self

                await this.moveItem(data.id, data.type, targetFolderId);
                this.renderFileTree();
            });
        }
    }

    async moveItem(itemId, type, newParentId) {
        const storeName = type === 'folder' ? 'folders' : 'files';
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const getRequest = store.get(itemId);
            getRequest.onsuccess = () => {
                const item = getRequest.result;
                item.parentId = newParentId;
                store.put(item);
                resolve();
            };
            getRequest.onerror = reject;
        });
    }

    renameItem(id, type, nameElement) {
        const currentName = nameElement.textContent;
        nameElement.contentEditable = true;
        nameElement.focus();
        
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(nameElement);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        const save = async () => {
            nameElement.contentEditable = false;
            const newName = nameElement.textContent.trim();
            
            if (newName && newName !== currentName) {
                const storeName = type === 'folder' ? 'folders' : 'files';
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const getRequest = store.get(id);
                getRequest.onsuccess = () => {
                    const item = getRequest.result;
                    item.name = newName;
                    store.put(item);
                    
                    // If it's the current file, update header too
                    if (type === 'file') {
                        if (this.currentFileId === id) {
                            const noteNameEl = document.getElementById('currentNoteName');
                            if (noteNameEl && noteNameEl !== nameElement) noteNameEl.textContent = newName;
                        }
                        
                        // Also update sidebar item if we renamed from header
                        const sidebarItem = document.querySelector(`.tree-item.file[data-id="${id}"] .item-name`);
                        if (sidebarItem && sidebarItem !== nameElement) sidebarItem.textContent = newName;
                    }
                };
            } else {
                nameElement.textContent = currentName;
            }
        };

        nameElement.addEventListener('blur', save, { once: true });
        nameElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                nameElement.blur();
            }
        });
    }

    async createNewFolder() {
        this.showInputModal("Nouveau dossier", "Nom du dossier", async (name) => {
            if (!name) return;
            const id = 'folder_' + Date.now();
            const folder = { id, parentId: 'root', name };

            const transaction = this.db.transaction(['folders'], 'readwrite');
            const store = transaction.objectStore('folders');
            store.add(folder);

            transaction.oncomplete = () => this.renderFileTree();
        });
    }

    async createNewFile() {
        this.showInputModal("Nouvelle note", "Nom de la note", async (name) => {
            if (!name) return;
            const id = 'file_' + Date.now();
            const file = { 
                id, 
                parentId: 'root', 
                name, 
                content: '', 
                lastModified: Date.now() 
            };

            const transaction = this.db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            store.add(file);

            transaction.oncomplete = () => {
                this.renderFileTree();
                this.loadFile(id);
            };
        });
    }

    async loadFile(fileId) {
        const transaction = this.db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const request = store.get(fileId);

        request.onsuccess = () => {
            const file = request.result;
            this.currentFileId = file.id;
            this.editor.innerHTML = file.content;
            
            // Update note name display
            const noteNameEl = document.getElementById('currentNoteName');
            if (noteNameEl) {
                noteNameEl.textContent = file.name;
            }
            
            // Update active state in tree
            document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('active'));
            const activeEl = document.querySelector(`.tree-item.file[data-id="${file.id}"]`);
            if (activeEl) activeEl.classList.add('active');
            
            this.updateEmptyState();
            // Wait for render then update opacity
            setTimeout(() => this.updateLogoOpacity(), 0);
        };
    }

    updateEmptyState() {
        if (this.currentFileId) {
            this.editor.style.display = 'block';
            if (this.emptyState) this.emptyState.style.display = 'none';
            document.querySelector('.editor-toolbar').style.display = 'flex';
        } else {
            this.editor.style.display = 'none';
            if (this.emptyState) this.emptyState.style.display = 'flex';
            document.querySelector('.editor-toolbar').style.display = 'none';
        }
    }

    showInputModal(title, placeholder, callback) {
        if (!this.modal) return;
        
        const titleEl = document.getElementById('modalTitle');
        const messageEl = document.getElementById('modalMessage');
        const inputEl = document.getElementById('modalInput');
        const confirmBtn = document.getElementById('modalConfirmBtn');
        
        titleEl.textContent = title;
        messageEl.style.display = 'none';
        inputEl.style.display = 'block';
        inputEl.value = '';
        inputEl.placeholder = placeholder;
        
        this.modal.style.display = 'flex';
        inputEl.focus();
        
        const handleConfirm = () => {
            const value = inputEl.value.trim();
            if (value) {
                callback(value);
                this.closeModal();
            }
        };
        
        // Remove old listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', handleConfirm);
    }

    showConfirmModal(title, message, callback) {
        if (!this.modal) return;
        
        const titleEl = document.getElementById('modalTitle');
        const messageEl = document.getElementById('modalMessage');
        const inputEl = document.getElementById('modalInput');
        const confirmBtn = document.getElementById('modalConfirmBtn');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        messageEl.style.display = 'block';
        inputEl.style.display = 'none';
        
        this.modal.style.display = 'flex';
        
        const handleConfirm = () => {
            callback();
            this.closeModal();
        };
        
        // Remove old listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', handleConfirm);
    }

    closeModal() {
        if (this.modal) this.modal.style.display = 'none';
    }

    showToast(message, actionText = null, actionCallback = null, type = 'info') {
        if (!this.toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>${message}</span>`;
        
        if (actionText && actionCallback) {
            const btn = document.createElement('button');
            btn.className = 'toast-action';
            btn.textContent = actionText;
            btn.addEventListener('click', () => {
                actionCallback();
                toast.remove();
            });
            toast.appendChild(btn);
        }
        
        this.toastContainer.appendChild(toast);
        
        // Auto remove after 5s
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideUp 0.3s ease reverse forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    updateLogoOpacity() {
        const branding = document.querySelector('.notes-branding');
        if (!branding) return;

        const scrollBottom = this.editor.scrollTop + this.editor.clientHeight;
        const scrollHeight = this.editor.scrollHeight;
        
        // If content is shorter than view, no overlap
        if (scrollHeight <= this.editor.clientHeight) {
            branding.classList.remove('dimmed');
            return;
        }

        // If we are not at the bottom (with buffer for padding), text is likely under logo
        // We assume padding-bottom is around 100px
        if (scrollHeight - scrollBottom > 80) {
            branding.classList.add('dimmed');
        } else {
            // We are at the bottom (in the padding area)
            branding.classList.remove('dimmed');
        }
    }

    async saveCurrentFile() {
        if (!this.currentFileId) return;

        // Check if editor is empty and restore placeholder
        const isEmpty = !this.editor.textContent.trim();
        const content = isEmpty ? '' : this.editor.innerHTML;
        
        const transaction = this.db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        
        const getRequest = store.get(this.currentFileId);
        getRequest.onsuccess = () => {
            const file = getRequest.result;
            file.content = content;
            file.lastModified = Date.now();
            store.put(file);
        };
    }

    async deleteItem(itemId, type) {
        // Fetch item data first for Undo
        const storeName = type === 'folder' ? 'folders' : 'files';
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(itemId);

        request.onsuccess = async () => {
            const item = request.result;
            let children = [];
            
            if (type === 'folder') {
                // Get all children recursively for undo
                children = await this.getFolderContentsRecursive(itemId);
            }

            // Perform delete
            const delTransaction = this.db.transaction(['folders', 'files'], 'readwrite');
            
            if (type === 'folder') {
                delTransaction.objectStore('folders').delete(itemId);
                // Delete children
                children.folders.forEach(f => delTransaction.objectStore('folders').delete(f.id));
                children.files.forEach(f => delTransaction.objectStore('files').delete(f.id));
            } else {
                delTransaction.objectStore('files').delete(itemId);
            }

            delTransaction.oncomplete = () => {
                if (this.currentFileId === itemId) {
                    this.currentFileId = null;
                    this.editor.innerHTML = '';
                    this.updateEmptyState();
                }
                this.renderFileTree();
                
                // Add to undo stack
                this.undoStack.push({
                    action: 'delete',
                    type: type,
                    item: item,
                    children: children
                });
                this.updateUndoButton();
                
                // Show Toast
                this.showToast(
                    `${type === 'folder' ? 'Dossier' : 'Fichier'} supprimé`, 
                    "Annuler", 
                    () => this.undoLastAction()
                );
            };
        };
    }

    async undoLastAction() {
        const action = this.undoStack.pop();
        this.updateUndoButton();
        
        if (!action) return;

        if (action.action === 'delete') {
            await this.undoDelete(action.item, action.type, action.children);
        }
    }

    updateUndoButton() {
        if (this.undoBtn) {
            if (this.undoStack.length > 0) {
                this.undoBtn.style.display = 'block';
            } else {
                this.undoBtn.style.display = 'none';
            }
        }
    }

    async getFolderContentsRecursive(folderId) {
        const folders = await this.getFolders(folderId);
        const files = await this.getFiles(folderId);
        
        let allFolders = [...folders];
        let allFiles = [...files];

        for (const folder of folders) {
            const childContents = await this.getFolderContentsRecursive(folder.id);
            allFolders = allFolders.concat(childContents.folders);
            allFiles = allFiles.concat(childContents.files);
        }

        return { folders: allFolders, files: allFiles };
    }

    async undoDelete(item, type, children) {
        const transaction = this.db.transaction(['folders', 'files'], 'readwrite');
        
        if (type === 'folder') {
            transaction.objectStore('folders').add(item);
            children.folders.forEach(f => transaction.objectStore('folders').add(f));
            children.files.forEach(f => transaction.objectStore('files').add(f));
        } else {
            transaction.objectStore('files').add(item);
        }

        transaction.oncomplete = () => {
            this.renderFileTree();
            this.showToast("Restauration effectuée");
        };
    }

    updateToolbarState() {
        if (!this.isOpen || document.activeElement !== this.editor) return;

        const commands = ['bold', 'italic', 'strikeThrough'];
        commands.forEach(cmd => {
            const isActive = document.queryCommandState(cmd);
            const btn = document.querySelector(`.format-btn[data-command="${cmd}"]`);
            if (btn) {
                if (isActive) btn.classList.add('active');
                else btn.classList.remove('active');
            }
        });
    }

    handleKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            
            const selection = window.getSelection();
            if (!selection.rangeCount) return;
            
            const range = selection.getRangeAt(0);
            let block = this.getParentBlock(range.startContainer);
            
            // If no block found, create one
            if (!block || block === this.editor) {
                // Wrap current content in a div
                const div = document.createElement('div');
                const node = range.startContainer;
                
                if (node === this.editor) {
                    // Move all content to the div
                    while (this.editor.firstChild) {
                        div.appendChild(this.editor.firstChild);
                    }
                    this.editor.appendChild(div);
                } else if (node.nodeType === Node.TEXT_NODE) {
                    const parent = node.parentNode;
                    if (parent === this.editor) {
                        parent.insertBefore(div, node);
                        div.appendChild(node);
                    }
                }
                
                block = div;
            }
            
            const text = block.textContent.trim();
            
            // Check for # Title
            if (text.startsWith('# ') && text.length > 2) {
                const content = text.substring(2).trim();
                this.cleanMarkersFromBlock(block);
                block.textContent = content;
                
                const r = document.createRange();
                r.selectNodeContents(block);
                selection.removeAllRanges();
                selection.addRange(r);
                document.execCommand('formatBlock', false, 'h1');
                
                this.insertParagraphAfter();
                return;
            }
            
            // Check for ## Title
            if (text.startsWith('## ') && text.length > 3) {
                const content = text.substring(3).trim();
                this.cleanMarkersFromBlock(block);
                block.textContent = content;
                
                const r = document.createRange();
                r.selectNodeContents(block);
                selection.removeAllRanges();
                selection.addRange(r);
                document.execCommand('formatBlock', false, 'h2');
                
                this.insertParagraphAfter();
                return;
            }
            
            // For normal blocks, clean markers first
            this.cleanMarkersFromBlock(block);
            
            // Create new paragraph
            const newP = document.createElement('div');
            newP.innerHTML = '<br>';
            
            if (block.nextSibling) {
                this.editor.insertBefore(newP, block.nextSibling);
            } else {
                this.editor.appendChild(newP);
            }
            
            // Move cursor to new paragraph
            const newRange = document.createRange();
            newRange.setStart(newP, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            
            this.scrollToCursor();
        }
    }
    
    cleanMarkersFromNode(textNode) {
        if (textNode.nodeType !== Node.TEXT_NODE) return;
        
        let text = textNode.textContent;
        
        // Process bold **text**
        const boldRegex = /\*\*(.+?)\*\*/g;
        if (boldRegex.test(text)) {
            const parent = textNode.parentNode;
            const fragment = document.createDocumentFragment();
            
            let lastIndex = 0;
            text = textNode.textContent; // Reset
            boldRegex.lastIndex = 0;
            let match;
            
            while ((match = boldRegex.exec(text)) !== null) {
                // Add text before match
                if (match.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                }
                // Add bold element
                const b = document.createElement('b');
                b.textContent = match[1];
                fragment.appendChild(b);
                lastIndex = match.index + match[0].length;
            }
            
            // Add remaining text
            if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            }
            
            parent.replaceChild(fragment, textNode);
            return;
        }
        
        // Process italic __text__
        const italicRegex = /__(.+?)__/g;
        if (italicRegex.test(text)) {
            const parent = textNode.parentNode;
            const fragment = document.createDocumentFragment();
            
            let lastIndex = 0;
            text = textNode.textContent;
            italicRegex.lastIndex = 0;
            let match;
            
            while ((match = italicRegex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                }
                const i = document.createElement('i');
                i.textContent = match[1];
                fragment.appendChild(i);
                lastIndex = match.index + match[0].length;
            }
            
            if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            }
            
            parent.replaceChild(fragment, textNode);
            return;
        }
        
        // Process strikethrough ~~text~~
        const strikeRegex = /~~(.+?)~~/g;
        if (strikeRegex.test(text)) {
            const parent = textNode.parentNode;
            const fragment = document.createDocumentFragment();
            
            let lastIndex = 0;
            text = textNode.textContent;
            strikeRegex.lastIndex = 0;
            let match;
            
            while ((match = strikeRegex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                }
                const s = document.createElement('s');
                s.textContent = match[1];
                fragment.appendChild(s);
                lastIndex = match.index + match[0].length;
            }
            
            if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            }
            
            parent.replaceChild(fragment, textNode);
        }
    }
    
    cleanMarkersFromBlock(block) {
        // Process each type of marker
        const markers = [
            { pattern: /\*\*(.+?)\*\*/g, style: 'bold' },
            { pattern: /__(.+?)__/g, style: 'italic' },
            { pattern: /~~(.+?)~~/g, style: 'strikeThrough' }
        ];

        // Get HTML content
        let html = block.innerHTML;
        
        markers.forEach(({ pattern, style }) => {
            // Find all matches
            const matches = [];
            let match;
            const regex = new RegExp(pattern);
            
            // Reset lastIndex for global regex
            pattern.lastIndex = 0;
            
            while ((match = pattern.exec(html)) !== null) {
                matches.push({
                    full: match[0],
                    content: match[1],
                    index: match.index
                });
            }
            
            // Replace from end to start to preserve indices
            for (let i = matches.length - 1; i >= 0; i--) {
                const m = matches[i];
                const tag = style === 'bold' ? 'b' : (style === 'italic' ? 'i' : 's');
                const replacement = `<${tag}>${m.content}</${tag}>`;
                html = html.substring(0, m.index) + replacement + html.substring(m.index + m.full.length);
            }
        });
        
        block.innerHTML = html;
    }

    insertParagraphAfter() {
        // Insert a new paragraph after current block and move cursor there
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const block = this.getParentBlock(range.startContainer);
        
        const p = document.createElement('div');
        p.innerHTML = '<br>';
        
        if (block.nextSibling) {
            block.parentNode.insertBefore(p, block.nextSibling);
        } else {
            block.parentNode.appendChild(p);
        }
        
        const newRange = document.createRange();
        newRange.setStart(p, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
    }

    handleKeyUp(e) {
        // Handle empty line --- replacement
        if (e.key === '-') {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;
            const range = selection.getRangeAt(0);
            const anchor = selection.anchorNode;
            
            // Check if text content is '---'
            if (anchor && anchor.textContent && anchor.textContent.trim() === '---') {
                const block = this.getParentBlock(anchor);
                
                // If no block (first line), handle differently
                if (!block || block === this.editor) {
                    // We're at editor level
                    const textNode = anchor.nodeType === Node.TEXT_NODE ? anchor : anchor.childNodes[0];
                    if (textNode && textNode.textContent.trim() === '---') {
                        const hr = document.createElement('hr');
                        const p = document.createElement('div');
                        p.innerHTML = '<br>';
                        
                        if (textNode.parentNode === this.editor) {
                            this.editor.replaceChild(hr, textNode);
                            this.editor.appendChild(p);
                        } else {
                            textNode.parentNode.replaceWith(hr);
                            hr.parentNode.insertBefore(p, hr.nextSibling);
                        }
                        
                        const newRange = document.createRange();
                        newRange.setStart(p, 0);
                        newRange.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                    }
                } else {
                    // Replace block with HR
                    const hr = document.createElement('hr');
                    block.parentNode.replaceChild(hr, block);
                    // Insert a new paragraph after
                    const p = document.createElement('div');
                    p.innerHTML = '<br>';
                    hr.parentNode.insertBefore(p, hr.nextSibling);
                    // Move cursor to p
                    const newRange = document.createRange();
                    newRange.setStart(p, 0);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                }
            }
        }
    }

    handleInput(e) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        let node = range.startContainer;
        let cursor = range.startOffset;

        // Ensure we are working with a text node
        if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.childNodes.length > 0 && cursor > 0) {
                const child = node.childNodes[cursor - 1];
                if (child.nodeType === Node.TEXT_NODE) {
                    node = child;
                    cursor = child.textContent.length;
                }
            }
        }
        
        if (node.nodeType !== Node.TEXT_NODE) return;

        const text = node.textContent;
        const char = e.data;

        // Arrow replacements
        if (char === '>') {
            if (cursor >= 3 && text.substring(cursor - 3, cursor) === '-->') {
                this.replaceText(node, cursor - 3, cursor, '⟶');
                return;
            }
        }
        if (char === '-' || char === '>') {
            if (cursor >= 2 && text.substring(cursor - 2, cursor) === '->') {
                if (!(cursor < text.length && text[cursor] === '>')) {
                    this.replaceText(node, cursor - 2, cursor, '→');
                    return;
                }
            }
        }

        // Blockquote: detect "> " at line start
        if (char === ' ') {
            // Check if we just typed space after >
            if (cursor >= 2 && text.substring(0, cursor).trim() === '>') {
                // Get the block containing this text
                let block = this.getParentBlock(node);
                
                if (!block || block === this.editor) {
                    // Wrap in a div first
                    const div = document.createElement('div');
                    const parent = node.parentNode;
                    if (parent === this.editor) {
                        parent.insertBefore(div, node);
                        div.appendChild(node);
                        block = div;
                    }
                }
                
                if (block) {
                    // Create blockquote manually to avoid execCommand issues
                    const blockquote = document.createElement('blockquote');
                    
                    // Remove the "> " from text
                    node.textContent = text.substring(2);
                    
                    // Move all content from block to blockquote
                    while (block.firstChild) {
                        blockquote.appendChild(block.firstChild);
                    }
                    
                    // Replace block with blockquote
                    block.parentNode.replaceChild(blockquote, block);
                    
                    // Place cursor at start
                    const newRange = document.createRange();
                    newRange.setStart(node, 0);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                }
                return;
            }
        }

        // Inline Formatting: just auto-close markers
        if (char === '*' || char === '_' || char === '~') {
            const marker = char + char;
            
            // Check if we just typed the second char of the marker
            if (cursor >= 2 && text.substring(cursor - 2, cursor) === marker) {
                // Look backwards for opening marker
                const textBefore = text.substring(0, cursor - 2);
                
                // Count occurrences of marker before cursor
                // If even (0, 2, 4...), we are starting a new pair -> Auto-close
                // If odd (1, 3...), we are closing an existing pair -> Do nothing
                const matches = textBefore.split(marker).length - 1;
                
                if (matches % 2 === 0) {
                    // Even number of markers before - auto-close
                    this.insertTextAtCursor(marker);
                    
                    // Move cursor back between markers
                    setTimeout(() => {
                        const sel = window.getSelection();
                        if (sel.rangeCount) {
                            const r = sel.getRangeAt(0);
                            if (r.startContainer.nodeType === Node.TEXT_NODE) {
                                const newRange = document.createRange();
                                newRange.setStart(r.startContainer, r.startOffset - 2);
                                newRange.collapse(true);
                                sel.removeAllRanges();
                                sel.addRange(newRange);
                            }
                        }
                    }, 10);
                }
                // If odd, do nothing (let user finish typing the closing marker)
            }
        }

        this.scrollToCursor();
    }

    scrollToCursor() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        // Use a small timeout to allow layout to update
        setTimeout(() => {
            try {
                const rect = range.getBoundingClientRect();
                const editorRect = this.editor.getBoundingClientRect();
                
                // Check if cursor is below the visible area or close to bottom
                // We add a buffer of 40px
                if (rect.bottom > editorRect.bottom - 40) {
                    const scrollAmount = rect.bottom - editorRect.bottom + 60;
                    this.editor.scrollBy({ top: scrollAmount, behavior: 'smooth' });
                }
                // Also check if cursor is above visible area
                else if (rect.top < editorRect.top + 40) {
                    const scrollAmount = rect.top - editorRect.top - 60;
                    this.editor.scrollBy({ top: scrollAmount, behavior: 'smooth' });
                }
            } catch (e) {
                // Ignore errors if range is invalid
            }
        }, 0);
    }

    replaceText(textNode, start, end, replacement) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(textNode, start);
        range.setEnd(textNode, end);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('insertText', false, replacement);
    }

    applyBlockFormat(format, textNode, charsToRemove) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, charsToRemove);
        selection.removeAllRanges();
        selection.addRange(range);
        
        document.execCommand('delete');
        document.execCommand('formatBlock', false, format);
    }

    insertTextAtCursor(text) {
        document.execCommand('insertText', false, text);
    }

    getParentBlock(node) {
        while (node && node !== this.editor) {
            if (['DIV', 'P', 'H1', 'H2', 'BLOCKQUOTE', 'LI'].includes(node.tagName)) {
                return node;
            }
            node = node.parentNode;
        }
        return null;
    }

    downloadCurrentNoteAsMarkdown() {
        if (!this.currentFileId) return;

        const transaction = this.db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const request = store.get(this.currentFileId);

        request.onsuccess = () => {
            const file = request.result;
            const markdown = this.convertHtmlToMarkdown(this.editor.innerHTML);
            
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${file.name}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
    }

    convertHtmlToMarkdown(html) {
        // Create a temporary element to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;

        let markdown = '';

        // Helper to process nodes recursively
        const processNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) return '';

            let content = '';
            node.childNodes.forEach(child => {
                content += processNode(child);
            });

            switch (node.tagName) {
                case 'H1':
                    return `# ${content}\n\n`;
                case 'H2':
                    return `## ${content}\n\n`;
                case 'B':
                case 'STRONG':
                    return `**${content}**`;
                case 'I':
                case 'EM':
                    return `__${content}__`;
                case 'S':
                case 'STRIKE':
                    return `~~${content}~~`;
                case 'BLOCKQUOTE':
                    return `> ${content}\n\n`;
                case 'DIV':
                case 'P':
                    // Handle empty lines
                    if (content.trim() === '' && node.querySelector('br')) {
                        return '\n';
                    }
                    return `${content}\n`;
                case 'BR':
                    return '\n';
                case 'HR':
                    return '---\n\n';
                default:
                    return content;
            }
        };

        // Process all top-level nodes
        temp.childNodes.forEach(child => {
            markdown += processNode(child);
        });

        // Clean up multiple newlines
        return markdown.replace(/\n{3,}/g, '\n\n').trim();
    }

    updateCollapseButtonState() {
        const collapseBtn = document.getElementById('collapseTreeBtn');
        if (!collapseBtn) return;
        
        const expandedItems = document.querySelectorAll('.tree-item.expanded');
        const icon = collapseBtn.querySelector('i');
        
        if (expandedItems.length > 0) {
            icon.className = 'fas fa-minus';
            collapseBtn.title = "Tout réduire";
        } else {
            icon.className = 'fas fa-plus';
            collapseBtn.title = "Tout déployer";
        }
    }
}

// Export globally
window.NotesModule = new NotesModule();
