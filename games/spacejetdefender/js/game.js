// ============================================================================
// SPACEJET DEFENDER - Core Game Loop, Level Spawner, State Machine & UI Menus
// ============================================================================

class SpacejetGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new window.NeonRenderer(this.canvas);

    // Ensure Level 1 story config is up to date even if levels.js was browser-cached
    if (window.GAME_CONSTANTS && Array.isArray(window.GAME_CONSTANTS.LEVELS) && window.GAME_CONSTANTS.LEVELS[0]) {
      const lvl1 = window.GAME_CONSTANTS.LEVELS[0];
      lvl1.radarInitiallyActive = true;
      if (Array.isArray(lvl1.radioEvents)) {
        const ambushEv = lvl1.radioEvents.find((ev) => ev.switchMusic === 'sector_early' || ev.alarm);
        if (ambushEv) {
          ambushEv.x = 4460;
          ambushEv.triggerOnFirstAlienInView = true;
          ambushEv.jamRadar = true;
          ambushEv.text = (name) =>
            `RED ALERT! Massive alien fleet dropping out of warp! They've jammed our Radar—${name}, you're the last survivor left!`;
        }
      }
    }

    this.state = 'TITLE'; // TITLE, NAME_ENTRY, BRIEFING, PLAYING, PAUSED, LEVEL_COMPLETE, GAME_OVER, VICTORY, HIGH_SCORES
    this.time = 0;
    this.lastTimestamp = performance.now();

    // Player & Campaign Progression (blank name by default; requires >= 3 chars to launch)
    this.pilotName = '';
    this.difficultyMode = 'EASY'; // 'EASY' (standard) or 'HARD' (half power-ups, 2x enemy HP)
    this.currentLevelIndex = 0; // 0..9 (Levels 1..10)
    this.currentLevelData = window.GAME_CONSTANTS.LEVELS[0];
    this.score = 0;
    this.player = new window.Entities.PlayerJet();

    // World & Entities
    this.cameraX = 0;
    this.scrollSpeed = 165; // Travels 8 screens (~10,240px) in ~60 seconds of intense action
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.particles = [];
    this.floatingTexts = [];
    this.activeBoss = null;
    this.overdriveRing = null;
    this.screenShake = 0;

    // Campaign / Level Objective Trackers
    this.radarUnlocked = false;
    this.jammersDestroyed = 0;
    this.shuttlesLaunched = 0;
    this.humansRescued = 0;
    this.teslaCoilsSmashed = 0;
    this.enemiesDestroyed = 0;
    this.bossesDefeated = 0;
    this.tookHullDamageThisLevel = false;
    this.earnedMedals = new Set();

    // Radio banner
    this.radioBanner = { speaker: '', text: '', timer: 0 };
    this.triggeredRadioIndices = new Set();

    // Menus & Name Entry Virtual Grid
    this.titleMenuIndex = 0;
    this.startingLevelSelect = 0; // Allows starting at L1 (or choosing unlocked sector)
    this.pauseMenuIndex = 0;
    this.gameOverMenuIndex = 0;
    this.nameChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 _!'.split('');
    this.nameGridIndex = 0;

    // High Scores Persistence & Newly Added Score Highlight Tracking
    this.lastAddedScoreId = null;
    this.lastAddedScoreEntry = null;
    this.currentRunScoreId = null;
    this.highScores = this.loadHighScores();

    requestAnimationFrame((ts) => this.loop(ts));
  }

  loadHighScores() {
    try {
      const raw = localStorage.getItem('spacejet_defender_highscores_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'preset_1',
        name: 'Nova',
        rank: 'Admiral',
        score: 85000,
        medals: 6,
        medalIds: ['survivor_wings', 'radar_liberator', 'arsenal_master', 'humanity_savior', 'tesla_breaker', 'kingslayer']
      },
      {
        id: 'preset_2',
        name: 'Vance',
        rank: 'Rear Admiral',
        score: 64200,
        medals: 5,
        medalIds: ['survivor_wings', 'radar_liberator', 'arsenal_master', 'humanity_savior', 'tesla_breaker']
      },
      {
        id: 'preset_3',
        name: 'Orion',
        rank: 'Commodore',
        score: 48500,
        medals: 4,
        medalIds: ['survivor_wings', 'radar_liberator', 'arsenal_master', 'humanity_savior']
      },
      {
        id: 'preset_4',
        name: 'Rex',
        rank: 'Commander',
        score: 31000,
        medals: 3,
        medalIds: ['survivor_wings', 'radar_liberator', 'arsenal_master']
      },
      {
        id: 'preset_5',
        name: 'Star',
        rank: 'Scout',
        score: 12400,
        medals: 1,
        medalIds: ['survivor_wings']
      }
    ];
  }

  saveHighScore() {
    const rankName = this.currentLevelData ? this.currentLevelData.rank : 'Cadet';
    const entryId = this.currentRunScoreId || `score_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    this.currentRunScoreId = entryId;

    const newEntry = {
      id: entryId,
      name: this.pilotName.trim() || 'PILOT',
      rank: rankName,
      score: this.score,
      medals: this.earnedMedals.size,
      medalIds: Array.from(this.earnedMedals)
    };

    this.lastAddedScoreId = entryId;
    this.lastAddedScoreEntry = newEntry;

    // Remove previous entry from the same continued campaign run if present
    this.highScores = this.highScores.filter((e) => e.id !== entryId);
    this.highScores.push(newEntry);
    this.highScores.sort((a, b) => b.score - a.score);
    this.highScores = this.highScores.slice(0, 8);
    try {
      localStorage.setItem('spacejet_defender_highscores_v1', JSON.stringify(this.highScores));
    } catch (e) {}
  }

  getMedalsForScoreEntry(entry) {
    const catalog = window.GAME_CONSTANTS.MEDALS_CATALOG || [];
    if (!entry) return [];
    if (Array.isArray(entry.medalIds) && entry.medalIds.length > 0) {
      const idSet = new Set(entry.medalIds);
      return catalog.filter((m) => idSet.has(m.id));
    }
    const count = Math.max(0, Math.min(catalog.length, Number(entry.medals) || 0));
    return catalog.slice(0, count);
  }

  getTopScore() {
    const best = this.highScores.length > 0 ? this.highScores[0].score : 0;
    return Math.max(best, this.score);
  }

  toggleDifficultyMode() {
    this.difficultyMode = this.difficultyMode === 'EASY' ? 'HARD' : 'EASY';
  }

  showRadioTransmission(speaker, text, duration = 5.2) {
    this.radioBanner = { speaker, text, timer: duration };
  }

  addFloatingText(x, y, text, color = '#00f3ff') {
    this.floatingTexts.push({ x, y, text, color, life: 1.25, maxLife: 1.25 });
  }

  spawnParticle(x, y, vx, vy, color, life = 0.4, size = 2) {
    this.particles.push({ x, y, vx, vy, color, life, maxLife: life, size });
  }

  spawnExplosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 290;
      this.spawnParticle(
        x,
        y,
        Math.cos(a) * spd,
        Math.sin(a) * spd,
        i % 3 === 0 ? '#ffffff' : color,
        0.35 + Math.random() * 0.4,
        2.2
      );
    }
  }

  // ==========================================================================
  // CAMPAIGN & LEVEL INITIALIZATION (8 Screens = 10,240 px wide)
  // ==========================================================================
  startNewCampaign(startLevelIdx = 0) {
    this.score = 0;
    this.currentRunScoreId = null;
    this.earnedMedals.clear();
    this.shuttlesLaunched = 0;
    this.humansRescued = 0;
    this.teslaCoilsSmashed = 0;
    this.enemiesDestroyed = 0;
    this.bossesDefeated = 0;
    this.player.resetForLevel(true);

    // If starting at higher level via level select, grant prior sectors' weapon/radar unlocks
    if (startLevelIdx >= 3) this.radarUnlocked = true;
    if (startLevelIdx >= 4) this.player.weaponTier = 2;
    if (startLevelIdx >= 6) this.player.weaponTier = 3;

    this.loadLevel(startLevelIdx);
    this.state = 'BRIEFING';
    window.audio.playTrack('title');
  }

  getDifficultyMultiplier() {
    // Level 1 = 1.00x (unchanged), scaling linearly up to Level 10 = 1.50x (50% harder)
    const lvlNum = this.currentLevelData ? this.currentLevelData.number : 1;
    return 1.0 + ((lvlNum - 1) / 9) * 0.5;
  }

  loadLevel(levelIndex) {
    this.currentLevelIndex = levelIndex;
    this.currentLevelData = window.GAME_CONSTANTS.LEVELS[levelIndex];
    const lvl = this.currentLevelData;

    this.cameraX = 0;
    this.player.resetForLevel(false);
    this.playerBullets.length = 0;
    this.enemyBullets.length = 0;
    this.enemies.length = 0;
    this.powerUps.length = 0;
    this.particles.length = 0;
    this.floatingTexts.length = 0;
    this.activeBoss = null;
    this.overdriveRing = null;
    this.triggeredRadioIndices.clear();
    this.tookHullDamageThisLevel = false;
    this.jammersDestroyed = 0;

    if (lvl.radarInitiallyActive) {
      this.radarUnlocked = true;
    } else if (lvl.number <= 3) {
      this.radarUnlocked = false;
    }

    this.populateLevelEntities(lvl);
  }

  populateLevelEntities(lvl) {
    const Enemy = window.Entities.Enemy;
    const PowerUp = window.Entities.PowerUp;
    const L = window.GAME_CONSTANTS.LEVEL_LENGTH; // 10,240 px
    const diffScale = this.getDifficultyMultiplier(); // 1.00 at L1 -> 1.50 at L10

    // Guaranteed power-up supply drops along the level (halved in HARD mode: 2 drops vs 4 drops)
    if (this.difficultyMode === 'HARD') {
      this.powerUps.push(new PowerUp(3100, 280, 'double_shot'));
      this.powerUps.push(new PowerUp(7100, 360, 'shield'));
    } else {
      this.powerUps.push(new PowerUp(2100, 260, 'double_shot'));
      this.powerUps.push(new PowerUp(4600, 420, 'shield'));
      this.powerUps.push(new PowerUp(7100, 300, 'double_shot'));
      this.powerUps.push(new PowerUp(8300, 240, 'extra_life'));
    }

    switch (lvl.number) {
      case 1: // Flight school training & easy targets -> sudden alien invasion! (1.0x baseline)
        for (let x = 750; x < 5300; x += 320) {
          const y = 180 + ((x * 7) % 360);
          this.enemies.push(new Enemy(x, y, x % 640 === 0 ? 'holo_ring' : 'target_drone'));
        }
        // Sudden Alien invasion hits!
        for (let x = 5800; x < L - 500; x += 260) {
          const y = 160 + ((x * 13) % 400);
          this.enemies.push(new Enemy(x, y, 'scout_fighter'));
        }
        break;

      case 2: { // Stop patrol ships (one gets away!)
        const step = Math.round(240 / diffScale);
        for (let x = 800; x < L - 600; x += step) {
          const y = 150 + ((x * 11) % 420);
          this.enemies.push(new Enemy(x, y, 'patrol_ship'));
          if (x % (step * 3) === 0) {
            this.enemies.push(new Enemy(x + 90, Math.min(580, y + 70), 'patrol_ship'));
          }
        }
        break;
      }

      case 3: { // Free the Radar Station (Hello, Minimap!)
        for (let x = 1100; x < 5200; x += 950) {
          this.enemies.push(new Enemy(x, 600, 'radar_jammer'));
        }
        this.enemies.push(new Enemy(5500, 585, 'radar_core'));
        const step = Math.round(255 / diffScale);
        for (let x = 900; x < L - 500; x += step) {
          const y = 150 + ((x * 9) % 360);
          this.enemies.push(new Enemy(x, y, 'patrol_ship'));
        }
        break;
      }

      case 4: { // Clear the Power Station for better weapons + a mini-boss
        const step = Math.round(250 / diffScale);
        let idx = 0;
        for (let x = 850; x < L - 1100; x += step) {
          idx++;
          const y = 160 + ((x * 7) % 400);
          this.enemies.push(new Enemy(x, y, idx % 2 === 0 ? 'power_conduit' : 'scout_fighter'));
        }
        break;
      }

      case 5: { // Clear out the Research Labs
        const step = Math.round(230 / diffScale);
        let idx = 0;
        for (let x = 800; x < L - 500; x += step) {
          idx++;
          if (idx % 3 === 0) {
            this.enemies.push(new Enemy(x, 600, 'bio_pod'));
          }
          const y = 150 + ((x * 13) % 380);
          this.enemies.push(new Enemy(x, y, 'phase_drone'));
        }
        break;
      }

      case 6: { // Raid Alien Factories for a new weapon + another mini-boss
        const step = Math.round(240 / diffScale);
        let idx = 0;
        for (let x = 850; x < L - 1100; x += step) {
          idx++;
          if (idx % 2 === 0) {
            this.enemies.push(new Enemy(x, 605, 'factory_turret'));
          }
          const y = 140 + ((x * 11) % 380);
          this.enemies.push(new Enemy(x, y, 'patrol_ship'));
        }
        break;
      }

      case 7: { // Clear the Airport so humans can escape
        for (let x = 1400; x <= 8900; x += 1450) {
          this.enemies.push(new Enemy(x, 615, 'human_shuttle'));
          this.enemies.push(new Enemy(x - 160, 610, 'factory_turret'));
        }
        const step = Math.round(225 / diffScale);
        for (let x = 800; x < L - 500; x += step) {
          const y = 140 + ((x * 17) % 360);
          this.enemies.push(new Enemy(x, y, 'patrol_ship'));
        }
        break;
      }

      case 8: { // Break into the Prison, rescue folks, and take down a medium alien boss
        for (let x = 1200; x <= 8200; x += 1100) {
          this.enemies.push(new Enemy(x, 605, 'prison_cage'));
        }
        const step = Math.round(235 / diffScale);
        for (let x = 850; x < L - 1100; x += step) {
          const y = 140 + ((x * 13) % 380);
          this.enemies.push(new Enemy(x, y, 'phase_drone'));
        }
        break;
      }

      case 9: { // Smash the Alien Army Base's Tesla Coils
        for (let x = 1100; x <= 9300; x += 900) {
          this.enemies.push(new Enemy(x, 600, 'tesla_coil'));
        }
        const step = Math.round(225 / diffScale);
        for (let x = 850; x < L - 500; x += step) {
          const y = 140 + ((x * 19) % 360);
          this.enemies.push(new Enemy(x, y, 'royal_guard'));
        }
        break;
      }

      case 10: { // Final Showdown at the Giant UFO Command Palace against hard enemies and the Alien King!
        const step = Math.round(220 / diffScale); // 1.5x density -> every 147px!
        let idx = 0;
        for (let x = 850; x < L - 1200; x += step) {
          idx++;
          const y = 140 + ((x * 17) % 400);
          this.enemies.push(new Enemy(x, y, idx % 3 === 0 ? 'tesla_coil' : 'royal_guard'));
        }
        break;
      }
    }
  }

  unlockRadarMinimap() {
    if (this.radarUnlocked) return;
    this.radarUnlocked = true;
    this.earnedMedals.add('radar_liberator');
    window.audio.sfxRadarOnline();
    this.screenShake = 10;
    this.showRadioTransmission(
      'RADAR STATION LIBERATED',
      `HELLO, MINIMAP! Long-Range Radar Telemetry is now ONLINE, ${this.currentLevelData.rank} ${this.pilotName}!`,
      6.5
    );
    this.addFloatingText(this.player.worldX, this.player.y - 45, 'HELLO, MINIMAP! RADAR ONLINE!', '#00ff88');
  }

  // ==========================================================================
  // MAIN GAME LOOP
  // ==========================================================================
  loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;
    this.time += dt;

    window.input.update();

    // Global hotkey (M for Mute) when not typing name
    if (this.state !== 'NAME_ENTRY') {
      if (window.input.justPressedKeys['KeyM']) {
        window.audio.toggleMute();
      }
    }

    this.update(dt);
    this.render();

    requestAnimationFrame((ts) => this.loop(ts));
  }

  update(dt) {
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 30);
    }

    if (this.state === 'TITLE') {
      this.updateTitle();
    } else if (this.state === 'NAME_ENTRY') {
      this.updateNameEntry();
    } else if (this.state === 'BRIEFING') {
      this.updateBriefing();
    } else if (this.state === 'PLAYING') {
      this.updatePlaying(dt);
    } else if (this.state === 'PAUSED') {
      this.updatePaused();
    } else if (this.state === 'LEVEL_COMPLETE') {
      this.updateLevelComplete();
    } else if (this.state === 'GAME_OVER') {
      this.updateGameOver();
    } else if (this.state === 'VICTORY') {
      this.updateVictory();
    } else if (this.state === 'HIGH_SCORES') {
      this.updateHighScores();
    }
  }

  updateTitle() {
    window.input.consumeTypedChars();
    if (window.input.upJustPressed) {
      this.titleMenuIndex = (this.titleMenuIndex + 3) % 4;
      window.audio.sfxUiBlip(false);
    }
    if (window.input.downJustPressed) {
      this.titleMenuIndex = (this.titleMenuIndex + 1) % 4;
      window.audio.sfxUiBlip(false);
    }

    if (window.input.leftJustPressed) {
      if (this.titleMenuIndex === 0) {
        this.startingLevelSelect = (this.startingLevelSelect + 9) % 10;
      } else if (this.titleMenuIndex === 1) {
        this.toggleDifficultyMode();
      } else if (this.titleMenuIndex === 2) {
        window.audio.adjustBgmPercent(-10);
      }
      window.audio.sfxUiBlip(false);
    }

    if (window.input.rightJustPressed) {
      if (this.titleMenuIndex === 0) {
        this.startingLevelSelect = (this.startingLevelSelect + 1) % 10;
      } else if (this.titleMenuIndex === 1) {
        this.toggleDifficultyMode();
      } else if (this.titleMenuIndex === 2) {
        window.audio.adjustBgmPercent(10);
      }
      window.audio.sfxUiBlip(false);
    }

    if (window.input.confirmJustPressed) {
      window.audio.sfxUiBlip(true);
      if (this.titleMenuIndex === 0) {
        this.pilotName = '';
        this.nameGridIndex = 0;
        this.state = 'NAME_ENTRY';
        window.input.consumeTypedChars();
      } else if (this.titleMenuIndex === 1) {
        this.toggleDifficultyMode();
      } else if (this.titleMenuIndex === 2) {
        const nextSfx = window.audio.sfxPercent >= 100 ? 0 : window.audio.sfxPercent + 10;
        window.audio.sfxPercent = nextSfx;
        window.audio.setSfxVolume(nextSfx / 100);
      } else {
        this.state = 'HIGH_SCORES';
      }
    }
  }

  updateNameEntry() {
    const canLaunch = () => this.pilotName.trim().length >= 3;

    // 1. Check physical keyboard typing
    const chars = window.input.consumeTypedChars();
    for (const ch of chars) {
      if (ch === 'BACKSPACE') {
        this.pilotName = this.pilotName.slice(0, -1);
        window.audio.sfxUiBlip(false);
      } else if (ch === 'ENTER') {
        if (canLaunch()) {
          this.pilotName = this.pilotName.trim();
          window.audio.sfxUiBlip(true);
          this.startNewCampaign(this.startingLevelSelect);
          return;
        } else {
          window.audio.sfxUiBlip(false);
        }
      } else if (this.pilotName.length < 12) {
        this.pilotName += ch;
        window.audio.sfxUiBlip(false);
      }
    }

    // 2. Gamepad Stick / D-Pad 2D navigation on the 4x10 virtual arcade keyboard (indices 0..39)
    const cols = 10;
    const rows = 4;
    let curRow = Math.floor(this.nameGridIndex / cols) % rows;
    let curCol = this.nameGridIndex % cols;

    if (window.input.leftJustPressed) {
      curCol = (curCol + cols - 1) % cols;
      this.nameGridIndex = curRow * cols + curCol;
      window.audio.sfxUiBlip(false);
    }
    if (window.input.rightJustPressed) {
      curCol = (curCol + 1) % cols;
      this.nameGridIndex = curRow * cols + curCol;
      window.audio.sfxUiBlip(false);
    }
    if (window.input.upJustPressed) {
      curRow = (curRow + rows - 1) % rows;
      this.nameGridIndex = curRow * cols + curCol;
      window.audio.sfxUiBlip(false);
    }
    if (window.input.downJustPressed) {
      curRow = (curRow + 1) % rows;
      this.nameGridIndex = curRow * cols + curCol;
      window.audio.sfxUiBlip(false);
    }

    // Gamepad Start button launches only if at least 3 characters are entered
    if (window.input.padJustPressed[9]) {
      if (canLaunch()) {
        this.pilotName = this.pilotName.trim();
        window.audio.sfxUiBlip(true);
        this.startNewCampaign(this.startingLevelSelect);
      } else {
        window.audio.sfxUiBlip(false);
      }
      return;
    }

    // Gamepad B button (button 1) acts as quick Backspace/Delete
    if (window.input.padJustPressed[1]) {
      this.pilotName = this.pilotName.slice(0, -1);
      window.audio.sfxUiBlip(false);
      return;
    }

    // Gamepad A / X / RT presses the highlighted virtual key
    if (window.input.padJustPressed[0] || window.input.padJustPressed[2] || window.input.padJustPressed[7]) {
      if (this.nameGridIndex === 36) {
        // SPC
        if (this.pilotName.length < 12) {
          this.pilotName += ' ';
          window.audio.sfxUiBlip(false);
        }
      } else if (this.nameGridIndex === 37) {
        // CLR
        this.pilotName = '';
        window.audio.sfxUiBlip(false);
      } else if (this.nameGridIndex === 38) {
        // DEL
        this.pilotName = this.pilotName.slice(0, -1);
        window.audio.sfxUiBlip(false);
      } else if (this.nameGridIndex === 39) {
        // LAUNCH! (only enabled once >= 3 characters are typed)
        if (canLaunch()) {
          this.pilotName = this.pilotName.trim();
          window.audio.sfxUiBlip(true);
          this.startNewCampaign(this.startingLevelSelect);
        } else {
          window.audio.sfxUiBlip(false);
        }
      } else if (this.pilotName.length < 12) {
        const ch = this.nameChars[this.nameGridIndex] || 'A';
        this.pilotName += ch;
        window.audio.sfxUiBlip(false);
      }
    }
  }

  updateBriefing() {
    if (window.input.confirmJustPressed || window.input.fireJustPressed) {
      window.audio.sfxUiBlip(true);
      this.state = 'PLAYING';
      window.audio.playTrack(this.currentLevelData.music);
    }
  }

  updatePaused() {
    if (window.input.pauseJustPressed) {
      this.state = 'PLAYING';
      window.audio.sfxUiBlip(true);
      return;
    }
    if (window.input.upJustPressed) {
      this.pauseMenuIndex = (this.pauseMenuIndex + 4) % 5;
      window.audio.sfxUiBlip(false);
    }
    if (window.input.downJustPressed) {
      this.pauseMenuIndex = (this.pauseMenuIndex + 1) % 5;
      window.audio.sfxUiBlip(false);
    }
    if (window.input.leftJustPressed) {
      if (this.pauseMenuIndex === 1) {
        window.audio.adjustBgmPercent(-10);
        window.audio.sfxUiBlip(false);
      } else if (this.pauseMenuIndex === 2) {
        window.audio.adjustSfxPercent(-10);
        window.audio.sfxUiBlip(false);
      }
    }
    if (window.input.rightJustPressed) {
      if (this.pauseMenuIndex === 1) {
        window.audio.adjustBgmPercent(10);
        window.audio.sfxUiBlip(false);
      } else if (this.pauseMenuIndex === 2) {
        window.audio.adjustSfxPercent(10);
        window.audio.sfxUiBlip(false);
      }
    }
    if (window.input.confirmJustPressed) {
      window.audio.sfxUiBlip(true);
      if (this.pauseMenuIndex === 0) {
        this.state = 'PLAYING';
      } else if (this.pauseMenuIndex === 1) {
        const nextBgm = window.audio.bgmPercent >= 100 ? 0 : window.audio.bgmPercent + 10;
        window.audio.bgmPercent = nextBgm;
        window.audio.setMusicVolume((nextBgm / 100) * 0.48);
      } else if (this.pauseMenuIndex === 2) {
        const nextSfx = window.audio.sfxPercent >= 100 ? 0 : window.audio.sfxPercent + 10;
        window.audio.sfxPercent = nextSfx;
        window.audio.setSfxVolume(nextSfx / 100);
      } else if (this.pauseMenuIndex === 3) {
        this.loadLevel(this.currentLevelIndex);
        this.state = 'PLAYING';
      } else if (this.pauseMenuIndex === 4) {
        this.state = 'TITLE';
        window.audio.playTrack('title');
      }
    }
  }

  updatePlaying(dt) {
    if (window.input.pauseJustPressed) {
      this.pauseMenuIndex = 0;
      this.state = 'PAUSED';
      window.audio.sfxUiBlip(false);
      return;
    }

    const lvl = this.currentLevelData;
    const maxCamX = window.GAME_CONSTANTS.LEVEL_LENGTH - 1280; // 8,960

    // Scroll camera left-to-right across the 8 screens
    this.cameraX = Math.min(maxCamX, this.cameraX + this.scrollSpeed * dt);

    // Trigger scripted mid-level Radio & Story Events
    if (lvl.radioEvents) {
      lvl.radioEvents.forEach((ev, idx) => {
        let shouldTrigger = this.cameraX >= ev.x;
        if (ev.triggerOnFirstAlienInView) {
          const firstAlienOnScreen = this.enemies.some(
            (e) => !e.dead && e.type === 'scout_fighter' && e.x <= this.cameraX + 1280
          );
          shouldTrigger = firstAlienOnScreen || this.cameraX >= ev.x;
        }

        if (!this.triggeredRadioIndices.has(idx) && shouldTrigger) {
          this.triggeredRadioIndices.add(idx);
          this.showRadioTransmission(ev.speaker, ev.text(this.pilotName));

          if (ev.jamRadar) {
            this.radarUnlocked = false;
            this.screenShake = 9;
            this.addFloatingText(this.player.worldX, this.player.y - 45, 'RADAR JAMMED BY ALIEN FLEET!', '#ff2255');
          }
          if (ev.alarm) {
            window.audio.sfxAlarm();
          }
          if (ev.switchMusic) {
            window.audio.playTrack(ev.switchMusic);
          }
          if (ev.spawnEscapingPatrol) {
            // Level 2: Spawn the special Crimson Patrol Runner that escapes!
            this.enemies.push(new window.Entities.Enemy(this.cameraX + 260, 280, 'escaping_patrol'));
          }
          if (ev.unlockWeaponTier) {
            this.player.weaponTier = Math.max(this.player.weaponTier, ev.unlockWeaponTier);
            window.audio.sfxPowerup('weapon');
            this.earnedMedals.add('arsenal_master');
            const label = ev.unlockWeaponTier === 2
              ? 'WEAPON UPGRADE: HEAVY PLASMA!'
              : 'WEAPON UPGRADE: SEEKER MISSILES!';
            this.addFloatingText(this.player.worldX, this.player.y - 40, label, '#ffaa00');
          }
        }
      });
    }

    // Spawn Level Boss when reaching the final screen (Screen 8)
    if (lvl.bossType && !this.activeBoss && this.cameraX >= maxCamX - 240) {
      this.activeBoss = new window.Entities.Boss(this.cameraX + 1220, 360, lvl.bossType);
      window.audio.playTrack('boss');
    }

    // Update Radio Banner Timer
    if (this.radioBanner.timer > 0) {
      this.radioBanner.timer -= dt;
    }

    // Update Player
    this.player.update(dt, window.input, this);

    // Update Overdrive Ring
    if (this.overdriveRing) {
      this.overdriveRing.radius += 1100 * dt;
      this.overdriveRing.alpha = Math.max(0, 1 - this.overdriveRing.radius / this.overdriveRing.maxRadius);
      if (this.overdriveRing.radius >= this.overdriveRing.maxRadius) {
        this.overdriveRing = null;
      }
    }

    // Update Bullets
    for (const b of this.playerBullets) b.update(dt, this);
    for (const b of this.enemyBullets) b.update(dt, this);

    // Update Power-Ups
    for (const p of this.powerUps) p.update(dt, this);

    // Update Enemies
    for (const e of this.enemies) e.update(dt, this);

    // Update Boss
    if (this.activeBoss && !this.activeBoss.dead) {
      this.activeBoss.update(dt, this);
    }

    // Collision Detection: Player Bullets vs Enemies, Boss & Boss Homing Missiles
    for (const b of this.playerBullets) {
      if (b.dead) continue;
      for (const e of this.enemies) {
        if (e.dead || e.isFriendly) continue;
        if (Math.hypot(b.x - e.x, b.y - e.y) < b.radius + e.radius) {
          b.dead = true;
          e.takeDamage(b.damage, this);
          break;
        }
      }
      if (!b.dead && this.activeBoss && !this.activeBoss.dead) {
        if (Math.hypot(b.x - this.activeBoss.x, b.y - this.activeBoss.y) < b.radius + this.activeBoss.radius) {
          b.dead = true;
          this.activeBoss.takeDamage(b.damage, this);
        }
      }
      if (!b.dead) {
        for (const eb of this.enemyBullets) {
          if (eb.dead || eb.kind !== 'boss_missile') continue;
          if (Math.hypot(b.x - eb.x, b.y - eb.y) < b.radius + eb.radius + 4) {
            b.dead = true;
            eb.dead = true;
            this.score += 50;
            window.audio.sfxExplode('small');
            this.spawnExplosion(eb.x, eb.y, '#ff5500', 10);
            break;
          }
        }
      }
    }

    // Collision Detection: Enemy Bullets & Enemies vs Player Spacejet
    for (const b of this.enemyBullets) {
      if (b.dead) continue;
      if (Math.hypot(b.x - this.player.worldX, b.y - this.player.y) < b.radius + 18) {
        b.dead = true;
        this.player.takeHit(this);
      }
    }

    for (const e of this.enemies) {
      if (e.dead || e.isFriendly) continue;
      if (Math.hypot(e.x - this.player.worldX, e.y - this.player.y) < e.radius + 20) {
        if (e.type !== 'escaping_patrol') {
          e.takeDamage(6, this);
        }
        this.player.takeHit(this);
      }
    }

    if (this.activeBoss && !this.activeBoss.dead) {
      if (Math.hypot(this.activeBoss.x - this.player.worldX, this.activeBoss.y - this.player.y) < this.activeBoss.radius + 22) {
        this.player.takeHit(this);
      }
    }

    // Prune dead objects
    this.playerBullets = this.playerBullets.filter((b) => !b.dead);
    this.enemyBullets = this.enemyBullets.filter((b) => !b.dead);
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.powerUps = this.powerUps.filter((p) => !p.dead);

    // Update Particles & Floating Texts
    for (const pt of this.particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);

    for (const ft of this.floatingTexts) {
      ft.y -= 28 * dt;
      ft.life -= dt;
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.life > 0);

    // Check Level Finish Condition:
    // Reach the right side of the 8-screen level (worldX >= 10,000) and defeat active boss if any
    const bossCleared = !this.activeBoss || this.activeBoss.dead;
    if (bossCleared && this.player.worldX >= window.GAME_CONSTANTS.LEVEL_LENGTH - 240) {
      this.completeCurrentLevel();
    }
  }

  completeCurrentLevel() {
    const lvlNum = this.currentLevelData.number;
    this.score += 1000 * lvlNum;

    // Award Medals
    if (lvlNum === 1) this.earnedMedals.add('survivor_wings');
    if (lvlNum === 3) {
      this.radarUnlocked = true;
      this.earnedMedals.add('radar_liberator');
    }
    if (!this.tookHullDamageThisLevel) {
      this.earnedMedals.add('untouchable_ace');
    }
    if (this.shuttlesLaunched >= 3 || this.humansRescued >= 4) {
      this.earnedMedals.add('humanity_savior');
    }
    if (lvlNum === 9 && this.teslaCoilsSmashed >= 4) {
      this.earnedMedals.add('tesla_breaker');
    }

    if (lvlNum === 10) {
      // Completed Level 10 & defeated the Alien King!
      this.earnedMedals.add('kingslayer');
      if (this.score >= 75000) {
        this.earnedMedals.add('grand_admiral');
      }
      this.saveHighScore();
      this.state = 'VICTORY';
      window.audio.playTrack('victory');
    } else {
      window.audio.sfxRankUp();
      this.state = 'LEVEL_COMPLETE';
    }
  }

  triggerGameOver() {
    this.saveHighScore();
    this.gameOverMenuIndex = 0;
    this.state = 'GAME_OVER';
    window.audio.stopMusic();
  }

  updateLevelComplete() {
    if (window.input.confirmJustPressed || window.input.fireJustPressed) {
      window.audio.sfxUiBlip(true);
      this.loadLevel(this.currentLevelIndex + 1);
      this.state = 'BRIEFING';
    }
  }

  updateGameOver() {
    if (window.input.upJustPressed) {
      this.gameOverMenuIndex = (this.gameOverMenuIndex + 2) % 3;
      window.audio.sfxUiBlip(false);
    }
    if (window.input.downJustPressed) {
      this.gameOverMenuIndex = (this.gameOverMenuIndex + 1) % 3;
      window.audio.sfxUiBlip(false);
    }
    if (window.input.confirmJustPressed) {
      window.audio.sfxUiBlip(true);
      if (this.gameOverMenuIndex === 0) {
        // Continue from current level with fresh lives
        this.player.lives = 3;
        this.player.shieldHp = 2;
        this.loadLevel(this.currentLevelIndex);
        this.state = 'BRIEFING';
      } else if (this.gameOverMenuIndex === 1) {
        this.state = 'HIGH_SCORES';
        window.audio.playTrack('title');
      } else {
        this.state = 'TITLE';
        window.audio.playTrack('title');
      }
    }
  }

  updateVictory() {
    if (window.input.confirmJustPressed) {
      window.audio.sfxUiBlip(true);
      this.state = 'HIGH_SCORES';
    }
  }

  updateHighScores() {
    if (window.input.confirmJustPressed || window.input.cancelJustPressed) {
      window.audio.sfxUiBlip(true);
      this.state = 'TITLE';
    }
  }

  // ==========================================================================
  // RENDERING ALL SCREENS & OVERLAYS
  // ==========================================================================
  render() {
    this.renderer.clear();

    if (this.state === 'PLAYING' || this.state === 'PAUSED' || this.state === 'LEVEL_COMPLETE' || this.state === 'GAME_OVER') {
      this.renderer.renderWorld(this);
    }

    if (this.state === 'TITLE') {
      this.renderTitleScreen();
    } else if (this.state === 'NAME_ENTRY') {
      this.renderNameEntryScreen();
    } else if (this.state === 'BRIEFING') {
      this.renderBriefingScreen();
    } else if (this.state === 'PAUSED') {
      this.renderPauseOverlay();
    } else if (this.state === 'LEVEL_COMPLETE') {
      this.renderLevelCompleteOverlay();
    } else if (this.state === 'GAME_OVER') {
      this.renderGameOverOverlay();
    } else if (this.state === 'VICTORY') {
      this.renderVictoryScreen();
    } else if (this.state === 'HIGH_SCORES') {
      this.renderHighScoresScreen();
    }
  }

  drawAirForceTitle(ctx) {
    ctx.save();
    const centerX = 640;
    const titleY = 132;
    const titleText = 'SPACEJET DEFENDER';
    const titleFont = '900 italic 72px "Black Ops One", "Russo One", "Impact", "Arial Black", sans-serif';

    // Top Air Force Command Header & Flanking Wing Bars
    this.renderer.withNeon('#00f3ff', 10, 2, (c) => {
      c.fillStyle = '#00f3ff';
      // Left swept wing bars
      c.beginPath();
      c.moveTo(140, 52); c.lineTo(410, 52); c.lineTo(395, 58); c.lineTo(158, 58); c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(180, 63); c.lineTo(390, 63); c.lineTo(378, 68); c.lineTo(195, 68); c.closePath();
      c.fill();

      // Right swept wing bars
      c.beginPath();
      c.moveTo(1140, 52); c.lineTo(870, 52); c.lineTo(885, 58); c.lineTo(1122, 58); c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(1100, 63); c.lineTo(890, 63); c.lineTo(902, 68); c.lineTo(1085, 68); c.closePath();
      c.fill();

      c.font = 'bold 14px "Russo One", "Arial Black", sans-serif';
      c.textAlign = 'center';
      c.fillStyle = '#aaddff';
      c.fillText('★  EARTH ORBITAL AIR FORCE COMMAND  ★', centerX, 64, 440);
    });

    ctx.font = titleFont;
    ctx.textAlign = 'center';

    // 1. Solid 3D Extruded Military Block Shadow
    ctx.fillStyle = '#001836';
    for (let d = 6; d >= 1; d--) {
      ctx.fillText(titleText, centerX + d, titleY + d, 1120);
    }

    // 2. Solid Metallic Air-Force Chrome/Cyan Armor Fill
    let grad = '#00f3ff';
    if (ctx.createLinearGradient) {
      grad = ctx.createLinearGradient(0, titleY - 62, 0, titleY + 8);
      if (grad && grad.addColorStop) {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.38, '#a8f9ff');
        grad.addColorStop(0.55, '#00dcff');
        grad.addColorStop(1, '#0066cc');
      }
    }

    ctx.save();
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 18;
    ctx.fillStyle = grad;
    ctx.fillText(titleText, centerX, titleY, 1120);
    ctx.restore();

    // 3. Crisp Outer Armor Bevel Stroke
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e0ffff';
    ctx.strokeText(titleText, centerX, titleY, 1120);

    // 4. Horizontal Military Stencil Cut-Line across the solid letters
    ctx.fillStyle = '#040612';
    ctx.fillRect(110, titleY - 25, 1060, 3.5);

    ctx.restore();
  }

  renderTitleScreen() {
    const ctx = this.renderer.ctx;
    ctx.save();

    // Animated starfield & synthwave grid background
    for (const s of this.renderer.stars) {
      const sx = ((s.x - this.time * 90 * s.parallax) % 1280 + 1280) % 1280;
      ctx.fillStyle = s.color;
      ctx.fillRect(sx, s.y, s.size, s.size);
    }

    // Perspective horizon grid
    this.renderer.withNeon('#b400ff', 12, 1.5, (c) => {
      c.globalAlpha = 0.45;
      c.beginPath();
      c.moveTo(0, 520);
      c.lineTo(1280, 520);
      for (let i = -8; i <= 16; i++) {
        c.moveTo(640 + i * 55, 520);
        c.lineTo(640 + i * 220, 720);
      }
      for (let y = 540; y < 720; y += 32) {
        c.moveTo(0, y);
        c.lineTo(1280, y);
      }
      c.stroke();
    });

    // Solid Air-Force Stencil Title Logo
    this.drawAirForceTitle(ctx);

    // Story-driven Pink Strapline
    this.renderer.withNeon('#ff33aa', 16, 2, (c) => {
      c.font = 'bold 19px "Courier New", monospace';
      c.textAlign = 'center';
      c.fillText(
        'RISE FROM CADET TO ADMIRAL  ★  REPEL THE ALIEN ARMADA  ★  SAVE PLANET EARTH',
        640,
        176,
        1140
      );
    });

    // Animated Demo Spacejet in center
    this.player.worldX = 640 + Math.cos(this.time * 1.6) * 140;
    this.player.y = 260 + Math.sin(this.time * 2.4) * 24;
    this.player.tilt = Math.cos(this.time * 2.4) * 0.2;
    this.player.invulnTimer = 0;
    this.renderer.renderPlayer(this.player, 0, this.time);

    // Menu Box (780px wide, 4 items cleanly spaced)
    ctx.fillStyle = 'rgba(5, 8, 24, 0.90)';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.fillRect(250, 325, 780, 235);
    ctx.strokeRect(250, 325, 780, 235);

    const startLvl = window.GAME_CONSTANTS.LEVELS[this.startingLevelSelect];
    const modeLabel = this.difficultyMode === 'HARD'
      ? 'HARD (2X HP / BOSS MISSILES / 50% DROPS)'
      : 'EASY (STANDARD)';
    const bgmPct = window.audio.bgmPercent !== undefined ? window.audio.bgmPercent : 50;
    const sfxPct = window.audio.sfxPercent !== undefined ? window.audio.sfxPercent : 80;

    const items = [
      `START MISSION (SECTOR ${startLvl.number}: ${startLvl.rank.toUpperCase()})`,
      `DIFFICULTY MODE: < ${modeLabel} >`,
      `AUDIO MIX: BGM < ${bgmPct}% >  |  SFX [A/ENTER: ${sfxPct}%]`,
      'HIGH SCORES & MEDALS HALL OF FAME'
    ];

    items.forEach((label, idx) => {
      const active = this.titleMenuIndex === idx;
      ctx.font = active ? 'bold 19px "Courier New", monospace' : '17px "Courier New", monospace';
      ctx.fillStyle = active ? '#00ff88' : (idx === 1 && this.difficultyMode === 'HARD' ? '#ff5577' : '#aaccff');
      ctx.textAlign = 'center';
      ctx.fillText(active ? `>>> ${label} <<<` : label, 640, 366 + idx * 41, 740);
    });

    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = '#ffaa00';
    ctx.textAlign = 'center';
    ctx.fillText('TIP: Use LEFT / RIGHT on Menu Items to select Sector, Difficulty Mode, or BGM Volume!', 640, 540, 740);

    // Simplified Controls & Game Controller Status Footer
    const controllerStatus = window.input.getControllerStatus
      ? window.input.getControllerStatus()
      : (window.input.gamepadConnected ? 'CONNECTED' : 'NOT DETECTED');

    ctx.fillStyle = '#00f3ff';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText(
      `GAME CONTROLLER: ${controllerStatus}  |  GAMEPAD: Stick/D-Pad + [A/RT] Fire + [B/LT] EMP + [Start] Pause`,
      640,
      615,
      1200
    );
    ctx.fillStyle = '#88aacc';
    ctx.fillText(
      'KEYBOARD BACKUP: [WASD / Arrows] Move  |  [Space / Z] Fire  |  [X / Shift] EMP Overdrive  |  [P / Esc] Pause  |  [M] Mute',
      640,
      645,
      1200
    );

    ctx.restore();
  }

  renderNameEntryScreen() {
    const ctx = this.renderer.ctx;
    const trimmedName = this.pilotName.trim();
    const canLaunch = trimmedName.length >= 3;
    ctx.save();

    ctx.fillStyle = 'rgba(4, 8, 22, 0.95)';
    ctx.fillRect(140, 60, 1000, 600);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(140, 60, 1000, 600);

    this.renderer.withNeon('#00f3ff', 16, 2, (c) => {
      c.font = 'bold 34px "Courier New", monospace';
      c.textAlign = 'center';
      c.fillText('SPACE CADET ENLISTMENT // ENTER PILOT NAME', 640, 118, 940);
    });

    // Name Input Box
    ctx.fillStyle = '#081228';
    ctx.strokeStyle = canLaunch ? '#00ff88' : '#ffaa00';
    ctx.lineWidth = 2;
    ctx.fillRect(390, 145, 500, 56);
    ctx.strokeRect(390, 145, 500, 56);

    const cursor = Math.floor(this.time * 3) % 2 === 0 ? '_' : ' ';
    ctx.font = 'bold 30px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.pilotName}${cursor}`, 640, 183, 470);

    // Live Callsign Validation & Personalized Greeting Preview
    if (!canLaunch) {
      ctx.font = 'bold 18px "Courier New", monospace';
      ctx.fillStyle = '#ffaa00';
      ctx.fillText(
        `ENTER AT LEAST 3 CHARACTERS TO UNLOCK LAUNCH (${trimmedName.length}/3 MIN)`,
        640,
        232,
        920
      );
      ctx.font = '15px "Courier New", monospace';
      ctx.fillStyle = '#88aacc';
      ctx.fillText(
        '(Type your Pilot Callsign on Keyboard or select letters below with Gamepad)',
        640,
        258,
        920
      );
    } else {
      ctx.font = 'bold 18px "Courier New", monospace';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(`"Nice to meet you Cadet ${trimmedName}! Ready for Flight School?"`, 640, 232, 920);
      ctx.font = '15px "Courier New", monospace';
      ctx.fillStyle = '#00f3ff';
      ctx.fillText(`(Promotion Radio Preview: "A well deserved promotion, Captain ${trimmedName}!")`, 640, 258, 920);
    }

    // Virtual Arcade Letter Grid for Gamepad / Arrow Key Entry (4 rows x 10 cols = 40 keys)
    const cols = 10;
    const startX = 250;
    const startY = 305;
    const cellW = 78;
    const cellH = 54;

    for (let i = 0; i < 40; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const x = startX + c * cellW;
      const y = startY + r * cellH;
      const selected = this.nameGridIndex === i;

      let label = this.nameChars[i] || '';
      if (i === 36) label = 'SPC';
      if (i === 37) label = 'CLR';
      if (i === 38) label = 'DEL';
      if (i === 39) label = canLaunch ? 'LAUNCH!' : '3+ CHR';

      const isLockedLaunch = (i === 39 && !canLaunch);

      if (selected) {
        ctx.fillStyle = isLockedLaunch ? 'rgba(255, 85, 85, 0.15)' : 'rgba(0, 255, 136, 0.18)';
        ctx.fillRect(x, y, cellW - 8, cellH - 8);
      }

      ctx.strokeStyle = isLockedLaunch
        ? (selected ? '#ff5555' : '#445566')
        : (selected ? '#00ff88' : (i >= 36 ? '#ffaa00' : '#225577'));
      ctx.lineWidth = selected ? 2.8 : 1.2;
      ctx.strokeRect(x, y, cellW - 8, cellH - 8);

      ctx.font = selected ? 'bold 15px "Courier New", monospace' : '14px "Courier New", monospace';
      ctx.fillStyle = isLockedLaunch
        ? '#667788'
        : (selected ? '#00ff88' : (i >= 36 ? '#ffaa00' : '#cceeff'));
      ctx.textAlign = 'center';
      ctx.fillText(label, x + (cellW - 8) / 2, y + 29, cellW - 12);
    }

    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = '#00ff88';
    ctx.textAlign = 'center';
    ctx.fillText(
      'GAMEPAD: [Left Stick / D-Pad] Move  |  [A] Select Key  |  [B] Backspace  |  [START] Launch (3+ Chars)',
      640,
      582,
      940
    );

    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#00f3ff';
    ctx.fillText(
      'KEYBOARD: Type your name directly (min 3 chars) & press [ENTER] to Launch!',
      640,
      614,
      940
    );

    ctx.restore();
  }

  renderBriefingScreen() {
    const ctx = this.renderer.ctx;
    const lvl = this.currentLevelData;
    ctx.save();

    ctx.fillStyle = 'rgba(4, 8, 22, 0.94)';
    ctx.fillRect(130, 64, 1020, 592);
    ctx.strokeStyle = lvl.themeColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(130, 64, 1020, 592);

    this.renderer.withNeon(lvl.themeColor, 18, 2, (c) => {
      c.font = 'bold 21px "Courier New", monospace';
      c.textAlign = 'center';
      c.fillText(`SECTOR ${lvl.number} OF 10 // ${lvl.subtitle.toUpperCase()} // MODE: ${this.difficultyMode}`, 640, 114, 960);

      c.font = 'bold 38px "Courier New", monospace';
      c.fillText(lvl.title, 640, 162, 960);
    });

    // Rank Badge Box (widened to 760px so long rank + pilot names fit with generous padding)
    ctx.fillStyle = 'rgba(0, 243, 255, 0.1)';
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.fillRect(260, 188, 760, 48);
    ctx.strokeRect(260, 188, 760, 48);

    ctx.font = 'bold 21px "Courier New", monospace';
    ctx.fillStyle = '#00ff88';
    ctx.textAlign = 'center';
    ctx.fillText(`ACTIVE RANK: ${lvl.rank.toUpperCase()} ${this.pilotName.toUpperCase()}`, 640, 219, 730);

    // Wrap Story Briefing Text safely above the Objective Box
    const text = lvl.briefing(this.pilotName);
    ctx.font = '18px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    this.drawWrappedText(ctx, text, 640, 276, 880, 28, 5);

    // Objective & Equipment Box
    ctx.fillStyle = 'rgba(12, 18, 36, 0.7)';
    ctx.fillRect(190, 442, 900, 112);
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.strokeRect(190, 442, 900, 112);

    ctx.font = 'bold 17px "Courier New", monospace';
    ctx.fillStyle = '#ffaa00';
    this.drawWrappedText(ctx, `PRIMARY OBJECTIVE: ${lvl.objectiveText}`, 640, 474, 860, 22, 2);

    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#00f3ff';
    const radarStatus = (lvl.radarInitiallyActive || this.radarUnlocked)
      ? 'ONLINE (LONG-RANGE MINIMAP ACTIVE)'
      : 'OFFLINE (LIBERATE RADAR IN SECTOR 3)';
    ctx.fillText(`SECTOR STATUS: ACTIVE COMBAT CORRIDOR   |   RADAR TELEMETRY: ${radarStatus}`, 640, 532, 860);

    if (Math.floor(this.time * 2.5) % 2 === 0) {
      ctx.font = 'bold 21px "Courier New", monospace';
      ctx.fillStyle = '#00ff88';
      ctx.fillText('>>> PRESS [FIRE / SPACE / ENTER / GAMEPAD A] TO LAUNCH SPACEJET <<<', 640, 614, 960);
    }

    ctx.restore();
  }

  renderPauseOverlay() {
    const ctx = this.renderer.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(2, 4, 14, 0.90)';
    ctx.fillRect(300, 150, 680, 420);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(300, 150, 680, 420);

    this.renderer.withNeon('#00f3ff', 16, 2, (c) => {
      c.font = 'bold 34px "Courier New", monospace';
      c.textAlign = 'center';
      c.fillText('MISSION PAUSED', 640, 210, 620);
    });

    const bgmPct = window.audio.bgmPercent !== undefined ? window.audio.bgmPercent : 50;
    const sfxPct = window.audio.sfxPercent !== undefined ? window.audio.sfxPercent : 80;

    const items = [
      'RESUME MISSION',
      `BGM VOLUME: < ${bgmPct}% >`,
      `SFX VOLUME: < ${sfxPct}% >`,
      'RESTART CURRENT SECTOR',
      'QUIT TO TITLE SCREEN'
    ];

    items.forEach((item, idx) => {
      const active = this.pauseMenuIndex === idx;
      ctx.font = active ? 'bold 20px "Courier New", monospace' : '18px "Courier New", monospace';
      ctx.fillStyle = active ? '#00ff88' : '#cceeff';
      ctx.textAlign = 'center';
      ctx.fillText(active ? `>>> ${item} <<<` : item, 640, 275 + idx * 48, 640);
    });

    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = '#ffaa00';
    ctx.textAlign = 'center';
    ctx.fillText('TIP: Use LEFT / RIGHT or [A / ENTER] to adjust BGM & SFX Volumes', 640, 535, 640);

    ctx.restore();
  }

  renderLevelCompleteOverlay() {
    const ctx = this.renderer.ctx;
    const completedLvl = this.currentLevelData;
    const nextRank = window.GAME_CONSTANTS.RANKS[Math.min(9, this.currentLevelIndex + 1)];
    const promoQuotes = window.GAME_CONSTANTS.PROMOTION_QUOTES || {};
    const promoLine = promoQuotes[nextRank]
      ? promoQuotes[nextRank](this.pilotName)
      : `"Congratulations on your promotion, ${nextRank} ${this.pilotName}!"`;

    ctx.save();
    ctx.fillStyle = 'rgba(4, 10, 24, 0.94)';
    ctx.fillRect(180, 110, 920, 500);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.strokeRect(180, 110, 920, 500);

    this.renderer.withNeon('#00ff88', 18, 2, (c) => {
      c.font = 'bold 36px "Courier New", monospace';
      c.textAlign = 'center';
      c.fillText(`SECTOR ${completedLvl.number} CLEARED!`, 640, 172, 860);
    });

    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillStyle = '#ffaa00';
    ctx.textAlign = 'center';
    ctx.fillText(`RANK PROMOTION: ${completedLvl.rank.toUpperCase()}  >>>  ${nextRank.toUpperCase()}`, 640, 228, 860);

    // Varied Commander Promotion Line wrapped cleanly inside box
    ctx.font = 'bold 19px "Courier New", monospace';
    ctx.fillStyle = '#00f3ff';
    this.drawWrappedText(ctx, promoLine, 640, 278, 840, 27, 2);

    // Divider line
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(260, 336);
    ctx.lineTo(1020, 336);
    ctx.stroke();

    ctx.font = '18px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`SECTOR CLEAR BONUS: +${1000 * completedLvl.number} PTS`, 640, 376, 840);
    ctx.fillText(`TOTAL CAMPAIGN SCORE: ${this.score} PTS`, 640, 412, 840);
    ctx.fillText(`MEDALS EARNED SO FAR: ${this.earnedMedals.size} / ${window.GAME_CONSTANTS.MEDALS_CATALOG.length}`, 640, 448, 840);

    // Render earned/locked medal icons row
    const catalog = window.GAME_CONSTANTS.MEDALS_CATALOG;
    const spacing = 48;
    const rowStartX = 640 - ((catalog.length - 1) * spacing) / 2;
    catalog.forEach((m, idx) => {
      const unlocked = this.earnedMedals.has(m.id);
      this.renderer.renderMedalIcon(m.icon, rowStartX + idx * spacing, 492, 16, m.color, unlocked, true);
    });

    if (Math.floor(this.time * 2.5) % 2 === 0) {
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.fillStyle = '#00ff88';
      ctx.fillText('>>> PRESS [FIRE / ENTER / GAMEPAD A] FOR NEXT SECTOR <<<', 640, 558, 860);
    }

    ctx.restore();
  }

  renderGameOverOverlay() {
    const ctx = this.renderer.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(18, 4, 12, 0.94)';
    ctx.fillRect(220, 150, 840, 420);
    ctx.strokeStyle = '#ff2255';
    ctx.lineWidth = 3;
    ctx.strokeRect(220, 150, 840, 420);

    this.renderer.withNeon('#ff2255', 20, 2, (c) => {
      c.font = 'bold 42px "Courier New", monospace';
      c.textAlign = 'center';
      c.fillText('SPACEJET DOWN // GAME OVER', 640, 225, 780);
    });

    ctx.font = '20px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`PILOT: ${this.currentLevelData.rank} ${this.pilotName}   |   FINAL SCORE: ${this.score}`, 640, 290, 780);

    const opts = [
      `CONTINUE FROM SECTOR ${this.currentLevelData.number} (${this.currentLevelData.rank.toUpperCase()})`,
      'HIGH SCORES & MEDALS HALL OF FAME',
      'RETURN TO TITLE SCREEN'
    ];
    opts.forEach((opt, i) => {
      const active = this.gameOverMenuIndex === i;
      ctx.font = active ? 'bold 20px "Courier New", monospace' : '18px "Courier New", monospace';
      ctx.fillStyle = active ? '#00ff88' : '#ff99aa';
      ctx.fillText(active ? `>>> ${opt} <<<` : opt, 640, 368 + i * 48, 780);
    });

    ctx.restore();
  }

  renderVictoryScreen() {
    const ctx = this.renderer.ctx;
    ctx.save();

    ctx.fillStyle = 'rgba(4, 10, 24, 0.96)';
    ctx.fillRect(80, 36, 1120, 648);
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 3;
    ctx.strokeRect(80, 36, 1120, 648);

    this.renderer.withNeon('#ffcc00', 22, 2, (c) => {
      c.font = 'bold 36px "Courier New", monospace';
      c.textAlign = 'center';
      c.fillText(`VICTORY! EARTH SAVED BY ADMIRAL ${this.pilotName.toUpperCase()}!`, 640, 92, 1060);
    });

    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = '#00f3ff';
    ctx.textAlign = 'center';
    ctx.fillText(
      `From the last surviving Cadet in Flight School to Fleet Admiral—the Alien King's UFO Palace has fallen!`,
      640,
      130,
      1060
    );

    ctx.font = 'bold 21px "Courier New", monospace';
    ctx.fillStyle = '#00ff88';
    ctx.fillText(
      `FINAL SCORE: ${this.score} PTS   |   ENEMIES BLASTED: ${this.enemiesDestroyed}   |   HUMANS RESCUED: ${this.humansRescued + this.shuttlesLaunched * 10}`,
      640,
      168,
      1060
    );

    // Medals Showcase Grid (2 columns x 4 rows) with full Vector Medal Icons
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillStyle = '#ffaa00';
    ctx.fillText('CAMPAIGN MEDALS & HONORS', 640, 206, 1060);

    const catalog = window.GAME_CONSTANTS.MEDALS_CATALOG;
    catalog.forEach((m, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const bx = 120 + col * 530;
      const by = 224 + row * 92;
      const unlocked = this.earnedMedals.has(m.id);

      ctx.fillStyle = unlocked ? 'rgba(0, 255, 136, 0.05)' : 'rgba(10, 16, 30, 0.5)';
      ctx.fillRect(bx, by, 500, 80);
      ctx.strokeStyle = unlocked ? m.color : '#223344';
      ctx.lineWidth = unlocked ? 2 : 1;
      ctx.strokeRect(bx, by, 500, 80);

      // Render Vector Medal Icon (WINGS, RADAR, WEAPON, HEART, BOLT, CROWN, SHIELD, STAR)
      this.renderer.renderMedalIcon(m.icon, bx + 38, by + 40, 22, m.color, unlocked, true);

      ctx.textAlign = 'left';
      ctx.font = 'bold 15px "Courier New", monospace';
      ctx.fillStyle = unlocked ? m.color : '#556677';
      ctx.fillText(`${m.name} ${unlocked ? '[AWARDED!]' : '[LOCKED]'}`, bx + 74, by + 26, 412);

      ctx.font = '12px "Courier New", monospace';
      ctx.fillStyle = unlocked ? '#ddeeff' : '#445566';
      this.renderer.drawLeftWrappedText(ctx, m.desc, bx + 74, by + 46, 412, 16, 2);
    });

    ctx.textAlign = 'center';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillStyle = '#00ff88';
    ctx.fillText('>>> PRESS [FIRE / ENTER / GAMEPAD A] TO VIEW HIGH SCORES <<<', 640, 646, 1060);

    ctx.restore();
  }

  renderHighScoresScreen() {
    const ctx = this.renderer.ctx;
    ctx.save();

    ctx.fillStyle = 'rgba(4, 8, 22, 0.95)';
    ctx.fillRect(110, 50, 1060, 620);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(110, 50, 1060, 620);

    this.renderer.withNeon('#00f3ff', 18, 2, (c) => {
      c.font = 'bold 34px "Courier New", monospace';
      c.textAlign = 'center';
      c.fillText('SPACEJET DEFENDER // HALL OF FAME & MEDALS', 640, 106, 980);
    });

    // Leaderboard Column Headers
    const colPos = 152;
    const colName = 248;
    const colRank = 445;
    const colScore = 690;
    const colMedals = 835;

    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillStyle = '#ffaa00';
    ctx.textAlign = 'left';
    ctx.fillText('POS', colPos, 154);
    ctx.fillText('PILOT NAME', colName, 154);
    ctx.fillText('HIGHEST RANK', colRank, 154);
    ctx.fillText('SCORE', colScore, 154);
    ctx.fillText('MEDALS EARNED', colMedals, 154);

    // Header underline
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(140, 166);
    ctx.lineTo(1140, 166);
    ctx.stroke();

    // Build rows to render: top 8 high scores, plus if the just-added score was outside top 8, show it on a bonus row
    const rows = this.highScores.map((entry, idx) => ({ entry, posLabel: `#${idx + 1}`, isLeader: idx === 0 }));
    if (
      this.lastAddedScoreEntry &&
      this.lastAddedScoreId &&
      !this.highScores.some((e) => e.id === this.lastAddedScoreId)
    ) {
      rows.push({ entry: this.lastAddedScoreEntry, posLabel: 'LAST', isLeader: false });
    }

    rows.forEach(({ entry, posLabel, isLeader }, i) => {
      const y = 202 + i * 44;
      const isJustAdded = !!(this.lastAddedScoreId && entry.id === this.lastAddedScoreId);

      if (isJustAdded) {
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 7);
        ctx.save();
        ctx.fillStyle = `rgba(255, 238, 0, ${0.12 + pulse * 0.12})`;
        ctx.fillRect(136, y - 26, 1008, 38);
        ctx.strokeStyle = pulse > 0.4 ? '#ffee00' : '#00ff88';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = '#ffee00';
        ctx.shadowBlur = 14;
        ctx.strokeRect(136, y - 26, 1008, 38);
        ctx.restore();
      }

      const rowColor = isJustAdded ? '#ffee00' : (isLeader ? '#00ff88' : '#cceeff');
      ctx.save();
      if (isJustAdded) {
        ctx.shadowColor = '#ffee00';
        ctx.shadowBlur = 10;
      }
      ctx.font = isJustAdded ? 'bold 17px "Courier New", monospace' : '17px "Courier New", monospace';
      ctx.fillStyle = rowColor;
      ctx.textAlign = 'left';

      const posText = isJustAdded ? `►${posLabel} NEW` : posLabel;
      ctx.fillText(posText, colPos, y, 90);
      ctx.fillText(String(entry.name || 'PILOT').slice(0, 14), colName, y, 185);
      ctx.fillText(String(entry.rank || 'Cadet'), colRank, y, 235);
      ctx.fillText(String(entry.score || 0).padStart(7, '0'), colScore, y, 125);
      ctx.restore();

      // Render all 8 Medal Icons on the line right next to the score
      // (earned medals highlighted in glowing neon, unearned medals greyed out)
      const catalog = window.GAME_CONSTANTS.MEDALS_CATALOG || [];
      const earnedMedals = this.getMedalsForScoreEntry(entry);
      const earnedIds = new Set(earnedMedals.map((em) => em.id));
      catalog.forEach((m, mIdx) => {
        const isUnlocked = earnedIds.has(m.id);
        const iconX = colMedals + 14 + mIdx * 34;
        const iconY = y - 6;
        this.renderer.renderMedalIcon(m.icon, iconX, iconY, 13, m.color, isUnlocked, true);
      });
    });

    ctx.textAlign = 'center';
    ctx.font = 'bold 19px "Courier New", monospace';
    ctx.fillStyle = '#00ff88';
    ctx.fillText('>>> PRESS [ENTER / SPACE / ESC / GAMEPAD A] TO RETURN TO TITLE <<<', 640, 636, 980);

    ctx.restore();
  }

  drawWrappedText(ctx, text, centerX, startY, maxWidth, lineHeight, maxLines = 6) {
    const words = String(text).split(' ');
    let line = '';
    let y = startY;
    let linesDrawn = 0;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        linesDrawn++;
        if (linesDrawn >= maxLines) {
          ctx.fillText(line.trim() + '...', centerX, y, maxWidth);
          return;
        }
        ctx.fillText(line.trim(), centerX, y, maxWidth);
        line = words[i] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      ctx.fillText(line.trim(), centerX, y, maxWidth);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new SpacejetGame();
});
