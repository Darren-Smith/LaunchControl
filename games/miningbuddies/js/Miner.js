export class Miner {
    constructor(game) {
        this.game = game;
        this.x = 300;
        this.y = 350;
        this.width = 36;
        this.height = 36;
        this.speed = 3.5;
        this.color = '#eab308';
        this.isMining = false;
        this.mineCooldown = 0;
        
        // Key state
        this.keys = {
            up: false,
            left: false,
            down: false,
            right: false,
            enter: false
        };
    }

    update(deltaTime) {
        // Movement
        let dx = 0;
        let dy = 0;
        if (this.keys.up) dy -= 1;
        if (this.keys.down) dy += 1;
        if (this.keys.left) dx -= 1;
        if (this.keys.right) dx += 1;

        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        this.x += dx * this.speed;
        this.y += dy * this.speed;

        // Boundaries (Left half of the screen)
        if (this.x < this.width/2) this.x = this.width/2;
        if (this.x > 600 - this.width/2) this.x = 600 - this.width/2;
        if (this.y < this.height/2) this.y = this.height/2;
        if (this.y > this.game.height - this.height/2) this.y = this.game.height - this.height/2;

        // Mining logic
        if (this.mineCooldown > 0) {
            this.mineCooldown -= deltaTime;
            if (this.mineCooldown < 150) this.isMining = false;
        }

        if (this.keys.enter && this.mineCooldown <= 0) {
            this.mine();
        }
    }

    mine() {
        this.isMining = true;
        
        // Base cooldown 300ms, reduced by drills
        let cooldownTime = 300;
        if (this.game.miningSystem.drills >= 2) cooldownTime = 150;
        else if (this.game.miningSystem.drills >= 1) cooldownTime = 220;
        
        this.mineCooldown = cooldownTime;
        
        // Attempt to hit rocks
        this.game.miningSystem.mineAt(this.x, this.y);
    }

    draw(ctx) {
        // Draw mining indicator
        if (this.isMining) {
            ctx.fillStyle = 'rgba(234, 179, 8, 0.4)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 45, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Miner
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}
