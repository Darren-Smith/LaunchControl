import * as THREE from 'three';

// Game State
const gameState = {
    lives: 5,
    revives: 3,
    level: 1,
    score: 0,
    isGameOver: false,
    waveActive: true
};

// UI Elements
const livesEl = document.getElementById('lives-count');
const revivesEl = document.getElementById('revives-count');
const levelEl = document.getElementById('level-count');
const scoreEl = document.getElementById('score-count');
const gameOverScreen = document.getElementById('game-over');
const restartBtn = document.getElementById('restart-btn');

function updateUI() {
    livesEl.textContent = Math.ceil(gameState.lives);
    revivesEl.textContent = gameState.revives;
    levelEl.textContent = gameState.level;
    scoreEl.textContent = gameState.score;
}

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue
scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 200;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// Environment setup
// Ground
const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.8 }); // Green grass
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Central Base
const baseGroup = new THREE.Group();
const baseGeo = new THREE.BoxGeometry(4, 4, 4);
const baseMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63, transparent: true, opacity: 1 }); // Brownish
const baseMesh = new THREE.Mesh(baseGeo, baseMat);
baseMesh.position.y = 2;
baseMesh.castShadow = true;
baseMesh.receiveShadow = true;
baseGroup.add(baseMesh);
scene.add(baseGroup);

// Generate Trees
const obstacles = [];
function createTree(x, z) {
    const tree = new THREE.Group();
    
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 2);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1;
    trunk.castShadow = true;
    tree.add(trunk);

    const leavesGeo = new THREE.ConeGeometry(1.5, 3, 8);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 3;
    leaves.castShadow = true;
    tree.add(leaves);

    tree.position.set(x, 0, z);
    scene.add(tree);
    obstacles.push(tree);
}

// Add trees around
for(let i=0; i<40; i++) {
    let tx = (Math.random() - 0.5) * 80;
    let tz = (Math.random() - 0.5) * 80;
    if (Math.abs(tx) < 10 && Math.abs(tz) < 10) continue; // Keep center clear
    createTree(tx, tz);
}

// Player (Sir Fluffalot)
const player = new THREE.Group();
const bodyGeo = new THREE.BoxGeometry(1, 1, 1);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xFF9800 }); // Orange Fox
const body = new THREE.Mesh(bodyGeo, bodyMat);
body.position.y = 0.5;
body.castShadow = true;
player.add(body);

// Snout
const snoutGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
const snoutMat = new THREE.MeshStandardMaterial({ color: 0xE65100 });
const snout = new THREE.Mesh(snoutGeo, snoutMat);
snout.position.set(0, 0.5, 0.6);
player.add(snout);

// Dagger
const daggerGeo = new THREE.BoxGeometry(0.1, 0.1, 0.8);
const daggerMat = new THREE.MeshStandardMaterial({ color: 0x9E9E9E });
const dagger = new THREE.Mesh(daggerGeo, daggerMat);
dagger.position.set(0.6, 0.5, 0.5);
player.add(dagger);

player.position.set(0, 0, 5);
scene.add(player);

// Ant Companion
const ant = new THREE.Group();
const antMat = new THREE.MeshStandardMaterial({ color: 0x212121 }); // Black ant

// Head
const headGeo = new THREE.SphereGeometry(0.2);
const head = new THREE.Mesh(headGeo, antMat);
head.position.set(0, 0.2, 0.3);
ant.add(head);

// Middle (tiny ball)
const midGeo = new THREE.SphereGeometry(0.12);
const mid = new THREE.Mesh(midGeo, antMat);
mid.position.set(0, 0.2, 0);
ant.add(mid);

// End (middle size ball)
const endGeo = new THREE.SphereGeometry(0.25);
const end = new THREE.Mesh(endGeo, antMat);
end.position.set(0, 0.25, -0.4);
ant.add(end);

ant.position.set(1, 0, 4);
scene.add(ant);

// Entities
let enemies = [];
let slashes = []; // Visual slash effects

// Controls
const keys = { w: false, a: false, s: false, d: false, space: false };
let isAttacking = false;
let attackTimer = 0;

window.addEventListener('keydown', (e) => {
    if(e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = true;
    if(e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = true;
    if(e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = true;
    if(e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = true;
    if(e.code === 'Space' && !isAttacking) {
        keys.space = true;
        isAttacking = true;
        attackTimer = 0.2; // Attack duration
        performAttack();
    }
});

window.addEventListener('keyup', (e) => {
    if(e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = false;
    if(e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = false;
    if(e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = false;
    if(e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = false;
});

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

restartBtn.addEventListener('click', resetGame);

// Spawn Enemies (Wolves)
function spawnEnemy() {
    if (!gameState.waveActive || gameState.isGameOver) return;
    
    const maxEnemies = 7 + gameState.level;
    if (enemies.length >= maxEnemies) return;

    const angle = Math.random() * Math.PI * 2;
    const radius = 40;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const wolf = new THREE.Group();
    const wolfGeo = new THREE.BoxGeometry(1.2, 1, 1.5);
    const wolfMat = new THREE.MeshStandardMaterial({ color: 0x607D8B }); // Grey wolf
    const wolfMesh = new THREE.Mesh(wolfGeo, wolfMat);
    wolfMesh.position.y = 0.5;
    wolfMesh.castShadow = true;
    wolf.add(wolfMesh);
    
    // Snout for wolf
    const wolfSnoutGeo = new THREE.BoxGeometry(0.6, 0.5, 0.6);
    const wolfSnout = new THREE.Mesh(wolfSnoutGeo, wolfMat);
    wolfSnout.position.set(0, 0.5, 0.9);
    wolf.add(wolfSnout);

    wolf.position.set(x, 0, z);
    
    // Add simple health
    wolf.userData = { hp: 2 };
    
    scene.add(wolf);
    enemies.push(wolf);
}

// Let's spawn enemies periodically
setInterval(spawnEnemy, 2000);

function performAttack() {
    // Slash visual
    dagger.rotation.x = -Math.PI/2;
    
    // Check hit
    const attackRange = 2;
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const dist = player.position.distanceTo(enemy.position);
        
        // Very basic forward cone check could be added, but just distance for MVP
        if (dist < attackRange) {
            enemy.userData.hp -= 1;
            if (enemy.userData.hp <= 0) {
                scene.remove(enemy);
                enemies.splice(i, 1);
                gameState.score += 10;
                updateUI();
                checkLevelProgression();
            } else {
                // Knockback
                const dir = enemy.position.clone().sub(player.position).normalize();
                enemy.position.add(dir.multiplyScalar(1));
            }
        }
    }
}

let lastDamageTime = 0;

function takeDamage(amount = 1) {
    const currentTime = clock.getElapsedTime();
    if (currentTime - lastDamageTime < 1.0) return; // 1 second invulnerability
    lastDamageTime = currentTime;

    gameState.lives -= amount;
    if (gameState.lives <= 0) {
        if (gameState.revives > 0) {
            gameState.revives--;
            gameState.lives = 5;
        } else {
            gameState.isGameOver = true;
            gameOverScreen.classList.remove('hidden');
        }
    }
    updateUI();
}

function checkLevelProgression() {
    // Arbitrary progression: every 50 score = 1 level
    const expectedLevel = Math.floor(gameState.score / 50) + 1;
    if (expectedLevel > gameState.level) {
        gameState.level = expectedLevel;
        updateUI();
    }
}

function resetGame() {
    gameState.lives = 5;
    gameState.revives = 3;
    gameState.level = 1;
    gameState.score = 0;
    gameState.isGameOver = false;
    updateUI();
    
    gameOverScreen.classList.add('hidden');
    player.position.set(0, 0, 5);
    
    // Clear enemies
    enemies.forEach(e => scene.remove(e));
    enemies = [];
}

const clock = new THREE.Clock();

function wrapEntityBounds(entity) {
    const bound = 90; // Map size is 200 (-100 to 100), wrapping at 90 keeps it seamless
    if (entity.position.x > bound) entity.position.x -= bound * 2;
    if (entity.position.x < -bound) entity.position.x += bound * 2;
    if (entity.position.z > bound) entity.position.z -= bound * 2;
    if (entity.position.z < -bound) entity.position.z += bound * 2;
}

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();

    if (!gameState.isGameOver) {
        // Player Movement
        const speed = 10 * delta;
        let moveX = 0;
        let moveZ = 0;
        
        if (keys.w) moveZ -= 1;
        if (keys.s) moveZ += 1;
        if (keys.a) moveX -= 1;
        if (keys.d) moveX += 1;
        
        if (moveX !== 0 || moveZ !== 0) {
            const moveDir = new THREE.Vector3(moveX, 0, moveZ).normalize();
            player.position.add(moveDir.multiplyScalar(speed));
            
            // Rotate player
            const targetRotation = Math.atan2(moveX, moveZ);
            player.rotation.y = targetRotation;
        }
        
        wrapEntityBounds(player);
        
        // Attack Animation Reset
        if (isAttacking) {
            attackTimer -= delta;
            if (attackTimer <= 0) {
                isAttacking = false;
                dagger.rotation.x = 0;
            }
        }

        // Camera Follow (Third Person)
        const cameraOffset = new THREE.Vector3(0, 8, 12);
        camera.position.copy(player.position).add(cameraOffset);
        camera.lookAt(player.position);

        // Check if hut is between camera and player
        const raycaster = new THREE.Raycaster();
        const dirToPlayer = new THREE.Vector3().subVectors(player.position, camera.position).normalize();
        raycaster.set(camera.position, dirToPlayer);
        const intersects = raycaster.intersectObject(baseMesh);
        if (intersects.length > 0 && intersects[0].distance < camera.position.distanceTo(player.position)) {
            baseMat.opacity = 0.1;
        } else {
            baseMat.opacity = 1.0;
        }

        // Ant AI (Follow player, attack nearby)
        const antDist = ant.position.distanceTo(player.position);
        if (antDist > 2) {
            const antDir = player.position.clone().sub(ant.position).normalize();
            ant.position.add(antDir.multiplyScalar(speed * 0.8));
        }
        
        // Ant Attack Logic (Attacks closest enemy)
        let closestEnemy = null;
        let closestDist = 5; // Ant attack range
        for (let enemy of enemies) {
            const dist = ant.position.distanceTo(enemy.position);
            if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = enemy;
            }
        }
        
        if (closestEnemy) {
            // Move ant towards enemy slightly
            const antDir = closestEnemy.position.clone().sub(ant.position).normalize();
            ant.position.add(antDir.multiplyScalar(speed));
            
            // Random chance to damage
            if (Math.random() < 0.05) {
                closestEnemy.userData.hp -= 0.5; // Ant does smaller damage
                if (closestEnemy.userData.hp <= 0) {
                    scene.remove(closestEnemy);
                    enemies = enemies.filter(e => e !== closestEnemy);
                    gameState.score += 5; // Less score for ant kills
                    updateUI();
                    checkLevelProgression();
                }
            }
        }
        
        wrapEntityBounds(ant);

        // Enemy AI (Move to base or player)
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            
            const distToPlayer = enemy.position.distanceTo(player.position);
            
            let target;
            if (distToPlayer < 8) {
                target = player.position; // Aggro player when close
            } else {
                if (enemy.userData.wanderTimer === undefined || enemy.userData.wanderTimer <= 0) {
                    enemy.userData.wanderTarget = new THREE.Vector3(
                        enemy.position.x + (Math.random() - 0.5) * 20,
                        0,
                        enemy.position.z + (Math.random() - 0.5) * 20
                    );
                    enemy.userData.wanderTimer = 2 + Math.random() * 3;
                }
                enemy.userData.wanderTimer -= delta;
                target = enemy.userData.wanderTarget;
            }
            
            const enemySpeed = (2 + gameState.level * 0.3) * delta; // Slower speed
            const dir = target.clone().sub(enemy.position).normalize();
            
            // Only move if not too close to wander target
            if (distToPlayer < 8 || enemy.position.distanceTo(target) > 1) {
                enemy.position.add(dir.multiplyScalar(enemySpeed));
                enemy.rotation.y = Math.atan2(dir.x, dir.z);
            }
            
            // Collision with player
            if (distToPlayer < 1.5) {
                // Damage player and bounce back
                takeDamage(0.5); // Less damage
                enemy.position.sub(dir.multiplyScalar(3)); // knockback enemy so they don't spam damage
            }
            
            wrapEntityBounds(enemy);
        }
    }

    renderer.render(scene, camera);
}

// Start game
updateUI();
animate();
