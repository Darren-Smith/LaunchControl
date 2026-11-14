const LEVEL_WIDTH = 6000;
const LEVEL_HEIGHT = 1200;
const GROUND_Y = 1020;

// Helper to build a rich, themed stage with distinct platform architecture, cloud islands, enemies, and hidden goodies
function buildStageConfig(cfg) {
    const platforms = [
        {
            x: 0,
            y: GROUND_Y,
            w: LEVEL_WIDTH,
            h: 180,
            color: cfg.groundColor,
            topColor: cfg.groundTopColor,
            isGround: true
        }
    ];

    // Add stage-specific mid-level platforms
    cfg.midPlatforms.forEach(p => {
        platforms.push({
            x: p.x,
            y: p.y,
            w: p.w,
            h: 22,
            color: p.color || cfg.platColor,
            topColor: p.topColor || cfg.platTopColor,
            isCloud: false
        });
    });

    // Add high-altitude Cloud Layer platforms (reachable by climbing mid platforms)
    cfg.cloudPlatforms.forEach(cp => {
        platforms.push({
            x: cp.x,
            y: cp.y,
            w: cp.w,
            h: 26,
            color: '#ffffff',
            isCloud: true
        });
    });

    return {
        id: cfg.id,
        name: cfg.name,
        theme: cfg.theme,
        boss: cfg.boss,
        bossSprite: cfg.bossSprite,
        bossAura: cfg.bossAura,
        skyTop: cfg.skyTop,
        skyMid: cfg.skyMid,
        skyBottom: cfg.skyBottom,
        background: cfg.skyMid,
        width: LEVEL_WIDTH,
        height: LEVEL_HEIGHT,
        platforms,
        enemies: cfg.enemies,
        pickups: cfg.pickups,
        bossSpawn: { x: 5700, y: GROUND_Y - 96 }
    };
}

// Helper to generate a staircase + cloud island cluster at a given X offset
function createAscentAndCloudCluster(baseX, variant, themeColors) {
    const mid = [];
    const clouds = [];
    const pickups = [];

    if (variant === 'A') {
        // Left-to-right staircase up into a 3-cloud sky sanctuary
        mid.push(
            { x: baseX, y: 900, w: 180 },
            { x: baseX + 210, y: 785, w: 180 },
            { x: baseX + 420, y: 665, w: 190 },
            { x: baseX + 220, y: 545, w: 180 }
        );
        clouds.push(
            { x: baseX + 380, y: 425, w: 210 },
            { x: baseX + 620, y: 310, w: 240 },
            { x: baseX + 900, y: 210, w: 250 }
        );
        // Coin trail on stairs
        pickups.push(
            { type: 'coin', x: baseX + 75, y: 860, value: 15 },
            { type: 'coin', x: baseX + 285, y: 745, value: 15 },
            { type: 'coin', x: baseX + 495, y: 625, value: 15 }
        );
        // Cloud goodies!
        pickups.push(
            { type: 'coin', x: baseX + 430, y: 380, value: 25 },
            { type: 'coin', x: baseX + 490, y: 380, value: 25 },
            { type: 'powerup_atk', x: baseX + 725, y: 260 },
            { type: 'chest', x: baseX + 960, y: 165, value: 100 },
            { type: 'coin', x: baseX + 1040, y: 165, value: 30 }
        );
    } else if (variant === 'B') {
        // Zig-zag tower climb into twin high clouds
        mid.push(
            { x: baseX + 60, y: 905, w: 200 },
            { x: baseX + 300, y: 790, w: 180 },
            { x: baseX + 90, y: 675, w: 190 },
            { x: baseX + 320, y: 555, w: 190 },
            { x: baseX + 560, y: 685, w: 200 },
            { x: baseX + 820, y: 820, w: 210 }
        );
        clouds.push(
            { x: baseX + 120, y: 430, w: 220 },
            { x: baseX + 380, y: 315, w: 230 },
            { x: baseX + 660, y: 225, w: 240 }
        );
        pickups.push(
            { type: 'coin', x: baseX + 150, y: 865, value: 15 },
            { type: 'potion', x: baseX + 175, y: 635 },
            { type: 'coin', x: baseX + 400, y: 515, value: 20 },
            // Cloud goodies
            { type: 'powerup_spd', x: baseX + 220, y: 385 },
            { type: 'coin', x: baseX + 460, y: 270, value: 25 },
            { type: 'coin', x: baseX + 510, y: 270, value: 25 },
            { type: 'chest', x: baseX + 755, y: 180, value: 120 }
        );
    } else {
        // Wide bridge & upper cloud vault
        mid.push(
            { x: baseX, y: 895, w: 240 },
            { x: baseX + 290, y: 775, w: 220 },
            { x: baseX + 560, y: 655, w: 200 },
            { x: baseX + 800, y: 535, w: 190 },
            { x: baseX + 1050, y: 760, w: 220 }
        );
        clouds.push(
            { x: baseX + 540, y: 410, w: 220 },
            { x: baseX + 280, y: 295, w: 240 },
            { x: baseX + 560, y: 190, w: 260 }
        );
        pickups.push(
            { type: 'coin', x: baseX + 100, y: 855, value: 15 },
            { type: 'coin', x: baseX + 390, y: 735, value: 15 },
            { type: 'potion', x: baseX + 1140, y: 715 },
            // Cloud goodies
            { type: 'powerup_def', x: baseX + 640, y: 365 },
            { type: 'chest', x: baseX + 385, y: 250, value: 110 },
            { type: 'chest', x: baseX + 675, y: 145, value: 150 }
        );
    }

    return { mid, clouds, pickups };
}

function buildStageGeometry(patternOrder, enemyType, secondaryType, levelIdx) {
    const midPlatforms = [];
    const cloudPlatforms = [];
    const pickups = [];
    const enemies = [];

    const offsets = [320, 1950, 3650];
    offsets.forEach((ox, idx) => {
        const cluster = createAscentAndCloudCluster(ox, patternOrder[idx]);
        midPlatforms.push(...cluster.mid);
        cloudPlatforms.push(...cluster.clouds);
        pickups.push(...cluster.pickups);
    });

    // Additional boss-approach platforms near 5100-5500
    midPlatforms.push(
        { x: 5050, y: 895, w: 210 },
        { x: 5320, y: 780, w: 190 }
    );
    pickups.push(
        { type: 'potion', x: 5145, y: 850 },
        { type: 'coin', x: 5400, y: 735, value: 25 }
    );

    // 13 Minions distributed across ground and mid platforms
    const groundEnemyPositions = [580, 1180, 1750, 2450, 3100, 3850, 4450, 4950, 5380];
    groundEnemyPositions.forEach((ex, i) => {
        const t = (i % 3 === 2 && secondaryType) ? secondaryType : enemyType;
        enemies.push({ type: t, x: ex, y: GROUND_Y - 60 });
    });

    // 4 Platform-patrolling minions on the mid-tier platforms
    const patrolIndices = [0, 2, 5, 9];
    patrolIndices.forEach((pIdx, i) => {
        const plat = midPlatforms[pIdx];
        if (plat) {
            const t = (i % 2 === 1 && secondaryType) ? secondaryType : enemyType;
            enemies.push({
                type: t,
                x: plat.x + Math.floor(plat.w / 2) - 30,
                y: plat.y - 60
            });
        }
    });

    return { midPlatforms, cloudPlatforms, pickups, enemies };
}

const Levels = [
    // STAGE 1: VILLAGE
    (() => {
        const geo = buildStageGeometry(['A', 'B', 'C'], 'Rat-Fiend', 'Rat-Fiend', 0);
        return buildStageConfig({
            id: 1,
            name: 'Village',
            theme: 'village',
            boss: 'Rat-Fiend Lord',
            bossSprite: 'Rat-Fiend',
            bossAura: '#ef4444',
            skyTop: '#1d4ed8',
            skyMid: '#60a5fa',
            skyBottom: '#bae6fd',
            groundColor: '#78350f',
            groundTopColor: '#22c55e',
            platColor: '#92400e',
            platTopColor: '#f59e0b',
            ...geo
        });
    })(),

    // STAGE 2: FOREST
    (() => {
        const geo = buildStageGeometry(['B', 'A', 'C'], 'Pig-Troll', 'Rat-Fiend', 1);
        return buildStageConfig({
            id: 2,
            name: 'Forest',
            theme: 'forest',
            boss: 'Pig-Troll Giant',
            bossSprite: 'Pig-Troll',
            bossAura: '#22c55e',
            skyTop: '#064e3b',
            skyMid: '#047857',
            skyBottom: '#6ee7b7',
            groundColor: '#3f2e21',
            groundTopColor: '#16a34a',
            platColor: '#5c4033',
            platTopColor: '#4ade80',
            ...geo
        });
    })(),

    // STAGE 3: MOUNTAINS
    (() => {
        const geo = buildStageGeometry(['C', 'A', 'B'], 'Wolf-Zombie', 'Pig-Troll', 2);
        return buildStageConfig({
            id: 3,
            name: 'Mountains',
            theme: 'mountains',
            boss: 'Wolf-Zombie Leader',
            bossSprite: 'Wolf-Zombie',
            bossAura: '#38bdf8',
            skyTop: '#0f172a',
            skyMid: '#334155',
            skyBottom: '#94a3b8',
            groundColor: '#334155',
            groundTopColor: '#e2e8f0',
            platColor: '#475569',
            platTopColor: '#f8fafc',
            ...geo
        });
    })(),

    // STAGE 4: CAVES
    (() => {
        const geo = buildStageGeometry(['A', 'C', 'B'], 'Lizard-Fiend', 'Wolf-Zombie', 3);
        return buildStageConfig({
            id: 4,
            name: 'Caves',
            theme: 'caves',
            boss: 'Lizard-Fiend King',
            bossSprite: 'Lizard-Fiend',
            bossAura: '#c084fc',
            skyTop: '#090514',
            skyMid: '#2e1065',
            skyBottom: '#4c1d95',
            groundColor: '#1e1b4b',
            groundTopColor: '#a855f7',
            platColor: '#312e81',
            platTopColor: '#22d3ee',
            ...geo
        });
    })(),

    // STAGE 5: DESERT
    (() => {
        const geo = buildStageGeometry(['B', 'C', 'A'], 'Boar-Troll', 'Lizard-Fiend', 4);
        return buildStageConfig({
            id: 5,
            name: 'Desert',
            theme: 'desert',
            boss: 'Boar-Troll King',
            bossSprite: 'Boar-Troll',
            bossAura: '#f59e0b',
            skyTop: '#7c2d12',
            skyMid: '#ea580c',
            skyBottom: '#fde047',
            groundColor: '#b45309',
            groundTopColor: '#fbbf24',
            platColor: '#92400e',
            platTopColor: '#fcd34d',
            ...geo
        });
    })(),

    // STAGE 6: ICE
    (() => {
        const geo = buildStageGeometry(['C', 'B', 'A'], 'Gargoyle', 'Boar-Troll', 5);
        return buildStageConfig({
            id: 6,
            name: 'Ice',
            theme: 'ice',
            boss: 'Gargoyle Emperor',
            bossSprite: 'Gargoyle',
            bossAura: '#22d3ee',
            skyTop: '#082f49',
            skyMid: '#0284c7',
            skyBottom: '#e0f2fe',
            groundColor: '#0369a1',
            groundTopColor: '#f0f9ff',
            platColor: '#0284c7',
            platTopColor: '#bae6fd',
            ...geo
        });
    })(),

    // STAGE 7: VOLCANO
    (() => {
        const geo = buildStageGeometry(['A', 'B', 'A'], 'Rat-Fiend', 'Gargoyle', 6);
        return buildStageConfig({
            id: 7,
            name: 'Volcano',
            theme: 'volcano',
            boss: 'Rat-Fiend King',
            bossSprite: 'Rat-Fiend',
            bossAura: '#f97316',
            skyTop: '#1c0404',
            skyMid: '#7f1d1d',
            skyBottom: '#ea580c',
            groundColor: '#27272a',
            groundTopColor: '#f97316',
            platColor: '#450a0a',
            platTopColor: '#fb923c',
            ...geo
        });
    })(),

    // STAGE 8: SWAMP
    (() => {
        const geo = buildStageGeometry(['B', 'C', 'B'], 'Pig-Troll', 'Lizard-Fiend', 7);
        return buildStageConfig({
            id: 8,
            name: 'Swamp',
            theme: 'swamp',
            boss: 'Pig-Troll King',
            bossSprite: 'Pig-Troll',
            bossAura: '#84cc16',
            skyTop: '#052e16',
            skyMid: '#14532d',
            skyBottom: '#3f6212',
            groundColor: '#1a2e05',
            groundTopColor: '#65a30d',
            platColor: '#365314',
            platTopColor: '#a3e635',
            ...geo
        });
    })(),

    // STAGE 9: CASTLE
    (() => {
        const geo = buildStageGeometry(['C', 'A', 'C'], 'Wolf-Zombie', 'Gargoyle', 8);
        return buildStageConfig({
            id: 9,
            name: 'Castle',
            theme: 'castle',
            boss: 'Wolf-Dragon',
            bossSprite: 'Wolf-Zombie',
            bossAura: '#f43f5e',
            skyTop: '#020617',
            skyMid: '#1e293b',
            skyBottom: '#475569',
            groundColor: '#1e293b',
            groundTopColor: '#94a3b8',
            platColor: '#334155',
            platTopColor: '#cbd5e1',
            ...geo
        });
    })(),

    // STAGE 10: MALGOR'S LAIR
    (() => {
        const geo = buildStageGeometry(['A', 'C', 'A'], 'Lizard-Fiend', 'Gargoyle', 9);
        return buildStageConfig({
            id: 10,
            name: "Malgor's Lair",
            theme: 'lair',
            boss: 'Malgor, Lord of Fear',
            bossSprite: 'Boss',
            bossAura: '#4ade80',
            skyTop: '#05010d',
            skyMid: '#1e0538',
            skyBottom: '#3b0764',
            groundColor: '#0f071e',
            groundTopColor: '#22c55e',
            platColor: '#2e1065',
            platTopColor: '#4ade80',
            ...geo
        });
    })()
];
