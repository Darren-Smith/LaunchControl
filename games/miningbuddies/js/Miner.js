export class Miner {
    constructor(game, config = {}) {
        this.game = game;
        this.id = config.id || 1;
        this.name = config.name || `Miner ${this.id}`;
        this.x = config.x ?? (this.id === 1 ? 300 : 820);
        this.y = config.y ?? 350;
        this.width = 36;
        this.height = 36;
        this.radius = 18;
        this.speed = 230; // pixels per second (3.83 px @ 60Hz)

        this.color = config.color || (this.id === 1 ? '#f59e0b' : '#38bdf8');
        this.helmetDark = this.id === 1 ? '#b45309' : '#0369a1';
        this.coatColor = this.id === 1 ? '#78350f' : '#1e3a8a';

        this.health = 100;
        this.maxHealth = 100;
        this.invulnTimer = 0; // seconds of i-frames after taking a hit
        this.downedTimer = 0; // > 0 when knocked to one knee (co-op revive)
        this.knockVx = 0;
        this.knockVy = 0;

        this.facingAngle = this.id === 1 ? 0 : Math.PI;
        this.walkCycle = 0;

        this.isMining = false;
        this.mineCooldown = 0; // ms
        this.swingTimer = 0; // ms for pickaxe/drill visual animation
        this.attackRange = 64;

        this.hpBarEl = document.getElementById(config.hpBarId || (this.id === 1 ? 'miner1-health-fill' : 'miner2-health-fill'));
        this.hpTextEl = document.getElementById(config.hpTextId || (this.id === 1 ? 'miner1-hp-text' : 'miner2-hp-text'));

        // Key state (supports both Miner 1 and Miner 2 key shapes for backwards compatibility)
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            action: false,
            // Aliases for legacy references
            w: false,
            a: false,
            s: false,
            d: false,
            space: false,
            enter: false
        };
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.health = this.maxHealth;
        this.invulnTimer = 1.5; // Spawn grace period
        this.downedTimer = 0;
        this.knockVx = 0;
        this.knockVy = 0;
        this.isMining = false;
        this.mineCooldown = 0;
        this.updateHealthUI();
    }

    get isDowned() {
        return this.downedTimer > 0;
    }

    update(deltaTime) {
        const dt = Math.min(deltaTime / 1000, 0.1);

        if (this.invulnTimer > 0) {
            this.invulnTimer = Math.max(0, this.invulnTimer - dt);
        }

        // Knockback decay
        if (Math.abs(this.knockVx) > 1 || Math.abs(this.knockVy) > 1) {
            this.x += this.knockVx * dt;
            this.y += this.knockVy * dt;
            this.knockVx *= Math.pow(0.01, dt);
            this.knockVy *= Math.pow(0.01, dt);
        }

        // Handle downed / buddy revive state
        if (this.downedTimer > 0) {
            let reviveRate = 1.0;
            const buddy = this.id === 1 ? this.game.fighter : this.game.miner;
            if (buddy && buddy !== this && !buddy.isDowned) {
                const dist = Math.hypot(buddy.x - this.x, buddy.y - this.y);
                if (dist < 85) {
                    reviveRate = 2.5; // Buddy standing nearby revives 2.5x faster!
                }
            }
            this.downedTimer -= dt * reviveRate;
            if (this.downedTimer <= 0) {
                this.downedTimer = 0;
                this.health = 60;
                this.invulnTimer = 2.0;
                this.updateHealthUI();
                if (this.game.sfx) this.game.sfx.playUpgrade();
                this.game.spawnFloatingText(this.x, this.y - 24, 'REVIVED!', '#4ade80');
            }
            this.clampToCavern();
            return;
        }

        // Passive slow stamina/health recovery when out of danger
        if (this.health > 0 && this.health < this.maxHealth && this.invulnTimer <= 0) {
            this.health = Math.min(this.maxHealth, this.health + 1.2 * dt);
            this.updateHealthUI();
        }

        // Read directional input (supporting both unified & legacy property names)
        const up = this.keys.up || this.keys.w;
        const down = this.keys.down || this.keys.s;
        const left = this.keys.left || this.keys.a;
        const right = this.keys.right || this.keys.d;
        const act = this.keys.action || this.keys.enter || this.keys.space;

        let dx = 0;
        let dy = 0;
        if (up) dy -= 1;
        if (down) dy += 1;
        if (left) dx -= 1;
        if (right) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const length = Math.hypot(dx, dy);
            dx /= length;
            dy /= length;
            this.facingAngle = Math.atan2(dy, dx);
            this.walkCycle += dt * 12;
        }

        const speedMult = this.game.miningSystem && this.game.miningSystem.overdrive ? 1.22 : 1.0;
        this.x += dx * this.speed * speedMult * dt;
        this.y += dy * this.speed * speedMult * dt;

        // Soft push-out from solid ore boulders so miners don't stand inside rocks
        if (this.game.miningSystem) {
            for (const rock of this.game.miningSystem.rocks) {
                const rdx = this.x - rock.x;
                const rdy = this.y - rock.y;
                const dist = Math.hypot(rdx, rdy);
                const minDist = this.radius + rock.radius * 0.78;
                if (dist > 0.001 && dist < minDist) {
                    const overlap = minDist - dist;
                    this.x += (rdx / dist) * overlap;
                    this.y += (rdy / dist) * overlap;
                }
            }
        }

        // Full-cavern boundaries (both miners can roam the entire Goblin Mine!)
        this.clampToCavern();

        // Cooldowns
        if (this.mineCooldown > 0) {
            this.mineCooldown -= deltaTime;
        }
        if (this.swingTimer > 0) {
            this.swingTimer -= deltaTime;
            if (this.swingTimer <= 0) {
                this.isMining = false;
            }
        }

        if (act && this.mineCooldown <= 0) {
            this.strike();
        }
    }

    clampToCavern() {
        const margin = 32;
        if (this.x < margin) this.x = margin;
        if (this.x > this.game.width - margin) this.x = this.game.width - margin;
        if (this.y < margin) this.y = margin;
        if (this.y > this.game.height - margin) this.y = this.game.height - margin;
    }

    // Unified action: strikes BOTH diamond rocks AND rock monsters!
    strike() {
        this.isMining = true;
        const drills = this.game.miningSystem ? this.game.miningSystem.drills : 0;

        let cooldownTime = 290;
        if (drills >= 3) cooldownTime = 125;
        else if (drills >= 2) cooldownTime = 160;
        else if (drills >= 1) cooldownTime = 215;

        this.mineCooldown = cooldownTime;
        this.swingTimer = Math.min(180, cooldownTime * 0.85);

        // 1. Mine rocks around & in front of the miner
        let hitRock = false;
        if (this.game.miningSystem) {
            hitRock = this.game.miningSystem.mineAt(this.x, this.y, this.facingAngle);
        }

        // 2. Strike any Rock Monsters or Boss in reach!
        const reach = this.attackRange + drills * 10;
        const baseDamage = 25 + drills * 8;
        let hitEnemy = false;

        for (let i = this.game.enemies.length - 1; i >= 0; i--) {
            const enemy = this.game.enemies[i];
            if (!enemy) continue;
            const edx = enemy.x - this.x;
            const edy = enemy.y - this.y;
            const dist = Math.hypot(edx, edy);

            if (dist < reach + enemy.radius) {
                hitEnemy = true;
                // Aimed knockback away from the miner
                const nx = dist > 0 ? edx / dist : 1;
                const ny = dist > 0 ? edy / dist : 0;
                if (typeof enemy.applyKnockback === 'function') {
                    enemy.applyKnockback(nx * 190, ny * 190);
                }
                enemy.takeDamage(baseDamage, this);
            }
        }

        if (this.game.sfx) {
            if (hitEnemy) {
                this.game.sfx.playMonsterHit();
            } else if (hitRock) {
                this.game.sfx.playPickaxeClink(this.id === 1 ? 1.0 : 1.15);
            } else {
                this.game.sfx.playPickaxeClink(0.75);
            }
        }
    }

    // Alias so any existing calls to fighter.attack() work seamlessly
    attack() {
        this.strike();
    }

    takeDamage(amount, sourceX = null, sourceY = null) {
        if (this.invulnTimer > 0 || this.downedTimer > 0 || this.game.isGameOver) return;

        this.health -= amount;
        this.invulnTimer = 0.55; // 550ms invincibility frames so swarms can't insta-delete a player

        if (sourceX !== null && sourceY !== null) {
            const dx = this.x - sourceX;
            const dy = this.y - sourceY;
            const d = Math.hypot(dx, dy) || 1;
            this.knockVx = (dx / d) * 260;
            this.knockVy = (dy / d) * 260;
        }

        if (this.game.sfx) this.game.sfx.playPlayerHurt();
        this.game.triggerShake(5, 0.14);

        if (this.health <= 0) {
            this.health = 0;
            this.updateHealthUI();

            // Check if the other buddy is also downed or if we are in 1-player mode with both downed
            const buddy = this.id === 1 ? this.game.fighter : this.game.miner;
            if (!buddy || buddy === this || buddy.isDowned || buddy.health <= 0) {
                this.game.gameOver(false);
            } else {
                this.downedTimer = 5.0; // 5 seconds until self-recovery (faster with buddy nearby)
                this.game.spawnFloatingText(this.x, this.y - 24, 'DOWNED! REVIVING...', '#f87171');
            }
            return;
        }

        this.updateHealthUI();
    }

    heal(amount) {
        if (this.downedTimer > 0) {
            this.downedTimer = 0;
        }
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.updateHealthUI();
    }

    updateHealthUI() {
        const pct = Math.max(0, Math.min(100, (this.health / this.maxHealth) * 100));
        if (this.hpBarEl) {
            this.hpBarEl.style.width = `${pct}%`;
        }
        if (this.hpTextEl) {
            this.hpTextEl.textContent = this.downedTimer > 0
                ? `DOWN (${Math.ceil(this.downedTimer)}s)`
                : `${Math.ceil(this.health)}/${this.maxHealth}`;
        }
    }

    draw(ctx) {
        ctx.save();

        // 1. Directional Miner Headlamp Cone across the cavern floor
        if (!this.isDowned) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.facingAngle);

            const coneGrad = ctx.createRadialGradient(8, 0, 4, 85, 0, 130);
            coneGrad.addColorStop(0, 'rgba(254, 249, 195, 0.26)');
            coneGrad.addColorStop(0.5, 'rgba(253, 224, 71, 0.10)');
            coneGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');

            ctx.fillStyle = coneGrad;
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.arc(6, 0, 145, -0.45, 0.45);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // 2. Swing / Drill Impact Arc Indicator
        const drills = this.game.miningSystem ? this.game.miningSystem.drills : 0;
        if (this.isMining && !this.isDowned) {
            const reach = this.attackRange + drills * 10;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.facingAngle);

            // Outer shock ring
            ctx.fillStyle = this.id === 1 ? 'rgba(245, 158, 11, 0.18)' : 'rgba(56, 189, 248, 0.18)';
            ctx.strokeStyle = drills >= 3 ? '#2dd4bf' : this.color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, reach * 0.85, -1.1, 1.1);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // Blink transparency when invulnerable
        if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 16) % 2 === 0) {
            ctx.globalAlpha = 0.55;
        }

        ctx.translate(this.x, this.y);

        // Shadow under miner
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, 14, 16, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.isDowned) {
            // Draw downed state + revive progress ring
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 3;
            const prog = 1 - this.downedTimer / 5.0;
            ctx.beginPath();
            ctx.arc(0, 0, 24, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
            ctx.stroke();
        }

        ctx.rotate(this.facingAngle);

        // 3. Draw Pickaxe or Spinning Power Drill in hand
        const swingOffset = this.isMining ? Math.sin((this.swingTimer / 180) * Math.PI) * 0.95 : 0;
        ctx.save();
        ctx.translate(10, 12);
        ctx.rotate(swingOffset - 0.35);

        if (drills >= 1) {
            // Mechanical Power Drill (scales with Drill I, II, III)
            ctx.fillStyle = drills >= 3 ? '#2dd4bf' : (drills === 2 ? '#fbbf24' : '#94a3b8');
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.5;
            // Drill motor housing
            ctx.fillRect(-2, -6, 12, 12);
            ctx.strokeRect(-2, -6, 12, 12);
            // Conical drill bit
            ctx.beginPath();
            ctx.moveTo(10, -7);
            ctx.lineTo(26 + drills * 3, 0);
            ctx.lineTo(10, 7);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Spiral drill flutes
            ctx.strokeStyle = '#1e293b';
            ctx.beginPath();
            ctx.moveTo(14, -4);
            ctx.lineTo(18, 4);
            ctx.moveTo(19, -2);
            ctx.lineTo(22, 2);
            ctx.stroke();
        } else {
            // Heavy Iron Pickaxe
            ctx.fillStyle = '#78350f';
            ctx.fillRect(0, -2, 18, 4); // wooden shaft
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(12, 0, 11, -1.1, 1.1);
            ctx.stroke();
        }
        ctx.restore();

        // 4. Miner Backpack (Ore Satchel)
        ctx.fillStyle = '#451a03';
        ctx.strokeStyle = '#1c0a00';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-18, -11, 9, 22, 3);
        ctx.fill();
        ctx.stroke();

        // 5. Miner Shoulders / Coat
        ctx.fillStyle = this.coatColor;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-12, -15, 22, 30, 8);
        ctx.fill();
        ctx.stroke();

        // 6. Miner Hardhat (Domed Helmet with Rim & Glowing Headlamp)
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.helmetDark;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Helmet center ridge
        ctx.fillStyle = this.helmetDark;
        ctx.fillRect(-10, -2.5, 20, 5);

        // Glowing Front Headlamp Bulb
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(12, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();

        // 7. Player Badge Label ("P1" / "P2") above helmet
        ctx.fillStyle = this.color;
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`M${this.id}`, this.x, this.y - 22);
    }
}
