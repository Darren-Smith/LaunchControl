// Cat Fighters - 8-Bit Chiptune Web Audio Synthesizer Engine
// Fully standalone: Generates retro music and sound effects in real time via Web Audio API.

class ChiptuneAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.sfxVolume = 0.7;
    this.musicVolume = 0.45;
    this.bgmPlaying = false;
    this.currentTrack = null;
    this.stepIndex = 0;
    this.tempo = 140; // BPM
    this.timerId = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.noiseBuffer = null;

    // Tunic8-Bit rendered soundtrack manifests & buffer cache
    this.tracks = {
      battle: 'assets/audio/Cat_Rooftop_Brawl.ogg',
      title: 'assets/audio/Cat_Fighters_Arcade_Title.ogg',
      victory: 'assets/audio/Victory_Jingle.ogg'
    };
    this.audioBuffers = {};
    this.currentBgmSource = null;
    this.currentTrackName = null;
    this.loadingPromises = {};

    // Load saved settings
    try {
      const savedMute = localStorage.getItem('catfighters_muted');
      if (savedMute !== null) this.isMuted = savedMute === 'true';
    } catch (e) {
      console.warn('LocalStorage unavailable for audio', e);
    }
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    // Create 1-second white noise buffer for drums & explosive effects
    const bufferSize = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- TUNIC8-BIT AUDIO ASSET LOADER ---

  async loadTrackBuffer(key) {
    if (!this.ctx) this.init();
    if (!this.ctx) return null;
    if (this.audioBuffers[key]) return this.audioBuffers[key];
    if (this.loadingPromises[key]) return this.loadingPromises[key];

    const url = this.tracks[key];
    if (!url) return null;

    this.loadingPromises[key] = (async () => {
      try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const arrayBuffer = await resp.arrayBuffer();
        const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.audioBuffers[key] = audioBuffer;
        delete this.loadingPromises[key];
        return audioBuffer;
      } catch (err) {
        console.warn(`[Tunic8-Bit] Failed loading track '${key}':`, err);
        delete this.loadingPromises[key];
        return null;
      }
    })();

    return this.loadingPromises[key];
  }

  preloadAllTracks() {
    this.ensureContext();
    if (this.ctx) {
      Object.keys(this.tracks).forEach(key => this.loadTrackBuffer(key));
    }
  }

  setMute(muted) {
    this.isMuted = muted;
    try {
      localStorage.setItem('catfighters_muted', muted);
    } catch (e) {}
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  toggleMute() {
    return this.setMute(!this.isMuted);
  }

  // Helper note frequency converter (A4 = 440)
  noteFreq(note, octave) {
    const notes = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
    const semitonesFromA4 = (notes[note] || 0) + (octave - 4) * 12 - 9;
    return 440 * Math.pow(2, semitonesFromA4 / 12);
  }

  // --- SOUND EFFECTS ---

  playJump() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  playMeow(pitchMultiplier = 1) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    filter.type = 'bandpass';
    filter.Q.value = 4.0;

    // Meow vocal envelope: starts high, slides up then down (m-e-o-w)
    const baseFreq = 480 * pitchMultiplier;
    osc.frequency.setValueAtTime(baseFreq * 0.8, now);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.3, now + 0.1);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.7, now + 0.35);

    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(1800, now + 0.12);
    filter.frequency.linearRampToValueAtTime(600, now + 0.35);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  playScratch() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.linearRampToValueAtTime(3500, now + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.13);

    // Also add a quick high square chirp
    const chirp = this.ctx.createOscillator();
    const chirpGain = this.ctx.createGain();
    chirp.type = 'sawtooth';
    chirp.frequency.setValueAtTime(1200, now);
    chirp.frequency.exponentialRampToValueAtTime(300, now + 0.1);
    chirpGain.gain.setValueAtTime(0.2, now);
    chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    chirp.connect(chirpGain);
    chirpGain.connect(this.sfxGain);
    chirp.start(now);
    chirp.stop(now + 0.11);
  }

  playKick() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  playPooLaunch() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Comical wet whoosh / downward spring slide
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(650, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.22);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  playSplat() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.linearRampToValueAtTime(200, now + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.16);

    // Wet blip
    const blip = this.ctx.createOscillator();
    const blipGain = this.ctx.createGain();
    blip.type = 'sine';
    blip.frequency.setValueAtTime(220, now);
    blip.frequency.exponentialRampToValueAtTime(90, now + 0.1);
    blipGain.gain.setValueAtTime(0.4, now);
    blipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    blip.connect(blipGain);
    blipGain.connect(this.sfxGain);
    blip.start(now);
    blip.stop(now + 0.11);
  }

  playHairballCough() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Hacking cough burst (square pulses)
    for (let i = 0; i < 2; i++) {
      const t = now + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.linearRampToValueAtTime(70, t + 0.06);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.07);
    }

    // Wet spit projectile launch
    const spit = this.ctx.createOscillator();
    const spitGain = this.ctx.createGain();
    spit.type = 'sine';
    spit.frequency.setValueAtTime(450, now + 0.16);
    spit.frequency.exponentialRampToValueAtTime(120, now + 0.3);
    spitGain.gain.setValueAtTime(0.4, now + 0.16);
    spitGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    spit.connect(spitGain);
    spitGain.connect(this.sfxGain);
    spit.start(now + 0.16);
    spit.stop(now + 0.31);
  }

  playHairballSplat() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Gooey sticky splat
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.22);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  playScrambleSpin() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Rapid rotating whooshes
    for (let i = 0; i < 4; i++) {
      const t = now + i * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300 + i * 80, t);
      osc.frequency.linearRampToValueAtTime(600 + i * 100, t + 0.06);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.07);
    }
  }

  playPoisonTick() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Low toxic bubble pop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playLitterThrow() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    // Granular burst
    for (let i = 0; i < 4; i++) {
      const offset = i * 0.035;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400 + i * 300, now + offset);
      filter.Q.value = 6;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now + offset);
      noise.stop(now + offset + 0.09);
    }
  }

  playFuse() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(4000, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.06);
  }

  playExplosion() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;

    // Heavy bass impact
    const bass = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bass.type = 'triangle';
    bass.frequency.setValueAtTime(150, now);
    bass.frequency.exponentialRampToValueAtTime(30, now + 0.5);
    bassGain.gain.setValueAtTime(0.7, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    bass.connect(bassGain);
    bassGain.connect(this.sfxGain);
    bass.start(now);
    bass.stop(now + 0.51);

    // Noise boom
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.6);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.61);
  }

  playHit() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  playKO() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const notes = [220, 196, 174, 146, 110];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.12;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  playRoundIntro() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Crisp ascending fanfare chord
    const freqs = [330, 440, 554, 659];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.08;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  playFightGong() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Resonant brassy synth strike
    const freqs = [440, 880, 1320];
    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.66);
    });
  }

  playVictory() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    // Use Tunic8-Bit rendered Victory Jingle if available
    if (this.audioBuffers['victory'] || this.tracks['victory']) {
      this.playVictoryBGM();
      return;
    }

    // Procedural fanfare fallback
    const now = this.ctx.currentTime;
    const melody = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.15 }, // G5
      { f: 1046.50, d: 0.4 }  // C6
    ];

    let t = now;
    melody.forEach(item => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(item.f, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + item.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + item.d + 0.02);
      t += item.d;
    });
  }

  // --- TUNIC8-BIT BGM PLAYER & PROCEDURAL FALLBACK ---

  async playBGM(key, loop = true) {
    this.ensureContext();
    if (!this.ctx) return;

    // If already playing this track in looping mode, do not restart
    if (this.bgmPlaying && this.currentTrackName === key && loop && this.currentBgmSource) {
      return;
    }

    // Stop current track without wiping currentTrackName intent
    this.stopBGM(false);

    this.bgmPlaying = true;
    this.currentTrackName = key;

    let buffer = this.audioBuffers[key];
    if (!buffer) {
      buffer = await this.loadTrackBuffer(key);
    }

    // Guard against race conditions if track changed while loading
    if (!this.bgmPlaying || this.currentTrackName !== key) return;

    if (buffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = loop;
        source.connect(this.musicGain);

        source.onended = () => {
          if (loop && this.bgmPlaying && this.currentTrackName === key) {
            // Failsafe auto-loop: if browser ends playback despite loop=true, immediately re-loop
            this.currentBgmSource = null;
            this.playBGM(key, true);
          } else if (!loop && this.currentBgmSource === source) {
            this.currentBgmSource = null;
            this.bgmPlaying = false;
          }
        };

        source.start(0);
        this.currentBgmSource = source;
      } catch (err) {
        console.warn(`[Tunic8-Bit] Error playing audio buffer '${key}':`, err);
        if (key === 'battle') this.startProceduralBGM();
      }
    } else {
      // Fallback to procedural synth if track audio file couldn't be loaded
      if (key === 'battle') {
        this.startProceduralBGM();
      }
    }
  }

  playBattleBGM() {
    return this.playBGM('battle', true);
  }

  playTitleBGM() {
    return this.playBGM('title', true);
  }

  playVictoryBGM() {
    return this.playBGM('victory', false);
  }

  // Legacy alias
  startBGM() {
    return this.playBattleBGM();
  }

  stopBGM(resetTrackName = true) {
    this.bgmPlaying = false;
    if (resetTrackName) {
      this.currentTrackName = null;
    }

    if (this.currentBgmSource) {
      try {
        this.currentBgmSource.stop();
        this.currentBgmSource.disconnect();
      } catch (e) {}
      this.currentBgmSource = null;
    }

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  startProceduralBGM() {
    this.ensureContext();
    if (this.currentBgmSource || !this.ctx) return;
    this.bgmPlaying = true;
    this.stepIndex = 0;

    const melodySteps = [
      { f: 440, len: 1 }, { f: 523, len: 1 }, { f: 587, len: 1 }, { f: 659, len: 1 },
      { f: 587, len: 1 }, { f: 523, len: 1 }, { f: 440, len: 2 }, { f: 392, len: 1 },
      { f: 440, len: 1 }, { f: 523, len: 1 }, { f: 659, len: 1 }, { f: 784, len: 2 }, { f: 659, len: 2 },
    ];
    const bassSteps = [
      220, 220, 164.8, 164.8, 174.6, 174.6, 196, 196,
      220, 220, 164.8, 164.8, 174.6, 174.6, 196, 246.9
    ];
    const stepDuration = 60 / this.tempo / 2;

    const tick = () => {
      if (!this.bgmPlaying || !this.ctx || this.currentBgmSource) return;

      const now = this.ctx.currentTime;
      const step16 = this.stepIndex % 16;

      if (!this.isMuted) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bassSteps[step16] / 2, now);
        bassGain.gain.setValueAtTime(0.35, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 0.9);
        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGain);
        bassOsc.start(now);
        bassOsc.stop(now + stepDuration);
      }

      if (!this.isMuted && this.noiseBuffer) {
        if (step16 === 0 || step16 === 8) {
          const kOsc = this.ctx.createOscillator();
          const kGain = this.ctx.createGain();
          kOsc.type = 'sine';
          kOsc.frequency.setValueAtTime(140, now);
          kOsc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
          kGain.gain.setValueAtTime(0.4, now);
          kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          kOsc.connect(kGain);
          kGain.connect(this.musicGain);
          kOsc.start(now);
          kOsc.stop(now + 0.11);
        } else if (step16 === 4 || step16 === 12) {
          const sNoise = this.ctx.createBufferSource();
          sNoise.buffer = this.noiseBuffer;
          const sFilter = this.ctx.createBiquadFilter();
          sFilter.type = 'highpass';
          sFilter.frequency.setValueAtTime(1000, now);
          const sGain = this.ctx.createGain();
          sGain.gain.setValueAtTime(0.3, now);
          sGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
          sNoise.connect(sFilter);
          sFilter.connect(sGain);
          sGain.connect(this.musicGain);
          sNoise.start(now);
          sNoise.stop(now + 0.13);
        } else if (step16 % 2 === 0) {
          const hNoise = this.ctx.createBufferSource();
          hNoise.buffer = this.noiseBuffer;
          const hFilter = this.ctx.createBiquadFilter();
          hFilter.type = 'highpass';
          hFilter.frequency.setValueAtTime(6000, now);
          const hGain = this.ctx.createGain();
          hGain.gain.setValueAtTime(0.12, now);
          hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          hNoise.connect(hFilter);
          hFilter.connect(hGain);
          hGain.connect(this.musicGain);
          hNoise.start(now);
          hNoise.stop(now + 0.05);
        }
      }

      if (!this.isMuted) {
        const leadIdx = this.stepIndex % melodySteps.length;
        const curMelody = melodySteps[leadIdx];
        if (curMelody && step16 % 2 === 0) {
          const mOsc = this.ctx.createOscillator();
          const mGain = this.ctx.createGain();
          mOsc.type = 'square';
          mOsc.frequency.setValueAtTime(curMelody.f, now);
          mGain.gain.setValueAtTime(0.16, now);
          mGain.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 1.5);
          mOsc.connect(mGain);
          mGain.connect(this.musicGain);
          mOsc.start(now);
          mOsc.stop(now + stepDuration * 1.6);
        }
      }

      this.stepIndex++;
      this.timerId = setTimeout(tick, stepDuration * 1000);
    };

    tick();
  }
}

// Global audio engine singleton
window.audio = new ChiptuneAudioEngine();
