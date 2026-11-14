class SoundFX {
    constructor() {
        this.ctx = null;
        this.sfxEnabled = localStorage.getItem('heromaker_sfx') !== 'off';
        this.musicEnabled = localStorage.getItem('heromaker_music') !== 'off';
        this.musicTimer = null;
        this.musicStep = 0;
        this.isMusicPlaying = false;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        localStorage.setItem('heromaker_sfx', this.sfxEnabled ? 'on' : 'off');
        if (this.sfxEnabled) this.playMenuConfirm();
        return this.sfxEnabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        localStorage.setItem('heromaker_music', this.musicEnabled ? 'on' : 'off');
        if (!this.musicEnabled) {
            this.stopMusic();
        } else if (this.isMusicPlaying) {
            this.startMusic();
        }
        return this.musicEnabled;
    }

    playTone(freq, endFreq, duration, type = 'sine', volume = 0.2) {
        if (!this.sfxEnabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);
            if (endFreq && endFreq !== freq) {
                osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
            }
            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(0.008, now + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + duration);
        } catch {
            // Ignore audio errors prior to unlock
        }
    }

    playJump() {
        this.playTone(170, 420, 0.13, 'sine', 0.22);
    }

    playAttack() {
        this.playTone(520, 140, 0.11, 'sawtooth', 0.18);
    }

    playHit() {
        this.playTone(240, 90, 0.1, 'square', 0.2);
    }

    playHurt() {
        this.playTone(180, 65, 0.22, 'sawtooth', 0.28);
    }

    playCoin() {
        this.playTone(880, 1320, 0.12, 'triangle', 0.2);
    }

    playPotion() {
        this.playTone(440, 880, 0.22, 'sine', 0.24);
    }

    playChest() {
        if (!this.sfxEnabled) return;
        const notes = [587.33, 783.99, 1174.66];
        notes.forEach((n, i) => {
            setTimeout(() => this.playTone(n, n * 1.05, 0.14, 'triangle', 0.24), i * 80);
        });
    }

    playPowerup() {
        if (!this.sfxEnabled) return;
        this.playTone(330, 990, 0.28, 'sine', 0.25);
    }

    playBuy() {
        this.playTone(523.25, 1046.5, 0.18, 'triangle', 0.25);
    }

    playError() {
        this.playTone(160, 110, 0.2, 'sawtooth', 0.22);
    }

    playMenuMove() {
        this.playTone(440, 480, 0.05, 'sine', 0.12);
    }

    playMenuConfirm() {
        this.playTone(587.33, 880, 0.11, 'triangle', 0.18);
    }

    playStageClear() {
        if (!this.sfxEnabled) return;
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((n, i) => {
            setTimeout(() => this.playTone(n, n, 0.16, 'triangle', 0.22), i * 110);
        });
    }

    playVictory() {
        if (!this.sfxEnabled) return;
        const notes = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5];
        notes.forEach((n, i) => {
            setTimeout(() => this.playTone(n, n, 0.2, 'triangle', 0.25), i * 130);
        });
    }

    playDefeat() {
        if (!this.sfxEnabled) return;
        const notes = [392.0, 349.23, 329.63, 261.63];
        notes.forEach((n, i) => {
            setTimeout(() => this.playTone(n, n * 0.96, 0.24, 'sawtooth', 0.22), i * 150);
        });
    }

    startMusic() {
        this.isMusicPlaying = true;
        if (!this.musicEnabled) return;
        if (this.musicTimer) clearInterval(this.musicTimer);
        const melody = [220, 261.63, 329.63, 293.66, 261.63, 329.63, 392.0, 329.63];
        this.musicTimer = setInterval(() => {
            if (!this.musicEnabled || !this.isMusicPlaying) return;
            if (!this.ctx || this.ctx.state !== 'running') return;
            const freq = melody[this.musicStep % melody.length];
            this.musicStep++;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.045, now);
                gain.gain.exponentialRampToValueAtTime(0.004, now + 0.28);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.28);
            } catch {
                // Ignore if context suspended
            }
        }, 320);
    }

    stopMusic() {
        this.isMusicPlaying = false;
        if (this.musicTimer) {
            clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
    }
}

class HighScoreManager {
    constructor(storageKey = 'heromaker_high_scores_v1', maxEntries = 10) {
        this.key = storageKey;
        this.max = maxEntries;
        this.lastInsertedId = null;
        this.scores = this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(this.key);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch {
            // Fallback to defaults
        }
        return this.getDefaults();
    }

    getDefaults() {
        return [
            { id: 'd1', name: 'ARTHUR', score: 15000, stage: 10, time: 285, date: '2026-01-01' },
            { id: 'd2', name: 'VALKYR', score: 11200, stage: 8, time: 240, date: '2026-01-01' },
            { id: 'd3', name: 'LANCEL', score: 8400, stage: 6, time: 195, date: '2026-01-01' },
            { id: 'd4', name: 'MERLIN', score: 5200, stage: 4, time: 140, date: '2026-01-01' },
            { id: 'd5', name: 'ROBIN', score: 2500, stage: 2, time: 90, date: '2026-01-01' }
        ];
    }

    getBestScore() {
        if (!this.scores || this.scores.length === 0) return 0;
        return this.scores[0].score || 0;
    }

    isHighScore(score) {
        if (score <= 0) return false;
        if (this.scores.length < this.max) return true;
        return score > this.scores[this.scores.length - 1].score;
    }

    addScore(name, score, stage = 1, time = 0) {
        const entryId = 'score_' + Date.now();
        const cleanName = (name.trim().toUpperCase() || 'HERO').slice(0, 10);
        this.scores.push({
            id: entryId,
            name: cleanName,
            score: Math.floor(score),
            stage: stage,
            time: Math.floor(time),
            date: new Date().toISOString().split('T')[0]
        });
        this.scores.sort((a, b) => b.score - a.score || a.time - b.time);
        if (this.scores.length > this.max) {
            this.scores.length = this.max;
        }
        this.lastInsertedId = entryId;
        try {
            localStorage.setItem(this.key, JSON.stringify(this.scores));
        } catch {
            // Ignore storage quota errors
        }
        return entryId;
    }

    formatTime(seconds) {
        const mins = Math.floor((seconds || 0) / 60);
        const secs = Math.floor((seconds || 0) % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    renderTable(tbodyElement) {
        if (!tbodyElement) return;
        tbodyElement.innerHTML = this.scores.map((entry, index) => {
            const isNew = entry.id === this.lastInsertedId;
            return `
                <tr class="${isNew ? 'row-new-entry' : ''}">
                    <td class="col-rank">#${index + 1}</td>
                    <td class="col-name">${entry.name} ${isNew ? '<span class="new-pill">NEW!</span>' : ''}</td>
                    <td class="col-score">${(entry.score || 0).toLocaleString()}</td>
                    <td class="col-stage">Stage ${entry.stage || 1}</td>
                    <td class="col-time">${this.formatTime(entry.time)}</td>
                    <td class="col-date">${entry.date || ''}</td>
                </tr>
            `;
        }).join('');
    }
}

class UI {
    constructor(game) {
        this.game = game;
        this.weaponName = document.getElementById('weapon-name');
        this.headwearName = document.getElementById('headwear-name');
        this.armorName = document.getElementById('armor-name');
        this.legsName = document.getElementById('legs-name');
        this.feetName = document.getElementById('feet-name');

        this.shopList = document.getElementById('shop-list');
        this.shopCoins = document.getElementById('shop-coins');
        this.shopHeroStats = document.getElementById('shop-hero-stats');
        this.shopFeedback = document.getElementById('shop-feedback');
        this.forgePanel = document.getElementById('forge-panel');

        this.refitCanvas = document.getElementById('refit-preview-canvas');
        this.refitCtx = this.refitCanvas ? this.refitCanvas.getContext('2d') : null;
        this.previewPose = 'Idle 1';
        this.activeWardrobeTab = 'all';
        this.forgeHasDrawing = false;

        this.activeModalId = 'splash-screen';
        this.returnModalId = null;
        this.focusIndex = 0;

        this.initWardrobeControls();
        this.initForgeControls();
        if (this.shopList) this.initShop();
    }

    initWardrobeControls() {
        // Category Tabs
        document.querySelectorAll('.wardrobe-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab || 'all';
                this.game.sfx.playMenuConfirm();
                this.setWardrobeTab(tab);
            });
        });

        // Clicking any of the 5 paper-doll slot cards around the Hero filters to that slot (or toggles back to All)
        document.querySelectorAll('.equipped-slot-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const slot = btn.dataset.slotFilter;
                if (slot) {
                    this.game.sfx.playMenuConfirm();
                    const nextTab = this.activeWardrobeTab === slot ? 'all' : slot;
                    this.setWardrobeTab(nextTab);
                }
            });
        });

        // Animation Pose Preview Buttons
        document.querySelectorAll('.pose-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const pose = btn.dataset.pose || 'Idle 1';
                this.previewPose = pose;
                document.querySelectorAll('.pose-btn').forEach(b => b.classList.toggle('active', b === btn));
                if (this.game && this.game.player && this.game.player.characterRig) {
                    this.game.player.characterRig.setProfile(pose, true);
                }
                this.renderRefitPreview(0);
                this.game.sfx.playMenuMove();
            });
        });
    }

    setWardrobeTab(tab) {
        this.activeWardrobeTab = tab;
        document.querySelectorAll('.wardrobe-tab').forEach(b => {
            b.classList.toggle('active', b.dataset.tab === tab);
        });
        document.querySelectorAll('.equipped-slot-btn').forEach(b => {
            b.classList.toggle('active-slot', b.dataset.slotFilter === tab);
        });

        if (tab === 'forge') {
            if (this.shopList) this.shopList.classList.add('hidden');
            if (this.forgePanel) this.forgePanel.classList.remove('hidden');
            this.updateForgeStatPreview();
            this.setShopFeedback('Design and forge a custom CharaGen item for any body slot!', 'info');
        } else {
            if (this.shopList) this.shopList.classList.remove('hidden');
            if (this.forgePanel) this.forgePanel.classList.add('hidden');
            this.initShop();
        }
    }

    initForgeControls() {
        const slotSel = document.getElementById('forge-item-slot');
        const tierSel = document.getElementById('forge-item-tier');
        const colorInp = document.getElementById('forge-item-color');
        const createBtn = document.getElementById('btn-forge-create');
        const clearBtn = document.getElementById('btn-forge-clear');
        const pad = document.getElementById('forge-canvas');

        const updatePreview = () => this.updateForgeStatPreview();
        if (slotSel) slotSel.addEventListener('change', updatePreview);
        if (tierSel) tierSel.addEventListener('change', updatePreview);

        if (pad) {
            const pctx = pad.getContext('2d');
            let drawing = false;
            const getPos = (e) => {
                const rect = pad.getBoundingClientRect();
                const scaleX = pad.width / rect.width;
                const scaleY = pad.height / rect.height;
                return {
                    x: (e.clientX - rect.left) * scaleX,
                    y: (e.clientY - rect.top) * scaleY
                };
            };
            pad.addEventListener('pointerdown', (e) => {
                drawing = true;
                this.forgeHasDrawing = true;
                const pos = getPos(e);
                pctx.strokeStyle = colorInp ? colorInp.value : '#f59e0b';
                pctx.fillStyle = pctx.strokeStyle;
                pctx.lineWidth = 5;
                pctx.lineCap = 'round';
                pctx.beginPath();
                pctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2);
                pctx.fill();
                pctx.beginPath();
                pctx.moveTo(pos.x, pos.y);
            });
            pad.addEventListener('pointermove', (e) => {
                if (!drawing) return;
                const pos = getPos(e);
                pctx.lineTo(pos.x, pos.y);
                pctx.stroke();
            });
            window.addEventListener('pointerup', () => {
                drawing = false;
            });
        }

        if (clearBtn && pad) {
            clearBtn.addEventListener('click', () => {
                const pctx = pad.getContext('2d');
                pctx.clearRect(0, 0, pad.width, pad.height);
                this.forgeHasDrawing = false;
                this.game.sfx.playMenuMove();
            });
        }

        if (createBtn) {
            createBtn.addEventListener('click', () => this.handleForgeItem());
        }
    }

    getForgeSpecs() {
        const nameEl = document.getElementById('forge-item-name');
        const slotEl = document.getElementById('forge-item-slot');
        const tierEl = document.getElementById('forge-item-tier');
        const colorEl = document.getElementById('forge-item-color');

        const name = (nameEl && nameEl.value.trim()) ? nameEl.value.trim() : 'Custom Gear';
        const slot = slotEl ? slotEl.value : 'mainWeapon';
        const level = Math.max(1, Math.min(5, Number(tierEl ? tierEl.value : 3)));
        const color = colorEl ? colorEl.value : '#f59e0b';

        const costs = { 1: 0, 2: 150, 3: 350, 4: 700, 5: 1400 };
        const baseCost = costs[level] || 0;

        let damage = 0;
        let defense = 0;
        let health = 0;
        let speed = 0;

        if (slot === 'mainWeapon') {
            damage = [0, 12, 22, 34, 48, 65][level];
            speed = level >= 4 ? 10 : 0;
        } else if (slot === 'headwear') {
            defense = [0, 2, 5, 9, 13, 18][level];
            health = [0, 10, 25, 45, 70, 100][level];
        } else if (slot === 'topBody') {
            defense = [0, 3, 7, 13, 19, 26][level];
            health = [0, 15, 40, 75, 115, 160][level];
        } else if (slot === 'legs') {
            defense = [0, 2, 5, 9, 14, 20][level];
            health = [0, 10, 20, 40, 65, 95][level];
            speed = [0, 5, 10, 14, 18, 24][level];
        } else if (slot === 'feet') {
            defense = [0, 1, 3, 6, 9, 14][level];
            health = [0, 5, 15, 25, 40, 60][level];
            speed = [0, 12, 22, 32, 42, 55][level];
        }

        return { name, slot, level, color, baseCost, damage, defense, health, speed };
    }

    updateForgeStatPreview() {
        const previewEl = document.getElementById('forge-stat-preview');
        if (!previewEl) return;
        const specs = this.getForgeSpecs();
        const parts = [];
        if (specs.damage > 0) parts.push(`⚔ ATK +${specs.damage}`);
        if (specs.defense > 0) parts.push(`🛡 DEF +${specs.defense}`);
        if (specs.health > 0) parts.push(`❤ HP +${specs.health}`);
        if (specs.speed > 0) parts.push(`⚡ SPD +${specs.speed}`);
        parts.push(specs.baseCost > 0 ? `Cost: 💰 ${specs.baseCost}` : 'Free');
        previewEl.textContent = parts.join(' | ');
    }

    handleForgeItem() {
        const player = this.game.player;
        if (!player) return;
        const specs = this.getForgeSpecs();

        if (player.coins < specs.baseCost) {
            this.game.sfx.playError();
            const needed = specs.baseCost - player.coins;
            this.setShopFeedback(`Not enough Gold to forge Lv.${specs.level} ${specs.name}! Need ${needed} more 💰.`, 'error');
            return;
        }

        const pad = document.getElementById('forge-canvas');
        const assetUri = (this.forgeHasDrawing && pad) ? pad.toDataURL('image/png') : null;

        player.coins -= specs.baseCost;
        const forged = Items.createCustomItem({
            ...specs,
            assetUri
        });
        player.ownedItems.add(forged.id);
        player.equip(forged);

        this.game.sfx.playBuy();
        this.setShopFeedback(`Forged & equipped Lv.${forged.level} ${forged.name}!`, 'success');
        this.updateHeroMaker();
        this.update();
        this.setWardrobeTab(forged.slot);
    }

    getFocusableElements(modalId = this.activeModalId) {
        if (!modalId) return [];
        const modal = document.getElementById(modalId);
        if (!modal || modal.classList.contains('hidden')) return [];
        return Array.from(modal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled])'))
            .filter(el => !el.closest('.hidden'));
    }

    setFocusIndex(index) {
        const elems = this.getFocusableElements();
        document.querySelectorAll('.gamepad-focus').forEach(el => el.classList.remove('gamepad-focus'));
        if (elems.length === 0) return;

        this.focusIndex = ((index % elems.length) + elems.length) % elems.length;
        const target = elems[this.focusIndex];
        if (target) {
            target.classList.add('gamepad-focus');
            target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            if (target.tagName === 'INPUT') {
                target.focus();
            }
        }
    }

    moveFocus(delta) {
        const elems = this.getFocusableElements();
        if (elems.length === 0) return;
        this.game.sfx.playMenuMove();
        this.setFocusIndex(this.focusIndex + delta);
    }

    activateFocusedElement() {
        const elems = this.getFocusableElements();
        if (elems.length === 0) return;
        const target = elems[this.focusIndex] || elems[0];
        if (!target) return;
        if (target.tagName === 'INPUT' && target.closest('form')) {
            target.closest('form').requestSubmit();
        } else {
            target.click();
        }
    }

    openModal(modalId, rememberPrevious = false) {
        if (rememberPrevious && this.activeModalId && this.activeModalId !== modalId) {
            this.returnModalId = this.activeModalId;
        } else if (!rememberPrevious) {
            this.returnModalId = null;
        }

        document.querySelectorAll('.modal-screen').forEach(m => {
            m.classList.add('hidden');
            m.classList.remove('active');
        });

        const target = document.getElementById(modalId);
        this.activeModalId = modalId;

        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');

            const input = target.querySelector('#player-name-input');
            if (input) {
                this.setFocusIndex(0);
                setTimeout(() => {
                    input.focus();
                    input.select();
                }, 40);
            } else {
                const primaryBtn = target.querySelector('.ui-btn.primary');
                const elems = this.getFocusableElements(modalId);
                const idx = primaryBtn ? Math.max(0, elems.indexOf(primaryBtn)) : 0;
                this.setFocusIndex(idx);
            }
        }
        this.game.updateCursorVisibility();
    }

    closeAllModals() {
        document.querySelectorAll('.modal-screen').forEach(m => {
            m.classList.add('hidden');
            m.classList.remove('active');
        });
        document.querySelectorAll('.gamepad-focus').forEach(el => el.classList.remove('gamepad-focus'));
        this.activeModalId = null;
        this.returnModalId = null;
        this.game.updateCursorVisibility();
    }

    setShopFeedback(message, type = 'info') {
        if (!this.shopFeedback) return;
        this.shopFeedback.textContent = message;
        this.shopFeedback.className = 'shop-feedback' + (type !== 'info' ? ` ${type}` : '');
    }

    formatItemStats(item) {
        const stats = [];
        if (item.damage) stats.push(`⚔ +${item.damage} ATK`);
        if (item.defense) stats.push(`🛡 +${item.defense} DEF`);
        if (item.health) stats.push(`❤ +${item.health} HP`);
        if (item.speed) stats.push(`⚡ +${item.speed} SPD`);
        return stats.join(' | ') || 'Starter Tunic';
    }

    formatItemStatChips(item) {
        const chips = [];
        if (item.damage) chips.push(`<span class="stat-chip atk">⚔ +${item.damage} ATK</span>`);
        if (item.defense) chips.push(`<span class="stat-chip def">🛡 +${item.defense} DEF</span>`);
        if (item.health) chips.push(`<span class="stat-chip hp">❤ +${item.health} HP</span>`);
        if (item.speed) chips.push(`<span class="stat-chip spd">⚡ +${item.speed} SPD</span>`);
        if (chips.length === 0) {
            chips.push(`<span class="stat-chip">Starter Gear</span>`);
        }
        return chips.join('');
    }

    initShop() {
        if (!this.shopList || !this.game || !this.game.player) return;
        const player = this.game.player;
        this.shopList.innerHTML = '';

        const slotBadges = {
            mainWeapon: '🗡 Weapon',
            headwear: '🪖 Headwear',
            topBody: '🛡 Chest Armor',
            legs: '🦿 Leg Greaves',
            feet: '🥾 Footwear'
        };

        const createCategory = (title, slotKey, baseItems) => {
            if (this.activeWardrobeTab !== 'all' && this.activeWardrobeTab !== slotKey) return;

            const customForSlot = (Items.Custom || []).filter(c => c.slot === slotKey);
            const items = [...baseItems, ...customForSlot];
            if (items.length === 0) return;

            const header = document.createElement('div');
            header.className = 'shop-category-title';
            header.textContent = title;
            this.shopList.appendChild(header);

            items.forEach(item => {
                const isOwned = player.ownedItems.has(item.id) || item.baseCost === 0 || item.isCustom;
                const equippedInSlot = player.loadout && player.loadout[item.slot];
                const isEquipped = equippedInSlot && equippedInSlot.id === item.id;

                const card = document.createElement('button');
                card.type = 'button';
                card.className = 'gear-card' +
                    (isEquipped ? ' equipped-card' : '') +
                    (isOwned ? ' owned-card' : '');
                card.dataset.id = item.id;

                let actionText = `BUY & EQUIP • 💰 ${item.baseCost}`;
                if (isEquipped) {
                    actionText = '✓ EQUIPPED ON HERO';
                } else if (isOwned) {
                    actionText = 'CLICK TO EQUIP';
                }

                const iconUri = typeof CharaGenCharacter !== 'undefined'
                    ? CharaGenCharacter.generateItemSvgUri(item, false)
                    : '';

                card.innerHTML = `
                    <div class="gear-card-top">
                        <span>${slotBadges[item.slot] || 'Gear'}</span>
                        <span class="gear-card-tier">Lv.${item.level || 1}${item.isCustom ? ' ✨' : ''}</span>
                    </div>
                    <div class="gear-card-main">
                        <div class="gear-card-thumb">
                            ${iconUri ? `<img src="${iconUri}" alt="${item.name}" />` : ''}
                        </div>
                        <div class="gear-card-info">
                            <div class="gear-card-title" style="color:${item.color || '#f8fafc'}">${item.name}</div>
                            <div class="gear-card-stats">${this.formatItemStatChips(item)}</div>
                        </div>
                    </div>
                    <div class="gear-card-action">${actionText}</div>
                `;

                card.addEventListener('click', () => {
                    this.tryBuyOrEquip(item);
                });

                this.shopList.appendChild(card);
            });
        };

        createCategory('🗡 Main Weapons (Lv. 1–5)', 'mainWeapon', Items.Weapons);
        createCategory('🪖 Headwear & Helms (Lv. 1–5)', 'headwear', Items.Headwear);
        createCategory('🛡 Chest Armor (Lv. 1–5)', 'topBody', Items.Armor);
        createCategory('🦿 Leg Greaves (Lv. 1–5)', 'legs', Items.Legs);
        createCategory('🥾 Footwear & Boots (Lv. 1–5)', 'feet', Items.Feet);

        if (this.activeModalId === 'hero-maker-screen') {
            this.setFocusIndex(this.focusIndex);
        }
    }

    tryBuyOrEquip(item) {
        const player = this.game.player;
        const isOwned = player.ownedItems.has(item.id) || item.baseCost === 0 || item.isCustom;

        if (isOwned) {
            player.equip(item);
            this.game.sfx.playMenuConfirm();
            this.setShopFeedback(`Equipped Lv.${item.level || 1} ${item.name} (${this.formatItemStats(item)})!`, 'success');
            this.updateHeroMaker();
            this.initShop();
            this.update();
            return;
        }

        if (player.coins >= item.baseCost) {
            player.coins -= item.baseCost;
            player.ownedItems.add(item.id);
            player.equip(item);
            this.game.sfx.playBuy();
            this.setShopFeedback(`Purchased & equipped Lv.${item.level || 1} ${item.name}!`, 'success');
            this.updateHeroMaker();
            this.initShop();
            this.update();
        } else {
            this.game.sfx.playError();
            const needed = item.baseCost - player.coins;
            this.setShopFeedback(`Not enough Gold! Need ${needed} more 💰 to buy ${item.name}.`, 'error');
        }
    }

    updateHeroMaker() {
        const player = this.game.player;
        if (!player || !player.loadout) return;

        const updatePaperDollSlot = (slotKey, nameEl, tierId, statsId, imgId) => {
            const item = player.loadout[slotKey];
            if (!item) return;
            if (nameEl) {
                nameEl.textContent = item.name;
                nameEl.style.color = item.color || '#f8fafc';
            }
            const tierEl = document.getElementById(tierId);
            if (tierEl) tierEl.textContent = `Lv.${item.level || 1}`;

            const statsEl = document.getElementById(statsId);
            if (statsEl) statsEl.textContent = this.formatItemStats(item);

            const imgEl = document.getElementById(imgId);
            if (imgEl && typeof CharaGenCharacter !== 'undefined') {
                const uri = CharaGenCharacter.generateItemSvgUri(item, player.buffs && player.buffs.atk > 0);
                if (uri) imgEl.src = uri;
            }
        };

        updatePaperDollSlot('mainWeapon', this.weaponName, 'weapon-tier', 'weapon-stats', 'slot-img-mainWeapon');
        updatePaperDollSlot('headwear', this.headwearName, 'headwear-tier', 'headwear-stats', 'slot-img-headwear');
        updatePaperDollSlot('topBody', this.armorName, 'armor-tier', 'armor-stats', 'slot-img-topBody');
        updatePaperDollSlot('legs', this.legsName, 'legs-tier', 'legs-stats', 'slot-img-legs');
        updatePaperDollSlot('feet', this.feetName, 'feet-tier', 'feet-stats', 'slot-img-feet');

        if (this.shopCoins) this.shopCoins.textContent = `💰 ${player.coins}`;

        // Calculate gear contributions for the Derived Stat Totals Breakdown
        const gearHp = Math.max(0, player.maxHp - player.baseMaxHp);
        const gearAtk = Math.max(0, player.damage - player.baseDamage);
        const gearDef = player.defense || 0;
        const gearSpd = player.speedBonus || 0;

        const hpEl = document.getElementById('stat-total-hp');
        const hpSubEl = document.getElementById('stat-sub-hp');
        const defEl = document.getElementById('stat-total-def');
        const defSubEl = document.getElementById('stat-sub-def');
        const atkEl = document.getElementById('stat-total-atk');
        const atkSubEl = document.getElementById('stat-sub-atk');
        const spdEl = document.getElementById('stat-total-spd');
        const spdSubEl = document.getElementById('stat-sub-spd');

        if (hpEl) hpEl.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
        if (hpSubEl) hpSubEl.textContent = `Base ${player.baseMaxHp} + Gear +${gearHp}`;

        if (defEl) defEl.textContent = `${gearDef}`;
        if (defSubEl) defSubEl.textContent = `All 5 Slots (-${gearDef} Dmg)`;

        if (atkEl) atkEl.textContent = `${player.getEffectiveDamage()}`;
        if (atkSubEl) atkSubEl.textContent = `Base ${player.baseDamage} + Gear +${gearAtk}${player.buffs.atk > 0 ? ' (2×!)' : ''}`;

        if (spdEl) spdEl.textContent = `${Math.round(player.getEffectiveSpeed())}`;
        if (spdSubEl) spdSubEl.textContent = `Base ${player.baseSpeed} + Gear +${gearSpd}`;

        // Render preview frame immediately
        this.renderRefitPreview(0);
    }

    renderRefitPreview(dt = 0) {
        if (!this.refitCtx || !this.refitCanvas) return;
        const player = this.game && this.game.player;
        if (!player || !player.characterRig || !player.characterRig.loaded) return;

        const ctx = this.refitCtx;
        const w = this.refitCanvas.width;
        const h = this.refitCanvas.height;

        // Advance the CharaGen animation on the preview canvas
        player.characterRig.setProfile(this.previewPose || 'Idle 1', false);
        if (dt > 0) {
            player.characterRig.updateAnimation(dt);
        }

        ctx.clearRect(0, 0, w, h);

        // Draw subtle arcane studio backdrop grid & glowing pedestal
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1;
        for (let gx = 24; gx < w; gx += 24) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, h);
            ctx.stroke();
        }
        for (let gy = 24; gy < h; gy += 24) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(w, gy);
            ctx.stroke();
        }

        const floorY = h - 26;
        const grad = ctx.createRadialGradient(w / 2, floorY, 8, w / 2, floorY, 88);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        grad.addColorStop(0.6, 'rgba(251, 191, 36, 0.16)');
        grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(w / 2, floorY, 88, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(w / 2, floorY, 58, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Draw the CharaGen Hero large (195px tall) centered on the studio pedestal
        player.characterRig.draw(
            ctx,
            w / 2,
            floorY,
            1,
            195,
            this.previewPose === 'Attack 1'
        );
    }

    renderLevelPips(containerId, currentLevel, maxLevel = 5) {
        const el = document.getElementById(containerId);
        if (!el) return;
        let html = '';
        for (let i = 1; i <= maxLevel; i++) {
            html += `<span class="uf-pip ${i <= currentLevel ? 'filled' : ''}"></span>`;
        }
        el.innerHTML = html;
    }

    update() {
        if (!this.game || !this.game.player) return;
        const player = this.game.player;
        const level = Levels[this.game.currentLevelIdx] || Levels[0];

        // 1. Top HUD Health
        const hpFill = document.getElementById('hud-hp-fill');
        const hpText = document.getElementById('hud-hp-text');
        const hpPct = Math.max(0, Math.min(1, player.hp / player.maxHp));
        if (hpFill) {
            hpFill.style.width = `${hpPct * 100}%`;
            if (hpPct > 0.5) {
                hpFill.style.background = 'linear-gradient(90deg, #22c55e, #4ade80)';
            } else if (hpPct > 0.25) {
                hpFill.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
            } else {
                hpFill.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
            }
        }
        if (hpText) {
            hpText.textContent = `${Math.max(0, Math.ceil(player.hp))}/${player.maxHp}`;
        }

        // 2. Top HUD Active Power-Up Buffs
        const buffsEl = document.getElementById('hud-buffs');
        if (buffsEl && player.buffs) {
            const pills = [];
            if (player.buffs.atk > 0) pills.push(`<span class="buff-pill atk">⚔ 2× ATK ${Math.ceil(player.buffs.atk)}s</span>`);
            if (player.buffs.spd > 0) pills.push(`<span class="buff-pill spd">⚡ SPEED ${Math.ceil(player.buffs.spd)}s</span>`);
            if (player.buffs.def > 0) pills.push(`<span class="buff-pill def">🛡 SHIELD ${Math.ceil(player.buffs.def)}s</span>`);
            buffsEl.innerHTML = pills.join('');
        }

        // 3. Top HUD Minions / Boss Objective & Boss HP Bar
        const objEl = document.getElementById('hud-objective');
        const bossBarWrap = document.getElementById('hud-boss-bar-wrap');
        const bossBarFill = document.getElementById('hud-boss-bar-fill');
        if (objEl) {
            const minionCount = this.game.entities.filter(e => e instanceof Enemy && !(e instanceof Boss)).length;
            const boss = this.game.entities.find(e => e instanceof Boss);
            if (minionCount > 0) {
                objEl.textContent = `⚔ Minions Left: ${minionCount}`;
                objEl.style.color = '#38bdf8';
                if (bossBarWrap) bossBarWrap.classList.add('hidden');
            } else if (boss) {
                const bossPct = Math.max(0, Math.min(100, Math.ceil((boss.hp / boss.maxHp) * 100)));
                objEl.textContent = `👑 ${boss.name}: ${bossPct}%`;
                objEl.style.color = '#fbbf24';
                if (bossBarWrap) bossBarWrap.classList.remove('hidden');
                if (bossBarFill) bossBarFill.style.width = `${bossPct}%`;
            } else {
                objEl.textContent = '✓ Stage Clear! Collecting Loot...';
                objEl.style.color = '#4ade80';
                if (bossBarWrap) bossBarWrap.classList.add('hidden');
            }
        }

        // 4. Top HUD Timer, Gold, Score, Best
        const timeEl = document.getElementById('hud-time');
        if (timeEl) {
            const mins = Math.floor(this.game.levelTime / 60);
            const secs = Math.floor(this.game.levelTime % 60);
            timeEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        const coinsEl = document.getElementById('hud-coins');
        if (coinsEl) coinsEl.textContent = `💰 ${player.coins}`;

        const scoreEl = document.getElementById('hud-score');
        if (scoreEl) scoreEl.textContent = String(Math.floor(this.game.score)).padStart(5, '0');

        const bestEl = document.getElementById('hud-best');
        if (bestEl) {
            const best = Math.max(this.game.score, this.game.highScoreManager.getBestScore());
            bestEl.textContent = String(Math.floor(best)).padStart(5, '0');
        }

        // 5. Bottom Under-Floor Status Bar (Game Stage, Weapon Level, Total Armor & Stats)
        const stageBadgeEl = document.getElementById('hud-stage-badge');
        if (stageBadgeEl && level) {
            stageBadgeEl.textContent = `STAGE ${level.id} / 10`;
        }

        const stageEl = document.getElementById('hud-stage');
        if (stageEl && level) {
            stageEl.textContent = `${level.id}: ${level.name}`;
        }

        const stageBossEl = document.getElementById('hud-stage-boss');
        if (stageBossEl && level) {
            stageBossEl.textContent = `Boss: ${level.boss}`;
        }

        const wLv = player.weapon.level || 1;
        const weaponTitleEl = document.getElementById('hud-weapon-title');
        if (weaponTitleEl) {
            weaponTitleEl.textContent = `Lv.${wLv}/5 ${player.weapon.name}`;
            weaponTitleEl.style.color = player.weapon.color || '#f8fafc';
        }
        const weaponStatsEl = document.getElementById('hud-weapon-stats');
        if (weaponStatsEl) {
            weaponStatsEl.textContent = `ATK: ${player.getEffectiveDamage()}${player.buffs.atk > 0 ? ' (2×!)' : ''}`;
        }
        this.renderLevelPips('hud-weapon-pips', wLv, 5);

        const aLv = typeof player.getTotalArmorTier === 'function' ? player.getTotalArmorTier() : (player.armor.level || 1);
        const armorTitleEl = document.getElementById('hud-armor-title');
        if (armorTitleEl) {
            armorTitleEl.textContent = `Lv.${player.armor.level || 1} ${player.armor.name} (+3 Slots)`;
            armorTitleEl.style.color = player.armor.color || '#f8fafc';
        }
        const armorStatsEl = document.getElementById('hud-armor-stats');
        if (armorStatsEl) {
            armorStatsEl.textContent = `DEF: ${player.defense} | HP: ${player.maxHp} | SPD: ${Math.round(player.getEffectiveSpeed())}`;
        }
        this.renderLevelPips('hud-armor-pips', aLv, 5);
    }
}

