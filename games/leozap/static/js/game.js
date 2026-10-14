import Player from './player.js';
import Enemy from './enemy.js';
import LevelManager from './levelManager.js';
import SoundManager from './soundManager.js';

// Make SoundManager globally accessible so player.js / enemy.js can call it
window.SoundManager = SoundManager;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ─── Game State ───────────────────────────────────────────────────────────────
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
const highScoreBoard     = document.getElementById('high-score-board');
const highScoreList      = document.getElementById('high-score-list');
const playerNameInput    = document.getElementById('player-name');
const levelScreen        = document.getElementById('level-screen');
const levelTitle         = document.getElementById('level-title');
const muteBtn            = document.getElementById('mute-btn');
const muteMusicBtn       = document.getElementById('mute-music-btn');

// Pause screen elements
const pauseScreen        = document.getElementById('pause-screen');
const resumeBtn          = document.getElementById('resume-btn');
const restartPauseBtn    = document.getElementById('restart-pause-btn');
const mutePauseBtn       = document.getElementById('mute-pause-btn');
const muteMusicPauseBtn  = document.getElementById('mute-music-pause-btn');
const showScoresPauseBtn = document.getElementById('show-scores-pause-btn');
const exitMainBtn        = document.getElementById('exit-main-btn');

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {

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

    // ── Main menu buttons ──────────────────────────────────────────────────
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', resetGame);

    showScoresBtn.addEventListener('click', () => {
        displayHighScores();
        highScoreBoard.classList.remove('hidden');
    });
    hideScoresBtn.addEventListener('click', () => highScoreBoard.classList.add('hidden'));
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
            requestAnimationFrame(gameLoop);
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
        });
    }

    // Level transition banner
    window.addEventListener('levelStart', e => showLevelTitle(e.detail.level));

    displayHighScores();
}

// ─── Pause Toggle ─────────────────────────────────────────────────────────────

function togglePause() {
    paused = !paused;
    if (paused) {
        pauseScreen.classList.remove('hidden');
    } else {
        pauseScreen.classList.add('hidden');
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
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
    hud.classList.remove('hidden');

    player.reset();
    levelManager.reset();

    SoundManager.startMusic();

    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
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
    if (!gameRunning || paused) return;

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

// ─── Game Over ────────────────────────────────────────────────────────────────

function gameOver() {
    gameRunning = false;
    SoundManager.stopMusic();
    SoundManager.play('gameOver');

    hud.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');

    finalScoreDisplay.innerText = score;
    finalLevelDisplay.innerText = levelManager.level;
    document.getElementById('save-score-container').classList.remove('hidden');
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
        document.getElementById('save-score-container').classList.add('hidden');
        renderScores(scores);
        highScoreBoard.classList.remove('hidden');
    } catch (err) {
        console.error('Save error:', err);
        alert(`Failed to save score: ${err.message}`);
    } finally {
        isSaving = false;
        saveScoreBtn.innerText = 'SAVE SCORE';
        saveScoreBtn.disabled = false;
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
