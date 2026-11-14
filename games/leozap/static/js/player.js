export default class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 64;
        this.speed = 5;
        this.dx = 0;
        this.dy = 0;
        this.health = 100;
        this.bullets = [];
        this.lastShot = 0;
        this.shootDelay = 200; // ms

        // Bullet power-up level (1–4)
        this.powerLevel = 1;

        // Physics
        this.friction = 0.9;
        this.thrust = 0.5;

        this.image = new Image();
        this.image.src = 'assets/images/leozap.png';

        this.keys = {
            ArrowUp: false, ArrowDown: false,
            ArrowLeft: false, ArrowRight: false,
            w: false, s: false, a: false, d: false,
            ' ': false
        };
        this.gamepad = {
            up: false,
            down: false,
            left: false,
            right: false,
            axisX: 0,
            axisY: 0,
            shoot: false
        };
        // Reference to canvas for dynamic reset positioning
        this.canvas = null;
    }

    handleInput(key, isPressed) {
        if (Object.prototype.hasOwnProperty.call(this.keys, key)) {
            this.keys[key] = isPressed;
        }
    }

    setGamepadInput(gpState) {
        if (!gpState) {
            this.gamepad.up = false;
            this.gamepad.down = false;
            this.gamepad.left = false;
            this.gamepad.right = false;
            this.gamepad.axisX = 0;
            this.gamepad.axisY = 0;
            this.gamepad.shoot = false;
            return;
        }
        this.gamepad.up = Boolean(gpState.up);
        this.gamepad.down = Boolean(gpState.down);
        this.gamepad.left = Boolean(gpState.left);
        this.gamepad.right = Boolean(gpState.right);
        this.gamepad.axisX = Number(gpState.axisX) || 0;
        this.gamepad.axisY = Number(gpState.axisY) || 0;
        this.gamepad.shoot = Boolean(gpState.shoot);
    }

    setCanvas(canvas) {
        this.canvas = canvas;
    }

    reset() {
        if (this.canvas) {
            this.x = this.canvas.width / 2;
            this.y = this.canvas.height - 100;
        } else {
            // Fallback for safety
            this.x = 400;
            this.y = 500;
        }
        this.dx = 0;
        this.dy = 0;
        this.health = 100;
        this.bullets = [];
        this.powerLevel = 1;
        this.setGamepadInput(null);
    }

    update(deltaTime, canvas) {
        const factor = deltaTime ? deltaTime / 16.67 : 1;
        // Movement (Keyboard + Gamepad simultaneously)
        if (this.keys.ArrowUp || this.keys.w || this.gamepad.up) this.dy -= this.thrust * factor;
        if (this.keys.ArrowDown || this.keys.s || this.gamepad.down) this.dy += this.thrust * factor;
        if (this.keys.ArrowLeft || this.keys.a || this.gamepad.left) this.dx -= this.thrust * factor;
        if (this.keys.ArrowRight || this.keys.d || this.gamepad.right) this.dx += this.thrust * factor;
        this.dx *= Math.pow(this.friction, factor);
        this.dy *= Math.pow(this.friction, factor);
        this.x += this.dx * factor;
        this.y += this.dy * factor;
        // Canvas boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;
        // Shooting
        if (this.keys[' '] || this.gamepad.shoot) {
            const now = Date.now();
            if (now - this.lastShot > this.shootDelay) {
                this.shoot();
                this.lastShot = now;
            }
        }
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.dx * factor;
            b.y += b.dy * factor;
            // Wall bouncing (Level 4 only)
            if (b.bouncing) {
                if (b.x <= 0) {
                    b.x = 0;
                    b.dx = Math.abs(b.dx);
                    b.bounces++;
                    window.SoundManager?.play('bulletBounce');
                } else if (b.x + b.width >= canvas.width) {
                    b.x = canvas.width - b.width;
                    b.dx = -Math.abs(b.dx);
                    b.bounces++;
                    window.SoundManager?.play('bulletBounce');
                }
            }
            // Remove expired bullets
            if (b.y + b.height < 0 ||
                b.y > canvas.height ||
                b.x + b.width < 0 ||
                b.x > canvas.width ||
                b.markedForDeletion ||
                (b.bouncing && b.bounces >= b.maxBounces)) {
                this.bullets.splice(i, 1);
            }
        }
    }

    /**
     * Bullet firing patterns (angles in standard math degrees: 90° = straight up)
     *   Level 1: Single — 90°
     *   Level 2: Spread — 80°, 100°
     *   Level 3: Wide   — 70°, 90°, 110°
     *   Level 4: Extreme — 60°, 80°, 100°, 120° + wall-bouncing
     */
    shoot() {
        const patterns = {
            1: [90],
            2: [80, 100],
            3: [70, 90, 110],
            4: [60, 80, 100, 120]
        };
        const bulletColors = ['#ffcc00', '#ff9900', '#ff5500', '#ee00ff'];
        const angles = patterns[this.powerLevel] || [90];
        const speed = 10;
        const bouncing = this.powerLevel === 4;
        const color = bulletColors[this.powerLevel - 1];
        angles.forEach(angleDeg => {
            const rad = angleDeg * (Math.PI / 180);
            const dx = Math.cos(rad) * speed;
            const dy = -Math.sin(rad) * speed;
            this.bullets.push({
                x: this.x + this.width / 2 - 2,
                y: this.y,
                width: 4,
                height: 10,
                dx,
                dy,
                color,
                bouncing,
                bounces: 0,
                maxBounces: 3,
                markedForDeletion: false
            });
        });
        window.SoundManager?.play('shoot');
    }

    draw(ctx) {
        // Player sprite
        if (this.image.complete && this.image.naturalWidth !== 0) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#3399ff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        // Draw bullets
        this.bullets.forEach(b => {
            if (this.powerLevel >= 3) {
                ctx.shadowColor = b.color;
                ctx.shadowBlur = this.powerLevel === 4 ? 18 : 8;
            }
            ctx.fillStyle = b.color;
            const angle = Math.atan2(b.dy, b.dx) + Math.PI / 2;
            ctx.save();
            ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
            ctx.rotate(angle);
            ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
            ctx.restore();
            ctx.shadowBlur = 0;
        });
    }
}
