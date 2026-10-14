// Cat Fighters - CPU Bot AI Controller
// Provides Easy, Normal, and Hard CPU opponent behaviors with tunable speed, reaction time, and combat aggression.

class CatAI {
  constructor(fighter, opponent, difficulty = 'normal') {
    this.fighter = fighter;
    this.opponent = opponent;
    this.difficulty = difficulty;
    this.decisionTimer = 0;
    this.action = 'idle'; // 'approach', 'retreat', 'jump', 'idle'
    this.targetAttack = null;
    this.setDifficulty(difficulty);
  }

  setDifficulty(level) {
    this.difficulty = level || 'normal';
    if (this.fighter) {
      if (this.difficulty === 'easy') {
        this.fighter.moveSpeed = 4.2; // Slow-moving cat (requested!)
      } else {
        this.fighter.moveSpeed = 7.5; // Normal / Hard standard speed
      }
    }
  }

  update(dt, projectiles) {
    if (!this.fighter.isAlive || this.fighter.isDead || !this.opponent.isAlive) return;

    // Safety: ensure easy cat maintains slow moveSpeed
    if (this.difficulty === 'easy' && this.fighter.moveSpeed > 4.5) {
      this.fighter.moveSpeed = 4.2;
    }

    this.decisionTimer -= dt;
    if (this.decisionTimer <= 0) {
      const intervalBase = this.difficulty === 'easy' ? 0.85 : (this.difficulty === 'normal' ? 0.35 : 0.15);
      const intervalVariance = this.difficulty === 'easy' ? 0.3 : (this.difficulty === 'normal' ? 0.15 : 0.08);
      this.decisionTimer = intervalBase + Math.random() * intervalVariance;
      this.makeDecision(projectiles);
    }

    // Execute planned movement (if not stuck!)
    if (this.fighter.stuckTimer <= 0) {
      const dx = this.opponent.x - this.fighter.x;

      if (this.action === 'approach') {
        this.fighter.move(Math.sign(dx));
      } else if (this.action === 'retreat') {
        this.fighter.move(-Math.sign(dx));
      } else if (this.action === 'idle') {
        this.fighter.stopMove();
      }

      // Execute jump
      if (this.action === 'jump') {
        this.fighter.jump();
        this.action = Math.random() > 0.5 ? 'approach' : 'idle';
      }
    }

    // Execute attack
    if (this.targetAttack) {
      this.fighter.startAttack(this.targetAttack);
      this.targetAttack = null;
    }
  }

  makeDecision(projectiles) {
    const dx = this.opponent.x - this.fighter.x;
    const dist = Math.abs(dx);

    // 1. Reactive dodge: Check if enemy projectile is flying towards us (only if not immobilized)
    const dodgeThreshold = this.difficulty === 'hard' ? 0.75 : (this.difficulty === 'normal' ? 0.35 : 0.10);
    if (this.fighter.stuckTimer <= 0 && projectiles && projectiles.projectiles) {
      for (const p of projectiles.projectiles) {
        if (p.alive && p.owner !== this.fighter) {
          const pDist = Math.abs(p.x - this.fighter.x);
          const pMovingTowardsUs = (p.vx > 0 && p.x < this.fighter.x) || (p.vx < 0 && p.x > this.fighter.x);
          if (pDist < 200 && pMovingTowardsUs) {
            if (Math.random() < dodgeThreshold) {
              this.action = 'jump';
              return;
            }
          }
        }
      }
    }

    // Easy & Normal hesitation / wander chance (slow attacking and moving)
    if (this.difficulty === 'easy') {
      const hesitateRoll = Math.random();
      if (hesitateRoll < 0.45) {
        this.action = Math.random() < 0.6 ? 'idle' : (Math.random() < 0.5 ? 'approach' : 'retreat');
        return;
      }
    } else if (this.difficulty === 'normal') {
      const hesitateRoll = Math.random();
      if (hesitateRoll < 0.15) {
        this.action = Math.random() < 0.5 ? 'approach' : 'idle';
        return;
      }
    }

    // 2. Exploit opponent being immobilized
    if (this.opponent.stuckTimer > 0) {
      if (this.difficulty === 'easy') {
        if (Math.random() < 0.4) {
          this.targetAttack = 1; // Poo Attack
        } else {
          this.action = 'approach';
        }
        return;
      }

      const roll = Math.random();
      if (roll < 0.35) {
        this.targetAttack = 6; // Scramble leap attack into helpless target!
      } else if (roll < 0.65) {
        this.targetAttack = 5; // Poop Grenade toxic cloud!
      } else {
        this.targetAttack = 1; // Poo Attack!
      }
      return;
    }

    // 3. Range-based attack decisions for 1200-wide arena
    if (dist < 110) {
      // Very close range
      const roll = Math.random();
      if (this.difficulty === 'easy') {
        if (roll < 0.45) {
          this.targetAttack = 3; // Scratch
        } else if (roll < 0.70) {
          this.targetAttack = 1; // Poo
        } else {
          this.action = 'retreat';
        }
      } else if (this.difficulty === 'normal') {
        if (roll < 0.40) {
          this.targetAttack = 3; // Scratch
        } else if (roll < 0.65) {
          this.targetAttack = 2; // Hairball
        } else if (roll < 0.80) {
          this.targetAttack = 6; // Scramble
        } else {
          this.action = Math.random() > 0.5 ? 'retreat' : 'jump';
        }
      } else {
        // Hard (original master AI)
        if (roll < 0.45) {
          this.targetAttack = 3; // Scratch
        } else if (roll < 0.75) {
          this.targetAttack = 2; // Hairball Attack (immobilize!)
        } else if (roll < 0.90) {
          this.targetAttack = 6; // Scramble Attack (knockback!)
        } else {
          this.action = Math.random() > 0.5 ? 'retreat' : 'jump';
        }
      }
    } else if (dist < 320) {
      // Mid range
      const roll = Math.random();
      if (this.difficulty === 'easy') {
        if (roll < 0.30) {
          this.targetAttack = 1; // Poo
        } else if (roll < 0.50) {
          this.targetAttack = 4; // Litter
        } else {
          this.action = 'approach';
        }
      } else if (this.difficulty === 'normal') {
        if (roll < 0.25) {
          this.targetAttack = 2; // Hairball
        } else if (roll < 0.45) {
          this.targetAttack = 4; // Litter
        } else if (roll < 0.65) {
          this.targetAttack = 1; // Poo
        } else if (roll < 0.80) {
          this.targetAttack = 6; // Scramble
        } else {
          this.action = 'approach';
        }
      } else {
        // Hard (original)
        if (roll < 0.28) {
          this.targetAttack = 2; // Hairball Attack
        } else if (roll < 0.52) {
          this.targetAttack = 6; // Scramble Attack (leap spin!)
        } else if (roll < 0.72) {
          this.targetAttack = 4; // Litter Throw
        } else if (roll < 0.88) {
          this.targetAttack = 1; // Poo Attack
        } else {
          this.action = 'approach';
        }
      }
    } else {
      // Long range
      const roll = Math.random();
      if (this.difficulty === 'easy') {
        if (roll < 0.30) {
          this.targetAttack = 1; // Poo
        } else {
          this.action = 'approach';
        }
      } else if (this.difficulty === 'normal') {
        if (roll < 0.25) {
          this.targetAttack = 5; // Poop Grenade
        } else if (roll < 0.55) {
          this.targetAttack = 1; // Poo
        } else if (roll < 0.75) {
          this.targetAttack = 6; // Scramble
        } else {
          this.action = 'approach';
        }
      } else {
        // Hard (original)
        if (roll < 0.35) {
          this.targetAttack = 5; // Poop Grenade (10s poison)
        } else if (roll < 0.65) {
          this.targetAttack = 1; // Poo Attack
        } else if (roll < 0.85) {
          this.targetAttack = 6; // Scramble Attack
        } else {
          this.action = 'approach';
          if (Math.random() < 0.3) {
            this.action = 'jump';
          }
        }
      }
    }
  }
}
