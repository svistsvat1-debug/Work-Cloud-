// Save data in localStorage. Every access is wrapped in try/catch because
// storage can be blocked (private mode, file:// in some browsers, etc.).

import { GameConfig } from '../config/GameConfig.js';

function defaultSave() {
  return { totalCoins: 0, meta: {}, muted: false, bestTime: 0, runs: 0, showDebug: true };
}

export const SaveData = {
  load() {
    try {
      const raw = localStorage.getItem(GameConfig.saveKey);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw);
      return { ...defaultSave(), ...parsed, meta: { ...(parsed.meta || {}) } };
    } catch (error) {
      console.warn('Could not load save, starting fresh.', error);
      return defaultSave();
    }
  },

  save(data) {
    try {
      localStorage.setItem(GameConfig.saveKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Could not write save.', error);
    }
  },

  /** Resets progress but keeps the sound setting. */
  reset(current) {
    const fresh = { ...defaultSave(), muted: current ? current.muted : false };
    this.save(fresh);
    return fresh;
  },
};
