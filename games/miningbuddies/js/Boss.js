export class Boss {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 45;
        this.speed = 1;
        this.health = 500;
        this.maxHealth = 500;
        this.color = '#475569';
        this.damage = 25;
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
            this.attackCooldown = 1500; // 1.5 sec cooldown
            
            // Screen shake or special effect could go here
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.game.bossDefeated = true;
            this.game.checkWinCondition();
            
            // Remove self
            const index = this.game.enemies.indexOf(this);
            if (index > -1) {
                this.game.enemies.splice(index, 1);
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        
        // Draw spiked shell
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const px = this.x + Math.cos(angle) * (this.radius + 15);
            const py = this.y + Math.sin(angle) * (this.radius + 15);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar
        const hpPercentage = this.health / this.maxHealth;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(this.x - 30, this.y - 60, 60, 8);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(this.x - 30, this.y - 60, 60 * hpPercentage, 8);
        
        // Angry red eyes
        ctx.fillStyle = '#ef4444';
        const target = this.game.fighter;
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        
        const eyeOffsetX = Math.cos(angle) * 15;
        const eyeOffsetY = Math.sin(angle) * 15;
        const perpX = Math.cos(angle + Math.PI/2) * 12;
        const perpY = Math.sin(angle + Math.PI/2) * 12;

        ctx.beginPath();
        ctx.arc(this.x + eyeOffsetX + perpX, this.y + eyeOffsetY + perpY, 6, 0, Math.PI*2);
        ctx.arc(this.x + eyeOffsetX - perpX, this.y + eyeOffsetY - perpY, 6, 0, Math.PI*2);
        ctx.fill();
    }
}
