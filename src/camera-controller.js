export class CameraController {
    constructor(camera) {
        this.camera = camera;
        this.mode = 0; // 0: TPS, 1: FPS, 2: TOP
    }

    setMode(modeIndex) {
        this.mode = modeIndex;
    }

    cycleMode() {
        this.mode = (this.mode + 1) % 3;
        return this.mode;
    }

    update(playerMesh, worldCurve) {
        if (!playerMesh) return;
        const cam = this.camera;
        const pPos = playerMesh.position;
        const pRot = playerMesh.rotation;

        if (this.mode === 1) {
            cam.position.x = pPos.x;
            cam.position.y = pPos.y;
            cam.position.z = pPos.z - 2;
            cam.lookAt(pPos.x, pPos.y, pPos.z - 100);
            cam.rotation.z = pRot.z;
        } else if (this.mode === 2) {
            cam.position.set(pPos.x * 0.8, 50, pPos.z + 5);
            cam.lookAt(pPos.x, pPos.y, pPos.z - 30);
            cam.rotation.z = 0;
        } else {
            const dtFactor = 0.16; // small smoothing factor assuming ~60fps
            cam.position.x += (pPos.x * 0.3 - cam.position.x) * 4 * dtFactor;
            cam.position.y += ((pPos.y * 0.3 + 5) - cam.position.y) * 4 * dtFactor;
            cam.position.z = 15;
            cam.rotation.z = -(worldCurve * 0.15) - (pRot.z * 0.5);
            cam.lookAt(pPos.x * 0.1, pPos.y * 0.1, -50);
        }
    }
}