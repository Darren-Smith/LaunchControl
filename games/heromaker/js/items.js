/**
 * HeroMaker - Multi-Slot Equipment, Wardrobe & Custom Item Forge Catalog
 * Supports 5 CharaGen Attachment Slots:
 *   - mainWeapon ('Weapons')
 *   - headwear   ('Headwear / Helmets')
 *   - topBody    ('Chest Armor / Tunics')
 *   - legs       ('Leg Armor / Greaves')
 *   - feet       ('Boots / Footwear')
 */
const Items = {
    Slots: [
        { key: 'mainWeapon', label: 'Weapon', shortLabel: '⚔ Weapon', icon: '🗡' },
        { key: 'headwear', label: 'Headwear', shortLabel: '🪖 Head', icon: '🪖' },
        { key: 'topBody', label: 'Chest Armor', shortLabel: '🛡 Chest', icon: '🛡' },
        { key: 'legs', label: 'Leg Greaves', shortLabel: '👖 Legs', icon: '🦿' },
        { key: 'feet', label: 'Boots', shortLabel: '🥾 Feet', icon: '🥾' }
    ],

    // 1. Weapons (slot: 'mainWeapon')
    Weapons: [
        { id: 'sword_wood', slot: 'mainWeapon', level: 1, name: 'Wooden Sword', damage: 10, defense: 0, health: 0, speed: 0, cost: 0, baseCost: 0, color: '#deb887' },
        { id: 'sword_iron', slot: 'mainWeapon', level: 2, name: 'Iron Broadsword', damage: 22, defense: 2, health: 0, speed: 0, cost: 50, baseCost: 50, color: '#cbd5e1' },
        { id: 'sword_steel', slot: 'mainWeapon', level: 3, name: 'Knight Steel Blade', damage: 38, defense: 4, health: 10, speed: 5, cost: 150, baseCost: 150, color: '#38bdf8' },
        { id: 'sword_magic', slot: 'mainWeapon', level: 4, name: 'Arcane Runeblade', damage: 65, defense: 6, health: 25, speed: 10, cost: 400, baseCost: 400, color: '#c084fc' },
        { id: 'sword_legend', slot: 'mainWeapon', level: 5, name: 'Excalibur', damage: 110, defense: 12, health: 50, speed: 18, cost: 1000, baseCost: 1000, color: '#fbbf24' }
    ],

    // 2. Headwear / Helmets (slot: 'headwear')
    Headwear: [
        { id: 'head_bandana', slot: 'headwear', level: 1, name: 'Adventurer Bandana', damage: 0, defense: 0, health: 0, speed: 0, cost: 0, baseCost: 0, color: '#f59e0b' },
        { id: 'head_leather', slot: 'headwear', level: 2, name: 'Scout Leather Hood', damage: 2, defense: 4, health: 10, speed: 5, cost: 35, baseCost: 35, color: '#b45309' },
        { id: 'head_chain', slot: 'headwear', level: 3, name: 'Vanguard Coif Helm', damage: 4, defense: 9, health: 25, speed: 5, cost: 110, baseCost: 110, color: '#94a3b8' },
        { id: 'head_plate', slot: 'headwear', level: 4, name: 'Royal Greathelm', damage: 8, defense: 15, health: 45, speed: 8, cost: 280, baseCost: 280, color: '#3b82f6' },
        { id: 'head_dragon', slot: 'headwear', level: 5, name: 'Dragonlord Crown', damage: 16, defense: 24, health: 80, speed: 12, cost: 700, baseCost: 700, color: '#dc2626' }
    ],

    // 3. Chest Armor / Tunics (slot: 'topBody')
    Armor: [
        { id: 'armor_cloth', slot: 'topBody', level: 1, name: 'Cloth Tunic', damage: 0, defense: 0, health: 0, speed: 0, cost: 0, baseCost: 0, color: '#f0e68c' },
        { id: 'armor_leather', slot: 'topBody', level: 2, name: 'Leather Cuirass', damage: 0, defense: 8, health: 20, speed: 4, cost: 50, baseCost: 50, color: '#b45309' },
        { id: 'armor_chain', slot: 'topBody', level: 3, name: 'Mithril Chainmail', damage: 3, defense: 18, health: 45, speed: 6, cost: 150, baseCost: 150, color: '#94a3b8' },
        { id: 'armor_plate', slot: 'topBody', level: 4, name: 'Paladin Plate', damage: 6, defense: 30, health: 85, speed: 8, cost: 400, baseCost: 400, color: '#3b82f6' },
        { id: 'armor_dragon', slot: 'topBody', level: 5, name: 'Dragon Scale Mail', damage: 14, defense: 46, health: 150, speed: 12, cost: 950, baseCost: 950, color: '#dc2626' }
    ],

    // 4. Leg Greaves (slot: 'legs')
    Legs: [
        { id: 'legs_cloth', slot: 'legs', level: 1, name: 'Ranger Breeches', damage: 0, defense: 0, health: 0, speed: 0, cost: 0, baseCost: 0, color: '#78350f' },
        { id: 'legs_leather', slot: 'legs', level: 2, name: 'Studded Chausses', damage: 0, defense: 4, health: 10, speed: 6, cost: 40, baseCost: 40, color: '#92400e' },
        { id: 'legs_chain', slot: 'legs', level: 3, name: 'Chainmail Greaves', damage: 2, defense: 9, health: 20, speed: 10, cost: 120, baseCost: 120, color: '#64748b' },
        { id: 'legs_plate', slot: 'legs', level: 4, name: 'Templar Tassets', damage: 5, defense: 15, health: 40, speed: 14, cost: 320, baseCost: 320, color: '#2563eb' },
        { id: 'legs_dragon', slot: 'legs', level: 5, name: 'Dragonbone Greaves', damage: 10, defense: 22, health: 70, speed: 20, cost: 750, baseCost: 750, color: '#b91c1c' }
    ],

    // 5. Boots / Footwear (slot: 'feet')
    Feet: [
        { id: 'feet_leather', slot: 'feet', level: 1, name: 'Traveler Boots', damage: 0, defense: 0, health: 0, speed: 0, cost: 0, baseCost: 0, color: '#451a03' },
        { id: 'feet_strider', slot: 'feet', level: 2, name: 'Swift Strider Boots', damage: 0, defense: 3, health: 5, speed: 14, cost: 35, baseCost: 35, color: '#854d0e' },
        { id: 'feet_iron', slot: 'feet', level: 3, name: 'Ironclad Sabatons', damage: 2, defense: 7, health: 15, speed: 22, cost: 100, baseCost: 100, color: '#475569' },
        { id: 'feet_winged', slot: 'feet', level: 4, name: 'Winged Greaves', damage: 5, defense: 11, health: 25, speed: 34, cost: 260, baseCost: 260, color: '#0284c7' },
        { id: 'feet_dragon', slot: 'feet', level: 5, name: 'Inferno Treads', damage: 10, defense: 18, health: 50, speed: 48, cost: 650, baseCost: 650, color: '#991b1b' }
    ],

    Custom: [],

    getCategoryBySlot(slot) {
        switch (slot) {
            case 'mainWeapon': return this.Weapons;
            case 'headwear': return this.Headwear;
            case 'topBody': return this.Armor;
            case 'legs': return this.Legs;
            case 'feet': return this.Feet;
            default: return [];
        }
    },

    getAllForSlot(slot) {
        const base = this.getCategoryBySlot(slot);
        const custom = this.Custom.filter(i => i.slot === slot);
        return [...base, ...custom];
    },

    getAllItems() {
        return [
            ...this.Weapons,
            ...this.Headwear,
            ...this.Armor,
            ...this.Legs,
            ...this.Feet,
            ...this.Custom
        ];
    },

    getById(id) {
        return this.getAllItems().find(item => item.id === id) || null;
    },

    loadCustomItems() {
        try {
            const raw = localStorage.getItem('heromaker_custom_items_v1');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    this.Custom = parsed;
                }
            }
        } catch {
            this.Custom = [];
        }
    },

    saveCustomItems() {
        try {
            localStorage.setItem('heromaker_custom_items_v1', JSON.stringify(this.Custom));
        } catch {
            // Ignore quota errors
        }
    },

    addCustomItem(itemData) {
        const idx = this.Custom.findIndex(i => i.id === itemData.id);
        if (idx >= 0) {
            this.Custom[idx] = itemData;
        } else {
            this.Custom.push(itemData);
        }
        this.saveCustomItems();
        return itemData;
    }
};

Items.loadCustomItems();
