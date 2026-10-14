const LEVEL_WIDTH = 6000; // 3× the original 2000px

const Levels = [
    {
        id: 1,
        name: "Village",
        boss: "Rat-Fiend Lord",
        background: "#87CEEB",
        width: LEVEL_WIDTH,
        platforms: [
            { x: 0, y: 500, w: 6000, h: 100, color: "#8B4513" }, // Ground
            // Section 1 (0–2000)
            { x: 400, y: 400, w: 200, h: 20, color: "#A0522D" },
            { x: 800, y: 350, w: 200, h: 20, color: "#A0522D" },
            { x: 1200, y: 400, w: 200, h: 20, color: "#A0522D" },
            { x: 1600, y: 320, w: 180, h: 20, color: "#A0522D" },
            // Section 2 (2000–4000)
            { x: 2100, y: 400, w: 200, h: 20, color: "#8B5A2B" },
            { x: 2500, y: 350, w: 200, h: 20, color: "#8B5A2B" },
            { x: 2900, y: 300, w: 200, h: 20, color: "#8B5A2B" },
            { x: 3300, y: 380, w: 200, h: 20, color: "#8B5A2B" },
            { x: 3700, y: 310, w: 180, h: 20, color: "#8B5A2B" },
            // Section 3 (4000–6000)
            { x: 4100, y: 420, w: 200, h: 20, color: "#6B3A2A" },
            { x: 4500, y: 350, w: 200, h: 20, color: "#6B3A2A" },
            { x: 4900, y: 290, w: 200, h: 20, color: "#6B3A2A" },
            { x: 5300, y: 370, w: 200, h: 20, color: "#6B3A2A" },
        ],
        enemies: [
            // Section 1
            { type: "Rat-Fiend", x: 600, y: 400 },
            { type: "Rat-Fiend", x: 900, y: 300 },
            { type: "Rat-Fiend", x: 1300, y: 400 },
            { type: "Rat-Fiend", x: 1700, y: 400 },
            // Section 2
            { type: "Rat-Fiend", x: 2200, y: 400 },
            { type: "Rat-Fiend", x: 2600, y: 300 },
            { type: "Rat-Fiend", x: 3000, y: 400 },
            { type: "Rat-Fiend", x: 3400, y: 300 },
            { type: "Rat-Fiend", x: 3800, y: 400 },
            // Section 3
            { type: "Rat-Fiend", x: 4200, y: 400 },
            { type: "Rat-Fiend", x: 4600, y: 400 },
            { type: "Rat-Fiend", x: 5000, y: 400 },
            { type: "Rat-Fiend", x: 5400, y: 400 },
        ],
        bossSpawn: { x: 5750, y: 400 }
    },
    {
        id: 2,
        name: "Forest",
        boss: "Pig-Troll Giant",
        background: "#228B22",
        width: LEVEL_WIDTH,
        platforms: [
            { x: 0, y: 500, w: 6000, h: 100, color: "#006400" }, // Ground
            // Section 1
            { x: 300, y: 400, w: 150, h: 20, color: "#556B2F" },
            { x: 600, y: 300, w: 150, h: 20, color: "#556B2F" },
            { x: 1000, y: 400, w: 300, h: 20, color: "#556B2F" },
            { x: 1500, y: 340, w: 200, h: 20, color: "#556B2F" },
            // Section 2
            { x: 2000, y: 400, w: 200, h: 20, color: "#3B5323" },
            { x: 2400, y: 330, w: 200, h: 20, color: "#3B5323" },
            { x: 2800, y: 280, w: 150, h: 20, color: "#3B5323" },
            { x: 3200, y: 380, w: 250, h: 20, color: "#3B5323" },
            { x: 3700, y: 320, w: 200, h: 20, color: "#3B5323" },
            // Section 3
            { x: 4100, y: 410, w: 200, h: 20, color: "#2D4A1E" },
            { x: 4500, y: 340, w: 200, h: 20, color: "#2D4A1E" },
            { x: 4900, y: 270, w: 180, h: 20, color: "#2D4A1E" },
            { x: 5300, y: 360, w: 200, h: 20, color: "#2D4A1E" },
        ],
        enemies: [
            // Section 1
            { type: "Pig-Troll", x: 500, y: 400 },
            { type: "Pig-Troll", x: 800, y: 300 },
            { type: "Pig-Troll", x: 1100, y: 300 },
            { type: "Pig-Troll", x: 1600, y: 400 },
            // Section 2
            { type: "Pig-Troll", x: 2100, y: 400 },
            { type: "Pig-Troll", x: 2500, y: 300 },
            { type: "Pig-Troll", x: 2900, y: 400 },
            { type: "Pig-Troll", x: 3300, y: 300 },
            { type: "Pig-Troll", x: 3800, y: 400 },
            // Section 3
            { type: "Pig-Troll", x: 4200, y: 400 },
            { type: "Pig-Troll", x: 4600, y: 400 },
            { type: "Pig-Troll", x: 5000, y: 400 },
            { type: "Pig-Troll", x: 5400, y: 400 },
        ],
        bossSpawn: { x: 5750, y: 400 }
    },
    {
        id: 3,
        name: "Mountains",
        boss: "Wolf-Zombie Leader",
        background: "#708090",
        width: LEVEL_WIDTH,
        platforms: [
            { x: 0, y: 550, w: 6000, h: 50, color: "#2F4F4F" }, // Ground
            // Section 1
            { x: 200, y: 450, w: 100, h: 20, color: "#696969" },
            { x: 400, y: 350, w: 100, h: 20, color: "#696969" },
            { x: 700, y: 450, w: 100, h: 20, color: "#696969" },
            { x: 1000, y: 350, w: 400, h: 20, color: "#696969" },
            { x: 1600, y: 430, w: 180, h: 20, color: "#696969" },
            // Section 2
            { x: 2100, y: 440, w: 120, h: 20, color: "#505050" },
            { x: 2400, y: 360, w: 120, h: 20, color: "#505050" },
            { x: 2700, y: 290, w: 100, h: 20, color: "#505050" },
            { x: 3000, y: 390, w: 300, h: 20, color: "#505050" },
            { x: 3500, y: 330, w: 200, h: 20, color: "#505050" },
            { x: 3900, y: 440, w: 150, h: 20, color: "#505050" },
            // Section 3
            { x: 4200, y: 360, w: 120, h: 20, color: "#3C3C3C" },
            { x: 4500, y: 290, w: 100, h: 20, color: "#3C3C3C" },
            { x: 4800, y: 440, w: 200, h: 20, color: "#3C3C3C" },
            { x: 5200, y: 380, w: 250, h: 20, color: "#3C3C3C" },
        ],
        enemies: [
            // Section 1
            { type: "Wolf-Zombie", x: 500, y: 300 },
            { type: "Wolf-Zombie", x: 800, y: 300 },
            { type: "Wolf-Zombie", x: 1100, y: 300 },
            { type: "Wolf-Zombie", x: 1500, y: 490 },
            // Section 2
            { type: "Wolf-Zombie", x: 2200, y: 400 },
            { type: "Wolf-Zombie", x: 2600, y: 300 },
            { type: "Wolf-Zombie", x: 3000, y: 400 },
            { type: "Wolf-Zombie", x: 3400, y: 490 },
            { type: "Wolf-Zombie", x: 3800, y: 400 },
            // Section 3
            { type: "Wolf-Zombie", x: 4300, y: 400 },
            { type: "Wolf-Zombie", x: 4700, y: 490 },
            { type: "Wolf-Zombie", x: 5100, y: 400 },
            { type: "Wolf-Zombie", x: 5500, y: 490 },
        ],
        bossSpawn: { x: 5750, y: 470 }
    },
    // Generate Levels 4–10 dynamically
    ...Array.from({ length: 7 }, (_, i) => {
        const id = i + 4;
        const types = ["Lizard-Fiend", "Boar-Troll", "Gargoyle", "Rat-Fiend", "Pig-Troll", "Wolf-Zombie", "Lizard-Fiend"];
        const bgs = ["#4B0082", "#F4A460", "#E0FFFF", "#8B0000", "#556B2F", "#696969", "#000000"];
        const bosses = ["Lizard-Fiend King", "Boar-Troll King", "Gargoyle Emperor", "Rat-Fiend King", "Pig-Troll King", "Wolf-Dragon", "Malgor"];
        const groundColors = ["#2A0050", "#C8824A", "#B0C8C8", "#5A0000", "#3A4F1E", "#404040", "#111111"];

        // Build a varied platform layout across 6000px
        const platformColor = groundColors[i];
        const platforms = [
            { x: 0, y: 500, w: LEVEL_WIDTH, h: 100, color: platformColor } // Ground
        ];
        // 15 scattered platforms across the map
        const platPositions = [
            300, 700, 1100, 1500, 1900,
            2300, 2700, 3100, 3500, 3900,
            4300, 4700, 5100, 5500, 5800
        ];
        platPositions.forEach((px, pi) => {
            const py = 280 + ((pi * 47) % 180); // Vary height
            const pw = 150 + ((pi * 31) % 120);
            platforms.push({ x: px, y: py, w: pw, h: 20, color: platformColor });
        });

        // 13 enemies spread across the level
        const enemies = [];
        const enemyXPositions = [
            600, 1000, 1400, 1800,
            2300, 2700, 3100, 3500, 3900,
            4300, 4700, 5100, 5500
        ];
        enemyXPositions.forEach(ex => {
            enemies.push({ type: types[i], x: ex, y: 400 });
        });

        return {
            id,
            name: `Level ${id}`,
            boss: bosses[i],
            background: bgs[i],
            width: LEVEL_WIDTH,
            platforms,
            enemies,
            bossSpawn: { x: 5750, y: 400 }
        };
    })
];
