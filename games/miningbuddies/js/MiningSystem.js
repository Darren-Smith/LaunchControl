export class MiningSystem {
    constructor(game) {
        this.game = game;
        this.rocks = [];
        this.diamonds = 0;
        this.drills = 0;
        this.hasRobot = false;
        this.overdrive = false;

        this.robotX = 320;
        this.robotY = 350;
        this.robotAngle = 0;
        this.robotMineTimer = 0;
        this.robotLaserTarget = null;
        this.robotLaserTimer = 0;

        this.spawnRocks(32);
    }

    reset() {
        this.rocks = [];
        this.diamonds = 0;
        this.drills = 0;
        this.hasRobot = false;
        this.overdrive = false;
        this.robotMineTimer = 0;
        this.robotLaserTarget = null;
        this.robotLaserTimer = 0;

        const ids = ['upgrade-drill1', 'upgrade-drill2', 'upgrade-robot', 'upgrade-drill3', 'upgrade-overdrive'];
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('unlocked');
                el.classList.add('locked');
            }
        }
        const counter = document.getElementById('diamond-counter');
        if (counter) counter.innerText = '0 / 1000';

        this.spawnRocks(32);
        this.updateGoalText();
    }

    createPolygonVertices(radius, sides = 8) {
        const verts = [];
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const r = radius * (0.82 + Math.random() * 0.28);
            verts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
        }
        return verts;
    }

    spawnRocks(targetCount = 30) {
        let attempts = 0;
        while (this.rocks.length < targetCount && attempts < 220) {
            attempts++;
            // Spread rocks across the main cavern (x: 65..1060, y: 65..635)
            const x = 65 + Math.random() * 990;
            const y = 65 + Math.random() * 570;
            const radius = 21 + Math.random() * 13;

            // Avoid spawning right on top of either miner
            const m1 = this.game.miner;
            const m2 = this.game.fighter;
            if (m1 && Math.hypot(x - m1.x, y - m1.y) < radius + 48) continue;
            if (m2 && Math.hypot(x - m2.x, y - m2.y) < radius + 48) continue;

            // Avoid overlapping existing rocks
            let overlaps = false;
            for (const other of this.rocks) {
                if (Math.hypot(x - other.x, y - other.y) < radius + other.radius + 8) {
                    overlaps = true;
                    break;
                }
            }
            if (overlaps) continue;

            // Determine ore tier: 68% Slate (1💎), 22% Gold Vein (4💎), 10% Crystal Cluster (6💎)
            const roll = Math.random();
            let type = 'slate';
            let maxHealth = 3;
            let yieldAmount = 1;
            if (roll > 0.90) {
                type = 'crystal';
                maxHealth = 4;
                yieldAmount = 6;
            } else if (roll > 0.68) {
                type = 'gold';
                maxHealth = 3;
                yieldAmount = 4;
            }

            this.rocks.push({
                x,
                y,
                radius,
                type,
                health: maxHealth,
                maxHealth,
                yield: yieldAmount,
                hitFlash: 0,
                shakeX: 0,
                shakeY: 0,
                verts: this.createPolygonVertices(radius, 8)
            });
        }
    }

    mineAt(x, y, facingAngle = null) {
        let mineRadius = 56;
        if (this.drills >= 1) mineRadius = 78;
        if (this.drills >= 2) mineRadius = 98;
        if (this.drills >= 3) mineRadius = 116;

        const power = this.drills >= 3 ? 2 : 1;
        let hitAny = false;

        for (let i = this.rocks.length - 1; i >= 0; i--) {
            const rock = this.rocks[i];
            const dist = Math.hypot(rock.x - x, rock.y - y);

            if (dist < mineRadius + rock.radius) {
                hitAny = true;
                rock.health -= power;
                rock.hitFlash = 0.14;
                rock.shakeX = (Math.random() - 0.5) * 6;
                rock.shakeY = (Math.random() - 0.5) * 6;

                // Emit rock chips
                const chipColor = rock.type === 'gold' ? '#fbbf24' : (rock.type === 'crystal' ? '#2dd4bf' : '#94a3b8');
                this.game.spawnParticles(rock.x, rock.y, 6, chipColor);

                if (rock.health <= 0) {
                    const bonus = this.overdrive ? rock.yield + 1 : rock.yield;
                    this.rocks.splice(i, 1);
                    this.addDiamonds(bonus, rock.x, rock.y);
                    this.game.addScore(bonus * 15);
                    if (this.game.sfx) {
                        this.game.sfx.playRockShatter(rock.type !== 'slate');
                    }
                    this.game.spawnParticles(rock.x, rock.y, 14, '#2dd4bf');
                }
            }
        }

        // Replenish ore veins if depleted below 18
        if (this.rocks.length < 18) {
            this.spawnRocks(32);
        }

        return hitAny;
    }

    addDiamonds(amount, srcX = null, srcY = null) {
        if (amount <= 0) return;
        this.diamonds = Math.min(1000, this.diamonds + amount);

        const counter = document.getElementById('diamond-counter');
        if (counter) {
            counter.innerText = `${this.diamonds} / 1000`;
        }

        if (srcX !== null && srcY !== null) {
            const color = amount >= 4 ? '#fbbf24' : '#2dd4bf';
            this.game.spawnFloatingText(srcX, srcY - 12, `+${amount} 💎`, color);
        }

        // Check upgrades
        if (this.diamonds >= 50 && this.drills === 0) {
            this.drills = 1;
            this.unlockChip('upgrade-drill1', '⛏️ DRILL I UNLOCKED — Faster & Wider Mining!');
        }
        if (this.diamonds >= 100 && this.drills === 1) {
            this.drills = 2;
            this.unlockChip('upgrade-drill2', '⚡ DRILL II UNLOCKED — Twin-Head Heavy Drills!');
        }
        if (this.diamonds >= 150 && !this.hasRobot) {
            this.hasRobot = true;
            this.unlockChip('upgrade-robot', '🤖 CLOCKWORK AUTO-BOT DEPLOYED!');
        }
        if (this.diamonds >= 300 && this.drills === 2) {
            this.drills = 3;
            this.unlockChip('upgrade-drill3', '💎 PLASMA DRILL III — Double Strike Power!');
        }
        if (this.diamonds >= 500 && !this.overdrive) {
            this.overdrive = true;
            this.unlockChip('upgrade-overdrive', '🔥 MINECART OVERDRIVE — +1 💎 Per Rock & Speed Boost!');
        }

        // Check boss spawn condition at 200 diamonds
        if (this.diamonds >= 200 && !this.game.bossSpawned) {
            this.game.spawnBoss();
        }

        this.updateGoalText();
        this.game.checkWinCondition();
    }

    unlockChip(elementId, toastMessage) {
        const el = document.getElementById(elementId);
        if (el) {
            el.classList.remove('locked');
            el.classList.add('unlocked');
        }
        if (this.game.sfx) this.game.sfx.playUpgrade();
        this.game.showUpgradeToast(toastMessage);
    }

    updateGoalText() {
        const goalEl = document.getElementById('goal-text');
        if (!goalEl) return;

        if (this.diamonds < 50) {
            goalEl.textContent = `Mine 50 💎 to unlock Drill I (${50 - this.diamonds} 💎 to go)`;
        } else if (this.diamonds < 100) {
            goalEl.textContent = `Mine 100 💎 to unlock Drill II (${100 - this.diamonds} 💎 to go)`;
        } else if (this.diamonds < 150) {
            goalEl.textContent = `Mine 150 💎 to deploy the Clockwork Auto-Bot!`;
        } else if (this.diamonds < 200) {
            goalEl.textContent = `⚠️ 200 💎 awakens the Goblin Stone Colossus! Prepare for battle!`;
        } else if (!this.game.bossDefeated) {
            if (this.diamonds >= 1000) {
                goalEl.textContent = `⚡ 1,000 💎 QUOTA FULL! Smash the Stone Colossus to claim Victory!`;
            } else {
                goalEl.textContent = `👹 DEFEAT THE STONE COLOSSUS & Reach 1,000 💎!`;
            }
        } else {
            goalEl.textContent = `✅ Colossus Defeated! Fill the minecarts to 1,000 💎 (${1000 - this.diamonds} left)!`;
        }
    }

    update(deltaTime) {
        const dt = Math.min(deltaTime / 1000, 0.1);

        // Decay rock hit flash & shake
        for (const rock of this.rocks) {
            if (rock.hitFlash > 0) rock.hitFlash = Math.max(0, rock.hitFlash - dt);
            rock.shakeX *= 0.75;
            rock.shakeY *= 0.75;
        }

        // Clockwork Auto-Bot logic (frame-rate independent!)
        if (this.hasRobot) {
            this.robotAngle += 2.6 * dt;
            const anchor = this.game.miner;
            this.robotX = anchor.x + Math.cos(this.robotAngle) * 64;
            this.robotY = anchor.y + Math.sin(this.robotAngle) * 64;

            if (this.robotLaserTimer > 0) {
                this.robotLaserTimer = Math.max(0, this.robotLaserTimer - dt);
            }

            const pulseInterval = this.overdrive ? 0.24 : 0.34;
            this.robotMineTimer += dt;
            if (this.robotMineTimer >= pulseInterval) {
                this.robotMineTimer -= pulseInterval;
                this.mineAt(this.robotX, this.robotY);

                // Also zap nearby rock monsters within 110px!
                for (let i = this.game.enemies.length - 1; i >= 0; i--) {
                    const e = this.game.enemies[i];
                    if (e && Math.hypot(e.x - this.robotX, e.y - this.robotY) < 110 + e.radius) {
                        this.robotLaserTarget = { x: e.x, y: e.y };
                        this.robotLaserTimer = 0.14;
                        e.takeDamage(14, anchor);
                        break;
                    }
                }
            }
        }
    }

    draw(ctx) {
        // 1. Draw polygonal ore boulders with diamond & gold veins
        for (const rock of this.rocks) {
            ctx.save();
            ctx.translate(rock.x + rock.shakeX, rock.y + rock.shakeY);

            // Drop shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
            ctx.beginPath();
            ctx.ellipse(2, 6, rock.radius * 0.95, rock.radius * 0.78, 0, 0, Math.PI * 2);
            ctx.fill();

            // Base stone polygon
            if (rock.hitFlash > 0) {
                ctx.fillStyle = '#e2e8f0';
            } else if (rock.type === 'gold') {
                ctx.fillStyle = '#574c3d';
            } else if (rock.type === 'crystal') {
                ctx.fillStyle = '#334e58';
            } else {
                ctx.fillStyle = '#475569';
            }
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2.5;

            ctx.beginPath();
            rock.verts.forEach((v, idx) => {
                if (idx === 0) ctx.moveTo(v.x, v.y);
                else ctx.lineTo(v.x, v.y);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Inner top highlight facet
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.beginPath();
            ctx.arc(-rock.radius * 0.2, -rock.radius * 0.2, rock.radius * 0.45, 0, Math.PI * 2);
            ctx.fill();

            // Embedded Ore Veins / Crystals
            const veinColor = rock.type === 'gold' ? '#fbbf24' : (rock.type === 'crystal' ? '#38bdf8' : '#2dd4bf');
            ctx.fillStyle = veinColor;
            // Draw 3 sparkling crystal shards embedded in the rock
            ctx.beginPath();
            ctx.arc(-rock.radius * 0.28, -rock.radius * 0.15, rock.type === 'slate' ? 3.2 : 4.5, 0, Math.PI * 2);
            ctx.arc(rock.radius * 0.25, -rock.radius * 0.22, rock.type === 'slate' ? 2.8 : 4.0, 0, Math.PI * 2);
            ctx.arc(rock.radius * 0.08, rock.radius * 0.28, rock.type === 'slate' ? 3.2 : 4.8, 0, Math.PI * 2);
            ctx.fill();

            // Draw fracture cracks based on damage taken
            if (rock.health < rock.maxHealth) {
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.moveTo(0, -rock.radius * 0.55);
                ctx.lineTo(-rock.radius * 0.35, rock.radius * 0.25);
                ctx.lineTo(rock.radius * 0.3, rock.radius * 0.45);
                if (rock.health <= 1) {
                    ctx.moveTo(-rock.radius * 0.45, -rock.radius * 0.15);
                    ctx.lineTo(rock.radius * 0.45, 0);
                }
                ctx.stroke();
            }

            ctx.restore();
        }

        // 2. Draw Clockwork Mining Auto-Bot Companion
        if (this.hasRobot) {
            ctx.save();

            // Laser beam if zapping a monster
            if (this.robotLaserTimer > 0 && this.robotLaserTarget) {
                ctx.strokeStyle = '#2dd4bf';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(this.robotX, this.robotY);
                ctx.lineTo(this.robotLaserTarget.x, this.robotLaserTarget.y);
                ctx.stroke();
            }

            ctx.translate(this.robotX, this.robotY);
            ctx.rotate(this.robotAngle + Math.PI / 2);

            // Tank treads
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-13, -10, 6, 20);
            ctx.fillRect(7, -10, 6, 20);

            // Brass & teal chassis
            ctx.fillStyle = '#0d9488';
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Spinning front drill nose
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.moveTo(-5, -11);
            ctx.lineTo(0, -21);
            ctx.lineTo(5, -11);
            ctx.closePath();
            ctx.fill();

            // Glowing optical core
            ctx.fillStyle = '#5eead4';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }
}
