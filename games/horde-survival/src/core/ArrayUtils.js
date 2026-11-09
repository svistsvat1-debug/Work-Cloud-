/**
 * Helpers for the lists of objects the game keeps (enemies, projectiles...).
 */
const ArrayUtils = {
  /**
   * Removes every item for which shouldRemove(item) is true.
   * Works "in place": the same array is kept, so no new array is created
   * every frame (less work for the browser's garbage collector).
   */
  removeWhere(list, shouldRemove) {
    let keep = 0;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (!shouldRemove(item)) list[keep++] = item;
    }
    list.length = keep;
  },

  /** Removes every object marked dead. */
  removeDead(list) {
    ArrayUtils.removeWhere(list, (item) => item.dead);
  },
};
