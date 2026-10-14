import * as THREE from 'three';

export class Level {
    constructor(scene, levelNum) {
        this.scene = scene;
        this.levelNum = levelNum;
        this.obstacles = [];
        this.size = 60; // 60x60 units
        
        this.buildLevel();
    }

    buildLevel() {
        // Floor
        const floorGeo = new THREE.PlaneGeometry(this.size, this.size);
        const floorMat = new THREE.MeshStandardMaterial({ 
            color: 0x22c55e, // Green grass
            roughness: 0.8
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Walls
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x475569 }); // Slate color
        const wallHeight = 4;
        const wallThickness = 2;

        const createWall = (w, d, x, z) => {
            const geo = new THREE.BoxGeometry(w, wallHeight, d);
            const wall = new THREE.Mesh(geo, wallMat);
            wall.position.set(x, wallHeight / 2, z);
            wall.castShadow = true;
            wall.receiveShadow = true;
            this.scene.add(wall);
            this.obstacles.push(new THREE.Box3().setFromObject(wall));
        };

        // Outer walls
        const halfSize = this.size / 2;
        createWall(this.size, wallThickness, 0, -halfSize); // Top
        createWall(this.size, wallThickness, 0, halfSize);  // Bottom
        createWall(wallThickness, this.size, -halfSize, 0); // Left
        createWall(wallThickness, this.size, halfSize, 0);  // Right

        // Inner obstacles (randomized based on level)
        Math.seedrandom ? Math.seedrandom(this.levelNum) : ''; // basic determinism if we had a seed, but random is fine
        
        const numObstacles = 10 + (this.levelNum * 5);
        for (let i = 0; i < numObstacles; i++) {
            const w = 2 + Math.random() * 6;
            const d = 2 + Math.random() * 6;
            // Keep center somewhat clear for spawning
            let x = 0, z = 0;
            while(Math.abs(x) < 10 && Math.abs(z) < 10) {
                x = (Math.random() - 0.5) * (this.size - 10);
                z = (Math.random() - 0.5) * (this.size - 10);
            }
            createWall(w, d, x, z);
        }
    }

    // Get random position not inside an obstacle
    getRandomSpawnPoint() {
        // simplistic approach: just pick random until clear
        let point = new THREE.Vector3();
        let valid = false;
        let attempts = 0;
        
        while (!valid && attempts < 100) {
            point.x = (Math.random() - 0.5) * (this.size - 10);
            point.z = (Math.random() - 0.5) * (this.size - 10);
            point.y = 1;
            
            const testBox = new THREE.Box3().setFromCenterAndSize(point, new THREE.Vector3(2, 2, 2));
            valid = true;
            for (let obs of this.obstacles) {
                if (testBox.intersectsBox(obs)) {
                    valid = false;
                    break;
                }
            }
            attempts++;
        }
        return point;
    }
}
