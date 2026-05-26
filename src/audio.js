import { resolveAudioUrls } from './utils/audio-paths.js';

const sounds = {};
let audioCtx = null;
let tracksManifest = null;

/**
 * Initialize audio context and load core SFX immediately.
 * Then attempt to fetch /assets/music/tracks.json and load listed music tracks.
 */
export async function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Load immediate SFX
    await Promise.all([
        loadSound('laser', 'assets/sounds/laser.mp3'),
        loadSound('explosion', 'assets/sounds/explosion.mp3'),
        loadSound('powerup', 'assets/sounds/powerup.mp3')
    ]);

    // Try to load tracks manifest and enqueue music tracks using resolved candidate URLs
    try {
        const resp = await fetch('/assets/music/tracks.json');
        if (resp.ok) {
            tracksManifest = await resp.json();
            if (tracksManifest && Array.isArray(tracksManifest.tracks)) {
                await Promise.all(tracksManifest.tracks.map(async (t) => {
                    const key = t.id || t.file || t.title;
                    const fileRef = t.file || t.title || key;
                    const candidates = resolveAudioUrls(fileRef);
                    let loaded = false;
                    for (const url of candidates) {
                        try {
                            await loadSound(key, url);
                            loaded = true;
                            break;
                        } catch (err) {
                            // try next candidate
                        }
                    }
                    // final fallback: try basename unmodified (if not loaded)
                    if (!loaded && fileRef && !candidates.includes(fileRef)) {
                        try { await loadSound(key, fileRef); } catch (e) { /* ignore */ }
                    }
                }));
            }
        } else {
            // manifest fetch failed — attempt resilient loading of known defaults via resolver
            const defaults = [
                { id: 'bgm', file: 'assets/music/bgm.mp3' },
                { id: 'warp_theme', file: 'Polyverse_ The Warp Descent.mp3' },
                { id: 'starpulse', file: 'Stardust Pulse.mp3' }
            ];
            await Promise.all(defaults.map(async (t) => {
                const candidates = resolveAudioUrls(t.file);
                for (const url of candidates) {
                    try { await loadSound(t.id, url); break; } catch (e) {}
                }
            }));
        }
    } catch (e) {
        // Best-effort fallback using resolver for known defaults
        const defaults = [
            { id: 'bgm', file: 'assets/music/bgm.mp3' },
            { id: 'warp_theme', file: 'Polyverse_ The Warp Descent.mp3' },
            { id: 'starpulse', file: 'Stardust Pulse.mp3' }
        ];
        await Promise.all(defaults.map(async (t) => {
            const candidates = resolveAudioUrls(t.file);
            for (const url of candidates) {
                try { await loadSound(t.id, url); break; } catch (err) {}
            }
        }));
    }
}

/**
 * Load and decode a sound into the sounds map.
 * Throws on failure so callers can attempt alternate urls if desired.
 */
async function loadSound(name, url) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        sounds[name] = audioBuffer;
        return audioBuffer;
    } catch (e) {
        console.warn(`Failed to load sound [${name}] from ${url}:`, e);
        throw e;
    }
}

export function playSound(name, volume = 1.0, pitch = 1.0, loop = false) {
    if (!audioCtx || !sounds[name]) return;
    
    // Resume context if suspended (browser policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const source = audioCtx.createBufferSource();
    source.buffer = sounds[name];
    source.loop = loop;
    source.playbackRate.value = pitch;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    source.start(0);
    
    return source; // Return for stopping loops
}

let currentMusicSource = null;
let currentTrackName = null;

/**
 * Helper to play a music track by id (prefers manifest ids, falls back to name key)
 */
export function startMusic() {
    // Prefer manifest 'bgm' if present
    if (tracksManifest && tracksManifest.tracks) {
        const bg = tracksManifest.tracks.find(t => t.id === 'bgm') || tracksManifest.tracks[0];
        if (bg && sounds[bg.id]) {
            playMusic(bg.id, bg.volume ?? 0.4);
            return;
        }
    }
    playMusic('bgm');
}

export function playMusic(nameOrId, volume = 0.4) {
    const key = nameOrId;
    if (!sounds[key]) {
        // try to map from manifest by id -> use id as key, or fallback to file basename
        if (tracksManifest && tracksManifest.tracks) {
            const entry = tracksManifest.tracks.find(t => t.id === key || t.file?.includes(key) || t.title === key);
            if (entry && sounds[entry.id]) {
                return _startMusic(entry.id, entry.volume ?? volume);
            }
        }
        // fallback: if requested key not loaded, try to play any loaded bgm-like track
        const fallback = ['bgm', 'starpulse', 'warp_theme'].find(k => sounds[k]);
        if (fallback) return _startMusic(fallback, volume);
        return;
    }
    return _startMusic(key, volume);
}

function _startMusic(key, volume) {
    if (currentTrackName === key && currentMusicSource) return; // Already playing
    
    if (currentMusicSource) {
        try { 
            currentMusicSource.stop(); 
            currentMusicSource = null;
        } catch(e) { console.warn(e); }
    }

    // Small delay to prevent overlapping clicks/starts
    setTimeout(() => {
        currentMusicSource = playSound(key, volume, 1.0, true);
        currentTrackName = key;
    }, 50);
}