// Cat Fighters - Particle & Visual Effects Engine
// Cartoon comic-style sparks, slashes, splats, explosions, stink clouds, and floating damage numbers.

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.damageNumbers = [];
    this.screenShake = 0;
  }

  triggerShake(intensity = 8) {
    this.screenShake = Math.max(this.screenShake, intensity);
  }

  // Comic starburst sparks on punch / kick / claw hit
  createHitSparks(x, y, color = '#ffeb3b', count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 6;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color,
        life: 1.0,
        decay: 0.05 + Math.random() * 0.04,
      });
    }

    // Flash ring
    this.particles.push({
      type: 'shockwave',
      x,
      y,
      radius: 5,
      maxRadius: 35,
      color: '#ffffff',
      life: 1.0,
      decay: 0.1,
    });
  }

  // Claw slash visual arc
  createSlashTrail(x, y, facing, color = '#ff1744') {
    this.particles.push({
      type: 'slash',
      x,
      y,
      facing,
      scale: 1.0,
      color,
      life: 1.0,
      decay: 0.12,
    });
  }

  // Poo splat on floor or opponent hit
  createPooSplat(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * 0.8 + Math.random() * Math.PI * 0.6;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        type: 'splat',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.25,
        size: 4 + Math.random() * 5,
        color: Math.random() > 0.3 ? '#6d4c41' : '#5d4037',
        life: 1.0,
        decay: 0.03,
      });
    }
  }

  // Stink fumes / Poop grenade toxic cloud
  createStinkCloud(x, y, radius = 60) {
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      this.particles.push({
        type: 'stink',
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.8 - Math.random() * 1.2,
        size: 8 + Math.random() * 14,
        color: Math.random() > 0.4 ? 'rgba(102, 187, 106, 0.6)' : 'rgba(139, 195, 74, 0.5)',
        life: 1.0,
        decay: 0.02 + Math.random() * 0.015,
      });
    }
  }

  // Scatter of cat litter grains
  createLitterScatter(x, y, vxBase, vyBase, count = 16) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        type: 'litter',
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: vxBase + (Math.random() - 0.5) * 3,
        vy: vyBase + (Math.random() - 0.5) * 3,
        gravity: 0.35,
        size: 2 + Math.random() * 2.5,
        color: Math.random() > 0.5 ? '#cfd8dc' : '#b0bec5',
        life: 1.0,
        decay: 0.03,
      });
    }
  }

  // Ground dust puff on jump / dash / landing
  createDustPuff(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        type: 'dust',
        x: x + (Math.random() - 0.5) * 16,
        y: y,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -0.5 - Math.random() * 1.2,
        size: 4 + Math.random() * 5,
        color: 'rgba(238, 238, 238, 0.65)',
        life: 1.0,
        decay: 0.06,
      });
    }
  }

  // Floating comic damage numbers
  createDamageNumber(x, y, text, color = '#ffeb3b') {
    this.damageNumbers.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y - 20,
      vy: -2.5,
      text: String(text),
      color,
      life: 1.0,
      decay: 0.028,
      scale: 1.2,
    });
  }

  update() {
    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake *= 0.88;
      if (this.screenShake < 0.2) this.screenShake = 0;
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      if (p.vx !== undefined) p.x += p.vx;
      if (p.vy !== undefined) p.y += p.vy;
      if (p.gravity) p.vy += p.gravity;

      if (p.type === 'shockwave') {
        p.radius += (p.maxRadius - p.radius) * 0.2;
      } else if (p.type === 'slash') {
        p.scale += 0.08;
      } else if (p.type === 'stink' || p.type === 'dust') {
        p.size += 0.2;
      }
    }

    // Update damage numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.life -= d.decay;
      d.y += d.vy;
      d.vy *= 0.95;
      if (d.scale > 1.0) d.scale -= 0.02;
      if (d.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();

    // Render particles
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);

      if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'shockwave') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 * p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'slash') {
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.facing < 0) ctx.scale(-1, 1);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4 * p.life;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, 36 * p.scale, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();
        // Inner bright core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * p.life;
        ctx.beginPath();
        ctx.arc(0, 0, 36 * p.scale, -Math.PI * 0.35, Math.PI * 0.35);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'splat') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * 1.3, p.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'stink' || p.type === 'dust') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'litter') {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }

    // Render comic damage numbers
    for (const d of this.damageNumbers) {
      ctx.globalAlpha = Math.max(0, d.life);
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.scale(d.scale, d.scale);
      ctx.font = 'bold 22px "Press Start 2P", "Outfit", "Impact", monospace';
      ctx.textAlign = 'center';

      // Comic black drop shadow / outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(d.text, 0, 0);

      ctx.fillStyle = d.color;
      ctx.fillText(d.text, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }
}

window.particles = new ParticleSystem();
