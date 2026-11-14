export class Monster {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 19;
        // 95–135 pixels per second (1.6 to 2.25 px @ 60Hz)
        this.speed = 92 + Math.random() * 42;
        this.health = 50;
        this.maxHealth = 50;
        this.color = '#64748b';
        this.damage = 10;
        this.attackCooldown = 0;

        this.hitFlash = 0;
        this.knockVx = 0;
        this.knockVy = 0;
        this.facingAngle = Math.PI;
        this.stepPhase = Math.random() * Math.PI * 2;
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
        this.knockVx = vx;
        this.knockVy = vy;
    }

    update(deltaTime) {
        const dt = Math.min(deltaTime / 1000, 0.1);
        this.stepPhase += dt * 9;

        if (this.hitFlash > 0) {
            this.hitFlash = Math.max(0, this.hitFlash - dt);
        }

        // Apply knockback decay
        if (Math.abs(this.knockVx) > 1 || Math.abs(this.knockVy) > 1) {
            this.x += this.knockVx * dt;
            this.y += this.knockVy * dt;
            this.knockVx *= Math.pow(0.008, dt);
            this.knockVy *= Math.pow(0.008, dt);
        }

        const target = this.pickTarget();
        if (!target) return;

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);

        // Separation force so monsters don't merge into a single circle
        let sepX = 0;
        let sepY = 0;
        for (const other of this.game.enemies) {
            if (other === this || !other) continue;
            const odx = this.x - other.x;
            const ody = this.y - other.y;
            const odist = Math.hypot(odx, ody);
            const minSep = this.radius + other.radius + 4;
            if (odist > 0.001 && odist < minSep) {
                const push = (minSep - odist) / minSep;
                sepX += (odx / odist) * push * 90;
                sepY += (ody / odist) * push * 90;
            }
        }

        if (dist > 0.001) {
            this.facingAngle = Math.atan2(dy, dx);
            this.x += ((dx / dist) * this.speed + sepX) * dt;
            this.y += ((dy / dist) * this.speed + sepY) * dt;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // Attack nearest miner in contact range
        const contactDist = this.radius + (target.width ? target.width / 2 : 18);
        if (dist < contactDist && this.attackCooldown <= 0) {
            target.takeDamage(this.damage, this.x, this.y);
            this.attackCooldown = 1050;
        }
    }

    takeDamage(amount, attacker = null) {
        this.health -= amount;
        this.hitFlash = 0.14;
        this.game.spawnParticles(this.x, this.y, 6, '#94a3b8');

        if (this.health <= 0) {
            const index = this.game.enemies.indexOf(this);
            if (index > -1) {
                this.game.enemies.splice(index, 1);
            }

            if (this.game.sfx) this.game.sfx.playMonsterDeath();
            this.game.spawnParticles(this.x, this.y, 14, '#ef4444');
            this.game.monstersKilled = (this.game.monstersKilled || 0) + 1;
            this.game.addScore(45);

            // Reward 1-2 diamonds for smashing a Rock Goblin!
            const drop = Math.random() < 0.35 ? 2 : 1;
            if (this.game.miningSystem) {
                this.game.miningSystem.addDiamonds(drop, this.x, this.y);
            }

            // 20% chance to drop a +12 HP Miner Ration heal for the attacker
            if (attacker && typeof attacker.heal === 'function' && attacker.health < attacker.maxHealth && Math.random() < 0.22) {
                attacker.heal(12);
                this.game.spawnFloatingText(attacker.x, attacker.y - 26, '+12 HP', '#4ade80');
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, 14, 16, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        const wobble = Math.sin(this.stepPhase) * 0.12;
        ctx.rotate(this.facingAngle + wobble);

        // Craggy Rock Goblin Shoulders & Club Fist
        ctx.fillStyle = this.hitFlash > 0 ? '#fca5a5' : '#475569';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;

        // Left & right jagged rock fists
        ctx.beginPath();
        ctx.arc(8, -15, 7, 0, Math.PI * 2);
        ctx.arc(8, 15, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Main jagged stone body (7-point craggy polygon)
        ctx.fillStyle = this.hitFlash > 0 ? '#fecaca' : this.color;
        ctx.beginPath();
        const sides = 7;
        for (let i = 0; i < sides; i++) {
            const a = (i / sides) * Math.PI * 2;
            const r = this.radius * (i % 2 === 0 ? 1.08 : 0.88);
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Goblin moss / iron band patch on back
        ctx.fillStyle = '#3f6212';
        ctx.beginPath();
        ctx.arc(-5, -4, 6, 0, Math.PI * 2);
        ctx.fill();

        // Glowing red goblin eyes
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(8, -5.5, 3.2, 0, Math.PI * 2);
        ctx.arc(8, 5.5, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();

        // Mini HP bar if damaged
        if (this.health < this.maxHealth) {
            const w = 28;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.fillRect(this.x - w / 2, this.y - 26, w, 4);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(this.x - w / 2, this.y - 26, w * (this.health / this.maxHealth), 4);
        }
    }
}
