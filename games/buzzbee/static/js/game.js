/**
 * BuzzBee – Main Game Controller (v2)
 */
(() => {
  'use strict';

  /* ─── Utils ─── */
  const $ = id => document.getElementById(id);
  function rectsOverlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function dist(ax, ay, bx, by) { return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.floor(rand(a, b + 1)); }

  /* ─── Screens ─── */
  const screens = {
    loading: $('loading-screen'), menu: $('main-menu'), howto: $('howto-screen'),
    leaderboard: $('leaderboard-screen'), game: $('game-screen'),
    pause: $('pause-menu'), gameover: $('gameover-screen'),
  };
  function showScreen(n) { Object.values(screens).forEach(s => s.classList.add('hidden')); screens[n].classList.remove('hidden'); }
  function showOverlay(n) { screens[n].classList.remove('hidden'); }
  function hideOverlay(n) { screens[n].classList.add('hidden'); }

  /* ─── Assets ─── */
  const IMG = {};
  const SRCS = { thief: '/static/assets/images/thief_hand.png', spray: '/static/assets/images/spray_hand.png', nectar: '/static/assets/images/nectar.png' };
  function loadAssets(onP) {
    const keys = Object.keys(SRCS); let loaded = 0;
    return new Promise(res => {
      keys.forEach(k => {
        const img = new Image(); img.src = SRCS[k];
        img.onload = img.onerror = () => { IMG[k] = img; loaded++; onP(loaded / keys.length); if (loaded === keys.length) res(); };
      });
    });
  }

  /* ─── Config ─── */
  let CFG = { spawnRate: 1, enemySpeed: 1, victoryJars: 10, scoring: { yellowPollen: 10, stingThief: 50, stingSpray: 30, nectarStolen: -100, badPollenHit: -20, comboMultiplier: 1.5 } };
  let difficulty = 'normal';
  async function fetchCFG() {
    try {
      const r = await fetch('/api/gameconfig'); const d = await r.json();
      const dc = d.difficulty[difficulty];
      CFG = {
        ...CFG, ...dc, scoring: d.scoring,
        victoryJars: difficulty === 'easy' ? 5 : difficulty === 'hard' ? 15 : 10
      };
    } catch (e) { }
  }

  /* ─── State ─── */
  let canvas, ctx, bee, hive, flowers, pollens, enemies, particles, stingFlashes;
  let score, wave, combo, maxCombo, pollenCollected, enemiesStung;
  let spawnTimer, waveTimer, waveDisplayTimer;
  let paused, running, keys, stopBGM;
  let clouds = [], trees = [];
  let enemyWarning = null, enemyWarnTimer = 0;

  /* ─── Canvas ─── */
  function resizeCanvas() {
    canvas.width = 1200;
    canvas.height = 800;
  }

  /* ─── Init ─── */
  function initGame() {
    AudioEngine.init();
    canvas = $('game-canvas'); ctx = canvas.getContext('2d');
    resizeCanvas();
    score = 0; wave = 1; combo = 0; maxCombo = 0; pollenCollected = 0; enemiesStung = 0;
    spawnTimer = 0; waveTimer = 0; waveDisplayTimer = 0;
    paused = false; running = true; keys = {};
    enemyWarning = null; enemyWarnTimer = 0;

    bee = new Entities.Bee(canvas.width * 0.25, canvas.height * 0.5);

    // Hive in dead center of game area floor
    const hiveX = canvas.width / 2, hiveY = canvas.height / 2;
    hive = new Hive(hiveX, hiveY);

    // Scenery
    clouds = []; for (let i = 0; i < 6; i++) clouds.push({ x: rand(0, canvas.width), y: rand(30, canvas.height * 0.3), w: rand(80, 180), speed: rand(0.15, 0.4), alpha: rand(0.7, 0.95) });
    trees = []; for (let i = 0; i < 5; i++) trees.push({ x: rand(50, canvas.width * 0.8), h: rand(80, 160), w: rand(40, 70), trunkH: rand(40, 70) });

    flowers = []; pollens = []; enemies = []; particles = []; stingFlashes = [];
    for (let i = 0; i < 6; i++) spawnFlower();
    for (let i = 0; i < 5; i++) spawnPollen('good');

    stopBGM = AudioEngine.startBGM();
    updateHUD();
  }

  /* ─── Spawning ─── */
  function spawnFlower() {
    const x = rand(60, canvas.width - 60);
    const y = canvas.height - rand(100, 350);
    flowers.push(new Flower(x, y));
  }
  function spawnPollen(type) {
    pollens.push(new Entities.Pollen(rand(30, canvas.width * 0.8), rand(80, canvas.height - 160), type));
  }
  function spawnThief() {
    if (enemies.filter(e => e.type === 'thief' && !e.dead).length >= 1) return;
    const nectars = flowers.filter(f => !f.dead);
    const target = nectars.length > 0 ? nectars[randInt(0, nectars.length - 1)] : { x: rand(100, canvas.width * 0.7), y: canvas.height - 80 };
    // create a fake jar-like object for the hand to target
    const fakeJar = { x: target.x, y: target.y, shake: () => { } };
    enemies.push(new Entities.ThiefHand(target.x, canvas.height, 1.8 * CFG.enemySpeed, fakeJar));
  }
  function spawnSpray() {
    if (enemies.filter(e => e.type === 'spray' && !e.dead).length >= 1) return;
    enemies.push(new Entities.SprayHand(rand(100, canvas.width * 0.75), canvas.height, 1.4 * CFG.enemySpeed));
  }
  function warnEnemy(type) {
    enemyWarning = type; enemyWarnTimer = 120;
    AudioEngine.play('wave');
  }
  function handleSpawning() {
    spawnTimer++; waveTimer++;
    if (waveTimer > 30 * 60) { waveTimer = 0; wave++; waveDisplayTimer = 180; AudioEngine.play('wave'); CFG.enemySpeed = Math.min(2.5, CFG.enemySpeed + 0.1); }
    const pollenInt = Math.max(80, 150 - wave * 5);
    if (spawnTimer % pollenInt < 2) spawnPollen('good');
    const flowerInt = Math.max(400, 900 - wave * 20);
    if (spawnTimer % flowerInt < 4) spawnFlower();
    const baseInt = Math.max(300, 700 - wave * 25);
    if (spawnTimer % Math.floor(baseInt / CFG.spawnRate) < 2) {
      const isThief = Math.random() < 0.45;
      warnEnemy(isThief ? 'burglar' : 'farmer');
      setTimeout(() => isThief ? spawnThief() : spawnSpray(), 2000);
    }
  }

  /* ─── Background ─── */
  function drawBG() {
    const W = canvas.width, H = canvas.height;
    const skyH = H * 0.55;
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, skyH);
    sky.addColorStop(0, '#87CEEB'); sky.addColorStop(1, '#E8F5E9');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, skyH);
    // Sun
    ctx.save(); ctx.fillStyle = '#FFF176'; ctx.shadowColor = '#FFD600'; ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.arc(W * 0.12, H * 0.08, 36, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // Clouds
    for (const c of clouds) {
      c.x -= c.speed; if (c.x + c.w < 0) c.x = W + c.w;
      ctx.save(); ctx.globalAlpha = c.alpha; ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(255,255,255,0.5)'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.ellipse(c.x, c.y, c.w * 0.5, c.w * 0.22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(c.x - c.w * 0.18, c.y + 8, c.w * 0.3, c.w * 0.16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(c.x + c.w * 0.2, c.y + 6, c.w * 0.28, c.w * 0.14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // Grass
    const grass = ctx.createLinearGradient(0, skyH, 0, H);
    grass.addColorStop(0, '#66BB6A'); grass.addColorStop(1, '#2E7D32');
    ctx.fillStyle = grass; ctx.fillRect(0, skyH, W, H - skyH);
    // Rolling hill edge
    ctx.fillStyle = '#81C784';
    ctx.beginPath(); ctx.moveTo(0, skyH);
    for (let x = 0; x <= W; x += 40) { ctx.quadraticCurveTo(x + 20, skyH - 18, x + 40, skyH); }
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    // Trees
    for (const t of trees) {
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(t.x - t.w * 0.24, H - t.trunkH, t.w * 0.25, t.trunkH);
      const tg = ctx.createRadialGradient(t.x, H - t.trunkH - t.h * 0.4, 0, t.x, H - t.trunkH - t.h * 0.4, t.w * 0.5);
      tg.addColorStop(0, '#275e2aff'); tg.addColorStop(1, '#4f9653ff');
      ctx.fillStyle = tg;
      ctx.beginPath(); ctx.arc(t.x, H - t.trunkH - t.h * 0.6, t.w * 0.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* ─── HUD ─── */
  function updateHUD() {
    $('score-val').textContent = score;
    $('wave-val').textContent = wave;
    $('combo-val').textContent = combo <= 1 ? 'x1' : `x${combo}`;
    $('health-bar').style.width = (bee.health / bee.maxHealth * 100) + '%';
    $('stamina-bar').style.width = (bee.stamina / bee.maxStamina * 100) + '%';
    const hp = bee.health / bee.maxHealth;
    $('health-bar').style.background = hp > 0.5 ? 'linear-gradient(90deg,#4CAF50,#8BC34A)' : hp > 0.25 ? 'linear-gradient(90deg,#FF8F00,#FFC107)' : 'linear-gradient(90deg,#FF3B30,#FF6B6B)';
    // carry
    const nc = $('nectar-hud'); const pc = $('pollen-hud');
    if (nc) nc.textContent = '💧'.repeat(bee.nectarCarried) || '—';
    if (pc) pc.textContent = '🌼'.repeat(bee.pollenCarried) || '—';
    // honey
    const hj = $('honey-hud');
    if (hj) hj.textContent = `🍯×${hive.honeyJars}/${CFG.victoryJars}`;
    // enemy warning
    const wa = $('enemy-warning');
    if (wa) {
      if (enemyWarnTimer > 0) {
        wa.textContent = enemyWarning === 'burglar' ? '⚠️ BURGLAR!' : '⚠️ FARMER!';
        wa.style.display = 'block';
        wa.style.opacity = Math.min(1, enemyWarnTimer / 30);
        enemyWarnTimer--;
      } else { wa.style.display = 'none'; }
    }
    // nectar jar icons (legacy)
    const ni = $('nectar-icons');
    if (ni) ni.innerHTML = '';
  }

  /* ─── Score popup ─── */
  function addScore(pts, x, y) {
    const mult = combo > 1 ? (1 + (combo - 1) * (CFG.scoring.comboMultiplier - 1)) : 1;
    const total = Math.round(pts * mult);
    score = Math.max(0, score + total);
    const el = document.createElement('div');
    el.className = `score-popup ${total > 0 ? 'positive' : 'negative'}`;
    el.textContent = (total > 0 ? '+' : '') + total;
    const rect = canvas.getBoundingClientRect();
    el.style.left = (x + rect.left - 20) + 'px'; el.style.top = (y + rect.top - 20) + 'px';
    $('popup-layer').appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  /* ─── Input ─── */
  function setupInput() {
    document.addEventListener('keydown', e => {
      if (!running) return;
      keys[e.code] = true;
      if ((e.code === 'Space' || e.code === 'KeyZ') && !paused) { e.preventDefault(); tryStingNearest(); }
      if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
    });
    document.addEventListener('keyup', e => { keys[e.code] = false; });
  }
  function getMov() {
    let dx = 0, dy = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
    if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
    if (keys['ArrowDown'] || keys['KeyS']) dy += 1;
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
    return { dx, dy };
  }

  /* ─── Sting ─── */
  function tryStingNearest() {
    if (!bee.tryStirng()) return;
    let closest = null, minD = bee.stingRange;
    for (const e of enemies) {
      if (e.dead) continue;
      const b = e.getBounds(), ex = b.x + b.w / 2, ey = b.y + b.h / 2;
      const d = dist(bee.x, bee.y, ex, ey);
      if (d < minD) { closest = e; minD = d; }
    }
    if (closest) {
      stingFlashes.push(new Entities.StingFlash(bee.x, bee.y));
      AudioEngine.play('sting');
      const killed = closest.takeDamage();
      if (killed) {
        const b = closest.getBounds();
        particles.push(new Entities.Particle(b.x + b.w / 2, b.y + b.h / 2, '#FF6BFF', 12));
        AudioEngine.play('enemyDie');
        combo++; if (combo > maxCombo) maxCombo = combo;
        if (combo >= 3) AudioEngine.play('combo');
        enemiesStung++;
        const pts = closest.type === 'thief' ? CFG.scoring.stingThief : CFG.scoring.stingSpray;
        addScore(pts, b.x + b.w / 2, b.y);
        $('combo-val').classList.add('combo-flash');
        setTimeout(() => $('combo-val').classList.remove('combo-flash'), 300);
      } else { combo = 0; }
    } else {
      combo = Math.max(0, combo - 1);
      stingFlashes.push(new Entities.StingFlash(bee.x + (bee.facingRight ? 50 : -50), bee.y));
    }
  }

  /* ─── Bee interactions ─── */
  function checkFlowerInteraction() {
    for (const f of flowers) {
      if (f.dead || !f.hasNectar) continue;
      const d = dist(bee.x, bee.y, f.x, f.y);
      if (d < 45 && bee.nectarCarried < bee.maxCarry) {
        f.collect();
        bee.collectNectar();
        particles.push(new Entities.Particle(f.x, f.y, '#FFD600', 6));
        AudioEngine.play('collectPollen');
        addScore(5, f.x, f.y - 20);
      }
    }
  }
  function checkPollenInteraction() {
    const bb = bee.getBounds();
    for (const p of pollens) {
      if (p.collected) continue;
      if (rectsOverlap(bb, p.getBounds())) {
        p.collected = true;
        particles.push(new Entities.Particle(p.x, p.y, p.type === 'good' ? '#FFD600' : '#4CAF50', 6));
        if (p.type === 'good') {
          if (bee.pollenCarried < bee.maxCarry) { bee.collectPollen(); AudioEngine.play('collectPollen'); addScore(CFG.scoring.yellowPollen, p.x, p.y); pollenCollected++; }
          else { addScore(CFG.scoring.yellowPollen, p.x, p.y); pollenCollected++; } // still counts
        } else {
          addScore(CFG.scoring.badPollenHit, p.x, p.y);
          bee.takeDamage(8); AudioEngine.play('badPollen'); combo = 0; shakeScreen();
        }
      }
    }
  }
  function checkHiveDeposit() {
    const d = dist(bee.x, bee.y, hive.entranceX, hive.entranceY);
    if (d < hive.depositRadius && (bee.nectarCarried > 0 || bee.pollenCarried > 0)) {
      hive.deposit(bee.nectarCarried, bee.pollenCarried);
      bee.depositAnim = 40;
      bee.nectarCarried = 0; bee.pollenCarried = 0;
      AudioEngine.play('collectPollen');
      // draw hive entrance pulse
      particles.push(new Entities.Particle(hive.entranceX, hive.entranceY, '#FFD600', 8));
      checkVictory();
    }
  }
  function checkVictory() {
    if (hive.honeyJars >= CFG.victoryJars) endGame(true);
  }

  /* ─── Enemy nectar steal ─── */
  function checkNectarSteals() {
    for (const e of enemies) {
      if (e.type !== 'thief' || e.dead) continue;
      const res = e.update();
      if (res === 'stolen') {
        addScore(CFG.scoring.nectarStolen, e.x, e.y - 60);
        particles.push(new Entities.Particle(e.x, canvas.height - 200, '#FF3B30', 14));
        AudioEngine.play('nectarStolen'); shakeScreen(); combo = 0;
      }
    }
  }

  /* ─── Spray converts pollen ─── */
  function checkSprayEffect() {
    for (const e of enemies) {
      if (e.type !== 'spray' || e.dead) continue;
      const zone = e.getSprayZone();
      for (const p of pollens) {
        if (p.type === 'good' && !p.collected && rectsOverlap(p.getBounds(), zone)) p.type = 'bad';
      }
      // spray also removes nectar from nearby flowers
      for (const f of flowers) {
        if (!f.dead && f.hasNectar && rectsOverlap({ x: f.x - 20, y: f.y - 20, w: 40, h: 40 }, zone)) {
          f.hasNectar = false;
        }
      }
    }
  }

  function shakeScreen() {
    $('game-screen').classList.add('shake');
    setTimeout(() => $('game-screen').classList.remove('shake'), 400);
  }

  /* ─── Pause ─── */
  function togglePause() {
    if (!running) return;
    paused = !paused;
    if (paused) showOverlay('pause');
    else { hideOverlay('pause'); AudioEngine.resume(); }
  }

  /* ─── End Game ─── */
  function endGame(victory = false) {
    running = false;
    if (stopBGM) stopBGM();
    AudioEngine.play('gameOver');
    $('go-icon').textContent = victory ? '🏆' : '💔';
    $('go-title').textContent = victory ? 'Victory! 🐝' : 'Game Over';
    $('go-score').textContent = score;
    $('go-wave').textContent = wave;
    $('go-pollen').textContent = pollenCollected;
    $('go-stings').textContent = enemiesStung;
    $('go-combo').textContent = `x${maxCombo}`;
    $('rank-msg').textContent = '';
    hideOverlay('pause'); showOverlay('gameover');
  }

  /* ─── Submit score ─── */
  async function submitScore() {
    const name = $('player-name').value.trim() || 'Anonymous';
    try {
      const r = await fetch('/api/leaderboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, score, wave }) });
      const d = await r.json();
      $('rank-msg').textContent = `You ranked #${d.rank} on the leaderboard!`;
    } catch (e) { $('rank-msg').textContent = 'Could not reach server.'; }
  }

  /* ─── Leaderboard ─── */
  async function fetchLeaderboard() {
    const el = $('leaderboard-list'); el.innerHTML = '<p class="loading-msg">Loading…</p>';
    try {
      const r = await fetch('/api/leaderboard'); const board = await r.json();
      if (!board.length) { el.innerHTML = '<p class="loading-msg">No scores yet!</p>'; return; }
      el.innerHTML = board.map((e, i) => {
        const rc = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        const m = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        return `<div class="lb-row"><span class="lb-rank ${rc}">${m}</span><span class="lb-name">${e.name}</span><span class="lb-wave">W${e.wave}</span><span class="lb-score">${e.score.toLocaleString()}</span></div>`;
      }).join('');
    } catch (e) { el.innerHTML = '<p class="loading-msg">Server offline.</p>'; }
  }

  /* ─── Banner / Labels ─── */
  function drawHiveEntrance() {
    const d = dist(bee.x, bee.y, hive.entranceX, hive.entranceY);
    const alpha = Math.max(0, 1 - (d - hive.depositRadius * 0.5) / 80);
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath(); ctx.roundRect(hive.entranceX - 52, hive.entranceY + 30, 104, 26, 8); ctx.fill();
    ctx.fillStyle = '#FFD600'; ctx.font = 'bold 11px Nunito,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Fly here to deposit!', hive.entranceX, hive.entranceY + 48);
    ctx.restore();
  }

  function drawWaveBanner() {
    if (waveDisplayTimer <= 0) return; waveDisplayTimer--;
    const a = Math.min(1, waveDisplayTimer / 30);
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(canvas.width / 2 - 140, canvas.height / 2 - 40, 280, 80);
    ctx.fillStyle = '#FFD600'; ctx.font = "bold 42px 'Fredoka One',cursive";
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`Wave ${wave}`, canvas.width / 2, canvas.height / 2); ctx.restore();
  }

  /* ─── Main Loop ─── */
  function gameLoop() {
    if (!running) return;
    requestAnimationFrame(gameLoop);
    if (paused) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBG();
    handleSpawning();

    // Bee move
    const { dx, dy } = getMov(); bee.move(dx, dy); bee.update(canvas.width, canvas.height);

    // Hive
    hive.update(); hive.draw(ctx);
    drawHiveEntrance();

    // Flowers
    flowers.forEach(f => { f.update(); f.draw(ctx); });
    flowers = flowers.filter(f => !f.dead);

    // Pollen
    pollens.forEach(p => { p.update(); p.draw(ctx); });
    pollens = pollens.filter(p => !p.dead);

    // Enemies – spray (non-thief) updated here
    enemies.forEach(e => {
      if (e.type === 'spray') { const sig = e.update(); if (sig === 'spray') checkSprayEffect(); }
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.scale(2, 2);
      ctx.translate(-e.x, -e.y);
      e.draw(ctx);
      ctx.restore();
    });
    checkNectarSteals();
    enemies = enemies.filter(e => !e.dead);

    // Effects
    particles.forEach(p => { p.update(); p.draw(ctx); }); particles = particles.filter(p => !p.dead);
    stingFlashes.forEach(s => { s.update(); s.draw(ctx); }); stingFlashes = stingFlashes.filter(s => !s.dead);

    // Interactions
    checkFlowerInteraction();
    checkPollenInteraction();
    checkHiveDeposit();
    checkSprayEffect();

    // Bee on top
    bee.draw(ctx);

    drawWaveBanner();
    if (!bee.alive) endGame(false);
    updateHUD();
  }

  /* ─── Menu particles ─── */
  function spawnMenuParticles() {
    const c = $('menu-particles'); c.innerHTML = '';
    ['🌼', '🌸', '🍀', '✨', '🌻', '💛'].forEach(icon => {
      for (let i = 0; i < 3; i++) {
        const el = document.createElement('div'); el.className = 'particle'; el.textContent = icon;
        el.style.left = `${rand(0, 100)}%`; el.style.fontSize = `${rand(14, 28)}px`;
        el.style.animationDuration = `${rand(6, 14)}s`; el.style.animationDelay = `-${rand(0, 14)}s`;
        c.appendChild(el);
      }
    });
  }

  /* ─── Wire events ─── */
  function wireEvents() {
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); difficulty = btn.dataset.diff; fetchCFG();
      });
    });
    $('btn-play').addEventListener('click', () => { AudioEngine.init(); initGame(); setupInput(); showScreen('game'); gameLoop(); });
    $('btn-howto').addEventListener('click', () => showScreen('howto'));
    $('btn-howto-back').addEventListener('click', () => showScreen('menu'));
    $('btn-leaderboard').addEventListener('click', () => { showScreen('leaderboard'); fetchLeaderboard(); });
    $('btn-lb-back').addEventListener('click', () => showScreen('menu'));
    $('btn-pause').addEventListener('click', togglePause);
    $('btn-resume').addEventListener('click', togglePause);
    $('btn-quit-pause').addEventListener('click', () => { running = false; if (stopBGM) stopBGM(); hideOverlay('pause'); showScreen('menu'); });
    $('btn-submit-score').addEventListener('click', submitScore);
    $('btn-play-again').addEventListener('click', () => { hideOverlay('gameover'); AudioEngine.init(); initGame(); showScreen('game'); gameLoop(); });
    $('btn-go-menu').addEventListener('click', () => { hideOverlay('gameover'); showScreen('menu'); });
    window.addEventListener('resize', () => { if (running) resizeCanvas(); });
  }

  /* ─── Boot ─── */
  async function boot() {
    showScreen('loading');
    const bar = $('loading-bar'), txt = $('loading-text');
    txt.textContent = 'Fetching config…'; await fetchCFG();
    txt.textContent = 'Loading assets…'; await loadAssets(p => { bar.style.width = (p * 100) + '%'; });
    txt.textContent = 'Ready!'; await new Promise(r => setTimeout(r, 500));
    $('loading-screen').style.opacity = '0';
    await new Promise(r => setTimeout(r, 600));
    $('loading-screen').style.display = 'none';
    spawnMenuParticles(); showScreen('menu');
  }

  wireEvents(); boot();
})();
