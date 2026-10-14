export class Fighter {
    constructor(game) {
        this.game = game;
        this.x = 900;
        this.y = 350;
        this.width = 40;
        this.height = 40;
        this.speed = 4;
        this.color = '#3b82f6';
        this.health = 100;
        this.maxHealth = 100;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.attackRange = 60;
        
        // Key state
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            space: false
        };
    }

    update(deltaTime) {
        // Movement
        let dx = 0;
        let dy = 0;
        if (this.keys.w) dy -= 1;
        if (this.keys.s) dy += 1;
        if (this.keys.a) dx -= 1;
        if (this.keys.d) dx += 1;

        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        this.x += dx * this.speed;
        this.y += dy * this.speed;

        // Boundaries (Right half of the screen)
        if (this.x < 600 + this.width/2) this.x = 600 + this.width/2;
        if (this.x > this.game.width - this.width/2) this.x = this.game.width - this.width/2;
        if (this.y < this.height/2) this.y = this.height/2;
        if (this.y > this.game.height - this.height/2) this.y = this.game.height - this.height/2;

        // Attack logic
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
            if (this.attackCooldown < 300) this.isAttacking = false;
        }

        if (this.keys.space && this.attackCooldown <= 0) {
            this.attack();
        }
    }

    attack() {
        this.isAttacking = true;
        this.attackCooldown = 500; // ms
        
        // Damage enemies in range
        for (let enemy of this.game.enemies) {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < this.attackRange + enemy.radius) {
                enemy.takeDamage(25);
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        // Update UI
        document.getElementById('fighter-health-fill').style.width = `${(this.health / this.maxHealth) * 100}%`;
        
        if (this.health <= 0) {
            this.game.gameOver(false);
        }
    }

    draw(ctx) {
        // Draw attack radius if attacking
        if (this.isAttacking) {
            ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.attackRange, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Fighter
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}
