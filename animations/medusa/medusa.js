// ===== MEDUSA ANIMATION MODULE =====
// Animation de méduses originale adaptée pour Zenith

class MedusaAnimation {
    constructor(container) {
        this.container = container;
        this.mainScene = null;
        this.isInitialized = false;
        
        this.colors = {
            primary: '#ff6030',
            secondary: '#1b3984'
        };
        
        // Camera state for zoom animation
        this.cameraState = {
            initial: 250,    // Plus proche
            focused: 150,    // Encore plus proche en focus
            currentZ: 250,
            targetZ: 250,
            currentY: 100,   // Hauteur Y de base
            targetY: 100,
            initialY: 100,
            focusedY: 250    // Vue d'en haut (plongée)
        };
    }
    
    async init() {
        // Load required dependencies
        await this.loadDependencies();
        
        // Hide all UI elements from original Medusa
        this.hideOriginalUI();
        
        // Create DOM elements BEFORE initializing Medusa
        this.createMedusaDOM();
        
        // Initialize Medusa MainScene
        this.initMedusaScene();
        
        // Wait a bit for Medusa to fully initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Override camera controls
        this.setupCustomCamera();
        
        // Start animation
        this.startAnimation();
        
        this.isInitialized = true;
    }
    
    createMedusaDOM() {
        // Create ALL DOM elements that Medusa expects BEFORE initialization
        const container = document.createElement('div');
        container.id = 'container';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.zIndex = '1';
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'c';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        container.appendChild(canvas);
        
        // Create container-stats (required by Medusa)
        const containerStats = document.createElement('div');
        containerStats.id = 'container-stats';
        containerStats.className = 'stats-panel';
        containerStats.style.position = 'absolute';
        containerStats.style.display = 'none';
        
        // Add required elements inside container-stats
        const containerGraphs = document.createElement('div');
        containerGraphs.id = 'container-graphs';
        containerStats.appendChild(containerGraphs);
        
        const particleDl = document.createElement('dl');
        particleDl.innerHTML = '<dt>Particles</dt><dd id="particle-count"></dd>';
        containerStats.appendChild(particleDl);
        
        const constraintDl = document.createElement('dl');
        constraintDl.innerHTML = '<dt>Constraints</dt><dd id="constraint-count"></dd>';
        containerStats.appendChild(constraintDl);
        
        const forceDl = document.createElement('dl');
        forceDl.innerHTML = '<dt>Forces</dt><dd id="force-count"></dd>';
        containerStats.appendChild(forceDl);
        
        // Create container-controls (required by Medusa)
        const containerControls = document.createElement('div');
        containerControls.id = 'container-controls';
        containerControls.style.position = 'absolute';
        containerControls.style.display = 'none';
        
        // Add required buttons inside container-controls
        const buttons = [
            { id: 'toggle-info', label: 'About' },
            { id: 'toggle-dots', label: 'Particles' },
            { id: 'toggle-colors', label: 'Colors' },
            { id: 'toggle-audio', label: 'Audio' },
            { id: 'toggle-postfx', label: 'Post FX' },
            { id: 'toggle-sim', label: 'Run Sim' }
        ];
        
        buttons.forEach(btn => {
            const button = document.createElement('div');
            button.id = btn.id;
            button.className = 'controls-button';
            button.innerHTML = `<div class="label">${btn.label}</div>`;
            containerControls.appendChild(button);
        });
        
        // Add colors menu
        const menuColors = document.createElement('div');
        menuColors.id = 'menu-colors';
        menuColors.className = 'controls-menu';
        containerControls.appendChild(menuColors);
        
        // Add to body
        document.body.appendChild(containerStats);
        document.body.appendChild(containerControls);
        document.body.appendChild(container);
        
        // Store reference
        this.medusaContainer = container;
        this.medusaStats = containerStats;
        this.medusaControls = containerControls;
    }
    
    async loadDependencies() {
        // If Three.js is already loaded but from a different source (CDN vs local),
        // we need to clear it and reload Medusa's version
        const threeFromCDN = window.THREE && document.querySelector('script[src*="cdnjs.cloudflare.com"]');
        
        if (threeFromCDN) {
            console.log('Clearing CDN Three.js to load Medusa version...');
            // Remove CDN script
            const cdnScript = document.querySelector('script[src*="cdnjs.cloudflare.com/ajax/libs/three.js"]');
            if (cdnScript) {
                cdnScript.remove();
            }
            // Clear THREE global
            delete window.THREE;
        }
        
        const scripts = [
            { src: './animations/medusa/libs/three.min.js', check: () => window.THREE && window.THREE.REVISION === "128" },
            { src: './animations/medusa/libs/particulate.min.js', check: () => window.Particulate },
            { src: './animations/medusa/libs/noise.js', check: () => window.noise },
            { src: './animations/medusa/libs/handlebars.min.js', check: () => window.Handlebars },
            { src: './animations/medusa/libs/app.min.js', check: () => window.App }
        ];
        
        for (const script of scripts) {
            if (!script.check()) {
                console.log('Loading', script.src);
                await this.loadScript(script.src);
            } else {
                console.log('Already loaded:', script.src);
            }
        }
        
        // Set static URL for Medusa
        if (window.App) {
            window.App.STATIC_URL = './animations/medusa/libs/../';
        }
    }
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
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
    
    hideOriginalUI() {
        // Cache les éléments UI originaux de Medusa
        const style = document.createElement('style');
        style.textContent = `
            #container-controls,
            #container-stats,
            #info,
            #cover-info { display: none !important; }
        `;
        document.head.appendChild(style);
    }
    
    initMedusaScene() {
        if (!window.App || !window.App.MainScene) {
            console.error('Medusa App not loaded');
            return;
        }
        
        // Initialize Medusa MainScene (DOM elements already created)
        try {
            this.mainScene = window.App.MainScene.create();
            this.mainScene.usePostFx = true; // Enable post-processing effects
            this.mainScene.initItems();
            this.mainScene.initForces();
            
            // Wait for dust to be fully initialized
            setTimeout(() => {
                // Customize dust particles after initialization
                this.customizeDustParticles();
                
                // Customize background color
                this.customizeBackground();
            }, 500);
            
            // Replace our canvas with Medusa's canvas
            const medusaCanvas = this.mainScene.renderer.domElement;
            medusaCanvas.id = 'galaxyCanvas';
            this.container.parentNode.replaceChild(medusaCanvas, this.container);
            this.container = medusaCanvas;
            
        } catch (error) {
            console.error('Failed to initialize Medusa scene:', error);
            if (this.medusaContainer) {
                this.medusaContainer.remove();
            }
        }
    }
    
    setupCustomCamera() {
        if (!this.mainScene) {
            console.warn('MainScene not ready');
            return;
        }
        
        // Disable original controls
        if (this.mainScene.controls) {
            this.mainScene.controls.enabled = false;
            this.mainScene.controls.noRotate = true;
            this.mainScene.controls.noZoom = true;
            this.mainScene.controls.noPan = true;
        }
        
        // Completely disable mouse interactions on the canvas
        if (this.mainScene.renderer && this.mainScene.renderer.domElement) {
            const canvas = this.mainScene.renderer.domElement;
            canvas.style.pointerEvents = 'none';
        }
        
        // Disable mouse interactions to prevent errors
        if (this.mainScene.medusae) {
            // Override all mouse event handlers
            const noOp = () => {};
            this.mainScene.medusae.onMouseDown = noOp;
            this.mainScene.medusae.onMouseMove = noOp;
            this.mainScene.medusae.onMouseUp = noOp;
            
            // Disable selection
            if (this.mainScene.medusae.selected) {
                this.mainScene.medusae.selected = null;
            }
        }
        
        // Rotate the medusa scene 225 (to point down-right)
        if (this.mainScene.scene) {
            // Rotate 
            this.mainScene.scene.rotation.z = (245 * Math.PI) / 180;
            this.mainScene.scene.rotation.y = (-20 * Math.PI) / 180;
        }
        
        // Set fixed camera position
        const camera = this.mainScene.camera;
        const scene = this.mainScene.scene;
        
        if (!camera || !scene) {
            console.warn('Camera or scene not ready');
            return;
        }
        
        // Position camera at initial distance and height
        camera.position.set(0, this.cameraState.initialY, this.cameraState.initial);
        camera.lookAt(scene.position);
        
        // Start our own animation loop for camera updates
        this.startCameraLoop();
        
        console.log('Camera setup complete - zoom should work now');
    }
    
    startCameraLoop() {
        const updateLoop = () => {
            if (this.isInitialized && this.mainScene && this.mainScene.camera) {
                this.updateCustomCamera();
            }
            this.cameraLoopId = requestAnimationFrame(updateLoop);
        };
        updateLoop();
    }
    
    updateCustomCamera() {
        if (!this.mainScene || !this.mainScene.camera) return;
        
        // Smooth camera movement
        const lerpFactor = 0.05;
        this.cameraState.currentZ += (this.cameraState.targetZ - this.cameraState.currentZ) * lerpFactor;
        this.cameraState.currentY += (this.cameraState.targetY - this.cameraState.currentY) * lerpFactor;
        
        const camera = this.mainScene.camera;
        
        // Move camera in Z (distance) and Y (height for contre-plongée)
        camera.position.set(0, this.cameraState.currentY, this.cameraState.currentZ);
        camera.lookAt(this.mainScene.scene.position);
        
        
    }
    
    startAnimation() {
        if (!this.mainScene) return;
        
        // Start the Medusa animation loop
        this.mainScene.loop.start();
    }
    
    updateColors(primaryColor, secondaryColor) {
        if (!this.mainScene || !this.mainScene.medusae) return;
        
        this.colors.primary = primaryColor;
        this.colors.secondary = secondaryColor;
        
        // Update ALL Medusa colors (replace all colors with just 2)
        const medusae = this.mainScene.medusae;
        if (medusae.colors && medusae.colors.length > 0) {
            // Replace all colors with our 2 colors alternating
            medusae.colors.forEach((colorObj, index) => {
                const color = index % 2 === 0 ? primaryColor : secondaryColor;
                colorObj.uniform.value.setStyle(color);
            });
        }
        
        // Update dust particles and background
        this.customizeDustParticles();
        this.customizeBackground();
    }
    
    customizeDustParticles() {
        if (!this.mainScene || !this.mainScene.dust) {
            console.log('Dust not available yet');
            return;
        }
        
        const dust = this.mainScene.dust;
        
        // Color particles based on medusa colors (desaturated)
        if (dust.materialFore && dust.materialFore.uniforms && dust.materialFore.uniforms.psColor) {
            const color1 = this.hexToRgb(this.colors.primary);
            const color2 = this.hexToRgb(this.colors.secondary);
            
            // Mix colors and desaturate
            const mixed = {
                r: (color1.r + color2.r) / 2,
                g: (color1.g + color2.g) / 2,
                b: (color1.b + color2.b) / 2
            };
            
            // Desaturate (move towards gray) - 60% gray
            const gray = (mixed.r + mixed.g + mixed.b) / 3;
            const desaturated = {
                r: mixed.r * 0.4 + gray * 0.6,
                g: mixed.g * 0.4 + gray * 0.6,
                b: mixed.b * 0.4 + gray * 0.6
            };
            
            // Update the psColor uniform
            dust.materialFore.uniforms.psColor.value.setRGB(
                desaturated.r / 255,
                desaturated.g / 255,
                desaturated.b / 255
            );
            
            // Force material update
            dust.materialFore.needsUpdate = true;
            
            console.log('Dust color updated to:', desaturated);
        }
    }
    
    customizeBackground() {
        if (!this.mainScene || !this.mainScene.renderer) {
            console.log('Renderer not available');
            return;
        }
        
        const color1 = this.hexToRgb(this.colors.primary);
        const color2 = this.hexToRgb(this.colors.secondary);
        
        // Mix colors
        const mixed = {
            r: (color1.r + color2.r) / 2,
            g: (color1.g + color2.g) / 2,
            b: (color1.b + color2.b) / 2
        };
        
        // Make much darker (8% brightness) and desaturated
        const gray = (mixed.r + mixed.g + mixed.b) / 3;
        const desaturated = {
            r: (mixed.r * 0.2 + gray * 0.8) * 0.08,
            g: (mixed.g * 0.2 + gray * 0.8) * 0.08,
            b: (mixed.b * 0.2 + gray * 0.8) * 0.08
        };
        
        const bgColor = new THREE.Color(
            desaturated.r / 255,
            desaturated.g / 255,
            desaturated.b / 255
        );
        
        this.mainScene.renderer.setClearColor(bgColor, 1);
        console.log('Background color updated to:', desaturated);
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
    
    customizeBackground() {
        if (!this.mainScene || !this.mainScene.renderer) return;
        
        const color1 = this.hexToRgb(this.colors.primary);
        const color2 = this.hexToRgb(this.colors.secondary);
        
        // Mix colors
        const mixed = {
            r: (color1.r + color2.r) / 2,
            g: (color1.g + color2.g) / 2,
            b: (color1.b + color2.b) / 2
        };
        
        // Make much darker (10% brightness) and desaturated
        const gray = (mixed.r + mixed.g + mixed.b) / 3;
        const desaturated = {
            r: (mixed.r * 0.2 + gray * 0.8) * 0.1,
            g: (mixed.g * 0.2 + gray * 0.8) * 0.1,
            b: (mixed.b * 0.2 + gray * 0.8) * 0.1
        };
        
        const bgColor = new THREE.Color(
            desaturated.r / 255,
            desaturated.g / 255,
            desaturated.b / 255
        );
        
        this.mainScene.renderer.setClearColor(bgColor, 1);
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
    
    updateColors(primaryColor, secondaryColor) {
        if (!this.mainScene || !this.mainScene.medusae) return;
        
        this.colors.primary = primaryColor;
        this.colors.secondary = secondaryColor;
        
        // Update ALL Medusa colors (replace all colors with just 2)
        const medusae = this.mainScene.medusae;
        if (medusae.colors && medusae.colors.length > 0) {
            // Replace all colors with our 2 colors alternating
            medusae.colors.forEach((colorObj, index) => {
                const color = index % 2 === 0 ? primaryColor : secondaryColor;
                colorObj.uniform.value.setStyle(color);
            });
            
            // Update dust color too if it exists
            if (this.mainScene.dust && this.mainScene.dust.material) {
                const dustMaterial = this.mainScene.dust.material;
                if (dustMaterial.uniforms && dustMaterial.uniforms.color) {
                    dustMaterial.uniforms.color.value.setStyle(primaryColor);
                }
            }
        }
    }
    focusCamera() {
        this.cameraState.targetZ = this.cameraState.focused;
        this.cameraState.targetY = this.cameraState.focusedY;
    }
    
    unfocusCamera() {
        this.cameraState.targetZ = this.cameraState.initial;
        this.cameraState.targetY = this.cameraState.initialY;
    }
    
    onResize() {
        if (this.mainScene) {
            this.mainScene.onWindowResize();
        }
    }
    
    dispose() {
        console.log('Disposing Medusa animation...');
        
        // Stop animation loop
        if (this.mainScene && this.mainScene.loop) {
            this.mainScene.loop.stop();
        }
        
        // Stop camera loop
        if (this.cameraLoopId) {
            cancelAnimationFrame(this.cameraLoopId);
            this.cameraLoopId = null;
        }
        
        // Clean up DOM elements
        if (this.medusaContainer) {
            this.medusaContainer.remove();
            this.medusaContainer = null;
        }
        if (this.medusaStats) {
            this.medusaStats.remove();
            this.medusaStats = null;
        }
        if (this.medusaControls) {
            this.medusaControls.remove();
            this.medusaControls = null;
        }
        if (this.medusaInfo) {
            this.medusaInfo.remove();
            this.medusaInfo = null;
        }
        if (this.medusaCover) {
            this.medusaCover.remove();
            this.medusaCover = null;
        }
        
        // Clean up main scene
        if (this.mainScene) {
            if (this.mainScene.scene) {
                this.mainScene.scene.traverse((object) => {
                    if (object.geometry) {
                        object.geometry.dispose();
                    }
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                });
            }
            
            if (this.mainScene.renderer) {
                this.mainScene.renderer.dispose();
            }
        }
        
        this.mainScene = null;
        this.isInitialized = false;
        
        console.log('Medusa animation disposed');
    }
}

// Export
window.MedusaAnimation = MedusaAnimation;
