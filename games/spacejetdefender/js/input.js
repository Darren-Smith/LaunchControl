// ============================================================================
// SPACEJET DEFENDER - Gamepad API & Keyboard Backup Input Controller
// ============================================================================

class InputController {
  constructor() {
    this.keys = {};
    this.prevKeys = {};
    this.justPressedKeys = {};

    this.gamepadConnected = false;
    this.gamepadName = '';
    this.gamepadIndex = null;
    this.prevPadButtons = {};
    this.padJustPressed = {};

    // Directional menu navigation state (supports Analog Stick, D-Pad buttons, D-Pad hat axes, & Keyboard)
    this.navDirX = 0; // -1, 0, 1
    this.navDirY = 0; // -1, 0, 1
    this.prevNavDirX = 0;
    this.prevNavDirY = 0;
    this.navRepeatTimerX = 0;
    this.navRepeatTimerY = 0;
    this.lastUpdateTime = performance.now();

    this.moveX = 0;
    this.moveY = 0;
    this.fireHeld = false;
    this.fireJustPressed = false;
    this.specialHeld = false;
    this.specialJustPressed = false;
    this.pauseJustPressed = false;
    this.upJustPressed = false;
    this.downJustPressed = false;
    this.leftJustPressed = false;
    this.rightJustPressed = false;
    this.confirmJustPressed = false;
    this.cancelJustPressed = false;

    this.lastActiveDevice = 'NOT DETECTED';
    this.typedCharQueue = [];

    this.initListeners();
  }

  getControllerStatus() {
    return this.gamepadConnected ? 'CONNECTED' : 'NOT DETECTED';
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      window.audio.init();
      this.keys[e.code] = true;

      // Collect typed characters for Name Entry screen
      if (e.key === 'Backspace') {
        this.typedCharQueue.push('BACKSPACE');
      } else if (e.key === 'Enter') {
        this.typedCharQueue.push('ENTER');
      } else if (e.key.length === 1 && /^[a-zA-Z0-9 _\-!]$/.test(e.key)) {
        this.typedCharQueue.push(e.key);
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('pointerdown', () => {
      window.audio.init();
    });

    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadConnected = true;
      this.gamepadIndex = e.gamepad.index;
      this.gamepadName = 'CONNECTED';
      this.lastActiveDevice = 'CONNECTED';
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadConnected = false;
        this.gamepadIndex = null;
        this.lastActiveDevice = 'NOT DETECTED';
      }
    });
  }

  consumeTypedChars() {
    const out = this.typedCharQueue.slice();
    this.typedCharQueue.length = 0;
    return out;
  }

  rumble(durationMs = 120, weak = 0.4, strong = 0.6) {
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    const pad = pads[this.gamepadIndex ?? 0];
    if (pad && pad.vibrationActuator && pad.vibrationActuator.playEffect) {
      pad.vibrationActuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration: durationMs,
        weakMagnitude: weak,
        strongMagnitude: strong
      }).catch(() => {});
    }
  }

  update() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastUpdateTime) / 1000);
    this.lastUpdateTime = now;

    // 1. Compute keyboard edge triggers
    this.justPressedKeys = {};
    for (const code in this.keys) {
      if (this.keys[code] && !this.prevKeys[code]) {
        this.justPressedKeys[code] = true;
      }
      this.prevKeys[code] = !!this.keys[code];
    }

    // 2. Poll Gamepad
    let pad = null;
    if (navigator.getGamepads) {
      const pads = navigator.getGamepads();
      for (let i = 0; i < pads.length; i++) {
        if (pads[i] && pads[i].connected) {
          pad = pads[i];
          this.gamepadConnected = true;
          this.gamepadIndex = i;
          this.lastActiveDevice = 'CONNECTED';
          break;
        }
      }
      if (!pad) {
        this.gamepadConnected = false;
        this.lastActiveDevice = 'NOT DETECTED';
      }
    }

    this.padJustPressed = {};
    let padMoveX = 0;
    let padMoveY = 0;
    let padFire = false;
    let padSpecial = false;

    if (pad) {
      const btn = (idx) => !!(pad.buttons[idx] && (pad.buttons[idx].pressed || pad.buttons[idx].value > 0.35));
      for (let i = 0; i < pad.buttons.length; i++) {
        const pressed = btn(i);
        if (pressed && !this.prevPadButtons[i]) {
          this.padJustPressed[i] = true;
          window.audio.init();
        }
        this.prevPadButtons[i] = pressed;
      }

      const deadzone = 0.2;
      const ax0 = pad.axes[0] || 0; // Left Stick X
      const ax1 = pad.axes[1] || 0; // Left Stick Y
      if (Math.abs(ax0) > deadzone) {
        padMoveX = ax0;
        window.audio.init();
      }
      if (Math.abs(ax1) > deadzone) {
        padMoveY = ax1;
        window.audio.init();
      }

      // Check D-Pad Hat Axes (axes[6]/axes[7] on many Linux / DirectInput controllers)
      if (pad.axes.length >= 8) {
        const hatX = pad.axes[6] || 0;
        const hatY = pad.axes[7] || 0;
        if (Math.abs(hatX) > 0.5 && Math.abs(hatX) <= 1.05) {
          padMoveX = hatX > 0 ? 1 : -1;
          window.audio.init();
        }
        if (Math.abs(hatY) > 0.5 && Math.abs(hatY) <= 1.05) {
          padMoveY = hatY > 0 ? 1 : -1;
          window.audio.init();
        }
      }

      // Standard Gamepad D-Pad Buttons (12 = Up, 13 = Down, 14 = Left, 15 = Right)
      if (btn(14)) padMoveX = -1;
      if (btn(15)) padMoveX = 1;
      if (btn(12)) padMoveY = -1;
      if (btn(13)) padMoveY = 1;

      padFire = btn(0) || btn(2) || btn(5) || btn(7);
      padSpecial = btn(1) || btn(3) || btn(4) || btn(6);
    }

    // 3. Keyboard movement axes
    let kbX = 0;
    let kbY = 0;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) kbX -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) kbX += 1;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) kbY -= 1;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) kbY += 1;

    if (kbX !== 0 && kbY !== 0) {
      kbX *= 0.7071;
      kbY *= 0.7071;
    }

    this.moveX = Math.abs(padMoveX) > 0 ? padMoveX : kbX;
    this.moveY = Math.abs(padMoveY) > 0 ? padMoveY : kbY;

    // 4. Compute discrete menu navigation pulses (Up/Down/Left/Right) from Gamepad Stick, D-Pad & Keyboard
    // Uses a 0.45 threshold on analog sticks plus smooth auto-repeat when held
    const navThreshold = 0.45;
    let curDirX = 0;
    let curDirY = 0;

    if (padMoveX < -navThreshold || btnPressedOrKey(this.keys, ['ArrowLeft'])) curDirX = -1;
    else if (padMoveX > navThreshold || btnPressedOrKey(this.keys, ['ArrowRight'])) curDirX = 1;

    if (padMoveY < -navThreshold || btnPressedOrKey(this.keys, ['ArrowUp'])) curDirY = -1;
    else if (padMoveY > navThreshold || btnPressedOrKey(this.keys, ['ArrowDown'])) curDirY = 1;

    let padLeftPulse = false;
    let padRightPulse = false;
    let padUpPulse = false;
    let padDownPulse = false;

    if (curDirX !== 0) {
      if (curDirX !== this.prevNavDirX) {
        if (curDirX < 0) padLeftPulse = true;
        if (curDirX > 0) padRightPulse = true;
        this.navRepeatTimerX = 0.28; // Initial repeat delay
      } else {
        this.navRepeatTimerX -= dt;
        if (this.navRepeatTimerX <= 0) {
          if (curDirX < 0) padLeftPulse = true;
          if (curDirX > 0) padRightPulse = true;
          this.navRepeatTimerX = 0.11; // Fast repeat interval
        }
      }
    } else {
      this.navRepeatTimerX = 0;
    }

    if (curDirY !== 0) {
      if (curDirY !== this.prevNavDirY) {
        if (curDirY < 0) padUpPulse = true;
        if (curDirY > 0) padDownPulse = true;
        this.navRepeatTimerY = 0.28;
      } else {
        this.navRepeatTimerY -= dt;
        if (this.navRepeatTimerY <= 0) {
          if (curDirY < 0) padUpPulse = true;
          if (curDirY > 0) padDownPulse = true;
          this.navRepeatTimerY = 0.11;
        }
      }
    } else {
      this.navRepeatTimerY = 0;
    }

    this.prevNavDirX = curDirX;
    this.prevNavDirY = curDirY;

    // 5. Action Buttons & Menu Triggers
    const kbFire = !!(this.keys['Space'] || this.keys['KeyZ'] || this.keys['KeyJ'] || this.keys['Enter']);
    const kbSpecial = !!(this.keys['KeyX'] || this.keys['KeyK'] || this.keys['ShiftLeft'] || this.keys['ShiftRight']);

    this.fireHeld = padFire || kbFire;
    this.specialHeld = padSpecial || kbSpecial;

    this.fireJustPressed = !!(
      this.justPressedKeys['Space'] ||
      this.justPressedKeys['KeyZ'] ||
      this.justPressedKeys['KeyJ'] ||
      this.padJustPressed[0] ||
      this.padJustPressed[2] ||
      this.padJustPressed[5] ||
      this.padJustPressed[7]
    );

    this.specialJustPressed = !!(
      this.justPressedKeys['KeyX'] ||
      this.justPressedKeys['KeyK'] ||
      this.justPressedKeys['ShiftLeft'] ||
      this.padJustPressed[1] ||
      this.padJustPressed[3] ||
      this.padJustPressed[4] ||
      this.padJustPressed[6]
    );

    this.pauseJustPressed = !!(
      this.justPressedKeys['KeyP'] ||
      this.justPressedKeys['Escape'] ||
      this.padJustPressed[9] ||
      this.padJustPressed[8]
    );

    this.upJustPressed = !!(
      padUpPulse ||
      this.justPressedKeys['ArrowUp'] ||
      this.justPressedKeys['KeyW'] ||
      this.padJustPressed[12]
    );
    this.downJustPressed = !!(
      padDownPulse ||
      this.justPressedKeys['ArrowDown'] ||
      this.justPressedKeys['KeyS'] ||
      this.padJustPressed[13]
    );
    this.leftJustPressed = !!(
      padLeftPulse ||
      this.justPressedKeys['ArrowLeft'] ||
      this.justPressedKeys['KeyA'] ||
      this.padJustPressed[14]
    );
    this.rightJustPressed = !!(
      padRightPulse ||
      this.justPressedKeys['ArrowRight'] ||
      this.justPressedKeys['KeyD'] ||
      this.padJustPressed[15]
    );

    this.confirmJustPressed = !!(
      this.justPressedKeys['Enter'] ||
      this.justPressedKeys['Space'] ||
      this.padJustPressed[0] ||
      this.padJustPressed[2] ||
      this.padJustPressed[9]
    );

    this.cancelJustPressed = !!(
      this.justPressedKeys['Escape'] ||
      this.padJustPressed[1]
    );
  }
}

function btnPressedOrKey(keys, codes) {
  for (let i = 0; i < codes.length; i++) {
    if (keys[codes[i]]) return true;
  }
  return false;
}

window.input = new InputController();
