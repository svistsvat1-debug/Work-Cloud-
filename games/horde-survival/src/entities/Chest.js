/**
 * A treasure chest dropped by a boss (and sometimes an elite).
 * It is not pulled by the magnet: it waits until the player walks into it.
 * Touching it pauses the game and opens the chest reward screen.
 */
class Chest extends Pickup {
  constructor(x, y) {
    const config = GameConfig.chests;
    super(x, y, config.radius, config.drawSize, false);
  }

  collect(game) {
    game.openChest();
  }

  render(ctx, sprites) {
    const size = this.drawSize;
    const glow = 0.35 + Math.sin(this.bobTime * 3) * 0.15;

    // Golden glow on the ground so it is easy to spot
    ctx.globalAlpha = glow;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + size * 0.3, size * 0.6, size * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    const bob = Math.sin(this.bobTime * 2.5) * 3;
    DrawUtils.shadow(ctx, this.x, this.y + size * 0.36, size * 0.34, 0.4);
    ctx.drawImage(sprites.chest, this.x - size / 2, this.y - size / 2 + bob, size, size);
  }
}
