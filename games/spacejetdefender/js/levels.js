// ============================================================================
// SPACEJET DEFENDER - Ranks, 10 Campaign Levels (8 Screens Wide), & Medals
// ============================================================================

const SCREEN_WIDTH = 1280;
const SCREEN_HEIGHT = 720;
const LEVEL_SCREENS = 8;
const LEVEL_LENGTH = SCREEN_WIDTH * LEVEL_SCREENS; // 10,240 px

const RANKS = [
  'Cadet',                 // Level 1
  'Scout',                 // Level 2
  'Ensign',                // Level 3
  'Lieutenant',            // Level 4
  'Lieutenant Commander',  // Level 5
  'Commander',             // Level 6
  'Captain',               // Level 7
  'Commodore',             // Level 8
  'Rear Admiral',          // Level 9
  'Admiral'                // Level 10
];

const PROMOTION_QUOTES = {
  'Cadet': (name) => `"Nice to meet you Cadet ${name}! Ready for Flight School?"`,
  'Scout': (name) => `"Nice to meet you Scout ${name}! Field Command is counting on you."`,
  'Ensign': (name) => `"Congratulations on your promotion, Ensign ${name}!"`,
  'Lieutenant': (name) => `"Outstanding flying! You've earned your bars, Lieutenant ${name}!"`,
  'Lieutenant Commander': (name) => `"A well deserved promotion, Lieutenant Commander ${name}!"`,
  'Commander': (name) => `"Congratulations on your promotion, Commander ${name}! High Command salutes your valor."`,
  'Captain': (name) => `"A well deserved promotion, Captain ${name}! Lead the spaceport evacuation!"`,
  'Commodore': (name) => `"Congratulations on your promotion, Commodore ${name}! The entire fleet stands behind you."`,
  'Rear Admiral': (name) => `"An extraordinary rise through the ranks—salute to Rear Admiral ${name}!"`,
  'Admiral': (name) => `"Our highest honor for Earth's finest pilot—congratulations, Admiral ${name}!"`
};

const MEDALS_CATALOG = [
  {
    id: 'survivor_wings',
    name: 'Last Survivor Wings',
    desc: 'Graduated Flight School & survived the sudden alien ambush in Level 1.',
    color: '#00f3ff',
    icon: 'WINGS'
  },
  {
    id: 'radar_liberator',
    name: 'Hello, Minimap! Star',
    desc: 'Freed the Orbital Radar Station in Level 3 and restored long-range telemetry.',
    color: '#00ff88',
    icon: 'RADAR'
  },
  {
    id: 'arsenal_master',
    name: 'Heavy Arsenal Cross',
    desc: 'Secured the Power Station Plasma Core & Alien Factory Seeker Weapons (Levels 4 & 6).',
    color: '#ffaa00',
    icon: 'WEAPON'
  },
  {
    id: 'humanity_savior',
    name: 'Savior of Humanity',
    desc: 'Cleared the Airport for evacuation shuttles & rescued captives from the Alien Prison.',
    color: '#ff44cc',
    icon: 'HEART'
  },
  {
    id: 'tesla_breaker',
    name: 'Tesla Stormbreaker',
    desc: 'Smashed the Alien Army Base Tesla Coils in Level 9.',
    color: '#ffee00',
    icon: 'BOLT'
  },
  {
    id: 'kingslayer',
    name: 'Order of the Regicide',
    desc: 'Defeated the Alien King at the Giant UFO Command Palace in Level 10.',
    color: '#ff2255',
    icon: 'CROWN'
  },
  {
    id: 'untouchable_ace',
    name: 'Neon Untouchable Ace',
    desc: 'Completed a mission sector without taking hull damage.',
    color: '#aa66ff',
    icon: 'SHIELD'
  },
  {
    id: 'grand_admiral',
    name: 'Grand Fleet Admiral',
    desc: 'Achieved the rank of Admiral with a final score over 75,000 pts.',
    color: '#00ffff',
    icon: 'STAR'
  }
];

const LEVELS = [
  // --------------------------------------------------------------------------
  // LEVEL 1: Flight School Training & Easy Targets
  // --------------------------------------------------------------------------
  {
    number: 1,
    rank: RANKS[0], // Cadet
    title: 'FLIGHT SCHOOL & SURPRISE INVASION',
    subtitle: 'Training Grounds // Sector 01',
    music: 'flight_school',
    themeColor: '#00f3ff',
    secondaryColor: '#00ff99',
    terrainStyle: 'academy',
    radarInitiallyActive: true,
    bossType: null,
    objectiveText: 'Shoot training targets & survive the ambush!',
    briefing: (name) =>
      `Nice to meet you Cadet ${name}! Welcome to Earth Orbital Flight School. ` +
      `Your Academy Radar Minimap is online—fly through the orbital training corridor and blast the holo-targets. ` +
      `Wait... long-range sensors are picking up strange subspace anomalies...`,
    radioEvents: [
      {
        x: 200,
        speaker: 'INSTRUCTOR VANCE',
        text: (name) => `Nice to meet you Cadet ${name}! Test your thrusters and blast these easy target drones!`
      },
      {
        x: 2500,
        speaker: 'INSTRUCTOR VANCE',
        text: () => `Great shooting, Cadet! Grab any Shield or Double-Shot power-ups the cargo drones drop.`
      },
      {
        x: 4460,
        triggerOnFirstAlienInView: true,
        jamRadar: true,
        speaker: 'ACADEMY CONTROL',
        text: (name) => `RED ALERT! Massive alien fleet dropping out of warp! They've jammed our Radar—${name}, you're the last survivor left!`,
        alarm: true,
        switchMusic: 'sector_early'
      },
      {
        x: 8400,
        speaker: 'AI NAV-COMP',
        text: () => `Academy destroyed and Radar offline. Punch through the alien vanguard and reach the Sector Exit Gate!`
      }
    ]
  },

  // --------------------------------------------------------------------------
  // LEVEL 2: Stop Patrol Ships (One Gets Away!)
  // --------------------------------------------------------------------------
  {
    number: 2,
    rank: RANKS[1], // Scout
    title: 'INTERCEPT ALIEN PATROLS',
    subtitle: 'Outer Canyon // Sector 02',
    music: 'sector_early',
    themeColor: '#00ffaa',
    secondaryColor: '#ff3377',
    terrainStyle: 'canyon',
    radarInitiallyActive: false,
    bossType: null,
    objectiveText: 'Destroy Alien Patrol Ships (Watch for runners!)',
    briefing: (name) =>
      `Nice to meet you Scout ${name}! With the Academy gone, field command has promoted you to Scout. ` +
      `Alien patrol ships are sweeping the canyon sector. Intercept and destroy their squadrons before they report our flight vector!`,
    radioEvents: [
      {
        x: 250,
        speaker: 'FIELD HQ',
        text: (name) => `Nice to meet you Scout ${name}! Alien patrol wings ahead—take them down before they link up!`
      },
      {
        x: 4500,
        speaker: 'AI NAV-COMP',
        text: () => `Radar is still jammed by alien interference. Rely on visual contact and destroy the patrol formations!`
      },
      {
        x: 8600,
        speaker: 'ALERT',
        text: () => `WARNING: High-speed Crimson Patrol Scout detected charging hyper-drive!`,
        spawnEscapingPatrol: true
      }
    ]
  },

  // --------------------------------------------------------------------------
  // LEVEL 3: Free the Radar Station (Hello, Minimap!)
  // --------------------------------------------------------------------------
  {
    number: 3,
    rank: RANKS[2], // Ensign
    title: 'FREE THE RADAR STATION',
    subtitle: 'Telemetry Ridge // Sector 03',
    music: 'sector_early',
    themeColor: '#00ff66',
    secondaryColor: '#00ccff',
    terrainStyle: 'radar_array',
    radarInitiallyActive: false,
    bossType: null,
    objectiveText: 'Destroy Alien Jammers to unlock the Radar Minimap!',
    briefing: (name) =>
      `Congratulations on your promotion, Ensign ${name}! Flying blind without long-range sensors is too risky. ` +
      `Strike the captured Orbital Radar Station, smash the alien Jammer Pylons, and bring our Minimap back online!`,
    radioEvents: [
      {
        x: 250,
        speaker: 'FIELD HQ',
        text: (name) => `Go get 'em, Ensign ${name}! Destroy the glowing purple Jammer Towers clamping the Radar Dishes!`
      },
      {
        x: 4800,
        speaker: 'RADAR TECH',
        text: () => `Almost there! Smash the primary Radar Jammer Core ahead to restore the Long-Range Minimap!`
      }
    ]
  },

  // --------------------------------------------------------------------------
  // LEVEL 4: Clear the Power Station for Better Weapons + a Mini-Boss
  // --------------------------------------------------------------------------
  {
    number: 4,
    rank: RANKS[3], // Lieutenant
    title: 'LIBERATE THE POWER STATION',
    subtitle: 'Reactor Core // Sector 04',
    music: 'sector_early',
    themeColor: '#ffaa00',
    secondaryColor: '#00f3ff',
    terrainStyle: 'power_station',
    radarInitiallyActive: true,
    bossType: 'power_miniboss',
    objectiveText: 'Secure the Plasma Weapon Core & defeat the Grid Overseer!',
    briefing: (name) =>
      `Well done, Lieutenant ${name}! With the Minimap active, we've pinpointed the alien siphon at the Fusion Power Station. ` +
      `Clear the reactors to supercharge your Spacejet with Twin Heavy Plasma Cannons—and watch out for the Grid Overseer Mini-Boss!`,
    radioEvents: [
      {
        x: 250,
        speaker: 'CHIEF ENGINEER',
        text: (name) => `Lieutenant ${name}, clear the energy conduits! At the halfway reactor we can overcharge your primary weapons!`
      },
      {
        x: 5000,
        speaker: 'CHIEF ENGINEER',
        text: () => `POWER STATION CORE LIBERATED! Routing gigawatts to your Spacejet: HEAVY PLASMA CANNONS ONLINE!`,
        unlockWeaponTier: 2
      },
      {
        x: 8700,
        speaker: 'WARNING',
        text: () => `MINI-BOSS DETECTED: The Alien Grid Overseer is blocking the sector exit!`,
        alarm: true,
        switchMusic: 'boss'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // LEVEL 5: Clear Out the Research Labs
  // --------------------------------------------------------------------------
  {
    number: 5,
    rank: RANKS[4], // Lieutenant Commander
    title: 'PURGE THE RESEARCH LABS',
    subtitle: 'Bio-Dome Complex // Sector 05',
    music: 'sector_mid',
    themeColor: '#cc44ff',
    secondaryColor: '#00ffcc',
    terrainStyle: 'research_labs',
    radarInitiallyActive: true,
    bossType: null,
    objectiveText: 'Destroy Alien Bio-Pods & Research Mainframes!',
    briefing: (name) =>
      `You've earned your stripes, Lieutenant Commander ${name}! The invaders have turned our Science Bio-Domes into a twisted Research Lab. ` +
      `Sweep the lab complex and incinerate their specimen tanks and phase-drones before they unleash a bioweapon!`,
    radioEvents: [
      {
        x: 250,
        speaker: 'SCIENCE DIRECTOR',
        text: (name) => `Lt. Commander ${name}, target the glowing Bio-Vats and Data Mainframes along the lab floor!`
      },
      {
        x: 5200,
        speaker: 'SCIENCE DIRECTOR',
        text: () => `Phase-shifter drones are swarming from Dome B! Keep your shields up and blast through!`
      }
    ]
  },

  // --------------------------------------------------------------------------
  // LEVEL 6: Raid Alien Factories for a New Weapon + Another Mini-Boss
  // --------------------------------------------------------------------------
  {
    number: 6,
    rank: RANKS[5], // Commander
    title: 'RAID THE ALIEN FACTORIES',
    subtitle: 'Foundry Nexus // Sector 06',
    music: 'sector_mid',
    themeColor: '#ff5522',
    secondaryColor: '#ffee00',
    terrainStyle: 'factory',
    radarInitiallyActive: true,
    bossType: 'factory_miniboss',
    objectiveText: 'Capture the Seeker Weapon Bay & defeat the Forge-Mecha!',
    briefing: (name) =>
      `Welcome to the brass, Commander ${name}! Intel shows the aliens are mass-producing warships inside the Foundry Nexus. ` +
      `Raid the factory, seize their experimental Tri-Spread & Homing Seeker weapon pod, and scrap the Forge-Mecha Mini-Boss!`,
    radioEvents: [
      {
        x: 250,
        speaker: 'FIELD HQ',
        text: (name) => `Commander ${name}, smash the assembly turrets and reach the experimental ordnance vault at mid-sector!`
      },
      {
        x: 5000,
        speaker: 'ARMORY AI',
        text: () => `NEW WEAPON ACQUIRED! Tri-Spread Cannon & Homing Seeker Missiles installed on your Spacejet!`,
        unlockWeaponTier: 3
      },
      {
        x: 8700,
        speaker: 'WARNING',
        text: () => `MINI-BOSS ALERT: Factory Goliath Forge-Mecha powering up ahead!`,
        alarm: true,
        switchMusic: 'boss'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // LEVEL 7: Clear the Airport so Humans Can Escape
  // --------------------------------------------------------------------------
  {
    number: 7,
    rank: RANKS[6], // Captain
    title: 'CLEAR THE SPACEPORT RUNWAYS',
    subtitle: 'New Geneva Airport // Sector 07',
    music: 'sector_mid',
    themeColor: '#00ddff',
    secondaryColor: '#ff8800',
    terrainStyle: 'airport',
    radarInitiallyActive: true,
    bossType: null,
    objectiveText: 'Destroy blockade ships so Human Shuttles can launch!',
    briefing: (name) =>
      `Salute, Captain ${name}! Civilian evacuation transports are pinned down at New Geneva Airport. ` +
      `Clear the alien blockade fighters and AA batteries across the spaceport runways so the human shuttles can launch to safety!`,
    radioEvents: [
      {
        x: 250,
        speaker: 'TOWER CONTROL',
        text: (name) => `Captain ${name}, thank goodness you're here! Clear the alien suppressors near each shuttle pad so we can launch!`
      },
      {
        x: 4800,
        speaker: 'SHUTTLE PILOT',
        text: () => `Runway 04 clear! Civilian transports lifting off—keep covering our ascent, Captain!`
      }
    ]
  },

  // --------------------------------------------------------------------------
  // LEVEL 8: Break Into the Prison, Rescue Folks, and Take Down a Medium Alien Boss
  // --------------------------------------------------------------------------
  {
    number: 8,
    rank: RANKS[7], // Commodore
    title: 'PRISON BREAKOUT & WARDEN BOSS',
    subtitle: 'Detention Citadel // Sector 08',
    music: 'sector_late',
    themeColor: '#ff33aa',
    secondaryColor: '#00ffaa',
    terrainStyle: 'prison',
    radarInitiallyActive: true,
    bossType: 'prison_mediumboss',
    objectiveText: 'Shoot open Prison Cages, rescue humans & defeat the Warden!',
    briefing: (name) =>
      `You are now Commodore ${name}! Thousands of captured citizens are locked inside the Alien Detention Citadel. ` +
      `Blast open the neon Laser-Cages, fly close to rescue the escaping captives, and take down the Medium Alien Boss—the Prison Warden!`,
    radioEvents: [
      {
        x: 250,
        speaker: 'RESISTANCE CELL',
        text: (name) => `Commodore ${name}! Shoot the glowing Prison Cages on the ground to free our people, then scoop them up!`
      },
      {
        x: 5000,
        speaker: 'RESISTANCE CELL',
        text: () => `Keep freeing those cages! Every rescued survivor boosts fleet morale and bonus score!`
      },
      {
        x: 8600,
        speaker: 'WARNING',
        text: () => `MEDIUM ALIEN BOSS APPROACHING: The Warden Dreadnought is blocking the Citadel Gate!`,
        alarm: true,
        switchMusic: 'boss'
      }
    ]
  },

  // --------------------------------------------------------------------------
  // LEVEL 9: Smash the Alien Army Base's Tesla Coils
  // --------------------------------------------------------------------------
  {
    number: 9,
    rank: RANKS[8], // Rear Admiral
    title: 'SMASH THE TESLA COIL FORTRESS',
    subtitle: 'Alien Army Base // Sector 09',
    music: 'sector_late',
    themeColor: '#ffee00',
    secondaryColor: '#00f3ff',
    terrainStyle: 'tesla_base',
    radarInitiallyActive: true,
    bossType: null,
    objectiveText: 'Smash all Giant Neon Tesla Coils across the Army Base!',
    briefing: (name) =>
      `Rear Admiral ${name}! Only one barrier stands between us and the Alien King's palace: the Alien Army Base. ` +
      `Their giant Tesla Coils project lethal lightning arcs across the sky. Smash the Tesla Coils across the entire base!`,
    radioEvents: [
      {
        x: 250,
        speaker: 'FLEET COMMAND',
        text: (name) => `Rear Admiral ${name}, watch out for the high-voltage lightning discharges! Smash every Tesla Coil tower!`
      },
      {
        x: 5200,
        speaker: 'AI NAV-COMP',
        text: () => `Halfway through the Army Base! Destroy the remaining Tesla Coils to collapse the palace shield!`
      }
    ]
  },

  // --------------------------------------------------------------------------
  // LEVEL 10: Final Showdown at the Giant UFO Command Palace Against Hard Enemies and the Alien King!
  // --------------------------------------------------------------------------
  {
    number: 10,
    rank: RANKS[9], // Admiral
    title: 'GIANT UFO COMMAND PALACE',
    subtitle: 'Throne of the Alien King // Sector 10',
    music: 'sector_late',
    themeColor: '#ff1155',
    secondaryColor: '#ffcc00',
    terrainStyle: 'ufo_palace',
    radarInitiallyActive: true,
    bossType: 'alien_king',
    objectiveText: 'Storm the Giant UFO Palace & defeat the ALIEN KING!',
    briefing: (name) =>
      `All hail Admiral ${name}! You started as a Cadet in Flight School, and now Earth's fate rests on your wings. ` +
      `Fly straight into the Giant UFO Command Palace, battle through the Royal Guard, and destroy the ALIEN KING!`,
    radioEvents: [
      {
        x: 250,
        speaker: 'ALIEN KING',
        text: (name) => `Foolish human Admiral ${name}! You may have survived my armada, but my Command Palace will be your tomb!`
      },
      {
        x: 4800,
        speaker: 'FLEET COMMAND',
        text: (name) => `Stay sharp, Admiral ${name}! Elite Royal Guards ahead—save your shields for the Throne Room!`
      },
      {
        x: 8500,
        speaker: 'ALIEN KING',
        text: (name) => `BEHOLD MY ROYAL MOTHERSHIP! Kneel before the Alien King, ${name}!`,
        alarm: true,
        switchMusic: 'boss'
      }
    ]
  }
];

window.GAME_CONSTANTS = {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  LEVEL_SCREENS,
  LEVEL_LENGTH,
  RANKS,
  PROMOTION_QUOTES,
  MEDALS_CATALOG,
  LEVELS
};
