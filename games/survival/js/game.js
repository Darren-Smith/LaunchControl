
let playerLives = [5, 5, 5];
let currentLevel = 1;
const MAX_LEVELS = 5;

// Player keys map for movement
const playerControls = [
    { up: 'W', down: 'S', left: 'A', right: 'D' },      // Player 1
    { up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT' }, // Player 2
    { up: 'I', down: 'K', left: 'J', right: 'L' }       // Player 3
];

// Gamepad Status Badge & Polling Helpers
const gpBadge = document.createElement('div');
gpBadge.id = 'gp-badge';
gpBadge.className = 'gp-status-badge';
gpBadge.style.cssText = 'position:fixed;bottom:10px;left:14px;';
gpBadge.textContent = '🎮 No Pad (Plug & Press)';
document.addEventListener('DOMContentLoaded', () => document.body.appendChild(gpBadge));
if (document.body) document.body.appendChild(gpBadge);

function getConnectedPads() {
    if (!navigator.getGamepads) return [];
    const pads = Array.from(navigator.getGamepads()).filter(Boolean);
    if (pads.length === 0) {
        gpBadge.textContent = '🎮 No Pad (Plug & Press)';
        gpBadge.classList.remove('connected');
    } else {
        gpBadge.textContent = `🎮 ${pads.length} Controller${pads.length > 1 ? 's' : ''} Ready (P1–P${Math.min(3, pads.length)})`;
        gpBadge.classList.add('connected');
    }
    return pads;
}

function isGpBtn(gp, idx) {
    return Boolean(gp && gp.buttons && gp.buttons[idx] && (gp.buttons[idx].pressed || gp.buttons[idx].value > 0.3));
}

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        this.load.image('player1', 'assets/player_white.png');
        this.load.image('player2', 'assets/player_yellow.png');
        this.load.image('player3', 'assets/player_blue.png');

        this.load.image('enemy_brown', 'assets/enemy_brown.png');
        this.load.image('enemy_pink', 'assets/enemy_pink.png');
        this.load.image('enemy_purple', 'assets/enemy_purple.png');
        this.load.image('enemy_blue', 'assets/enemy_blue.png');

        this.load.image('computer', 'assets/computer.png');

        this.load.image('room_1', 'assets/room_1.png');
        this.load.image('room_2', 'assets/room_2.png');
        this.load.image('room_3', 'assets/room_3.png');
        this.load.image('room_4', 'assets/room_4.png');
        this.load.image('room_5', 'assets/room_5.png');
        
        this.add.text(400, 400, 'Loading...', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
    }

    create() {
        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
        this.prevConfirm = true;
    }

    create() {
        document.body.classList.remove('hide-cursor');
        this.add.text(400, 270, 'SURVIVAL', { fontSize: '64px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 370, 'Click or Press 🎮 Button 3 / Enter to Start', { fontSize: '28px', fill: '#ffd600' }).setOrigin(0.5);
        
        this.add.text(400, 460, 'Keyboard: P1 WASD | P2 Arrows | P3 IJKL', { fontSize: '20px', fill: '#aaa' }).setOrigin(0.5);
        this.add.text(400, 500, '🎮 Gamepads 1–3: Left Stick / D-Pad Move • Btn 1–4 Boost • Start Pause', { fontSize: '18px', fill: '#4ade80' }).setOrigin(0.5);

        this.prevConfirm = true;
        this.input.on('pointerdown', () => this.startGame());
        this.input.keyboard.on('keydown-ENTER', () => this.startGame());
        this.input.keyboard.on('keydown-SPACE', () => this.startGame());
    }

    startGame() {
        playerLives = [5, 5, 5];
        currentLevel = 1;
        this.scene.start('GameScene');
    }

    update() {
        const pads = getConnectedPads();
        const confirm = pads.some(gp => isGpBtn(gp, 2) || isGpBtn(gp, 0));
        if (confirm && !this.prevConfirm) {
            this.startGame();
        }
        this.prevConfirm = confirm;
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.isPaused = false;
        this.prevPause = false;
    }

    create() {
        this.isPaused = false;
        document.body.classList.add('hide-cursor');

        let bg = this.add.image(400, 400, 'room_' + currentLevel);
        bg.setDisplaySize(800, 800);

        this.players = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.computers = this.physics.add.staticGroup();

        this.playerSprites = [];
        const startX = [300, 400, 500];
        for (let i = 0; i < 3; i++) {
            if (playerLives[i] > 0) {
                let p = this.players.create(startX[i], 700, 'player' + (i+1));
                p.setDisplaySize(48, 48);
                p.setCollideWorldBounds(true);
                p.playerIndex = i;
                p.invulnerable = false;
                
                p.keys = this.input.keyboard.addKeys(playerControls[i]);
                this.playerSprites.push(p);
            } else {
                this.playerSprites.push({ active: false });
            }
        }

        const enemyTypes = ['enemy_brown', 'enemy_pink', 'enemy_purple', 'enemy_blue'];
        const numEnemies = 2 + currentLevel;
        for (let i = 0; i < numEnemies; i++) {
            let type = enemyTypes[i % enemyTypes.length];
            let ex = Phaser.Math.Between(100, 700);
            let ey = Phaser.Math.Between(100, 300);
            let enemy = this.enemies.create(ex, ey, type);
            enemy.setDisplaySize(56, 56);
            enemy.setCollideWorldBounds(true);
            enemy.setBounce(1);
            enemy.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100));
        }

        this.computersBooted = 0;
        this.computersNeeded = 3;
        for (let i = 0; i < 3; i++) {
            let cx = Phaser.Math.Between(100, 700);
            let cy = Phaser.Math.Between(100, 700);
            let comp = this.computers.create(cx, cy, 'computer');
            comp.setDisplaySize(64, 64);
            comp.refreshBody();
            comp.booted = false;
            comp.setTint(0x555555);
        }

        this.physics.add.collider(this.players, this.players);
        this.physics.add.collider(this.enemies, this.enemies);
        this.physics.add.collider(this.players, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.players, this.computers, this.bootComputer, null, this);

        this.livesText = this.add.text(16, 16, '', { fontSize: '24px', fill: '#fff' });
        this.updateLivesText();
        this.levelText = this.add.text(600, 16, 'Room: ' + currentLevel, { fontSize: '32px', fill: '#fff' });
        this.compText = this.add.text(16, 56, 'Computers: 0/3', { fontSize: '32px', fill: '#fff' });
        this.pauseText = this.add.text(400, 400, 'PAUSED\nPress Start or ESC', { fontSize: '48px', fill: '#ffd600', align: 'center', backgroundColor: 'rgba(0,0,0,0.75)' }).setOrigin(0.5).setVisible(false);

        this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.physics.pause();
            this.pauseText.setVisible(true);
            document.body.classList.remove('hide-cursor');
        } else {
            this.physics.resume();
            this.pauseText.setVisible(false);
            document.body.classList.add('hide-cursor');
        }
    }

    update() {
        const pads = getConnectedPads();
        const pausePressed = pads.some(gp => isGpBtn(gp, 9) || isGpBtn(gp, 8));
        if (pausePressed && !this.prevPause) {
            this.togglePause();
        }
        this.prevPause = pausePressed;

        if (this.isPaused) return;

        const baseSpeed = 200;
        const DZ = 0.32;

        // Player Movement (Keyboard + Gamepad 1..3)
        this.playerSprites.forEach((p, idx) => {
            if (!p.active) return;
            let vx = 0;
            let vy = 0;
            let speed = baseSpeed;

            const gp = pads[idx];
            if (gp) {
                if (isGpBtn(gp, 0) || isGpBtn(gp, 1) || isGpBtn(gp, 2) || isGpBtn(gp, 3) || isGpBtn(gp, 5) || isGpBtn(gp, 7)) {
                    speed = baseSpeed * 1.45;
                }
                const ax0 = gp.axes[0] || 0;
                const ax1 = gp.axes[1] || 0;
                if (Math.abs(ax0) > DZ) vx = ax0 * speed;
                else if (isGpBtn(gp, 14)) vx = -speed;
                else if (isGpBtn(gp, 15)) vx = speed;

                if (Math.abs(ax1) > DZ) vy = ax1 * speed;
                else if (isGpBtn(gp, 12)) vy = -speed;
                else if (isGpBtn(gp, 13)) vy = speed;
            }

            if (p.keys.left.isDown) vx = -speed;
            else if (p.keys.right.isDown) vx = speed;
            
            if (p.keys.up.isDown) vy = -speed;
            else if (p.keys.down.isDown) vy = speed;

            p.setVelocity(vx, vy);
        });

        // Simple Enemy AI (Chase nearest player)
        this.enemies.getChildren().forEach(enemy => {
            let closestPlayer = null;
            let minDistance = 9999;
            
            this.playerSprites.forEach(p => {
                if (!p.active) return;
                let dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, p.x, p.y);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestPlayer = p;
                }
            });

            if (closestPlayer && minDistance < 300) {
                this.physics.moveToObject(enemy, closestPlayer, 100 + (currentLevel * 10));
            } else {
                if (Math.abs(enemy.body.velocity.x) < 20 && Math.abs(enemy.body.velocity.y) < 20) {
                    enemy.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100));
                }
            }
        });
    }

    updateLivesText() {
        this.livesText.setText(`P1: ${playerLives[0]} | P2: ${playerLives[1]} | P3: ${playerLives[2]}`);
    }

    hitEnemy(player, enemy) {
        if (player.invulnerable) return;

        playerLives[player.playerIndex]--;
        this.updateLivesText();
        
        if (playerLives[player.playerIndex] <= 0) {
            player.setActive(false).setVisible(false);
            if (player.body) player.body.enable = false;
            
            if (playerLives.every(l => l <= 0)) {
                this.scene.start('GameOverScene', { win: false });
            }
        } else {
            player.invulnerable = true;
            player.setTint(0xff0000);
            
            let angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
            player.body.velocity.x = Math.cos(angle) * 500;
            player.body.velocity.y = Math.sin(angle) * 500;

            this.time.delayedCall(1500, () => {
                player.invulnerable = false;
                player.clearTint();
            }, [], this);
        }
    }

    bootComputer(player, computer) {
        if (!computer.booted) {
            computer.booted = true;
            computer.clearTint();
            this.computersBooted++;
            this.compText.setText('Computers: ' + this.computersBooted + '/3');
            
            if (this.computersBooted >= 3) {
                this.levelComplete();
            }
        }
    }

    levelComplete() {
        if (currentLevel >= MAX_LEVELS) {
            this.scene.start('GameOverScene', { win: true });
        } else {
            currentLevel++;
            this.scene.restart();
        }
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
        this.prevConfirm = true;
    }

    init(data) {
        this.win = data.win;
    }

    create() {
        document.body.classList.remove('hide-cursor');
        let text = this.win ? 'YOU ESCAPED!' : 'GAME OVER';
        let color = this.win ? '#00ff00' : '#ff0000';
        
        this.add.text(400, 300, text, { fontSize: '64px', fill: color, fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 400, 'Click or Press 🎮 Button 3 / Enter for Menu', { fontSize: '28px', fill: '#ffd600' }).setOrigin(0.5);

        this.prevConfirm = true;
        this.input.on('pointerdown', () => this.scene.start('MenuScene'));
        this.input.keyboard.on('keydown-ENTER', () => this.scene.start('MenuScene'));
        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('MenuScene'));
    }

    update() {
        const pads = getConnectedPads();
        const confirm = pads.some(gp => isGpBtn(gp, 2) || isGpBtn(gp, 0));
        if (confirm && !this.prevConfirm) {
            this.scene.start('MenuScene');
        }
        this.prevConfirm = confirm;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 800,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);
