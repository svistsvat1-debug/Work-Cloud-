// Every sound is synthesized with the Web Audio API — no audio files.
// Browsers only allow audio after a user gesture, so unlock() is called on the first key/click.

const VOLUME = 0.35;

// minGap = minimum seconds between two plays of the same sound (prevents noise walls)
const SOUNDS = {
  shoot: { minGap: 0.06, play: (a, t) => a.tone(t, { type: 'square', freq: 720, to: 380, dur: 0.07, vol: 0.035 }) },
  hit: { minGap: 0.045, play: (a, t) => a.noise(t, { dur: 0.05, vol: 0.07, freq: 2400, filter: 'bandpass' }) },
  enemyDeath: {
    minGap: 0.05,
    play: (a, t) => {
      a.tone(t, { type: 'triangle', freq: 320, to: 70, dur: 0.16, vol: 0.08 });
      a.noise(t, { dur: 0.08, vol: 0.04, freq: 900 });
    },
  },
  xp: { minGap: 0.035, play: (a, t) => a.tone(t, { type: 'sine', freq: 900 + Math.random() * 200, to: 1500, dur: 0.06, vol: 0.05 }) },
  coin: {
    minGap: 0.06,
    play: (a, t) => {
      a.tone(t, { type: 'square', freq: 1200, dur: 0.05, vol: 0.035 });
      a.tone(t + 0.05, { type: 'square', freq: 1600, dur: 0.08, vol: 0.035 });
    },
  },
  levelUp: { minGap: 0.2, play: (a, t) => a.arpeggio(t, [523, 659, 784, 1047], 0.075, { type: 'square', dur: 0.16, vol: 0.06 }) },
  chestOpen: {
    minGap: 0.3,
    play: (a, t) => {
      a.tone(t, { type: 'sine', freq: 180, to: 900, dur: 0.9, vol: 0.08, attack: 0.3 });
      a.noise(t, { dur: 0.9, vol: 0.03, freq: 3000, filter: 'highpass' });
    },
  },
  chestReveal: { minGap: 0.3, play: (a, t) => a.arpeggio(t, [659, 784, 988, 1319], 0.06, { type: 'triangle', dur: 0.3, vol: 0.09 }) },
  evolution: {
    minGap: 0.5,
    play: (a, t) => {
      a.arpeggio(t, [392, 523, 659, 784, 1047, 1319, 1568], 0.07, { type: 'square', dur: 0.25, vol: 0.06 });
      a.noise(t, { dur: 1.0, vol: 0.05, freq: 1500, filter: 'bandpass' });
    },
  },
  playerHurt: { minGap: 0.15, play: (a, t) => a.tone(t, { type: 'sawtooth', freq: 220, to: 90, dur: 0.22, vol: 0.1 }) },
  gameOver: { minGap: 1, play: (a, t) => a.arpeggio(t, [392, 330, 262, 196], 0.22, { type: 'triangle', dur: 0.4, vol: 0.12 }) },
  pulse: { minGap: 0.2, play: (a, t) => a.tone(t, { type: 'sine', freq: 240, to: 60, dur: 0.35, vol: 0.12 }) },
  nova: {
    minGap: 0.2,
    play: (a, t) => {
      a.tone(t, { type: 'sine', freq: 320, to: 70, dur: 0.5, vol: 0.13 });
      a.tone(t, { type: 'triangle', freq: 640, to: 900, dur: 0.3, vol: 0.05 });
    },
  },
  lightning: {
    minGap: 0.08,
    play: (a, t) => {
      a.noise(t, { dur: 0.25, vol: 0.1, freq: 1800, filter: 'highpass' });
      a.tone(t, { type: 'square', freq: 90, to: 40, dur: 0.2, vol: 0.05 });
    },
  },
  bossSpawn: { minGap: 1, play: (a, t) => a.tone(t, { type: 'sawtooth', freq: 70, to: 45, dur: 1.4, vol: 0.14, attack: 0.2 }) },
  bossRoar: { minGap: 0.5, play: (a, t) => a.tone(t, { type: 'sawtooth', freq: 120, to: 55, dur: 0.6, vol: 0.1 }) },
  bossDeath: {
    minGap: 1,
    play: (a, t) => {
      a.noise(t, { dur: 0.9, vol: 0.14, freq: 600 });
      a.arpeggio(t + 0.2, [262, 330, 392, 523], 0.09, { type: 'triangle', dur: 0.3, vol: 0.08 });
    },
  },
  click: { minGap: 0.05, play: (a, t) => a.tone(t, { type: 'square', freq: 660, dur: 0.04, vol: 0.04 }) },
  heal: { minGap: 0.3, play: (a, t) => a.arpeggio(t, [523, 784], 0.06, { type: 'sine', dur: 0.15, vol: 0.06 }) },
};

export class AudioSystem {
  constructor(muted) {
    this.muted = muted;
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.lastPlayed = {};
  }

  /** Creates/resumes the AudioContext. Must run inside a user gesture. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : VOLUME;
    this.master.connect(this.ctx.destination);

    const length = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.setValueAtTime(muted ? 0 : VOLUME, this.ctx.currentTime);
  }

  play(name) {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return;
    const sound = SOUNDS[name];
    if (!sound) return;
    const now = this.ctx.currentTime;
    if (now - (this.lastPlayed[name] || -1) < sound.minGap) return;
    this.lastPlayed[name] = now;
    sound.play(this, now);
  }

  tone(t, { type = 'sine', freq, to = freq, dur = 0.1, vol = 0.1, attack = 0.005 }) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noise(t, { dur = 0.1, vol = 0.1, freq = 1000, filter = 'lowpass' }) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const biquad = this.ctx.createBiquadFilter();
    biquad.type = filter;
    biquad.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(biquad).connect(gain).connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  arpeggio(t, notes, gap, options) {
    notes.forEach((freq, i) => this.tone(t + i * gap, { ...options, freq }));
  }
}
