const screens = {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    end: document.getElementById('end-screen'),
    pause: document.getElementById('pause-screen'),
    nameEntry: document.getElementById('name-entry-screen'),
    leaderboard: document.getElementById('leaderboard-screen')
};

const ui = {
    level: document.getElementById('level-val'),
    time: document.getElementById('time-val'),
    score: document.getElementById('score-val'),
    cat: document.getElementById('player-cat'),
    feedback: document.getElementById('feedback-text'),
    finalScore: document.getElementById('final-score'),
    endTitle: document.getElementById('end-title'),
    gameCompleteScore: document.getElementById('game-complete-score'),
    playerNameInput: document.getElementById('player-name-input'),
    highScoreList: document.getElementById('high-score-list')
};

const charIcons = {
    funky: '🐱',
    neon: '😸',
    groove: '😻'
};

const keyMapping = {
    '2': { trackId: 'track-2', anim: 'anim-down' },
    '4': { trackId: 'track-4', anim: 'anim-left-paw' },
    '6': { trackId: 'track-6', anim: 'anim-right-paw' },
    '8': { trackId: 'track-8', anim: 'anim-jump' }
};

let gameState = {
    level: 1,
    score: 0,
    levelStartScore: 0,
    timeRemaining: 10,
    isPlaying: false,
    isPaused: false,
    selectedChar: 'funky',
    notes: [],
    spawnRate: 1500 // ms
};

let gameLoopId, spawnerId, timerId;
let lastTime = 0;

// High Scores logic
const defaultScores = [
    { name: 'Sir Paws-a-Lot', score: 6000 },
    { name: 'DJ Scratch', score: 5400 },
    { name: 'MC Meow', score: 4800 },
    { name: 'Cat-o-Tonic', score: 4200 },
    { name: 'Funky Feline', score: 3600 },
    { name: 'Disco Kitty', score: 3000 },
    { name: 'Meowster', score: 2400 },
    { name: 'Bootsy Collins', score: 1800 },
    { name: 'Whiskers', score: 1200 },
    { name: 'Clawdia', score: 600 }
];

function getHighScores() {
    let scores = localStorage.getItem('discoCatHighScoresV2');
    let parsedScores = scores ? JSON.parse(scores) : [];
    
    // If the default scores haven't been seeded yet, merge them with any existing scores
    const hasSeeded = parsedScores.some(s => s.name === 'Sir Paws-a-Lot');
    if (!hasSeeded) {
        parsedScores = [...parsedScores, ...defaultScores];
        parsedScores.sort((a, b) => b.score - a.score);
        parsedScores.splice(10);
        localStorage.setItem('discoCatHighScoresV2', JSON.stringify(parsedScores));
    }
    
    return parsedScores;
}

function saveHighScore(name, score) {
    const scores = getHighScores();
    scores.push({ name, score });
    scores.sort((a, b) => b.score - a.score);
    scores.splice(10); // Keep top 10
    localStorage.setItem('discoCatHighScoresV2', JSON.stringify(scores));
}

function renderLeaderboard(highlightName = null, highlightScore = null) {
    const scores = getHighScores();
    ui.highScoreList.innerHTML = '';
    let highlighted = false;
    scores.forEach((s, idx) => {
        const li = document.createElement('li');
        const text = `${idx + 1}. ${s.name} - ${s.score}`;
        if (!highlighted && s.name === highlightName && s.score === highlightScore) {
            li.innerHTML = `<span>${text}</span> <span class="dancing-cat">🐱</span>`;
            li.classList.add('highlight-score');
            highlighted = true;
        } else {
            li.innerText = text;
        }
        ui.highScoreList.appendChild(li);
    });
}

// Event Listeners
document.querySelectorAll('.char-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const char = e.currentTarget.dataset.char;
        gameState.selectedChar = char;
        document.getElementById('cat-head-emoji').innerText = charIcons[char];
        ui.cat.className = 'cat cat-' + char;
        
        if (audioCtx.state === 'suspended') audioCtx.resume();
        gameState.level = 1;
        gameState.score = 0;
        startGame();
    });
});

document.getElementById('next-level-btn').addEventListener('click', () => {
    gameState.level++;
    startGame();
});

document.getElementById('resume-btn').addEventListener('click', resumeGame);

document.getElementById('restart-level-btn').addEventListener('click', () => {
    gameState.score = gameState.levelStartScore;
    startGame();
});

document.getElementById('quit-menu-btn').addEventListener('click', () => {
    gameState.isPlaying = false;
    gameState.isPaused = false;
    switchScreen('start');
});

document.getElementById('submit-score-btn').addEventListener('click', () => {
    const name = ui.playerNameInput.value.trim() || 'Anonymous';
    saveHighScore(name, gameState.score);
    renderLeaderboard(name, gameState.score);
    switchScreen('leaderboard');
});

document.getElementById('back-to-main-btn').addEventListener('click', () => {
    switchScreen('start');
});

document.getElementById('view-leaderboard-btn').addEventListener('click', () => {
    renderLeaderboard();
    switchScreen('leaderboard');
});

function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function startGame() {
    switchScreen('game');
    gameState.levelStartScore = gameState.score;
    gameState.timeRemaining = 10 + ((gameState.level - 1) * 5);
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.notes.forEach(n => n.el.remove());
    gameState.notes = [];
    
    // Difficulty curve (Level 1 to 5)
    gameState.spawnRate = 1500 - ((gameState.level - 1) * 250); 
    
    updateUI();
    
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const countdownEl = document.getElementById('countdown-overlay');
    countdownEl.style.display = 'block';
    let count = 3;
    
    function tickCountdown() {
        if (count > 0) {
            countdownEl.innerText = count;
            countdownEl.classList.remove('show-countdown');
            void countdownEl.offsetWidth;
            countdownEl.classList.add('show-countdown');
            
            playTone(800, 'sine', 0.1, audioCtx.currentTime);
            count--;
            setTimeout(tickCountdown, 1000);
        } else {
            countdownEl.innerText = 'GO!';
            countdownEl.classList.remove('show-countdown');
            void countdownEl.offsetWidth;
            countdownEl.classList.add('show-countdown');
            playTone(1200, 'sine', 0.3, audioCtx.currentTime);
            
            setTimeout(() => {
                countdownEl.style.display = 'none';
                countdownEl.classList.remove('show-countdown');
                
                gameState.isPlaying = true;
                lastTime = performance.now();
                gameLoopId = requestAnimationFrame(gameLoop);
                spawnerId = setInterval(spawnNote, gameState.spawnRate);
                timerId = setInterval(updateTimer, 1000);
                startMusic();
            }, 1000);
        }
    }
    
    tickCountdown();
}

function pauseGame() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    gameState.isPaused = true;
    cancelAnimationFrame(gameLoopId);
    clearInterval(spawnerId);
    clearInterval(timerId);
    stopMusic();
    switchScreen('pause');
}

function resumeGame() {
    if (!gameState.isPaused) return;
    gameState.isPaused = false;
    switchScreen('game');
    lastTime = performance.now();
    gameLoopId = requestAnimationFrame(gameLoop);
    spawnerId = setInterval(spawnNote, gameState.spawnRate);
    timerId = setInterval(updateTimer, 1000);
    startMusic();
}

function updateUI() {
    ui.level.innerText = gameState.level;
    ui.time.innerText = gameState.timeRemaining;
    ui.score.innerText = gameState.score;
}

function updateTimer() {
    gameState.timeRemaining--;
    ui.time.innerText = gameState.timeRemaining;
    if (gameState.timeRemaining <= 0) {
        endLevel();
    }
}

function endLevel() {
    gameState.isPlaying = false;
    cancelAnimationFrame(gameLoopId);
    clearInterval(spawnerId);
    clearInterval(timerId);
    stopMusic();
    
    if (gameState.level >= 5) {
        ui.gameCompleteScore.innerText = gameState.score;
        switchScreen('nameEntry');
        setTimeout(() => ui.playerNameInput.focus(), 50);
    } else {
        ui.finalScore.innerText = gameState.score;
        switchScreen('end');
    }
}

function spawnNote() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    const keys = Object.keys(keyMapping);
    const key = keys[Math.floor(Math.random() * keys.length)];
    const track = document.getElementById(keyMapping[key].trackId);
    
    const noteEl = document.createElement('div');
    noteEl.classList.add('note');
    
    const isGold = Math.random() < 0.15;
    if (isGold) noteEl.classList.add('gold');
    
    track.appendChild(noteEl);
    
    gameState.notes.push({
        el: noteEl,
        key: key,
        y: 0, // percentage from top 0 to 100
        isGold: isGold,
        trackId: keyMapping[key].trackId
    });
}

function spawnStars(trackId) {
    const track = document.getElementById(trackId);
    // target zone is roughly near the bottom
    for (let i = 0; i < 8; i++) {
        const star = document.createElement('div');
        star.classList.add('star-particle');
        star.style.bottom = '50px';
        star.style.left = '25px';
        
        const tx = (Math.random() * 150 - 75) + 'px';
        const ty = (Math.random() * 150 - 75) + 'px';
        star.style.setProperty('--tx', tx);
        star.style.setProperty('--ty', ty);
        
        track.appendChild(star);
        setTimeout(() => star.remove(), 600);
    }
}

function gameLoop(time) {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    const dt = time - lastTime;
    lastTime = time;
    
    // Note falling speed interpolation (Level 1: 0.02, Level 5: 0.055)
    const speed = 0.02 + ((gameState.level - 1) * 0.00875);
    
    for (let i = gameState.notes.length - 1; i >= 0; i--) {
        let note = gameState.notes[i];
        note.y += speed * dt;
        note.el.style.top = note.y + '%';
        
        // Target zone is around 80% to 90% from top
        if (note.y > 100) {
            note.el.remove();
            gameState.notes.splice(i, 1);
            showFeedback('Miss', '#ff003c');
            playSoundEffect('miss');
        }
    }
    
    gameLoopId = requestAnimationFrame(gameLoop);
}

function showFeedback(text, color) {
    ui.feedback.innerText = text;
    ui.feedback.style.color = color;
    ui.feedback.classList.remove('show-feedback');
    void ui.feedback.offsetWidth; // trigger reflow
    ui.feedback.classList.add('show-feedback');
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (screens.end.classList.contains('active')) {
            document.getElementById('next-level-btn').click();
        } else if (screens.nameEntry.classList.contains('active')) {
            document.getElementById('submit-score-btn').click();
        }
        return;
    }

    if (e.key === 'Escape') {
        if (gameState.isPlaying) {
            if (gameState.isPaused) resumeGame();
            else pauseGame();
        }
        return;
    }

    if (!gameState.isPlaying || gameState.isPaused) return;
    
    const arrowMap = { ArrowDown: '2', ArrowLeft: '4', ArrowRight: '6', ArrowUp: '8' };
    const key = arrowMap[e.key] || e.key;
    if (keyMapping[key]) {
        let hit = false;
        for (let i = 0; i < gameState.notes.length; i++) {
            let note = gameState.notes[i];
            if (note.key === key) {
                if (note.y >= 70 && note.y <= 95) {
                    let points = 0;
                    if (note.y >= 80 && note.y <= 88) points = 100;
                    else points = 50;
                    
                    if (note.isGold) {
                        points *= 2;
                        showFeedback('DOUBLE!', '#ffd700');
                        playSoundEffect('gold');
                        spawnStars(note.trackId);
                    } else {
                        if (points === 100) {
                            showFeedback('Purrfect!', '#00f0ff');
                            playSoundEffect('perfect');
                        } else {
                            showFeedback('Good!', '#00ff00');
                            playSoundEffect('good');
                        }
                    }
                    
                    let oldScore = gameState.score;
                    gameState.score += points;
                    
                    if (Math.floor(oldScore / 1000) < Math.floor(gameState.score / 1000)) {
                        const tail = document.querySelector('.cat-tail');
                        if (tail) {
                            tail.classList.remove('anim-tail-spin');
                            void tail.offsetWidth; // reflow
                            tail.classList.add('anim-tail-spin');
                            setTimeout(() => {
                                tail.classList.remove('anim-tail-spin');
                            }, 1000);
                        }
                    }
                    
                    updateUI();
                    
                    note.el.remove();
                    gameState.notes.splice(i, 1);
                    hit = true;
                    
                    triggerAnim(keyMapping[key].anim);
                    break;
                }
            }
        }
        
        if (!hit) {
            triggerAnim(keyMapping[key].anim);
        }
    }
});

function triggerAnim(animClass) {
    ui.cat.classList.remove('anim-left-paw', 'anim-right-paw', 'anim-jump', 'anim-down');
    void ui.cat.offsetWidth;
    ui.cat.classList.add(animClass);
    
    setTimeout(() => {
        ui.cat.classList.remove(animClass);
    }, 200);
}

// ----------------------------------------------------
// Web Audio API 8-Bit Disco Generator
// ----------------------------------------------------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let beatInterval;

function playTone(freq, type, duration, time) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    osc.start(time);
    osc.stop(time + duration);
}

function playSoundEffect(type) {
    if (audioCtx.state === 'suspended') return;
    const time = audioCtx.currentTime;
    
    if (type === 'perfect') {
        playTone(1000, 'sine', 0.1, time);
        playTone(1500, 'sine', 0.1, time + 0.1);
    } else if (type === 'good') {
        playTone(600, 'triangle', 0.1, time);
    } else if (type === 'gold') {
        playTone(800, 'square', 0.1, time);
        playTone(1200, 'square', 0.1, time + 0.1);
        playTone(1600, 'square', 0.2, time + 0.2);
    } else if (type === 'miss') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, time);
        osc.frequency.exponentialRampToValueAtTime(20, time + 0.15);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        
        osc.start(time);
        osc.stop(time + 0.15);
    }
}

function startMusic() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    let step = 0;
    
    beatInterval = setInterval(() => {
        const time = audioCtx.currentTime;
        
        if (step % 4 === 0) {
            playTone(60, 'square', 0.1, time);
        }
        
        if (step % 2 === 0) {
            playTone(1200, 'square', 0.05, time);
        }
        
        if (step % 8 === 4) {
            playTone(200, 'square', 0.1, time);
        }
        
        const bassFreqs = [110, 110, 130, 130, 98, 98, 146, 146];
        const bassFreq = bassFreqs[Math.floor(step / 2) % bassFreqs.length];
        playTone(bassFreq, 'square', 0.15, time);
        
        step++;
    }, 125);
}

function stopMusic() {
    clearInterval(beatInterval);
}

// ----------------------------------------------------
// HTML5 Gamepad Controller Support (Dance Tracks & Menus)
// ----------------------------------------------------
const gpBadge = document.createElement('div');
gpBadge.id = 'gp-badge';
gpBadge.className = 'gp-status-badge';
gpBadge.style.cssText = 'position:fixed;bottom:10px;left:14px;';
gpBadge.textContent = '🎮 No Pad (Plug & Press)';
document.body.appendChild(gpBadge);

const presetCatNames = ['DJ_PAWS', 'FUNK_CAT', 'NEON_MEOW', 'DISCO_LEO', 'GROOVE_99'];
let presetNameIdx = 0;
let menuFocusIndex = 0;
let lastActiveScreen = '';
let prevGpState = {
    up: false, down: false, left: false, right: false,
    b0: false, b1: false, b2: false, b3: false, l1: false, r1: false, start: false
};

function isGpBtn(gp, idx) {
    return Boolean(gp && gp.buttons && gp.buttons[idx] && (gp.buttons[idx].pressed || gp.buttons[idx].value > 0.3));
}

function triggerTrackKey(trackKey) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: trackKey }));
}

function getActiveMenuButtons() {
    if (screens.start.classList.contains('active')) {
        return [...Array.from(document.querySelectorAll('.char-btn')), document.getElementById('view-leaderboard-btn')].filter(Boolean);
    }
    if (screens.pause.classList.contains('active')) {
        return [document.getElementById('resume-btn'), document.getElementById('restart-level-btn'), document.getElementById('quit-menu-btn')].filter(Boolean);
    }
    if (screens.end.classList.contains('active')) {
        return [document.getElementById('next-level-btn')].filter(Boolean);
    }
    if (screens.nameEntry.classList.contains('active')) {
        return [document.getElementById('submit-score-btn')].filter(Boolean);
    }
    if (screens.leaderboard.classList.contains('active')) {
        return [document.getElementById('back-to-main-btn')].filter(Boolean);
    }
    return [];
}

function updateMenuFocusHighlight() {
    document.querySelectorAll('.gamepad-focus').forEach(el => el.classList.remove('gamepad-focus'));
    const btns = getActiveMenuButtons();
    if (btns.length === 0) return;
    if (menuFocusIndex >= btns.length) menuFocusIndex = 0;
    if (menuFocusIndex < 0) menuFocusIndex = btns.length - 1;
    btns[menuFocusIndex].classList.add('gamepad-focus');
}

function pollDiscoGamepad() {
    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    if (pads.length === 0) {
        gpBadge.textContent = '🎮 No Pad (Plug & Press)';
        gpBadge.classList.remove('connected');
    } else {
        gpBadge.textContent = '🎮 Controller Ready (D-Pad/Buttons 1-4: Dance • Btn 3: Confirm • Start: Pause)';
        gpBadge.classList.add('connected');
    }

    const activeScreenKey = Object.keys(screens).find(k => screens[k].classList.contains('active')) || '';
    if (activeScreenKey !== lastActiveScreen) {
        lastActiveScreen = activeScreenKey;
        menuFocusIndex = 0;
        updateMenuFocusHighlight();
    }

    document.body.classList.toggle('hide-cursor', Boolean(gameState.isPlaying && !gameState.isPaused));

    const gp = pads[0];
    if (gp) {
        const ax0 = gp.axes[0] || 0;
        const ax1 = gp.axes[1] || 0;
        const cur = {
            up: ax1 < -0.52 || isGpBtn(gp, 12),
            down: ax1 > 0.52 || isGpBtn(gp, 13),
            left: ax0 < -0.52 || isGpBtn(gp, 14),
            right: ax0 > 0.52 || isGpBtn(gp, 15),
            b0: isGpBtn(gp, 0),
            b1: isGpBtn(gp, 1),
            b2: isGpBtn(gp, 2),
            b3: isGpBtn(gp, 3),
            l1: isGpBtn(gp, 4),
            r1: isGpBtn(gp, 5),
            start: isGpBtn(gp, 9) || isGpBtn(gp, 8)
        };

        if (audioCtx.state === 'suspended' && Object.values(cur).some(Boolean)) {
            audioCtx.resume();
        }

        // Start button strictly toggles Pause / Resume
        if (cur.start && !prevGpState.start && (gameState.isPlaying || gameState.isPaused)) {
            if (gameState.isPaused) resumeGame();
            else pauseGame();
        } else if (gameState.isPlaying && !gameState.isPaused) {
            // Rhythm Gameplay: D-Pad / Stick / Buttons 1-4 trigger tracks 2, 4, 6, 8
            if ((cur.down && !prevGpState.down) || (cur.b0 && !prevGpState.b0)) triggerTrackKey('2');
            if ((cur.left && !prevGpState.left) || (cur.b2 && !prevGpState.b2) || (cur.l1 && !prevGpState.l1)) triggerTrackKey('4');
            if ((cur.right && !prevGpState.right) || (cur.b1 && !prevGpState.b1) || (cur.r1 && !prevGpState.r1)) triggerTrackKey('6');
            if ((cur.up && !prevGpState.up) || (cur.b3 && !prevGpState.b3)) triggerTrackKey('8');
        } else {
            // Menu / Modal Navigation
            const btns = getActiveMenuButtons();
            if (screens.nameEntry.classList.contains('active')) {
                if ((cur.left && !prevGpState.left) || (cur.right && !prevGpState.right)) {
                    presetNameIdx = (presetNameIdx + (cur.right ? 1 : presetCatNames.length - 1)) % presetCatNames.length;
                    ui.playerNameInput.value = presetCatNames[presetNameIdx];
                }
            } else if (btns.length > 1) {
                if ((cur.left && !prevGpState.left) || (cur.up && !prevGpState.up)) {
                    menuFocusIndex = (menuFocusIndex + btns.length - 1) % btns.length;
                    updateMenuFocusHighlight();
                }
                if ((cur.right && !prevGpState.right) || (cur.down && !prevGpState.down)) {
                    menuFocusIndex = (menuFocusIndex + 1) % btns.length;
                    updateMenuFocusHighlight();
                }
            }

            // Button 3 (b2) or Button 1 (b0) confirms highlighted button
            if ((cur.b2 && !prevGpState.b2) || (cur.b0 && !prevGpState.b0)) {
                if (btns[menuFocusIndex]) btns[menuFocusIndex].click();
            } else if (cur.b1 && !prevGpState.b1) {
                // Button 2 (b1) cancels/resumes from pause or returns from leaderboard
                if (screens.pause.classList.contains('active')) resumeGame();
                else if (screens.leaderboard.classList.contains('active')) switchScreen('start');
            }
        }

        prevGpState = cur;
    }

    requestAnimationFrame(pollDiscoGamepad);
}
updateMenuFocusHighlight();
requestAnimationFrame(pollDiscoGamepad);
