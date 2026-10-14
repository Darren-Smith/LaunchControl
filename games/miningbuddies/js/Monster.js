export class Monster {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 18;
        this.speed = 1.5 + Math.random() * 1;
        this.health = 50;
        this.color = '#94a3b8';
        this.damage = 10;
        this.attackCooldown = 0;
    }

    update(deltaTime) {
        // Move towards fighter
        const target = this.game.fighter;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // Attack fighter
        if (dist < this.radius + target.width/2 && this.attackCooldown <= 0) {
            target.takeDamage(this.damage);
            this.attackCooldown = 1000; // 1 sec cooldown
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            // Remove self
            const index = this.game.enemies.indexOf(this);
            if (index > -1) {
                this.game.enemies.splice(index, 1);
            }
            // Small chance to drop a diamond directly or just give points?
            // Let's keep it simple: monsters just need to be defended against
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Angry red eyes
        ctx.fillStyle = '#ef4444';
        const target = this.game.fighter;
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        
        const eyeOffsetX = Math.cos(angle) * 8;
        const eyeOffsetY = Math.sin(angle) * 8;
        const perpX = Math.cos(angle + Math.PI/2) * 6;
        const perpY = Math.sin(angle + Math.PI/2) * 6;

        ctx.beginPath();
        ctx.arc(this.x + eyeOffsetX + perpX, this.y + eyeOffsetY + perpY, 3, 0, Math.PI*2);
        ctx.arc(this.x + eyeOffsetX - perpX, this.y + eyeOffsetY - perpY, 3, 0, Math.PI*2);
        ctx.fill();
    }
}
