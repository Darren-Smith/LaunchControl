// levels.js - Procedural Backgrounds and Collectibles

class Key {
    constructor(x, y, id) {
        this.x = x;
        this.y = y;
        this.radius = 25;
        this.id = id;
        this.collected = false;
        this.angle = 0;
        this.hoverOffset = 0;
    }

    update(dt) {
        if (this.collected) return;
        this.angle += dt * 2;
        this.hoverOffset = Math.sin(Date.now() / 200) * 5;
    }

    draw(ctx) {
        if (this.collected) return;
        
        ctx.save();
        ctx.translate(this.x, this.y + this.hoverOffset);
        
        // Glow effect
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 15;
        
        // Draw Key Icon
        ctx.font = '34px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const scale = 1 + Math.sin(Date.now() / 150) * 0.1;
        ctx.scale(scale, scale);
        
        ctx.fillText('🔑', 0, 0);
        
        ctx.restore();
    }
}

class Decal {
    constructor(x, y, type, text, icon, width, height, font = '"Fredoka One", sans-serif', color = '#fff') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.text = text;
        this.icon = icon;
        this.width = width;
        this.height = height;
        this.font = font;
        this.color = color;
    }
    
    draw(ctx) {
        if (this.type === 'building_sign') {
            ctx.fillStyle = '#fbbf24';
            ctx.font = '160px "Fredoka One", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.icon, this.x + this.width/2, this.y + this.height/2 - 40);
            
            ctx.fillStyle = this.color;
            ctx.font = '32px ' + this.font;
            ctx.fillText(this.text, this.x + this.width/2, this.y + this.height/2 + 80);
        } else if (this.type === 'bike_repair') {
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#fff';
            ctx.font = '24px "Fredoka One", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("BIKE REPAIR", this.x + this.width/2, this.y + 100);
        } else if (this.type === 'road_lines_h') {
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 6;
            ctx.setLineDash([40, 40]);
            ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + this.width, this.y); ctx.stroke();
            ctx.setLineDash([]);
        } else if (this.type === 'road_lines_v') {
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 6;
            ctx.setLineDash([40, 40]);
            ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x, this.y + this.height); ctx.stroke();
            ctx.setLineDash([]);
        } else if (this.type === 'tree') {
            // Trunk
            ctx.fillStyle = '#4a331c';
            ctx.fillRect(this.x - 5, this.y, 10, 30);
            // Leaves
            ctx.fillStyle = '#1e3f12';
            ctx.beginPath();
            ctx.arc(this.x, this.y - 15, 25, 0, Math.PI*2);
            ctx.arc(this.x - 15, this.y - 5, 20, 0, Math.PI*2);
            ctx.arc(this.x + 15, this.y - 5, 20, 0, Math.PI*2);
            ctx.fill();
        } else if (this.type === 'hay_bale') {
            ctx.fillStyle = '#d4b855';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#a68c34';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (this.type === 'fence') {
            ctx.strokeStyle = '#a3a3a3';
            ctx.lineWidth = 4;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            // Draw fence posts
            ctx.fillStyle = '#737373';
            for (let i = 0; i <= this.width; i += 40) {
                ctx.fillRect(this.x + i - 4, this.y - 4, 8, 8);
                ctx.fillRect(this.x + i - 4, this.y + this.height - 4, 8, 8);
            }
            for (let i = 0; i <= this.height; i += 40) {
                ctx.fillRect(this.x - 4, this.y + i - 4, 8, 8);
                ctx.fillRect(this.x + this.width - 4, this.y + i - 4, 8, 8);
            }
        } else if (this.type === 'playground') {
            // Draw swing set
            ctx.strokeStyle = '#b91c1c';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + 40); ctx.lineTo(this.x + 20, this.y); ctx.lineTo(this.x + 100, this.y); ctx.lineTo(this.x + 120, this.y + 40);
            ctx.stroke();
            // Swings
            ctx.strokeStyle = '#525252';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(this.x + 40, this.y); ctx.lineTo(this.x + 40, this.y + 30); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(this.x + 80, this.y); ctx.lineTo(this.x + 80, this.y + 30); ctx.stroke();
            ctx.fillStyle = '#1d4ed8'; ctx.fillRect(this.x + 30, this.y + 30, 20, 8);
            ctx.fillStyle = '#1d4ed8'; ctx.fillRect(this.x + 70, this.y + 30, 20, 8);
            
            // Draw slide
            ctx.strokeStyle = '#b91c1c';
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(this.x + 150, this.y); ctx.lineTo(this.x + 180, this.y); ctx.lineTo(this.x + 150, this.y + 40); ctx.stroke();
            ctx.fillStyle = '#eab308';
            ctx.beginPath(); ctx.moveTo(this.x + 180, this.y); ctx.lineTo(this.x + 230, this.y + 40); ctx.lineTo(this.x + 235, this.y + 35); ctx.lineTo(this.x + 180, this.y - 5); ctx.fill();
        } else if (this.type === 'altar') {
            ctx.fillStyle = '#4a331c';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else if (this.type === 'rug') {
            // Throne room rug
            ctx.fillStyle = '#7f1d1d'; // deep red
            ctx.fillRect(this.x, this.y, this.width, this.height);
            // Gold border
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 6;
            ctx.strokeRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);
            // Inner gold border
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x + 16, this.y + 16, this.width - 32, this.height - 32);
            // Center diamond
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2 - 20);
            ctx.lineTo(this.x + this.width / 2 + 20, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2 + 20);
            ctx.lineTo(this.x + this.width / 2 - 20, this.y + this.height / 2);
            ctx.fill();
        }
    }
}

function generateTileset(tileSize) {
    const ts = document.createElement('canvas');
    ts.width = tileSize * 45; 
    ts.height = tileSize;
    const ctx = ts.getContext('2d');

    // Helper to draw textured tiles
    function drawTextured(id, baseColor, type) {
        ctx.fillStyle = baseColor;
        ctx.fillRect(tileSize*id, 0, tileSize, tileSize);
        
        // Random slight shade variation for variants
        if (id > 11) {
            const shade = Math.random() > 0.5 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)';
            ctx.fillStyle = shade;
            ctx.fillRect(tileSize*id, 0, tileSize, tileSize);
        }

        // Add cracks or flecks
        if (type === 'asphalt' && id > 11) {
            ctx.fillStyle = '#111'; // dark flecks
            for(let f=0; f<12; f++) {
                ctx.fillRect(tileSize*id + Math.random()*tileSize, Math.random()*tileSize, 2, 2);
            }
            if (Math.random() > 0.6) {
                ctx.fillStyle = '#333'; // light flecks
                for(let f=0; f<6; f++) {
                    ctx.fillRect(tileSize*id + Math.random()*tileSize, Math.random()*tileSize, 3, 3);
                }
            }
        } else if (type === 'sidewalk' && id > 11) {
            ctx.fillStyle = '#2d3748'; // dark cracks
            for(let f=0; f<6; f++) {
                ctx.fillRect(tileSize*id + Math.random()*tileSize, Math.random()*tileSize, 3, 2);
            }
            // maybe a line crack
            if (Math.random() > 0.5) {
                ctx.strokeStyle = '#2d3748'; ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(tileSize*id + Math.random()*tileSize, 0);
                ctx.lineTo(tileSize*id + Math.random()*tileSize, tileSize);
                ctx.stroke();
            }
        } else if (type === 'grass' && id > 11) {
            ctx.fillStyle = '#3f622d'; // darker grass blades
            for(let f=0; f<15; f++) {
                ctx.fillRect(tileSize*id + Math.random()*tileSize, Math.random()*tileSize, 2, 4);
            }
            if (Math.random() > 0.7) { // small flower
                ctx.fillStyle = '#fcd34d';
                ctx.fillRect(tileSize*id + Math.random()*tileSize, Math.random()*tileSize, 3, 3);
            }
        } else if (type === 'gravel') {
            // Chunky gravel
            ctx.fillStyle = 'rgba(139, 69, 19, 0.5)'; // darker brown specks
            for(let f=0; f<10; f++) {
                ctx.fillRect(tileSize*id + Math.random()*(tileSize-4), Math.random()*(tileSize-4), 4, 4);
            }
            ctx.fillStyle = 'rgba(245, 222, 179, 0.6)'; // lighter specks
            for(let f=0; f<8; f++) {
                ctx.fillRect(tileSize*id + Math.random()*(tileSize-3), Math.random()*(tileSize-3), 3, 3);
            }
            if (Math.random() > 0.5) {
                ctx.fillStyle = 'rgba(160, 82, 45, 0.6)'; // sienna/terra cotta chunks
                ctx.fillRect(tileSize*id + Math.random()*(tileSize-6), Math.random()*(tileSize-6), 6, 6);
            }
        } else if (type === 'water') {
            // Draw some water ripples
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let r = 0; r < 4; r++) {
                let rx = tileSize * id + Math.random() * (tileSize - 12) + 2;
                let ry = Math.random() * (tileSize - 5) + 2;
                ctx.moveTo(rx, ry);
                ctx.quadraticCurveTo(rx + 4, ry - 3, rx + 8, ry);
            }
            ctx.stroke();
        }
    }

    // 0: Empty
    // 1: Asphalt
    drawTextured(1, '#1a1a1a', 'asphalt');
    for (let i=12; i<=15; i++) drawTextured(i, '#1a1a1a', 'asphalt');

    // 2: Sidewalk
    drawTextured(2, '#374151', 'sidewalk');
    for (let i=16; i<=19; i++) drawTextured(i, '#374151', 'sidewalk');

    // 3: Building Roof (impassable)
    ctx.fillStyle = '#1f2937'; ctx.fillRect(tileSize*3, 0, tileSize, tileSize);
    // 4: Water (impassable)
    drawTextured(4, '#3b82f6', 'water');
    for (let i=30; i<=33; i++) drawTextured(i, '#3b82f6', 'water');
    
    // 5: Grass
    drawTextured(5, '#4d7c36', 'grass');
    for (let i=20; i<=23; i++) drawTextured(i, '#4d7c36', 'grass');
    
    // 6: Fence (over grass)
    ctx.fillStyle = '#4d7c36'; ctx.fillRect(tileSize*6, 0, tileSize, tileSize);
    ctx.strokeStyle = '#a3a3a3'; ctx.lineWidth = 4;
    ctx.strokeRect(tileSize*6 + 4, 4, tileSize - 8, tileSize - 8);
    ctx.fillStyle = '#737373'; ctx.fillRect(tileSize*6 + 21, 21, 8, 8); // Post in the middle
    
    // 7: Free for now

    // 8: Country Grass
    drawTextured(8, '#2d5a1b', 'grass');
    for (let i=26; i<=29; i++) drawTextured(i, '#2d5a1b', 'grass');
    
    // 9: Dirt Road (Base) and 39-42: Variants (Beiges, Terra Cotta, Gravel)
    drawTextured(9, '#d2b48c', 'gravel'); // Base Beige
    const gravelColors = ['#d2b48c', '#e3cda4', '#654321', '#c19a6b'];
    for (let i = 0; i < 4; i++) {
        drawTextured(39 + i, gravelColors[i], 'gravel');
    }
    
    // 10: Castle Stone
    ctx.fillStyle = '#6b655f'; ctx.fillRect(tileSize*10, 0, tileSize, tileSize);
    ctx.strokeStyle = '#5c5650'; ctx.lineWidth = 2; ctx.strokeRect(tileSize*10, 0, tileSize, tileSize);
    
    // 34-36: Castle Stone Variations (Washed out browns and greys)
    const castleColors = ['#756d66', '#5e5a56', '#69625a'];
    for (let i = 0; i < 3; i++) {
        let t = 34 + i;
        ctx.fillStyle = castleColors[i]; ctx.fillRect(tileSize*t, 0, tileSize, tileSize);
        ctx.strokeStyle = '#4a4642'; ctx.lineWidth = 1; ctx.strokeRect(tileSize*t, 0, tileSize, tileSize);
        // Add some random crack/fleck details
        ctx.fillStyle = '#4a4642';
        for (let j = 0; j < 4; j++) {
            ctx.fillRect(tileSize*t + Math.random()*tileSize, Math.random()*tileSize, 3, 2);
        }
    }

    // 37: Carpet Runner Horizontal
    ctx.fillStyle = '#6b655f'; ctx.fillRect(tileSize*37, 0, tileSize, tileSize); // floor base
    ctx.fillStyle = '#7f1d1d'; ctx.fillRect(tileSize*37, 10, tileSize, tileSize - 20); // red carpet
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(tileSize*37, 10, tileSize, 4); // gold trim top
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(tileSize*37, tileSize - 14, tileSize, 4); // gold trim bot

    // 38: Carpet Runner Vertical
    ctx.fillStyle = '#6b655f'; ctx.fillRect(tileSize*38, 0, tileSize, tileSize); // floor base
    ctx.fillStyle = '#7f1d1d'; ctx.fillRect(tileSize*38 + 10, 0, tileSize - 20, tileSize); // red carpet
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(tileSize*38 + 10, 0, 4, tileSize); // gold trim left
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(tileSize*38 + tileSize - 14, 0, 4, tileSize); // gold trim right
    
    // 11: Castle Wall (impassable)
    ctx.fillStyle = '#1f2937'; ctx.fillRect(tileSize*11, 0, tileSize, tileSize);

    // 24: Rock (impassable)
    ctx.fillStyle = '#6b7280'; ctx.fillRect(tileSize*24, 0, tileSize, tileSize);
    // Draw some rock features
    ctx.fillStyle = '#4b5563';
    ctx.beginPath(); ctx.arc(tileSize*24 + 10, 15, 6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(tileSize*24 + 25, 25, 8, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(tileSize*24 + 15, 30, 5, 0, Math.PI*2); ctx.fill();
    
    // 25: Copse (impassable)
    ctx.fillStyle = '#166534'; ctx.fillRect(tileSize*25, 0, tileSize, tileSize);
    // Draw some leaf clusters
    ctx.fillStyle = '#14532d';
    ctx.beginPath(); ctx.arc(tileSize*25 + 12, 12, 8, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(tileSize*25 + 28, 16, 10, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(tileSize*25 + 20, 30, 9, 0, Math.PI*2); ctx.fill();

    return ts;
}

function createMapGrid(cols, rows, defaultTile) {
    let grid = [];
    for(let r = 0; r < rows; r++) {
        let row = [];
        for(let c = 0; c < cols; c++) {
            row.push(Array.isArray(defaultTile) ? defaultTile[Math.floor(Math.random() * defaultTile.length)] : defaultTile);
        }
        grid.push(row);
    }
    return grid;
}

function fillRectTiles(grid, c, r, w, h, tileId) {
    for(let y = r; y < r + h; y++) {
        for(let x = c; x < c + w; x++) {
            if(y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
                grid[y][x] = Array.isArray(tileId) ? tileId[Math.floor(Math.random() * tileId.length)] : tileId;
            }
        }
    }
}

function fillEllipseTiles(grid, c, r, rw, rh, tileId) {
    for(let y = r - rh; y <= r + rh; y++) {
        for(let x = c - rw; x <= c + rw; x++) {
            if(y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
                const dx = x - c;
                const dy = y - r;
                if ((dx*dx)/(rw*rw) + (dy*dy)/(rh*rh) <= 1) {
                    grid[y][x] = Array.isArray(tileId) ? tileId[Math.floor(Math.random() * tileId.length)] : tileId;
                }
            }
        }
    }
}

function buildCityBackground(width, height, tileSize) {
    const cols = Math.ceil(width / tileSize);
    const rows = Math.ceil(height / tileSize);
    const asphaltTiles = [1, 12, 13, 14, 15];
    const sidewalkTiles = [2, 16, 17, 18, 19];
    const grassTiles = [5, 20, 21, 22, 23];
    const waterTiles = [4, 30, 31, 32, 33];
    const grid = createMapGrid(cols, rows, asphaltTiles); // Asphalt base
    
    if (typeof window !== 'undefined') {
        window.levelDecals = [];
        window.levelLights = [];
    }

    function drawCustomBlock(block) {
        if (block.type === 'park_playground') {
            fillRectTiles(grid, block.c, block.r, block.w, block.h, grassTiles); // Grass
            // Draw fence boundary using tile 6
            for(let x=block.c; x<block.c+block.w; x++) {
                grid[block.r][x] = 6; // North
                grid[block.r+block.h-1][x] = 6; // South
            }
            for(let y=block.r; y<block.r+block.h; y++) {
                grid[y][block.c] = 6; // West
                grid[y][block.c+block.w-1] = 6; // East
            }
            
            // Create 3-tile wide gaps (entrances) N, S, E, W
            const midX = block.c + Math.floor(block.w/2);
            const midY = block.r + Math.floor(block.h/2);
            for(let i=-1; i<=1; i++) {
                grid[block.r][midX + i] = grassTiles[0]; // North gap
                grid[block.r+block.h-1][midX + i] = grassTiles[0]; // South gap
                grid[midY + i][block.c] = grassTiles[0]; // West gap
                grid[midY + i][block.c+block.w-1] = grassTiles[0]; // East gap
            }

            // Playground decal
            const px = block.c * tileSize;
            const py = block.r * tileSize;
            window.levelDecals.push(new Decal(px + 80, py + 80, 'playground', '', '', 0, 0));
        } else if (block.type === 'park_pond') {
            fillRectTiles(grid, block.c, block.r, block.w, block.h, grassTiles); // Grass
            // Pond
            fillEllipseTiles(grid, block.c + Math.floor(block.w/2), block.r + Math.floor(block.h/2), Math.floor(block.w/3), Math.floor(block.h/3), waterTiles);
            // Trees
            const px = block.c * tileSize;
            const py = block.r * tileSize;
            window.levelDecals.push(new Decal(px + 40, py + 40, 'tree', '', '', 0, 0));
            window.levelDecals.push(new Decal(px + block.w*tileSize - 60, py + 40, 'tree', '', '', 0, 0));
        } else {
            // Building
            fillRectTiles(grid, block.c, block.r, block.w, block.h, sidewalkTiles); // Sidewalk base
            fillRectTiles(grid, block.c + 1, block.r + 1, block.w - 2, block.h - 2, 3); // Roof
            
            const roofX = (block.c + 1) * tileSize;
            const roofY = (block.r + 1) * tileSize;
            const roofW = (block.w - 2) * tileSize;
            const roofH = (block.h - 2) * tileSize;
            window.levelDecals.push(new Decal(roofX, roofY, 'building_sign', block.name, block.icon, roofW, roofH, block.font, block.color));
        }
    }

    const customBlocks = [
        // Top row
        { c: 2, r: 2, w: 14, h: 10, type: 'building', name: "SLEEPY'S MOTEL", icon: '🏨', font: '"Comic Neue", cursive', color: '#ec4899' },
        { c: 20, r: 2, w: 22, h: 8, type: 'building', name: "ACME FACTORY", icon: '🏭', font: '"Impact", sans-serif', color: '#94a3b8' },
        { c: 46, r: 2, w: 10, h: 12, type: 'building', name: "LUIGI'S PIZZA", icon: '🍕', font: '"Bangers", cursive', color: '#ef4444' },
        { c: 60, r: 2, w: 10, h: 14, type: 'building', name: "CITY BANK", icon: '💲', font: '"Times New Roman", serif', color: '#22c55e' },
        
        // Second row
        { c: 2, r: 16, w: 16, h: 14, type: 'park_playground', name: 'PARK', icon: '🌳' },
        { c: 22, r: 14, w: 14, h: 12, type: 'building', name: "CITY LIBRARY", icon: '📚', font: '"Times New Roman", serif', color: '#fcd34d' },
        { c: 40, r: 18, w: 16, h: 14, type: 'building', name: "HIGH SCHOOL", icon: '🏫', font: '"Arial Black", sans-serif', color: '#eab308' },
        
        // Third row
        { c: 2, r: 34, w: 10, h: 16, type: 'building', name: "ST. JUDE'S HOSPITAL", icon: '🏥', font: '"Arial", sans-serif', color: '#ef4444' },
        { c: 16, r: 30, w: 12, h: 14, type: 'building', name: "RETRO ARCADE", icon: '🕹️', font: '"Bangers", cursive', color: '#a855f7' },
        { c: 32, r: 36, w: 14, h: 16, type: 'building', name: "AMAZON WAREHOUSE", icon: '📦', font: '"Impact", sans-serif', color: '#fb923c' },
        { c: 50, r: 36, w: 12, h: 10, type: 'building', name: "STARLIGHT CINEMA", icon: '🍿', font: '"Bangers", cursive', color: '#facc15' },
        { c: 63, r: 20, w: 5, h: 16, type: 'building', name: "RUSTY SPUR BAR", icon: '🍻', font: '"Brush Script MT", cursive', color: '#84cc16' },
        
        // Bottom row
        { c: 16, r: 48, w: 18, h: 10, type: 'building', name: "FRESH GROCERIES", icon: '🛒', font: '"Fredoka One", sans-serif', color: '#4ade80' },
        { c: 38, r: 54, w: 12, h: 4, type: 'building', name: "CHICO COFFEE HUB", icon: '☕', font: '"Comic Neue", cursive', color: '#d97706' },
        { c: 54, r: 50, w: 16, h: 8, type: 'park_pond', name: 'POND', icon: '🦆' },
        
        // Extra
        { c: 64, r: 40, w: 6, h: 10, type: 'building', name: "BILBO'S TOY SHOP", icon: '🧸', font: '"Bangers", cursive', color: '#06b6d4' }
    ];

    customBlocks.forEach(block => drawCustomBlock(block));

    // Lampposts
    for (let x = 150; x < width; x += 400) {
        for (let y = 100; y < height; y += 500) {
            window.levelLights.push({x: x + 5, y: y, radius: 250, color: 'rgba(252, 211, 77, 0.8)'});
        }
    }

    return grid;
}

function buildCountrysideBackground(width, height, tileSize) {
    const cols = Math.ceil(width / tileSize);
    const rows = Math.ceil(height / tileSize);
    const countryGrassTiles = [8, 26, 27, 28, 29];
    const waterTiles = [4, 30, 31, 32, 33];
    const pathTiles = [9, 39, 40, 41, 42]; // Chunky gravel, beiges, terra cottas
    const grid = createMapGrid(cols, rows, countryGrassTiles); // Country Grass variants
    
    if (typeof window !== 'undefined') {
        window.levelDecals = [];
        window.levelLights = [];
    }

    function drawLine(c1, r1, c2, r2, radius, tileId) {
        const dist = Math.hypot(c2 - c1, r2 - r1);
        const steps = Math.ceil(dist * 2);
        for(let i=0; i<=steps; i++) {
            let t = i/steps;
            let cx = Math.round(c1 + (c2 - c1)*t);
            let cy = Math.round(r1 + (r2 - r1)*t);
            fillEllipseTiles(grid, cx, cy, radius, radius, tileId);
        }
    }

    // 1. Draw River (Tile 4)
    // Left fork
    drawLine(5, rows, 25, 55, 3, waterTiles);
    // Right fork
    drawLine(22, rows, 25, 55, 3, waterTiles);
    // Main River meandering
    drawLine(25, 55, 42, 48, 4, waterTiles);
    drawLine(42, 48, 55, 30, 4, waterTiles);
    drawLine(55, 30, 75, 18, 4, waterTiles);
    drawLine(75, 18, cols, 5, 4, waterTiles);

    // 2. Draw Paths (Tile 9 and variants)
    // Main path from bottom
    drawLine(55, rows, 50, 55, 2, pathTiles);
    // Path to castle (right) - target r=37 to match levelGate
    drawLine(50, 55, 80, 37, 2, pathTiles);
    drawLine(80, 37, cols, 37, 2, pathTiles);
    // Middle bridge crossing
    drawLine(50, 55, 42, 48, 2, pathTiles);
    drawLine(42, 48, 35, 45, 2, pathTiles);
    // Top left path
    drawLine(35, 45, 20, 35, 2, pathTiles);
    drawLine(20, 35, 0, 45, 2, pathTiles);
    // Top right path (over top bridge)
    drawLine(35, 45, 55, 25, 2, pathTiles);
    drawLine(55, 25, 75, 18, 2, pathTiles);
    drawLine(75, 18, cols, 10, 2, pathTiles);
    // Bottom left path (over two bridges)
    drawLine(35, 45, 25, 60, 2, pathTiles);
    drawLine(25, 60, 15, 65, 2, pathTiles);
    drawLine(15, 65, 0, 68, 2, pathTiles);

    // 3. Draw Copses (Tile 25)
    fillEllipseTiles(grid, 18, 15, 8, 7, 25);
    fillEllipseTiles(grid, 55, 10, 6, 5, 25);
    fillEllipseTiles(grid, 75, 60, 9, 8, 25);

    // 4. Draw Rocks (Tile 24)
    fillEllipseTiles(grid, 35, 32, 5, 4, 24);
    fillEllipseTiles(grid, 72, 45, 4, 5, 24); // Moved rock down to not block gate

    // 5. Castle Entrance on right edge (center at r=37 to match gate)
    fillRectTiles(grid, cols - 4, 32, 4, 10, 10); // Castle stone floor
    fillRectTiles(grid, cols - 4, 30, 1, 14, 11); // Castle wall boundary on the left side
    // Make gap in the wall for the path
    fillRectTiles(grid, cols - 4, 35, 1, 4, 10); // Gap

    // Draw some decals
    if (typeof window !== 'undefined') {
        window.levelDecals.push(new Decal((cols - 2) * tileSize, 27 * tileSize, 'building_sign', 'TO CASTLE', '🏰', 0, 0, '"Bangers", cursive', '#ffffff'));
    }

    return grid;
}

function buildCastleBackground(width, height, tileSize) {
    const cols = Math.ceil(width / tileSize);
    const rows = Math.ceil(height / tileSize);
    const floorTiles = [34, 35, 36];
    const grid = createMapGrid(cols, rows, floorTiles);
    
    if (typeof window !== 'undefined') {
        window.levelDecals = [];
        window.levelLights = [];
    }

    // Outer Walls (2 tiles thick)
    fillRectTiles(grid, 0, 0, cols, 2, 11);
    fillRectTiles(grid, 0, rows - 2, cols, 2, 11);
    fillRectTiles(grid, 0, 0, 2, rows, 11);
    fillRectTiles(grid, cols - 2, 0, 2, rows, 11);

    // Inner Walls
    // Top and Bottom inner walls for the central rooms
    fillRectTiles(grid, 16, 12, 48, 2, 11);
    fillRectTiles(grid, 16, 46, 48, 2, 11);
    // Left inner wall
    fillRectTiles(grid, 16, 12, 2, 36, 11);
    // Middle dividing wall (between anteroom and throne room)
    fillRectTiles(grid, 34, 12, 2, 36, 11);
    // Right inner wall
    fillRectTiles(grid, 62, 12, 2, 36, 11);

    // Doors / Gaps
    // Entrance to Anteroom (West)
    fillRectTiles(grid, 16, 27, 2, 6, floorTiles);
    // Entrance to Throne Room (Middle)
    fillRectTiles(grid, 34, 27, 2, 6, floorTiles);
    // Exit from Throne Room (East)
    fillRectTiles(grid, 62, 27, 2, 6, floorTiles);
    // North entrance to Throne Room
    fillRectTiles(grid, 46, 12, 6, 2, floorTiles);
    // South entrance to Throne Room
    fillRectTiles(grid, 46, 46, 6, 2, floorTiles);

    // Carpet Runners (Horizontal - tile 37)
    // Top corridor runner
    for (let c = 4; c < 68; c++) grid[6][c] = 37;
    // Bottom corridor runner
    for (let c = 4; c < 68; c++) grid[53][c] = 37;
    // Central path runner through the rooms
    for (let c = 10; c < 64; c++) grid[29][c] = 37;
    for (let c = 10; c < 64; c++) grid[30][c] = 37;

    // Carpet Runners (Vertical - tile 38)
    // Left corridor runner
    for (let r = 6; r < 54; r++) grid[r][6] = 38;
    // Right corridor runner
    for (let r = 6; r < 54; r++) grid[r][65] = 38;
    // North path to throne room
    for (let r = 6; r < 14; r++) grid[r][48] = 38;
    for (let r = 6; r < 14; r++) grid[r][49] = 38;
    // South path to throne room
    for (let r = 46; r < 54; r++) grid[r][48] = 38;
    for (let r = 46; r < 54; r++) grid[r][49] = 38;

    // Decorate with pillars/lights along corridors
    for (let x = 200; x < width - 200; x += 300) {
        if (typeof window !== 'undefined') {
            window.levelLights.push({x: x, y: 150, radius: 150, color: 'rgba(245, 158, 11, 0.6)'});
            window.levelLights.push({x: x, y: height - 150, radius: 150, color: 'rgba(245, 158, 11, 0.6)'});
        }
    }

    // Throne Room Rug Decal
    if (typeof window !== 'undefined') {
        const trX = 40 * tileSize;
        const trY = 18 * tileSize;
        const trW = 18 * tileSize;
        const trH = 24 * tileSize;
        window.levelDecals.push(new Decal(trX, trY, 'rug', '', '', trW, trH));
        
        // Add altars in anteroom
        window.levelDecals.push(new Decal(22 * tileSize, 20 * tileSize, 'altar', '', '', 100, 60));
        window.levelDecals.push(new Decal(22 * tileSize, 36 * tileSize, 'altar', '', '', 100, 60));
    }

    return grid;
}

function buildBackground(level, width, height) {
    const tileSize = 50;
    
    if (typeof window !== 'undefined') {
        window.tileSize = tileSize;
        window.tilesetCanvas = generateTileset(tileSize);
        window.impassableTiles = [3, 4, 6, 11, 24, 25, 30, 31, 32, 33]; // Roof, Water, Fence, Castle Wall, Rocks, Copse
    }

    let grid;
    if (level === 1) grid = buildCityBackground(width, height, tileSize);
    else if (level === 2) grid = buildCountrysideBackground(width, height, tileSize);
    else if (level === 3) grid = buildCastleBackground(width, height, tileSize);
    else grid = buildCityBackground(width, height, tileSize);
    
    if (typeof window !== 'undefined') {
        window.mapGrid = grid;
    }
    
    return null; // No more bgCanvas
}
