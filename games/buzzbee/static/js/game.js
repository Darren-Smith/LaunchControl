/**
 * BuzzBee – Main Game Controller (v1.2.0)
 * Standard Game Features + Full HTML5 Gamepad & Keyboard Navigation
 */
(() => {
  'use strict';

  /* ─── Utils ─── */
  const $ = id => document.getElementById(id);
  function rectsOverlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function dist(ax, ay, bx, by) { return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.floor(rand(a, b + 1)); }
  function formatTime(frames) {
    const totalSec = Math.max(0, Math.floor(frames / 60));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  /* ─── HighScoreManager (Local + Server Sync) ─── */
  class HighScoreManager {
    constructor(storageKey = 'buzzbee_high_scores', maxEntries = 10) {
      this.key = storageKey;
      this.max = maxEntries;
      this.lastInsertedId = null;
      this.scores = this.load();
    }

    load() {
      try {
        const data = localStorage.getItem(this.key);
        const parsed = data ? JSON.parse(data) : null;
        return Array.isArray(parsed) && parsed.length ? parsed : this.getDefaults();
      } catch {
        return this.getDefaults();
      }
    }

    getDefaults() {
      return [
        { id: 'd1', name: 'TOOBEE', score: 2400, wave: 7, date: '2026-05-05' },
        { id: 'd2', name: 'BEERO', score: 1800, wave: 8, date: '2026-10-04' },
        { id: 'd3', name: 'BEENIE', score: 1735, wave: 6, date: '2026-11-05' },
        { id: 'd4', name: 'BIZZY', score: 1510, wave: 5, date: '2026-05-05' },
        { id: 'd5', name: 'BEECALM', score: 1285, wave: 6, date: '2026-07-26' },
      ];
    }

    save() {
      try {
        localStorage.setItem(this.key, JSON.stringify(this.scores));
      } catch {}
    }

    getBestScore() {
      if (!this.scores.length) return 0;
      return Math.max(0, ...this.scores.map(s => Number(s.score) || 0));
    }

    isHighScore(scoreVal) {
      if (scoreVal <= 0) return false;
      if (this.scores.length < this.max) return true;
      return scoreVal > this.scores[this.scores.length - 1].score;
    }

    async syncWithServer() {
      try {
        const r = await fetch('/api/leaderboard');
        const serverBoard = await r.json();
        if (Array.isArray(serverBoard) && serverBoard.length) {
          const merged = [...this.scores];
          serverBoard.forEach((entry, idx) => {
            const cleanDate = (entry.timestamp || entry.date || '2026-11-05').split(' ')[0];
            const exists = merged.some(
              m => m.name.toUpperCase() === String(entry.name || '').toUpperCase() && Number(m.score) === Number(entry.score)
            );
            if (!exists) {
              merged.push({
                id: entry.id || `srv_${idx}_${entry.score}`,
                name: String(entry.name || 'ANON').toUpperCase().slice(0, 12),
                score: Number(entry.score) || 0,
                wave: Number(entry.wave) || 1,
                date: cleanDate,
              });
            }
          });
          merged.sort((a, b) => b.score - a.score);
          this.scores = merged.slice(0, this.max);
          this.save();
        }
      } catch {}
    }

    async addScore(name, scoreVal, waveVal = 1) {
      const entryId = 'score_' + Date.now();
      const cleanName = (String(name || '').trim().toUpperCase() || 'BUZZMASTER').slice(0, 12);
      const cleanScore = Math.floor(Number(scoreVal) || 0);
      const cleanWave = Math.floor(Number(waveVal) || 1);
      const today = new Date().toISOString().split('T')[0];

      this.scores.push({
        id: entryId,
        name: cleanName,
        score: cleanScore,
        wave: cleanWave,
        date: today,
      });
      this.scores.sort((a, b) => b.score - a.score);
      if (this.scores.length > this.max) this.scores.length = this.max;
      this.lastInsertedId = entryId;
      this.save();

      const localRank = Math.max(1, this.scores.findIndex(s => s.id === entryId) + 1);
      let finalRank = localRank;

      try {
        const r = await fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cleanName, score: cleanScore, wave: cleanWave }),
        });
        const d = await r.json();
        if (d && d.rank) finalRank = Math.min(localRank, Number(d.rank));
      } catch {}

      return { id: entryId, rank: finalRank };
    }

    renderTable(tbodyElement) {
      if (!tbodyElement) return;
      if (!this.scores.length) {
        tbodyElement.innerHTML = '<tr><td colspan="5" class="loading-msg">No high scores recorded yet!</td></tr>';
        return;
      }
      tbodyElement.innerHTML = this.scores.map((entry, index) => {
        const isNew = entry.id === this.lastInsertedId;
        const badge = index === 0 ? '🥇 #1' : index === 1 ? '🥈 #2' : index === 2 ? '🥉 #3' : `#${index + 1}`;
        return `
          <tr class="${isNew ? 'row-new-entry' : ''}">
            <td class="col-rank">${badge}</td>
            <td class="col-name">${entry.name} ${isNew ? '<span class="new-pill">NEW!</span>' : ''}</td>
            <td class="lb-wave">W${entry.wave || 1}</td>
            <td class="col-score">${Number(entry.score).toLocaleString()}</td>
            <td class="col-date">${entry.date || ''}</td>
          </tr>
        `;
      }).join('');
    }
  }

  const highScores = new HighScoreManager('buzzbee_high_scores', 10);

  /* ─── State & Config ─── */
  let canvas, ctx, bee, hive, flowers, pollens, enemies, particles, stingFlashes;
  let score = 0, wave = 1, combo = 0, maxCombo = 0, pollenCollected = 0, enemiesStung = 0, playFrames = 0;
  let spawnTimer = 0, waveTimer = 0, waveDisplayTimer = 0;
  let paused = false, running = false, keys = {}, stopBGM = null;
  let clouds = [], trees = [];
  let enemyWarning = null, enemyWarnTimer = 0;
  let CFG = {
    spawnRate: 1,
    enemySpeed: 1,
    victoryJars: 10,
    scoring: { yellowPollen: 10, stingThief: 50, stingSpray: 30, nectarStolen: -100, badPollenHit: -20, comboMultiplier: 1.5 }
  };
  let difficulty = 'easy';

  /* ─── Screens & Modal State ─── */
  const screens = {
    loading: $('loading-screen'),
    menu: $('main-menu'),
    game: $('game-screen'),
    pause: $('pause-menu'),
    scoreEntry: $('score-entry-modal'),
    gameover: $('gameover-screen'),
    howto: $('howto-screen'),
    leaderboard: $('leaderboard-screen'),
  };

  let currentScreen = 'loading'; // 'loading' | 'menu' | 'game'
  let gameoverOpen = false;
  let scoreEntryOpen = false;
  let activeModal = null; // null | 'howto' | 'leaderboard'

  function showScreen(n) {
    ['loading', 'menu', 'game'].forEach(k => screens[k] && screens[k].classList.add('hidden'));
    ['pause', 'scoreEntry', 'gameover', 'howto', 'leaderboard'].forEach(k => screens[k] && screens[k].classList.add('hidden'));
    if (screens[n]) screens[n].classList.remove('hidden');
    currentScreen = n;
    gameoverOpen = false;
    scoreEntryOpen = false;
    activeModal = null;
    syncDefaultGamepadFocus();
    updateCursorVisibility();
  }

  function showOverlay(n) {
    if (!screens[n]) return;
    screens[n].classList.remove('hidden');
    if (n === 'gameover') gameoverOpen = true;
    if (n === 'scoreEntry') {
      scoreEntryOpen = true;
      const input = $('player-name-input');
      if (input) {
        setTimeout(() => {
          input.focus();
          input.select();
        }, 50);
      }
    }
    syncDefaultGamepadFocus();
    updateCursorVisibility();
  }

  function hideOverlay(n) {
    if (!screens[n]) return;
    screens[n].classList.add('hidden');
    if (n === 'gameover') gameoverOpen = false;
    if (n === 'scoreEntry') scoreEntryOpen = false;
    syncDefaultGamepadFocus();
    updateCursorVisibility();
  }

  function openInfoModal() {
    if (currentScreen === 'loading' || scoreEntryOpen) return;
    if (currentScreen === 'game' && running && !paused && !gameoverOpen) {
      paused = true;
      AudioEngine.pauseBGM();
      screens.pause.classList.remove('hidden');
    }
    if (activeModal === 'leaderboard') screens.leaderboard.classList.add('hidden');
    activeModal = 'howto';
    screens.howto.classList.remove('hidden');
    syncDefaultGamepadFocus();
    updateCursorVisibility();
  }

  async function openHighScoresModal() {
    if (currentScreen === 'loading' || scoreEntryOpen) return;
    if (currentScreen === 'game' && running && !paused && !gameoverOpen) {
      paused = true;
      AudioEngine.pauseBGM();
      screens.pause.classList.remove('hidden');
    }
    if (activeModal === 'howto') screens.howto.classList.add('hidden');
    activeModal = 'leaderboard';
    screens.leaderboard.classList.remove('hidden');
    highScores.renderTable($('leaderboard-tbody'));
    syncDefaultGamepadFocus();
    updateCursorVisibility();
    await highScores.syncWithServer();
    highScores.renderTable($('leaderboard-tbody'));
  }

  function closeActiveModal() {
    if (!activeModal) return;
    if (activeModal === 'howto') screens.howto.classList.add('hidden');
    if (activeModal === 'leaderboard') screens.leaderboard.classList.add('hidden');
    activeModal = null;
    syncDefaultGamepadFocus();
    updateCursorVisibility();
  }

  /* ─── Cursor Visibility ─── */
  function updateCursorVisibility() {
    const isGameplay = Boolean(running && !paused && !gameoverOpen && !scoreEntryOpen && !activeModal && currentScreen === 'game');
    document.body.classList.toggle('hide-cursor', isGameplay);
    document.body.classList.toggle('in-game-playing', isGameplay);
  }

  /* ─── Gamepad Controller Support ─── */
  const GAMEPAD_DEADZONE = 0.35;
  const GAMEPAD_MENU_THRESHOLD = 0.48;
  const REPEAT_INITIAL_DELAY = 0.36;
  const REPEAT_INTERVAL = 0.15;
  const PRESET_NAMES = ['BUZZMASTER', 'QUEENBEE', 'HONEYHERO', 'STINGER', 'POLLENKING', 'BUMBLEACE', 'NECTARPRO', 'HIVEGUARD'];
  let presetNameIdx = 0;

  let gpConnectedCount = -1;
  let gpAudioUnlocked = false;
  let gpActionsDown = {};
  let gpPrevActionsDown = {};
  let gpActionsJustPressed = {};
  let gpActionsJustReleased = {};
  let gpMoveVector = { dx: 0, dy: 0 };
  const gpNavRepeat = {
    menuUp: { held: false, timer: 0 },
    menuDown: { held: false, timer: 0 },
    menuLeft: { held: false, timer: 0 },
    menuRight: { held: false, timer: 0 },
  };

  // Focus indices per screen
  let menuFocusIdx = 0;      // 0: btn-play, 1: btn-howto, 2: btn-leaderboard, 3: difficulty row
  let pauseFocusIdx = 0;     // 0: btn-resume, 1: btn-pause-restart, 2: toggle-sfx, 3: toggle-music, 4: btn-pause-info, 5: btn-pause-scores, 6: btn-quit-pause
  let gameoverFocusIdx = 0;  // 0: btn-play-again, 1: btn-go-scores, 2: btn-go-menu

  function isButtonPressed(gp, index, threshold = 0.5) {
    const btn = gp && gp.buttons && gp.buttons[index];
    if (!btn) return false;
    return Boolean(btn.pressed || btn.value >= threshold);
  }

  function getConnectedGamepads() {
    if (!navigator.getGamepads) return [];
    const list = navigator.getGamepads() || [];
    const out = [];
    for (let i = 0; i < list.length; i++) {
      if (list[i] && list[i].connected) out.push(list[i]);
    }
    return out;
  }

  function updateControllerBadges(count) {
    const menuBadge = $('menu-controller-badge');
    const hudBadge = $('hud-controller-badge');
    if (menuBadge) {
      menuBadge.textContent = count > 0
        ? (count === 1 ? '🎮 1 Controller Ready' : `🎮 ${count} Controllers Ready`)
        : '🎮 No Pad (Plug & Press)';
      menuBadge.classList.toggle('connected', count > 0);
    }
    if (hudBadge) {
      hudBadge.textContent = count > 0 ? '🎮 Pad Ready' : '🎮 No Pad';
      hudBadge.classList.toggle('connected', count > 0);
    }
  }

  function triggerRumble(duration = 120, weakMagnitude = 0.4, strongMagnitude = 0.6) {
    try {
      const pads = getConnectedGamepads();
      const gp = pads[0];
      if (gp && gp.vibrationActuator && typeof gp.vibrationActuator.playEffect === 'function') {
        gp.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration,
          weakMagnitude,
          strongMagnitude,
        }).catch(() => {});
      }
    } catch {}
  }

  function readGamepadActions(gp) {
    if (!gp) {
      gpMoveVector = { dx: 0, dy: 0 };
      return {
        sting: false,
        menuUp: false, menuDown: false, menuLeft: false, menuRight: false,
        menuConfirm: false, menuBack: false, pause: false,
      };
    }
    const axisX = (gp.axes && gp.axes[0]) || 0;
    const axisY = (gp.axes && gp.axes[1]) || 0;
    const dpadUp = isButtonPressed(gp, 12);
    const dpadDown = isButtonPressed(gp, 13);
    const dpadLeft = isButtonPressed(gp, 14);
    const dpadRight = isButtonPressed(gp, 15);

    let dx = 0, dy = 0;
    if (Math.abs(axisX) > GAMEPAD_DEADZONE) dx = axisX;
    else if (dpadLeft) dx = -1;
    else if (dpadRight) dx = 1;

    if (Math.abs(axisY) > GAMEPAD_DEADZONE) dy = axisY;
    else if (dpadUp) dy = -1;
    else if (dpadDown) dy = 1;

    const mag = Math.hypot(dx, dy);
    if (mag > 1) { dx /= mag; dy /= mag; }
    gpMoveVector = { dx, dy };

    // Actions: Buttons 1-4 (0..3), L1/R1 (4,5), L2/R2 (6,7)
    const sting =
      isButtonPressed(gp, 0) ||
      isButtonPressed(gp, 1) ||
      isButtonPressed(gp, 2) ||
      isButtonPressed(gp, 3) ||
      isButtonPressed(gp, 4) ||
      isButtonPressed(gp, 5) ||
      isButtonPressed(gp, 6, 0.3) ||
      isButtonPressed(gp, 7, 0.3);

    return {
      sting,
      menuUp: axisY < -GAMEPAD_MENU_THRESHOLD || dpadUp,
      menuDown: axisY > GAMEPAD_MENU_THRESHOLD || dpadDown,
      menuLeft: axisX < -GAMEPAD_MENU_THRESHOLD || dpadLeft,
      menuRight: axisX > GAMEPAD_MENU_THRESHOLD || dpadRight,
      menuConfirm: isButtonPressed(gp, 2) || isButtonPressed(gp, 0), // Button 3 primary confirm, Button 1 fallback
      menuBack: isButtonPressed(gp, 1),                             // Button 2 back/cancel
      pause: isButtonPressed(gp, 9) || isButtonPressed(gp, 8),       // Start / Select strictly for pause/resume
    };
  }

  function pollGamepads() {
    const pads = getConnectedGamepads();
    if (pads.length !== gpConnectedCount) {
      gpConnectedCount = pads.length;
      updateControllerBadges(gpConnectedCount);
    }
    const gp = pads[0] || null;
    gpPrevActionsDown = { ...gpActionsDown };
    gpActionsDown = readGamepadActions(gp);
    gpActionsJustPressed = {};
    gpActionsJustReleased = {};

    let anyPressed = false;
    for (const k of Object.keys(gpActionsDown)) {
      gpActionsJustPressed[k] = Boolean(gpActionsDown[k] && !gpPrevActionsDown[k]);
      gpActionsJustReleased[k] = Boolean(!gpActionsDown[k] && gpPrevActionsDown[k]);
      if (gpActionsDown[k]) anyPressed = true;
    }

    if (anyPressed && !gpAudioUnlocked) {
      gpAudioUnlocked = true;
      AudioEngine.init();
      AudioEngine.resume();
    }
  }

  function consumeNavStep(dirKey, dt) {
    const state = gpNavRepeat[dirKey];
    if (!gpActionsDown[dirKey]) {
      state.held = false;
      state.timer = 0;
      return false;
    }
    if (gpActionsJustPressed[dirKey] || !state.held) {
      state.held = true;
      state.timer = REPEAT_INITIAL_DELAY;
      return true;
    }
    state.timer -= dt;
    if (state.timer <= 0) {
      state.timer += REPEAT_INTERVAL;
      return true;
    }
    return false;
  }

  function clearGamepadFocus() {
    document.querySelectorAll('.gamepad-focus').forEach(el => el.classList.remove('gamepad-focus'));
  }

  function setFocusElement(el) {
    clearGamepadFocus();
    if (el) el.classList.add('gamepad-focus');
  }

  function getMenuFocusElement() {
    const items = [
      $('btn-play'),
      $('btn-howto'),
      $('btn-leaderboard'),
      $(`diff-${difficulty}`) || $('diff-easy'),
    ];
    return items[menuFocusIdx] || $('btn-play');
  }

  function getPauseFocusElement() {
    const ids = [
      'btn-resume',
      'btn-pause-restart',
      'toggle-sfx',
      'toggle-music',
      'btn-pause-info',
      'btn-pause-scores',
      'btn-quit-pause',
    ];
    return $(ids[pauseFocusIdx] || 'btn-resume');
  }

  function getGameoverFocusElement() {
    const ids = ['btn-play-again', 'btn-go-scores', 'btn-go-menu'];
    return $(ids[gameoverFocusIdx] || 'btn-play-again');
  }

  function syncDefaultGamepadFocus() {
    if (currentScreen === 'loading') {
      clearGamepadFocus();
      return;
    }
    if (activeModal === 'howto') {
      setFocusElement($('btn-howto-back'));
      return;
    }
    if (activeModal === 'leaderboard') {
      setFocusElement($('btn-lb-back'));
      return;
    }
    if (scoreEntryOpen) {
      setFocusElement($('btn-save-score'));
      return;
    }
    if (gameoverOpen) {
      setFocusElement(getGameoverFocusElement());
      return;
    }
    if (paused) {
      setFocusElement(getPauseFocusElement());
      return;
    }
    if (currentScreen === 'menu') {
      setFocusElement(getMenuFocusElement());
    } else {
      clearGamepadFocus();
    }
  }

  function cycleDifficulty(delta) {
    const order = ['easy', 'normal', 'hard'];
    const curIdx = Math.max(0, order.indexOf(difficulty));
    const nextIdx = (curIdx + delta + order.length) % order.length;
    const nextBtn = $(`diff-${order[nextIdx]}`);
    if (nextBtn) nextBtn.click();
    if (currentScreen === 'menu' && !activeModal) setFocusElement(getMenuFocusElement());
  }

  function stepUI(dir) {
    // 1. Open Modal (How to Play / High Scores)
    if (activeModal === 'howto') {
      const panel = screens.howto.querySelector('.panel');
      if (panel && (dir === 'up' || dir === 'down')) {
        panel.scrollBy({ top: dir === 'down' ? 95 : -95, behavior: 'smooth' });
      }
      return;
    }
    if (activeModal === 'leaderboard') {
      const wrap = $('leaderboard-list');
      if (wrap && (dir === 'up' || dir === 'down')) {
        wrap.scrollBy({ top: dir === 'down' ? 80 : -80, behavior: 'smooth' });
      }
      return;
    }

    // 2. High Score Entry Modal
    if (scoreEntryOpen) {
      if (dir === 'left' || dir === 'right') {
        const delta = dir === 'right' ? 1 : -1;
        presetNameIdx = (presetNameIdx + delta + PRESET_NAMES.length) % PRESET_NAMES.length;
        const input = $('player-name-input');
        if (input) input.value = PRESET_NAMES[presetNameIdx];
      }
      return;
    }

    // 3. Game Over / Victory Overlay
    if (gameoverOpen) {
      const total = 3;
      if (dir === 'up' || dir === 'left') {
        gameoverFocusIdx = (gameoverFocusIdx - 1 + total) % total;
        setFocusElement(getGameoverFocusElement());
      } else if (dir === 'down' || dir === 'right') {
        gameoverFocusIdx = (gameoverFocusIdx + 1) % total;
        setFocusElement(getGameoverFocusElement());
      }
      return;
    }

    // 4. Pause Menu Overlay
    if (paused) {
      const total = 7;
      if (dir === 'up') {
        pauseFocusIdx = (pauseFocusIdx - 1 + total) % total;
        setFocusElement(getPauseFocusElement());
      } else if (dir === 'down') {
        pauseFocusIdx = (pauseFocusIdx + 1) % total;
        setFocusElement(getPauseFocusElement());
      } else if ((dir === 'left' || dir === 'right') && (pauseFocusIdx === 2 || pauseFocusIdx === 3)) {
        const focused = getPauseFocusElement();
        if (focused) focused.click();
      }
      return;
    }

    // 5. Main Menu (Splash Screen)
    if (currentScreen === 'menu') {
      const total = 4;
      if (dir === 'up') {
        menuFocusIdx = (menuFocusIdx - 1 + total) % total;
        setFocusElement(getMenuFocusElement());
      } else if (dir === 'down') {
        menuFocusIdx = (menuFocusIdx + 1) % total;
        setFocusElement(getMenuFocusElement());
      } else if (dir === 'left') {
        cycleDifficulty(-1);
      } else if (dir === 'right') {
        cycleDifficulty(1);
      }
    }
  }

  function confirmUI() {
    if (activeModal) {
      closeActiveModal();
      return;
    }
    if (scoreEntryOpen) {
      const btn = $('btn-save-score');
      if (btn) btn.click();
      return;
    }
    if (gameoverOpen) {
      const focused = getGameoverFocusElement();
      if (focused) focused.click();
      return;
    }
    if (paused) {
      const focused = getPauseFocusElement();
      if (focused) focused.click();
      return;
    }
    if (currentScreen === 'menu') {
      if (menuFocusIdx === 3) {
        $('btn-play').click();
      } else {
        const focused = getMenuFocusElement();
        if (focused) focused.click();
      }
    }
  }

  function handleGamepadUIAndActions(dt) {
    const stepUp = consumeNavStep('menuUp', dt);
    const stepDown = consumeNavStep('menuDown', dt);
    const stepLeft = consumeNavStep('menuLeft', dt);
    const stepRight = consumeNavStep('menuRight', dt);

    if (stepUp) stepUI('up');
    if (stepDown) stepUI('down');
    if (stepLeft) stepUI('left');
    if (stepRight) stepUI('right');

    if (activeModal) {
      if (gpActionsJustPressed.menuConfirm || gpActionsJustPressed.menuBack) {
        closeActiveModal();
      }
      return;
    }

    if (scoreEntryOpen) {
      if (gpActionsJustPressed.menuConfirm) {
        confirmUI();
      }
      return;
    }

    if (gameoverOpen) {
      if (gpActionsJustPressed.menuConfirm) {
        confirmUI();
      }
      return;
    }

    if (paused) {
      if (gpActionsJustPressed.pause || gpActionsJustPressed.menuBack) {
        togglePause();
        return;
      }
      if (gpActionsJustPressed.menuConfirm) {
        confirmUI();
      }
      return;
    }

    if (currentScreen === 'game' && running) {
      if (gpActionsJustPressed.pause) {
        togglePause();
        return;
      }
      if (gpActionsJustPressed.sting) {
        tryStingNearest();
      }
      return;
    }

    if (currentScreen === 'menu') {
      if (gpActionsJustPressed.menuConfirm) {
        confirmUI();
      }
    }
  }

  /* ─── Assets ─── */
  const IMG = {};
  const SRCS = { thief: '/static/assets/images/thief_hand.png', spray: '/static/assets/images/spray_hand.png', nectar: '/static/assets/images/nectar.png' };
  function loadAssets(onP) {
    const keys = Object.keys(SRCS); let loaded = 0;
    return new Promise(res => {
      keys.forEach(k => {
        const img = new Image(); img.src = SRCS[k];
        img.onload = img.onerror = () => { IMG[k] = img; loaded++; onP(loaded / keys.length); if (loaded === keys.length) res(); };
      });
    });
  }

  /* ─── Config ─── */
  async function fetchCFG() {
    try {
      const r = await fetch('/api/gameconfig'); const d = await r.json();
      if (d.version) {
        const vText = 'v' + String(d.version).replace(/^v/i, '');
        if ($('game-version')) $('game-version').textContent = vText;
        document.querySelectorAll('.info-version-text').forEach(el => { el.textContent = vText; });
      }
      const dc = d.difficulty[difficulty];
      CFG = {
        ...CFG, ...dc, scoring: d.scoring,
        victoryJars: difficulty === 'easy' ? 5 : difficulty === 'hard' ? 15 : 10
      };
    } catch {}
  }

  /* ─── Canvas ─── */
  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = 1200;
    canvas.height = 800;
  }

  /* ─── Init ─── */
  function initGame() {
    AudioEngine.init();
    AudioEngine.resume();
    canvas = $('game-canvas'); ctx = canvas.getContext('2d');
    resizeCanvas();
    score = 0; wave = 1; combo = 0; maxCombo = 0; pollenCollected = 0; enemiesStung = 0; playFrames = 0;
    spawnTimer = 0; waveTimer = 0; waveDisplayTimer = 0;
    paused = false; running = true; keys = {};
    gameoverOpen = false; scoreEntryOpen = false; activeModal = null;
    enemyWarning = null; enemyWarnTimer = 0;

    bee = new Entities.Bee(canvas.width * 0.25, canvas.height * 0.5);

    // Hive in dead center of game area floor
    const hiveX = canvas.width / 2, hiveY = canvas.height / 2;
    hive = new Hive(hiveX, hiveY);

    // Scenery
    clouds = []; for (let i = 0; i < 6; i++) clouds.push({ x: rand(0, canvas.width), y: rand(30, canvas.height * 0.3), w: rand(80, 180), speed: rand(0.15, 0.4), alpha: rand(0.7, 0.95) });
    trees = []; for (let i = 0; i < 5; i++) trees.push({ x: rand(50, canvas.width * 0.8), h: rand(80, 160), w: rand(40, 70), trunkH: rand(40, 70) });

    flowers = []; pollens = []; enemies = []; particles = []; stingFlashes = [];
    for (let i = 0; i < 6; i++) spawnFlower();
    for (let i = 0; i < 5; i++) spawnPollen('good');

    if (stopBGM) stopBGM();
    stopBGM = AudioEngine.startBGM();
    updateHUD();
    updateCursorVisibility();
  }

  /* ─── Spawning ─── */
  function spawnFlower() {
    const x = rand(60, canvas.width - 60);
    const y = canvas.height - rand(100, 350);
    flowers.push(new Flower(x, y));
  }
  function spawnPollen(type) {
    pollens.push(new Entities.Pollen(rand(30, canvas.width * 0.8), rand(80, canvas.height - 160), type));
  }
  function spawnThief() {
    if (!running) return;
    if (enemies.filter(e => e.type === 'thief' && !e.dead).length >= 1) return;
    const nectars = flowers.filter(f => !f.dead);
    const target = nectars.length > 0 ? nectars[randInt(0, nectars.length - 1)] : { x: rand(100, canvas.width * 0.7), y: canvas.height - 80 };
    const fakeJar = { x: target.x, y: target.y, shake: () => {} };
    enemies.push(new Entities.ThiefHand(target.x, canvas.height, 1.8 * CFG.enemySpeed, fakeJar));
  }
  function spawnSpray() {
    if (!running) return;
    if (enemies.filter(e => e.type === 'spray' && !e.dead).length >= 1) return;
    enemies.push(new Entities.SprayHand(rand(100, canvas.width * 0.75), canvas.height, 1.4 * CFG.enemySpeed));
  }
  function warnEnemy(type) {
    enemyWarning = type; enemyWarnTimer = 120;
    AudioEngine.play('wave');
  }
  function handleSpawning() {
    spawnTimer++; waveTimer++;
    if (waveTimer > 30 * 60) { waveTimer = 0; wave++; waveDisplayTimer = 180; AudioEngine.play('wave'); CFG.enemySpeed = Math.min(2.5, CFG.enemySpeed + 0.1); }
    const pollenInt = Math.max(80, 150 - wave * 5);
    if (spawnTimer % pollenInt < 2) spawnPollen('good');
    const flowerInt = Math.max(400, 900 - wave * 20);
    if (spawnTimer % flowerInt < 4) spawnFlower();
    const baseInt = Math.max(300, 700 - wave * 25);
    if (spawnTimer % Math.floor(baseInt / CFG.spawnRate) < 2) {
      const isThief = Math.random() < 0.45;
      warnEnemy(isThief ? 'burglar' : 'farmer');
      setTimeout(() => isThief ? spawnThief() : spawnSpray(), 2000);
    }
  }

  /* ─── Background ─── */
  function drawBG() {
    const W = canvas.width, H = canvas.height;
    const skyH = H * 0.55;
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, skyH);
    sky.addColorStop(0, '#87CEEB'); sky.addColorStop(1, '#E8F5E9');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, skyH);
    // Sun
    ctx.save(); ctx.fillStyle = '#FFF176'; ctx.shadowColor = '#FFD600'; ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.arc(W * 0.12, H * 0.08, 36, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // Clouds
    for (const c of clouds) {
      c.x -= c.speed; if (c.x + c.w < 0) c.x = W + c.w;
      ctx.save(); ctx.globalAlpha = c.alpha; ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(255,255,255,0.5)'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.ellipse(c.x, c.y, c.w * 0.5, c.w * 0.22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(c.x - c.w * 0.18, c.y + 8, c.w * 0.3, c.w * 0.16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(c.x + c.w * 0.2, c.y + 6, c.w * 0.28, c.w * 0.14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // Grass
    const grass = ctx.createLinearGradient(0, skyH, 0, H);
    grass.addColorStop(0, '#66BB6A'); grass.addColorStop(1, '#2E7D32');
    ctx.fillStyle = grass; ctx.fillRect(0, skyH, W, H - skyH);
    // Rolling hill edge
    ctx.fillStyle = '#81C784';
    ctx.beginPath(); ctx.moveTo(0, skyH);
    for (let x = 0; x <= W; x += 40) { ctx.quadraticCurveTo(x + 20, skyH - 18, x + 40, skyH); }
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    // Trees
    for (const t of trees) {
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(t.x - t.w * 0.24, H - t.trunkH, t.w * 0.25, t.trunkH);
      const tg = ctx.createRadialGradient(t.x, H - t.trunkH - t.h * 0.4, 0, t.x, H - t.trunkH - t.h * 0.4, t.w * 0.5);
      tg.addColorStop(0, '#275e2aff'); tg.addColorStop(1, '#4f9653ff');
      ctx.fillStyle = tg;
      ctx.beginPath(); ctx.arc(t.x, H - t.trunkH - t.h * 0.6, t.w * 0.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* ─── HUD ─── */
  function updateHUD() {
    $('score-val').textContent = score;
    const bestVal = Math.max(score, highScores.getBestScore());
    if ($('hud-best')) $('hud-best').textContent = bestVal;
    $('wave-val').textContent = wave;
    $('combo-val').textContent = combo <= 1 ? 'x1' : `x${combo}`;
    $('health-bar').style.width = (bee.health / bee.maxHealth * 100) + '%';
    $('stamina-bar').style.width = (bee.stamina / bee.maxStamina * 100) + '%';
    const hp = bee.health / bee.maxHealth;
    $('health-bar').style.background = hp > 0.5 ? 'linear-gradient(90deg,#4CAF50,#8BC34A)' : hp > 0.25 ? 'linear-gradient(90deg,#FF8F00,#FFC107)' : 'linear-gradient(90deg,#FF3B30,#FF6B6B)';
    // carry
    const nc = $('nectar-hud'); const pc = $('pollen-hud');
    if (nc) nc.textContent = '💧'.repeat(bee.nectarCarried) || '—';
    if (pc) pc.textContent = '🌼'.repeat(bee.pollenCarried) || '—';
    // honey
    const hj = $('honey-hud');
    if (hj) hj.textContent = `🍯×${hive.honeyJars}/${CFG.victoryJars}`;
    // enemy warning
    const wa = $('enemy-warning');
    if (wa) {
      if (enemyWarnTimer > 0) {
        wa.textContent = enemyWarning === 'burglar' ? '⚠️ BURGLAR!' : '⚠️ FARMER!';
        wa.style.display = 'block';
        wa.style.opacity = Math.min(1, enemyWarnTimer / 30);
        enemyWarnTimer--;
      } else { wa.style.display = 'none'; }
    }
  }

  /* ─── Score popup ─── */
  function addScore(pts, x, y) {
    const mult = combo > 1 ? (1 + (combo - 1) * (CFG.scoring.comboMultiplier - 1)) : 1;
    const total = Math.round(pts * mult);
    score = Math.max(0, score + total);
    const el = document.createElement('div');
    el.className = `score-popup ${total > 0 ? 'positive' : 'negative'}`;
    el.textContent = (total > 0 ? '+' : '') + total;
    const scaleX = canvas.clientWidth / canvas.width;
    const scaleY = canvas.clientHeight / canvas.height;
    el.style.left = Math.max(10, x * scaleX - 20) + 'px';
    el.style.top = Math.max(60, y * scaleY + 40) + 'px';
    $('popup-layer').appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  /* ─── Input (Keyboard + Gamepad) ─── */
  let inputInitialized = false;
  function setupInput() {
    if (inputInitialized) return;
    inputInitialized = true;

    // Unlock audio on first pointer or key interaction
    const unlockOnce = () => {
      AudioEngine.init();
      AudioEngine.resume();
    };
    window.addEventListener('pointerdown', unlockOnce, { once: true });

    document.addEventListener('keydown', e => {
      unlockOnce();
      const isTyping = document.activeElement && document.activeElement.tagName === 'INPUT';

      // Info modal shortcut ('i' or '?')
      if (!isTyping && (e.key === 'i' || e.key === 'I' || e.key === '?')) {
        e.preventDefault();
        if (activeModal === 'howto') closeActiveModal();
        else openInfoModal();
        return;
      }

      // Close open modal on Escape
      if (activeModal) {
        if (e.code === 'Escape' || e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          closeActiveModal();
        } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          stepUI('up');
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          e.preventDefault();
          stepUI('down');
        }
        return;
      }

      // High score entry modal
      if (scoreEntryOpen) {
        if (e.code === 'Escape') {
          e.preventDefault();
          hideOverlay('scoreEntry');
          showOverlay('gameover');
        }
        return;
      }

      // Menu / Pause / Game Over keyboard navigation
      if (!running || paused || gameoverOpen) {
        if (e.code === 'Escape' && paused) {
          e.preventDefault();
          togglePause();
          return;
        }
        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          stepUI('up');
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          e.preventDefault();
          stepUI('down');
        } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          e.preventDefault();
          stepUI('left');
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          e.preventDefault();
          stepUI('right');
        } else if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          confirmUI();
        }
        return;
      }

      // Active gameplay keys
      keys[e.code] = true;
      if ((e.code === 'Space' || e.code === 'KeyZ') && !paused) {
        e.preventDefault();
        tryStingNearest();
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        togglePause();
      }
    });

    document.addEventListener('keyup', e => { keys[e.code] = false; });
    window.addEventListener('gamepadconnected', () => pollGamepads());
    window.addEventListener('gamepaddisconnected', () => pollGamepads());
  }

  function getMov() {
    let dx = 0, dy = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
    if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
    if (keys['ArrowDown'] || keys['KeyS']) dy += 1;
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    // Combine with gamepad movement if active
    if (Math.abs(gpMoveVector.dx) > 0.01 || Math.abs(gpMoveVector.dy) > 0.01) {
      dx += gpMoveVector.dx;
      dy += gpMoveVector.dy;
      const mag = Math.hypot(dx, dy);
      if (mag > 1) { dx /= mag; dy /= mag; }
    }
    return { dx, dy };
  }

  /* ─── Sting ─── */
  function tryStingNearest() {
    if (!bee || !bee.tryStirng()) return;
    let closest = null, minD = bee.stingRange;
    for (const e of enemies) {
      if (e.dead) continue;
      const b = e.getBounds(), ex = b.x + b.w / 2, ey = b.y + b.h / 2;
      const d = dist(bee.x, bee.y, ex, ey);
      if (d < minD) { closest = e; minD = d; }
    }
    if (closest) {
      stingFlashes.push(new Entities.StingFlash(bee.x, bee.y));
      AudioEngine.play('sting');
      const killed = closest.takeDamage();
      triggerRumble(killed ? 160 : 90, 0.5, killed ? 0.85 : 0.45);
      if (killed) {
        const b = closest.getBounds();
        particles.push(new Entities.Particle(b.x + b.w / 2, b.y + b.h / 2, '#FF6BFF', 12));
        AudioEngine.play('enemyDie');
        combo++; if (combo > maxCombo) maxCombo = combo;
        if (combo >= 3) AudioEngine.play('combo');
        enemiesStung++;
        const pts = closest.type === 'thief' ? CFG.scoring.stingThief : CFG.scoring.stingSpray;
        addScore(pts, b.x + b.w / 2, b.y);
        $('combo-val').classList.add('combo-flash');
        setTimeout(() => $('combo-val').classList.remove('combo-flash'), 300);
      } else { combo = 0; }
    } else {
      combo = Math.max(0, combo - 1);
      stingFlashes.push(new Entities.StingFlash(bee.x + (bee.facingRight ? 50 : -50), bee.y));
    }
  }

  /* ─── Bee interactions ─── */
  function checkFlowerInteraction() {
    for (const f of flowers) {
      if (f.dead || !f.hasNectar) continue;
      const d = dist(bee.x, bee.y, f.x, f.y);
      if (d < 45 && bee.nectarCarried < bee.maxCarry) {
        f.collect();
        bee.collectNectar();
        particles.push(new Entities.Particle(f.x, f.y, '#FFD600', 6));
        AudioEngine.play('collectPollen');
        addScore(5, f.x, f.y - 20);
      }
    }
  }
  function checkPollenInteraction() {
    const bb = bee.getBounds();
    for (const p of pollens) {
      if (p.collected) continue;
      if (rectsOverlap(bb, p.getBounds())) {
        p.collected = true;
        particles.push(new Entities.Particle(p.x, p.y, p.type === 'good' ? '#FFD600' : '#4CAF50', 6));
        if (p.type === 'good') {
          if (bee.pollenCarried < bee.maxCarry) { bee.collectPollen(); AudioEngine.play('collectPollen'); addScore(CFG.scoring.yellowPollen, p.x, p.y); pollenCollected++; }
          else { addScore(CFG.scoring.yellowPollen, p.x, p.y); pollenCollected++; }
        } else {
          addScore(CFG.scoring.badPollenHit, p.x, p.y);
          bee.takeDamage(8); AudioEngine.play('badPollen'); combo = 0; shakeScreen();
          triggerRumble(180, 0.6, 0.8);
        }
      }
    }
  }
  function checkHiveDeposit() {
    const d = dist(bee.x, bee.y, hive.entranceX, hive.entranceY);
    if (d < hive.depositRadius && (bee.nectarCarried > 0 || bee.pollenCarried > 0)) {
      hive.deposit(bee.nectarCarried, bee.pollenCarried);
      bee.depositAnim = 40;
      bee.nectarCarried = 0; bee.pollenCarried = 0;
      AudioEngine.play('collectPollen');
      particles.push(new Entities.Particle(hive.entranceX, hive.entranceY, '#FFD600', 8));
      checkVictory();
    }
  }
  function checkVictory() {
    if (hive.honeyJars >= CFG.victoryJars) endGame(true);
  }

  /* ─── Enemy nectar steal ─── */
  function checkNectarSteals() {
    for (const e of enemies) {
      if (e.type !== 'thief' || e.dead) continue;
      const res = e.update();
      if (res === 'stolen') {
        addScore(CFG.scoring.nectarStolen, e.x, e.y - 60);
        particles.push(new Entities.Particle(e.x, canvas.height - 200, '#FF3B30', 14));
        AudioEngine.play('nectarStolen'); shakeScreen(); combo = 0;
        triggerRumble(220, 0.7, 0.9);
      }
    }
  }

  /* ─── Spray converts pollen ─── */
  function checkSprayEffect() {
    for (const e of enemies) {
      if (e.type !== 'spray' || e.dead) continue;
      const zone = e.getSprayZone();
      for (const p of pollens) {
        if (p.type === 'good' && !p.collected && rectsOverlap(p.getBounds(), zone)) p.type = 'bad';
      }
      for (const f of flowers) {
        if (!f.dead && f.hasNectar && rectsOverlap({ x: f.x - 20, y: f.y - 20, w: 40, h: 40 }, zone)) {
          f.hasNectar = false;
        }
      }
    }
  }

  function shakeScreen() {
    $('game-wrapper').classList.add('shake');
    setTimeout(() => $('game-wrapper').classList.remove('shake'), 400);
  }

  /* ─── Pause ─── */
  function togglePause() {
    if (!running) return;
    if (activeModal) {
      closeActiveModal();
      return;
    }
    paused = !paused;
    if (paused) {
      pauseFocusIdx = 0;
      AudioEngine.pauseBGM();
      showOverlay('pause');
    } else {
      hideOverlay('pause');
      AudioEngine.resume();
    }
  }

  /* ─── End Game (Victory / Defeat + High Score Qualification) ─── */
  function endGame(victory = false) {
    running = false;
    paused = false;
    if (stopBGM) stopBGM();
    AudioEngine.play(victory ? 'victory' : 'gameOver');
    triggerRumble(300, 0.6, 1.0);

    const bestScore = Math.max(score, highScores.getBestScore());
    $('go-icon').textContent = victory ? '🏆' : '💔';
    $('go-title').textContent = victory ? 'Victory! Hive Saved! 🐝' : 'Mission Failed';
    $('go-score').textContent = score.toLocaleString();
    if ($('go-best')) $('go-best').textContent = bestScore.toLocaleString();
    $('go-wave').textContent = wave;
    if ($('go-honey')) $('go-honey').textContent = `${hive ? hive.honeyJars : 0} / ${CFG.victoryJars}`;
    $('go-pollen').textContent = pollenCollected;
    $('go-stings').textContent = enemiesStung;
    $('go-combo').textContent = `x${Math.max(1, maxCombo)}`;
    if ($('go-time')) $('go-time').textContent = formatTime(playFrames);
    $('rank-msg').textContent = '';

    const newBestBadge = $('go-new-best-badge');
    if (newBestBadge) newBestBadge.classList.add('hidden');

    hideOverlay('pause');
    gameoverFocusIdx = 0; // Default focus to Play Again on Game Over screen

    if (highScores.isHighScore(score)) {
      if ($('entry-score-num')) $('entry-score-num').textContent = score.toLocaleString();
      const input = $('player-name-input');
      if (input && !input.value.trim()) input.value = PRESET_NAMES[presetNameIdx];
      showOverlay('scoreEntry');
    } else {
      showOverlay('gameover');
    }
  }

  /* ─── Save High Score Entry ─── */
  async function handleSaveScore(e) {
    if (e) e.preventDefault();
    if (!scoreEntryOpen) return;
    const input = $('player-name-input');
    const name = (input && input.value.trim()) || PRESET_NAMES[presetNameIdx] || 'BUZZMASTER';
    hideOverlay('scoreEntry');

    const { rank } = await highScores.addScore(name, score, wave);
    if ($('go-best')) $('go-best').textContent = highScores.getBestScore().toLocaleString();
    if ($('hud-best')) $('hud-best').textContent = highScores.getBestScore();
    const newBestBadge = $('go-new-best-badge');
    if (newBestBadge) newBestBadge.classList.remove('hidden');
    $('rank-msg').textContent = `🏆 Saved as ${name.toUpperCase()} — Ranked #${rank} on the leaderboard!`;

    gameoverFocusIdx = 0; // Focus Play Again so Button 3 / Enter immediately retries
    showOverlay('gameover');
  }

  /* ─── Banner / Labels ─── */
  function drawHiveEntrance() {
    const d = dist(bee.x, bee.y, hive.entranceX, hive.entranceY);
    const alpha = Math.max(0, 1 - (d - hive.depositRadius * 0.5) / 80);
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath(); ctx.roundRect(hive.entranceX - 52, hive.entranceY + 30, 104, 26, 8); ctx.fill();
    ctx.fillStyle = '#FFD600'; ctx.font = 'bold 11px Nunito,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Fly here to deposit!', hive.entranceX, hive.entranceY + 48);
    ctx.restore();
  }

  function drawWaveBanner() {
    if (waveDisplayTimer <= 0) return; waveDisplayTimer--;
    const a = Math.min(1, waveDisplayTimer / 30);
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(canvas.width / 2 - 140, canvas.height / 2 - 40, 280, 80);
    ctx.fillStyle = '#FFD600'; ctx.font = "bold 42px 'Fredoka One',cursive";
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`Wave ${wave}`, canvas.width / 2, canvas.height / 2); ctx.restore();
  }

  /* ─── Gameplay Frame Update ─── */
  function stepGameplay() {
    if (!running || paused) return;
    playFrames++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBG();
    handleSpawning();

    // Bee move
    const { dx, dy } = getMov(); bee.move(dx, dy); bee.update(canvas.width, canvas.height);

    // Hive
    hive.update(); hive.draw(ctx);
    drawHiveEntrance();

    // Flowers
    flowers.forEach(f => { f.update(); f.draw(ctx); });
    flowers = flowers.filter(f => !f.dead);

    // Pollen
    pollens.forEach(p => { p.update(); p.draw(ctx); });
    pollens = pollens.filter(p => !p.dead);

    // Enemies – spray (non-thief) updated here
    enemies.forEach(e => {
      if (e.type === 'spray') { const sig = e.update(); if (sig === 'spray') checkSprayEffect(); }
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.scale(2, 2);
      ctx.translate(-e.x, -e.y);
      e.draw(ctx);
      ctx.restore();
    });
    checkNectarSteals();
    enemies = enemies.filter(e => !e.dead);

    // Effects
    particles.forEach(p => { p.update(); p.draw(ctx); }); particles = particles.filter(p => !p.dead);
    stingFlashes.forEach(s => { s.update(); s.draw(ctx); }); stingFlashes = stingFlashes.filter(s => !s.dead);

    // Interactions
    checkFlowerInteraction();
    checkPollenInteraction();
    checkHiveDeposit();
    checkSprayEffect();

    // Bee on top
    bee.draw(ctx);

    drawWaveBanner();
    if (!bee.alive) endGame(false);
    updateHUD();
  }

  /* ─── Unified Master Loop (Gamepad Polling + UI + Gameplay) ─── */
  let lastFrameTime = performance.now();
  function masterLoop(now) {
    const dt = Math.min(0.1, Math.max(0.001, (now - lastFrameTime) / 1000));
    lastFrameTime = now;

    pollGamepads();
    handleGamepadUIAndActions(dt);
    updateCursorVisibility();
    stepGameplay();

    requestAnimationFrame(masterLoop);
  }

  /* ─── Menu particles ─── */
  function spawnMenuParticles() {
    const c = $('menu-particles'); c.innerHTML = '';
    ['🌼', '🌸', '🍀', '✨', '🌻', '💛'].forEach(icon => {
      for (let i = 0; i < 3; i++) {
        const el = document.createElement('div'); el.className = 'particle'; el.textContent = icon;
        el.style.left = `${rand(0, 100)}%`; el.style.fontSize = `${rand(14, 28)}px`;
        el.style.animationDuration = `${rand(6, 14)}s`; el.style.animationDelay = `-${rand(0, 14)}s`;
        c.appendChild(el);
      }
    });
  }

  /* ─── Wire events ─── */
  function wireEvents() {
    setupInput();

    // Difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); difficulty = btn.dataset.diff; fetchCFG();
      });
    });

    // Main Menu buttons
    $('btn-play').addEventListener('click', () => { AudioEngine.init(); showScreen('game'); initGame(); });
    $('btn-howto').addEventListener('click', openInfoModal);
    if ($('btn-info')) $('btn-info').addEventListener('click', openInfoModal);
    $('btn-leaderboard').addEventListener('click', openHighScoresModal);

    // Info & Leaderboard modal close buttons + backdrop click
    $('btn-howto-back').addEventListener('click', closeActiveModal);
    if ($('btn-howto-close')) $('btn-howto-close').addEventListener('click', closeActiveModal);
    $('btn-lb-back').addEventListener('click', closeActiveModal);
    if ($('btn-lb-close')) $('btn-lb-close').addEventListener('click', closeActiveModal);

    screens.howto.addEventListener('click', e => { if (e.target === screens.howto) closeActiveModal(); });
    screens.leaderboard.addEventListener('click', e => { if (e.target === screens.leaderboard) closeActiveModal(); });

    // HUD buttons
    $('btn-pause').addEventListener('click', togglePause);
    if ($('hud-info-btn')) $('hud-info-btn').addEventListener('click', openInfoModal);

    // Pause menu buttons & audio toggles
    $('btn-resume').addEventListener('click', togglePause);
    if ($('btn-pause-restart')) {
      $('btn-pause-restart').addEventListener('click', () => {
        hideOverlay('pause');
        initGame();
      });
    }
    if ($('toggle-sfx')) {
      $('toggle-sfx').addEventListener('click', () => {
        AudioEngine.init();
        const nextMuted = !AudioEngine.isSfxMuted();
        AudioEngine.setSfxMute(nextMuted);
        const btn = $('toggle-sfx');
        btn.textContent = nextMuted ? 'OFF' : 'ON';
        btn.classList.toggle('on', !nextMuted);
        btn.classList.toggle('off', nextMuted);
      });
    }
    if ($('toggle-music')) {
      $('toggle-music').addEventListener('click', () => {
        AudioEngine.init();
        const nextMuted = !AudioEngine.isBgmMuted();
        AudioEngine.setBgmMute(nextMuted);
        const btn = $('toggle-music');
        btn.textContent = nextMuted ? 'OFF' : 'ON';
        btn.classList.toggle('on', !nextMuted);
        btn.classList.toggle('off', nextMuted);
      });
    }
    if ($('btn-pause-info')) $('btn-pause-info').addEventListener('click', openInfoModal);
    if ($('btn-pause-scores')) $('btn-pause-scores').addEventListener('click', openHighScoresModal);
    $('btn-quit-pause').addEventListener('click', () => {
      running = false; paused = false;
      if (stopBGM) stopBGM();
      hideOverlay('pause');
      showScreen('menu');
    });

    // High Score Entry Form
    if ($('score-entry-form')) {
      $('score-entry-form').addEventListener('submit', handleSaveScore);
    }

    // Game Over / Victory buttons
    $('btn-play-again').addEventListener('click', () => {
      hideOverlay('gameover');
      AudioEngine.init();
      showScreen('game');
      initGame();
    });
    if ($('btn-go-scores')) $('btn-go-scores').addEventListener('click', openHighScoresModal);
    $('btn-go-menu').addEventListener('click', () => {
      running = false;
      hideOverlay('gameover');
      showScreen('menu');
    });

    window.addEventListener('resize', () => { if (running) resizeCanvas(); });
  }

  /* ─── Boot ─── */
  async function boot() {
    requestAnimationFrame(masterLoop);
    showScreen('loading');
    const bar = $('loading-bar'), txt = $('loading-text');
    txt.textContent = 'Fetching config…';
    await fetchCFG();
    await highScores.syncWithServer();
    if ($('hud-best')) $('hud-best').textContent = highScores.getBestScore();
    txt.textContent = 'Loading assets…';
    await loadAssets(p => { bar.style.width = (p * 100) + '%'; });
    txt.textContent = 'Ready!';
    await new Promise(r => setTimeout(r, 500));
    $('loading-screen').style.opacity = '0';
    await new Promise(r => setTimeout(r, 600));
    $('loading-screen').style.display = 'none';
    spawnMenuParticles();
    showScreen('menu');
  }

  wireEvents();
  boot();
})();
