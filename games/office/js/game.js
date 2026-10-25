/**
 * Office - Core Strategy Game Loop, 20-Day & 55-Day Campaigns,
 * 3-Factor Security Verification (Banned / Expiry / Visuals), HUD Controller & High Scores
 */

const MAX_HAPPINESS = 105;
const TEACHERS_PER_DAY = 10;
const COFFEES_PER_DAY = 2;
const COFFEE_HEAL = 8;
const PENALTY_FAKE_LET_IN = 10; // Strict rule: letting a dodgy/mismatched/expired/banned teacher in costs -10 Happiness
const PENALTY_GOOD_DENIED = 5;

const STORAGE_KEY_SCORES = 'office_school_highscores_v1';

class OfficeGame {
  constructor() {
    // Campaign Length: 20 Days (Short) or 55 Days (Full Classic)
    this.maxDays = 20;
    this.day = 1;
    this.happiness = MAX_HAPPINESS;
    this.displayHappiness = MAX_HAPPINESS;
    this.coffeesLeft = COFFEES_PER_DAY;

    // Cumulative Stats
    this.score = 0;
    this.streak = 0;
    this.goodLetIn = 0;
    this.badLetIn = 0;
    this.totalDenied = 0;
    this.fakesCaught = 0;
    this.goodDenied = 0;

    // Daily Stats
    this.dayStats = { goodIn: 0, badIn: 0, fakesCaught: 0, goodDenied: 0 };

    // Current Day Queue
    this.queue = [];
    this.currentIndex = 0;
    this.isTransitioning = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.autoAdvanceDays = false;
    this.scannerHighlightActive = false;

    // Canvases
    this.faceCanvas = document.getElementById('face-canvas');
    this.dbPortraitCanvas = document.getElementById('db-portrait-canvas');
    this.idPortraitCanvas = document.getElementById('id-portrait-canvas');

    // Isometric Scene
    this.isoScene = new window.IsometricOfficeScene('iso-canvas');
    this.isoScene.onCoffeeClick = () => this.drinkCoffee();

    this.lastFrameTime = performance.now();
    this.toastTimeout = null;

    this.initDOMListeners();
    this.ensureDefaultHighScores();
    this.updateHighScoreBanner();

    this.startNewGame(20);
    requestAnimationFrame((t) => this.loop(t));
  }

  initDOMListeners() {
    // Allow & Deny & Coffee Action Buttons
    document.getElementById('btn-allow')?.addEventListener('click', () => this.handleDecision(true));
    document.getElementById('btn-deny')?.addEventListener('click', () => this.handleDecision(false));
    document.getElementById('btn-coffee-deck')?.addEventListener('click', () => this.drinkCoffee());
    document.getElementById('btn-coffee-hud')?.addEventListener('click', () => this.drinkCoffee());

    // Campaign Mode Toggle (20 Days <-> 55 Days)
    document.getElementById('btn-campaign-toggle')?.addEventListener('click', () => {
      const nextMode = this.maxDays === 20 ? 55 : 20;
      this.setCampaignLength(nextMode);
    });
    document.getElementById('btn-mode-20')?.addEventListener('click', () => this.setCampaignLength(20));
    document.getElementById('btn-mode-55')?.addEventListener('click', () => this.setCampaignLength(55));

    // Isometric Zoom Buttons
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
      this.isoScene.setZoom(this.isoScene.zoom + 0.12);
    });
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
      this.isoScene.setZoom(this.isoScene.zoom - 0.12);
    });

    // Scanner / Magnify compare toggle
    document.getElementById('btn-scanner')?.addEventListener('click', () => {
      window.officeAudio.playScan();
      this.scannerHighlightActive = !this.scannerHighlightActive;
      this.renderCurrentTeacherPortraits();
      const btn = document.getElementById('btn-scanner');
      if (btn) {
        btn.textContent = this.scannerHighlightActive ? '🔍 Scanner: ON' : '🔍 UV Inspect [S]';
      }
    });

    // Top HUD Utility Buttons
    document.getElementById('btn-pause')?.addEventListener('click', () => this.togglePauseMenu());
    document.getElementById('btn-mute')?.addEventListener('click', () => {
      const muted = window.officeAudio.toggleMute();
      const btn = document.getElementById('btn-mute');
      if (btn) btn.textContent = muted ? '🔇' : '🔊';
    });
    document.getElementById('btn-highscores')?.addEventListener('click', () => this.openHighScoresModal());
    document.getElementById('btn-gallery')?.addEventListener('click', () => this.openGalleryModal());
    document.getElementById('btn-help')?.addEventListener('click', () => this.openHelpModal());

    // Pause Modal Controls
    document.getElementById('btn-resume')?.addEventListener('click', () => this.togglePauseMenu(false));
    document.getElementById('btn-restart-pause')?.addEventListener('click', () => {
      this.togglePauseMenu(false);
      this.startNewGame(this.maxDays);
    });

    // Audio Sliders in Pause Menu
    document.getElementById('slider-ambient')?.addEventListener('input', (e) => {
      window.officeAudio.init();
      window.officeAudio.setAmbientVolume(parseFloat(e.target.value));
    });
    document.getElementById('slider-sfx')?.addEventListener('input', (e) => {
      window.officeAudio.init();
      window.officeAudio.setSfxVolume(parseFloat(e.target.value));
    });
    document.getElementById('chk-auto-day')?.addEventListener('change', (e) => {
      this.autoAdvanceDays = e.target.checked;
    });

    // End of Day Modal Next Button
    document.getElementById('btn-next-day')?.addEventListener('click', () => this.advanceToNextDay());

    // Game Over / Victory Modal Controls
    document.getElementById('btn-save-score')?.addEventListener('click', () => this.saveCurrentScore());
    document.getElementById('btn-play-again-20')?.addEventListener('click', () => {
      this.closeAllModals();
      this.startNewGame(20);
    });
    document.getElementById('btn-play-again-55')?.addEventListener('click', () => {
      this.closeAllModals();
      this.startNewGame(55);
    });

    // Close buttons for secondary modals
    document.getElementById('btn-close-scores')?.addEventListener('click', () => {
      document.getElementById('modal-highscores')?.classList.add('hidden');
    });
    document.getElementById('btn-clear-scores')?.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY_SCORES);
      this.ensureDefaultHighScores();
      this.renderHighScoresTable();
      this.updateHighScoreBanner();
    });
    document.getElementById('btn-close-gallery')?.addEventListener('click', () => {
      document.getElementById('modal-gallery')?.classList.add('hidden');
    });
    document.getElementById('btn-refresh-gallery')?.addEventListener('click', () => {
      this.populateGalleryGrid();
    });
    document.getElementById('btn-close-help')?.addEventListener('click', () => {
      document.getElementById('modal-help')?.classList.add('hidden');
    });

    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
      if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        this.togglePauseMenu();
        return;
      }

      const dayModal = document.getElementById('modal-day-end');
      if (dayModal && !dayModal.classList.contains('hidden')) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          this.advanceToNextDay();
        }
        return;
      }

      if (this.isPaused || this.isGameOver) return;

      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft' || e.key === 'Enter') {
        e.preventDefault();
        this.handleDecision(true);
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight' || e.key === 'Backspace') {
        e.preventDefault();
        this.handleDecision(false);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        this.drinkCoffee();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        document.getElementById('btn-scanner')?.click();
      }
    });
  }

  setCampaignLength(days) {
    this.maxDays = days === 55 ? 55 : 20;
    if (this.day > this.maxDays) {
      this.day = this.maxDays;
    }
    document.getElementById('btn-mode-20')?.classList.toggle('active', this.maxDays === 20);
    document.getElementById('btn-mode-55')?.classList.toggle('active', this.maxDays === 55);
    this.isoScene.syncState(this);
    this.updateHUD();
    this.showToast(`📅 Campaign Mode set to ${this.maxDays} Days!`, 'good');
  }

  startNewGame(campaignDays = this.maxDays) {
    this.maxDays = campaignDays === 55 ? 55 : 20;
    document.getElementById('btn-mode-20')?.classList.toggle('active', this.maxDays === 20);
    document.getElementById('btn-mode-55')?.classList.toggle('active', this.maxDays === 55);

    this.day = 1;
    this.happiness = MAX_HAPPINESS;
    this.displayHappiness = MAX_HAPPINESS;
    this.coffeesLeft = COFFEES_PER_DAY;

    this.score = 0;
    this.streak = 0;
    this.goodLetIn = 0;
    this.badLetIn = 0;
    this.totalDenied = 0;
    this.fakesCaught = 0;
    this.goodDenied = 0;

    this.isPaused = false;
    this.isGameOver = false;
    this.closeAllModals();
    this.startDay(1);
  }

  startDay(dayNum) {
    this.day = dayNum;
    this.coffeesLeft = COFFEES_PER_DAY;
    this.currentIndex = 0;
    this.isTransitioning = false;
    this.scannerHighlightActive = false;
    this.dayStats = { goodIn: 0, badIn: 0, fakesCaught: 0, goodDenied: 0 };

    // Generate 10 teachers (2-3 dodgy/expired/banned)
    this.queue = window.portraitSystem.generateDayQueue(this.day);

    this.isoScene.resetDayActors();
    this.isoScene.syncState(this);
    this.buildQueueDots();
    this.loadCurrentTeacherUI();
    this.updateHUD();
  }

  buildQueueDots() {
    const container = document.getElementById('queue-dots');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < TEACHERS_PER_DAY; i++) {
      const dot = document.createElement('div');
      dot.className = 'q-dot' + (i === 0 ? ' active' : '');
      dot.id = `q-dot-${i}`;
      container.appendChild(dot);
    }
  }

  loadCurrentTeacherUI() {
    const teacher = this.queue[this.currentIndex];
    if (!teacher) return;

    const stamp = document.getElementById('decision-stamp');
    if (stamp) {
      stamp.className = 'decision-stamp';
    }

    this.scannerHighlightActive = false;
    const scanBtn = document.getElementById('btn-scanner');
    if (scanBtn) scanBtn.textContent = '🔍 UV Inspect [S]';

    // 1. Computer Entry Watchlist Status (ALLOWED vs BANNED)
    const entryEl = document.getElementById('db-entry-status');
    if (entryEl) {
      if (teacher.isBanned) {
        entryEl.textContent = '🚨 BANNED — DO NOT ADMIT!';
        entryEl.className = 'db-field-val status-badge-banned';
      } else {
        entryEl.textContent = '✓ ALLOWED (ACTIVE STAFF)';
        entryEl.className = 'db-field-val status-badge-ok';
      }
    }

    // 2. Computer ID Expiry Check (VALID vs EXPIRED)
    const expiryEl = document.getElementById('db-expiry-status');
    if (expiryEl) {
      if (teacher.isExpired) {
        expiryEl.textContent = `⚠️ ID EXPIRED (${teacher.expiry})`;
        expiryEl.className = 'db-field-val status-badge-expired';
      } else {
        expiryEl.textContent = `✓ VALID (EXP: ${teacher.expiry})`;
        expiryEl.className = 'db-field-val status-badge-ok';
      }
    }

    // 3. Computer Registered Fields & Eye/Tie Swatches
    this.setText('db-name', teacher.name);
    this.setText('db-species', `${teacher.category.toUpperCase()}`);
    this.setText('db-subject', teacher.subject);
    this.setText('db-code', teacher.staffCode);
    this.setText(
      'db-glasses',
      `Eyewear: ${teacher.officialTraits.glasses === 'none' ? 'None' : teacher.officialTraits.glasses.replace('_', ' ')}`
    );

    const eyeDot = document.getElementById('db-eye-dot');
    if (eyeDot) eyeDot.style.backgroundColor = teacher.officialTraits.eyeColor || '#2563eb';
    const tieDot = document.getElementById('db-tie-dot');
    if (tieDot) tieDot.style.backgroundColor = teacher.officialTraits.tie || '#ef4444';

    // Populate Physical ID Card fields
    this.setText('id-name', teacher.name);
    this.setText('id-subject', teacher.subject);
    this.setText('id-code', teacher.staffCode);
    this.setText('id-expiry', `EXP: ${teacher.expiry}`);
    this.setText('teacher-quote', teacher.quote);

    this.renderCurrentTeacherPortraits();
    window.officeAudio.playCardPlace();
  }

  renderCurrentTeacherPortraits() {
    const teacher = this.queue[this.currentIndex];
    if (!teacher) return;

    window.portraitSystem.renderPortrait(this.dbPortraitCanvas, teacher.officialTraits, {
      highlightDiscrepancies: false
    });

    window.portraitSystem.renderPortrait(this.idPortraitCanvas, teacher.badgeTraits, {
      highlightDiscrepancies: this.scannerHighlightActive,
      mutations: teacher.appliedMutations
    });
  }

  handleDecision(allowEntry) {
    if (this.isTransitioning || this.isPaused || this.isGameOver) return;
    const teacher = this.queue[this.currentIndex];
    if (!teacher) return;

    window.officeAudio.init();
    this.isTransitioning = true;

    const stamp = document.getElementById('decision-stamp');
    if (stamp) {
      stamp.textContent = allowEntry ? 'ALLOWED' : 'DENIED';
      stamp.className = `decision-stamp show ${allowEntry ? 'stamp-allow' : 'stamp-deny'}`;
    }

    let wasCorrect = false;
    const dot = document.getElementById(`q-dot-${this.currentIndex}`);

    if (allowEntry) {
      if (!teacher.isDodgy) {
        wasCorrect = true;
        this.goodLetIn++;
        this.dayStats.goodIn++;
        this.streak++;
        const pts = 100 + Math.min(100, (this.streak - 1) * 15);
        this.score += pts;
        window.officeAudio.playAllow();
        this.pulseHappinessWidget('good');
        this.showToast(`✓ Verified! Allowed ${teacher.name} into School (+${pts} pts)`, 'good');
      } else {
        wasCorrect = false;
        this.badLetIn++;
        this.dayStats.badIn++;
        this.streak = 0;
        this.score = Math.max(0, this.score - 50);
        this.changeHappiness(-PENALTY_FAKE_LET_IN);
        window.officeAudio.playMistake();
        this.pulseHappinessWidget('bad');

        const reason = teacher.appliedMutations.map(m => m.label).join(' & ');
        this.showToast(`⚠ SECURITY BREACH! Failed Check: ${reason}! (-${PENALTY_FAKE_LET_IN} Happiness)`, 'bad');
      }
    } else {
      this.totalDenied++;
      if (teacher.isDodgy) {
        wasCorrect = true;
        this.fakesCaught++;
        this.dayStats.fakesCaught++;
        this.streak++;
        const pts = 150 + Math.min(150, (this.streak - 1) * 20);
        this.score += pts;
        window.officeAudio.playCaughtFakeBonus();
        this.pulseHappinessWidget('good');

        const reason = teacher.appliedMutations.map(m => m.label).join(' & ');
        this.showToast(`🛡️ Denied (${reason})! Sent away (+${pts} pts)`, 'good');
      } else {
        wasCorrect = false;
        this.goodDenied++;
        this.dayStats.goodDenied++;
        this.streak = 0;
        this.score = Math.max(0, this.score - 50);
        this.changeHappiness(-PENALTY_GOOD_DENIED);
        window.officeAudio.playMistake();
        this.pulseHappinessWidget('bad');
        this.showToast(`✕ Oops! ${teacher.name} was Allowed, Valid & Matched! (-${PENALTY_GOOD_DENIED} Happiness)`, 'bad');
      }
    }

    if (dot) {
      dot.classList.remove('active');
      dot.classList.add(wasCorrect ? 'done-ok' : 'done-bad');
    }

    this.isoScene.triggerDecisionAnimation(teacher, allowEntry, wasCorrect);
    this.updateHUD();

    if (this.happiness <= 0) {
      setTimeout(() => {
        this.triggerGameOver(false);
      }, 650);
      return;
    }

    setTimeout(() => {
      this.currentIndex++;
      this.isoScene.syncState(this);

      if (this.currentIndex >= TEACHERS_PER_DAY) {
        this.completeCurrentDay();
      } else {
        const nextDot = document.getElementById(`q-dot-${this.currentIndex}`);
        if (nextDot) nextDot.classList.add('active');
        this.loadCurrentTeacherUI();
        this.updateHUD();
        this.isTransitioning = false;
      }
    }, 520);
  }

  drinkCoffee() {
    if (this.isPaused || this.isGameOver) return;
    window.officeAudio.init();

    if (this.coffeesLeft <= 0) {
      this.showToast('☕ No coffee left today! Machine refills tomorrow morning (2/day max).', 'bad');
      return;
    }

    if (this.happiness >= MAX_HAPPINESS) {
      this.showToast('☕ Happiness is already at maximum (105 / 105)! Save your coffee for later.', 'coffee');
      return;
    }

    this.coffeesLeft--;
    const before = this.happiness;
    this.changeHappiness(COFFEE_HEAL);
    const gained = this.happiness - before;

    window.officeAudio.playCoffee();
    this.isoScene.syncState(this);
    this.isoScene.triggerCoffeeAnimation();
    this.pulseHappinessWidget('good');
    this.showToast(`☕ Hot Espresso! Happiness increased by +${gained} (${this.coffeesLeft}/2 coffees left today)`, 'coffee');
    this.updateHUD();
  }

  changeHappiness(delta) {
    this.happiness = Math.max(0, Math.min(MAX_HAPPINESS, this.happiness + delta));
    this.isoScene.syncState(this);
  }

  pulseHappinessWidget(type) {
    const box = document.getElementById('hud-happiness-box');
    if (!box) return;
    box.classList.remove('pulse-good', 'pulse-bad');
    void box.offsetWidth;
    box.classList.add(type === 'good' ? 'pulse-good' : 'pulse-bad');
    setTimeout(() => {
      box.classList.remove('pulse-good', 'pulse-bad');
    }, 380);
  }

  completeCurrentDay() {
    window.officeAudio.playDayComplete();

    if (this.day >= this.maxDays) {
      this.triggerGameOver(true);
      return;
    }

    if (this.autoAdvanceDays) {
      this.showToast(`🔔 Day ${this.day}/${this.maxDays} Complete! Starting Day ${this.day + 1}...`, 'good');
      setTimeout(() => this.advanceToNextDay(), 600);
      return;
    }

    this.setText('eod-title', `🔔 Day ${this.day} of ${this.maxDays} Complete!`);
    this.setText('eod-good-in', `${this.dayStats.goodIn}`);
    this.setText('eod-fakes-caught', `${this.dayStats.fakesCaught}`);
    this.setText('eod-bad-in', `${this.dayStats.badIn}`);
    this.setText('eod-happiness', `${this.happiness} / ${MAX_HAPPINESS}`);
    this.setText('eod-days-left', `${this.maxDays - this.day} Days Remaining`);

    document.getElementById('modal-day-end')?.classList.remove('hidden');
  }

  advanceToNextDay() {
    document.getElementById('modal-day-end')?.classList.add('hidden');
    if (this.day < this.maxDays) {
      this.startDay(this.day + 1);
    } else {
      this.triggerGameOver(true);
    }
  }

  triggerGameOver(isVictory) {
    this.isGameOver = true;
    this.isTransitioning = false;

    if (isVictory) {
      this.score += this.happiness * 25;
      window.officeAudio.playVictory();
    } else {
      window.officeAudio.playGameOver();
    }

    this.updateHUD();

    const modal = document.getElementById('modal-gameover');
    if (!modal) return;

    this.setText(
      'go-title',
      isVictory ? `🏆 VICTORY! ${this.maxDays} DAYS SURVIVED!` : '😢 OUT OF HAPPINESS — GAME OVER'
    );
    this.setText(
      'go-subtitle',
      isVictory
        ? `Incredible job! You guarded the School Office for all ${this.maxDays} days with ${this.happiness} Happiness remaining!`
        : `Your Happiness dropped to 0 on Day ${this.day} of ${this.maxDays}. Too many dodgy/expired/banned teachers slipped past security!`
    );

    const totalProcessed = this.goodLetIn + this.badLetIn + this.totalDenied;
    const correctCount = this.goodLetIn + this.fakesCaught;
    const acc = totalProcessed > 0 ? Math.round((correctCount / totalProcessed) * 100) : 100;

    this.setText('go-score', `${this.score}`);
    this.setText('go-days', `${isVictory ? this.maxDays : this.day} / ${this.maxDays}`);
    this.setText('go-accuracy', `${acc}%`);
    this.setText('go-good', `${this.goodLetIn}`);
    this.setText('go-bad', `${this.badLetIn}`);
    this.setText('go-denied', `${this.totalDenied} (${this.fakesCaught} fakes)`);

    const saveBtn = document.getElementById('btn-save-score');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save High Score';
    }

    modal.classList.remove('hidden');
  }

  updateHUD() {
    this.setText('hud-happiness-val', `${this.happiness} / ${MAX_HAPPINESS}`);
    const pct = Math.max(0, Math.min(100, (this.happiness / MAX_HAPPINESS) * 100));
    const fill = document.getElementById('hud-happiness-fill');
    if (fill) {
      fill.style.width = `${pct}%`;
      if (this.happiness >= 75) {
        fill.style.background = 'linear-gradient(90deg, #22c55e, #4ade80)';
      } else if (this.happiness >= 45) {
        fill.style.background = 'linear-gradient(90deg, #eab308, #facc15)';
      } else if (this.happiness >= 25) {
        fill.style.background = 'linear-gradient(90deg, #ea580c, #fb923c)';
      } else {
        fill.style.background = 'linear-gradient(90deg, #dc2626, #ef4444)';
      }
    }

    let mood = 'Beaming & Happy 😊';
    if (this.happiness < 20) mood = 'Sobbing & Crying 😭';
    else if (this.happiness < 40) mood = 'Teary & Very Sad 😢';
    else if (this.happiness < 60) mood = 'Stressed & Worried 😟';
    else if (this.happiness < 85) mood = 'Cheerful & Alert 🙂';
    this.setText('hud-mood-text', mood);

    this.setText('hud-day-num', `${this.day}`);
    this.setText('hud-max-days', `${this.maxDays}`);
    const remaining = Math.max(0, TEACHERS_PER_DAY - this.currentIndex);
    this.setText('hud-queue-text', `Teacher ${Math.min(TEACHERS_PER_DAY, this.currentIndex + 1)}/${TEACHERS_PER_DAY} (${remaining} in queue)`);

    this.setText('stat-good-in', `${this.goodLetIn}`);
    this.setText('stat-bad-in', `${this.badLetIn}`);
    this.setText('stat-denied', `${this.totalDenied}`);
    this.setText('stat-denied-sub', `${this.fakesCaught} fake / ${this.goodDenied} valid`);
    this.setText('stat-score', `${this.score}`);
    this.setText('stat-streak', this.streak > 1 ? `🔥 ${this.streak}x Streak` : 'Best: ' + this.getTopHighScore());

    const cupsStr = '☕'.repeat(this.coffeesLeft) + '○'.repeat(COFFEES_PER_DAY - this.coffeesLeft);
    this.setText('hud-coffee-cups', `${cupsStr} (${this.coffeesLeft}/2 Today)`);
    this.setText('deck-coffee-label', `☕ COFFEE (+${COFFEE_HEAL} 😊)`);
    this.setText('deck-coffee-sub', `[C] ${this.coffeesLeft}/2 Left Today`);

    const coffeeDisabled = this.coffeesLeft <= 0 || this.happiness >= MAX_HAPPINESS;
    const hudCoffeeBtn = document.getElementById('btn-coffee-hud');
    const deckCoffeeBtn = document.getElementById('btn-coffee-deck');
    if (hudCoffeeBtn) hudCoffeeBtn.disabled = this.coffeesLeft <= 0;
    if (deckCoffeeBtn) deckCoffeeBtn.disabled = coffeeDisabled;
  }

  showToast(message, type = 'good') {
    const toast = document.getElementById('feedback-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `show toast-${type}`;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  togglePauseMenu(forceState = null) {
    if (this.isGameOver) return;
    this.isPaused = forceState !== null ? forceState : !this.isPaused;
    const modal = document.getElementById('modal-pause');
    if (modal) {
      modal.classList.toggle('hidden', !this.isPaused);
    }
  }

  closeAllModals() {
    ['modal-pause', 'modal-day-end', 'modal-gameover', 'modal-highscores', 'modal-gallery', 'modal-help'].forEach(id => {
      document.getElementById(id)?.classList.add('hidden');
    });
  }

  ensureDefaultHighScores() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SCORES);
      if (!raw) {
        const defaults = [
          { name: 'Chief Barnaby', score: 8450, days: '55 / 55', goodIn: 412, fakes: 138, date: '2026-10-20' },
          { name: 'Officer Higgins', score: 3420, days: '20 / 20', goodIn: 150, fakes: 50, date: '2026-10-22' },
          { name: 'Guard Vance', score: 2650, days: '16 / 20', goodIn: 118, fakes: 39, date: '2026-10-24' }
        ];
        localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(defaults));
      }
    } catch (_) {}
  }

  getHighScores() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SCORES);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  getTopHighScore() {
    const list = this.getHighScores();
    if (!list.length) return this.score;
    return Math.max(list[0].score || 0, this.score);
  }

  updateHighScoreBanner() {
    this.setText('stat-streak', 'Best: ' + this.getTopHighScore());
  }

  saveCurrentScore() {
    const input = document.getElementById('input-player-name');
    const name = (input && input.value.trim()) ? input.value.trim().slice(0, 20) : 'Security Officer';
    const list = this.getHighScores();
    list.push({
      name,
      score: this.score,
      days: `${this.day} / ${this.maxDays}`,
      goodIn: this.goodLetIn,
      fakes: this.fakesCaught,
      date: new Date().toISOString().slice(0, 10)
    });
    list.sort((a, b) => b.score - a.score);
    const trimmed = list.slice(0, 10);
    try {
      localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(trimmed));
    } catch (_) {}

    const saveBtn = document.getElementById('btn-save-score');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = '✓ Score Saved!';
    }
    this.updateHighScoreBanner();
  }

  openHighScoresModal() {
    this.renderHighScoresTable();
    document.getElementById('modal-highscores')?.classList.remove('hidden');
  }

  renderHighScoresTable() {
    const tbody = document.getElementById('highscores-tbody');
    if (!tbody) return;
    const list = this.getHighScores();
    tbody.innerHTML = '';
    list.forEach((entry, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>#${idx + 1}</td>
        <td>${this.escapeHtml(entry.name)}</td>
        <td><strong>${entry.score}</strong></td>
        <td>${entry.days}</td>
        <td>${entry.goodIn}</td>
        <td>${entry.fakes}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  openGalleryModal() {
    this.populateGalleryGrid();
    document.getElementById('modal-gallery')?.classList.remove('hidden');
  }

  populateGalleryGrid() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const sampleQueue = window.portraitSystem.generateDayQueue(Math.floor(Math.random() * 50) + 1);
    sampleQueue.forEach((item, idx) => {
      if (idx % 2 === 1 && !item.isDodgy) {
        const mut = window.portraitSystem.mutations[idx % window.portraitSystem.mutations.length];
        window.portraitSystem.applyMutation(item.badgeTraits, item.officialTraits, mut.id);
        item.isDodgy = true;
        item.appliedMutations = [mut];
      }

      const card = document.createElement('div');
      card.className = 'gallery-item';

      const cvs = document.createElement('canvas');
      cvs.width = 220;
      cvs.height = 240;
      window.portraitSystem.renderPortrait(cvs, item.badgeTraits);

      const nameEl = document.createElement('div');
      nameEl.className = 'g-name';
      nameEl.textContent = `${item.name} (${item.category})`;

      const tagEl = document.createElement('div');
      tagEl.className = 'g-tag';
      if (item.isDodgy && item.appliedMutations.length > 0) {
        tagEl.style.color = '#f87171';
        tagEl.textContent = `DENY: ${item.appliedMutations.map(m => m.label).join(', ')}`;
      } else {
        tagEl.style.color = '#4ade80';
        tagEl.textContent = '✓ Genuine Portrait & Valid';
      }

      card.appendChild(cvs);
      card.appendChild(nameEl);
      card.appendChild(tagEl);
      grid.appendChild(card);
    });
  }

  openHelpModal() {
    document.getElementById('modal-help')?.classList.remove('hidden');
  }

  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }

  loop(now) {
    const dt = Math.min(0.1, (now - this.lastFrameTime) / 1000);
    this.lastFrameTime = now;
    const timeSec = now / 1000;

    this.displayHappiness += (this.happiness - this.displayHappiness) * Math.min(1, dt * 8);
    window.renderHappinessFace(this.faceCanvas, this.displayHappiness, MAX_HAPPINESS, timeSec);

    if (!this.isPaused) {
      this.isoScene.update(dt);
    }
    this.isoScene.render(timeSec);

    requestAnimationFrame((t) => this.loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.officeGame = new OfficeGame();
});
