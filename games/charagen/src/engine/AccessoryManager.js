class AccessoryManager {
    constructor() {
        this.anchors = []; // Array of Anchor objects
        this.equipment = new Map(); // slotType -> Equipment Object
        this.inventory = new Map();
        
        this.DEFAULT_LIBRARY = [
            ['headwear', [
                { id: 'def_head_1', pivotX: 0.5, pivotY: 0.5, assetUri: 'data:image/svg+xml;utf8,<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><path d="M10,40 Q30,10 50,40 Z" fill="%23ef4444"/></svg>' }
            ]],
            ['mainWeapon', [
                { id: 'def_weap_1', pivotX: 0.5, pivotY: 0.9, assetUri: 'data:image/svg+xml;utf8,<svg width="60" height="150" xmlns="http://www.w3.org/2000/svg"><rect x="25" y="10" width="10" height="100" fill="%23a0aab5"/><rect x="15" y="110" width="30" height="10" fill="%23f59e0b"/><rect x="25" y="120" width="10" height="25" fill="%238b4513"/></svg>' }
            ]],
            ['topBody', [
                { id: 'def_body_1', pivotX: 0.5, pivotY: 0.5, assetUri: 'data:image/svg+xml;utf8,<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="20" width="60" height="60" rx="10" fill="%233b82f6"/></svg>' }
            ]],
            ['legs', [
                { id: 'def_legs_1', pivotX: 0.5, pivotY: 0.5, assetUri: 'data:image/svg+xml;utf8,<svg width="60" height="80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="0" width="15" height="80" fill="%2322c55e"/><rect x="35" y="0" width="15" height="80" fill="%2322c55e"/></svg>' }
            ]],
            ['feet', [
                { id: 'def_feet_1', pivotX: 0.5, pivotY: 0.5, assetUri: 'data:image/svg+xml;utf8,<svg width="60" height="40" xmlns="http://www.w3.org/2000/svg"><path d="M10,20 L30,20 L40,40 L10,40 Z" fill="%234b5563"/></svg>' }
            ]]
        ];

        this.loadLibrary();
    }

    loadLibrary() {
        try {
            const saved = localStorage.getItem('charagen_accessory_library');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.inventory = new Map(Object.entries(parsed));
            } else {
                this.inventory = new Map(this.DEFAULT_LIBRARY);
                this.saveLibrary();
            }
        } catch (e) {
            console.error("Failed to load accessory library", e);
            this.inventory = new Map(this.DEFAULT_LIBRARY);
        }
    }

    saveLibrary() {
        const obj = {};
        for (const [category, items] of this.inventory.entries()) {
            obj[category] = items;
        }
        localStorage.setItem('charagen_accessory_library', JSON.stringify(obj));
    }

    getInventoryItems(category) {
        return this.inventory.get(category) || [];
    }

    addInventoryItem(category, assetUri, pivotX = 0.5, pivotY = 0.5, overrideId = null) {
        if (!this.inventory.has(category)) {
            this.inventory.set(category, []);
        }
        const id = overrideId || `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        this.inventory.get(category).push({ id, assetUri, pivotX, pivotY });
        this.saveLibrary();
        return id;
    }

    deleteInventoryItem(category, itemId) {
        const items = this.inventory.get(category);
        if (items) {
            const index = items.findIndex(i => i.id === itemId);
            if (index !== -1) {
                items.splice(index, 1);
                this.saveLibrary();
                return true;
            }
        }
        return false;
    }

    addAnchor(anchorId, connectionId, slotType, positionPercent, rotationOffset, scale = 1.0) {
        this.anchors.push({
            anchorId,
            connectionId,
            slotType,
            positionPercent: positionPercent !== undefined ? positionPercent : 0,
            rotationOffset: rotationOffset || 0,
            scale: scale
        });
    }
    
    getAnchorsForConnection(connectionId) {
        return this.anchors.filter(a => a.connectionId === connectionId);
    }

    getLibraryItem(itemId) {
        for (const items of this.inventory.values()) {
            const found = items.find(i => i.id === itemId);
            if (found) return found;
        }
        return null;
    }

    equipItem(slotType, itemId, itemClass) {
        const libItem = this.getLibraryItem(itemId);
        
        const item = {
            itemId,
            itemClass,
            assetUri: libItem ? libItem.assetUri : null,
            pivotX: libItem ? libItem.pivotX : 0.5,
            pivotY: libItem ? libItem.pivotY : 0.5,
            image: null // To be loaded by Viewport
        };
        this.equipment.set(slotType, item);

        if (item.assetUri) {
            const img = new Image();
            img.onload = () => {
                item.image = img;
            };
            img.onerror = () => {
                console.warn(`Failed to load accessory image for ${slotType}`);
            };
            img.src = item.assetUri;
        } else {
            console.warn(`Accessory ${itemId} not found in global library for slot ${slotType}`);
        }
    }

    getEquipmentBySlot(slotType) {
        return this.equipment.get(slotType);
    }

    getAllEquipment() {
        return Array.from(this.equipment.values());
    }

    // Helper to calculate final world transform of an accessory based on its anchor
    calculateAccessoryTransform(anchor, jointA, jointB) {
        if (!jointA || !jointB) return null;

        const positionPercent = anchor.positionPercent; // Assume 0.0 to 1.0 range
        
        const x = jointA.x + (jointB.x - jointA.x) * positionPercent;
        const y = jointA.y + (jointB.y - jointA.y) * positionPercent;
        
        const rotation = Math.atan2(jointB.y - jointA.y, jointB.x - jointA.x);

        return {
            x,
            y,
            rotation: rotation + anchor.rotationOffset,
            scaleX: anchor.scale || 1,
            scaleY: anchor.scale || 1
        };
    }
}
