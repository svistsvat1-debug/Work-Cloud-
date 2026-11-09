/**
 * SaveData keeps progress between runs in the browser's localStorage:
 * total coins, permanent upgrade levels, best time and settings.
 *
 * localStorage can be unavailable (private windows, blocked storage), so every
 * access is wrapped in try/catch: the game still works, it just won't remember.
 */
const SaveData = {
  data: null,

  defaults() {
    return {
      version: 1,
      totalCoins: 0,
      upgrades: {}, // permanent upgrade id -> level (see ShopDefinitions)
      bestTime: 0, // seconds
      settings: { muted: false },
    };
  },

  load() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(GameConfig.saveKey));
    } catch (error) {
      saved = null; // nothing saved yet, broken data, or storage is blocked
    }
    const defaults = this.defaults();
    this.data = {
      ...defaults,
      ...(saved || {}),
      upgrades: { ...(saved && saved.upgrades) },
      settings: { ...defaults.settings, ...(saved && saved.settings) },
    };
    return this.data;
  },

  save() {
    try {
      localStorage.setItem(GameConfig.saveKey, JSON.stringify(this.data));
    } catch (error) {
      // Storage blocked or full: progress lives only until the page is closed.
    }
  },

  /** Wipes all progress (the shop's "Reset save" button). */
  reset() {
    this.data = this.defaults();
    this.save();
  },
};
