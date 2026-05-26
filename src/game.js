import * as THREE from 'three';
import { World } from './world.js';
import { Player } from './player.js';
import { EntityManager } from './entities.js';
import { store, actions } from './store.js';
import { MultiplayerManager } from './multiplayer.js';
import { db } from './database.js';
import { RendererManager } from './renderer.js';
import { InputManager } from './input.js';
import { UIManager } from './ui.js';
import { HangarManager } from './hangar.js';
import { SpawnController } from './spawn-controller.js';
import { CameraController } from './camera-controller.js';
import { ComplianceController } from './compliance/controller.js';

export class Game {
    constructor() {
        // Make game instance globally accessible for market module
        window.game = this;
        
        this.multiplayer = new MultiplayerManager();
        this.multiplayer.init();
        
        db.init().then(() => this.loadUserData()).catch(e => console.error("DB Init Fail", e));

        this.rendererManager = new RendererManager();
        this.rendererManager.init(document.getElementById('canvas-container'));
        this.scene = this.rendererManager.scene;

        // Attach scene to multiplayer so it can render other pilots
        if (this.multiplayer) {
            this.multiplayer.setScene(this.scene);
        }

        this.initGameObjects(); 
        
        this.spawnController = new SpawnController(this, this.world, this.entities, this.multiplayer, this.player, store, this.scene);
        this.cameraController = new CameraController(this.rendererManager.camera);
        this.complianceController = new ComplianceController();
        this.complianceController.init();

        this.inputManager = new InputManager();
        this.inputManager.init();
        if(this.player) this.inputManager.setPlayerMesh(this.player.mesh);

        this.uiManager = new UIManager(this);
        
        this.hangarManager = new HangarManager(this);

        this.cameraMode = 0; // 0: TPS, 1: FPS, 2: TOP
        this.wakeLock = null;

        // Visibility handling for Play Store background execution compliance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseGame();
            } else {
                this.resumeGame();
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyV' && store.getState().status === 'playing') {
                this.toggleCameraMode();
            }
        });

        this.animate = this.animate.bind(this);
    }

    toggleCameraMode() {
        // removed inline camera mode math (moved to CameraController)
        this.cameraMode = this.cameraController ? this.cameraController.cycleMode() : (this.cameraMode + 1) % 3;
        const modes = ['TPS', 'FPS', 'TOP'];
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) {
            const div = document.createElement('div');
            div.className = 'chat-msg system';
            div.innerHTML = `<span class="chat-text">Camera: ${modes[this.cameraMode]}</span>`;
            chatContainer.appendChild(div);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    async loadUserData() {
        await this.hangarManager.loadUserData();
        
        const sub = await db.getSubFaction();
        if (sub) {
            store.dispatch({ type: actions.SET_SUBFACTION, payload: sub });
        }

        // Apply equipped loadout to player
        const state = store.getState();
        if (this.player && state.equipped) {
            const equipped = Object.values(state.equipped).filter(Boolean);
            this.player.applyLoadout(equipped, state.subFaction);
        }
    }

    showHangar() {
        this.releaseWakeLock();
        this.hangarManager.show();
        
        // Reset briefing panel
        const bp = document.getElementById('briefing-panel');
        if (bp) bp.style.display = 'none';
        
        // Reset all game systems
        if (this.player) {
            this.player.mesh.visible = false;
            this.player.reset();
        }
        if (this.entities) this.entities.reset();
        if (this.world) this.world.loadLevel(1); // Reset to default hangar environment
        
        // Reset spawn timers via controller
        if (this.spawnController) {
            this.spawnController.resetTimers();
        }
        
        // Reset clock to prevent delta time issues
        if (this.clock) this.clock = new THREE.Clock();
    }

    async startGame(levelId, mode = 'missions') {
        this.requestWakeLock();
        this.gameOverTriggered = false;
        this.hangarManager.hide();
        
        const hud = document.getElementById('game-hud');
        if (hud) hud.style.display = 'flex';
        
        const state = store.getState();
        if (this.player && state.equipped) {
            const equipped = Object.values(state.equipped).filter(Boolean);
            this.player.applyLoadout(equipped, state.subFaction);
        }

        // Broadcast mission join to room so other pilots see activity in mission/chat
        try {
            if (this.multiplayer && this.multiplayer.room && this.multiplayer.currentUser) {
                this.multiplayer.room.send({
                    type: 'mission:join',
                    username: this.multiplayer.currentUser.username,
                    levelId: levelId,
                    echo: true
                });
            }
        } catch (e) {
            console.warn('Failed to send mission join event', e);
        }
        
        const maxHealth = this.player ? this.player.getMaxHealth() : 100;
        store.dispatch({ type: actions.START_GAME, payload: { maxHealth, mode } });
        
        if (this.player) {
            this.player.mesh.visible = true;
            this.player.mesh.position.set(0, 0, 50); // Start slightly behind for entry animation
        }
        
        if (this.world) this.world.loadLevel(levelId);
        if (this.entities) this.entities.setLevel(levelId);

        this.restart();

        // V129 Hyperspace Jump Animation
        const startTime = performance.now();
        const duration = 1800; // 1.8s jump
        
        const warpAnimate = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease in/out curve
            const t = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            if (this.world) this.world.warpFactor = Math.sin(progress * Math.PI);
            if (this.rendererManager) {
                this.rendererManager.camera.fov = 60 + (this.world.warpFactor * 40);
                this.rendererManager.camera.updateProjectionMatrix();
                if (progress < 0.8) this.rendererManager.shake(this.world.warpFactor * 0.8);
            }

            if (this.player) {
                // Fly ship into position
                this.player.mesh.position.z = 50 * (1 - progress);
            }

            if (progress < 1) {
                requestAnimationFrame(warpAnimate);
            } else {
                if (this.world) this.world.warpFactor = 0;
                if (this.rendererManager) {
                    this.rendererManager.camera.fov = 60;
                    this.rendererManager.camera.updateProjectionMatrix();
                }
            }
        };
        requestAnimationFrame(warpAnimate);
    }

    initGameObjects() {
        // World initialized with default level 1, updated via startGame
        this.world = new World(this.scene);
        this.player = new Player(this.scene);
        this.entities = new EntityManager(this.scene);
        
        this.clock = new THREE.Clock();
        // removed inline spawn timer initialization (handled in SpawnController)

        store.dispatch({ type: actions.START_GAME });
    }

    animate() {
        requestAnimationFrame(this.animate);
        
        const state = store.getState();

        if (state.status === 'menu') {
            if (this.world && this.clock) {
                const dt = Math.min(this.clock.getDelta(), 0.1);
                // World viewer-style camera orbit in menu/hangar
                this.rendererManager.updateMenuCamera(dt);
                this.world.update(dt, 0); 
                this.rendererManager.render();
            } else {
                this.rendererManager.render();
            }
            return;
        }
        
        if (state.status === 'gameover') {
            // Trigger game over sequence if not already done
            if (!this.gameOverTriggered) {
                this.gameOverTriggered = true;
                this.gameOver(state.score);
            }
            this.rendererManager.render();
            return;
        }
        
        if (state.status !== 'playing') {
            this.rendererManager.render();
            return;
        }

        const dt = (this.isPausedInternally) ? 0 : Math.min(this.clock.getDelta(), 0.1);

        const input = this.inputManager.update();
        
        const worldCurve = this.world.update(dt, state.score);
        
        // removed inline enemy / powerup / coin spawn logic (moved to SpawnController)
        if (this.spawnController) {
            this.spawnController.update(dt, worldCurve);
        }

        this.entities.update(dt, this.world.moveSpeed, this.player.mesh.position, worldCurve);
        
        const firingState = this.player.update(dt, input);
        
        // Primary Fire (Left Click)
        if (firingState.primary || firingState === true) { // Handle legacy boolean return just in case
            const pos = this.player.mesh.position;
            const ammoType = this.player.loadoutBonuses?.ammoType || 'default';
            this.entities.spawnBullet(pos, 0, ammoType);
            
            let shotCount = 1;
            if (this.player.weaponLevel >= 1) {
                this.entities.spawnBullet(pos, -0.15, ammoType);
                this.entities.spawnBullet(pos, 0.15, ammoType);
                shotCount += 2;
            }
            if (this.player.weaponLevel >= 2) {
                this.entities.spawnBullet(pos, -0.3, ammoType);
                this.entities.spawnBullet(pos, 0.3, ammoType);
                shotCount += 2;
            }
            
            store.dispatch({ type: actions.RECORD_METRIC, payload: { type: 'shot', count: shotCount } });
        }

        // Secondary Fire (Right Click)
        if (firingState.secondary) {
            const pos = this.player.mesh.position;
            this.entities.spawnMissile(pos);
            store.dispatch({ type: actions.RECORD_METRIC, payload: { type: 'shot', count: 1 } });
        }

        this.entities.checkCollisions(this.player, 
            (points) => {
                const bonus = this.player?.loadoutBonuses?.scoreMultiplier || 1.0;
                const finalPoints = Math.floor(points * bonus);
                store.dispatch({ type: actions.ADD_SCORE, payload: finalPoints });
                store.dispatch({ type: actions.RECORD_METRIC, payload: { type: 'kill' } });
            },
            (damage) => {
                store.dispatch({ type: actions.TAKE_DAMAGE, payload: damage });
                if (this.rendererManager) this.rendererManager.shake(damage * 0.05);
                
                // Trigger damage flash
                const flash = document.getElementById('damage-flash');
                if (flash) {
                    flash.classList.remove('active');
                    void flash.offsetWidth; // Force reflow
                    flash.classList.add('active');
                }

                // Haptic feedback: vibrate pattern scaled to damage severity
                try {
                    if ('vibrate' in navigator) {
                        if (damage <= 10) {
                            navigator.vibrate(40); // light tap
                        } else if (damage <= 30) {
                            navigator.vibrate([60, 30, 60]); // medium pulse
                        } else {
                            navigator.vibrate([120, 40, 90, 40, 120]); // strong pattern
                        }
                    }
                } catch (e) {
                    // ignore vibration errors silently
                }
            },
            (powerupType) => this.handlePowerup(powerupType),
            (coinValue) => {
                const bonus = (this.player && this.player.loadoutBonuses) ? (this.player.loadoutBonuses.creditsMultiplier || 1.0) : 1.0;
                const finalVal = Math.floor(coinValue * bonus);
                store.dispatch({ type: actions.ADD_CREDITS, payload: finalVal });
                
                if (typeof db !== 'undefined' && db.addTransaction) {
                    db.addTransaction('loot', finalVal, `Collected UNI Coin (Bonus x${bonus.toFixed(1)})`).catch(console.error);
                    // Collecting coins in controlled space slightly improves standing
                    if (this.world && this.world.levelId === 1) {
                        db.updateFactionStanding('spaceforce', 0.1);
                    }
                }
            }
        );
        
        // removed inline PvP bullet vs remote players logic (handled in SpawnController.handlePvPBulletHits)

        if (this.cameraController) {
            this.cameraController.setMode(this.cameraMode);
            this.cameraController.update(this.player.mesh, worldCurve);
        }

        this.rendererManager.render();
    }

    async gameOver(finalScore) {
        const currentState = store.getState();
        if (currentState.status !== 'gameover') {
             store.dispatch({ type: actions.GAME_OVER });
        }
        
        const state = store.getState();
        const duration = (Date.now() - state.metrics.startTime) / 1000;
        
        const sessionPayload = {
            score: finalScore,
            ...state.metrics,
            duration: duration,
            endTime: Date.now() 
        };

        await db.saveSession(sessionPayload);

        // Award credits based on final score
        const creditsEarned = Math.floor(finalScore / 10);
        try {
            await db.addTransaction('reward', creditsEarned, `Mission Complete - Score: ${finalScore}`);
        } catch (e) {
            console.error('Failed to award mission credits:', e);
        }

        if (this.multiplayer) {
            this.multiplayer.submitScore(finalScore);
        }

        // Reputation gain with SpaceForce for surviving/completing sorties
        if (finalScore > 1000) {
            db.updateFactionStanding('spaceforce', 2);
        }
    }

    handlePowerup(type) {
        store.dispatch({ type: actions.RECORD_METRIC, payload: { type: 'powerup' } });

        if (type === 'health') {
            store.dispatch({ type: actions.HEAL, payload: 25 });
        } else if (type === 'rapid') {
            this.player.enableRapidFire();
        } else if (type === 'spread') {
            this.player.upgradeWeapon();
        }
    }

    pauseGame() {
        if (store.getState().status === 'playing') {
            this.isPausedInternally = true;
            // Optionally show a pause overlay or just stop the clock
        }
    }

    resumeGame() {
        this.isPausedInternally = false;
        if (this.clock) this.clock.getDelta(); // Reset delta to avoid large jump
        if (document.visibilityState === 'visible') {
            this.requestWakeLock();
        }
    }

    async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
            } catch (err) {
                console.warn(`Wake Lock request failed: ${err.name}, ${err.message}`);
            }
        }
    }

    releaseWakeLock() {
        if (this.wakeLock) {
            this.wakeLock.release().then(() => {
                this.wakeLock = null;
            });
        }
    }

    restart() {
        this.gameOverTriggered = false; // Reset flag for next session

        // Reset runtime objects but keep current game mode and maxHealth
        if (this.player) this.player.reset();
        if (this.entities) this.entities.reset();

        if (this.spawnController) {
            this.spawnController.resetTimers();
        }

        // Fresh clock for stable delta times
        this.clock = new THREE.Clock();
    }

    /**
     * Finalize async initialization tasks that were moved out of the constructor.
     * This ensures callers can await full initialization (multiplayer, DB, UI, hangar).
     */
    async finalizeInit() {
        try {
            // Initialize multiplayer and database
            try {
                await this.multiplayer.init();
            } catch (merr) {
                console.warn("Multiplayer init warning:", merr);
            }

            try {
                await db.init();
            } catch (derr) {
                console.warn("DB init warning:", derr);
            }

            // Initialize UI
            try {
                await this.uiManager.init();
                console.log("UI Initialized");
            } catch (uerr) {
                console.error("UI Initialization Failed:", uerr);
            }

            // Remove loading screen if present
            const loader = document.getElementById('loading-overlay');
            if (loader) loader.style.display = 'none';

            // Hangar setup
            this.hangarManager.init();
            this.showHangar();

            // Start main loop
            requestAnimationFrame(this.animate);
        } catch (err) {
            console.error("Game finalizeInit failed:", err);
            const loader = document.getElementById('loading-overlay');
            const errLog = document.getElementById('error-log');
            if (loader && errLog) {
                document.getElementById('loading-status').innerText = 'INIT FAILED';
                errLog.style.display = 'block';
                errLog.innerText += `\nFINALIZE INIT ERROR: ${err.message}`;
            }
            // Start loop anyway to allow fallback behavior
            requestAnimationFrame(this.animate);
        }
    }
}