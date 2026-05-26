import * as THREE from 'three';
import { randomRange } from '../utils.js';

/**
 * Configuration for level-specific lighting and environments.
 * Extracted from src/world.js to keep the main logic clean.
 */
export const WORLD_CONFIGS = {
    1: {
        setupLighting: (scene, lights) => {
            const dirLight = new THREE.DirectionalLight(0x06f9f9, 2.0);
            dirLight.position.set(100, 100, 50);
            dirLight.castShadow = true;
            scene.add(dirLight);
            lights.push(dirLight);

            const blueLight = new THREE.DirectionalLight(0x0088ff, 1.5);
            blueLight.position.set(-100, 50, -50);
            scene.add(blueLight);
            lights.push(blueLight);

            scene.fog = new THREE.FogExp2(0x000a1a, 0.005);
        },
        setupEnvironment: (scene, envObjs, animObjs) => {
            // Environment objects for Level 1 (Sector Alpha)
            // LandingHUDAnimation handled by World class refactor
        },
        terrainMaterial: () => new THREE.MeshPhysicalMaterial({
            color: 0x001122, emissive: 0x006688, emissiveIntensity: 0.4, wireframe: true,
            roughness: 0.1, metalness: 1.0, clearcoat: 1.0, reflectivity: 1.0
        })
    },
    2: {
        setupLighting: (scene, lights) => {
            const sunLight = new THREE.DirectionalLight(0xffaa55, 3);
            sunLight.position.set(-100, 50, -100);
            scene.add(sunLight);
            lights.push(sunLight);
            scene.fog = new THREE.FogExp2(0x2a1a0a, 0.005);
        },
        setupEnvironment: (scene, envObjs) => {
            const planet = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 32), new THREE.MeshStandardMaterial({ color: 0xddbb99, roughness: 0.8 }));
            planet.position.set(-300, 100, -600);
            scene.add(planet);
            envObjs.push(planet);
            const rings = new THREE.Mesh(new THREE.RingGeometry(350, 500, 64), new THREE.MeshBasicMaterial({ color: 0xccaa88, side: THREE.DoubleSide, transparent: true, opacity: 0.4 }));
            rings.rotation.x = Math.PI / 2.2;
            rings.position.copy(planet.position);
            scene.add(rings);
            envObjs.push(rings);
        },
        terrainMaterial: () => new THREE.MeshStandardMaterial({ color: 0x443322, emissive: 0x442200, emissiveIntensity: 0.1, wireframe: true, roughness: 0.9 })
    },
    3: {
        setupLighting: (scene, lights) => {
            const accretionLight = new THREE.PointLight(0xff0055, 4, 400);
            accretionLight.position.set(0, 0, -350);
            scene.add(accretionLight);
            lights.push(accretionLight);
            scene.fog = new THREE.FogExp2(0x000000, 0.004);
        },
        setupEnvironment: (scene, envObjs) => {
            const bh = new THREE.Mesh(new THREE.SphereGeometry(80, 64, 64), new THREE.MeshBasicMaterial({ color: 0x000000 }));
            bh.position.set(0, 0, -500);
            scene.add(bh);
            envObjs.push(bh);
            const disk = new THREE.Mesh(new THREE.RingGeometry(90, 200, 64), new THREE.MeshBasicMaterial({ color: 0xff0033, side: THREE.DoubleSide, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending }));
            disk.rotation.x = Math.PI / 1.6;
            disk.position.copy(bh.position);
            scene.add(disk);
            envObjs.push(disk);
        },
        terrainMaterial: () => new THREE.MeshStandardMaterial({ color: 0x110022, emissive: 0x550022, emissiveIntensity: 0.4, wireframe: true, roughness: 0.5 })
    },
    4: {
        setupLighting: (scene, lights) => {
            const toxicLight = new THREE.DirectionalLight(0xff0033, 4);
            toxicLight.position.set(-150, 80, -100);
            scene.add(toxicLight);
            lights.push(toxicLight);
            const secondaryLight = new THREE.DirectionalLight(0xaa0055, 2);
            secondaryLight.position.set(100, -30, 80);
            scene.add(secondaryLight);
            lights.push(secondaryLight);
            const hazardGlow = new THREE.PointLight(0xff0055, 5, 300);
            hazardGlow.position.set(0, 20, -200);
            scene.add(hazardGlow);
            lights.push(hazardGlow);
            scene.fog = new THREE.FogExp2(0x1a0505, 0.007);
        },
        setupEnvironment: (scene, envObjs) => {
            for(let i = 0; i < 25; i++) {
                const size = randomRange(8, 25);
                const geo = new THREE.DodecahedronGeometry(size, 0);
                const mat = new THREE.MeshStandardMaterial({ color: 0x661111, emissive: 0x330000, emissiveIntensity: 0.3, roughness: 0.9, flatShading: true });
                const asteroid = new THREE.Mesh(geo, mat);
                asteroid.position.set((Math.random() - 0.5) * 400, (Math.random() - 0.5) * 150, (Math.random() - 0.5) * 800 - 200);
                asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                scene.add(asteroid);
                envObjs.push(asteroid);
            }
        },
        terrainMaterial: () => new THREE.MeshStandardMaterial({ color: 0x220011, emissive: 0x660022, emissiveIntensity: 0.6, wireframe: true, roughness: 0.4 })
    },
    5: {
        setupLighting: (scene, lights) => {
            const crystalLight = new THREE.DirectionalLight(0x00ddff, 5);
            crystalLight.position.set(-100, 120, -80);
            scene.add(crystalLight);
            lights.push(crystalLight);
            const iceLight = new THREE.DirectionalLight(0xaaffff, 3);
            iceLight.position.set(120, -40, 100);
            scene.add(iceLight);
            lights.push(iceLight);
            const shimmerLight = new THREE.PointLight(0xffffff, 6, 350);
            shimmerLight.position.set(0, 30, -250);
            scene.add(shimmerLight);
            lights.push(shimmerLight);
            scene.fog = new THREE.FogExp2(0x0a1a2a, 0.005);
        },
        setupEnvironment: (scene, envObjs) => {
            for(let i = 0; i < 30; i++) {
                const height = randomRange(20, 60);
                const geo = new THREE.ConeGeometry(height * 0.3, height, 6);
                const mat = new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x0088ff, emissiveIntensity: 0.5, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85, flatShading: true });
                const crystal = new THREE.Mesh(geo, mat);
                crystal.position.set((Math.random() - 0.5) * 500, randomRange(-10, 40), (Math.random() - 0.5) * 900 - 200);
                crystal.rotation.set((Math.random() - 0.5) * Math.PI * 0.3, Math.random() * Math.PI * 2, (Math.random() - 0.5) * Math.PI * 0.3);
                scene.add(crystal);
                envObjs.push(crystal);
            }
        },
        terrainMaterial: () => new THREE.MeshStandardMaterial({ color: 0x113344, emissive: 0x0088ff, emissiveIntensity: 0.7, wireframe: true, roughness: 0.2, metalness: 0.5 })
    },
    6: {
        setupLighting: (scene, lights) => {
            const stormKey = new THREE.DirectionalLight(0x66ccff, 4);
            stormKey.position.set(-120, 80, -150);
            scene.add(stormKey);
            lights.push(stormKey);
            const stormFill = new THREE.DirectionalLight(0xff00ff, 2.5);
            stormFill.position.set(150, -30, 50);
            scene.add(stormFill);
            lights.push(stormFill);
            const lightning = new THREE.PointLight(0xffffff, 10, 400);
            lightning.position.set(0, 40, -260);
            scene.add(lightning);
            lights.push(lightning);
            scene.fog = new THREE.FogExp2(0x050816, 0.006);
        },
        setupEnvironment: (scene, envObjs) => {
            for (let i = 0; i < 18; i++) {
                const radius = randomRange(20, 50);
                const geo = new THREE.SphereGeometry(radius, 24, 24);
                const mat = new THREE.MeshStandardMaterial({ color: 0x44bbff, emissive: 0x1188ff, emissiveIntensity: 0.7, roughness: 0.6, transparent: true, opacity: 0.5 });
                const cloud = new THREE.Mesh(geo, mat);
                cloud.position.set((Math.random() - 0.5) * 500, randomRange(-30, 80), (Math.random() - 0.5) * 900 - 250);
                scene.add(cloud);
                envObjs.push(cloud);
            }
        },
        terrainMaterial: () => new THREE.MeshStandardMaterial({ color: 0x001822, emissive: 0x1199ff, emissiveIntensity: 0.6, wireframe: true, roughness: 0.3, metalness: 0.4 })
    },
    90: {
        setupLighting: (scene, lights) => {
            const ambient = new THREE.AmbientLight(0x112244, 0.3);
            scene.add(ambient);
            lights.push(ambient);
            [[-100, 100, -100], [100, 100, -100], [0, 150, -300]].forEach(pos => {
                const spot = new THREE.SpotLight(0xffffff, 5, 500, Math.PI / 6, 0.5, 1);
                spot.position.set(...pos);
                spot.target.position.set(0, 0, -150);
                scene.add(spot);
                scene.add(spot.target);
                lights.push(spot);
            });
            scene.fog = new THREE.FogExp2(0x000510, 0.003);
        },
        setupEnvironment: (scene, envObjs, animObjs) => {
            const spectatorGeo = new THREE.BoxGeometry(1, 0.5, 2);
            for(let i=0; i<60; i++) {
                const s = new THREE.Mesh(spectatorGeo, new THREE.MeshBasicMaterial({ color: 0x00ffff }));
                const angle = Math.random() * Math.PI * 2;
                const radius = 150 + Math.random() * 50;
                s.position.set(Math.cos(angle) * radius, 50 + Math.random() * 80, -200 + (Math.random() - 0.5) * 400);
                s.material.color.setHSL(0.5 + Math.random() * 0.1, 1, 0.5);
                scene.add(s);
                envObjs.push(s);
                animObjs.push({ mesh: s, update: (t) => { s.position.y += Math.sin(t + i) * 0.05; s.rotation.y += 0.01; } });
            }
            const pylonGeo = new THREE.CylinderGeometry(5, 5, 200, 8);
            const pylonMat = new THREE.MeshPhysicalMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.1, emissive: 0x00ffff, emissiveIntensity: 0.2 });
            for(let i=0; i<8; i++) {
                const p = new THREE.Mesh(pylonGeo, pylonMat);
                const side = i % 2 === 0 ? 1 : -1;
                p.position.set(side * 60, 0, -i * 100);
                scene.add(p);
                envObjs.push(p);
            }
        },
        terrainMaterial: () => new THREE.MeshBasicMaterial({ color: 0x004488, wireframe: true, transparent: true, opacity: 0.2 })
    }
};