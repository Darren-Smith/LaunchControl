class Joint {
    constructor(id, x, y, label, radius = 10) {
        this.id = id;
        this.x = x || 0; // Absolute world X
        this.y = y || 0; // Absolute world Y
        this.label = label || id;
        this.radius = radius;
        
        // FK Hierarchy
        this.parentId = null;
        this.localX = x || 0; // Position relative to parent
        this.localY = y || 0; // Position relative to parent
    }
}

class Connection {
    constructor(id, jointA, jointB, label) {
        this.id = id;
        this.jointA = jointA; // Joint ID (Parent)
        this.jointB = jointB; // Joint ID (Child)
        this.label = label || id;
    }
    
    // Returns virtual anchors at 25%, 50%, 75%
    getAnchors(engine) {
        const jA = engine.getJoint(this.jointA);
        const jB = engine.getJoint(this.jointB);
        if (!jA || !jB) return [];
        
        return [
            { id: `${this.id}_25`, percent: 25, x: jA.x + (jB.x - jA.x) * 0.25, y: jA.y + (jB.y - jA.y) * 0.25 },
            { id: `${this.id}_50`, percent: 50, x: jA.x + (jB.x - jA.x) * 0.50, y: jA.y + (jB.y - jA.y) * 0.50 },
            { id: `${this.id}_75`, percent: 75, x: jA.x + (jB.x - jA.x) * 0.75, y: jA.y + (jB.y - jA.y) * 0.75 }
        ];
    }
}

class JointEngine {
    constructor() {
        this.joints = new Map();
        this.connections = new Map();
        
        // Root skeleton structure (if we want explicit grouping later)
        this.rootJointId = null;

        this.skinState = {
            active: false,
            materialColor: '#fcd5ce' // Default light skin
        };
    }

    addJoint(id, x, y, label, radius) {
        if (this.joints.has(id)) return null;
        const j = new Joint(id, x, y, label, radius);
        this.joints.set(id, j);
        return j;
    }

    addConnection(id, jointA, jointB, label) {
        if (this.connections.has(id)) return null;
        const c = new Connection(id, jointA, jointB, label);
        this.connections.set(id, c);
        
        // Establish FK hierarchy: jointA becomes parent of jointB
        const jB = this.getJoint(jointB);
        const jA = this.getJoint(jointA);
        if (jB && jA) {
            jB.parentId = jointA;
            jB.localX = jB.x - jA.x;
            jB.localY = jB.y - jA.y;
        }
        
        return c;
    }

    getJoint(id) { return this.joints.get(id); }
    getConnection(id) { return this.connections.get(id); }
    
    getAllJoints() { return Array.from(this.joints.values()); }
    getAllConnections() { return Array.from(this.connections.values()); }

    updateJointProperty(id, property, value) {
        const j = this.getJoint(id);
        if (j) {
            if (property === 'x') {
                this.setJointWorldPosition(id, value, j.y);
            }
            else if (property === 'y') {
                this.setJointWorldPosition(id, j.x, value);
            }
            else if (property === 'label') j.label = value;
        }
    }

    setJointWorldPosition(id, worldX, worldY, lockLength = false) {
        const j = this.getJoint(id);
        if (!j) return;
        
        if (j.parentId) {
            const parent = this.getJoint(j.parentId);
            if (parent) {
                let dx = worldX - parent.x;
                let dy = worldY - parent.y;
                
                if (lockLength) {
                    const currentLen = Math.sqrt(j.localX * j.localX + j.localY * j.localY);
                    const newLen = Math.sqrt(dx * dx + dy * dy);
                    if (newLen > 0 && currentLen > 0) {
                        dx = (dx / newLen) * currentLen;
                        dy = (dy / newLen) * currentLen;
                    }
                }
                
                j.localX = dx;
                j.localY = dy;
            }
        } else {
            j.localX = worldX;
            j.localY = worldY;
        }
        
        this.updateWorldPositions();
    }

    updateWorldPositions() {
        const roots = this.getAllJoints().filter(j => !j.parentId);
        for (const root of roots) {
            this.updateJointWorldPositionRecursive(root);
        }
    }

    updateJointWorldPositionRecursive(joint) {
        if (joint.parentId) {
            const parent = this.getJoint(joint.parentId);
            if (parent) {
                joint.x = parent.x + joint.localX;
                joint.y = parent.y + joint.localY;
            } else {
                joint.x = joint.localX;
                joint.y = joint.localY;
            }
        } else {
            joint.x = joint.localX;
            joint.y = joint.localY;
        }
        
        const children = this.getAllJoints().filter(j => j.parentId === joint.id);
        for (const child of children) {
            this.updateJointWorldPositionRecursive(child);
        }
    }
    
    updateConnectionProperty(id, property, value) {
        const c = this.getConnection(id);
        if (c) {
            if (property === 'label') c.label = value;
        }
    }
    
    deleteJoint(id) {
        this.joints.delete(id);
        for (const [cid, conn] of this.connections.entries()) {
            if (conn.jointA === id || conn.jointB === id) {
                this.deleteConnection(cid);
            }
        }
        
        // Orphan children
        const children = this.getAllJoints().filter(j => j.parentId === id);
        for (const child of children) {
            child.parentId = null;
            child.localX = child.x; // Convert current absolute to local for root
            child.localY = child.y;
        }
    }

    deleteConnection(id) {
        const c = this.getConnection(id);
        if (c) {
            const jB = this.getJoint(c.jointB);
            if (jB && jB.parentId === c.jointA) {
                jB.parentId = null;
                jB.localX = jB.x;
                jB.localY = jB.y;
            }
            this.connections.delete(id);
        }
    }
    
    clear() {
        this.joints.clear();
        this.connections.clear();
    }
}
