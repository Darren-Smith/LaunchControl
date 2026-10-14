/**
 * ChromaMatch - Memory Game Logic
 * Features: Pixel fruit icons, live timer, leaderboard with top-20 name entry
 */

document.addEventListener('DOMContentLoaded', () => {
  // ─── Configuration ─────────────────────────────────────────────────────────
  const TOTAL_PAIRS = 8;
  const COLOR_IDS = [1, 2, 3, 4, 5, 6, 7, 8];
  const MAX_LEADERBOARD = 20;
  const LS_KEY = 'chromamatch_scores_v2';

  // ─── Pixel Fruit SVGs ───────────────────────────────────────────────────────
  // Each fruit is an 8×8 pixel grid rendered as SVG rects for authentic pixel art
  const FRUIT_PIXELS = {
    // 1: Cherries (red/crimson pair)
    1: {
      name: 'Cherries',
      emoji: '🍒',
      pixels: [
        [0,0,0,1,1,0,0,0],
        [0,0,1,2,2,1,0,0],
        [0,0,1,3,3,1,0,0],
        [0,0,0,1,1,0,4,0],
        [0,4,0,0,0,4,4,0],
        [4,4,4,0,4,4,4,0],
        [4,4,4,0,4,4,4,0],
        [0,4,4,0,0,4,4,0],
      ],
      // 0=transparent, 1=stem(#4a7c1a), 2=leaf(#5c9e1a), 3=leaf-hi(#74bb22), 4=cherry(#cc1a1a), 5=cherry-hi(#ff4444)
      palette: {1:'#5c7a1a',2:'#6ea820',3:'#8fd42a',4:'#d01f1f',5:'#ff5555'}
    },
    // 2: Banana (emerald pair)
    2: {
      name: 'Banana',
      emoji: '🍌',
      pixels: [
        [0,0,0,1,1,0,0,0],
        [0,0,1,2,2,2,0,0],
        [0,1,2,2,3,2,1,0],
        [0,1,2,3,2,2,1,0],
        [0,0,1,2,2,1,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
      ],
      palette: {1:'#c8860a',2:'#f5c518',3:'#fde68a',4:'#a16207'}
    },
    // 3: Apple (blue pair)
    3: {
      name: 'Apple',
      emoji: '🍎',
      pixels: [
        [0,0,0,1,0,0,0,0],
        [0,0,1,2,0,0,0,0],
        [0,2,2,2,2,2,0,0],
        [2,2,3,2,2,2,2,0],
        [2,2,2,2,2,2,2,0],
        [0,2,2,2,2,2,0,0],
        [0,0,2,2,2,0,0,0],
        [0,0,0,4,0,0,0,0],
      ],
      palette: {1:'#5c3a1a',2:'#e32b2b',3:'#ff8888',4:'#5c3a1a'}
    },
    // 4: Pear (gold pair)
    4: {
      name: 'Pear',
      emoji: '🍐',
      pixels: [
        [0,0,0,1,0,0,0,0],
        [0,0,0,1,2,0,0,0],
        [0,0,0,2,2,0,0,0],
        [0,0,2,2,3,2,0,0],
        [0,2,2,2,2,2,2,0],
        [0,2,2,2,2,2,2,0],
        [0,0,2,2,2,2,0,0],
        [0,0,0,4,4,0,0,0],
      ],
      palette: {1:'#5c7a1a',2:'#aed136',3:'#d8f08a',4:'#5c7a1a'}
    },
    // 5: Pineapple (purple pair)
    5: {
      name: 'Pineapple',
      emoji: '🍍',
      pixels: [
        [0,1,0,0,1,0,0,0],
        [0,0,1,1,0,0,0,0],
        [0,2,2,2,2,0,0,0],
        [2,3,2,3,2,3,0,0],
        [2,2,3,2,3,2,0,0],
        [0,2,2,2,2,0,0,0],
        [0,0,2,2,0,0,0,0],
        [0,0,0,0,0,0,0,0],
      ],
      palette: {1:'#5c9e1a',2:'#e8a730',3:'#c47f10',4:'#fff'}
    },
    // 6: Strawberry (violet pair)
    6: {
      name: 'Strawberry',
      emoji: '🍓',
      pixels: [
        [0,0,1,1,0,0,0,0],
        [0,0,1,2,2,0,0,0],
        [0,2,2,2,2,2,0,0],
        [2,2,3,2,3,2,2,0],
        [2,2,2,3,2,2,2,0],
        [0,2,2,2,2,2,0,0],
        [0,0,2,2,2,0,0,0],
        [0,0,0,2,0,0,0,0],
      ],
      palette: {1:'#5c9e1a',2:'#e02020',3:'#fff9b0',4:'#b01010'}
    },
    // 7: Blackberry (cyan pair)
    7: {
      name: 'Blackberry',
      emoji: '🫐',
      pixels: [
        [0,0,1,1,0,0,0,0],
        [0,1,1,1,1,0,0,0],
        [0,2,3,2,3,2,0,0],
        [2,3,2,3,2,3,2,0],
        [2,2,3,2,3,2,2,0],
        [0,2,2,2,2,2,0,0],
        [0,0,2,2,2,0,0,0],
        [0,0,0,0,0,0,0,0],
      ],
      palette: {1:'#5c7a1a',2:'#3a1a6e',3:'#7040b8',4:'#1a0a30'}
    },
    // 8: Peach (magenta pair)
    8: {
      name: 'Peach',
      emoji: '🍑',
      pixels: [
        [0,0,0,1,0,0,0,0],
        [0,0,1,1,0,0,0,0],
        [0,2,2,2,2,2,0,0],
        [2,2,3,2,2,2,2,0],
        [2,2,2,2,3,2,2,0],
        [0,2,2,2,2,2,0,0],
        [0,0,2,4,2,0,0,0],
        [0,0,0,4,0,0,0,0],
      ],
      palette: {1:'#5c3a1a',2:'#f4a460',3:'#ffd6a0',4:'#8b2020'}
    }
  };

  /**
   * Renders a pixel-art fruit as an SVG string.
   */
  function renderFruitSVG(fruitId) {
    const fruit = FRUIT_PIXELS[fruitId];
    if (!fruit) return '';
    const pixelSize = 20;
    const gridSize = 8;
    const svgSize = pixelSize * gridSize;
    let rects = '';
    fruit.pixels.forEach((row, ry) => {
      row.forEach((colorKey, cx) => {
        if (colorKey === 0) return;
        const fill = fruit.palette[colorKey] || '#fff';
        rects += `<rect x="${cx * pixelSize}" y="${ry * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${fill}" rx="1"/>`;
      });
    });
    return `<svg class="fruit-pixel-art" viewBox="0 0 ${svgSize} ${svgSize}" xmlns="http://www.w3.org/2000/svg" aria-label="${fruit.name}" role="img">${rects}</svg>`;
  }

  // ─── Game State ─────────────────────────────────────────────────────────────
  let cards = [];
  let flippedCards = [];
  let turnsCount = 0;
  let matchedPairs = 0;
  let isBoardLocked = false;

  // Timer state
  let timerInterval = null;
  let elapsedSeconds = 0;
  let timerStarted = false;

  // Confetti Animation State
  let confettiActive = false;
  let confettiAnimationId = null;
  const confettiCanvas = document.getElementById('confetti-canvas');
  const ctx = confettiCanvas.getContext('2d');
  let confettiParticles = [];

  // ─── DOM Elements ───────────────────────────────────────────────────────────
  const gameBoard = document.getElementById('game-board');
  const turnsCountEl = document.getElementById('turns-count');
  const pairsCountEl = document.getElementById('pairs-count');
  const timerDisplayEl = document.getElementById('timer-display');
  const restartBtn = document.getElementById('restart-btn');
  const leaderboardBtn = document.getElementById('leaderboard-btn');

  const victoryOverlay = document.getElementById('victory-overlay');
  const victoryMessageText = document.getElementById('victory-message-text');
  const playAgainBtn = document.getElementById('play-again-btn');
  const viewScoresBtn = document.getElementById('view-scores-btn');

  const highscoreEntry = document.getElementById('highscore-entry');
  const playerNameInput = document.getElementById('player-name-input');
  const saveScoreBtn = document.getElementById('save-score-btn');

  const leaderboardOverlay = document.getElementById('leaderboard-overlay');
  const leaderboardList = document.getElementById('leaderboard-list');
  const closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');
  const clearScoresBtn = document.getElementById('clear-scores-btn');

  // ─── Initialize ─────────────────────────────────────────────────────────────
  initGame();

  // ─── Event Listeners ─────────────────────────────────────────────────────────
  restartBtn.addEventListener('click', () => initGame());
  playAgainBtn.addEventListener('click', () => initGame());

  leaderboardBtn.addEventListener('click', () => showLeaderboard());
  viewScoresBtn.addEventListener('click', () => {
    victoryOverlay.classList.add('hidden');
    showLeaderboard();
  });

  closeLeaderboardBtn.addEventListener('click', () => {
    leaderboardOverlay.classList.add('hidden');
  });

  clearScoresBtn.addEventListener('click', () => {
    if (confirm('Clear all saved scores?')) {
      localStorage.removeItem(LS_KEY);
      renderLeaderboardList();
    }
  });

  saveScoreBtn.addEventListener('click', () => saveHighScore());
  playerNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveHighScore();
  });

  // Close overlays on backdrop click
  victoryOverlay.addEventListener('click', (e) => {
    if (e.target === victoryOverlay) victoryOverlay.classList.add('hidden');
  });
  leaderboardOverlay.addEventListener('click', (e) => {
    if (e.target === leaderboardOverlay) leaderboardOverlay.classList.add('hidden');
  });

  // ─── Game Init ───────────────────────────────────────────────────────────────
  function initGame() {
    turnsCount = 0;
    matchedPairs = 0;
    flippedCards = [];
    isBoardLocked = false;

    turnsCountEl.textContent = '0';
    pairsCountEl.textContent = '0';

    victoryOverlay.classList.add('hidden');
    leaderboardOverlay.classList.add('hidden');
    highscoreEntry.classList.add('hidden');
    playerNameInput.value = '';

    stopTimer();
    resetTimer();

    stopConfetti();

    cards = [...COLOR_IDS, ...COLOR_IDS];
    shuffle(cards);
    buildBoard();
  }

  // ─── Fisher-Yates Shuffle ────────────────────────────────────────────────────
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // ─── Board Builder ───────────────────────────────────────────────────────────
  function buildBoard() {
    gameBoard.innerHTML = '';

    cards.forEach((colorId, index) => {
      const cardWrapper = document.createElement('div');
      cardWrapper.classList.add('card-wrapper', `color-${colorId}`);
      cardWrapper.setAttribute('role', 'gridcell');
      cardWrapper.setAttribute('tabindex', '0');
      cardWrapper.setAttribute('aria-label', `Card ${index + 1}`);
      cardWrapper.dataset.index = index;
      cardWrapper.dataset.colorId = colorId;

      const cardInner = document.createElement('div');
      cardInner.classList.add('card-inner');

      // Front face (face-down)
      const faceFront = document.createElement('div');
      faceFront.classList.add('card-face', 'front');

      // Back face (face-up, revealed color + fruit)
      const faceBack = document.createElement('div');
      faceBack.classList.add('card-face', 'back');

      // Pixel fruit art
      const fruitWrapper = document.createElement('div');
      fruitWrapper.classList.add('fruit-wrapper');
      fruitWrapper.innerHTML = renderFruitSVG(colorId);
      faceBack.appendChild(fruitWrapper);

      // Tick overlay SVG for matched state
      const tickSvg = document.createElement('div');
      tickSvg.classList.add('tick-overlay');
      tickSvg.innerHTML = `
        <svg class="tick-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <path class="tick-path" d="M20 6 9 17l-5-5" />
        </svg>
      `;
      faceBack.appendChild(tickSvg);

      cardInner.appendChild(faceFront);
      cardInner.appendChild(faceBack);
      cardWrapper.appendChild(cardInner);

      cardWrapper.addEventListener('click', () => handleCardTurn(cardWrapper));
      cardWrapper.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardTurn(cardWrapper);
        }
      });

      gameBoard.appendChild(cardWrapper);
    });
  }

  // ─── Card Turn Handler ───────────────────────────────────────────────────────
  function handleCardTurn(card) {
    if (isBoardLocked) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    // Start timer on first card flip
    if (!timerStarted) {
      startTimer();
      timerStarted = true;
    }

    card.classList.add('flipped');

    turnsCount++;
    turnsCountEl.textContent = turnsCount;

    flippedCards.push(card);

    if (flippedCards.length === 2) {
      isBoardLocked = true;
      checkMatch();
    }
  }

  // ─── Match Checker ───────────────────────────────────────────────────────────
  function checkMatch() {
    const [card1, card2] = flippedCards;
    const colorId1 = card1.dataset.colorId;
    const colorId2 = card2.dataset.colorId;

    if (colorId1 === colorId2) {
      matchedPairs++;
      pairsCountEl.textContent = matchedPairs;

      setTimeout(() => {
        card1.classList.add('matched');
        card2.classList.add('matched');

        flippedCards = [];
        isBoardLocked = false;

        if (matchedPairs === TOTAL_PAIRS) {
          triggerVictory();
        }
      }, 300);
    } else {
      setTimeout(() => {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');

        flippedCards = [];
        isBoardLocked = false;
      }, 1200);
    }
  }

  // ─── Timer ──────────────────────────────────────────────────────────────────
  function startTimer() {
    timerInterval = setInterval(() => {
      elapsedSeconds++;
      timerDisplayEl.textContent = formatTime(elapsedSeconds);
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    timerStarted = false;
  }

  function resetTimer() {
    elapsedSeconds = 0;
    timerDisplayEl.textContent = '0:00';
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  // ─── Victory ────────────────────────────────────────────────────────────────
  function triggerVictory() {
    stopTimer();

    setTimeout(() => {
      const timeStr = formatTime(elapsedSeconds);
      victoryMessageText.textContent = `You matched all 8 pairs in ${turnsCount} turns — ${timeStr}!`;

      // Check if player qualifies for leaderboard
      const scores = loadScores();
      if (scores.length < MAX_LEADERBOARD || qualifiesForLeaderboard(scores, turnsCount, elapsedSeconds)) {
        highscoreEntry.classList.remove('hidden');
        playerNameInput.focus();
      } else {
        highscoreEntry.classList.add('hidden');
      }

      victoryOverlay.classList.remove('hidden');
      startConfetti();
    }, 800);
  }

  // ─── Leaderboard ────────────────────────────────────────────────────────────
  function loadScores() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveScores(scores) {
    localStorage.setItem(LS_KEY, JSON.stringify(scores));
  }

  function qualifiesForLeaderboard(scores, turns, time) {
    if (scores.length < MAX_LEADERBOARD) return true;
    // Compare against worst score (last in sorted list)
    const worst = scores[scores.length - 1];
    if (turns < worst.turns) return true;
    if (turns === worst.turns && time < worst.time) return true;
    return false;
  }

  function sortScores(scores) {
    return scores.sort((a, b) => {
      if (a.turns !== b.turns) return a.turns - b.turns;
      return a.time - b.time;
    });
  }

  function saveHighScore() {
    const name = playerNameInput.value.trim() || 'Anonymous';
    const scores = loadScores();

    scores.push({
      name,
      turns: turnsCount,
      time: elapsedSeconds,
      date: new Date().toLocaleDateString()
    });

    sortScores(scores);

    // Trim to top 20
    if (scores.length > MAX_LEADERBOARD) scores.length = MAX_LEADERBOARD;

    saveScores(scores);

    highscoreEntry.classList.add('hidden');
    showLeaderboard();
    victoryOverlay.classList.add('hidden');
  }

  function showLeaderboard() {
    renderLeaderboardList();
    leaderboardOverlay.classList.remove('hidden');
  }

  function renderLeaderboardList() {
    const scores = loadScores();
    leaderboardList.innerHTML = '';

    if (scores.length === 0) {
      leaderboardList.innerHTML = '<p class="lb-empty">No scores yet. Play a game to get on the board!</p>';
      return;
    }

    scores.forEach((entry, i) => {
      const rank = i + 1;
      const row = document.createElement('div');
      row.classList.add('lb-row');

      // Highlight medals for top 3
      let rankClass = '';
      let rankIcon = `#${rank}`;
      if (rank === 1) { rankClass = 'gold'; rankIcon = '🥇'; }
      else if (rank === 2) { rankClass = 'silver'; rankIcon = '🥈'; }
      else if (rank === 3) { rankClass = 'bronze'; rankIcon = '🥉'; }

      row.innerHTML = `
        <span class="lb-rank ${rankClass}">${rankIcon}</span>
        <span class="lb-name">${escapeHtml(entry.name)}</span>
        <span class="lb-turns"><span class="lb-val">${entry.turns}</span> <span class="lb-unit">turns</span></span>
        <span class="lb-time"><span class="lb-val">${formatTime(entry.time)}</span></span>
        <span class="lb-date">${entry.date || ''}</span>
      `;

      leaderboardList.appendChild(row);
    });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  /* ==========================================================================
     Canvas Confetti Particle System
     ========================================================================== */

  class Confetti {
    constructor() {
      this.colors = ['#ff5e62', '#11998e', '#00c6ff', '#f5af19', '#e100ff', '#10b981', '#f3f4f6'];
      this.reset();
    }

    reset() {
      this.x = Math.random() * confettiCanvas.width;
      this.y = Math.random() * -confettiCanvas.height - 20;
      this.size = Math.random() * 8 + 6;
      this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
      this.speedX = Math.random() * 4 - 2;
      this.speedY = Math.random() * 3 + 4;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = Math.random() * 4 - 2;
      this.opacity = Math.random() * 0.4 + 0.6;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.rotation += this.rotationSpeed;
      if (this.y > confettiCanvas.height) this.reset();
    }

    draw() {
      ctx.save();
      ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      ctx.restore();
    }
  }

  function resizeConfettiCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }

  function startConfetti() {
    confettiActive = true;
    confettiParticles = [];
    resizeConfettiCanvas();
    window.addEventListener('resize', resizeConfettiCanvas);

    const particleCount = Math.min(120, Math.floor(window.innerWidth / 8));
    for (let i = 0; i < particleCount; i++) {
      confettiParticles.push(new Confetti());
    }

    animateConfetti();
  }

  function stopConfetti() {
    confettiActive = false;
    if (confettiAnimationId) {
      cancelAnimationFrame(confettiAnimationId);
      confettiAnimationId = null;
    }
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    window.removeEventListener('resize', resizeConfettiCanvas);
  }

  function animateConfetti() {
    if (!confettiActive) return;

    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiParticles.forEach((p) => {
      p.update();
      p.draw();
    });

    confettiAnimationId = requestAnimationFrame(animateConfetti);
  }
});
