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
        this.prevY = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.grounded = false;
        this.currentPlatform = null;
        this.speed = 255;
        this.jumpForce = -565;
    }

    update(dt) {
        // Base update
    }

    draw(ctx, camera) {
        ctx.fillStyle = this.color;

        if (this.invulnerable) {
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - camera.x - 5, this.y - camera.y - 5, this.width + 10, this.height + 10);
        }

        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, this.height);
        this.drawHealthBar(ctx, camera);
    }

    drawHealthBar(ctx, camera) {
        if (this.hp !== undefined && this.maxHp !== undefined) {
            const barWidth = this.width;
            const barHeight = 6;
            const barX = this.x - camera.x;
            const barY = this.y - camera.y - 12;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

            ctx.fillStyle = '#ef4444';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            const hpPercent = Math.max(0, Math.min(1, this.hp / this.maxHp));
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
        }
    }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 44, 76, '#ff0000');

        // Base Stats
        this.baseMaxHp = 100;
        this.maxHp = 100;
        this.hp = 100;
        this.coins = 100;
        this.baseDamage = 5;
        this.damage = 15;
        this.defense = 0;
        this.baseSpeed = 255;
        this.speedBonus = 0;
        this.speed = 255;
        this.facing = 1;
        this.ownedItems = new Set([
            'sword_wood',
            'head_bandana',
            'armor_cloth',
            'legs_cloth',
            'feet_leather'
        ]);

        // Active temporary power-up timers (seconds)
        this.buffs = {
            atk: 0,
            spd: 0,
            def: 0
        };

        // 5-Slot Equipment Loadout (CharaGen v2.0 slots)
        this.loadout = {
            mainWeapon: Items.Weapons[0],
            headwear: Items.Headwear[0],
            topBody: Items.Armor[0],
            legs: Items.Legs[0],
            feet: Items.Feet[0]
        };
        this.weapon = this.loadout.mainWeapon;
        this.armor = this.loadout.topBody;

        // CharaGen Animated Character Rig (loaded synchronously via embedded default profile)
        this.characterRig = typeof CharaGenCharacter !== 'undefined' ? new CharaGenCharacter() : null;
        if (this.characterRig) {
            this.characterRig.syncLoadout(this.loadout, this.buffs.atk > 0);
            this.characterRig.loadFromUrl('assets/hero_profile.json').then((ok) => {
                if (ok) {
                    this.characterRig.syncLoadout(this.loadout, this.buffs.atk > 0);
                }
            });
        }

        this.recalculateStats();
        this.hp = this.maxHp;
    }

    resetForNewRun() {
        this.baseMaxHp = 100;
        this.coins = 100;
        this.ownedItems = new Set([
            'sword_wood',
            'head_bandana',
            'armor_cloth',
            'legs_cloth',
            'feet_leather'
        ]);
        this.loadout = {
            mainWeapon: Items.Weapons[0],
            headwear: Items.Headwear[0],
            topBody: Items.Armor[0],
            legs: Items.Legs[0],
            feet: Items.Feet[0]
        };
        this.weapon = this.loadout.mainWeapon;
        this.armor = this.loadout.topBody;
        this.buffs = { atk: 0, spd: 0, def: 0 };
        this.recalculateStats();
        this.hp = this.maxHp;
        this.facing = 1;
        this.invulnerable = false;
        this.attacking = false;
        if (this.characterRig && this.characterRig.loaded) {
            this.characterRig.syncLoadout(this.loadout, false);
            this.characterRig.setProfile('Idle 1', true);
        }
    }

    equip(item) {
        if (!item) return;
        const oldMaxHp = this.maxHp || 100;
        let slot = item.slot;
        if (!slot) {
            slot = item.damage !== undefined && !item.defense ? 'mainWeapon' : 'topBody';
        }
        if (this.loadout[slot] !== undefined) {
            this.loadout[slot] = item;
        }
        this.weapon = this.loadout.mainWeapon;
        this.armor = this.loadout.topBody;

        this.recalculateStats();
        if (this.maxHp > oldMaxHp) {
            this.hp += (this.maxHp - oldMaxHp);
        }
        if (this.hp > this.maxHp) this.hp = this.maxHp;

        if (this.characterRig && this.characterRig.loaded) {
            this.characterRig.syncLoadout(this.loadout, this.buffs.atk > 0);
        }
    }

    recalculateStats() {
        let totalDamage = this.baseDamage;
        let totalDefense = 0;
        let totalHealth = this.baseMaxHp;
        let totalSpeedBonus = 0;

        Object.values(this.loadout).forEach(item => {
            if (!item) return;
            totalDamage += (item.damage || 0);
            totalDefense += (item.defense || 0);
            totalHealth += (item.health || 0);
            totalSpeedBonus += (item.speed || 0);
        });

        this.damage = totalDamage;
        this.defense = totalDefense;
        this.maxHp = totalHealth;
        this.speedBonus = totalSpeedBonus;
        this.speed = this.baseSpeed + this.speedBonus;
        if (this.hp > this.maxHp) this.hp = this.maxHp;
    }

    getTotalArmorTier() {
        const slots = ['headwear', 'topBody', 'legs', 'feet'];
        const sum = slots.reduce((acc, s) => acc + ((this.loadout[s] && this.loadout[s].level) || 1), 0);
        return Math.round(sum / slots.length);
    }

    getEffectiveDamage() {
        return this.buffs.atk > 0 ? this.damage * 2 : this.damage;
    }

    getEffectiveSpeed() {
        return this.buffs.spd > 0 ? this.speed * 1.35 : this.speed;
    }

    getEffectiveJumpForce() {
        return this.buffs.spd > 0 ? this.jumpForce * 1.12 : this.jumpForce;
    }

    updateBuffs(dt) {
        const hadAtkBuff = this.buffs.atk > 0;
        if (this.buffs.atk > 0) this.buffs.atk = Math.max(0, this.buffs.atk - dt);
        if (this.buffs.spd > 0) this.buffs.spd = Math.max(0, this.buffs.spd - dt);
        if (this.buffs.def > 0) this.buffs.def = Math.max(0, this.buffs.def - dt);

        if (hadAtkBuff !== (this.buffs.atk > 0) && this.characterRig && this.characterRig.loaded) {
            this.characterRig.syncLoadout(this.loadout, this.buffs.atk > 0);
        }

        if (this.characterRig && this.characterRig.loaded) {
            const speedRatio = Math.abs(this.vx) / Math.max(1, this.speed);
            this.characterRig.updateStateAnimation(dt, {
                isAttacking: Boolean(this.attacking),
                isGrounded: Boolean(this.grounded),
                vx: this.vx,
                speedRatio
            });
        }
    }

    handleInput(input) {
        const moveSpeed = this.getEffectiveSpeed();
        this.vx = 0;
        if (input.left) {
            this.vx = -moveSpeed;
            this.facing = -1;
        }
        if (input.right) {
            this.vx = moveSpeed;
            this.facing = 1;
        }

        if (input.up && this.grounded) {
            this.vy = this.getEffectiveJumpForce();
            this.grounded = false;
            return true;
        }
        return false;
    }

    draw(ctx, camera) {
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;
        const footCenterX = drawX + this.width / 2;
        const footBottomY = drawY + this.height;

        // Power-up aura ring if buffed
        if (this.buffs.atk > 0 || this.buffs.spd > 0 || this.buffs.def > 0) {
            ctx.save();
            const auraColor = this.buffs.atk > 0 ? '#f97316' : this.buffs.spd > 0 ? '#38bdf8' : '#4ade80';
            ctx.strokeStyle = auraColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(footCenterX, drawY + this.height / 2, this.width * 0.75, this.height * 0.58, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (this.invulnerable) {
            ctx.save();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(footCenterX, drawY + this.height / 2, this.width * 0.68, this.height * 0.54, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Render CharaGen Articulated Hero Rig (76px tall) with fallback to block hero if still loading
        let renderedRig = false;
        if (this.characterRig && this.characterRig.loaded) {
            renderedRig = this.characterRig.draw(
                ctx,
                footCenterX,
                footBottomY,
                this.facing,
                this.height,
                Boolean(this.attacking)
            );
        }

        if (!renderedRig) {
            ctx.fillStyle = this.armor.color;
            ctx.fillRect(drawX, drawY, this.width, this.height);

            ctx.fillStyle = '#0f172a';
            const visorX = this.facing === 1 ? drawX + 24 : drawX + 4;
            ctx.fillRect(visorX, drawY + 12, 14, 8);

            ctx.fillStyle = this.buffs.atk > 0 ? '#f97316' : this.weapon.color;
            const reach = this.attacking ? 38 : 20;
            const weaponX = this.facing === 1 ? drawX + this.width : drawX - reach;
            ctx.fillRect(weaponX, drawY + 28, reach, 10);
        }

        // Health bar above Hero
        this.drawHealthBar(ctx, camera);
    }
}

class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 60, 60, '#FF00FF');
        this.type = type;
        this.speed = 105;
        this.vx = 0;
        this.patrolDir = Math.random() < 0.5 ? -1 : 1;
        this.knockbackTimer = 0;

        // Stat Scaling
        const stats = this.getStatsByType(type);
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.damage = stats.damage;
        this.xpValue = stats.xp;
        this.color = this.getColorByType(type);
        this.direction = 1;

        this.img = ASSETS[type];
    }

    getStatsByType(type) {
        switch (type) {
            case "Rat-Fiend": return { hp: 30, damage: 10, xp: 1 };
            case "Pig-Troll": return { hp: 60, damage: 18, xp: 2 };
            case "Wolf-Zombie": return { hp: 95, damage: 26, xp: 3 };
            case "Lizard-Fiend": return { hp: 140, damage: 38, xp: 4 };
            case "Boar-Troll": return { hp: 190, damage: 52, xp: 5 };
            case "Gargoyle": return { hp: 260, damage: 68, xp: 6 };
            case "Boss": return { hp: 1000, damage: 100, xp: 50 };
            default: return { hp: 30, damage: 10, xp: 1 };
        }
    }

    getColorByType(type) {
        if (type.includes("Rat")) return "#A9A9A9";
        if (type.includes("Pig")) return "#FFC0CB";
        if (type.includes("Wolf")) return "#708090";
        if (type.includes("Lizard")) return "#32CD32";
        if (type.includes("Boar")) return "#d97706";
        if (type.includes("Gargoyle")) return "#94a3b8";
        if (type.includes("Boss")) return "#8B0000";
        return "#FF00FF";
    }

    applyKnockback(vx) {
        this.vx = vx;
        this.knockbackTimer = 0.16;
    }

    update(dt, player, forceChaseAll = false) {
        if (this.knockbackTimer > 0) {
            this.knockbackTimer -= dt;
            return;
        }

        const onMidPlatform = this.currentPlatform && !this.currentPlatform.isGround;

        if (player) {
            const distX = Math.abs(player.x - this.x);
            const distY = Math.abs(player.y - this.y);

            if (forceChaseAll) {
                if (distX > 8) {
                    this.direction = (player.x < this.x) ? -1 : 1;
                    // Sprint faster when off-screen so distant minions arrive quickly
                    const chaseMult = distX > 650 ? 3.4 : 1.95;
                    this.vx = (this.speed * chaseMult) * this.direction;
                } else {
                    this.vx = 0;
                }
                // Do not clamp to mid-platform edges when force-chasing so minions drop down to the player
                return;
            }

            if (distX < 440 && distY < 180 && distX > 10) {
                this.direction = (player.x < this.x) ? -1 : 1;
                this.vx = this.speed * this.direction;
            } else {
                // Idle patrol
                this.direction = this.patrolDir;
                this.vx = (this.speed * 0.55) * this.patrolDir;
            }
        }

        // Prevent enemies on mid-level platforms from blindly walking off the edge during normal patrol
        if (onMidPlatform) {
            const plat = this.currentPlatform;
            const minX = plat.x + 6;
            const maxX = plat.x + plat.w - this.width - 6;
            if (this.x <= minX && this.vx < 0) {
                this.x = minX;
                this.patrolDir = 1;
                this.direction = 1;
                this.vx = Math.abs(this.vx);
            } else if (this.x >= maxX && this.vx > 0) {
                this.x = maxX;
                this.patrolDir = -1;
                this.direction = -1;
                this.vx = -Math.abs(this.vx);
            }
        }
    }

    draw(ctx, camera) {
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;

        if (this.invulnerable) {
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 3;
            ctx.strokeRect(drawX - 5, drawY - 5, this.width + 10, this.height + 10);
        }

        if (this.img && this.img.complete && this.img.naturalWidth !== 0) {
            ctx.save();
            if (this.direction === -1) {
                ctx.translate(drawX + this.width, drawY);
                ctx.scale(-1, 1);
                ctx.drawImage(this.img, 0, 0, this.width, this.height);
            } else {
                ctx.drawImage(this.img, drawX, drawY, this.width, this.height);
            }
            ctx.restore();

            this.drawHealthBar(ctx, camera);
        } else {
            super.draw(ctx, camera);
        }
    }
}

class Boss extends Enemy {
    constructor(x, y, name, level = 1, bossSprite = 'Boss', auraColor = '#ef4444') {
        super(x, y, "Boss");
        this.name = name;
        this.level = level;
        this.bossSprite = bossSprite || 'Boss';
        this.auraColor = auraColor || '#ef4444';
        this.img = ASSETS[this.bossSprite] || ASSETS['Boss'];

        this.width = 96;
        this.height = 96;
        this.hp = 450 + (level * 110);
        this.maxHp = this.hp;
        this.damage = 22 + (level * 6);
        this.color = "#FF4500";

        // Active Boss Combat Timers
        this.jumpTimer = 2.6;
        this.chargeTimer = 4.0;
        this.chargeActive = 0;
        this.shootTimer = 3.2;
        this.pendingShot = false;
        this.animTime = 0;
    }

    update(dt, player) {
        this.animTime += dt;

        if (this.knockbackTimer > 0) {
            this.knockbackTimer -= dt;
            return;
        }

        if (this.invulnerable) {
            this.vx = 0;
            return;
        }

        if (player) {
            const dist = Math.abs(player.x - this.x);
            this.direction = (player.x < this.x) ? -1 : 1;

            // Charge burst mechanic
            if (this.chargeActive > 0) {
                this.chargeActive -= dt;
                this.vx = (this.speed * 1.65) * this.direction;
            } else {
                this.vx = (this.speed * 0.78) * this.direction;
                this.chargeTimer -= dt;
                if (this.chargeTimer <= 0 && dist < 560) {
                    this.chargeActive = 0.85;
                    this.chargeTimer = Math.max(2.2, 4.4 - this.level * 0.18);
                }
            }

            // Periodic Boss Jump Slam
            this.jumpTimer -= dt;
            if (this.jumpTimer <= 0 && this.grounded && dist < 520) {
                this.vy = -490;
                this.grounded = false;
                this.jumpTimer = Math.max(2.0, 3.6 - this.level * 0.12);
            }

            // Ranged Energy Bolt for Stage 4+ Bosses & Malgor
            if (this.level >= 4 && dist < 680) {
                this.shootTimer -= dt;
                if (this.shootTimer <= 0) {
                    this.pendingShot = true;
                    this.shootTimer = Math.max(1.8, 3.5 - this.level * 0.14);
                }
            }

            // Keep Boss in the boss arena territory (x: 4400 .. 5900)
            if (this.x < 4400 && this.vx < 0) {
                this.x = 4400;
                this.vx = 0;
            }
        }
    }

    draw(ctx, camera) {
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;
        const cx = drawX + this.width / 2;
        const cy = drawY + this.height / 2;

        ctx.save();
        // 1. Boss Elemental / Lord Aura
        const pulse = Math.sin(this.animTime * 5) * 6;
        const auraGrad = ctx.createRadialGradient(cx, cy, 18, cx, cy, 58 + pulse);
        auraGrad.addColorStop(0, this.invulnerable ? 'rgba(56, 189, 248, 0.45)' : `${this.auraColor}66`);
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 58 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // 2. If Wolf-Dragon (Stage 9), draw crimson dragon wings behind sprite
        if (this.name.includes('Dragon')) {
            ctx.fillStyle = '#be123c';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 10);
            ctx.lineTo(drawX - 28, drawY - 18);
            ctx.lineTo(drawX - 10, drawY + 35);
            ctx.moveTo(cx, cy - 10);
            ctx.lineTo(drawX + this.width + 28, drawY - 18);
            ctx.lineTo(drawX + this.width + 10, drawY + 35);
            ctx.fill();
        }
        ctx.restore();

        // 3. Draw Boss Sprite & Health bar
        super.draw(ctx, camera);

        // 4. Draw Golden Boss Crown on Monster Lords/Kings (Stages 1–9)
        if (this.bossSprite !== 'Boss') {
            ctx.save();
            const crownX = cx - 18;
            const crownY = drawY - 14;
            ctx.fillStyle = '#fbbf24';
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(crownX, crownY + 14);
            ctx.lineTo(crownX, crownY);
            ctx.lineTo(crownX + 9, crownY + 7);
            ctx.lineTo(crownX + 18, crownY - 3);
            ctx.lineTo(crownX + 27, crownY + 7);
            ctx.lineTo(crownX + 36, crownY);
            ctx.lineTo(crownX + 36, crownY + 14);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // 5. Boss Nameplate above crown/healthbar
        ctx.save();
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        const label = this.invulnerable ? `🛡 ${this.name} (Slay Minions First)` : `👑 ${this.name}`;
        const textW = ctx.measureText(label).width + 14;
        ctx.fillRect(cx - textW / 2, drawY - 38, textW, 20);
        ctx.fillStyle = this.invulnerable ? '#38bdf8' : '#fbbf24';
        ctx.fillText(label, cx, drawY - 24);
        ctx.restore();
    }
}

class Collectible extends Entity {
    constructor(x, y, type, value, isWorldPickup = false) {
        const isChest = type === 'chest';
        super(x, y, isChest ? 32 : 24, isChest ? 26 : 24, '#FFD700');
        this.type = type; // 'coin', 'potion', 'chest', 'powerup_atk', 'powerup_spd', 'powerup_def'
        this.isWorldPickup = isWorldPickup;
        this.noGravity = isWorldPickup;
        this.baseY = y;
        this.bobPhase = Math.random() * Math.PI * 2;

        if (!isWorldPickup) {
            this.vy = -(190 + Math.random() * 90);
            this.vx = (Math.random() - 0.5) * 160;
        } else {
            this.vx = 0;
            this.vy = 0;
        }

        if (type === 'potion') {
            this.color = '#ef4444';
            this.value = value || 50;
        } else if (type === 'chest') {
            this.color = '#f59e0b';
            this.value = value || 100;
        } else {
            this.value = value || 10;
        }
    }

    update(dt, player) {
        this.bobPhase += dt * 4;

        if (this.isWorldPickup) {
            this.y = this.baseY + Math.sin(this.bobPhase) * 5;
        } else if (this.grounded) {
            this.vx *= 0.86;
        }

        // Gentle magnet pull when hero is close
        if (player) {
            const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
            const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
            const dist = Math.hypot(dx, dy);
            const magnetRadius = this.magnetOverride ? 900 : 115;
            if (dist < magnetRadius && dist > 4) {
                const pullSpeed = this.magnetOverride ? 540 : 220;
                this.noGravity = true;
                this.x += (dx / dist) * pullSpeed * dt;
                this.y += (dy / dist) * pullSpeed * dt;
            }
        }
    }

    draw(ctx, camera) {
        const dx = this.x - camera.x;
        const dy = this.y - camera.y;
        const cx = dx + this.width / 2;
        const cy = dy + this.height / 2;

        ctx.save();
        if (this.type === 'coin') {
            // Spinning gold coin with inner shine
            const scaleX = Math.max(0.35, Math.abs(Math.cos(this.bobPhase * 0.9)));
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.ellipse(cx, cy, 10 * scaleX, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (this.type === 'chest') {
            // Treasure Chest
            ctx.fillStyle = '#92400e';
            ctx.fillRect(dx, dy + 4, this.width, this.height - 4);
            // Lid
            ctx.fillStyle = '#b45309';
            ctx.fillRect(dx, dy, this.width, 9);
            // Gold trim & lock
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(dx + 1, dy + 1, this.width - 2, this.height - 2);
            ctx.fillStyle = '#fde047';
            ctx.fillRect(cx - 4, dy + 7, 8, 9);
        } else if (this.type === 'potion') {
            // Glowing Health Potion
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(cx, cy + 2, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fca5a5';
            ctx.fillRect(cx - 3, dy + 1, 6, 5);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - 2, cy - 3, 4, 10);
            ctx.fillRect(cx - 5, cy, 10, 4);
        } else if (this.type.startsWith('powerup_')) {
            // Glowing Power-Up Orb (ATK / SPD / DEF)
            const isAtk = this.type === 'powerup_atk';
            const isSpd = this.type === 'powerup_spd';
            const orbColor = isAtk ? '#f97316' : isSpd ? '#38bdf8' : '#4ade80';
            const icon = isAtk ? '⚔' : isSpd ? '⚡' : '🛡';

            ctx.fillStyle = orbColor;
            ctx.beginPath();
            ctx.arc(cx, cy, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon, cx, cy + 1);
        }
        ctx.restore();
    }
}
