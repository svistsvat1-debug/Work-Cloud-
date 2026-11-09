// A uniform grid that answers "which enemies are near this point?" quickly.
// Without it, every projectile would have to check every enemy each frame.

export class SpatialGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map();
    this.usedCells = [];
  }

  key(cx, cy) {
    return (cx + 32768) * 65536 + (cy + 32768);
  }

  clear() {
    for (const cell of this.usedCells) cell.length = 0;
    this.usedCells.length = 0;
    // The world is endless; forget old empty cells once in a while.
    if (this.cells.size > 4000) this.cells.clear();
  }

  insert(entity) {
    const cx = Math.floor(entity.x / this.cellSize);
    const cy = Math.floor(entity.y / this.cellSize);
    const key = this.key(cx, cy);
    let cell = this.cells.get(key);
    if (!cell) {
      cell = [];
      this.cells.set(key, cell);
    }
    if (cell.length === 0) this.usedCells.push(cell);
    cell.push(entity);
  }

  /** Fills `out` with entities in cells overlapping the circle (x, y, radius). */
  query(x, y, radius, out) {
    out.length = 0;
    const size = this.cellSize;
    // Entities are stored by center, so pad by one cell to catch big ones.
    const minX = Math.floor((x - radius) / size) - 1;
    const maxX = Math.floor((x + radius) / size) + 1;
    const minY = Math.floor((y - radius) / size) - 1;
    const maxY = Math.floor((y + radius) / size) + 1;
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const cell = this.cells.get(this.key(cx, cy));
        if (cell) for (let i = 0; i < cell.length; i++) out.push(cell[i]);
      }
    }
    return out;
  }
}
