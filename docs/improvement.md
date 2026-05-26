# Improvement Opportunities Report — Spaceforce Squadron

Date: 2026-01-26
Author: Automated Audit Bot

Purpose
-------
A focused list of actionable improvements covering performance, UX, gameplay balance, persistence, security, and testability to raise stability, player engagement, and maintainability across the codebase.

Executive Summary
-----------------
This document highlights prioritized changes that will yield measurable gains in FPS stability, mobile ergonomics, network resilience, DB write-efficiency, UI clarity, accessibility, and extensibility for new content (levels, factions, items). Each item includes context, proposed change, estimated effort, and risk.

1) Reduce runtime GC and draw overhead (High priority)
   - Context: Large BufferGeometry allocations, frequent creation/disposal of Three.js Meshes (Player.setShipModel, EntityManager.createExplosion, EnemyFactory spawns) cause GC spikes on lower-end devices.
   - Proposed changes:
     - Expand and centralize object pools (bullets, enemyBullets, particles, coins, powerups, enemies) with clear size limits and warm-up on load.
     - Reuse BufferGeometry and Material instances where possible; avoid per-spawn geometry.clone() calls.
     - Batch small particle updates using instanced rendering (THREE.InstancedMesh) for explosions/coins/powerups.
     - Delay or lazy-load non-critical high-poly models, use LODs for s.gltf and fallback procedural meshes.
   - Estimated effort: 3–6 dev days.
   - Risk: Medium; requires careful pooling to avoid visual artifacts and leaks.

2) Audio initialization & policy-friendly autoplay (High priority)
   - Context: Audio context is created on demand; browsers may suspend it; manifest references tracks with spaces causing inconsistent fetch paths.
   - Proposed changes:
     - Normalize track file names and manifest file paths (avoid spaces) and prefer safe URL encoding when fetching.
     - Expose a user-friendly "audio consent" modal that clearly asks for audio permissions and resumes AudioContext reliably.
     - Fallback to HTMLAudioElement for long music tracks on low memory devices; use WebAudio for SFX.
   - Estimated effort: 1–2 dev days.
   - Risk: Low.

3) PoliticalEngine: tuning, dedupe, and eventing (Medium priority)
   - Context: PoliticalEngine dedupe key uses JSON.stringify(standings) which can be noisy; evaluateAndPersist may skip important micro-changes.
   - Proposed changes:
     - Replace snapshot key with a hashed fingerprint (e.g., simple stable sorted string or small hash) and add configurable sensitivity threshold.
     - Emit Websim Socket ephemeral event (political:report) in addition to store dispatch so other clients can react instantly without polling DB.
     - Add per-faction hysteresis to prevent oscillating spawn triggers when standing hovers near thresholds.
   - Estimated effort: 1–2 dev days.
   - Risk: Low.

4) SpawnController: deterministic scheduling & political influence smoothing (Medium priority)
   - Context: Random spawn thresholds and occasional Math.random() in many places can create unfair difficulty spikes.
   - Proposed changes:
     - Replace fully random triggers with seeded pseudo-random using remotion/random-like approach or deterministic PRNG seeded per-session for repeatability in simulations.
     - Smooth influence from faction gamification into spawn rates (exponential smoothing) and clamp the maximum spawnModifier effect to avoid sudden mass-hit-squad bursts.
     - Move heavy spawn decisions off the main frame into a timer-worker abstraction to avoid frame stalls (e.g., small setTimeout or worker-like tick).
   - Estimated effort: 2–4 dev days.
   - Risk: Medium.

5) Market/DB: transaction atomicity & UX confirmations (Medium priority)
   - Context: purchaseListing performs multiple independent writes (balance update, inventory create, listing update); partial failure can cause inconsistent states.
   - Proposed changes:
     - Implement simple server-side-style two-phase commit: mark listing as pending, perform buyer debit and inventory create, then finalize listing as sold; rollback on error (or mark failed and notify admin).
     - Add client-side purchase confirmation modal summarizing price, seller, and political consequences (e.g., buying from Helix may change standings).
     - Add optimistic UI updates with eventual reconciliation from DB to reduce perceived latency.
   - Estimated effort: 2–3 dev days.
   - Risk: Medium.

6) Multiplayer resilience & presence smoothing (Medium priority)
   - Context: Remote ships are added directly from presence and removed quickly if presence flickers; network jitter causes popping.
   - Proposed changes:
     - Implement presence state smoothing with short grace period (e.g., 5–10s) before removing remote ship to avoid flicker.
     - Interpolate remote ship positions/rotations to hide jitter and apply dead reckoning for bullets vs remote player checks.
     - Rate-limit presence updates from clients to avoid network abuse.
   - Estimated effort: 2–3 dev days.
   - Risk: Low.

7) Input & mobile ergonomics (High priority)
   - Context: Touch zones and nipple.js dynamic mode good but joystick zones are fixed elements; orientation lock overlay hides elements aggressively.
   - Proposed changes:
     - Make joystick zones adaptive (size/position) for device handedness and safe-area insets; expose "swap sticks" setting in SettingsController.
     - Improve gyro mixing and deadzone calibration UI, and persist chosen calibrations per device.
     - Ensure orientation overlay is dismissable with a clear action and provide fallback UI guidance for devices that cannot lock orientation.
   - Estimated effort: 1–2 dev days.
   - Risk: Low.

8) Accessibility & localization (Medium priority)
   - Context: UI relies heavily on icons and color; screen-reader annunciation & keyboard navigation limited.
   - Proposed changes:
     - Add ARIA labels to interactive elements (buttons, modals, important status panels); ensure focus management when modals open.
     - Add keyboard shortcuts for primary actions (launch, open market, toggle HUD).
     - Add i18n scaffolding for strings in UI templates (extractable JSON resource) to support translations.
   - Estimated effort: 2–4 dev days.
   - Risk: Low.

9) Security & input sanitization (High priority)
   - Context: Chat filtering uses a small forbidden word list; UGC still potentially risky.
   - Proposed changes:
     - Implement multi-layered UGC filtering pipeline: profanity filter, length & repetition throttling, blacklist/whitelist patterns; integrate server-side validation where possible.
     - Ensure any HTML insertion of user-generated strings uses DOMPurify-like sanitization (or escape via text nodes); replace innerHTML usage for user content with safe rendering.
   - Estimated effort: 2–3 dev days.
   - Risk: Low, but must be robust.

10) Tests, CI, and local dev aids (High priority)
    - Context: Many modules interact with remote Websim; difficult to unit test without shims.
    - Proposed changes:
      - Expand websim-shim to support controlled test fixtures and deterministic presence injection, and provide a test harness (src/tests/) with Jest-like assertions or simple runner.
      - Add end-to-end test scenarios to validate politicalEngine evaluateAndPersist flows, purchase flows, and spawn controller behavior under simulated standings.
      - Add linting and pre-commit formatting hooks.
    - Estimated effort: 3–6 dev days.
    - Risk: Medium (time investment upfront).

11) UI & UX polish (Low/Medium priority)
    - Context: Some modals, toggles, and feedback flows lack confirm/cancel states and accessible labels.
    - Proposed changes:
      - Standardize modal open/close behavior via ui-utils.toggleModal (ensure focus trapping).
      - Add transient toasts for success/failure (purchase, equip, save) rather than alert() which blocks main thread.
      - Replace alert() calls in MarketManager / DesignerController with a toast queue and optional audit log entry via db.addTransaction for significant events.
    - Estimated effort: 1–2 dev days.
    - Risk: Low.

12) Documentation & telemetry (Low priority)
    - Context: Good docs exist but operational runbooks and telemetry hooks are sparse.
    - Proposed changes:
      - Expose a lightweight metrics hook (window.game.telemetry.emit) to capture high-level events (purchase, purchaseFail, factionChange, hitSquadSpawn).
      - Add short Contrib.md describing local dev workflow, seeding steps (db.seedMarket), and how to reproduce political scenarios.
      - Add improvement tracking board / GitHub Issues template recommending priorities and owners.
    - Estimated effort: 1–2 dev days.
    - Risk: Low.

Appendix — Quick Wins (can be done within hours)
------------------------------------------------
- Replace JSON.stringify-based snapshot dedupe with stable-sorted key (PoliticalEngine).
- Avoid new AudioContext creation until user gesture; show clear "Enable Audio" button.
- Replace alert() uses with non-blocking toasts.
- Ensure asset paths without spaces in assets/music/tracks.json (or encode them).
- Add basic presence grace window (5s) before removing remoteShips.

Prioritization & Roadmap
------------------------
- Week 0: Quick wins (audio consent UI, snapshot key fix, replace alert() with toast).
- Sprint 1 (2 weeks): Pooling & instanced rendering refactor; market transaction atomicity.
- Sprint 2 (2 weeks): Multiplayer smoothing, spawn controller determinism, political engine refinement.
- Sprint 3 (2 weeks): Accessibility, tests, CI and i18n scaffolding.

Closing Notes
-------------
Addressing these items in the order above will yield tangible improvements to runtime performance, perceived responsiveness, multiplayer stability, player retention (via clearer feedback and fewer surprise spikes), and long-term maintainability.

If you'd like, I can start by implementing one of the Quick Wins (choose which) and provide the exact code edits required.

---

## Redundant Logic Findings (quick scan)
During a targeted review of the codebase, I identified recurring redundant logic patterns that can be consolidated to reduce maintenance cost and subtle bugs:

1. Duplicate audio track fallback blocks
   - Files: src/audio.js and usage sites.
   - Issue: Multiple places attempt identical fallbacks for tracks/paths (manifest parsing vs explicit load), resulting in repeated fetch/try-catch patterns.
   - Recommendation: Centralize manifest normalization + url resolution into a single helper and reuse it from audio init.

2. Repeated presence/peer UI construction
   - Files: src/multiplayer.js, src/ui.js, various HUD modules.
   - Issue: Multiple functions build similar DOM fragments for peer avatars/presence and handle empty fallbacks in-line.
   - Recommendation: Create a shared renderPresenceEntry(userMeta) helper and reuse it to ensure consistent avatars, trimming duplication.

3. Alert() usage for user feedback
   - Files: src/market.js, src/ui/designer/designer-controller.js, src/ui/designer/designer-controller.js (and others).
   - Issue: Several modules use blocking alert() calls for errors/confirmations instead of the existing toast utility.
   - Recommendation: Replace alert() with toastSafe or toast.* to preserve non-blocking UX.

4. Duplicate ship model fallback & scaling code
   - Files: src/player.js, src/designer/.../DesignerController, src/DesignerController/LoadoutController variations.
   - Issue: Multiple modules load `/s.gltf`, compute bounding box, scale, tint, and attach wireframes with nearly identical sequences.
   - Recommendation: Extract a shared shipModelLoader.loadAndPrepare(url, { tint, scaleTarget }) utility to avoid divergence.

5. Multiple implementations of "load templates" and modal toggle patterns
   - Files: src/ui.js (loadTemplates), ui-utils.toggleModal, and several controllers manually toggle display styles.
   - Issue: Inconsistent modal show/hide semantics (some use style.display, some toggle class 'open').
   - Recommendation: Standardize modal API via ui-utils.toggleModal and update all controllers to call it.

6. Repeated snapshot key creation logic in PoliticalEngine and other dedupe patterns
   - Files: src/political-engine.js and similar dedupe checks elsewhere.
   - Issue: Various modules create ad-hoc snapshot keys using JSON.stringify; duplicative and brittle.
   - Recommendation: Add small stableKey(obj, fields) helper or hash util to generate deterministic fingerprints.

7. Multiple places converting effect strings into numeric values
   - Files: src/player.js (parseVal), loadout/designer controllers, inventory parsing.
   - Issue: Re-implementation of the same percentage-parsing logic.
   - Recommendation: Extract parseEffectPercent(effectString, keywords[]) into utils to avoid inconsistent parsing defaults.

These findings are non-blocking but provide targeted quick wins for consolidation and lower future bug risk.