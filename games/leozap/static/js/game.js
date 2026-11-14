import Player from './player.js';
import Enemy from './enemy.js';
import LevelManager from './levelManager.js';
import SoundManager from './soundManager.js';

// Make SoundManager globally accessible so player.js / enemy.js can call it
window.SoundManager = SoundManager;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ─── Game State ───────────────────────────────────────────────────────────────
const GAME_VERSION = 'v1.6.0';
let gameRunning = false;
let paused = false;
let score = 0;
let level = 1;
let lastTime = 0;

// ─── Entities ─────────────────────────────────────────────────────────────────
let player;
let levelManager;

// ─── UI Elements ──────────────────────────────────────────────────────────────
const startScreen        = document.getElementById('start-screen');
const hud                = document.getElementById('hud');
const gameOverScreen     = document.getElementById('game-over-screen');
const scoreDisplay       = document.getElementById('score');
const levelDisplay       = document.getElementById('level');
const healthDisplay      = document.getElementById('health');
const powerDisplay       = document.getElementById('power-level');
const gemsDisplay        = document.getElementById('gems');
const finalScoreDisplay  = document.getElementById('final-score');
const finalLevelDisplay  = document.getElementById('final-level');
const startBtn           = document.getElementById('start-btn');
const restartBtn         = document.getElementById('restart-btn');
const showScoresBtn      = document.getElementById('show-scores-btn');
const hideScoresBtn      = document.getElementById('hide-scores-btn');
const saveScoreBtn       = document.getElementById('save-score-btn');
const saveScoreContainer = document.getElementById('save-score-container');
const highScoreBoard     = document.getElementById('high-score-board');
const highScoreList      = document.getElementById('high-score-list');
const playerNameInput    = document.getElementById('player-name');
const levelScreen        = document.getElementById('level-screen');
const levelTitle         = document.getElementById('level-title');
const muteBtn            = document.getElementById('mute-btn');
const muteMusicBtn       = document.getElementById('mute-music-btn');
const gamepadStatus      = document.getElementById('gamepad-status');
const gamepadStatusHud   = document.getElementById('gamepad-status-hud');
const gameVersionEl      = document.getElementById('game-version');

// Pause screen elements
const pauseScreen        = document.getElementById('pause-screen');
const resumeBtn          = document.getElementById('resume-btn');
const restartPauseBtn    = document.getElementById('restart-pause-btn');
const mutePauseBtn       = document.getElementById('mute-pause-btn');
const muteMusicPauseBtn  = document.getElementById('mute-music-pause-btn');
const showScoresPauseBtn = document.getElementById('show-scores-pause-btn');
const exitMainBtn        = document.getElementById('exit-main-btn');

// ─── Gamepad State & Configuration ────────────────────────────────────────────
const GP_DEADZONE = 0.35;
const GP_MENU_THRESHOLD = 0.48;
const GP_REPEAT_DELAY = 0.36;    // seconds before directional hold auto-repeats
const GP_REPEAT_INTERVAL = 0.15; // seconds between auto-repeat steps
const PRESET_NAMES = ['LEOZAP', 'STARLORD', 'NOVA', 'COSMO', 'ASTRO', 'BLAZE', 'FALCON', 'ACE'];

let gpActionsDown = {};
let gpPrevActionsDown = {};
let gpActionsJustPressed = {};
let gpActionsJustReleased = {};
let lastConnectedPadCount = -1;
let audioUnlockedByGamepad = false;
let suppressShootUntilRelease = false;

let currentMenuContext = null;
let menuFocusIndex = 0;
let presetNameIndex = 0;
const navHoldTimers = {
    menuUp: 0,
    menuDown: 0,
    menuLeft: 0,
    menuRight: 0
};
const navRepeatTimers = {
    menuUp: 0,
    menuDown: 0,
    menuLeft: 0,
    menuRight: 0
};

function getConnectedGamepads() {
    if (!navigator.getGamepads) return [];
    const raw = navigator.getGamepads();
    const list = [];
    if (!raw) return list;
    for (let i = 0; i < raw.length; i++) {
        if (raw[i] && raw[i].connected) {
            list.push(raw[i]);
        }
    }
    return list;
}

function isButtonPressed(gp, index, threshold = 0.5) {
    if (!gp || !gp.buttons || index >= gp.buttons.length) return false;
    const btn = gp.buttons[index];
    if (!btn) return false;
    return Boolean(btn.pressed || (typeof btn.value === 'number' && btn.value >= threshold));
}

function readGamepadActions(gp) {
    if (!gp) {
        return {
            up: false, down: false, left: false, right: false,
            axisX: 0, axisY: 0,
            action1: false, action2: false, action3: false, action4: false,
            action5: false, action6: false,
            shoot: false,
            menuUp: false, menuDown: false, menuLeft: false, menuRight: false,
            menuConfirm: false, menuBack: false, pause: false
        };
    }

    const axisX = (gp.axes && gp.axes.length > 0) ? gp.axes[0] : 0;
    const axisY = (gp.axes && gp.axes.length > 1) ? gp.axes[1] : 0;

    // Gameplay actions: Buttons 1–4 + Right Top R1/R2 + Left Top L1/L2 aliases
    const action1 = isButtonPressed(gp, 0);
    const action2 = isButtonPressed(gp, 1);
    const action3 = isButtonPressed(gp, 2);
    const action4 = isButtonPressed(gp, 3);
    const action5 = isButtonPressed(gp, 5);
    const action6 = isButtonPressed(gp, 7, 0.3);
    const l1 = isButtonPressed(gp, 4);
    const l2 = isButtonPressed(gp, 6, 0.3);

    return {
        up: axisY < -GP_DEADZONE || isButtonPressed(gp, 12),
        down: axisY > GP_DEADZONE || isButtonPressed(gp, 13),
        left: axisX < -GP_DEADZONE || isButtonPressed(gp, 14),
        right: axisX > GP_DEADZONE || isButtonPressed(gp, 15),
        axisX,
        axisY,
        action1,
        action2,
        action3,
        action4,
        action5,
        action6,
        shoot: action1 || action2 || action3 || action4 || action5 || action6 || l1 || l2,
        menuUp: axisY < -GP_MENU_THRESHOLD || isButtonPressed(gp, 12),
        menuDown: axisY > GP_MENU_THRESHOLD || isButtonPressed(gp, 13),
        menuLeft: axisX < -GP_MENU_THRESHOLD || isButtonPressed(gp, 14),
        menuRight: axisX > GP_MENU_THRESHOLD || isButtonPressed(gp, 15),
        // Button 3 (buttons[2], blue bottom-right button) is primary confirm; Button 1 (buttons[0]) fallback
        menuConfirm: isButtonPressed(gp, 2) || isButtonPressed(gp, 0),
        // Button 2 (buttons[1]) is back/cancel
        menuBack: isButtonPressed(gp, 1),
        // Start button (buttons[9] or buttons[8]) strictly for pause & resume
        pause: isButtonPressed(gp, 9) || isButtonPressed(gp, 8)
    };
}

function triggerGamepadRumble(weakMagnitude = 0.4, strongMagnitude = 0.7, duration = 120) {
    try {
        const pads = getConnectedGamepads();
        const gp = pads[0];
        if (gp && gp.vibrationActuator && typeof gp.vibrationActuator.playEffect === 'function') {
            gp.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration,
                weakMagnitude,
                strongMagnitude
            }).catch(() => {});
        }
    } catch (_e) {
        // Ignore unsupported vibration errors
    }
}
window.triggerGamepadRumble = triggerGamepadRumble;

function updateGamepadStatusBadge(count) {
    const text = count === 0
        ? '🎮 No Pad (Plug & Press)'
        : count === 1
            ? '🎮 1 Controller Ready'
            : `🎮 ${count} Controllers (P1)`;
    [gamepadStatus, gamepadStatusHud].forEach(el => {
        if (!el) return;
        el.textContent = text;
        el.classList.toggle('connected', count > 0);
    });
}

function getActiveMenuContext() {
    if (highScoreBoard && !highScoreBoard.classList.contains('hidden')) {
        return 'scores';
    }
    if (paused && pauseScreen && !pauseScreen.classList.contains('hidden')) {
        return 'pause';
    }
    if (gameOverScreen && !gameOverScreen.classList.contains('hidden')) {
        return 'gameover';
    }
    if (startScreen && !startScreen.classList.contains('hidden')) {
        return 'start';
    }
    return 'playing';
}

function getFocusableItemsForContext(context) {
    switch (context) {
        case 'scores':
            return [hideScoresBtn].filter(Boolean);
        case 'pause':
            return [
                resumeBtn,
                restartPauseBtn,
                mutePauseBtn,
                muteMusicPauseBtn,
                showScoresPauseBtn,
                exitMainBtn
            ].filter(Boolean);
        case 'gameover': {
            const canSave = saveScoreContainer && !saveScoreContainer.classList.contains('hidden');
            if (canSave) {
                return [playerNameInput, saveScoreBtn, restartBtn].filter(Boolean);
            }
            return [restartBtn].filter(Boolean);
        }
        case 'start':
            return [startBtn, showScoresBtn].filter(Boolean);
        default:
            return [];
    }
}

function syncMenuFocusHighlight() {
    const context = getActiveMenuContext();
    const items = getFocusableItemsForContext(context);

    if (context !== currentMenuContext) {
        currentMenuContext = context;
        // Default to Save Score button on Game Over when available so Button 3 immediately saves
        if (context === 'gameover' && items.length === 3) {
            menuFocusIndex = 1;
        } else {
            menuFocusIndex = 0;
        }
    }

    if (items.length > 0) {
        menuFocusIndex = ((menuFocusIndex % items.length) + items.length) % items.length;
    } else {
        menuFocusIndex = 0;
    }

    document.querySelectorAll('.gamepad-focus').forEach(el => {
        if (el !== items[menuFocusIndex]) {
            el.classList.remove('gamepad-focus');
        }
    });

    const target = items[menuFocusIndex];
    if (target && context !== 'playing') {
        target.classList.add('gamepad-focus');
    }
}

function checkDirectionalStep(dirKey, dtSec) {
    if (gpActionsJustPressed[dirKey]) {
        navHoldTimers[dirKey] = 0;
        navRepeatTimers[dirKey] = 0;
        return true;
    }
    if (gpActionsDown[dirKey]) {
        navHoldTimers[dirKey] += dtSec;
        if (navHoldTimers[dirKey] >= GP_REPEAT_DELAY) {
            navRepeatTimers[dirKey] += dtSec;
            if (navRepeatTimers[dirKey] >= GP_REPEAT_INTERVAL) {
                navRepeatTimers[dirKey] -= GP_REPEAT_INTERVAL;
                return true;
            }
        }
    } else {
        navHoldTimers[dirKey] = 0;
        navRepeatTimers[dirKey] = 0;
    }
    return false;
}

function pollGamepads(dtSec) {
    const pads = getConnectedGamepads();
    if (pads.length !== lastConnectedPadCount) {
        lastConnectedPadCount = pads.length;
        updateGamepadStatusBadge(pads.length);
    }

    const p1Pad = pads[0] || null;
    const nextActions = readGamepadActions(p1Pad);

    gpActionsJustPressed = {};
    gpActionsJustReleased = {};

    let anyJustPressed = false;
    for (const key of Object.keys(nextActions)) {
        if (typeof nextActions[key] === 'boolean') {
            const nowDown = nextActions[key];
            const wasDown = Boolean(gpPrevActionsDown[key]);
            gpActionsJustPressed[key] = nowDown && !wasDown;
            gpActionsJustReleased[key] = !nowDown && wasDown;
            if (gpActionsJustPressed[key]) anyJustPressed = true;
        }
    }

    gpPrevActionsDown = { ...nextActions };
    gpActionsDown = nextActions;

    // Unlock audio on first controller button press
    if (anyJustPressed && !audioUnlockedByGamepad) {
        audioUnlockedByGamepad = true;
        SoundManager.init();
        if (window.Howler && window.Howler.ctx && window.Howler.ctx.state === 'suspended') {
            window.Howler.ctx.resume().catch(() => {});
        }
    }

    if (suppressShootUntilRelease && !gpActionsDown.shoot) {
        suppressShootUntilRelease = false;
    }

    syncMenuFocusHighlight();

    const context = getActiveMenuContext();
    const stepUp = checkDirectionalStep('menuUp', dtSec);
    const stepDown = checkDirectionalStep('menuDown', dtSec);
    const stepLeft = checkDirectionalStep('menuLeft', dtSec);
    const stepRight = checkDirectionalStep('menuRight', dtSec);

    if (context === 'playing') {
        if (gpActionsJustPressed.pause && gameRunning) {
            togglePause();
            return;
        }
        if (player) {
            player.setGamepadInput({
                ...gpActionsDown,
                shoot: gpActionsDown.shoot && !suppressShootUntilRelease
            });
        }
        return;
    }

    // Outside active gameplay, clear gameplay movement on player
    if (player) {
        player.setGamepadInput(null);
    }

    // 1. High Score Modal Open
    if (context === 'scores') {
        const boardContent = highScoreBoard.querySelector('.board-content');
        if (boardContent) {
            if (stepUp) boardContent.scrollTop -= 60;
            if (stepDown) boardContent.scrollTop += 60;
        }
        if (gpActionsJustPressed.menuConfirm || gpActionsJustPressed.menuBack) {
            highScoreBoard.classList.add('hidden');
            syncMenuFocusHighlight();
        }
        return;
    }

    // 2. Pause Menu Open
    if (context === 'pause') {
        if (gpActionsJustPressed.pause || gpActionsJustPressed.menuBack) {
            suppressShootUntilRelease = true;
            togglePause();
            return;
        }
        const items = getFocusableItemsForContext('pause');
        if (items.length > 0) {
            if (stepUp || stepLeft) {
                menuFocusIndex = (menuFocusIndex - 1 + items.length) % items.length;
                syncMenuFocusHighlight();
            } else if (stepDown || stepRight) {
                menuFocusIndex = (menuFocusIndex + 1) % items.length;
                syncMenuFocusHighlight();
            }
            if (gpActionsJustPressed.menuConfirm) {
                const target = items[menuFocusIndex];
                if (target === resumeBtn || target === restartPauseBtn) {
                    suppressShootUntilRelease = true;
                }
                target?.click();
                syncMenuFocusHighlight();
            }
        }
        return;
    }

    // 3. Game Over Screen Open
    if (context === 'gameover') {
        const items = getFocusableItemsForContext('gameover');
        if (items.length > 0) {
            const focusedEl = items[menuFocusIndex];
            if (stepUp) {
                menuFocusIndex = (menuFocusIndex - 1 + items.length) % items.length;
                syncMenuFocusHighlight();
            } else if (stepDown) {
                menuFocusIndex = (menuFocusIndex + 1) % items.length;
                syncMenuFocusHighlight();
            } else if (focusedEl === playerNameInput && (stepLeft || stepRight)) {
                presetNameIndex = (presetNameIndex + (stepRight ? 1 : -1) + PRESET_NAMES.length) % PRESET_NAMES.length;
                playerNameInput.value = PRESET_NAMES[presetNameIndex];
            } else if (stepLeft) {
                menuFocusIndex = (menuFocusIndex - 1 + items.length) % items.length;
                syncMenuFocusHighlight();
            } else if (stepRight) {
                menuFocusIndex = (menuFocusIndex + 1) % items.length;
                syncMenuFocusHighlight();
            }

            if (gpActionsJustPressed.menuConfirm) {
                const activeTarget = items[menuFocusIndex];
                if (activeTarget === playerNameInput) {
                    if (!playerNameInput.value.trim()) {
                        playerNameInput.value = PRESET_NAMES[presetNameIndex];
                    }
                    saveScoreBtn?.click();
                } else {
                    if (activeTarget === restartBtn) {
                        suppressShootUntilRelease = true;
                    }
                    activeTarget?.click();
                }
                syncMenuFocusHighlight();
            }
        }
        return;
    }

    // 4. Start Screen Open
    if (context === 'start') {
        const items = getFocusableItemsForContext('start');
        if (items.length > 0) {
            if (stepUp || stepLeft) {
                menuFocusIndex = (menuFocusIndex - 1 + items.length) % items.length;
                syncMenuFocusHighlight();
            } else if (stepDown || stepRight) {
                menuFocusIndex = (menuFocusIndex + 1) % items.length;
                syncMenuFocusHighlight();
            }
            if (gpActionsJustPressed.menuConfirm) {
                const target = items[menuFocusIndex];
                if (target === startBtn) {
                    suppressShootUntilRelease = true;
                }
                target?.click();
                syncMenuFocusHighlight();
            }
        }
    }
}

function updateCursorVisibility() {
    const context = getActiveMenuContext();
    const isGameplay = gameRunning && !paused && context === 'playing';
    document.body.classList.toggle('hide-cursor', isGameplay);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
    if (gameVersionEl) {
        gameVersionEl.textContent = GAME_VERSION;
    }

    player = new Player(canvas.width / 2, canvas.height - 100);
    player.setCanvas(canvas);
    levelManager = new LevelManager();

    // Keyboard input
    window.addEventListener('keydown', e => player.handleInput(e.key, true));
    window.addEventListener('keyup',   e => player.handleInput(e.key, false));

    // Escape → toggle pause
    window.addEventListener('keydown', e => {
        if (e.key === 'Escape' && gameRunning) {
            togglePause();
        }
    });

    // Gamepad hotplug events
    window.addEventListener('gamepadconnected', () => {
        const pads = getConnectedGamepads();
        lastConnectedPadCount = pads.length;
        updateGamepadStatusBadge(pads.length);
    });
    window.addEventListener('gamepaddisconnected', () => {
        const pads = getConnectedGamepads();
        lastConnectedPadCount = pads.length;
        updateGamepadStatusBadge(pads.length);
    });

    // ── Main menu buttons ──────────────────────────────────────────────────
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', resetGame);

    showScoresBtn.addEventListener('click', () => {
        displayHighScores();
        highScoreBoard.classList.remove('hidden');
        syncMenuFocusHighlight();
    });
    hideScoresBtn.addEventListener('click', () => {
        highScoreBoard.classList.add('hidden');
        syncMenuFocusHighlight();
    });
    saveScoreBtn.addEventListener('click', saveCurrentScore);

    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            const on = SoundManager.toggleSfx();
            muteBtn.textContent = on ? '🔊 SFX' : '🔇 SFX';
            if (mutePauseBtn) mutePauseBtn.textContent = muteBtn.textContent;
        });
    }
    if (muteMusicBtn) {
        muteMusicBtn.addEventListener('click', () => {
            const on = SoundManager.toggleMusic();
            muteMusicBtn.textContent = on ? '🎵 MUSIC' : '🔇 MUSIC';
            if (muteMusicPauseBtn) muteMusicPauseBtn.textContent = muteMusicBtn.textContent;
        });
    }

    // ── Pause menu buttons ─────────────────────────────────────────────────
    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            paused = false;
            pauseScreen.classList.add('hidden');
            lastTime = performance.now();
            syncMenuFocusHighlight();
            updateCursorVisibility();
        });
    }
    if (restartPauseBtn) {
        restartPauseBtn.addEventListener('click', () => {
            paused = false;
            pauseScreen.classList.add('hidden');
            resetGame();
        });
    }
    if (mutePauseBtn) {
        mutePauseBtn.addEventListener('click', () => {
            const on = SoundManager.toggleSfx();
            mutePauseBtn.textContent = on ? '🔊 SFX' : '🔇 SFX';
            if (muteBtn) muteBtn.textContent = mutePauseBtn.textContent;
        });
    }
    if (muteMusicPauseBtn) {
        muteMusicPauseBtn.addEventListener('click', () => {
            const on = SoundManager.toggleMusic();
            muteMusicPauseBtn.textContent = on ? '🎵 MUSIC' : '🔇 MUSIC';
            if (muteMusicBtn) muteMusicBtn.textContent = muteMusicPauseBtn.textContent;
        });
    }
    if (showScoresPauseBtn) {
        showScoresPauseBtn.addEventListener('click', () => {
            displayHighScores();
            highScoreBoard.classList.remove('hidden');
            syncMenuFocusHighlight();
        });
    }
    if (exitMainBtn) {
        exitMainBtn.addEventListener('click', () => {
            gameRunning = false;
            paused = false;
            pauseScreen.classList.add('hidden');
            startScreen.classList.remove('hidden');
            hud.classList.add('hidden');
            gameOverScreen.classList.add('hidden');
            highScoreBoard.classList.add('hidden');
            SoundManager.stopMusic();
            syncMenuFocusHighlight();
            updateCursorVisibility();
        });
    }

    // Level transition banner
    window.addEventListener('levelStart', e => showLevelTitle(e.detail.level));

    displayHighScores();
    syncMenuFocusHighlight();
    updateCursorVisibility();

    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// ─── Pause Toggle ─────────────────────────────────────────────────────────────

function togglePause() {
    paused = !paused;
    if (paused) {
        pauseScreen.classList.remove('hidden');
    } else {
        pauseScreen.classList.add('hidden');
        lastTime = performance.now();
    }
    syncMenuFocusHighlight();
    updateCursorVisibility();
}

// ─── Game Flow ────────────────────────────────────────────────────────────────

function startGame() {
    SoundManager.init();
    gameRunning = true;
    paused = false;
    score = 0;
    level = 1;

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    highScoreBoard.classList.add('hidden');
    hud.classList.remove('hidden');

    player.reset();
    levelManager.reset();

    SoundManager.startMusic();
    syncMenuFocusHighlight();
    updateCursorVisibility();

    lastTime = performance.now();
}

function resetGame() {
    startGame();
}

// ─── Update / Draw ────────────────────────────────────────────────────────────

function update(deltaTime) {
    if (!gameRunning) return;

    player.update(deltaTime, canvas);
    levelManager.update(deltaTime, player, canvas);

    // HUD
    if (scoreDisplay) scoreDisplay.innerText = score;
    if (levelDisplay) levelDisplay.innerText = levelManager.level;
    if (healthDisplay) healthDisplay.innerText = Math.max(0, player.health);
    if (gemsDisplay)  gemsDisplay.innerText = levelManager.totalGemsCollected;

    // Power level ★ indicator
    if (powerDisplay) {
        const lvl = player.powerLevel;
        const stars = '★'.repeat(lvl) + '☆'.repeat(4 - lvl);
        powerDisplay.innerText = stars;
        const colours = ['#ffcc00', '#ff9900', '#ff5500', '#ff00ff'];
        powerDisplay.style.color = colours[lvl - 1] || '#ffcc00';
    }

    if (player.health <= 0) {
        gameOver();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameRunning) {
        levelManager.draw(ctx);
        player.draw(ctx);
    }
}

function gameLoop(timestamp) {
    const rawDelta = lastTime ? (timestamp - lastTime) : 16.67;
    const deltaTime = Math.min(Math.max(rawDelta, 0), 100);
    lastTime = timestamp;

    pollGamepads(deltaTime / 1000);
    updateCursorVisibility();

    if (gameRunning && !paused) {
        update(deltaTime);
        draw();
    }

    requestAnimationFrame(gameLoop);
}

// ─── Game Over ────────────────────────────────────────────────────────────────

function gameOver() {
    gameRunning = false;
    SoundManager.stopMusic();
    SoundManager.play('gameOver');
    triggerGamepadRumble(0.8, 1.0, 350);

    hud.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');

    finalScoreDisplay.innerText = score;
    finalLevelDisplay.innerText = levelManager.level;
    if (saveScoreContainer) saveScoreContainer.classList.remove('hidden');
    syncMenuFocusHighlight();
    updateCursorVisibility();
}

// ─── Level Title Banner ───────────────────────────────────────────────────────

function showLevelTitle(lvl) {
    levelTitle.innerHTML = `<div>LEVEL</div><div>${lvl}</div>`;
    levelScreen.classList.remove('hidden');
    levelTitle.classList.remove('level-explode');
    void levelTitle.offsetWidth; // Force reflow to restart CSS animation
    levelTitle.classList.add('level-explode');
    setTimeout(() => levelScreen.classList.add('hidden'), 5000);
}

// ─── High Scores ──────────────────────────────────────────────────────────────

let isSaving = false;

async function saveCurrentScore() {
    if (isSaving) return;
    const name = playerNameInput.value.trim() || 'Hero';
    const newScore = { name, score, level: levelManager.level, date: new Date().toLocaleDateString() };

    try {
        isSaving = true;
        saveScoreBtn.innerText = 'SAVING...';
        saveScoreBtn.disabled = true;

        const response = await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newScore)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `Server error ${response.status}`);
        }

        const scores = await response.json();
        if (saveScoreContainer) saveScoreContainer.classList.add('hidden');
        renderScores(scores);
        highScoreBoard.classList.remove('hidden');
        syncMenuFocusHighlight();
    } catch (err) {
        console.error('Save error:', err);
        alert(`Failed to save score: ${err.message}`);
    } finally {
        isSaving = false;
        saveScoreBtn.innerText = 'SAVE SCORE';
        saveScoreBtn.disabled = false;
        syncMenuFocusHighlight();
    }
}

async function displayHighScores() {
    try {
        const response = await fetch('/api/scores');
        const scores = await response.json();
        renderScores(scores);
    } catch (err) {
        console.error('Fetch scores error:', err);
        if (highScoreList) highScoreList.innerHTML = '<li>Error loading scores</li>';
    }
}

function renderScores(scores) {
    if (!highScoreList) return;
    highScoreList.innerHTML = '';
    if (!scores || scores.length === 0) {
        highScoreList.innerHTML = '<li>No scores yet!</li>';
        return;
    }
    scores.forEach(s => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${s.name} (L${s.level})</span> <span>${s.score}</span>`;
        highScoreList.appendChild(li);
    });
}

// ─── Global score hook (used by LevelManager) ────────────────────────────────
window.addScore = points => { score += points; };

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();
