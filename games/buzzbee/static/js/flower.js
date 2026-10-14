/**
 * BuzzBee – Flower Entity
 */
class Flower {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.r = 18;
    this.colors = ['#FF6B9D', '#dbdbc6ff', '#87CEEB', '#FF8C69', '#DA70D6'];
    this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    this.petalCount = 5 + Math.floor(Math.random() * 3);
    this.hasNectar = true;
    this.collectAnim = 0;
    this.wobble = Math.random() * Math.PI * 2;
    this.stemH = 30 + Math.random() * 20;
    this.dead = false;
  }

  update() {
    this.wobble += 0.02;
    if (this.collectAnim > 0) {
      this.collectAnim--;
      if (this.collectAnim === 0) this.dead = true;
    }
  }

  collect() {
    if (!this.hasNectar) return false;
    this.hasNectar = false;
    this.collectAnim = 40;
    return true;
  }

  draw(ctx) {
    const sw = Math.sin(this.wobble) * 2;
    ctx.save();
    ctx.translate(this.x, this.y);

    // fade on collect
    if (this.collectAnim > 0) {
      ctx.globalAlpha = this.collectAnim / 40;
      ctx.scale(1 + (1 - this.collectAnim / 40) * 0.5, 1 + (1 - this.collectAnim / 40) * 0.5);
    }

    // stem
    ctx.strokeStyle = '#2E7D32'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(sw, 0); ctx.lineTo(sw * 0.5, this.stemH); ctx.stroke();

    // leaves
    ctx.fillStyle = '#43A047';
    ctx.beginPath();
    ctx.ellipse(sw + 8, this.stemH * 0.6, 8, 4, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sw - 8, this.stemH * 0.4, 8, 4, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // petals
    for (let i = 0; i < this.petalCount; i++) {
      const a = (i / this.petalCount) * Math.PI * 2;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(
        sw + Math.cos(a) * this.r * 0.8,
        Math.sin(a) * this.r * 0.8,
        this.r * 0.55, this.r * 0.35, a, 0, Math.PI * 2
      );
      ctx.fill();
    }

    // centre
    const cg = ctx.createRadialGradient(sw, 0, 0, sw, 0, this.r * 0.42);
    cg.addColorStop(0, '#FFF176'); cg.addColorStop(1, '#F9A825');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(sw, 0, this.r * 0.42, 0, Math.PI * 2); ctx.fill();

    // nectar dot
    if (this.hasNectar) {
      ctx.fillStyle = '#FFD600';
      ctx.shadowColor = '#FFD600'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(sw, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  getBounds() { return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 }; }
}
window.Flower = Flower;
