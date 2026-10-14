const ASSETS = {
    'Rat-Fiend': new Image(),
    'Pig-Troll': new Image(),
    'Wolf-Zombie': new Image(),
    'Lizard-Fiend': new Image(),
    'Boar-Troll': new Image(),
    'Gargoyle': new Image(),
    'Boss': new Image()
};
ASSETS['Rat-Fiend'].src = 'assets/rat-fiend.png';
ASSETS['Pig-Troll'].src = 'assets/pig-troll.png';
ASSETS['Wolf-Zombie'].src = 'assets/wolf-zombie.png';
ASSETS['Lizard-Fiend'].src = 'assets/lizard-fiend.png';
ASSETS['Boar-Troll'].src = 'assets/boar-troll.png';
ASSETS['Gargoyle'].src = 'assets/gargoyle.png';
ASSETS['Boss'].src = 'assets/boss.png';

class Entity {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.grounded = false;
        this.speed = 200;
        this.jumpForce = -500;
    }

    update(dt) {
        // Base update
    }

    draw(ctx, camera) {
        ctx.fillStyle = this.color;

        // Draw Shield if invulnerable
        if (this.invulnerable) {
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - camera.x - 5, this.y - camera.y - 5, this.width + 10, this.height + 10);
        }

        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, this.height);

        // Health Bar (Only if hp is defined and < maxHp or always?)
        // User requested: "immediately above the character... same width... thin and green/red"
        if (this.hp !== undefined && this.maxHp !== undefined) {
            const barWidth = this.width;
            const barHeight = 5;
            const barX = this.x - camera.x;
            const barY = this.y - camera.y - 10; // Slightly above

            // Background (Red/Missing health)
            ctx.fillStyle = 'red';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // Foreground (Green/Current health)
            const hpPercent = Math.max(0, this.hp / this.maxHp);
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
        }
    }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 40, 60, '#ff0000'); // Base color (will be covered by armor)

        // Stats
        this.baseMaxHp = 100;
        this.maxHp = 100;
        this.hp = 100;
        this.coins = 100; // Starting coins
        this.baseDamage = 5;
        this.damage = 5;
        this.defense = 0;

        // Equipment
        this.weapon = Items.Weapons[0];
        this.armor = Items.Armor[0];

        this.equip(this.weapon);
        this.equip(this.armor);
    }

    equip(item) {
        if (item.damage !== undefined) {
            this.weapon = item;
        } else if (item.defense !== undefined) {
            this.armor = item;
        }
        this.recalculateStats();
    }

    recalculateStats() {
        this.damage = this.baseDamage + (this.weapon.damage || 0);
        this.defense = (this.armor.defense || 0);
        this.maxHp = this.baseMaxHp + (this.armor.health || 0);
        // Heal up to new max HP? Or keep percentage? For now, just clamp
        if (this.hp > this.maxHp) this.hp = this.maxHp;
    }

    handleInput(input) {
        this.vx = 0;
        if (input.left) this.vx = -this.speed;
        if (input.right) this.vx = this.speed;

        if (input.up && this.grounded) {
            this.vy = this.jumpForce;
            this.grounded = false;
        }
    }

    draw(ctx, camera) {
        // Draw body/armor
        ctx.fillStyle = this.armor.color;
        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, this.height);

        // Draw weapon (simple visual: a small rect attached to the side)
        ctx.fillStyle = this.weapon.color;
        let weaponX = this.x - camera.x + this.width;
        if (this.vx < 0) weaponX = this.x - camera.x - 20; // Facing left
        ctx.fillRect(weaponX, this.y - camera.y + 20, 20, 10);
    }
}

class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 60, 60, '#FF00FF'); // Purple default
        this.type = type;
        this.speed = 100;
        this.vx = 0;

        // Stat Scaling
        const stats = this.getStatsByType(type);
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.damage = stats.damage;
        this.xpValue = stats.xp; // Coin drop chance/amount could scale with this
        this.color = this.getColorByType(type);
        this.direction = 1;

        // Image reference
        this.img = ASSETS[type];
    }

    getStatsByType(type) {
        switch (type) {
            case "Rat-Fiend": return { hp: 30, damage: 10, xp: 1 };
            case "Pig-Troll": return { hp: 60, damage: 20, xp: 2 };
            case "Wolf-Zombie": return { hp: 100, damage: 30, xp: 3 };
            case "Lizard-Fiend": return { hp: 150, damage: 45, xp: 4 };
            case "Boar-Troll": return { hp: 200, damage: 60, xp: 5 };
            case "Gargoyle": return { hp: 300, damage: 80, xp: 6 };
            case "Boss": return { hp: 1000, damage: 100, xp: 50 }; // Fallback
            default: return { hp: 30, damage: 10, xp: 1 };
        }
    }

    getColorByType(type) {
        if (type.includes("Rat")) return "#A9A9A9"; // Grey
        if (type.includes("Pig")) return "#FFC0CB"; // Pink
        if (type.includes("Wolf")) return "#708090"; // Slate
        if (type.includes("Lizard")) return "#32CD32"; // Lime
        if (type.includes("Boss")) return "#8B0000"; // Dark Red
        return "#FF00FF";
    }

    update(dt, player) {
        // AI: Chase Player if close
        if (player) {
            const dist = Math.abs(player.x - this.x);
            if (dist < 400 && dist > 10) { // Agro range
                this.direction = (player.x < this.x) ? -1 : 1;
                this.vx = this.speed * this.direction;
            } else {
                // Idle or Patrol? For now just stop if not chasing
                this.vx = 0;
            }
        }
    }

    draw(ctx, camera) {
        // Check if image exists and is loaded
        if (this.img && this.img.complete && this.img.naturalWidth !== 0) {
            ctx.save();
            const drawX = this.x - camera.x;
            const drawY = this.y - camera.y;

            // Flip if facing left
            if (this.direction === -1) {
                ctx.translate(drawX + this.width, drawY);
                ctx.scale(-1, 1);
                ctx.drawImage(this.img, 0, 0, this.width, this.height);
            } else {
                ctx.drawImage(this.img, drawX, drawY, this.width, this.height);
            }
            ctx.restore();

            // Manually draw health bar since we're not calling super.draw
            this.drawHealthBar(ctx, camera);
        } else {
            super.draw(ctx, camera);
        }
    }

    drawHealthBar(ctx, camera) {
        if (this.hp !== undefined && this.maxHp !== undefined) {
            const barWidth = this.width;
            const barHeight = 5;
            const barX = this.x - camera.x;
            const barY = this.y - camera.y - 10;

            ctx.fillStyle = 'red';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            const hpPercent = Math.max(0, this.hp / this.maxHp);
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
        }
    }
}

class Boss extends Enemy {
    constructor(x, y, name, level = 1) {
        super(x, y, "Boss");
        this.name = name;
        this.width = 80;
        this.height = 80;
        // Boss HP scales with level. Base 500 + 100 per level.
        // If level isn't passed (old calls), default to 500.
        // We'll need to update Game to pass level.
        this.hp = 500 + (level * 100);
        this.damage = 25 + (level * 5);
        this.color = "#FF4500"; // Orange-Red
    }

    update(dt, player) {
        // Boss Logic: Chase slowly
        if (player) {
            this.direction = (player.x < this.x) ? -1 : 1;
            this.vx = (this.speed * 0.5) * this.direction;
        }
    }
}

class Collectible extends Entity {
    constructor(x, y, type, value) {
        super(x, y, 20, 20, '#FFD700'); // Gold default
        this.type = type; // 'coin', 'potion'
        this.vy = -200; // Hop up
        this.vx = (Math.random() - 0.5) * 100;

        if (type === 'potion') {
            this.color = '#FF0000'; // Red
            this.value = 50; // Heal
        } else {
            this.value = value || 10; // Coin amount
        }
    }

    update(dt) {
        this.vy += 800 * dt; // Gravity
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Simple ground collision (hacky, assumes ground at 500ish or just stops)
        // Ideally use engine collision, but engine splits update/collision.
        // We'll let Game engine handle it if we add it to entities list?
        // Yes, if we add to entities list, engine.update handles physics!
        // But engine.update clears grounded.

        // Let's just dampen X friction
        if (this.grounded) {
            this.vx *= 0.9;
        }
    }
}
