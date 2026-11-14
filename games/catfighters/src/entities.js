// Cat Fighters - Cat Entity & Character Controller
// Handles physics, state machine, procedural cartoon animation, hitboxes, status effects (Poison & Stuck), and 6 attacks.

class CatFighter {
  constructor(options) {
    this.name = options.name || 'Cat';
    this.playerNumber = options.playerNumber || 1;
    this.isCPU = options.isCPU || false;
    this.themeColor = options.themeColor || '#e53935';
    this.secondaryColor = options.secondaryColor || '#ff8a80';
    this.bellyColor = options.bellyColor || '#fff3e0';
    this.accessoryColor = options.accessoryColor || '#ffeb3b';

    // Position & Dimensions (Scaled for 1200x1000 resolution)
    this.x = options.x || 300;
    this.y = options.y || 880;
    this.width = 80;
    this.height = 92;
    this.facing = options.facing || 1; // 1 = right, -1 = left

    // Physics
    this.vx = 0;
    this.vy = 0;
    this.moveSpeed = 7.5;
    this.jumpForce = -17.5;
    this.gravity = 0.75;
    this.groundY = options.groundY || 880;
    this.isGrounded = true;

    // Combat Stats
    this.maxHealth = 100;
    this.health = 100;
    this.score = 0;
    this.wins = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.isAlive = true;
    this.isDead = false;

    // States: 'idle', 'walk', 'jump', 'crouch', 'attack', 'hit', 'ko', 'win'
    this.state = 'idle';
    this.stateTimer = 0;

    // Status Effects
    this.poisonTimer = 0;     // Remaining duration of poison
    this.poisonTickTimer = 0; // Countdown between 1-sec ticks
    this.poisonDps = 5;       // Damage per second
    this.stuckTimer = 0;      // 5-second immobilization from Hairball

    // Current attack info
    this.currentAttack = null;
    this.attackPhase = null; // 'startup', 'active', 'recovery'
    this.attackTimer = 0;
    this.attackCooldowns = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    this.hasFiredProjectile = false;
    this.hasHitMelee = false;

    // Hit reaction
    this.hitStunTimer = 0;
    this.invulnerableTimer = 0;
    this.flashTimer = 0;

    // Procedural animation parameters
    this.animTime = Math.random() * 10;
    this.scrambleAngle = 0;
    this.squashX = 1.0;
    this.squashY = 1.0;
  }

  resetForNewRound(spawnX, facing) {
    this.x = spawnX;
    this.y = this.groundY;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.isGrounded = true;
    this.health = this.maxHealth;
    this.state = 'idle';
    this.stateTimer = 0;
    this.currentAttack = null;
    this.attackPhase = null;
    this.attackTimer = 0;
    this.hitStunTimer = 0;
    this.invulnerableTimer = 0;
    this.flashTimer = 0;
    this.isAlive = true;
    this.isDead = false;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.poisonTimer = 0;
    this.poisonTickTimer = 0;
    this.stuckTimer = 0;
    this.scrambleAngle = 0;
    this.attackCooldowns = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  }

  applyPoison(duration = 10.0, dps = 5) {
    if (!this.isAlive || this.isDead) return;
    this.poisonTimer = duration;
    this.poisonTickTimer = 1.0;
    this.poisonDps = dps;
    window.particles.createStinkCloud(this.x, this.y - this.height / 2, 45);
    window.particles.createDamageNumber(this.x, this.y - this.height - 35, 'POISONED!', '#69f0ae');
  }

  applyStuck(duration = 5.0) {
    if (!this.isAlive || this.isDead) return;
    this.stuckTimer = duration;
    window.audio.playHairballSplat();
    window.particles.createHitSparks(this.x, this.groundY, '#7cb342', 12);
    window.particles.createDamageNumber(this.x, this.y - this.height - 35, 'STUCK (5s)!', '#ffeb3b');
  }

  startAttack(attackId) {
    if (this.state === 'hit' || this.state === 'ko' || this.state === 'win') return false;
    if (this.attackCooldowns[attackId] > 0) return false;

    let attackKey = null;
    if (attackId === 1) attackKey = 'pooAttack';
    else if (attackId === 2) attackKey = 'hairball';
    else if (attackId === 3) attackKey = 'scratch';
    else if (attackId === 4) attackKey = 'litterThrow';
    else if (attackId === 5) attackKey = 'poopGrenade';
    else if (attackId === 6) attackKey = 'scramble';

    const cfg = ATTACK_CONFIGS[attackKey];
    if (!cfg) return false;

    this.state = 'attack';
    this.currentAttack = { key: attackKey, ...cfg };
    this.attackPhase = 'startup';
    this.attackTimer = cfg.startup;
    this.attackCooldowns[attackId] = cfg.cooldown;
    this.hasFiredProjectile = false;
    this.hasHitMelee = false;

    // Attack startup sound cues
    if (attackId === 1) {
      window.audio.playMeow(1.2);
    } else if (attackId === 2) {
      window.audio.playHairballCough();
    } else if (attackId === 3) {
      window.audio.playScratch();
    } else if (attackId === 4) {
      window.audio.playLitterThrow();
    } else if (attackId === 5) {
      window.audio.playMeow(0.85);
    } else if (attackId === 6) {
      window.audio.playScrambleSpin();
    }

    return true;
  }

  takeDamage(amount, knockbackDir = 0, knockbackForce = 4.5, hitLabel = 'HIT!') {
    if (!this.isAlive || this.isDead || this.invulnerableTimer > 0) return;

    this.health = Math.max(0, this.health - amount);
    this.flashTimer = 0.2;
    this.hitStunTimer = 0.32;
    this.state = 'hit';
    this.currentAttack = null;

    // Apply knockback
    this.vx = knockbackDir * knockbackForce;
    this.vy = -4.0;
    this.isGrounded = false;

    // Comic effects
    window.audio.playHit();
    window.particles.createHitSparks(this.x, this.y - this.height / 2, '#ff1744', 12);
    window.particles.createDamageNumber(this.x, this.y - this.height, `-${amount}`);
    window.particles.triggerShake(amount > 16 ? 9 : 5);

    if (window.input && !this.isCPU) {
      window.input.vibrate(this.playerNumber, amount > 16 ? 180 : 100, 0.4, amount > 16 ? 0.85 : 0.5);
    }

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.health = 0;
    this.isAlive = false;
    this.isDead = true;
    this.state = 'ko';
    this.vy = -8.5;
    this.vx = -this.facing * 5.5;
    this.stateTimer = 0;
    this.poisonTimer = 0;
    this.stuckTimer = 0;
    window.audio.playKO();
    window.particles.triggerShake(16);
    if (window.input && !this.isCPU) {
      window.input.vibrate(this.playerNumber, 350, 0.8, 1.0);
    }
  }

  triggerWin() {
    this.state = 'win';
    this.vx = 0;
    this.vy = 0;
    this.wins++;
    this.poisonTimer = 0;
    this.stuckTimer = 0;
    // Celebratory meow on round win; full match victory plays in handleMatchVictory()
    window.audio.playMeow(1.35);
  }

  checkMeleeHit(opponent) {
    if (!this.currentAttack) return;
    if (this.attackPhase !== 'active' || this.hasHitMelee) return;

    const hb = this.currentAttack.hitbox;
    if (!hb) return;

    const hitX = this.x + hb.offsetX * this.facing;
    const hitY = this.y - this.height / 2 + hb.offsetY;
    const hitW = hb.width;
    const hitH = hb.height;

    // Opponent bounds
    const oppLeft = opponent.x - opponent.width / 2;
    const oppRight = opponent.x + opponent.width / 2;
    const oppTop = opponent.y - opponent.height;
    const oppBottom = opponent.y;

    const myLeft = Math.min(hitX - hitW / 2, hitX + hitW / 2);
    const myRight = Math.max(hitX - hitW / 2, hitX + hitW / 2);
    const myTop = hitY - hitH / 2;
    const myBottom = hitY + hitH / 2;

    const overlaps = (
      myLeft < oppRight &&
      myRight > oppLeft &&
      myTop < oppBottom &&
      myBottom > oppTop
    );

    if (overlaps) {
      this.hasHitMelee = true;
      opponent.takeDamage(
        this.currentAttack.damage,
        this.facing,
        this.currentAttack.knockback || 5.0,
        this.currentAttack.name
      );

      this.score += this.currentAttack.damage * 10;
      this.comboCount++;
      this.comboTimer = 1.5;

      if (this.comboCount > 1) {
        window.particles.createDamageNumber(
          this.x,
          this.y - this.height - 25,
          `${this.comboCount}x COMBO!`,
          '#ff9100'
        );
        this.score += this.comboCount * 50;
      }

      if (this.currentAttack.key === 'scratch') {
        window.audio.playScratch();
        window.particles.createSlashTrail(hitX, hitY, this.facing, this.themeColor);
      } else if (this.currentAttack.key === 'scramble') {
        window.audio.playHit();
        window.particles.triggerShake(10);
        window.particles.createHitSparks(hitX, hitY, '#ffd600', 16);
        window.particles.createDamageNumber(hitX, hitY - 40, 'KNOCKBACK!', '#ff3d00');
      }
    }
  }

  checkProjectileHit(projectile) {
    if (!this.isAlive || this.isDead || projectile.owner === this) return false;

    const myLeft = this.x - this.width / 2;
    const myRight = this.x + this.width / 2;
    const myTop = this.y - this.height;
    const myBottom = this.y;

    const prLeft = projectile.x - projectile.radius;
    const prRight = projectile.x + projectile.radius;
    const prTop = projectile.y - projectile.radius;
    const prBottom = projectile.y + projectile.radius;

    return (
      prLeft < myRight &&
      prRight > myLeft &&
      prTop < myBottom &&
      prBottom > myTop
    );
  }

  update(dt, opponent, arenaWidth) {
    this.animTime += dt * 8;
    this.stateTimer += dt;

    // Status Effect: STUCK (Immobilized by Hairball)
    if (this.stuckTimer > 0) {
      this.stuckTimer -= dt;
      if (this.stuckTimer <= 0) {
        this.stuckTimer = 0;
        window.particles.createDamageNumber(this.x, this.y - this.height - 20, 'FREE!', '#00e676');
      }
    }

    // Status Effect: POISON (from Poop Grenade - 5 points/sec for 10 sec)
    if (this.poisonTimer > 0 && this.isAlive && !this.isDead) {
      this.poisonTimer -= dt;
      this.poisonTickTimer -= dt;

      // Poison damage tick
      if (this.poisonTickTimer <= 0) {
        this.poisonTickTimer = 1.0;
        this.health = Math.max(0, this.health - this.poisonDps);
        window.audio.playPoisonTick();
        window.particles.createStinkCloud(this.x, this.y - this.height / 2, 28);
        window.particles.createDamageNumber(this.x, this.y - this.height - 20, `-${this.poisonDps} POISON`, '#69f0ae');

        if (this.health <= 0) {
          this.die();
        }
      }

      if (this.poisonTimer <= 0) {
        this.poisonTimer = 0;
      }
    }

    // Cooldown timers
    for (let k in this.attackCooldowns) {
      if (this.attackCooldowns[k] > 0) {
        this.attackCooldowns[k] = Math.max(0, this.attackCooldowns[k] - dt);
      }
    }

    // Flash & Invulnerability
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

    // Combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboCount = 0;
    }

    // Face opponent naturally when not mid-attack or stunned
    if (opponent && this.state !== 'attack' && this.state !== 'hit' && this.state !== 'ko') {
      if (Math.abs(opponent.x - this.x) > 12) {
        this.facing = opponent.x > this.x ? 1 : -1;
      }
    }

    // Hit stun update
    if (this.hitStunTimer > 0) {
      this.hitStunTimer -= dt;
      if (this.hitStunTimer <= 0 && this.isAlive) {
        this.state = 'idle';
      }
    }

    // Attack state machine
    if (this.state === 'attack' && this.currentAttack) {
      this.attackTimer -= dt;

      if (this.attackPhase === 'startup') {
        if (this.attackTimer <= 0) {
          this.attackPhase = 'active';
          this.attackTimer = this.currentAttack.duration;

          // Spawn attack action
          if (this.currentAttack.type === 'projectile' && !this.hasFiredProjectile) {
            this.hasFiredProjectile = true;
            if (this.currentAttack.key === 'pooAttack') {
              const spawnX = this.x - this.facing * 24;
              const spawnY = this.y - 34;
              window.projectiles.addPoo(spawnX, spawnY, this.facing * 14.0, this);
            } else if (this.currentAttack.key === 'hairball') {
              const spawnX = this.x + this.facing * 28;
              const spawnY = this.y - 45;
              window.projectiles.addHairball(spawnX, spawnY, this.facing * 12.0, this);
            } else if (this.currentAttack.key === 'litterThrow') {
              const spawnX = this.x + this.facing * 30;
              const spawnY = this.y - 25;
              window.projectiles.addLitter(spawnX, spawnY, this.facing, this);
            } else if (this.currentAttack.key === 'poopGrenade') {
              const spawnX = this.x + this.facing * 30;
              const spawnY = this.y - 50;
              window.projectiles.addPoopGrenade(spawnX, spawnY, this.facing, this);
            }
          } else if (this.currentAttack.type === 'scramble_dash') {
            // SCRAMBLE ATTACK: Cat leaps and spins forward towards enemy!
            this.vx = this.facing * this.currentAttack.leapSpeedX;
            this.vy = this.currentAttack.leapSpeedY;
            this.isGrounded = false;
            window.audio.playScrambleSpin();
            window.particles.createDustPuff(this.x, this.groundY, 6);
          }
        }
      } else if (this.attackPhase === 'active') {
        if (this.currentAttack.type === 'melee' || this.currentAttack.type === 'scramble_dash') {
          this.checkMeleeHit(opponent);
        }
        if (this.currentAttack.type === 'scramble_dash') {
          this.scrambleAngle += 0.5 * this.facing;
          if (Math.random() < 0.35) {
            window.particles.createSlashTrail(this.x, this.y - this.height / 2, this.facing, this.themeColor);
          }
        }
        if (this.attackTimer <= 0) {
          this.attackPhase = 'recovery';
          this.attackTimer = 0.12;
        }
      } else if (this.attackPhase === 'recovery') {
        if (this.attackTimer <= 0) {
          this.state = 'idle';
          this.currentAttack = null;
        }
      }
    }

    // Apply Gravity & Physics
    if (!this.isGrounded) {
      this.vy += this.gravity;
    }
    this.x += this.vx;
    this.y += this.vy;

    // Floor collision
    if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.vy = 0;
      if (!this.isGrounded) {
        this.isGrounded = true;
        window.particles.createDustPuff(this.x, this.groundY, 4);
        if (this.state === 'jump') this.state = 'idle';
      }
    } else {
      this.isGrounded = false;
      if (this.state !== 'attack' && this.state !== 'hit' && this.state !== 'ko') {
        this.state = 'jump';
      }
    }

    // Horizontal friction
    this.vx *= 0.85;
    if (Math.abs(this.vx) < 0.1) this.vx = 0;

    // Arena walls collision
    const halfW = this.width / 2;
    if (this.x < halfW) {
      this.x = halfW;
      this.vx = 0;
    } else if (this.x > arenaWidth - halfW) {
      this.x = arenaWidth - halfW;
      this.vx = 0;
    }

    // Squash & Stretch restoration
    this.squashX += (1.0 - this.squashX) * 0.15;
    this.squashY += (1.0 - this.squashY) * 0.15;
  }

  jump() {
    // If stuck by hairball, CANNOT JUMP!
    if (this.stuckTimer > 0) {
      window.particles.createDamageNumber(this.x, this.y - this.height, 'IMMOBILIZED!', '#ffff00');
      return;
    }

    if (this.isGrounded && this.state !== 'attack' && this.state !== 'hit' && this.state !== 'ko') {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.state = 'jump';
      this.squashX = 0.75;
      this.squashY = 1.35;
      window.audio.playJump();
      window.particles.createDustPuff(this.x, this.groundY, 6);
    }
  }

  move(dir) {
    // If stuck by hairball, CANNOT MOVE!
    if (this.stuckTimer > 0) {
      return;
    }

    if (this.state === 'attack' || this.state === 'hit' || this.state === 'ko') return;
    this.vx = dir * this.moveSpeed;
    if (this.isGrounded && this.state !== 'jump') {
      this.state = 'walk';
      if (Math.random() < 0.2) {
        window.particles.createDustPuff(this.x - dir * 18, this.groundY, 1);
      }
    }
  }

  stopMove() {
    if (this.state === 'walk') {
      this.state = 'idle';
    }
  }

  // --- CARTOON RENDERING SYSTEM ---
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // If STUCK: render sticky green goo puddle at feet
    if (this.stuckTimer > 0) {
      this.renderStuckGoo(ctx);
    }

    // If POISONED: render toxic green aura bubbles
    if (this.poisonTimer > 0) {
      this.renderPoisonAura(ctx);
    }

    let effectiveFacing = this.facing;
    if (this.state === 'attack' && this.currentAttack && this.currentAttack.key === 'pooAttack') {
      effectiveFacing = -this.facing;
    }
    ctx.scale(effectiveFacing * this.squashX, this.squashY);

    // Flash hit silhouette
    if (this.flashTimer > 0 && Math.sin(Date.now() * 0.05) > 0) {
      ctx.filter = 'brightness(2.5) saturate(0.5)';
    }

    // Shadow on floor
    this.renderShadow(ctx);

    // Render body parts
    if (this.state === 'ko') {
      this.renderKOCat(ctx);
    } else if (this.state === 'attack' && this.currentAttack && this.currentAttack.key === 'scramble') {
      this.renderScrambleCat(ctx);
    } else {
      this.renderStandingCat(ctx);
    }

    ctx.restore();
  }

  renderStuckGoo(ctx) {
    ctx.save();
    // Sticky hairball puddle under cat's feet
    ctx.fillStyle = 'rgba(104, 159, 56, 0.85)';
    ctx.strokeStyle = '#33691e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Goo strands locking paws
    ctx.strokeStyle = 'rgba(139, 195, 74, 0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-14, -14);
    ctx.moveTo(18, 0);
    ctx.lineTo(14, -14);
    ctx.stroke();

    // Stuck label
    ctx.font = 'bold 11px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffeb3b';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.strokeText(`STUCK ${Math.ceil(this.stuckTimer)}s`, 0, -100);
    ctx.fillText(`STUCK ${Math.ceil(this.stuckTimer)}s`, 0, -100);
    ctx.restore();
  }

  renderPoisonAura(ctx) {
    ctx.save();
    // Toxic bubbling green particles around cat
    const time = Date.now() * 0.005;
    for (let i = 0; i < 4; i++) {
      const bubbleAngle = time + (i * Math.PI * 2) / 4;
      const bx = Math.cos(bubbleAngle) * 32;
      const by = -45 + Math.sin(bubbleAngle * 1.5) * 25;
      const bSize = 4 + Math.sin(time * 2 + i) * 2;

      ctx.fillStyle = 'rgba(105, 240, 174, 0.75)';
      ctx.beginPath();
      ctx.arc(bx, by, bSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderScrambleCat(ctx) {
    // SCRAMBLE ATTACK: Cat curled into spinning flying sonic-style ball
    ctx.save();
    ctx.translate(0, -38);
    ctx.rotate(this.scrambleAngle);

    // Spinning fur circle
    ctx.fillStyle = this.themeColor;
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Center belly patch
    ctx.fillStyle = this.bellyColor;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // Spinning sharp claws
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 30, Math.sin(a) * 30);
      ctx.lineTo(Math.cos(a + 0.3) * 44, Math.sin(a + 0.3) * 44);
      ctx.lineTo(Math.cos(a + 0.5) * 30, Math.sin(a + 0.5) * 30);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  renderShadow(ctx) {
    const shadowDist = Math.max(0, this.groundY - this.y);
    const shadowScale = Math.max(0.3, 1.0 - shadowDist / 250);
    ctx.save();
    ctx.scale(1 / this.squashX, 1 / this.squashY);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(0, shadowDist + 2, 34 * shadowScale, 11 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  renderStandingCat(ctx) {
    const isPooAttacking = this.state === 'attack' && this.currentAttack && this.currentAttack.key === 'pooAttack';
    const isScratching = this.state === 'attack' && this.currentAttack && this.currentAttack.key === 'scratch';
    const isHairballAttacking = this.state === 'attack' && this.currentAttack && this.currentAttack.key === 'hairball';
    const isWinning = this.state === 'win';

    const breathY = this.state === 'idle' ? Math.sin(this.animTime) * 2.5 : 0;
    const walkBobY = this.state === 'walk' ? Math.abs(Math.sin(this.animTime * 1.5)) * 5 : 0;
    const bodyY = -34 + breathY - walkBobY;

    // 1. TAIL
    this.renderTail(ctx, bodyY, isPooAttacking);

    // 2. HIND LEGS & PAWS
    this.renderHindLegs(ctx, isWinning);

    // 3. MAIN BODY
    this.renderBody(ctx, bodyY);

    // 4. FRONT PAWS / ATTACKING PAW
    this.renderFrontPaws(ctx, bodyY, isScratching, isWinning);

    // 5. HEAD, EARS, FACE, ACCESSORIES
    this.renderHead(ctx, bodyY - 28, isPooAttacking, isHairballAttacking);
  }

  renderTail(ctx, bodyY, isPooAttacking) {
    ctx.save();
    ctx.translate(-22, bodyY + 10);

    if (isPooAttacking) {
      ctx.strokeStyle = this.themeColor;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-12, -42, 8, -58);
      ctx.stroke();

      ctx.strokeStyle = '#212121';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = 'rgba(139, 195, 74, 0.7)';
      ctx.beginPath();
      ctx.arc(0, -8, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const wag = Math.sin(this.animTime * 0.8) * 0.45;
      ctx.strokeStyle = this.themeColor;
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-26, -14 + wag * 18, -34 + wag * 12, -32);
      ctx.stroke();

      ctx.strokeStyle = this.bellyColor;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-26, -24 + wag * 14);
      ctx.lineTo(-34 + wag * 12, -32);
      ctx.stroke();
    }

    ctx.restore();
  }

  renderHindLegs(ctx, isWinning) {
    ctx.fillStyle = this.themeColor;
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 3;

    const walkOffset = this.state === 'walk' ? Math.sin(this.animTime * 1.5) * 8 : 0;
    ctx.beginPath();
    ctx.ellipse(-16 - walkOffset, -5, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(14 + walkOffset, -5, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  renderBody(ctx, bodyY) {
    ctx.save();
    ctx.translate(0, bodyY);

    ctx.fillStyle = this.themeColor;
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.bellyColor;
    ctx.beginPath();
    ctx.ellipse(5, 2, 17, 18, 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderFrontPaws(ctx, bodyY, isScratching, isWinning) {
    ctx.save();
    ctx.translate(0, bodyY);
    ctx.fillStyle = this.themeColor;
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 3;

    if (isWinning) {
      ctx.beginPath();
      ctx.ellipse(-18, -32, 9, 14, -0.4, 0, Math.PI * 2);
      ctx.ellipse(18, -32, 9, 14, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (isScratching) {
      ctx.beginPath();
      ctx.ellipse(28, -6, 14, 10, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(38, -6 + i * 5);
        ctx.lineTo(48, -8 + i * 6);
        ctx.lineTo(39, -3 + i * 5);
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.ellipse(16, 2, 9, 9, 0, 0, Math.PI * 2);
      ctx.ellipse(7, 8, 8, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  renderHead(ctx, headY, isPooAttacking, isHairballAttacking) {
    ctx.save();
    ctx.translate(0, headY);

    // EARS
    ctx.fillStyle = this.themeColor;
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 3;

    // Left Ear
    ctx.beginPath();
    ctx.moveTo(-18, -16);
    ctx.lineTo(-28, -38);
    ctx.lineTo(-7, -24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Ear
    ctx.beginPath();
    ctx.moveTo(7, -24);
    ctx.lineTo(28, -38);
    ctx.lineTo(18, -16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner Ears
    ctx.fillStyle = '#ff80ab';
    ctx.beginPath();
    ctx.moveTo(-17, -18);
    ctx.lineTo(-24, -33);
    ctx.lineTo(-9, -24);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(9, -24);
    ctx.lineTo(24, -33);
    ctx.lineTo(17, -18);
    ctx.fill();

    // HEAD BASE
    ctx.fillStyle = this.themeColor;
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // FIGHTER HEADBAND
    ctx.fillStyle = this.accessoryColor;
    ctx.beginPath();
    ctx.rect(-28, -14, 56, 8);
    ctx.fill();
    ctx.save();
    ctx.translate(-28, -10);
    ctx.rotate(Math.sin(this.animTime) * 0.2);
    ctx.fillStyle = this.accessoryColor;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-18, -5);
    ctx.lineTo(-14, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // FACE
    if (isPooAttacking) {
      this.renderCheekyFace(ctx);
    } else if (isHairballAttacking) {
      this.renderHairballFace(ctx);
    } else if (this.state === 'hit') {
      this.renderHitFace(ctx);
    } else {
      this.renderFighterFace(ctx);
    }

    ctx.restore();
  }

  renderFighterFace(ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 2.5;

    // Eyes
    ctx.beginPath();
    ctx.ellipse(-9, -2, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(11, -2, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pupils
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(-7, -2, 4, 0, Math.PI * 2);
    ctx.arc(13, -2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-8, -4, 1.8, 0, Math.PI * 2);
    ctx.arc(12, -4, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Brows
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-16, -10);
    ctx.lineTo(-4, -6);
    ctx.moveTo(6, -6);
    ctx.lineTo(18, -10);
    ctx.stroke();

    // Nose
    ctx.fillStyle = '#ff4081';
    ctx.beginPath();
    ctx.moveTo(1, 4);
    ctx.lineTo(-2, 1);
    ctx.lineTo(4, 1);
    ctx.closePath();
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(1, 4);
    ctx.lineTo(1, 8);
    ctx.arc(-2, 8, 3.5, 0, Math.PI * 0.8);
    ctx.moveTo(1, 8);
    ctx.arc(4, 8, 3.5, Math.PI * 0.2, Math.PI);
    ctx.stroke();

    // Whiskers
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(16, 4);
    ctx.lineTo(30, 2);
    ctx.moveTo(16, 9);
    ctx.lineTo(29, 11);
    ctx.moveTo(-16, 4);
    ctx.lineTo(-30, 2);
    ctx.moveTo(-16, 9);
    ctx.lineTo(-29, 11);
    ctx.stroke();
  }

  renderCheekyFace(ctx) {
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-9, -2, 6, Math.PI * 0.9, Math.PI * 2.1);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(11, -2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(13, -2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d32f2f';
    ctx.beginPath();
    ctx.arc(2, 7, 7, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  renderHairballFace(ctx) {
    // Hacking cough face: cheeks puffed, eyes squeezed shut, wide hacking mouth!
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 3;
    // Squeezed eyes > <
    ctx.beginPath();
    ctx.moveTo(-14, -6);
    ctx.lineTo(-8, -1);
    ctx.lineTo(-14, 4);
    ctx.moveTo(14, -6);
    ctx.lineTo(8, -1);
    ctx.lineTo(14, 4);
    ctx.stroke();

    // Wide hacking cough O mouth with green slime droplet
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.ellipse(0, 10, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7cb342';
    ctx.beginPath();
    ctx.arc(3, 16, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  renderHitFace(ctx) {
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-14, -7);
    ctx.lineTo(-5, 2);
    ctx.moveTo(-5, -7);
    ctx.lineTo(-14, 2);
    ctx.moveTo(7, -7);
    ctx.lineTo(16, 2);
    ctx.moveTo(16, -7);
    ctx.lineTo(7, 2);
    ctx.stroke();

    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.ellipse(1, 9, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  renderKOCat(ctx) {
    ctx.save();
    ctx.translate(0, -18);
    ctx.rotate(Math.PI * 0.45 * this.facing);

    ctx.fillStyle = this.themeColor;
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(-16, -22, 9, 12, 0, 0, Math.PI * 2);
    ctx.ellipse(16, -22, 9, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Spiral eyes
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 2;
    for (let eyeX of [-9, 9]) {
      ctx.beginPath();
      for (let t = 0; t < Math.PI * 4; t += 0.2) {
        const r = t * 1.4;
        const px = eyeX + Math.cos(t + this.animTime * 2) * r;
        const py = -7 + Math.sin(t + this.animTime * 2) * r;
        if (t === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    ctx.restore();

    for (let i = 0; i < 3; i++) {
      const angle = this.animTime * 1.5 + (i * Math.PI * 2) / 3;
      const starX = Math.cos(angle) * 26;
      const starY = -60 + Math.sin(angle) * 10;
      ctx.fillStyle = '#ffeb3b';
      ctx.strokeStyle = '#f57f17';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(starX, starY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}
