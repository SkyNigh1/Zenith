// ===== ANIMATION MANAGER =====
// Gestion centralisée des animations de fond (Galaxy, Medusa, etc.)

class AnimationManager {
    constructor() {
        this.currentAnimation = null;
        this.currentType = 'galaxy'; // Type d'animation par défaut
        this.canvas = null;
        this.isInitialized = false;
        
        // Configuration des animations disponibles
        this.animations = {
            galaxy: {
                name: 'Galaxy',
                class: window.GalaxyAnimation,
                script: './animations/galaxy/galaxy.js'
            },
            medusa: {
                name: 'Medusa',
                class: window.MedusaAnimation,
                script: './animations/medusa/medusa.js'
            }
        };
    }
    
    async init(canvasElement, animationType = 'galaxy') {
        this.canvas = canvasElement;
        this.currentType = animationType;
        
        // Charger et initialiser l'animation
        await this.loadAnimation(animationType);
        
        this.isInitialized = true;
        return this.currentAnimation;
    }
    
    async loadAnimation(type) {
        // Handle Custom Background
        if (type === 'custom') {
            this.loadCustomBackground();
            this.currentType = type;
            return;
        }

        // Handle Unsplash types
        if (type.startsWith('unsplash-')) {
            this.loadUnsplashBackground(type);
            this.currentType = type;
            return;
        }

        // Restore canvas if hidden
        if (this.canvas) {
            this.canvas.style.display = 'block';
        }
        const bgImage = document.getElementById('backgroundImage');
        if (bgImage) {
            bgImage.style.display = 'none';
        }

        const animationConfig = this.animations[type];
        
        if (!animationConfig) {
            console.error(`Animation type "${type}" not found`);
            return;
        }
        
        // Charger le script si la classe n'est pas disponible
        if (!animationConfig.class) {
            await this.loadScript(animationConfig.script);
            animationConfig.class = window[type === 'galaxy' ? 'GalaxyAnimation' : 'MedusaAnimation'];
        }
        
        // Nettoyer l'animation précédente
        if (this.currentAnimation) {
            console.log('Disposing current animation:', this.currentType);
            this.currentAnimation.dispose();
            this.currentAnimation = null;
            
            // Wait a bit for cleanup
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Recréer le canvas pour éviter les conflits
        const oldCanvas = this.canvas;
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'galaxyCanvas';
        
        // Check if oldCanvas still has a parent (it might have been removed during dispose)
        if (oldCanvas && oldCanvas.parentNode) {
            oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);
        } else {
            // If canvas was removed, find where to insert it
            const container = document.body;
            container.insertBefore(newCanvas, container.firstChild);
        }
        
        this.canvas = newCanvas;
        
        console.log('Creating new animation:', type);
        
        // Créer la nouvelle animation
        const AnimationClass = animationConfig.class;
        this.currentAnimation = new AnimationClass(this.canvas);
        
        // Initialiser l'animation
        await this.currentAnimation.init();
        
        this.currentType = type;
        
        console.log('Animation loaded successfully:', type);
        
        return this.currentAnimation;
    }

    loadCustomBackground() {
        // Dispose current animation if exists
        if (this.currentAnimation) {
            this.currentAnimation.dispose();
            this.currentAnimation = null;
        }

        // Hide canvas
        if (this.canvas) {
            this.canvas.style.display = 'none';
        }

        // Create or get background image element
        let bgImage = document.getElementById('backgroundImage');
        if (!bgImage) {
            bgImage = document.createElement('div');
            bgImage.id = 'backgroundImage';
            bgImage.style.position = 'fixed';
            bgImage.style.top = '-20px';
            bgImage.style.left = '-20px';
            bgImage.style.width = 'calc(100% + 40px)';
            bgImage.style.height = 'calc(100% + 40px)';
            bgImage.style.zIndex = '-1';
            bgImage.style.backgroundSize = 'cover';
            bgImage.style.backgroundPosition = 'center';
            bgImage.style.transition = 'background-image 0.5s ease-in-out, transform 0.15s cubic-bezier(0.33, 1, 0.68, 1)';
            bgImage.style.willChange = 'transform';
            document.body.insertBefore(bgImage, document.body.firstChild);
        }
        bgImage.style.display = 'block';
        
        // Enable parallax effect
        this.enableParallax(bgImage);

        // Try to load from IndexedDB first
        const dbName = 'ZenithCustomBgDB';
        const storeName = 'backgrounds';
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
            }
        };
        request.onsuccess = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                // DB exists but store doesn't, fallback to localStorage
                const customBg = localStorage.getItem('zenithCustomBg');
                if (customBg) {
                    bgImage.style.backgroundImage = `url('${customBg}')`;
                } else {
                    bgImage.style.backgroundColor = '#1a1a2e';
                }
                return;
            }
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const getRequest = store.get('customBg');
            getRequest.onsuccess = function(e) {
                const file = e.target.result;
                if (file) {
                    // Utiliser URL.createObjectURL pour éviter de garder le base64 en mémoire
                    const blobUrl = URL.createObjectURL(file);
                    bgImage.style.backgroundImage = `url('${blobUrl}')`;
                    // Supprimer l'ancienne image du localStorage si elle existe
                    localStorage.removeItem('zenithCustomBg');
                } else {
                    // Fallback to localStorage if nothing in IndexedDB
                    const customBg = localStorage.getItem('zenithCustomBg');
                    if (customBg) {
                        bgImage.style.backgroundImage = `url('${customBg}')`;
                    } else {
                        bgImage.style.backgroundColor = '#1a1a2e';
                    }
                }
            };
            getRequest.onerror = function() {
                // Fallback to localStorage if error
                const customBg = localStorage.getItem('zenithCustomBg');
                if (customBg) {
                    bgImage.style.backgroundImage = `url('${customBg}')`;
                } else {
                    bgImage.style.backgroundColor = '#1a1a2e';
                }
            };
        };
        request.onerror = function() {
            // Fallback to localStorage if error
            const customBg = localStorage.getItem('zenithCustomBg');
            if (customBg) {
                bgImage.style.backgroundImage = `url('${customBg}')`;
            } else {
                bgImage.style.backgroundColor = '#1a1a2e';
            }
        };
        console.log('Loading custom background');
    }

    loadUnsplashBackground(type) {
        // Dispose current animation if exists
        if (this.currentAnimation) {
            console.log('Disposing current animation for background image');
            this.currentAnimation.dispose();
            this.currentAnimation = null;
        }

        // Hide canvas
        if (this.canvas) {
            this.canvas.style.display = 'none';
        }

        // Create or get background image element
        let bgImage = document.getElementById('backgroundImage');
        if (!bgImage) {
            bgImage = document.createElement('div');
            bgImage.id = 'backgroundImage';
            bgImage.style.position = 'fixed';
            bgImage.style.top = '-20px';
            bgImage.style.left = '-20px';
            bgImage.style.width = 'calc(100% + 40px)';
            bgImage.style.height = 'calc(100% + 40px)';
            bgImage.style.zIndex = '-1';
            bgImage.style.backgroundSize = 'cover';
            bgImage.style.backgroundPosition = 'center';
            bgImage.style.transition = 'background-image 0.5s ease-in-out, transform 0.15s cubic-bezier(0.33, 1, 0.68, 1)';
            bgImage.style.willChange = 'transform';
            document.body.insertBefore(bgImage, document.body.firstChild);
        }
        bgImage.style.display = 'block';
        
        // Enable parallax effect
        this.enableParallax(bgImage);

        const collections = {
            'unsplash-abstract': [
                '1732979887681-6d8d139d84be', 
                '1736532496900-af334a4bce1c',    
                '1733534843143-a4df42fe8bfe', 
                '1758843417734-f4710410e185',
                '1668450433152-e56d7e8fe4ee',
                '1668455199701-284281127a87',
                '1650473395434-8674d953ef2f',
                '1699030665523-e9c8a366b9a3',
                '1637825891028-564f672aa42c',
                '1667475593802-8d4e117a042f',
                '1647108188039-4d5048f19a58',
                '1675981004400-0b9351126ed5',
                '1667202374078-1683eda6b0b6'
            ],
            'unsplash-landscape': [
                '1753938204221-fb37da50aefc', 
                '1505832018823-50331d70d237', 
                '1755371034010-51c25321312d',
                '1734760418281-62c3f2279296', 
                '1736230990003-a98eea26ea1f',
                '1508201890890-b6dec8b3fb2a',
                '1518098268026-4e89f1a2cd8e',
                '1509565840034-3c385bbe6451',
                '1547471080-7cc2caa01a7e',
                '1584148721201-b6432e0d5106',
                '1498550744921-75f79806b8a7',
                '1496614932623-0a3a9743552e',
                '1511497584788-876760111969',
                '1422493757035-1e5e03968f95',
                '1534106474077-f9e9c6f5a47c',
                '1535747790212-30c585ab4867'
            ],
            'unsplash-snow': [
                '1606313695934-9f1e08d020d5', 
                '1623057896740-99f8c2f090fc', 
                '1463288889890-a56b2853c40f', 
                '1646764065835-917bed6cc0b8',    
                '1684971550488-6bac88724eb3'  
            ]
        };

        const ids = collections[type] || collections['unsplash-abstract'];
        const randomId = ids[Math.floor(Math.random() * ids.length)];
        
        // Using Unsplash Source directly with ID for best performance and quality
        const url = `https://images.unsplash.com/photo-${randomId}?q=80&w=1920&auto=format&fit=crop`;
        
        // Preload image to avoid black screen
        const img = new Image();
        img.onload = () => {
            bgImage.style.backgroundImage = `url('${url}')`;
        };
        img.onerror = () => {
            console.error('Failed to load background image');
        };
        img.src = url;
        
        console.log('Loading background for:', type);
    }
    
    async switchAnimation(newType) {
        if (newType === this.currentType) {
            return this.currentAnimation;
        }
        
        // Show loader
        this.showLoader();
        
        try {
            const result = await this.loadAnimation(newType);
            return result;
        } finally {
            // Hide loader after a short delay
            setTimeout(() => this.hideLoader(), 300);
        }
    }
    
    showLoader() {
        const loader = document.getElementById('animationLoader');
        if (loader) {
            loader.classList.add('active');
        }
    }
    
    hideLoader() {
        const loader = document.getElementById('animationLoader');
        if (loader) {
            loader.classList.remove('active');
        }
    }
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Vérifier si le script est déjà chargé
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    updateColors(color1, color2) {
        if (this.currentAnimation && this.currentAnimation.updateColors) {
            this.currentAnimation.updateColors(color1, color2);
        }
    }
    
    focusCamera() {
        if (this.currentAnimation && this.currentAnimation.focusCamera) {
            this.currentAnimation.focusCamera();
        }
    }
    
    unfocusCamera() {
        if (this.currentAnimation && this.currentAnimation.unfocusCamera) {
            this.currentAnimation.unfocusCamera();
        }
    }
    
    onResize() {
        if (this.currentAnimation && this.currentAnimation.onResize) {
            this.currentAnimation.onResize();
        }
    }
    
    getCurrentType() {
        return this.currentType;
    }
    
    getAvailableAnimations() {
        return Object.keys(this.animations).map(key => ({
            id: key,
            name: this.animations[key].name
        }));
    }
    
    enableParallax(element) {
        // Remove existing listener if any
        this.disableParallax();
        
        // Store current position for smooth interpolation
        this.parallaxTarget = { x: 0, y: 0 };
        this.parallaxCurrent = { x: 0, y: 0 };
        this.parallaxElement = element;
        
        // Mouse move handler
        this.parallaxMouseHandler = (e) => {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            // Calculate offset from center (-1 to 1)
            const offsetX = (e.clientX - centerX) / centerX;
            const offsetY = (e.clientY - centerY) / centerY;
            
            // Set target (max 10px movement - reduced for smoother feel)
            this.parallaxTarget.x = offsetX * 10;
            this.parallaxTarget.y = offsetY * 10;
        };
        
        // Animation loop for smooth interpolation
        this.parallaxAnimationFrame = null;
        const animate = () => {
            // Smooth interpolation (lerp) - lower value = slower/smoother
            const ease = 0.03;
            this.parallaxCurrent.x += (this.parallaxTarget.x - this.parallaxCurrent.x) * ease;
            this.parallaxCurrent.y += (this.parallaxTarget.y - this.parallaxCurrent.y) * ease;
            
            // Apply transform
            if (this.parallaxElement) {
                this.parallaxElement.style.transform = `translate(${this.parallaxCurrent.x}px, ${this.parallaxCurrent.y}px)`;
            }
            
            this.parallaxAnimationFrame = requestAnimationFrame(animate);
        };
        
        document.addEventListener('mousemove', this.parallaxMouseHandler);
        animate();
    }
    
    disableParallax() {
        if (this.parallaxMouseHandler) {
            document.removeEventListener('mousemove', this.parallaxMouseHandler);
            this.parallaxMouseHandler = null;
        }
        if (this.parallaxAnimationFrame) {
            cancelAnimationFrame(this.parallaxAnimationFrame);
            this.parallaxAnimationFrame = null;
        }
        if (this.parallaxElement) {
            this.parallaxElement.style.transform = '';
            this.parallaxElement = null;
        }
    }
}

// Export global
window.AnimationManager = AnimationManager;

