class Engine {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;   // canvas width (1280)
        this.height = height; // canvas height (800)
        this.mapWidth = 6000;
        this.mapHeight = 1200;
        this.gravity = 880;
        this.platforms = [];
    }

    setPlatforms(platforms) {
        this.platforms = platforms;
    }

    addPlatform(x, y, w, h, color, opts = {}) {
        this.platforms.push({ x, y, w, h, color, ...opts });
    }

    update(dt, entities) {
        entities.forEach(entity => {
            if (entity.noGravity) {
                entity.x += entity.vx * dt;
                entity.y += entity.vy * dt;
                return;
            }

            entity.prevY = entity.y;

            // Apply gravity
            entity.vy += this.gravity * dt;

            // Move X
            entity.x += entity.vx * dt;
            this.checkHorizontalCollisions(entity);

            // Move Y
            entity.y += entity.vy * dt;
            this.checkVerticalCollisions(entity);

            // World horizontal bounds
            if (entity.x < 0) entity.x = 0;
            if (entity.x + entity.width > this.mapWidth) {
                entity.x = this.mapWidth - entity.width;
            }
        });
    }

    checkHorizontalCollisions(entity) {
        // Horizontal wall bounds handled by world clamp
    }

    checkVerticalCollisions(entity) {
        entity.grounded = false;
        entity.currentPlatform = null;

        const prevBottom = (entity.prevY !== undefined ? entity.prevY : entity.y) + entity.height;
        const currBottom = entity.y + entity.height;

        for (let i = 0; i < this.platforms.length; i++) {
            const platform = this.platforms[i];
            const overlapsX = entity.x + 4 < platform.x + platform.w &&
                              entity.x + entity.width - 4 > platform.x;

            if (!overlapsX) continue;

            // Ground floor safety clamp: nothing can ever fall through the main ground
            if (platform.isGround || platform.h >= 80) {
                if (currBottom >= platform.y) {
                    entity.y = platform.y - entity.height;
                    entity.vy = 0;
                    entity.grounded = true;
                    entity.currentPlatform = platform;
                }
                continue;
            }

            // One-way platforms & cloud platforms when falling or standing
            if (entity.vy >= 0 && prevBottom <= platform.y + 18 && currBottom >= platform.y) {
                entity.y = platform.y - entity.height;
                entity.vy = 0;
                entity.grounded = true;
                entity.currentPlatform = platform;
            }
        }
    }

    // ==========================================
    // THEMED PARALLAX SCENERY & SKY RENDERING
    // ==========================================
    drawScenery(camera, level, time = 0) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const theme = (level && level.theme) || 'village';

        // 1. Sky vertical gradient
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, level.skyTop || '#1e3a8a');
        grad.addColorStop(0.55, level.skyMid || level.background || '#60a5fa');
        grad.addColorStop(1, level.skyBottom || '#bae6fd');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // 2. Celestial body (Sun / Moon / Aurora / Vortex)
        this.drawCelestialBody(ctx, theme, camera, time);

        // 3. Upper Sky Decorative Clouds (visible especially when jumping high)
        this.drawSkyClouds(ctx, theme, camera, time);

        // 4. Far Parallax Layer (0.18x horizontal scroll)
        this.drawFarLayer(ctx, theme, camera, time);

        // 5. Mid Parallax Layer (0.42x horizontal scroll)
        this.drawMidLayer(ctx, theme, camera, time);

        // 6. Near Ground Scenery Props (0.85x or 1.0x scroll anchored to ground y=1020)
        this.drawNearProps(ctx, theme, camera, time);
    }

    drawCelestialBody(ctx, theme, camera, time) {
        ctx.save();
        const cx = this.width - 210 - (camera.x * 0.04);
        const cy = 140 - (camera.y * 0.12);

        if (theme === 'village' || theme === 'forest') {
            // Warm sun with glow
            const rad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 90);
            rad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
            rad.addColorStop(0.4, 'rgba(250, 204, 21, 0.45)');
            rad.addColorStop(1, 'rgba(250, 204, 21, 0)');
            ctx.fillStyle = rad;
            ctx.beginPath();
            ctx.arc(cx, cy, 90, 0, Math.PI * 2);
            ctx.fill();
        } else if (theme === 'desert') {
            // Giant blazing desert sun
            const rad = ctx.createRadialGradient(cx, cy + 30, 20, cx, cy + 30, 130);
            rad.addColorStop(0, '#fff7ed');
            rad.addColorStop(0.35, '#fb923c');
            rad.addColorStop(0.7, 'rgba(234, 88, 12, 0.35)');
            rad.addColorStop(1, 'rgba(234, 88, 12, 0)');
            ctx.fillStyle = rad;
            ctx.beginPath();
            ctx.arc(cx, cy + 30, 130, 0, Math.PI * 2);
            ctx.fill();
        } else if (theme === 'mountains' || theme === 'castle' || theme === 'swamp') {
            // Full moon + stars
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            for (let s = 0; s < 35; s++) {
                const sx = ((s * 173) % this.width);
                const sy = ((s * 97) % 340);
                ctx.fillRect(sx, sy, (s % 2) + 1, (s % 2) + 1);
            }
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.arc(cx, cy, 42, 0, Math.PI * 2);
            ctx.fill();
        } else if (theme === 'ice') {
            // Aurora borealis ribbons
            for (let i = 0; i < 3; i++) {
                ctx.strokeStyle = i === 0 ? 'rgba(45, 212, 191, 0.28)' : i === 1 ? 'rgba(56, 189, 248, 0.24)' : 'rgba(168, 85, 247, 0.2)';
                ctx.lineWidth = 28;
                ctx.beginPath();
                for (let x = 0; x <= this.width; x += 60) {
                    const y = 110 + i * 45 + Math.sin(x * 0.008 + time * 1.2 + i) * 26 - camera.y * 0.1;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        } else if (theme === 'volcano' || theme === 'lair') {
            // Arcane / Volcanic ominous moon vortex
            const rad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 95);
            rad.addColorStop(0, theme === 'lair' ? '#4ade80' : '#fef08a');
            rad.addColorStop(0.4, theme === 'lair' ? 'rgba(147, 51, 234, 0.5)' : 'rgba(220, 38, 38, 0.5)');
            rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = rad;
            ctx.beginPath();
            ctx.arc(cx, cy, 95, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawSkyClouds(ctx, theme, camera, time) {
        ctx.save();
        let cloudColor = 'rgba(255, 255, 255, 0.55)';
        if (theme === 'caves') cloudColor = 'rgba(139, 92, 246, 0.18)';
        else if (theme === 'desert') cloudColor = 'rgba(254, 215, 170, 0.45)';
        else if (theme === 'volcano') cloudColor = 'rgba(127, 29, 29, 0.45)';
        else if (theme === 'swamp') cloudColor = 'rgba(163, 230, 53, 0.2)';
        else if (theme === 'castle') cloudColor = 'rgba(148, 163, 184, 0.3)';
        else if (theme === 'lair') cloudColor = 'rgba(88, 28, 135, 0.35)';

        ctx.fillStyle = cloudColor;
        for (let i = 0; i < 18; i++) {
            const worldX = (i * 360 + time * 12) % 6400;
            const worldY = 110 + ((i * 83) % 340);
            const sx = worldX - camera.x * 0.55;
            const sy = worldY - camera.y;
            if (sx < -200 || sx > this.width + 200) continue;

            ctx.beginPath();
            ctx.arc(sx, sy, 36, 0, Math.PI * 2);
            ctx.arc(sx + 32, sy - 10, 44, 0, Math.PI * 2);
            ctx.arc(sx + 68, sy, 34, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawFarLayer(ctx, theme, camera, time) {
        ctx.save();
        const groundScreenY = 1020 - camera.y;
        const scroll = camera.x * 0.2;

        if (theme === 'village') {
            // Rolling green distant hills
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.moveTo(0, groundScreenY);
            for (let x = -100; x <= this.width + 100; x += 40) {
                const wx = x + scroll;
                const y = groundScreenY - 190 - Math.sin(wx * 0.003) * 65 - Math.cos(wx * 0.007) * 30;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(this.width, groundScreenY);
            ctx.closePath();
            ctx.fill();
        } else if (theme === 'forest') {
            // Distant dark forest silhouette
            ctx.fillStyle = '#064e3b';
            for (let i = -1; i < 16; i++) {
                const sx = (i * 120) - (scroll % 120);
                const treeH = 260 + ((i * 37) % 80);
                ctx.beginPath();
                ctx.moveTo(sx, groundScreenY);
                ctx.lineTo(sx + 60, groundScreenY - treeH);
                ctx.lineTo(sx + 120, groundScreenY);
                ctx.fill();
            }
        } else if (theme === 'mountains' || theme === 'ice') {
            // Jagged tall alpine peaks with snow caps
            for (let i = -1; i < 10; i++) {
                const peakW = 280;
                const sx = (i * 220) - (scroll % 220);
                const peakH = 360 + ((i * 53) % 110);
                ctx.fillStyle = theme === 'ice' ? '#38bdf8' : '#475569';
                ctx.beginPath();
                ctx.moveTo(sx, groundScreenY);
                ctx.lineTo(sx + peakW / 2, groundScreenY - peakH);
                ctx.lineTo(sx + peakW, groundScreenY);
                ctx.fill();

                // Snow cap
                ctx.fillStyle = '#f8fafc';
                ctx.beginPath();
                ctx.moveTo(sx + peakW / 2, groundScreenY - peakH);
                ctx.lineTo(sx + peakW * 0.34, groundScreenY - peakH * 0.68);
                ctx.lineTo(sx + peakW * 0.5, groundScreenY - peakH * 0.74);
                ctx.lineTo(sx + peakW * 0.66, groundScreenY - peakH * 0.68);
                ctx.closePath();
                ctx.fill();
            }
        } else if (theme === 'caves') {
            // Cavern ceiling stalactites & deep rock wall arches
            ctx.fillStyle = '#1e1b4b';
            for (let i = -1; i < 16; i++) {
                const sx = (i * 130) - (scroll % 130);
                const stalH = 180 + ((i * 61) % 140);
                const topY = -camera.y * 0.3;
                ctx.beginPath();
                ctx.moveTo(sx, topY);
                ctx.lineTo(sx + 45, topY + stalH);
                ctx.lineTo(sx + 90, topY);
                ctx.fill();
            }
        } else if (theme === 'desert') {
            // Great Pyramids in the distance
            for (let i = -1; i < 6; i++) {
                const sx = (i * 380) - (scroll % 380);
                const pyrH = 260 + ((i % 2) * 60);
                ctx.fillStyle = '#d97706';
                ctx.beginPath();
                ctx.moveTo(sx, groundScreenY);
                ctx.lineTo(sx + 180, groundScreenY - pyrH);
                ctx.lineTo(sx + 360, groundScreenY);
                ctx.fill();

                ctx.fillStyle = '#b45309';
                ctx.beginPath();
                ctx.moveTo(sx + 180, groundScreenY - pyrH);
                ctx.lineTo(sx + 360, groundScreenY);
                ctx.lineTo(sx + 230, groundScreenY);
                ctx.fill();
            }
        } else if (theme === 'volcano') {
            // Erupting volcanic cones with lava plumes
            for (let i = -1; i < 6; i++) {
                const sx = (i * 380) - (scroll % 380);
                const vH = 340;
                ctx.fillStyle = '#450a0a';
                ctx.beginPath();
                ctx.moveTo(sx, groundScreenY);
                ctx.lineTo(sx + 140, groundScreenY - vH);
                ctx.lineTo(sx + 220, groundScreenY - vH);
                ctx.lineTo(sx + 360, groundScreenY);
                ctx.fill();

                // Lava crater glow
                ctx.fillStyle = '#f97316';
                ctx.beginPath();
                ctx.arc(sx + 180, groundScreenY - vH, 38, 0, Math.PI, false);
                ctx.fill();
            }
        } else if (theme === 'swamp') {
            // Misty bog silhouettes
            ctx.fillStyle = '#1a2e05';
            for (let i = -1; i < 12; i++) {
                const sx = (i * 180) - (scroll % 180);
                ctx.fillRect(sx + 40, groundScreenY - 300, 26, 300);
                ctx.beginPath();
                ctx.arc(sx + 53, groundScreenY - 300, 68, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (theme === 'castle') {
            // Distant castle towers and battlements
            ctx.fillStyle = '#1e293b';
            for (let i = -1; i < 8; i++) {
                const sx = (i * 260) - (scroll % 260);
                ctx.fillRect(sx, groundScreenY - 260, 200, 260);
                ctx.fillRect(sx + 20, groundScreenY - 360, 70, 100);
                // Crenellations
                for (let c = 0; c < 4; c++) {
                    ctx.fillRect(sx + c * 52, groundScreenY - 280, 32, 20);
                }
            }
        } else if (theme === 'lair') {
            // Jagged dark obsidian monoliths
            ctx.fillStyle = '#2e1065';
            for (let i = -1; i < 10; i++) {
                const sx = (i * 200) - (scroll % 200);
                const mH = 350 + ((i * 49) % 100);
                ctx.beginPath();
                ctx.moveTo(sx, groundScreenY);
                ctx.lineTo(sx + 35, groundScreenY - mH);
                ctx.lineTo(sx + 90, groundScreenY - mH + 40);
                ctx.lineTo(sx + 130, groundScreenY);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    drawMidLayer(ctx, theme, camera, time) {
        ctx.save();
        const groundScreenY = 1020 - camera.y;
        const scroll = camera.x * 0.45;

        if (theme === 'village') {
            // Closer lush hills
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.moveTo(0, groundScreenY);
            for (let x = -50; x <= this.width + 50; x += 40) {
                const wx = x + scroll;
                const y = groundScreenY - 110 - Math.sin(wx * 0.005 + 1) * 40;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(this.width, groundScreenY);
            ctx.closePath();
            ctx.fill();
        } else if (theme === 'forest') {
            // Midground trees with trunks and leafy crowns
            for (let i = -1; i < 12; i++) {
                const sx = (i * 170) - (scroll % 170);
                ctx.fillStyle = '#451a03';
                ctx.fillRect(sx + 55, groundScreenY - 210, 28, 210);
                ctx.fillStyle = '#15803d';
                ctx.beginPath();
                ctx.arc(sx + 69, groundScreenY - 220, 62, 0, Math.PI * 2);
                ctx.arc(sx + 40, groundScreenY - 190, 46, 0, Math.PI * 2);
                ctx.arc(sx + 98, groundScreenY - 190, 46, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (theme === 'mountains') {
            // Closer rocky ridges
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.moveTo(0, groundScreenY);
            for (let x = 0; x <= this.width + 80; x += 80) {
                const wx = x + scroll;
                const y = groundScreenY - 150 - Math.abs(Math.sin(wx * 0.004)) * 95;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(this.width, groundScreenY);
            ctx.closePath();
            ctx.fill();
        } else if (theme === 'caves') {
            // Glowing crystal formations & stalagmites
            for (let i = -1; i < 12; i++) {
                const sx = (i * 180) - (scroll % 180);
                ctx.fillStyle = i % 2 === 0 ? 'rgba(168, 85, 247, 0.45)' : 'rgba(34, 211, 238, 0.4)';
                ctx.beginPath();
                ctx.moveTo(sx + 20, groundScreenY);
                ctx.lineTo(sx + 45, groundScreenY - 150);
                ctx.lineTo(sx + 70, groundScreenY);
                ctx.fill();
            }
        } else if (theme === 'desert') {
            // Golden sand dunes
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(0, groundScreenY);
            for (let x = -40; x <= this.width + 40; x += 40) {
                const wx = x + scroll;
                const y = groundScreenY - 95 - Math.sin(wx * 0.004) * 45;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(this.width, groundScreenY);
            ctx.closePath();
            ctx.fill();
        } else if (theme === 'ice') {
            // Translucent glacial ridges
            ctx.fillStyle = 'rgba(125, 211, 252, 0.5)';
            for (let i = -1; i < 12; i++) {
                const sx = (i * 160) - (scroll % 160);
                ctx.beginPath();
                ctx.moveTo(sx, groundScreenY);
                ctx.lineTo(sx + 40, groundScreenY - 170);
                ctx.lineTo(sx + 95, groundScreenY - 120);
                ctx.lineTo(sx + 140, groundScreenY);
                ctx.fill();
            }
        } else if (theme === 'volcano') {
            // Glowing magma river & jagged basalt hills
            ctx.fillStyle = '#7f1d1d';
            ctx.fillRect(0, groundScreenY - 90, this.width, 90);
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(0, groundScreenY - 28, this.width, 18);
        } else if (theme === 'swamp') {
            // Low swamp fog & reeds
            ctx.fillStyle = 'rgba(132, 204, 22, 0.18)';
            ctx.fillRect(0, groundScreenY - 120, this.width, 120);
        } else if (theme === 'castle') {
            // Castle arched colonnade
            ctx.fillStyle = '#334155';
            for (let i = -1; i < 10; i++) {
                const sx = (i * 180) - (scroll % 180);
                ctx.fillRect(sx + 20, groundScreenY - 220, 34, 220);
                ctx.fillStyle = '#fef08a';
                ctx.fillRect(sx + 85, groundScreenY - 160, 28, 55); // Lit window
                ctx.fillStyle = '#334155';
            }
        } else if (theme === 'lair') {
            // Arcane green energy pillars
            for (let i = -1; i < 10; i++) {
                const sx = (i * 210) - (scroll % 210);
                ctx.fillStyle = 'rgba(74, 222, 128, 0.22)';
                ctx.fillRect(sx + 60, groundScreenY - 280, 24, 280);
            }
        }
        ctx.restore();
    }

    drawNearProps(ctx, theme, camera, time) {
        ctx.save();
        const groundY = 1020 - camera.y;
        const scroll = camera.x * 0.85;

        if (theme === 'village') {
            // Village Cottages, Roofs, Chimneys, Fences & Trees
            for (let i = -1; i < 14; i++) {
                const sx = (i * 340) - (scroll % 340);
                // Cottage walls
                ctx.fillStyle = '#fef3c7';
                ctx.fillRect(sx + 30, groundY - 120, 130, 120);
                // Timber beams
                ctx.fillStyle = '#78350f';
                ctx.fillRect(sx + 30, groundY - 120, 8, 120);
                ctx.fillRect(sx + 152, groundY - 120, 8, 120);
                ctx.fillRect(sx + 30, groundY - 65, 130, 7);
                // Chimney
                ctx.fillStyle = '#991b1b';
                ctx.fillRect(sx + 125, groundY - 165, 22, 45);
                // Pitched Roof
                ctx.fillStyle = '#b91c1c';
                ctx.beginPath();
                ctx.moveTo(sx + 14, groundY - 120);
                ctx.lineTo(sx + 95, groundY - 180);
                ctx.lineTo(sx + 176, groundY - 120);
                ctx.closePath();
                ctx.fill();
                // Door & warm glowing window
                ctx.fillStyle = '#451a03';
                ctx.fillRect(sx + 52, groundY - 52, 28, 52);
                ctx.fillStyle = '#fde047';
                ctx.fillRect(sx + 102, groundY - 95, 30, 26);
                // Wooden Fence next to cottage
                ctx.fillStyle = '#b45309';
                ctx.fillRect(sx + 185, groundY - 28, 110, 6);
                ctx.fillRect(sx + 185, groundY - 14, 110, 6);
                for (let p = 0; p < 5; p++) {
                    ctx.fillRect(sx + 190 + p * 24, groundY - 38, 7, 38);
                }
            }
        } else if (theme === 'forest') {
            // Bushes & spotted red mushrooms
            for (let i = -1; i < 18; i++) {
                const sx = (i * 220) - (scroll % 220);
                ctx.fillStyle = '#16a34a';
                ctx.beginPath();
                ctx.arc(sx + 40, groundY - 18, 28, 0, Math.PI * 2);
                ctx.arc(sx + 70, groundY - 14, 22, 0, Math.PI * 2);
                ctx.fill();
                // Mushroom
                ctx.fillStyle = '#fef3c7';
                ctx.fillRect(sx + 140, groundY - 22, 10, 22);
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(sx + 145, groundY - 22, 16, Math.PI, 0);
                ctx.fill();
            }
        } else if (theme === 'mountains') {
            // Pine trees & boulders
            for (let i = -1; i < 16; i++) {
                const sx = (i * 240) - (scroll % 240);
                ctx.fillStyle = '#1e293b';
                ctx.beginPath();
                ctx.arc(sx + 50, groundY - 12, 32, Math.PI, 0);
                ctx.fill();
                // Pine tree
                ctx.fillStyle = '#065f46';
                ctx.beginPath();
                ctx.moveTo(sx + 130, groundY - 15);
                ctx.lineTo(sx + 165, groundY - 110);
                ctx.lineTo(sx + 200, groundY - 15);
                ctx.fill();
            }
        } else if (theme === 'caves') {
            // Glowing crystal clusters on ground
            for (let i = -1; i < 16; i++) {
                const sx = (i * 230) - (scroll % 230);
                ctx.fillStyle = i % 2 === 0 ? '#c084fc' : '#22d3ee';
                ctx.beginPath();
                ctx.moveTo(sx + 40, groundY);
                ctx.lineTo(sx + 55, groundY - 68);
                ctx.lineTo(sx + 72, groundY);
                ctx.moveTo(sx + 65, groundY);
                ctx.lineTo(sx + 84, groundY - 48);
                ctx.lineTo(sx + 96, groundY);
                ctx.fill();
            }
        } else if (theme === 'desert') {
            // Saguaro cacti & sandstone ruins
            for (let i = -1; i < 16; i++) {
                const sx = (i * 250) - (scroll % 250);
                ctx.fillStyle = '#15803d';
                ctx.fillRect(sx + 60, groundY - 95, 16, 95);
                ctx.fillRect(sx + 40, groundY - 65, 20, 12);
                ctx.fillRect(sx + 40, groundY - 85, 12, 25);
                ctx.fillRect(sx + 76, groundY - 55, 20, 12);
                ctx.fillRect(sx + 84, groundY - 78, 12, 28);
            }
        } else if (theme === 'ice') {
            // Ice crystal spires & falling snow
            for (let i = -1; i < 16; i++) {
                const sx = (i * 230) - (scroll % 230);
                ctx.fillStyle = '#bae6fd';
                ctx.beginPath();
                ctx.moveTo(sx + 50, groundY);
                ctx.lineTo(sx + 70, groundY - 85);
                ctx.lineTo(sx + 90, groundY);
                ctx.fill();
            }
            // Snowflakes
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            for (let s = 0; s < 40; s++) {
                const fx = ((s * 97 + time * 40) % this.width);
                const fy = ((s * 61 + time * 90) % this.height);
                ctx.beginPath();
                ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (theme === 'volcano') {
            // Lava geysers & rising embers
            for (let s = 0; s < 35; s++) {
                const fx = ((s * 113 + time * 30) % this.width);
                const fy = this.height - ((s * 71 + time * 110) % this.height);
                ctx.fillStyle = s % 2 === 0 ? '#fb923c' : '#fde047';
                ctx.fillRect(fx, fy, 3, 3);
            }
        } else if (theme === 'swamp') {
            // Hanging vines, swamp lanterns & fireflies
            for (let s = 0; s < 28; s++) {
                const fx = ((s * 131 + Math.sin(time * 2 + s) * 25) % this.width);
                const fy = 200 + ((s * 83) % 450);
                ctx.fillStyle = '#bef264';
                ctx.beginPath();
                ctx.arc(fx, fy, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (theme === 'castle') {
            // Royal banners & flickering wall torches
            for (let i = -1; i < 16; i++) {
                const sx = (i * 220) - (scroll % 220);
                // Banner
                ctx.fillStyle = '#dc2626';
                ctx.fillRect(sx + 60, groundY - 150, 36, 85);
                ctx.fillStyle = '#fbbf24';
                ctx.fillRect(sx + 60, groundY - 150, 36, 8);
                // Torch
                ctx.fillStyle = '#78350f';
                ctx.fillRect(sx + 150, groundY - 90, 8, 32);
                ctx.fillStyle = '#f97316';
                ctx.beginPath();
                ctx.arc(sx + 154, groundY - 96, 9 + Math.sin(time * 10 + i) * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (theme === 'lair') {
            // Hellfire braziers & glowing runes
            for (let i = -1; i < 16; i++) {
                const sx = (i * 240) - (scroll % 240);
                ctx.fillStyle = '#1f2937';
                ctx.fillRect(sx + 70, groundY - 60, 28, 60);
                ctx.fillStyle = '#22c55e';
                ctx.beginPath();
                ctx.arc(sx + 84, groundY - 68, 14 + Math.sin(time * 8 + i) * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    // ==========================================
    // TEXTURED PLATFORMS & CLOUD PLATFORMS
    // ==========================================
    draw(camera, level, time = 0) {
        const ctx = this.ctx;
        const theme = (level && level.theme) || 'village';

        this.platforms.forEach(p => {
            const dx = p.x - camera.x;
            const dy = p.y - camera.y;

            // Frustum culling
            if (dx + p.w < -60 || dx > this.width + 60 || dy + p.h < -60 || dy > this.height + 60) {
                return;
            }

            if (p.isCloud) {
                this.drawCloudPlatform(ctx, dx, dy, p.w, p.h, theme, time);
            } else if (p.isGround || p.h >= 80) {
                this.drawGroundPlatform(ctx, dx, dy, p.w, p.h, p, theme, camera);
            } else {
                this.drawMidPlatform(ctx, dx, dy, p.w, p.h, p, theme);
            }
        });
    }

    drawCloudPlatform(ctx, dx, dy, w, h, theme, time) {
        ctx.save();
        const mainColor = theme === 'volcano' ? 'rgba(254, 215, 170, 0.92)'
            : theme === 'lair' ? 'rgba(216, 180, 254, 0.9)'
            : theme === 'caves' ? 'rgba(165, 243, 252, 0.88)'
            : 'rgba(255, 255, 255, 0.94)';
        const trimColor = theme === 'volcano' ? '#fb923c'
            : theme === 'lair' ? '#a855f7'
            : theme === 'caves' ? '#22d3ee'
            : '#bae6fd';

        // Soft underside shadow
        ctx.fillStyle = trimColor;
        ctx.beginPath();
        ctx.roundRect(dx, dy + 4, w, h, 12);
        ctx.fill();

        // Fluffy cloud puffs along the top
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.roundRect(dx, dy, w, h - 2, 12);
        const step = 28;
        for (let cx = dx + 16; cx < dx + w - 10; cx += step) {
            ctx.moveTo(cx, dy);
            ctx.arc(cx, dy + 4, 16, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
    }

    drawGroundPlatform(ctx, dx, dy, w, h, p, theme, camera) {
        ctx.save();
        const visibleX = Math.max(0, dx);
        const visibleW = Math.min(this.width, dx + w) - visibleX;
        if (visibleW <= 0) {
            ctx.restore();
            return;
        }

        // Main ground body
        ctx.fillStyle = p.color || '#5c4033';
        ctx.fillRect(visibleX, dy, visibleW, h);

        // Top surface crust (grass / snow / sand / magma / stone trim)
        const topColor = p.topColor || '#22c55e';
        ctx.fillStyle = topColor;
        ctx.fillRect(visibleX, dy, visibleW, 14);

        // Sub-surface brick/rock texture blocks
        ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
        const startWorldX = Math.floor((visibleX + camera.x) / 64) * 64;
        const endWorldX = visibleX + visibleW + camera.x;
        for (let wx = startWorldX; wx < endWorldX; wx += 64) {
            const bx = wx - camera.x;
            ctx.fillRect(bx, dy + 22, 46, 16);
            ctx.fillRect(bx + 24, dy + 46, 46, 16);
            ctx.fillRect(bx + 8, dy + 72, 46, 16);
        }
        ctx.restore();
    }

    drawMidPlatform(ctx, dx, dy, w, h, p, theme) {
        ctx.save();
        // Base platform block
        ctx.fillStyle = p.color || '#8b5a2b';
        ctx.beginPath();
        ctx.roundRect(dx, dy, w, h, 5);
        ctx.fill();

        // Top highlight / grass / snow / stone trim
        ctx.fillStyle = p.topColor || 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(dx + 2, dy, w - 4, 6);

        // Plank / brick vertical dividers
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.lineWidth = 2;
        for (let px = dx + 32; px < dx + w - 10; px += 32) {
            ctx.beginPath();
            ctx.moveTo(px, dy + 2);
            ctx.lineTo(px, dy + h - 2);
            ctx.stroke();
        }

        // Outer border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(dx, dy, w, h);
        ctx.restore();
    }
}
