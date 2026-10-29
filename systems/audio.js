import { state } from './state.js';

let ctx = null;
let masterGain = null;
let bgmGain = null;
let bgmState = { current: null };
let lastStepTime = 0;

const BGM_TRACKS = {
  village: 'audio/village.mp3',
  explore: 'audio/explore.mp3',
  combat: 'audio/combat.mp3'
};

let currentBgmAudio = null;
let currentBgmSource = null;

export function initAudio() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = getVolume();
    masterGain.connect(ctx.destination);
    
    bgmGain = ctx.createGain();
    bgmGain.gain.value = 0.5; 
    bgmGain.connect(masterGain);
  } catch (e) {
    console.warn('Web Audio не поддерживается:', e);
  }
}

function getVolume() {
  const v = (state.settings?.volume ?? 50) / 100;
  const enabled = state.settings?.soundEnabled !== false;
  return enabled ? v * 0.5 : 0;
}

export function updateVolume() {
  if (!masterGain || !ctx) return;
  masterGain.gain.setTargetAtTime(getVolume(), ctx.currentTime, 0.05);
}

export function resumeContext() {
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

// ---------- СИНТЕЗАТОР ЗВУКОВ ----------
function noiseBuffer(duration) {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * duration);
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function playTone({ freq, freqEnd, duration, type = 'sine', vol = 0.3, delay = 0 }) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + duration);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(g).connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function playNoise({ duration, vol = 0.3, filterFreq = 2000, filterEnd, delay = 0 }) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(duration);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(filterFreq, t0);
  if (filterEnd !== undefined) filter.frequency.exponentialRampToValueAtTime(Math.max(20, filterEnd), t0 + duration);
  filter.Q.value = 1.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  src.connect(filter).connect(g).connect(masterGain);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}

const SOUNDS = {
  hit() {
    playNoise({ duration: 0.15, vol: 0.35, filterFreq: 3000, filterEnd: 400 });
    playTone({ freq: 200, freqEnd: 60, duration: 0.12, type: 'square', vol: 0.2 });
  },
  crit() {
    playNoise({ duration: 0.25, vol: 0.5, filterFreq: 5000, filterEnd: 300 });
    playTone({ freq: 400, freqEnd: 80, duration: 0.2, type: 'sawtooth', vol: 0.3 });
    playTone({ freq: 800, freqEnd: 200, duration: 0.15, type: 'square', vol: 0.15, delay: 0.02 });
  },
  hurt() {
    playTone({ freq: 300, freqEnd: 100, duration: 0.2, type: 'square', vol: 0.25 });
    playNoise({ duration: 0.1, vol: 0.2, filterFreq: 800, filterEnd: 200 });
  },
  heal() {
    playTone({ freq: 600, duration: 0.15, type: 'sine', vol: 0.2 });
    playTone({ freq: 800, duration: 0.15, type: 'sine', vol: 0.2, delay: 0.1 });
    playTone({ freq: 1000, duration: 0.2, type: 'sine', vol: 0.2, delay: 0.2 });
  },
  step() {
    const now = performance.now();
    if (now - lastStepTime < 250) return;
    lastStepTime = now;
    playNoise({ duration: 0.06, vol: 0.08, filterFreq: 400, filterEnd: 150 });
  },
  levelup() {
    [523, 659, 784, 1047].forEach((freq, i) => {
      playTone({ freq, duration: 0.25, type: 'triangle', vol: 0.25, delay: i * 0.1 });
    });
  },
  victory() {
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      playTone({ freq, duration: 0.3, type: 'triangle', vol: 0.3, delay: i * 0.12 });
    });
  },
  defeat() {
    [400, 350, 300, 200].forEach((freq, i) => {
      playTone({ freq, duration: 0.4, type: 'sawtooth', vol: 0.25, delay: i * 0.15 });
    });
  },
  chest() {
    playTone({ freq: 1200, duration: 0.1, type: 'sine', vol: 0.2 });
    playTone({ freq: 1600, duration: 0.15, type: 'sine', vol: 0.25, delay: 0.08 });
    playTone({ freq: 2000, duration: 0.2, type: 'sine', vol: 0.15, delay: 0.16 });
  },
  cast() {
    playTone({ freq: 400, freqEnd: 1200, duration: 0.2, type: 'sine', vol: 0.2 });
    playNoise({ duration: 0.15, vol: 0.15, filterFreq: 2000, filterEnd: 4000 });
  },
  click() {
    playTone({ freq: 1000, freqEnd: 800, duration: 0.05, type: 'square', vol: 0.08 });
  },
};

export function playSound(name) {
  if (!ctx) return;
  if (state.settings?.soundEnabled === false) return;
  if (ctx.state === 'suspended') resumeContext();
  const fn = SOUNDS[name];
  if (!fn) return;
  try { fn(); } catch (e) {}
}

// ---------- ФОНОВАЯ МУЗЫКА ----------
export function playBGM(type) {
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  if (bgmState.current === type) return;
  
  stopBGM(); 
  bgmState.current = type;

  const trackUrl = BGM_TRACKS[type];
  if (!trackUrl) return;

  currentBgmAudio = new Audio(trackUrl);
  currentBgmAudio.loop = true;
  
  try {
    currentBgmSource = ctx.createMediaElementSource(currentBgmAudio);
    currentBgmSource.connect(bgmGain);
  } catch (e) {
    console.warn('Не удалось подключить аудио к контексту.', e);
  }

  // Настройка громкости: бой - 30%, остальное - 100%
  if (type === 'combat') {
    currentBgmAudio.volume = 0.3; 
  } else {
    currentBgmAudio.volume = 1.0; 
  }

  currentBgmAudio.play().catch(e => {
    console.warn('Не удалось воспроизвести музыку (404?):', trackUrl);
  });
}

export function stopBGM() {
  if (currentBgmAudio) {
    currentBgmAudio.pause();
    currentBgmAudio.currentTime = 0;
    currentBgmAudio = null;
  }
  if (currentBgmSource) {
    try { currentBgmSource.disconnect(); } catch(e){}
    currentBgmSource = null;
  }
  bgmState.current = null;
}