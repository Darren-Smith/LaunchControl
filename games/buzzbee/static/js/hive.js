/**
 * BuzzBee – Hive Entity (4×4 hex grid)
 */
class Hive {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.cols = 4; this.rows = 4;
    this.r = 26;           // hex radius
    this.cells = Array.from({ length: 16 }, () => ({
      nectar: 0, pollen: 0,
      timer: 0, state: 'empty', // empty|brewing|done
      pulse: Math.random() * Math.PI * 2,
    }));
    this.honeyJars = 0;
    this.brewTime = 45 * 60; // 45s @ 60fps
    this.jarPopAnim = 0;
  }

  /** Returns {col,row} for flat-top hex grid pixel position */
  hexPos(idx) {
    const col = idx % this.cols, row = Math.floor(idx / this.cols);
    const w = Math.sqrt(3) * this.r;
    const h = 1.5 * this.r;
    const offset = 25
    return {
      x: this.x + col * w + (row % 2 === 1 ? w / 2 : 0) + offset,
      y: this.y + row * h + offset,
    };
  }

  deposit(nectarAmt, pollenAmt) {
    // fill cells round-robin
    let n = nectarAmt, p = pollenAmt;
    for (const c of this.cells) {
      if (c.state === 'done') continue;
      if (n > 0 && c.nectar < 3) { const add = Math.min(n, 3 - c.nectar); c.nectar += add; n -= add; }
      if (p > 0 && c.pollen < 3) { const add = Math.min(p, 3 - c.pollen); c.pollen += add; p -= add; }
      if (c.nectar >= 3 && c.pollen >= 3 && c.state === 'empty') c.state = 'brewing';
      if (n === 0 && p === 0) break;
    }
  }

  update() {
    if (this.jarPopAnim > 0) this.jarPopAnim--;
    for (const c of this.cells) {
      c.pulse += 0.04;
      if (c.state === 'brewing') {
        c.timer++;
        if (c.timer >= this.brewTime) {
          c.state = 'done';
          c.timer = this.brewTime;
          this.honeyJars++;
          this.jarPopAnim = 60;
        }
      }
    }
  }

  draw(ctx) {
    ctx.save();
    // Hive back panel
    ctx.fillStyle = 'rgba(30,15,0,1)';
    ctx.strokeStyle = '#FF8F00';
    ctx.lineWidth = 2;
    const w = Math.sqrt(3) * this.r * 4 + 55;
    const h = 1.5 * this.r * 4 + this.r + 35;
    ctx.beginPath();
    ctx.roundRect(this.x - 14, this.y - 14, w, h, 12);
    ctx.fill(); ctx.stroke();

    // Title
    ctx.fillStyle = '#FFD600';
    ctx.font = "bold 11px 'Fredoka One',cursive";
    ctx.textAlign = 'center';
    ctx.fillText('🍯 HIVE', this.x + w / 2 - 14, this.y - 4);

    for (let i = 0; i < 16; i++) {
      const c = this.cells[i];
      const { x, y } = this.hexPos(i);
      this._drawHex(ctx, x, y, c, i);
    }

    // Honey jars counter
    if (this.jarPopAnim > 0) {
      const sc = 1 + (this.jarPopAnim > 30 ? (60 - this.jarPopAnim) / 30 : (this.jarPopAnim / 30)) * 0.3;
      ctx.save();
      ctx.translate(this.x + w / 2 - 14, this.y + h - 20);
      ctx.scale(sc, sc);
      ctx.fillStyle = '#FFD600';
      ctx.font = "bold 13px 'Fredoka One',cursive";
      ctx.fillText(`🍯 ×${this.honeyJars}`, 0, 0);
      ctx.restore();
    } else {
      ctx.fillStyle = '#FF8F00';
      ctx.font = "bold 13px 'Fredoka One',cursive";
      ctx.fillText(`🍯 ×${this.honeyJars}`, this.x + w / 2 - 14, this.y + h - 20);
    }
    ctx.restore();
  }

  _drawHex(ctx, cx, cy, c, idx) {
    const r = this.r;
    ctx.save();

    // fill color by state
    let fill;
    if (c.state === 'done') {
      fill = '#FF8F00';
    } else if (c.state === 'brewing') {
      const t = c.timer / this.brewTime;
      fill = `rgba(${Math.round(255 * t)},${Math.round(180 * t)},0,0.9)`;
    } else {
      const necPct = c.nectar / 3, polPct = c.pollen / 3;
      fill = `rgba(80,50,0,${0.4 + necPct * 0.3 + polPct * 0.2})`;
    }

    // hex path
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 180 * (60 * i - 30);
      i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
        : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    ctx.closePath();

    if (c.state === 'done') {
      ctx.shadowColor = '#FFD600'; ctx.shadowBlur = 10 + Math.sin(c.pulse) * 5;
    }
    ctx.fillStyle = fill; ctx.fill();

    // brewing arc
    if (c.state === 'brewing') {
      const pct = c.timer / this.brewTime;
      ctx.strokeStyle = '#FFD600';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FFD600'; ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 2, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // outline
    ctx.strokeStyle = '#FF8F00'; ctx.lineWidth = 1.5; ctx.shadowBlur = 0;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 180 * (60 * i - 30);
      i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a)) : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    ctx.closePath(); ctx.stroke();

    // contents
    if (c.state === 'done') {
      ctx.font = '14px serif'; ctx.textAlign = 'center';
      ctx.fillText('🍯', cx, cy + 5);
    } else {
      // nectar dots (blue)
      for (let d = 0; d < c.nectar; d++) {
        ctx.fillStyle = '#90CAF9';
        ctx.beginPath(); ctx.arc(cx - 8 + d * 8, cy + 5, 3, 0, Math.PI * 2); ctx.fill();
      }
      // pollen dots (yellow)
      for (let d = 0; d < c.pollen; d++) {
        ctx.fillStyle = '#FFD600';
        ctx.beginPath(); ctx.arc(cx - 8 + d * 8, cy - 5, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  /** Where the bee should fly to deposit */
  get entranceX() { return this.x + Math.sqrt(3) * this.r * 2; }
  get entranceY() { return this.y + 1.5 * this.r * 2; }
  get depositRadius() { return 55; }
}
window.Hive = Hive;
