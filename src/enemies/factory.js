import * as THREE from 'three';
import { playSound } from '../audio.js';
import { createHDRWireframe } from '../utils.js';

export class EnemyFactory {
    constructor(scene, entities) {
        this.scene = scene;
        this.entities = entities;
        
        // Cache geometries and materials for performance
        this.geos = {
            asteroidDefault: new THREE.IcosahedronGeometry(3, 0),
            dogfighter: new THREE.ConeGeometry(1.2, 4, 4).rotateX(Math.PI / 2),
            reptilian: new THREE.CylinderGeometry(1.5, 1.5, 8, 8).rotateX(Math.PI / 2),
            nordic: new THREE.TorusGeometry(3, 0.8, 8, 16),
            tallWhite: new THREE.BoxGeometry(1, 10, 2),
            mantis: new THREE.ConeGeometry(1, 5, 8),
            anunnaki: new THREE.ConeGeometry(4, 6, 4).rotateX(Math.PI / 2).rotateY(Math.PI / 4),
            sirian: new THREE.IcosahedronGeometry(2.5, 1),
            venusian: new THREE.CylinderGeometry(3, 3, 0.2, 16).rotateX(Math.PI / 2),
            ufoDisc: new THREE.CylinderGeometry(3.5, 3.5, 0.5, 16),
            ufoDome: new THREE.SphereGeometry(1.5, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
            ufoRing: new THREE.TorusGeometry(3.6, 0.15, 6, 16)
        };

        this.mats = {
            asteroidDefault: new THREE.MeshPhysicalMaterial({ color: 0xff0055, emissive: 0x550022, roughness: 0.4, metalness: 0.7, flatShading: true, clearcoat: 0.2 }),
            dogfighter: new THREE.MeshPhysicalMaterial({ color: 0xffaa00, emissive: 0xff4400, emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.9, clearcoat: 1.0 }),
            reptilian: new THREE.MeshPhysicalMaterial({ color: 0x228822, roughness: 0.8, metalness: 0.2, sheen: 1.0, sheenColor: 0x44aa44 }),
            nordic: new THREE.MeshPhysicalMaterial({ color: 0xeeeeff, metalness: 1.0, roughness: 0.05, clearcoat: 1.0 }),
            tallWhite: new THREE.MeshPhysicalMaterial({ color: 0xffffff, emissive: 0xaaaaaa, emissiveIntensity: 0.2, roughness: 0.1, metalness: 0.5 }),
            mantis: new THREE.MeshPhysicalMaterial({ color: 0x66cc44, roughness: 0.6, metalness: 0.4, clearcoat: 0.3 }),
            anunnaki: new THREE.MeshPhysicalMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.1 }),
            sirian: new THREE.MeshPhysicalMaterial({ color: 0x0044ff, emissive: 0x002288, roughness: 0.3, metalness: 0.8, clearcoat: 0.5 }),
            venusian: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.0 }),
            ufoDisc: new THREE.MeshPhysicalMaterial({ color: 0x8899aa, roughness: 0.2, metalness: 1.0, emissive: 0x223344, emissiveIntensity: 0.2, clearcoat: 1.0 }),
            ufoDome: new THREE.MeshPhysicalMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.8, roughness: 0.0, transparent: true, opacity: 0.7, transmission: 0.5, thickness: 2.0 })
        };
    }

    spawnAsteroid(levelId) {
        // removed implementation: asteroid logic moved to simplified internal types
        const isLvl2 = levelId === 2;
        const geometry = isLvl2 ? new THREE.DodecahedronGeometry(4, 0) : this.geos.asteroidDefault;
        const material = isLvl2 ? new THREE.MeshStandardMaterial({ color: 0x887766 }) : this.mats.asteroidDefault;
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set((Math.random() - 0.5) * 80, (Math.random() * 40) - 10, -200);
        this.scene.add(mesh);
        return { type: 'asteroid', mesh, rotSpeed: { x: Math.random(), y: Math.random() }, active: true, health: 1, hitRadius: 5 };
    }

    spawnGrey(targetPlayerMesh) {
        // "Greys" - Saucer/UFO Class Enemy
        const group = new THREE.Group();
        
        // Main Disc Hull
        const discGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.5, 16);
        const discMat = new THREE.MeshStandardMaterial({ 
            color: 0x000a10, // Darker base for wireframe
            roughness: 0.3, 
            metalness: 0.8,
            emissive: 0x223344,
            emissiveIntensity: 0.1
        });
        const disc = new THREE.Mesh(discGeo, discMat);
        const wire = new THREE.Mesh(discGeo.clone(), createHDRWireframe(0x00ff00, { opacity: 0.6 }));
        disc.add(wire);
        
        // Glowing Green Dome
        const domeGeo = new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMat = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00, 
            emissive: 0x00ff00, 
            emissiveIntensity: 0.8,
            roughness: 0.1,
            transparent: true,
            opacity: 0.9
        });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.y = 0.25;
        
        // Rotating Ring Lights
        const ringGeo = new THREE.TorusGeometry(3.6, 0.15, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        
        group.add(disc);
        group.add(dome);
        group.add(ring);
        
        // Spawn Position
        const x = (Math.random() - 0.5) * 90;
        const y = (Math.random() - 0.5) * 40;
        const z = -250;
        
        group.position.set(x, y, z);
        // Tilt slightly forward to look aggressive
        group.rotation.x = Math.PI * 0.6; 
        
        this.scene.add(group);
        
        return {
            type: 'grey',
            mesh: group,
            active: true,
            health: 12, // High health elite
            shootTimer: 0.5,
            hoverPhase: Math.random() * 100,
            target: targetPlayerMesh,
            hitRadius: 4.5
        };
    }

    spawnDogfighter(targetPlayerMesh) {
        // removed complex manual setup - logic moved to simplified reusable mesh construction
        const mesh = new THREE.Mesh(this.geos.dogfighter, this.mats.dogfighter);
        mesh.add(new THREE.Mesh(this.geos.dogfighter.clone(), createHDRWireframe(0xffaa00, { opacity: 0.7 })));
        mesh.position.set((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 30, -80);
        mesh.rotation.y = Math.PI; 
        this.scene.add(mesh);
        return { type: 'dogfighter', mesh, active: true, health: 5, scoreValue: 300, shootTimer: 1.0, target: targetPlayerMesh, phaseOffset: Math.random() * 10 };
    }

    // --- NEW ALIEN RACES ---

    spawnReptilian() {
        // Green, scaly, snake-like cylinder
        const group = new THREE.Group();
        const geo = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
        geo.rotateX(Math.PI / 2);
        const mat = new THREE.MeshStandardMaterial({ color: 0x051a05, roughness: 0.9, metalness: 0.3 });
        const body = new THREE.Mesh(geo, mat);
        const wire = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ color: 0x22ff22, wireframe: true, transparent: true, opacity: 0.5 }));
        body.add(wire);
        group.add(body);
        
        // Spikes
        for(let i=0; i<6; i++) {
            const spikeGeo = new THREE.ConeGeometry(0.5, 2);
            const spike = new THREE.Mesh(spikeGeo, mat);
            spike.position.set(0, 0, (i-2.5)*1.5);
            spike.rotation.z = i % 2 === 0 ? Math.PI/2 : -Math.PI/2;
            
            const spikeWire = new THREE.Mesh(spikeGeo.clone(), new THREE.MeshBasicMaterial({ color: 0x22ff22, wireframe: true, transparent: true, opacity: 0.4 }));
            spike.add(spikeWire);
            group.add(spike);
        }

        const x = (Math.random() - 0.5) * 70;
        const y = (Math.random() - 0.5) * 30;
        const z = -220;
        group.position.set(x, y, z);
        this.scene.add(group);

        return {
            type: 'reptilian',
            mesh: group,
            active: true,
            health: 4,
            scoreValue: 150,
            shootTimer: Math.random() * 2,
            velocity: new THREE.Vector3(0,0,0)
        };
    }

    spawnNordic() {
        // Sleek, silver, elegant
        const geo = new THREE.TorusGeometry(3, 0.8, 16, 32);
        const mat = new THREE.MeshStandardMaterial({ color: 0x0a0a1a, metalness: 0.9, roughness: 0.1 });
        const mesh = new THREE.Mesh(geo, mat);
        const wire = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ color: 0x00aaff, wireframe: true, transparent: true, opacity: 0.7 }));
        mesh.add(wire);
        
        // Core glow with wireframe
        const coreGeo = new THREE.SphereGeometry(1.5);
        const core = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: 0x00aaff }));
        const coreWire = new THREE.Mesh(coreGeo.clone(), new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 1.0 }));
        core.add(coreWire);
        mesh.add(core);

        const x = (Math.random() - 0.5) * 60;
        const y = (Math.random() - 0.5) * 20;
        const z = -220;
        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        return {
            type: 'nordic',
            mesh,
            active: true,
            health: 3,
            scoreValue: 200,
            shootTimer: Math.random() * 1.5,
            velocity: new THREE.Vector3(0,0,0)
        };
    }

    spawnTallWhite() {
        // Vertical sleek pillar
        const geo = new THREE.BoxGeometry(1, 10, 2);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xaaaaaa, emissiveIntensity: 0.2 });
        const mesh = new THREE.Mesh(geo, mat);
        const wire = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.6 }));
        mesh.add(wire);
        
        const x = (Math.random() - 0.5) * 80;
        const y = (Math.random() - 0.5) * 40;
        const z = -220;
        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        return {
            type: 'tallwhite',
            mesh,
            active: true,
            health: 5,
            scoreValue: 250,
            shootTimer: Math.random() * 2.5,
            velocity: new THREE.Vector3(0,0,0)
        };
    }

    spawnMantis() {
        // Insectoid shape
        const group = new THREE.Group();
        const geo = new THREE.ConeGeometry(1, 5);
        const body = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x0a1a05 }));
        const wire = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ color: 0x66ff44, wireframe: true, transparent: true, opacity: 0.6 }));
        body.add(wire);
        body.rotation.x = Math.PI / 2;
        group.add(body);
        
        // Limbs
        const legGeo = new THREE.BoxGeometry(0.2, 4, 0.2);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x0a1a05 });
        const legWireMat = new THREE.MeshBasicMaterial({ color: 0x66ff44, wireframe: true, transparent: true, opacity: 0.5 });
        for(let i=0; i<4; i++) {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.rotation.z = (Math.PI / 4) + (i * Math.PI / 2);
            const legWire = new THREE.Mesh(legGeo.clone(), legWireMat);
            leg.add(legWire);
            group.add(leg);
        }

        const x = (Math.random() - 0.5) * 70;
        const y = (Math.random() - 0.5) * 30;
        const z = -220;
        group.position.set(x, y, z);
        this.scene.add(group);

        return {
            type: 'mantis',
            mesh: group,
            active: true,
            health: 2,
            scoreValue: 120,
            shootTimer: Math.random(),
            velocity: new THREE.Vector3(0,0,0)
        };
    }

    spawnAnunnaki() {
        // Gold Pyramid
        const geo = new THREE.ConeGeometry(4, 6, 4);
        geo.rotateX(Math.PI / 2);
        geo.rotateY(Math.PI / 4); // Align flat side
        const mat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.2 });
        const mesh = new THREE.Mesh(geo, mat);
        const wire = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ color: 0xffd700, wireframe: true, transparent: true, opacity: 0.8 }));
        mesh.add(wire);
        
        const x = (Math.random() - 0.5) * 60;
        const y = (Math.random() - 0.5) * 20;
        const z = -220;
        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        return {
            type: 'anunnaki',
            mesh,
            active: true,
            health: 8,
            scoreValue: 400,
            shootTimer: 2.0,
            velocity: new THREE.Vector3(0,0,0)
        };
    }

    spawnSirian() {
        // Blue Spherical/Organic
        const geo = new THREE.IcosahedronGeometry(2.5, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0x0044ff, emissive: 0x002288, roughness: 0.5 });
        const mesh = new THREE.Mesh(geo, mat);
        const wire = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ color: 0x0088ff, wireframe: true, transparent: true, opacity: 0.7 }));
        mesh.add(wire);

        const x = (Math.random() - 0.5) * 70;
        const y = (Math.random() - 0.5) * 30;
        const z = -220;
        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        return {
            type: 'sirian',
            mesh,
            active: true,
            health: 3,
            scoreValue: 180,
            shootTimer: 1.2,
            velocity: new THREE.Vector3(0,0,0)
        };
    }

    spawnVenusian() {
        // Shiny Silver Disc
        const geo = new THREE.CylinderGeometry(3, 3, 0.2, 32);
        geo.rotateX(Math.PI / 2);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.0 });
        const mesh = new THREE.Mesh(geo, mat);
        const wire = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.6 }));
        mesh.add(wire);

        const x = (Math.random() - 0.5) * 80;
        const y = (Math.random() - 0.5) * 30;
        const z = -220;
        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        return {
            type: 'venusian',
            mesh,
            active: true,
            health: 2,
            scoreValue: 220,
            shootTimer: 0.8,
            velocity: new THREE.Vector3(0,0,0)
        };
    }

    spawnFighterSquad(enemiesList) {
        // Spawn 3 fighters in V formation
        const centerX = (Math.random() - 0.5) * 40;
        const centerY = (Math.random() * 20) + 5;
        const startZ = -250;

        // V Formation offsets
        const offsets = [
            { x: 0, y: 0, z: 0 },       // Leader
            { x: -12, y: 3, z: 15 },    // Left Wing
            { x: 12, y: 3, z: 15 }      // Right Wing
        ];

        offsets.forEach(offset => {
            // Sleek Fighter Shape
            const geometry = new THREE.ConeGeometry(1.5, 6, 4);
            geometry.rotateX(Math.PI / 2); // Point Z
            
            const material = new THREE.MeshStandardMaterial({
                color: 0xff2200,
                emissive: 0xaa0000,
                emissiveIntensity: 0.5,
                roughness: 0.2,
                metalness: 0.9,
                flatShading: true
            });

            const mesh = new THREE.Mesh(geometry, material);
            const wire = new THREE.Mesh(geometry.clone(), createHDRWireframe(0xff3300, { opacity: 0.7 }));
            mesh.add(wire);

            mesh.position.set(centerX + offset.x, centerY + offset.y, startZ + offset.z);
            // Slight rotation to look aggressive
            mesh.rotation.z = Math.PI; 
            
            this.scene.add(mesh);
            
            enemiesList.push({
                type: 'fighter',
                mesh,
                active: true,
                health: 2,
                shootTimer: Math.random() * 1.5 + 0.5, // Staggered fire
                velocity: new THREE.Vector3(0, 0, 0)
            });
        });
    }

    spawnPredator(targetPlayerMesh) {
        // Yautja Ship (Aggressive, Angular, Cloakable)
        const group = new THREE.Group();

        // Main Hull (Dark, Bio-Mechanical look)
        const hullGeo = new THREE.ConeGeometry(2, 6, 3); // Triangular/aggressive
        hullGeo.rotateX(Math.PI / 2);
        const hullMat = new THREE.MeshStandardMaterial({ 
            color: 0x050505, 
            roughness: 0.6, 
            metalness: 0.8,
            transparent: true,
            opacity: 1.0 
        });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        const wire = new THREE.Mesh(hullGeo.clone(), new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, transparent: true, opacity: 0.8 }));
        hull.add(wire);
        group.add(hull);

        // Shoulder Cannon (Plasma Caster representation)
        const cannonGeo = new THREE.CylinderGeometry(0.3, 0.5, 3);
        cannonGeo.rotateX(Math.PI / 2);
        const cannon = new THREE.Mesh(cannonGeo, new THREE.MeshStandardMaterial({ color: 0x050505 }));
        const cannonWire = new THREE.Mesh(cannonGeo.clone(), new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, transparent: true, opacity: 0.8 }));
        cannon.add(cannonWire);
        cannon.position.set(1.5, 0.5, 0);
        group.add(cannon);

        // Three red laser sights (Triangle formation)
        const laserMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const laserWireMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, transparent: true, opacity: 1.0 });
        const laserGeo = new THREE.SphereGeometry(0.15, 4, 4);
        const l1 = new THREE.Mesh(laserGeo, laserMat); l1.position.set(0.2, 1, 2.5);
        const l2 = new THREE.Mesh(laserGeo, laserMat); l2.position.set(-0.2, 1, 2.5);
        const l3 = new THREE.Mesh(laserGeo, laserMat); l3.position.set(0, 0.7, 2.5);
        [l1, l2, l3].forEach(l => {
            l.add(new THREE.Mesh(laserGeo.clone(), laserWireMat));
            group.add(l);
        });

        const x = (Math.random() - 0.5) * 80;
        const y = (Math.random() - 0.5) * 30;
        const z = -250;
        group.position.set(x, y, z);
        
        this.scene.add(group);

        return {
            type: 'predator',
            mesh: group,
            active: true,
            health: 8,
            scoreValue: 600,
            shootTimer: 1.5,
            cloakState: 'visible', // visible, fading_out, cloaked, fading_in
            cloakTimer: 0,
            target: targetPlayerMesh,
            velocity: new THREE.Vector3(0,0,0)
        };
    }
}