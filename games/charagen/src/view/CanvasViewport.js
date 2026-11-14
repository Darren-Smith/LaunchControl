class CanvasViewport {
    constructor(canvas, jointEngine, accessoryManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.jointEngine = jointEngine;
        this.accessoryManager = accessoryManager;
        
        this.fpsElement = document.getElementById('fps-counter');
        
        // Viewport transform
        this.offsetX = this.canvas.width / 2;
        this.offsetY = this.canvas.height * 0.8;
        this.zoom = 1.0;
        
        // State
        this.lastTime = 0;
        this.selectedJointId = null;
        this.selectedConnectionId = null;
        this.showGrid = true;
        this.showFloorLine = true;
        this.showRuler = true;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Basic interactivity
        this.isPanning = false;
        this.dragStart = { x: 0, y: 0 };
        this.activeDragJoint = null;
        this.activeConnectStart = null;
        this.tempConnectEnd = null; // world pos
        
        this.currentTool = 'move'; // 'move', 'add_joint', 'connect'
        
        // Callbacks for UIManager
        this.onSelectionChange = null;
        this.onJointChanged = null;
        
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
    }

    resize() {
        if (!this.canvas.parentElement) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            this.offsetX = this.canvas.width / 2;
            this.offsetY = this.canvas.height * 0.8;
        }
    }
    
    distToSegment(p, v, w) {
        let l2 = (w.x - v.x) * (w.x - v.x) + (w.y - v.y) * (w.y - v.y);
        if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
    }
    
    screenToWorld(sx, sy) {
        return {
            x: (sx - this.offsetX) / this.zoom,
            y: (sy - this.offsetY) / this.zoom
        };
    }

    worldToScreen(wx, wy) {
        return {
            x: wx * this.zoom + this.offsetX,
            y: wy * this.zoom + this.offsetY
        };
    }

    hitTestJoint(worldPt) {
        const joints = this.jointEngine.getAllJoints();
        const hitRadius = 15 / this.zoom;
        for (let i = joints.length - 1; i >= 0; i--) {
            const j = joints[i];
            if (Math.hypot(worldPt.x - j.x, worldPt.y - j.y) < hitRadius) {
                return j;
            }
        }
        return null;
    }

    hitTestConnection(worldPt) {
        const conns = this.jointEngine.getAllConnections();
        const hitRadius = 10 / this.zoom;
        for (let i = conns.length - 1; i >= 0; i--) {
            const c = conns[i];
            const jA = this.jointEngine.getJoint(c.jointA);
            const jB = this.jointEngine.getJoint(c.jointB);
            if (jA && jB) {
                const dist = this.distToSegment(worldPt, jA, jB);
                if (dist < hitRadius) return c;
            }
        }
        return null;
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const worldPt = this.screenToWorld(screenX, screenY);

        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            // Middle click or Alt+Click -> Pan
            this.isPanning = true;
            this.dragStart = { x: e.clientX, y: e.clientY };
            return;
        }

        if (this.currentTool === 'add_joint') {
            if (this.onActionStart) this.onActionStart();
            const id = `joint_${Date.now()}`;
            this.jointEngine.addJoint(id, worldPt.x, worldPt.y, `Joint ${this.jointEngine.joints.size + 1}`);
            this.selectedJointId = id;
            this.selectedConnectionId = null;
            if (this.onSelectionChange) this.onSelectionChange(id, 'joint');
            return;
        }

        const clickedJoint = this.hitTestJoint(worldPt);
        
        if (this.currentTool === 'connect') {
            if (clickedJoint) {
                this.activeConnectStart = clickedJoint;
                this.tempConnectEnd = worldPt;
            } else {
                this.selectedJointId = null;
                this.selectedConnectionId = null;
                if (this.onSelectionChange) this.onSelectionChange(null);
            }
        } else if (this.currentTool === 'move') {
            if (clickedJoint) {
                if (this.onActionStart) this.onActionStart();
                this.activeDragJoint = clickedJoint;
                this.dragOffset = { x: worldPt.x - clickedJoint.x, y: worldPt.y - clickedJoint.y };
                this.selectedJointId = clickedJoint.id;
                this.selectedConnectionId = null;
                if (this.onSelectionChange) this.onSelectionChange(clickedJoint.id, 'joint');
            } else {
                const clickedConn = this.hitTestConnection(worldPt);
                if (clickedConn) {
                    this.selectedJointId = null;
                    this.selectedConnectionId = clickedConn.id;
                    if (this.onSelectionChange) this.onSelectionChange(clickedConn.id, 'connection');
                } else {
                    this.selectedJointId = null;
                    this.selectedConnectionId = null;
                    if (this.onSelectionChange) this.onSelectionChange(null);
                    
                    // Allow panning if dragging empty space
                    this.isPanning = true;
                    this.dragStart = { x: e.clientX, y: e.clientY };
                }
            }
        }
    }

    onMouseMove(e) {
        if (this.isPanning) {
            const dx = e.clientX - this.dragStart.x;
            const dy = e.clientY - this.dragStart.y;
            this.offsetX += dx;
            this.offsetY += dy;
            this.dragStart = { x: e.clientX, y: e.clientY };
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        let worldPt = this.screenToWorld(screenX, screenY);

        if (this.activeDragJoint) {
            const newX = worldPt.x - this.dragOffset.x;
            const newY = worldPt.y - this.dragOffset.y;
            this.jointEngine.setJointWorldPosition(this.activeDragJoint.id, newX, newY, this.lockBoneLengths);
            if (this.onJointChanged) this.onJointChanged(this.activeDragJoint);
        }

        if (this.activeConnectStart) {
            this.tempConnectEnd = worldPt;
        }
    }

    onMouseUp(e) {
        this.isPanning = false;
        this.activeDragJoint = null;
        
        if (this.activeConnectStart) {
            const rect = this.canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const worldPt = this.screenToWorld(screenX, screenY);
            
            const targetJoint = this.hitTestJoint(worldPt);
            if (targetJoint && targetJoint.id !== this.activeConnectStart.id) {
                if (this.onActionStart) this.onActionStart();
                const id = `conn_${Date.now()}`;
                this.jointEngine.addConnection(id, this.activeConnectStart.id, targetJoint.id, `Conn ${this.jointEngine.connections.size + 1}`);
            }
            this.activeConnectStart = null;
            this.tempConnectEnd = null;
        }
    }

    onWheel(e) {
        e.preventDefault();
        const zoomSpeed = 0.1;
        const dir = Math.sign(e.deltaY);
        this.zoom = Math.max(0.1, Math.min(5.0, this.zoom - dir * zoomSpeed));
    }

    startRenderLoop() {
        const loop = (time) => {
            const dt = time - this.lastTime;
            this.lastTime = time;
            
            if (this.fpsElement) {
                const fps = Math.round(1000 / dt);
                this.fpsElement.innerText = `${fps} FPS`;
            }
            
            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        
        // Draw grid
        if (this.showGrid) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            this.ctx.lineWidth = 1;
            const gridSize = 50 * this.zoom;
            const oX = this.offsetX % gridSize;
            const oY = this.offsetY % gridSize;

            this.ctx.beginPath();
            for (let x = oX; x < this.canvas.width; x += gridSize) {
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.canvas.height);
            }
            for (let y = oY; y < this.canvas.height; y += gridSize) {
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);
            }
            this.ctx.stroke();
        }
        
        // Transform for world
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.zoom, this.zoom);

        // Draw floor line
        if (this.showFloorLine) {
            this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)'; // UI accent blue
            this.ctx.lineWidth = 2 / this.zoom; // Keep 2px thick regardless of zoom
            this.ctx.beginPath();
            this.ctx.moveTo(-10000, 0);
            this.ctx.lineTo(10000, 0);
            this.ctx.stroke();
        }

        const isPreview = this.uiManager && this.uiManager.currentModule === 'preview';
        let showSkeleton = true;
        if (isPreview) {
            showSkeleton = false;
        } else if (this.uiManager) {
            showSkeleton = !this.jointEngine.skinState.active || this.uiManager.currentModule === 'skeleton-builder';
        } else {
            showSkeleton = !this.jointEngine.skinState.active;
        }

        // 0. Draw Skin (Flesh polygons)
        if (this.jointEngine.skinState.active) {
            this.ctx.fillStyle = this.jointEngine.skinState.materialColor;
            
            // First pass: connections (fleshy limbs)
            const conns = this.jointEngine.getAllConnections();
            for (const c of conns) {
                const jA = this.jointEngine.getJoint(c.jointA);
                const jB = this.jointEngine.getJoint(c.jointB);
                if (jA && jB) {
                    const rA = jA.radius || 10;
                    const rB = jB.radius || 10;
                    const dx = jB.x - jA.x;
                    const dy = jB.y - jA.y;
                    const dist = Math.hypot(dx, dy);
                    
                    if (dist > 0) {
                        const angle = Math.atan2(dy, dx);
                        const angleOffsetA = Math.acos(Math.max(-1, Math.min(1, (rA - rB) / dist)));
                        
                        const p1x = jA.x + rA * Math.cos(angle + angleOffsetA);
                        const p1y = jA.y + rA * Math.sin(angle + angleOffsetA);
                        const p2x = jB.x + rB * Math.cos(angle + angleOffsetA);
                        const p2y = jB.y + rB * Math.sin(angle + angleOffsetA);
                        const p3x = jB.x + rB * Math.cos(angle - angleOffsetA);
                        const p3y = jB.y + rB * Math.sin(angle - angleOffsetA);
                        const p4x = jA.x + rA * Math.cos(angle - angleOffsetA);
                        const p4y = jA.y + rA * Math.sin(angle - angleOffsetA);
                        
                        this.ctx.beginPath();
                        this.ctx.moveTo(p1x, p1y);
                        this.ctx.lineTo(p2x, p2y);
                        this.ctx.lineTo(p3x, p3y);
                        this.ctx.lineTo(p4x, p4y);
                        this.ctx.closePath();
                        this.ctx.fill();
                    }
                }
            }
            
            // Second pass: joints (fleshy joints to smooth out elbows/knees)
            const joints = this.jointEngine.getAllJoints();
            for (const j of joints) {
                const r = j.radius || 10;
                this.ctx.beginPath();
                this.ctx.arc(j.x, j.y, r, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // 1. Draw Connections
        const conns = this.jointEngine.getAllConnections();
        for (const c of conns) {
            const jA = this.jointEngine.getJoint(c.jointA);
            const jB = this.jointEngine.getJoint(c.jointB);
            if (jA && jB) {
                if (showSkeleton) {
                    const isSelected = this.selectedConnectionId === c.id;
                    this.ctx.strokeStyle = isSelected ? '#3b82f6' : '#22c55e';
                    this.ctx.lineWidth = isSelected ? 4 : 2;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(jA.x, jA.y);
                    this.ctx.lineTo(jB.x, jB.y);
                    this.ctx.stroke();
                }

                if (!isPreview) {
                    // Draw Anchors on the connection
                    const anchors = c.getAnchors(this.jointEngine);
                    for (const a of anchors) {
                        this.ctx.fillStyle = '#f59e0b'; // Amber for anchors
                        this.ctx.beginPath();
                        this.ctx.arc(a.x, a.y, 3, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }
            }
        }

        // 1.5 Draw Accessories
        for (const a of this.accessoryManager.anchors) {
            const equip = this.accessoryManager.getEquipmentBySlot(a.slotType);
            if (equip && equip.image) {
                const conn = this.jointEngine.getConnection(a.connectionId);
                if (conn) {
                    const jA = this.jointEngine.getJoint(conn.jointA);
                    const jB = this.jointEngine.getJoint(conn.jointB);
                    const transform = this.accessoryManager.calculateAccessoryTransform(a, jA, jB);
                    
                    if (transform) {
                        this.ctx.save();
                        this.ctx.translate(transform.x, transform.y);
                        this.ctx.rotate(transform.rotation);
                        this.ctx.scale(transform.scaleX, transform.scaleY);
                        // Draw image relative to its pivot point
                        const img = equip.image;
                        const dx = -img.width * (equip.pivotX !== undefined ? equip.pivotX : 0.5);
                        const dy = -img.height * (equip.pivotY !== undefined ? equip.pivotY : 0.5);
                        this.ctx.drawImage(img, dx, dy);
                        this.ctx.restore();
                    }
                }
            }
        }

        // 2. Draw Temp Connect Line
        if (this.activeConnectStart && this.tempConnectEnd) {
            this.ctx.strokeStyle = '#22c55e'; // Green
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.activeConnectStart.x, this.activeConnectStart.y);
            this.ctx.lineTo(this.tempConnectEnd.x, this.tempConnectEnd.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // 3. Draw Joints
        if (showSkeleton) {
            const joints = this.jointEngine.getAllJoints();
            for (const j of joints) {
                const isSelected = this.selectedJointId === j.id;
                this.ctx.fillStyle = isSelected ? '#3b82f6' : '#4b5563';
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                
                this.ctx.beginPath();
                this.ctx.arc(j.x, j.y, 6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            }
        }

        this.ctx.restore();

        // Draw Ruler
        if (this.showRuler) {
            const minScreenStep = 60;
            const targetWorldStep = minScreenStep / this.zoom;
            const log = Math.log10(targetWorldStep);
            const power = Math.floor(log);
            const fraction = targetWorldStep / Math.pow(10, power);
            
            let majorWorldStep, minorSteps;
            if (fraction <= 2) {
                majorWorldStep = 2 * Math.pow(10, power);
                minorSteps = 4;
            } else if (fraction <= 5) {
                majorWorldStep = 5 * Math.pow(10, power);
                minorSteps = 5;
            } else {
                majorWorldStep = 10 * Math.pow(10, power);
                minorSteps = 5;
            }
            const minorWorldStep = majorWorldStep / minorSteps;

            this.ctx.fillStyle = 'rgba(15, 17, 21, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, 24);
            this.ctx.fillRect(0, 0, 24, this.canvas.height);
            
            this.ctx.fillStyle = '#a0aab5';
            this.ctx.strokeStyle = '#a0aab5';
            this.ctx.font = '10px Inter';
            this.ctx.lineWidth = 1;

            // X Ruler
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            
            const startXWorld = Math.floor((-this.offsetX / this.zoom) / minorWorldStep) * minorWorldStep;
            const endXWorld = (this.canvas.width - this.offsetX) / this.zoom;
            
            this.ctx.beginPath();
            for (let wx = startXWorld; wx <= endXWorld; wx += minorWorldStep) {
                const sx = wx * this.zoom + this.offsetX;
                if (sx < 24) continue;
                
                const ratio = Math.abs(wx / majorWorldStep);
                const isMajor = Math.abs(ratio - Math.round(ratio)) < 0.001;
                
                if (isMajor) {
                    this.ctx.moveTo(sx, 12);
                    this.ctx.lineTo(sx, 24);
                    this.ctx.fillText(Math.round(wx), sx, 2);
                } else {
                    this.ctx.moveTo(sx, 18);
                    this.ctx.lineTo(sx, 24);
                }
            }
            this.ctx.stroke();

            // Y Ruler
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const startYWorld = Math.floor((-this.offsetY / this.zoom) / minorWorldStep) * minorWorldStep;
            const endYWorld = (this.canvas.height - this.offsetY) / this.zoom;
            
            this.ctx.beginPath();
            for (let wy = startYWorld; wy <= endYWorld; wy += minorWorldStep) {
                const sy = wy * this.zoom + this.offsetY;
                if (sy < 24) continue;
                
                const ratio = Math.abs(wy / majorWorldStep);
                const isMajor = Math.abs(ratio - Math.round(ratio)) < 0.001;
                
                if (isMajor) {
                    this.ctx.moveTo(12, sy);
                    this.ctx.lineTo(24, sy);
                    
                    this.ctx.save();
                    this.ctx.translate(6, sy); // Place text centrally between 0 and 12
                    this.ctx.rotate(-Math.PI / 2);
                    this.ctx.fillText(Math.round(wy), 0, 0);
                    this.ctx.restore();
                } else {
                    this.ctx.moveTo(18, sy);
                    this.ctx.lineTo(24, sy);
                }
            }
            this.ctx.stroke();
            
            // Corner block
            this.ctx.fillStyle = '#0f1115';
            this.ctx.fillRect(0, 0, 24, 24);
        }
    }
}
