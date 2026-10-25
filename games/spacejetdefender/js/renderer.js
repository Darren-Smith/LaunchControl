// ============================================================================
// SPACEJET DEFENDER - Neon Vector Line-Art Renderer & HUD / Minimap Engine
// ============================================================================

class NeonRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;   // 1280
    this.height = canvas.height; // 720

    // Pre-generate multi-layer parallax stars
    this.stars = [];
    for (let i = 0; i < 160; i++) {
      this.stars.push({
        x: Math.random() * 1280,
        y: 60 + Math.random() * 580,
        size: Math.random() < 0.25 ? 2.2 : 1.2,
        parallax: 0.08 + Math.random() * 0.35,
        color: ['#00f3ff', '#ffffff', '#cc66ff', '#00ffaa'][i % 4],
        twinkleOffset: Math.random() * Math.PI * 2
      });
    }
  }

  clear() {
    const ctx = this.ctx;
    ctx.fillStyle = '#03030c';
    ctx.fillRect(0, 0, this.width, this.height);
  }

  withNeon(color, blur = 12, lineWidth = 2, drawFn) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    drawFn(ctx);
    ctx.restore();
  }

  renderWorld(game) {
    const ctx = this.ctx;
    const level = game.currentLevelData;
    const camX = game.cameraX;
    // Vertical parallax shift as player steers up/down
    const vertShift = (game.player.y - 360) * 0.16;

    ctx.save();
    if (game.screenShake > 0) {
      const sx = (Math.random() - 0.5) * game.screenShake;
      const sy = (Math.random() - 0.5) * game.screenShake;
      ctx.translate(sx, sy);
    }

    // 1. Parallax Starfield
    for (const s of this.stars) {
      const sx = ((s.x - camX * s.parallax) % 1280 + 1280) % 1280;
      const sy = s.y - vertShift * s.parallax * 2.2;
      const alpha = 0.45 + 0.45 * Math.sin(game.time * 3 + s.twinkleOffset);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(sx, sy, s.size, s.size);
    }
    ctx.globalAlpha = 1;

    // 2. Distant Neon Perspective Grid & Skyline
    this.renderBackgroundArchitecture(game, level, camX, vertShift);

    // 3. Sector Finish Gate at 8th Screen (x = 10,000)
    this.renderFinishGate(game, level, camX);

    // 4. Power-Ups
    for (const p of game.powerUps) {
      this.renderPowerUp(p, camX, game.time);
    }

    // 5. Enemies & Interactive Level Structures
    for (const e of game.enemies) {
      if (e.x < camX - 100 || e.x > camX + 1380) continue;
      this.renderEnemy(e, camX, game.time);
    }

    // 6. Active Boss
    if (game.activeBoss && !game.activeBoss.dead) {
      this.renderBoss(game.activeBoss, camX, game.time);
    }

    // 7. Player Spacejet
    if (game.state !== 'GAME_OVER') {
      this.renderPlayer(game.player, camX, game.time);
    }

    // 8. Projectiles (Player & Enemy)
    for (const b of game.playerBullets) {
      this.renderBullet(b, camX);
    }
    for (const b of game.enemyBullets) {
      this.renderBullet(b, camX);
    }

    // 9. EMP Overdrive Shockwave Ring
    if (game.overdriveRing) {
      const r = game.overdriveRing;
      this.withNeon('#00ffff', 20, 3, (c) => {
        c.globalAlpha = r.alpha;
        c.beginPath();
        c.arc(r.x - camX, r.y, r.radius, 0, Math.PI * 2);
        c.stroke();
      });
    }

    // 10. Vector Particles & Floating Score Popups
    for (const pt of game.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.strokeStyle = pt.color;
      ctx.fillStyle = pt.color;
      ctx.shadowColor = pt.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(pt.x - camX, pt.y);
      ctx.lineTo(pt.x - camX - pt.vx * 0.025, pt.y - pt.vy * 0.025);
      ctx.lineWidth = pt.size;
      ctx.stroke();
      ctx.restore();
    }

    for (const ft of game.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.font = 'bold 15px "Courier New", monospace';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x - camX, ft.y);
      ctx.restore();
    }

    // 11. Top HUD, Radar Minimap & Radio Transmission Banner
    this.renderHUD(game);

    ctx.restore();
  }

  renderBackgroundArchitecture(game, level, camX, vertShift) {
    const ctx = this.ctx;
    const themeColor = level.themeColor || '#00f3ff';
    const secColor = level.secondaryColor || '#ff00aa';

    // Distant mountain/structure wireframe layer (Parallax 0.35)
    ctx.save();
    ctx.strokeStyle = secColor;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const step = 120;
    const parallaxX = camX * 0.35;
    const startIdx = Math.floor(parallaxX / step);
    for (let i = startIdx; i <= startIdx + 12; i++) {
      const sx = i * step - parallaxX;
      const h = 520 - Math.abs(Math.sin(i * 1.7 + level.number) * 140) - vertShift * 0.5;
      if (i === startIdx) ctx.moveTo(sx, h);
      else ctx.lineTo(sx, h);
    }
    ctx.stroke();
    ctx.restore();

    // Foreground Neon Terrain Floor & Ceiling / Structures (1:1 world space)
    this.withNeon(themeColor, 10, 2, (c) => {
      c.beginPath();
      const seg = 80;
      const firstSeg = Math.floor(camX / seg);
      for (let i = firstSeg; i <= firstSeg + 17; i++) {
        const wx = i * seg;
        const sx = wx - camX;
        const gy = this.getGroundHeightAt(wx, level.number) - vertShift * 0.25;
        if (i === firstSeg) c.moveTo(sx, gy);
        else c.lineTo(sx, gy);
      }
      c.stroke();

      // Vertical grid struts down to bottom of viewport
      c.globalAlpha = 0.35;
      for (let i = firstSeg; i <= firstSeg + 17; i += 2) {
        const wx = i * seg;
        const sx = wx - camX;
        const gy = this.getGroundHeightAt(wx, level.number) - vertShift * 0.25;
        c.beginPath();
        c.moveTo(sx, gy);
        c.lineTo(sx - 35, 720);
        c.stroke();
      }
    });

    // Level-Specific Neon Landmarks along the sector
    for (let s = 1; s <= 8; s++) {
      const worldLandmarkX = (s - 1) * 1280 + 520;
      const lx = worldLandmarkX - camX;
      if (lx > -220 && lx < 1500) {
        this.renderSectorLandmark(level.number, s, lx, 650 - vertShift * 0.25, themeColor, secColor, game.time);
      }
    }
  }

  renderSectorLandmark(levelNum, zoneIdx, sx, groundY, themeColor, secColor, time) {
    this.withNeon(secColor, 8, 1.5, (c) => {
      c.globalAlpha = 0.38;
      if (levelNum === 1) {
        // Flight School Academy Towers
        c.strokeRect(sx - 35, groundY - 120, 70, 120);
        c.beginPath();
        c.moveTo(sx - 45, groundY - 120);
        c.lineTo(sx, groundY - 165);
        c.lineTo(sx + 45, groundY - 120);
        c.stroke();
      } else if (levelNum === 3) {
        // Giant Background Radar Telemetry Dishes
        c.beginPath();
        c.moveTo(sx - 30, groundY);
        c.lineTo(sx, groundY - 95);
        c.lineTo(sx + 30, groundY);
        c.stroke();
        c.beginPath();
        c.arc(sx, groundY - 110, 48, Math.PI * 1.1, Math.PI * 1.9);
        c.stroke();
      } else if (levelNum === 4) {
        // Power Station Plasma Cooling Towers & Weapon Core at Zone 5
        c.strokeRect(sx - 40, groundY - 140, 80, 140);
        c.beginPath();
        c.arc(sx, groundY - 140, 40, Math.PI, 0);
        c.stroke();
        if (zoneIdx === 5) {
          c.globalAlpha = 0.85;
          c.font = 'bold 12px "Courier New", monospace';
          c.textAlign = 'center';
          c.fillText('PLASMA WEAPON CORE', sx, groundY - 190);
        }
      } else if (levelNum === 5) {
        // Research Lab Bio-Domes
        c.beginPath();
        c.arc(sx, groundY, 75, Math.PI, 0);
        c.stroke();
        c.beginPath();
        c.arc(sx, groundY, 50, Math.PI, 0);
        c.stroke();
      } else if (levelNum === 6) {
        // Alien Factory Gantries & Seeker Armory at Zone 5
        c.strokeRect(sx - 50, groundY - 150, 100, 150);
        c.beginPath();
        c.moveTo(sx - 50, groundY - 150);
        c.lineTo(sx + 50, groundY - 75);
        c.lineTo(sx - 50, groundY);
        c.stroke();
        if (zoneIdx === 5) {
          c.globalAlpha = 0.85;
          c.font = 'bold 12px "Courier New", monospace';
          c.textAlign = 'center';
          c.fillText('SEEKER ORDNANCE VAULT', sx, groundY - 165);
        }
      } else if (levelNum === 7) {
        // Airport Control Towers
        c.strokeRect(sx - 18, groundY - 130, 36, 130);
        c.strokeRect(sx - 38, groundY - 160, 76, 30);
      } else if (levelNum === 10) {
        // Giant UFO Command Palace Royal Arches
        c.strokeRect(sx - 45, 74, 90, 65);
        c.strokeRect(sx - 30, groundY - 130, 60, 130);
      }
    });
  }

  getGroundHeightAt(worldX, levelNum) {
    const idx = Math.floor(worldX / 80);
    if (levelNum === 1 || levelNum === 7) {
      // Flat runway / flight school deck with control towers
      return (idx % 7 === 0) ? 645 : 675;
    }
    if (levelNum === 9 || levelNum === 10) {
      // Fortress / Palace stepped battlements
      return (idx % 4 < 2) ? 655 : 680;
    }
    return 665 - Math.sin(idx * 0.8 + levelNum) * 22;
  }

  renderFinishGate(game, level, camX) {
    const gateX = window.GAME_CONSTANTS.LEVEL_LENGTH - 180; // 10,060
    const sx = gateX - camX;
    if (sx < -120 || sx > 1400) return;

    const locked = game.activeBoss && !game.activeBoss.dead;
    const gateColor = locked ? '#ff2255' : '#00ff88';

    this.withNeon(gateColor, 18, 3, (c) => {
      // Top and bottom gate pylons
      c.strokeRect(sx - 20, 85, 40, 90);
      c.strokeRect(sx - 20, 560, 40, 95);

      // Energy beam between pylons
      c.beginPath();
      for (let y = 175; y < 560; y += 28) {
        const offset = Math.sin(game.time * 8 + y * 0.1) * 10;
        c.moveTo(sx + offset, y);
        c.lineTo(sx - offset, y + 18);
      }
      c.stroke();

      c.font = 'bold 14px "Courier New", monospace';
      c.textAlign = 'center';
      c.fillText(locked ? 'LOCKED (DEFEAT BOSS)' : 'SECTOR EXIT GATE >>>', sx, 110);
    });
  }

  renderPlayer(player, camX, time) {
    const sx = player.worldX - camX;
    const sy = player.y;

    // Blink during invulnerability
    if (player.invulnTimer > 0 && Math.floor(time * 16) % 2 === 0) {
      return;
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(player.tilt);

    // Thruster flame cone
    const flameLen = 18 + Math.sin(time * 45) * 8;
    this.withNeon('#ffaa00', 14, 2, (c) => {
      c.beginPath();
      c.moveTo(-22, -6);
      c.lineTo(-22 - flameLen, 0);
      c.lineTo(-22, 6);
      c.stroke();
    });

    // Main Spacejet Neon Line-Art Hull
    const hullColor = player.weaponTier === 3 ? '#ffee00' : (player.weaponTier === 2 ? '#00ffaa' : '#00f3ff');
    this.withNeon(hullColor, 15, 2.4, (c) => {
      c.beginPath();
      c.moveTo(28, 0);        // Nose cone
      c.lineTo(6, -10);       // Upper fuselage
      c.lineTo(-16, -18);     // Top swept wingtip
      c.lineTo(-24, -8);      // Upper tail
      c.lineTo(-18, 0);       // Center exhaust notch
      c.lineTo(-24, 8);       // Lower tail
      c.lineTo(-16, 18);      // Bottom swept wingtip
      c.lineTo(6, 10);        // Lower fuselage
      c.closePath();
      c.stroke();

      // Cockpit canopy vector lines
      c.beginPath();
      c.moveTo(14, 0);
      c.lineTo(0, -5);
      c.lineTo(-6, 0);
      c.lineTo(0, 5);
      c.closePath();
      c.stroke();
    });

    // Hexagonal Neon Shield Bubble if active
    if (player.shieldHp > 0) {
      const shieldColor = player.shieldHp >= 2 ? '#00ffff' : '#0088ff';
      this.withNeon(shieldColor, 16, 2, (c) => {
        c.globalAlpha = 0.55 + Math.sin(time * 6) * 0.2;
        c.beginPath();
        const sides = 6;
        const rad = 34;
        for (let i = 0; i <= sides; i++) {
          const a = (i / sides) * Math.PI * 2 + time * 1.5;
          const px = Math.cos(a) * rad;
          const py = Math.sin(a) * rad * 0.78;
          if (i === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.stroke();
      });
    }

    ctx.restore();
  }

  renderBullet(b, camX) {
    const sx = b.x - camX;
    const sy = b.y;
    this.withNeon(b.color, 12, 2.5, (c) => {
      if (b.isEnemy) {
        if (b.kind === 'boss_missile') {
          const angle = Math.atan2(b.vy, b.vx);
          c.save();
          c.translate(sx, sy);
          c.rotate(angle);
          // Missile warhead & fins
          c.beginPath();
          c.moveTo(11, 0);
          c.lineTo(2, -4.5);
          c.lineTo(-7, -4.5);
          c.lineTo(-10, -7.5);
          c.lineTo(-8, 0);
          c.lineTo(-10, 7.5);
          c.lineTo(-7, 4.5);
          c.lineTo(2, 4.5);
          c.closePath();
          c.stroke();
          // Exhaust flare
          c.strokeStyle = '#ffee00';
          c.beginPath();
          c.moveTo(-8, -2);
          c.lineTo(-15 - Math.random() * 5, 0);
          c.lineTo(-8, 2);
          c.stroke();
          c.restore();
        } else if (b.kind === 'lightning') {
          c.beginPath();
          c.moveTo(sx - 8, sy - 8);
          c.lineTo(sx + 2, sy);
          c.lineTo(sx - 2, sy + 4);
          c.lineTo(sx + 8, sy + 8);
          c.stroke();
        } else {
          c.beginPath();
          c.arc(sx, sy, 5, 0, Math.PI * 2);
          c.stroke();
        }
      } else if (b.kind === 'seeker') {
        c.beginPath();
        c.moveTo(sx + 8, sy);
        c.lineTo(sx - 6, sy - 4);
        c.lineTo(sx - 6, sy + 4);
        c.closePath();
        c.stroke();
      } else if (b.kind === 'plasma') {
        c.strokeRect(sx - 10, sy - 3, 20, 6);
      } else {
        c.beginPath();
        c.moveTo(sx - 12, sy);
        c.lineTo(sx + 12, sy);
        c.stroke();
      }
    });
  }

  renderPowerUp(p, camX, time) {
    const sx = p.x - camX;
    const sy = p.y;
    if (sx < -50 || sx > 1330) return;

    const color = p.type === 'shield' ? '#00f3ff' : (p.type === 'double_shot' ? '#ff44ff' : '#00ff88');
    const label = p.type === 'shield' ? 'SHIELD' : (p.type === 'double_shot' ? '2X SHOT' : '1-UP');

    this.withNeon(color, 16, 2, (c) => {
      c.save();
      c.translate(sx, sy);
      c.rotate(time * 2);
      c.strokeRect(-13, -13, 26, 26);
      c.rotate(Math.PI / 4);
      c.strokeRect(-11, -11, 22, 22);
      c.restore();

      c.font = 'bold 11px "Courier New", monospace';
      c.textAlign = 'center';
      c.fillText(label, sx, sy - 20);
    });
  }

  renderEnemy(e, camX, time) {
    const sx = e.x - camX;
    const sy = e.y;
    const col = e.hitFlash > 0 ? '#ffffff' : e.color;

    this.withNeon(col, 14, 2.2, (c) => {
      c.save();
      c.translate(sx, sy);

      if (e.type === 'target_drone' || e.type === 'holo_ring') {
        // Concentric Flight School Target Rings
        c.beginPath();
        c.arc(0, 0, e.radius, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.arc(0, 0, e.radius * 0.5, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.moveTo(-e.radius - 5, 0);
        c.lineTo(e.radius + 5, 0);
        c.moveTo(0, -e.radius - 5);
        c.lineTo(0, e.radius + 5);
        c.stroke();
      } else if (e.type === 'radar_jammer' || e.type === 'radar_core') {
        // Rotating Radar Dish / Jammer Tower
        const r = e.radius;
        c.strokeRect(-r * 0.6, -r, r * 1.2, r * 2);
        c.beginPath();
        c.arc(0, -r * 0.3, r * 0.85, Math.PI * 0.15, Math.PI * 0.85);
        c.stroke();
        // Radar wave arcs
        const pulse = (time * 30) % 24;
        c.beginPath();
        c.arc(0, -r * 0.5, 8 + pulse, Math.PI * 1.15, Math.PI * 1.85);
        c.stroke();

        c.font = 'bold 11px "Courier New", monospace';
        c.textAlign = 'center';
        c.fillText(e.type === 'radar_core' ? 'RADAR CORE' : 'JAMMER', 0, -r - 10);
      } else if (e.type === 'human_shuttle') {
        // Friendly Human Evacuation Shuttle at Airport
        c.beginPath();
        c.moveTo(32, 0);
        c.lineTo(10, -14);
        c.lineTo(-26, -18);
        c.lineTo(-26, 18);
        c.lineTo(10, 14);
        c.closePath();
        c.stroke();
        c.font = 'bold 11px "Courier New", monospace';
        c.textAlign = 'center';
        c.fillText(e.launched ? 'ESCAPING!' : 'HUMAN SHUTTLE', 0, -24);
      } else if (e.type === 'prison_cage') {
        // Neon Laser Prison Cell with captive human figure inside
        c.strokeRect(-26, -26, 52, 52);
        for (let bx = -14; bx <= 14; bx += 14) {
          c.beginPath();
          c.moveTo(bx, -26);
          c.lineTo(bx, 26);
          c.stroke();
        }
        // Stick human inside
        c.strokeStyle = '#00ffaa';
        c.beginPath();
        c.arc(0, -6, 5, 0, Math.PI * 2);
        c.moveTo(0, -1);
        c.lineTo(0, 12);
        c.moveTo(-8, 4);
        c.lineTo(8, 4);
        c.stroke();
        c.font = 'bold 11px "Courier New", monospace';
        c.textAlign = 'center';
        c.fillText('PRISON CAGE', 0, -32);
      } else if (e.type === 'rescued_human') {
        // Jetpack human waving for pickup
        c.beginPath();
        c.arc(0, -8, 5, 0, Math.PI * 2);
        c.moveTo(0, -3);
        c.lineTo(0, 9);
        c.moveTo(-9, -2);
        c.lineTo(9, -2);
        c.moveTo(0, 9);
        c.lineTo(-6, 18);
        c.moveTo(0, 9);
        c.lineTo(6, 18);
        c.stroke();
        c.font = 'bold 10px "Courier New", monospace';
        c.textAlign = 'center';
        c.fillText('RESCUE ME!', 0, -18);
      } else if (e.type === 'tesla_coil') {
        // Giant Army Base Tesla Coil Tower
        c.beginPath();
        c.moveTo(-22, 34);
        c.lineTo(-10, -22);
        c.lineTo(10, -22);
        c.lineTo(22, 34);
        c.closePath();
        c.stroke();
        // Toroid top rings
        c.strokeRect(-20, -30, 40, 8);
        c.beginPath();
        c.arc(0, -36, 12, 0, Math.PI * 2);
        c.stroke();
        // Crackling lightning arcs around the top
        c.beginPath();
        for (let i = 0; i < 3; i++) {
          const a = time * 10 + i * 2.1;
          c.moveTo(0, -36);
          c.lineTo(Math.cos(a) * 28, -36 + Math.sin(a) * 28);
        }
        c.stroke();
        c.font = 'bold 11px "Courier New", monospace';
        c.textAlign = 'center';
        c.fillText('TESLA COIL', 0, -54);
      } else {
        // Alien Interceptor / Patrol Ship / Royal Guard / Escaping Runner
        c.beginPath();
        c.moveTo(-24, 0);
        c.lineTo(10, -18);
        c.lineTo(22, -8);
        c.lineTo(12, 0);
        c.lineTo(22, 8);
        c.lineTo(10, 18);
        c.closePath();
        c.stroke();

        if (e.type === 'escaping_patrol') {
          c.font = 'bold 11px "Courier New", monospace';
          c.textAlign = 'center';
          c.fillText('WARP RUNNER!', 0, -26);
        }
      }

      c.restore();
    });
  }

  renderBoss(boss, camX, time) {
    const sx = boss.x - camX;
    const sy = boss.y;
    const col = boss.hitFlash > 0 ? '#ffffff' : boss.color;

    this.withNeon(col, 20, 3, (c) => {
      c.save();
      c.translate(sx, sy);

      const r = boss.radius;
      if (boss.type === 'alien_king') {
        // Giant UFO Command Palace Mothership + Alien King Crown
        c.beginPath();
        c.ellipse(0, 10, r * 1.15, r * 0.45, 0, 0, Math.PI * 2);
        c.stroke();

        // Dome
        c.beginPath();
        c.arc(0, 2, r * 0.6, Math.PI, 0);
        c.stroke();

        // Neon Gold Crown atop the UFO Dome
        c.strokeStyle = '#ffcc00';
        c.beginPath();
        c.moveTo(-36, -r * 0.52);
        c.lineTo(-28, -r * 0.88);
        c.lineTo(-12, -r * 0.62);
        c.lineTo(0, -r * 0.98);
        c.lineTo(12, -r * 0.62);
        c.lineTo(28, -r * 0.88);
        c.lineTo(36, -r * 0.52);
        c.closePath();
        c.stroke();
      } else {
        // Octagonal Dreadnought / Mecha Core
        c.beginPath();
        for (let i = 0; i <= 8; i++) {
          const a = (i / 8) * Math.PI * 2 + time * 0.8;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.stroke();

        c.strokeRect(-r * 0.55, -r * 0.55, r * 1.1, r * 1.1);
        c.beginPath();
        c.arc(0, 0, r * 0.3, 0, Math.PI * 2);
        c.stroke();
      }

      c.restore();

      // Boss Health Bar at top-right of playfield
      const barW = 360;
      const barH = 14;
      const bx = 880;
      const by = 92;
      c.strokeStyle = boss.color;
      c.strokeRect(bx, by, barW, barH);
      const fillW = Math.max(0, (boss.hp / boss.maxHp) * (barW - 4));
      c.fillStyle = boss.color;
      c.fillRect(bx + 2, by + 2, fillW, barH - 4);

      c.font = 'bold 13px "Courier New", monospace';
      c.textAlign = 'right';
      c.fillText(`${boss.name} [${Math.ceil(boss.hp)}/${boss.maxHp}]`, bx + barW, by - 6);
    });
  }

  // ==========================================================================
  // TOP HUD & THE 8-SCREEN RADAR MINIMAP (Unlocked in Level 3!)
  // ==========================================================================
  renderHUD(game) {
    const ctx = this.ctx;
    const p = game.player;
    const lvl = game.currentLevelData;

    ctx.save();
    // Translucent HUD Header Backing
    ctx.fillStyle = 'rgba(4, 6, 18, 0.86)';
    ctx.fillRect(0, 0, 1280, 74);
    ctx.strokeStyle = lvl.themeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 74);
    ctx.lineTo(1280, 74);
    ctx.stroke();

    // Left Panel: Pilot Rank & Name, Score, High Score (bounded before mapX = 410)
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.fillStyle = '#00f3ff';
    ctx.textAlign = 'left';
    ctx.fillText(`${lvl.rank.toUpperCase()} ${game.pilotName.toUpperCase()}`, 18, 24, 382);

    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`SCORE: ${String(game.score).padStart(7, '0')}`, 18, 46, 382);

    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#00ffaa';
    ctx.fillText(`HI: ${String(game.getTopScore()).padStart(7, '0')} | L${lvl.number}/10: ${lvl.title}`, 18, 65, 382);

    // Center Panel: LONG-RANGE RADAR MINIMAP (x: 410..870, width 460, height 56)
    const mapX = 410;
    const mapY = 9;
    const mapW = 460;
    const mapH = 56;

    ctx.strokeStyle = game.radarUnlocked ? '#00ff88' : '#ff2255';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    if (!game.radarUnlocked) {
      // Levels 1, 2, and early Level 3 before Radar Station is freed
      ctx.fillStyle = 'rgba(40, 0, 20, 0.75)';
      ctx.fillRect(mapX + 2, mapY + 2, mapW - 4, mapH - 4);
      ctx.fillStyle = '#ff3366';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ RADAR JAMMED // FREE RADAR STATION IN SECTOR 3 ]', mapX + mapW / 2, mapY + 25, mapW - 16);

      const prog = Math.min(1, p.worldX / window.GAME_CONSTANTS.LEVEL_LENGTH);
      ctx.strokeStyle = '#ff3366';
      ctx.strokeRect(mapX + 40, mapY + 36, mapW - 80, 10);
      ctx.fillStyle = '#ff3366';
      ctx.fillRect(mapX + 42, mapY + 38, (mapW - 84) * prog, 6);
    } else {
      // FULL LIVE NEON RADAR MINIMAP!
      ctx.fillStyle = 'rgba(0, 28, 18, 0.8)';
      ctx.fillRect(mapX + 2, mapY + 2, mapW - 4, mapH - 4);

      ctx.strokeStyle = 'rgba(0, 255, 136, 0.25)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 8; i++) {
        const gx = mapX + (i / 8) * mapW;
        ctx.beginPath();
        ctx.moveTo(gx, mapY);
        ctx.lineTo(gx, mapY + mapH);
        ctx.stroke();
      }

      const scaleX = mapW / window.GAME_CONSTANTS.LEVEL_LENGTH;
      const scaleY = mapH / 720;

      // Current 1280px camera viewport box on the minimap
      ctx.strokeStyle = '#00f3ff';
      ctx.strokeRect(mapX + game.cameraX * scaleX, mapY + 2, 1280 * scaleX, mapH - 4);

      // Plot Enemies & Objectives on Minimap
      for (const e of game.enemies) {
        if (e.dead) continue;
        // In Level 1 Flight School, alien ambush ships have not dropped out of warp yet!
        if (lvl.number === 1 && e.type === 'scout_fighter') continue;
        const ex = mapX + e.x * scaleX;
        const ey = mapY + e.y * scaleY;
        ctx.fillStyle = e.isFriendly ? '#00ffff' : e.color;
        ctx.fillRect(ex - 1.5, ey - 1.5, 3, 3);
      }

      // Plot Boss on Minimap
      if (game.activeBoss && !game.activeBoss.dead) {
        const bx = mapX + game.activeBoss.x * scaleX;
        const by = mapY + game.activeBoss.y * scaleY;
        ctx.fillStyle = '#ff1155';
        ctx.fillRect(bx - 3, by - 3, 6, 6);
      }

      // Plot Player Spacejet on Minimap
      const px = mapX + p.worldX * scaleX;
      const py = mapY + p.y * scaleY;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 2.5, py - 2.5, 5, 5);

      ctx.font = 'bold 10px "Courier New", monospace';
      ctx.fillStyle = '#00ff88';
      ctx.textAlign = 'left';
      ctx.fillText(lvl.number === 1 ? 'ACADEMY TRAINING MINIMAP ONLINE' : 'LONG-RANGE MINIMAP ONLINE', mapX + 6, mapY + 12);
    }

    // Right Panel: Lives (Max 3), Shield (Max 5), Weapon Tier, Double Shot, Overdrive
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = '#00ff88';
    ctx.fillText(`LIVES: ${'▲'.repeat(Math.max(0, p.lives))} (${p.lives}/3)`, 885, 23);

    ctx.fillStyle = '#00f3ff';
    ctx.fillText(`SHIELD: ${'◆'.repeat(Math.max(0, p.shieldHp)) || '0'} (${p.shieldHp}/5)`, 1055, 23, 210);

    const weaponNames = ['LV1 PULSE LASER', 'LV2 HEAVY PLASMA', 'LV3 SEEKER + SPREAD'];
    ctx.fillStyle = '#ffaa00';
    ctx.fillText(`WPN: ${weaponNames[p.weaponTier - 1]}`, 885, 44, 235);

    if (p.doubleShotTimer > 0) {
      ctx.fillStyle = '#ff44ff';
      ctx.fillText(`2X SHOT: ${Math.ceil(p.doubleShotTimer)}s`, 1130, 44, 138);
    }

    // EMP Overdrive Charge & Active Controller Indicator
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = p.overdriveCharge >= 100 ? '#00ffff' : '#88aabb';
    ctx.fillText(
      `EMP [X/B]: ${Math.floor(p.overdriveCharge)}%  |  CTRL: ${window.input.lastActiveDevice}`,
      885,
      64,
      380
    );

    // Radio Transmission Banner (Bottom of screen when active, wrapped cleanly inside box)
    if (game.radioBanner && game.radioBanner.timer > 0) {
      const rb = game.radioBanner;
      ctx.save();
      const boxX = 160;
      const boxY = 612;
      const boxW = 960;
      const boxH = 68;

      ctx.fillStyle = 'rgba(4, 10, 26, 0.92)';
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillStyle = '#ffaa00';
      ctx.textAlign = 'left';
      ctx.fillText(`[TRANSMISSION // ${rb.speaker}]`, boxX + 18, boxY + 19, boxW - 36);

      ctx.font = '14px "Courier New", monospace';
      ctx.fillStyle = '#ffffff';
      this.drawLeftWrappedText(ctx, rb.text, boxX + 18, boxY + 40, boxW - 36, 18, 2);
      ctx.restore();
    }

    ctx.restore();
  }

  drawLeftWrappedText(ctx, text, startX, startY, maxWidth, lineHeight, maxLines = 2) {
    const words = String(text).split(' ');
    let line = '';
    let y = startY;
    let lineCount = 0;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      if (ctx.measureText(testLine).width > maxWidth && i > 0) {
        lineCount++;
        if (lineCount >= maxLines) {
          ctx.fillText(line.trim() + '...', startX, y, maxWidth);
          return;
        }
        ctx.fillText(line.trim(), startX, y, maxWidth);
        line = words[i] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      ctx.fillText(line.trim(), startX, y, maxWidth);
    }
  }

  renderMedalIcon(icon, cx, cy, r, color, unlocked = true, showOuterRing = true) {
    const drawColor = unlocked ? color : '#4a5a6e';
    const blur = unlocked ? Math.max(8, r * 0.65) : 0;
    const lw = r >= 18 ? 2.0 : (unlocked ? 1.8 : 1.3);

    this.withNeon(drawColor, blur, lw, (c) => {
      c.save();
      c.translate(cx, cy);
      c.globalAlpha = unlocked ? 1.0 : 0.42;

      if (showOuterRing) {
        if (unlocked) {
          c.save();
          c.globalAlpha = 0.16;
          c.beginPath();
          c.arc(0, 0, r, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }

        // Medal outer medallion circle
        c.beginPath();
        c.arc(0, 0, r, 0, Math.PI * 2);
        c.stroke();

        // Subtle inner rim for larger Victory Screen medals
        if (r >= 18) {
          c.save();
          c.globalAlpha = unlocked ? 0.35 : 0.2;
          c.lineWidth = 1;
          c.beginPath();
          c.arc(0, 0, r * 0.82, 0, Math.PI * 2);
          c.stroke();
          c.restore();
        }
      }

      const s = showOuterRing ? r * 0.58 : r * 0.85;

      switch (icon) {
        case 'WINGS': {
          // Central flight diamond + swept pilot wings
          c.beginPath();
          c.moveTo(0, -s * 0.65);
          c.lineTo(s * 0.28, 0);
          c.lineTo(0, s * 0.65);
          c.lineTo(-s * 0.28, 0);
          c.closePath();
          c.stroke();

          // Left swept wing
          c.beginPath();
          c.moveTo(-s * 0.26, -s * 0.12);
          c.lineTo(-s * 1.08, -s * 0.52);
          c.lineTo(-s * 0.82, s * 0.08);
          c.lineTo(-s * 0.96, s * 0.38);
          c.lineTo(-s * 0.24, s * 0.25);
          c.stroke();

          // Right swept wing
          c.beginPath();
          c.moveTo(s * 0.26, -s * 0.12);
          c.lineTo(s * 1.08, -s * 0.52);
          c.lineTo(s * 0.82, s * 0.08);
          c.lineTo(s * 0.96, s * 0.38);
          c.lineTo(s * 0.24, s * 0.25);
          c.stroke();
          break;
        }

        case 'RADAR': {
          // Radar sweep screen with crosshair & target blip
          c.beginPath();
          c.arc(0, 0, s * 0.85, 0, Math.PI * 2);
          c.stroke();

          c.beginPath();
          c.arc(0, 0, s * 0.42, 0, Math.PI * 2);
          c.stroke();

          // Sweep line
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(s * 0.62, -s * 0.62);
          c.stroke();

          // Target blip dot
          c.beginPath();
          c.arc(s * 0.32, -s * 0.34, Math.max(1.5, s * 0.16), 0, Math.PI * 2);
          c.fill();
          break;
        }

        case 'WEAPON': {
          // Heavy Arsenal Crosshair / Plasma Cross
          const arm = s * 0.88;
          const w = s * 0.28;
          c.beginPath();
          c.moveTo(-w, -arm);
          c.lineTo(w, -arm);
          c.lineTo(w, -w);
          c.lineTo(arm, -w);
          c.lineTo(arm, w);
          c.lineTo(w, w);
          c.lineTo(w, arm);
          c.lineTo(-w, arm);
          c.lineTo(-w, w);
          c.lineTo(-arm, w);
          c.lineTo(-arm, -w);
          c.lineTo(-w, -w);
          c.closePath();
          c.stroke();
          break;
        }

        case 'HEART': {
          // Neon Vector Heart (Savior of Humanity)
          c.beginPath();
          c.moveTo(0, s * 0.82);
          c.bezierCurveTo(-s * 1.15, s * 0.15, -s * 0.95, -s * 0.85, 0, -s * 0.28);
          c.bezierCurveTo(s * 0.95, -s * 0.85, s * 1.15, s * 0.15, 0, s * 0.82);
          c.closePath();
          c.stroke();
          break;
        }

        case 'BOLT': {
          // High-voltage Lightning Bolt (Tesla Stormbreaker)
          c.beginPath();
          c.moveTo(s * 0.22, -s * 0.95);
          c.lineTo(-s * 0.55, s * 0.06);
          c.lineTo(s * 0.05, s * 0.06);
          c.lineTo(-s * 0.25, s * 0.95);
          c.lineTo(s * 0.58, -s * 0.08);
          c.lineTo(-s * 0.02, -s * 0.08);
          c.closePath();
          c.stroke();
          break;
        }

        case 'CROWN': {
          // 3-spiked Royal Crown (Order of the Regicide)
          c.beginPath();
          c.moveTo(-s * 0.78, s * 0.58);
          c.lineTo(-s * 0.92, -s * 0.38);
          c.lineTo(-s * 0.38, s * 0.12);
          c.lineTo(0, -s * 0.75);
          c.lineTo(s * 0.38, s * 0.12);
          c.lineTo(s * 0.92, -s * 0.38);
          c.lineTo(s * 0.78, s * 0.58);
          c.closePath();
          c.stroke();

          // Crown base band
          c.beginPath();
          c.moveTo(-s * 0.72, s * 0.32);
          c.lineTo(s * 0.72, s * 0.32);
          c.stroke();
          break;
        }

        case 'SHIELD': {
          // Forcefield Crest Shield (Neon Untouchable Ace)
          c.beginPath();
          c.moveTo(0, -s * 0.88);
          c.lineTo(s * 0.78, -s * 0.52);
          c.lineTo(s * 0.68, s * 0.22);
          c.lineTo(0, s * 0.92);
          c.lineTo(-s * 0.68, s * 0.22);
          c.lineTo(-s * 0.78, -s * 0.52);
          c.closePath();
          c.stroke();

          // Inner chevron
          c.beginPath();
          c.moveTo(-s * 0.42, -s * 0.15);
          c.lineTo(0, s * 0.35);
          c.lineTo(s * 0.42, -s * 0.15);
          c.stroke();
          break;
        }

        case 'STAR':
        default: {
          // 5-Pointed Grand Fleet Admiral Star
          c.beginPath();
          const spikes = 5;
          const outerR = s * 0.92;
          const innerR = s * 0.38;
          for (let i = 0; i < spikes * 2; i++) {
            const rad = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const px = Math.cos(angle) * rad;
            const py = Math.sin(angle) * rad;
            if (i === 0) c.moveTo(px, py);
            else c.lineTo(px, py);
          }
          c.closePath();
          c.stroke();
          break;
        }
      }

      c.restore();
    });
  }
}

window.NeonRenderer = NeonRenderer;
