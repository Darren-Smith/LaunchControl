const state = {
    screen: 'main', // main, levels, game, pause, game-over, highscores
    levels: [],
    currentLevel: null,
    score: 0,
    streak: 0,
    timeRemaining: 60, // 1 minute
    gameInterval: null,
    moleInterval: null,
    activeMoles: new Set(),
    highscores: JSON.parse(localStorage.getItem('whackamania_scores_v3') || '[]')
};

// DOM Elements
const screens = {
    main: document.getElementById('screen-main'),
    levels: document.getElementById('screen-levels'),
    game: document.getElementById('screen-game'),
    pause: document.getElementById('screen-pause'),
    gameOver: document.getElementById('screen-game-over'),
    highscores: document.getElementById('screen-highscores-view')
};

const ui = {
    levelGrid: document.getElementById('level-grid'),
    scoreDisplay: document.getElementById('score-display'),
    timeDisplay: document.getElementById('time-display'),
    themeDisplay: document.getElementById('level-theme-display'),
    board: document.getElementById('game-board'),
    toast: document.getElementById('feedback-toast'),
    finalScore: document.getElementById('final-score'),
    highscoresList: document.getElementById('highscores-list'),
    hsMessage: document.getElementById('high-score-message'),
    nameEntry: document.getElementById('name-entry-container'),
    nameInput: document.getElementById('player-name-input'),
    btnSaveScore: document.getElementById('btn-save-score'),
    endMenuBtns: document.getElementById('end-menu-buttons')
};

// Audio (Using simple Web Audio API beeps for now, or just visual feedback)
// Let's stick to visual feedback to keep it simple and robust.

// Initialization
async function init() {
    try {
        const response = await fetch('/static/data/levels.json');
        state.levels = await response.json();
        renderLevelGrid();
    } catch (e) {
        console.error("Failed to load levels:", e);
    }
    setupEventListeners();
    renderHighscores();
}

function setupEventListeners() {
    // Navigation
    document.getElementById('btn-start').addEventListener('click', () => switchScreen('levels'));
    document.getElementById('btn-highscores').addEventListener('click', () => switchScreen('highscores'));
    document.getElementById('btn-back-main').addEventListener('click', () => switchScreen('main'));
    document.getElementById('btn-back-from-scores').addEventListener('click', () => switchScreen('main'));
    
    // Game Controls
    document.getElementById('btn-pause').addEventListener('click', pauseGame);
    document.getElementById('btn-resume').addEventListener('click', resumeGame);
    document.getElementById('btn-restart').addEventListener('click', () => startGame(state.currentLevel));
    document.getElementById('btn-quit').addEventListener('click', () => {
        endGame(false);
        switchScreen('main');
    });
    
    document.getElementById('btn-play-again').addEventListener('click', () => switchScreen('levels'));
    document.getElementById('btn-menu-from-end').addEventListener('click', () => switchScreen('main'));

    ui.btnSaveScore.addEventListener('click', () => {
        let playerName = ui.nameInput.value.trim() || "Anonymous";
        const themeParts = state.currentLevel.theme.trim().split(' ');
        const emoji = themeParts[themeParts.length - 1];

        state.highscores.push({
            name: playerName.substring(0, 15),
            theme: state.currentLevel.name,
            emoji: emoji,
            score: state.score,
            date: new Date().toISOString()
        });
        localStorage.setItem('whackamania_scores_v3', JSON.stringify(state.highscores));
        renderHighscores();
        
        ui.nameEntry.style.display = 'none';
        ui.endMenuBtns.style.display = 'flex';
        showToast("Score Saved!", "success");
        switchScreen('highscores');
    });

    // Custom Mallet Effect
    const gameContainer = document.getElementById('game-board-container');
    gameContainer.addEventListener('mousedown', () => {
        gameContainer.classList.add('whacking');
    });
    gameContainer.addEventListener('mouseup', () => {
        gameContainer.classList.remove('whacking');
    });
}

function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    Object.values(screens).forEach(s => s.classList.remove('active'));
    
    if (screens[screenName]) {
        screens[screenName].classList.remove('hidden');
        screens[screenName].classList.add('active');
        state.screen = screenName;
    }
}

function renderLevelGrid() {
    ui.levelGrid.innerHTML = '';
    state.levels.forEach(level => {
        const card = document.createElement('div');
        card.className = 'level-card';
        card.innerHTML = `
            <h3>${level.name}</h3>
            <p>${level.theme}</p>
        `;
        card.addEventListener('click', () => startGame(level));
        ui.levelGrid.appendChild(card);
    });
}

function renderHighscores() {
    ui.highscoresList.innerHTML = '';
    const topScores = state.highscores.sort((a, b) => b.score - a.score).slice(0, 10);
    if (topScores.length === 0) {
        ui.highscoresList.innerHTML = '<li>No scores yet!</li>';
    } else {
        topScores.forEach((s, i) => {
            const name = s.name || "Unknown";
            const emoji = s.emoji || "🏆";
            ui.highscoresList.innerHTML += `<li><span>#${i+1} ${emoji} ${name}</span> <span>${s.score}</span></li>`;
        });
    }
}

// Game Logic
function startGame(level) {
    state.currentLevel = level;
    state.score = 0;
    state.streak = 0;
    state.timeRemaining = 60; // 1 minute
    state.activeMoles.clear();
    
    updateHUD();
    
    // Set background
    screens.game.className = `screen active bg-${level.background}`;
    ui.themeDisplay.innerText = level.description;

    // Create Board (9 holes)
    ui.board.innerHTML = '';
    for(let i=0; i<9; i++) {
        const hole = document.createElement('div');
        hole.className = 'hole';
        hole.dataset.index = i;
        ui.board.appendChild(hole);
    }

    switchScreen('game');
    resumeGame();
}

function pauseGame() {
    if (state.screen !== 'game') return;
    clearInterval(state.gameInterval);
    clearInterval(state.moleInterval);
    screens.pause.classList.remove('hidden');
    state.screen = 'pause';
}

function resumeGame() {
    if (state.screen === 'pause') {
        screens.pause.classList.add('hidden');
        state.screen = 'game';
    }
    
    state.gameInterval = setInterval(gameTick, 1000);
    
    // Spawn mole loop
    state.moleInterval = setInterval(spawnMole, 1500); // Base speed
}

function gameTick() {
    state.timeRemaining--;
    updateHUD();
    
    // Increase difficulty
    if (state.timeRemaining === 40) {
        clearInterval(state.moleInterval);
        state.moleInterval = setInterval(spawnMole, 1000);
    } else if (state.timeRemaining === 20) {
        clearInterval(state.moleInterval);
        state.moleInterval = setInterval(spawnMole, 800);
    }

    if (state.timeRemaining <= 0) {
        endGame(true);
    }
}

function updateHUD() {
    ui.scoreDisplay.innerText = state.score;
    const m = Math.floor(state.timeRemaining / 60).toString().padStart(2, '0');
    const s = (state.timeRemaining % 60).toString().padStart(2, '0');
    ui.timeDisplay.innerText = `${m}:${s}`;
}

function spawnMole() {
    if (state.screen !== 'game') return;
    
    const holes = document.querySelectorAll('.hole');
    const emptyHoles = Array.from(holes).filter(h => h.children.length === 0);
    
    if (emptyHoles.length === 0) return;
    
    const hole = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];
    
    // Determine the target logic for the current level
    const targetToHit = state.currentLevel.targetToHit || "incorrect";
    
    // We want MORE of the target to hit, so the game is engaging
    const spawnTarget = Math.random() > 0.3; // 70% chance to spawn the target
    
    let isCorrectFact = false;
    if (targetToHit === "correct") {
        isCorrectFact = spawnTarget;
    } else {
        isCorrectFact = !spawnTarget;
    }
    
    const factList = isCorrectFact ? state.currentLevel.correctFacts : state.currentLevel.incorrectFacts;
    const factText = factList[Math.floor(Math.random() * factList.length)];
    
    const mole = document.createElement('div');
    mole.className = 'mole';
    mole.innerHTML = `<span class="mole-text">${factText}</span>`;
    
    mole.addEventListener('mousedown', (e) => {
        if(mole.classList.contains('hit-success') || mole.classList.contains('hit-error')) return;
        
        const hitTarget = (targetToHit === "correct" && isCorrectFact) || (targetToHit === "incorrect" && !isCorrectFact);
        
        if (hitTarget) {
            // Correctly whacked the intended target
            state.streak += 1;
            state.score += state.streak;
            mole.classList.add('hit-success');
            showToast(`+${state.streak}`, 'success');
        } else {
            // Incorrectly whacked the wrong thing
            state.streak = 0;
            state.score -= 1;
            mole.classList.add('hit-error');
            showToast('-1', 'error');
        }
        updateHUD();
        
        // Hide quickly after hit
        setTimeout(() => {
            if (mole.parentNode) mole.parentNode.removeChild(mole);
        }, 300);
    });

    hole.appendChild(mole);
    
    // Animate up
    setTimeout(() => {
        mole.classList.add('up');
    }, 50);
    
    // Disappear after a while if not hit
    // Lifespan reduces as time goes down
    let lifespan = 2000;
    if (state.timeRemaining < 40) lifespan = 1500;
    if (state.timeRemaining < 20) lifespan = 1200;

    setTimeout(() => {
        if (mole.parentNode && !mole.classList.contains('hit-success') && !mole.classList.contains('hit-error')) {
            mole.classList.remove('up');
            setTimeout(() => {
                if (mole.parentNode) mole.parentNode.removeChild(mole);
            }, 200);
        }
    }, lifespan);
}

function showToast(text, type) {
    ui.toast.innerText = text;
    ui.toast.className = `toast ${type}`;
    setTimeout(() => {
        ui.toast.classList.add('hidden');
    }, 500);
}

function endGame(completed) {
    clearInterval(state.gameInterval);
    clearInterval(state.moleInterval);
    
    if (completed) {
        ui.finalScore.innerText = state.score;
        
        // Check if it's a new high score for this level
        const levelScores = state.highscores.filter(s => s.theme === state.currentLevel.name).map(s => s.score);
        const isHighScore = levelScores.length === 0 || state.score > Math.max(...levelScores);
        
        if (isHighScore && state.score > 0) {
            ui.hsMessage.innerText = "New High Score!";
            ui.nameEntry.style.display = 'flex';
            ui.endMenuBtns.style.display = 'none';
            ui.nameInput.value = '';
        } else {
            ui.hsMessage.innerText = "";
            ui.nameEntry.style.display = 'none';
            ui.endMenuBtns.style.display = 'flex';
        }
        
        switchScreen('gameOver');
    }
}

// Start
init();
