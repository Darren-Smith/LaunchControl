// Cat Fighters - Attack Definitions & Projectile System
// Implements the 6 attacks: Poo Attack, Hairball Attack (5s root), Scratch, Litter Throw, Poop Grenade (10s poison), Scramble Attack (leap spin + knockback)

const ATTACK_CONFIGS = {
  pooAttack: {
    id: 1,
    name: 'Poo Attack',
    damage: 14,
    cooldown: 0.65, // seconds
    startup: 0.18,  // time to turn around & lift tail before projectile spawns
    duration: 0.38,
    type: 'projectile',
    description: 'Turn around, hoist tail, and fire a high-speed poop projectile!'
  },
  hairball: {
    id: 2,
    name: 'Hairball Attack',
    damage: 10,
    stuckDuration: 5.0, // sticks enemy in place for 5 secs
    cooldown: 1.2,
    startup: 0.22,      // hacking cough windup
    duration: 0.42,
    type: 'projectile',
    description: 'Hacks up a sticky gooey hairball that roots the enemy in place for 5 seconds!'
  },
  scratch: {
    id: 3,
    name: 'Furious Scratch',
    damage: 11,
    hits: 2,
    cooldown: 0.42,
    startup: 0.08,
    duration: 0.28,
    hitbox: { width: 55, height: 48, offsetX: 35, offsetY: -20 },
    knockback: 4.5,
    type: 'melee',
    description: 'Rapid multi-claw slashes with razor-sharp damage.'
  },
  litterThrow: {
    id: 4,
    name: 'Litter Throw',
    damage: 8, // per pellet
    pelletCount: 5,
    cooldown: 0.8,
    startup: 0.15,
    duration: 0.35,
    type: 'projectile',
    description: 'Scoops and flings a shotgun spread of clumping litter granules.'
  },
  poopGrenade: {
    id: 5,
    name: 'Poop Grenade',
    damage: 22,
    poisonDuration: 10.0, // 10 secs poison
    poisonDps: 5,         // 5 points/sec
    aoeRadius: 85,
    cooldown: 1.5,
    startup: 0.2,
    duration: 0.4,
    type: 'projectile',
    description: 'Lobs an explosive stink-bomb that detonates into a toxic cloud dealing damage and 10s poison (5 DPS)!'
  },
  scramble: {
    id: 6,
    name: 'Scramble Attack',
    damage: 18,
    cooldown: 1.2,
    startup: 0.08,
    duration: 0.52,
    hitbox: { width: 75, height: 60, offsetX: 30, offsetY: -15 },
    leapSpeedX: 11.5,
    leapSpeedY: -6.5,
    knockback: 10.5, // strong knockback
    type: 'scramble_dash',
    description: 'Jumps and spins violently towards the enemy, dealing heavy knockback on hit!'
  }
};

class PooProjectile {
  constructor(x, y, vx, owner) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = -0.5;
    this.owner = owner;
    this.radius = 16;
    this.damage = ATTACK_CONFIGS.pooAttack.damage;
    this.rotation = 0;
    this.rotSpeed = vx > 0 ? 0.25 : -0.25;
    this.alive = true;
    this.lifespan = 2.0;
  }

  update(dt, arenaWidth, arenaFloorY) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.rotation += this.rotSpeed;
    this.lifespan -= dt;

    if (this.lifespan <= 0 || this.x < -60 || this.x > arenaWidth + 60 || this.y >= arenaFloorY) {
      this.explode();
    }
  }

  explode() {
    this.alive = false;
    window.particles.createPooSplat(this.x, this.y, 8);
    window.particles.createStinkCloud(this.x, this.y, 25);
    window.audio.playSplat();
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Speed streaks
    ctx.strokeStyle = 'rgba(121, 85, 72, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const dir = this.vx > 0 ? -1 : 1;
    ctx.moveTo(dir * 14, -5);
    ctx.lineTo(dir * 32, -5);
    ctx.moveTo(dir * 12, 5);
    ctx.lineTo(dir * 28, 5);
    ctx.stroke();

    // Poop swirl
    ctx.fillStyle = '#795548';
    ctx.strokeStyle = '#4e342e';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.ellipse(0, 4, 15, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, -2, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-6, -7);
    ctx.quadraticCurveTo(0, -16, 6, -14);
    ctx.quadraticCurveTo(0, -8, -2, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

class HairballProjectile {
  constructor(x, y, vx, owner) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = -1.8; // slight arch
    this.owner = owner;
    this.radius = 16;
    this.damage = ATTACK_CONFIGS.hairball.damage;
    this.stuckDuration = ATTACK_CONFIGS.hairball.stuckDuration;
    this.rotation = 0;
    this.rotSpeed = vx > 0 ? 0.35 : -0.35;
    this.alive = true;
    this.lifespan = 2.2;
  }

  update(dt, arenaWidth, arenaFloorY) {
    this.vy += 0.18; // gravity
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.rotation += this.rotSpeed;
    this.lifespan -= dt;

    if (this.lifespan <= 0 || this.x < -60 || this.x > arenaWidth + 60 || this.y >= arenaFloorY) {
      this.explode();
    }
  }

  explode() {
    this.alive = false;
    window.particles.createPooSplat(this.x, this.y, 6);
    window.particles.createHitSparks(this.x, this.y, '#7cb342', 8);
    window.audio.playHairballSplat();
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Slimy gooey drool trail
    ctx.strokeStyle = 'rgba(124, 179, 66, 0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    const dir = this.vx > 0 ? -1 : 1;
    ctx.moveTo(dir * 14, 0);
    ctx.quadraticCurveTo(dir * 25, 4, dir * 34, 0);
    ctx.stroke();

    // Hairball body (textured brownish-gray fur clump with green slime)
    ctx.fillStyle = '#616161';
    ctx.strokeStyle = '#33691e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Green slime specks
    ctx.fillStyle = '#7cb342';
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const r = 8;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stray fur hair spikes
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 14, Math.sin(angle) * 14);
      ctx.lineTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
      ctx.stroke();
    }

    ctx.restore();
  }
}

class LitterPellet {
  constructor(x, y, vx, vy, owner) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.owner = owner;
    this.radius = 7;
    this.damage = ATTACK_CONFIGS.litterThrow.damage;
    this.alive = true;
    this.gravity = 0.32;
    this.lifespan = 1.4;
  }

  update(dt, arenaWidth, arenaFloorY) {
    this.vy += this.gravity;
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.lifespan -= dt;

    if (this.y >= arenaFloorY) {
      this.alive = false;
      window.particles.createDustPuff(this.x, arenaFloorY, 2);
    }
    if (this.lifespan <= 0 || this.x < -40 || this.x > arenaWidth + 40) {
      this.alive = false;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = '#b0bec5';
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

class PoopGrenade {
  constructor(x, y, vx, vy, owner) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.owner = owner;
    this.radius = 18;
    this.damage = ATTACK_CONFIGS.poopGrenade.damage;
    this.poisonDuration = ATTACK_CONFIGS.poopGrenade.poisonDuration;
    this.poisonDps = ATTACK_CONFIGS.poopGrenade.poisonDps;
    this.aoeRadius = ATTACK_CONFIGS.poopGrenade.aoeRadius;
    this.rotation = 0;
    this.alive = true;
    this.bounces = 0;
    this.maxBounces = 2;
    this.timer = 1.35;
    this.fuseSoundTick = 0;
  }

  update(dt, arenaWidth, arenaFloorY) {
    this.vy += 0.38;
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.rotation += this.vx * 0.05;
    this.timer -= dt;

    this.fuseSoundTick += dt;
    if (this.fuseSoundTick > 0.18) {
      this.fuseSoundTick = 0;
      window.audio.playFuse();
      window.particles.createHitSparks(this.x, this.y - 14, '#ff9800', 3);
    }

    if (this.y >= arenaFloorY - this.radius) {
      this.y = arenaFloorY - this.radius;
      this.bounces++;
      if (this.bounces > this.maxBounces || this.timer <= 0.2) {
        this.detonate();
        return;
      }
      this.vy = -this.vy * 0.55;
      this.vx *= 0.7;
      window.audio.playSplat();
      window.particles.createDustPuff(this.x, arenaFloorY, 3);
    }

    if (this.x < this.radius || this.x > arenaWidth - this.radius) {
      this.vx = -this.vx * 0.7;
      this.x = Math.max(this.radius, Math.min(arenaWidth - this.radius, this.x));
    }

    if (this.timer <= 0) {
      this.detonate();
    }
  }

  detonate() {
    if (!this.alive) return;
    this.alive = false;
    window.audio.playExplosion();
    window.particles.triggerShake(14);
    window.particles.createHitSparks(this.x, this.y, '#ff5722', 24);
    window.particles.createStinkCloud(this.x, this.y, this.aoeRadius);
    window.particles.createPooSplat(this.x, this.y, 18);
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const pulse = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;

    ctx.fillStyle = '#4e342e';
    ctx.strokeStyle = '#271c19';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(0, 2, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -this.radius + 3);
    ctx.lineTo(0, this.radius);
    ctx.moveTo(-this.radius + 3, 2);
    ctx.lineTo(this.radius - 3, 2);
    ctx.stroke();

    ctx.fillStyle = '#78909c';
    ctx.fillRect(-4, -this.radius - 4, 8, 5);

    ctx.strokeStyle = '#ffeb3b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -this.radius - 4);
    ctx.quadraticCurveTo(6, -this.radius - 10, 4, -this.radius - 14);
    ctx.stroke();

    ctx.fillStyle = pulse > 0.5 ? '#ff1744' : '#ff9800';
    ctx.beginPath();
    ctx.arc(4, -this.radius - 14, 3 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// Global projectile pool
class ProjectileManager {
  constructor() {
    this.projectiles = [];
  }

  addPoo(x, y, vx, owner) {
    this.projectiles.push(new PooProjectile(x, y, vx, owner));
    window.audio.playPooLaunch();
  }

  addHairball(x, y, vx, owner) {
    this.projectiles.push(new HairballProjectile(x, y, vx, owner));
    window.audio.playHairballCough();
  }

  addLitter(x, y, facing, owner) {
    const count = ATTACK_CONFIGS.litterThrow.pelletCount;
    for (let i = 0; i < count; i++) {
      const spreadY = -2.5 - Math.random() * 3.5;
      const speedX = (7.0 + Math.random() * 5.0) * facing;
      this.projectiles.push(new LitterPellet(x, y, speedX, spreadY, owner));
    }
    window.audio.playLitterThrow();
  }

  addPoopGrenade(x, y, facing, owner) {
    const vx = 7.5 * facing;
    const vy = -9.0;
    this.projectiles.push(new PoopGrenade(x, y, vx, vy, owner));
    window.audio.playJump();
  }

  clear() {
    this.projectiles = [];
  }

  update(dt, arenaWidth, arenaFloorY, p1, p2) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(dt, arenaWidth, arenaFloorY);

      if (!proj.alive) {
        // If grenade detonated, apply blast damage AND 10s poison debuff!
        if (proj instanceof PoopGrenade) {
          [p1, p2].forEach(target => {
            if (target && target.isAlive && !target.isDead) {
              const dx = (target.x) - proj.x;
              const dy = (target.y - target.height / 2) - proj.y;
              const dist = Math.hypot(dx, dy);
              if (dist <= proj.aoeRadius) {
                const isOwner = target === proj.owner;
                const dmg = isOwner ? Math.floor(proj.damage * 0.4) : proj.damage;
                target.takeDamage(dmg, Math.sign(dx) || 1, 6.5, 'Poop Grenade!');
                // Apply 10s poison (5 points/sec)!
                target.applyPoison(proj.poisonDuration, proj.poisonDps);
              }
            }
          });
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check direct collision with opponents
      const opponent = proj.owner === p1 ? p2 : p1;
      if (opponent && opponent.isAlive && !opponent.isDead) {
        const hit = opponent.checkProjectileHit(proj);
        if (hit) {
          if (proj instanceof PoopGrenade) {
            proj.detonate();
          } else {
            proj.alive = false;
            if (proj instanceof PooProjectile) {
              proj.explode();
              opponent.takeDamage(proj.damage, Math.sign(proj.vx), 5.0, 'POO SPLAT!');
            } else if (proj instanceof HairballProjectile) {
              proj.explode();
              opponent.takeDamage(proj.damage, Math.sign(proj.vx), 2.0, 'HAIRBALL!');
              opponent.applyStuck(proj.stuckDuration); // 5 seconds root!
            } else if (proj instanceof LitterPellet) {
              window.audio.playHit();
              window.particles.createHitSparks(proj.x, proj.y, '#b0bec5', 5);
              opponent.takeDamage(proj.damage, Math.sign(proj.vx), 2.0, 'Litter Hit!');
            }
          }
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  render(ctx) {
    for (const proj of this.projectiles) {
      proj.render(ctx);
    }
  }
}

window.projectiles = new ProjectileManager();
