// Cat Fighters - Multi-Player Input Handler
// Handles simultaneous keypresses for Player 1 and Player 2 with Numpad & Laptop fallbacks.

class InputManager {
  constructor() {
    this.keysDown = new Set();
    this.justPressed = new Set();
    this.justReleased = new Set();

    // Player 1 bindings (Strictly physical top-row numbers and WASD)
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

    // Player 2 bindings (Strictly Numpad & Laptop fallbacks, zero overlap with P1)
    this.p2Bindings = {
      left: ['ArrowLeft'],
      right: ['ArrowRight'],
      jump: ['ArrowUp'],
      crouch: ['ArrowDown'],
      // Standard Numpad (NumLock on/off) + Laptop fallbacks (U, I, O, P, [, ])
      attack1: ['Numpad1', 'NumpadEnd', 'KeyU', 'KeyJ'],             // Poo attack
      attack2: ['Numpad2', 'NumpadDown', 'KeyI', 'KeyK'],            // Hairball attack
      attack3: ['Numpad3', 'NumpadPageDown', 'KeyO', 'KeyL'],        // Scratch
      attack4: ['Numpad4', 'NumpadLeft', 'KeyP', 'Semicolon'],       // Litter throw
      attack5: ['Numpad5', 'NumpadClear', 'BracketLeft', 'Quote'],   // Poop grenade
      attack6: ['Numpad6', 'NumpadRight', 'BracketRight', 'Backslash'],// Scramble attack
    };

    this.initListeners();
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      // Resume audio context on user interaction
      if (window.audio) {
        window.audio.ensureContext();
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
    });
  }

  // Check if any alias for an action is currently held down
  isP1Action(action) {
    const keys = this.p1Bindings[action] || [];
    return keys.some(k => this.keysDown.has(k));
  }

  isP1ActionJustPressed(action) {
    const keys = this.p1Bindings[action] || [];
    return keys.some(k => this.justPressed.has(k));
  }

  isP2Action(action) {
    const keys = this.p2Bindings[action] || [];
    return keys.some(k => this.keysDown.has(k));
  }

  isP2ActionJustPressed(action) {
    const keys = this.p2Bindings[action] || [];
    return keys.some(k => this.justPressed.has(k));
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
  }
}

window.input = new InputManager();
