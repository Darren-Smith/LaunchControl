/**
 * Office - Procedural Ambient Audio & Sound Effects Engine
 * Uses Web Audio API so zero external audio files are required.
 */
class OfficeAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientGain = null;
    this.sfxGain = null;
    this.delayNode = null;
    this.delayFeedback = null;
    this.delayFilter = null;
    this.muted = false;
    this.ambientEnabled = true;
    this.sfxVolume = 0.7;
    this.ambientVolume = 0.28;
    this.ambientNodes = [];
    this.ambientInterval = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 1;
    this.masterGain.connect(this.ctx.destination);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = this.ambientEnabled ? this.ambientVolume : 0;
    this.ambientGain.connect(this.masterGain);

    // Warm tape-style ambient echo / delay line for delightful easy listening space
    this.delayNode = this.ctx.createDelay();
    this.delayNode.delayTime.value = 0.36; // 360ms gentle rhythmic delay
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = 0.22; // subtle warm repeats
    this.delayFilter = this.ctx.createBiquadFilter();
    this.delayFilter.type = 'lowpass';
    this.delayFilter.frequency.value = 1350; // warm tape roll-off

    this.delayNode.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayFilter.connect(this.ambientGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.masterGain);

    this.initialized = true;
    this.startAmbientLoop();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this.init();
    this.setMuted(!this.muted);
    return this.muted;
  }

  setAmbientVolume(val) {
    this.ambientVolume = val;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.ambientEnabled ? val : 0, this.ctx.currentTime, 0.08);
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = val;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Plays a single note of the easy-listening melody with rich Fender Rhodes / vibraphone timbre
   */
  playMelodyNote(freq, startTimeOffset, duration = 1.4, velocity = 0.9) {
    if (!this.ctx || this.muted || !this.ambientEnabled || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime + startTimeOffset;

    // 1. Primary Warm Bell / Electric Piano Oscillator (Pure Sine)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    // 2. Gentle Tine Mallet Overtone (Octave harmonic, fast attack, quick decay)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);

    // 3. Subtle Warm Detune Chorus (+1.4 Hz)
    const osc3 = this.ctx.createOscillator();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(freq + 1.4, now);

    // Master filter for melody note (soft and warm, silky smooth)
    const noteFilter = this.ctx.createBiquadFilter();
    noteFilter.type = 'lowpass';
    noteFilter.frequency.setValueAtTime(2100, now);

    // Main envelope gain
    const noteGain = this.ctx.createGain();
    const peakGain = 0.046 * velocity;
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(peakGain, now + 0.022);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Tine gain (fast decay for physical mallet strike sensation)
    const tineGain = this.ctx.createGain();
    tineGain.gain.setValueAtTime(0.0001, now);
    tineGain.gain.linearRampToValueAtTime(peakGain * 0.32, now + 0.015);
    tineGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

    // Detune chorus gain
    const detuneGain = this.ctx.createGain();
    detuneGain.gain.setValueAtTime(0.0001, now);
    detuneGain.gain.linearRampToValueAtTime(peakGain * 0.20, now + 0.03);
    detuneGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);

    // Routing
    osc1.connect(noteGain);
    osc2.connect(tineGain);
    tineGain.connect(noteGain);
    osc3.connect(detuneGain);
    detuneGain.connect(noteGain);
    noteGain.connect(noteFilter);

    // Dry bus
    noteFilter.connect(this.ambientGain);

    // Wet bus into tape echo / delay
    if (this.delayNode) {
      const sendGain = this.ctx.createGain();
      sendGain.gain.setValueAtTime(0.32, now);
      noteFilter.connect(sendGain);
      sendGain.connect(this.delayNode);
    }

    // Playback
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    const stopTime = now + duration + 0.05;
    osc1.stop(stopTime);
    osc2.stop(now + 0.30);
    osc3.stop(stopTime);
  }

  startAmbientLoop() {
    if (!this.ctx || this.ambientInterval) return;

    // Harmonic Chord Progression: Cmaj7 -> Am7 -> Fmaj7 -> G6
    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7 (C4, E4, G4, B4)
      [220.00, 261.63, 329.63, 392.00], // Am7 (A3, C4, E4, G4)
      [174.61, 220.00, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
      [196.00, 246.94, 293.66, 392.00]  // G6 (G3, B3, D4, G4)
    ];

    // Reference note frequencies (Hz) for delightful easy-listening melody
    const N = {
      E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
      C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98
    };

    // 8-Measure Easy Listening Melody: Perfectly harmonizes over the chords with two musical phrases (Theme & Variation)
    const melodyPhrases = [
      // Measure 1 (over Cmaj7): Warm rising sparkle
      [
        { freq: N.G5, t: 0.5, dur: 1.2, vel: 0.85 },
        { freq: N.B5, t: 1.1, dur: 1.2, vel: 0.85 },
        { freq: N.C6, t: 1.7, dur: 1.4, vel: 0.95 },
        { freq: N.E6, t: 2.4, dur: 1.6, vel: 1.0 },
        { freq: N.D6, t: 3.6, dur: 1.5, vel: 0.8 }
      ],
      // Measure 2 (over Am7): Gentle answer & descent
      [
        { freq: N.C6, t: 0.5, dur: 1.2, vel: 0.9 },
        { freq: N.B5, t: 1.2, dur: 1.1, vel: 0.85 },
        { freq: N.A5, t: 1.9, dur: 1.3, vel: 0.9 },
        { freq: N.G5, t: 2.7, dur: 1.2, vel: 0.85 },
        { freq: N.E5, t: 3.5, dur: 1.6, vel: 0.8 }
      ],
      // Measure 3 (over Fmaj7): Dreamy lilt
      [
        { freq: N.A5, t: 0.4, dur: 1.2, vel: 0.85 },
        { freq: N.C6, t: 1.1, dur: 1.2, vel: 0.9 },
        { freq: N.E6, t: 1.8, dur: 1.5, vel: 0.95 },
        { freq: N.G6, t: 2.5, dur: 1.6, vel: 1.0 },
        { freq: N.E6, t: 3.4, dur: 1.6, vel: 0.85 }
      ],
      // Measure 4 (over G6): Turn & turnaround
      [
        { freq: N.D6, t: 0.5, dur: 1.2, vel: 0.9 },
        { freq: N.B5, t: 1.3, dur: 1.2, vel: 0.85 },
        { freq: N.A5, t: 2.1, dur: 1.2, vel: 0.85 },
        { freq: N.G5, t: 2.9, dur: 1.3, vel: 0.9 },
        { freq: N.B5, t: 3.7, dur: 1.4, vel: 0.85 }
      ],
      // Measure 5 (over Cmaj7): Playful upbeat variation
      [
        { freq: N.E5, t: 0.4, dur: 1.1, vel: 0.85 },
        { freq: N.G5, t: 0.9, dur: 1.1, vel: 0.9 },
        { freq: N.C6, t: 1.5, dur: 1.3, vel: 0.95 },
        { freq: N.D6, t: 2.1, dur: 1.2, vel: 0.9 },
        { freq: N.E6, t: 2.8, dur: 1.6, vel: 1.0 },
        { freq: N.C6, t: 3.6, dur: 1.5, vel: 0.85 }
      ],
      // Measure 6 (over Am7): Flowing response
      [
        { freq: N.E6, t: 0.5, dur: 1.2, vel: 0.95 },
        { freq: N.D6, t: 1.2, dur: 1.2, vel: 0.9 },
        { freq: N.C6, t: 1.9, dur: 1.3, vel: 0.9 },
        { freq: N.A5, t: 2.6, dur: 1.4, vel: 0.85 },
        { freq: N.C6, t: 3.5, dur: 1.5, vel: 0.85 }
      ],
      // Measure 7 (over Fmaj7): Uplifting climb
      [
        { freq: N.C6, t: 0.4, dur: 1.2, vel: 0.85 },
        { freq: N.D6, t: 1.1, dur: 1.2, vel: 0.9 },
        { freq: N.E6, t: 1.8, dur: 1.4, vel: 0.95 },
        { freq: N.F6, t: 2.6, dur: 1.5, vel: 1.0 },
        { freq: N.E6, t: 3.4, dur: 1.6, vel: 0.85 }
      ],
      // Measure 8 (over G6): Satisfying resolution home to C
      [
        { freq: N.D6, t: 0.4, dur: 1.1, vel: 0.9 },
        { freq: N.C6, t: 1.1, dur: 1.2, vel: 0.85 },
        { freq: N.B5, t: 1.8, dur: 1.2, vel: 0.85 },
        { freq: N.D6, t: 2.5, dur: 1.4, vel: 0.9 },
        { freq: N.C6, t: 3.4, dur: 1.8, vel: 0.95 }
      ]
    ];

    let measureIdx = 0;

    const playAmbientMeasure = () => {
      if (!this.ctx || this.muted || !this.ambientEnabled || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      const chordNotes = chords[measureIdx % chords.length];
      const melodyNotes = melodyPhrases[measureIdx % melodyPhrases.length];
      measureIdx++;

      // 1. Harmonized Warm Pad Chord (Low register)
      chordNotes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(750, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.038, now + 1.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 5.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ambientGain);

        osc.start(now);
        osc.stop(now + 5.4);
      });

      // 2. Delightful Harmonizing Easy Listening Melody (High register with echo)
      melodyNotes.forEach(item => {
        this.playMelodyNote(item.freq, item.t, item.dur, item.vel);
      });
    };

    playAmbientMeasure();
    this.ambientInterval = setInterval(playAmbientMeasure, 5400);
  }

  playTone(freq, type, duration, startTimeOffset = 0, peakGain = 0.25, slideFreq = null) {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime + startTimeOffset;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideFreq, now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playCardPlace() {
    this.playTone(320, 'triangle', 0.07, 0, 0.14, 180);
    this.playTone(780, 'sine', 0.05, 0.05, 0.08, 920);
  }

  playScan() {
    this.playTone(880, 'sine', 0.08, 0, 0.15, 1320);
    this.playTone(1320, 'sine', 0.1, 0.08, 0.15, 1760);
  }

  playAllow() {
    // Pleasant security door unlock & green chime
    this.playTone(523.25, 'sine', 0.16, 0, 0.25);     // C5
    this.playTone(659.25, 'sine', 0.18, 0.09, 0.25);  // E5
    this.playTone(783.99, 'triangle', 0.28, 0.18, 0.28); // G5
  }

  playDeny() {
    // Firm stamp & security gate lock
    this.playTone(300, 'sawtooth', 0.12, 0, 0.18, 210);
    this.playTone(220, 'square', 0.18, 0.1, 0.16, 155);
  }

  playCaughtFakeBonus() {
    // Crisp detective chime when a fake ID is rightly denied
    this.playTone(440, 'triangle', 0.12, 0, 0.22);
    this.playTone(554.37, 'triangle', 0.12, 0.08, 0.22);
    this.playTone(659.25, 'triangle', 0.14, 0.16, 0.24);
    this.playTone(880, 'sine', 0.28, 0.24, 0.28);
  }

  playMistake() {
    // Low warning buzzer when a fake ID slips through or good teacher denied
    this.playTone(165, 'sawtooth', 0.25, 0, 0.28, 130);
    this.playTone(138, 'sawtooth', 0.38, 0.22, 0.30, 98);
  }

  playCoffee() {
    // Pouring & warm energizing chime
    this.playTone(392.00, 'sine', 0.12, 0.0, 0.2);
    this.playTone(493.88, 'sine', 0.12, 0.09, 0.22);
    this.playTone(587.33, 'sine', 0.12, 0.18, 0.24);
    this.playTone(783.99, 'triangle', 0.35, 0.27, 0.28);
  }

  playDayComplete() {
    // Classic school bell / chime progression
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((n, idx) => {
      this.playTone(n, 'triangle', 0.32, idx * 0.11, 0.24);
    });
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
    const times = [0, 0.12, 0.24, 0.36, 0.55, 0.70];
    notes.forEach((n, idx) => {
      this.playTone(n, 'triangle', 0.35, times[idx], 0.28);
    });
  }

  playGameOver() {
    const notes = [392.00, 369.99, 349.23, 329.63];
    notes.forEach((n, idx) => {
      this.playTone(n, 'sawtooth', 0.36, idx * 0.22, 0.22, n * 0.94);
    });
  }
}

window.officeAudio = new OfficeAudio();
