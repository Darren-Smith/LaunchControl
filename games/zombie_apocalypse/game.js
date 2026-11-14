/**
 * Zombie Apocalypse - 2D Side-Scrolling Survival Game
 * Leo the Zombie Hunter is one of the eventual characters
 * Core Game Engine, Input Handling, Physics, and Rendering
 */

// Game State Constants
const STATE_INTRO = 'intro';
const STATE_PLAYING = 'playing';
const STATE_GAMEOVER = 'gameover';
const STATE_LEVEL_COMPLETE = 'level_complete';
const STATE_PAUSED = 'paused';
const MAX_LEVELS = 3;

// BGM
const bgmMenu = new Audio('sounds/bgm_menu.wav'); bgmMenu.loop = true;
const bgmLevel1 = new Audio('sounds/bmg-Level.wav'); bgmLevel1.loop = true;
const bgmLevel2 = new Audio('sounds/bmg-Level.wav'); bgmLevel2.loop = true;
const bgmLevel3 = new Audio('sounds/bmg-Level.wav'); bgmLevel3.loop = true;
const bgmLevelComplete = new Audio('sounds/bgm_level_complete.wav');
const bgmVictory = new Audio('sounds/bgm_victory.wav'); bgmVictory.loop = true;
const bgmGameOver = new Audio('sounds/bgm_game_over.wav');

// SFX
const sfxShoot = new Audio('sounds/sfx_shoot.wav');
const sfxGrenadeThrow = new Audio('sounds/sfx_grenade_throw.wav');
const sfxExplosion = new Audio('sounds/sfx_explosion.wav');
const sfxZombieSpawn = new Audio('sounds/sfx_zombie_spawn.wav');
const sfxZombieDmg = [
    new Audio('sounds/zombie-dmg1.wav'),
    new Audio('sounds/zombie-dmg2.wav'),
    new Audio('sounds/zombie-dmg3.wav'),
    new Audio('sounds/zombie-dmg4wav.wav'),
    new Audio('sounds/zombie-dmg6.wav')
];
const sfxZombieDie = [
    new Audio('sounds/zombie-die1.wav'),
    new Audio('sounds/zombie-die2.wav')
];
const sfxPlayerHit = new Audio('sounds/sfx_player_hit.wav');
const sfxCoinDrop = new Audio('sounds/sfx_coin_drop.wav');
const sfxCoinPickup = new Audio('sounds/sfx_coin_pickup.wav');
const sfxKeyPickup = new Audio('sounds/sfx_key_pickup.wav');
const sfxUiClick = new Audio('sounds/sfx_ui_click.wav');
const sfxBossRoar = new Audio('sounds/sfx_boss_roar.wav');
const sfxBossGrowl = new Audio('sounds/sfx_boss_growl.wav');
const sfxBossSnarl = new Audio('sounds/sfx_boss_snarl.wav');
const bossSounds = [sfxBossRoar, sfxBossGrowl, sfxBossSnarl];

let soundEffectsEnabled = true;
let musicEnabled = true;

let activeSounds = 0;
const MAX_CONCURRENT_SOUNDS = 10;

// Helper function to play SFX (allows concurrent playback)
function playSound(audioObj) {
    if (!soundEffectsEnabled || !audioObj) return;
    if (activeSounds >= MAX_CONCURRENT_SOUNDS) return; // Cap reached
    
    const clone = audioObj.cloneNode();
    clone.volume = 0.5; // Adjust volume as needed
    
    activeSounds++;
    clone.onended = () => {
        activeSounds--;
    };
    
    clone.play().catch(e => {
        activeSounds--;
        console.log('Audio play error:', e);
    });
}

let currentBgm = null;
function playBGM(bgmObj) {
    if (currentBgm === bgmObj) return;
    if (currentBgm) {
        currentBgm.pause();
        currentBgm.currentTime = 0;
    }
    currentBgm = bgmObj;
    if (currentBgm && musicEnabled) {
        currentBgm.volume = 0.4;
        currentBgm.play().catch(e => console.log('BGM play error:', e));
    }
}

// Attempt to play BGM immediately (may be blocked by browser autoplay policies)
// We wrap this in a setTimeout to ensure all variables (like gameState) are initialized
setTimeout(() => {
    if (typeof gameState !== 'undefined' && gameState === STATE_INTRO) {
        playBGM(bgmMenu);
    }
}, 0);

// Ensure menu BGM starts after first interaction if blocked
const initAudio = () => {
    if (typeof gameState !== 'undefined' && gameState === STATE_INTRO && currentBgm !== bgmMenu) {
        playBGM(bgmMenu);
    }
    document.body.removeEventListener('click', initAudio);
    document.body.removeEventListener('keydown', initAudio);
    document.body.removeEventListener('touchstart', initAudio);
};
document.body.addEventListener('click', initAudio);
document.body.addEventListener('keydown', initAudio);
document.body.addEventListener('touchstart', initAudio);

// Canvas Setup
const leoImg = new Image(); leoImg.src = 'images/leo_sprite.png';
const zombieImg = new Image(); zombieImg.src = 'images/zombie_sprite.png';
const bgImg = new Image(); bgImg.src = 'images/city_backdrop.png';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const canvasWrapper = document.getElementById('game-canvas-wrapper');

// World and Camera Configuration
let WORLD_WIDTH = canvas.width * 3; // 3600
let WORLD_HEIGHT = canvas.height * 3;   // 3000
let camera = { x: 0, y: 0 };
const ZOMBIE_COLS = 6;
const ZOMBIE_ROWS = 5;
let currentLevel = 1;
let bgCanvas = null;

// Offscreen Light Canvas for Dynamic Ambient Shadow Masking
const lightCanvas = document.createElement('canvas');
lightCanvas.width = canvas.width;
lightCanvas.height = canvas.height;
const lightCtx = lightCanvas.getContext('2d');

// UI DOM Elements
const introScreen = document.getElementById('intro-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const levelCompleteScreen = document.getElementById('level-complete-screen');
const winScreen = document.getElementById('win-screen');
const hud = document.getElementById('hud');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const nextLevelBtn = document.getElementById('next-level-btn');
const winRestartBtn = document.getElementById('win-restart-btn');
const unlockToast = document.getElementById('unlock-toast');

// HUD Stats Counter DOM Elements
const coinCountText = document.getElementById('coin-count');
const grenadeCountText = document.getElementById('grenade-count');
const zombieSlainCountText = document.getElementById('zombie-slain-count');
const keyCountText = document.getElementById('key-count');
const healthBarFill = document.getElementById('health-bar-fill');
const healthText = document.getElementById('health-text');
const grenadesContainer = document.getElementById('grenades-container');
const levelLabel = document.getElementById('level-label');
const levelNameLabel = document.getElementById('level-name-label');

// Game Over Statistics
const statZombies = document.getElementById('stat-zombies');
const statCoins = document.getElementById('stat-coins');
const statTime = document.getElementById('stat-time');

// Level Complete Statistics
const lcStatZombies = document.getElementById('lc-stat-zombies');
const lcStatCoins = document.getElementById('lc-stat-coins');
const lcStatTime = document.getElementById('lc-stat-time');

// Win Statistics
const winStatZombies = document.getElementById('win-stat-zombies');
const winStatCoins = document.getElementById('win-stat-coins');
const winStatTime = document.getElementById('win-stat-time');

// Game Variables
let gameState = STATE_INTRO;
let lastTime = 0;
let timeSurvived = 0;
let zombiesKilled = 0;
let showColliders = false; // Developer toggle for colliders
let totalCoinsCollected = 0;
let activeCoins = 0; // Current coins player has
let screenShake = 0;
let lastGrenadeAwardAt = 0; // Tracks last coin threshold for grenade award
let grenadeUnlocked = true; // Always unlocked

// Entity Containers
let player = null;
let bullets = [];
let zombies = [];
let coins = [];
let grenades = [];
let particles = [];
let bloodDecals = [];
let explosions = [];
let levelKeys = [];
let keysCollected = 0;
let levelGate = null;
let powerUps = [];
let destructibles = [];
let floatingTexts = [];
let activeDialogues = [];
let randomBarkTimer = 15;
let allZombiesClearedTriggered = false;

function showDialogue(target, text, duration, color = 'white', bgColor = 'rgba(0, 0, 0, 0.8)') {
    activeDialogues.push({
        target,
        text,
        duration,
        color,
        bgColor
    });
}

// Spawner Settings
let zombieSpawnTimer = 0;
let zombieSpawnInterval = 2000; // ms
const minSpawnInterval = 500;   // ms
let gameElapsedTime = 0;

// Keyboard & Mouse Inputs
const keys = {};
let autoAimEnabled = true; // default ON
const mouse = { x: 0, y: 0, isDown: false };

/* ==========================================================================
   INPUT LISTENERS
   ========================================================================== */

function isNameEntryActive() {
    const overlay = document.getElementById('name-entry-overlay');
    return Boolean(overlay && !overlay.classList.contains('hidden'));
}

function isModalOpen(id) {
    const el = document.getElementById(id);
    return Boolean(el && !el.classList.contains('hidden'));
}

window.addEventListener('keydown', (e) => {
    // Allow normal typing when entering high score name
    if (isNameEntryActive()) {
        if (e.code === 'Escape') {
            e.preventDefault();
        }
        return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
    // Register both code and key for broader compatibility
    keys[e.code] = true;
    if (e.key) {
        keys[e.key] = true;
    }

    // Info modal close or toggle ('I' or '?')
    if ((e.code === 'KeyI' || e.key === '?') && !e.repeat) {
        if (isModalOpen('info-modal')) {
            closeInfoModal();
        } else if (!isModalOpen('highscore-modal')) {
            openInfoModal();
        }
        return;
    }

    // Escape handling: close topmost modal first, otherwise toggle pause
    if (e.code === 'Escape' && !e.repeat) {
        if (isModalOpen('info-modal')) {
            closeInfoModal();
            return;
        }
        if (isModalOpen('highscore-modal')) {
            closeHighScoreModal();
            return;
        }
        togglePause();
        return;
    }

    // Keyboard menu navigation when not actively playing
    if (gameState !== STATE_PLAYING || isModalOpen('info-modal') || isModalOpen('highscore-modal')) {
        if (isModalOpen('info-modal') && (e.code === 'ArrowUp' || e.code === 'ArrowDown')) {
            const body = document.getElementById('info-modal-body');
            if (body) body.scrollTop += (e.code === 'ArrowDown' ? 48 : -48);
            return;
        }
        if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') {
            moveMenuFocus(-1);
            return;
        }
        if (e.code === 'ArrowDown' || e.code === 'ArrowRight') {
            moveMenuFocus(1);
            return;
        }
        if (e.code === 'Enter' && !e.repeat) {
            e.preventDefault();
            activateFocusedMenuElement();
            return;
        }
    }

    // Toggle Pause with P
    if (e.code === 'KeyP' && !e.repeat) {
        if (!isModalOpen('info-modal') && !isModalOpen('highscore-modal')) {
            togglePause();
        }
        return;
    }

    // Developer toggle for colliders on F3
    if (e.code === 'F3' && !e.repeat) {
        e.preventDefault();
        showColliders = !showColliders;
    }

    // Toggle Auto-Aim with Shift key - only on first press, not repeat
    if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !e.repeat) {
        autoAimEnabled = !autoAimEnabled;
        updateAutoAimIndicator();
    }

    // Throw Grenade on E or G
    if ((e.code === 'KeyE' || e.code === 'KeyG') && gameState === STATE_PLAYING) {
        e.preventDefault(); // Stop page scrolling
        fireGrenade();
    }

    // Shoot primary weapon on Space
    if (e.code === 'Space' && gameState === STATE_PLAYING) {
        e.preventDefault(); // Stop page scrolling
        fireBullet();
    }

    // DEBUG SHORTCUTS: 'c' to add 25 coins, 'k' to instantly eliminate all current zombies
    if (gameState === STATE_PLAYING) {
        if (e.code === 'KeyC') {
            activeCoins += 25;
            totalCoinsCollected += 25;
            updateHUD();
        }
        if (e.code === 'KeyK') {
            zombies.forEach(zombie => {
                zombie.health = 0;
                zombie.die();
            });
            zombies = [];
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (e.key) {
        keys[e.key] = false;
    }
});

// Update mouse coordinates relative to canvas bounding client rect
let lastMouseMoveAt = 0;
function updateMouseCoords(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
    lastMouseMoveAt = performance.now();
}

canvas.addEventListener('mousemove', updateMouseCoords);
window.addEventListener('mousemove', (e) => {
    // Keep tracking even if cursor drifts outside canvas border slightly
    if (gameState === STATE_PLAYING) {
        updateMouseCoords(e);
    }
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left click
        mouse.isDown = true;
        if (gameState === STATE_PLAYING) {
            fireBullet();
        }
    }
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
        mouse.isDown = false;
    }
});

// Button Actions
startBtn.addEventListener('click', () => { playSound(sfxUiClick); startLevel(1); });
restartBtn.addEventListener('click', () => { playSound(sfxUiClick); startLevel(1); });
nextLevelBtn.addEventListener('click', () => { playSound(sfxUiClick); startLevel(currentLevel + 1); });
winRestartBtn.addEventListener('click', () => { playSound(sfxUiClick); startLevel(1); });

// Main Menu button on game-over screen and level-complete screen
document.getElementById('main-menu-btn').addEventListener('click', () => { playSound(sfxUiClick); goToMainMenu(); });
document.getElementById('win-menu-btn').addEventListener('click', () => { playSound(sfxUiClick); goToMainMenu(); });
document.getElementById('lc-menu-btn').addEventListener('click', () => { playSound(sfxUiClick); goToMainMenu(); });

// Pause Menu & HUD Action Buttons
document.getElementById('pause-continue-btn').addEventListener('click', () => { playSound(sfxUiClick); resumeGame(); });
document.getElementById('pause-restart-btn').addEventListener('click', () => { playSound(sfxUiClick); restartCurrentLevel(); });
document.getElementById('pause-info-btn').addEventListener('click', () => { playSound(sfxUiClick); openInfoModal(); });
document.getElementById('pause-menu-btn').addEventListener('click', () => { playSound(sfxUiClick); goToMainMenu(); });
document.getElementById('pause-highscore-btn').addEventListener('click', () => { playSound(sfxUiClick); showHighScoreModal(false); });

document.getElementById('hud-pause-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    playSound(sfxUiClick);
    togglePause();
});
document.getElementById('hud-info-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    playSound(sfxUiClick);
    openInfoModal();
});

// Splash & End-Screen Modal Buttons
document.getElementById('info-btn').addEventListener('click', () => { playSound(sfxUiClick); openInfoModal(); });
document.getElementById('info-close-btn').addEventListener('click', () => { playSound(sfxUiClick); closeInfoModal(); });
document.getElementById('info-close-top-btn').addEventListener('click', () => { playSound(sfxUiClick); closeInfoModal(); });
document.getElementById('info-modal').addEventListener('click', (e) => {
    if (e.target.id === 'info-modal') {
        playSound(sfxUiClick);
        closeInfoModal();
    }
});

document.getElementById('highscores-btn').addEventListener('click', () => { playSound(sfxUiClick); showHighScoreModal(false); });
document.getElementById('win-highscore-btn').addEventListener('click', () => { playSound(sfxUiClick); showHighScoreModal(false); });
document.getElementById('gameover-highscore-btn').addEventListener('click', () => { playSound(sfxUiClick); showHighScoreModal(false); });
document.getElementById('highscore-close-top').addEventListener('click', () => { playSound(sfxUiClick); closeHighScoreModal(); });
document.getElementById('highscore-modal').addEventListener('click', (e) => {
    if (e.target.id === 'highscore-modal') {
        playSound(sfxUiClick);
        closeHighScoreModal();
    }
});

document.getElementById('sfx-toggle').addEventListener('click', function() {
    soundEffectsEnabled = !soundEffectsEnabled;
    this.setAttribute('aria-checked', String(soundEffectsEnabled));
    if (soundEffectsEnabled) {
        this.classList.add('on');
        playSound(sfxUiClick);
    } else {
        this.classList.remove('on');
    }
});

document.getElementById('music-toggle').addEventListener('click', function() {
    musicEnabled = !musicEnabled;
    this.setAttribute('aria-checked', String(musicEnabled));
    if (musicEnabled) {
        this.classList.add('on');
        playSound(sfxUiClick);
        if (currentBgm) {
            currentBgm.volume = 0.4;
            currentBgm.play().catch(e => console.log('BGM play error:', e));
        }
    } else {
        this.classList.remove('on');
        if (currentBgm) {
            currentBgm.pause();
        }
    }
});

function openInfoModal() {
    if (gameState === STATE_PLAYING) {
        togglePause();
    }
    document.getElementById('info-modal').classList.remove('hidden');
    syncMenuFocus();
    updateCursorVisibility();
}

function closeInfoModal() {
    document.getElementById('info-modal').classList.add('hidden');
    syncMenuFocus();
    updateCursorVisibility();
}

function restartCurrentLevel() {
    document.getElementById('pause-screen').classList.add('hidden');
    // Restore score/kills to start of current level so restarting doesn't inflate score
    zombiesKilled = levelStartZombiesKilled;
    totalCoinsCollected = levelStartTotalCoins;
    activeCoins = levelStartActiveCoins;
    startLevel(currentLevel, true);
}

function togglePause() {
    if (gameState === STATE_PLAYING) {
        gameState = STATE_PAUSED;
        document.getElementById('pause-screen').classList.remove('hidden');
        document.getElementById('pause-stat-zombies').textContent = zombiesKilled;
        document.getElementById('pause-stat-coins').textContent = totalCoinsCollected;
        document.getElementById('pause-stat-time').textContent = timeSurvived.toFixed(1) + 's';
        document.getElementById('pause-stat-lives').textContent = player ? player.lives : 0;
        syncMenuFocus();
        updateCursorVisibility();
    } else if (gameState === STATE_PAUSED) {
        resumeGame();
    }
}

function resumeGame() {
    if (gameState === STATE_PAUSED) {
        closeInfoModal();
        closeHighScoreModal();
        gameState = STATE_PLAYING;
        document.getElementById('pause-screen').classList.add('hidden');
        clearMenuFocus();
        updateCursorVisibility();
    }
}

function goToMainMenu() {
    playBGM(bgmMenu);
    gameState = STATE_INTRO;
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('level-complete-screen').classList.add('hidden');
    document.getElementById('win-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('info-modal').classList.add('hidden');
    document.getElementById('highscore-modal').classList.add('hidden');
    document.getElementById('name-entry-overlay').classList.add('hidden');
    
    introScreen.classList.remove('hidden');
    hud.classList.add('hud-hidden');
    syncMenuFocus();
    updateCursorVisibility();
}

/* ==========================================================================
   PARTICLE SYSTEM
   ========================================================================== */

class Particle {
    constructor(x, y, vx, vy, color, radius, maxLife, gravity = 0, type = 'normal') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.radius = radius;
        this.life = maxLife;
        this.maxLife = maxLife;
        this.gravity = gravity;
        this.type = type;
    }

    update(dt) {
        this.x += this.vx * 60 * dt;
        this.y += this.vy * 60 * dt;
        this.vy += this.gravity * 60 * dt;
        this.life -= dt * 1000;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;

        if (this.type === 'fire') {


        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function checkMapCollision(x, y, radius = 0, ignoreWater = false, ignoreFence = false) {
    if (typeof window === 'undefined' || !window.mapGrid || !window.tileSize) return false;
    // Check 4 corners of the bounding box if radius > 0
    const points = [
        {x: x, y: y},
        {x: x - radius, y: y - radius},
        {x: x + radius, y: y - radius},
        {x: x - radius, y: y + radius},
        {x: x + radius, y: y + radius}
    ];

    for (let p of points) {
        const c = Math.floor(p.x / window.tileSize);
        const r = Math.floor(p.y / window.tileSize);
        
        if (r >= 0 && r < window.mapGrid.length && c >= 0 && c < window.mapGrid[0].length) {
            const tileId = window.mapGrid[r][c];
            if (window.impassableTiles && window.impassableTiles.includes(tileId)) {
                if (ignoreWater && [4, 30, 31, 32, 33].includes(tileId)) continue;
                if (ignoreFence && tileId === 6) continue;
                return true;
            }
        }
    }
    return false;
}

function spawnSplatter(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const radius = 1.5 + Math.random() * 2.5;
        const life = 200 + Math.random() * 300;
        particles.push(new Particle(x, y, vx, vy, color, radius, life, 0.08, 'blood'));
    }
}

function spawnExplosionParticles(x, y, count = 40) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        // Alternate between fire colors (orange, yellow, red) and grey smoke particles
        const coinFlip = Math.random();
        let color, radius, life, gravity, type;

        if (coinFlip < 0.5) {
            // Flame particle
            color = `rgb(255, ${Math.floor(100 + Math.random() * 155)}, 0)`;
            radius = 3 + Math.random() * 5;
            life = 400 + Math.random() * 400;
            gravity = -0.05; // Fire drifts slightly up
            type = 'fire';
        } else {
            // Smoke particle
            const grayVal = Math.floor(40 + Math.random() * 60);
            color = `rgba(${grayVal}, ${grayVal}, ${grayVal}, 0.8)`;
            radius = 6 + Math.random() * 8;
            life = 800 + Math.random() * 600;
            gravity = -0.02; // Smoke drifts slowly up
            type = 'smoke';
        }

        particles.push(new Particle(x, y, vx, vy, color, radius, life, gravity, type));
    }
}

function spawnCoinSparkles(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const radius = 1 + Math.random() * 2;
        const life = 300 + Math.random() * 200;
        particles.push(new Particle(x, y, vx, vy, '#ffd700', radius, life, -0.02, 'normal'));
    }
}

/* ==========================================================================
   FLOOR DECALS SYSTEM
   ========================================================================== */

class BloodDecal {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.alpha = 0.6 + Math.random() * 0.3;
        this.color = Math.random() > 0.4 ? '#194c25' : '#14361b'; // Dark rotten zombie blood shades

        // Randomize splatter blob shape
        this.blobs = [];
        const blobCount = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < blobCount; i++) {
            this.blobs.push({
                dx: (Math.random() - 0.5) * radius * 1.2,
                dy: (Math.random() - 0.5) * radius * 1.2,
                r: radius * (0.3 + Math.random() * 0.5)
            });
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;

        // Draw main splat
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw surrounding mini-droplets
        this.blobs.forEach(b => {
            ctx.beginPath();
            ctx.arc(this.x + b.dx, this.y + b.dy, b.r, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }
}

function addBloodDecal(x, y, size = 12) {
    if (bloodDecals.length > 60) {
        bloodDecals.shift(); // Remove oldest decal to manage memory/performance
    }
    bloodDecals.push(new BloodDecal(x, y, size + Math.random() * 8));
}

/* ==========================================================================
   EXPLOSION VISUAL FX CLASS
   ========================================================================== */

class ExplosionEffect {
    constructor(x, y, maxRadius = 100, duration = 400) {
        this.x = x;
        this.y = y;
        this.maxRadius = maxRadius;
        this.duration = duration;
        this.timer = 0;
    }

    update(dt) {
        this.timer += dt * 1000;
        return this.timer >= this.duration;
    }

    draw(ctx) {
        const progress = Math.min(1, this.timer / this.duration);
        const radius = this.maxRadius * Math.sin((progress * Math.PI) / 2); // Easing out curve
        const alpha = 1 - progress;

        ctx.save();
        // Inner shockwave core
        ctx.globalAlpha = alpha * 0.8;
        



        let grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.2, '#FF4500');
        grad.addColorStop(0.6, '#FF007F');
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Outer blast ring
        ctx.globalAlpha = alpha * 0.4;
        ctx.strokeStyle = '#FF007F';
        ctx.lineWidth = 4 * (1 - progress);
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius * 1.1, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

/* ==========================================================================
   PLAYER CLASS (LEO)
   ========================================================================== */

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 17.6;
        this.speed = 3.8;
        this.health = 100;
        this.maxHealth = 100;
        this.lives = 3;
        this.grenades = 5;

        this.angle = 0;
        this.invincibleTimer = 0;
        this.invincibleDuration = 1500; // ms

        this.shootCooldown = 150; // ms between bullets
        this.lastShotTime = 0;

        // Powerups
        this.weaponPowerUpTimer = 0;
        this.shieldTimer = 0;
        this.multiplierTimer = 0;
        this.magnetTimer = 0;
    }

    update(dt) {
        // 8-Way Directional Input Handling (Keyboard + Gamepad)
        let moveX = 0;
        let moveY = 0;

        if (keys['KeyW'] || keys['w'] || keys['ArrowUp']) moveY -= 1;
        if (keys['KeyS'] || keys['s'] || keys['ArrowDown']) moveY += 1;
        if (keys['KeyA'] || keys['a'] || keys['ArrowLeft']) moveX -= 1;
        if (keys['KeyD'] || keys['d'] || keys['ArrowRight']) moveX += 1;

        if (typeof gpState !== 'undefined') {
            moveX += gpState.moveX;
            moveY += gpState.moveY;
        }

        // Normalization to prevent faster diagonal speeds (vector math)
        const moveLen = Math.sqrt(moveX * moveX + moveY * moveY);
        if (moveLen > 1) {
            moveX /= moveLen;
            moveY /= moveLen;
        }

        // Store previous position
        const prevX = this.x;
        const prevY = this.y;

        // Apply movement velocity
        this.x += moveX * this.speed * 60 * dt;
        this.y += moveY * this.speed * 60 * dt;

        // Clamp inside canvas boundaries
        this.x = Math.max(this.radius, Math.min(WORLD_WIDTH - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(WORLD_HEIGHT - this.radius, this.y));

        // Collide with buildings
        if (checkMapCollision(this.x, this.y, this.radius)) {
            // Collision occurred! Revert to previous position
            this.x = prevX;
            this.y = prevY;
        }

        // Aiming when auto-aim is OFF (or when all zombies are cleared):
        // Right Stick controls direction of fire (player rotation); Left Stick strictly controls movement only
        if (!autoAimEnabled) {
            if (typeof gpState !== 'undefined' && gpState.aimActive) {
                this.angle = gpState.aimAngle;
            } else if (typeof gpState === 'undefined' || lastMouseMoveAt > gpState.lastActiveAt) {
                this.angle = Math.atan2((mouse.y + camera.y) - this.y, (mouse.x + camera.x) - this.x);
            }
        } else if (zombies.length === 0 && typeof gpState !== 'undefined' && gpState.aimActive) {
            this.angle = gpState.aimAngle;
        }

        // Update Invincibility Frame Timers
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= dt * 1000;
        }

        if (this.weaponPowerUpTimer > 0) this.weaponPowerUpTimer -= dt * 1000;
        if (this.shieldTimer > 0) this.shieldTimer -= dt * 1000;
        if (this.multiplierTimer > 0) this.multiplierTimer -= dt * 1000;
        if (this.magnetTimer > 0) this.magnetTimer -= dt * 1000;

        // Apply Continuous Damage-over-Time (DoT) from Biting Zombies
        let dotDamage = 0;
        zombies.forEach(zombie => {
            if (zombie.isBiting) {
                if (zombie.type === 'boss') dotDamage += 150 * dt; // Massive damage from boss
                else dotDamage += 5 * dt;
            }
        });

        if (dotDamage > 0) {
            this.takeDamage(dotDamage);
        }

        // Continuous shooting when left-clicking, holding Space, or holding Gamepad shoot button
        const gpShooting = (typeof gpState !== 'undefined' && gpState.shootDown);
        if ((mouse.isDown || keys['Space'] || gpShooting) && gameState === STATE_PLAYING) {
            fireBullet();
        }
    }

    takeDamage(amount) {
        if (this.invincibleTimer > 0) return; // Immune during i-frames

        if (this.shieldTimer > 0) amount *= 0.1; // Shields block 90% damage

        this.health -= amount;
        playSound(sfxPlayerHit);

        // Add subtle red tint overlay when damaged
        screenShake = Math.max(screenShake, 3);
        if (typeof triggerGamepadRumble === 'function') {
            triggerGamepadRumble(80, 0.35, 0.5);
        }

        if (this.health <= 0) {
            this.die();
        }

        updateHUD();
    }

    die() {
        this.lives--;
        screenShake = 18;
        if (typeof triggerGamepadRumble === 'function') {
            triggerGamepadRumble(320, 0.8, 1.0);
        }

        // Spawn green blood explosion centered on player to signify death
        spawnSplatter(this.x, this.y, '#900c3f', 20);

        // Deduct lives heart panel
        const currentHeartId = `heart-${this.lives + 1}`;
        const heartElement = document.getElementById(currentHeartId);
        if (heartElement) {
            heartElement.classList.add('lost');
        }

        if (this.lives > 0) {
            // Revive: Restore health and grant temporary invincibility
            this.health = this.maxHealth;
            this.invincibleTimer = this.invincibleDuration;
            // Relocate player to safest spot
            let bestSpot = { x: this.x, y: this.y }; // Default to current if somehow no spots found
            let maxMinDist = -1;
            for (let i = 0; i < 200; i++) { // Increased tries to find safe map location
                let testX = Math.random() * WORLD_WIDTH;
                let testY = Math.random() * WORLD_HEIGHT;
                
                // Must not spawn inside buildings or water
                if (typeof checkMapCollision !== 'undefined' && checkMapCollision(testX, testY, 30)) continue;

                let minDist = Infinity;
                zombies.forEach(z => {
                    let d = Math.pow(z.x - testX, 2) + Math.pow(z.y - testY, 2);
                    if (d < minDist) minDist = d;
                });
                if (minDist > maxMinDist) {
                    maxMinDist = minDist;
                    bestSpot.x = testX;
                    bestSpot.y = testY;
                }
            }
            this.x = bestSpot.x;
            this.y = bestSpot.y;
        } else {
            // Trigger game over state
            endGame();
        }
        updateHUD();
    }

    draw(ctx) {
        // Flashing visibility effect during invincibility frames
        if (this.invincibleTimer > 0) {
            const flashState = Math.floor(this.invincibleTimer / 75) % 2;
            if (flashState === 0) return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        const spriteSize = this.radius * 3.5;
        ctx.drawImage(leoImg, -spriteSize/2, -spriteSize/2, spriteSize, spriteSize);

        ctx.restore();

        // Draw Shield Bubble if active
        if (this.shieldTimer > 0) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    }
}

/* ==========================================================================
   ZOMBIE CLASS (ENEMIES)
   ========================================================================== */

class Zombie {
    constructor(x, y, type = 'normal', silentSpawn = false) {
        if (!silentSpawn && timeSurvived > 0.5) playSound(sfxZombieSpawn);
        this.x = x;
        this.y = y;
        this.type = type;
        this.isBiting = false;

        // Pick a random zombie variation from the sprite sheet
        this.spriteCol = Math.floor(Math.random() * ZOMBIE_COLS);
        this.spriteRow = Math.floor(Math.random() * ZOMBIE_ROWS);

        // Apply distinct specs based on Zombie archetype (Slower speeds for better gameplay)
        if (type === 'fast') {
            this.radius = 14.4;
            this.speed = 1.1 + Math.random() * 0.3;
            this.maxHealth = 50;
            this.health = 50;
            this.color = '#ADFF2F'; // Neon Green-Yellow
            this.points = 15;
        } else if (type === 'tank') {
            this.radius = 28.8;
            this.speed = 0.3 + Math.random() * 0.15;
            this.maxHealth = 240;
            this.health = 240;
            this.color = '#00FF7F'; // Neon Spring Green
            this.points = 40;
        } else {
            // Normal zombie
            this.radius = 18.0;
            this.speed = 0.5 + Math.random() * 0.3;
            this.maxHealth = 100;
            this.health = 100;
            const greenVariants = ['#39FF14', '#2EFF0A', '#4AFF1E', '#7FFF00', '#32CD32'];
            this.color = greenVariants[Math.floor(Math.random() * greenVariants.length)];
            this.points = 10;
        }

        this.angle = 0;
    }

    update(dt) {
        if (!player) return;

        // Calculate direct distance to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distToPlayer = Math.sqrt(dx * dx + dy * dy);

        // Hone in only if within half a screen distance OR if player has magnet power
        const detectionRadius = canvas.width / 2;

        if (distToPlayer < detectionRadius || (player && player.magnetTimer > 0)) {
            // 1. Calculate path vector pointing directly toward Leo
            this.angle = Math.atan2(dy, dx);
        } else {
            // Move randomly
            if (this.randomTimer === undefined || this.randomTimer <= 0) {
                this.randomTimer = 1000 + Math.random() * 2000; // Change direction every 1-3 seconds
                this.angle = Math.random() * Math.PI * 2;
            } else {
                this.randomTimer -= dt * 1000;
            }
        }

        // 2. Move zombie along vector path
        const prevX = this.x;
        const prevY = this.y;

        if (distToPlayer > 5) {
            // Calculate waddle movement
            const timePhase = Date.now() / 300 + (this.id || (this.x + this.y)) * 0.1;
            const wiggleAmp = 0.3; // Reduced from 1.0 for a more subtle shuffle
            const forwardX = Math.cos(this.angle) * this.speed * 60 * dt;
            const forwardY = Math.sin(this.angle) * this.speed * 60 * dt;
            const sideX = Math.cos(this.angle + Math.PI/2) * Math.sin(timePhase) * wiggleAmp * 60 * dt;
            const sideY = Math.sin(this.angle + Math.PI/2) * Math.sin(timePhase) * wiggleAmp * 60 * dt;

            // Apply X movement
            this.x += forwardX + sideX;
            if (checkMapCollision(this.x, this.y, this.radius)) {
                this.x = prevX; // Blocked in X
            }
            
            // Apply Y movement
            this.y += forwardY + sideY;
            if (checkMapCollision(this.x, this.y, this.radius)) {
                this.y = prevY; // Blocked in Y
            }
        }

        // 3. Separation Behavior: Avoid overlapping other zombies
        zombies.forEach(other => {
            if (other === this) return;
            const sDx = this.x - other.x;
            const sDy = this.y - other.y;
            const sDist = Math.sqrt(sDx * sDx + sDy * sDy);
            const minDist = this.radius + other.radius;

            if (sDist < minDist && sDist > 0.1) {
                // Apply a gentle push force away from each other, but respect walls
                const overlap = minDist - sDist;
                const pushAngle = Math.atan2(sDy, sDx);
                
                const oldX = this.x;
                this.x += Math.cos(pushAngle) * overlap * 0.05 * 60 * dt;
                if (checkMapCollision(this.x, this.y, this.radius)) this.x = oldX;
                
                const oldY = this.y;
                this.y += Math.sin(pushAngle) * overlap * 0.05 * 60 * dt;
                if (checkMapCollision(this.x, this.y, this.radius)) this.y = oldY;
            }
        });

        // Keep zombie within rough canvas boundaries (zombies can walk onto screen from slightly off-screen)
        this.x = Math.max(-this.radius * 2, Math.min(WORLD_WIDTH + this.radius * 2, this.x));
        this.y = Math.max(-this.radius * 2, Math.min(WORLD_HEIGHT + this.radius * 2, this.y));

        // 4. DoT Damage Over Time triggers when overlapping Leo's hitbox
        const collisionThreshold = this.radius + player.radius;
        if (distToPlayer < collisionThreshold) {
            this.isBiting = true;
        } else {
            this.isBiting = false;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health > 0) {
            const dmgSound = sfxZombieDmg[Math.floor(Math.random() * sfxZombieDmg.length)];
            playSound(dmgSound);
        }

        // Spawn green zombie blood particles
        spawnSplatter(this.x, this.y, '#38a169', 5);

        if (this.health <= 0) {
            this.die();
            return true; // Dead
        }
        return false;
    }

    die() {
        zombiesKilled++;
        
        const dieSound = sfxZombieDie[Math.floor(Math.random() * sfxZombieDie.length)];
        playSound(dieSound);

        // Splat permanent floor decal where zombie collapsed
        addBloodDecal(this.x, this.y, this.radius);

        // Spawn standard explosion of green blood particles
        spawnSplatter(this.x, this.y, '#276749', 12);

        // Drop gold coin
        spawnCoin(this.x, this.y);
        playSound(sfxCoinDrop);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        // Wobble effect for goofy zombies
        const wobble = Math.sin(Date.now() / 150) * 0.15;
        ctx.rotate(this.angle + wobble - Math.PI / 2);
        
        const spriteSize = this.radius * 3;
        
        if (zombieImg.complete) {
            const frameW = zombieImg.width / ZOMBIE_COLS;
            const frameH = zombieImg.height / ZOMBIE_ROWS;
            const sx = this.spriteCol * frameW;
            const sy = this.spriteRow * frameH;
            ctx.drawImage(zombieImg, sx, sy, frameW, frameH, -spriteSize/2, -spriteSize/2, spriteSize, spriteSize);
        } else {
            ctx.drawImage(zombieImg, -spriteSize/2, -spriteSize/2, spriteSize, spriteSize);
        }

        ctx.restore();

        // 6. Draw HUD functional Health Bar directly above the zombie sprite
        if (this.health < this.maxHealth) {
            const barWidth = this.radius * 2;
            const barHeight = 4;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.radius - 12;

            // Bar background
            ctx.fillStyle = '#222222';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // Bar fill
            const healthRatio = Math.max(0, this.health / this.maxHealth);
            ctx.fillStyle = '#FF003C';
            ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);

            // Thin border outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    }
}

class BossZombie extends Zombie {
    constructor(x, y) {
        super(x, y, 'boss', true); // Silent spawn for the boss initially
        
        // Ensure the Boss always uses the exact same sprite body 
        // (so he doesn't randomize like normal zombies)
        this.spriteCol = 5;
        this.spriteRow = 0;
        
        this.radius = 38.4;
        this.maxHealth = 2500;
        this.health = 2500;
        this.speed = 0.55;
        this.color = '#3f1dcb';
        this.points = 500;
        this.spawnTimer = 5000; // ms
        this.thumpRadius = 45;
    }

    update(dt) {
        super.update(dt);

        this.spawnTimer -= dt * 1000;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 5000;
            for (let i = 0; i < 2; i++) {
                let zx = this.x + (Math.random() - 0.5) * 80;
                let zy = this.y + (Math.random() - 0.5) * 80;
                let type = Math.random() > 0.5 ? 'fast' : 'basic';
                zombies.push(new Zombie(zx, zy, type, true));
            }
            // Play a random boss roar if on-screen (not so loudly)
            if (this.x > camera.x && this.x < camera.x + canvas.width &&
                this.y > camera.y && this.y < camera.y + canvas.height) {
                const randomSnd = bossSounds[Math.floor(Math.random() * bossSounds.length)];
                playSound(randomSnd);
            }
        }

        if (player) {
            const dx = this.x - player.x;
            const dy = this.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.thumpRadius + player.radius) {
                this.isBiting = true;
                const pushAngle = Math.atan2(-dy, -dx);
                player.x += Math.cos(pushAngle) * 6;
                player.y += Math.sin(pushAngle) * 6;
            } else {
                this.isBiting = false;
            }
        }
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle - Math.PI / 2);

        ctx.fillStyle = '#ff69b4'; // Pink hair
        ctx.beginPath();
        ctx.arc(-8, 0, 16, 0, Math.PI * 2);
        ctx.arc(-14, -10, 12, 0, Math.PI * 2);
        ctx.arc(-14, 10, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

/* ==========================================================================
   BULLET CLASS (PLAYER SHOTS)
   ========================================================================== */

class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.radius = 2.5;
        this.speed = 13.5;
        this.damage = 35;
        this.color = '#ffffff';

        // Direction vectors
        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);

        // Track previous positions for gorgeous tracer trails
        this.history = [];
        this.historyLength = 4;
    }

    update(dt) {
        // Record trail history
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > this.historyLength) {
            this.history.shift();
        }

        // Frame-rate independent linear movement
        this.x += this.vx * this.speed * 60 * dt;
        this.y += this.vy * this.speed * 60 * dt;
    }

    draw(ctx) {
        ctx.save();

        // Draw glow path tracer
        if (this.history.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.history[0].x, this.history[0].y);
            for (let i = 1; i < this.history.length; i++) {
                ctx.lineTo(this.history[i].x, this.history[i].y);
            }
            ctx.lineTo(this.x, this.y);

            ctx.strokeStyle = 'rgba(252, 211, 77, 0.4)';
            ctx.lineWidth = this.radius * 2;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        // Draw core bullet glowing head


        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

function fireBullet() {
    const time = Date.now();
    if (time - player.lastShotTime >= player.shootCooldown) {
        playSound(sfxShoot);
        // Spawn bullet just outside player body (muzzle barrel tip position)
        const tipX = player.x + Math.cos(player.angle) * 22;
        const tipY = player.y + Math.sin(player.angle) * 22;

        const isMultiplier = player.multiplierTimer > 0;
        const angles = isMultiplier ? [player.angle - 0.13, player.angle + 0.13] : [player.angle]; // ~7.5 degrees

        angles.forEach(ang => {
            const spread = (Math.random() - 0.5) * 0.05;
            let b = new Bullet(tipX, tipY, ang + spread);
            if (player.weaponPowerUpTimer > 0) {
                b.radius = 5;
                b.damage = 140;
                b.color = '#00ffff'; // neon blue
            }
            bullets.push(b);
        });

        // Spawn subtle yellow gunpowder sparks
        for (let i = 0; i < 3; i++) {
            const sparkAngle = player.angle + (Math.random() - 0.5) * 0.5;
            const sparkSpeed = 1 + Math.random() * 2;
            particles.push(new Particle(
                tipX, tipY,
                Math.cos(sparkAngle) * sparkSpeed,
                Math.sin(sparkAngle) * sparkSpeed,
                '#ffd700', 1, 150
            ));
        }

        player.lastShotTime = time;
    }
}

/* ==========================================================================
   COIN CLASS (DROPS & BOUNCING PHYSICS)
   ========================================================================== */

class Coin {
    constructor(x, y) {
        this.x = x; // Logical ground coordinate x
        this.y = y; // Logical ground coordinate y
        this.z = 0; // Logical vertical coordinate height (2.5D bounce)

        this.radius = 8;
        this.angle = 0;
        this.spinSpeed = 0.08 + Math.random() * 0.04;
        this.isStationary = false;
        this.bounceCount = 0;

        // Bounce physics vector velocities
        // Push coin outwards in a random horizontal direction
        const dirAngle = Math.random() * Math.PI * 2;
        const pushSpeed = 1.0 + Math.random() * 2.0;
        this.vx = Math.cos(dirAngle) * pushSpeed;
        this.vy = Math.sin(dirAngle) * pushSpeed;

        // Upward vertical height speed
        this.vz = 4.5 + Math.random() * 2.0;
        this.gravity = 0.28;
        this.restitution = 0.55; // Energy loss ratio per ground bounce
    }

    update(dt) {
        // Spin rotation animation
        this.angle += this.spinSpeed;

        if (this.isStationary && (!player || player.magnetTimer <= 0)) return;

        // Magnet effect
        if (player && player.magnetTimer > 0) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Only pull coins roughly within the viewable screen
            if (dist < 1000) {
                this.isStationary = false; // wake up!
                // Apply a strong acceleration pulling the coin towards the player
                const pullSpeed = 50 * dt; 
                this.vx += (dx / dist) * pullSpeed;
                this.vy += (dy / dist) * pullSpeed;
                
                // Limit maximum velocity
                const maxSpeed = 15;
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (speed > maxSpeed) {
                    this.vx = (this.vx / speed) * maxSpeed;
                    this.vy = (this.vy / speed) * maxSpeed;
                }
            }
        }

        // 1. Horizontal sliding movement (ground friction)
        this.x += this.vx * 60 * dt;
        this.y += this.vy * 60 * dt;
        this.vx *= Math.pow(0.96, 60 * dt);
        this.vy *= Math.pow(0.96, 60 * dt);

        // Clamp coin within screen boundaries so it doesn't bounce out of reach
        this.x = Math.max(this.radius, Math.min(WORLD_WIDTH - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(WORLD_HEIGHT - this.radius, this.y));

        // 2. Vertical height gravity physics
        this.vz -= this.gravity * 60 * dt;
        this.z += this.vz * 60 * dt;

        // Check if coin slams against the ground floor (z = 0)
        if (this.z <= 0) {
            this.z = 0;
            this.vz = -this.vz * this.restitution; // Invert and dampen
            this.bounceCount++;

            // Terminate bounce system if velocity becomes microscopic
            if (this.bounceCount > 4 || Math.abs(this.vz) < 0.6) {
                this.vz = 0;
                this.vx = 0;
                this.vy = 0;
                this.isStationary = true;
            }
        }
    }

    drawShadow(ctx) {
        // Draw flat shadow oval at ground coordinate (x, y)
        // Shadow shrinks and becomes more transparent the higher the coin bounces
        ctx.save();
        ctx.translate(this.x, this.y);

        const scaleFactor = Math.max(0.1, 1 - (this.z / 120));
        ctx.globalAlpha = 0.35 * scaleFactor;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * scaleFactor * 1.2, this.radius * scaleFactor * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    draw(ctx) {
        // Render coin bouncing dynamically above its shadow: at (x, y - z)
        ctx.save();
        ctx.translate(this.x, this.y - this.z);

        // Neon pulsing aura



        // Simulate 3D coin rotation by squishing horizontally
        const horizontalScale = Math.abs(Math.sin(this.angle));
        ctx.scale(Math.max(0.08, horizontalScale), 1);

        const r = this.radius;

        // Outer dark edge rim
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = '#7c4a00';
        ctx.fill();

        // Gold body gradient
        let coinGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.05, 0, 0, r * 0.95);
        coinGrad.addColorStop(0, '#fffde7'); // Bright highlight
        coinGrad.addColorStop(0.25, '#fde68a');
        coinGrad.addColorStop(0.65, '#fbbf24'); // Warm gold
        coinGrad.addColorStop(1, '#b45309');    // Dark bronze edge
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
        ctx.fillStyle = coinGrad;
        ctx.fill();

        // Engraved inner circle ring
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(120, 60, 0, 0.35)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Dollar $ symbol
        ctx.fillStyle = 'rgba(100, 50, 0, 0.7)';
        ctx.font = `bold ${Math.round(r * 1.1)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0.5);

        // Specular shine highlight
        ctx.beginPath();
        ctx.ellipse(-r * 0.28, -r * 0.32, r * 0.22, r * 0.12, -0.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fill();

        ctx.restore();
    }
}

function spawnCoin(x, y) {
    coins.push(new Coin(x, y));
}

/* ==========================================================================
   GRENADE CLASS (PROJECTILE & BLASTS)
   ========================================================================== */

class Grenade {
    constructor(startX, startY, targetX, targetY) {
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;

        this.x = startX;
        this.y = startY;
        this.z = 0; // Altitude height

        // Progress along path (0.0 to 1.0)
        this.t = 0;

        // Total flight duration calculated based on target distance
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Flight speed in pixels per frame
        const flightSpeed = 6.8;
        // Total frames needed
        const totalFrames = Math.max(25, distance / flightSpeed);
        this.speedPerFrame = 1 / totalFrames;

        this.peakHeight = Math.min(130, distance * 0.35); // Arcs higher the further it is thrown

        this.radius = 6;
        this.angle = 0;
        this.rotSpeed = 0.12;
    }

    update(dt) {
        this.t += this.speedPerFrame * 60 * dt;
        this.angle += this.rotSpeed * 60 * dt;

        if (this.t >= 1) {
            this.t = 1;
            this.detonate();
            return true; // Destroyed
        }

        // Linear interpolation for ground plane coordinates (x, y)
        this.x = this.startX + (this.targetX - this.startX) * this.t;
        this.y = this.startY + (this.targetY - this.startY) * this.t;

        // Sine wave arc for logical height vertical trajectory (z)
        this.z = this.peakHeight * Math.sin(this.t * Math.PI);
        return false;
    }

    detonate() {
        playSound(sfxExplosion);
        screenShake = Math.max(screenShake, 24);
        if (typeof triggerGamepadRumble === 'function') {
            triggerGamepadRumble(220, 0.65, 0.9);
        }

        // 1. Apply AoE (Area of Effect) Damage and knockback to all surrounding zombies
        const explosionRadius = 120;
        const explosionDamage = 200; // Increased grenade damage

        // Iterate backwards since elements might die
        for (let i = zombies.length - 1; i >= 0; i--) {
            const z = zombies[i];
            const dx = z.x - this.targetX;
            const dy = z.y - this.targetY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < explosionRadius) {
                // Apply damage scaled by proximity (more damage closer to center)
                const falloff = 1 - (dist / explosionRadius);
                const finalDamage = explosionDamage * falloff;

                // Push zombie back from explosion epicentre
                const pushForce = 15 * falloff;
                const pushAngle = Math.atan2(dy, dx);
                z.x += Math.cos(pushAngle) * pushForce;
                z.y += Math.sin(pushAngle) * pushForce;

                if (z.takeDamage(finalDamage)) {
                    zombies.splice(i, 1);
                }
            }
        }

        // 2. Damage destructibles
        for (let i = destructibles.length - 1; i >= 0; i--) {
            const d = destructibles[i];
            const dx = d.x - this.targetX;
            const dy = d.y - this.targetY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < explosionRadius) {
                const falloff = 1 - (dist / explosionRadius);
                const finalDamage = explosionDamage * falloff;
                if (d.takeDamage(finalDamage)) {
                    destructibles.splice(i, 1);
                }
            }
        }

        // 3. Instantiate expanding visual shockwave
        explosions.push(new ExplosionEffect(this.targetX, this.targetY, explosionRadius, 450));

        // 4. Spawn explosive smoke/fire particles
        spawnExplosionParticles(this.targetX, this.targetY, 35);
    }

    drawShadow(ctx) {
        // Draw flat grenade shadow on floor
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = 0.25 * (1 - (this.z / 180));
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y - this.z); // Render above floor shadow
        ctx.rotate(this.angle);

        // Draw Grenade Body Shape (Military Olive Green Oval)
        ctx.fillStyle = '#556b2f';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 1.2, this.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2d3810';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw grenade metallic pin lever
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(-this.radius * 0.5, -this.radius - 2, this.radius, 3);

        // Red Blinking Indicator LED (Blinks faster closer to target detonation)
        const flashRate = this.t < 0.4 ? 200 : (this.t < 0.8 ? 90 : 40);
        const ledOn = Math.floor(Date.now() / flashRate) % 2 === 0;
        if (ledOn) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(0, -this.radius * 0.4, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

function fireGrenade() {
    if (player.grenades <= 0) return; // Out of ammo
    playSound(sfxGrenadeThrow);
    const gunTipX = player.x + Math.cos(player.angle) * 22;
    const gunTipY = player.y + Math.sin(player.angle) * 22;

    // Throw in direction shooter is facing
    const throwDistance = 250;
    const targetX = player.x + Math.cos(player.angle) * throwDistance;
    const targetY = player.y + Math.sin(player.angle) * throwDistance;

    grenades.push(new Grenade(gunTipX, gunTipY, targetX, targetY));
    player.grenades--;
    updateHUD();
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 12;
        this.angle = 0;
        this.hoverOffset = 0;
    }
    update(dt) {
        this.angle += dt * 2;
        this.hoverOffset = Math.sin(Date.now() / 200) * 5;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y + this.hoverOffset);

        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const scale = 1 + Math.sin(Date.now() / 150) * 0.1;
        ctx.scale(scale, scale);

        if (this.type === 'weapon') {

            ctx.fillText('🔫', 0, 0);
        } else if (this.type === 'shield') {

            ctx.fillText('🛡️', 0, 0);
        } else if (this.type === 'multiplier') {

            ctx.fillText('⚡', 0, 0);
        } else if (this.type === 'heart') {

            ctx.fillText('❤️', 0, 0);
        } else if (this.type === 'magnet') {
            ctx.fillText('🧲', 0, 0);
        }
        ctx.restore();
    }
}

class Gate {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 80;
        this.width = 160;
        this.height = 200;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw the gate pillars
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(-this.width / 2 - 20, -this.height / 2, 40, this.height);
        ctx.fillRect(this.width / 2 - 20, -this.height / 2, 40, this.height);

        // Draw top arch
        ctx.fillRect(-this.width / 2 - 20, -this.height / 2 - 40, this.width + 40, 40);

        // Draw "To the country side" sign
        ctx.fillStyle = '#111';
        ctx.fillRect(-this.width / 2 + 10, -this.height / 2 - 30, this.width - 20, 20);
        ctx.fillStyle = '#fbbf24';
        ctx.font = '14px "Fredoka One", sans-serif';
        ctx.textAlign = 'center';
        let signText = 'To the countryside';
        if (typeof currentLevel !== 'undefined') {
            if (currentLevel === 2) signText = 'To the castle';
            if (currentLevel === 3) signText = 'Escape!';
        }
        ctx.fillText(signText, 0, -this.height / 2 - 20);

        // Draw metal bars if closed
        if (keysCollected < 4) {
            ctx.fillStyle = '#777'; // Metal color
            for (let i = -this.width / 2 + 10; i <= this.width / 2 - 10; i += 25) {
                ctx.fillRect(i, -this.height / 2, 8, this.height);
            }
            // Horizontal crossbars
            ctx.fillRect(-this.width / 2, -this.height * 0.3, this.width, 10);
            ctx.fillRect(-this.width / 2, this.height * 0.3, this.width, 10);
            
            // Lock icon
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#111';
            ctx.fillRect(-5, -5, 10, 10);
        } else {
            // Draw open path green glow
            ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
            ctx.fillRect(-this.width / 2 + 20, -this.height / 2, this.width - 40, this.height);
        }

        ctx.restore();
    }

    checkCollision(player) {
        const dist = Math.sqrt(Math.pow(this.x - player.x, 2) + Math.pow(this.y - player.y, 2));
        return dist < this.radius + player.radius;
    }
}

class Destructible {
    constructor(x, y, visualType, lootType) {
        this.x = x;
        this.y = y;
        this.visualType = visualType;
        this.lootType = lootType;
        this.health = 50;
        this.wiggleOffset = 0;
        if (this.visualType === 'car') this.radius = 30;
        else if (this.visualType === 'chest' || this.visualType === 'gold_chest' || this.visualType === 'bin') this.radius = 16;
        else this.radius = 12;
    }
    update(dt) {
        this.wiggleOffset = Math.sin(Date.now() / 150 + this.x) * 0.08;
    }
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
            return true;
        }
        return false;
    }
    die() {
        spawnExplosionParticles(this.x, this.y, 20);
        if (this.lootType === 'coin') {
            spawnCoin(this.x, this.y);
        } else if (this.lootType) {
            powerUps.push(new PowerUp(this.x, this.y, this.lootType));
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.wiggleOffset);




        ctx.save();

        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(2, 2, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (this.visualType === 'bin') {
            ctx.fillStyle = '#4b5563';
            ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.strokeStyle = '#374151';
            ctx.strokeRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        } else if (this.visualType === 'car') {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-30, -15, 60, 30);
            ctx.fillStyle = '#111827';
            ctx.fillRect(-20, -10, 40, 20);
        } else if (this.visualType === 'box' || this.visualType === 'chest') {
            ctx.fillStyle = '#8b5a2b';
            ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.strokeStyle = '#5c3a21';
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        } else if (this.visualType === 'barrel' || this.visualType === 'stump') {
            ctx.fillStyle = '#654321';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.visualType === 'hydrant') {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.visualType === 'gold_chest') {
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        }
        ctx.restore();
    }
}

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.scale = 1.0;
    }
    update(dt) {
        this.y -= 30 * dt;
        this.scale += 0.4 * dt;
        this.life -= dt * 0.8;
    }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.font = 'bold 18px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(this.text, 0, 0);
        ctx.fillStyle = this.color;


        ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
}

/* ==========================================================================
   GAME ENGINE STATE MANAGERS
   ========================================================================== */

let levelStartZombiesKilled = 0;
let levelStartTotalCoins = 0;
let levelStartActiveCoins = 0;
let loopStarted = false;

function startLevel(level, isRestart = false) {
    if (level === 1) playBGM(bgmLevel1);
    else if (level === 2) playBGM(bgmLevel2);
    else if (level === 3) playBGM(bgmLevel3);

    currentLevel = level;
    gameState = STATE_PLAYING;
    timeSurvived = 0;

    if (level === 1 && !isRestart) {
        zombiesKilled = 0;
        totalCoinsCollected = 0;
        activeCoins = 0;
    }

    // Snapshot stats at start of level for fair "Restart Level"
    levelStartZombiesKilled = zombiesKilled;
    levelStartTotalCoins = totalCoinsCollected;
    levelStartActiveCoins = activeCoins;

    lastGrenadeAwardAt = Math.floor(totalCoinsCollected / 50) * 50;
    gameElapsedTime = 0;
    screenShake = 0;

    bullets = [];
    zombies = [];
    coins = [];
    grenades = [];
    particles = [];
    bloodDecals = [];
    explosions = [];
    powerUps = [];
    destructibles = [];
    floatingTexts = [];
    activeDialogues = [];
    allZombiesClearedTriggered = false;
    randomBarkTimer = 15;

    // Level Setup
    keysCollected = 0;
    levelKeys = [];
    
    if (level === 3) {
        // Place gate behind the throne room on the far right
        levelGate = new Gate(3400, WORLD_HEIGHT / 2);
    } else {
        levelGate = new Gate(WORLD_WIDTH - 60, WORLD_HEIGHT / 2);
    }
    bgCanvas = buildBackground(level, WORLD_WIDTH, WORLD_HEIGHT);

    const keyRegions = [
        { minX: canvas.width, maxX: canvas.width * 2, minY: 0, maxY: canvas.height }, // North
        { minX: canvas.width * 2, maxX: canvas.width * 3, minY: canvas.height, maxY: canvas.height * 2 }, // East
        { minX: canvas.width, maxX: canvas.width * 2, minY: canvas.height * 2, maxY: canvas.height * 3 }, // South
        { minX: 0, maxX: canvas.width, minY: canvas.height, maxY: canvas.height * 2 } // West
    ];

    function isInsideCollider(x, y) {
        return checkMapCollision(x, y, 30); // Use 30 for safety padding
    }

    if (level === 3) {
        // Hardcode keys to the 4 corners of the castle layout (Top-Right moved down clear of the minimap)
        levelKeys.push(new Key(250, 250, 0)); // Top-Left
        levelKeys.push(new Key(3350, 600, 1)); // Top-Right (below minimap)
        levelKeys.push(new Key(250, 2750, 2)); // Bottom-Left
        levelKeys.push(new Key(3350, 2750, 3)); // Bottom-Right
    } else {
        for (let i = 0; i < 4; i++) {
            let kX, kY;
            let attempts = 0;
            do {
                kX = keyRegions[i].minX + Math.random() * (keyRegions[i].maxX - keyRegions[i].minX);
                kY = keyRegions[i].minY + Math.random() * (keyRegions[i].maxY - keyRegions[i].minY);
                attempts++;
            } while ((isInsideCollider(kX, kY) || (kX > WORLD_WIDTH - 320 && kY < 350)) && attempts < 100);
            levelKeys.push(new Key(kX, kY, i));
        }
    }

    let requiredLoot = ['weapon', 'weapon', 'weapon', 'shield', 'shield', 'multiplier', 'multiplier', 'heart', 'magnet', 'magnet'];
    let destructiblesCount = 20;
    while (requiredLoot.length < destructiblesCount) {
        requiredLoot.push('coin');
    }
    requiredLoot.sort(() => Math.random() - 0.5);

    let visualOptions = [];
    if (level === 1) visualOptions = ['bin', 'car', 'box', 'hydrant'];
    else if (level === 2) visualOptions = ['stump', 'barrel', 'box', 'chest'];
    else visualOptions = ['chest', 'barrel', 'gold_chest', 'box'];

    for (let i = 0; i < destructiblesCount; i++) {
        let x, y, attempts = 0;
        do {
            x = Math.random() * WORLD_WIDTH;
            y = Math.random() * WORLD_HEIGHT;
            attempts++;
        } while (isInsideCollider(x, y) && attempts < 100);

        const visual = visualOptions[Math.floor(Math.random() * visualOptions.length)];
        destructibles.push(new Destructible(x, y, visual, requiredLoot[i]));
    }

    // Instantiate Player on a safe road instead of inside a building
    let startX = 600, startY = 950;
    if (level === 1) {
        startX = 850; // Middle of an intersection in organic layout
        startY = 700;
    } else if (level === 2) {
        startX = 150; // On the dirt road
        startY = 1500;
    } else {
        startX = 350; // Left corridor/spawn area in Castle
        startY = 1500;
    }
    player = new Player(startX, startY);
    camera.x = 0;

    // Reset HUD visual hearts based on player starting lives
    for (let i = 1; i <= 6; i++) {
        const heartElement = document.getElementById(`heart-${i}`);
        if (heartElement) {
            if (i <= player.lives) {
                heartElement.classList.remove('lost');
            } else {
                heartElement.classList.add('lost');
            }
        }
    }

    // Grenades are always unlocked
    grenadeUnlocked = true;
    grenadesContainer.classList.remove('locked');
    unlockToast.classList.add('toast-hidden');

    // UI overlays toggle
    introScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    levelCompleteScreen.classList.add('hidden');
    winScreen.classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('info-modal').classList.add('hidden');
    document.getElementById('highscore-modal').classList.add('hidden');
    document.getElementById('name-entry-overlay').classList.add('hidden');
    hud.classList.remove('hud-hidden');

    levelLabel.textContent = `LEVEL ${level}`;
    levelNameLabel.textContent = level === 1 ? 'CITY STREETS' : level === 2 ? 'COUNTRYSIDE' : 'CASTLE INTERIOR';

    clearMenuFocus();
    updateCursorVisibility();
    updateHUD();

    // Spawn level zombies
    spawnLevelZombies();

    lastTime = performance.now();
    if (!loopStarted) {
        loopStarted = true;
        requestAnimationFrame(gameLoop);
    }
}

function spawnLevelZombies() {
    let totalZombies = 200;
    if (currentLevel === 1) totalZombies = 100;
    if (currentLevel === 2) totalZombies = 150;
    if (currentLevel === 3) totalZombies = 200;

    for (let i = 0; i < totalZombies; i++) {
        const x = Math.random() * WORLD_WIDTH;
        const y = Math.random() * WORLD_HEIGHT;
        // Don't spawn too close to player
        if (Math.abs(x - player.x) < 400 && Math.abs(y - player.y) < 400) {
            i--; continue;
        }

        // Don't spawn inside or clipping a building
        let insideBuilding = checkMapCollision(x, y, 30);
        if (insideBuilding) {
            i--; continue;
        }

        let type = 'basic';
        let r = Math.random();
        if (currentLevel === 1) {
            if (r > 0.8) type = 'runner';
        } else if (currentLevel === 2) {
            if (r > 0.6) type = 'runner';
            if (r > 0.9) type = 'tank';
        } else {
            if (r > 0.4) type = 'runner';
            if (r > 0.7) type = 'tank';
        }
        const zombie = new Zombie(x, y, type);
        zombies.push(zombie);
    }

    if (currentLevel === 3) {
        // Spawn boss in the center of the Throne Room
        const boss = new BossZombie(2450, 1500);
        zombies.push(boss);
    }
}

function endLevel() {
    gameState = STATE_LEVEL_COMPLETE;
    lcStatZombies.textContent = zombiesKilled;
    lcStatCoins.textContent = totalCoinsCollected;
    lcStatTime.textContent = timeSurvived.toFixed(1) + 's';

    if (currentLevel === MAX_LEVELS) {
        playBGM(bgmVictory);
        winScreen.classList.remove('hidden');
        winStatZombies.textContent = zombiesKilled;
        winStatCoins.textContent = totalCoinsCollected;
        winStatTime.textContent = timeSurvived.toFixed(1) + 's';

        const isNewHs = isHighScore(totalCoinsCollected);
        const hsBadge = document.getElementById('win-new-hs-badge');
        if (hsBadge) hsBadge.classList.toggle('hidden', !isNewHs);

        // High-score handling on victory
        handleHighScore(totalCoinsCollected);
    } else {
        playBGM(bgmLevelComplete);
        levelCompleteScreen.classList.remove('hidden');
        document.getElementById('level-complete-subtitle').textContent = `Zone ${currentLevel} cleared. Get ready for the next one.`;
    }
    syncMenuFocus();
    updateCursorVisibility();
}

function endGame() {
    playBGM(bgmGameOver);
    gameState = STATE_GAMEOVER;
    hud.classList.add('hud-hidden');
    gameOverScreen.classList.remove('hidden');

    // Display final stats summary
    statZombies.textContent = zombiesKilled;
    statCoins.textContent = totalCoinsCollected;
    statTime.textContent = timeSurvived.toFixed(1) + 's';
    const statZoneEl = document.getElementById('stat-zone');
    if (statZoneEl) {
        const zoneName = currentLevel === 1 ? 'City Streets' : currentLevel === 2 ? 'Countryside' : 'Castle Interior';
        statZoneEl.textContent = `Zone ${currentLevel} (${zoneName})`;
    }

    const isNewHs = isHighScore(totalCoinsCollected);
    const hsBadge = document.getElementById('gameover-new-hs-badge');
    if (hsBadge) hsBadge.classList.toggle('hidden', !isNewHs);

    // High‑score handling
    handleHighScore(totalCoinsCollected);
    syncMenuFocus();
    updateCursorVisibility();
}

function updateHUD() {
    if (!player) return;

    // 1. Core Health bar adjustments
    const hpRatio = Math.max(0, player.health / player.maxHealth);
    healthBarFill.style.width = (hpRatio * 100) + '%';
    healthText.textContent = `HP: ${Math.ceil(player.health)}%`;

    // Apply color class overrides to health bar based on warning zones
    healthBarFill.classList.remove('warning', 'critical');
    if (hpRatio < 0.3) {
        healthBarFill.classList.add('critical');
    } else if (hpRatio < 0.6) {
        healthBarFill.classList.add('warning');
    }

    // 2. Counters text
    coinCountText.textContent = activeCoins;
    zombieSlainCountText.textContent = zombiesKilled;
    grenadeCountText.textContent = player.grenades;
    keyCountText.textContent = `${keysCollected}/4`;

    // 2.5 Update Score & Best Score in HUD
    const hudScoreVal = document.getElementById('hud-score-val');
    const hudBestVal = document.getElementById('hud-best-val');
    if (hudScoreVal) hudScoreVal.textContent = totalCoinsCollected.toLocaleString();
    if (hudBestVal) {
        const scores = loadHighScores();
        const topStored = scores.length > 0 ? scores[0].score : 0;
        const bestVal = Math.max(topStored, totalCoinsCollected);
        hudBestVal.textContent = bestVal.toLocaleString();
    }

    // 3. Unlock Grenades check (at 50 total coins collected)
    if (!grenadeUnlocked && activeCoins >= 50) {
        unlockGrenades();
    }

    // 4. Update Grenade Progress Bar
    const progressFill = document.getElementById('grenade-progress-fill');
    if (progressFill) {
        if (player.grenades >= 10) {
            progressFill.style.width = '100%';
        } else {
            const coinsTowardsNext = totalCoinsCollected - lastGrenadeAwardAt;
            const progressPercent = Math.max(0, Math.min(100, (coinsTowardsNext / 50) * 100));
            progressFill.style.width = `${progressPercent}%`;
        }
    }
}

function unlockGrenades() {
    // Grenades are always unlocked; ensure UI reflects this.
    grenadeUnlocked = true;
    grenadesContainer.classList.remove('locked');
}

/* ==========================================================================
   ENEMY SPAWNER SYSTEM
   ========================================================================== */

function drawMinimap() {
    const minimap = document.getElementById('minimap');
    if (!minimap) return;
    const mctx = minimap.getContext('2d');

    // Clear minimap
    mctx.clearRect(0, 0, minimap.width, minimap.height);

    // Calculate scale
    const scaleX = minimap.width / WORLD_WIDTH;
    const scaleY = minimap.height / WORLD_HEIGHT;

    // Draw viewport rectangle
    mctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    mctx.fillRect(camera.x * scaleX, camera.y * scaleY, canvas.width * scaleX, canvas.height * scaleY);
    mctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    mctx.strokeRect(camera.x * scaleX, camera.y * scaleY, canvas.width * scaleX, canvas.height * scaleY);

    // Draw Zombies (red dots)
    mctx.fillStyle = '#ef4444';
    zombies.forEach(z => {
        mctx.fillRect(z.x * scaleX, z.y * scaleY, 2, 2);
    });

    // Upon clearing the level of zombies, display remaining uncollected Keys on the minimap
    if (zombies.length === 0 && typeof levelKeys !== 'undefined') {
        const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 180);
        levelKeys.forEach(k => {
            if (!k.collected) {
                const kx = k.x * scaleX;
                const ky = k.y * scaleY;

                mctx.save();
                // Pulsing golden outer beacon ring
                mctx.beginPath();
                mctx.arc(kx, ky, 6 + pulse * 3, 0, Math.PI * 2);
                mctx.strokeStyle = `rgba(251, 191, 36, ${0.45 + pulse * 0.45})`;
                mctx.lineWidth = 2;
                mctx.stroke();

                // Bright gold key marker dot
                mctx.beginPath();
                mctx.arc(kx, ky, 4.5, 0, Math.PI * 2);
                mctx.fillStyle = '#fbbf24';
                mctx.fill();
                mctx.lineWidth = 1.5;
                mctx.strokeStyle = '#000000';
                mctx.stroke();
                mctx.restore();
            }
        });
    }

    // Draw Player (green dot)
    if (player) {
        mctx.fillStyle = '#10b981';
        mctx.beginPath();
        mctx.arc(player.x * scaleX, player.y * scaleY, 4, 0, Math.PI * 2);
        mctx.fill();
    }
}

/* ==========================================================================
   COLLISION MATRIX RESOLUTION
   ========================================================================== */

function handleCollisions() {
    // 1. Bullet hits Zombie
    for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
        const bullet = bullets[bIdx];
        let bulletDestroyed = false;

        for (let zIdx = zombies.length - 1; zIdx >= 0; zIdx--) {
            const zombie = zombies[zIdx];

            const dx = bullet.x - zombie.x;
            const dy = bullet.y - zombie.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Hit collision detection
            if (distance < bullet.radius + zombie.radius) {
                const isDead = zombie.takeDamage(bullet.damage);

                // Delete bullet
                bullets.splice(bIdx, 1);
                bulletDestroyed = true;

                // Subtle camera shake on hit
                screenShake = Math.max(screenShake, 1);

                if (isDead) {
                    zombies.splice(zIdx, 1);
                }
                break; // Break inner loop to analyze next bullet
            }
        }

        if (bulletDestroyed) continue;

        // 1.5 Bullet hits Destructible
        for (let dIdx = destructibles.length - 1; dIdx >= 0; dIdx--) {
            const dest = destructibles[dIdx];
            const dx = bullet.x - dest.x;
            const dy = bullet.y - dest.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < bullet.radius + dest.radius) {
                const isDead = dest.takeDamage(bullet.damage);
                bullets.splice(bIdx, 1);
                bulletDestroyed = true;
                if (isDead) {
                    destructibles.splice(dIdx, 1);
                }
                break;
            }
        }

        if (bulletDestroyed) continue;

        // 1.6 Bullet hits Impassable level bounds (bullets ignore water/fences)
        if (checkMapCollision(bullet.x, bullet.y, bullet.radius, true, true)) {
            bullets.splice(bIdx, 1);
            bulletDestroyed = true;
            spawnSplatter(bullet.x, bullet.y, '#fbbf24', 3); // subtle spark
        }

        if (bulletDestroyed) continue;

        // Clear offscreen bullets
        if (bullet.x < camera.x - 20 || bullet.x > camera.x + canvas.width + 20 ||
            bullet.y < camera.y - 20 || bullet.y > camera.y + canvas.height + 20) {
            bullets.splice(bIdx, 1);
        }
    }

    // 1.8 Player picks up PowerUp
    for (let pIdx = powerUps.length - 1; pIdx >= 0; pIdx--) {
        const pu = powerUps[pIdx];
        const dx = player.x - pu.x;
        const dy = player.y - pu.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.radius + pu.radius) {
            let msg = '';
            let color = '';
            if (pu.type === 'weapon') {
                player.weaponPowerUpTimer = 20000;
                msg = 'Mega Bullets!';
                color = '#00ffff';
            } else if (pu.type === 'shield') {
                player.shieldTimer = 30000;
                msg = 'Shield!';
                color = '#38bdf8';
            } else if (pu.type === 'multiplier') {
                player.multiplierTimer = 20000;
                msg = 'Double Shot!';
                color = '#a855f7';
            } else if (pu.type === 'heart') {
                if (player.lives < 6) {
                    player.lives++;
                    const heartElement = document.getElementById(`heart-${player.lives}`);
                    if (heartElement) heartElement.classList.remove('lost');
                }
                msg = 'Extra life!';
                color = '#ef4444';
            } else if (pu.type === 'magnet') {
                player.magnetTimer = 20000;
                msg = 'Magnet Power!';
                color = '#facc15';
            }
            floatingTexts.push(new FloatingText(pu.x, pu.y - 20, msg, color));
            spawnCoinSparkles(pu.x, pu.y, 8);
            powerUps.splice(pIdx, 1);
            updateHUD();
        }
    }

    // 2. Player picks up Coin
    for (let cIdx = coins.length - 1; cIdx >= 0; cIdx--) {
        const coin = coins[cIdx];

        const dx = player.x - coin.x;
        const dy = player.y - coin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 55 && coin.isStationary) {
            const pullSpeed = 4.0;
            const pullAngle = Math.atan2(dy, dx);
            coin.x += Math.cos(pullAngle) * pullSpeed;
            coin.y += Math.sin(pullAngle) * pullSpeed;
        }

        if (dist < player.radius + coin.radius + 6) { // Pick up!
            coins.splice(cIdx, 1);
            playSound(sfxCoinPickup);
            activeCoins++;
            totalCoinsCollected++;

            // Automatic grenade award every 50 coins
            if (totalCoinsCollected - lastGrenadeAwardAt >= 50) {
                const thresholds = Math.floor((totalCoinsCollected - lastGrenadeAwardAt) / 50);
                const spaceLeft = 10 - player.grenades;
                const grant = Math.min(thresholds, spaceLeft);
                if (grant > 0) {
                    player.grenades += grant;
                    grenadesContainer.classList.add('pulse');
                    setTimeout(() => grenadesContainer.classList.remove('pulse'), 600);
                }
                lastGrenadeAwardAt += thresholds * 50;
            }

            spawnCoinSparkles(coin.x, coin.y, 6);
            updateHUD();
        }
    }

    // 3. Player picks up Key
    for (let kIdx = levelKeys.length - 1; kIdx >= 0; kIdx--) {
        const keyObj = levelKeys[kIdx];
        if (keyObj.collected) continue;

        const dx = player.x - keyObj.x;
        const dy = player.y - keyObj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.radius + keyObj.radius) {
            keyObj.collected = true;
            playSound(sfxKeyPickup);
            keysCollected++;
            showDialogue(player, "Ah ha! a key!", 2);
            if (keysCollected === 4) {
                showDialogue(player, "lets get to the gate!", 3);
            }
            activeCoins += 100; // Bonus for key
            totalCoinsCollected += 100;
            // Check if key bonus crossed a 50-coin grenade threshold
            if (totalCoinsCollected - lastGrenadeAwardAt >= 50) {
                const thresholds = Math.floor((totalCoinsCollected - lastGrenadeAwardAt) / 50);
                const spaceLeft = 10 - player.grenades;
                const grant = Math.min(thresholds, spaceLeft);
                if (grant > 0) {
                    player.grenades += grant;
                    grenadesContainer.classList.add('pulse');
                    setTimeout(() => grenadesContainer.classList.remove('pulse'), 600);
                }
                lastGrenadeAwardAt += thresholds * 50;
            }
            spawnSplatter(keyObj.x, keyObj.y, '#fbbf24', 15);
            updateHUD();
        }
    }

    // 4. Level Complete Check
    if (keysCollected === 4 && gameState === STATE_PLAYING) {
        if (levelGate && levelGate.checkCollision(player)) {
            endLevel();
        }
    }
}


/* ==========================================================================
   RENDER & UPDATE ENGINE LOOP
   ========================================================================== */

function update(dt) {
    if (gameState !== STATE_PLAYING) return;

    gameElapsedTime += dt;
    timeSurvived += dt;

    // Dialogue system updates
    for (let i = activeDialogues.length - 1; i >= 0; i--) {
        activeDialogues[i].duration -= dt;
        if (activeDialogues[i].duration <= 0) {
            activeDialogues.splice(i, 1);
        }
    }

    // Level-specific intro story triggers
    if (currentLevel === 1) {
        if (timeSurvived > 2 && timeSurvived - dt <= 2) {
            showDialogue(player, "What on earth has happened to my town, why is everyone a zombie?", 4);
        }
        if (timeSurvived > 7 && timeSurvived - dt <= 7) {
            showDialogue('distant', "HA HA HA HA! I have turned your whole town into zombies you will never stop me!", 5, '#ff4444', 'rgba(0,0,0,0.9)');
        }
    } else if (currentLevel === 3) {
        if (timeSurvived > 3 && timeSurvived - dt <= 3) {
            const boss = zombies.find(z => z.type === 'boss');
            if (boss) showDialogue(boss, "Oh no, my hair is getting messed up!", 4, '#ffb6c1');
        }
    }

    // Random barks
    if (zombies.length > 0) {
        randomBarkTimer -= dt;
        if (randomBarkTimer <= 0) {
            const barks = ["Bring it!", "Take that you zombie waffle!", "Eat lead!", "Is that all you got?"];
            const bark = barks[Math.floor(Math.random() * barks.length)];
            showDialogue(player, bark, 2, 'white', 'rgba(0, 50, 150, 0.8)');
            randomBarkTimer = 15 + Math.random() * 10;
        }
    }

    // All zombies cleared trigger
    if (zombies.length === 0 && keysCollected < 4 && !allZombiesClearedTriggered) {
        allZombiesClearedTriggered = true;
        showDialogue(player, "Right lets get the keys to the Countryside gate! We must stop the Zombie king!", 4);
    }


    // 1. Camera translation and keys
    camera.x = Math.max(0, Math.min(player.x - canvas.width / 2, WORLD_WIDTH - canvas.width));
    camera.y = Math.max(0, Math.min(player.y - canvas.height / 2, WORLD_HEIGHT - canvas.height));
    levelKeys.forEach(k => k.update(dt));

    // 2. Update entities
    player.update(dt);

    bullets.forEach(b => b.update(dt));

    // Update zombies, filtering out bite status if player is dead
    zombies.forEach(z => z.update(dt));

    // Update coins (remove if glitching or simply let stay on floor)
    coins.forEach(c => c.update(dt));
    powerUps.forEach(p => p.update(dt));
    destructibles.forEach(d => d.update(dt));

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update(dt);
        if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }

    // Update grenades (filtering completed detonations)
    for (let i = grenades.length - 1; i >= 0; i--) {
        const exploded = grenades[i].update(dt);
        if (exploded) {
            grenades.splice(i, 1);
        }
    }

    // Update active particle clusters
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update explosion rings
    for (let i = explosions.length - 1; i >= 0; i--) {
        const finished = explosions[i].update(dt);
        if (finished) {
            explosions.splice(i, 1);
        }
    }

    // 2.8 Update Powerups UI
    if (player && typeof document !== 'undefined') {
        const pus = [
            { id: 'pu-weapon', timer: player.weaponPowerUpTimer, max: 20000 },
            { id: 'pu-shield', timer: player.shieldTimer, max: 30000 },
            { id: 'pu-multiplier', timer: player.multiplierTimer, max: 20000 },
            { id: 'pu-magnet', timer: player.magnetTimer, max: 20000 }
        ];
        pus.forEach(pu => {
            const el = document.getElementById(pu.id);
            if (el) {
                if (pu.timer > 0) {
                    el.classList.remove('hidden');
                    const pct = Math.max(0, Math.min(100, (pu.timer / pu.max) * 100));
                    el.style.setProperty('--pu-pct', pct);
                } else {
                    el.classList.add('hidden');
                }
            }
        });
    }

    // 3. Resolve collisions
    handleCollisions();
}

function draw() {
    ctx.save();

    // 1. Screen Shake Translation
    if (screenShake > 0.2) {
        const dx = (Math.random() - 0.5) * screenShake;
        const dy = (Math.random() - 0.5) * screenShake;
        ctx.translate(dx, dy);
        screenShake *= 0.9; // Shake decay
    } else {
        screenShake = 0;
    }

    // 2. Draw Background and Camera Translation
    ctx.translate(-camera.x, -camera.y);

    if (typeof window !== 'undefined' && window.mapGrid && window.tilesetCanvas) {
        const ts = window.tilesetCanvas;
        const tsSize = window.tileSize;
        
        // Calculate visible bounds (culling)
        const startC = Math.max(0, Math.floor(camera.x / tsSize));
        const endC = Math.min(window.mapGrid[0].length - 1, Math.floor((camera.x + canvas.width) / tsSize));
        const startR = Math.max(0, Math.floor(camera.y / tsSize));
        const endR = Math.min(window.mapGrid.length - 1, Math.floor((camera.y + canvas.height) / tsSize));
        
        for (let r = startR; r <= endR; r++) {
            for (let c = startC; c <= endC; c++) {
                const tileId = window.mapGrid[r][c];
                if (tileId !== 0) {
                    ctx.drawImage(
                        ts,
                        tileId * tsSize, 0, tsSize, tsSize,
                        c * tsSize, r * tsSize, tsSize, tsSize
                    );
                }
            }
        }

        // Draw decals over the map
        if (window.levelDecals) {
            for (let decal of window.levelDecals) {
                if (decal.x > camera.x - 1000 && decal.x < camera.x + canvas.width + 1000 &&
                    decal.y > camera.y - 1000 && decal.y < camera.y + canvas.height + 1000) {
                    decal.draw(ctx);
                }
            }
        }
    } else {
        ctx.fillStyle = '#111317';
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    }

    // 2.5 Draw Keys
    levelKeys.forEach(k => k.draw(ctx));

    // 3. Draw static Floor Blood Decals
    bloodDecals.forEach(decal => decal.draw(ctx));

    // 4. Draw Coin shadows and coins
    coins.forEach(c => c.drawShadow(ctx));
    coins.forEach(c => c.draw(ctx));

    destructibles.forEach(d => d.draw(ctx));
    if (levelGate) levelGate.draw(ctx);
    powerUps.forEach(p => p.draw(ctx));

    // 5. Draw Grenade shadows and flying grenade projectiles
    grenades.forEach(g => g.drawShadow(ctx));
    grenades.forEach(g => g.draw(ctx));

    // 6. Draw Bullets
    bullets.forEach(b => b.draw(ctx));

    // 7. Draw Zombies
    zombies.forEach(z => z.draw(ctx));

    // 8. Draw Player
    if (player) {
        player.draw(ctx);
    }

    // 9. Draw active explosion visual rings
    explosions.forEach(exp => exp.draw(ctx));

    // 10. Draw Particles
    particles.forEach(p => p.draw(ctx));

    // 10.5 Draw Floating Texts
    floatingTexts.forEach(f => f.draw(ctx));

    // 10.6 Draw Speech Bubbles
    activeDialogues.forEach(dialogue => {
        let x, y;
        if (dialogue.target === 'distant') {
            x = camera.x + canvas.width / 2;
            y = camera.y + 100;
        } else if (dialogue.target === player) {
            x = player.x;
            y = player.y - player.radius - 25;
        } else if (dialogue.target && dialogue.target.x !== undefined) {
            x = dialogue.target.x;
            y = dialogue.target.y - dialogue.target.radius - 35;
        } else {
            return;
        }

        ctx.font = 'bold 16px "Arial", sans-serif';
        const maxWidth = 250;
        const words = dialogue.text.split(' ');
        let lines = [];
        let currentLine = words[0] || '';

        for (let i = 1; i < words.length; i++) {
            let word = words[i];
            let width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);

        const padding = 10;
        const lineHeight = 20;
        const boxHeight = lines.length * lineHeight + padding * 2;
        let maxLineWidth = 0;
        lines.forEach(line => {
            let w = ctx.measureText(line).width;
            if (w > maxLineWidth) maxLineWidth = w;
        });
        const boxWidth = maxLineWidth + padding * 2;

        const boxX = x - boxWidth / 2;
        const boxY = y - boxHeight;

        // Draw bubble background
        ctx.fillStyle = dialogue.bgColor;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
        } else {
            ctx.rect(boxX, boxY, boxWidth, boxHeight);
        }
        ctx.fill();

        // Draw tail if not distant
        if (dialogue.target !== 'distant') {
            ctx.fillStyle = dialogue.bgColor;
            ctx.beginPath();
            ctx.moveTo(x - 8, boxY + boxHeight);
            ctx.lineTo(x + 8, boxY + boxHeight);
            ctx.lineTo(x, boxY + boxHeight + 12);
            ctx.fill();
        }

        // Draw text
        ctx.fillStyle = dialogue.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        lines.forEach((line, i) => {
            ctx.fillText(line, x, boxY + padding + (i * lineHeight));
        });
    });

    // 11. DYNAMIC LIGHTING / FLASHLIGHT OVERLAY
    if (gameState === STATE_PLAYING && player && zombies.length > 0) {
        drawLightingOverlay();
    }

    // Draw Development Colliders if toggled
    if (showColliders && typeof window !== 'undefined' && window.mapGrid) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        for (let r = 0; r < window.mapGrid.length; r++) {
            for (let c = 0; c < window.mapGrid[r].length; c++) {
                if (window.impassableTiles && window.impassableTiles.includes(window.mapGrid[r][c])) {
                    ctx.fillRect(c * window.tileSize, r * window.tileSize, window.tileSize, window.tileSize);
                }
            }
        }
    }

    ctx.restore();

    // 12. Draw Minimap in UI space
    drawMinimap();
}

function drawLightingOverlay() {
    // 1. Reset/Clear offscreen shadow canvas with lighter ambient darkness so scenery is visible
    if (currentLevel === 2) {
        lightCtx.fillStyle = 'rgba(84, 87, 90, 0.45)'; // White/grey fog
    } else {
        lightCtx.fillStyle = 'rgba(6, 7, 10, 0.45)'; // Lighter ambient shadow (from 0.55 down to 0.45)
    }
    lightCtx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Carve holes in shadows (destination-out blend mode)
    lightCtx.globalCompositeOperation = 'destination-out';
    lightCtx.save();
    lightCtx.translate(-camera.x, -camera.y);

    // A. Player Flashlight beam cone (Sector facing mouse direction)
    const beamRadius = 320; // Increased radius from 260 to 320 for better visibility
    const beamHalfAngle = 0.45; // Wider angle cone (from 0.32 to 0.45 radians)

    // Create soft fading flashlight radial gradient
    let flashGrad = lightCtx.createRadialGradient(
        player.x, player.y, 20,
        player.x, player.y, beamRadius
    );
    flashGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    flashGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.9)');
    flashGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.4)');
    flashGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    lightCtx.fillStyle = flashGrad;
    lightCtx.beginPath();
    lightCtx.moveTo(player.x, player.y);
    lightCtx.arc(
        player.x, player.y,
        beamRadius,
        player.angle - beamHalfAngle,
        player.angle + beamHalfAngle
    );
    lightCtx.closePath();
    lightCtx.fill();

    // B. Player personal ambient glow (reveals immediate surroundings)
    const ambientRadius = 250; // Increased ambient radius for a wider, gradual blur
    let playerAmbientGrad = lightCtx.createRadialGradient(
        player.x, player.y, 0,
        player.x, player.y, ambientRadius
    );
    playerAmbientGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    playerAmbientGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.7)');
    playerAmbientGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)');
    playerAmbientGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    lightCtx.fillStyle = playerAmbientGrad;
    lightCtx.beginPath();
    lightCtx.arc(player.x, player.y, ambientRadius, 0, Math.PI * 2);
    lightCtx.fill();

    // C. Grenade explosion flashes (high-luminosity glowing sectors)
    explosions.forEach(exp => {
        const radiusMultiplier = 1.6;
        let expGrad = lightCtx.createRadialGradient(
            exp.x, exp.y, 0,
            exp.x, exp.y, exp.maxRadius * radiusMultiplier
        );
        expGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        expGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
        expGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

        lightCtx.fillStyle = expGrad;
        lightCtx.beginPath();
        lightCtx.arc(exp.x, exp.y, exp.maxRadius * radiusMultiplier, 0, Math.PI * 2);
        lightCtx.fill();
    });

    // D. Bullet tracer ambient emissions (subtle tiny bullet lights)
    bullets.forEach(b => {
        let bGrad = lightCtx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 25);
        bGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        bGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

        lightCtx.fillStyle = bGrad;
        lightCtx.beginPath();
        lightCtx.arc(b.x, b.y, 25, 0, Math.PI * 2);
        lightCtx.fill();
    });

    // E. Environmental level lights (lampposts, torches)
    if (typeof window !== 'undefined' && window.levelLights) {
        window.levelLights.forEach(l => {
            if (l.x > camera.x - l.radius && l.x < camera.x + canvas.width + l.radius && l.y > camera.y - l.radius && l.y < camera.y + canvas.height + l.radius) {
                let lGrad = lightCtx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.radius);
                lGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
                lGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
                lGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
                lightCtx.fillStyle = lGrad;
                lightCtx.beginPath();
                lightCtx.arc(l.x, l.y, l.radius, 0, Math.PI * 2);
                lightCtx.fill();
            }
        });
    }

    // Reset compositing mode back to default source-over
    lightCtx.restore();
    lightCtx.globalCompositeOperation = 'source-over';

    // 3. Render dynamic shadow texture mask directly over main canvas at camera.x/y so it aligns with screen
    ctx.drawImage(lightCanvas, camera.x, camera.y);
}

function autoAim() {
    if (!autoAimEnabled || zombies.length === 0) return;
    // Find nearest zombie
    let nearest = null;
    let minDist = Infinity;
    zombies.forEach(z => {
        const dx = z.x - player.x;
        const dy = z.y - player.y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
            minDist = dist;
            nearest = z;
        }
    });
    if (nearest) {
        player.angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    }
}

function gameLoop(time) {
    let dt = lastTime ? (time - lastTime) / 1000 : 0.016;
    lastTime = time;
    if (dt > 0.1 || dt < 0) dt = 0.016;

    // Poll Gamepad Controllers every animation frame across all states
    pollGamepads(dt);

    // Update gameplay only when actively playing and no blocking modal is open
    if (gameState === STATE_PLAYING && !isModalOpen('info-modal') && !isModalOpen('highscore-modal') && !isNameEntryActive()) {
        autoAim();
        update(dt);
        draw();
    }

    requestAnimationFrame(gameLoop);
}

// ---------------------------------------------------------------------
// High Score System (Top 10 Persistence, Auto-Focus Input & Highlight)
// ---------------------------------------------------------------------

const HIGHSCORE_STORAGE_KEY = 'zombie_apocalypse_high_scores';
const LEGACY_HIGHSCORE_KEY = 'highScores';
const MAX_HIGHSCORES = 10;
let lastInsertedScoreId = null;

function getDefaultHighScores() {
    return [
        { id: 'def_1', name: 'LEO', score: 850, date: '2026-01-01' },
        { id: 'def_2', name: 'REX', score: 600, date: '2026-01-01' },
        { id: 'def_3', name: 'ZOE', score: 400, date: '2026-01-01' },
        { id: 'def_4', name: 'MAX', score: 250, date: '2026-01-01' },
        { id: 'def_5', name: 'ASH', score: 120, date: '2026-01-01' }
    ];
}

function loadHighScores() {
    try {
        const raw = localStorage.getItem(HIGHSCORE_STORAGE_KEY) || localStorage.getItem(LEGACY_HIGHSCORE_KEY);
        if (!raw) return getDefaultHighScores();
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) return getDefaultHighScores();
        return parsed.map((entry, idx) => ({
            id: entry.id || `legacy_${idx}`,
            name: String(entry.name || 'ANON').toUpperCase().slice(0, 10),
            score: Number(entry.score) || 0,
            date: entry.date || '2026-01-01'
        })).sort((a, b) => b.score - a.score).slice(0, MAX_HIGHSCORES);
    } catch {
        return getDefaultHighScores();
    }
}

function saveHighScores(scores) {
    try {
        localStorage.setItem(HIGHSCORE_STORAGE_KEY, JSON.stringify(scores));
        localStorage.setItem(LEGACY_HIGHSCORE_KEY, JSON.stringify(scores));
    } catch (e) {
        console.log('HighScore save error:', e);
    }
}

function isHighScore(score) {
    if (score <= 0) return false;
    const scores = loadHighScores();
    if (scores.length < MAX_HIGHSCORES) return true;
    return score > scores[scores.length - 1].score;
}

function addHighScoreEntry(name, score) {
    const scores = loadHighScores();
    const entryId = 'score_' + Date.now();
    const cleanName = (String(name || '').trim().toUpperCase() || 'LEO').slice(0, 10);
    const today = new Date().toISOString().split('T')[0];

    scores.push({
        id: entryId,
        name: cleanName,
        score: Math.floor(score),
        date: today
    });
    scores.sort((a, b) => b.score - a.score);
    if (scores.length > MAX_HIGHSCORES) {
        scores.length = MAX_HIGHSCORES;
    }
    lastInsertedScoreId = entryId;
    saveHighScores(scores);
    return entryId;
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[ch]));
}

function showHighScoreModal(fromGameOver = true) {
    const modal = document.getElementById('highscore-modal');
    const tbody = document.getElementById('highscore-tbody');
    const scores = loadHighScores();
    if (tbody) {
        tbody.innerHTML = scores.map((entry, idx) => {
            const isNew = entry.id === lastInsertedScoreId;
            return `
                <tr class="${isNew ? 'row-new-entry' : ''}">
                    <td class="col-rank">#${idx + 1}</td>
                    <td class="col-name">${escapeHtml(entry.name)}${isNew ? ' <span class="new-pill">NEW!</span>' : ''}</td>
                    <td class="col-score">${entry.score.toLocaleString()}</td>
                    <td class="col-date">${escapeHtml(entry.date || '2026-01-01')}</td>
                </tr>
            `;
        }).join('');
    }
    modal.classList.remove('hidden');
    syncMenuFocus();
    updateCursorVisibility();
}

function closeHighScoreModal() {
    document.getElementById('highscore-modal').classList.add('hidden');
    syncMenuFocus();
    updateCursorVisibility();
}

const PRESET_CALLSIGNS = ['LEO', 'ACE', 'SLAYER', 'HUNTER', 'NOVA', 'REX', 'ZOE', 'BLAZE', 'VIPER', 'GHOST'];
let presetCallsignIndex = 0;

function handleHighScore(score) {
    if (isHighScore(score)) {
        const overlay = document.getElementById('name-entry-overlay');
        const input = document.getElementById('player-name-input');
        const scoreNumEl = document.getElementById('entry-score-num');
        const form = document.getElementById('score-entry-form');

        if (scoreNumEl) scoreNumEl.textContent = Math.floor(score).toLocaleString();
        presetCallsignIndex = 0;
        input.value = '';
        overlay.classList.remove('hidden');
        updateCursorVisibility();

        setTimeout(() => {
            input.focus();
            input.select();
        }, 60);

        const submitName = (ev) => {
            if (ev) ev.preventDefault();
            if (overlay.classList.contains('hidden')) return;
            playSound(sfxUiClick);
            const name = input.value.trim() || 'LEO';
            overlay.classList.add('hidden');
            addHighScoreEntry(name, score);
            updateHUD();
            showHighScoreModal(true);
        };

        if (form) {
            form.onsubmit = submitName;
        }
        document.getElementById('name-submit-btn').onclick = submitName;
    } else {
        lastInsertedScoreId = null;
    }
}

function updateAutoAimIndicator() {
    const el = document.getElementById('auto-aim-indicator');
    if (!el) return;
    el.textContent = autoAimEnabled ? 'AUTO-AIM: ON' : 'AUTO-AIM: OFF';
    el.classList.toggle('off', !autoAimEnabled);
}

// Close button for highscore modal
document.getElementById('highscore-close').addEventListener('click', () => { playSound(sfxUiClick); closeHighScoreModal(); });

// ---------------------------------------------------------------------
// Cursor Visibility & Modal / Menu Focus Navigation
// ---------------------------------------------------------------------

function updateCursorVisibility() {
    const hasOpenModal = isModalOpen('info-modal') || isModalOpen('highscore-modal') || isNameEntryActive();
    const isActiveGameplay = (gameState === STATE_PLAYING) && !hasOpenModal;
    canvasWrapper.classList.toggle('playing', isActiveGameplay);
    document.body.classList.toggle('in-game-playing', isActiveGameplay);
    document.body.classList.toggle('hide-cursor', isActiveGameplay);
}

let currentFocusIndex = 0;

function getActiveMenuElements() {
    if (isNameEntryActive()) {
        const btn = document.getElementById('name-submit-btn');
        return btn ? [btn] : [];
    }
    if (isModalOpen('info-modal')) {
        return [document.getElementById('info-close-btn')].filter(Boolean);
    }
    if (isModalOpen('highscore-modal')) {
        return [document.getElementById('highscore-close')].filter(Boolean);
    }
    if (gameState === STATE_PAUSED) {
        return [
            document.getElementById('pause-continue-btn'),
            document.getElementById('pause-restart-btn'),
            document.getElementById('sfx-toggle'),
            document.getElementById('music-toggle'),
            document.getElementById('pause-info-btn'),
            document.getElementById('pause-highscore-btn'),
            document.getElementById('pause-menu-btn')
        ].filter(Boolean);
    }
    if (gameState === STATE_LEVEL_COMPLETE) {
        if (!winScreen.classList.contains('hidden')) {
            return [
                document.getElementById('win-restart-btn'),
                document.getElementById('win-highscore-btn'),
                document.getElementById('win-menu-btn')
            ].filter(Boolean);
        }
        return [
            document.getElementById('next-level-btn'),
            document.getElementById('lc-menu-btn')
        ].filter(Boolean);
    }
    if (gameState === STATE_GAMEOVER) {
        return [
            document.getElementById('restart-btn'),
            document.getElementById('gameover-highscore-btn'),
            document.getElementById('main-menu-btn')
        ].filter(Boolean);
    }
    if (gameState === STATE_INTRO) {
        return [
            document.getElementById('start-btn'),
            document.getElementById('highscores-btn'),
            document.getElementById('info-btn')
        ].filter(Boolean);
    }
    return [];
}

function clearMenuFocus() {
    document.querySelectorAll('.gamepad-focus').forEach(el => el.classList.remove('gamepad-focus'));
}

function syncMenuFocus() {
    clearMenuFocus();
    const items = getActiveMenuElements();
    if (items.length === 0) return;
    currentFocusIndex = 0;
    items[0].classList.add('gamepad-focus');
}

function moveMenuFocus(delta) {
    const items = getActiveMenuElements();
    if (items.length === 0) return;
    clearMenuFocus();
    currentFocusIndex = (currentFocusIndex + delta + items.length) % items.length;
    const target = items[currentFocusIndex];
    target.classList.add('gamepad-focus');
    playSound(sfxUiClick);
}

function activateFocusedMenuElement() {
    const items = getActiveMenuElements();
    if (items.length === 0) return;
    if (currentFocusIndex < 0 || currentFocusIndex >= items.length) {
        currentFocusIndex = 0;
    }
    const target = items[currentFocusIndex];
    if (target) {
        target.click();
    }
}

// ---------------------------------------------------------------------
// HTML5 Gamepad Controller Support (1-Player + Full Menu Navigation)
// ---------------------------------------------------------------------

const gpState = {
    connectedCount: -1,
    moveX: 0,
    moveY: 0,
    aimActive: false,
    aimAngle: 0,
    shootDown: false,
    lastActiveAt: 0,
    prevActions: {},
    holdTimer: 0,
    repeatTimer: 0
};

function isGpButtonPressed(gp, index, threshold = 0.3) {
    if (!gp || !gp.buttons || !gp.buttons[index]) return false;
    const btn = gp.buttons[index];
    return Boolean(btn.pressed || (typeof btn.value === 'number' && btn.value > threshold));
}

function triggerGamepadRumble(durationMs = 120, weakMagnitude = 0.5, strongMagnitude = 0.7) {
    try {
        if (!navigator.getGamepads) return;
        const pads = Array.from(navigator.getGamepads()).filter(Boolean);
        const gp = pads[0];
        if (gp && gp.vibrationActuator && typeof gp.vibrationActuator.playEffect === 'function') {
            gp.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: durationMs,
                weakMagnitude,
                strongMagnitude
            }).catch(() => {});
        }
    } catch {
        // Ignore rumble errors on unsupported controllers
    }
}

function updateGamepadBadges(count) {
    const splashBadge = document.getElementById('splash-gamepad-badge');
    const hudBadge = document.getElementById('hud-gamepad-badge');
    const isConnected = count > 0;

    if (splashBadge) {
        splashBadge.textContent = isConnected ? '🎮 1 Controller Ready (P1)' : '🎮 No Pad (Plug & Press)';
        splashBadge.classList.toggle('ready', isConnected);
    }
    if (hudBadge) {
        hudBadge.textContent = isConnected ? '🎮 Pad Ready' : '🎮 No Pad';
        hudBadge.classList.toggle('ready', isConnected);
    }
}

window.addEventListener('gamepadconnected', () => {
    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    gpState.connectedCount = pads.length;
    updateGamepadBadges(pads.length);
});

window.addEventListener('gamepaddisconnected', () => {
    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    gpState.connectedCount = pads.length;
    updateGamepadBadges(pads.length);
});

function pollGamepads(dt) {
    if (!navigator.getGamepads) return;
    const pads = Array.from(navigator.getGamepads()).filter(Boolean);
    if (pads.length !== gpState.connectedCount) {
        gpState.connectedCount = pads.length;
        updateGamepadBadges(pads.length);
    }

    const gp = pads[0];
    if (!gp) {
        gpState.moveX = 0;
        gpState.moveY = 0;
        gpState.aimActive = false;
        gpState.shootDown = false;
        gpState.prevActions = {};
        return;
    }

    const axisX = gp.axes && gp.axes.length > 0 ? gp.axes[0] : 0;
    const axisY = gp.axes && gp.axes.length > 1 ? gp.axes[1] : 0;

    // On raw 0810:0001 Twin USB Gamepads (non-standard mapping), axes[2] is ABS_Z (Right Stick Y) and axes[3] is ABS_RZ (Right Stick X)
    const isRawTwinUsb = gp.mapping !== 'standard' && /0810/i.test(gp.id || '');
    const rawAxis2 = gp.axes && gp.axes.length > 2 ? gp.axes[2] : 0;
    const rawAxis3 = gp.axes && gp.axes.length > 3 ? gp.axes[3] : 0;
    const rightX = isRawTwinUsb ? rawAxis3 : rawAxis2;
    const rightY = isRawTwinUsb ? rawAxis2 : rawAxis3;

    const hatX = (gp.mapping !== 'standard' && gp.axes && gp.axes.length > 4) ? gp.axes[4] : 0;
    const hatY = (gp.mapping !== 'standard' && gp.axes && gp.axes.length > 5) ? gp.axes[5] : 0;

    const dpadUp = isGpButtonPressed(gp, 12) || hatY < -0.5;
    const dpadDown = isGpButtonPressed(gp, 13) || hatY > 0.5;
    const dpadLeft = isGpButtonPressed(gp, 14) || hatX < -0.5;
    const dpadRight = isGpButtonPressed(gp, 15) || hatX > 0.5;

    // Left Stick / D-Pad controls movement strictly
    let mx = Math.abs(axisX) > 0.35 ? axisX : 0;
    let my = Math.abs(axisY) > 0.35 ? axisY : 0;
    if (dpadLeft) mx = -1;
    if (dpadRight) mx = 1;
    if (dpadUp) my = -1;
    if (dpadDown) my = 1;

    gpState.moveX = mx;
    gpState.moveY = my;

    // Right Stick controls aiming direction (player rotation) when auto-aim is OFF
    const rightMag = Math.sqrt(rightX * rightX + rightY * rightY);
    gpState.aimActive = rightMag > 0.35;
    if (gpState.aimActive) {
        gpState.aimAngle = Math.atan2(rightY, rightX);
    }

    // Actions mapping per Gamepad Controller Support specification
    const actions = {
        menuUp: axisY < -0.48 || dpadUp,
        menuDown: axisY > 0.48 || dpadDown,
        menuLeft: axisX < -0.48 || dpadLeft,
        menuRight: axisX > 0.48 || dpadRight,
        // Button 3 (buttons[2], blue button) primary confirm + Button 1 (buttons[0]) fallback
        menuConfirm: isGpButtonPressed(gp, 2) || isGpButtonPressed(gp, 0),
        // Button 2 (buttons[1]) back/cancel
        menuBack: isGpButtonPressed(gp, 1),
        // Start button (buttons[9] or buttons[8]) strictly for pause/resume
        pause: isGpButtonPressed(gp, 9) || isGpButtonPressed(gp, 8),
        // Gameplay attacks
        shoot: isGpButtonPressed(gp, 0) || isGpButtonPressed(gp, 7, 0.3) || isGpButtonPressed(gp, 2),
        grenade: isGpButtonPressed(gp, 1) || isGpButtonPressed(gp, 5),
        // Auto-Aim toggles strictly on Button 4 (buttons[3])
        autoAim: isGpButtonPressed(gp, 3) && !gpState.aimActive
    };

    const justPressed = {};
    for (const k of Object.keys(actions)) {
        justPressed[k] = Boolean(actions[k] && !gpState.prevActions[k]);
    }
    gpState.prevActions = { ...actions };

    const anyInput = Object.values(actions).some(Boolean) || Math.abs(mx) > 0.1 || Math.abs(my) > 0.1 || gpState.aimActive;
    if (anyInput) {
        gpState.lastActiveAt = performance.now();
        initAudio();
    }

    // 1. Name Entry Overlay Gamepad Controls
    if (isNameEntryActive()) {
        if (justPressed.menuLeft || justPressed.menuRight) {
            const dir = justPressed.menuRight ? 1 : -1;
            presetCallsignIndex = (presetCallsignIndex + dir + PRESET_CALLSIGNS.length) % PRESET_CALLSIGNS.length;
            const input = document.getElementById('player-name-input');
            if (input) input.value = PRESET_CALLSIGNS[presetCallsignIndex];
            playSound(sfxUiClick);
        }
        if (justPressed.menuConfirm) {
            const submitBtn = document.getElementById('name-submit-btn');
            if (submitBtn) submitBtn.click();
        }
        return;
    }

    // 2. Open Sub-Modals (Info Modal / High Scores Modal)
    if (isModalOpen('info-modal')) {
        if (actions.menuUp || actions.menuDown) {
            const body = document.getElementById('info-modal-body');
            if (body) body.scrollTop += (actions.menuDown ? 260 : -260) * dt;
        }
        if (justPressed.menuConfirm || justPressed.menuBack) {
            playSound(sfxUiClick);
            closeInfoModal();
        }
        return;
    }

    if (isModalOpen('highscore-modal')) {
        if (justPressed.menuConfirm || justPressed.menuBack) {
            playSound(sfxUiClick);
            closeHighScoreModal();
        }
        return;
    }

    // 3. Pause / Resume via Start Button
    if (justPressed.pause) {
        if (gameState === STATE_PLAYING || gameState === STATE_PAUSED) {
            playSound(sfxUiClick);
            togglePause();
            return;
        }
    }

    // 4. Non-Playing Screens (Splash, Pause, Level Complete, Victory, Game Over)
    if (gameState !== STATE_PLAYING) {
        if (gameState === STATE_PAUSED && justPressed.menuBack) {
            playSound(sfxUiClick);
            resumeGame();
            return;
        }

        const dirHeld = actions.menuUp || actions.menuDown || actions.menuLeft || actions.menuRight;
        const dirJust = justPressed.menuUp || justPressed.menuDown || justPressed.menuLeft || justPressed.menuRight;
        const step = (actions.menuDown || actions.menuRight) ? 1 : -1;

        if (dirJust) {
            moveMenuFocus(step);
            gpState.holdTimer = 0;
            gpState.repeatTimer = 0;
        } else if (dirHeld) {
            gpState.holdTimer += dt;
            if (gpState.holdTimer >= 0.36) {
                gpState.repeatTimer += dt;
                if (gpState.repeatTimer >= 0.15) {
                    gpState.repeatTimer = 0;
                    moveMenuFocus(step);
                }
            }
        } else {
            gpState.holdTimer = 0;
            gpState.repeatTimer = 0;
        }

        if (justPressed.menuConfirm) {
            activateFocusedMenuElement();
        }
        return;
    }

    // 5. Active Gameplay Controls
    gpState.shootDown = actions.shoot;
    if (justPressed.grenade) {
        fireGrenade();
    }
    if (justPressed.autoAim) {
        autoAimEnabled = !autoAimEnabled;
        updateAutoAimIndicator();
    }
}

// Initialize focus and start persistent master loop immediately
syncMenuFocus();
updateGamepadBadges(0);
loopStarted = true;
lastTime = performance.now();
requestAnimationFrame(gameLoop);

