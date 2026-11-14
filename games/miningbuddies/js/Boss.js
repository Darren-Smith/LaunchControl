import { Monster } from './Monster.js';

export class Boss {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 46;
        this.speed = 66; // pixels per second
        this.health = 650;
        this.maxHealth = 650;
        this.color = '#334155';
        this.damage = 22;
        this.attackCooldown = 0;

        this.hitFlash = 0;
        this.knockVx = 0;
        this.knockVy = 0;
        this.facingAngle = Math.PI;
        this.phase = 1;
        this.slamTimer = 4.5;
        this.slamWindup = 0; // > 0 when telegraphing a ground slam

        this.bossBarWrap = document.getElementById('boss-bar-wrap');
        this.bossBarFill = document.getElementById('boss-health-fill');
        if (this.bossBarWrap) {
            this.bossBarWrap.classList.remove('hidden');
        }
        this.updateBossUI();
    }

    pickTarget() {
        const candidates = [];
        if (this.game.miner && !this.game.miner.isDowned) candidates.push(this.game.miner);
        if (this.game.fighter && !this.game.fighter.isDowned) candidates.push(this.game.fighter);
        if (candidates.length === 0) return this.game.fighter || this.game.miner;

        let best = candidates[0];
        let bestDist = Math.hypot(best.x - this.x, best.y - this.y);
        for (let i = 1; i < candidates.length; i++) {
            const d = Math.hypot(candidates[i].x - this.x, candidates[i].y - this.y);
            if (d < bestDist) {
                bestDist = d;
                best = candidates[i];
            }
        }
        return best;
    }

    applyKnockback(vx, vy) {
        // Boss resists knockback (25% effect)
        this.knockVx = vx * 0.25;
        this.knockVy = vy * 0.25;
    }

    update(deltaTime) {
        const dt = Math.min(deltaTime / 1000, 0.1);

        if (this.hitFlash > 0) {
            this.hitFlash = Math.max(0, this.hitFlash - dt);
        }

        if (Math.abs(this.knockVx) > 1 || Math.abs(this.knockVy) > 1) {
            this.x += this.knockVx * dt;
            this.y += this.knockVy * dt;
            this.knockVx *= Math.pow(0.01, dt);
            this.knockVy *= Math.pow(0.01, dt);
        }

        // Enrage at <50% HP
        if (this.health < this.maxHealth * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.speed = 82;
            if (this.game.sfx) this.game.sfx.playBossRoar();
            this.game.showUpgradeToast('👹 THE STONE COLOSSUS ENRAGES!');
            // Summon 2 goblin rock minions from tunnels
            this.game.enemies.push(new Monster(this.game, this.game.width - 36, 185));
            this.game.enemies.push(new Monster(this.game, this.game.width - 36, 545));
        }

        // Ground Slam Telegraph & Shockwave
        if (this.slamWindup > 0) {
            this.slamWindup -= dt;
            if (this.slamWindup <= 0) {
                this.executeGroundSlam();
            }
            return; // Pause movement briefly while winding up slam
        }

        const target = this.pickTarget();
        if (!target) return;

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.001) {
            this.facingAngle = Math.atan2(dy, dx);
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        this.slamTimer -= dt;
        if (this.slamTimer <= 0 && dist < 150) {
            this.slamWindup = 0.75; // 750ms visible orange ring telegraph before slamming!
            this.slamTimer = this.phase === 2 ? 5.0 : 6.8;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // Contact melee attack
        const contactDist = this.radius + (target.width ? target.width / 2 : 18);
        if (dist < contactDist && this.attackCooldown <= 0) {
            target.takeDamage(this.damage, this.x, this.y);
            this.attackCooldown = 1350;
            this.game.triggerShake(8, 0.22);
        }
    }

    executeGroundSlam() {
        this.game.triggerShake(11, 0.3);
        if (this.game.sfx) this.game.sfx.playBossRoar();
        this.game.spawnParticles(this.x, this.y, 26, '#f97316');

        const slamRadius = 115;
        const players = [this.game.miner, this.game.fighter];
        for (const p of players) {
            if (p && !p.isDowned && Math.hypot(p.x - this.x, p.y - this.y) < slamRadius) {
                p.takeDamage(18, this.x, this.y);
            }
        }
    }

    takeDamage(amount, attacker = null) {
        this.health -= amount;
        this.hitFlash = 0.12;
        this.game.spawnParticles(this.x, this.y, 8, '#f97316');
        this.updateBossUI();

        if (this.health <= 0) {
            this.health = 0;
            this.updateBossUI();
            if (this.bossBarWrap) {
                this.bossBarWrap.classList.add('hidden');
            }

            const index = this.game.enemies.indexOf(this);
            if (index > -1) {
                this.game.enemies.splice(index, 1);
            }

            this.game.bossDefeated = true;
            this.game.monstersKilled = (this.game.monstersKilled || 0) + 1;
            this.game.addScore(1000);
            this.game.triggerShake(14, 0.4);
            this.game.spawnParticles(this.x, this.y, 40, '#2dd4bf');
            this.game.showUpgradeToast('🏆 STONE COLOSSUS SHATTERED! +50 💎');

            if (this.game.miningSystem) {
                this.game.miningSystem.addDiamonds(50, this.x, this.y);
                this.game.miningSystem.updateGoalText();
            }

            this.game.checkWinCondition();
        }
    }

    updateBossUI() {
        if (this.bossBarFill) {
            const pct = Math.max(0, Math.min(100, (this.health / this.maxHealth) * 100));
            this.bossBarFill.style.width = `${pct}%`;
        }
    }

    draw(ctx) {
        ctx.save();

        // Draw Ground-Slam Telegraph Warning Ring if winding up
        if (this.slamWindup > 0) {
            const pulse = 1 - this.slamWindup / 0.75;
            ctx.fillStyle = `rgba(249, 115, 22, ${0.14 + pulse * 0.2})`;
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 115, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.translate(this.x, this.y);

        // Heavy Boss Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        ctx.ellipse(0, 26, 44, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.rotate(this.facingAngle);

        // Spiked Iron & Stone Pauldrons / Outer Shell
        ctx.fillStyle = this.hitFlash > 0 ? '#fca5a5' : (this.phase === 2 ? '#7f1d1d' : '#475569');
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const spikes = 10;
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i / (spikes * 2)) * Math.PI * 2;
            const r = i % 2 === 0 ? this.radius + 14 : this.radius - 2;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Core Obsidian / Slate Torso
        ctx.fillStyle = this.hitFlash > 0 ? '#fecaca' : '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Glowing Molten Goblin Runes on Carapace
        ctx.strokeStyle = this.phase === 2 ? '#ef4444' : '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-18, -14);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-18, 14);
        ctx.moveTo(-4, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();

        // Menacing Glowing Eyes
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(18, -12, 6, 0, Math.PI * 2);
        ctx.arc(18, 12, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();

        // Overhead Boss HP Bar
        const hpPercentage = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
        ctx.fillRect(-38, -66, 76, 9);
        ctx.fillStyle = this.phase === 2 ? '#f97316' : '#ef4444';
        ctx.fillRect(-38, -66, 76 * hpPercentage, 9);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-38, -66, 76, 9);

        ctx.restore();
    }
}
