/**
 * Renderer draws the game world in layers: background, enemies, player,
 * projectiles, effects. The UI is drawn afterwards by UISystem.
 */
class Renderer {
  constructor(game) {
    this.game = game;
  }

  render() {
    const { ctx, camera, sprites, enemies, projectiles, player, effects } = this.game;

    // Reset the transform and clear the whole screen.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.game.width, this.game.height);

    // From here on we draw in world coordinates.
    camera.applyTransform(ctx);
    this.drawBackground(ctx, camera);

    // Enemies lower on screen are drawn later, so they appear in front.
    enemies.sort((a, b) => a.y - b.y);
    for (const enemy of enemies) {
      if (enemy.isVisible(camera)) enemy.render(ctx, sprites);
    }

    // The player is always drawn on top of enemies, so you never lose sight of yourself.
    player.render(ctx, sprites);
    for (const projectile of projectiles) projectile.render(ctx, sprites);
    effects.render(ctx);

    // Back to screen coordinates for the UI.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /** A checkerboard of tiles, so you can see the world move. Only visible tiles are drawn. */
  drawBackground(ctx, camera) {
    const { tileSize, colors, gridColor } = GameConfig.background;
    const startCol = Math.floor(camera.left / tileSize);
    const endCol = Math.floor(camera.right / tileSize);
    const startRow = Math.floor(camera.top / tileSize);
    const endRow = Math.floor(camera.bottom / tileSize);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        // Even/odd (col + row) makes the checkerboard; "+ 2) % 2" handles negative numbers.
        ctx.fillStyle = colors[(((col + row) % 2) + 2) % 2];
        ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
      }
    }

    // Faint grid lines on top of the tiles
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let col = startCol; col <= endCol + 1; col++) {
      ctx.moveTo(col * tileSize, startRow * tileSize);
      ctx.lineTo(col * tileSize, (endRow + 1) * tileSize);
    }
    for (let row = startRow; row <= endRow + 1; row++) {
      ctx.moveTo(startCol * tileSize, row * tileSize);
      ctx.lineTo((endCol + 1) * tileSize, row * tileSize);
    }
    ctx.stroke();
  }
}
