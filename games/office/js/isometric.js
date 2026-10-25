/**
 * Office - Isometric 2.5D School Office, Larger Back Room with Throughput Door,
 * Wall-Mounted Signs, Check-In Desk on Right, L-Shaped Right-Angle Queue & Coffee Stand
 */

class IsometricOfficeScene {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.width = 800;
    this.height = 600;
    this.dpr = window.devicePixelRatio || 1;

    // Isometric projection parameters
    this.zoom = 1.26;
    this.originX = 400;
    this.originY = 70;
    this.tileW = 54;
    this.tileH = 27;

    // State synced with Game
    this.day = 1;
    this.maxDays = 20;
    this.currentIndex = 0;
    this.queue = [];
    this.coffeesLeft = 2;
    this.happiness = 105;

    // Animated entities
    this.walkingActors = [];
    this.floatingTexts = [];
    this.steamParticles = [];

    // Partition Door (Lobby -> Back Room) animation state
    this.doorOpenAmount = 0;
    this.doorTargetOpen = 0;
    this.doorLightStatus = 'standby'; // 'standby' | 'allow' | 'deny'
    this.doorLightTimer = 0;

    // Back Room Throughput Door (Back Room -> Classrooms) animation state
    this.backDoorOpenAmount = 0;

    // Officer coffee drinking animation timer
    this.officerDrinkingTimer = 0;

    // Interactive hit-box for Coffee Machine & Stand in screen coordinates
    this.coffeeHitBox = { x: 0, y: 0, w: 0, h: 0 };
    this.hoveringCoffee = false;
    this.onCoffeeClick = null;

    this.setupEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setupEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const b = this.coffeeHitBox;
      this.hoveringCoffee = (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h);
      this.canvas.style.cursor = (this.hoveringCoffee && this.coffeesLeft > 0) ? 'pointer' : 'default';
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const b = this.coffeeHitBox;
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        if (typeof this.onCoffeeClick === 'function') {
          this.onCoffeeClick();
        }
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      this.setZoom(this.zoom + delta);
    }, { passive: false });
  }

  setZoom(newZoom) {
    this.zoom = Math.max(0.95, Math.min(1.75, newZoom));
    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (!parent) return;
    this.dpr = window.devicePixelRatio || 1;
    this.width = parent.clientWidth || 720;
    this.height = parent.clientHeight || 580;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;

    const baseScale = Math.min(this.width / 700, this.height / 560);
    this.tileW = Math.max(36, Math.min(76, 44 * baseScale * this.zoom));
    this.tileH = this.tileW * 0.5;

    this.originX = this.width * 0.52;
    this.originY = this.height * 0.50 - (5.6 + 6.3) * (this.tileH * 0.5) + 0.5 * this.tileH;
  }

  isoToScreen(gx, gy, gz = 0) {
    const sx = this.originX + (gx - gy) * (this.tileW * 0.5);
    const sy = this.originY + (gx + gy) * (this.tileH * 0.5) - gz * (this.tileH * 1.15);
    return { x: sx, y: sy };
  }

  syncState(state) {
    this.day = state.day;
    this.maxDays = state.maxDays || 20;
    this.currentIndex = state.currentIndex;
    this.queue = state.queue || [];
    this.coffeesLeft = state.coffeesLeft;
    this.happiness = state.happiness;

    if (this.coffeesLeft <= 0) {
      this.steamParticles = [];
    }
  }

  resetDayActors() {
    this.walkingActors = [];
    this.doorOpenAmount = 0;
    this.doorTargetOpen = 0;
    this.backDoorOpenAmount = 0;
    this.doorLightStatus = 'standby';
  }

  triggerDecisionAnimation(teacher, allowed, wasCorrect) {
    if (!teacher) return;

    if (allowed) {
      this.doorTargetOpen = 1;
      this.doorLightStatus = 'allow';
      this.doorLightTimer = 1.6;

      // Teacher walks from Check-In Desk (7.4, 7.7) -> through School Office Door (6.0, 4.8)
      // -> across the Back Room -> and exits through the Back Throughput Door (2.6, 0.2)!
      this.walkingActors.push({
        teacher,
        allowed: true,
        wasCorrect,
        progress: 0,
        speed: 0.58,
        waypoints: [
          { gx: 7.4, gy: 7.7 },
          { gx: 6.1, gy: 5.4 },
          { gx: 6.1, gy: 3.6 },
          { gx: 2.6, gy: 2.0 },
          { gx: 2.6, gy: 0.2 }
        ]
      });

      const deskPos = this.isoToScreen(7.8, 7.4, 2.3);
      if (wasCorrect) {
        this.addFloatingText('✓ ALLOWED (+100)', deskPos.x, deskPos.y, '#22c55e');
      } else {
        this.addFloatingText('⚠ BREACH! (-10 😡)', deskPos.x, deskPos.y, '#ef4444');
      }
    } else {
      this.doorTargetOpen = 0;
      this.doorLightStatus = 'deny';
      this.doorLightTimer = 1.4;

      this.walkingActors.push({
        teacher,
        allowed: false,
        wasCorrect,
        progress: 0,
        speed: 0.95,
        waypoints: [
          { gx: 7.4, gy: 7.7 },
          { gx: 5.5, gy: 9.4 },
          { gx: 5.2, gy: 12.3 }
        ]
      });

      const deskPos = this.isoToScreen(7.4, 7.7, 2.3);
      if (wasCorrect) {
        this.addFloatingText('🛡️ DENIED! (+150)', deskPos.x, deskPos.y, '#facc15');
      } else {
        this.addFloatingText('✕ VALID DENIED! (-5 😭)', deskPos.x, deskPos.y, '#f97316');
      }
    }
  }

  triggerCoffeeAnimation() {
    this.officerDrinkingTimer = 1.8;
    const coffeePos = this.isoToScreen(9.6, 5.5, 2.4);
    this.addFloatingText('☕ +8 HAPPINESS!', coffeePos.x, coffeePos.y, '#fbbf24');
    if (this.coffeesLeft > 0) {
      for (let i = 0; i < 8; i++) {
        this.steamParticles.push({
          x: coffeePos.x + (Math.random() - 0.5) * 18,
          y: coffeePos.y + 8,
          vy: -24 - Math.random() * 14,
          alpha: 0.85,
          size: 4 + Math.random() * 4
        });
      }
    } else {
      this.steamParticles = [];
    }
  }

  addFloatingText(text, x, y, color = '#ffffff') {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -34,
      alpha: 1.0,
      color
    });
  }

  update(dt) {
    if (this.doorLightTimer > 0) {
      this.doorLightTimer -= dt;
      if (this.doorLightTimer <= 0) {
        this.doorTargetOpen = 0;
        this.doorLightStatus = 'standby';
      }
    }
    this.doorOpenAmount += (this.doorTargetOpen - this.doorOpenAmount) * Math.min(1, dt * 8);

    if (this.officerDrinkingTimer > 0) {
      this.officerDrinkingTimer = Math.max(0, this.officerDrinkingTimer - dt);
    }

    let backDoorTarget = 0;
    for (let i = this.walkingActors.length - 1; i >= 0; i--) {
      const actor = this.walkingActors[i];
      actor.progress += dt * (actor.speed || 0.8);
      if (actor.allowed && actor.progress > 0.62 && actor.progress < 0.98) {
        backDoorTarget = 1;
      }
      if (actor.progress >= 1) {
        this.walkingActors.splice(i, 1);
      }
    }
    this.backDoorOpenAmount += (backDoorTarget - this.backDoorOpenAmount) * Math.min(1, dt * 8);

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 0.65;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Steam rises ONLY when coffee is available; stops when empty
    if (this.coffeesLeft > 0) {
      if (Math.random() < 0.22) {
        const p = this.isoToScreen(9.6, 5.4, 2.05);
        this.steamParticles.push({
          x: p.x + (Math.random() - 0.5) * 8,
          y: p.y,
          vy: -18 - Math.random() * 10,
          alpha: 0.65,
          size: 3 + Math.random() * 3.5
        });
      }
      for (let i = this.steamParticles.length - 1; i >= 0; i--) {
        const sp = this.steamParticles[i];
        sp.y += sp.vy * dt;
        sp.alpha -= dt * 0.55;
        if (sp.alpha <= 0) {
          this.steamParticles.splice(i, 1);
        }
      }
    } else {
      this.steamParticles = [];
    }
  }

  render(timeSec) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    // 1. Exterior Sky Backdrop
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#bae6fd');
    skyGrad.addColorStop(0.55, '#7dd3fc');
    skyGrad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Building footprint drop shadow
    this.drawPoly(ctx, [
      this.isoToScreen(0.2, 0.2, -0.35),
      this.isoToScreen(11.4, 0.2, -0.35),
      this.isoToScreen(11.4, 12.8, -0.35),
      this.isoToScreen(0.2, 12.8, -0.35)
    ], 'rgba(15, 23, 42, 0.22)');

    // 2. Floor Platform Slab
    this.drawIsoPrism(ctx, 0, 0, -0.25, 11.2, 12.6, 0.25, '#cbd5e1', '#94a3b8', '#64748b');

    // 3. Floor Zones:
    // Zone A: Larger Back Room (gy: 0 to 4.8, gx: 0 to 11.2)
    this.drawFloorTiles(ctx, 0, 0, 11.2, 4.8, '#fef3c7', '#fde68a', '#d97706');
    this.drawFloorTiles(ctx, 2.0, 0, 3.3, 2.4, '#fde68a', '#fcd34d', '#d97706');

    // Zone B: Spacious Reception & Queue Lobby (gy: 4.8 to 12.6, gx: 0 to 11.2)
    this.drawFloorTiles(ctx, 0, 4.8, 11.2, 12.6, '#e2e8f0', '#cbd5e1', '#94a3b8');
    // Deep teal carpet zone under the Check-In Desk on the Right (gx: 7.8 to 11.2, gy: 4.8 to 10.2)
    this.drawFloorTiles(ctx, 7.8, 4.8, 11.2, 10.2, '#0284c7', '#0369a1', '#075985');

    // L-Shaped Right-Angle Red Carpet Runner for the Queue:
    this.drawFloorTiles(ctx, 2.3, 7.1, 3.7, 12.6, '#dc2626', '#b91c1c', '#991b1b');
    this.drawFloorTiles(ctx, 2.3, 7.1, 8.2, 8.4, '#dc2626', '#b91c1c', '#991b1b');

    // 4. Cutaway Outer Walls (Back-Right Wall at gy=0, Back-Left Wall at gx=0)
    this.drawBackWallWithThroughputDoor(ctx, timeSec);
    this.drawIsoPrism(ctx, 0, 0, 0, 0.26, 12.6, 3.8, '#f8fafc', '#cbd5e1', '#e2e8f0');

    // 5. Back Room Lockers & Furniture
    this.drawBackRoomContents(ctx, timeSec);

    // 6. Actors currently inside the Back Room (gy < 4.8), depth-sorted
    const backRoomActors = this.walkingActors
      .map(actor => ({ actor, pos: this.interpolateWaypoints(actor.waypoints, actor.progress) }))
      .filter(item => item.pos.gy < 4.85)
      .sort((a, b) => (a.pos.gx + a.pos.gy) - (b.pos.gx + b.pos.gy));

    backRoomActors.forEach(({ actor, pos }) => {
      const bob = Math.abs(Math.sin(actor.progress * Math.PI * 8)) * 0.16;
      this.drawIsoCharacter(ctx, pos.gx, pos.gy, bob, actor.teacher, timeSec * 3, {
        facing: 'up_lobby',
        showSneaky: !actor.wasCorrect && actor.allowed
      });
    });

    // 7. Partition Wall at gy = 4.8 with Swinging Door & Wall-Mounted "SCHOOL OFFICE" Sign
    this.drawPartitionWallAndSign(ctx, timeSec);

    // 8. Wall-Mounted "WELCOME TO OAKRIDGE SCHOOL" Sign above the Seating Area on the Back-Left Wall!
    this.drawIsoWallSignAlongLeftWall(
      ctx,
      6.0,
      10.4,
      1.95,
      2.85,
      'WELCOME TO OAKRIDGE SCHOOL',
      '#065f46',
      '#f59e0b',
      '#fef3c7',
      0.27
    );

    // 9. Lobby Plants & Blue Seating Area along the Back-Left Wall (gx = 0.75)
    this.drawLobbyProps(ctx);

    // 10. Coffee Machine & Stand (with Coffee Bean icon on Stand + Red/Green Indicator Light)
    this.drawCoffeeMachineAndStand(ctx, timeSec);

    // 11. Queue Stanchion Posts framing the L-shaped right-angle queue
    this.drawQueueBarriers(ctx);

    // 12. Lobby Queuers & Lobby Walking Actors (drawn BEFORE the Check-In Desk & Guard because desk/guard have higher gx+gy!)
    this.drawDepthSortedLobbyCharacters(ctx, timeSec);

    // 13. Check-In Desk on the Right (gx = 8.25..9.2, gy = 6.7..8.8, depth = 16.45)
    // Drawn AFTER the first queuer (gx = 7.45, gy = 7.7, depth = 15.15) so the desk is properly in front-right of the queuer!
    this.drawCheckInDeskOnRight(ctx, timeSec);

    // 14. Security Officer / Guard (gx = 9.65, gy = 7.75, depth = 17.40)
    // Drawn AFTER the Check-In Desk so the Guard sits in front-right of the desk in true isometric perspective!
    this.drawSecurityOfficer(ctx, timeSec);

    // 15. Steam & Floating Feedback Texts
    this.renderParticlesAndTexts(ctx);

    ctx.restore();
  }

  /**
   * Draws the Back Wall (gy = 0) with the Throughput Doorway at gx = 2.0..3.3
   * and a properly fitted "CLASSROOMS ➔" plaque above it.
   */
  drawBackWallWithThroughputDoor(ctx, timeSec) {
    this.drawIsoPrism(ctx, 0, 0, 0, 2.0, 0.26, 3.8, '#f8fafc', '#e2e8f0', '#cbd5e1');

    // Dark corridor recess behind throughput door
    const r0 = this.isoToScreen(2.0, 0.02, 2.45);
    const r1 = this.isoToScreen(3.3, 0.02, 2.45);
    const r2 = this.isoToScreen(3.3, 0.02, 0);
    const r3 = this.isoToScreen(2.0, 0.02, 0);
    this.drawPoly(ctx, [r0, r1, r2, r3], '#0f172a', '#334155', 1.5);

    // Swinging Back Throughput Door leaf
    const openAng = this.backDoorOpenAmount * 1.15;
    const doorEndGx = 2.0 + Math.cos(openAng) * 1.3;
    const doorEndGy = 0.24 + Math.sin(openAng) * 0.9;
    const bd0 = this.isoToScreen(2.0, 0.24, 2.42);
    const bd1 = this.isoToScreen(doorEndGx, doorEndGy, 2.42);
    const bd2 = this.isoToScreen(doorEndGx, doorEndGy, 0);
    const bd3 = this.isoToScreen(2.0, 0.24, 0);
    this.drawPoly(ctx, [bd0, bd1, bd2, bd3], '#b45309', '#78350f', 2);

    // Door window pane
    const bw0 = this.isoToScreen(2.2, 0.24 + Math.sin(openAng) * 0.15, 2.1);
    const bw1 = this.isoToScreen(2.0 + Math.cos(openAng) * 1.05, 0.24 + Math.sin(openAng) * 0.72, 2.1);
    const bw2 = this.isoToScreen(2.0 + Math.cos(openAng) * 1.05, 0.24 + Math.sin(openAng) * 0.72, 1.25);
    const bw3 = this.isoToScreen(2.2, 0.24 + Math.sin(openAng) * 0.15, 1.25);
    this.drawPoly(ctx, [bw0, bw1, bw2, bw3], '#bae6fd', '#78350f', 1.2);

    // Lintel above the back throughput door
    this.drawIsoPrism(ctx, 2.0, 0, 2.45, 1.3, 0.26, 1.35, '#f8fafc', '#e2e8f0', '#cbd5e1');

    // Main right section of back wall (gx: 3.3 to 11.2)
    this.drawIsoPrism(ctx, 3.3, 0, 0, 7.9, 0.26, 3.8, '#f8fafc', '#e2e8f0', '#cbd5e1');

    // Well-fitted plaque above the back throughput door: "CLASSROOMS ➔"
    this.drawIsoWallSignOnBackWall(
      ctx,
      1.85,
      3.55,
      2.62,
      3.25,
      'CLASSROOMS ➔',
      '#1e293b',
      '#38bdf8',
      '#f8fafc',
      0.27
    );
  }

  /**
   * Renders a sign plaque & auto-fitted text on a wall running along the gx axis (gy = constant)
   */
  drawIsoWallSignOnBackWall(ctx, gxStart, gxEnd, gzBottom, gzTop, text, bgCol, borderCol, textCol, wallY = 0.27) {
    const pTL = this.isoToScreen(gxStart, wallY, gzTop);
    const pTR = this.isoToScreen(gxEnd, wallY, gzTop);
    const pBR = this.isoToScreen(gxEnd, wallY, gzBottom);
    const pBL = this.isoToScreen(gxStart, wallY, gzBottom);

    this.drawPoly(ctx, [pTL, pTR, pBR, pBL], bgCol, borderCol, 2);

    const center = this.isoToScreen((gxStart + gxEnd) * 0.5, wallY, (gzBottom + gzTop) * 0.5);
    const dx = pTR.x - pTL.x;
    const dy = pTR.y - pTL.y;
    const plaqueLen = Math.hypot(dx, dy) || 1;
    const ux = dx / plaqueLen;
    const uy = dy / plaqueLen;
    const wallHeightPx = Math.abs(pBL.y - pTL.y) || 18;

    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.transform(ux, uy, 0, 1, 0, 0);
    ctx.fillStyle = textCol;
    const maxFontByWidth = Math.floor((plaqueLen * 0.84) / Math.max(1, text.length * 0.58));
    const maxFontByHeight = Math.floor(wallHeightPx * 0.45);
    const fontSize = Math.max(7, Math.min(13, maxFontByWidth, maxFontByHeight));
    ctx.font = `800 ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 1, plaqueLen * 0.86);
    ctx.restore();
  }

  /**
   * Renders a sign plaque & auto-fitted text on the Left-Back Wall running along the gy axis (gx = constant),
   * such as "WELCOME TO OAKRIDGE SCHOOL" above the blue seating area!
   */
  drawIsoWallSignAlongLeftWall(ctx, gyStart, gyEnd, gzBottom, gzTop, text, bgCol, borderCol, textCol, wallX = 0.27) {
    // On the left wall, gyEnd is further left on screen and gyStart is further right on screen
    const pTL = this.isoToScreen(wallX, gyEnd, gzTop);
    const pTR = this.isoToScreen(wallX, gyStart, gzTop);
    const pBR = this.isoToScreen(wallX, gyStart, gzBottom);
    const pBL = this.isoToScreen(wallX, gyEnd, gzBottom);

    this.drawPoly(ctx, [pTL, pTR, pBR, pBL], bgCol, borderCol, 2);

    const center = this.isoToScreen(wallX, (gyStart + gyEnd) * 0.5, (gzBottom + gzTop) * 0.5);
    const dx = pTR.x - pTL.x;
    const dy = pTR.y - pTL.y;
    const plaqueLen = Math.hypot(dx, dy) || 1;
    const ux = dx / plaqueLen;
    const uy = dy / plaqueLen;
    const wallHeightPx = Math.abs(pBL.y - pTL.y) || 18;

    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.transform(ux, uy, 0, 1, 0, 0);
    ctx.fillStyle = textCol;
    const maxFontByWidth = Math.floor((plaqueLen * 0.84) / Math.max(1, text.length * 0.56));
    const maxFontByHeight = Math.floor(wallHeightPx * 0.46);
    const fontSize = Math.max(7, Math.min(13, maxFontByWidth, maxFontByHeight));
    ctx.font = `800 ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 1, plaqueLen * 0.88);
    ctx.restore();
  }

  drawBackRoomContents(ctx, timeSec) {
    // 1. Tall Sunlit Windows on Back-Right Wall (gx: 5.0..6.8 and 8.4..10.4)
    [5.0, 8.4].forEach(wx => {
      const w0 = this.isoToScreen(wx, 0.27, 3.3);
      const w1 = this.isoToScreen(wx + 1.8, 0.27, 3.3);
      const w2 = this.isoToScreen(wx + 1.8, 0.27, 0.9);
      const w3 = this.isoToScreen(wx, 0.27, 0.9);
      this.drawPoly(ctx, [w0, w1, w2, w3], '#bae6fd', '#64748b', 2);
    });

    // 2. Row of 5 School Lockers along the Left Wall of the Back Room (gx: 0.26..0.8, gy: 0.55..4.1)
    const lockerColors = ['#f97316', '#facc15', '#38bdf8', '#22c55e', '#a855f7'];
    lockerColors.forEach((col, i) => {
      this.drawIsoPrism(ctx, 0.26, 0.55 + i * 0.68, 0, 0.52, 0.62, 2.5, col, '#475569', col);
    });

    // 3. Staffroom Table & Bookshelf on the right side of the Back Room
    this.drawIsoPrism(ctx, 7.1, 0.4, 0, 1.1, 0.5, 2.5, '#78350f', '#451a03', '#b45309');
    this.drawIsoPrism(ctx, 8.2, 2.0, 0, 1.9, 1.0, 0.85, '#92400e', '#78350f', '#451a03');
  }

  /**
   * Draws the Partition Wall at gy = 4.8 with the swinging School Office Door
   * and the wall-mounted "SCHOOL OFFICE" sign!
   */
  drawPartitionWallAndSign(ctx, timeSec) {
    const wallY = 4.8;

    // Left segment of partition wall (gx: 0.26 to 5.2)
    this.drawIsoPrism(ctx, 0.26, wallY, 0, 4.94, 0.28, 3.1, '#f1f5f9', '#cbd5e1', '#94a3b8');

    // WALL-MOUNTED SIGN: "SCHOOL OFFICE" mounted flat on the left partition wall
    this.drawIsoWallSignOnBackWall(
      ctx,
      1.35,
      4.65,
      1.8,
      2.62,
      'SCHOOL OFFICE',
      '#1e293b',
      '#38bdf8',
      '#f8fafc',
      wallY + 0.29
    );

    // Overhead lintel above the School Office Door (gx: 5.2 to 6.8, gz: 2.3 to 3.1)
    this.drawIsoPrism(ctx, 5.2, wallY, 2.3, 1.6, 0.28, 0.8, '#f1f5f9', '#cbd5e1', '#94a3b8');

    // Security status light fixture mounted on the lintel above the door
    const beaconPos = this.isoToScreen(6.0, wallY + 0.3, 2.68);
    let lightCol = '#38bdf8';
    if (this.doorLightStatus === 'allow') lightCol = '#22c55e';
    if (this.doorLightStatus === 'deny') lightCol = '#ef4444';
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(beaconPos.x, beaconPos.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = lightCol;
    ctx.beginPath();
    ctx.arc(beaconPos.x, beaconPos.y, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right segment of partition wall (gx: 6.8 to 11.2)
    this.drawIsoPrism(ctx, 6.8, wallY, 0, 4.4, 0.28, 3.1, '#f1f5f9', '#cbd5e1', '#94a3b8');

    // THE SWINGING SCHOOL OFFICE DOOR (at gx: 5.2..6.8, gy: 4.8, gz: 0..2.3)
    const swingAngle = this.doorOpenAmount * 1.25;
    const doorEndGx = 5.2 + Math.cos(swingAngle) * 1.58;
    const doorEndGy = wallY + 0.14 - Math.sin(swingAngle) * 1.58;

    const d0 = this.isoToScreen(5.2, wallY + 0.14, 2.28);
    const d1 = this.isoToScreen(doorEndGx, doorEndGy, 2.28);
    const d2 = this.isoToScreen(doorEndGx, doorEndGy, 0);
    const d3 = this.isoToScreen(5.2, wallY + 0.14, 0);
    this.drawPoly(ctx, [d0, d1, d2, d3], '#d97706', '#78350f', 2.5);

    const g0 = this.isoToScreen(5.45, wallY + 0.14 - Math.sin(swingAngle) * 0.25, 2.0);
    const g1 = this.isoToScreen(5.2 + Math.cos(swingAngle) * 1.28, wallY + 0.14 - Math.sin(swingAngle) * 1.28, 2.0);
    const g2 = this.isoToScreen(5.2 + Math.cos(swingAngle) * 1.28, wallY + 0.14 - Math.sin(swingAngle) * 1.28, 1.15);
    const g3 = this.isoToScreen(5.45, wallY + 0.14 - Math.sin(swingAngle) * 0.25, 1.15);
    this.drawPoly(ctx, [g0, g1, g2, g3], '#bae6fd', '#78350f', 1.5);
  }

  /**
   * Draws the Coffee Machine & Stand with a roasted COFFEE BEAN icon on the stand front
   * and a Green/Red indicator light (steam stops and red light comes on when empty!).
   */
  drawCoffeeMachineAndStand(ctx, timeSec) {
    const gx = 8.9;
    const gy = 5.15;

    // 1. Coffee Stand / Cabinet below the machine
    const standLeftCol = this.hoveringCoffee && this.coffeesLeft > 0 ? '#334155' : '#1e293b';
    this.drawIsoPrism(ctx, gx, gy, 0, 1.65, 0.95, 1.15, '#f8fafc', standLeftCol, '#0f172a');

    // 2. Front Plaque on the Stand below: Roasted Coffee Bean Icon + "2/2"
    this.drawCoffeeBeanPlaqueOnStand(ctx, gx + 0.12, gx + 1.53, 0.2, 0.95, gy + 0.96);

    // 3. Espresso Machine Body on top of the stand
    const topCol = (this.hoveringCoffee && this.coffeesLeft > 0) ? '#f59e0b' : '#475569';
    this.drawIsoPrism(ctx, gx + 0.3, gy + 0.18, 1.15, 1.05, 0.62, 0.92, topCol, '#1e293b', '#0f172a');

    // Coffee Pot / Dispenser recess
    this.drawIsoPrism(ctx, gx + 0.55, gy + 0.65, 1.22, 0.5, 0.22, 0.48, '#78350f', '#451a03', '#b45309');

    // 4. Small Red or Green Indicator Light on the Coffee Machine!
    const hasCoffee = this.coffeesLeft > 0;
    const ledPos = this.isoToScreen(gx + 0.48, gy + 0.82, 1.85);
    ctx.save();
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(ledPos.x, ledPos.y, 6, 0, Math.PI * 2);
    ctx.fill();

    const ledColor = hasCoffee ? '#22c55e' : '#ef4444';
    ctx.shadowColor = ledColor;
    ctx.shadowBlur = 10;
    ctx.fillStyle = ledColor;
    ctx.beginPath();
    ctx.arc(ledPos.x, ledPos.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Interactive click hit-box covering the Coffee Machine and Stand
    const pTop = this.isoToScreen(gx + 0.8, gy + 0.5, 2.1);
    const pBot = this.isoToScreen(gx + 0.8, gy + 0.95, 0);
    const s = this.tileW / 46;
    this.coffeeHitBox = {
      x: pTop.x - 58 * s,
      y: pTop.y - 16 * s,
      w: 116 * s,
      h: (pBot.y - pTop.y) + 28 * s
    };
  }

  /**
   * Draws a Roasted Coffee Bean icon + remaining count ("2/2") flat on the front of the Coffee Stand
   */
  drawCoffeeBeanPlaqueOnStand(ctx, gxStart, gxEnd, gzBottom, gzTop, wallY) {
    const hasCoffee = this.coffeesLeft > 0;
    const pTL = this.isoToScreen(gxStart, wallY, gzTop);
    const pTR = this.isoToScreen(gxEnd, wallY, gzTop);
    const pBR = this.isoToScreen(gxEnd, wallY, gzBottom);
    const pBL = this.isoToScreen(gxStart, wallY, gzBottom);

    this.drawPoly(ctx, [pTL, pTR, pBR, pBL], '#0f172a', hasCoffee ? '#22c55e' : '#ef4444', 2);

    const center = this.isoToScreen((gxStart + gxEnd) * 0.5, wallY, (gzBottom + gzTop) * 0.5);
    const dx = pTR.x - pTL.x;
    const dy = pTR.y - pTL.y;
    const plaqueLen = Math.hypot(dx, dy) || 1;
    const ux = dx / plaqueLen;
    const uy = dy / plaqueLen;
    const wallHeightPx = Math.abs(pBL.y - pTL.y) || 18;
    const beanScale = Math.max(0.65, Math.min(1.25, wallHeightPx / 22));

    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.transform(ux, uy, 0, 1, 0, 0);

    // Draw Roasted Coffee Bean on the left side of the stand sign (-11px)
    ctx.save();
    ctx.translate(-11 * beanScale, 0);
    ctx.rotate(-0.35);

    // Outer roasted bean oval
    ctx.fillStyle = hasCoffee ? '#92400e' : '#64748b';
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8.5 * beanScale, 5.8 * beanScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Characteristic S-shaped coffee bean center crease
    ctx.strokeStyle = '#1e1b18';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-6.5 * beanScale, -1 * beanScale);
    ctx.bezierCurveTo(
      -2 * beanScale, -4 * beanScale,
      2 * beanScale, 4 * beanScale,
      6.5 * beanScale, 1 * beanScale
    );
    ctx.stroke();
    ctx.restore();

    // Draw "2/2" (or "1/2", "0/2") next to the coffee bean
    ctx.fillStyle = hasCoffee ? '#fef3c7' : '#fca5a5';
    const fontSize = Math.max(8, Math.min(13, Math.round(wallHeightPx * 0.5)));
    ctx.font = `900 ${fontSize}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.coffeesLeft}/2`, 2 * beanScale, 1);

    ctx.restore();
  }

  /**
   * Draws the Check-In Desk on the Right side of the Lobby (gx: 8.25..9.2, gy: 6.7..8.8)
   * Rendered AFTER the first queuer (`Slot 0` at gx=7.45, gy=7.7) so the desk is properly in front-right!
   */
  drawCheckInDeskOnRight(ctx, timeSec) {
    // Desk Base oriented along the gy axis on the right side of the lobby
    this.drawIsoPrism(ctx, 8.25, 6.7, 0, 0.92, 2.1, 1.05, '#f8fafc', '#1e293b', '#334155');
    // Warm wooden counter top lip
    this.drawIsoPrism(ctx, 8.2, 6.65, 1.05, 1.02, 2.2, 0.14, '#b45309', '#92400e', '#78350f');

    // Computer Monitor placed at the upper end of the desk (gy: 6.8..7.35) so the middle check-in window is open!
    this.drawIsoPrism(ctx, 8.5, 6.8, 1.19, 0.35, 0.62, 0.68, '#475569', '#1e293b', '#0f172a');

    // Glowing ID Badge Scanner Pad on the lower end of the desk counter (gy: 8.15..8.65)
    const scanGlow = Math.sin(timeSec * 4) > 0 ? '#38bdf8' : '#0284c7';
    this.drawIsoPrism(ctx, 8.35, 8.12, 1.19, 0.48, 0.52, 0.08, scanGlow, '#0369a1', '#075985');
  }

  /**
   * Draws the Security Officer / Guard seated on the front-right side of the Check-In Desk (gx = 9.65, gy = 7.75).
   * Rendered AFTER the Check-In Desk so the Guard is in front-right of the desk in true isometric perspective!
   */
  drawSecurityOfficer(ctx, timeSec) {
    const gx = 9.65;
    const gy = 7.75;
    const s = this.tileW / 44;

    // 1. Guard Seat Base & Legs
    const foot = this.isoToScreen(gx, gy, 0);
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
    ctx.beginPath();
    ctx.ellipse(foot.x, foot.y, 15 * s, 7.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Guard Legs
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(foot.x - 7 * s, foot.y - 18 * s, 5.5 * s, 16 * s);
    ctx.fillRect(foot.x + 1.5 * s, foot.y - 18 * s, 5.5 * s, 16 * s);

    // 2. Guard Uniform Torso (facing up-left toward the Check-In Desk and the First Queuer!)
    const p = this.isoToScreen(gx, gy, 0.45);
    ctx.fillStyle = '#1e3a8a';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(p.x - 13.5 * s, p.y - 30 * s, 27 * s, 28 * s, 8 * s);
    ctx.fill();
    ctx.stroke();

    // Gold security badge on left chest (facing desk)
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(p.x - 6 * s, p.y - 19 * s, 3.6 * s, 0, Math.PI * 2);
    ctx.fill();

    // Guard Head looking up-left at the first queuer
    ctx.fillStyle = '#f5cba7';
    ctx.beginPath();
    ctx.arc(p.x, p.y - 41 * s, 11.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eyes looking up-left toward the queuer at the desk
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(p.x - 6.5 * s, p.y - 41 * s, 1.9 * s, 0, Math.PI * 2);
    ctx.arc(p.x - 1.0 * s, p.y - 41 * s, 1.9 * s, 0, Math.PI * 2);
    ctx.fill();

    // Security Cap with visor pointing up-left
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(p.x + 1 * s, p.y - 45 * s, 12 * s, Math.PI * 0.9, Math.PI * 2.05);
    ctx.fill();
    ctx.stroke();

    // Cap gold emblem
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(p.x - 5 * s, p.y - 48 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();

    if (this.officerDrinkingTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x - 21 * s, p.y - 38 * s, 10 * s, 12 * s);
      ctx.strokeRect(p.x - 21 * s, p.y - 38 * s, 10 * s, 12 * s);
    }

    ctx.restore();

    // 3. Swivel Chair Backrest behind-right of the Guard (gx + 0.32, gy + 0.15)
    this.drawIsoPrism(ctx, gx + 0.18, gy - 0.22, 0, 0.25, 0.55, 1.15, '#334155', '#1e293b', '#0f172a');
  }

  drawLobbyProps(ctx) {
    const s = this.tileW / 44;
    [[0.9, 5.4], [0.9, 10.9]].forEach(([px, py]) => {
      this.drawIsoPrism(ctx, px, py, 0, 0.55, 0.55, 0.55, '#f8fafc', '#cbd5e1', '#94a3b8');
      const leafPos = this.isoToScreen(px + 0.27, py + 0.27, 1.15);
      ctx.save();
      ctx.fillStyle = '#16a34a';
      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(leafPos.x, leafPos.y, 15 * s, 0, Math.PI * 2);
      ctx.arc(leafPos.x - 9 * s, leafPos.y + 5 * s, 11 * s, 0, Math.PI * 2);
      ctx.arc(leafPos.x + 9 * s, leafPos.y + 5 * s, 11 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // Blue Seating Area Chairs along the Back-Left Wall (gx = 0.75, gy = 6.8..9.4)
    [6.8, 8.0, 9.2].forEach(cy => {
      this.drawIsoPrism(ctx, 0.75, cy, 0, 0.7, 0.7, 0.52, '#2563eb', '#1d4ed8', '#1e40af');
      this.drawIsoPrism(ctx, 0.75, cy, 0.52, 0.18, 0.7, 0.52, '#3b82f6', '#1d4ed8', '#1e3a8a');
    });
  }

  drawQueueBarriers(ctx) {
    const posts = [
      [2.1, 6.9], [4.8, 6.9], [7.2, 6.9],
      [4.0, 8.6], [7.2, 8.6],
      [2.1, 9.6], [2.1, 11.8],
      [4.0, 11.8]
    ];
    posts.forEach(([px, py]) => {
      const base = this.isoToScreen(px, py, 0);
      const top = this.isoToScreen(px, py, 0.9);
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(top.x, top.y);
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(top.x, top.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  drawDepthSortedLobbyCharacters(ctx, timeSec) {
    const queueSlots = [
      { gx: 7.45, gy: 7.7, facing: 'desk_right' }, // Slot 0: Standing behind-left of Check-In Desk, facing Desk & Guard
      { gx: 6.35, gy: 7.7, facing: 'desk_right' }, // Slot 1
      { gx: 5.25, gy: 7.7, facing: 'desk_right' }, // Slot 2
      { gx: 4.15, gy: 7.7, facing: 'desk_right' }, // Slot 3
      { gx: 3.0, gy: 7.7, facing: 'desk_right' },  // Slot 4: Midway 90-degree turn corner
      { gx: 3.0, gy: 8.65, facing: 'up_lobby' },   // Slot 5
      { gx: 3.0, gy: 9.55, facing: 'up_lobby' },   // Slot 6
      { gx: 3.0, gy: 10.45, facing: 'up_lobby' },  // Slot 7
      { gx: 3.0, gy: 11.35, facing: 'up_lobby' },  // Slot 8
      { gx: 3.0, gy: 12.2, facing: 'up_lobby' }    // Slot 9: Bottom entrance
    ];

    const renderList = [];

    if (this.queue && this.queue.length > 0) {
      const remainingCount = this.queue.length - this.currentIndex;
      for (let offset = 0; offset < remainingCount; offset++) {
        const teacherIdx = this.currentIndex + offset;
        const teacher = this.queue[teacherIdx];
        const slot = queueSlots[Math.min(offset, queueSlots.length - 1)];
        const idleBob = Math.max(0, Math.sin(timeSec * 3.2 + teacherIdx) * 0.05);

        renderList.push({
          gx: slot.gx,
          gy: slot.gy,
          gz: idleBob,
          depthKey: slot.gx + slot.gy + offset * 0.001,
          teacher,
          animTime: timeSec + teacherIdx,
          opts: {
            facing: slot.facing,
            isAtDesk: offset === 0
          }
        });
      }
    }

    this.walkingActors.forEach(actor => {
      const pos = this.interpolateWaypoints(actor.waypoints, actor.progress);
      if (pos.gy >= 4.85) {
        const bob = Math.abs(Math.sin(actor.progress * Math.PI * 8)) * 0.16;
        renderList.push({
          gx: pos.gx,
          gy: pos.gy,
          gz: bob,
          depthKey: pos.gx + pos.gy,
          teacher: actor.teacher,
          animTime: timeSec * 3,
          opts: {
            facing: actor.allowed ? 'up_lobby' : 'down_exit'
          }
        });
      }
    });

    renderList.sort((a, b) => a.depthKey - b.depthKey);

    renderList.forEach(item => {
      this.drawIsoCharacter(ctx, item.gx, item.gy, item.gz, item.teacher, item.animTime, item.opts);
    });
  }

  drawIsoCharacter(ctx, gx, gy, gz, teacher, animTime, opts = {}) {
    if (!teacher) return;
    const traits = teacher.badgeTraits || teacher.officialTraits;
    const foot = this.isoToScreen(gx, gy, gz);
    const s = this.tileW / 44;
    const dir = opts.facing === 'desk_right' ? 1 : (opts.facing === 'down_exit' ? -1 : 0.4);

    ctx.save();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.26)';
    ctx.beginPath();
    ctx.ellipse(foot.x, foot.y, 14 * s, 7 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    if (opts.isAtDesk) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(foot.x, foot.y, 20 * s, 10 * s, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Legs / Trousers
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillRect(foot.x - 7.5 * s, foot.y - 18 * s, 5.8 * s, 17 * s);
    ctx.strokeRect(foot.x - 7.5 * s, foot.y - 18 * s, 5.8 * s, 17 * s);
    ctx.fillRect(foot.x + 1.8 * s, foot.y - 18 * s, 5.8 * s, 17 * s);
    ctx.strokeRect(foot.x + 1.8 * s, foot.y - 18 * s, 5.8 * s, 17 * s);

    // Torso / Blazer
    ctx.fillStyle = traits.burglarShirt ? '#334155' : (traits.outfit || '#2563eb');
    ctx.beginPath();
    ctx.roundRect(foot.x - 12.5 * s, foot.y - 44 * s, 25 * s, 28 * s, 7 * s);
    ctx.fill();
    ctx.stroke();

    // Visible Tie on chest shifted in facing direction
    const tieOffsetX = dir * 3.2 * s;
    ctx.fillStyle = traits.tie || '#ef4444';
    ctx.fillRect(foot.x + tieOffsetX - 2.8 * s, foot.y - 41 * s, 5.6 * s, 16 * s);

    // Head
    ctx.fillStyle = traits.skin || '#f5cba7';
    ctx.beginPath();
    ctx.arc(foot.x, foot.y - 55 * s, 12 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hair / Ears
    ctx.fillStyle = traits.hairColor || '#1e293b';
    if (traits.subType === 'cat' || traits.subType === 'fox') {
      [-8.5 * s, 8.5 * s].forEach(ox => {
        ctx.beginPath();
        ctx.moveTo(foot.x + ox - 4 * s, foot.y - 64 * s);
        ctx.lineTo(foot.x + ox, foot.y - 74 * s);
        ctx.lineTo(foot.x + ox + 4 * s, foot.y - 64 * s);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    } else if (traits.hairStyle !== 'none' && traits.hairStyle !== 'bald_shine') {
      ctx.beginPath();
      ctx.arc(foot.x - dir * 1.5 * s, foot.y - 58.5 * s, 12.2 * s, Math.PI * 0.92, Math.PI * 2.08);
      ctx.fill();
      ctx.stroke();
    }

    // Eyes shifted toward facing direction
    const eyeShiftX = dir * 3.5 * s;
    if (traits.subType === 'cyclops') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(foot.x + eyeShiftX, foot.y - 55 * s, 4.2 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = traits.eyeColor || '#facc15';
      ctx.beginPath();
      ctx.arc(foot.x + eyeShiftX, foot.y - 55 * s, 2.2 * s, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = traits.eyeColor || '#0f172a';
      ctx.beginPath();
      ctx.arc(foot.x + eyeShiftX - 3.2 * s, foot.y - 55 * s, 2.0 * s, 0, Math.PI * 2);
      ctx.arc(foot.x + eyeShiftX + 3.8 * s, foot.y - 55 * s, 2.0 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    if (opts.isAtDesk) {
      const nw = 124 * s;
      const nh = 21 * s;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(foot.x - nw * 0.5, foot.y - 92 * s, nw, nh, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = `bold ${Math.round(9.8 * s)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(teacher.name, foot.x, foot.y - 78.5 * s);
    }

    if (opts.showSneaky) {
      ctx.fillStyle = '#ef4444';
      ctx.font = `bold ${Math.round(13 * s)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('😈', foot.x, foot.y - 72 * s);
    }

    ctx.restore();
  }

  interpolateWaypoints(pts, t) {
    const clamped = Math.max(0, Math.min(0.999, t));
    const totalSegs = pts.length - 1;
    const segFloat = clamped * totalSegs;
    const idx = Math.floor(segFloat);
    const localT = segFloat - idx;
    const a = pts[idx];
    const b = pts[idx + 1];
    return {
      gx: a.gx + (b.gx - a.gx) * localT,
      gy: a.gy + (b.gy - a.gy) * localT
    };
  }

  drawPoly(ctx, points, fill, stroke = null, lineWidth = 1) {
    if (!points || points.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  drawIsoPrism(ctx, gx, gy, gz, dx, dy, dz, topColor, leftColor, rightColor, strokeColor = 'rgba(15,23,42,0.18)') {
    const p001 = this.isoToScreen(gx, gy, gz + dz);
    const p101 = this.isoToScreen(gx + dx, gy, gz + dz);
    const p111 = this.isoToScreen(gx + dx, gy + dy, gz + dz);
    const p011 = this.isoToScreen(gx, gy + dy, gz + dz);

    const p100 = this.isoToScreen(gx + dx, gy, gz);
    const p110 = this.isoToScreen(gx + dx, gy + dy, gz);
    const p010 = this.isoToScreen(gx, gy + dy, gz);

    this.drawPoly(ctx, [p001, p101, p111, p011], topColor, strokeColor, 1);
    this.drawPoly(ctx, [p011, p111, p110, p010], leftColor, strokeColor, 1);
    this.drawPoly(ctx, [p111, p101, p100, p110], rightColor, strokeColor, 1);
  }

  drawFloorTiles(ctx, xStart, yStart, xEnd, yEnd, c1, c2, stroke) {
    const p0 = this.isoToScreen(xStart, yStart, 0);
    const p1 = this.isoToScreen(xEnd, yStart, 0);
    const p2 = this.isoToScreen(xEnd, yEnd, 0);
    const p3 = this.isoToScreen(xStart, yEnd, 0);
    this.drawPoly(ctx, [p0, p1, p2, p3], c1, stroke, 1);

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.06)';
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xStart); x <= Math.floor(xEnd); x++) {
      const a = this.isoToScreen(x, yStart, 0);
      const b = this.isoToScreen(x, yEnd, 0);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (let y = Math.ceil(yStart); y <= Math.floor(yEnd); y++) {
      const a = this.isoToScreen(xStart, y, 0);
      const b = this.isoToScreen(xEnd, y, 0);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  renderParticlesAndTexts(ctx) {
    this.steamParticles.forEach(sp => {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, sp.alpha)})`;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = '900 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }
}

window.IsometricOfficeScene = IsometricOfficeScene;
