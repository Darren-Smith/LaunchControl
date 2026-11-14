import Enemy from './enemy.js';
import Collectible from './collectible.js';

export default class LevelManager {
    constructor() {
        this.enemies = [];
        this.collectibles = [];
        this.enemyBullets = []; // Projectiles fired BY enemies (e.g. Alien King)

        this.enemyTimer = 0;
        this.enemyInterval = 2000;

        this.level = 1;
        this.enemiesSpawned = 0;

        // Enemy counts per level (index 0 = level 1)
        this.levelCounts = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

        this.totalGemsCollected = 0;
    }

    // ─── Lifecycle ─────────────────────────────────────────────────────────────

    reset() {
        this.enemies = [];
        this.collectibles = [];
        this.enemyBullets = [];
        this.enemyTimer = 0;
        this.level = 1;
        this.enemiesSpawned = 0;
        this.totalGemsCollected = 0;
        this.updateDifficulty();
    }

    updateDifficulty() {
        this.maxEnemiesPerLevel = this.levelCounts[Math.min(this.level - 1, this.levelCounts.length - 1)];
        this.enemyInterval = Math.max(500, 2000 - (this.level * 100));

        window.dispatchEvent(new CustomEvent('levelStart', { detail: { level: this.level } }));
        window.SoundManager?.play('levelUp');
    }

    // ─── Main Update ───────────────────────────────────────────────────────────

    update(deltaTime, player, canvas) {
        // ── Spawn new enemies ──────────────────────────────────────────────
        if (this.enemiesSpawned < this.maxEnemiesPerLevel) {
            this.enemyTimer += deltaTime;
            if (this.enemyTimer >= this.enemyInterval) {
                this.spawnEnemy(canvas);
                this.enemyTimer = 0;
            }
        } else if (this.enemies.length === 0) {
            // All enemies cleared → advance level
            this.level++;
            this.enemiesSpawned = 0;
            this.updateDifficulty();
        }

        // ── Update enemies ────────────────────────────────────────────────
        // ── Update enemies ────────────────────────────────────────────────
        this.enemies.forEach(e => {
            e.update(deltaTime, canvas, player, this.enemyBullets);
            // Check if enemy reached bottom of screen
            if (!e.markedForDeletion && e.y + e.height >= canvas.height) {
                // Reduce player power level by 1, minimum 1
                player.powerLevel = Math.max(1, player.powerLevel - 1);
                // Optionally play a sound effect for power down
                window.SoundManager?.play('powerDown');
                // Mark enemy for deletion to avoid repeated penalties
                e.markedForDeletion = true;
            }
        });

        // ── Update enemy bullets ──────────────────────────────────────────
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const b = this.enemyBullets[i];
            const factor = deltaTime ? deltaTime / 16.67 : 1;
            b.x += b.dx * factor;
            b.y += b.dy * factor;
            if (b.x < -20 || b.x > canvas.width + 20 ||
                b.y < -20 || b.y > canvas.height + 20 ||
                b.markedForDeletion) {
                this.enemyBullets.splice(i, 1);
            }
        }

        // ── Update collectibles ───────────────────────────────────────────
        this.collectibles.forEach(c => c.update(deltaTime, canvas));

        // ── Collision detection ───────────────────────────────────────────
        this.checkCollisions(player, canvas);

        // ── Prune dead / off-screen objects ──────────────────────────────
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);
        this.collectibles = this.collectibles.filter(c => !c.markedForDeletion);
        this.enemyBullets = this.enemyBullets.filter(b => !b.markedForDeletion);
    }

    // ─── Spawning ──────────────────────────────────────────────────────────────

    spawnEnemy(canvas) {
        const type = this._pickEnemyType();
        this.enemiesSpawned++;

        // Special spawn positions for side-entrants
        if (type === 'space_cow') {
            this._spawnSpaceCow(canvas);
            return;
        }
        if (type === 'blob_alien') {
            this._spawnBlobAlien(canvas);
            return;
        }

        // Standard top-spawn
        let w = 48;
        if (type === 'blue_troll') w = 64;
        if (type === 'boss') w = 128;
        if (type === 'alien_knight') w = 96;
        if (type === 'slow_fly') w = 34;
        if (type === 'fast_fly') w = 28;

        const margin = w / 2;
        const x = margin + Math.random() * (canvas.width - w - margin * 2);
        const enemy = new Enemy(x, -w, type);
        this.enemies.push(enemy);

        if (type === 'boss') window.SoundManager?.play('bossAppear');
        if (type === 'alien_knight') window.SoundManager?.play('bossAppear');

        // Flies enter anywhere on the screen vertically for a better "buzz" effect
        if (type === 'slow_fly' || type === 'fast_fly') {
            enemy.y = Math.random() * (canvas.height * 0.6);
        }
    }

    _spawnSpaceCow(canvas) {
        const fromLeft = Math.random() < 0.5;
        const x = fromLeft ? -(80 + 10) : canvas.width + 10;
        const y = 80 + Math.random() * (canvas.height * 0.55);
        this.enemies.push(new Enemy(x, y, 'space_cow'));
    }

    _spawnBlobAlien(canvas) {
        // Blob is 200 px wide — keep it fully within the canvas
        const x = 20 + Math.random() * (canvas.width - 200 - 40);
        this.enemies.push(new Enemy(x, -160, 'blob_alien'));
    }

    /**
     * Weighted enemy type selection based on current level.
     * New types unlock as the player progresses.
     */
    _pickEnemyType() {
        const lvl = this.level;
        const rand = Math.random();

        // Alien King (Boss): last enemy of every 5th level
        if (lvl >= 5 && lvl % 5 === 0 && this.enemiesSpawned === this.maxEnemiesPerLevel - 1) {
            return 'boss';
        }

        // Build a weighted pool
        const pool = [];

        // Always available
        pool.push({ type: 'pink_pig', weight: 30 });

        if (lvl >= 2) pool.push({ type: 'red_martian', weight: 20 });
        if (lvl >= 2) pool.push({ type: 'slow_fly', weight: 15 });
        if (lvl >= 3) pool.push({ type: 'green_alien', weight: 15 });
        if (lvl >= 3) pool.push({ type: 'space_cow', weight: 12 });
        if (lvl >= 4) pool.push({ type: 'blue_troll', weight: 10 });
        if (lvl >= 4) pool.push({ type: 'fast_fly', weight: 12 });
        if (lvl >= 5) pool.push({ type: 'alien_knight', weight: 8 });
        if (lvl >= 6) pool.push({ type: 'blob_alien', weight: 6 });

        const total = pool.reduce((s, e) => s + e.weight, 0);
        let pick = Math.random() * total;
        for (const entry of pool) {
            pick -= entry.weight;
            if (pick <= 0) return entry.type;
        }
        return 'pink_pig';
    }

    // ─── Collision Detection ───────────────────────────────────────────────────

    checkCollisions(player, canvas) {

        // 1) Player bullets ↔ enemies
        player.bullets.forEach(bullet => {
            this.enemies.forEach(enemy => {
                if (!enemy.markedForDeletion && !bullet.markedForDeletion &&
                    this.rectIntersect(bullet.x, bullet.y, bullet.width, bullet.height,
                        enemy.x, enemy.y, enemy.width, enemy.height)) {
                    enemy.health--;
                    bullet.markedForDeletion = true;

                    if (enemy.health <= 0) {
                        enemy.markedForDeletion = true;
                        window.addScore(enemy.scoreValue);
                        window.SoundManager?.play('enemyDie');
                        const isBossy = ['boss', 'alien_knight', 'blob_alien'].includes(enemy.type);
                        window.triggerGamepadRumble?.(isBossy ? 0.6 : 0.2, isBossy ? 0.85 : 0.35, isBossy ? 200 : 75);
                        this._onEnemyKilled(enemy, canvas);
                    }
                }
            });
        });

        // 2) Enemy bullets ↔ player
        this.enemyBullets.forEach(bullet => {
            if (!bullet.markedForDeletion &&
                this.rectIntersect(player.x, player.y, player.width, player.height,
                    bullet.x, bullet.y, bullet.width, bullet.height)) {
                bullet.markedForDeletion = true;
                player.health = Math.max(0, player.health - (bullet.damage || 10));
                window.SoundManager?.play('playerHit');
                window.triggerGamepadRumble?.(0.5, 0.8, 160);
            }
        });

        // 3) Enemies ↔ player (contact damage)
        this.enemies.forEach(enemy => {
            if (!enemy.markedForDeletion &&
                this.rectIntersect(player.x, player.y, player.width, player.height,
                    enemy.x, enemy.y, enemy.width, enemy.height)) {
                enemy.markedForDeletion = true;
                player.health = Math.max(0, player.health - enemy.damage);
                window.SoundManager?.play('playerHit');
                window.triggerGamepadRumble?.(0.6, 0.9, 180);
            }
        });

        // 4) Player ↔ collectibles
        this.collectibles.forEach(c => {
            if (!c.markedForDeletion &&
                this.rectIntersect(player.x, player.y, player.width, player.height,
                    c.x, c.y, c.width, c.height)) {
                c.markedForDeletion = true;

                if (c.type === 'heart') {
                    player.health = Math.min(100, player.health + 20);
                    window.SoundManager?.play('collectHeart');

                } else if (c.type === 'bullet_powerup') {
                    player.powerLevel = Math.min(4, player.powerLevel + 1);
                    window.SoundManager?.play('powerUp');
                    window.triggerGamepadRumble?.(0.3, 0.5, 110);
                    window.addScore(200); // Small bonus for collecting it

                } else {
                    // Diamond / crystal
                    window.addScore(c.value);
                    this.totalGemsCollected++;
                    window.SoundManager?.play('collectGem');

                    if (this.totalGemsCollected > 0 && this.totalGemsCollected % 10 === 0) {
                        this._spawnHeart(canvas);
                    }

                    const gemsEl = document.getElementById('gems');
                    if (gemsEl) gemsEl.innerText = this.totalGemsCollected;
                }
            }
        });

        // Remove bullets marked for deletion
        player.bullets = player.bullets.filter(b => !b.markedForDeletion);
    }

    /** Handle drops / power-ups on enemy death */
    _onEnemyKilled(enemy, canvas) {
        const rand = Math.random();

        // Drop a power-up (15 % chance) — bias toward bossy enemies
        const powerChance = ['boss', 'alien_knight', 'blob_alien'].includes(enemy.type) ? 0.6 : 0.12;
        if (rand < powerChance) {
            this.collectibles.push(new Collectible(enemy.x + enemy.width / 2 - 19, enemy.y, 'bullet_powerup'));
            return; // Only one drop per kill
        }

        // Gem drop (30 % chance otherwise)
        if (rand < powerChance + 0.30) {
            const gType = Math.random() < 0.65 ? 'diamond' : 'crystal';
            this.collectibles.push(new Collectible(enemy.x + enemy.width / 2 - 16, enemy.y, gType));
        }
    }

    _spawnHeart(canvas) {
        const w = 32;
        const margin = w / 2;
        const x = margin + Math.random() * (canvas.width - w - margin * 2);
        this.collectibles.push(new Collectible(x, -50, 'heart'));
    }

    // ─── Drawing ───────────────────────────────────────────────────────────────

    draw(ctx) {
        this.enemies.forEach(e => e.draw(ctx));
        this.collectibles.forEach(c => c.draw(ctx));

        // Enemy bullets (Alien Knight bolts & Alien King Boss purple spray orbs)
        this.enemyBullets.forEach(b => {
            ctx.save();
            ctx.fillStyle = b.color || '#ff4400';
            ctx.shadowColor = b.glowColor || '#ff8800';
            ctx.shadowBlur = 10;

            if (b.shape === 'orb') {
                const cx = b.x + b.width / 2;
                const cy = b.y + b.height / 2;
                const r = b.width / 2;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();

                // Bright inner core for purple plasma orbs
                ctx.fillStyle = '#f5ccff';
                ctx.beginPath();
                ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(b.x, b.y, b.width, b.height);
            }
            ctx.restore();
        });
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x2 < x1 + w1 && x2 + w2 > x1 &&
            y2 < y1 + h1 && y2 + h2 > y1;
    }
}
