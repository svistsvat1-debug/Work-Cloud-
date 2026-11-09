/**
 * SpatialGrid splits the world into square cells and remembers which objects
 * are in which cell. To ask "who is near (x, y)?" we only look at a few cells
 * instead of checking every enemy, so collisions stay fast with hundreds of
 * enemies on screen.
 *
 * The grid is rebuilt every frame (clear + insert). The little arrays for the
 * cells are recycled, so rebuilding creates almost no garbage.
 */
class SpatialGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map(); // cell key -> array of objects
    this.spareLists = [];
  }

  clear() {
    for (const list of this.cells.values()) {
      list.length = 0;
      this.spareLists.push(list);
    }
    this.cells.clear();
  }

  /** One number per cell (works for positions up to about 4 million pixels from the start). */
  key(col, row) {
    return (col + 32768) * 65536 + (row + 32768);
  }

  insert(item) {
    const key = this.key(Math.floor(item.x / this.cellSize), Math.floor(item.y / this.cellSize));
    let list = this.cells.get(key);
    if (!list) {
      list = this.spareLists.pop() || [];
      this.cells.set(key, list);
    }
    list.push(item);
  }

  /** Calls fn(item) for every item in the cells touched by the circle (x, y, radius). */
  query(x, y, radius, fn) {
    const size = this.cellSize;
    const minCol = Math.floor((x - radius) / size);
    const maxCol = Math.floor((x + radius) / size);
    const minRow = Math.floor((y - radius) / size);
    const maxRow = Math.floor((y + radius) / size);
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const list = this.cells.get(this.key(col, row));
        if (!list) continue;
        for (let i = 0; i < list.length; i++) fn(list[i]);
      }
    }
  }
}
