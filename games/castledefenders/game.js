// Game State
const state = {
    resources: {
        gold: { value: 30, level: 1, baseCost: 30, payout: 10 },
        iron: { value: 20, level: 1, baseCost: 30, payout: 10 },
        food: { value: 20, level: 1, baseCost: 30, payout: 10 }
    },
    castle: {
        hp: 100,
        maxHp: 100,
        rooms: new Array(10).fill(null), // Slots 1-10 (index 0-9)
        moatLevel: 0
    },
    wave: 1,
    phase: 'prep', // 'prep' (Buy/Build) or 'defend'
    enemies: [],
    waveMaxHp: 0,
    waveCurrentHp: 0,
    difficulty: 'normal',
    waveQueue: [],
    combatInterval: null,
    currentUpgradeTarget: null,
    totalGoldEarned: 50,
    isPaused: false,
    pendingScore: 0,
    gameSpeed: 1
};

// Costs
const COSTS = {
    archer: { gold: 20, iron: 0, food: 15 },
    cannon: { gold: 0, iron: 40, food: 20 },
    barracks: { gold: 0, iron: 30, food: 60 },
    fireball: { gold: 20, iron: 20, food: 30 },
    goo: { gold: 10, iron: 10, food: 40 },
    snowbomb: { gold: 20, iron: 40, food: 10 },
    lightning: { gold: 50, iron: 0, food: 0 },
    gryphons: { gold: 50, iron: 0, food: 80 },
    laser: { gold: 100, iron: 100, food: 0 },
    dragons: { gold: 150, iron: 100, food: 150 },
    moat: { gold: 75, iron: 50, food: 0 },
    heal: { gold: 0, iron: 20, food: 0 }
};

const ROOM_STATS = {
    archer: { damage: 5, fireRate: 1, rangeBase: 30, name: 'Archer Room', img: 'assets/room_archer.png' },
    cannon: { damage: 20, fireRate: 3, rangeBase: 50, name: 'Cannon Room', img: 'assets/room_cannon.png' },
    barracks: { damage: 8, fireRate: 1, rangeBase: 25, name: 'Barracks', img: 'assets/room_barracks.png' },
    fireball: { damage: 15, fireRate: 2, rangeBase: 40, name: 'Fireball Room', img: 'assets/room_fireball.png' },
    goo: { damage: 2, fireRate: 2, rangeBase: 35, name: 'Goo Room', img: 'assets/room_goo.png' },
    snowbomb: { damage: 10, fireRate: 3, rangeBase: 40, name: 'Snowbomb Room', img: 'assets/room_snowbomb.png' },
    lightning: { damage: 12, fireRate: 2, rangeBase: 45, name: 'Lightning Room', img: 'assets/room_lightning.png' },
    gryphons: { damage: 15, fireRate: 2, rangeBase: 50, name: 'Gryphon Roost', img: 'assets/room_gryphons.png' },
    laser: { damage: 40, fireRate: 4, rangeBase: 80, name: 'Laser Room', img: 'assets/room_laser.png' },
    dragons: { damage: 50, fireRate: 5, rangeBase: 60, name: 'Dragon Roost', img: 'assets/room_dragons.png' }
};

// DOM Elements
const DOM = {
    res: {
        gold: document.getElementById('val-gold'),
        iron: document.getElementById('val-iron'),
        food: document.getElementById('val-food')
    },
    valDps: document.getElementById('val-dps'),
    wave: document.getElementById('val-wave'),
    phaseIndicator: document.getElementById('phase-indicator'),
    btnNextPhase: document.getElementById('btn-next-phase'),

    modals: {
        shop: document.getElementById('shop-modal'),
        upgrade: document.getElementById('upgrade-modal'),
        gameOver: document.getElementById('screen-gameover'),
        roomMenu: document.getElementById('room-menu-modal')
    },

    castleGrid: document.getElementById('castle-grid'),
    castleTopHpText: document.getElementById('castle-top-hp-text'),
    castleTopHpFill: document.getElementById('castle-top-hp-fill'),
    enemyArea: document.getElementById('enemy-area'),
    logContent: document.getElementById('log-content'),
    finalWave: document.getElementById('final-wave'),
    waveHpContainer: document.getElementById('wave-hp-container'),
    waveHpText: document.getElementById('wave-hp-text'),
    waveHpFill: document.getElementById('wave-hp-fill')
};

// Initialize Game
function init() {
    bindEvents();
    showScreen('screen-start');
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
    if (screenId === 'screen-highscores') loadHighScores();
}

function selectDifficulty(level) {
    state.difficulty = level;
    document.getElementById('btn-diff-easy').classList.remove('selected');
    document.getElementById('btn-diff-normal').classList.remove('selected');
    document.getElementById('btn-diff-hardcore').classList.remove('selected');
    document.getElementById('btn-diff-' + level).classList.add('selected');
}

function startGame() {
    state.phase = 'prep';
    state.wave = 1;
    
    // Setup economy based on difficulty
    if (state.difficulty === 'easy') {
        state.resources.gold = { value: 30, level: 1, baseCost: 30, payout: 10 };
        state.resources.iron = { value: 20, level: 1, baseCost: 30, payout: 10 };
        state.resources.food = { value: 20, level: 1, baseCost: 30, payout: 10 };
    } else if (state.difficulty === 'hardcore') {
        state.resources.gold = { value: 20, level: 1, baseCost: 30, payout: 5 };
        state.resources.iron = { value: 10, level: 1, baseCost: 30, payout: 5 };
        state.resources.food = { value: 10, level: 1, baseCost: 30, payout: 5 };
    } else { // normal
        state.resources.gold = { value: 25, level: 1, baseCost: 30, payout: 7 };
        state.resources.iron = { value: 15, level: 1, baseCost: 30, payout: 7 };
        state.resources.food = { value: 15, level: 1, baseCost: 30, payout: 7 };
    }
    state.castle.hp = 100;
    state.castle.maxHp = 100;
    state.castle.moatLevel = 0;
    state.castle.rooms = new Array(10).fill(null);
    state.enemies = [];
    state.waveQueue = [];
    state.totalGoldEarned = 0; // Starts at 0, payout adds to it
    state.isPaused = false;
    state.gameSpeed = 1;

    const indicator = document.getElementById('speed-indicator');
    if (indicator) indicator.classList.add('hidden');

    DOM.enemyArea.innerHTML = '';
    DOM.logContent.innerHTML = '';

    // Explicitly reset UI to 'prep' state in case of restart from game over
    DOM.phaseIndicator.innerText = 'Phase: Buy & Build';
    DOM.phaseIndicator.style.color = '#4ade80';
    DOM.btnNextPhase.style.display = 'block';
    DOM.waveHpContainer.classList.add('hidden');
    document.getElementById('battlefield').classList.add('phase-buy');

    logCombat(`Welcome to Castle Defenders\n========================`, 'system');

    updateCastleGridVisuals();

    placeRoom('archer', 1);

    showScreen('screen-play');

    grantRoundPayouts();
    updateUI();
}

function quitGame() {
    clearInterval(state.combatInterval);
    document.getElementById('overlay-pause').classList.add('hidden');
    showScreen('screen-start');
}

function togglePause() {
    if (document.getElementById('screen-play').classList.contains('hidden')) return;

    state.isPaused = !state.isPaused;

    if (state.isPaused) {
        document.getElementById('overlay-pause').classList.remove('hidden');
        clearInterval(state.combatInterval);
        document.querySelectorAll('.enemy, .projectile').forEach(el => el.style.animationPlayState = 'paused');
    } else {
        document.getElementById('overlay-pause').classList.add('hidden');
        if (state.phase === 'defend') {
            state.combatInterval = setInterval(combatTick, 500 / state.gameSpeed);
        }
        document.querySelectorAll('.enemy, .projectile').forEach(el => el.style.animationPlayState = 'running');
    }
}

function setGameSpeed(speed) {
    state.gameSpeed = speed;
    if (state.phase === 'defend' && !state.isPaused) {
        clearInterval(state.combatInterval);
        state.combatInterval = setInterval(combatTick, 500 / state.gameSpeed);
    }
    
    const indicator = document.getElementById('speed-indicator');
    if (indicator) {
        if (speed === 2) indicator.classList.remove('hidden');
        else indicator.classList.add('hidden');
    }
    
    logCombat(`[DEV] Game Speed set to ${speed}x!`, 'system');
}

function bindEvents() {
    DOM.btnNextPhase.addEventListener('click', startDefendPhase);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') togglePause();
        if (e.key === 'q' || e.key === 'Q') {
            setGameSpeed(state.gameSpeed === 1 ? 2 : 1);
        }
    });

    document.querySelectorAll('.room-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            const idx = parseInt(slot.getAttribute('data-slot')) - 1;
            if (state.castle.rooms[idx]) {
                openRoomMenu(idx);
            }
        });
    });

    document.getElementById('btn-sell-room').addEventListener('click', sellRoom);
}

// Phase Management
function grantRoundPayouts() {
    let earnedGold = state.resources.gold.level * state.resources.gold.payout;
    let earnedIron = state.resources.iron.level * state.resources.iron.payout;
    let earnedFood = state.resources.food.level * state.resources.food.payout;

    state.resources.gold.value += earnedGold;
    state.resources.iron.value += earnedIron;
    state.resources.food.value += earnedFood;

    state.totalGoldEarned += earnedGold;

    logCombat(`Round ${state.wave} payout: +${earnedGold}🪙 +${earnedIron}⛏️ +${earnedFood}🌾`, 'system');
}

function spawnDragonAlly() {
    const el = document.createElement('div');
    el.className = 'enemy dragon-ally';
    el.innerHTML = `🐲<div class="enemy-hp" style="color:#4ade80;">500</div>`;
    el.style.left = '25%';
    el.style.top = '30%';
    el.style.transform = 'scale(-1, 1)';
    el.style.textShadow = '0 0 10px #4ade80';
    DOM.enemyArea.appendChild(el);

    state.dragonAlly = {
        el, hp: 500, maxHp: 500, damage: ROOM_STATS.dragons.damage,
        x: 25, y: 30, cooldown: 0
    };
}

function startDefendPhase() {
    if (state.phase === 'defend') return;

    state.phase = 'defend';
    DOM.phaseIndicator.innerText = 'Phase: Defend';
    DOM.phaseIndicator.style.color = '#d32f2f';
    DOM.btnNextPhase.style.display = 'none';
    document.getElementById('battlefield').classList.remove('phase-buy');

    closeMenu();
    closeShop();

    let numEnemies = Math.floor(state.wave * 2.0) + 2;
    let spawnDelay = 1000;
    
    if (state.difficulty === 'easy') {
        numEnemies = Math.floor(state.wave * 1.5) + 2;
        spawnDelay = 1200;
    } else if (state.difficulty === 'hardcore') {
        numEnemies = Math.floor(state.wave * 2.5) + 3;
        spawnDelay = 850;
    }
    
    state.waveMaxHp = 0;
    state.waveQueue = [];
    const availableTypes = ENEMY_TYPES.filter(t => t.minWave <= state.wave);

    for (let i = 0; i < numEnemies; i++) {
        const template = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const hp = template.hp + (state.wave * template.hpScale);
        state.waveMaxHp += hp;
        state.waveQueue.push({ template, hp });
    }
    state.waveCurrentHp = state.waveMaxHp;

    DOM.waveHpContainer.classList.remove('hidden');
    updateWaveHPUI();

    for (let i = 0; i < numEnemies; i++) {
        setTimeout(() => spawnEnemyFromQueue(), (i * spawnDelay) / state.gameSpeed);
    }

    state.dragonAlly = null;
    const hasDragonRoom = state.castle.rooms.some(r => r && r.type === 'dragons');
    if (hasDragonRoom) {
        spawnDragonAlly();
    }

    logCombat(`Round ${state.wave} attack wave incoming!`, 'system');
    state.combatInterval = setInterval(combatTick, 500 / state.gameSpeed);
}

function endDefendPhase() {
    clearInterval(state.combatInterval);

    if (state.dragonAlly && state.dragonAlly.el) {
        state.dragonAlly.el.remove();
        state.dragonAlly = null;
    }

    logCombat(`Round ${state.wave} wave enemies defeated!`, 'system');

    if (state.wave >= 100) {
        gameOver(true);
        return;
    }

    state.phase = 'prep';
    state.wave++;

    DOM.phaseIndicator.innerText = 'Phase: Buy & Build';
    DOM.phaseIndicator.style.color = '#4ade80';
    DOM.btnNextPhase.style.display = 'block';
    DOM.waveHpContainer.classList.add('hidden');
    document.getElementById('battlefield').classList.add('phase-buy');

    logCombat(`-----------------------------------`, 'system');
    grantRoundPayouts();
    updateUI();
}

// Menus and Shops
function openShop() {
    if (state.phase === 'defend') return;
    
    // Refresh affordability UI
    document.querySelectorAll('.shop-item[data-type]').forEach(btn => {
        const type = btn.getAttribute('data-type');
        let cost = COSTS[type];
        if (type === 'moat') {
            cost = { gold: state.castle.moatLevel === 0 ? 75 : 125 * state.castle.moatLevel, iron: 0, food: 0 };
        } else if (type === 'heal') {
            cost = COSTS.heal;
        }

        let affordable = true;
        let costHtml = [];
        if (cost.gold) {
            const has = state.resources.gold.value >= cost.gold;
            if (!has) affordable = false;
            costHtml.push(`<span class="${has ? '' : 'unaffordable-res'}">${cost.gold} 🪙</span>`);
        }
        if (cost.iron) {
            const has = state.resources.iron.value >= cost.iron;
            if (!has) affordable = false;
            costHtml.push(`<span class="${has ? '' : 'unaffordable-res'}">${cost.iron} ⛏️</span>`);
        }
        if (cost.food) {
            const has = state.resources.food.value >= cost.food;
            if (!has) affordable = false;
            costHtml.push(`<span class="${has ? '' : 'unaffordable-res'}">${cost.food} 🌾</span>`);
        }

        const costDiv = btn.querySelector('.cost');
        if (costDiv) {
            costDiv.innerHTML = costHtml.join(', ');
        }

        // Additional check: are slots full?
        let slotsFull = true;
        for (let i = 0; i < 10; i++) {
            if (state.castle.rooms[i] === null) {
                slotsFull = false;
                break;
            }
        }
        
        // Moat and Heal don't need empty slots
        if (slotsFull && type !== 'moat' && type !== 'heal') {
            affordable = false;
        }

        // Limit Dragon Roost to 1
        if (type === 'dragons') {
            const hasDragonRoom = state.castle.rooms.some(r => r && r.type === 'dragons');
            if (hasDragonRoom) {
                affordable = false;
            }
        }

        if (affordable) {
            btn.classList.remove('unaffordable-item');
            btn.disabled = false;
        } else {
            btn.classList.add('unaffordable-item');
            btn.disabled = true;
        }
    });

    DOM.modals.shop.classList.remove('hidden');
}

function closeShop() {
    DOM.modals.shop.classList.add('hidden');
}

function openMenu(type) {
    if (state.phase === 'defend') return;
    state.currentUpgradeTarget = type;

    const res = state.resources[type];
    const cost = Math.floor(res.baseCost * Math.pow(1.5, res.level - 1));

    document.getElementById('upg-title').innerText = `Upgrade ${type.toUpperCase()}`;
    document.getElementById('upg-cost').innerText = `${cost} 🪙`;

    DOM.modals.upgrade.classList.remove('hidden');

    const btn = document.getElementById('btn-do-upgrade');
    btn.onclick = () => doUpgrade(type, cost);
    btn.disabled = state.resources.gold.value < cost;
}

function closeMenu() {
    DOM.modals.upgrade.classList.add('hidden');
    state.currentUpgradeTarget = null;
}

function doUpgrade(type, cost) {
    if (state.resources.gold.value >= cost) {
        state.resources.gold.value -= cost;
        state.resources[type].level++;
        closeMenu();
        updateUI();
        let typeName = type;
        if (type === 'gold') typeName = 'Gold Mine';
        else if (type === 'iron') typeName = 'Iron Mine';
        else if (type === 'food') typeName = 'Farm';

        logCombat(`${typeName} upgraded to level ${state.resources[type].level}!`, 'system');
    }
}

function openRoomMenu(idx) {
    if (state.phase === 'defend') return;
    state.selectedRoomIdx = idx;
    const room = state.castle.rooms[idx];
    if (!room) return;

    const stats = ROOM_STATS[room.type];
    const cost = COSTS[room.type];
    const refundGold = Math.floor((cost.gold || 0) * 0.5);
    const refundIron = Math.floor((cost.iron || 0) * 0.5);
    const refundFood = Math.floor((cost.food || 0) * 0.5);
    
    let refundText = [];
    if (refundGold > 0) refundText.push(`${refundGold} 🪙`);
    if (refundIron > 0) refundText.push(`${refundIron} ⛏️`);
    if (refundFood > 0) refundText.push(`${refundFood} 🌾`);

    document.getElementById('room-menu-title').innerText = stats.name;
    document.getElementById('room-sell-value').innerText = refundText.join(', ') || '0';
    
    DOM.modals.roomMenu.classList.remove('hidden');
}

function closeRoomMenu() {
    DOM.modals.roomMenu.classList.add('hidden');
    state.selectedRoomIdx = null;
}

function sellRoom() {
    if (state.selectedRoomIdx === null || state.phase === 'defend') return;
    const idx = state.selectedRoomIdx;
    const room = state.castle.rooms[idx];
    if (!room) return;

    const cost = COSTS[room.type];
    state.resources.gold.value += Math.floor((cost.gold || 0) * 0.5);
    state.resources.iron.value += Math.floor((cost.iron || 0) * 0.5);
    state.resources.food.value += Math.floor((cost.food || 0) * 0.5);

    logCombat(`Sold ${ROOM_STATS[room.type].name} from slot ${idx + 1}.`, 'system');

    state.castle.rooms[idx] = null;

    const BUILD_ORDER = [1, 0, 3, 2, 5, 4, 7, 6, 9, 8];
    const activeRooms = [];
    for (let i of BUILD_ORDER) {
        if (state.castle.rooms[i]) {
            activeRooms.push(state.castle.rooms[i]);
        }
    }

    state.castle.rooms = new Array(10).fill(null);

    for (let i = 0; i < activeRooms.length; i++) {
        state.castle.rooms[BUILD_ORDER[i]] = activeRooms[i];
    }

    closeRoomMenu();

    for (let i = 0; i < 10; i++) {
        const slotEl = document.querySelector(`.room-slot[data-slot="${i + 1}"]`);
        if (state.castle.rooms[i]) {
            slotEl.innerHTML = `<img src="${ROOM_STATS[state.castle.rooms[i].type].img}" alt="${state.castle.rooms[i].type}">
                                <div class="lvl-badge">Lv ${state.castle.rooms[i].level}</div>`;
        } else {
            slotEl.innerHTML = '';
        }
    }

    updateCastleGridVisuals();
    updateUI();
}

function buyRoom(type) {
    if (type === 'dragons') {
        const hasDragonRoom = state.castle.rooms.some(r => r && r.type === 'dragons');
        if (hasDragonRoom) {
            alert("You can only have 1 Dragon Roost!");
            return;
        }
    }

    const cost = COSTS[type];
    if (state.resources.gold.value >= cost.gold && state.resources.iron.value >= cost.iron && state.resources.food.value >= cost.food) {

        // Find empty slot based on reverse growth order
        const BUILD_ORDER = [1, 0, 3, 2, 5, 4, 7, 6, 9, 8];
        let slotIdx = -1;
        for (let idx of BUILD_ORDER) {
            if (state.castle.rooms[idx] === null) {
                slotIdx = idx;
                break;
            }
        }

        if (slotIdx === -1) {
            alert("No empty slots remaining in the castle!");
            return;
        }

        state.resources.gold.value -= cost.gold;
        state.resources.iron.value -= cost.iron;
        state.resources.food.value -= cost.food;

        placeRoom(type, slotIdx);
        updateUI();
        if (!DOM.modals.shop.classList.contains('hidden')) openShop();
    } else {
        alert("Not enough resources.");
    }
}

function placeRoom(type, slotIdx) {
    state.castle.rooms[slotIdx] = {
        type: type,
        level: 1,
        cooldown: 0
    };

    // Update visuals
    const slotEl = document.querySelector(`.room-slot[data-slot="${slotIdx + 1}"]`);
    slotEl.innerHTML = `<img src="${ROOM_STATS[type].img}" alt="${type}">
                        <div class="lvl-badge">Lv 1</div>`;

    updateCastleGridVisuals();
    logCombat(`${ROOM_STATS[type].name} built in slot ${slotIdx + 1}!`, 'system');
}

function updateCastleGridVisuals() {
    document.querySelectorAll('.room-slot').forEach(el => {
        el.classList.remove('has-room', 'buildable', 'is-top', 'is-bottom', 'is-left', 'is-right');
        const cren = el.querySelector('.crenellation');
        if (cren) cren.remove();
    });

    const rooms = state.castle.rooms;
    let maxRow = -1;

    // Apply basic has-room class to all built rooms, find maxRow, and set frame borders
    for (let i = 0; i < 10; i++) {
        if (rooms[i] !== null) {
            const el = document.querySelector(`.room-slot[data-slot="${i + 1}"]`);
            el.classList.add('has-room');

            const row = Math.floor(i / 2);
            const col = i % 2;
            if (row > maxRow) maxRow = row;

            // Frame classes
            if (row === 0) el.classList.add('is-bottom');
            if (col === 0 || rooms[i - 1] === null) el.classList.add('is-left');
            if (col === 1 || rooms[i + 1] === null) el.classList.add('is-right');

            // is-top if row is 4 or the slot directly above (i + 2) is null
            if (row === 4 || rooms[i + 2] === null) {
                el.classList.add('is-top');

                // Add crenellations
                const cren = document.createElement('div');
                cren.className = 'crenellation';
                el.appendChild(cren);
            }
        }
    }

    // Update Front Turret height and windows
    const turretBody = document.getElementById('turret-body');
    if (turretBody) {
        turretBody.querySelectorAll('.turret-window').forEach(w => w.remove());
        if (maxRow >= 0) {
            const numFloors = maxRow + 1;
            turretBody.style.height = `${(numFloors * 80) + 20}px`;
            for (let r = 1; r <= maxRow; r++) {
                const win = document.createElement('div');
                win.className = 'turret-window';
                const bottomPos = (r * 80) + 22.5;
                win.style.bottom = `${bottomPos}px`;
                turretBody.appendChild(win);
            }
        } else {
            turretBody.style.height = '0px';
        }
    }

    // Update Back Turret height and windows
    const backTurretBody = document.getElementById('back-turret-body');
    if (backTurretBody) {
        backTurretBody.querySelectorAll('.turret-window').forEach(w => w.remove());
        if (maxRow >= 0) {
            const numFloors = maxRow + 1;
            backTurretBody.style.height = `${(numFloors * 80) + 20}px`;
            for (let r = 1; r <= maxRow; r++) {
                const win = document.createElement('div');
                win.className = 'turret-window';
                const bottomPos = (r * 80) + 26;
                win.style.bottom = `${bottomPos}px`;
                backTurretBody.appendChild(win);
            }
        } else {
            backTurretBody.style.height = '0px';
        }
    }

    // Find buildable slots and clear lingering empty slots
    for (let i = 0; i < 10; i++) {
        if (rooms[i] === null) {
            const slotEl = document.querySelector(`.room-slot[data-slot="${i + 1}"]`);
            if (slotEl) slotEl.innerHTML = ''; // Clear old images
            
            const isBottomRow = (i === 0 || i === 1);
            const slotBelowHasRoom = !isBottomRow && rooms[i - 2] !== null;
            if (isBottomRow || slotBelowHasRoom) {
                slotEl.classList.add('buildable');
            }
        }
    }
}

function upgradeMoat() {
    const cost = state.castle.moatLevel === 0 ? 75 : 125 * state.castle.moatLevel;
    if (state.resources.gold.value >= cost) {
        state.resources.gold.value -= cost;
        state.castle.moatLevel++;
        logCombat(`Moat upgraded to level ${state.castle.moatLevel}!`, 'system');
        updateUI();
        if (!DOM.modals.shop.classList.contains('hidden')) openShop();
    }
}

function healCastle() {
    if (state.resources.iron.value >= COSTS.heal.iron && state.castle.hp < state.castle.maxHp) {
        state.resources.iron.value -= COSTS.heal.iron;
        state.castle.hp = Math.min(state.castle.maxHp, state.castle.hp + 20);
        logCombat(`Castle repaired 20 HP.`, 'heal');
        updateUI();
        if (!DOM.modals.shop.classList.contains('hidden')) openShop();
    }
}

const ENEMY_TYPES = [
    // Original Classics
    { emoji: '🧟', name: 'Zombie', minWave: 1, hp: 15, hpScale: 4, speed: 0.8, damage: 3, type: 'ground' },
    { emoji: '👹', name: 'Orc', minWave: 3, hp: 40, hpScale: 10, speed: 0.8, damage: 8, type: 'ground' },
    // Ground
    { emoji: '🐗', name: 'Boar', minWave: 1, hp: 15, hpScale: 4, speed: 1.0, damage: 3, type: 'ground' },
    { emoji: '👺', name: 'Goblin', minWave: 2, hp: 20, hpScale: 5, speed: 1.2, damage: 4, type: 'ground' },
    { emoji: '🦂', name: 'Scorpion', minWave: 3, hp: 25, hpScale: 6, speed: 0.9, damage: 6, type: 'ground' },
    { emoji: '🦍', name: 'Gorilla', minWave: 4, hp: 50, hpScale: 12, speed: 0.7, damage: 10, type: 'ground' },
    { emoji: '🧛🏾', name: 'Vampire', minWave: 5, hp: 40, hpScale: 8, speed: 1.1, damage: 8, type: 'ground' },
    { emoji: '🎃', name: 'Jack-O-Lantern', minWave: 6, hp: 30, hpScale: 7, speed: 1.3, damage: 7, type: 'ground' },
    { emoji: '🦹🏻', name: 'Supervillain', minWave: 8, hp: 80, hpScale: 15, speed: 0.8, damage: 15, type: 'ground' },
    // Flying
    { emoji: '🦇', name: 'Bat', minWave: 3, hp: 10, hpScale: 3, speed: 1.5, damage: 2, type: 'flying' },
    { emoji: '👻', name: 'Ghost', minWave: 5, hp: 25, hpScale: 5, speed: 1.2, damage: 5, type: 'flying' },
    { emoji: '👽', name: 'Alien', minWave: 7, hp: 35, hpScale: 6, speed: 1.8, damage: 8, type: 'flying' },
    { emoji: '🐉', name: 'Dragon', minWave: 9, hp: 100, hpScale: 20, speed: 0.9, damage: 20, type: 'flying' }
];

const PATHS = [
    [
        { x: 99.83, y: 78.07 }, { x: 93.92, y: 77.29 }, { x: 85.25, y: 73.87 }, { x: 78.83, y: 70.25 },
        { x: 75, y: 66.84 }, { x: 72.17, y: 63.12 }, { x: 67.17, y: 60.49 }, { x: 63.17, y: 59.71 },
        { x: 57.42, y: 58.63 }, { x: 51.42, y: 57.75 }, { x: 46.33, y: 56.48 }, { x: 42.08, y: 54.34 },
        { x: 37.67, y: 53.95 }, { x: 32.92, y: 56.19 }, { x: 26.33, y: 57.85 }, { x: 22.75, y: 57.85 }
    ],
    [
        { x: 99.83, y: 38.81 }, { x: 94.5, y: 38.91 }, { x: 90.25, y: 39.49 }, { x: 86.75, y: 40.27 },
        { x: 87.33, y: 44.18 }, { x: 91.17, y: 47.5 }, { x: 91.08, y: 52.29 }, { x: 86.33, y: 53.46 },
        { x: 80.42, y: 54.53 }, { x: 74.25, y: 55.51 }, { x: 69.58, y: 56.48 }, { x: 64.58, y: 57.46 },
        { x: 58.42, y: 56.97 }, { x: 52.42, y: 56.58 }, { x: 48.92, y: 56.78 }, { x: 44.25, y: 55.31 },
        { x: 40.58, y: 53.85 }, { x: 35.58, y: 54.63 }, { x: 30, y: 57.66 }, { x: 22.92, y: 58.83 }
    ],
    [
        { x: 84.92, y: 23.92 }, { x: 83.67, y: 24.31 }, { x: 82.42, y: 24.89 }, { x: 80.75, y: 25.58 },
        { x: 80.34, y: 26.46 }, { x: 81.25, y: 27.33 }, { x: 83.92, y: 27.82 }, { x: 85.92, y: 28.12 },
        { x: 88.5, y: 28.51 }, { x: 90.08, y: 29.78 }, { x: 89.42, y: 31.53 }, { x: 87.33, y: 32.61 },
        { x: 83.58, y: 33.78 }, { x: 79.67, y: 35.44 }, { x: 76.92, y: 37.39 }, { x: 80.75, y: 39.54 },
        { x: 84.83, y: 41.1 }, { x: 88.08, y: 44.42 }, { x: 90.08, y: 48.23 }, { x: 86.25, y: 52.53 },
        { x: 76.75, y: 54.48 }, { x: 68.17, y: 55.65 }, { x: 64.17, y: 58.88 }, { x: 58.5, y: 60.15 },
        { x: 54.08, y: 55.85 }, { x: 47.33, y: 55.85 }, { x: 44.08, y: 55.26 }, { x: 40.75, y: 53.9 },
        { x: 37.42, y: 54.19 }, { x: 34, y: 55.46 }, { x: 30.25, y: 58.1 }, { x: 28.5, y: 59.07 }
    ]
];

function spawnEnemyFromQueue() {
    if (state.phase !== 'defend') return;
    if (state.isPaused) {
        setTimeout(spawnEnemyFromQueue, 100);
        return;
    }
    if (state.waveQueue.length === 0) return;
    const data = state.waveQueue.shift();
    const template = data.template;

    const hp = data.hp;
    const damage = template.damage;

    const el = document.createElement('div');
    el.className = 'enemy';
    el.innerHTML = `${template.emoji}<div class="enemy-hp">${hp}</div>`;

    let pathIdx = -1;
    let startX = 0, startY = 0;

    if (template.type === 'ground') {
        pathIdx = Math.floor(Math.random() * PATHS.length);
        startX = PATHS[pathIdx][0].x;
        startY = PATHS[pathIdx][0].y;
    } else {
        // Flying
        startX = 99;
        startY = 10 + Math.random() * 30; // Random height between 10% and 40%
    }

    // Setup scaling for path 2
    if (pathIdx === 2) {
        const initialScale = Math.max(0.15, Math.min(1.0, 0.15 + (startY - 23) / 15 * 0.85));
        el.style.transform = `scale(${initialScale})`;
        el.style.left = `calc(${startX}% - ${(25 * initialScale) + 15}px)`;
        el.style.top = `calc(${startY}% - 40px)`;
    } else {
        el.style.left = `${startX}%`;
        el.style.top = `calc(${startY}% - 50px)`;
    }

    DOM.enemyArea.appendChild(el);

    state.enemies.push({
        el, hp, maxHp: hp, damage, name: template.name,
        path: pathIdx, targetWp: 1, x: startX, y: startY,
        speed: template.speed, type: template.type,
        baseY: startY, moatTick: 0
    });
}

function combatTick() {
    if (state.enemies.length === 0) return;

    // Process Moat Damage
    if (state.castle.moatLevel > 0) {
        state.enemies.forEach(enemy => {
            // Moat is now right in front of the expanded castle edge (28.5% to 35%)
            if (enemy.x > 28.5 && enemy.x < 35 && enemy.type !== 'flying') {
                enemy.moatTick++;
                if (enemy.moatTick % 2 === 0) {
                    const dmg = state.castle.moatLevel * 3;
                    enemy.hp -= dmg;
                    updateWaveHPUI();
                    createFloatyText(enemy.el, `-${dmg} (Moat)`, '#1e88e5');
                }
            }
        });
    }

    // Process Castle Rooms Attacking
    state.castle.rooms.forEach((room, idx) => {
        if (!room) return;
        if (room.type === 'dragons') return; // dragons don't shoot from room

        if (room.cooldown > 0) {
            room.cooldown--;
            return;
        }

        const stats = ROOM_STATS[room.type];
        const row = Math.floor(idx / 2); // 0 to 4
        const range = stats.rangeBase + (row * 10);

        // Attack threshold (castle is roughly 12% on the left, so + range)
        const attackThreshold = 12 + range;

        const target = state.enemies.find(e => {
            if (e.x > attackThreshold || (e.hp - (e.pendingDamage || 0)) <= 0) return false;
            if (room.type === 'cannon' && e.type !== 'ground') return false;
            if (room.type === 'gryphons' && e.type !== 'flying') return false;
            return true;
        });

        if (target) {
            let finalDamage = stats.damage;

            if (room.type === 'archer') {
                if (target.type === 'flying') finalDamage = Math.ceil(finalDamage * 1.15);
                else if (target.type === 'ground') finalDamage = Math.floor(finalDamage * 0.85);
            }

            // Register pending damage to prevent overkill
            target.pendingDamage = (target.pendingDamage || 0) + finalDamage;
            room.cooldown = stats.fireRate; // wait ticks

            if (room.type === 'laser') {
                target.hp -= finalDamage;
                target.pendingDamage -= finalDamage;
                updateWaveHPUI();
                createFloatyText(target.el, `-${finalDamage} (Laser)`, '#f44336');
                if (target.hp <= 0 && !target.bountyAwarded) {
                    state.resources.gold.value += 5; target.bountyAwarded = true;
                    state.totalGoldEarned += 5;
                }
            } else if (room.type === 'lightning') {
                target.hp -= finalDamage;
                target.pendingDamage -= finalDamage;
                createFloatyText(target.el, `-${finalDamage} ⚡`, '#ffeb3b');
                if (target.hp <= 0 && !target.bountyAwarded) {
                    state.resources.gold.value += 5; target.bountyAwarded = true;
                    state.totalGoldEarned += 5;
                }
                
                // Chain to 1
                const chainTarget = state.enemies.find(e => e !== target && e.hp > 0 && Math.abs(e.x - target.x) < 10);
                if (chainTarget) {
                    const chainDmg = Math.floor(finalDamage * 0.5);
                    chainTarget.hp -= chainDmg;
                    createFloatyText(chainTarget.el, `-${chainDmg} ⚡`, '#ffeb3b');
                    if (chainTarget.hp <= 0 && !chainTarget.bountyAwarded) {
                        state.resources.gold.value += 5; chainTarget.bountyAwarded = true;
                        state.totalGoldEarned += 5;
                    }
                }
                updateWaveHPUI();
            } else {
                // Visual projectile
                const startX = 26;
                const startY = ((1024 - 441 - (row * 80)) / 1024) * 100;
                createProjectile(target, startX, startY, room.type, finalDamage);
            }
        }
    });

    // Cleanup dead enemies
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        if (state.enemies[i].hp <= 0) {
            state.enemies[i].el.remove();
            state.enemies.splice(i, 1);
        }
    }

    // Check Win Round
    if (state.enemies.length === 0) {
        endDefendPhase();
        return;
    }

    // Dragon Ally Logic
    if (state.dragonAlly && state.dragonAlly.hp > 0) {
        if (state.dragonAlly.cooldown > 0) state.dragonAlly.cooldown--;
        
        let nearest = null;
        let minDist = 999;
        state.enemies.forEach(e => {
            if (e.hp > 0) {
                const dist = Math.sqrt(Math.pow(e.x - state.dragonAlly.x, 2) + Math.pow(e.y - state.dragonAlly.y, 2));
                if (dist < minDist) { minDist = dist; nearest = e; }
            }
        });

        if (nearest) {
            const dx = nearest.x - state.dragonAlly.x;
            const dy = nearest.y - state.dragonAlly.y;
            if (minDist > 10) {
                state.dragonAlly.x += (dx / minDist) * 1.5;
                state.dragonAlly.y += (dy / minDist) * 1.5;
            } else if (state.dragonAlly.cooldown === 0) {
                nearest.pendingDamage = (nearest.pendingDamage || 0) + state.dragonAlly.damage;
                createProjectile(nearest, state.dragonAlly.x, state.dragonAlly.y, 'dragons', state.dragonAlly.damage);
                state.dragonAlly.cooldown = ROOM_STATS.dragons.fireRate;
            }
        } else {
            state.dragonAlly.x += (25 - state.dragonAlly.x) * 0.1;
            state.dragonAlly.y += (30 - state.dragonAlly.y) * 0.1;
        }
        
        state.dragonAlly.el.style.left = `${state.dragonAlly.x}%`;
        state.dragonAlly.el.style.top = `${state.dragonAlly.y}%`;
    }

    // Enemies Move & Attack
    let totalDamage = 0;
    state.enemies.forEach(enemy => {
        enemy.el.querySelector('.enemy-hp').innerText = Math.ceil(enemy.hp);

        if (enemy.slowTick > 0) {
            enemy.slowTick--;
            enemy.speedMultiplier = 0.7;
        } else {
            enemy.speedMultiplier = 1.0;
        }

        if (enemy.burnTick > 0) {
            enemy.burnTick--;
            if (enemy.burnTick % 2 === 0) { // dmg every other tick
                enemy.hp -= 2;
                createFloatyText(enemy.el, `-2🔥`, '#ff9800');
                if (enemy.hp <= 0 && !enemy.bountyAwarded) {
                    state.resources.gold.value += 5; enemy.bountyAwarded = true;
                    state.totalGoldEarned += 5;
                }
            }
        }

        if (enemy.hp <= 0) return;

        const speed = (enemy.speed || 0.8) * enemy.speedMultiplier;

        // Attack Dragon?
        if (state.dragonAlly && state.dragonAlly.hp > 0 && Math.abs(enemy.x - state.dragonAlly.x) < 5 && Math.abs(enemy.y - state.dragonAlly.y) < 15) {
            state.dragonAlly.hp -= enemy.damage;
            state.dragonAlly.el.querySelector('.enemy-hp').innerText = Math.ceil(state.dragonAlly.hp);
            enemy.el.style.transform = 'translateY(-10px)';
            setTimeout(() => { if (enemy.el) enemy.el.style.transform = 'translateY(0)'; }, 250);
            
            if (state.dragonAlly.hp <= 0) {
                state.dragonAlly.el.remove();
                state.dragonAlly = null;
                logCombat(`Dragon Ally was defeated!`, 'damage');
            }
            return;
        }

        if (enemy.type === 'ground') {
            if (enemy.x <= 28.5) {
                totalDamage += enemy.damage;
                enemy.el.style.transform = 'translateY(-10px)';
                setTimeout(() => { if (enemy.el) enemy.el.style.transform = 'translateY(0)'; }, 250);
            } else {
                const wp = PATHS[enemy.path][enemy.targetWp];
                if (wp) {
                    const dx = wp.x - enemy.x;
                    const dy = wp.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 1.5) {
                        enemy.targetWp++;
                    } else {
                        enemy.x += (dx / dist) * speed;
                        enemy.y += (dy / dist) * speed;
                    }
                } else {
                    enemy.x -= speed;
                }

                let xOffset = 0;
                let yOffset = 50;
                if (enemy.path === 2) {
                    const scale = Math.max(0.15, Math.min(1.0, 0.15 + (enemy.y - 23) / 15 * 0.85));
                    if (enemy.x > 13) {
                        enemy.el.style.transform = `scale(${scale})`;
                    }
                    xOffset = (25 * scale) + 15;
                    yOffset = 40;
                }

                if (xOffset > 0) {
                    enemy.el.style.left = `calc(${enemy.x}% - ${xOffset}px)`;
                } else {
                    enemy.el.style.left = `${enemy.x}%`;
                }
                enemy.el.style.top = `calc(${enemy.y}% - ${yOffset}px)`;
            }

        } else if (enemy.type === 'flying') {
            enemy.x -= speed;
            enemy.y = enemy.baseY + Math.sin(enemy.x * 0.2) * 5;
            enemy.el.style.left = `${enemy.x}%`;
            enemy.el.style.top = `calc(${enemy.y}% - 50px)`;

            if (enemy.x <= 28.5) {
                totalDamage += enemy.damage;
                enemy.el.style.transform = 'translateY(-10px)';
                setTimeout(() => { if (enemy.el) enemy.el.style.transform = 'translateY(0)'; }, 250);
            }
        }
    });

    // Take Damage
    if (totalDamage > 0) {
        state.castle.hp -= totalDamage;
        logCombat(`Castle took ${totalDamage} damage!`, 'damage');
        updateUI();

        if (state.castle.hp <= 0) {
            logCombat(`Castle destroyed! Triggering game over...`, 'damage');
            gameOver();
        }
    }
}

function createProjectile(target, startX, startY, type, finalDamage) {
    const p = document.createElement('div');
    const isArrow = type === 'archer' || type === 'barracks';
    p.className = `projectile ${isArrow ? 'arrow' : ''}`;

    if (isArrow) {
        p.innerHTML = `<svg viewBox="0 0 40 10" style="width: 25px; height: 6px; overflow: visible;"><path d="M0,4 L30,4 L30,0 L40,5 L30,10 L30,6 L0,6 Z" fill="#795548" stroke="#3e2723" stroke-width="1"/></svg>`;
        p.style.background = 'transparent';
        p.style.width = '25px';
        p.style.height = '6px';
        p.style.borderRadius = '0';
    } else if (type === 'fireball' || type === 'dragons') {
        p.style.width = '15px'; p.style.height = '15px';
        p.style.background = 'radial-gradient(circle, #ffeb3b, #f44336)';
        p.style.borderRadius = '50%';
        p.style.boxShadow = '0 0 10px #f44336';
    } else if (type === 'goo') {
        p.style.width = '12px'; p.style.height = '12px';
        p.style.background = '#8bc34a';
        p.style.borderRadius = '50%';
    } else if (type === 'snowbomb') {
        p.style.width = '15px'; p.style.height = '15px';
        p.style.background = '#bbdefb';
        p.style.borderRadius = '50%';
    } else if (type === 'gryphons') {
        p.style.width = '20px'; p.style.height = '4px';
        p.style.background = '#e0e0e0';
        p.style.borderRadius = '50%';
    } else {
        p.style.width = '10px'; p.style.height = '10px';
        p.style.background = '#000';
        p.style.borderRadius = '50%';
    }

    DOM.enemyArea.appendChild(p);

    const startT = performance.now();
    const duration = 400 / state.gameSpeed; // ms travel time

    function animateProj(now) {
        let t = (now - startT) / duration;
        if (t > 1) t = 1;

        const curX = startX + (target.x - startX) * t;
        const baseCurY = startY + (target.y - startY) * t;
        const arcHeight = 15;
        const curY = baseCurY - Math.sin(t * Math.PI) * arcHeight;

        p.style.left = `${curX}%`;
        p.style.top = `${curY}%`;

        if (isArrow && t < 0.95) {
            const nextT = t + 0.05;
            const nextX = startX + (target.x - startX) * nextT;
            const nextBaseY = startY + (target.y - startY) * nextT;
            const nextY = nextBaseY - Math.sin(nextT * Math.PI) * arcHeight;
            const angle = Math.atan2(nextY - curY, nextX - curX) * (180 / Math.PI);
            p.style.transform = `rotate(${angle}deg)`;
        }

        if (t < 1 && target.hp > -100) { // keep flying even if slightly dead
            requestAnimationFrame(animateProj);
        } else {
            // IMPACT!
            target.hp -= finalDamage;
            target.pendingDamage -= finalDamage;

            if (type === 'fireball') {
                target.burnTick = 10;
            } else if (type === 'goo') {
                target.slowTick = 15;
            }

            updateWaveHPUI();

            if (target.hp <= 0 && !target.bountyAwarded) {
                state.resources.gold.value += 5; // Kill bounty
                target.bountyAwarded = true;
                state.totalGoldEarned += 5;
            }

            // Splash Damage for Cannon, Snowbomb, Dragons
            if (type === 'cannon' || type === 'snowbomb' || type === 'dragons') {
                const splashDmg = Math.floor(finalDamage * 0.5);
                const splashRange = type === 'dragons' ? 10 : 5;
                state.enemies.forEach(e => {
                    if (e !== target && e.hp > 0 && Math.abs(e.x - target.x) <= splashRange) {
                        e.hp -= splashDmg;
                        if (type === 'snowbomb') e.slowTick = 15;
                        updateWaveHPUI();
                        createFloatyText(e.el, `💥`, '#ff9800');
                        if (e.hp <= 0 && !e.bountyAwarded) {
                            state.resources.gold.value += 5; // Kill bounty
                            state.totalGoldEarned += 5;
                            e.bountyAwarded = true;
                            createFloatyText(e.el, '+5🪙', '#ffeb3b');
                        }
                    }
                });
            }

            p.remove();
        }
    }

    requestAnimationFrame(animateProj);
}

function gameOver(isVictory = false) {
    try {
        clearInterval(state.combatInterval);
        state.phase = 'gameover';
        state.isPaused = true;
        
        const finalScore = (state.wave * 1000) + (state.totalGoldEarned * 5);
        
        const elFinalWave = document.getElementById('final-wave');
        if (elFinalWave) elFinalWave.innerText = state.wave;
        
        const elFinalScore = document.getElementById('final-score');
        if (elFinalScore) elFinalScore.innerText = finalScore;
        
        const elTitle = document.getElementById('game-over-title');
        if (elTitle) elTitle.innerText = isVictory ? "Castle Defended!" : "Game Over";
        
        showScreen('screen-gameover');
        
        // High score logic
        const scores = JSON.parse(localStorage.getItem('castleDefendersScores') || '[]');
        const hsEntry = document.getElementById('highscore-entry');
        if (hsEntry) {
            if (scores.length < 20 || finalScore > scores[scores.length - 1].score) {
                hsEntry.classList.remove('hidden');
                state.pendingScore = finalScore;
            } else {
                hsEntry.classList.add('hidden');
            }
        }
    } catch (e) {
        logCombat(`GAME OVER ERROR: ${e.message}`, 'damage');
        console.error(e);
        clearInterval(state.combatInterval);
    }
}

function submitHighScore() {
    const nameInput = document.getElementById('player-name');
    const name = nameInput.value.trim() || 'Anonymous';

    let scores = JSON.parse(localStorage.getItem('castleDefendersScores') || '[]');
    scores.push({ name: name, score: state.pendingScore, wave: state.wave, difficulty: state.difficulty });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 20);

    localStorage.setItem('castleDefendersScores', JSON.stringify(scores));

    document.getElementById('highscore-entry').classList.add('hidden');
    nameInput.value = '';

    showScreen('screen-highscores');
}

function loadHighScores() {
    const scores = JSON.parse(localStorage.getItem('castleDefendersScores') || '[]');
    const tbody = document.getElementById('highscore-list');
    tbody.innerHTML = '';

    if (scores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 10px;">No high scores yet!</td></tr>';
        return;
    }

    scores.forEach((s, i) => {
        let diffChar = 'N';
        if (s.difficulty === 'easy') diffChar = 'E';
        if (s.difficulty === 'hardcore') diffChar = 'H';

        tbody.innerHTML += `<tr style="background: rgba(0,0,0,0.85); color: #fff; border-bottom: 2px solid #8d6e63;">
            <td style="padding: 8px 10px;">#${i + 1}</td>
            <td style="padding: 8px 10px;">${s.name}</td>
            <td style="color: #ff9800; font-weight: bold; padding: 8px 10px; letter-spacing: 2px;">${s.score}-${diffChar}</td>
            <td style="padding: 8px 10px; text-align: center;">${s.wave}</td>
        </tr>`;
    });
}


function logCombat(msg, type) {
    const el = document.createElement('div');
    el.className = `log-entry ${type}`;
    el.innerText = msg;
    DOM.logContent.appendChild(el);
    if (DOM.logContent.children.length > 25) DOM.logContent.firstChild.remove();

    // Auto-scroll to the bottom
    DOM.logContent.parentElement.scrollTop = DOM.logContent.parentElement.scrollHeight;
}

function createFloatyText(element, text, color = '#fff') {
    const floaty = document.createElement('div');
    floaty.innerText = text;
    floaty.style.position = 'absolute';
    floaty.style.color = color;
    floaty.style.textShadow = '1px 1px 2px #000';
    floaty.style.fontWeight = 'bold';
    floaty.style.top = '-20px';
    floaty.style.left = '50%';
    floaty.style.transform = 'translateX(-50%)';
    floaty.style.transition = 'all 1s ease-out';
    floaty.style.zIndex = '100';
    floaty.style.pointerEvents = 'none';

    element.appendChild(floaty);
    setTimeout(() => { floaty.style.top = '-50px'; floaty.style.opacity = '0'; }, 50);
    setTimeout(() => floaty.remove(), 1000);
}

function updateWaveHPUI() {
    if (!state.waveMaxHp) return;

    let currentHp = 0;
    state.enemies.forEach(e => {
        if (e.hp > 0) currentHp += e.hp;
    });
    state.waveQueue.forEach(q => {
        currentHp += q.hp;
    });
    state.waveCurrentHp = currentHp;

    const pct = Math.max(0, (state.waveCurrentHp / state.waveMaxHp) * 100);
    DOM.waveHpFill.style.width = `${pct}%`;
    DOM.waveHpText.innerText = `${Math.ceil(state.waveCurrentHp)} / ${Math.ceil(state.waveMaxHp)}`;
}

// UI Updates
function updateUI() {
    DOM.res.gold.innerText = Math.floor(state.resources.gold.value);
    DOM.res.iron.innerText = Math.floor(state.resources.iron.value);
    DOM.res.food.innerText = Math.floor(state.resources.food.value);
    DOM.wave.innerText = state.wave;

    // Castle HP
    const hpPct = Math.max(0, (state.castle.hp / state.castle.maxHp) * 100);
    DOM.castleTopHpFill.style.width = `${hpPct}%`;
    DOM.castleTopHpText.innerText = `${Math.ceil(Math.max(0, state.castle.hp))} / ${state.castle.maxHp}`;

    calculateDPS();

    const elLvlFood = document.getElementById('lvl-food');
    if (elLvlFood) elLvlFood.innerText = `Lv ${state.resources.food.level}`;
    const elLvlIron = document.getElementById('lvl-iron');
    if (elLvlIron) elLvlIron.innerText = `Lv ${state.resources.iron.level}`;
    const elLvlGold = document.getElementById('lvl-gold');
    if (elLvlGold) elLvlGold.innerText = `Lv ${state.resources.gold.level}`;

    const elCostFood = document.getElementById('cost-food');
    if (elCostFood) elCostFood.innerText = `${state.resources.food.level * 30} 🪙`;
    const elCostIron = document.getElementById('cost-iron');
    if (elCostIron) elCostIron.innerText = `${state.resources.iron.level * 30} 🪙`;
    const elCostGold = document.getElementById('cost-gold');
    if (elCostGold) elCostGold.innerText = `${state.resources.gold.level * 30} 🪙`;

    const elCostMoat = document.getElementById('cost-moat');
    if (elCostMoat) {
        const moatCost = state.castle.moatLevel === 0 ? 75 : 125 * state.castle.moatLevel;
        elCostMoat.innerText = `${moatCost} 🪙`;
    }
}

function calculateDPS() {
    let totalDps = 0;

    if (state.castle.rooms) {
        state.castle.rooms.forEach((room) => {
            if (room) {
                const stats = ROOM_STATS[room.type];
                // DPS = damage / ((fireRate + 1) * 0.5) seconds
                const dps = stats.damage / ((stats.fireRate + 1) * 0.5);
                totalDps += dps;
            }
        });
    }

    if (state.castle.moatLevel > 0) {
        totalDps += state.castle.moatLevel * 3;
    }

    DOM.valDps.innerText = Math.round(totalDps * 10) / 10;
}

function debugPaths() {
    const battlefield = document.getElementById('battlefield');
    if (!battlefield) return;
    const colors = ['red', 'lime', 'cyan'];
    PATHS.forEach((path, idx) => {
        path.forEach((pt, i) => {
            const marker = document.createElement('div');
            marker.style.position = 'absolute';
            marker.style.width = '8px';
            marker.style.height = '8px';
            marker.style.background = colors[idx] || 'yellow';
            marker.style.border = '1px solid black';
            marker.style.borderRadius = '50%';
            marker.style.left = `${pt.x}%`;
            marker.style.top = `${pt.y}%`;
            marker.style.transform = 'translate(-50%, -50%)';
            marker.style.zIndex = '999';
            marker.style.pointerEvents = 'none';

            if (idx === 2) {
                const label = document.createElement('div');
                label.innerText = i;
                label.style.position = 'absolute';
                label.style.left = `${pt.x}%`;
                label.style.top = `${pt.y}%`;
                label.style.color = '#fff';
                label.style.textShadow = '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000';
                label.style.fontSize = '12px';
                label.style.fontWeight = 'bold';
                label.style.transform = 'translate(6px, -50%)';
                label.style.zIndex = '1000';
                label.style.pointerEvents = 'none';
                battlefield.appendChild(label);
            }

            battlefield.appendChild(marker);
        });
    });
}

// Start
init();
