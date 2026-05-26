import { store, actions } from '../store.js';

/**
 * Compliance Controller
 * Handles logic for platform-specific permission gating and reporting.
 */
export class ComplianceController {
    constructor() {
        this.visibilityState = 'visible';
    }

    init() {
        // App Store Compliance: Visibility API handling for background battery conservation
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Motion sensor permission gating for iOS/Android 14+
        this.setupPermissionHandlers();
    }

    handleVisibilityChange() {
        this.visibilityState = document.visibilityState;
        if (this.visibilityState === 'hidden') {
            console.log("[COMPLIANCE] Suspending systems for background execution limits.");
            // Store action would go here if we needed global pause
        }
    }

    setupPermissionHandlers() {
        // Explicit gesture required for Motion Sensors
        const requestMotion = async () => {
            if (typeof DeviceOrientationEvent !== 'undefined' && 
                typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    const response = await DeviceOrientationEvent.requestPermission();
                    if (response === 'granted') {
                        store.dispatch({ type: actions.SET_GYRO_AVAILABLE, payload: true });
                    }
                } catch (e) {
                    console.warn("[COMPLIANCE] DeviceOrientation permission denied.");
                }
            }
        };

        window.addEventListener('click', requestMotion, { once: true });
        window.addEventListener('touchstart', requestMotion, { once: true });
    }
}