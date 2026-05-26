import * as THREE from 'three';
import { playSound } from './audio.js';
import { loadOptimizedTexture } from './image-utils.js';
import { EnemyFactory } from './enemies/factory.js';
import { CollisionSystem } from './systems/collision.js';
import { EnemyBehaviorSystem } from './systems/enemy-behavior.js';

export class EntityManager {
    constructor(scene) {
        this.scene = scene;
        this.currentLevel = 1;
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.particles = [];
        this.powerups = [];
        this.coins = [];
        
        // Pools for performance
        this.bulletPool = [];
        this.enemyBulletPool = [];
        this.particlePool = [];
        
        this.bulletSpeed = 200;
        
        // Pre-allocated scratch vectors to avoid GC pressure
        this._scratchVec = new THREE.Vector3();
        this._scratchLateral = new THREE.Vector3();

        // Shared geometries/materials for bullets
        this.playerBulletGeo = new THREE.CapsuleGeometry(0.5, 4, 4, 4);
        this.enemyBulletGeo = new THREE.SphereGeometry(0.8, 4, 4);
        this.bulletMaterials = {
            default: new THREE.MeshBasicMaterial({ color: 0x00ffff }),
            plasma: new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
            ion: new THREE.MeshBasicMaterial({ color: 0x0088ff }),
            vortex: new THREE.MeshBasicMaterial({ color: 0x0044ff }),
            enemy: new THREE.MeshBasicMaterial({ color: 0xff3333 })
        };
        
        const loader = new THREE.TextureLoader();
        loadOptimizedTexture('assets/images/particle').then(url => {
            this.particleTexture = loader.load(url);
        }).catch(() => {
            this.particleTexture = loader.load('assets/images/particle.png');
        });

        this.enemyFactory = new EnemyFactory(scene, this);
        this.collisionSystem = new CollisionSystem(scene, this);
        this.enemyBehaviorSystem = new EnemyBehaviorSystem(this, null);
    }

    spawnEnemyBullet(position, direction = null, color = 0xff3333) {
        let b;
        if (this.enemyBulletPool.length > 0) {
            b = this.enemyBulletPool.pop();
            b.mesh.visible = true;
        } else {
            const mesh = new THREE.Mesh(this.enemyBulletGeo, this.bulletMaterials.enemy.clone());
            this.scene.add(mesh);
            b = { mesh, velocity: new THREE.Vector3() };
        }
        
        b.mesh.position.copy(position);
        if (color !== 0xff3333) b.mesh.material.color.set(color);
        
        if (direction) {
            b.velocity.copy(direction).multiplyScalar(120);
        } else {
            b.velocity.set(0, 0, 120);
        }
        
        this.enemyBullets.push(b); 
    }

    spawnBullet(position, angle = 0, ammoType = 'default') {
        let b;
        const damage = ammoType === 'plasma' ? 1.25 : (ammoType === 'ion' ? 0.8 : (ammoType === 'vortex' ? 1.5 : 1));
        const mat = this.bulletMaterials[ammoType] || this.bulletMaterials.default;

        if (this.bulletPool.length > 0) {
            b = this.bulletPool.pop();
            b.mesh.material = mat;
            b.mesh.visible = true;
        } else {
            const mesh = new THREE.Mesh(this.playerBulletGeo, mat);
            this.scene.add(mesh);
            b = { mesh, velocity: new THREE.Vector3() };
        }
        
        b.mesh.position.copy(position);
        b.mesh.rotation.set(Math.PI / 2, 0, angle);
        
        b.velocity.set(
            Math.sin(angle) * this.bulletSpeed,
            0,
            -Math.cos(angle) * this.bulletSpeed
        );

        b.life = 2.0;
        b.damage = damage;
        b.ammoType = ammoType;
        b.isMissile = false;

        this.bullets.push(b);
        playSound('laser', 0.15, 1.0 + Math.random() * 0.2);
    }

    spawnMissile(position) {
        const geometry = new THREE.ConeGeometry(0.8, 3, 8);
        geometry.rotateX(-Math.PI / 2); // Point forward
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xffaa00, 
            emissive: 0xff4400, 
            emissiveIntensity: 0.5 
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.copy(position);
        this.scene.add(mesh);
        
        const velocity = new THREE.Vector3(0, 0, -150); // Slower but powerful
        
        // Secondary weapons deal more damage (e.g. 5)
        this.bullets.push({ mesh, velocity, life: 3.0, damage: 5, isMissile: true });
        
        playSound('explosion', 0.3, 2.0); // Woosh sound reuse
    }

    spawnCoin() {
        const rand = Math.random();
        let value = 1;
        let color = 0xcd7f32; // Bronze
        let geometry;
        let scale = 1.0;

        if (rand < 0.6) { // 60% Chance - 1 UNI
            value = 1;
            color = 0xcd7f32; // Bronze
            geometry = new THREE.CylinderGeometry(1, 1, 0.2, 16);
            geometry.rotateX(Math.PI / 2); // Face camera
        } else if (rand < 0.85) { // 25% Chance - 5 UNI
            value = 5;
            color = 0xc0c0c0; // Silver
            geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
            scale = 1.1;
        } else if (rand < 0.95) { // 10% Chance - 10 UNI
            value = 10;
            color = 0xffd700; // Gold
            geometry = new THREE.OctahedronGeometry(1.2);
            scale = 1.2;
        } else { // 5% Chance - 50 UNI
            value = 50;
            color = 0x9932cc; // DarkOrchid/Purple
            geometry = new THREE.IcosahedronGeometry(1.5);
            scale = 1.3;
        }

        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.6,
            roughness: 0.3,
            metalness: 0.9
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.scale.setScalar(scale);

        // Add Glowing Wireframe for Coins
        const wireGeo = geometry.clone();
        const wireMat = new THREE.MeshBasicMaterial({ color: color, wireframe: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        mesh.add(wire);

        // Spawn logic
        const x = (Math.random() - 0.5) * 60;
        const y = (Math.random() - 0.5) * 20;
        const z = -200;

        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        this.coins.push({ value, mesh, rotationSpeed: Math.random() + 1 });
    }

    spawnPowerup(fixedPos = null, fixedType = null) {
        const typeRoll = Math.random();
        let type = fixedType;
        if (!type) {
            if (typeRoll < 0.4) type = 'health';
            else if (typeRoll < 0.7) type = 'rapid';
            else type = 'spread';
        }

        let color = 0x00ff00;
        let geometry;

        if (type === 'health') {
            type = 'health'; // 40%
            color = 0x00ff00;
            geometry = new THREE.BoxGeometry(2, 2, 2);
        } else if (typeRoll < 0.7) {
            type = 'rapid'; // 30%
            color = 0xffff00;
            geometry = new THREE.OctahedronGeometry(1.5);
        } else {
            type = 'spread'; // 30%
            color = 0x00ffff;
            geometry = new THREE.TetrahedronGeometry(1.5);
        }

        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.8,
            roughness: 0.2,
            metalness: 0.8
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        // Add Glowing Wireframe for Powerups
        const wireGeo = geometry.clone();
        const wireMat = new THREE.MeshBasicMaterial({ color: color, wireframe: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        mesh.add(wire);

        // Spawn ahead
        const x = (Math.random() - 0.5) * 60;
        const y = (Math.random() - 0.5) * 20;
        const z = -200;
        
        if (fixedPos) {
            // Accept either a THREE.Vector3 or a plain {x,y,z} object to avoid dependency issues
            if (fixedPos.x !== undefined && fixedPos.y !== undefined && fixedPos.z !== undefined) {
                mesh.position.set(fixedPos.x, fixedPos.y, fixedPos.z);
            } else if (typeof fixedPos.copy === 'function') {
                // THREE.Vector3-like
                mesh.position.copy(fixedPos);
            } else {
                // Fallback center
                mesh.position.set(x, y, z);
            }
        } else {
            mesh.position.set(x, y, z);
        }
        this.scene.add(mesh);
        
        this.powerups.push({ type, mesh, isFixed: !!fixedPos });
    }

    setLevel(level) {
        this.currentLevel = level;
    }

    spawnAsteroid() {
        // removed implementation: use this.enemyFactory.spawnAsteroid
        const enemy = this.enemyFactory.spawnAsteroid(this.currentLevel);
        this.enemies.push(enemy);
    }

    spawnGrey(targetPlayerMesh) {
        // removed implementation: use this.enemyFactory.spawnGrey
        const enemy = this.enemyFactory.spawnGrey(targetPlayerMesh);
        this.enemies.push(enemy);
    }

    spawnDogfighter(targetPlayerMesh) {
        // removed implementation: use this.enemyFactory.spawnDogfighter
        const enemy = this.enemyFactory.spawnDogfighter(targetPlayerMesh);
        this.enemies.push(enemy);
    }

    spawnFighterSquad() {
        // Handled via factory, passing local enemy tracking array
        this.enemyFactory.spawnFighterSquad(this.enemies);
    }

    spawnPredator(targetPlayerMesh) {
        const enemy = this.enemyFactory.spawnPredator(targetPlayerMesh);
        this.enemies.push(enemy);
    }

    createExplosion(position, scale = 1.0) {
        playSound('explosion', 0.5 * scale);
        const particleCount = Math.floor(12 * scale);
        for (let i = 0; i < particleCount; i++) {
            let p;
            if (this.particlePool.length > 0) {
                p = this.particlePool.pop();
                p.mesh.visible = true;
                p.mesh.material.opacity = 1;
            } else {
                const geometry = new THREE.PlaneGeometry(2, 2);
                const material = new THREE.MeshBasicMaterial({
                    map: this.particleTexture,
                    color: 0x06f9f9,
                    transparent: true,
                    opacity: 0.8,
                    depthWrite: false,
                    blending: THREE.NormalBlending
                });
                const mesh = new THREE.Mesh(geometry, material);
                this.scene.add(mesh);
                p = { mesh, velocity: new THREE.Vector3() };
            }
            
            p.mesh.position.copy(position);
            p.mesh.scale.setScalar(scale * 0.5);
            p.velocity.set(
                (Math.random() - 0.5) * 25 * scale,
                (Math.random() - 0.5) * 25 * scale,
                (Math.random() - 0.5) * 25 * scale
            );
            p.life = 1.0;
            this.particles.push(p);
        }
    }

    update(dt, worldSpeed, playerPos, worldCurve = 0) {
        const lateralShift = -worldCurve * 30 * dt;

        if (this.enemyBehaviorSystem) {
            this.enemyBehaviorSystem.player = { position: playerPos };
        }

        // Update Coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const c = this.coins[i];
            c.mesh.position.z += worldSpeed * dt;
            c.mesh.position.x += lateralShift;
            c.mesh.rotation.z += c.rotationSpeed * dt;
            c.mesh.rotation.y += c.rotationSpeed * 0.5 * dt;

            if (c.mesh.position.z > 20) {
                this.scene.remove(c.mesh);
                this.coins.splice(i, 1);
            }
        }

        // Update Player Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.mesh.position.addScaledVector(b.velocity, dt);
            b.mesh.position.x += lateralShift;
            b.life -= dt;
            
            if (b.life <= 0) {
                b.mesh.visible = false;
                this.bulletPool.push(this.bullets.splice(i, 1)[0]);
            }
        }

        // Update Powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            const speedMult = p.isFixed ? 1.5 : 1.0; // Fixed arena items zoom in faster
            p.mesh.position.z += worldSpeed * dt * speedMult;
            p.mesh.position.x += lateralShift;
            p.mesh.rotation.y += dt * 2;
            p.mesh.rotation.x += dt;
            
            if (p.mesh.position.z > 20) {
                this.scene.remove(p.mesh);
                this.powerups.splice(i, 1);
            }
        }

        // Update Enemy Bullets
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const b = this.enemyBullets[i];
            b.mesh.position.addScaledVector(b.velocity, dt);
            b.mesh.position.x += lateralShift;
            
            if (b.mesh.position.z > 20) {
                b.mesh.visible = false;
                this.enemyBulletPool.push(this.enemyBullets.splice(i, 1)[0]);
            }
        }

        // Update Enemies (delegated to EnemyBehaviorSystem)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            this.enemyBehaviorSystem.updateEnemy(e, dt, worldSpeed, playerPos, worldCurve);
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.mesh.position.addScaledVector(p.velocity, dt);
            p.mesh.position.x += lateralShift;
            p.life -= dt;
            p.mesh.material.opacity = p.life;
            p.mesh.rotation.z += dt * 2;
            
            if (p.life <= 0) {
                p.mesh.visible = false;
                this.particlePool.push(this.particles.splice(i, 1)[0]);
            }
        }
    }

    checkCollisions(player, onScore, onDamage, onPowerup, onCoin) {
        // removed implementation: use CollisionSystem
        this.collisionSystem.checkCollisions(player, onScore, onDamage, onPowerup, onCoin);
    }
    
    reset() {
        this.bullets.forEach(b => this.scene.remove(b.mesh));
        this.bullets = [];
        this.enemyBullets.forEach(b => this.scene.remove(b.mesh));
        this.enemyBullets = [];
        this.enemies.forEach(e => this.scene.remove(e.mesh));
        this.enemies = [];
        this.particles.forEach(p => this.scene.remove(p.mesh));
        this.particles = [];
        this.powerups.forEach(p => this.scene.remove(p.mesh));
        this.powerups = [];
        this.coins.forEach(c => this.scene.remove(c.mesh));
        this.coins = [];
    }
}