// Cat Fighters - Multi-Player Input Handler (Keyboard + Gamepad Controllers)
// Handles simultaneous keypresses and HTML5 Gamepad inputs for Player 1 and Player 2.
// Gamepad Attack Mapping:
//   Attacks 1-4 -> Face Buttons 1-4 (buttons[0..3]: A/B/X/Y or Cross/Circle/Square/Triangle)
//   Attack 5    -> Right Top Button 1 (buttons[5]: RB / R1)
//   Attack 6    -> Right Top Button 2 (buttons[7]: RT / R2)

class InputManager {
  constructor() {
    this.keysDown = new Set();
    this.justPressed = new Set();
    this.justReleased = new Set();

    // Player 1 keyboard bindings (Strictly physical top-row numbers and WASD)
    this.p1Bindings = {
      left: ['KeyA'],
      right: ['KeyD'],
      jump: ['KeyW'],
      crouch: ['KeyS'],
      attack1: ['Digit1'], // Poo attack
      attack2: ['Digit2'], // Hairball attack
      attack3: ['Digit3'], // Scratch
      attack4: ['Digit4'], // Litter throw
      attack5: ['Digit5'], // Poop grenade
      attack6: ['Digit6'], // Scramble attack
    };

    // Player 2 keyboard bindings (Strictly Numpad & Laptop fallbacks, zero overlap with P1)
    this.p2Bindings = {
      left: ['ArrowLeft'],
      right: ['ArrowRight'],
      jump: ['ArrowUp'],
      crouch: ['ArrowDown'],
      // Standard Numpad (NumLock on/off) + Laptop fallbacks (U, I, O, P, [, ])
      attack1: ['Numpad1', 'NumpadEnd', 'KeyU', 'KeyJ'],              // Poo attack
      attack2: ['Numpad2', 'NumpadDown', 'KeyI', 'KeyK'],             // Hairball attack
      attack3: ['Numpad3', 'NumpadPageDown', 'KeyO', 'KeyL'],         // Scratch
      attack4: ['Numpad4', 'NumpadLeft', 'KeyP', 'Semicolon'],        // Litter throw
      attack5: ['Numpad5', 'NumpadClear', 'BracketLeft', 'Quote'],    // Poop grenade
      attack6: ['Numpad6', 'NumpadRight', 'BracketRight', 'Backslash'],// Scramble attack
    };

    // Gamepad state tracking for Player 1 (index 0) and Player 2 (index 1), plus all pads for menus
    this.gpActionsDown = { 1: new Set(), 2: new Set(), any: new Set() };
    this.gpPrevActionsDown = { 1: new Set(), 2: new Set(), any: new Set() };
    this.gpActionsJustPressed = { 1: new Set(), 2: new Set(), any: new Set() };
    this.gpActionsJustReleased = { 1: new Set(), 2: new Set(), any: new Set() };
    this.connectedGamepads = [];
    this.playerPadIndices = { 1: null, 2: null };

    // Deadzones for analog sticks and triggers
    this.axisDeadzone = 0.35;
    this.jumpAxisThreshold = 0.48;
    this.triggerThreshold = 0.3;

    // Optional callback when controller connection state changes
    this.onGamepadStatusChange = null;

    this.initListeners();
  }

  initListeners() {
    // Ensure window has focus so HTML5 Gamepad API reports controller state immediately
    try {
      window.focus();
    } catch (e) {}
    window.addEventListener('DOMContentLoaded', () => {
      try {
        window.focus();
      } catch (e) {}
    });
    window.addEventListener('pointerdown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      try {
        window.focus();
      } catch (err) {}
    });

    window.addEventListener('keydown', (e) => {
      // Resume audio context on user interaction
      if (window.audio) {
        window.audio.ensureContext();
      }

      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }

      // Prevent page scrolling on arrow keys, space, tab
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      const code = e.code;
      if (!code) return;

      if (!this.keysDown.has(code)) {
        this.justPressed.add(code);
      }
      this.keysDown.add(code);
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      if (!code) return;
      this.keysDown.delete(code);
      this.justReleased.add(code);
    });

    window.addEventListener('blur', () => {
      this.keysDown.clear();
      this.justPressed.clear();
      this.justReleased.clear();
      this.gpActionsDown[1].clear();
      this.gpActionsDown[2].clear();
      this.gpActionsDown.any.clear();
      this.gpActionsJustPressed[1].clear();
      this.gpActionsJustPressed[2].clear();
      this.gpActionsJustPressed.any.clear();
      this.gpActionsJustReleased[1].clear();
      this.gpActionsJustReleased[2].clear();
      this.gpActionsJustReleased.any.clear();
    });

    // Gamepad connection events
    window.addEventListener('gamepadconnected', () => {
      try {
        window.focus();
      } catch (e) {}
      this.refreshConnectedGamepads();
      if (typeof this.onGamepadStatusChange === 'function') {
        this.onGamepadStatusChange(this.connectedGamepads);
      }
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      if (e && e.gamepad) {
        if (this.playerPadIndices[1] === e.gamepad.index) this.playerPadIndices[1] = null;
        if (this.playerPadIndices[2] === e.gamepad.index) this.playerPadIndices[2] = null;
      }
      this.refreshConnectedGamepads();
      if (typeof this.onGamepadStatusChange === 'function') {
        this.onGamepadStatusChange(this.connectedGamepads);
      }
    });
  }

  isValidGamepad(gp) {
    if (!gp || !gp.connected) return false;
    // Ignore non-controller hid sub-devices (e.g. motion sensors / accelerometers with no buttons)
    if (gp.buttons && gp.buttons.length === 0) return false;
    if (gp.id && /motion sensor|accelerometer|gyroscope/i.test(gp.id) && (!gp.buttons || gp.buttons.length < 4)) {
      return false;
    }
    return true;
  }

  refreshConnectedGamepads() {
    if (!navigator.getGamepads) {
      this.connectedGamepads = [];
      return this.connectedGamepads;
    }
    const rawPads = navigator.getGamepads();
    const list = [];
    if (rawPads) {
      for (let i = 0; i < rawPads.length; i++) {
        if (this.isValidGamepad(rawPads[i])) {
          list.push(rawPads[i]);
        }
      }
    }
    this.connectedGamepads = list;
    return list;
  }

  getConnectedGamepadCount() {
    return this.refreshConnectedGamepads().length;
  }

  isButtonPressed(gp, btnIndex, threshold = 0.5) {
    if (!gp || !gp.buttons || btnIndex >= gp.buttons.length) return false;
    const btn = gp.buttons[btnIndex];
    if (!btn) return false;
    if (typeof btn === 'object') {
      return Boolean(btn.pressed || (typeof btn.value === 'number' && btn.value >= threshold));
    }
    return btn >= threshold;
  }

  // Extract active game actions from a single Gamepad instance
  readGamepadActions(gp) {
    const active = new Set();
    if (!gp || !gp.connected) return active;

    // --- MOVEMENT (Left Stick axes[0]/axes[1] + Linux Hat axes[6]/axes[7] + D-Pad buttons 12..15) ---
    const axisX = (gp.axes && gp.axes.length > 0 && Number.isFinite(gp.axes[0])) ? gp.axes[0] : 0;
    const axisY = (gp.axes && gp.axes.length > 1 && Number.isFinite(gp.axes[1])) ? gp.axes[1] : 0;
    const hatX = (gp.axes && gp.axes.length > 6 && Number.isFinite(gp.axes[6])) ? gp.axes[6] : 0;
    const hatY = (gp.axes && gp.axes.length > 7 && Number.isFinite(gp.axes[7])) ? gp.axes[7] : 0;

    if (axisX < -this.axisDeadzone || hatX < -this.axisDeadzone || this.isButtonPressed(gp, 14)) {
      active.add('left');
    }
    if (axisX > this.axisDeadzone || hatX > this.axisDeadzone || this.isButtonPressed(gp, 15)) {
      active.add('right');
    }
    // Jump: D-Pad Up (12), Left Stick Up, Hat Up, or Left Top Buttons (L1/LB = 4, L2/LT = 6)
    if (
      axisY < -this.jumpAxisThreshold ||
      hatY < -this.jumpAxisThreshold ||
      this.isButtonPressed(gp, 12) ||
      this.isButtonPressed(gp, 4) ||
      this.isButtonPressed(gp, 6, this.triggerThreshold)
    ) {
      active.add('jump');
    }
    if (axisY > this.axisDeadzone || hatY > this.axisDeadzone || this.isButtonPressed(gp, 13)) {
      active.add('crouch');
    }

    // --- 6 ATTACKS ---
    // Buttons 1 - 4 (Face buttons indices 0, 1, 2, 3)
    if (this.isButtonPressed(gp, 0)) active.add('attack1'); // Button 1: Poo Attack
    if (this.isButtonPressed(gp, 1)) active.add('attack2'); // Button 2: Hairball Attack
    if (this.isButtonPressed(gp, 2)) active.add('attack3'); // Button 3: Furious Scratch
    if (this.isButtonPressed(gp, 3)) active.add('attack4'); // Button 4: Litter Throw

    // Right two 'Top' buttons (Right Bumper R1/RB = index 5, Right Trigger R2/RT = index 7)
    if (this.isButtonPressed(gp, 5)) active.add('attack5'); // Right Top 1 (RB/R1): Poop Grenade
    if (this.isButtonPressed(gp, 7, this.triggerThreshold)) active.add('attack6'); // Right Top 2 (RT/R2): Scramble Attack

    // --- PAUSE / START & MENU NAVIGATION ---
    if (this.isButtonPressed(gp, 9) || this.isButtonPressed(gp, 8)) {
      active.add('pause');
    }
    if (this.isButtonPressed(gp, 9)) active.add('start');
    if (this.isButtonPressed(gp, 8)) active.add('select');

    // Dedicated menu directional & confirm/cancel actions
    if (axisY < -this.jumpAxisThreshold || hatY < -this.jumpAxisThreshold || this.isButtonPressed(gp, 12)) {
      active.add('menuUp');
    }
    if (axisY > this.jumpAxisThreshold || hatY > this.jumpAxisThreshold || this.isButtonPressed(gp, 13)) {
      active.add('menuDown');
    }
    if (axisX < -this.jumpAxisThreshold || hatX < -this.jumpAxisThreshold || this.isButtonPressed(gp, 14)) {
      active.add('menuLeft');
    }
    if (axisX > this.jumpAxisThreshold || hatX > this.jumpAxisThreshold || this.isButtonPressed(gp, 15)) {
      active.add('menuRight');
    }
    // Button '3' (buttons[2], RHS bottom blue button) is the active/confirm button in menus
    // (also accepts buttons[0] for standard-mapped bottom face button)
    if (this.isButtonPressed(gp, 2) || this.isButtonPressed(gp, 0)) {
      active.add('menuConfirm');
    }
    if (this.isButtonPressed(gp, 1)) {
      active.add('menuBack'); // Button 2
    }

    return active;
  }

  // Poll gamepads at the beginning of each frame
  pollGamepads() {
    const prevCount = this.connectedGamepads.length;
    const pads = this.refreshConnectedGamepads();
    if (pads.length !== prevCount && typeof this.onGamepadStatusChange === 'function') {
      this.onGamepadStatusChange(pads);
    }

    // Read actions across ALL connected controllers and dynamically bind active controllers to P1 & P2
    const padActionsByIndex = new Map();
    const combinedAnyActions = new Set();

    for (let i = 0; i < pads.length; i++) {
      const gp = pads[i];
      const acts = this.readGamepadActions(gp);
      padActionsByIndex.set(gp.index, acts);
      for (const a of acts) combinedAnyActions.add(a);

      // If this controller has active input and isn't assigned to P1 or P2 yet, assign it
      if (acts.size > 0) {
        if (this.playerPadIndices[1] !== gp.index && this.playerPadIndices[2] !== gp.index) {
          if (this.playerPadIndices[1] === null) {
            this.playerPadIndices[1] = gp.index;
          } else if (this.playerPadIndices[2] === null) {
            this.playerPadIndices[2] = gp.index;
          }
        }
      }
    }

    // Fallback default assignment to first two connected pads
    const p1Pad =
      (this.playerPadIndices[1] !== null && pads.find(p => p.index === this.playerPadIndices[1])) ||
      pads[0] ||
      null;
    const p2Pad =
      (this.playerPadIndices[2] !== null && pads.find(p => p.index === this.playerPadIndices[2])) ||
      pads.find(p => !p1Pad || p.index !== p1Pad.index) ||
      null;

    const p1Actions = p1Pad ? (padActionsByIndex.get(p1Pad.index) || new Set()) : new Set();
    const p2Actions = p2Pad ? (padActionsByIndex.get(p2Pad.index) || new Set()) : new Set();

    const slots = [
      { key: 1, currentActions: p1Actions },
      { key: 2, currentActions: p2Actions },
      { key: 'any', currentActions: combinedAnyActions },
    ];

    for (const { key, currentActions } of slots) {
      const prevActions = this.gpPrevActionsDown[key];

      this.gpActionsDown[key] = currentActions;
      this.gpActionsJustPressed[key].clear();
      this.gpActionsJustReleased[key].clear();

      for (const act of currentActions) {
        if (!prevActions.has(act)) {
          this.gpActionsJustPressed[key].add(act);
          // Unlock audio context on first controller button press
          if (window.audio) {
            window.audio.ensureContext();
            window.audio.preloadAllTracks();
          }
        }
      }

      for (const act of prevActions) {
        if (!currentActions.has(act)) {
          this.gpActionsJustReleased[key].add(act);
        }
      }

      this.gpPrevActionsDown[key] = new Set(currentActions);
    }
  }

  // Trigger optional controller rumble/vibration for a player (1 or 2)
  vibrate(playerNumber, durationMs = 120, weakMagnitude = 0.4, strongMagnitude = 0.7) {
    try {
      const gp = this.connectedGamepads[playerNumber - 1];
      if (gp && gp.vibrationActuator && typeof gp.vibrationActuator.playEffect === 'function') {
        gp.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: durationMs,
          weakMagnitude,
          strongMagnitude,
        }).catch(() => {});
      }
    } catch (e) {}
  }

  // Check if any alias (keyboard or gamepad) for an action is currently held down
  isP1Action(action) {
    const keys = this.p1Bindings[action] || [];
    return keys.some(k => this.keysDown.has(k)) || this.gpActionsDown[1].has(action);
  }

  isP1ActionJustPressed(action) {
    const keys = this.p1Bindings[action] || [];
    return keys.some(k => this.justPressed.has(k)) || this.gpActionsJustPressed[1].has(action);
  }

  isP2Action(action) {
    const keys = this.p2Bindings[action] || [];
    return keys.some(k => this.keysDown.has(k)) || this.gpActionsDown[2].has(action);
  }

  isP2ActionJustPressed(action) {
    const keys = this.p2Bindings[action] || [];
    return keys.some(k => this.justPressed.has(k)) || this.gpActionsJustPressed[2].has(action);
  }

  isAnyGamepadAction(action) {
    return (
      this.gpActionsDown.any.has(action) ||
      this.gpActionsDown[1].has(action) ||
      this.gpActionsDown[2].has(action)
    );
  }

  isAnyGamepadActionJustPressed(action) {
    return (
      this.gpActionsJustPressed.any.has(action) ||
      this.gpActionsJustPressed[1].has(action) ||
      this.gpActionsJustPressed[2].has(action)
    );
  }

  isKeyJustPressed(code) {
    return this.justPressed.has(code);
  }

  isKeyDown(code) {
    return this.keysDown.has(code);
  }

  // Call at the very end of each frame
  update() {
    this.justPressed.clear();
    this.justReleased.clear();
    this.gpActionsJustPressed[1].clear();
    this.gpActionsJustPressed[2].clear();
    this.gpActionsJustPressed.any.clear();
    this.gpActionsJustReleased[1].clear();
    this.gpActionsJustReleased[2].clear();
    this.gpActionsJustReleased.any.clear();
  }
}

window.input = new InputManager();

