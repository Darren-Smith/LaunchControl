class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.version = 'v1.5.1';

        // Fixed-Timestep Accumulator
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.fixedStep = 1 / 60;
        this.maxAccumulator = 0.25;

        this.camera = new Camera(this.width, this.height);
        this.mapWidth = 6000;
        this.mapHeight = 1200;
        this.levelTime = 0;
        this.totalTime = 0;

        this.engine = new Engine(this.ctx, this.width, this.height);
        this.entities = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.bossDefeatTimer = 0;
        this.allMinionsAggro = false;
        this.player = null;
        this.currentLevelIdx = 0;
        this.gameState = 'START'; // START, PLAYING, LEVEL_COMPLETE, GAME_OVER, VICTORY
        this.paused = false;

        this.score = 0;
        this.totalKills = 0;
        this.levelStats = { enemiesKilled: 0, coinsCollected: 0 };
        this.fireworks = [];
        this.floatingTexts = [];
        this.showDebug = false;

        // Audio & High Scores
        this.sfx = new SoundFX();
        this.highScoreManager = new HighScoreManager('heromaker_high_scores_v1', 10);
        this.presetNames = ['HERO', 'ARTHUR', 'VALKYR', 'LANCEL', 'MERLIN', 'EXCAL', 'ATHENA', 'KNIGHT'];
        this.presetNameIdx = 0;

        // Keyboard Input State
        this.keyInput = {
            left: false,
            right: false,
            up: false,
            attack: false
        };

        // Combined Input State (Keyboard + Gamepad)
        this.input = {
            left: false,
            right: false,
            up: false,
            attack: false
        };

        // Gamepad State Tracking
        this.gpActionsDown = {};
        this.gpPrevActionsDown = {};
        this.gpActionsJustPressed = {};
        this.gpRepeatTimer = { dir: null, timer: 0, repeating: false };
        this.connectedGamepadCount = -1;

        this.init();
        this.setupInput();
        this.setupUIEvents();
    }

    init() {
        const versionBadge = document.getElementById('game-version');
        if (versionBadge) versionBadge.textContent = this.version;
        document.querySelectorAll('.info-version-text').forEach(el => {
            el.textContent = this.version;
        });

        if (!this.player) {
            this.player = new Player(100, 300);
            this.ui = new UI(this);
        }

        this.loadLevel(this.currentLevelIdx);
        this.ui.initShop();
        this.ui.updateHeroMaker();
        this.ui.update();
        this.ui.openModal('splash-screen');
    }

    setupInput() {
        const unlockAudio = () => this.sfx.init();
        window.addEventListener('pointerdown', unlockAudio, { once: true });

        window.addEventListener('keydown', (e) => {
            this.sfx.init();
            const activeTag = document.activeElement ? document.activeElement.tagName : '';
            const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

            if (isTyping) {
                if (e.key === 'Escape') {
                    document.activeElement.blur();
                }
                return;
            }

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }

            // Global shortcuts
            if (e.key === 'i' || e.key === 'I' || e.key === '?') {
                e.preventDefault();
                if (this.ui.activeModalId === 'info-modal') {
                    this.closeSubModal();
                } else {
                    this.openInfoModal();
                }
                return;
            }

            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                this.handleBackOrPauseKey(e.key);
                return;
            }

            // If a modal is open, handle keyboard menu navigation
            if (this.ui.activeModalId) {
                if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    this.ui.moveFocus(-1);
                } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    this.ui.moveFocus(1);
                } else if (e.key === 'Enter' || e.key === ' ') {
                    this.ui.activateFocusedElement();
                } else if ((e.key === 'h' || e.key === 'H') && this.ui.activeModalId === 'splash-screen') {
                    this.openHighScoresModal();
                }
                return;
            }

            // Active Gameplay Controls
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keyInput.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keyInput.right = true;
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keyInput.up = true;
            if (e.key === ' ' || e.key === 'z' || e.key === 'Z') this.keyInput.attack = true;
            if (e.key === 'e' || e.key === 'E' || e.key === 'b' || e.key === 'B') {
                this.openShopModal();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keyInput.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keyInput.right = false;
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keyInput.up = false;
            if (e.key === ' ' || e.key === 'z' || e.key === 'Z') this.keyInput.attack = false;
        });

        window.addEventListener('gamepadconnected', () => this.updateGamepadBadge());
        window.addEventListener('gamepaddisconnected', () => this.updateGamepadBadge());
    }

    setupUIEvents() {
        const bindClick = (id, handler) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.sfx.init();
                    this.sfx.playMenuConfirm();
                    handler(e);
                });
            }
        };

        // Splash Screen
        bindClick('btn-play', () => this.startNewGame());
        bindClick('btn-splash-shop', () => this.openShopModal());
        bindClick('btn-high-scores', () => this.openHighScoresModal());
        bindClick('btn-info', () => this.openInfoModal());

        // HUD Buttons
        bindClick('hud-shop-btn', () => this.openShopModal());
        bindClick('hud-info-btn', () => this.openInfoModal());
        bindClick('hud-pause-btn', () => this.togglePause());

        // Info Modal
        bindClick('btn-info-close', () => this.closeSubModal());
        bindClick('btn-info-done', () => this.closeSubModal());

        // Pause Modal
        bindClick('btn-pause-resume', () => this.resumeGame());
        bindClick('btn-pause-shop', () => this.openShopModal());
        bindClick('btn-pause-restart', () => this.restartCurrentLevel());
        bindClick('btn-pause-info', () => this.openInfoModal());
        bindClick('btn-pause-scores', () => this.openHighScoresModal());
        bindClick('btn-pause-quit', () => this.quitToMenu());

        const sfxBtn = document.getElementById('toggle-sfx');
        if (sfxBtn) {
            this.syncToggleBtn(sfxBtn, this.sfx.sfxEnabled);
            sfxBtn.addEventListener('click', () => {
                const state = this.sfx.toggleSFX();
                this.syncToggleBtn(sfxBtn, state);
            });
        }

        const musicBtn = document.getElementById('toggle-music');
        if (musicBtn) {
            this.syncToggleBtn(musicBtn, this.sfx.musicEnabled);
            musicBtn.addEventListener('click', () => {
                const state = this.sfx.toggleMusic();
                this.syncToggleBtn(musicBtn, state);
            });
        }

        // Hero Maker Shop Modal & CharaGen Profile Import
        bindClick('close-hero-maker', () => this.closeSubModal());
        bindClick('close-hero-maker-x', () => this.closeSubModal());

        const charagenInput = document.getElementById('charagen-file-input');
        bindClick('btn-import-charagen', () => {
            if (charagenInput) charagenInput.click();
        });
        if (charagenInput) {
            charagenInput.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        if (this.player && this.player.characterRig) {
                            this.player.characterRig.loadFromJSON(evt.target.result);
                            this.player.characterRig.syncLoadout(
                                this.player.loadout,
                                this.player.buffs.atk > 0
                            );
                            this.sfx.playBuy();
                            this.ui.setShopFeedback(
                                `Imported CharaGen Hero "${this.player.characterRig.profileName}"!`,
                                'success'
                            );
                        }
                    } catch (err) {
                        console.error('CharaGen Import Error:', err);
                        this.sfx.playError();
                        this.ui.setShopFeedback('Invalid CharaGen JSON file.', 'error');
                    }
                };
                reader.readAsText(file);
                charagenInput.value = '';
            });
        }

        // Level Complete Modal
        bindClick('btn-next-level', () => this.advanceToNextLevel());
        bindClick('btn-lc-shop', () => this.openShopModal());
        bindClick('btn-lc-menu', () => this.quitToMenu());

        // High Scores Modal
        bindClick('btn-scores-close', () => this.closeSubModal());
        bindClick('btn-scores-back', () => this.closeSubModal());

        // Game Over / Victory Modal
        bindClick('btn-game-over-retry', () => this.startNewGame());
        bindClick('btn-game-over-scores', () => this.openHighScoresModal());
        bindClick('btn-game-over-menu', () => this.quitToMenu());

        // High Score Name Entry Form
        const scoreForm = document.getElementById('score-entry-form');
        if (scoreForm) {
            scoreForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sfx.playMenuConfirm();
                const input = document.getElementById('player-name-input');
                const name = input ? input.value : 'HERO';
                const stageReached = this.gameState === 'VICTORY' ? 10 : (this.currentLevelIdx + 1);
                this.highScoreManager.addScore(name, this.score, stageReached, this.totalTime);
                this.ui.update();
                this.showGameOverOrVictoryModal(this.gameState === 'VICTORY');
            });
        }

        // Backdrop click to dismiss Info, High Scores, or Shop modals
        document.querySelectorAll('#info-modal, #high-scores-modal, #hero-maker-screen').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.sfx.playMenuConfirm();
                    this.closeSubModal();
                }
            });
        });
    }

    syncToggleBtn(btn, isOn) {
        btn.textContent = isOn ? 'ON' : 'OFF';
        btn.classList.toggle('on', isOn);
    }

    handleBackOrPauseKey(key) {
        const activeModal = this.ui.activeModalId;
        if (activeModal === 'info-modal' || activeModal === 'high-scores-modal' || activeModal === 'hero-maker-screen') {
            this.sfx.playMenuConfirm();
            this.closeSubModal();
            return;
        }
        if (activeModal === 'pause-modal') {
            this.sfx.playMenuConfirm();
            this.resumeGame();
            return;
        }
        if (!activeModal && this.gameState === 'PLAYING') {
            this.togglePause();
        }
    }

    openInfoModal() {
        if (this.gameState === 'PLAYING' && !this.paused) {
            this.paused = true;
        }
        this.ui.openModal('info-modal', true);
    }

    openHighScoresModal() {
        if (this.gameState === 'PLAYING' && !this.paused) {
            this.paused = true;
        }
        const tbody = document.getElementById('high-scores-tbody');
        this.highScoreManager.renderTable(tbody);
        this.ui.openModal('high-scores-modal', true);
    }

    openShopModal() {
        if (this.gameState === 'PLAYING' && !this.paused) {
            this.paused = true;
        }
        this.ui.updateHeroMaker();
        if (this.ui.activeWardrobeTab === 'forge') {
            this.ui.setWardrobeTab('all');
        } else {
            this.ui.initShop();
        }
        this.ui.setShopFeedback('Select any clothing, armor, or weapon item below to buy or equip!', 'info');
        this.ui.openModal('hero-maker-screen', true);
    }

    closeSubModal() {
        const returnTo = this.ui.returnModalId;
        if (returnTo) {
            this.ui.openModal(returnTo, false);
        } else if (this.gameState === 'PLAYING') {
            this.paused = false;
            this.ui.closeAllModals();
        } else {
            this.ui.openModal('splash-screen', false);
        }
    }

    togglePause() {
        if (this.gameState !== 'PLAYING') return;
        if (this.paused && this.ui.activeModalId === 'pause-modal') {
            this.resumeGame();
        } else {
            this.paused = true;
            this.sfx.playMenuConfirm();
            this.ui.openModal('pause-modal', false);
        }
    }

    resumeGame() {
        if (this.gameState !== 'PLAYING') return;
        this.paused = false;
        this.keyInput.left = false;
        this.keyInput.right = false;
        this.keyInput.up = false;
        this.keyInput.attack = false;
        this.ui.closeAllModals();
    }

    restartCurrentLevel() {
        this.paused = false;
        this.loadLevel(this.currentLevelIdx);
        this.gameState = 'PLAYING';
        this.ui.closeAllModals();
        document.getElementById('hud')?.classList.remove('hidden');
        document.getElementById('hud-bottom')?.classList.remove('hidden');
        this.sfx.startMusic();
    }

    quitToMenu() {
        this.paused = false;
        this.sfx.stopMusic();
        this.gameState = 'START';
        document.getElementById('hud')?.classList.add('hidden');
        document.getElementById('hud-bottom')?.classList.add('hidden');
        this.ui.openModal('splash-screen', false);
    }

    startNewGame() {
        this.currentLevelIdx = 0;
        this.score = 0;
        this.totalKills = 0;
        this.totalTime = 0;
        this.fireworks = [];
        this.player.resetForNewRun();
        this.loadLevel(this.currentLevelIdx);
        this.paused = false;
        this.gameState = 'PLAYING';
        this.keyInput = { left: false, right: false, up: false, attack: false };
        this.ui.initShop();
        this.ui.updateHeroMaker();
        this.ui.update();
        this.ui.closeAllModals();
        document.getElementById('hud')?.classList.remove('hidden');
        document.getElementById('hud-bottom')?.classList.remove('hidden');
        this.sfx.startMusic();
    }

    advanceToNextLevel() {
        this.totalTime += this.levelTime;
        this.currentLevelIdx++;
        if (this.currentLevelIdx >= Levels.length) {
            this.handleRunEnd(true);
            return;
        }
        this.loadLevel(this.currentLevelIdx);
        this.paused = false;
        this.gameState = 'PLAYING';
        this.ui.closeAllModals();
        document.getElementById('hud')?.classList.remove('hidden');
        document.getElementById('hud-bottom')?.classList.remove('hidden');
    }

    handleRunEnd(isVictory) {
        this.paused = false;
        this.sfx.stopMusic();

        if (isVictory) {
            this.gameState = 'VICTORY';
            // Time bonus + stage completion bonus
            const timeBonus = Math.max(0, Math.floor((600 - this.totalTime) * 10));
            this.score += 2500 + timeBonus;
            this.sfx.playVictory();
        } else {
            this.gameState = 'GAME_OVER';
            this.totalTime += this.levelTime;
            this.sfx.playDefeat();
        }

        this.ui.update();

        if (this.highScoreManager.isHighScore(this.score)) {
            const scoreSpan = document.getElementById('entry-score-num');
            if (scoreSpan) scoreSpan.textContent = this.score.toLocaleString();
            const input = document.getElementById('player-name-input');
            if (input) input.value = this.presetNames[this.presetNameIdx] || 'HERO';
            this.ui.openModal('score-entry-modal', false);
        } else {
            this.showGameOverOrVictoryModal(isVictory);
        }
    }

    showGameOverOrVictoryModal(isVictory) {
        const titleEl = document.getElementById('game-over-title');
        const subEl = document.getElementById('game-over-subtitle');
        const scoreEl = document.getElementById('summary-score');
        const stageEl = document.getElementById('summary-stage');
        const killsEl = document.getElementById('summary-kills');
        const timeEl = document.getElementById('summary-time');

        if (titleEl) {
            titleEl.textContent = isVictory ? '🏆 VICTORY! 🏆' : '💀 GAME OVER';
            titleEl.className = isVictory ? 'gold-heading' : '';
            titleEl.style.color = isVictory ? '#fbbf24' : '#ef4444';
        }
        if (subEl) {
            subEl.textContent = isVictory
                ? 'You defeated Malgor, Lord of Fear and rescued the missing girl!'
                : `You fell in ${Levels[this.currentLevelIdx]?.name || 'battle'}. Forge stronger gear and try again!`;
        }
        if (scoreEl) scoreEl.textContent = this.score.toLocaleString();
        if (stageEl) stageEl.textContent = `${Math.min(10, this.currentLevelIdx + 1)} / 10`;
        if (killsEl) killsEl.textContent = String(this.totalKills);
        if (timeEl) timeEl.textContent = this.highScoreManager.formatTime(this.totalTime);

        this.ui.openModal('game-over-modal', false);
    }

    updateCursorVisibility() {
        const hasOpenModal = Boolean(this.ui && this.ui.activeModalId);
        const isGameplay = this.gameState === 'PLAYING' && !this.paused && !hasOpenModal;
        document.body.classList.toggle('in-game-playing', isGameplay);
        document.body.classList.toggle('hide-cursor', isGameplay);
    }

    // ==========================================
    // GAMEPAD CONTROLLER SUPPORT
    // ==========================================
    isButtonPressed(gp, index, threshold = 0.3) {
        if (!gp || !gp.buttons || !gp.buttons[index]) return false;
        const btn = gp.buttons[index];
        return Boolean(btn.pressed || btn.value > threshold);
    }

    readGamepadActions(gp) {
        if (!gp) {
            return {
                left: false, right: false, up: false, attack: false, shop: false,
                menuUp: false, menuDown: false, menuLeft: false, menuRight: false,
                menuConfirm: false, menuBack: false, pause: false
            };
        }
        const axisX = (gp.axes && gp.axes[0]) || 0;
        const axisY = (gp.axes && gp.axes[1]) || 0;

        return {
            // Gameplay
            left: axisX < -0.35 || this.isButtonPressed(gp, 14),
            right: axisX > 0.35 || this.isButtonPressed(gp, 15),
            up: axisY < -0.48 || this.isButtonPressed(gp, 0) || this.isButtonPressed(gp, 4) || this.isButtonPressed(gp, 6) || this.isButtonPressed(gp, 12),
            attack: this.isButtonPressed(gp, 1) || this.isButtonPressed(gp, 2) || this.isButtonPressed(gp, 5) || this.isButtonPressed(gp, 7),
            shop: this.isButtonPressed(gp, 3),

            // Menu & Pause
            menuUp: axisY < -0.48 || this.isButtonPressed(gp, 12),
            menuDown: axisY > 0.48 || this.isButtonPressed(gp, 13),
            menuLeft: axisX < -0.48 || this.isButtonPressed(gp, 14),
            menuRight: axisX > 0.48 || this.isButtonPressed(gp, 15),
            menuConfirm: this.isButtonPressed(gp, 2) || this.isButtonPressed(gp, 0), // Button 3 primary confirm
            menuBack: this.isButtonPressed(gp, 1), // Button 2 back/cancel
            pause: this.isButtonPressed(gp, 9) || this.isButtonPressed(gp, 8) // Start strictly for pause/resume
        };
    }

    updateGamepadBadge(connectedPads) {
        const pads = connectedPads || (navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : []);
        if (pads.length === this.connectedGamepadCount) return;
        this.connectedGamepadCount = pads.length;

        const badge = document.getElementById('gamepad-badge');
        const splashHint = document.getElementById('splash-gamepad-status');
        if (badge) {
            if (pads.length > 0) {
                badge.textContent = '🎮 Pad Ready';
                badge.classList.add('connected');
            } else {
                badge.textContent = '🎮 Pad';
                badge.classList.remove('connected');
            }
        }
        if (splashHint) {
            splashHint.textContent = pads.length > 0
                ? '🎮 Controller Connected! Use D-Pad/Stick + Button 3 (Blue) to Confirm, Start to Pause'
                : '🎮 Gamepad Supported — Button 3 (Blue) to Confirm, Start to Pause';
        }
    }

    triggerRumble(durationMs = 80, strongMagnitude = 0.4, weakMagnitude = 0.4) {
        try {
            const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
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
            // Ignore unsupported vibration hardware
        }
    }

    pollGamepads(dt) {
        const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
        this.updateGamepadBadge(pads);
        const gp = pads[0] || null;

        this.gpPrevActionsDown = { ...this.gpActionsDown };
        this.gpActionsDown = this.readGamepadActions(gp);
        this.gpActionsJustPressed = {};

        let anyPressed = false;
        for (const key of Object.keys(this.gpActionsDown)) {
            this.gpActionsJustPressed[key] = Boolean(this.gpActionsDown[key] && !this.gpPrevActionsDown[key]);
            if (this.gpActionsJustPressed[key]) anyPressed = true;
        }

        if (anyPressed) {
            this.sfx.init();
        }

        // Start button strictly for Pause / Resume
        if (this.gpActionsJustPressed.pause) {
            if (this.ui.activeModalId === 'pause-modal') {
                this.sfx.playMenuConfirm();
                this.resumeGame();
                return;
            } else if (!this.ui.activeModalId && this.gameState === 'PLAYING') {
                this.togglePause();
                return;
            }
        }

        // If a modal is open, handle controller modal navigation
        if (this.ui.activeModalId) {
            const modalId = this.ui.activeModalId;

            // Directional auto-repeat (0.36s hold delay, 0.15s repeat)
            let activeDir = null;
            if (this.gpActionsDown.menuUp) activeDir = 'up';
            else if (this.gpActionsDown.menuDown) activeDir = 'down';
            else if (this.gpActionsDown.menuLeft) activeDir = 'left';
            else if (this.gpActionsDown.menuRight) activeDir = 'right';

            let stepDir = null;
            if (!activeDir) {
                this.gpRepeatTimer = { dir: null, timer: 0, repeating: false };
            } else if (this.gpRepeatTimer.dir !== activeDir) {
                this.gpRepeatTimer = { dir: activeDir, timer: 0, repeating: false };
                stepDir = activeDir;
            } else {
                this.gpRepeatTimer.timer += dt;
                const threshold = this.gpRepeatTimer.repeating ? 0.15 : 0.36;
                if (this.gpRepeatTimer.timer >= threshold) {
                    this.gpRepeatTimer.timer -= threshold;
                    this.gpRepeatTimer.repeating = true;
                    stepDir = activeDir;
                }
            }

            if (stepDir) {
                if (modalId === 'score-entry-modal' && (stepDir === 'left' || stepDir === 'right')) {
                    const delta = stepDir === 'right' ? 1 : -1;
                    this.presetNameIdx = (this.presetNameIdx + delta + this.presetNames.length) % this.presetNames.length;
                    const input = document.getElementById('player-name-input');
                    if (input) input.value = this.presetNames[this.presetNameIdx];
                    this.sfx.playMenuMove();
                } else if (modalId === 'info-modal' || modalId === 'high-scores-modal') {
                    const scrollBody = document.querySelector(`#${modalId} .modal-body.scrollable`);
                    if (scrollBody && (stepDir === 'up' || stepDir === 'down')) {
                        scrollBody.scrollBy({ top: stepDir === 'down' ? 70 : -70, behavior: 'smooth' });
                    }
                } else {
                    const delta = (stepDir === 'down' || stepDir === 'right') ? 1 : -1;
                    this.ui.moveFocus(delta);
                }
            }

            if (this.gpActionsJustPressed.menuConfirm) {
                if (modalId === 'info-modal' || modalId === 'high-scores-modal') {
                    this.sfx.playMenuConfirm();
                    this.closeSubModal();
                } else {
                    this.ui.activateFocusedElement();
                }
            } else if (this.gpActionsJustPressed.menuBack) {
                this.handleBackOrPauseKey('Escape');
            }
            return;
        }

        // Gameplay shortcut to open Hero Maker Shop with Button 4 (Y)
        if (this.gpActionsJustPressed.shop && this.gameState === 'PLAYING' && !this.paused) {
            this.openShopModal();
            return;
        }

        // Merge Keyboard + Gamepad Gameplay Inputs
        this.input.left = Boolean(this.keyInput.left || this.gpActionsDown.left);
        this.input.right = Boolean(this.keyInput.right || this.gpActionsDown.right);
        this.input.up = Boolean(this.keyInput.up || this.gpActionsDown.up);
        this.input.attack = Boolean(this.keyInput.attack || this.gpActionsDown.attack);
    }

    loadLevel(idx) {
        if (idx >= Levels.length) {
            this.handleRunEnd(true);
            return;
        }

        const level = Levels[idx];
        this.mapWidth = level.width || 6000;
        this.mapHeight = level.height || 1200;
        this.engine.mapWidth = this.mapWidth;
        this.engine.mapHeight = this.mapHeight;

        // Reset entities & projectiles
        this.entities = [this.player];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.floatingTexts = [];
        this.bossDefeatTimer = 0;
        this.allMinionsAggro = false;

        // Reset Level Stats
        this.levelStats = { enemiesKilled: 0, coinsCollected: 0 };
        this.levelTime = 0;

        // Position player on ground floor (y = 1020 - 60 = 960)
        const groundY = (level.platforms && level.platforms[0] && level.platforms[0].y) || 1020;
        this.player.x = 80;
        this.player.y = groundY - this.player.height;
        this.player.prevY = this.player.y;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.grounded = true;

        // Snap camera immediately to Hero so level starts framed cleanly
        this.camera.snapTo(this.player, this.mapWidth, this.mapHeight);

        // Load platforms
        this.engine.platforms = level.platforms;

        // Load world & cloud pickups (coins, chests, potions, power-ups)
        if (level.pickups) {
            level.pickups.forEach(p => {
                this.entities.push(new Collectible(p.x, p.y, p.type, p.value, true));
            });
        }

        // Load enemies
        level.enemies.forEach(e => {
            this.entities.push(new Enemy(e.x, e.y, e.type));
        });

        // Load sprite-matched stage boss safely on top of ground
        if (level.bossSpawn) {
            const bossY = groundY - 96;
            this.entities.push(
                new Boss(
                    level.bossSpawn.x,
                    bossY,
                    level.boss,
                    level.id,
                    level.bossSprite,
                    level.bossAura
                )
            );
        }

        if (this.ui) {
            this.ui.updateHeroMaker();
            this.ui.update();
        }
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.loop(time));
    }

    loop(time) {
        try {
            const rawDt = Math.max(0, (time - this.lastTime) / 1000);
            const dt = Math.min(rawDt, this.maxAccumulator);
            this.lastTime = time;

            // Poll Gamepad every animation frame
            this.pollGamepads(dt);

            if (this.gameState === 'PLAYING' && !this.paused && !this.ui.activeModalId) {
                this.accumulator += dt;
                while (this.accumulator >= this.fixedStep) {
                    this.update(this.fixedStep);
                    this.levelTime += this.fixedStep;
                    this.accumulator -= this.fixedStep;
                }
            } else {
                this.accumulator = 0;
                this.updateBackgroundEffects(dt);
            }

            this.draw();
        } catch (e) {
            console.error('Game Loop Error:', e);
        }
        requestAnimationFrame((t) => this.loop(t));
    }

    updateBackgroundEffects(dt) {
        if (this.ui && this.ui.activeModalId === 'hero-maker-screen') {
            this.ui.renderRefitPreview(dt);
        }
        if (this.gameState === 'VICTORY') {
            if (Math.random() < 0.08) {
                this.fireworks.push({
                    x: Math.random() * this.width,
                    y: this.height,
                    vx: (Math.random() - 0.5) * 80,
                    vy: -(Math.random() * 450 + 280),
                    color: `hsl(${Math.random() * 360}, 100%, 60%)`,
                    life: 2.0
                });
            }
            for (let i = this.fireworks.length - 1; i >= 0; i--) {
                const fw = this.fireworks[i];
                fw.x += fw.vx * dt;
                fw.y += fw.vy * dt;
                fw.vy += 200 * dt;
                fw.life -= dt;
                if (fw.life <= 0) this.fireworks.splice(i, 1);
            }
        }
    }

    update(dt) {
        // Update active power-up timers
        this.player.updateBuffs(dt);

        // Player movement & jump
        const jumped = this.player.handleInput(this.input);
        if (jumped) {
            this.sfx.playJump();
        }

        // Sword Attack
        if (this.input.attack && !this.player.attacking) {
            this.player.attacking = true;
            this.sfx.playAttack();
            setTimeout(() => {
                if (this.player) this.player.attacking = false;
            }, 240);

            const hitboxX = this.player.facing === -1
                ? this.player.x - 46
                : this.player.x + this.player.width;

            const hitbox = {
                x: hitboxX,
                y: this.player.y - 4,
                width: 46,
                height: 68,
                damage: this.player.getEffectiveDamage(),
                life: 0.12,
                hitSet: new Set()
            };
            this.projectiles.push(hitbox);
        }

        // Physics update
        this.engine.update(dt, this.entities);

        // Camera follow
        this.camera.follow(this.player, this.mapWidth, this.mapHeight);

        // Entities AI update & 90% Stage Minion Rush trigger
        const minions = this.entities.filter(e => e instanceof Enemy && !(e instanceof Boss));
        const minionCount = minions.length;

        if (!this.allMinionsAggro && this.player.x >= this.mapWidth * 0.9) {
            this.allMinionsAggro = true;
            if (minionCount > 0) {
                this.floatingTexts.push({
                    x: this.player.x + this.player.width / 2,
                    y: this.player.y - 24,
                    text: `📯 REMAINING MINIONS INCOMING (${minionCount})!`,
                    color: '#fbbf24',
                    life: 1.5
                });
                // Pull any very distant off-screen stragglers closer to the left edge of the camera so the player doesn't wait long
                minions.forEach((m, idx) => {
                    const minSpawnX = Math.max(0, this.camera.x - 140 - (idx * 85));
                    if (m.x < minSpawnX) {
                        m.x = minSpawnX;
                    }
                });
            }
        }

        this.entities.forEach(entity => {
            if (entity instanceof Boss) {
                entity.invulnerable = minionCount > 0;
                entity.update(dt, this.player);
            } else if (entity instanceof Enemy) {
                entity.update(dt, this.player, this.allMinionsAggro);
            } else {
                entity.update(dt, this.player);
            }

            // Spawn Boss energy bolt if ready
            if (entity instanceof Boss && entity.pendingShot) {
                entity.pendingShot = false;
                const dir = (this.player.x < entity.x) ? -1 : 1;
                this.enemyProjectiles.push({
                    x: dir === 1 ? entity.x + entity.width : entity.x - 24,
                    y: entity.y + 42,
                    width: 24,
                    height: 14,
                    vx: dir * 350,
                    damage: Math.max(12, Math.round(entity.damage * 0.7)),
                    color: entity.auraColor || '#4ade80',
                    life: 2.5
                });
            }
        });

        // Player attack hitboxes lifecycle
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].life -= dt;
            if (this.projectiles[i].life <= 0) {
                this.projectiles.splice(i, 1);
            }
        }

        // Boss projectiles lifecycle & collision
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const ep = this.enemyProjectiles[i];
            ep.x += ep.vx * dt;
            ep.life -= dt;
            if (ep.life <= 0) {
                this.enemyProjectiles.splice(i, 1);
                continue;
            }
            if (this.checkCollision(this.player, ep)) {
                this.enemyProjectiles.splice(i, 1);
                this.damagePlayer(ep.damage);
            }
        }

        // Floating damage texts lifecycle
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y -= 52 * dt;
            ft.life -= dt;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        // Combat & Collectibles
        this.checkCombat();

        // Boss defeat celebration timer (lets player see coin explosion fly into Hero!)
        if (this.bossDefeatTimer > 0) {
            this.bossDefeatTimer -= dt;
            if (this.bossDefeatTimer <= 0) {
                this.bossDefeatTimer = 0;
                this.autoCollectCoins();
                this.onStageBossDefeated();
            }
        }

        // Update HUD
        if (this.ui) this.ui.update();
    }

    damagePlayer(rawEnemyDamage) {
        if (this.player.invulnerable || this.bossDefeatTimer > 0) return;

        let reduced = (rawEnemyDamage || 10) - this.player.defense;
        if (this.player.buffs && this.player.buffs.def > 0) {
            reduced = Math.floor(reduced * 0.5);
        }
        const actualDamage = Math.max(1, reduced);
        this.player.hp -= actualDamage;
        this.sfx.playHurt();
        this.triggerRumble(140, 0.7, 0.5);

        this.floatingTexts.push({
            x: this.player.x + this.player.width / 2,
            y: this.player.y - 10,
            text: `-${actualDamage}`,
            color: '#ef4444',
            life: 0.9
        });

        if (this.player.hp <= 0) {
            this.player.hp = 0;
            this.handleRunEnd(false);
            return;
        }

        this.player.invulnerable = true;
        setTimeout(() => {
            if (this.player) this.player.invulnerable = false;
        }, 1000);
    }

    collectPickup(entity) {
        const cx = entity.x + entity.width / 2;
        const cy = entity.y;

        if (entity.type === 'coin') {
            this.player.coins += entity.value;
            this.levelStats.coinsCollected += entity.value;
            this.score += entity.value * 5;
            this.sfx.playCoin();
            this.floatingTexts.push({
                x: cx,
                y: cy,
                text: `+${entity.value} 💰`,
                color: '#fbbf24',
                life: 0.95
            });
        } else if (entity.type === 'chest') {
            this.player.coins += entity.value;
            this.levelStats.coinsCollected += entity.value;
            this.score += 500 + entity.value * 5;
            this.sfx.playChest();
            this.triggerRumble(110, 0.5, 0.4);
            this.floatingTexts.push({
                x: cx,
                y: cy - 10,
                text: `💎 CHEST +${entity.value} 💰!`,
                color: '#fde047',
                life: 1.3
            });
        } else if (entity.type === 'potion') {
            this.player.hp = Math.min(this.player.hp + entity.value, this.player.maxHp);
            this.score += 75;
            this.sfx.playPotion();
            this.floatingTexts.push({
                x: cx,
                y: cy,
                text: `+${entity.value} HP ❤`,
                color: '#4ade80',
                life: 1.0
            });
        } else if (entity.type === 'powerup_atk') {
            this.player.buffs.atk = 12;
            this.score += 150;
            this.sfx.playPowerup();
            this.floatingTexts.push({
                x: cx,
                y: cy - 8,
                text: '⚔ 2× ATTACK FURY (12s)!',
                color: '#fb923c',
                life: 1.3
            });
        } else if (entity.type === 'powerup_spd') {
            this.player.buffs.spd = 12;
            this.score += 150;
            this.sfx.playPowerup();
            this.floatingTexts.push({
                x: cx,
                y: cy - 8,
                text: '⚡ SWIFT SPEED & JUMP (12s)!',
                color: '#38bdf8',
                life: 1.3
            });
        } else if (entity.type === 'powerup_def') {
            this.player.buffs.def = 12;
            this.score += 150;
            this.sfx.playPowerup();
            this.floatingTexts.push({
                x: cx,
                y: cy - 8,
                text: '🛡 AEGIS SHIELD (12s)!',
                color: '#4ade80',
                life: 1.3
            });
        }
    }

    checkCombat() {
        // 1. Player vs Collectibles or Enemies
        for (let index = this.entities.length - 1; index >= 0; index--) {
            const entity = this.entities[index];
            if (!entity || entity === this.player) continue;

            if (this.checkCollision(this.player, entity)) {
                if (entity instanceof Collectible) {
                    this.collectPickup(entity);
                    this.entities.splice(index, 1);
                    continue;
                }

                // Enemy damages player
                this.damagePlayer(entity.damage || 10);
            }
        }

        // 2. Player Attack Hitboxes vs Enemies & Chests
        this.projectiles.forEach(p => {
            for (let i = this.entities.length - 1; i >= 0; i--) {
                const entity = this.entities[i];
                if (!entity || entity === this.player) continue;

                // Allow sword swing to pop open Treasure Chests too!
                if (entity instanceof Collectible && entity.type === 'chest') {
                    if (this.checkCollision(p, entity)) {
                        this.collectPickup(entity);
                        this.entities.splice(i, 1);
                    }
                    continue;
                }

                if (!(entity instanceof Enemy)) continue;
                if (p.hitSet && p.hitSet.has(entity)) continue;

                if (this.checkCollision(p, entity)) {
                    if (p.hitSet) p.hitSet.add(entity);

                    if (entity.invulnerable) {
                        this.floatingTexts.push({
                            x: entity.x + entity.width / 2,
                            y: entity.y - 12,
                            text: 'SHIELDED! (Slay Minions)',
                            color: '#38bdf8',
                            life: 0.85
                        });
                        continue;
                    }

                    entity.hp -= p.damage;
                    this.sfx.playHit();
                    this.triggerRumble(55, 0.25, 0.25);

                    this.floatingTexts.push({
                        x: entity.x + entity.width / 2,
                        y: entity.y,
                        text: `-${p.damage}`,
                        color: '#ef4444',
                        life: 1.0
                    });

                    entity.applyKnockback(this.player.x < entity.x ? 220 : -220);

                    if (entity.hp <= 0) {
                        const isBoss = entity instanceof Boss;
                        this.entities.splice(i, 1);
                        this.levelStats.enemiesKilled++;
                        this.totalKills++;
                        this.score += isBoss ? (500 + (this.currentLevelIdx + 1) * 150) : ((entity.xpValue || 1) * 100);

                        // Drop loot
                        if (!isBoss) {
                            if (Math.random() < 0.72) {
                                const val = (entity.xpValue || 1) * 10;
                                this.entities.push(new Collectible(entity.x + 15, entity.y + 10, 'coin', val, false));
                            }
                            if (Math.random() < 0.16) {
                                this.entities.push(new Collectible(entity.x + 25, entity.y + 10, 'potion', 50, false));
                            }
                        } else {
                            // Boss defeated! Spawn visible coin shower & celebrate before modal opens!
                            this.triggerRumble(260, 0.9, 0.8);
                            this.sfx.playStageClear();
                            this.enemyProjectiles = [];
                            const coinValue = 15 + (this.currentLevelIdx * 5);
                            for (let k = 0; k < 16; k++) {
                                const coin = new Collectible(
                                    entity.x + (Math.random() * 80 - 20),
                                    entity.y + (Math.random() * 40 - 20),
                                    'coin',
                                    coinValue,
                                    false
                                );
                                coin.magnetOverride = true;
                                this.entities.push(coin);
                            }
                            this.floatingTexts.push({
                                x: entity.x + entity.width / 2,
                                y: entity.y - 20,
                                text: `👑 ${entity.name} DEFEATED!`,
                                color: '#fde047',
                                life: 1.35
                            });
                            this.bossDefeatTimer = 1.35;
                        }
                    }
                }
            }
        });
    }

    onStageBossDefeated() {
        if (this.currentLevelIdx >= Levels.length - 1) {
            this.totalTime += this.levelTime;
            this.handleRunEnd(true);
            return;
        }

        this.gameState = 'LEVEL_COMPLETE';

        const level = Levels[this.currentLevelIdx];
        const titleEl = document.getElementById('level-complete-title');
        const subEl = document.getElementById('level-complete-subtitle');
        const enemiesEl = document.getElementById('lc-enemies');
        const coinsEl = document.getElementById('lc-coins');
        const timeEl = document.getElementById('lc-time');
        const scoreEl = document.getElementById('lc-score');

        if (titleEl) titleEl.textContent = `Stage ${level.id}: ${level.name} Cleared!`;
        if (subEl) subEl.textContent = `${level.boss} defeated & all remaining gold collected!`;
        if (enemiesEl) enemiesEl.textContent = String(this.levelStats.enemiesKilled);
        if (coinsEl) coinsEl.textContent = `💰 ${this.levelStats.coinsCollected}`;
        if (timeEl) timeEl.textContent = this.highScoreManager.formatTime(this.levelTime);
        if (scoreEl) scoreEl.textContent = this.score.toLocaleString();

        this.ui.update();
        this.ui.openModal('level-complete-modal', false);
    }

    autoCollectCoins() {
        this.entities.forEach(entity => {
            if (entity instanceof Collectible && entity.type === 'coin') {
                this.player.coins += entity.value;
                this.levelStats.coinsCollected += entity.value;
                this.score += entity.value * 5;
            }
        });
        this.entities = this.entities.filter(e => !(e instanceof Collectible && e.type === 'coin'));
    }

    checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.textAlign = 'left';

        const level = Levels[this.currentLevelIdx] || Levels[0];

        // 1. Draw multi-layer parallax sky, clouds, mountains, and stage props
        this.engine.drawScenery(this.camera, level, this.levelTime);

        // 2. Draw textured ground, mid-platforms, and cloud islands
        this.engine.draw(this.camera, level, this.levelTime);

        // 3. Draw entities (collectibles, enemies, boss, hero)
        this.entities.forEach(entity => entity.draw(this.ctx, this.camera));

        // 4. Draw Boss energy bolts
        this.enemyProjectiles.forEach(ep => {
            this.ctx.save();
            this.ctx.fillStyle = ep.color || '#4ade80';
            this.ctx.beginPath();
            this.ctx.roundRect(ep.x - this.camera.x, ep.y - this.camera.y, ep.width, ep.height, 7);
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            this.ctx.restore();
        });

        // 5. Subtle attack reach indicator (main slash arc is rendered on the CharaGen rig)
        if (this.showDebug) {
            this.ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)';
            this.projectiles.forEach(p => {
                this.ctx.strokeRect(p.x - this.camera.x, p.y - this.camera.y, p.width, p.height);
            });
        }

        // 6. Draw floating damage / loot numbers
        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 19px sans-serif';
        this.floatingTexts.forEach(ft => {
            this.ctx.globalAlpha = Math.max(0, Math.min(1, ft.life));
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(ft.text, ft.x - this.camera.x, ft.y - this.camera.y);
            this.ctx.fillStyle = ft.color || '#ef4444';
            this.ctx.fillText(ft.text, ft.x - this.camera.x, ft.y - this.camera.y);
        });
        this.ctx.restore();

        // 7. Victory scene & fireworks on canvas backdrop
        if (this.gameState === 'VICTORY') {
            this.ctx.save();
            this.fireworks.forEach(fw => {
                this.ctx.fillStyle = fw.color;
                this.ctx.beginPath();
                this.ctx.arc(fw.x, fw.y, 5, 0, Math.PI * 2);
                this.ctx.fill();
            });
            // Draw Hero & Rescued Girl on pedestal
            if (this.player && this.player.characterRig && this.player.characterRig.loaded) {
                this.player.characterRig.draw(this.ctx, this.width / 2 - 35, 620, 1, 76, false);
            } else {
                this.ctx.fillStyle = this.player.armor.color || '#3b82f6';
                this.ctx.fillRect(this.width / 2 - 55, 560, 44, 76);
            }
            this.ctx.fillStyle = '#f472b6';
            this.ctx.fillRect(this.width / 2 + 15, 556, 36, 64);
            this.ctx.restore();
        }
    }
}
