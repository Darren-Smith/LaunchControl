export class MineScene {
    constructor(width = 1200, height = 700) {
        this.width = width;
        this.height = height;
        this.time = 0;

        // Flickering Oil Lamps placed along timber posts & tracks
        this.lamps = [
            { x: 115, y: 85, phase: 0.2, radius: 135 },
            { x: 430, y: 92, phase: 1.4, radius: 140 },
            { x: 760, y: 90, phase: 2.8, radius: 140 },
            { x: 1075, y: 95, phase: 4.1, radius: 135 },
            { x: 120, y: 615, phase: 3.3, radius: 135 },
            { x: 485, y: 610, phase: 0.9, radius: 145 },
            { x: 840, y: 612, phase: 2.1, radius: 140 },
            { x: 580, y: 348, phase: 5.0, radius: 165 } // Central depot lantern post
        ];

        // Monster Cave Tunnels on right & top-right perimeter
        this.tunnels = [
            { x: 1168, y: 185, angle: Math.PI },
            { x: 1168, y: 365, angle: Math.PI },
            { x: 1168, y: 545, angle: Math.PI }
        ];

        // Minecarts on the tracks (1 stationary loaded cart, 1 slowly shuttling cart)
        this.carts = [
            { x: 250, y: 122, dir: 1, minX: 160, maxX: 670, speed: 24, angle: 0, fill: 0.85 },
            { x: 540, y: 582, dir: -1, minX: 210, maxX: 790, speed: 18, angle: 0, fill: 1.0 }
        ];

        // Pre-render static floor, gravel, walls, timber beams, and tracks to offscreen canvas
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.width = this.width;
        this.bgCanvas.height = this.height;
        this.renderStaticLayer(this.bgCanvas.getContext('2d'));
    }

    // Deterministic pseudo-random helper so gravel & stones look handcrafted
    seededRandom(seed) {
        let s = seed % 2147483647;
        if (s <= 0) s += 2147483646;
        return () => {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }

    renderStaticLayer(ctx) {
        const rand = this.seededRandom(133742);
        const w = this.width;
        const h = this.height;

        // 1. Deep Subterranean Earthen Slate Floor
        const floorGrad = ctx.createRadialGradient(w * 0.45, h * 0.5, 60, w * 0.5, h * 0.5, w * 0.75);
        floorGrad.addColorStop(0, '#251e19');
        floorGrad.addColorStop(0.6, '#1a1512');
        floorGrad.addColorStop(1, '#110d0b');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, 0, w, h);

        // 2. Subtle Dirt Patches & Cavern Floor Strata
        for (let i = 0; i < 45; i++) {
            const px = 40 + rand() * (w - 80);
            const py = 40 + rand() * (h - 80);
            const rx = 30 + rand() * 80;
            const ry = 20 + rand() * 55;
            ctx.fillStyle = i % 2 === 0 ? 'rgba(42, 33, 26, 0.36)' : 'rgba(15, 12, 10, 0.35)';
            ctx.beginPath();
            ctx.ellipse(px, py, rx, ry, rand() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Floor Flagstone Cracks
        ctx.strokeStyle = 'rgba(10, 8, 6, 0.55)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 32; i++) {
            let cx = 50 + rand() * (w - 100);
            let cy = 50 + rand() * (h - 100);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            const segs = 3 + Math.floor(rand() * 4);
            for (let s = 0; s < segs; s++) {
                cx += (rand() - 0.5) * 45;
                cy += (rand() - 0.5) * 45;
                ctx.lineTo(cx, cy);
            }
            ctx.stroke();
        }

        // 4. Scattered Gravel, Pebbles & Rubble Clusters
        const gravelColors = ['#3b322c', '#2c2520', '#4a3f37', '#574c44', '#241e1a'];
        for (let i = 0; i < 420; i++) {
            const gx = 28 + rand() * (w - 56);
            const gy = 28 + rand() * (h - 56);
            const gr = 1.8 + rand() * 4.5;
            ctx.fillStyle = gravelColors[Math.floor(rand() * gravelColors.length)];
            ctx.beginPath();
            ctx.ellipse(gx, gy, gr, gr * (0.65 + rand() * 0.35), rand() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        // 5. Minecart Railway Tracks (Top Track + Bottom Track + Diagonal Spur)
        this.drawRailTrack(ctx, 70, 122, 740, 122);
        this.drawRailTrack(ctx, 130, 582, 860, 582);
        this.drawRailTrack(ctx, 430, 122, 560, 345); // Diagonal branch to central depot

        // End-of-track Wooden Bumpers
        this.drawTrackBumper(ctx, 742, 122);
        this.drawTrackBumper(ctx, 862, 582);
        this.drawTrackBumper(ctx, 562, 345);

        // 6. Decorative Props: Timber Crates, Pickaxe Barrel, Glowing Cave Mushrooms, Rubble Piles
        this.drawOrePile(ctx, 595, 325, 26);
        this.drawOrePile(ctx, 102, 155, 20);
        this.drawOrePile(ctx, 155, 608, 22);
        this.drawTimberCrate(ctx, 622, 368, 22, 22);
        this.drawTimberCrate(ctx, 648, 362, 18, 18);

        // Glowing Bioluminescent Goblin Cave Mushrooms near walls
        const shrooms = [
            { x: 65, y: 260 }, { x: 78, y: 470 }, { x: 340, y: 46 },
            { x: 660, y: 48 }, { x: 360, y: 652 }, { x: 960, y: 648 }
        ];
        for (const sh of shrooms) {
            this.drawCaveMushrooms(ctx, sh.x, sh.y);
        }

        // 7. Rough Jagged Cavern Rock Perimeter & Heavy Timber Support Beams
        this.drawCavernPerimeter(ctx, w, h, rand);

        // 8. Goblin Monster Tunnel Entrances on the Right Wall
        for (const t of this.tunnels) {
            this.drawTunnelEntrance(ctx, t.x, t.y);
        }

        // 9. Static Post Mounts for the Hanging Oil Lamps
        for (const lamp of this.lamps) {
            ctx.fillStyle = '#4a321f';
            ctx.strokeStyle = '#291b10';
            ctx.lineWidth = 2;
            ctx.fillRect(lamp.x - 6, lamp.y - 6, 12, 12);
            ctx.strokeRect(lamp.x - 6, lamp.y - 6, 12, 12);
        }
    }

    drawRailTrack(ctx, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(x1, y1);
        ctx.rotate(angle);

        // Gravel ballast bed under the rails
        ctx.fillStyle = 'rgba(48, 41, 36, 0.72)';
        ctx.fillRect(-6, -15, len + 12, 30);

        // Wooden railway sleepers (ties)
        const tieSpacing = 18;
        const numTies = Math.floor(len / tieSpacing);
        for (let i = 0; i <= numTies; i++) {
            const tx = i * tieSpacing;
            ctx.fillStyle = '#4d331f';
            ctx.fillRect(tx - 3, -13, 6, 26);
            ctx.strokeStyle = '#26180e';
            ctx.lineWidth = 1;
            ctx.strokeRect(tx - 3, -13, 6, 26);

            // Iron rail spikes
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(tx - 1, -9, 2, 2);
            ctx.fillRect(tx - 1, 7, 2, 2);
        }

        // Twin Iron Rails with metallic highlight
        ctx.fillStyle = '#475569';
        ctx.fillRect(0, -9, len, 3.5);
        ctx.fillRect(0, 5.5, len, 3.5);

        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(0, -8.5, len, 1.2);
        ctx.fillRect(0, 6, len, 1.2);

        ctx.restore();
    }

    drawTrackBumper(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = '#6b4423';
        ctx.strokeStyle = '#2d1c0e';
        ctx.lineWidth = 2;
        ctx.fillRect(-4, -15, 8, 30);
        ctx.strokeRect(-4, -15, 8, 30);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-2, -10, 4, 6);
        ctx.fillRect(-2, 4, 4, 6);
        ctx.restore();
    }

    drawOrePile(ctx, x, y, r) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        // Glittering diamond & gold flecks
        const flecks = [
            { dx: -6, dy: -4, c: '#2dd4bf' },
            { dx: 5, dy: -6, c: '#fbbf24' },
            { dx: 3, dy: 6, c: '#2dd4bf' },
            { dx: -7, dy: 5, c: '#38bdf8' }
        ];
        for (const f of flecks) {
            ctx.fillStyle = f.c;
            ctx.beginPath();
            ctx.arc(f.dx, f.dy, 3.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawTimberCrate(ctx, x, y, w, h) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = '#5c3d24';
        ctx.strokeStyle = '#2b1b0f';
        ctx.lineWidth = 2;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        ctx.beginPath();
        ctx.moveTo(-w / 2, -h / 2);
        ctx.lineTo(w / 2, h / 2);
        ctx.stroke();
        ctx.restore();
    }

    drawCaveMushrooms(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        const caps = [{ dx: 0, dy: 0, r: 5 }, { dx: 7, dy: 3, r: 3.8 }, { dx: -6, dy: 4, r: 3.5 }];
        for (const c of caps) {
            ctx.fillStyle = 'rgba(45, 212, 191, 0.22)';
            ctx.beginPath();
            ctx.arc(c.dx, c.dy, c.r * 2.1, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2dd4bf';
            ctx.beginPath();
            ctx.arc(c.dx, c.dy, c.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawCavernPerimeter(ctx, w, h, rand) {
        ctx.fillStyle = '#1f1916';
        ctx.strokeStyle = '#0d0a08';
        ctx.lineWidth = 2;

        // Top & Bottom rock border bumps
        for (let x = 0; x < w; x += 38) {
            const rTop = 18 + rand() * 14;
            ctx.beginPath();
            ctx.arc(x + 18, 6, rTop, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            const rBot = 18 + rand() * 14;
            ctx.beginPath();
            ctx.arc(x + 18, h - 6, rBot, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Left & Right rock border bumps
        for (let y = 0; y < h; y += 38) {
            const rLeft = 18 + rand() * 14;
            ctx.beginPath();
            ctx.arc(6, y + 18, rLeft, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            const rRight = 18 + rand() * 14;
            ctx.beginPath();
            ctx.arc(w - 6, y + 18, rRight, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Heavy Timber Support Beams along walls
        const beamX = [160, 420, 680, 940];
        for (const bx of beamX) {
            // Top beam
            ctx.fillStyle = '#5c3c22';
            ctx.fillRect(bx - 14, 0, 28, 22);
            ctx.strokeRect(bx - 14, 0, 28, 22);
            // Bottom beam
            ctx.fillRect(bx - 14, h - 22, 28, 22);
            ctx.strokeRect(bx - 14, h - 22, 28, 22);
        }
    }

    drawTunnelEntrance(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Timber archway around monster tunnel
        ctx.fillStyle = '#4f331c';
        ctx.strokeStyle = '#24160b';
        ctx.lineWidth = 2;
        ctx.fillRect(-16, -42, 30, 84);
        ctx.strokeRect(-16, -42, 30, 84);

        // Pitch black tunnel mouth
        ctx.fillStyle = '#070504';
        ctx.beginPath();
        ctx.arc(4, 0, 34, Math.PI * 0.5, Math.PI * 1.5);
        ctx.closePath();
        ctx.fill();

        // Warning skull / goblin scratch marks on timber
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, -28);
        ctx.lineTo(-4, -18);
        ctx.moveTo(-4, -28);
        ctx.lineTo(-12, -18);
        ctx.stroke();

        ctx.restore();
    }

    update(dt, overdrive = false) {
        this.time += dt;
        const speedMult = overdrive ? 2.2 : 1.0;

        for (const cart of this.carts) {
            cart.x += cart.dir * cart.speed * speedMult * dt;
            if (cart.x > cart.maxX) {
                cart.x = cart.maxX;
                cart.dir = -1;
            } else if (cart.x < cart.minX) {
                cart.x = cart.minX;
                cart.dir = 1;
            }
        }
    }

    drawBackground(ctx) {
        // 1. Draw pre-rendered static cavern floor, gravel, rails, and walls
        ctx.drawImage(this.bgCanvas, 0, 0);

        // 2. Draw Moving Minecarts filled with glittering diamonds & gold
        for (const cart of this.carts) {
            this.drawMinecart(ctx, cart);
        }

        // 3. Draw Eerie Red Goblin Eyes blinking inside the dark monster tunnels
        const blink = Math.sin(this.time * 3.2) > -0.6;
        if (blink) {
            for (const t of this.tunnels) {
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(t.x - 10, t.y - 6, 2.5, 0, Math.PI * 2);
                ctx.arc(t.x - 10, t.y + 4, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawMinecart(ctx, cart) {
        ctx.save();
        ctx.translate(cart.x, cart.y);

        // Iron wheels
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-16, -13, 8, 4);
        ctx.fillRect(8, -13, 8, 4);
        ctx.fillRect(-16, 9, 8, 4);
        ctx.fillRect(8, 9, 8, 4);

        // Heavy riveted iron cart body
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-20, -10, 40, 20, 4);
        ctx.fill();
        ctx.stroke();

        // Inner dark bed
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-16, -7, 32, 14);

        // Glittering diamond & gold ore load inside the cart
        const gems = [
            { x: -10, y: -2, c: '#2dd4bf', r: 4 },
            { x: -3, y: 2, c: '#fbbf24', r: 4.2 },
            { x: 4, y: -3, c: '#38bdf8', r: 4.5 },
            { x: 10, y: 2, c: '#2dd4bf', r: 3.8 },
            { x: 0, y: -1, c: '#f59e0b', r: 3.5 }
        ];
        for (const g of gems) {
            ctx.fillStyle = g.c;
            ctx.beginPath();
            ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Brass rim band
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-18, -9, 36, 18);

        ctx.restore();
    }

    drawLighting(ctx) {
        // Warm flickering oil lamps casting amber glow pools across the mine
        for (const lamp of this.lamps) {
            const flicker = Math.sin(this.time * 7.5 + lamp.phase) * 0.06 + Math.cos(this.time * 13.0 + lamp.phase) * 0.04;
            const r = lamp.radius * (1 + flicker);

            const grad = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, r);
            grad.addColorStop(0, 'rgba(254, 240, 138, 0.38)');
            grad.addColorStop(0.35, 'rgba(245, 158, 11, 0.16)');
            grad.addColorStop(1, 'rgba(245, 158, 11, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(lamp.x, lamp.y, r, 0, Math.PI * 2);
            ctx.fill();

            // Lantern core flame
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(lamp.x, lamp.y, 4.5 + flicker * 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(lamp.x, lamp.y, 6, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}
