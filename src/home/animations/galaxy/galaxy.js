// ===== GALAXY ANIMATION MODULE =====
// Animation de galaxie 3D avec Three.js

class GalaxyAnimation {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.points = null;
        this.starfield = null;
        this.animationId = null;
        this.clock = null;
        this.threeLoaded = false;
        
        // Galaxy parameters (optimisé pour réduire la RAM)
        this.parameters = {
            count: 80000,
            size: 0.02,
            radius: 5,
            branches: 5,
            spin: 1,
            randomness: 0.5,
            randomnessPower: 3,
            insideColor: '#ff6030',
            outsideColor: '#1b3984'
        };
        
        // Stocker les textures pour les nettoyer
        this.textures = [];
        
        // Camera state
        this.cameraState = {
            initial: { x: 0, y: 2, z: 6 },
            focused: { x: 0, y: 0.5, z: 4 },
            current: { x: 0, y: 2, z: 6 },
            target: { x: 0, y: 2, z: 6 },
            isAnimating: false
        };
        
        this.rotation = { x: 0, y: 0 };
        this.autoRotation = 0;
    }
    
    async init() {
        // Load Three.js if not already loaded
        await this.loadThreeJS();
        
        // Initialize clock after Three.js is loaded
        this.clock = new THREE.Clock();
        
        // Scene setup
        this.scene = new THREE.Scene();
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.container,
            antialias: true,
            alpha: true
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // Limiter le pixel ratio à 2 pour économiser la mémoire GPU
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Camera position
        this.camera.position.set(0, 2, 6);
        this.camera.lookAt(0, 0, 0);
        
        // Generate galaxy and starfield
        this.generateGalaxy();
        this.starfield = this.createStarfield();
        
        // Start animation
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onResize());
    }
    
    async loadThreeJS() {
        if (window.THREE && window.THREE.Scene) {
            console.log('Three.js already loaded, reusing existing instance');
            this.threeLoaded = true;
            return;
        }
        
        console.log('Loading Three.js for Galaxy...');
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.onload = () => {
                this.threeLoaded = true;
                console.log('Three.js loaded successfully');
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    createRoundParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.beginPath();
        ctx.arc(16, 16, 16, 0, Math.PI * 2);
        ctx.fill();
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        this.textures.push(texture);
        return texture;
    }
    
    generateGalaxy() {
        // Destroy old galaxy
        if (this.points !== null) {
            this.points.geometry.dispose();
            this.points.material.dispose();
            this.scene.remove(this.points);
        }
        
        // Geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.parameters.count * 3);
        const colors = new Float32Array(this.parameters.count * 3);
        
        const colorInside = new THREE.Color(this.parameters.insideColor);
        const colorOutside = new THREE.Color(this.parameters.outsideColor);
        
        for (let i = 0; i < this.parameters.count; i++) {
            const i3 = i * 3;
            
            // Position
            const radius = Math.random() * this.parameters.radius;
            const spinAngle = radius * this.parameters.spin;
            const branchAngle = (i % this.parameters.branches) / this.parameters.branches * Math.PI * 2;
            
            const randomX = Math.pow(Math.random(), this.parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * this.parameters.randomness * radius;
            const randomY = Math.pow(Math.random(), this.parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * this.parameters.randomness * radius;
            const randomZ = Math.pow(Math.random(), this.parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * this.parameters.randomness * radius;
            
            positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
            positions[i3 + 1] = randomY;
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;
            
            // Color
            const mixedColor = colorInside.clone();
            mixedColor.lerp(colorOutside, radius / this.parameters.radius);
            
            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Material
        const material = new THREE.PointsMaterial({
            size: this.parameters.size,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
            map: this.createRoundParticleTexture()
        });
        
        // Points
        this.points = new THREE.Points(geometry, material);
        this.scene.add(this.points);
    }
    
    createStarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        this.textures.push(texture);
        return texture;
    }
    
    createStarfield() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 15000; 
        const starPositions = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            
            starPositions[i3] = (Math.random() - 0.5) * 150;
            starPositions[i3 + 1] = (Math.random() - 0.5) * 150;
            starPositions[i3 + 2] = (Math.random() - 0.5) * 150;
            
            const colorType = Math.random();
            if (colorType > 0.9) {
                starColors[i3] = 0.7 + Math.random() * 0.3;
                starColors[i3 + 1] = 0.8 + Math.random() * 0.2;
                starColors[i3 + 2] = 1.0;
            } else if (colorType > 0.7) {
                starColors[i3] = 1.0;
                starColors[i3 + 1] = 0.8 + Math.random() * 0.2;
                starColors[i3 + 2] = 0.6 + Math.random() * 0.2;
            } else if (colorType > 0.95) {
                starColors[i3] = 1.0;
                starColors[i3 + 1] = 0.5 + Math.random() * 0.3;
                starColors[i3 + 2] = 0.4 + Math.random() * 0.2;
            } else {
                const intensity = 0.85 + Math.random() * 0.15;
                starColors[i3] = intensity;
                starColors[i3 + 1] = intensity;
                starColors[i3 + 2] = intensity;
            }
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            size: 0.1,
            sizeAttenuation: true,
            transparent: true,
            opacity: 3.5,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            map: this.createStarTexture()
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
        return stars;
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const elapsedTime = this.clock.getElapsedTime();
        
        // Auto-rotation
        this.autoRotation += 0.001;
        
        // Smooth camera transition
        const lerpFactor = 0.05;
        this.cameraState.current.x += (this.cameraState.target.x - this.cameraState.current.x) * lerpFactor;
        this.cameraState.current.y += (this.cameraState.target.y - this.cameraState.current.y) * lerpFactor;
        this.cameraState.current.z += (this.cameraState.target.z - this.cameraState.current.z) * lerpFactor;
        
        this.camera.position.set(this.cameraState.current.x, this.cameraState.current.y, this.cameraState.current.z);
        this.camera.lookAt(0, 0, 0);
        
        // Rotate galaxy
        if (this.points) {
            this.points.rotation.x = this.rotation.x;
            this.points.rotation.y = this.rotation.y + this.autoRotation;
        }
        
        // Rotate starfield
        if (this.starfield) {
            this.starfield.rotation.x = this.rotation.x + elapsedTime * 0.01;
            this.starfield.rotation.y = this.rotation.y + this.autoRotation + elapsedTime * 0.02;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    updateColors(insideColor, outsideColor) {
        this.parameters.insideColor = insideColor;
        this.parameters.outsideColor = outsideColor;
        this.generateGalaxy();
    }
    
    focusCamera() {
        this.cameraState.target = { ...this.cameraState.focused };
    }
    
    unfocusCamera() {
        this.cameraState.target = { ...this.cameraState.initial };
    }
    
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Nettoyer les textures
        if (this.textures) {
            this.textures.forEach(texture => texture.dispose());
            this.textures = [];
        }
        
        if (this.points) {
            this.points.geometry.dispose();
            if (this.points.material.map) this.points.material.map.dispose();
            this.points.material.dispose();
            this.scene.remove(this.points);
            this.points = null;
        }
        
        if (this.starfield) {
            this.starfield.geometry.dispose();
            if (this.starfield.material.map) this.starfield.material.map.dispose();
            this.starfield.material.dispose();
            this.scene.remove(this.starfield);
            this.starfield = null;
        }
        
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.forceContextLoss();
            this.renderer = null;
        }
        
        this.scene = null;
        this.camera = null;
        
        console.log('Galaxy animation disposed and memory freed');
    }
}

// Export
window.GalaxyAnimation = GalaxyAnimation;
