class UIManager {
    constructor(jointEngine, accessoryManager, timelineEngine, profileSerializer, canvasViewport) {
        this.jointEngine = jointEngine;
        this.accessoryManager = accessoryManager;
        this.timelineEngine = timelineEngine;
        this.profileSerializer = profileSerializer;
        this.canvasViewport = canvasViewport;
        this.canvasViewport.uiManager = this;
        
        // Initialize History
        this.historyManager = new HistoryManager(this);

        // UI Elements
        this.treeList = document.getElementById('bone-tree-list');
        this.propEditor = document.getElementById('properties-editor');
        this.noSelectMsg = document.getElementById('no-selection-msg');
        
        // Form Inputs (using existing DOM elements for now)
        this.propId = document.getElementById('prop-id');
        this.propLabel = document.getElementById('prop-label');
        this.propX = document.getElementById('prop-x');
        this.propY = document.getElementById('prop-y');
        this.propLength = document.getElementById('prop-length');
        this.propRadius = document.getElementById('prop-radius');
        
        // Hide unused properties
        if (document.getElementById('prop-rot')) document.getElementById('prop-rot').parentElement.style.display = 'none';
        if (this.propLength) this.propLength.parentElement.style.display = 'none';
        if (this.propRadius) this.propRadius.parentElement.style.display = 'none';
        if (document.getElementById('prop-type')) document.getElementById('prop-type').parentElement.style.display = 'none';
        if (document.getElementById('prop-parent')) document.getElementById('prop-parent').parentElement.style.display = 'none';
    }

    init() {
        const previewCanvas = document.getElementById('preview-canvas');
        if (previewCanvas) {
            this.previewViewport = new CanvasViewport(previewCanvas, this.jointEngine, this.accessoryManager);
            this.previewViewport.uiManager = this;
            this.previewViewport.showGrid = false;
            this.previewViewport.showFloorLine = false;
            this.previewViewport.showRuler = false;
            this.previewViewport.zoom = 0.7; // Scale down for preview
        }

        this.setupEventListeners();
        
        this.canvasViewport.onSelectionChange = (id, type) => {
            this.selectItem(id, type);
        };
        
        this.canvasViewport.onActionStart = () => {
            this.historyManager.saveState();
        };
        
        this.canvasViewport.onJointChanged = (joint) => {
            if (this.canvasViewport.selectedJointId === joint.id) {
                this.propX.value = joint.x.toFixed(1);
                this.propY.value = joint.y.toFixed(1);
                
                if (joint.parentId && this.propLength) {
                    const len = Math.hypot(joint.localX, joint.localY);
                    this.propLength.value = len.toFixed(1);
                }
            }
            
            // Auto keyframe
            const profileName = document.getElementById('profile-select').value || 'Idle 1';
            const frame = this.timelineEngine.currentFrame;
            const isNew = this.timelineEngine.addKeyframe(profileName, frame, this.jointEngine);
            if (isNew) {
                this.renderTimelineTracks();
            }
        };
        
        this.timelineEngine.onFrameUpdate = (frame) => {
            document.getElementById('current-frame').innerText = frame + 1;
            const scrubber = document.getElementById('timeline-scrubber');
            scrubber.style.left = `${120 + (frame * 20)}px`;
            this.renderTimelineTracks();
        };
        // Ensure default profiles exist
        const defaultProfiles = ['Idle 1', 'Walk', 'Run', 'Attack 1', 'Defend 1'];
        defaultProfiles.forEach(p => this.timelineEngine.addProfile(p, 30, true, []));
        this.timelineEngine.setProfile('Idle 1');

        this.renderTimelineTracks();

        let lastTime = performance.now();
        const updateTimeline = (time) => {
            const dt = time - lastTime;
            lastTime = time;
            if (!this.isExportingGif) {
                this.timelineEngine.update(dt, this.jointEngine);
                if (this.previewViewport && !document.getElementById('preview-modal').classList.contains('hidden')) {
                    // Keep the character centered in preview
                    const previewCanvas = document.getElementById('preview-canvas');
                    if (previewCanvas) {
                        this.previewViewport.offsetX = previewCanvas.width / 2;
                        this.previewViewport.offsetY = previewCanvas.height * 0.7;
                        this.previewViewport.render();
                    }
                }
            }
            requestAnimationFrame(updateTimeline);
        };
        requestAnimationFrame(updateTimeline);
    }

    setupEventListeners() {
        // Module Switching
        const tabBtns = document.querySelectorAll('.module-switcher .tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tabBtns.forEach(b => b.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                
                const moduleName = target.getAttribute('data-target');
                this.currentModule = moduleName;
                if (moduleName === 'skeleton-builder') {
                    document.getElementById('skeleton-builder-ui').classList.remove('hidden');
                    document.getElementById('skin-editor-ui').classList.add('hidden');
                    document.getElementById('accessory-designer-ui').classList.add('hidden');
                } else if (moduleName === 'skin-editor') {
                    document.getElementById('skeleton-builder-ui').classList.add('hidden');
                    document.getElementById('skin-editor-ui').classList.remove('hidden');
                    document.getElementById('accessory-designer-ui').classList.add('hidden');
                } else if (moduleName === 'accessory-designer') {
                    document.getElementById('skeleton-builder-ui').classList.add('hidden');
                    document.getElementById('skin-editor-ui').classList.add('hidden');
                    document.getElementById('accessory-designer-ui').classList.remove('hidden');
                }
                this.canvasViewport.render();
            });
        });

        // Accessory Library Import/Export
        const btnImportLibImg = document.getElementById('btn-import-lib-img');
        const fileImportLibImg = document.getElementById('file-import-lib-img');
        if (btnImportLibImg && fileImportLibImg) {
            btnImportLibImg.addEventListener('click', () => fileImportLibImg.click());
            fileImportLibImg.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        this.accessoryManager.addInventoryItem(this.currentAccessoryCategory, evt.target.result, 0.5, 0.5);
                        this.renderInventoryList();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        const btnImportLibJson = document.getElementById('btn-import-lib-json');
        const fileImportLibJson = document.getElementById('file-import-lib-json');
        if (btnImportLibJson && fileImportLibJson) {
            btnImportLibJson.addEventListener('click', () => fileImportLibJson.click());
            fileImportLibJson.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        try {
                            const libData = JSON.parse(evt.target.result);
                            for (const [category, items] of Object.entries(libData)) {
                                for (const item of items) {
                                    if (!this.accessoryManager.getLibraryItem(item.id)) {
                                        this.accessoryManager.addInventoryItem(category, item.assetUri, item.pivotX, item.pivotY, item.id);
                                    }
                                }
                            }
                            this.renderInventoryList();
                        } catch (err) {
                            console.error("Failed to parse accessory library", err);
                            alert("Invalid library JSON file.");
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }

        const btnExportLibJson = document.getElementById('btn-export-lib-json');
        if (btnExportLibJson) {
            btnExportLibJson.addEventListener('click', () => {
                const libStr = localStorage.getItem('charagen_accessory_library');
                if (libStr) {
                    const blob = new Blob([libStr], {type: "application/json"});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = "charagen_accessory_library.json";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            });
        }

        // Help Modal Logic
        const btnHelp = document.getElementById('btn-help');
        const modalHelp = document.getElementById('help-modal');
        const btnCloseHelp = document.getElementById('btn-close-help');
        
        if (btnHelp && modalHelp) {
            btnHelp.addEventListener('click', () => {
                modalHelp.classList.remove('hidden');
            });
        }
        if (btnCloseHelp && modalHelp) {
            btnCloseHelp.addEventListener('click', () => {
                modalHelp.classList.add('hidden');
            });
        }

        // Skin Editor Logic
        const toggleSkin = document.getElementById('skin-active-toggle');
        const selectSkinMat = document.getElementById('skin-material-select');
        const selectSkinShape = document.getElementById('skin-shape-select');
        const btnApplySkin = document.getElementById('btn-apply-skin-shape');

        if (toggleSkin) {
            toggleSkin.checked = this.jointEngine.skinState.active;
            toggleSkin.addEventListener('change', (e) => {
                this.jointEngine.skinState.active = e.target.checked;
                this.canvasViewport.render();
            });
        }
        if (selectSkinMat) {
            selectSkinMat.value = this.jointEngine.skinState.materialColor;
            selectSkinMat.addEventListener('change', (e) => {
                this.jointEngine.skinState.materialColor = e.target.value;
                this.canvasViewport.render();
            });
        }
        if (btnApplySkin) {
            btnApplySkin.addEventListener('click', () => {
                const shape = selectSkinShape.value;
                const joints = this.jointEngine.getAllJoints();
                this.historyManager.saveState();
                
                // Very basic heuristic for applying radius based on joint connections
                // In a real app, you'd map specific labels (like 'Hip', 'Ankle') to specific radii.
                // For now, we just apply a generic shape modifier.
                let baseRadius = 10;
                if (shape === 'lean') baseRadius = 6;
                else if (shape === 'muscly') baseRadius = 15;
                else if (shape === 'chunky') baseRadius = 25;
                
                joints.forEach(j => j.radius = baseRadius);
                this.canvasViewport.render();
            });
        }

        // Preview Modal Logic
        const btnOpenPreview = document.getElementById('btn-open-preview');
        const btnClosePreview = document.getElementById('btn-close-preview');
        const previewModal = document.getElementById('preview-modal');
        const btnExportGif = document.getElementById('btn-export-gif');
        const gifProgress = document.getElementById('gif-progress');

        if (btnOpenPreview) {
            btnOpenPreview.addEventListener('click', () => {
                const prevModule = this.currentModule;
                this.currentModule = 'preview'; // force hide skeleton
                this.canvasViewport.render();
                previewModal.classList.remove('hidden');
                
                // Force resize on the preview viewport now that it's visible
                if (this.previewViewport) {
                    this.previewViewport.resize();
                    this.previewViewport.zoom = 0.7; // Ensure zoom stays correct
                }
            });
        }

        if (btnClosePreview) {
            btnClosePreview.addEventListener('click', () => {
                previewModal.classList.add('hidden');
                
                // restore module
                const activeTab = document.querySelector('.module-switcher .tab-btn.active');
                if (activeTab) {
                    this.currentModule = activeTab.getAttribute('data-target');
                    this.canvasViewport.render();
                }
            });
        }

        if (btnExportGif && typeof GIF !== 'undefined') {
            btnExportGif.addEventListener('click', () => {
                btnExportGif.disabled = true;
                gifProgress.style.display = 'block';
                gifProgress.innerText = 'Rendering GIF...';

                this.isExportingGif = true;

                const prof = this.timelineEngine.currentProfile;
                const frameCount = (prof && prof.keyframes && prof.keyframes.length > 0) ? Math.max(...prof.keyframes.map(k => k.time)) + 1 : 60;
                const delayMs = Math.round(1000 / (prof ? prof.frameRate : 30));

                let renderFrame = 0;
                
                // Save state to restore later
                const originalFrame = this.timelineEngine.currentFrame;

                // 1. Calculate Bounding Box across all frames
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                for (let f = 0; f < frameCount; f++) {
                    this.timelineEngine.scrubTo(f, this.jointEngine);
                    // Joints bounds
                    for (const j of this.jointEngine.getAllJoints()) {
                        const r = (j.radius || 10) + 10;
                        if (j.x - r < minX) minX = j.x - r;
                        if (j.x + r > maxX) maxX = j.x + r;
                        if (j.y - r < minY) minY = j.y - r;
                        if (j.y + r > maxY) maxY = j.y + r;
                    }
                    // Accessories bounds
                    for (const a of this.accessoryManager.anchors) {
                        const equip = this.accessoryManager.getEquipmentBySlot(a.slotType);
                        if (equip && equip.image) {
                            const conn = this.jointEngine.getConnection(a.connectionId);
                            if (conn) {
                                const jA = this.jointEngine.getJoint(conn.jointA);
                                const jB = this.jointEngine.getJoint(conn.jointB);
                                const transform = this.accessoryManager.calculateAccessoryTransform(a, jA, jB);
                                if (transform) {
                                    const imgW = equip.image.width * transform.scaleX;
                                    const imgH = equip.image.height * transform.scaleY;
                                    const r = Math.max(imgW, imgH);
                                    if (transform.x - r < minX) minX = transform.x - r;
                                    if (transform.x + r > maxX) maxX = transform.x + r;
                                    if (transform.y - r < minY) minY = transform.y - r;
                                    if (transform.y + r > maxY) maxY = transform.y + r;
                                }
                            }
                        }
                    }
                }
                
                // Add fixed padding and fallback if no joints exist
                if (minX === Infinity) { minX = -128; maxX = 128; minY = -128; maxY = 128; }
                minX -= 50; minY -= 50;
                maxX += 50; maxY += 50;
                
                const gifZoom = this.previewViewport.zoom;
                const gifWidth = Math.round((maxX - minX) * gifZoom);
                const gifHeight = Math.round((maxY - minY) * gifZoom);

                // Setup offscreen canvas for capturing
                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = gifWidth;
                offscreenCanvas.height = gifHeight;
                const offscreenViewport = new CanvasViewport(offscreenCanvas, this.jointEngine, this.accessoryManager);
                offscreenViewport.uiManager = this;
                offscreenViewport.showGrid = false;
                offscreenViewport.showFloorLine = false;
                offscreenViewport.showRuler = false;
                offscreenViewport.zoom = gifZoom;
                offscreenViewport.offsetX = -minX * gifZoom;
                offscreenViewport.offsetY = -minY * gifZoom;

                const gif = new GIF({
                    workers: 2,
                    quality: 10,
                    width: gifWidth,
                    height: gifHeight,
                    transparent: 'rgba(0,0,0,0)',
                    workerScript: 'src/lib/gif.worker.js'
                });

                const renderLoop = () => {
                    if (renderFrame >= frameCount) {
                        gifProgress.innerText = 'Encoding GIF...';
                        gif.on('finished', (blob) => {
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            const profileName = document.getElementById('profile-name').value || 'character';
                            a.download = `${profileName}_anim.gif`;
                            a.click();
                            URL.revokeObjectURL(url);
                            
                            btnExportGif.disabled = false;
                            gifProgress.style.display = 'none';
                            this.isExportingGif = false;
                            
                            // Restore
                            this.timelineEngine.scrubTo(originalFrame, this.jointEngine);
                        });
                        gif.render();
                        return;
                    }

                    this.timelineEngine.scrubTo(renderFrame, this.jointEngine);
                    
                    // Update visible preview just for the user to see progress
                    this.previewViewport.offsetX = 256;
                    this.previewViewport.offsetY = 512 * 0.7;
                    this.previewViewport.render();
                    
                    // Render to offscreen cropped canvas
                    offscreenViewport.render();
                    
                    gif.addFrame(offscreenCanvas, { delay: delayMs, copy: true });
                    
                    renderFrame++;
                    gifProgress.innerText = `Rendering ${renderFrame} / ${frameCount}...`;
                    requestAnimationFrame(renderLoop);
                };
                
                requestAnimationFrame(renderLoop);
            });
        }

        // Sub-tabs Logic
        this.currentAccessoryCategory = 'headwear';
        const subTabBtns = document.querySelectorAll('.sub-tabs .sub-tab-btn');
        subTabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                subTabBtns.forEach(b => b.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                this.currentAccessoryCategory = target.getAttribute('data-category');
                this.renderInventoryList();
            });
        });
        
        setTimeout(() => this.renderInventoryList(), 100); // Initial render

        // Drawing Modal Logic
        const btnCreateItem = document.getElementById('btn-create-item');
        const modalDrawing = document.getElementById('modal-drawing-tool');
        const drawCanvas = document.getElementById('drawing-canvas');
        let drawCtx = null;
        if (drawCanvas) drawCtx = drawCanvas.getContext('2d', { willReadFrequently: true });
        
        let isSettingPivot = false;
        let activeTool = 'brush';
        let currentPivot = { x: 0.5, y: 0.5 };
        let editingItemId = null;
        
        const btnSetPivot = document.getElementById('btn-set-pivot');
        const pivotCrosshair = document.getElementById('pivot-crosshair');
        const btnToolBrush = document.getElementById('btn-tool-brush');
        const btnToolFill = document.getElementById('btn-tool-fill');

        if (btnToolBrush) {
            btnToolBrush.addEventListener('click', () => {
                activeTool = 'brush';
                btnToolBrush.classList.add('active');
                btnToolBrush.style.background = 'rgba(59, 130, 246, 0.2)';
                btnToolBrush.style.borderColor = '#3b82f6';
                if (btnToolFill) {
                    btnToolFill.classList.remove('active');
                    btnToolFill.style.background = '';
                    btnToolFill.style.borderColor = '';
                }
            });
        }
        if (btnToolFill) {
            btnToolFill.addEventListener('click', () => {
                activeTool = 'fill';
                btnToolFill.classList.add('active');
                btnToolFill.style.background = 'rgba(59, 130, 246, 0.2)';
                btnToolFill.style.borderColor = '#3b82f6';
                if (btnToolBrush) {
                    btnToolBrush.classList.remove('active');
                    btnToolBrush.style.background = '';
                    btnToolBrush.style.borderColor = '';
                }
            });
        }

        if (btnSetPivot) {
            btnSetPivot.addEventListener('click', () => {
                isSettingPivot = !isSettingPivot;
                if (isSettingPivot) {
                    btnSetPivot.classList.add('active');
                    btnSetPivot.style.background = 'rgba(59, 130, 246, 0.2)';
                    btnSetPivot.style.borderColor = '#3b82f6';
                } else {
                    btnSetPivot.classList.remove('active');
                    btnSetPivot.style.background = '';
                    btnSetPivot.style.borderColor = '';
                }
            });
        }
        
        this.openDrawingModal = (itemIdToEdit = null) => {
            if (!modalDrawing) return;
            modalDrawing.classList.remove('hidden');
            isSettingPivot = false;
            editingItemId = itemIdToEdit;
            if (btnSetPivot) {
                btnSetPivot.classList.remove('active');
                btnSetPivot.style.background = '';
                btnSetPivot.style.borderColor = '';
            }
            if (drawCtx) drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            
            if (itemIdToEdit) {
                const items = this.accessoryManager.getInventoryItems(this.currentAccessoryCategory);
                const item = items.find(i => i.id === itemIdToEdit);
                if (item) {
                    currentPivot = { x: item.pivotX, y: item.pivotY };
                    const img = new Image();
                    img.onload = () => {
                        if (drawCtx) drawCtx.drawImage(img, 0, 0);
                    };
                    img.src = item.assetUri;
                }
            } else {
                currentPivot = { x: 0.5, y: 0.5 };
            }
            if (pivotCrosshair) {
                pivotCrosshair.style.left = `${currentPivot.x * 512}px`;
                pivotCrosshair.style.top = `${currentPivot.y * 512}px`;
            }
        };

        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.inventory-item.create-new');
            if (btn) this.openDrawingModal(null);
        });
        
        let undoStack = [];
        const pushUndoState = () => {
            if (drawCtx && drawCanvas) {
                undoStack.push(drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height));
                if (undoStack.length > 20) undoStack.shift();
            }
        };

        const btnDrawUndo = document.getElementById('btn-draw-undo');
        if (btnDrawUndo) {
            btnDrawUndo.addEventListener('click', () => {
                if (undoStack.length > 0 && drawCtx) {
                    const prevState = undoStack.pop();
                    drawCtx.putImageData(prevState, 0, 0);
                }
            });
        }

        document.getElementById('btn-draw-close')?.addEventListener('click', () => modalDrawing.classList.add('hidden'));
        document.getElementById('btn-draw-cancel')?.addEventListener('click', () => modalDrawing.classList.add('hidden'));
        document.getElementById('btn-draw-clear')?.addEventListener('click', () => {
            if (drawCtx) {
                pushUndoState();
                drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            }
        });
        
        document.getElementById('btn-draw-save')?.addEventListener('click', () => {
            if (drawCanvas) {
                const dataUrl = drawCanvas.toDataURL('image/png');
                if (editingItemId) {
                    // Update existing item
                    const items = this.accessoryManager.getInventoryItems(this.currentAccessoryCategory);
                    const item = items.find(i => i.id === editingItemId);
                    if (item) {
                        item.assetUri = dataUrl;
                        item.pivotY = currentPivot.y;
                        this.accessoryManager.saveLibrary();
                        const equipped = this.accessoryManager.getEquipmentBySlot(this.currentAccessoryCategory);
                        if (equipped && equipped.itemId === editingItemId) {
                            this.accessoryManager.equipItem(this.currentAccessoryCategory, editingItemId, this.currentAccessoryCategory);
                        }
                    }
                } else {
                    this.accessoryManager.addInventoryItem(this.currentAccessoryCategory, dataUrl, currentPivot.x, currentPivot.y);
                }
                this.renderInventoryList();
                this.canvasViewport.render();
            }
            modalDrawing.classList.add('hidden');
        });

        const floodFill = (ctx, startX, startY, fillColor) => {
            const canvas = ctx.canvas;
            const w = canvas.width, h = canvas.height;
            const imageData = ctx.getImageData(0, 0, w, h);
            const data = imageData.data;

            const startPos = (startY * w + startX) * 4;
            const startR = data[startPos];
            const startG = data[startPos + 1];
            const startB = data[startPos + 2];
            const startA = data[startPos + 3];

            let fillR = 0, fillG = 0, fillB = 0, fillA = 255;
            if (fillColor.startsWith('#')) {
                const hex = fillColor.replace('#', '');
                if (hex.length === 6) {
                    fillR = parseInt(hex.substring(0, 2), 16);
                    fillG = parseInt(hex.substring(2, 4), 16);
                    fillB = parseInt(hex.substring(4, 6), 16);
                }
            }

            if (startR === fillR && startG === fillG && startB === fillB && startA === fillA) return;

            const matchStartColor = (pos) => {
                return data[pos] === startR && data[pos + 1] === startG && data[pos + 2] === startB && data[pos + 3] === startA;
            };

            const colorPixel = (pos) => {
                data[pos] = fillR;
                data[pos + 1] = fillG;
                data[pos + 2] = fillB;
                data[pos + 3] = fillA;
            };

            const pixelStack = [[startX, startY]];
            while (pixelStack.length) {
                const newPos = pixelStack.pop();
                const x = newPos[0];
                let y = newPos[1];
                let pixelPos = (y * w + x) * 4;
                while (y >= 0 && matchStartColor(pixelPos)) {
                    y--;
                    pixelPos -= w * 4;
                }
                pixelPos += w * 4;
                y++;
                let reachLeft = false;
                let reachRight = false;
                while (y < h && matchStartColor(pixelPos)) {
                    colorPixel(pixelPos);
                    if (x > 0) {
                        if (matchStartColor(pixelPos - 4)) {
                            if (!reachLeft) {
                                pixelStack.push([x - 1, y]);
                                reachLeft = true;
                            }
                        } else if (reachLeft) {
                            reachLeft = false;
                        }
                    }
                    if (x < w - 1) {
                        if (matchStartColor(pixelPos + 4)) {
                            if (!reachRight) {
                                pixelStack.push([x + 1, y]);
                                reachRight = true;
                            }
                        } else if (reachRight) {
                            reachRight = false;
                        }
                    }
                    pixelPos += w * 4;
                    y++;
                }
            }
            ctx.putImageData(imageData, 0, 0);
        };

        // Drawing interactions
        let isDrawing = false;
        if (drawCanvas) {
            drawCanvas.addEventListener('mousedown', (e) => {
                const rect = drawCanvas.getBoundingClientRect();
                const x = Math.floor(e.clientX - rect.left);
                const y = Math.floor(e.clientY - rect.top);

                if (isSettingPivot) {
                    currentPivot.x = x / drawCanvas.width;
                    currentPivot.y = y / drawCanvas.height;
                    if (pivotCrosshair) {
                        pivotCrosshair.style.left = `${x}px`;
                        pivotCrosshair.style.top = `${y}px`;
                    }
                } else if (activeTool === 'fill') {
                    pushUndoState();
                    const color = document.getElementById('draw-color').value;
                    floodFill(drawCtx, x, y, color);
                } else {
                    pushUndoState();
                    isDrawing = true;
                    drawCtx.beginPath();
                    drawCtx.moveTo(x, y);
                }
            });
            drawCanvas.addEventListener('mousemove', (e) => {
                if (isDrawing && !isSettingPivot && activeTool === 'brush') {
                    const rect = drawCanvas.getBoundingClientRect();
                    const color = document.getElementById('draw-color').value;
                    const size = document.getElementById('draw-size').value;
                    drawCtx.strokeStyle = color;
                    drawCtx.lineWidth = size;
                    drawCtx.lineCap = 'round';
                    drawCtx.lineJoin = 'round';
                    drawCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                    drawCtx.stroke();
                }
            });
            const stopDrawing = () => { isDrawing = false; };
            drawCanvas.addEventListener('mouseup', stopDrawing);
            drawCanvas.addEventListener('mouseleave', stopDrawing);
        }

        const updateProp = (propName, inputEl) => {
            if (this.canvasViewport.selectedJointId) {
                this.jointEngine.updateJointProperty(
                    this.canvasViewport.selectedJointId,
                    propName,
                    parseFloat(inputEl.value)
                );
            }
        };

        this.propLabel.addEventListener('input', () => {
            if (this.canvasViewport.selectedJointId) {
                this.jointEngine.updateJointProperty(this.canvasViewport.selectedJointId, 'label', this.propLabel.value);
            } else if (this.canvasViewport.selectedConnectionId) {
                this.jointEngine.updateConnectionProperty(this.canvasViewport.selectedConnectionId, 'label', this.propLabel.value);
            }
            this.refreshHierarchyTree();
        });

        this.propX.addEventListener('input', () => updateProp('x', this.propX));
        this.propY.addEventListener('input', () => updateProp('y', this.propY));
        this.propRadius.addEventListener('input', () => {
            if (this.canvasViewport.selectedJointId) {
                const j = this.jointEngine.getJoint(this.canvasViewport.selectedJointId);
                if (j) {
                    j.radius = parseFloat(this.propRadius.value) || 10;
                    this.canvasViewport.render();
                }
            }
        });
        this.propLength.addEventListener('change', () => {
            if (this.canvasViewport.selectedJointId) {
                const joint = this.jointEngine.getJoint(this.canvasViewport.selectedJointId);
                if (joint && joint.parentId) {
                    this.historyManager.saveState();
                    const currentLen = Math.hypot(joint.localX, joint.localY);
                    const newLen = parseFloat(this.propLength.value);
                    if (!isNaN(newLen) && newLen >= 0 && currentLen > 0) {
                        joint.localX = (joint.localX / currentLen) * newLen;
                        joint.localY = (joint.localY / currentLen) * newLen;
                        this.jointEngine.updateWorldPositions();
                        
                        const profileName = document.getElementById('profile-select').value || 'Idle 1';
                        const frame = this.timelineEngine.currentFrame;
                        const isNew = this.timelineEngine.addKeyframe(profileName, frame, this.jointEngine);
                        if (isNew) {
                            this.renderTimelineTracks();
                        }
                    }
                }
            }
        });
        
        // Buttons
        const toolBtns = document.querySelectorAll('.tool-btn:not(#tool-lock-length):not(#tool-toggle-grid):not(#tool-toggle-floor):not(#tool-toggle-ruler)');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                toolBtns.forEach(b => b.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                
                const title = target.getAttribute('title');
                if (title.includes('Move')) this.canvasViewport.currentTool = 'move';
                else if (title.includes('Add Joint')) this.canvasViewport.currentTool = 'add_joint';
                else if (title.includes('Connect')) this.canvasViewport.currentTool = 'connect';
            });
        });

        const lockBtn = document.getElementById('tool-lock-length');
        if (lockBtn) {
            lockBtn.addEventListener('click', () => {
                this.canvasViewport.lockBoneLengths = !this.canvasViewport.lockBoneLengths;
                if (this.canvasViewport.lockBoneLengths) {
                    lockBtn.classList.add('active');
                    lockBtn.innerHTML = '<i class="fa-solid fa-lock"></i>';
                } else {
                    lockBtn.classList.remove('active');
                    lockBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i>';
                }
            });
        }

        const toggleGridBtn = document.getElementById('tool-toggle-grid');
        if (toggleGridBtn) {
            toggleGridBtn.title = this.canvasViewport.showGrid ? 'Hide Grid (G)' : 'Show Grid (G)';
            toggleGridBtn.addEventListener('click', () => {
                this.canvasViewport.showGrid = !this.canvasViewport.showGrid;
                if (this.canvasViewport.showGrid) {
                    toggleGridBtn.classList.add('active');
                    toggleGridBtn.title = 'Hide Grid (G)';
                } else {
                    toggleGridBtn.classList.remove('active');
                    toggleGridBtn.title = 'Show Grid (G)';
                }
            });
        }

        const toggleFloorBtn = document.getElementById('tool-toggle-floor');
        if (toggleFloorBtn) {
            toggleFloorBtn.title = this.canvasViewport.showFloorLine ? 'Hide Floor Line (F)' : 'Show Floor Line (F)';
            toggleFloorBtn.addEventListener('click', () => {
                this.canvasViewport.showFloorLine = !this.canvasViewport.showFloorLine;
                if (this.canvasViewport.showFloorLine) {
                    toggleFloorBtn.classList.add('active');
                    toggleFloorBtn.title = 'Hide Floor Line (F)';
                } else {
                    toggleFloorBtn.classList.remove('active');
                    toggleFloorBtn.title = 'Show Floor Line (F)';
                }
            });
        }

        const toggleRulerBtn = document.getElementById('tool-toggle-ruler');
        if (toggleRulerBtn) {
            toggleRulerBtn.title = this.canvasViewport.showRuler ? 'Hide Ruler (R)' : 'Show Ruler (R)';
            toggleRulerBtn.addEventListener('click', () => {
                this.canvasViewport.showRuler = !this.canvasViewport.showRuler;
                if (this.canvasViewport.showRuler) {
                    toggleRulerBtn.classList.add('active');
                    toggleRulerBtn.title = 'Hide Ruler (R)';
                } else {
                    toggleRulerBtn.classList.remove('active');
                    toggleRulerBtn.title = 'Show Ruler (R)';
                }
            });
        }

        document.getElementById('btn-add-bone').addEventListener('click', () => {
            const id = `joint_${Date.now()}`;
            this.jointEngine.addJoint(id, 0, 0, `Joint ${this.jointEngine.joints.size + 1}`);
            this.refreshHierarchyTree();
        });
        
        // Timeline controls
        document.getElementById('btn-undo').addEventListener('click', () => this.historyManager.undo());
        document.getElementById('btn-redo').addEventListener('click', () => this.historyManager.redo());

        document.getElementById('btn-play').addEventListener('click', (e) => {
            const isPlaying = this.timelineEngine.togglePlay();
            e.currentTarget.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
        });

        document.getElementById('btn-add-keyframe').addEventListener('click', () => {
            this.historyManager.saveState();
            const profileName = document.getElementById('profile-select').value || 'Idle 1';
            const frame = this.timelineEngine.currentFrame;
            
            this.timelineEngine.addKeyframe(profileName, frame, this.jointEngine);
            this.renderTimelineTracks();
        });
        
        const motionProfileSelect = document.getElementById('profile-select');
        if (motionProfileSelect) {
            motionProfileSelect.addEventListener('change', (e) => {
                this.timelineEngine.setProfile(e.target.value);
                this._updateTimelineUIParams();
                this.renderTimelineTracks();
                // Force the pose to update immediately on the canvas
                this.timelineEngine.scrubTo(0, this.jointEngine);
            });
        }
        
        const easingSelect = document.getElementById('easing-type');
        if (easingSelect) {
            easingSelect.addEventListener('change', (e) => {
                if (this.timelineEngine.currentProfile) {
                    this.historyManager.saveState();
                    this.timelineEngine.currentProfile.easing = e.target.value;
                }
            });
        }
        
        const repoSelect = document.getElementById('repo-frames');
        if (repoSelect) {
            repoSelect.addEventListener('change', (e) => {
                if (this.timelineEngine.currentProfile) {
                    this.historyManager.saveState();
                    this.timelineEngine.currentProfile.repoFrames = parseInt(e.target.value, 10);
                }
            });
        }
        
        document.getElementById('btn-delete-item').addEventListener('click', () => {
            this.historyManager.saveState();
            if (this.canvasViewport.selectedJointId) {
                this.jointEngine.deleteJoint(this.canvasViewport.selectedJointId);
                this.canvasViewport.selectedJointId = null;
                this.selectItem(null, null);
            } else if (this.canvasViewport.selectedConnectionId) {
                this.jointEngine.deleteConnection(this.canvasViewport.selectedConnectionId);
                this.canvasViewport.selectedConnectionId = null;
                this.selectItem(null, null);
            }
            this.refreshHierarchyTree();
        });

        document.getElementById('btn-add-anchor').addEventListener('click', () => {
            if (this.canvasViewport.selectedConnectionId) {
                this.historyManager.saveState();
                const id = `anchor_${Date.now()}`;
                this.accessoryManager.addAnchor(id, this.canvasViewport.selectedConnectionId, 'headwear', 0.5, 0);
                this.renderAnchorsList(this.canvasViewport.selectedConnectionId);
                this.canvasViewport.render(); // update visual immediately
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT')) {
                return;
            }

            if (e.key === ',') {
                this.timelineEngine.stepBackward(this.jointEngine);
                return;
            } else if (e.key === '.') {
                this.timelineEngine.stepForward(this.jointEngine);
                return;
            } else if (e.key.toLowerCase() === 'l') {
                if (lockBtn) lockBtn.click();
                return;
            } else if (e.key.toLowerCase() === 'g') {
                if (toggleGridBtn) toggleGridBtn.click();
                return;
            } else if (e.key.toLowerCase() === 'f') {
                if (toggleFloorBtn) toggleFloorBtn.click();
                return;
            } else if (e.key.toLowerCase() === 'r') {
                if (toggleRulerBtn) toggleRulerBtn.click();
                return;
            } else if (e.key.toLowerCase() === 'v') {
                const moveBtn = Array.from(toolBtns).find(b => b.title.includes('Move'));
                if (moveBtn) moveBtn.click();
            } else if (e.key.toLowerCase() === 'j' || e.key.toLowerCase() === 'a') {
                const addBtn = Array.from(toolBtns).find(b => b.title.includes('Add Joint'));
                if (addBtn) addBtn.click();
            } else if (e.key.toLowerCase() === 'c') {
                const connBtn = Array.from(toolBtns).find(b => b.title.includes('Connect'));
                if (connBtn) connBtn.click();
            } else if (e.key.toLowerCase() === 'k') {
                const kfBtn = document.getElementById('btn-add-keyframe');
                if (kfBtn) kfBtn.click();
            } else if (e.key === ' ') {
                const playBtn = document.getElementById('btn-play');
                if (playBtn) playBtn.click();
            } else if (e.ctrlKey && e.key.toLowerCase() === 'z') {
                if (e.shiftKey) {
                    this.historyManager.redo();
                } else {
                    this.historyManager.undo();
                }
                return;
            } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
                this.historyManager.redo();
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                
                let deleted = false;
                if (this.canvasViewport.selectedJointId || this.canvasViewport.selectedConnectionId) {
                    this.historyManager.saveState();
                }
                
                if (this.canvasViewport.selectedJointId) {
                    this.jointEngine.deleteJoint(this.canvasViewport.selectedJointId);
                    this.canvasViewport.selectedJointId = null;
                    this.selectItem(null, null);
                    deleted = true;
                } else if (this.canvasViewport.selectedConnectionId) {
                    this.jointEngine.deleteConnection(this.canvasViewport.selectedConnectionId);
                    this.canvasViewport.selectedConnectionId = null;
                    this.selectItem(null, null);
                    deleted = true;
                }
                
                if (deleted) {
                    this.refreshHierarchyTree();
                }
            }
        });
        
        // We can ignore unlink / add anchor as they are handled differently now

        document.getElementById('btn-new').addEventListener('click', () => {
            document.getElementById('modal-new-profile').classList.remove('hidden');
        });

        document.getElementById('btn-modal-cancel').addEventListener('click', () => {
            document.getElementById('modal-new-profile').classList.add('hidden');
        });

        document.getElementById('btn-modal-create').addEventListener('click', () => {
            this.jointEngine.clear();
            this.accessoryManager.anchors = [];
            this.accessoryManager.equipment.clear();
            this.timelineEngine.profiles.clear();
            
            this.canvasViewport.selectedJointId = null;
            this.canvasViewport.selectedConnectionId = null;
            this.selectItem(null, null);
            
            const name = document.getElementById('new-profile-name').value || 'NewProfile';
            const template = document.getElementById('new-profile-template').value;
            document.getElementById('profile-name').value = name;
            
            let displayClass = 'Custom';
            if (template === 'humanoid' && window.setupDefaultHumanoid) {
                window.setupDefaultHumanoid(this.jointEngine);
                displayClass = 'Based on Humanoid';
            } else if (template === 'avian' && window.setupAvian) {
                window.setupAvian(this.jointEngine);
                displayClass = 'Based on Avian';
            } else if (template === 'quadruped' && window.setupQuadruped) {
                window.setupQuadruped(this.jointEngine);
                displayClass = 'Based on Quadruped';
            } else if (template === 'blank' && window.setupBlank) {
                window.setupBlank(this.jointEngine);
            }
            
            window.currentTemplateClass = displayClass;
            window.currentClassCategory = template;
            
            this.refreshHierarchyTree();
            
            // Reset timeline
            const defaultProfiles = ['Idle 1', 'Walk', 'Run', 'Attack 1', 'Defend 1'];
            defaultProfiles.forEach(p => this.timelineEngine.addProfile(p, 30, true, []));
            this.timelineEngine.setProfile('Idle 1');
            this.timelineEngine.scrubTo(0, this.jointEngine);
            this.renderTimelineTracks();
            
            document.getElementById('modal-new-profile').classList.add('hidden');
        });

        document.getElementById('btn-import').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        this.loadState(event.target.result);
                    } catch (err) {
                        console.error('Failed to parse JSON', err);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        });

        document.getElementById('btn-export').addEventListener('click', () => {
            const data = this.profileSerializer.serialize();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const profileName = document.getElementById('profile-name').value || 'character_profile';
            a.download = `${profileName}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    refreshHierarchyTree() {
        this.treeList.innerHTML = '';
        
        // List Joints
        const joints = this.jointEngine.getAllJoints();
        joints.forEach(joint => {
            const li = document.createElement('li');
            const nodeDiv = document.createElement('div');
            nodeDiv.className = 'tree-node';
            if (this.canvasViewport.selectedJointId === joint.id) nodeDiv.classList.add('selected');
            nodeDiv.innerHTML = `<i class="fa-solid fa-circle-dot"></i> ${joint.label}`;
            nodeDiv.addEventListener('click', () => {
                this.canvasViewport.selectedJointId = joint.id;
                this.canvasViewport.selectedConnectionId = null;
                this.selectItem(joint.id, 'joint');
            });
            li.appendChild(nodeDiv);
            this.treeList.appendChild(li);
        });
        
        // List Connections
        const conns = this.jointEngine.getAllConnections();
        conns.forEach(conn => {
            const li = document.createElement('li');
            const nodeDiv = document.createElement('div');
            nodeDiv.className = 'tree-node';
            if (this.canvasViewport.selectedConnectionId === conn.id) nodeDiv.classList.add('selected');
            nodeDiv.innerHTML = `<i class="fa-solid fa-link"></i> ${conn.label}`;
            nodeDiv.addEventListener('click', () => {
                this.canvasViewport.selectedConnectionId = conn.id;
                this.canvasViewport.selectedJointId = null;
                this.selectItem(conn.id, 'connection');
            });
            li.appendChild(nodeDiv);
            this.treeList.appendChild(li);
        });
    }

    renderAnchorsList(connectionId) {
        const container = document.getElementById('anchors-list');
        if (!container) return;
        container.innerHTML = '';
        if (!connectionId) return;

        const anchors = this.accessoryManager.getAnchorsForConnection(connectionId);
        anchors.forEach(a => {
            const row = document.createElement('div');
            row.className = 'form-group';
            row.style.background = 'rgba(0,0,0,0.2)';
            row.style.padding = '0.5rem';
            row.style.borderRadius = '4px';
            row.style.marginBottom = '0.5rem';

            row.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <label style="font-size: 0.75rem; color: #a0aab5;">Slot</label>
                    <button class="btn-icon btn-del-anchor" data-id="${a.anchorId}" style="color: #ef4444;"><i class="fa-solid fa-trash"></i></button>
                </div>
                <select class="styled-select anchor-slot" data-id="${a.anchorId}" style="margin-bottom: 0.5rem;">
                    <option value="headwear" ${a.slotType === 'headwear' ? 'selected' : ''}>Headwear</option>
                    <option value="mainWeapon" ${a.slotType === 'mainWeapon' ? 'selected' : ''}>Main Weapon</option>
                    <option value="topBody" ${a.slotType === 'topBody' ? 'selected' : ''}>Top Body</option>
                    <option value="legs" ${a.slotType === 'legs' ? 'selected' : ''}>Legs</option>
                    <option value="feet" ${a.slotType === 'feet' ? 'selected' : ''}>Feet</option>
                </select>
                <div style="display: flex; gap: 0.5rem;">
                    <div style="flex: 1;">
                        <label style="font-size: 0.75rem;">Pos %</label>
                        <input type="number" class="styled-input anchor-pos" data-id="${a.anchorId}" value="${a.positionPercent}" step="0.1" min="0" max="1">
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 0.75rem;">Rot</label>
                        <input type="number" class="styled-input anchor-rot" data-id="${a.anchorId}" value="${a.rotationOffset}" step="0.1">
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 0.75rem;">Scale</label>
                        <input type="number" class="styled-input anchor-scale" data-id="${a.anchorId}" value="${a.scale || 1.0}" step="0.1" min="0.1">
                    </div>
                </div>
            `;
            container.appendChild(row);
        });

        container.querySelectorAll('.btn-del-anchor').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.historyManager.saveState();
                this.accessoryManager.anchors = this.accessoryManager.anchors.filter(x => x.anchorId !== id);
                this.renderAnchorsList(connectionId);
                this.canvasViewport.render();
            });
        });
        container.querySelectorAll('.anchor-slot').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const anchor = this.accessoryManager.anchors.find(x => x.anchorId === id);
                if (anchor) {
                    this.historyManager.saveState();
                    anchor.slotType = e.currentTarget.value;
                    this.canvasViewport.render();
                }
            });
        });
        container.querySelectorAll('.anchor-pos').forEach(inp => {
            inp.addEventListener('input', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const anchor = this.accessoryManager.anchors.find(x => x.anchorId === id);
                if (anchor) {
                    anchor.positionPercent = parseFloat(e.currentTarget.value) || 0;
                    this.canvasViewport.render();
                }
            });
        });
        container.querySelectorAll('.anchor-rot').forEach(inp => {
            inp.addEventListener('input', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const anchor = this.accessoryManager.anchors.find(x => x.anchorId === id);
                if (anchor) {
                    anchor.rotationOffset = parseFloat(e.currentTarget.value) || 0;
                    this.canvasViewport.render();
                }
            });
        });
        container.querySelectorAll('.anchor-scale').forEach(inp => {
            inp.addEventListener('input', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const anchor = this.accessoryManager.anchors.find(x => x.anchorId === id);
                if (anchor) {
                    anchor.scale = parseFloat(e.currentTarget.value) || 1.0;
                    this.canvasViewport.render();
                }
            });
        });
    }

    renderInventoryList() {
        const grid = document.getElementById('inventory-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // Add create new button
        const createBtn = document.createElement('div');
        createBtn.className = 'inventory-item create-new';
        createBtn.title = 'Create New Item';
        createBtn.innerHTML = '<i class="fa-solid fa-plus fa-2x"></i>';
        grid.appendChild(createBtn);

        const items = this.accessoryManager.getInventoryItems(this.currentAccessoryCategory);
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'inventory-item';
            div.title = 'Click to equip';
            
            const img = document.createElement('img');
            img.src = item.assetUri;
            div.appendChild(img);
            
            const editBtn = document.createElement('button');
            editBtn.className = 'item-edit-btn';
            editBtn.innerHTML = '<i class="fa-solid fa-pencil"></i>';
            editBtn.title = 'Edit Item';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openDrawingModal(item.id);
            });
            div.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'item-delete-btn';
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            deleteBtn.title = 'Delete Item from Library';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this item from your library?')) {
                    this.accessoryManager.deleteInventoryItem(this.currentAccessoryCategory, item.id);
                    // If it was equipped, unequip it
                    const equipped = this.accessoryManager.getEquipmentBySlot(this.currentAccessoryCategory);
                    if (equipped && equipped.itemId === item.id) {
                        this.accessoryManager.equipment.delete(this.currentAccessoryCategory);
                    }
                    this.renderInventoryList();
                    this.canvasViewport.render();
                }
            });
            div.appendChild(deleteBtn);
            
            div.addEventListener('click', () => {
                this.historyManager.saveState();
                this.accessoryManager.equipItem(this.currentAccessoryCategory, item.id, this.currentAccessoryCategory);
                this.canvasViewport.render();
            });
            
            grid.appendChild(div);
        });
    }

    renderTimelineTracks() {
        const container = document.getElementById('timeline-tracks-container');
        const ruler = document.getElementById('timeline-ruler');
        const profile = this.timelineEngine.currentProfile;
        
        if (ruler && ruler.children.length === 0) {
            ruler.innerHTML = '<div class="ruler-label" style="padding: 0 0.5rem; font-size: 0.75rem; color: #a0aab5; display: flex; align-items: center;">Frame</div><div class="ruler-frames" id="ruler-frames"></div>';
            const framesEl = document.getElementById('ruler-frames');
            for(let i = 0; i <= 59; i++) {
                const frameNum = i + 1;
                const tick = document.createElement('div');
                tick.className = 'ruler-tick';
                tick.style.left = `${i * 20}px`;
                tick.innerText = frameNum;
                
                // Text styling
                if (frameNum % 5 === 0) {
                    tick.style.color = '#a0aab5';
                    tick.style.fontSize = '0.70rem';
                    tick.style.fontWeight = 'bold';
                    tick.style.paddingLeft = '3px';
                } else {
                    tick.style.color = 'rgba(255,255,255,0.15)';
                    tick.style.fontSize = '0.55rem';
                    tick.style.fontWeight = 'normal';
                    tick.style.paddingLeft = '2px';
                }

                // Line styling
                if (i > 0 && i % 5 === 0) {
                    // Thick line for the start of every 5-frame block (100px, 200px...)
                    // This visually sits on the "right" of the previous frame.
                    tick.style.borderLeft = '2px solid rgba(255,255,255,0.3)';
                } else {
                    tick.style.borderLeft = '1px solid rgba(255,255,255,0.05)';
                }
                
                framesEl.appendChild(tick);
            }

            // Append the final thick line to the right of frame 60 (at 1200px)
            const finalTick = document.createElement('div');
            finalTick.className = 'ruler-tick';
            finalTick.style.left = `${60 * 20}px`;
            finalTick.style.borderLeft = '2px solid rgba(255,255,255,0.3)';
            framesEl.appendChild(finalTick);
            framesEl.addEventListener('click', (e) => {
                const rect = framesEl.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const frame = Math.round(x / 20);
                this.timelineEngine.scrubTo(frame, this.jointEngine);
            });
        }
        
        if (!container) return;
        container.innerHTML = '';
        if (!profile) return;
        
        const row = document.createElement('div');
        row.className = 'track-row';
        
        const label = document.createElement('div');
        label.className = 'track-label';
        label.innerText = profile.name || 'Master Pose';
        row.appendChild(label);
        
        const framesDiv = document.createElement('div');
        framesDiv.className = 'track-keyframes';
        
        if (profile.keyframes) {
            profile.keyframes.forEach(kf => {
                const kfEl = document.createElement('div');
                kfEl.className = 'keyframe';
                kfEl.style.left = `${kf.time * 20}px`;
                kfEl.title = `Click to remove Keyframe at Frame ${kf.time + 1}`;
                kfEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.historyManager.saveState();
                    this.timelineEngine.removeKeyframe(profile.name, kf.time);
                    this.renderTimelineTracks();
                    // Scrub to the frame to update visual state after removal
                    this.timelineEngine.scrubTo(this.timelineEngine.currentFrame, this.jointEngine);
                });
                framesDiv.appendChild(kfEl);
            });
        }
        
        framesDiv.addEventListener('click', (e) => {
            const rect = framesDiv.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const frame = Math.round(x / 20);
            this.timelineEngine.scrubTo(frame, this.jointEngine);
        });
        
        row.appendChild(framesDiv);
        container.appendChild(row);
    }

    loadState(jsonString) {
        const json = JSON.parse(jsonString);
        if (json.name) document.getElementById('profile-name').value = json.name;
        
        this.jointEngine.clear();
        this.canvasViewport.selectedJointId = null;
        this.canvasViewport.selectedConnectionId = null;
        
        if (json.skinState) {
            this.jointEngine.skinState.active = json.skinState.active;
            this.jointEngine.skinState.materialColor = json.skinState.materialColor;
            
            const toggleSkin = document.getElementById('skin-active-toggle');
            if (toggleSkin) toggleSkin.checked = this.jointEngine.skinState.active;
            const selectSkinMat = document.getElementById('skin-material-select');
            if (selectSkinMat) selectSkinMat.value = this.jointEngine.skinState.materialColor;
        }

        if (json.graph) {
            if (json.graph.joints) {
                json.graph.joints.forEach(j => this.jointEngine.addJoint(j.id, j.x, j.y, j.label, j.radius));
            }
            if (json.graph.connections) {
                json.graph.connections.forEach(c => this.jointEngine.addConnection(c.id, c.jointA, c.jointB, c.label));
            }
        }

        if (json.inventory) {
            // Migration: inject old inventory items into global library
            for (const [category, items] of Object.entries(json.inventory)) {
                for (const item of items) {
                    if (!this.accessoryManager.getLibraryItem(item.id)) {
                        this.accessoryManager.addInventoryItem(category, item.assetUri, item.pivotX, item.pivotY, item.id);
                    }
                }
            }
        }
        
        this.accessoryManager.anchors = json.anchorPoints || [];
        
        this.accessoryManager.equipment.clear();
        if (json.equipmentSlots) {
            for (const [slotType, eq] of Object.entries(json.equipmentSlots)) {
                this.accessoryManager.equipItem(slotType, eq.itemId, eq.itemClass);
            }
        }
        this.renderInventoryList();
        
        this.timelineEngine.profiles.clear();
        if (json.movementProfiles && Object.keys(json.movementProfiles).length > 0) {
            const selectEl = document.getElementById('profile-select');
            if (selectEl) selectEl.innerHTML = '';
            
            for (const [name, prof] of Object.entries(json.movementProfiles)) {
                this.timelineEngine.addProfile(name, prof.frameRate || 30, prof.loop !== false, prof.keyframes || [], prof.easing, prof.repoFrames);
                if (selectEl) {
                    const opt = document.createElement('option');
                    opt.value = name;
                    opt.innerText = name;
                    selectEl.appendChild(opt);
                }
            }
            
            const firstProfile = Object.keys(json.movementProfiles)[0];
            if (selectEl) selectEl.value = firstProfile;
            this.timelineEngine.setProfile(firstProfile);
        } else {
            const defaultProfiles = ['Idle 1', 'Walk', 'Run', 'Attack 1', 'Defend 1'];
            defaultProfiles.forEach(p => this.timelineEngine.addProfile(p, 30, true, []));
            this.timelineEngine.setProfile('Idle 1');
            const selectEl = document.getElementById('profile-select');
            if (selectEl) {
                selectEl.innerHTML = '';
                defaultProfiles.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p;
                    opt.innerText = p;
                    selectEl.appendChild(opt);
                });
                selectEl.value = 'Idle 1';
            }
        }
        
        this._updateTimelineUIParams();
        
        this.refreshHierarchyTree();
        this.selectItem(null, null);
        
        this.timelineEngine.scrubTo(0, this.jointEngine);
        this.renderTimelineTracks();
    }

    _updateTimelineUIParams() {
        const prof = this.timelineEngine.currentProfile;
        if (prof) {
            const easingSelect = document.getElementById('easing-type');
            if (easingSelect) easingSelect.value = prof.easing || 'linear';
            
            const repoSelect = document.getElementById('repo-frames');
            if (repoSelect) repoSelect.value = prof.repoFrames || 0;
        }
    }

    selectItem(id, type) {
        this.refreshHierarchyTree(); // Update selection styling
        
        if (type === 'joint' && id) {
            const joint = this.jointEngine.getJoint(id);
            if (joint) {
                this.noSelectMsg.classList.add('hidden');
                this.propEditor.classList.remove('hidden');
                
                this.propId.value = joint.id;
                this.propLabel.value = joint.label;
                this.propX.value = joint.x.toFixed(1);
                this.propY.value = joint.y.toFixed(1);
                if (this.propRadius) {
                    this.propRadius.value = joint.radius;
                    this.propRadius.parentElement.style.display = 'block';
                }
                
                this.propX.disabled = false;
                this.propY.disabled = false;
                
                document.getElementById('prop-x').parentElement.style.display = 'block';
                document.getElementById('prop-y').parentElement.style.display = 'block';
                
                if (joint.parentId && this.propLength) {
                    const len = Math.hypot(joint.localX, joint.localY);
                    this.propLength.value = len.toFixed(1);
                    this.propLength.parentElement.style.display = 'block';
                } else if (this.propLength) {
                    this.propLength.parentElement.style.display = 'none';
                }
                
                const anchorsSection = document.querySelector('.anchors-section');
                if (anchorsSection) anchorsSection.style.display = 'none';
            }
        } else if (type === 'connection' && id) {
            const conn = this.jointEngine.getConnection(id);
            if (conn) {
                this.noSelectMsg.classList.add('hidden');
                this.propEditor.classList.remove('hidden');
                
                this.propId.value = conn.id;
                this.propLabel.value = conn.label;
                this.propX.value = '';
                this.propY.value = '';
                
                document.getElementById('prop-x').parentElement.style.display = 'none';
                document.getElementById('prop-y').parentElement.style.display = 'none';
                if (this.propRadius) this.propRadius.parentElement.style.display = 'none';
                if (this.propLength) this.propLength.parentElement.style.display = 'none';

                const anchorsSection = document.querySelector('.anchors-section');
                if (anchorsSection) anchorsSection.style.display = 'block';
                this.renderAnchorsList(conn.id);
            }
        } else {
            this.noSelectMsg.classList.remove('hidden');
            this.propEditor.classList.add('hidden');
        }
    }
}
