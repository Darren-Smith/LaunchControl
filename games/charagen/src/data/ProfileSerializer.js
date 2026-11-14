class ProfileSerializer {
    constructor(jointEngine, accessoryManager, timelineEngine) {
        this.jointEngine = jointEngine;
        this.accessoryManager = accessoryManager;
        this.timelineEngine = timelineEngine;
    }

    serialize() {
        const joints = this.jointEngine.getAllJoints().map(j => ({
            id: j.id,
            label: j.label,
            x: j.x,
            y: j.y,
            radius: j.radius || 10
        }));
        
        const connections = this.jointEngine.getAllConnections().map(c => ({
            id: c.id,
            label: c.label,
            jointA: c.jointA,
            jointB: c.jointB
        }));

        const anchorPoints = [...this.accessoryManager.anchors];
        
        const equipmentSlots = {};
        for (const [slotType, eq] of this.accessoryManager.equipment.entries()) {
            equipmentSlots[slotType] = {
                itemId: eq.itemId,
                itemClass: eq.itemClass
            };
        }

        const movementProfiles = {};
        for (const [name, prof] of this.timelineEngine.profiles.entries()) {
            movementProfiles[name] = {
                frameRate: prof.frameRate,
                loop: prof.loop,
                keyframes: prof.keyframes,
                easing: prof.easing || 'linear',
                repoFrames: prof.repoFrames || 0
            };
        }

        const data = {
            "$schema": "https://charagen.dev/schemas/character-profile.v2.json",
            "name": document.getElementById('profile-name').value || "Exported_Character",
            "templateClass": window.currentTemplateClass || "Based on Humanoid",
            "classCategory": window.currentClassCategory || "humanoid",
            "version": "2.0.0",
            "metadata": {
                "author": "CharaGen",
                "createdTimestamp": Date.now(),
                "compatibleGames": ["HeroMaker"]
            },
            "skinState": {
                "active": this.jointEngine.skinState.active,
                "materialColor": this.jointEngine.skinState.materialColor
            },
            "graph": {
                "joints": joints,
                "connections": connections
            },
            "anchorPoints": anchorPoints,
            "equipmentSlots": equipmentSlots,
            "movementProfiles": movementProfiles
        };

        return JSON.stringify(data, null, 2);
    }
}
