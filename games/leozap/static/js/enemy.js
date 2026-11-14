export default class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.markedForDeletion = false;

        // Default dimensions & stats (overridden by initType)
        this.width = 48;
        this.height = 48;
        this.speedX = 0;
        this.speedY = 2;
        this.health = 1;
        this.scoreValue = 100;
        this.damage = 20;

        // Behaviour flags
        this.bounceOffAll = false; // Flies: bounce all four walls, never leave screen
        this.crossesScreen = false; // Space Cows: enter from side & exit the other
        this.shootsBack = false; // Alien Knight & Alien King (Boss): fire projectiles at player

        // Fly direction-nudge timer
        this.dirTimer = 0;
        this.dirInterval = 2000 + Math.random() * 2000;

        // Alien Knight / Alien King (Boss) shoot timer
        this.shootTimer = 0;
        this.shootInterval = 2500; // ms between shots

        this.image = new Image();
        this.initType();

        // Store max health for the health bar (set AFTER initType sets this.health)
        this.maxHealth = this.health;
    }

    // ─── Type Initialisation ──────────────────────────────────────────────────

    initType() {
        switch (this.type) {

            // ── Original types ─────────────────────────────────────────────

            case 'pink_pig':
                this.image.src = 'assets/images/pink_pig.png';
                this.speedY = 1.5;
                this.health = 1;
                this.scoreValue = 100;
                this.damage = 15;
                break;

            case 'red_martian':
                this.image.src = 'assets/images/red_martian.png';
                this.speedY = 2.5;
                this.health = 2;
                this.scoreValue = 200;
                this.damage = 20;
                break;

            case 'green_alien':
                this.image.src = 'assets/images/green_alien.png';
                this.speedY = 2;
                this.speedX = Math.random() < 0.5 ? -1 : 1;
                this.health = 3;
                this.scoreValue = 300;
                this.damage = 25;
                break;

            case 'blue_troll':
                this.image.src = 'assets/images/blue_troll.png';
                this.speedY = 1;
                this.health = 5;
                this.scoreValue = 500;
                this.damage = 30;
                this.width = 64;
                this.height = 64;
                break;

            case 'boss':
                // Alien King (Boss) — supports alien_king.png or boss.png
                this.image.onerror = () => {
                    if (!this._triedBossFallback) {
                        this._triedBossFallback = true;
                        this.image.src = 'assets/images/boss.png';
                    }
                };
                this.image.src = 'assets/images/alien_king.png';
                this.speedY = 0.5;
                this.speedX = 1.2;
                this.health = 50;
                this.scoreValue = 5000;
                this.damage = 40;
                this.width = 128;
                this.height = 128;
                this.shootsBack = true;
                this.shootInterval = 3000; // 6-bullet purple arc spray every 3 seconds
                break;

            // ── Slow Fly ────────────────────────────────────────────────────
            // Small damage. Buzzes in loops. Bounces all walls. Never leaves screen.
            case 'slow_fly':
                this.image.src = 'assets/images/slow_fly.png';
                this.width = 34;
                this.height = 34;
                this.speedX = (Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 0.8);
                this.speedY = (Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 0.8);
                this.health = 1;
                this.scoreValue = 50;
                this.damage = 5;
                this.bounceOffAll = true;
                this.dirInterval = 2000 + Math.random() * 2000;
                break;

            // ── Fast Fly ────────────────────────────────────────────────────
            // Same as slow fly but zippier & harder to hit.
            case 'fast_fly':
                this.image.src = 'assets/images/fast_fly.png';
                this.width = 28;
                this.height = 28;
                this.speedX = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 2.5);
                this.speedY = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 2.5);
                this.health = 1;
                this.scoreValue = 75;
                this.damage = 8;
                this.bounceOffAll = true;
                this.dirInterval = 800 + Math.random() * 1200;
                break;

            // ── Alien Knight (formerly Alien King) ──────────────────────────
            // Bounces side-to-side as it descends. Shoots single projectiles at the player.
            case 'alien_knight':
                this.image.src = 'assets/images/alien_knight.png';
                this.width = 96;
                this.height = 96;
                this.speedY = 0.7;
                this.speedX = 1.8;
                this.health = 20;
                this.scoreValue = 2000;
                this.damage = 35;
                this.shootsBack = true;
                this.shootInterval = 2200;
                break;

            // ── Space Cow ───────────────────────────────────────────────────
            // Enters from left or right and plods across the screen.
            // Spawn x < 0  → moving right;  spawn x > canvas.width → moving left.
            case 'space_cow':
                this.image.src = 'assets/images/space_cow.png';
                this.width = 80;
                this.height = 52;
                this.health = 3;
                this.scoreValue = 150;
                this.damage = 10;
                this.crossesScreen = true;
                // Direction is determined by start position (set by LevelManager)
                this.speedX = this.x < 0 ? 2.2 : -2.2;
                this.speedY = 0;
                break;

            // ── Blob Alien ──────────────────────────────────────────────────
            // ~25% screen width. Drops slowly from top. Tanky, excellent points.
            case 'blob_alien':
                this.image.src = 'assets/images/blob_alien.png';
                this.width = 200; // ≈ 25 % of the 800 px canvas
                this.height = 140;
                this.health = 30;
                this.scoreValue = 3000;
                this.damage = 50;
                this.speedY = 0.55;
                this.speedX = 0;
                break;

            default:
                this.image.src = 'assets/images/pink_pig.png';
        }
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    /**
     * @param {number}      deltaTime
     * @param {HTMLCanvasElement} canvas
     * @param {Player|null} player    — needed for Alien Knight & Alien King (Boss) targeting
     * @param {Array}       enemyBullets — shared list managed by LevelManager
     */
    update(deltaTime, canvas, player, enemyBullets) {
        const factor = deltaTime ? deltaTime / 16.67 : 1;

        // ── Fly random-nudge logic ────────────────────────────────────────
        if (this.bounceOffAll) {
            this.dirTimer += deltaTime;
            if (this.dirTimer >= this.dirInterval) {
                this.dirTimer = 0;
                const nudge = this.type === 'fast_fly' ? 1.2 : 0.6;
                this.speedX += (Math.random() - 0.5) * nudge * 2;
                this.speedY += (Math.random() - 0.5) * nudge * 2;

                // Clamp speed so flies don't become missiles
                const maxSpd = this.type === 'fast_fly' ? 7 : 2.5;
                const spd = Math.hypot(this.speedX, this.speedY);
                if (spd > maxSpd) {
                    this.speedX = (this.speedX / spd) * maxSpd;
                    this.speedY = (this.speedY / spd) * maxSpd;
                }
            }
        }

        // ── Alien Knight: side-bounce + single aimed shot ────────────────
        if (this.type === 'alien_knight') {
            if (this.x <= 0 || this.x + this.width >= canvas.width) {
                this.speedX *= -1;
            }

            if (player && enemyBullets) {
                this.shootTimer += deltaTime;
                if (this.shootTimer >= this.shootInterval) {
                    this.shootTimer = 0;
                    this._fireAtPlayer(player, enemyBullets);
                }
            }
        }

        // ── Alien King (Boss): side-bounce + 6-bullet purple arc spray ───
        if (this.type === 'boss') {
            if (this.x <= 0 || this.x + this.width >= canvas.width) {
                this.speedX *= -1;
            }

            if (player && enemyBullets) {
                this.shootTimer += deltaTime;
                if (this.shootTimer >= this.shootInterval) {
                    this.shootTimer = 0;
                    this._fireSprayAtPlayer(player, enemyBullets);
                }
            }
        }

        // ── Move ─────────────────────────────────────────────────────────
        this.x += this.speedX * factor;
        this.y += this.speedY * factor;

        // ── Boundary logic ───────────────────────────────────────────────
        if (this.bounceOffAll) {
            // Flies bounce off all four walls and stay on screen
            if (this.x <= 0) { this.x = 0; this.speedX = Math.abs(this.speedX); }
            if (this.x + this.width >= canvas.width) { this.x = canvas.width - this.width; this.speedX = -Math.abs(this.speedX); }
            if (this.y <= 0) { this.y = 0; this.speedY = Math.abs(this.speedY); }
            if (this.y + this.height >= canvas.height) { this.y = canvas.height - this.height; this.speedY = -Math.abs(this.speedY); }

        } else if (this.crossesScreen) {
            // Space Cows disappear once fully off the opposite edge
            if (this.x + this.width < -20 || this.x > canvas.width + 20) {
                this.markedForDeletion = true;
            }
        } else {
            // Standard enemies fall down; side-bounce where applicable
            if (this.type !== 'boss' && this.type !== 'alien_knight') {
                if (this.x <= 0 || this.x + this.width >= canvas.width) {
                    this.speedX *= -1;
                }
            }
            if (this.y > canvas.height) {
                this.markedForDeletion = true;
            }
        }
    }

    /** Alien Knight: Spawn a single projectile aimed at the player */
    _fireAtPlayer(player, enemyBullets) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height;
        const tx = player.x + player.width / 2;
        const ty = player.y + player.height / 2;
        const dist = Math.hypot(tx - cx, ty - cy) || 1;
        const speed = 3.5;

        enemyBullets.push({
            x: cx - 5,
            y: cy,
            width: 10,
            height: 18,
            dx: ((tx - cx) / dist) * speed,
            dy: ((ty - cy) / dist) * speed,
            damage: 10,
            color: '#ff4400',
            glowColor: '#ff8800',
            markedForDeletion: false
        });

        window.SoundManager?.play('alienShoot');
    }

    /** Alien King (Boss): Fire 6 purple bullets in an arc toward the player's current location */
    _fireSprayAtPlayer(player, enemyBullets) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height * 0.85;
        const tx = player.x + player.width / 2;
        const ty = player.y + player.height / 2;
        const baseAngle = Math.atan2(ty - cy, tx - cx);

        const bulletCount = 6;
        const totalArcDeg = 60; // 60° total fan (12° between each of the 6 bullets)
        const startOffsetDeg = -totalArcDeg / 2;
        const stepDeg = totalArcDeg / (bulletCount - 1);
        const speed = 3.2;

        for (let i = 0; i < bulletCount; i++) {
            const offsetRad = (startOffsetDeg + i * stepDeg) * (Math.PI / 180);
            const angle = baseAngle + offsetRad;
            enemyBullets.push({
                x: cx - 6,
                y: cy - 6,
                width: 12,
                height: 12,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                damage: 12,
                color: '#b829ff',
                glowColor: '#e066ff',
                shape: 'orb',
                markedForDeletion: false
            });
        }

        window.SoundManager?.play('alienShoot');
    }

    // ─── Draw ─────────────────────────────────────────────────────────────────

    draw(ctx) {
        if (this.image.complete && this.image.naturalWidth !== 0) {
            if (this.type === 'space_cow' && this.speedX > 0) {
                // space_cow.png faces left by default; mirror horizontally when travelling right
                ctx.save();
                ctx.translate(this.x + this.width, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(this.image, 0, 0, this.width, this.height);
                ctx.restore();
            } else {
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
        } else {
            this._drawPlaceholder(ctx);
        }

        // Health bars for tough / boss enemies
        if (['boss', 'blob_alien', 'alien_knight', 'blue_troll'].includes(this.type)) {
            this._drawHealthBar(ctx);
        }
    }

    _drawPlaceholder(ctx) {
        const colours = {
            pink_pig: '#ffaabb',
            red_martian: '#ff4444',
            green_alien: '#44ff66',
            blue_troll: '#4466ff',
            boss: '#cc00ff',
            slow_fly: '#aaff00',
            fast_fly: '#ffaa00',
            alien_knight: '#6688cc',
            space_cow: '#d4a35a',
            blob_alien: '#00ddaa',
        };

        ctx.fillStyle = colours[this.type] || '#ffffff';

        if (this.type === 'blob_alien') {
            // Amoeba blob shape
            ctx.beginPath();
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            const rx = this.width / 2;
            const ry = this.height / 2;
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            // Nucleus
            ctx.fillStyle = '#00ffcc';
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx * 0.35, ry * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'slow_fly' || this.type === 'fast_fly') {
            // Tiny winged bug
            ctx.fillRect(this.x + this.width * 0.25, this.y + this.height * 0.25, this.width * 0.5, this.height * 0.5);
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.ellipse(this.x + this.width * 0.15, this.y + this.height * 0.3,
                this.width * 0.2, this.height * 0.15, -0.4, 0, Math.PI * 2);
            ctx.ellipse(this.x + this.width * 0.85, this.y + this.height * 0.3,
                this.width * 0.2, this.height * 0.15, 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'alien_knight') {
            // Armored Knight helmet & visor silhouette
            ctx.fillRect(this.x + 10, this.y + this.height * 0.2, this.width - 20, this.height * 0.7);
            ctx.fillStyle = '#00ffcc';
            ctx.fillRect(this.x + 22, this.y + this.height * 0.38, this.width - 44, 10);
        } else if (this.type === 'boss') {
            // Alien King crown silhouette
            ctx.fillRect(this.x + 8, this.y + this.height * 0.3, this.width - 16, this.height * 0.6);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(this.x + this.width * 0.15, this.y, 12, this.height * 0.35);
            ctx.fillRect(this.x + this.width * 0.45, this.y - 8, 14, this.height * 0.4);
            ctx.fillRect(this.x + this.width * 0.75, this.y, 12, this.height * 0.35);
        } else if (this.type === 'space_cow') {
            ctx.fillRect(this.x, this.y + this.height * 0.2, this.width, this.height * 0.6);
            // Spots
            ctx.fillStyle = '#3a2000';
            ctx.beginPath(); ctx.ellipse(this.x + this.width * 0.3, this.y + this.height * 0.4, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(this.x + this.width * 0.65, this.y + this.height * 0.55, 6, 5, 0.3, 0, Math.PI * 2); ctx.fill();
            // Head
            ctx.fillStyle = colours[this.type];
            ctx.fillRect(this.speedX > 0 ? this.x + this.width - 20 : this.x, this.y, 20, this.height * 0.5);
        } else {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    _drawHealthBar(ctx) {
        const pct = Math.max(0, this.health / this.maxHealth);
        const barW = this.width;
        const barH = 7;
        const barY = this.y - 12;

        ctx.fillStyle = '#222';
        ctx.fillRect(this.x, barY, barW, barH);

        ctx.fillStyle = pct > 0.5 ? '#33ff66' : pct > 0.25 ? '#ffaa00' : '#ff3333';
        ctx.fillRect(this.x, barY, barW * pct, barH);

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, barY, barW, barH);
    }
}
