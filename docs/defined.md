# V129 Landing Page Animations

This document defines the core animations active during the Hangar/Landing state (Status: 'menu').

### 1. Orbital World Viewer
- **Controller**: `RendererManager.updateMenuCamera(dt)`
- **Behavior**: A slow, automated 360-degree orbital camera rotation around the world origin (Target Z: -50).
- **Parameters**: 0.15 rad/sec rotation speed, 45-unit radius, 18-unit height.

### 2. Holographic Sector HUD
- **Controller**: `LandingHUDAnimation` (src/animations/landing.js)
- **Asset**: `sflev.png` (SECTOR ALPHA tactical overlay)
- **Behavior**: 
    - **Vertical Oscillation**: Math.sin-driven floating motion (15-unit range).
    - **Opacity Pulse**: 0.5 to 0.8 transparency breathing effect (1.5 frequency).
    - **Scale Pulse**: Subtle size breathing (1.0 to 1.05).

### 3. Sparkling Stardust
- **Controller**: `StardustAnimation` (src/animations/stardust.js)
- **Density**: 1,800 active particles.
- **Behavior**:
    - **High-Frequency Shimmer**: Per-particle random offset seeds driving color intensity shifts (12x frequency).
    - **Cyan Color Shift**: Dynamic RGB calculation emphasizing blue/green channels.
    - **Environment Sync**: Particles drift based on world move speed and lateral curvature.

### 4. Ship Maintenance Hover
- **Controller**: `Player.update(dt, input)` (src/player.js)
- **Behavior**:
    - **Idle Bob**: Vertical Math.sin bobbing (0.15 unit range) to simulate anti-gravity suspension.
    - **Engine Flicker**: High-speed scale pulsing (20x frequency) on emissive materials and "engine_glow" meshes.

### 5. Deployment Transition (Hyperspace Jump)
- **Controller**: `Game.startGame(levelId)` (src/game.js)
- **Duration**: 1.8 seconds.
- **Behavior**:
    - **FOV Dilation**: Camera field of view expands from 60 to 100 based on a sine-curved warp factor.
    - **Vibration**: Camera shake intensity scales with hyperspace energy levels.
    - **Ship Entry**: The player mesh slides from Z: 50 to Z: 0 along an easing curve.

### 6. CRT Scanline Simulation
- **Controller**: CSS / HTML Overlays (src/styles.css)
- **Behavior**: Static repeating-linear-gradient and animated scan-lines (opacity 0.1-0.2) to provide a retro-futuristic terminal aesthetic.