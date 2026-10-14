/**
 * BuzzBee – Entities (Pollen, NectarJar, Hands, Bee, Particle, StingFlash)
 */

/* ── POLLEN ── */
class Pollen {
  constructor(x, y, type = 'good') {
    this.x = x; this.y = y; this.type = type; this.r = 10;
    this.velY = Math.random() * 0.4 + 0.2;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.04 + Math.random() * 0.02;
    this.alpha = 1; this.collected = false; this.age = 0;
    this.maxAge = type === 'bad' ? 420 : 9999;
  }
  update() {
    this.wobble += this.wobbleSpeed;
    this.x += Math.sin(this.wobble) * 0.5;
    this.y += this.velY; this.age++;
    if (this.type === 'bad' && this.age > this.maxAge - 60)
      this.alpha = Math.max(0, (this.maxAge - this.age) / 60);
  }
  draw(ctx) {
    ctx.save(); ctx.globalAlpha = this.alpha;
    const col = this.type === 'good' ? '#FFD600' : '#4CAF50';
    const glow = this.type === 'good' ? '#FFF176' : '#A5D6A7';
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 2);
    g.addColorStop(0, col + 'AA'); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.x, this.y, this.r * 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.35, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + this.wobble * 0.2;
      ctx.fillStyle = col + '99';
      ctx.beginPath(); ctx.arc(this.x + Math.cos(a) * this.r * 1.5, this.y + Math.sin(a) * this.r * 1.5, this.r * 0.45, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  get dead() { return this.collected || this.y > 2000 || (this.type === 'bad' && this.age >= this.maxAge); }
  getBounds() { return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 }; }
}

/* ── BASE HAND ── */
class Hand {
  constructor(x, canvasH, speed) {
    this.x = x; this.y = -150; this.w = 110; this.h = 150;
    this.speed = speed; this.health = 2; this.stungTimer = 0;
    this.state = 'entering'; this.targetY = 0; this.canvasH = canvasH;
  }
  takeDamage() {
    this.health--; this.stungTimer = 25;
    if (this.health <= 0) { this.state = 'retreating'; return true; }
    return false;
  }
  update() {
    if (this.stungTimer > 0) this.stungTimer--;
    if (this.state === 'entering') { this.y += this.speed; if (this.y >= this.targetY) { this.y = this.targetY; this.state = 'active'; } }
    else if (this.state === 'retreating') { this.y -= this.speed * 2; if (this.y < -this.h - 20) this.state = 'dead'; }
  }
  get dead() { return this.state === 'dead'; }
  getBounds() { return { x: this.x - this.w, y: this.y, w: this.w * 2, h: this.h * 2 }; }

  _drawSleeve(ctx, sleeveColor, pattern) {
    // arm sleeve
    ctx.save();
    if (this.stungTimer > 0) ctx.filter = 'brightness(3) saturate(0)';
    ctx.fillStyle = sleeveColor;
    ctx.fillRect(this.x - 22, this.y, 44, this.h * 0.55);
    if (pattern === 'stripes') {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      for (let i = 0; i < 8; i++) ctx.fillRect(this.x - 22, this.y + i * 14, 44, 7);
    } else if (pattern === 'check') {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++)
        if ((i + j) % 2 === 0) ctx.fillRect(this.x - 22 + i * 11, this.y + j * 11, 11, 11);
    }
    ctx.restore();
  }
}

/* ── THIEF HAND (burglar: black-white stripes, black glove) ── */
class ThiefHand extends Hand {
  constructor(x, canvasH, speed, nectarJar) {
    super(x, canvasH, speed);
    this.nectarJar = nectarJar; this.type = 'thief';
    this.x = nectarJar.x + (Math.random() - 0.5) * 60;
    this.targetY = canvasH - 240;
    this.stealTimer = 0; this.stealCooldown = 180; this.stolen = false;
  }
  update() {
    super.update();
    if (this.state === 'active') {
      this.stealTimer++;
      if (this.stealTimer % 30 === 0) this.nectarJar.shake();
      if (this.stealTimer >= this.stealCooldown && !this.stolen) {
        this.stolen = true; this.state = 'retreating'; return 'stolen';
      }
    }
    return null;
  }
  draw(ctx) {
    if (this.state === 'active') {
      const pct = this.stealTimer / this.stealCooldown;
      ctx.save(); ctx.strokeStyle = `rgba(255,59,48,${0.5 + pct * 0.5})`; ctx.lineWidth = 5;
      ctx.shadowColor = '#FF3B30'; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(this.nectarJar.x, this.nectarJar.y - 32, 46, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    if (this.stungTimer > 0) ctx.filter = 'brightness(3) saturate(0)';
    // black+white striped sleeve
    this._drawSleeve(ctx, '#1a1a1a', 'stripes');
    // black leather glove (hand)
    const hy = this.y + this.h * 0.5;
    ctx.fillStyle = '#111'; ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(this.x, hy, 30, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // fingers
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.ellipse(this.x - 18 + i * 12, hy + 16, 6, 14, 0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(this.x + 24, hy + 6, 8, 12, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // glove sheen
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(this.x - 8, hy - 8, 12, Math.PI, 1.8 * Math.PI); ctx.stroke();
    ctx.restore();
    // label
    ctx.save(); ctx.font = 'bold 11px Nunito,sans-serif'; ctx.fillStyle = '#FF3B30'; ctx.textAlign = 'center';
    ctx.fillText('BURGLAR!', this.x, this.y - 6); ctx.restore();
  }
}

/* ── SPRAY HAND (farmer: check shirt, bare hand + spray can) ── */
class SprayHand extends Hand {
  constructor(x, canvasH, speed) {
    super(x, canvasH, speed);
    this.type = 'spray'; this.targetY = 60;
    this.sprayTimer = 0; this.sprayInterval = 80; this.sprayDroplets = [];
  }
  update() {
    super.update();
    if (this.state === 'active') {
      this.sprayTimer++;
      if (this.sprayTimer % this.sprayInterval === 0) {
        for (let i = 0; i < 3; i++) this.sprayDroplets.push({
          x: this.x + (Math.random() - 0.5) * 60, y: this.y + this.h - 20,
          velX: (Math.random() - 0.5) * 2, velY: 2 + Math.random() * 1.5, alpha: 1, r: 6 + Math.random() * 4,
        });
        return 'spray';
      }
    }
    this.sprayDroplets = this.sprayDroplets.filter(d => {
      d.x += d.velX; d.y += d.velY; d.alpha -= 0.01; return d.alpha > 0 && d.y < 2000;
    });
    return null;
  }
  draw(ctx) {
    for (const d of this.sprayDroplets) {
      ctx.save(); ctx.globalAlpha = d.alpha;
      const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
      g.addColorStop(0, '#69F04488'); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.save();
    if (this.stungTimer > 0) ctx.filter = 'brightness(3) saturate(0)';
    // check-pattern sleeve
    this._drawSleeve(ctx, '#8B6914', 'check');
    // bare skin hand
    const hy = this.y + this.h * 0.5;
    ctx.fillStyle = '#D4956A'; ctx.strokeStyle = '#A0633A'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(this.x, hy, 28, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.ellipse(this.x - 16 + i * 11, hy + 16, 5, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    // spray can
    ctx.fillStyle = '#2E7D32'; ctx.strokeStyle = '#1B5E20'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(this.x + 12, hy - 16, 22, 36, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4CAF50'; ctx.fillRect(this.x + 14, hy - 14, 18, 4);
    // nozzle
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.rect(this.x + 34, hy - 18, 14, 6); ctx.fill();
    // green spray cone
    if (this.state === 'active') {
      const g2 = ctx.createRadialGradient(this.x + 48, hy - 15, 0, this.x + 48, hy - 15, 30);
      g2.addColorStop(0, 'rgba(76,175,80,0.6)'); g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.moveTo(this.x + 48, hy - 15);
      ctx.lineTo(this.x + 78, hy - 35); ctx.lineTo(this.x + 78, hy + 5); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.save(); ctx.font = 'bold 11px Nunito,sans-serif'; ctx.fillStyle = '#4CAF50'; ctx.textAlign = 'center';
    ctx.fillText('FARMER', this.x, this.y - 6); ctx.restore();
  }
  getSprayZone() { return { x: this.x - 160, y: this.y + this.h * 2 - 80, w: 320, h: 400 }; }
}

/* ── BEE (player) ── */
class Bee {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 56; this.h = 52;
    this.baseSpeed = 6.5;
    this.vx = 0; this.vy = 0;
    this.health = 100; this.maxHealth = 100;
    this.stamina = 100; this.maxStamina = 100;
    this.staminaRegen = 0.25;
    this.facingRight = true;
    this.wingFlap = 0; this.bobTimer = 0;
    this.stingCooldown = 0; this.stingRange = 70; this.stingCost = 20;
    this.hurtTimer = 0; this.alive = true;
    this.trail = [];
    // Carry mechanics
    this.nectarCarried = 0; this.pollenCarried = 0;
    this.maxCarry = 3;
    this.depositAnim = 0;
  }
  get totalCarried() { return this.nectarCarried + this.pollenCarried; }
  get speed() { return Math.max(4.5, this.baseSpeed - (this.baseSpeed - 4.5) * (this.totalCarried / 3)); }

  move(dx, dy) {
    if (dx !== 0) this.facingRight = dx > 0;
    this.vx = dx * this.speed; this.vy = dy * this.speed;
  }
  tryStirng() {
    if (this.stingCooldown > 0 || this.stamina < this.stingCost) return false;
    this.stamina -= this.stingCost; this.stingCooldown = 18; return true;
  }
  takeDamage(amt) {
    this.health = Math.max(0, this.health - amt);
    this.hurtTimer = 40; if (this.health === 0) this.alive = false;
  }
  collectNectar() { if (this.nectarCarried < this.maxCarry) { this.nectarCarried++; return true; } return false; }
  collectPollen() { if (this.pollenCarried < this.maxCarry) { this.pollenCarried++; return true; } return false; }

  update(W, H) {
    this.x = Math.max(this.w / 2, Math.min(W - this.w / 2, this.x + this.vx));
    this.y = Math.max(70 + this.h / 2, Math.min(H - 80, this.y + this.vy));
    this.wingFlap += 0.35; this.bobTimer += 0.04;
    if (this.stingCooldown > 0) this.stingCooldown--;
    if (this.stamina < this.maxStamina) this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen);
    if (this.hurtTimer > 0) this.hurtTimer--;
    if (this.depositAnim > 0) this.depositAnim--;
    this.trail.push({ x: this.x, y: this.y, alpha: 0.3 });
    if (this.trail.length > 8) this.trail.shift();
    this.trail.forEach(t => t.alpha -= 0.04);
    this.trail = this.trail.filter(t => t.alpha > 0);
  }

  draw(ctx) {
    // trail
    for (const t of this.trail) {
      ctx.save(); ctx.globalAlpha = t.alpha;
      ctx.fillStyle = '#FFD600';
      ctx.beginPath(); ctx.ellipse(t.x, t.y, 10, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    const loaded = this.totalCarried >= 6;
    const bob = Math.sin(this.bobTimer) * (loaded ? 5 : 3) + (loaded ? Math.sin(this.bobTimer * 2.2) * 1.5 : 0);
    ctx.save();
    if (this.hurtTimer > 0 && Math.floor(this.hurtTimer / 5) % 2 === 0) ctx.globalAlpha = 0.4;
    ctx.translate(this.x, this.y + bob);
    if (!this.facingRight) ctx.scale(-1, 1);
    this._drawBody(ctx);
    this._drawWings(ctx);
    this._drawCarryIndicator(ctx);
    ctx.restore();
    // sting range
    if (this.stingCooldown === 0 && this.stamina >= this.stingCost) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,214,0,0.2)'; ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(this.x, this.y, this.stingRange, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    // deposit anim
    if (this.depositAnim > 0) {
      ctx.save(); ctx.globalAlpha = this.depositAnim / 40;
      ctx.font = 'bold 16px Nunito,sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#FFD600';
      ctx.fillText('💛 Deposited!', this.x, this.y - 50 - (40 - this.depositAnim) * 0.8);
      ctx.restore();
    }
  }

  _drawBody(ctx) {
    const bw = this.w * 0.46, bh = this.h * 0.4;
    const bg = ctx.createRadialGradient(-bw * 0.2, -bh * 0.3, 2, 0, 0, bw * 1.1);
    bg.addColorStop(0, '#FFEE00'); bg.addColorStop(1, '#FF8F00');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(0, 0, bw, bh, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, bw, bh, 0, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#1A1206';
    [-14, -2, 10].forEach(y => ctx.fillRect(-bw, y, bw * 2, 7));
    ctx.restore();
    ctx.strokeStyle = '#7B4F00'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, bw, bh, 0, 0, Math.PI * 2); ctx.stroke();
    const hx = bw * 0.8;
    ctx.fillStyle = '#FFD600';
    ctx.beginPath(); ctx.arc(hx, 0, bh * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7B4F00'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(hx, 0, bh * 0.55, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx + bh * 0.2, -bh * 0.15, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(hx + bh * 0.25, -bh * 0.12, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx + bh * 0.28, -bh * 0.17, 1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1A1206'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(hx - 2, -bh * 0.5); ctx.quadraticCurveTo(hx + 6, -bh * 1.2, hx + 14, -bh * 1.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx + 4, -bh * 0.4); ctx.quadraticCurveTo(hx + 14, -bh * 1.0, hx + 18, -bh * 0.8); ctx.stroke();
    ctx.fillStyle = '#FF8F00';
    ctx.beginPath(); ctx.arc(hx + 14, -bh * 1.3, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + 18, -bh * 0.8, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#AA5500';
    ctx.beginPath(); ctx.moveTo(-bw, 0); ctx.lineTo(-bw - 10, 0); ctx.lineTo(-bw, 4); ctx.closePath(); ctx.fill();
  }

  _drawWings(ctx) {
    const wy = -this.h * 0.25, ws = Math.sin(this.wingFlap) * 0.5 + 0.5;
    ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = '#B3E5FC';
    ctx.save(); ctx.translate(-8, wy); ctx.scale(-1, ws);
    ctx.beginPath(); ctx.ellipse(14, -8, 22, 11, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(8, wy); ctx.scale(1, ws);
    ctx.beginPath(); ctx.ellipse(14, -8, 22, 11, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.restore();
  }

  _drawCarryIndicator(ctx) {
    // pollen dots above bee
    const bh = this.h * 0.4;
    for (let i = 0; i < this.pollenCarried; i++) {
      ctx.fillStyle = '#FFD600'; ctx.shadowColor = '#FFD600'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(-10 + i * 10, -bh * 1.8, 4, 0, Math.PI * 2); ctx.fill();
    }
    // nectar drops below antennae
    for (let i = 0; i < this.nectarCarried; i++) {
      ctx.fillStyle = '#42A5F5'; ctx.shadowColor = '#42A5F5'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(-10 + i * 10, -bh * 2.5, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  getBounds() { return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h }; }
}

/* ── PARTICLE ── */
class Particle {
  constructor(x, y, color, count = 8) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const s = 1.5 + Math.random() * 3;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, alpha: 1, r: 3 + Math.random() * 4, color });
    }
  }
  update() {
    this.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.alpha -= 0.03; p.r *= 0.96; });
    this.particles = this.particles.filter(p => p.alpha > 0);
  }
  draw(ctx) {
    for (const p of this.particles) {
      ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
  get dead() { return this.particles.length === 0; }
}

/* ── STING FLASH ── */
class StingFlash {
  constructor(x, y) { this.x = x; this.y = y; this.alpha = 1; this.r = 5; }
  update() { this.r += 4; this.alpha -= 0.08; }
  draw(ctx) {
    ctx.save(); ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = '#FF6BFF'; ctx.lineWidth = 3;
    ctx.shadowColor = '#FF6BFF'; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + Math.cos(a) * this.r * 1.5, this.y + Math.sin(a) * this.r * 1.5); ctx.stroke();
    }
    ctx.restore();
  }
  get dead() { return this.alpha <= 0; }
}

window.Entities = { Bee, Pollen, ThiefHand, SprayHand, Particle, StingFlash };
