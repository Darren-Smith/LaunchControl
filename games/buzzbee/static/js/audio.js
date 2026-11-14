/**
 * BuzzBee – Audio Engine
 * Procedural Web Audio API sound synthesis (no external files needed)
 */

const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;
  let sfxMuted = false;
  let bgmMuted = false;
  let bgm = null;
  let bgmPlaying = false;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = sfxMuted ? 0 : 0.5;
    masterGain.connect(ctx.destination);

    bgm = new Audio('/static/assets/sounds/Buzzbee-Level-BGM.wav');
    bgm.loop = true;
    bgm.volume = 0.3;
    bgm.muted = bgmMuted;
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (bgm && bgmPlaying && !bgmMuted && bgm.paused) {
      bgm.play().catch(() => {});
    }
  }

  function pauseBGM() {
    if (bgm && !bgm.paused) bgm.pause();
  }

  function setMute(val) {
    setSfxMute(val);
    setBgmMute(val);
  }

  function setSfxMute(val) {
    sfxMuted = Boolean(val);
    if (masterGain) masterGain.gain.value = sfxMuted ? 0 : 0.5;
  }

  function setBgmMute(val) {
    bgmMuted = Boolean(val);
    if (bgm) {
      bgm.muted = bgmMuted;
      if (bgmMuted && !bgm.paused) bgm.pause();
      else if (!bgmMuted && bgmPlaying && bgm.paused) bgm.play().catch(() => {});
    }
  }

  function isSfxMuted() { return sfxMuted; }
  function isBgmMuted() { return bgmMuted; }

  /** Generic tone burst */
  function playTone(freq, type, duration, vol = 0.3, startFreq = null) {
    if (!ctx || sfxMuted) return;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq || freq, ctx.currentTime);
    if (startFreq) osc.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + duration);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  /** Noise burst for sting */
  function playNoise(duration, vol = 0.2) {
    if (!ctx || sfxMuted) return;
    if (ctx.state === 'suspended') ctx.resume();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start(ctx.currentTime);
  }

  // ─── Named sound effects ───
  const sounds = {
    sting()         { playNoise(0.15, 0.3); playTone(880, 'square', 0.1, 0.15); },
    collectPollen() { playTone(440, 'sine', 0.08, 0.2); playTone(660, 'sine', 0.12, 0.2, 440); },
    badPollen()     { playTone(200, 'sawtooth', 0.2, 0.25, 400); },
    nectarStolen()  { playTone(150, 'sawtooth', 0.4, 0.3, 300); playTone(100, 'sine', 0.5, 0.25, 200); },
    enemyDie()      { playTone(300, 'square', 0.15, 0.3); playTone(200, 'square', 0.15, 0.25); },
    combo()         { [440, 550, 660, 880].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.1, 0.25), i * 60)); },
    gameOver()      { [300, 250, 200, 150].forEach((f, i) => setTimeout(() => playTone(f, 'sawtooth', 0.3, 0.3), i * 200)); },
    victory()       { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => setTimeout(() => playTone(f, 'triangle', 0.22, 0.3), i * 140)); },
    wave()          { [440, 550, 660].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.2, 0.2), i * 120)); },
    startBGM() {
      bgmPlaying = true;
      if (!bgm) return () => { bgmPlaying = false; };
      bgm.muted = bgmMuted;
      bgm.currentTime = 0;
      if (!bgmMuted) {
        if (ctx && ctx.state === 'suspended') ctx.resume();
        bgm.play().catch(e => console.warn('BGM play prevented', e));
      }
      return () => {
        bgmPlaying = false;
        bgm.pause();
        bgm.currentTime = 0;
      };
    },
  };

  return {
    init, resume, pauseBGM,
    setMute, setSfxMute, setBgmMute, isSfxMuted, isBgmMuted,
    play: (name) => sounds[name] && sounds[name](),
    startBGM: sounds.startBGM,
  };
})();
