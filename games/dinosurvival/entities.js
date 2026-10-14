import * as THREE from 'three';

export class Entity {
    constructor(scene, color) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        this.color = color;
        this.speed = 10;
        this.velocity = new THREE.Vector3();
        this.radius = 1;
        this.scene.add(this.mesh);
        this.isDead = false;
    }

    update(dt) {
        if (this.isDead) return;
        this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
    }

    getBoundingBox() {
        return new THREE.Box3().setFromCenterAndSize(
            this.mesh.position,
            new THREE.Vector3(this.radius*2, this.radius*2, this.radius*2)
        );
    }
}

export class Player extends Entity {
    constructor(scene, id, colorStr, startPos) {
        super(scene, colorStr);
        this.id = id;
        this.lives = 4;
        
        // 2-slot inventory system
        this.inventory = [null, null]; // [slot1, slot2]
        this.activeSlot = 0; // 0 or 1
        
        this.speedMultiplier = 1;
        this.speedTimer = 0;
        this.invincibilityTimer = 0;

        // Player model (only really visible to other players, or if dead)
        const bodyGeo = new THREE.BoxGeometry(1.2, 1.5, 0.8);
        const mat = new THREE.MeshStandardMaterial({ color: colorStr, roughness: 0.5 });
        const body = new THREE.Mesh(bodyGeo, mat);
        body.position.y = 0.75;
        body.castShadow = true;
        
        const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const head = new THREE.Mesh(headGeo, mat);
        head.position.y = 1.9;
        head.castShadow = true;

        this.mesh.add(body);
        this.mesh.add(head);
        
        this.mesh.position.copy(startPos);
        this.radius = 0.8;

        // --- FPS Camera and Hands Setup ---
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        // Position camera where head is
        this.camera.position.set(0, 1.9, 0); 
        this.mesh.add(this.camera);

        // Hands (visible only to this camera realistically, but we just attach to camera)
        this.handGroup = new THREE.Group();
        this.camera.add(this.handGroup);

        const handGeo = new THREE.BoxGeometry(0.2, 0.2, 0.5);
        const handMat = new THREE.MeshStandardMaterial({ color: colorStr });
        
        this.leftHand = new THREE.Mesh(handGeo, handMat);
        this.leftHand.position.set(-0.4, -0.3, -0.6);
        this.handGroup.add(this.leftHand);

        this.rightHand = new THREE.Mesh(handGeo, handMat);
        this.rightHand.position.set(0.4, -0.3, -0.6);
        this.handGroup.add(this.rightHand);

        // Held item visual
        this.heldItemMesh = new THREE.Group();
        this.rightHand.add(this.heldItemMesh);
        this.heldItemMesh.position.set(0, 0.1, -0.3);
    }

    updateItemVisual() {
        // clear old visual
        while(this.heldItemMesh.children.length > 0) {
            this.heldItemMesh.remove(this.heldItemMesh.children[0]);
        }

        const item = this.inventory[this.activeSlot];
        if (!item) return;

        let color = 0xffffff;
        if (item === 'sword') color = 0x94a3b8;
        if (item === 'medipack') color = 0xef4444;
        if (item === 'speedcola') color = 0x3b82f6;

        let geo;
        if (item === 'sword') {
            geo = new THREE.BoxGeometry(0.1, 0.1, 1.0);
        } else {
            geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        }

        const mesh = new THREE.Mesh(
            geo,
            new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.2 })
        );
        this.heldItemMesh.add(mesh);
    }

    swapSlot() {
        this.activeSlot = this.activeSlot === 0 ? 1 : 0;
        this.updateItemVisual();
    }

    pickupItem(type) {
        // Try to place in active slot first, if empty
        if (!this.inventory[this.activeSlot]) {
            this.inventory[this.activeSlot] = type;
            this.updateItemVisual();
            return true;
        }
        // Try other slot
        const otherSlot = this.activeSlot === 0 ? 1 : 0;
        if (!this.inventory[otherSlot]) {
            this.inventory[otherSlot] = type;
            return true;
        }
        // Inventory full
        return false;
    }

    consumeActiveItem() {
        this.inventory[this.activeSlot] = null;
        this.updateItemVisual();
    }

    update(dt) {
        if (this.isDead) return;
        
        if (this.speedTimer > 0) {
            this.speedTimer -= dt;
            if (this.speedTimer <= 0) this.speedMultiplier = 1;
        }

        if (this.invincibilityTimer > 0) {
            this.invincibilityTimer -= dt;
            this.mesh.children.forEach(c => {
                if (c.material) {
                    c.material.transparent = true;
                    c.material.opacity = (Math.sin(Date.now() * 0.02) * 0.5 + 0.5);
                }
            });
        } else {
            this.mesh.children.forEach(c => {
                if (c.material) {
                    c.material.opacity = 1;
                    c.material.transparent = false;
                }
            });
        }

        // Bobbing effect on hands based on velocity
        if (this.velocity.lengthSq() > 0.1) {
            this.handGroup.position.y = Math.sin(Date.now() * 0.01) * 0.05;
        } else {
            this.handGroup.position.y = 0;
        }

        super.update(dt);
    }

    hit() {
        if (this.invincibilityTimer > 0 || this.isDead) return false;
        this.lives--;
        this.invincibilityTimer = 2.0; 
        
        if (this.lives <= 0) {
            this.die();
        }
        return true;
    }

    die() {
        this.isDead = true;
        this.lives = 0;
        this.mesh.children.forEach(c => {
            if (c.material) {
                c.material.transparent = true;
                c.material.opacity = 0.2;
            }
        });
        this.mesh.position.y = 0.5;
        this.velocity.set(0,0,0);
        // tilt camera down
        this.camera.rotation.x = -Math.PI / 4;
        this.handGroup.visible = false;
    }

    revive() {
        this.isDead = false;
        this.lives = 2;
        this.invincibilityTimer = 3.0;
        this.mesh.position.y = 0;
        this.mesh.children.forEach(c => {
            if (c.material) {
                c.material.transparent = false;
                c.material.opacity = 1;
            }
        });
        this.camera.rotation.x = 0;
        this.handGroup.visible = true;
    }
}

export class Dinosaur extends Entity {
    constructor(scene, levelNum, startPos) {
        const colors = [0x4a5d23, 0xff8c00, 0xb22222]; // Dark olive green for Stego
        const sizes = [1.5, 1.8, 2.5];
        const speeds = [3, 4, 5]; // Slower speeds for levels 1, 2, 3

        super(scene, colors[levelNum - 1]);
        
        this.level = levelNum;
        this.speed = speeds[levelNum - 1];
        this.radius = sizes[levelNum - 1];
        
        this.slowTimer = 0;

        if (levelNum === 1) {
            // Complex Stegosaurus Model
            const stegoGroup = new THREE.Group();
            
            const matTop = new THREE.MeshStandardMaterial({ color: 0x2d3a18 }); // Dark green top
            const matBottom = new THREE.MeshStandardMaterial({ color: 0xc49a6c }); // Tan bottom
            const matPlate = new THREE.MeshStandardMaterial({ color: 0x8b2500 }); // Dark red/orange plates
            
            // Main Body Top
            const bodyTop = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 3.0), matTop);
            bodyTop.position.set(0, 1.4, 0);
            bodyTop.castShadow = true;
            stegoGroup.add(bodyTop);
            
            // Main Body Bottom
            const bodyBot = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 3.0), matBottom);
            bodyBot.position.set(0, 0.7, 0);
            bodyBot.castShadow = true;
            stegoGroup.add(bodyBot);

            // Legs
            const legGeo = new THREE.BoxGeometry(0.5, 0.8, 0.5);
            const poses = [
                [-0.6, 0.4, 1.0], [0.6, 0.4, 1.0], // Front legs
                [-0.6, 0.4, -1.0], [0.6, 0.4, -1.0] // Back legs
            ];
            poses.forEach(pos => {
                const leg = new THREE.Mesh(legGeo, matBottom);
                leg.position.set(pos[0], pos[1], pos[2]);
                leg.castShadow = true;
                stegoGroup.add(leg);
            });

            // Head
            const headGeo = new THREE.BoxGeometry(0.8, 0.8, 1.2);
            const head = new THREE.Mesh(headGeo, matTop);
            head.position.set(0, 1.2, 1.8);
            head.castShadow = true;
            stegoGroup.add(head);
            
            const snoutGeo = new THREE.BoxGeometry(0.6, 0.5, 0.8);
            const snout = new THREE.Mesh(snoutGeo, matBottom);
            snout.position.set(0, 0.9, 2.5);
            snout.castShadow = true;
            stegoGroup.add(snout);

            // Tail
            const tailGeo1 = new THREE.BoxGeometry(1.0, 0.8, 1.5);
            const tail1 = new THREE.Mesh(tailGeo1, matTop);
            tail1.position.set(0, 1.2, -2.0);
            tail1.castShadow = true;
            stegoGroup.add(tail1);

            const tailGeo2 = new THREE.BoxGeometry(0.5, 0.5, 1.5);
            const tail2 = new THREE.Mesh(tailGeo2, matBottom);
            tail2.position.set(0, 0.9, -3.2);
            tail2.castShadow = true;
            stegoGroup.add(tail2);

            // Plates (Double row)
            const plateGeo = new THREE.BoxGeometry(0.1, 1.2, 0.8);
            for (let i = 0; i < 5; i++) {
                const z = 1.0 - (i * 0.8);
                const scale = 1.0 - Math.abs(i - 2) * 0.2; // middle plates are biggest
                
                // Left plate
                const pLeft = new THREE.Mesh(plateGeo, matPlate);
                pLeft.position.set(-0.4, 2.2 + (scale * 0.2), z);
                pLeft.scale.set(1, scale, scale);
                pLeft.rotation.z = 0.2;
                stegoGroup.add(pLeft);

                // Right plate
                const pRight = new THREE.Mesh(plateGeo, matPlate);
                pRight.position.set(0.4, 2.2 + (scale * 0.2), z - 0.3); // offset slightly
                pRight.scale.set(1, scale, scale);
                pRight.rotation.z = -0.2;
                stegoGroup.add(pRight);
            }

            this.mesh.add(stegoGroup);
            // rotate 180 so it faces +Z by default
            stegoGroup.rotation.y = Math.PI;

        } else if (levelNum === 2) {
            // Complex Triceratops Model
            const trikeGroup = new THREE.Group();
            
            const matBody = new THREE.MeshStandardMaterial({ color: 0x5c4033 }); // Dark brown
            const matBelly = new THREE.MeshStandardMaterial({ color: 0x8b7355 }); // Lighter brown
            const matFrill = new THREE.MeshStandardMaterial({ color: 0x800000 }); // Dark red for frill
            const matHorn = new THREE.MeshStandardMaterial({ color: 0xf5f5dc }); // Bone white
            
            // Body Top
            const bodyTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 3.2), matBody);
            bodyTop.position.set(0, 1.6, 0);
            bodyTop.castShadow = true;
            trikeGroup.add(bodyTop);
            
            // Body Bottom (Belly)
            const bodyBot = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 3.2), matBelly);
            bodyBot.position.set(0, 0.8, 0);
            bodyBot.castShadow = true;
            trikeGroup.add(bodyBot);

            // Legs
            const legGeo = new THREE.BoxGeometry(0.6, 1.0, 0.6);
            const poses = [
                [-0.7, 0.5, 1.2], [0.7, 0.5, 1.2], // Front
                [-0.7, 0.5, -1.2], [0.7, 0.5, -1.2] // Back
            ];
            poses.forEach(pos => {
                const leg = new THREE.Mesh(legGeo, matBelly);
                leg.position.set(pos[0], pos[1], pos[2]);
                leg.castShadow = true;
                trikeGroup.add(leg);
            });

            // Tail
            const tail = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.2), matBody);
            tail.position.set(0, 1.3, -2.0);
            tail.castShadow = true;
            trikeGroup.add(tail);

            // Head Group
            const headGroup = new THREE.Group();
            headGroup.position.set(0, 1.5, 1.6);
            
            // Snout/Face
            const snout = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.4), matBody);
            snout.position.set(0, -0.2, 0.7);
            snout.castShadow = true;
            headGroup.add(snout);

            // Frill
            const frill = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.2), matFrill);
            frill.position.set(0, 0.8, -0.2);
            frill.rotation.x = -0.4; // Tilt back
            frill.castShadow = true;
            headGroup.add(frill);

            // Brow Horns
            const hornGeo = new THREE.BoxGeometry(0.2, 0.2, 1.5);
            const hornL = new THREE.Mesh(hornGeo, matHorn);
            hornL.position.set(-0.5, 0.4, 1.2);
            hornL.rotation.x = 0.3; // Point forward/up
            hornL.rotation.y = -0.1; // Splay slightly outwards
            hornL.castShadow = true;
            headGroup.add(hornL);

            const hornR = new THREE.Mesh(hornGeo, matHorn);
            hornR.position.set(0.5, 0.4, 1.2);
            hornR.rotation.x = 0.3;
            hornR.rotation.y = 0.1;
            hornR.castShadow = true;
            headGroup.add(hornR);

            // Nose Horn
            const noseHorn = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.15), matHorn);
            noseHorn.position.set(0, 0.4, 1.2);
            noseHorn.castShadow = true;
            headGroup.add(noseHorn);

            // Tilt the whole head down slightly
            headGroup.rotation.x = 0.2;
            trikeGroup.add(headGroup);

            this.mesh.add(trikeGroup);
            trikeGroup.rotation.y = Math.PI;

        } else {
            // Complex T-Rex Model (Level 3)
            const trexGroup = new THREE.Group();
            
            const matBody = new THREE.MeshStandardMaterial({ color: 0x7a6a58 }); // Taupe/Brown top
            const matBelly = new THREE.MeshStandardMaterial({ color: 0xd2b48c }); // Tan belly
            const matMouth = new THREE.MeshStandardMaterial({ color: 0xa52a2a }); // Dark red mouth
            const matTeeth = new THREE.MeshStandardMaterial({ color: 0xffffff }); // White teeth/claws
            
            // Torso Top
            const torsoTop = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 4.0), matBody);
            torsoTop.position.set(0, 3.0, 0);
            torsoTop.rotation.x = -0.2; // angled up at front
            torsoTop.castShadow = true;
            trexGroup.add(torsoTop);
            
            // Torso Belly
            const torsoBot = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 3.8), matBelly);
            torsoBot.position.set(0, 2.2, 0.2);
            torsoBot.rotation.x = -0.2;
            torsoBot.castShadow = true;
            trexGroup.add(torsoBot);

            // Tail
            const tail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 3.5), matBody);
            tail.position.set(0, 2.6, -3.2);
            tail.rotation.x = 0.1; // angled down slightly
            tail.castShadow = true;
            trexGroup.add(tail);

            // Legs (Thigh + Calf/Foot)
            const thighGeo = new THREE.BoxGeometry(0.8, 2.2, 1.4);
            const calfGeo = new THREE.BoxGeometry(0.8, 1.6, 0.8);
            const toeGeo = new THREE.BoxGeometry(0.2, 0.2, 0.4);

            const legPos = [
                { x: -1.2, y: 1.8, z: -0.5 }, // Left
                { x: 1.2, y: 1.8, z: -0.5 }   // Right
            ];

            legPos.forEach(pos => {
                const thigh = new THREE.Mesh(thighGeo, matBody);
                thigh.position.set(pos.x, pos.y, pos.z);
                thigh.rotation.x = 0.3; // angled forward
                thigh.castShadow = true;
                trexGroup.add(thigh);

                const calf = new THREE.Mesh(calfGeo, matBelly);
                calf.position.set(pos.x, pos.y - 1.2, pos.z + 0.4);
                calf.rotation.x = -0.2; // angled back down
                calf.castShadow = true;
                trexGroup.add(calf);
                
                // Claws
                for(let i=0; i<3; i++) {
                    const claw = new THREE.Mesh(toeGeo, matTeeth);
                    claw.position.set(pos.x - 0.2 + (i*0.2), pos.y - 1.8, pos.z + 0.8);
                    claw.castShadow = true;
                    trexGroup.add(claw);
                }
            });

            // Tiny Arms
            const armGeo = new THREE.BoxGeometry(0.3, 1.0, 0.3);
            const armL = new THREE.Mesh(armGeo, matBelly);
            armL.position.set(-1.1, 2.0, 1.5);
            armL.rotation.x = 0.5; // point forward/down
            armL.castShadow = true;
            trexGroup.add(armL);

            const armR = new THREE.Mesh(armGeo, matBelly);
            armR.position.set(1.1, 2.0, 1.5);
            armR.rotation.x = 0.5;
            armR.castShadow = true;
            trexGroup.add(armR);

            // Head Group
            const headGroup = new THREE.Group();
            headGroup.position.set(0, 3.8, 2.0);
            
            // Back of head
            const headBack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.6), matBody);
            headBack.castShadow = true;
            headGroup.add(headBack);

            // Upper Jaw / Snout
            const topJaw = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 2.2), matBody);
            topJaw.position.set(0, 0.2, 1.8);
            topJaw.castShadow = true;
            headGroup.add(topJaw);

            // Lower Jaw
            const botJaw = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 2.0), matBelly);
            botJaw.position.set(0, -0.6, 1.7);
            botJaw.rotation.x = 0.2; // open mouth slightly
            botJaw.castShadow = true;
            headGroup.add(botJaw);

            // Mouth Interior
            const mouthInside = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 1.8), matMouth);
            mouthInside.position.set(0, -0.3, 1.7);
            mouthInside.rotation.x = 0.1;
            mouthInside.castShadow = true;
            headGroup.add(mouthInside);
            
            // Teeth
            const teethGeo = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 2.1), matTeeth);
            teethGeo.position.set(0, -0.3, 1.8);
            teethGeo.castShadow = true;
            headGroup.add(teethGeo);

            trexGroup.add(headGroup);

            this.mesh.add(trexGroup);
            trexGroup.rotation.y = Math.PI; // face +Z
        }
        
        this.mesh.position.copy(startPos);
    }

    update(dt, targets) {
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
        }

        let currentSpeed = this.speed;
        if (this.slowTimer > 0) currentSpeed *= 0.5;

        let nearest = null;
        let minDist = Infinity;
        for (let p of targets) {
            if (!p.isDead) {
                const d = p.mesh.position.distanceTo(this.mesh.position);
                if (d < minDist) {
                    minDist = d;
                    nearest = p;
                }
            }
        }

        if (nearest) {
            const dir = new THREE.Vector3().subVectors(nearest.mesh.position, this.mesh.position);
            dir.y = 0;
            if (dir.lengthSq() > 0.1) {
                dir.normalize();
                this.velocity.copy(dir).multiplyScalar(currentSpeed);
                this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
            }
        } else {
            this.velocity.set(0,0,0);
        }

        super.update(dt);
    }

    applySlow() {
        this.slowTimer = 4.0;
    }
}

export class Chest {
    constructor(scene, pos) {
        this.scene = scene;
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0x8b4513 }) 
        );
        this.mesh.position.copy(pos);
        this.mesh.position.y = 0.5;
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
        
        this.isOpened = false;
        this.radius = 1;
    }
}

export class Pickup {
    constructor(scene, type, pos) {
        this.scene = scene;
        this.type = type; 
        
        let color = 0xffffff;
        if (type === 'sword') color = 0x94a3b8; 
        if (type === 'medipack') color = 0xef4444; 
        if (type === 'speedcola') color = 0x3b82f6; 

        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.8, 0.8),
            new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.5 })
        );
        this.mesh.position.copy(pos);
        this.mesh.position.y = 1;
        this.scene.add(this.mesh);
        this.radius = 0.8;
        this.active = true;
    }
    
    update(dt) {
        if (this.active) {
            this.mesh.rotation.y += 2 * dt;
            this.mesh.position.y = 1 + Math.sin(Date.now() * 0.005) * 0.2;
        }
    }
    
    destroy() {
        this.active = false;
        this.scene.remove(this.mesh);
    }
}

export class Key {
    constructor(scene, levelNum, pos) {
        this.scene = scene;
        this.level = levelNum;
        
        let color = 0xffffff;
        if (levelNum === 1) color = 0xffffff; 
        if (levelNum === 2) color = 0xff69b4; 
        if (levelNum === 3) color = 0x0000ff; 

        this.mesh = new THREE.Mesh(
            new THREE.TorusGeometry(0.5, 0.2, 8, 16),
            new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.8 })
        );
        this.mesh.position.copy(pos);
        this.mesh.position.y = 1.5;
        this.scene.add(this.mesh);
        this.radius = 1;
        this.active = true;
        this.colorName = levelNum === 1 ? 'White' : (levelNum === 2 ? 'Pink' : 'Blue');
    }

    update(dt) {
        if (this.active) {
            this.mesh.rotation.y += 3 * dt;
        }
    }

    destroy() {
        this.active = false;
        this.scene.remove(this.mesh);
    }
}

export class Door {
    constructor(scene, levelNum, pos) {
        this.scene = scene;
        this.level = levelNum;
        
        let color = 0xffffff;
        if (levelNum === 1) color = 0xffffff; 
        if (levelNum === 2) color = 0xff69b4; 
        if (levelNum === 3) color = 0x0000ff;

        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(4, 5, 1),
            new THREE.MeshStandardMaterial({ color: color, transparent: true, opacity: 0.8 })
        );
        this.mesh.position.copy(pos);
        this.mesh.position.y = 2.5;
        this.scene.add(this.mesh);
        this.radius = 2;
        this.active = true;
    }
}
