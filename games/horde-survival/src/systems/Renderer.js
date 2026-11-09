/**
 * Renderer draws the game world in layers: ground, pickups, enemies, player,
 * weapons, projectiles, effects. The UI is drawn afterwards by UISystem.
 */
class Renderer {
  constructor(game) {
    this.game = game;
    this.world = new WorldRenderer(game); // ground tiles and decorations
  }

  render() {
    const { ctx, camera, sprites, enemies, projectiles, pickups, player, effects } = this.game;

    // Reset the transform and clear the whole screen.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.game.width, this.game.height);

    // From here on we draw in world coordinates.
    camera.applyTransform(ctx);
    this.world.render(ctx, camera);

    // Items on the ground sit below everything that moves.
    for (const pickup of pickups) {
      if (pickup.isVisible(camera)) pickup.render(ctx, sprites);
    }

    // Enemies lower on screen are drawn later, so they appear in front.
    enemies.sort((a, b) => a.y - b.y);
    for (const enemy of enemies) {
      if (enemy.isVisible(camera)) enemy.render(ctx, sprites, this.game);
    }

    // The player is always drawn on top of enemies, so you never lose sight of yourself.
    player.render(ctx, sprites);
    this.game.weapons.render(ctx, sprites); // blades, pulses, lightning
    for (const projectile of projectiles) projectile.render(ctx, sprites);
    effects.render(ctx);

    // Back to screen coordinates for the UI.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}
