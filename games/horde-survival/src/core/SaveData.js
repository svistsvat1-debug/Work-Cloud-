/**
 * SaveData keeps progress between runs in the browser's localStorage:
 * total coins, permanent upgrade levels, best time and settings.
 *
 * localStorage can be unavailable (private windows, blocked storage), so every
 * access is wrapped in try/catch: the game still works, it just won't remember.
 * When the game runs as a claude.ai artifact, CloudSave also keeps a copy of
 * the progress in the player's private record (see CloudSave.js).
 */
const SaveData = {
  data: null,
  lastProgress: '', // the progress as last saved, to notice real changes

  defaults() {
    return {
      version: 1,
      totalCoins: 0,
      upgrades: {}, // permanent upgrade id -> level (see ShopDefinitions)
      bestTime: 0, // seconds
      progressAt: 0, // when coins, upgrades or best time last changed (ms since 1970)
      settings: { muted: false }, // per device: never copied to the cloud
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
    this.lastProgress = JSON.stringify(this.progress());
    return this.data;
  },

  save() {
    // Coins, upgrades or best time changed: stamp the time and copy it to the cloud.
    const progress = JSON.stringify(this.progress());
    const progressChanged = progress !== this.lastProgress;
    if (progressChanged) {
      this.data.progressAt = Date.now();
      this.lastProgress = progress;
    }
    this.writeLocal();
    if (progressChanged) CloudSave.push();
  },

  writeLocal() {
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

  /** The part of the save that follows the player between devices. */
  progress() {
    const { totalCoins, upgrades, bestTime } = this.data;
    return { totalCoins, upgrades, bestTime };
  },

  cloudCopy() {
    return { version: 1, ...this.progress(), progressAt: this.data.progressAt };
  },

  /**
   * Takes progress from the cloud (or the viewer's reload snapshot) when it is
   * newer than ours. The values are checked first: a broken copy changes nothing.
   * Returns true when it was used.
   */
  applyCloud(copy) {
    const isCount = (value) => Number.isFinite(value) && value >= 0;
    if (!copy || !isCount(copy.progressAt) || copy.progressAt <= this.data.progressAt) return false;
    if (!isCount(copy.totalCoins) || !isCount(copy.bestTime)) return false;
    const upgrades = {};
    for (const [id, level] of Object.entries(copy.upgrades || {})) {
      const definition = ShopDefinitions[id];
      if (definition && Number.isInteger(level) && level >= 0) upgrades[id] = Math.min(level, definition.maxLevel);
    }
    Object.assign(this.data, {
      totalCoins: Math.floor(copy.totalCoins),
      upgrades,
      bestTime: copy.bestTime,
      progressAt: copy.progressAt,
    });
    this.lastProgress = JSON.stringify(this.progress());
    this.writeLocal();
    return true;
  },
};
