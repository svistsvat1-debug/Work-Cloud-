// Save data in localStorage. Every access is wrapped in try/catch because
// storage can be blocked (private mode, file:// in some browsers, etc.).

import { GameConfig } from '../config/GameConfig.js';

function defaultSave() {
  // The debug panel is on by default on desktop (F3 toggles it); phones have no F3, so it starts hidden there.
  const touchOnly = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  return { totalCoins: 0, meta: {}, muted: false, bestTime: 0, runs: 0, showDebug: !touchOnly };
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
