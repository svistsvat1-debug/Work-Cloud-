/**
 * AudioSystem makes every sound with the Web Audio API: no audio files at all.
 *
 * Most sounds are small synthesized BELLS (a few sine waves at "bell-like"
 * ratios that fade out), which fits the game's theme. Browsers only allow
 * sound after the player clicks or presses a key, so the audio starts on the
 * first input. Each sound has a minimum gap (throttle), so a hundred hits in
 * one frame make one tick, not a deafening noise.
 */
class AudioSystem {
  constructor() {
    this.context = null;
    this.master = null;
    this.lastPlayed = {};
    this.pickupCombo = 0; // XP pickups in quick succession rise in pitch
    this.lastPickupTime = 0;
    this.muted = SaveData.data.settings.muted;

    // Audio may only start after a user gesture.
    const unlock = () => this.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  unlock() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return; // very old browser: play silently
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : GameConfig.audio.volume;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') this.context.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : GameConfig.audio.volume;
    SaveData.data.settings.muted = this.muted;
    SaveData.save();
  }

  /** Plays a named sound (see the methods below), respecting its throttle. */
  play(name) {
    if (!this.context || this.muted || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    const gap = GameConfig.audio.minGap[name] || 0;
    if (now - (this.lastPlayed[name] || -1) < gap) return;
    this.lastPlayed[name] = now;
    const sound = this.sounds[name];
    if (sound) sound.call(this, now);
  }

  // ---------------------------------------------------------------- Building blocks

  /** A bell: sine partials at bell-like ratios, each fading out. */
  bell(time, frequency, volume, length) {
    const partials = [[1, 1], [2.0, 0.5], [2.76, 0.35], [5.4, 0.18], [8.93, 0.08]];
    for (const [ratio, strength] of partials) {
      this.tone(time, frequency * ratio, volume * strength, length / Math.sqrt(ratio), 'sine');
    }
  }

  /** One oscillator note with a quick attack and an exponential fade. */
  tone(time, frequency, volume, length, type = 'sine', endFrequency = null) {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, time);
    if (endFrequency) osc.frequency.exponentialRampToValueAtTime(endFrequency, time + length);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    osc.connect(gain).connect(this.master);
    osc.start(time);
    osc.stop(time + length + 0.05);
  }

  /** A short burst of filtered noise (hits, thuds, rumbles). */
  noise(time, volume, length, filterFrequency) {
    if (!this.noiseBuffer) {
      const sampleRate = this.context.sampleRate;
      this.noiseBuffer = this.context.createBuffer(1, sampleRate, sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFrequency;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    source.connect(filter).connect(gain).connect(this.master);
    source.start(time);
    source.stop(time + length + 0.05);
  }
}

/** The actual sounds. Each one gets the current audio time `t`. */
AudioSystem.prototype.sounds = {
  shoot(t) {
    this.tone(t, 1320, 0.05, 0.08, 'triangle', 1760);
  },
  hit(t) {
    this.noise(t, 0.08, 0.04, 2400);
  },
  death(t) {
    this.tone(t, 320, 0.09, 0.12, 'sine', 110);
    this.noise(t, 0.06, 0.08, 900);
  },
  pickup(t) {
    // Rising chimes while you vacuum up a trail of gems.
    this.pickupCombo = t - this.lastPickupTime < 0.4 ? Math.min(this.pickupCombo + 1, 14) : 0;
    this.lastPickupTime = t;
    this.bell(t, 1046 * Math.pow(2, this.pickupCombo / 24), 0.05, 0.25);
  },
  coin(t) {
    this.bell(t, 1568, 0.05, 0.2);
    this.bell(t + 0.06, 2093, 0.04, 0.25);
  },
  levelUp(t) {
    [523, 659, 784, 1046].forEach((frequency, i) => this.bell(t + i * 0.08, frequency, 0.09, 0.7));
  },
  chestShake(t) {
    this.noise(t, 0.12, 0.8, 300);
  },
  chestOpen(t) {
    this.noise(t, 0.12, 0.25, 1200);
    [784, 988, 1175].forEach((frequency) => this.bell(t + 0.05, frequency, 0.08, 1.4));
  },
  evolution(t) {
    [392, 523, 659, 784, 1046, 1318].forEach((frequency, i) => this.bell(t + i * 0.07, frequency, 0.09, 1.8));
  },
  hurt(t) {
    this.tone(t, 160, 0.16, 0.18, 'square', 60);
    this.noise(t, 0.1, 0.12, 500);
  },
  gameOver(t) {
    [220, 196, 147].forEach((frequency, i) => this.bell(t + i * 0.45, frequency, 0.16, 2.2));
  },
  bossToll(t) {
    // A deep, ominous bell toll when a boss appears.
    this.bell(t, 98, 0.3, 3.5);
    this.bell(t + 0.9, 92, 0.22, 3);
  },
  bossDeath(t) {
    this.noise(t, 0.25, 0.9, 600);
    this.bell(t + 0.1, 196, 0.2, 2.5);
  },
};
