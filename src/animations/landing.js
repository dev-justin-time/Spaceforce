import * as THREE from 'three';

/**
 * Landing Page HUD Animation
 * Handles the floating 'SECTOR ALPHA' tactical overlay for Level 1.
 */
export class LandingHUDAnimation {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
    }

    init() {
        const loader = new THREE.TextureLoader();
        loader.load('sflev.png', (tex) => {
            const ratio = tex.image ? (tex.image.width / tex.image.height) : 2.0; 
            const height = 120;
            const width = height * ratio;
            
            const mat = new THREE.MeshBasicMaterial({ 
                map: tex, 
                transparent: true, 
                opacity: 0, 
                depthWrite: false, 
                blending: THREE.AdditiveBlending 
            });
            
            this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
            this.mesh.position.set(0, 60, -350);
            this.scene.add(this.mesh);
        });
    }

    update(time) {
        if (!this.mesh) return;

        // Oscillate height and opacity for holographic effect
        this.mesh.position.y = 60 + Math.sin(time * 0.3) * 15;
        this.mesh.material.opacity = 0.5 + Math.sin(time * 1.5) * 0.3;
        
        // Subtle pulsing scale
        const s = 1.0 + Math.sin(time * 0.5) * 0.05;
        this.mesh.scale.set(s, s, s);
    }

    clear() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
            this.mesh = null;
        }
    }
}