import * as THREE from 'three';

/**
 * Sparkling Stardust Animation
 * Handles the persistent cyan flickering particles used across all sectors.
 */
export class StardustAnimation {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.seeds = null;
        this.particleTexture = null;
    }

    init() {
        const count = 1800; // Significantly increased density for better visibility
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        this.seeds = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            // Spawn in a large volume around the flight path
            pos[i * 3] = (Math.random() - 0.5) * 500;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 300;
            pos[i * 3 + 2] = Math.random() * -1000;
            
            this.seeds[i] = Math.random() * 100;
            
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 1;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
            size: 4.5, // larger for stronger presence on high-res displays
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 1.0,
            sizeAttenuation: true
        });

        // Use preloaded particle texture
        const loader = new THREE.TextureLoader();
        loader.load('assets/images/particle.png', (tex) => {
            mat.map = tex;
            mat.needsUpdate = true;
        });

        this.mesh = new THREE.Points(geo, mat);
        this.scene.add(this.mesh);
    }

    update(dt, time, worldSpeed, lateralShift) {
        if (!this.mesh || !this.seeds) return;

        const colors = this.mesh.geometry.attributes.color.array;
        const positions = this.mesh.geometry.attributes.position.array;
        
        for (let i = 0; i < this.seeds.length; i++) {
            // High-frequency shimmering logic
            const flicker = Math.sin(time * 12 + this.seeds[i]) * 0.5 + 0.5;
            const brightness = 0.5 + flicker * 0.5; // Boosted base brightness
            
            colors[i * 3] = brightness * 0.6;     // Cyan tint: Lower R
            colors[i * 3 + 1] = brightness * 0.9; // Cyan tint: Medium G
            colors[i * 3 + 2] = brightness;       // Cyan tint: Full B

            // Movement logic: sync with world speed and lateral curve
            // Factor down speed slightly for more graceful "stardust" feel vs warp streaks
            positions[i * 3 + 2] += (worldSpeed * 0.4) * dt;
            positions[i * 3] += lateralShift * 0.4;

            // Recycle particles that move behind the camera
            // 80 is a safer buffer for various camera modes
            if (positions[i * 3 + 2] > 80) {
                positions[i * 3 + 2] = -900;
                positions[i * 3] = (Math.random() - 0.5) * 500;
                positions[i * 3 + 1] = (Math.random() - 0.5) * 300;
            }
        }
        
        this.mesh.geometry.attributes.color.needsUpdate = true;
        this.mesh.geometry.attributes.position.needsUpdate = true;
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