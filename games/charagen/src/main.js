/**
 * CharaGen - Main Application Bootstrap
 * Initializes all core engines and UI managers.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Engines
    const jointEngine = new JointEngine();
    const accessoryManager = new AccessoryManager();
    const timelineEngine = new TimelineEngine();
    const profileSerializer = new ProfileSerializer(jointEngine, accessoryManager, timelineEngine);
    
    // 2. Initialize Canvas Viewport
    const canvasViewport = new CanvasViewport(
        document.getElementById('main-canvas'),
        jointEngine,
        accessoryManager
    );

    // 3. Initialize UI Manager
    const uiManager = new UIManager(
        jointEngine,
        accessoryManager,
        timelineEngine,
        profileSerializer,
        canvasViewport
    );

    // Initial setup
    uiManager.init();
    canvasViewport.startRenderLoop();
    
    // Optional: Setup a default humanoid structure
    setupDefaultHumanoid(jointEngine);
    uiManager.refreshHierarchyTree();
});

function setupDefaultHumanoid(jointEngine) {
    // Center line
    jointEngine.addJoint('pelvis', 0, -145, 'Pelvis');
    jointEngine.addJoint('spine', 0, -195, 'Spine');
    jointEngine.addJoint('chest', 0, -245, 'Chest'); // Clavicle
    jointEngine.addJoint('neck', 0, -265, 'Neck'); // Chin level
    jointEngine.addJoint('head', 0, -305, 'Head');
    
    // Left Arm
    jointEngine.addJoint('shoulder_l', -35, -245, 'Shoulder L');
    jointEngine.addJoint('elbow_l', -35, -185, 'Elbow L');
    jointEngine.addJoint('hand_l', -35, -135, 'Hand L');
    jointEngine.addJoint('fingers_l', -35, -115, 'Fingers L');
    
    // Right Arm
    jointEngine.addJoint('shoulder_r', 35, -245, 'Shoulder R');
    jointEngine.addJoint('elbow_r', 35, -185, 'Elbow R');
    jointEngine.addJoint('hand_r', 35, -135, 'Hand R');
    jointEngine.addJoint('fingers_r', 35, -115, 'Fingers R');

    // Left Leg
    jointEngine.addJoint('hip_l', -20, -145, 'Hip L');
    jointEngine.addJoint('knee_l', -20, -70, 'Knee L');
    jointEngine.addJoint('foot_l', -20, 0, 'Foot L');
    jointEngine.addJoint('toe_l', -35, 0, 'Toe L');

    // Right Leg
    jointEngine.addJoint('hip_r', 20, -145, 'Hip R');
    jointEngine.addJoint('knee_r', 20, -70, 'Knee R');
    jointEngine.addJoint('foot_r', 20, 0, 'Foot R');
    jointEngine.addJoint('toe_r', 35, 0, 'Toe R');

    // Connections
    jointEngine.addConnection('pelvis_spine', 'pelvis', 'spine');
    jointEngine.addConnection('spine_chest', 'spine', 'chest');
    jointEngine.addConnection('chest_neck', 'chest', 'neck');
    jointEngine.addConnection('neck_head', 'neck', 'head');
    
    jointEngine.addConnection('clavicle_l', 'chest', 'shoulder_l');
    jointEngine.addConnection('arm_u_l', 'shoulder_l', 'elbow_l');
    jointEngine.addConnection('arm_l_l', 'elbow_l', 'hand_l');
    jointEngine.addConnection('fingers_conn_l', 'hand_l', 'fingers_l');
    
    jointEngine.addConnection('clavicle_r', 'chest', 'shoulder_r');
    jointEngine.addConnection('arm_u_r', 'shoulder_r', 'elbow_r');
    jointEngine.addConnection('arm_l_r', 'elbow_r', 'hand_r');
    jointEngine.addConnection('fingers_conn_r', 'hand_r', 'fingers_r');
    
    jointEngine.addConnection('pelvis_l', 'pelvis', 'hip_l');
    jointEngine.addConnection('leg_u_l', 'hip_l', 'knee_l');
    jointEngine.addConnection('leg_l_l', 'knee_l', 'foot_l');
    jointEngine.addConnection('toe_conn_l', 'foot_l', 'toe_l');
    
    jointEngine.addConnection('pelvis_r', 'pelvis', 'hip_r');
    jointEngine.addConnection('leg_u_r', 'hip_r', 'knee_r');
    jointEngine.addConnection('leg_l_r', 'knee_r', 'foot_r');
    jointEngine.addConnection('toe_conn_r', 'foot_r', 'toe_r');
}

function setupAvian(jointEngine) {
    jointEngine.addJoint('pelvis', 0, 0, 'Pelvis');
    jointEngine.addJoint('chest', 30, -20, 'Chest');
    jointEngine.addJoint('head', 50, -40, 'Head');
    
    jointEngine.addConnection('spine', 'pelvis', 'chest');
    jointEngine.addConnection('neck', 'chest', 'head');
}

function setupQuadruped(jointEngine) {
    jointEngine.addJoint('pelvis', -30, 0, 'Pelvis');
    jointEngine.addJoint('chest', 30, 0, 'Chest');
    jointEngine.addJoint('head', 50, -30, 'Head');
    
    jointEngine.addConnection('spine', 'pelvis', 'chest');
    jointEngine.addConnection('neck', 'chest', 'head');
}

function setupBlank(jointEngine) {
    jointEngine.addJoint('root', 0, 0, 'Root');
}

// Expose templates to window for UIManager
window.setupDefaultHumanoid = setupDefaultHumanoid;
window.setupAvian = setupAvian;
window.setupQuadruped = setupQuadruped;
window.setupBlank = setupBlank;

