export default class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'diamond' | 'crystal' | 'heart' | 'bullet_powerup'
        this.markedForDeletion = false;
        this.width = 32;
        this.height = 32;

        this.image = new Image();
        this.speedY = 2;

        // Bob animation
        this._originY = y;
        this._bobTime = Math.random() * Math.PI * 2;

        switch (this.type) {
            case 'diamond':
                this.image.src = 'assets/images/diamond.png';
                this.value = 500;
                break;
            case 'crystal':
                this.image.src = 'assets/images/crystal.png';
                this.value = 250;
                break;
            case 'heart':
                this.image.src = 'assets/images/heart.png';
                this.value = 0; // Value is HP restore
                break;
            case 'bullet_powerup':
                this.image.src = 'assets/images/power_up.png'; // Add your own sprite here
                this.value = 0;
                this.width = 38;
                this.height = 38;
                this.speedY = 1.5; // Drops a little slower — easier to catch
                break;
            default:
                this.image.src = 'assets/images/diamond.png';
                this.value = 100;
        }
    }

    update(deltaTime, canvas) {
        const factor = deltaTime ? deltaTime / 16.67 : 1;
        this._bobTime += 0.06 * factor;
        this.y += this.speedY * factor;

        if (this.y > canvas.height) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        if (this.image.complete && this.image.naturalWidth !== 0) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            this._drawPlaceholder(ctx);
        }
    }

    _drawPlaceholder(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const r = this.width / 2;

        if (this.type === 'heart') {
            ctx.fillStyle = '#ff3366';
        } else if (this.type === 'diamond') {
            ctx.fillStyle = '#00eeff';
        } else if (this.type === 'crystal') {
            ctx.fillStyle = '#dd00ff';
        } else if (this.type === 'bullet_powerup') {
            // Glowing star shape
            ctx.fillStyle = '#ffee00';
            ctx.shadowColor = '#ff9900';
            ctx.shadowBlur = 14;
            this._drawStar(ctx, cx, cy, 5, r, r * 0.45);
            ctx.shadowBlur = 0;

            // Power-level label overlay
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.round(r * 0.7)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚡', cx, cy);
            return;
        }

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    }

    /** Draw a regular N-pointed star */
    _drawStar(ctx, cx, cy, points, outerR, innerR) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const r = i % 2 === 0 ? outerR : innerR;
            if (i === 0) ctx.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
            else ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();
    }
}
