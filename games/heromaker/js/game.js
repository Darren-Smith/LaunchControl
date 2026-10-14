class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.lastTime = 0;
        this.accumulator = 0;
        this.deltaTime = 1 / 60;

        this.camera = new Camera(this.width, this.height);
        this.mapWidth = 6000; // Updated to match new level width
        this.mapHeight = 600;
        this.levelTime = 0; // Track time in level

        this.engine = new Engine(this.ctx, this.width, this.height);
        this.entities = [];
        this.projectiles = []; // For attack hitboxes
        this.player = null;
        this.currentLevelIdx = 0;
        this.currentLevelIdx = 0;
        this.gameState = 'START';
        this.paused = false;
        this.levelStats = { enemiesKilled: 0, coinsCollected: 0 };
        this.fireworks = []; // For victory screen
        this.floatingTexts = []; // For damage numbers
        this.totalTime = 0; // Total run time
        this.highScores = JSON.parse(localStorage.getItem('heroMakerHighScores')) || [];
        this.showDebug = false; // Toggle for debug overlay


        // Input handling
        this.input = {
            left: false,
            right: false,
            up: false,
            attack: false,
            menu: false
        };

        this.setupInput();
        this.init();
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) > -1) {
                e.preventDefault(); // Prevent scrolling
            }
            if (e.key === 'ArrowLeft') this.input.left = true;
            if (e.key === 'ArrowRight') this.input.right = true;
            if (e.key === 'ArrowUp') this.input.up = true;
            if (e.key === ' ' || e.key === 'z') this.input.attack = true;
            if (e.key === 'h' || e.key === 'H') this.input.menu = true;
            if (e.key === 'Escape') this.toggleHeroMaker(); // For testing
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft') this.input.left = false;
            if (e.key === 'ArrowRight') this.input.right = false;
            if (e.key === 'ArrowUp') this.input.up = false;
            if (e.key === ' ' || e.key === 'z') this.input.attack = false;
        });

        const closeBtn = document.getElementById('close-hero-maker');
        if (closeBtn) closeBtn.addEventListener('click', () => {
            this.toggleHeroMaker();
        });

        // Click detection for 'i' info button (bottom-right)
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Check if clicking in the bottom-right 'i' button area (approx 30x30)
            if (mouseX > this.width - 40 && mouseY > this.height - 40) {
                this.showDebug = !this.showDebug;
            }
        });
    }

    toggleHeroMaker() {
        const screen = document.getElementById('hero-maker-screen');
        if (!screen) return;
        const isHidden = screen.classList.toggle('hidden');
        this.paused = !isHidden;
    }

    init() {
        // Create player once? Or recreate per level? Recreating is safer for position reset.
        // But we want to keep stats.
        if (!this.player) {
            this.player = new Player(100, 300);
            this.ui = new UI(this);
        }

        this.loadLevel(this.currentLevelIdx);
    }

    loadLevel(idx) {
        if (idx >= Levels.length) {
            this.gameState = 'VICTORY';
            return;
        }

        const level = Levels[idx];
        this.mapWidth = level.width || 6000; // Derive from level definition
        this.mapHeight = 600;
        this.engine.mapWidth = this.mapWidth; // Sync physics boundary to map width

        // Reset entities
        this.entities = [this.player];
        this.projectiles = [];

        // Reset Level Stats
        this.levelStats = { enemiesKilled: 0, coinsCollected: 0 };
        this.levelTime = 0;

        // Reset player pos
        this.player.x = 50;
        this.player.y = 300;
        this.player.vx = 0;
        this.player.vy = 0;

        // Load platforms
        this.engine.platforms = level.platforms; // Direct set

        // Load enemies
        level.enemies.forEach(e => {
            this.entities.push(new Enemy(e.x, e.y, e.type));
        });

        // Load boss
        if (level.bossSpawn) {
            this.entities.push(new Boss(level.bossSpawn.x, level.bossSpawn.y, level.boss, level.id));
        }

        // Update UI info
        const levelDisplay = document.getElementById('level-display');
        if (levelDisplay) levelDisplay.textContent = level.id + ": " + level.name;
        this.ui.updateHeroMaker();
    }

    start() {
        requestAnimationFrame((time) => this.loop(time));
    }

    loop(time) {
        try {
            const dt = (time - this.lastTime) / 1000;
            this.lastTime = time;

            if (this.gameState === 'PLAYING') {
                if (!this.paused) {
                    this.update(dt);
                    this.levelTime += dt;
                }
            } else {
                this.updateMenu(dt);
            }
            // Update Floating Texts
            this.floatingTexts.forEach((ft, i) => {
                ft.y -= 50 * dt; // Float up
                ft.life -= dt;
                if (ft.life <= 0) this.floatingTexts.splice(i, 1);
            });

            this.draw();

            // Draw Floating Texts (Overlay)
            this.ctx.textAlign = 'center';
            this.ctx.font = 'bold 20px Arial';
            this.floatingTexts.forEach(ft => {
                this.ctx.fillStyle = `rgba(255, 0, 0, ${ft.life})`; // Fade out
                this.ctx.fillText(ft.text, ft.x - this.camera.x, ft.y - this.camera.y);
            });
            this.ctx.textAlign = 'left';

            // Visual Debug (Toggleable, moved to bottom)
            if (this.showDebug) {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                this.ctx.font = '12px Courier';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(`State: ${this.gameState} | Input: ${JSON.stringify(this.input)}`, 10, this.height - 10);
            }

        } catch (e) {
            console.error("Game Loop Error:", e);
            this.ctx.fillStyle = 'red';
            this.ctx.font = '20px Arial';
            this.ctx.fillText("Error: " + e.message, 10, 50);
        }
        requestAnimationFrame((time) => this.loop(time));
    }

    updateMenu(dt) {
        if (this.input.attack || (this.gameState === 'VICTORY' && this.input.attack)) { // Space/Z
            if (this.gameState === 'START') {
                this.resetGame();
            } else if (this.gameState === 'GAME_OVER') {
                this.resetGame();
            } else if (this.gameState === 'VICTORY') {
                // Save Score if not saved
                if (!this.scoreSaved) {
                    // Simple prompt for now
                    const name = prompt("Enter your name for the High Score:") || "Hero";
                    this.highScores.push({ name: name, time: this.totalTime });
                    this.highScores.sort((a, b) => a.time - b.time); // Ascending time
                    localStorage.setItem('heroMakerHighScores', JSON.stringify(this.highScores));
                    this.scoreSaved = true;
                    this.gameState = 'HIGH_SCORES';
                    this.input.attack = false;
                    return;
                } else {
                    this.resetGame();
                }
            } else if (this.gameState === 'HIGH_SCORES') {
                this.gameState = 'START';
                this.input.attack = false;
            } else if (this.gameState === 'LEVEL_COMPLETE') {
                this.totalTime += this.levelTime; // Add level time to total
                this.currentLevelIdx++;
                this.loadLevel(this.currentLevelIdx);
                if (this.gameState !== 'VICTORY') {
                    this.gameState = 'PLAYING';
                }
                this.input.attack = false;
            }
        }

        // High Scores Menu Access from Start
        if (this.gameState === 'START' && this.input.menu) { // 'h' key
            this.gameState = 'HIGH_SCORES';
            this.input.menu = false;
        }

        // Update Fireworks (Victory only)
        if (this.gameState === 'VICTORY') {
            if (Math.random() < 0.05) {
                // Spawn firework
                this.fireworks.push({
                    x: Math.random() * this.width,
                    y: this.height,
                    vx: (Math.random() - 0.5) * 50,
                    vy: -(Math.random() * 500 + 300),
                    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                    life: 2.0
                });
            }
            this.fireworks.forEach((fw, i) => {
                fw.x += fw.vx * dt;
                fw.y += fw.vy * dt;
                fw.vy += 200 * dt; // Gravity
                fw.life -= dt;
                if (fw.life <= 0) this.fireworks.splice(i, 1);
            });
        }
    }

    resetGame() {
        this.currentLevelIdx = 0;
        this.player.hp = this.player.maxHp;
        this.player.coins = 0;
        this.totalTime = 0;
        this.scoreSaved = false;
        this.loadLevel(this.currentLevelIdx);
        this.gameState = 'PLAYING';
        this.input.attack = false;
    }

    update(dt) {
        // Update player input
        this.player.handleInput(this.input);

        // Attack handling
        if (this.input.attack && !this.player.attacking) {
            this.player.attacking = true;
            setTimeout(() => this.player.attacking = false, 300); // Cooldown/Animation time

            // Create hitbox
            const hitboxX = this.player.vx < 0 ? this.player.x - 40 : this.player.x + this.player.width;
            const hitbox = {
                x: hitboxX,
                y: this.player.y,
                width: 40,
                height: 60,
                damage: this.player.damage,
                life: 0.1 // Lasts 0.1s
            };
            this.projectiles.push(hitbox);
        }

        // Update physics
        this.engine.update(dt, this.entities);

        // Update camera
        this.camera.follow(this.player, this.mapWidth, this.mapHeight);

        // Update entities
        const minionCount = this.entities.filter(e => e instanceof Enemy && !(e instanceof Boss)).length;
        this.entities.forEach(entity => {
            if (entity instanceof Boss) {
                // Boss waits for minions
                if (minionCount > 0) {
                    entity.invulnerable = true;
                    entity.vx = 0; // Stop moving
                    // Optional: Visual cue?
                } else {
                    entity.invulnerable = false;
                }
            }
            entity.update(dt, this.player);
        });

        // Update projectiles
        this.projectiles.forEach((p, i) => {
            p.life -= dt;
            if (p.life <= 0) this.projectiles.splice(i, 1);
        });

        // Combat Collisions
        this.checkCombat();

        // Update UI
        if (this.ui) this.ui.update();


    }

    checkCombat() {
        // 1. Player vs Enemies (taking damage) OR Collectibles
        this.entities.forEach((entity, index) => {
            if (entity === this.player) return;
            if (this.checkCollision(this.player, entity)) {

                if (entity instanceof Collectible) {
                    // Collect
                    if (entity.type === 'coin') {
                        this.player.coins += entity.value;
                        this.levelStats.coinsCollected += entity.value;
                    } else if (entity.type === 'potion') {
                        this.player.hp = Math.min(this.player.hp + entity.value, this.player.maxHp);
                    }
                    this.entities.splice(index, 1);
                    return; // Done
                }

                // Take damage
                // Simple cooldown to avoid instant death
                if (!this.player.invulnerable) {
                    const rawDamage = (entity.damage || 10) - this.player.defense;
                    const actualDamage = Math.max(1, rawDamage); // Always deal at least 1 damage
                    this.player.hp -= actualDamage;
                    if (this.player.hp <= 0) {
                        this.gameState = 'GAME_OVER';
                    }
                    this.player.invulnerable = true;
                    setTimeout(() => this.player.invulnerable = false, 1000);
                }
            }
        });

        // 2. Projectiles (Player Attack) vs Enemies
        this.projectiles.forEach(p => {
            this.entities.forEach((entity, i) => {
                if (entity === this.player) return;
                if (this.checkCollision(p, entity)) {
                    entity.hp -= p.damage;
                    // Floating Text
                    this.floatingTexts.push({
                        x: entity.x + entity.width / 2,
                        y: entity.y,
                        text: "-" + p.damage,
                        life: 1.0 // 1 second
                    });

                    // Pushback?  
                    entity.vx += (p.x < entity.x ? 200 : -200);

                    if (entity.hp <= 0) {
                        // Kill entity
                        this.entities.splice(i, 1);
                        this.levelStats.enemiesKilled++;

                        // Drop loot
                        if (Math.random() < 0.5) {
                            // Coins value scales with enemy strength
                            let val = 10;
                            if (entity.xpValue) val = entity.xpValue * 10;
                            this.entities.push(new Collectible(entity.x, entity.y, 'coin', val));
                        }
                        if (Math.random() < 0.1) {
                            this.entities.push(new Collectible(entity.x + 10, entity.y, 'potion'));
                        }

                        // Check if boss died
                        if (entity instanceof Boss) {
                            // Boss Loot explosion
                            const coinValue = 10 + (this.currentLevelIdx * 5);
                            for (let k = 0; k < 20; k++) {
                                this.entities.push(new Collectible(entity.x + (Math.random() * 50 - 25), entity.y - 50, 'coin', coinValue));
                            }

                            this.autoCollectCoins();
                            setTimeout(() => {
                                this.gameState = 'LEVEL_COMPLETE';
                            }, 500);
                        }
                    }
                }
            });
        });
    }

    autoCollectCoins() {
        this.entities.forEach((entity, index) => {
            if (entity instanceof Collectible && entity.type === 'coin') {
                this.player.coins += entity.value;
                this.levelStats.coinsCollected += entity.value;
                // Visual effect? Fly to player? For now just instant.
            }
        });
        // Remove all collectibles? Or just coins? Removing all cleanliness.
        this.entities = this.entities.filter(e => !(e instanceof Collectible));
    }

    checkCollision(rect1, rect2) {
        return (rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y);
    }

    draw() {
        // Clear screen
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.textAlign = 'left'; // Reset default

        // Draw background
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw world
        this.engine.draw(this.camera);

        // Draw entities
        this.entities.forEach(entity => entity.draw(this.ctx, this.camera));

        // Draw HUD (Top Bar)
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.width, 40);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';

        // Health Icon and Bar (Hero)
        this.ctx.fillStyle = 'red';
        this.ctx.fillText("❤", 10, 25);
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(30, 10, 100, 20); // BG
        this.ctx.fillStyle = '#00FF00';
        const hpPct = Math.max(0, this.player.hp / this.player.maxHp);
        this.ctx.fillRect(30, 10, 100 * hpPct, 20); // FG

        // Coins
        this.ctx.fillStyle = 'gold';
        this.ctx.fillText("💰 " + this.player.coins, 150, 25);

        // Level Info
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(`Level ${this.currentLevelIdx + 1}: ${Levels[this.currentLevelIdx]?.name || "Unknown"}`, 300, 25);

        // Time
        const mins = Math.floor(this.levelTime / 60);
        const secs = Math.floor(this.levelTime % 60);
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        this.ctx.fillText("Time: " + timeStr, this.width - 120, 25);



        // Draw projectiles (debug/visual)
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        this.projectiles.forEach(p => {
            this.ctx.fillRect(p.x - this.camera.x, p.y - this.camera.y, p.width, p.height);
        });

        // Draw Controls (Bottom Layer)
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("Controls: Arrows to Move | Z/Space to Attack | ESC for Hero Maker", this.width / 2, 580);

        // Info Button ('i') in bottom right
        this.ctx.fillStyle = this.showDebug ? 'gold' : 'white';
        this.ctx.beginPath();
        this.ctx.arc(this.width - 20, this.height - 20, 15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'black';
        this.ctx.font = 'bold 16px serif';
        this.ctx.fillText("i", this.width - 20, this.height - 15);

        this.ctx.textAlign = 'left'; // Reset

        // Draw UI Overlay for Menu States
        if (this.gameState !== 'PLAYING') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';

            if (this.gameState === 'START') {
                this.ctx.font = '40px Arial';
                this.ctx.fillText("HERO MAKER", this.width / 2, 150);
                this.ctx.font = '20px Arial';
                this.ctx.fillText("A girl has gone missing. Rumors say she was taken by Malgor.", this.width / 2, 200);
                this.ctx.fillText("Travel through 10 lands, defeat bosses, and find her!", this.width / 2, 230);
                this.ctx.fillText("Controls: Arrows to Move, Z/Space to Attack, E for Equip.", this.width / 2, 300);
                this.ctx.font = '30px Arial';
                this.ctx.fillText("Press Space to Start", this.width / 2, 400);
                this.ctx.font = '20px Arial';
                this.ctx.fillText("Press H for High Scores", this.width / 2, 450);
            } else if (this.gameState === 'LEVEL_COMPLETE') {
                this.ctx.font = '40px Arial';
                this.ctx.fillStyle = 'gold';
                this.ctx.fillText("LEVEL COMPLETE!", this.width / 2, 150);
                this.ctx.fillStyle = 'white';
                this.ctx.font = '25px Arial';
                this.ctx.fillText(`Enemies Defeated: ${this.levelStats.enemiesKilled}`, this.width / 2, 220);
                this.ctx.fillText(`Coins Collected: ${this.levelStats.coinsCollected}`, this.width / 2, 260);
                this.ctx.fillText("All remaining coins collected!", this.width / 2, 300);
                this.ctx.font = '30px Arial';
                this.ctx.fillText("Press Space for Next Level", this.width / 2, 400);
            } else if (this.gameState === 'GAME_OVER') {
                this.ctx.font = '50px Arial';
                this.ctx.fillStyle = 'red';
                this.ctx.fillText("GAME OVER", this.width / 2, 200);
                this.ctx.font = '30px Arial';
                this.ctx.fillStyle = 'white';
                this.ctx.fillText("Press Space to Restart", this.width / 2, 300);
            } else if (this.gameState === 'VICTORY') {
                this.ctx.font = '50px Arial';
                this.ctx.fillStyle = 'gold';
                this.ctx.fillText("VICTORY!", this.width / 2, 150);
                this.ctx.font = '20px Arial';
                this.ctx.fillStyle = 'white';
                this.ctx.fillText("You defeated Malgor and saved the girl!", this.width / 2, 220);

                // Draw The Girl
                this.ctx.fillStyle = 'pink';
                this.ctx.fillRect(this.width / 2 + 60, 260, 30, 50); // Girl
                this.ctx.fillStyle = this.player.armor.color || 'blue';
                this.ctx.fillRect(this.width / 2 - 40, 260, 40, 60); // Hero

                this.ctx.fillStyle = 'white';
                this.ctx.fillText("Press Space to Play Again", this.width / 2, 350);

                // High Score Entry/Display
                this.ctx.font = '20px Arial';
                this.ctx.fillStyle = 'cyan';
                const mins = Math.floor(this.totalTime / 60);
                const secs = Math.floor(this.totalTime % 60);
                this.ctx.fillText(`Total Time: ${mins}:${secs.toString().padStart(2, '0')}`, this.width / 2, 300);

                // For now, simpler: Just show time. Name entry requires DOM input or complex key handling.
                // Let's autosave with a generic name or prompt?
                // Web: prompt() is blocking but easiest for prototype.
                if (!this.scoreSaved && this.input.attack) { // Save on space (restart check)
                    // Logic handled in updateMenu usually, but we need a flag
                }
            } else if (this.gameState === 'HIGH_SCORES') {
                this.ctx.fillStyle = 'black';
                this.ctx.fillRect(0, 0, this.width, this.height);
                this.ctx.fillStyle = 'gold';
                this.ctx.font = '40px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText("HIGH SCORES", this.width / 2, 80);

                this.ctx.fillStyle = 'white';
                this.ctx.font = '24px Arial';
                this.highScores.slice(0, 10).forEach((score, i) => {
                    const mins = Math.floor(score.time / 60);
                    const secs = Math.floor(score.time % 60);
                    this.ctx.fillText(`${i + 1}. ${score.name} - ${mins}:${secs.toString().padStart(2, '0')}`, this.width / 2, 140 + (i * 30));
                });

                this.ctx.fillText("Press Space to Return", this.width / 2, 500);
            }
        }
    }
}
