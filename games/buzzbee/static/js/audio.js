/**
 * BuzzBee – Audio Engine
 * Procedural Web Audio API sound synthesis (no external files needed)
 */

const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;
  let muted = false;
  let bgm = null;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(ctx.destination);
    
    bgm = new Audio('/static/assets/sounds/Buzzbee-Level-BGM.ogg');
    bgm.loop = true;
    bgm.volume = 0.3;
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function setMute(val) {
    muted = val;
    if (masterGain) masterGain.gain.value = muted ? 0 : 0.5;
    if (bgm) bgm.muted = muted;
  }

  /** Generic tone burst */
  function playTone(freq, type, duration, vol = 0.3, startFreq = null) {
    if (!ctx || muted) return;
    resume();
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
    if (!ctx || muted) return;
    resume();
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
    sting()     { playNoise(0.15, 0.3); playTone(880, 'square', 0.1, 0.15); },
    collectPollen() { playTone(440, 'sine', 0.08, 0.2); playTone(660, 'sine', 0.12, 0.2, 440); },
    badPollen() { playTone(200, 'sawtooth', 0.2, 0.25, 400); },
    nectarStolen(){ playTone(150, 'sawtooth', 0.4, 0.3, 300); playTone(100, 'sine', 0.5, 0.25, 200); },
    enemyDie()  { playTone(300, 'square', 0.15, 0.3); playTone(200, 'square', 0.15, 0.25); },
    combo()     { [440,550,660,880].forEach((f,i) => setTimeout(() => playTone(f,'sine',0.1,0.25), i*60)); },
    gameOver()  { [300,250,200,150].forEach((f,i) => setTimeout(() => playTone(f,'sawtooth',0.3,0.3), i*200)); },
    wave()      { [440,550,660].forEach((f,i) => setTimeout(() => playTone(f,'sine',0.2,0.2), i*120)); },
    startBGM()    {
      if (!bgm || muted) return () => {};
      resume();
      bgm.currentTime = 0;
      bgm.play().catch(e => console.warn('BGM play prevented', e));
      return () => {
        bgm.pause();
        bgm.currentTime = 0;
      };
    },
  };

  return { init, resume, setMute, play: (name) => sounds[name] && sounds[name](), startBGM: sounds.startBGM };
})();
