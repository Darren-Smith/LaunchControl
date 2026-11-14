import { Fighter } from './Fighter.js';
import { Miner } from './Miner.js';
import { MiningSystem } from './MiningSystem.js';
import { Monster } from './Monster.js';
import { Boss } from './Boss.js';
import { MineScene } from './MineScene.js';
import { SoundFX } from './SoundFX.js';

class HighScoreManager {
    constructor(storageKey = 'mining_buddies_scores', maxEntries = 10, apiEndpoint = '/api/scores') {
        this.key = storageKey;
        this.max = maxEntries;
        this.apiEndpoint = apiEndpoint;
        this.scores = this.loadLocal();
        this.lastInsertedId = null;
        this.isSubmitting = false;
        this.syncFromServer();
    }

    dedupe(list) {
        if (!Array.isArray(list)) return [];
        const seen = new Set();
        const out = [];
        for (const item of list) {
            if (!item || typeof item !== 'object') continue;
            if (item.id) {
                if (seen.has(item.id)) continue;
                seen.add(item.id);
            }
            out.push(item);
        }
        return out.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, this.max);
    }

    loadLocal() {
        try {
            const raw = localStorage.getItem(this.key);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return this.dedupe(parsed);
                }
            }
        } catch {}
        return this.getDefaults();
    }

    getDefaults() {
        return [
            { id: 'd1', name: 'Amy and Joe', score: 18500, diamonds: 1000, date: '2026-11-01' },
            { id: 'd2', name: 'Sam & Max', score: 14200, diamonds: 1000, date: '2026-11-01' },
            { id: 'd3', name: 'Delver Bros', score: 9600, diamonds: 620, date: '2026-11-01' }
        ];
    }

    async syncFromServer() {
        try {
            const res = await fetch(this.apiEndpoint, { cache: 'no-store' });
            if (res.ok) {
                const serverScores = await res.json();
                if (Array.isArray(serverScores) && serverScores.length > 0) {
                    this.scores = this.dedupe(serverScores);
                    localStorage.setItem(this.key, JSON.stringify(this.scores));
                }
            }
        } catch {}
    }

    isHighScore(score) {
        if (score <= 0) return false;
        if (this.scores.length < this.max) return true;
        return score > (this.scores[this.scores.length - 1].score || 0);
    }

    async addScore(name, score, diamonds = 0) {
        if (this.isSubmitting) return this.lastInsertedId;
        this.isSubmitting = true;

        const entryId = 'score_' + Date.now();
        const cleanName = (String(name || '').trim() || 'Amy and Joe').slice(0, 20);
        const entry = {
            id: entryId,
            name: cleanName,
            score: Math.floor(score),
            diamonds: Math.floor(diamonds),
            date: new Date().toISOString().split('T')[0]
        };

        this.scores.push(entry);
        this.scores = this.dedupe(this.scores);
        this.lastInsertedId = entryId;

        try {
            const res = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            });
            if (res.ok) {
                const updated = await res.json();
                if (Array.isArray(updated) && updated.length > 0) {
                    this.scores = this.dedupe(updated);
                }
            }
        } catch {}

        try {
            localStorage.setItem(this.key, JSON.stringify(this.scores));
        } catch {}

        this.isSubmitting = false;
        return entryId;
    }

    renderTable(tbodyElement) {
        if (!tbodyElement) return;
        this.scores = this.dedupe(this.scores);
        tbodyElement.innerHTML = this.scores.map((entry, idx) => {
            const isNew = entry.id === this.lastInsertedId;
            const dia = entry.diamonds !== undefined ? `${entry.diamonds} 💎` : '—';
            return `
                <tr class="${isNew ? 'row-new-entry' : ''}">
                    <td>#${idx + 1}</td>
                    <td>${entry.name} ${isNew ? '<span class="new-pill">NEW!</span>' : ''}</td>
                    <td>${Number(entry.score || 0).toLocaleString()}</td>
                    <td>${dia}</td>
                    <td>${entry.date || ''}</td>
                </tr>
            `;
        }).join('');
    }
}

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.sfx = new SoundFX();
        this.scene = new MineScene(this.width, this.height);
        this.highScores = new HighScoreManager();

        // Both players are full Miners who can strike both rocks and rock monsters!
        this.miner = new Miner(this, {
            id: 1,
            name: 'Miner 1',
            x: 320,
            y: 350,
            color: '#f59e0b',
            hpBarId: 'miner1-health-fill',
            hpTextId: 'miner1-hp-text'
        });
        this.fighter = new Fighter(this);
        this.miningSystem = new MiningSystem(this);
        this.enemies = [];

        // Pooled particles & floating text
        this.particles = Array.from({ length: 280 }, () => ({
            active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 3, color: '#fff'
        }));
        this.floatingTexts = [];

        this.lastTime = 0;
        this.accumulator = 0;
        this.fixedStepMs = 1000 / 60; // 16.667ms fixed simulation step
        this.elapsedTime = 0; // seconds of active play

        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 2400;
        this.score = 0;
        this.monstersKilled = 0;

        this.bossSpawned = false;
        this.bossDefeated = false;
        this.isGameOver = false;
        this.isPaused = false;
        this.state = 'SPLASH'; // 'SPLASH' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
        this.previousModalContext = 'SPLASH';
        this.gameOverLockTimer = 0; // Prevents accidental instant restart when mashing mine button

        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.toastTimer = 0;

        // Keyboard states: Miner 1 (WASD + Space) & Miner 2 (Arrows + Enter)
        this.kbMiner1 = { up: false, left: false, down: false, right: false, action: false };
        this.kbMiner2 = { up: false, left: false, down: false, right: false, action: false };

        this.prevPauseBtn = false;
        this.prevConfirmBtn = false;
        this.prevCancelBtn = false;
        this.prevNavUp = false;
        this.prevNavDown = false;
        this.prevNavLeft = false;
        this.prevNavRight = false;
        this.focusIndex = 0;

        this.setupInput();
        this.setupUIButtons();
        this.setupGamepadUI();
        this.setupResponsiveCanvas();
    }

    setupResponsiveCanvas() {
        const resize = () => {
            const hud = document.getElementById('hud');
            const hudVisible = hud && !hud.classList.contains('hidden');
            const hudHeight = hudVisible ? (hud.offsetHeight + 14) : 16;
            const availW = Math.max(320, window.innerWidth - 28);
            const availH = Math.max(240, window.innerHeight - hudHeight - 20);

            const scale = Math.min(availW / this.width, availH / this.height, 1.15);
            const displayW = Math.floor(this.width * scale);
            const displayH = Math.floor(this.height * scale);

            this.canvas.style.width = `${displayW}px`;
            this.canvas.style.height = `${displayH}px`;
            if (hud) {
                hud.style.maxWidth = `${displayW}px`;
            }
        };
        this.resizeCanvas = resize;
        window.addEventListener('resize', resize);
        setTimeout(resize, 0);
    }

    setupGamepadUI() {
        if (!document.getElementById('gp-badge')) {
            const badge = document.createElement('div');
            badge.id = 'gp-badge';
            badge.className = 'gp-status-badge';
            badge.style.cssText = 'position:fixed;bottom:10px;left:14px;';
            badge.textContent = '🎮 No Pad (Plug & Press)';
            document.body.appendChild(badge);
        }
        window.addEventListener('gamepadconnected', () => this.updateGamepadBadge());
        window.addEventListener('gamepaddisconnected', () => this.updateGamepadBadge());
    }

    getConnectedGamepads() {
        if (!navigator.getGamepads) return [];
        return Array.from(navigator.getGamepads()).filter(Boolean);
    }

    updateGamepadBadge() {
        const badge = document.getElementById('gp-badge');
        if (!badge) return;
        const pads = this.getConnectedGamepads();
        if (pads.length === 0) {
            badge.textContent = '🎮 No Pad (Plug & Press)';
            badge.classList.remove('connected');
        } else if (pads.length === 1) {
            badge.textContent = '🎮 1 Pad: L-Stick+Btn1=Miner 1 | R-Stick+R1=Miner 2';
            badge.classList.add('connected');
        } else {
            badge.textContent = '🎮 2 Pads Ready: Pad 1=Miner 1 | Pad 2=Miner 2';
            badge.classList.add('connected');
        }
    }

    isBtn(gp, idx) {
        return Boolean(gp && gp.buttons && gp.buttons[idx] && (gp.buttons[idx].pressed || gp.buttons[idx].value > 0.3));
    }

    getActiveModalButtons() {
        const activeModal = document.querySelector('.modal-screen:not(.hidden)');
        if (!activeModal) return [];
        return Array.from(activeModal.querySelectorAll('button, input[type="text"]')).filter(el => !el.disabled);
    }

    updateModalFocus(delta = 0) {
        const items = this.getActiveModalButtons();
        document.querySelectorAll('.gamepad-focus').forEach(el => el.classList.remove('gamepad-focus'));
        if (items.length === 0) return;

        this.focusIndex = (this.focusIndex + delta + items.length) % items.length;
        const target = items[this.focusIndex];
        if (target) {
            target.classList.add('gamepad-focus');
        }
    }

    openModal(modalId) {
        document.querySelectorAll('.modal-screen').forEach(m => {
            m.classList.add('hidden');
            m.classList.remove('active');
        });
        if (!modalId) return;

        const target = document.getElementById(modalId);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
            this.focusIndex = 0;
            this.updateModalFocus(0);

            const input = target.querySelector('input[type="text"]');
            if (input) {
                setTimeout(() => input.focus(), 40);
            }
        }
    }

    startNewRun() {
        this.sfx.init();
        this.state = 'PLAYING';
        this.isGameOver = false;
        this.isPaused = false;
        this.bossSpawned = false;
        this.bossDefeated = false;
        this.enemies = [];
        this.score = 0;
        this.monstersKilled = 0;
        this.elapsedTime = 0;
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 2400;
        this.gameOverLockTimer = 0;

        const bossWrap = document.getElementById('boss-bar-wrap');
        if (bossWrap) bossWrap.classList.add('hidden');

        this.miner.reset(320, 350);
        this.fighter.reset(820, 350);
        this.miningSystem.reset();
        this.updateScoreUI();

        const hud = document.getElementById('hud');
        if (hud) hud.classList.remove('hidden');

        this.openModal(null);
        if (this.resizeCanvas) this.resizeCanvas();
        this.lastTime = performance.now();
    }

    setupUIButtons() {
        // Splash screen buttons
        document.getElementById('btn-play')?.addEventListener('click', () => this.startNewRun());
        document.getElementById('btn-high-scores')?.addEventListener('click', () => {
            this.previousModalContext = 'SPLASH';
            this.showHighScoresModal();
        });
        document.getElementById('btn-info')?.addEventListener('click', () => {
            this.previousModalContext = 'SPLASH';
            this.openModal('info-modal');
        });

        // HUD buttons
        document.getElementById('hud-pause-btn')?.addEventListener('click', () => {
            if (this.state === 'PLAYING' || this.state === 'PAUSED') {
                this.togglePause();
            }
        });
        document.getElementById('hud-info-btn')?.addEventListener('click', () => {
            if (this.state === 'PLAYING') {
                this.isPaused = true;
                this.state = 'PAUSED';
                this.previousModalContext = 'PAUSED';
                this.openModal('info-modal');
            }
        });

        // Pause menu buttons
        document.getElementById('btn-pause-resume')?.addEventListener('click', () => this.togglePause());
        document.getElementById('btn-pause-restart')?.addEventListener('click', () => this.startNewRun());
        document.getElementById('btn-pause-info')?.addEventListener('click', () => {
            this.previousModalContext = 'PAUSED';
            this.openModal('info-modal');
        });
        document.getElementById('btn-pause-scores')?.addEventListener('click', () => {
            this.previousModalContext = 'PAUSED';
            this.showHighScoresModal();
        });
        document.getElementById('btn-pause-quit')?.addEventListener('click', () => {
            this.state = 'SPLASH';
            this.isPaused = false;
            this.isGameOver = false;
            document.getElementById('hud')?.classList.add('hidden');
            this.openModal('splash-screen');
            if (this.resizeCanvas) this.resizeCanvas();
        });

        // Audio toggles
        const sfxBtn = document.getElementById('toggle-sfx');
        sfxBtn?.addEventListener('click', () => {
            this.sfx.sfxEnabled = !this.sfx.sfxEnabled;
            sfxBtn.textContent = this.sfx.sfxEnabled ? 'ON' : 'OFF';
            sfxBtn.classList.toggle('on', this.sfx.sfxEnabled);
        });

        const musicBtn = document.getElementById('toggle-music');
        musicBtn?.addEventListener('click', () => {
            this.sfx.musicEnabled = !this.sfx.musicEnabled;
            musicBtn.textContent = this.sfx.musicEnabled ? 'ON' : 'OFF';
            musicBtn.classList.toggle('on', this.sfx.musicEnabled);
        });

        // Info modal close
        document.getElementById('btn-info-close')?.addEventListener('click', () => this.closeSubModal());

        // High Scores modal close/back
        document.getElementById('btn-scores-close')?.addEventListener('click', () => this.closeSubModal());
        document.getElementById('btn-scores-back')?.addEventListener('click', () => this.closeSubModal());

        // High Score Form submission
        const form = document.getElementById('score-entry-form');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('player-name-input');
            const name = input ? input.value : 'Amy and Joe';
            await this.highScores.addScore(name, this.score, this.miningSystem.diamonds);
            this.previousModalContext = 'GAMEOVER';
            this.showHighScoresModal();
        });

        // Game Over / Victory buttons
        document.getElementById('restart-btn')?.addEventListener('click', () => this.startNewRun());
        document.getElementById('btn-gameover-scores')?.addEventListener('click', () => {
            this.previousModalContext = 'GAMEOVER';
            this.showHighScoresModal();
        });
        document.getElementById('btn-gameover-menu')?.addEventListener('click', () => {
            this.state = 'SPLASH';
            this.isPaused = false;
            this.isGameOver = false;
            document.getElementById('hud')?.classList.add('hidden');
            this.openModal('splash-screen');
            if (this.resizeCanvas) this.resizeCanvas();
        });
    }

    showHighScoresModal() {
        const tbody = document.getElementById('scores-tbody');
        this.highScores.renderTable(tbody);
        this.openModal('scores-modal');
    }

    closeSubModal() {
        if (this.previousModalContext === 'PAUSED') {
            this.openModal('pause-modal');
        } else if (this.previousModalContext === 'GAMEOVER') {
            this.openModal('game-over-modal');
        } else {
            this.openModal('splash-screen');
        }
    }

    togglePause() {
        if (this.isGameOver || this.state === 'SPLASH') return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.state = 'PAUSED';
            this.openModal('pause-modal');
        } else {
            this.state = 'PLAYING';
            this.openModal(null);
            this.lastTime = performance.now();
        }
    }

    pollGamepads() {
        const pads = this.getConnectedGamepads();
        this.updateGamepadBadge();

        const isPlayActive = this.state === 'PLAYING' && !this.isGameOver && !this.isPaused;
        document.body.classList.toggle('hide-cursor', isPlayActive);

        // Check Pause (Start button 9 or 8), Confirm (Button 3 = index 2, or Button 1 = index 0), Cancel (Button 2 = index 1)
        let pauseDown = false;
        let confirmDown = false;
        let cancelDown = false;
        let navUp = false;
        let navDown = false;
        let navLeft = false;
        let navRight = false;

        const DZ = 0.38;
        for (const gp of pads) {
            if (this.isBtn(gp, 9) || this.isBtn(gp, 8)) pauseDown = true;
            if (this.isBtn(gp, 2) || this.isBtn(gp, 0)) confirmDown = true;
            if (this.isBtn(gp, 1)) cancelDown = true;

            const ax0 = gp.axes[0] || 0;
            const ax1 = gp.axes[1] || 0;
            if (ax1 < -0.5 || this.isBtn(gp, 12)) navUp = true;
            if (ax1 > 0.5 || this.isBtn(gp, 13)) navDown = true;
            if (ax0 < -0.5 || this.isBtn(gp, 14)) navLeft = true;
            if (ax0 > 0.5 || this.isBtn(gp, 15)) navRight = true;
        }

        if (pauseDown && !this.prevPauseBtn) {
            if (this.state === 'PLAYING' || this.state === 'PAUSED') {
                this.togglePause();
            }
        }

        // Modal navigation when not actively playing
        if (!isPlayActive && this.gameOverLockTimer <= 0) {
            if ((navUp && !this.prevNavUp) || (navLeft && !this.prevNavLeft)) {
                this.updateModalFocus(-1);
            }
            if ((navDown && !this.prevNavDown) || (navRight && !this.prevNavRight)) {
                this.updateModalFocus(1);
            }
            if (confirmDown && !this.prevConfirmBtn) {
                const items = this.getActiveModalButtons();
                const focused = items[this.focusIndex] || items[0];
                if (focused) focused.click();
            }
            if (cancelDown && !this.prevCancelBtn) {
                const infoOpen = !document.getElementById('info-modal')?.classList.contains('hidden');
                const scoresOpen = !document.getElementById('scores-modal')?.classList.contains('hidden');
                if (infoOpen || scoresOpen) {
                    this.closeSubModal();
                } else if (this.state === 'PAUSED') {
                    this.togglePause();
                }
            }
        }

        this.prevPauseBtn = pauseDown;
        this.prevConfirmBtn = confirmDown;
        this.prevCancelBtn = cancelDown;
        this.prevNavUp = navUp;
        this.prevNavDown = navDown;
        this.prevNavLeft = navLeft;
        this.prevNavRight = navRight;

        // Combine Keyboard + Gamepad strictly per Miner (Miner 1 = kbMiner1 + Pad 1, Miner 2 = kbMiner2 + Pad 2)
        let m1Up = this.kbMiner1.up;
        let m1Down = this.kbMiner1.down;
        let m1Left = this.kbMiner1.left;
        let m1Right = this.kbMiner1.right;
        let m1Act = this.kbMiner1.action;

        let m2Up = this.kbMiner2.up;
        let m2Down = this.kbMiner2.down;
        let m2Left = this.kbMiner2.left;
        let m2Right = this.kbMiner2.right;
        let m2Act = this.kbMiner2.action;

        if (pads.length === 1) {
            const gp = pads[0];
            const ax0 = gp.axes[0] || 0;
            const ax1 = gp.axes[1] || 0;
            const ax2 = gp.axes[2] || 0;
            const ax3 = gp.axes[3] || 0;

            // Left Stick / D-Pad controls ONLY Miner 1
            if (ax1 < -DZ || this.isBtn(gp, 12)) m1Up = true;
            if (ax1 > DZ || this.isBtn(gp, 13)) m1Down = true;
            if (ax0 < -DZ || this.isBtn(gp, 14)) m1Left = true;
            if (ax0 > DZ || this.isBtn(gp, 15)) m1Right = true;
            if (this.isBtn(gp, 0) || this.isBtn(gp, 2) || this.isBtn(gp, 4) || this.isBtn(gp, 6)) m1Act = true;

            // Right Stick + R1/R2/Btn2/Btn4 controls ONLY Miner 2 in 1-pad shared mode
            if (ax3 < -DZ) m2Up = true;
            if (ax3 > DZ) m2Down = true;
            if (ax2 < -DZ) m2Left = true;
            if (ax2 > DZ) m2Right = true;
            if (this.isBtn(gp, 1) || this.isBtn(gp, 3) || this.isBtn(gp, 5) || this.isBtn(gp, 7)) m2Act = true;
        } else if (pads.length >= 2) {
            // Pad 1 -> Strictly Miner 1
            const gp1 = pads[0];
            const ax1_0 = gp1.axes[0] || 0;
            const ax1_1 = gp1.axes[1] || 0;
            if (ax1_1 < -DZ || this.isBtn(gp1, 12)) m1Up = true;
            if (ax1_1 > DZ || this.isBtn(gp1, 13)) m1Down = true;
            if (ax1_0 < -DZ || this.isBtn(gp1, 14)) m1Left = true;
            if (ax1_0 > DZ || this.isBtn(gp1, 15)) m1Right = true;
            if (this.isBtn(gp1, 0) || this.isBtn(gp1, 1) || this.isBtn(gp1, 2) || this.isBtn(gp1, 3) || this.isBtn(gp1, 5) || this.isBtn(gp1, 7)) m1Act = true;

            // Pad 2 -> Strictly Miner 2
            const gp2 = pads[1];
            const ax2_0 = gp2.axes[0] || 0;
            const ax2_1 = gp2.axes[1] || 0;
            if (ax2_1 < -DZ || this.isBtn(gp2, 12)) m2Up = true;
            if (ax2_1 > DZ || this.isBtn(gp2, 13)) m2Down = true;
            if (ax2_0 < -DZ || this.isBtn(gp2, 14)) m2Left = true;
            if (ax2_0 > DZ || this.isBtn(gp2, 15)) m2Right = true;
            if (this.isBtn(gp2, 0) || this.isBtn(gp2, 1) || this.isBtn(gp2, 2) || this.isBtn(gp2, 3) || this.isBtn(gp2, 5) || this.isBtn(gp2, 7)) m2Act = true;
        }

        // Apply inputs to Miner 1 & Miner 2
        this.miner.keys.up = m1Up;
        this.miner.keys.down = m1Down;
        this.miner.keys.left = m1Left;
        this.miner.keys.right = m1Right;
        this.miner.keys.action = m1Act;

        this.fighter.keys.up = m2Up;
        this.fighter.keys.down = m2Down;
        this.fighter.keys.left = m2Left;
        this.fighter.keys.right = m2Right;
        this.fighter.keys.action = m2Act;
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            // Ignore shortcuts when typing a high score call sign
            if (document.activeElement && document.activeElement.tagName === 'INPUT') {
                if (e.key === 'Escape') {
                    document.activeElement.blur();
                }
                return;
            }

            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                const infoOpen = !document.getElementById('info-modal')?.classList.contains('hidden');
                const scoresOpen = !document.getElementById('scores-modal')?.classList.contains('hidden');
                if (infoOpen || scoresOpen) {
                    this.closeSubModal();
                    return;
                }
                if (this.state === 'PLAYING' || this.state === 'PAUSED') {
                    this.togglePause();
                }
                return;
            }

            if (e.key === 'i' || e.key === 'I' || e.key === '?') {
                const infoOpen = !document.getElementById('info-modal')?.classList.contains('hidden');
                if (infoOpen) {
                    this.closeSubModal();
                } else {
                    if (this.state === 'PLAYING') {
                        this.isPaused = true;
                        this.state = 'PAUSED';
                        this.previousModalContext = 'PAUSED';
                    } else if (this.state === 'SPLASH') {
                        this.previousModalContext = 'SPLASH';
                    }
                    this.openModal('info-modal');
                }
                return;
            }

            // Menu keyboard navigation when in modal
            if (this.state !== 'PLAYING') {
                if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                    this.updateModalFocus(-1);
                } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                    this.updateModalFocus(1);
                } else if ((e.key === 'Enter' || e.key === ' ') && this.gameOverLockTimer <= 0) {
                    const items = this.getActiveModalButtons();
                    const focused = items[this.focusIndex] || items[0];
                    if (focused && focused.tagName !== 'INPUT') {
                        e.preventDefault();
                        focused.click();
                    }
                }
                return;
            }

            // Miner 1 controls (WASD + Space)
            if (e.key === 'w' || e.key === 'W') this.kbMiner1.up = true;
            if (e.key === 'a' || e.key === 'A') this.kbMiner1.left = true;
            if (e.key === 's' || e.key === 'S') this.kbMiner1.down = true;
            if (e.key === 'd' || e.key === 'D') this.kbMiner1.right = true;
            if (e.key === ' ') {
                e.preventDefault();
                this.kbMiner1.action = true;
            }

            // Miner 2 controls (Arrow Keys + Enter or '/')
            if (e.key === 'ArrowUp') { e.preventDefault(); this.kbMiner2.up = true; }
            if (e.key === 'ArrowLeft') { e.preventDefault(); this.kbMiner2.left = true; }
            if (e.key === 'ArrowDown') { e.preventDefault(); this.kbMiner2.down = true; }
            if (e.key === 'ArrowRight') { e.preventDefault(); this.kbMiner2.right = true; }
            if (e.key === 'Enter' || e.key === '/') {
                e.preventDefault();
                this.kbMiner2.action = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'w' || e.key === 'W') this.kbMiner1.up = false;
            if (e.key === 'a' || e.key === 'A') this.kbMiner1.left = false;
            if (e.key === 's' || e.key === 'S') this.kbMiner1.down = false;
            if (e.key === 'd' || e.key === 'D') this.kbMiner1.right = false;
            if (e.key === ' ') this.kbMiner1.action = false;

            if (e.key === 'ArrowUp') this.kbMiner2.up = false;
            if (e.key === 'ArrowLeft') this.kbMiner2.left = false;
            if (e.key === 'ArrowDown') this.kbMiner2.down = false;
            if (e.key === 'ArrowRight') this.kbMiner2.right = false;
            if (e.key === 'Enter' || e.key === '/') this.kbMiner2.action = false;
        });
    }

    addScore(points) {
        this.score += points;
        this.updateScoreUI();
    }

    updateScoreUI() {
        const el = document.getElementById('hud-score');
        if (el) el.textContent = this.score.toLocaleString();
    }

    showUpgradeToast(message) {
        const toast = document.getElementById('upgrade-toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.remove('hidden');
        this.toastTimer = 3.2;
    }

    triggerShake(intensity = 6, duration = 0.2) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeTimer = Math.max(this.shakeTimer, duration);
    }

    spawnParticles(x, y, count = 8, color = '#2dd4bf') {
        let spawned = 0;
        for (const p of this.particles) {
            if (!p.active) {
                p.active = true;
                p.x = x;
                p.y = y;
                const a = Math.random() * Math.PI * 2;
                const spd = 45 + Math.random() * 145;
                p.vx = Math.cos(a) * spd;
                p.vy = Math.sin(a) * spd;
                p.maxLife = 0.22 + Math.random() * 0.32;
                p.life = p.maxLife;
                p.size = 2.5 + Math.random() * 3.5;
                p.color = color;
                spawned++;
                if (spawned >= count) break;
            }
        }
    }

    spawnFloatingText(x, y, text, color = '#2dd4bf') {
        this.floatingTexts.push({
            x,
            y,
            text,
            color,
            life: 0.9,
            maxLife: 0.9
        });
    }

    spawnBoss() {
        this.bossSpawned = true;
        if (this.sfx) this.sfx.playBossRoar();
        this.triggerShake(12, 0.45);
        this.showUpgradeToast('⚠️ THE GOBLIN STONE COLOSSUS EMERGES!');
        const boss = new Boss(this, this.width - 42, this.height / 2);
        this.enemies.push(boss);
    }

    checkWinCondition() {
        if (this.miningSystem.diamonds >= 1000 && this.bossDefeated && !this.isGameOver) {
            this.gameOver(true);
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    gameOver(won) {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.state = 'GAMEOVER';
        this.gameOverLockTimer = 0.9; // 900ms lock so button-mashing doesn't skip the summary
        document.body.classList.remove('hide-cursor');

        if (won) {
            // Bonus points for fast completion
            const timeBonus = Math.max(0, Math.floor((300 - this.elapsedTime) * 20));
            this.addScore(2500 + timeBonus);
            if (this.sfx) this.sfx.playVictory();
        } else {
            if (this.sfx) this.sfx.playGameOver();
        }

        const text = document.getElementById('notification-text');
        const sub = document.getElementById('gameover-subtitle');
        if (text) {
            if (won) {
                text.innerText = 'Victory!';
                text.style.background = 'linear-gradient(to right, #2dd4bf, #fbbf24)';
                text.style.webkitBackgroundClip = 'text';
                text.style.webkitTextFillColor = 'transparent';
                if (sub) sub.textContent = 'The Stone Colossus is shattered and the minecarts are overflowing!';
            } else {
                text.innerText = 'Game Over';
                text.style.background = 'linear-gradient(to right, #ef4444, #f97316)';
                text.style.webkitBackgroundClip = 'text';
                text.style.webkitTextFillColor = 'transparent';
                if (sub) sub.textContent = 'The Goblin Rock Monsters overwhelmed your expedition!';
            }
        }

        const sumScore = document.getElementById('summary-score');
        const sumDia = document.getElementById('summary-diamonds');
        const sumKills = document.getElementById('summary-kills');
        const sumTime = document.getElementById('summary-time');
        if (sumScore) sumScore.textContent = this.score.toLocaleString();
        if (sumDia) sumDia.textContent = `${this.miningSystem.diamonds} / 1000 💎`;
        if (sumKills) sumKills.textContent = String(this.monstersKilled);
        if (sumTime) sumTime.textContent = this.formatTime(this.elapsedTime);

        // If player achieved a top-10 High Score, show name entry modal first; otherwise show Game Over summary
        if (this.highScores.isHighScore(this.score) && this.score >= 500) {
            const entryNum = document.getElementById('entry-score-num');
            if (entryNum) entryNum.textContent = this.score.toLocaleString();
            this.openModal('score-entry-modal');
        } else {
            this.openModal('game-over-modal');
        }
    }

    start() {
        this.lastTime = performance.now();
        this.draw(); // Render initial Goblin Mine backdrop behind the splash screen
        requestAnimationFrame((t) => this.loop(t));
    }

    loop(timestamp) {
        const rawDelta = Math.min(timestamp - this.lastTime, 100);
        this.lastTime = timestamp;

        if (this.gameOverLockTimer > 0) {
            this.gameOverLockTimer = Math.max(0, this.gameOverLockTimer - rawDelta / 1000);
        }

        this.pollGamepads();

        if (this.state === 'PLAYING' && !this.isGameOver && !this.isPaused) {
            this.accumulator += rawDelta;
            while (this.accumulator >= this.fixedStepMs) {
                this.update(this.fixedStepMs);
                this.accumulator -= this.fixedStepMs;
            }
            this.draw();
        } else {
            // Subtle lantern flicker & cart movement even while on Splash screen
            this.scene.update(rawDelta / 1000, false);
            this.draw();
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    update(deltaTime) {
        const dt = deltaTime / 1000;
        this.elapsedTime += dt;

        this.sfx.updateAmbience(dt);
        this.scene.update(dt, this.miningSystem.overdrive);

        if (this.shakeTimer > 0) {
            this.shakeTimer = Math.max(0, this.shakeTimer - dt);
        }
        if (this.toastTimer > 0) {
            this.toastTimer -= dt;
            if (this.toastTimer <= 0) {
                document.getElementById('upgrade-toast')?.classList.add('hidden');
            }
        }

        this.miner.update(deltaTime);
        this.fighter.update(deltaTime);
        this.miningSystem.update(deltaTime);

        // Monster spawning from the 3 Goblin Tunnel Entrances on the right wall
        // Keeps spawning waves even after the boss is defeated so combat stays lively to 1,000 💎!
        const activeBoss = this.enemies.some(e => e.maxHealth && e.maxHealth > 200);
        const maxMonsters = activeBoss ? 5 : 10;

        this.enemySpawnTimer += deltaTime;
        if (this.enemySpawnTimer > this.enemySpawnInterval && this.enemies.length < maxMonsters) {
            this.enemySpawnTimer = 0;
            this.enemySpawnInterval = Math.max(950, this.enemySpawnInterval - 18);
            const tunnel = this.scene.tunnels[Math.floor(Math.random() * this.scene.tunnels.length)];
            this.enemies.push(new Monster(this, tunnel.x - 16, tunnel.y + (Math.random() - 0.5) * 28));
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy) enemy.update(deltaTime);
        }

        // Update particles
        for (const p of this.particles) {
            if (p.active) {
                p.life -= dt;
                if (p.life <= 0) {
                    p.active = false;
                    continue;
                }
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= 0.94;
                p.vy *= 0.94;
            }
        }

        // Update floating text popups
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= dt;
            ft.y -= 28 * dt;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.save();

        if (this.shakeTimer > 0) {
            const sx = (Math.random() - 0.5) * this.shakeIntensity * 2;
            const sy = (Math.random() - 0.5) * this.shakeIntensity * 2;
            ctx.translate(sx, sy);
        }

        // 1. Goblin Mine Floor, Gravel, Tracks, Minecarts, Walls & Tunnels
        this.scene.drawBackground(ctx);

        // 2. Diamond, Gold & Crystal Ore Boulders + Clockwork Auto-Bot
        this.miningSystem.draw(ctx);

        // 3. Goblin Rock Monsters & Stone Colossus Boss
        for (const enemy of this.enemies) {
            enemy.draw(ctx);
        }

        // 4. Both Miners (with Headlamps & Pickaxes/Drills)
        this.miner.draw(ctx);
        this.fighter.draw(ctx);

        // 5. Particles
        for (const p of this.particles) {
            if (p.active) {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
                ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            }
        }
        ctx.globalAlpha = 1.0;

        // 6. Flickering Warm Oil Lamps Overlay
        this.scene.drawLighting(ctx);

        // 7. Floating "+💎" and status popups
        ctx.font = '900 15px Outfit, sans-serif';
        ctx.textAlign = 'center';
        for (const ft of this.floatingTexts) {
            ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
            ctx.fillStyle = '#000';
            ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
        }
        ctx.globalAlpha = 1.0;

        ctx.restore();
    }
}
