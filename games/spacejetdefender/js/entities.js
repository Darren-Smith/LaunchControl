// ============================================================================
// SPACEJET DEFENDER - Player, Weapons, Power-ups, Enemies, Objectives & Bosses
// ============================================================================

class PlayerJet {
  constructor() {
    this.resetForLevel(true);
    this.lives = 3;
    this.weaponTier = 1; // 1 = Pulse Laser, 2 = Heavy Plasma (L4), 3 = Tri-Spread + Seekers (L6)
  }

  resetForLevel(fullReset = false) {
    this.worldX = 180;
    this.screenX = 180;
    this.y = 360;
    this.vx = 0;
    this.vy = 0;
    this.width = 54;
    this.height = 26;
    this.speed = 390;

    this.fireTimer = 0;
    this.missileTimer = 0;
    this.invulnTimer = 2.0;
    this.tilt = 0;

    // Power-ups
    if (fullReset) {
      this.lives = 3;
      this.weaponTier = 1;
      this.shieldHp = 1; // Start Cadet training with 1 light shield charge
      this.doubleShotTimer = 0;
    } else {
      // Keep earned shield or grant 1 fresh shield charge at level start
      this.shieldHp = Math.max(this.shieldHp || 0, 1);
    }

    this.overdriveCharge = 100; // 0..100 special pulse meter
  }

  update(dt, input, game) {
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.doubleShotTimer > 0) this.doubleShotTimer -= dt;
    if (this.overdriveCharge < 100) {
      this.overdriveCharge = Math.min(100, this.overdriveCharge + dt * 9);
    }

    // Screen-space horizontal & vertical movement within 1280x720 viewport
    const targetVx = input.moveX * this.speed;
    const targetVy = input.moveY * this.speed;

    this.vx += (targetVx - this.vx) * Math.min(1, dt * 14);
    this.vy += (targetVy - this.vy) * Math.min(1, dt * 14);

    const maxCamX = window.GAME_CONSTANTS.LEVEL_LENGTH - 1280;
    const bossAlive = !!(game.activeBoss && !game.activeBoss.dead);

    // When the camera stops at the end of the 8th screen and no boss is blocking,
    // keep the Spacejet cruising forward toward the Sector Exit Gate!
    const endCruiseVx = (game.cameraX >= maxCamX && !bossAlive) ? game.scrollSpeed : 0;

    this.screenX += (this.vx + endCruiseVx) * dt;
    this.y += this.vy * dt;

    // Clamp inside viewport: allow full horizontal flight to the exit gate (or up to boss arena boundary)
    const maxScreenX = bossAlive ? 840 : 1220;
    this.screenX = Math.max(70, Math.min(maxScreenX, this.screenX));
    this.y = Math.max(88, Math.min(640, this.y));

    this.worldX = game.cameraX + this.screenX;
    this.tilt = (this.vy / this.speed) * 0.45;

    // Thruster trail particles
    if (Math.random() < 0.85) {
      game.spawnParticle(
        this.worldX - 28,
        this.y + (Math.random() - 0.5) * 6,
        -180 - Math.random() * 120,
        (Math.random() - 0.5) * 40,
        this.doubleShotTimer > 0 ? '#ff00ff' : '#00f3ff',
        0.22 + Math.random() * 0.15,
        2.5
      );
    }

    // Firing Primary Weapons
    if (this.fireTimer > 0) this.fireTimer -= dt;
    if (this.missileTimer > 0) this.missileTimer -= dt;

    if (input.fireHeld && this.fireTimer <= 0) {
      this.fireWeapon(game);
    }

    // Secondary Special Pulse (Overdrive Shockwave clears nearby enemy bullets & damages enemies)
    if (input.specialJustPressed && this.overdriveCharge >= 100) {
      this.triggerOverdrive(game);
    }
  }

  fireWeapon(game) {
    const hasDouble = this.doubleShotTimer > 0;
    const tier = this.weaponTier;

    // Base cooldown
    this.fireTimer = tier >= 2 ? 0.12 : 0.14;
    window.audio.sfxShoot(tier);

    const muzzleX = this.worldX + 28;
    const muzzleY = this.y;

    if (tier === 1) {
      // Standard Neon Cyan Laser (Double if Double-Shot active)
      if (hasDouble) {
        game.playerBullets.push(new Bullet(muzzleX, muzzleY - 9, 920, -25, '#00ffff', 1, 'laser'));
        game.playerBullets.push(new Bullet(muzzleX, muzzleY + 9, 920, 25, '#00ffff', 1, 'laser'));
        game.playerBullets.push(new Bullet(muzzleX + 4, muzzleY, 960, 0, '#ff44ff', 1, 'laser'));
      } else {
        game.playerBullets.push(new Bullet(muzzleX, muzzleY - 4, 920, 0, '#00f3ff', 1, 'laser'));
        game.playerBullets.push(new Bullet(muzzleX, muzzleY + 4, 920, 0, '#00f3ff', 1, 'laser'));
      }
    } else if (tier === 2) {
      // Level 4 Power Station Upgrade: Heavy Twin Plasma Blasters
      if (hasDouble) {
        game.playerBullets.push(new Bullet(muzzleX, muzzleY - 11, 980, -45, '#ffaa00', 2, 'plasma'));
        game.playerBullets.push(new Bullet(muzzleX + 6, muzzleY - 4, 1000, 0, '#00ffff', 2, 'plasma'));
        game.playerBullets.push(new Bullet(muzzleX + 6, muzzleY + 4, 1000, 0, '#00ffff', 2, 'plasma'));
        game.playerBullets.push(new Bullet(muzzleX, muzzleY + 11, 980, 45, '#ffaa00', 2, 'plasma'));
      } else {
        game.playerBullets.push(new Bullet(muzzleX, muzzleY - 7, 980, 0, '#ffaa00', 2, 'plasma'));
        game.playerBullets.push(new Bullet(muzzleX, muzzleY + 7, 980, 0, '#ffaa00', 2, 'plasma'));
      }
    } else {
      // Level 6 Alien Factory Upgrade: Tri-Spread + Homing Seeker Missiles
      game.playerBullets.push(new Bullet(muzzleX + 6, muzzleY, 1040, 0, '#ffee00', 2.5, 'plasma'));
      game.playerBullets.push(new Bullet(muzzleX, muzzleY - 8, 1000, -95, '#ff5522', 2, 'plasma'));
      game.playerBullets.push(new Bullet(muzzleX, muzzleY + 8, 1000, 95, '#ff5522', 2, 'plasma'));

      if (hasDouble) {
        game.playerBullets.push(new Bullet(muzzleX, muzzleY - 14, 980, -180, '#ff00ff', 2, 'plasma'));
        game.playerBullets.push(new Bullet(muzzleX, muzzleY + 14, 980, 180, '#ff00ff', 2, 'plasma'));
      }

      if (this.missileTimer <= 0) {
        this.missileTimer = 0.42;
        window.audio.sfxMissile();
        game.playerBullets.push(new Bullet(muzzleX - 4, muzzleY - 14, 620, -140, '#00ff88', 3, 'seeker'));
        game.playerBullets.push(new Bullet(muzzleX - 4, muzzleY + 14, 620, 140, '#00ff88', 3, 'seeker'));
      }
    }
  }

  triggerOverdrive(game) {
    this.overdriveCharge = 0;
    window.audio.sfxExplode('large');
    window.input.rumble(220, 0.6, 0.9);
    game.screenShake = 14;
    game.overdriveRing = { x: this.worldX, y: this.y, radius: 20, maxRadius: 700, alpha: 1.0 };

    // Clear all enemy projectiles on screen
    game.enemyBullets.length = 0;

    // Damage all visible enemies
    for (const enemy of game.enemies) {
      if (Math.abs(enemy.x - this.worldX) < 760) {
        enemy.takeDamage(12, game);
      }
    }
    if (game.activeBoss && !game.activeBoss.dead) {
      game.activeBoss.takeDamage(18, game);
    }
    game.addFloatingText(this.worldX, this.y - 35, 'EMP OVERDRIVE!', '#00ffff');
  }

  takeHit(game) {
    if (this.invulnTimer > 0) return;

    if (this.shieldHp > 0) {
      this.shieldHp--;
      this.invulnTimer = 1.4;
      window.audio.sfxExplode('small');
      window.input.rumble(140, 0.4, 0.5);
      game.screenShake = 8;
      game.spawnExplosion(this.worldX, this.y, '#00f3ff', 18);
      game.addFloatingText(this.worldX, this.y - 28, 'SHIELD ABSORBED!', '#00f3ff');
      return;
    }

    // Hull hit
    this.lives--;
    game.tookHullDamageThisLevel = true;
    this.invulnTimer = 2.6;
    this.doubleShotTimer = Math.max(0, this.doubleShotTimer - 5);
    window.audio.sfxExplode('large');
    window.input.rumble(320, 0.8, 1.0);
    game.screenShake = 18;
    game.spawnExplosion(this.worldX, this.y, '#ff2255', 38);

    if (this.lives <= 0) {
      game.triggerGameOver();
    } else {
      this.shieldHp = 1; // Emergency backup shield on respawn
      game.addFloatingText(this.worldX, this.y - 30, 'HULL BREACH! -1 LIFE', '#ff3355');
    }
  }
}

class Bullet {
  constructor(x, y, vx, vy, color, damage = 1, kind = 'laser', isEnemy = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.damage = damage;
    this.kind = kind; // 'laser', 'plasma', 'seeker', 'enemy_orb', 'enemy_beam', 'lightning', 'boss_missile'
    this.isEnemy = isEnemy;
    this.radius = isEnemy ? (kind === 'boss_missile' ? 8 : 6) : (kind === 'plasma' ? 7 : 5);
    this.dead = false;
    this.age = 0;
  }

  update(dt, game) {
    this.age += dt;

    // Homing seeker logic for Level 6+ player missiles
    if (this.kind === 'seeker' && !this.isEnemy) {
      let bestTarget = null;
      let bestDist = 650;
      for (const e of game.enemies) {
        if (e.dead || e.isFriendly || e.x < this.x - 60) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d < bestDist) {
          bestDist = d;
          bestTarget = e;
        }
      }
      if (!bestTarget && game.activeBoss && !game.activeBoss.dead) {
        bestTarget = game.activeBoss;
      }
      if (bestTarget) {
        const desiredAngle = Math.atan2(bestTarget.y - this.y, bestTarget.x - this.x);
        const speed = 760;
        this.vx += (Math.cos(desiredAngle) * speed - this.vx) * Math.min(1, dt * 8);
        this.vy += (Math.sin(desiredAngle) * speed - this.vy) * Math.min(1, dt * 8);
      }
      if (Math.random() < 0.6) {
        game.spawnParticle(this.x - 6, this.y, -80, 0, '#00ff88', 0.16, 2);
      }
    } else if (this.kind === 'boss_missile' && this.isEnemy) {
      // Hard Mode Boss Homing Missiles track the player Spacejet
      if (this.age < 2.6 && game.player) {
        const desiredAngle = Math.atan2(game.player.y - this.y, game.player.worldX - this.x);
        const curAngle = Math.atan2(this.vy, this.vx);
        const angleDiff = Math.atan2(Math.sin(desiredAngle - curAngle), Math.cos(desiredAngle - curAngle));
        const maxTurn = 2.35 * dt;
        const nextAngle = curAngle + Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
        const speed = Math.hypot(this.vx, this.vy) || 355;
        this.vx = Math.cos(nextAngle) * speed;
        this.vy = Math.sin(nextAngle) * speed;
      }
      if (Math.random() < 0.75) {
        const tailAngle = Math.atan2(this.vy, this.vx);
        game.spawnParticle(
          this.x - Math.cos(tailAngle) * 10,
          this.y - Math.sin(tailAngle) * 10,
          -this.vx * 0.25 + (Math.random() - 0.5) * 40,
          -this.vy * 0.25 + (Math.random() - 0.5) * 40,
          Math.random() < 0.5 ? '#ff5522' : '#ffee00',
          0.22,
          2.2
        );
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (
      this.x < game.cameraX - 120 ||
      this.x > game.cameraX + 1400 ||
      this.y < 40 ||
      this.y > 700 ||
      this.age > 3.8
    ) {
      this.dead = true;
    }
  }
}

class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.type = type; // 'shield', 'double_shot', 'extra_life'
    this.radius = 18;
    this.age = 0;
    this.dead = false;
  }

  update(dt, game) {
    this.age += dt;
    this.y = this.baseY + Math.sin(this.age * 4) * 10;

    // Gentle magnet pull when player is close
    const dx = game.player.worldX - this.x;
    const dy = game.player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 170) {
      this.x += (dx / dist) * 210 * dt;
      this.baseY += (dy / dist) * 210 * dt;
    }

    if (dist < this.radius + 26) {
      this.collect(game);
    }

    if (this.x < game.cameraX - 150) {
      this.dead = true;
    }
  }

  collect(game) {
    this.dead = true;
    game.score += 250;

    if (this.type === 'shield') {
      if ((game.player.shieldHp || 0) < 5) {
        game.player.shieldHp = Math.min(5, (game.player.shieldHp || 0) + 1);
        window.audio.sfxPowerup('shield');
        game.addFloatingText(this.x, this.y - 20, `SHIELD +1! (${game.player.shieldHp}/5)`, '#00f3ff');
      } else {
        game.score += 500;
        window.audio.sfxPowerup('shield');
        game.addFloatingText(this.x, this.y - 20, 'MAX 5 SHIELDS! +500 PTS', '#00f3ff');
      }
    } else if (this.type === 'double_shot') {
      game.player.doubleShotTimer = 16.0;
      window.audio.sfxPowerup('shield');
      game.addFloatingText(this.x, this.y - 20, 'DOUBLE SHOT!', '#ff44ff');
    } else if (this.type === 'extra_life') {
      if (game.player.lives < 3) {
        game.player.lives = Math.min(3, game.player.lives + 1);
        window.audio.sfxPowerup('life');
        game.addFloatingText(this.x, this.y - 20, 'EXTRA LIFE! 1-UP', '#00ff88');
      } else {
        game.score += 750;
        game.player.shieldHp = Math.min(5, (game.player.shieldHp || 0) + 1);
        window.audio.sfxPowerup('life');
        game.addFloatingText(this.x, this.y - 20, 'MAX 3 LIVES! +SHIELD & 750', '#00ff88');
      }
    }
    game.spawnExplosion(this.x, this.y, '#ffffff', 12);
  }
}

class Enemy {
  constructor(x, y, type, extra = {}) {
    this.x = x;
    this.y = y;
    this.startY = y;
    this.type = type;
    this.extra = extra;
    this.age = Math.random() * 6;
    this.dead = false;
    this.hitFlash = 0;
    this.isFriendly = false;
    this.ConfigureByType();
  }

  ConfigureByType() {
    switch (this.type) {
      case 'target_drone': // Level 1 Flight school easy targets
        this.hp = 1;
        this.maxHp = 1;
        this.radius = 20;
        this.score = 100;
        this.color = '#00f3ff';
        this.vx = -30;
        this.canShoot = false;
        break;

      case 'holo_ring': // Level 1 Flight school fly-through or shoot ring
        this.hp = 1;
        this.maxHp = 1;
        this.radius = 28;
        this.score = 150;
        this.color = '#00ff99';
        this.vx = 0;
        this.canShoot = false;
        break;

      case 'scout_fighter': // Level 1 late invasion & general light fighter
        this.hp = 2;
        this.maxHp = 2;
        this.radius = 20;
        this.score = 200;
        this.color = '#ff2266';
        this.vx = -110;
        this.canShoot = true;
        this.fireRate = 2.2;
        break;

      case 'patrol_ship': // Level 2 Patrol ships
        this.hp = 3;
        this.maxHp = 3;
        this.radius = 22;
        this.score = 250;
        this.color = '#ff3377';
        this.vx = -135;
        this.canShoot = true;
        this.fireRate = 1.9;
        break;

      case 'escaping_patrol': // Level 2 Special Patrol Runner ("One gets away!")
        this.hp = 9999; // Invulnerable armored warp courier that escapes!
        this.maxHp = 9999;
        this.radius = 26;
        this.score = 500;
        this.color = '#ffaa00';
        this.vx = 360; // Accelerates to the right and warps away!
        this.canShoot = true;
        this.fireRate = 0.8;
        this.escapedMessageShown = false;
        break;

      case 'radar_jammer': // Level 3 Jammer towers
        this.hp = 6;
        this.maxHp = 6;
        this.radius = 28;
        this.score = 400;
        this.color = '#cc33ff';
        this.vx = 0;
        this.canShoot = true;
        this.fireRate = 1.7;
        break;

      case 'radar_core': // Level 3 Primary Radar Dish Lock ("Hello, Minimap!")
        this.hp = 12;
        this.maxHp = 12;
        this.radius = 40;
        this.score = 1500;
        this.color = '#00ff66';
        this.vx = 0;
        this.canShoot = true;
        this.fireRate = 1.3;
        break;

      case 'power_conduit': // Level 4 Siphon drones / nodes
        this.hp = 5;
        this.maxHp = 5;
        this.radius = 24;
        this.score = 350;
        this.color = '#ffaa00';
        this.vx = -70;
        this.canShoot = true;
        this.fireRate = 1.6;
        break;

      case 'bio_pod': // Level 5 Research Lab specimen vat
        this.hp = 7;
        this.maxHp = 7;
        this.radius = 26;
        this.score = 400;
        this.color = '#00ffcc';
        this.vx = 0;
        this.canShoot = true;
        this.fireRate = 1.8;
        break;

      case 'phase_drone': // Level 5 teleporting/sine lab drone
        this.hp = 4;
        this.maxHp = 4;
        this.radius = 20;
        this.score = 320;
        this.color = '#cc44ff';
        this.vx = -150;
        this.canShoot = true;
        this.fireRate = 1.5;
        break;

      case 'factory_turret': // Level 6 War Factory turret
        this.hp = 8;
        this.maxHp = 8;
        this.radius = 26;
        this.score = 450;
        this.color = '#ff5522';
        this.vx = 0;
        this.canShoot = true;
        this.fireRate = 1.4;
        break;

      case 'human_shuttle': // Level 7 Grounded evacuation shuttle waiting to launch!
        this.hp = 100;
        this.maxHp = 100;
        this.radius = 34;
        this.score = 800;
        this.color = '#00ddff';
        this.vx = 0;
        this.vy = 0;
        this.canShoot = false;
        this.isFriendly = true;
        this.launched = false;
        break;

      case 'prison_cage': // Level 8 Detention cage holding captive humans
        this.hp = 6;
        this.maxHp = 6;
        this.radius = 30;
        this.score = 500;
        this.color = '#ff33aa';
        this.vx = 0;
        this.canShoot = false;
        break;

      case 'rescued_human': // Level 8 Escaping prisoner to scoop up
        this.hp = 10;
        this.maxHp = 10;
        this.radius = 16;
        this.score = 600;
        this.color = '#00ffaa';
        this.vx = -20;
        this.vy = -55;
        this.canShoot = false;
        this.isFriendly = true;
        break;

      case 'tesla_coil': // Level 9 Giant Army Base Tesla Coil
        this.hp = 12;
        this.maxHp = 12;
        this.radius = 34;
        this.score = 750;
        this.color = '#ffee00';
        this.vx = 0;
        this.canShoot = true;
        this.fireRate = 1.6;
        this.zapTimer = 1.2;
        break;

      case 'royal_guard': // Level 10 Elite UFO Palace defender
        this.hp = 9;
        this.maxHp = 9;
        this.radius = 24;
        this.score = 600;
        this.color = '#ffcc00';
        this.vx = -165;
        this.canShoot = true;
        this.fireRate = 1.15;
        break;

      default:
        this.hp = 3;
        this.maxHp = 3;
        this.radius = 20;
        this.score = 200;
        this.color = '#ff3366';
        this.vx = -100;
        this.canShoot = true;
        this.fireRate = 2.0;
        break;
    }

    const diffScale = (window.game && window.game.getDifficultyMultiplier)
      ? window.game.getDifficultyMultiplier()
      : 1.0;
    const hardHpMul = (window.game && window.game.difficultyMode === 'HARD') ? 2.0 : 1.0;

    if (!this.isFriendly && this.type !== 'escaping_patrol') {
      const scaledHp = this.hp > 1 ? Math.round(this.hp * diffScale) : this.hp;
      this.hp = Math.round(scaledHp * hardHpMul);
      this.maxHp = this.hp;
    }
    if (!this.isFriendly && this.type !== 'escaping_patrol' && this.vx !== 0) {
      this.vx *= (1 + (diffScale - 1) * 0.45);
    }
    if (this.fireRate) {
      this.fireRate = this.fireRate / diffScale;
    }

    this.fireTimer = 0.55 + Math.random() * (this.fireRate || 1.5);
  }

  update(dt, game) {
    this.age += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // Only activate movement & firing once near or inside the camera view
    const distFromCamLeft = this.x - game.cameraX;
    if (distFromCamLeft > 1420) return;

    const diffScale = game.getDifficultyMultiplier ? game.getDifficultyMultiplier() : 1.0;

    if (this.type === 'target_drone') {
      this.x += this.vx * dt;
      this.y = this.startY + Math.sin(this.age * 2.5) * 35;
    } else if (this.type === 'scout_fighter' || this.type === 'patrol_ship') {
      this.x += this.vx * dt;
      this.y = this.startY + Math.sin(this.age * 3.8) * 65;
    } else if (this.type === 'escaping_patrol') {
      // Speeds across the screen and warps out at the right edge!
      this.vx += 420 * dt;
      this.x += this.vx * dt;
      this.y = this.startY + Math.sin(this.age * 6) * 40;
      game.spawnParticle(this.x - 26, this.y, -260, (Math.random() - 0.5) * 60, '#ff3377', 0.35, 3.5);

      if (!this.escapedMessageShown && this.x > game.cameraX + 1150) {
        this.escapedMessageShown = true;
        game.showRadioTransmission('SCOUT REPORT', 'Drat! That Crimson Patrol Ship hit hyper-warp and got away!');
        game.addFloatingText(game.cameraX + 980, this.y, 'PATROL SHIP ESCAPED TO WARP!', '#ffaa00');
        window.audio.sfxMissile();
        this.dead = true;
      }
    } else if (this.type === 'phase_drone') {
      this.x += this.vx * dt;
      this.y = this.startY + Math.cos(this.age * 5.2) * 85;
    } else if (this.type === 'royal_guard') {
      this.x += this.vx * dt;
      this.y = this.startY + Math.sin(this.age * 4.5) * 90;
    } else if (this.type === 'human_shuttle') {
      // Launch into orbit when player reaches proximity or clears nearby guards!
      if (!this.launched && this.x - game.player.worldX < 340) {
        this.launched = true;
        game.shuttlesLaunched++;
        game.score += this.score;
        window.audio.sfxRescue();
        game.addFloatingText(this.x, this.y - 35, `SHUTTLE LAUNCHED! +${this.score}`, '#00ddff');
      }
      if (this.launched) {
        this.vx += 180 * dt;
        this.vy -= 210 * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        game.spawnParticle(this.x - 24, this.y + 10, -140, 90, '#00ddff', 0.3, 3);
        if (this.y < -60) this.dead = true;
      }
    } else if (this.type === 'rescued_human') {
      // Drift toward the player's Spacejet to be rescued
      const dx = game.player.worldX - this.x;
      const dy = game.player.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 360) {
        this.x += (dx / d) * 230 * dt;
        this.y += (dy / d) * 230 * dt;
      } else {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y < 120) this.vy = 20;
      }

      if (d < 44) {
        this.dead = true;
        game.humansRescued++;
        game.score += this.score;
        window.audio.sfxRescue();
        game.addFloatingText(this.x, this.y - 20, `CITIZEN RESCUED! +${this.score}`, '#00ffaa');
      }
    } else if (this.type === 'tesla_coil') {
      this.zapTimer -= dt;
      if (this.zapTimer <= 0 && distFromCamLeft > 60 && distFromCamLeft < 1180) {
        this.zapTimer = 2.1 / diffScale;
        window.audio.sfxTeslaZap();
        const boltSpeed = 390 * (1 + (diffScale - 1) * 0.65);
        const angle = Math.atan2(game.player.y - this.y, game.player.worldX - this.x);
        game.enemyBullets.push(
          new Bullet(this.x, this.y - 24, Math.cos(angle) * boltSpeed, Math.sin(angle) * boltSpeed, '#ffee00', 1, 'lightning', true)
        );
        // Twin arc bolt on higher difficulty sectors
        if (diffScale >= 1.35) {
          game.enemyBullets.push(
            new Bullet(this.x, this.y - 24, Math.cos(angle + 0.18) * boltSpeed, Math.sin(angle + 0.18) * boltSpeed, '#00f3ff', 1, 'lightning', true)
          );
        }
      }
    }

    // Standard Enemy Shooting (scaled by difficulty multiplier)
    if (this.canShoot && !this.isFriendly && distFromCamLeft > 80 && distFromCamLeft < 1220) {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.fireTimer = this.fireRate;
        const angle = Math.atan2(game.player.y - this.y, game.player.worldX - this.x);
        const baseSpeed = this.type === 'royal_guard' ? 430 : 330;
        const speed = baseSpeed * (1 + (diffScale - 1) * 0.65);
        game.enemyBullets.push(
          new Bullet(this.x - 12, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed, this.color, 1, 'enemy_orb', true)
        );
        // Elite enemies & heavy turrets fire spread bursts as difficulty scales up
        if (diffScale >= 1.25 && (this.type === 'royal_guard' || this.type === 'factory_turret' || this.type === 'radar_core')) {
          game.enemyBullets.push(
            new Bullet(this.x - 12, this.y, Math.cos(angle - 0.16) * speed, Math.sin(angle - 0.16) * speed, this.color, 1, 'enemy_orb', true)
          );
        }
      }
    }

    if (this.x < game.cameraX - 180) {
      this.dead = true;
    }
  }

  takeDamage(amount, game) {
    if (this.dead || this.isFriendly) return;
    if (this.type === 'escaping_patrol') {
      this.hitFlash = 0.1;
      window.audio.sfxHit();
      game.addFloatingText(this.x, this.y - 24, 'WARP SHIELDED!', '#ffaa00');
      return;
    }

    this.hp -= amount;
    this.hitFlash = 0.12;
    window.audio.sfxHit();

    if (this.hp <= 0) {
      this.destroy(game);
    }
  }

  destroy(game) {
    this.dead = true;
    game.score += this.score;
    game.enemiesDestroyed++;
    window.audio.sfxExplode(this.radius > 28 ? 'large' : 'small');
    game.spawnExplosion(this.x, this.y, this.color, this.radius > 28 ? 28 : 16);
    game.addFloatingText(this.x, this.y - 16, `+${this.score}`, this.color);

    // Special Level Objective hooks
    if (this.type === 'radar_jammer') {
      game.jammersDestroyed++;
      if (game.jammersDestroyed >= 3 && !game.radarUnlocked) {
        game.unlockRadarMinimap();
      }
    } else if (this.type === 'radar_core') {
      game.unlockRadarMinimap();
    } else if (this.type === 'prison_cage') {
      // Spawn 2 escaping humans to rescue!
      game.addFloatingText(this.x, this.y - 36, 'CAGE BROKEN! RESCUE THEM!', '#00ffaa');
      game.enemies.push(new Enemy(this.x - 14, this.y - 10, 'rescued_human'));
      game.enemies.push(new Enemy(this.x + 14, this.y - 20, 'rescued_human'));
    } else if (this.type === 'tesla_coil') {
      game.teslaCoilsSmashed++;
      game.screenShake = 9;
      game.addFloatingText(this.x, this.y - 36, `TESLA COIL SMASHED! (${game.teslaCoilsSmashed})`, '#ffee00');
    }

    // Power-up drop chance (halved in HARD mode)
    const diffScale = game.getDifficultyMultiplier ? game.getDifficultyMultiplier() : 1.0;
    const hardDropMul = game.difficultyMode === 'HARD' ? 0.5 : 1.0;
    const baseDrop = this.score >= 300 ? 0.34 : 0.12;
    const dropChance = (baseDrop / (1 + (diffScale - 1) * 0.4)) * hardDropMul;
    if (Math.random() < dropChance) {
      const roll = Math.random();
      const pType = roll < 0.48 ? 'shield' : (roll < 0.86 ? 'double_shot' : 'extra_life');
      game.powerUps.push(new PowerUp(this.x, this.y, pType));
    }
  }
}

// ============================================================================
// BOSSES (Level 4 Mini-Boss, Level 6 Mini-Boss, Level 8 Medium Boss, Level 10 Alien King)
// ============================================================================
class Boss {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.startY = y;
    this.type = type;
    this.age = 0;
    this.dead = false;
    this.hitFlash = 0;
    this.attackTimer = 1.2;
    this.missileTimer = 1.1;
    this.phase = 1;

    const diffScale = (window.game && window.game.getDifficultyMultiplier)
      ? window.game.getDifficultyMultiplier()
      : 1.0;
    const isHard = !!(window.game && window.game.difficultyMode === 'HARD');
    const hardHpMul = isHard ? 2.0 : 1.0;
    this.isHard = isHard;

    if (type === 'power_miniboss') {
      this.name = 'GRID OVERSEER CRUISER';
      this.subtitle = 'Power Station Mini-Boss';
      this.hp = Math.round(95 * diffScale * hardHpMul);
      this.maxHp = this.hp;
      this.radius = 62;
      this.score = 3500;
      this.color = '#ffaa00';
    } else if (type === 'factory_miniboss') {
      this.name = 'FORGE-MECHA GOLIATH';
      this.subtitle = 'Alien Factory Mini-Boss';
      this.hp = Math.round(130 * diffScale * hardHpMul);
      this.maxHp = this.hp;
      this.radius = 68;
      this.score = 4500;
      this.color = '#ff5522';
    } else if (type === 'prison_mediumboss') {
      this.name = 'WARDEN DREADNOUGHT';
      this.subtitle = 'Detention Citadel Medium Boss';
      this.hp = Math.round(175 * diffScale * hardHpMul);
      this.maxHp = this.hp;
      this.radius = 78;
      this.score = 6500;
      this.color = '#ff33aa';
    } else {
      // Level 10 Final Boss: ALIEN KING (scaled by 1.5x at Level 10, x2 in HARD mode!)
      this.name = 'THE ALIEN KING // ROYAL UFO THRONE';
      this.subtitle = 'Supreme Commander of the Invasion Armada';
      this.hp = Math.round(260 * diffScale * hardHpMul);
      this.maxHp = this.hp;
      this.radius = 96;
      this.score = 15000;
      this.color = '#ff1155';
    }
  }

  update(dt, game) {
    this.age += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // Keep boss hovered on the right side of the active battle arena
    const targetX = game.cameraX + 980;
    this.x += (targetX - this.x) * Math.min(1, dt * 3.5);

    const verticalAmp = this.type === 'alien_king' ? 175 : 135;
    const verticalSpeed = this.type === 'alien_king' ? 2.1 : 1.6;
    this.y = 360 + Math.sin(this.age * verticalSpeed) * verticalAmp;

    if (this.hp < this.maxHp * 0.5) {
      this.phase = 2;
    }

    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.performAttack(game);
    }

    // In HARD mode, all bosses launch homing missiles at the player!
    if (game.difficultyMode === 'HARD') {
      this.missileTimer -= dt;
      if (this.missileTimer <= 0) {
        this.fireHomingMissiles(game);
      }
    }
  }

  fireHomingMissiles(game) {
    const aimAngle = Math.atan2(game.player.y - this.y, game.player.worldX - this.x);
    const missileSpeed = 355;
    window.audio.sfxMissile();

    if (this.type === 'power_miniboss') {
      this.missileTimer = this.phase === 2 ? 2.1 : 2.7;
      const count = this.phase === 2 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const offset = count === 2 ? (i === 0 ? -0.25 : 0.25) : 0;
        const a = aimAngle + offset;
        game.enemyBullets.push(
          new Bullet(this.x - 45, this.y + (i === 0 ? -18 : 18), Math.cos(a) * missileSpeed, Math.sin(a) * missileSpeed, '#ff5500', 1, 'boss_missile', true)
        );
      }
    } else if (this.type === 'factory_miniboss') {
      this.missileTimer = this.phase === 2 ? 1.85 : 2.4;
      for (const offset of [-0.28, 0.28]) {
        const a = aimAngle + offset;
        game.enemyBullets.push(
          new Bullet(this.x - 50, this.y + (offset < 0 ? -24 : 24), Math.cos(a) * missileSpeed, Math.sin(a) * missileSpeed, '#ff3300', 1, 'boss_missile', true)
        );
      }
    } else if (this.type === 'prison_mediumboss') {
      this.missileTimer = this.phase === 2 ? 1.65 : 2.15;
      for (const offset of [-0.32, 0.32]) {
        const a = aimAngle + offset;
        game.enemyBullets.push(
          new Bullet(this.x - 55, this.y + (offset < 0 ? -28 : 28), Math.cos(a) * missileSpeed, Math.sin(a) * missileSpeed, '#ff0066', 1, 'boss_missile', true)
        );
      }
    } else {
      // Alien King Homing Missile Salvo
      this.missileTimer = this.phase === 2 ? 1.45 : 1.9;
      const offsets = this.phase === 2 ? [-0.36, 0, 0.36] : [-0.28, 0.28];
      for (const offset of offsets) {
        const a = aimAngle + offset;
        game.enemyBullets.push(
          new Bullet(this.x - 65, this.y + offset * 70, Math.cos(a) * missileSpeed, Math.sin(a) * missileSpeed, '#ff1155', 1, 'boss_missile', true)
        );
      }
    }
  }

  performAttack(game) {
    const diffScale = game.getDifficultyMultiplier ? game.getDifficultyMultiplier() : 1.0;
    const spdMul = 1 + (diffScale - 1) * 0.5;
    const aimAngle = Math.atan2(game.player.y - this.y, game.player.worldX - this.x);

    if (this.type === 'power_miniboss') {
      this.attackTimer = (this.phase === 2 ? 0.95 : 1.3) / diffScale;
      const count = this.phase === 2 ? 5 : 3;
      for (let i = 0; i < count; i++) {
        const spread = (i - (count - 1) / 2) * 0.18;
        const a = aimAngle + spread;
        game.enemyBullets.push(new Bullet(this.x - 45, this.y, Math.cos(a) * 380 * spdMul, Math.sin(a) * 380 * spdMul, '#ffaa00', 1, 'enemy_orb', true));
      }
    } else if (this.type === 'factory_miniboss') {
      this.attackTimer = (this.phase === 2 ? 0.85 : 1.15) / diffScale;
      for (let i = -2; i <= 2; i++) {
        const a = aimAngle + i * 0.15;
        game.enemyBullets.push(new Bullet(this.x - 50, this.y + i * 12, Math.cos(a) * 410 * spdMul, Math.sin(a) * 410 * spdMul, '#ff5522', 1, 'enemy_orb', true));
      }
    } else if (this.type === 'prison_mediumboss') {
      this.attackTimer = (this.phase === 2 ? 0.75 : 1.05) / diffScale;
      // Radial burst + aimed twin beams
      for (let i = -3; i <= 3; i++) {
        const a = aimAngle + i * 0.14;
        game.enemyBullets.push(new Bullet(this.x - 55, this.y, Math.cos(a) * 430 * spdMul, Math.sin(a) * 430 * spdMul, '#ff33aa', 1, 'enemy_orb', true));
      }
    } else if (this.type === 'alien_king') {
      this.attackTimer = (this.phase === 2 ? 0.65 : 0.9) / diffScale;
      // Alternating royal fan volley & lightning ring
      const fanCount = this.phase === 2 ? 7 : 5;
      for (let i = 0; i < fanCount; i++) {
        const spread = (i - (fanCount - 1) / 2) * 0.15;
        const a = aimAngle + spread;
        const col = i % 2 === 0 ? '#ff1155' : '#ffcc00';
        game.enemyBullets.push(new Bullet(this.x - 65, this.y, Math.cos(a) * 450 * spdMul, Math.sin(a) * 450 * spdMul, col, 1, 'enemy_orb', true));
      }
      // Spawn occasional shield or double-shot drone so the player has fair sustain in the final showdown
      if (Math.random() < 0.14) {
        game.powerUps.push(new PowerUp(this.x - 80, this.y, Math.random() < 0.5 ? 'shield' : 'double_shot'));
      }
    }
  }

  takeDamage(amount, game) {
    if (this.dead) return;
    this.hp -= amount;
    this.hitFlash = 0.08;
    window.audio.sfxHit();

    if (this.hp <= 0) {
      this.destroy(game);
    }
  }

  destroy(game) {
    this.dead = true;
    game.score += this.score;
    game.bossesDefeated++;
    window.audio.sfxExplode('boss');
    window.input.rumble(650, 1.0, 1.0);
    game.screenShake = 28;

    for (let i = 0; i < 6; i++) {
      const ox = (Math.random() - 0.5) * 120;
      const oy = (Math.random() - 0.5) * 120;
      game.spawnExplosion(this.x + ox, this.y + oy, i % 2 === 0 ? this.color : '#ffffff', 32);
    }

    game.addFloatingText(this.x, this.y - 30, `${this.name} DESTROYED! +${this.score}`, '#00ff88');
    game.enemyBullets.length = 0;

    // Guarantee a reward drop
    game.powerUps.push(new PowerUp(this.x, this.y, 'extra_life'));
  }
}

window.Entities = {
  PlayerJet,
  Bullet,
  PowerUp,
  Enemy,
  Boss
};
