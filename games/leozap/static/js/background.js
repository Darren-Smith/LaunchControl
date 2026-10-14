// Starfield in deep space many light years far from the earth.
const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initSpace();
});

// Star layers for parallax effect
const starLayers = [];
const planets = [];
const nebulae = [];

class Star {
    constructor(layer) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2;
        this.speed = layer * 0.5;
        this.brightness = Math.random() * 0.5 + 0.5;
        this.twinkleSpeed = Math.random() * 0.02 + 0.01;
        this.twinkleOffset = Math.random() * Math.PI * 2;
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.y = 0;
            this.x = Math.random() * canvas.width;
        }
    }

    draw(time) {
        const twinkle = Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness * twinkle})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow for brighter stars
        if (this.size > 1.2) {
            ctx.fillStyle = `rgba(200, 220, 255, ${this.brightness * twinkle * 0.3})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class Planet {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height * 0.6;
        this.size = Math.random() * 40 + 30;
        this.speed = Math.random() * 0.2 + 0.1;
        this.hue = Math.random() * 60 + 200; // Blue to purple range
        this.type = Math.random() > 0.5 ? 'gas' : 'rocky';
    }

    update() {
        this.y += this.speed;
        if (this.y - this.size > canvas.height) {
            this.y = -this.size;
            this.x = Math.random() * canvas.width;
        }
    }

    draw() {
        if (this.type === 'gas') {
            // Gas giant with bands
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
            gradient.addColorStop(0, `hsla(${this.hue}, 60%, 50%, 0.8)`);
            gradient.addColorStop(0.7, `hsla(${this.hue}, 40%, 30%, 0.6)`);
            gradient.addColorStop(1, `hsla(${this.hue}, 20%, 20%, 0.3)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            // Bands
            for (let i = 0; i < 3; i++) {
                ctx.strokeStyle = `hsla(${this.hue + 20}, 30%, 40%, 0.3)`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(this.x, this.y + (i - 1) * this.size * 0.3, this.size * 0.9, this.size * 0.1, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else {
            // Rocky planet
            const gradient = ctx.createRadialGradient(this.x - this.size * 0.3, this.y - this.size * 0.3, 0, this.x, this.y, this.size);
            gradient.addColorStop(0, `hsla(${this.hue}, 40%, 60%, 0.7)`);
            gradient.addColorStop(0.5, `hsla(${this.hue}, 35%, 35%, 0.6)`);
            gradient.addColorStop(1, `hsla(${this.hue}, 25%, 15%, 0.4)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class Nebula {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 200 + 150;
        this.speed = Math.random() * 0.15 + 0.05;
        this.hue = Math.random() * 60 + 250; // Purple to blue
        this.rotation = Math.random() * Math.PI * 2;
    }

    update() {
        this.y += this.speed;
        if (this.y - this.size > canvas.height) {
            this.y = -this.size;
            this.x = Math.random() * canvas.width;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, `hsla(${this.hue}, 80%, 60%, 0.15)`);
        gradient.addColorStop(0.3, `hsla(${this.hue + 20}, 70%, 50%, 0.1)`);
        gradient.addColorStop(0.6, `hsla(${this.hue - 20}, 60%, 40%, 0.05)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

function initSpace() {
    starLayers.length = 0;
    planets.length = 0;
    nebulae.length = 0;

    // Create star layers (3 layers for parallax)
    for (let layer = 0; layer < 3; layer++) {
        starLayers[layer] = [];
        const starCount = layer === 0 ? 200 : layer === 1 ? 100 : 50;
        for (let i = 0; i < starCount; i++) {
            starLayers[layer].push(new Star(layer + 1));
        }
    }

    // Create nebulae
    for (let i = 0; i < 3; i++) {
        nebulae.push(new Nebula());
    }

    // Create planets
    for (let i = 0; i < 2; i++) {
        planets.push(new Planet());
    }
}

let time = 0;

function animate() {
    time += 0.1;

    // Deep space black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw nebulae (furthest back)
    nebulae.forEach(nebula => {
        nebula.update();
        nebula.draw();
    });

    // Draw planets
    planets.forEach(planet => {
        planet.update();
        planet.draw();
    });

    // Draw stars in layers (back to front)
    for (let layer = starLayers.length - 1; layer >= 0; layer--) {
        starLayers[layer].forEach(star => {
            star.update();
            star.draw(time);
        });
    }

    requestAnimationFrame(animate);
}

initSpace();
animate();
