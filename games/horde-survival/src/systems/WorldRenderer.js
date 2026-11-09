/**
 * WorldRenderer draws the endless ground under the action:
 *   1. seamless ground tiles,
 *   2. large soft patches (moss, dirt, old stone floor) so it doesn't look like a carpet,
 *   3. small decorations (rocks, bones, candles, ruins...) that never block movement.
 *
 * Nothing is stored: every grid cell asks MathUtils.hash2D what it contains,
 * so the same place always looks the same. Only cells on screen are drawn.
 */
class WorldRenderer {
  constructor(game) {
    this.game = game;
    this.art = WorldSprites.createAll();
  }

  render(ctx, camera) {
    this.renderGround(ctx, camera);
    this.renderPatches(ctx, camera);
    this.renderDecorations(ctx, camera);
  }

  /** Calls fn(col, row) for every grid cell of `cellSize` that may be visible. */
  forEachVisibleCell(camera, cellSize, margin, fn) {
    const startCol = Math.floor((camera.left - margin) / cellSize);
    const endCol = Math.floor((camera.right + margin) / cellSize);
    const startRow = Math.floor((camera.top - margin) / cellSize);
    const endRow = Math.floor((camera.bottom + margin) / cellSize);
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) fn(col, row);
    }
  }

  renderGround(ctx, camera) {
    const tiles = this.art.groundTiles;
    // Code-drawn tiles are GameConfig.world.tileSize wide; picture tiles keep their own size.
    const tileSize = tiles[0].width;
    this.forEachVisibleCell(camera, tileSize, 0, (col, row) => {
      const variant = Math.floor(MathUtils.hash2D(col, row, 1) * tiles.length);
      ctx.drawImage(tiles[variant], col * tileSize, row * tileSize);
    });
  }

  renderPatches(ctx, camera) {
    const config = GameConfig.world.patches;
    const kinds = Object.keys(config.weights);
    this.forEachVisibleCell(camera, config.cellSize, config.maxSize, (col, row) => {
      if (MathUtils.hash2D(col, row, 2) > config.chance) return;
      const kind = this.pickByRoll(kinds, (k) => config.weights[k], MathUtils.hash2D(col, row, 3));
      const size = MathUtils.lerp(config.minSize, config.maxSize, MathUtils.hash2D(col, row, 4));
      const x = (col + MathUtils.hash2D(col, row, 5)) * config.cellSize;
      const y = (row + MathUtils.hash2D(col, row, 6)) * config.cellSize;
      ctx.drawImage(this.art.patches[kind], x - size / 2, y - size / 2, size, size);
    });
  }

  renderDecorations(ctx, camera) {
    const config = GameConfig.world.decorations;
    this.forEachVisibleCell(camera, config.cellSize, 120, (col, row) => {
      if (MathUtils.hash2D(col, row, 7) > config.chance) return;
      const type = this.pickByRoll(config.types, (t) => t.weight, MathUtils.hash2D(col, row, 8));
      const size = MathUtils.lerp(type.size[0], type.size[1], MathUtils.hash2D(col, row, 9));
      const x = (col + 0.15 + MathUtils.hash2D(col, row, 10) * 0.7) * config.cellSize;
      const y = (row + 0.15 + MathUtils.hash2D(col, row, 11) * 0.7) * config.cellSize;
      const flip = MathUtils.hash2D(col, row, 12) < 0.5 ? -1 : 1;

      const sprite = this.art[type.sprite];
      DrawUtils.shadow(ctx, x, y + size * 0.36, size * 0.32, 0.25);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(flip, 1);
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      ctx.restore();
      if (type.flames) {
        // A picture of candles has its flames painted in; it only gets the flickering glow.
        const drawFlames = !ImageSprites.isPicture(sprite);
        this.renderCandleFlames(ctx, x, y, size, flip, col * 7 + row, drawFlames);
      }
    });
  }

  /** Small flickering flames + a warm glow for the candle decoration. */
  renderCandleFlames(ctx, x, y, size, flip, seed, drawFlames = true) {
    const time = this.game.clock; // real seconds since the page opened
    const flicker = 0.75 + Math.sin(time * 9 + seed) * 0.15 + Math.sin(time * 23 + seed * 2) * 0.1;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = flicker;
    const glowSize = size * 2.2;
    ctx.drawImage(this.art.candleGlow, x - glowSize / 2, y - glowSize / 2 - size * 0.1, glowSize, glowSize);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (!drawFlames) return;
    ctx.fillStyle = '#ffd27a';
    for (const [fx, fy] of WorldSprites.CANDLE_TOPS) {
      const px = x + (fx - 0.5) * size * flip;
      const py = y + (fy - 0.5) * size - size * 0.07;
      ctx.beginPath();
      ctx.ellipse(px, py, size * 0.035, size * 0.07 * flicker, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Weighted pick using a given roll in [0, 1) instead of Math.random(). */
  pickByRoll(items, getWeight, roll) {
    const total = items.reduce((sum, item) => sum + getWeight(item), 0);
    let remaining = roll * total;
    for (const item of items) {
      remaining -= getWeight(item);
      if (remaining <= 0) return item;
    }
    return items[items.length - 1];
  }
}
