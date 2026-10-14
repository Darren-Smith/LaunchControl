import { Fighter } from './Fighter.js';
import { Miner } from './Miner.js';
import { MiningSystem } from './MiningSystem.js';
import { Monster } from './Monster.js';
import { Boss } from './Boss.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.fighter = new Fighter(this);
        this.miner = new Miner(this);
        this.miningSystem = new MiningSystem(this);
        this.enemies = [];
        
        this.lastTime = 0;
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 2000;
        
        this.bossSpawned = false;
        this.bossDefeated = false;
        this.isGameOver = false;

        this.setupInput();
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            if (this.isGameOver) return;
            
            // Fighter controls
            if (e.key === 'w') this.fighter.keys.w = true;
            if (e.key === 'a') this.fighter.keys.a = true;
            if (e.key === 's') this.fighter.keys.s = true;
            if (e.key === 'd') this.fighter.keys.d = true;
            if (e.key === ' ') this.fighter.keys.space = true;
            
            // Miner controls
            if (e.key === 'ArrowUp') this.miner.keys.up = true;
            if (e.key === 'ArrowLeft') this.miner.keys.left = true;
            if (e.key === 'ArrowDown') this.miner.keys.down = true;
            if (e.key === 'ArrowRight') this.miner.keys.right = true;
            if (e.key === 'Enter') this.miner.keys.enter = true;
        });

        window.addEventListener('keyup', (e) => {
            // Fighter controls
            if (e.key === 'w') this.fighter.keys.w = false;
            if (e.key === 'a') this.fighter.keys.a = false;
            if (e.key === 's') this.fighter.keys.s = false;
            if (e.key === 'd') this.fighter.keys.d = false;
            if (e.key === ' ') this.fighter.keys.space = false;
            
            // Miner controls
            if (e.key === 'ArrowUp') this.miner.keys.up = false;
            if (e.key === 'ArrowLeft') this.miner.keys.left = false;
            if (e.key === 'ArrowDown') this.miner.keys.down = false;
            if (e.key === 'ArrowRight') this.miner.keys.right = false;
            if (e.key === 'Enter') this.miner.keys.enter = false;
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            location.reload();
        });
    }

    spawnBoss() {
        this.bossSpawned = true;
        // Spawn boss on the far right
        const boss = new Boss(this, this.width + 50, this.height / 2);
        this.enemies.push(boss);
    }

    checkWinCondition() {
        if (this.miningSystem.diamonds >= 1000 && this.bossDefeated && !this.isGameOver) {
            this.gameOver(true);
        }
    }

    gameOver(won) {
        this.isGameOver = true;
        const notif = document.getElementById('notifications');
        const text = document.getElementById('notification-text');
        
        notif.classList.remove('hidden');
        if (won) {
            text.innerText = 'Victory!';
            text.style.background = 'linear-gradient(to right, #2dd4bf, #3b82f6)';
            text.style.webkitBackgroundClip = 'text';
            text.style.webkitTextFillColor = 'transparent';
        } else {
            text.innerText = 'Game Over';
            text.style.background = 'linear-gradient(to right, #ef4444, #f97316)';
            text.style.webkitBackgroundClip = 'text';
            text.style.webkitTextFillColor = 'transparent';
        }
    }

    start() {
        requestAnimationFrame((t) => this.loop(t));
    }

    loop(timestamp) {
        if (this.isGameOver) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(deltaTime) {
        this.fighter.update(deltaTime);
        this.miner.update(deltaTime);
        this.miningSystem.update(deltaTime);

        // Spawn normal monsters
        if (!this.bossSpawned) {
            this.enemySpawnTimer += deltaTime;
            if (this.enemySpawnTimer > this.enemySpawnInterval) {
                this.enemySpawnTimer = 0;
                // Make it harder over time
                this.enemySpawnInterval = Math.max(500, this.enemySpawnInterval - 20);
                
                // Spawn on the right edge
                const yPos = Math.random() * this.height;
                this.enemies.push(new Monster(this, this.width + 20, yPos));
            }
        }

        // Update enemies
        for (let enemy of this.enemies) {
            enemy.update(deltaTime);
        }
    }

    draw() {
        // Clear screen
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.miningSystem.draw(this.ctx);
        
        for (let enemy of this.enemies) {
            enemy.draw(this.ctx);
        }

        this.fighter.draw(this.ctx);
        this.miner.draw(this.ctx);
    }
}
