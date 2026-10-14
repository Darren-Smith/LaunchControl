export class MiningSystem {
    constructor(game) {
        this.game = game;
        this.rocks = [];
        this.diamonds = 0;
        this.drills = 0;
        this.hasRobot = false;
        
        this.robotX = 100;
        this.robotY = 100;
        this.robotAngle = 0;

        // Populate rocks
        this.spawnRocks();
    }

    spawnRocks() {
        for (let i = 0; i < 30; i++) {
            this.rocks.push({
                x: 50 + Math.random() * 500,
                y: 50 + Math.random() * 600,
                radius: 20 + Math.random() * 15,
                health: 3
            });
        }
    }

    mineAt(x, y) {
        let mineRadius = 50;
        if (this.drills >= 1) mineRadius = 75;
        if (this.drills >= 2) mineRadius = 100;

        for (let i = this.rocks.length - 1; i >= 0; i--) {
            let rock = this.rocks[i];
            let dist = Math.hypot(rock.x - x, rock.y - y);
            
            if (dist < mineRadius + rock.radius) {
                // Rock hit!
                rock.health -= 1;
                
                // Add some particles here if we want
                
                if (rock.health <= 0) {
                    this.rocks.splice(i, 1);
                    this.addDiamonds(1);
                }
            }
        }

        // Replenish rocks if too few
        if (this.rocks.length < 15) {
            this.spawnRocks();
        }
    }

    addDiamonds(amount) {
        this.diamonds += amount;
        if (this.diamonds > 1000) this.diamonds = 1000;
        
        document.getElementById('diamond-counter').innerText = `${this.diamonds} / 1000`;

        // Check upgrades
        if (this.diamonds >= 50 && this.drills === 0) {
            this.drills = 1;
            document.getElementById('upgrade-drill1').classList.replace('locked', 'unlocked');
        }
        if (this.diamonds >= 100 && this.drills === 1) {
            this.drills = 2;
            document.getElementById('upgrade-drill2').classList.replace('locked', 'unlocked');
        }
        if (this.diamonds >= 150 && !this.hasRobot) {
            this.hasRobot = true;
            document.getElementById('upgrade-robot').classList.replace('locked', 'unlocked');
        }

        // Check boss spawn condition
        if (this.diamonds >= 200 && !this.game.bossSpawned) {
            this.game.spawnBoss();
        }
        
        // Check win condition
        this.game.checkWinCondition();
    }

    update(deltaTime) {
        // Robot auto mining
        if (this.hasRobot) {
            this.robotAngle += 0.05;
            this.robotX = this.game.miner.x + Math.cos(this.robotAngle) * 60;
            this.robotY = this.game.miner.y + Math.sin(this.robotAngle) * 60;

            // The robot occasionally auto-mines near itself
            if (Math.random() < 0.05) {
                this.mineAt(this.robotX, this.robotY);
            }
        }
    }

    draw(ctx) {
        // Draw rocks
        ctx.fillStyle = '#64748b'; // stone color
        for (let rock of this.rocks) {
            ctx.beginPath();
            ctx.arc(rock.x, rock.y, rock.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw cracks based on health
            if (rock.health < 3) {
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(rock.x, rock.y - rock.radius/2);
                ctx.lineTo(rock.x - rock.radius/2, rock.y + rock.radius/2);
                if (rock.health < 2) {
                    ctx.lineTo(rock.x + rock.radius/2, rock.y);
                }
                ctx.stroke();
            }
        }

        // Draw dividing line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(600, 0);
        ctx.lineTo(600, this.game.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw robot
        if (this.hasRobot) {
            ctx.fillStyle = '#2dd4bf'; // diamond color
            ctx.shadowColor = '#2dd4bf';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(this.robotX, this.robotY, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}
