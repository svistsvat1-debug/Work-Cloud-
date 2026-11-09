/**
 * CloudSave copies the progress (coins, shop upgrades, best time) to the
 * player's own private record when the game runs as a claude.ai artifact.
 * Then progress survives cleared browser data and is the same on the phone
 * and on the computer. Anywhere else (a local file) there is no
 * window.claude, so nothing happens and localStorage alone keeps the save.
 *
 * The newest progress wins: every copy carries `progressAt`, the time of its
 * last change. The sound setting is not copied: it belongs to each device.
 */
const CloudSave = {
  doc: null, // the player's private document: data/users/<id>/save
  writing: false,
  writeAgain: false,
  retried: false,

  /** Finds the player's record, then keeps whichever copy is newer. Never blocks the game. */
  async connect() {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      const id = db && user ? await user.id() : null;
      if (!id) return; // signed out, or no private space here: the local save is enough
      this.doc = db.doc(`data/users/${id}/save`);
      const snapshot = await this.doc.get();
      const cloud = snapshot.exists ? snapshot.data() : null;
      if (SaveData.applyCloud(cloud)) return; // the cloud copy was newer: now it is ours too
      const cloudTime = (cloud && cloud.progressAt) || 0;
      if (SaveData.data.progressAt > cloudTime) this.push(); // ours is newer: upload it
    } catch (error) {
      this.doc = null; // the store can't be reached: keep playing with the local save
    }
  },

  /** Uploads the progress. One write at a time; a change made during a write goes right after it. */
  async push() {
    if (!this.doc) return;
    if (this.writing) {
      this.writeAgain = true;
      return;
    }
    this.writing = true;
    try {
      await this.doc.set(SaveData.cloudCopy());
      this.retried = false;
    } catch (error) {
      const code = error && error.code;
      if ((code === 'unavailable' || code === 'resource_exhausted') && !this.retried) {
        // A passing hiccup: try once more a little later.
        this.retried = true;
        setTimeout(() => this.push(), 2000 + Math.random() * 2000);
      } else {
        this.doc = null; // this viewer may not write here, or access ended: stay local
      }
    }
    this.writing = false;
    if (this.writeAgain) {
      this.writeAgain = false;
      this.push();
    }
  },
};
