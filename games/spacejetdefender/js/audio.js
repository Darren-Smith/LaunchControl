// ============================================================================
// SPACEJET DEFENDER - Pre-Rendered Tunic8-Bit WAV Soundtrack & WebAudio SFX
// ============================================================================

class ChiptuneAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.noiseBuffer = null;

    this.muted = false;
    // BGM reduced by 50% by default (0.24 vs previous 0.48) so SFX cut through clearly;
    // both BGM and SFX are user-adjustable in 10% steps (0%..100%).
    this.bgmPercent = 50;
    this.sfxPercent = 80;
    this.musicVolume = 0.24; // 50% on the 0.48 max BGM scale
    this.sfxVolume = 0.80;

    this.currentTrack = null;
    this.activeAudio = null;

    // Map logical level music keys to pre-rendered Tunic8-Bit .wav files
    this.trackFiles = {
      title: 'audio/title.wav',
      flight_school: 'audio/cadet.wav',
      cadet: 'audio/cadet.wav',
      sector_early: 'audio/mid.wav',
      mid: 'audio/mid.wav',
      sector_late: 'audio/heavy.wav',
      heavy: 'audio/heavy.wav',
      boss: 'audio/boss.wav',
      victory: 'audio/victory.wav'
    };

    // Preload HTML5 Audio elements for zero-CPU-calculation playback
    this.audioElements = {};
    this.preloadWavTracks();
  }

  preloadWavTracks() {
    if (typeof Audio === 'undefined') return;
    const uniqueFiles = new Set(Object.values(this.trackFiles));
    uniqueFiles.forEach((src) => {
      try {
        const el = new Audio(src);
        el.loop = true;
        el.preload = 'auto';
        el.volume = this.muted ? 0 : this.musicVolume;
        this.audioElements[src] = el;
      } catch (e) {}
    });
  }

  init() {
    // Resume pending HTML5 WAV track if browser blocked initial autoplay
    if (this.activeAudio && this.activeAudio.paused && !this.muted) {
      this.activeAudio.play().catch(() => {});
    }

    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 0.90;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.masterGain);

    // 1-second white noise buffer for explosion SFX
    const bufferSize = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  setMute(muted) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.90, this.ctx.currentTime);
    }
    Object.values(this.audioElements).forEach((el) => {
      el.muted = this.muted;
      el.volume = this.muted ? 0 : this.musicVolume;
    });
    if (!this.muted && this.activeAudio && this.activeAudio.paused) {
      this.activeAudio.play().catch(() => {});
    }
  }

  toggleMute() {
    this.setMute(!this.muted);
    return this.muted;
  }

  setMusicVolume(v) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    Object.values(this.audioElements).forEach((el) => {
      el.volume = this.muted ? 0 : this.musicVolume;
    });
  }

  setSfxVolume(v) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  adjustBgmPercent(delta) {
    this.bgmPercent = Math.max(0, Math.min(100, this.bgmPercent + delta));
    // 100% BGM maps to 0.48 gain; default 50% maps to 0.24 gain (50% reduction)
    this.setMusicVolume((this.bgmPercent / 100) * 0.48);
  }

  adjustSfxPercent(delta) {
    this.sfxPercent = Math.max(0, Math.min(100, this.sfxPercent + delta));
    this.setSfxVolume(this.sfxPercent / 100);
  }

  playTrack(trackName) {
    const src = this.trackFiles[trackName] || this.trackFiles.title;
    if (this.currentTrack === src && this.activeAudio && !this.activeAudio.paused) {
      return;
    }

    this.stopMusic();
    this.currentTrack = src;

    if (typeof Audio === 'undefined') return;
    let el = this.audioElements[src];
    if (!el) {
      try {
        el = new Audio(src);
        el.loop = true;
        this.audioElements[src] = el;
      } catch (e) {
        return;
      }
    }

    el.muted = this.muted;
    el.volume = this.muted ? 0 : this.musicVolume;
    el.currentTime = 0;
    this.activeAudio = el;

    const playPromise = el.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Will automatically start on first user input via init()
      });
    }
  }

  stopMusic() {
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch (e) {}
    }
    this.activeAudio = null;
    this.currentTrack = null;
  }

  // ==========================================================================
  // RETRO ARCADE SOUND EFFECTS (Zero-Latency Web Audio)
  // ==========================================================================
  playTone(freq, time, duration, type, peakGain, dest) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peakGain, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(dest || this.sfxGain);

    osc.start(time);
    osc.stop(time + duration + 0.01);
  }

  sfxShoot(weaponTier = 1) {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = weaponTier >= 2 ? 'sawtooth' : 'square';

    const startFreq = weaponTier >= 3 ? 1150 : (weaponTier === 2 ? 980 : 880);
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.095);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.105);

    if (weaponTier >= 2) {
      const sub = this.ctx.createOscillator();
      const subG = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(340, now);
      sub.frequency.exponentialRampToValueAtTime(80, now + 0.12);
      subG.gain.setValueAtTime(0.13, now);
      subG.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      sub.connect(subG);
      subG.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + 0.13);
    }
  }

  sfxMissile() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.linearRampToValueAtTime(740, now + 0.14);

    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  sfxHit() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    this.playTone(520, now, 0.035, 'square', 0.11, this.sfxGain);
    this.playTone(260, now + 0.02, 0.035, 'square', 0.11, this.sfxGain);
  }

  sfxExplode(size = 'small') {
    this.init();
    if (!this.ctx || this.muted || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const dur = size === 'boss' ? 0.95 : (size === 'large' ? 0.45 : 0.22);

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(size === 'boss' ? 1200 : 1800, now);
    filter.frequency.exponentialRampToValueAtTime(110, now + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(size === 'boss' ? 0.48 : (size === 'large' ? 0.32 : 0.2), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + dur + 0.02);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(size === 'boss' ? 180 : 140, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + dur);
    oscGain.gain.setValueAtTime(0.25, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  sfxPowerup(type = 'shield') {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const notes = type === 'life'
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
      : (type === 'weapon'
        ? [440, 554.37, 659.25, 880, 1108.73, 1318.5]
        : [392, 493.88, 587.33, 783.99]);

    notes.forEach((freq, idx) => {
      this.playTone(freq, now + idx * 0.055, 0.09, 'triangle', 0.2, this.sfxGain);
    });
  }

  sfxRadarOnline() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const notes = [330, 440, 554.37, 659.25, 880, 1108.73, 1318.5];
    notes.forEach((freq, i) => {
      this.playTone(freq, now + i * 0.05, 0.11, 'triangle', 0.22, this.sfxGain);
    });
  }

  sfxRescue() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    [587.33, 783.99, 987.77, 1174.66].forEach((freq, i) => {
      this.playTone(freq, now + i * 0.06, 0.1, 'triangle', 0.18, this.sfxGain);
    });
  }

  sfxTeslaZap() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      this.playTone(900 + Math.random() * 800, now + i * 0.025, 0.03, 'sawtooth', 0.12, this.sfxGain);
    }
  }

  sfxAlarm() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, now + i * 0.28);
      osc.frequency.linearRampToValueAtTime(780, now + i * 0.28 + 0.14);
      osc.frequency.linearRampToValueAtTime(420, now + i * 0.28 + 0.26);
      g.gain.setValueAtTime(0.18, now + i * 0.28);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.28 + 0.27);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + i * 0.28);
      osc.stop(now + i * 0.28 + 0.28);
    }
  }

  sfxRankUp() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const fanfare = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.5];
    const times = [0, 0.09, 0.18, 0.28, 0.40, 0.54];
    const durs = [0.08, 0.08, 0.08, 0.11, 0.11, 0.35];
    fanfare.forEach((f, i) => {
      this.playTone(f, now + times[i], durs[i], 'triangle', 0.22, this.sfxGain);
    });
  }

  sfxUiBlip(confirm = false) {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    if (confirm) {
      this.playTone(660, now, 0.05, 'triangle', 0.15, this.sfxGain);
      this.playTone(990, now + 0.05, 0.08, 'triangle', 0.15, this.sfxGain);
    } else {
      this.playTone(540, now, 0.04, 'triangle', 0.12, this.sfxGain);
    }
  }
}

window.audio = new ChiptuneAudio();
