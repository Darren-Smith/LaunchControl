const canvas = document.getElementById('birthdayCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const replayButton = document.getElementById('replayButton');

let width, height;
const colors = ['#FF1493', '#00FFFF', '#32CD32', '#FFD700', '#FF4500', '#8A2BE2', '#ff4757', '#ffa502', '#2ed573', '#1e90ff'];

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

// Mouse State
const mouse = { x: -1000, y: -1000, vx: 0, vy: 0, px: -1000, py: -1000, down: false };
window.addEventListener('mousemove', (e) => {
    mouse.px = mouse.x;
    mouse.py = mouse.y;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.vx = mouse.x - mouse.px;
    mouse.vy = mouse.y - mouse.py;
});
window.addEventListener('mousedown', () => mouse.down = true);
window.addEventListener('mouseup', () => mouse.down = false);
window.addEventListener('mouseout', () => { mouse.x = -1000; mouse.y = -1000; });
window.addEventListener('touchmove', (e) => {
    if(e.touches.length > 0) {
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.vx = mouse.x - mouse.px;
        mouse.vy = mouse.y - mouse.py;
    }
});
window.addEventListener('touchend', () => { mouse.x = -1000; mouse.y = -1000; });

// Audio
const bgAudio = new Audio('Assets/Birthday Celebration Beat.wav');

// Global State
const STATE = { WAITING: 0, TENSION: 1, DRUMROLL: 2, FANFARE: 3, CLIMAX: 4, PLAY: 5 };
let currentState = STATE.WAITING;

// Entities
let balloons = [];
let confetti = [];
let fireworks = [];
let textLetters = [];
let screenShake = 0;
let mouseTrail = [];

class TrailParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 3; // slightly bigger for better whoosh
        this.alpha = 1;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.04;
        this.size *= 0.95;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Balloon {
    constructor(x, y, isBig8) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = isBig8 ? 1 : Math.random() * 2 + 1;
        this.isBig8 = isBig8;
        // Increased balloon sizes
        this.r = isBig8 ? Math.min(width, height) * 0.2 : (Math.random() * 25 + 35) * 1.3;
        this.color = isBig8 ? '#ff4757' : colors[Math.floor(Math.random() * colors.length)];
        this.stringLen = this.r * 1.5;
        // Base floor is 60px above bottom screen edge.
        // Balloon center needs to be 'r' above its specific spot on the floor (ignoring string).
        this.floorY = (height - 60) - this.r - (Math.random() * 80); 
        this.gravity = isBig8 ? 0.08 : 0.04 + Math.random() * 0.03;
    }

    update() {
        if (currentState === STATE.PLAY) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < this.r + 60) {
                // Agitate: float up fast
                this.vy -= (1 - dist / (this.r + 60)) * 6;
                this.vx += (dx / dist) * 3;
            }
        }

        this.vy += this.gravity;
        
        // Air friction
        this.vy *= 0.98;
        this.vx *= 0.95;

        this.x += this.vx;
        this.y += this.vy;

        // Floor collision
        if (this.y > this.floorY) {
            this.y = this.floorY;
            if (this.vy > 1) {
                if(this.isBig8 && currentState === STATE.FANFARE) {
                    screenShake = 15;
                }
            }
            this.vy *= -0.4; // Light bounce
            this.vx *= 0.8; // Friction on floor
        }
        
        // Walls
        if (this.x < this.r) { this.x = this.r; this.vx *= -0.5; }
        if (this.x > width - this.r) { this.x = width - this.r; this.vx *= -0.5; }
        
        // Ceiling limit for balloons to not get completely lost
        if (this.y < -this.r) {
            this.vy += 0.5; // push back down if too high
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // String
        ctx.beginPath();
        ctx.moveTo(0, this.r);
        ctx.quadraticCurveTo(this.vx * 2, this.stringLen / 2, 0, this.stringLen);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Balloon body
        ctx.beginPath();
        let scaleY = 1 + Math.abs(this.vy * 0.015);
        let scaleX = 1 - Math.abs(this.vy * 0.005);
        ctx.scale(scaleX, Math.max(0.5, scaleY));
        ctx.arc(0, 0, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Highlight
        ctx.beginPath();
        ctx.arc(-this.r * 0.3, -this.r * 0.3, this.r * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fill();

        // Big 8
        if (this.isBig8) {
            ctx.fillStyle = 'white';
            ctx.font = `bold ${this.r * 1.3}px 'Fredoka'`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('8', 0, 0);
        }
        ctx.restore();
    }
}

class Confetti {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        // Massive burst to reach ~90% of width/height
        this.vx = (Math.random() - 0.5) * 80;
        this.vy = (Math.random() - 1) * 60;
        // Double width/size
        this.size = (Math.random() * 10 + 5) * 2; 
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.2;
        this.gravity = 0.2;
        // Confetti scatters around the 3D floor area
        this.floorY = (height - 60) + (Math.random() * 100 - 50);
    }
    update() {
        if (currentState === STATE.PLAY) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 100) {
                // Whoosh up
                this.vy -= (1 - dist / 100) * 8;
                this.vx += (dx / dist) * 5;
            }
        }

        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.angle += this.spin;
        
        this.vx *= 0.95; // air resistance
        this.vy *= 0.98;

        if (this.y > this.floorY) {
            this.y = this.floorY;
            this.vy *= -0.2;
            this.vx *= 0.5;
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size * 0.6); // slight rectangle
        ctx.restore();
    }
}

class Firework {
    constructor() {
        this.x = Math.random() * width;
        this.y = height + 100;
        // Burst in the top 30% of the screen (sky)
        this.targetY = Math.random() * (height * 0.3) + 20;
        
        // 1 in 5 chance to be a massive firework
        this.isMassive = Math.random() < 0.2;
        
        this.vx = (Math.random() - 0.5) * 4;
        this.gravity = 0.15;
        // Calculate exact velocity needed to reach targetY before falling
        this.vy = -Math.sqrt(2 * this.gravity * (this.y - this.targetY));
        
        this.exploded = false;
        this.particles = [];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
        if (!this.exploded) {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity; 
            if (this.vy >= 0 || this.y <= this.targetY) {
                this.explode();
            }
        } else {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                let p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += this.gravity * 0.3; // Floatier gravity for particles
                p.alpha -= this.isMassive ? 0.008 : 0.015; // Massive ones last longer
                if (p.alpha <= 0) {
                    this.particles.splice(i, 1);
                }
            }
        }
    }
    explode() {
        this.exploded = true;
        const particleCount = this.isMassive ? 200 : 50;
        const baseSpeed = this.isMassive ? 12 : 4;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * baseSpeed + 1;
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                size: this.isMassive ? Math.random() * 3 + 2 : 2,
                color: Math.random() > 0.5 ? this.color : '#fff'
            });
        }
    }
    draw() {
        if (!this.exploded) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.isMassive ? 5 : 3, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        } else {
            this.particles.forEach(p => {
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size || 2, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            });
            ctx.globalAlpha = 1;
        }
    }
}

class TextLetter {
    constructor(char, x, y, size, color, index) {
        this.char = char;
        this.targetX = x;
        this.targetY = y;
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.scale = 0; // for pop in
        this.vibration = 0;
        this.index = index; // for bobbing offset
    }
    update() {
        if (this.scale < 1) {
            this.scale += 0.05;
        } else if (this.scale > 1) {
            this.scale -= 0.02;
        }
        
        if (currentState === STATE.PLAY) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            if (dx*dx + dy*dy < 10000) {
                this.vibration = 10;
            }
        }
        
        if (this.vibration > 0) {
            this.x = this.targetX + (Math.random() - 0.5) * this.vibration;
            this.y = this.targetY + (Math.random() - 0.5) * this.vibration;
            this.vibration *= 0.9;
        } else {
            // Gentle bobbing when not hovering
            const bobOffset = Math.sin(Date.now() / 300 + this.index) * 5;
            this.x += (this.targetX - this.x) * 0.1;
            this.y += ((this.targetY + bobOffset) - this.y) * 0.1;
        }
    }
    draw() {
        if (this.scale <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Throb effect
        let currentScale = this.scale;
        if (currentState >= STATE.CLIMAX) {
            currentScale *= 1 + Math.sin(Date.now() / 200) * 0.05;
        }
        ctx.scale(currentScale, currentScale);
        
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.size}px 'Fredoka'`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw shadow
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        ctx.fillText(this.char, 0, 0);
        ctx.restore();
    }
}

function initText() {
    textLetters = [];
    const msg = "Happy Birthday Leo!";
    const isMobile = width < 768;
    const fontSize = isMobile ? width * 0.12 : width * 0.08;
    ctx.font = `bold ${fontSize}px 'Fredoka'`;
    
    // Calculate total width to center it
    let totalWidth = 0;
    for(let i=0; i<msg.length; i++) totalWidth += ctx.measureText(msg[i]).width;
    
    let startX = (width - totalWidth) / 2;
    let currentX = startX;
    const yPos = height / 2;
    
    for(let i=0; i<msg.length; i++) {
        let char = msg[i];
        let charWidth = ctx.measureText(char).width;
        if (char !== " ") {
            textLetters.push(new TextLetter(
                char, 
                currentX + charWidth/2, 
                yPos, 
                fontSize, 
                colors[i % colors.length],
                i
            ));
        }
        currentX += charWidth;
    }
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius, color) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius)
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y)
        rot += step

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y)
        rot += step
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

// Game Loop
let lastTime = 0;
let fireworkTimer = 0;
function animate(time) {
    const deltaTime = time - lastTime;
    lastTime = time;

    // Background redraw
    ctx.clearRect(0, 0, width, height);
    
    ctx.save();
    if (screenShake > 0) {
        ctx.translate((Math.random()-0.5)*screenShake, (Math.random()-0.5)*screenShake);
        screenShake *= 0.9;
        if(screenShake < 0.5) screenShake = 0;
    }
    
    if (currentState === STATE.DRUMROLL) {
        // Subtle screen rumble
        ctx.translate((Math.random()-0.5)*2, (Math.random()-0.5)*2);
    }

    // Update and draw fireworks (background)
    if (currentState >= STATE.CLIMAX) {
        fireworkTimer += deltaTime;
        if (fireworkTimer > 800) {
            fireworks.push(new Firework());
            fireworkTimer = 0;
        }
    }
    for(let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].draw();
        if (fireworks[i].exploded && fireworks[i].particles.length === 0) {
            fireworks.splice(i, 1);
        }
    }

    // Update and draw Balloons (midground)
    balloons.forEach(b => {
        b.update();
        b.draw();
    });

    // Update and draw Text (foreground)
    if (currentState >= STATE.CLIMAX) {
        textLetters.forEach(tl => {
            tl.update();
            tl.draw();
        });
    }

    // Update and draw Confetti (foreground)
    confetti.forEach(c => {
        c.update();
        c.draw();
    });

    ctx.restore();
    
    // Mouse trailing
    if (mouse.x > -1000 && mouse.y > -1000) {
        // Add trail particles more frequently if moving
        mouseTrail.push(new TrailParticle(mouse.x, mouse.y));
        if (Math.abs(mouse.vx) > 5 || Math.abs(mouse.vy) > 5) {
            mouseTrail.push(new TrailParticle(mouse.x + (Math.random()-0.5)*10, mouse.y + (Math.random()-0.5)*10));
            mouseTrail.push(new TrailParticle(mouse.x + (Math.random()-0.5)*10, mouse.y + (Math.random()-0.5)*10));
        }
    }
    for (let i = mouseTrail.length - 1; i >= 0; i--) {
        mouseTrail[i].update();
        mouseTrail[i].draw();
        if (mouseTrail[i].alpha <= 0) mouseTrail.splice(i, 1);
    }
    
    // Draw star cursor
    if (mouse.x > -1000 && mouse.y > -1000) {
        drawStar(mouse.x, mouse.y, 5, 24, 10, '#FFD700');
    }

    requestAnimationFrame(animate);
}

function startAnimation() {
    bgAudio.currentTime = 0;
    bgAudio.play().catch(e => console.log("Audio play failed:", e));
    
    startButton.classList.add('hidden');
    
    // Reset Entities
    balloons = [];
    confetti = [];
    fireworks = [];
    mouseTrail = [];
    initText();
    
    // Start with Big 8
    const big8 = new Balloon(width / 2, -200, true);
    // set start vy low so it falls slowly at first
    big8.vy = 0;
    balloons.push(big8);
    
    currentState = STATE.TENSION;
    lastTime = performance.now();
    
    // Sequence
    setTimeout(() => {
        if(currentState !== STATE.TENSION) return;
        currentState = STATE.DRUMROLL;
    }, 4000); 
    
    setTimeout(() => {
        if(currentState !== STATE.DRUMROLL) return;
        currentState = STATE.FANFARE;
        // Give the Big 8 a little boost downward to ensure it lands soon
        big8.vy += 5;
    }, 8000); 
    
    setTimeout(() => {
        if(currentState !== STATE.FANFARE) return;
        currentState = STATE.CLIMAX;
        
        // Explode confetti - double amount
        for(let i=0; i<600; i++) {
            confetti.push(new Confetti(width/2, height/2));
        }
        
        // Drop other balloons
        for(let i=0; i<15; i++) {
            let b = new Balloon(Math.random() * width, -Math.random()*500, false);
            balloons.push(b);
        }
        
        // Pop in text letters (staggered)
        textLetters.forEach((tl, i) => {
            tl.scale = - (i * 0.1); // delay using negative scale
        });
        
    }, 11000); 
    
    setTimeout(() => {
        if(currentState !== STATE.CLIMAX) return;
        currentState = STATE.PLAY;
        replayButton.classList.remove('hidden');
        replayButton.style.position = 'absolute';
        replayButton.style.bottom = '20px';
        replayButton.style.right = '20px';
    }, 15000);
}

startButton.addEventListener('click', startAnimation);
replayButton.addEventListener('click', () => {
    replayButton.classList.add('hidden');
    startAnimation();
});

// Start loop
requestAnimationFrame(animate);
