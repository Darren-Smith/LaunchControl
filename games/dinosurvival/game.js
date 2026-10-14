import * as THREE from 'three';
import { Level } from './level.js';
import { Player, Dinosaur, Chest, Pickup, Key, Door } from './entities.js';

export class Game {
    constructor(container, onGameOver, onVictory, onLevelChange, updateHUD) {
        this.container = container;
        this.onGameOver = onGameOver;
        this.onVictory = onVictory;
        this.onLevelChange = onLevelChange;
        this.updateHUD = updateHUD;

        this.scene = new THREE.Scene();
        // Light sky blue to give some contrast to the walls
        this.scene.background = new THREE.Color(0x87ceeb); 

        // We use renderer with scissor test for split screen
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setScissorTest(true);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
        this.scene.add(dirLight);

        this.players = [];
        this.dinos = [];
        this.chests = [];
        this.pickups = [];
        this.levelObj = null;
        this.key = null;
        this.door = null;

        this.currentLevel = 1;
        this.hasKey = false;
        
        this.timeRemaining = 300; 
        this.lastTime = 0;
        this.isRunning = false;

        this.keysPressed = {};
        
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    start(numPlayers) {
        this.currentLevel = 1;
        this.players = [];
        this.setupLevel(this.currentLevel, numPlayers);
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animate();
    }

    setupLevel(levelNum, numPlayers = this.players.length) {
        // Remove old entities from scene but keep players if they exist
        while(this.scene.children.length > 0){ 
            this.scene.remove(this.scene.children[0]); 
        }
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        this.scene.add(dirLight);

        this.levelObj = new Level(this.scene, levelNum);
        this.hasKey = false;
        this.chests = [];
        this.pickups = [];
        this.dinos = [];

        const colors = [0x3b82f6, 0xa855f7, 0xffffff];
        
        if (this.players.length === 0) {
            for (let i = 0; i < numPlayers; i++) {
                const p = new Player(this.scene, i+1, colors[i], this.levelObj.getRandomSpawnPoint());
                this.players.push(p);
            }
        } else {
            for (let i = 0; i < this.players.length; i++) {
                const p = this.players[i];
                p.mesh.position.copy(this.levelObj.getRandomSpawnPoint());
                p.mesh.rotation.y = 0;
                this.scene.add(p.mesh);
            }
        }

        const dino = new Dinosaur(this.scene, levelNum, this.levelObj.getRandomSpawnPoint());
        this.dinos.push(dino);

        for (let i = 0; i < 5; i++) {
            this.chests.push(new Chest(this.scene, this.levelObj.getRandomSpawnPoint()));
        }

        this.key = new Key(this.scene, levelNum, this.levelObj.getRandomSpawnPoint());
        const doorPos = new THREE.Vector3(0, 0, -this.levelObj.size/2 + 2);
        this.door = new Door(this.scene, levelNum, doorPos);

        this.timeRemaining = 300;
        this.onLevelChange(levelNum);
    }

    handleInput(keyCode, isDown) {
        this.keysPressed[keyCode] = isDown;
    }

    updatePlayers(dt) {
        for (let p of this.players) {
            if (p.isDead) continue;
            
            const moveSpeed = 15 * p.speedMultiplier;
            const turnSpeed = 2.5; // radians per sec

            let moveAmount = 0;
            let turnAmount = 0;
            let actionPressed = false;
            let swapPressed = false;

            if (p.id === 1) {
                if (this.keysPressed['ArrowUp']) moveAmount = -1;
                if (this.keysPressed['ArrowDown']) moveAmount = 1;
                if (this.keysPressed['ArrowLeft']) turnAmount = 1;
                if (this.keysPressed['ArrowRight']) turnAmount = -1;
                actionPressed = this.keysPressed['Space'];
                swapPressed = this.keysPressed['ShiftRight'] || this.keysPressed['ShiftLeft'];
            } else if (p.id === 2) {
                if (this.keysPressed['KeyW']) moveAmount = -1;
                if (this.keysPressed['KeyS']) moveAmount = 1;
                if (this.keysPressed['KeyA']) turnAmount = 1;
                if (this.keysPressed['KeyD']) turnAmount = -1;
                actionPressed = this.keysPressed['KeyZ'];
                swapPressed = this.keysPressed['KeyX'];
            } else if (p.id === 3) {
                if (this.keysPressed['Numpad8']) moveAmount = -1;
                if (this.keysPressed['Numpad2']) moveAmount = 1;
                if (this.keysPressed['Numpad4']) turnAmount = 1;
                if (this.keysPressed['Numpad6']) turnAmount = -1;
                actionPressed = this.keysPressed['Numpad0'];
                swapPressed = this.keysPressed['NumpadDecimal'];
            }

            // Tank Controls: Rotate player
            p.mesh.rotation.y += turnAmount * turnSpeed * dt;

            // Move forward/back based on rotation
            const dir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), p.mesh.rotation.y);
            p.velocity.copy(dir).multiplyScalar(moveAmount * moveSpeed);

            if (swapPressed && !p.lastSwapPressed) {
                p.swapSlot();
            }
            p.lastSwapPressed = swapPressed;

            if (actionPressed && !p.lastActionPressed) {
                this.performAction(p);
            }
            p.lastActionPressed = actionPressed;
            
            p.update(dt);
            
            // Collision with obstacles
            const pBox = p.getBoundingBox();
            for (let obs of this.levelObj.obstacles) {
                if (pBox.intersectsBox(obs)) {
                    p.mesh.position.sub(p.velocity.clone().multiplyScalar(dt));
                }
            }
        }
    }

    performAction(player) {
        // 1. Open chests
        for (let chest of this.chests) {
            if (!chest.isOpened && player.mesh.position.distanceTo(chest.mesh.position) < 3) {
                chest.isOpened = true;
                chest.mesh.material.color.setHex(0x555555);
                const types = ['sword', 'medipack', 'speedcola'];
                const type = types[Math.floor(Math.random() * types.length)];
                this.pickups.push(new Pickup(this.scene, type, chest.mesh.position.clone()));
                return;
            }
        }

        const activeItem = player.inventory[player.activeSlot];

        // 2. Revive teammate
        if (activeItem === 'medipack') {
            for (let other of this.players) {
                if (other.isDead && player.mesh.position.distanceTo(other.mesh.position) < 3) {
                    other.revive();
                    player.consumeActiveItem();
                    return;
                }
            }
        }

        // 3. Use Sword/Slime to slow dino
        if (activeItem === 'sword') {
            for (let dino of this.dinos) {
                if (player.mesh.position.distanceTo(dino.mesh.position) < 8) {
                    dino.applySlow();
                    // Swing animation for sword
                    player.heldItemMesh.rotation.x = -Math.PI / 2;
                    setTimeout(() => { if (player && player.heldItemMesh) player.heldItemMesh.rotation.x = 0; }, 300);
                    // maybe sword breaks or is permanent? The prompt says "if you find a sword or slime it slows". 
                    // Let's make it single use so inventory cycles.
                    player.consumeActiveItem();
                    return;
                }
            }
        }
    }

    update(dt) {
        if (!this.isRunning) return;

        this.timeRemaining -= dt;
        if (this.timeRemaining <= 0) {
            this.isRunning = false;
            this.onGameOver();
            return;
        }

        this.updatePlayers(dt);

        for (let dino of this.dinos) {
            dino.update(dt, this.players);
            
            const dBox = dino.getBoundingBox();
            for (let p of this.players) {
                if (!p.isDead && dBox.intersectsBox(p.getBoundingBox())) {
                    p.hit();
                }
            }
        }

        // Pickups collision
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            let p = this.pickups[i];
            p.update(dt);
            for (let player of this.players) {
                if (!player.isDead && player.mesh.position.distanceTo(p.mesh.position) < 2) {
                    if (p.type === 'speedcola') {
                        player.speedMultiplier = 1.5;
                        player.speedTimer = 10;
                        p.destroy();
                        this.pickups.splice(i, 1);
                        break;
                    } else {
                        const pickedUp = player.pickupItem(p.type);
                        if (pickedUp) {
                            p.destroy();
                            this.pickups.splice(i, 1);
                            break;
                        }
                    }
                }
            }
        }

        // Key collision
        if (this.key && this.key.active) {
            this.key.update(dt);
            for (let player of this.players) {
                if (!player.isDead && player.mesh.position.distanceTo(this.key.mesh.position) < 2) {
                    this.hasKey = true;
                    this.key.destroy();
                    this.door.mesh.material.color.setHex(0x00ff00);
                    break;
                }
            }
        }

        // Exit
        if (this.hasKey && this.door && this.door.active) {
            for (let player of this.players) {
                if (!player.isDead && player.mesh.position.distanceTo(this.door.mesh.position) < 3) {
                    if (this.currentLevel === 3) {
                        this.isRunning = false;
                        this.onVictory();
                    } else {
                        this.currentLevel++;
                        this.setupLevel(this.currentLevel);
                    }
                    break;
                }
            }
        }

        if (this.players.length > 0 && this.players.every(p => p.isDead)) {
            this.isRunning = false;
            this.onGameOver();
        }

        this.updateHUD(this);
    }

    renderSplitScreen() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const pCount = this.players.length;

        // Reset
        this.renderer.setScissorTest(false);
        this.renderer.clear();
        this.renderer.setScissorTest(true);

        const renderPlayer = (player, x, y, width, height) => {
            this.renderer.setViewport(x, y, width, height);
            this.renderer.setScissor(x, y, width, height);
            player.camera.aspect = width / height;
            player.camera.updateProjectionMatrix();

            // Hide the player's own mesh parts except hands
            player.mesh.children.forEach(c => {
                if (c !== player.camera) c.visible = false;
            });

            this.renderer.render(this.scene, player.camera);

            // Restore visibility for other players' cameras
            player.mesh.children.forEach(c => {
                if (c !== player.camera) c.visible = true;
            });
        };

        if (pCount === 1) {
            renderPlayer(this.players[0], 0, 0, w, h);
        } else if (pCount === 2) {
            // Split vertical (left/right)
            const halfW = w / 2;
            renderPlayer(this.players[0], 0, 0, halfW, h);
            renderPlayer(this.players[1], halfW, 0, halfW, h);
        } else if (pCount === 3) {
            // 2x2 grid. P1: Top-Left, P2: Top-Right, P3: Bottom-Left.
            // Bottom-Right is left blank or map (we just leave it background color).
            const halfW = w / 2;
            const halfH = h / 2;
            
            // WebGL coordinates start bottom-left.
            // Bottom-Left (P3)
            renderPlayer(this.players[2], 0, 0, halfW, halfH);
            // Top-Left (P1)
            renderPlayer(this.players[0], 0, halfH, halfW, halfH);
            // Top-Right (P2)
            renderPlayer(this.players[1], halfW, halfH, halfW, halfH);
            
            // Clear bottom-right for UI
            this.renderer.setViewport(halfW, 0, halfW, halfH);
            this.renderer.setScissor(halfW, 0, halfW, halfH);
            this.renderer.setClearColor(0x0f172a, 1.0); // UI dark background
            this.renderer.clearColor();
            this.renderer.setClearColor(0x87ceeb, 1.0); // Reset
        }
    }

    animate() {
        if (!this.isRunning) return;
        requestAnimationFrame(this.animate.bind(this));

        const now = performance.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.update(dt);
        this.renderSplitScreen();
    }

    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
