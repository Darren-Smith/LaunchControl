// Cat Fighters - Main Game Engine & Controller
// Manages the game loop, 60s timer, Street Fighter HUD, referee flow, arenas (1200x1000), and menus.

class CatFightersGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Virtual resolution (1200 x 1000)
    this.width = 1200;
    this.height = 1000;
    this.groundY = 880;

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Game Mode: '2p' or 'cpu'
    this.gameMode = '2p';
    this.cpuDifficulty = 'normal'; // 'easy', 'normal', 'hard'

    // Game State: 'menu', 'intro', 'fight', 'ko', 'time_over', 'round_over', 'match_over', 'paused'
    this.state = 'menu';
    this.previousState = 'fight';

    // Round & Timer Mechanics
    this.roundNumber = 1;
    this.maxRounds = 3; // Best 2 out of 3
    this.matchTime = 60; // 60 seconds per round
    this.timerCountdown = 60;
    this.stateTimer = 0;
    this.announcementText = '';
    this.announcementSubtext = '';
    this.announcementScale = 1.0;

    // Slow motion hitpause effect
    this.hitPauseTimer = 0;

    // Fighter Entities
    this.p1 = new CatFighter({
      name: 'RED CAT',
      playerNumber: 1,
      themeColor: '#e53935',
      secondaryColor: '#ef5350',
      bellyColor: '#ffebee',
      accessoryColor: '#ffeb3b',
      x: 280,
      groundY: this.groundY,
      facing: 1,
    });

    this.p2 = new CatFighter({
      name: 'BLUE CAT',
      playerNumber: 2,
      themeColor: '#1e88e5',
      secondaryColor: '#42a5f5',
      bellyColor: '#e3f2fd',
      accessoryColor: '#00e5ff',
      x: 920,
      groundY: this.groundY,
      facing: -1,
    });

    this.cpuAI = new CatAI(this.p2, this.p1);

    // Smooth health bar interpolation ("chip" damage trailing bar)
    this.p1DisplayHealth = 100;
    this.p2DisplayHealth = 100;

    // Controller Menu Navigation State
    this.mainMenuRow = 0; // 0: 2P, 1: CPU, 2: Difficulty, 3: Movelist/HighScores, 4: Mute
    this.mainMenuCol = 0; // Used on Row 3 (0: Movelist, 1: HighScores)
    this.pauseMenuIndex = 0;
    this.gameOverMenuIndex = 0;
    this.presetNames = [
      'CLAW_MASTER',
      'RED_NINJA',
      'BLUE_BOXER',
      'FUR_FURY',
      'MEOW_CHAMP',
      'POOP_KING',
      'SCRATCH_PRO',
      'CAT_BOSS',
    ];
    this.presetNameIndex = 0;
    this.navRepeatDir = null;
    this.navRepeatTimer = 0;

    // Last frame timestamp
    this.lastTime = performance.now();

    // DOM UI Elements
    this.initUI();
    this.updateMenuFocusVisuals();
    this.updateCursorVisibility();

    // Start render/update loop
    requestAnimationFrame((t) => this.loop(t));
  }

  initUI() {
    // Mode Selection Buttons
    const btn2P = document.getElementById('btnMode2P');
    const btnCPU = document.getElementById('btnModeCPU');
    const btnHighScores = document.getElementById('btnHighScores');
    const btnMovelist = document.getElementById('btnMovelist');

    if (btn2P) {
      btn2P.addEventListener('click', () => this.startNewMatch('2p'));
    }
    if (btnCPU) {
      btnCPU.addEventListener('click', () => this.startNewMatch('cpu'));
    }
    if (btnHighScores) {
      btnHighScores.addEventListener('click', () => this.showHighScoresModal());
    }
    if (btnMovelist) {
      btnMovelist.addEventListener('click', () => this.showMovelistModal());
    }

    // CPU Difficulty Selector Buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const diff = btn.getAttribute('data-diff');
        if (diff) {
          this.setCPUDifficulty(diff);
        }
      });
    });

    // Pause Menu Buttons
    const btnPauseToggle = document.getElementById('btnPauseToggle');
    const btnResume = document.getElementById('btnResume');
    const btnRestart = document.getElementById('btnRestart');
    const btnPauseMovelist = document.getElementById('btnPauseMovelist');
    const btnPauseExit = document.getElementById('btnPauseExit');
    const btnMute = document.getElementById('btnMuteToggle');

    if (btnPauseToggle) {
      btnPauseToggle.addEventListener('click', () => this.togglePause());
    }
    if (btnResume) {
      btnResume.addEventListener('click', () => this.resume());
    }
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        this.hidePauseMenu();
        this.startNewMatch(this.gameMode);
      });
    }
    if (btnPauseMovelist) {
      btnPauseMovelist.addEventListener('click', () => this.showMovelistModal());
    }
    if (btnPauseExit) {
      btnPauseExit.addEventListener('click', () => {
        this.hidePauseMenu();
        this.showMainMenu();
      });
    }
    if (btnMute) {
      btnMute.addEventListener('click', () => {
        const muted = window.audio.toggleMute();
        this.updateMuteUI(muted);
      });
      this.updateMuteUI(window.audio.isMuted);
    }

    // Modal Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.game-modal');
        if (modal) modal.classList.remove('active');
        this.updateMenuFocusVisuals();
        this.updateCursorVisibility();
      });
    });

    // Keyboard Pause listener (Escape or P)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (this.state === 'fight' || this.state === 'intro' || this.state === 'paused') {
          this.togglePause();
        }
      }
    });

    // High Score Submission
    const btnSubmitScore = document.getElementById('btnSubmitScore');
    if (btnSubmitScore) {
      btnSubmitScore.addEventListener('click', () => this.submitHighScore());
    }
    const winnerNameInput = document.getElementById('winnerNameInput');
    if (winnerNameInput) {
      winnerNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          this.submitHighScore();
        }
      });
    }

    // Defeat Actions (Retry vs Menu)
    const btnDefeatRetry = document.getElementById('btnDefeatRetry');
    const btnDefeatMenu = document.getElementById('btnDefeatMenu');
    if (btnDefeatRetry) {
      btnDefeatRetry.addEventListener('click', () => {
        const gameOverOverlay = document.getElementById('gameOverOverlay');
        if (gameOverOverlay) gameOverOverlay.classList.remove('active');
        this.startNewMatch(this.gameMode);
      });
    }
    if (btnDefeatMenu) {
      btnDefeatMenu.addEventListener('click', () => {
        const gameOverOverlay = document.getElementById('gameOverOverlay');
        if (gameOverOverlay) gameOverOverlay.classList.remove('active');
        this.showMainMenu();
      });
    }

    // Audio gesture bootstrap & Title BGM starter
    const handleFirstGesture = () => {
      window.audio.ensureContext();
      window.audio.preloadAllTracks();
      if (this.state === 'menu' && !window.audio.bgmPlaying) {
        window.audio.playTitleBGM();
      }
    };
    window.addEventListener('click', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);

    // Gamepad connection status indicator
    if (window.input) {
      window.input.onGamepadStatusChange = (pads) => this.updateGamepadStatusUI(pads);
      this.updateGamepadStatusUI(window.input.refreshConnectedGamepads());
    }
  }

  updateGamepadStatusUI(pads = []) {
    const badge = document.getElementById('gamepadStatusBadge');
    if (!badge) return;

    const count = pads.length;
    if (count === 0) {
      badge.textContent = '🎮 No Pad (Plug & Press)';
      badge.className = 'nav-badge gamepad-badge';
    } else if (count === 1) {
      badge.textContent = '🎮 1 Controller (P1)';
      badge.className = 'nav-badge gamepad-badge connected-1';
    } else {
      badge.textContent = `🎮 ${count} Controllers (P1 & P2)`;
      badge.className = 'nav-badge gamepad-badge connected-2';
    }
  }

  updateMuteUI(isMuted) {
    const btnMute = document.getElementById('btnMuteToggle');
    if (btnMute) {
      btnMute.innerHTML = isMuted ? '🔇 Unmute' : '🔊 Sound: ON';
      btnMute.classList.toggle('muted', isMuted);
    }
  }

  setCPUDifficulty(level) {
    this.cpuDifficulty = level || 'normal';
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-diff') === this.cpuDifficulty);
    });
    const btnCPU = document.getElementById('btnModeCPU');
    if (btnCPU) {
      btnCPU.textContent = `🤖 1-PLAYER VS CPU (${this.cpuDifficulty.toUpperCase()})`;
    }
    if (this.cpuAI) {
      this.cpuAI.setDifficulty(this.cpuDifficulty);
    }
  }

  startNewMatch(mode = '2p') {
    this.gameMode = mode;
    this.p2.isCPU = mode === 'cpu';

    if (mode === 'cpu') {
      this.cpuAI.setDifficulty(this.cpuDifficulty);
      const diffTag = this.cpuDifficulty.toUpperCase();
      this.p2.name = `BLUE CAT [${diffTag}]`;
    } else {
      this.p2.name = 'BLUE CAT (P2)';
      this.p2.moveSpeed = 7.5;
    }

    this.roundNumber = 1;
    this.p1.wins = 0;
    this.p1.score = 0;
    this.p2.wins = 0;
    this.p2.score = 0;

    // Hide Main Menu, Game Over, and any open modals
    const menuOverlay = document.getElementById('mainMenuOverlay');
    if (menuOverlay) menuOverlay.classList.remove('active');
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    if (gameOverOverlay) gameOverOverlay.classList.remove('active');
    document.querySelectorAll('.game-modal.active').forEach(m => m.classList.remove('active'));

    // Stop any High Score / Title / Victory BGM cleanly before starting Round 1 battle music
    window.audio.stopBGM();
    this.startRound(1);
  }

  startRound(round) {
    this.roundNumber = round;
    this.timerCountdown = this.matchTime;
    this.state = 'intro';
    this.stateTimer = 2.4;

    this.p1.resetForNewRound(280, 1);
    this.p2.resetForNewRound(920, -1);
    this.p1DisplayHealth = 100;
    this.p2DisplayHealth = 100;

    // Apply CPU difficulty speed and traits for the round
    if (this.gameMode === 'cpu') {
      this.cpuAI.setDifficulty(this.cpuDifficulty);
    }

    window.projectiles.clear();

    const roundName = round === 3 ? 'FINAL ROUND' : `ROUND ${round}`;
    this.announcementText = roundName;
    this.announcementSubtext = 'READY...';
    this.announcementScale = 0.5;

    window.audio.playRoundIntro();
    // Ensure combat music is active and looping seamlessly throughout every round
    window.audio.playBattleBGM();
  }

  togglePause() {
    if (this.state === 'paused') {
      this.resume();
    } else if (this.state === 'fight' || this.state === 'intro') {
      this.previousState = this.state;
      this.state = 'paused';
      this.pauseMenuIndex = 0;
      const pauseModal = document.getElementById('pauseModal');
      if (pauseModal) pauseModal.classList.add('active');
      this.updateMenuFocusVisuals();
      this.updateCursorVisibility();
    }
  }

  resume() {
    if (this.state === 'paused') {
      this.state = this.previousState;
      this.hidePauseMenu();
      this.updateMenuFocusVisuals();
      this.updateCursorVisibility();
    }
  }

  hidePauseMenu() {
    const pauseModal = document.getElementById('pauseModal');
    if (pauseModal) pauseModal.classList.remove('active');
  }

  showMainMenu() {
    this.state = 'menu';
    window.audio.playTitleBGM();
    const menuOverlay = document.getElementById('mainMenuOverlay');
    if (menuOverlay) menuOverlay.classList.add('active');
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    if (gameOverOverlay) gameOverOverlay.classList.remove('active');
    this.updateMenuFocusVisuals();
    this.updateCursorVisibility();
  }

  showMovelistModal() {
    const modal = document.getElementById('movelistModal');
    if (modal) {
      modal.classList.add('active');
      this.updateMenuFocusVisuals();
      this.updateCursorVisibility();
    }
  }

  showHighScoresModal() {
    const modal = document.getElementById('highscoresModal');
    if (modal) {
      this.renderHighScoresTable();
      modal.classList.add('active');
      this.updateMenuFocusVisuals();
      this.updateCursorVisibility();
    }
  }

  updateCursorVisibility() {
    const hasOpenModal = Boolean(document.querySelector('.game-modal.active'));
    const isGameplay = (
      this.state === 'intro' ||
      this.state === 'fight' ||
      this.state === 'ko' ||
      this.state === 'time_over' ||
      this.state === 'round_over'
    ) && !hasOpenModal;
    document.body.classList.toggle('hide-cursor', isGameplay);
  }

  cycleCPUDifficulty(delta) {
    const order = ['easy', 'normal', 'hard'];
    const idx = Math.max(0, order.indexOf(this.cpuDifficulty));
    const nextIdx = (idx + delta + order.length) % order.length;
    this.setCPUDifficulty(order[nextIdx]);
  }

  cycleWinnerPresetName(delta) {
    const input = document.getElementById('winnerNameInput');
    if (!input) return;
    this.presetNameIndex = (this.presetNameIndex + delta + this.presetNames.length) % this.presetNames.length;
    input.value = this.presetNames[this.presetNameIndex];
  }

  updateMenuFocusVisuals() {
    document.querySelectorAll('.gamepad-focus').forEach(el => el.classList.remove('gamepad-focus'));

    // 1. Open Modal takes top priority
    const activeModal = document.querySelector('.game-modal.active');
    if (activeModal) {
      const closeBtn = activeModal.querySelector('.modal-footer .modal-close') || activeModal.querySelector('.modal-close');
      if (closeBtn) closeBtn.classList.add('gamepad-focus');
      return;
    }

    // 2. Pause Menu
    if (this.state === 'paused') {
      const pauseButtons = ['btnResume', 'btnRestart', 'btnPauseMovelist', 'btnPauseExit'];
      const targetId = pauseButtons[this.pauseMenuIndex] || pauseButtons[0];
      const el = document.getElementById(targetId);
      if (el) el.classList.add('gamepad-focus');
      return;
    }

    // 3. Game Over / Victory & Defeat Overlay
    if (this.state === 'match_over') {
      const cpuWon = this.gameMode === 'cpu' && this.p2.wins >= 2;
      if (cpuWon) {
        const defeatButtons = ['btnDefeatRetry', 'btnDefeatMenu'];
        const el = document.getElementById(defeatButtons[this.gameOverMenuIndex] || defeatButtons[0]);
        if (el) el.classList.add('gamepad-focus');
      } else {
        const victoryItems = ['btnSubmitScore', 'winnerNameInput'];
        const el = document.getElementById(victoryItems[this.gameOverMenuIndex] || victoryItems[0]);
        if (el) el.classList.add('gamepad-focus');
      }
      return;
    }

    // 4. Main Menu
    if (this.state === 'menu') {
      let targetEl = null;
      if (this.mainMenuRow === 0) {
        targetEl = document.getElementById('btnMode2P');
      } else if (this.mainMenuRow === 1) {
        targetEl = document.getElementById('btnModeCPU');
      } else if (this.mainMenuRow === 2) {
        targetEl = document.querySelector(`.diff-btn[data-diff="${this.cpuDifficulty}"]`) || document.getElementById('diffNormal');
      } else if (this.mainMenuRow === 3) {
        targetEl = document.getElementById(this.mainMenuCol === 0 ? 'btnMovelist' : 'btnHighScores');
      } else if (this.mainMenuRow === 4) {
        targetEl = document.getElementById('btnMuteToggle');
      }
      if (targetEl) targetEl.classList.add('gamepad-focus');
    }
  }

  handleControllerMenuNavigation(dt) {
    const inp = window.input;
    if (!inp) return;

    // Directional step with hold auto-repeat
    let heldDir = null;
    if (inp.isAnyGamepadAction('menuUp')) heldDir = 'up';
    else if (inp.isAnyGamepadAction('menuDown')) heldDir = 'down';
    else if (inp.isAnyGamepadAction('menuLeft')) heldDir = 'left';
    else if (inp.isAnyGamepadAction('menuRight')) heldDir = 'right';

    let stepDir = null;
    if (inp.isAnyGamepadActionJustPressed('menuUp')) {
      stepDir = 'up';
      this.navRepeatDir = 'up';
      this.navRepeatTimer = 0.36;
    } else if (inp.isAnyGamepadActionJustPressed('menuDown')) {
      stepDir = 'down';
      this.navRepeatDir = 'down';
      this.navRepeatTimer = 0.36;
    } else if (inp.isAnyGamepadActionJustPressed('menuLeft')) {
      stepDir = 'left';
      this.navRepeatDir = 'left';
      this.navRepeatTimer = 0.36;
    } else if (inp.isAnyGamepadActionJustPressed('menuRight')) {
      stepDir = 'right';
      this.navRepeatDir = 'right';
      this.navRepeatTimer = 0.36;
    } else if (heldDir && heldDir === this.navRepeatDir) {
      this.navRepeatTimer -= dt;
      if (this.navRepeatTimer <= 0) {
        stepDir = heldDir;
        this.navRepeatTimer = 0.15;
      }
    } else if (!heldDir) {
      this.navRepeatDir = null;
      this.navRepeatTimer = 0;
    }

    // 1. Open Modal (Movelist or High Scores): Scroll with Up/Down, Close with Button 3 (menuConfirm) or Back
    const activeModal = document.querySelector('.game-modal.active');
    if (activeModal) {
      const modalBody = activeModal.querySelector('.modal-body');
      if (modalBody && (heldDir === 'up' || heldDir === 'down')) {
        modalBody.scrollTop += (heldDir === 'down' ? 1 : -1) * 340 * dt;
      }
      if (
        inp.isAnyGamepadActionJustPressed('menuConfirm') ||
        inp.isAnyGamepadActionJustPressed('menuBack')
      ) {
        activeModal.classList.remove('active');
        this.updateMenuFocusVisuals();
        this.updateCursorVisibility();
      }
      return;
    }

    // 2. Active Fight / Intro: Start button pauses the match
    if (this.state === 'fight' || this.state === 'intro') {
      if (inp.isAnyGamepadActionJustPressed('pause')) {
        this.togglePause();
      }
      return;
    }

    // 3. Pause Menu: Start button resumes; Button 3 (menuConfirm) activates highlighted menu option
    if (this.state === 'paused') {
      if (inp.isAnyGamepadActionJustPressed('pause') || inp.isAnyGamepadActionJustPressed('menuBack')) {
        this.resume();
        return;
      }

      const pauseButtons = ['btnResume', 'btnRestart', 'btnPauseMovelist', 'btnPauseExit'];
      if (stepDir === 'up') {
        this.pauseMenuIndex = (this.pauseMenuIndex + pauseButtons.length - 1) % pauseButtons.length;
        this.updateMenuFocusVisuals();
      } else if (stepDir === 'down') {
        this.pauseMenuIndex = (this.pauseMenuIndex + 1) % pauseButtons.length;
        this.updateMenuFocusVisuals();
      }

      if (inp.isAnyGamepadActionJustPressed('menuConfirm')) {
        const btn = document.getElementById(pauseButtons[this.pauseMenuIndex]);
        if (btn) btn.click();
      }
      return;
    }

    // 4. Match Over (Victory Name Entry or CPU Defeat Retry/Quit): Button 3 (menuConfirm) activates
    if (this.state === 'match_over') {
      const cpuWon = this.gameMode === 'cpu' && this.p2.wins >= 2;
      if (cpuWon) {
        const defeatButtons = ['btnDefeatRetry', 'btnDefeatMenu'];
        if (stepDir === 'left' || stepDir === 'right' || stepDir === 'up' || stepDir === 'down') {
          this.gameOverMenuIndex = (this.gameOverMenuIndex + 1) % defeatButtons.length;
          this.updateMenuFocusVisuals();
        }
        if (inp.isAnyGamepadActionJustPressed('menuConfirm')) {
          const btn = document.getElementById(defeatButtons[this.gameOverMenuIndex]);
          if (btn) btn.click();
        }
      } else {
        // Human Victory: item 0 = Save Score, item 1 = Name Input (Left/Right cycles preset names)
        if (stepDir === 'up' || stepDir === 'down') {
          this.gameOverMenuIndex = (this.gameOverMenuIndex + 1) % 2;
          this.updateMenuFocusVisuals();
        } else if (stepDir === 'left' || stepDir === 'right') {
          if (this.gameOverMenuIndex === 1) {
            this.cycleWinnerPresetName(stepDir === 'right' ? 1 : -1);
          } else {
            this.gameOverMenuIndex = 1;
            this.updateMenuFocusVisuals();
          }
        }
        if (inp.isAnyGamepadActionJustPressed('menuConfirm')) {
          this.submitHighScore();
        }
      }
      return;
    }

    // 5. Main Menu: Button 3 (menuConfirm) activates the highlighted menu button
    if (this.state === 'menu') {
      if (stepDir) {
        if (window.audio && !window.audio.bgmPlaying) {
          window.audio.playTitleBGM();
        }
      }

      if (stepDir === 'up') {
        this.mainMenuRow = (this.mainMenuRow + 4) % 5;
        this.updateMenuFocusVisuals();
      } else if (stepDir === 'down') {
        this.mainMenuRow = (this.mainMenuRow + 1) % 5;
        this.updateMenuFocusVisuals();
      } else if (stepDir === 'left' || stepDir === 'right') {
        const delta = stepDir === 'right' ? 1 : -1;
        if (this.mainMenuRow === 1 || this.mainMenuRow === 2) {
          this.cycleCPUDifficulty(delta);
          this.updateMenuFocusVisuals();
        } else if (this.mainMenuRow === 3) {
          this.mainMenuCol = (this.mainMenuCol + 1) % 2;
          this.updateMenuFocusVisuals();
        }
      }

      if (inp.isAnyGamepadActionJustPressed('select')) {
        const btnMute = document.getElementById('btnMuteToggle');
        if (btnMute) btnMute.click();
        return;
      }

      if (inp.isAnyGamepadActionJustPressed('menuConfirm') || inp.isAnyGamepadActionJustPressed('start')) {
        if (this.mainMenuRow === 0) {
          this.startNewMatch('2p');
        } else if (this.mainMenuRow === 1 || this.mainMenuRow === 2) {
          this.startNewMatch('cpu');
        } else if (this.mainMenuRow === 3) {
          if (window.audio && !window.audio.bgmPlaying) {
            window.audio.playTitleBGM();
          }
          if (this.mainMenuCol === 0) this.showMovelistModal();
          else this.showHighScoresModal();
        } else if (this.mainMenuRow === 4) {
          const btnMute = document.getElementById('btnMuteToggle');
          if (btnMute) btnMute.click();
        }
      }
    }
  }

  renderHighScoresTable() {
    const listContainer = document.getElementById('highscoresList');
    if (!listContainer) return;

    const scores = window.highScores.getScores();
    listContainer.innerHTML = scores.map((s, idx) => {
      const diff = (s.difficulty || 'NORMAL').toUpperCase();
      let diffBadgeClass = 'diff-badge-normal';
      if (diff === 'EASY') diffBadgeClass = 'diff-badge-easy';
      else if (diff === 'HARD') diffBadgeClass = 'diff-badge-hard';
      else if (diff === '2P') diffBadgeClass = 'diff-badge-2p';

      return `
        <div class="score-row ${idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : ''}">
          <span class="score-rank">#${idx + 1}</span>
          <span class="score-name">${s.name}</span>
          <span class="score-diff ${diffBadgeClass}">${diff}</span>
          <span class="score-cat ${s.cat.includes('Red') ? 'cat-red' : 'cat-blue'}">${s.cat}</span>
          <span class="score-points">${s.score.toLocaleString()} PTS</span>
        </div>
      `;
    }).join('');
  }

  submitHighScore() {
    // Only human players are saved to high scores
    if (this.gameMode === 'cpu' && this.p2.wins >= 2) {
      // CPU won, never submit high score for CPU
      return;
    }

    const input = document.getElementById('winnerNameInput');
    const winnerName = input && input.value.trim() ? input.value.trim() : 'CHAMP_CAT';

    const winner = this.p1.wins >= 2 ? this.p1 : this.p2;
    const finalScore = window.highScores.calculateMatchScore(
      winner,
      this.timerCountdown,
      true,
      this.cpuDifficulty,
      this.gameMode
    );

    window.highScores.addScore({
      name: winnerName,
      cat: winner.name.includes('RED') ? 'Red Cat' : 'Blue Cat',
      score: finalScore,
      difficulty: this.gameMode === 'cpu' ? this.cpuDifficulty.toUpperCase() : '2P',
      perfect: winner.health >= 100,
    });

    const gameOverOverlay = document.getElementById('gameOverOverlay');
    if (gameOverOverlay) gameOverOverlay.classList.remove('active');

    this.showMainMenu();
    this.showHighScoresModal();
  }

  // --- GAME LOOP ---
  loop(currentTime) {
    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    // Poll connected game controllers at the start of each frame
    window.input.pollGamepads();

    // Handle Gamepad Menu Navigation, Modals, and Pause/Start
    this.handleControllerMenuNavigation(dt);
    this.updateCursorVisibility();

    this.update(dt);
    this.render();

    window.input.update();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.state === 'paused' || this.state === 'menu') return;

    if (this.hitPauseTimer > 0) {
      this.hitPauseTimer -= dt;
      return;
    }

    this.p1DisplayHealth += (this.p1.health - this.p1DisplayHealth) * 0.12;
    this.p2DisplayHealth += (this.p2.health - this.p2DisplayHealth) * 0.12;

    window.particles.update();

    // STATE: INTRO
    if (this.state === 'intro') {
      this.stateTimer -= dt;
      this.announcementScale = Math.min(1.2, this.announcementScale + dt * 0.6);

      if (this.stateTimer <= 1.0 && this.announcementSubtext !== 'FIGHT!') {
        this.announcementText = 'FIGHT!';
        this.announcementSubtext = '';
        this.announcementScale = 1.4;
        window.audio.playFightGong();
      }

      if (this.stateTimer <= 0) {
        this.state = 'fight';
        this.announcementText = '';
      }
    }

    // STATE: FIGHT
    else if (this.state === 'fight') {
      this.timerCountdown -= dt;
      if (this.timerCountdown <= 0) {
        this.timerCountdown = 0;
        this.handleTimeOver();
        return;
      }

      // 1. Process Player 1 Inputs
      this.handleP1Input();

      // 2. Process Player 2 Inputs (Human or CPU)
      if (this.p2.isCPU) {
        this.cpuAI.update(dt, window.projectiles);
      } else {
        this.handleP2Input();
      }

      // 3. Update fighters
      this.p1.update(dt, this.p2, this.width);
      this.p2.update(dt, this.p1, this.width);

      // 4. Update projectiles
      window.projectiles.update(dt, this.width, this.groundY, this.p1, this.p2);

      // 5. Check KO
      if (!this.p1.isAlive || !this.p2.isAlive) {
        this.handleKnockout();
      }
    }

    // STATE: KO or TIME OVER
    else if (this.state === 'ko' || this.state === 'time_over') {
      this.stateTimer -= dt;
      this.announcementScale = Math.min(1.3, this.announcementScale + dt * 0.4);

      this.p1.update(dt, this.p2, this.width);
      this.p2.update(dt, this.p1, this.width);
      window.projectiles.update(dt, this.width, this.groundY, this.p1, this.p2);

      if (this.stateTimer <= 0) {
        this.evaluateRoundWinner();
      }
    }

    // STATE: ROUND OVER
    else if (this.state === 'round_over') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        if (this.p1.wins >= 2 || this.p2.wins >= 2) {
          this.handleMatchVictory();
        } else {
          this.startRound(this.roundNumber + 1);
        }
      }
    }
  }

  handleP1Input() {
    const inp = window.input;

    if (inp.isP1Action('left')) {
      this.p1.move(-1);
    } else if (inp.isP1Action('right')) {
      this.p1.move(1);
    } else {
      this.p1.stopMove();
    }

    if (inp.isP1ActionJustPressed('jump')) {
      this.p1.jump();
    }

    // 6 Attacks for Player 1:
    if (inp.isP1ActionJustPressed('attack1')) {
      this.p1.startAttack(1); // Poo Attack
    } else if (inp.isP1ActionJustPressed('attack2')) {
      this.p1.startAttack(2); // Hairball Attack (5s root)
    } else if (inp.isP1ActionJustPressed('attack3')) {
      this.p1.startAttack(3); // Scratch
    } else if (inp.isP1ActionJustPressed('attack4')) {
      this.p1.startAttack(4); // Litter Throw
    } else if (inp.isP1ActionJustPressed('attack5')) {
      this.p1.startAttack(5); // Poop Grenade (10s poison)
    } else if (inp.isP1ActionJustPressed('attack6')) {
      this.p1.startAttack(6); // Scramble Attack (leap spin + knockback)
    }
  }

  handleP2Input() {
    const inp = window.input;

    if (inp.isP2Action('left')) {
      this.p2.move(-1);
    } else if (inp.isP2Action('right')) {
      this.p2.move(1);
    } else {
      this.p2.stopMove();
    }

    if (inp.isP2ActionJustPressed('jump')) {
      this.p2.jump();
    }

    // 6 Attacks for Player 2:
    if (inp.isP2ActionJustPressed('attack1')) {
      this.p2.startAttack(1); // Poo Attack
    } else if (inp.isP2ActionJustPressed('attack2')) {
      this.p2.startAttack(2); // Hairball Attack
    } else if (inp.isP2ActionJustPressed('attack3')) {
      this.p2.startAttack(3); // Scratch
    } else if (inp.isP2ActionJustPressed('attack4')) {
      this.p2.startAttack(4); // Litter Throw
    } else if (inp.isP2ActionJustPressed('attack5')) {
      this.p2.startAttack(5); // Poop Grenade
    } else if (inp.isP2ActionJustPressed('attack6')) {
      this.p2.startAttack(6); // Scramble Attack
    }
  }

  handleKnockout() {
    this.state = 'ko';
    this.stateTimer = 2.5;
    this.announcementText = 'K.O.!';
    this.announcementSubtext = '';
    this.announcementScale = 0.5;
    this.hitPauseTimer = 0.25;
  }

  handleTimeOver() {
    this.state = 'time_over';
    this.stateTimer = 2.2;
    this.announcementText = 'TIME UP!';
    this.announcementSubtext = '';
    this.announcementScale = 0.5;
    window.audio.playKO();
  }

  evaluateRoundWinner() {
    let roundWinner = null;
    if (this.p1.health > this.p2.health) {
      roundWinner = this.p1;
    } else if (this.p2.health > this.p1.health) {
      roundWinner = this.p2;
    }

    this.state = 'round_over';
    this.stateTimer = 2.0;

    if (roundWinner) {
      roundWinner.triggerWin();
      this.announcementText = `${roundWinner.name} WINS!`;
      this.announcementSubtext = roundWinner.health >= 100 ? 'PERFECT!' : '';
    } else {
      this.announcementText = 'DOUBLE DRAW!';
      this.announcementSubtext = '';
    }
    this.announcementScale = 1.0;
  }

  handleMatchVictory() {
    this.state = 'match_over';
    const isCPUMode = this.gameMode === 'cpu';
    const cpuWon = isCPUMode && this.p2.wins >= 2;

    // Always stop level/battle BGM immediately when match ends
    window.audio.stopBGM();

    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const winnerTitle = document.getElementById('winnerTitle');
    const scoreDisplay = document.getElementById('matchScoreDisplay');
    const nameEntryBox = document.getElementById('nameEntryBox');
    const cpuDefeatActions = document.getElementById('cpuDefeatActions');

    if (cpuWon) {
      // CPU Won: NEVER allow high score entry for CPU!
      if (winnerTitle) {
        winnerTitle.textContent = '💀 DEFEAT! CPU WON';
        winnerTitle.className = 'winner-blue';
      }
      if (scoreDisplay) {
        scoreDisplay.textContent = 'The Blue Cat outmatched you this time!';
      }
      if (nameEntryBox) nameEntryBox.style.display = 'none';
      if (cpuDefeatActions) cpuDefeatActions.style.display = 'flex';
    } else {
      window.audio.playVictory();
      // Human player won (or 2-Player mode)
      const overallWinner = this.p1.wins >= 2 ? this.p1 : this.p2;
      const finalScore = window.highScores.calculateMatchScore(
        overallWinner,
        this.timerCountdown,
        true,
        this.cpuDifficulty,
        this.gameMode
      );

      if (winnerTitle) {
        winnerTitle.textContent = `🏆 ${overallWinner.name} IS THE CHAMPION!`;
        winnerTitle.className = overallWinner === this.p1 ? 'winner-red' : 'winner-blue';
      }
      if (scoreDisplay) {
        const bonusDesc = isCPUMode
          ? (this.cpuDifficulty === 'hard' ? ' (HARD: 1.5× SCORE BONUS)' : (this.cpuDifficulty === 'easy' ? ' (EASY: 0.6× SCORE)' : ' (NORMAL: 1.0× SCORE)'))
          : '';
        scoreDisplay.textContent = `FINAL SCORE: ${finalScore.toLocaleString()} PTS${bonusDesc}`;
      }
      if (nameEntryBox) nameEntryBox.style.display = 'block';
      if (cpuDefeatActions) cpuDefeatActions.style.display = 'none';
    }

    if (gameOverOverlay) {
      gameOverOverlay.classList.add('active');
    }
    this.gameOverMenuIndex = 0;
    this.updateMenuFocusVisuals();
    this.updateCursorVisibility();
  }

  // --- RENDERING ---
  render() {
    this.ctx.save();

    if (window.particles.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * window.particles.screenShake;
      const shakeY = (Math.random() - 0.5) * window.particles.screenShake;
      this.ctx.translate(shakeX, shakeY);
    }

    // 1. Draw Cartoon Dojo Arena Background (1200 x 1000)
    this.renderArena();

    // 2. Draw Projectiles
    window.projectiles.render(this.ctx);

    // 3. Draw Fighters
    this.p1.render(this.ctx);
    this.p2.render(this.ctx);

    // 4. Draw Particles & Damage Numbers
    window.particles.render(this.ctx);

    // 5. Draw Street Fighter HUD & Health Bars
    if (this.state !== 'menu') {
      this.renderHUD();
    }

    // 6. Draw Big Announcements
    if (this.announcementText) {
      this.renderAnnouncement();
    }

    this.ctx.restore();
  }

  renderArena() {
    const ctx = this.ctx;

    // Sky / Sunset Gradient (0 to 880)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGrad.addColorStop(0, '#151c6b');
    skyGrad.addColorStop(0.38, '#4a148c');
    skyGrad.addColorStop(0.72, '#b71c1c');
    skyGrad.addColorStop(1, '#ff6f00');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.groundY);

    // Distant cartoon moon
    ctx.fillStyle = '#fff9c4';
    ctx.beginPath();
    ctx.arc(600, 160, 75, 0, Math.PI * 2);
    ctx.fill();

    // Parallax City Skyline silhouette
    ctx.fillStyle = '#120d24';
    for (let i = 0; i < 22; i++) {
      const bWidth = 65 + (i * 33) % 55;
      const bHeight = 180 + (i * 59) % 220;
      const bx = i * 62 - 25;
      ctx.fillRect(bx, this.groundY - 140 - bHeight, bWidth, bHeight + 140);

      // Lit windows
      ctx.fillStyle = '#ffe082';
      for (let w = 0; w < 3; w++) {
        for (let h = 0; h < bHeight - 30; h += 36) {
          if ((i + w + h) % 3 === 0) {
            ctx.fillRect(bx + 10 + w * 16, this.groundY - 130 - bHeight + h, 8, 14);
          }
        }
      }
      ctx.fillStyle = '#120d24';
    }

    // Alley Wooden Dojo Fence
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(0, this.groundY - 135, this.width, 135);
    ctx.strokeStyle = '#271c19';
    ctx.lineWidth = 3;
    for (let x = 0; x < this.width; x += 38) {
      ctx.beginPath();
      ctx.moveTo(x, this.groundY - 135);
      ctx.lineTo(x, this.groundY);
      ctx.stroke();
    }

    // Dojo Banner / Cat Logo in Center
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(600 - 90, this.groundY - 115, 180, 65);
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 4;
    ctx.strokeRect(600 - 90, this.groundY - 115, 180, 65);

    ctx.fillStyle = '#ffd54f';
    ctx.font = 'bold 20px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('猫 FIGHT', 600, this.groundY - 75);

    // Arena Floor
    const floorGrad = ctx.createLinearGradient(0, this.groundY, 0, this.height);
    floorGrad.addColorStop(0, '#263238');
    floorGrad.addColorStop(1, '#0e1417');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);

    // Floor highlight edge line
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(this.width, this.groundY);
    ctx.stroke();

    // Left Scratching Post
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(65, this.groundY - 130, 28, 130);
    ctx.fillStyle = '#d7ccc8';
    for (let y = this.groundY - 120; y < this.groundY; y += 12) {
      ctx.fillRect(65, y, 28, 4);
    }
    // Toy mouse
    ctx.strokeStyle = '#b0bec5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(93, this.groundY - 120);
    ctx.lineTo(104, this.groundY - 80);
    ctx.stroke();
    ctx.fillStyle = '#ff4081';
    ctx.beginPath();
    ctx.arc(104, this.groundY - 80, 9, 0, Math.PI * 2);
    ctx.fill();

    // Right Luxury Cat Litter Pan
    ctx.fillStyle = '#00acc1';
    ctx.fillRect(1060, this.groundY - 48, 90, 48);
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath();
    ctx.ellipse(1105, this.groundY - 36, 40, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  renderHUD() {
    const ctx = this.ctx;
    const hudTop = 32;
    const barWidth = 440;
    const barHeight = 28;

    // --- PLAYER 1 (RED CAT) HEALTH BAR (LEFT) ---
    const p1X = 60;
    ctx.fillStyle = '#e53935';
    ctx.font = 'bold 20px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('P1: RED CAT', p1X, hudTop - 8);

    ctx.fillStyle = '#ffca28';
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillText(`SCORE: ${this.p1.score}`, p1X, hudTop + barHeight + 22);

    // P1 Badges
    for (let r = 0; r < 2; r++) {
      ctx.fillStyle = r < this.p1.wins ? '#ffd600' : '#424242';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p1X + barWidth - 20 - r * 28, hudTop - 14, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // P1 Bar Background
    ctx.fillStyle = '#212121';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.fillRect(p1X, hudTop, barWidth, barHeight);
    ctx.strokeRect(p1X, hudTop, barWidth, barHeight);

    // P1 Trailing Chip Health
    const p1TrailingWidth = Math.max(0, (this.p1DisplayHealth / 100) * barWidth);
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(p1X + barWidth - p1TrailingWidth, hudTop, p1TrailingWidth, barHeight);

    // P1 Current Health
    const p1CurrentWidth = Math.max(0, (this.p1.health / 100) * barWidth);
    const p1HealthGrad = ctx.createLinearGradient(p1X, hudTop, p1X, hudTop + barHeight);
    p1HealthGrad.addColorStop(0, '#76ff03');
    p1HealthGrad.addColorStop(1, '#33691e');
    ctx.fillStyle = p1HealthGrad;
    ctx.fillRect(p1X + barWidth - p1CurrentWidth, hudTop, p1CurrentWidth, barHeight);

    // --- PLAYER 2 (BLUE CAT) HEALTH BAR (RIGHT) ---
    const p2X = this.width - 60 - barWidth;
    ctx.fillStyle = '#1e88e5';
    ctx.font = 'bold 20px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(this.p2.name, p2X + barWidth, hudTop - 8);

    ctx.fillStyle = '#ffca28';
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillText(`SCORE: ${this.p2.score}`, p2X + barWidth, hudTop + barHeight + 22);

    // P2 Badges
    for (let r = 0; r < 2; r++) {
      ctx.fillStyle = r < this.p2.wins ? '#ffd600' : '#424242';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p2X + 20 + r * 28, hudTop - 14, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // P2 Bar Background
    ctx.fillStyle = '#212121';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.fillRect(p2X, hudTop, barWidth, barHeight);
    ctx.strokeRect(p2X, hudTop, barWidth, barHeight);

    // P2 Trailing Chip Health
    const p2TrailingWidth = Math.max(0, (this.p2DisplayHealth / 100) * barWidth);
    ctx.fillStyle = '#0d47a1';
    ctx.fillRect(p2X, hudTop, p2TrailingWidth, barHeight);

    // P2 Current Health
    const p2CurrentWidth = Math.max(0, (this.p2.health / 100) * barWidth);
    const p2HealthGrad = ctx.createLinearGradient(p2X, hudTop, p2X, hudTop + barHeight);
    p2HealthGrad.addColorStop(0, '#00e5ff');
    p2HealthGrad.addColorStop(1, '#006064');
    ctx.fillStyle = p2HealthGrad;
    ctx.fillRect(p2X, hudTop, p2CurrentWidth, barHeight);

    // --- CENTER 60-SECOND STREET FIGHTER TIMER ---
    const centerX = this.width / 2;
    ctx.fillStyle = '#111111';
    ctx.strokeStyle = '#ffd600';
    ctx.lineWidth = 4;
    ctx.fillRect(centerX - 55, hudTop - 8, 110, 60);
    ctx.strokeRect(centerX - 55, hudTop - 8, 110, 60);

    const secondsLeft = Math.ceil(this.timerCountdown);
    const isCritical = secondsLeft <= 10;
    ctx.fillStyle = isCritical ? (Math.sin(Date.now() * 0.015) > 0 ? '#ff1744' : '#ffffff') : '#ffd600';
    ctx.font = 'bold 36px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(secondsLeft).padStart(2, '0'), centerX, hudTop + 38);
  }

  renderAnnouncement() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2 - 60);
    ctx.scale(this.announcementScale, this.announcementScale);

    ctx.font = 'bold 58px "Press Start 2P", monospace';
    ctx.textAlign = 'center';

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 10;
    ctx.strokeText(this.announcementText, 0, 0);

    const textGrad = ctx.createLinearGradient(0, -45, 0, 15);
    textGrad.addColorStop(0, '#fff59d');
    textGrad.addColorStop(0.5, '#ffd600');
    textGrad.addColorStop(1, '#ff6d00');
    ctx.fillStyle = textGrad;
    ctx.fillText(this.announcementText, 0, 0);

    if (this.announcementSubtext) {
      ctx.font = 'bold 26px "Press Start 2P", monospace';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.strokeText(this.announcementSubtext, 0, 52);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(this.announcementSubtext, 0, 52);
    }

    ctx.restore();
  }
}

// Instantiate game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.game = new CatFightersGame();

  try {
    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart');
    const openModal = params.get('open');
    if (autostart) {
      window.game.startNewMatch(autostart === 'cpu' ? 'cpu' : '2p');
    } else if (openModal === 'movelist') {
      window.game.showMovelistModal();
    } else if (openModal === 'highscores') {
      window.game.showHighScoresModal();
    } else if (openModal === 'pause') {
      window.game.startNewMatch('2p');
      window.game.togglePause();
    } else if (openModal === 'defeat') {
      window.game.startNewMatch('cpu');
      window.game.p2.wins = 2;
      window.game.handleMatchVictory();
    }
  } catch (e) {}
});
