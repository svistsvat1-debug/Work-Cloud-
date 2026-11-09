/**
 * A coin dropped by an enemy. Pulled in by the magnet like XP gems.
 * Coins collected during a run are added to the saved total when the run ends.
 */
class Coin extends Pickup {
  constructor(x, y, value = 1) {
    const config = GameConfig.coins;
    super(x, y, config.radius, config.drawSize);
    this.value = value;
  }

  collect(game) {
    game.addCoins(this.value);
    game.effects.sparkle(game.player.x, game.player.y - 20, '#ffd166', 4);
    game.audio.play('coin');
  }

  render(ctx, sprites) {
    const size = this.drawSize;
    const bob = Math.sin(this.bobTime * 5) * 3;
    // A spinning coin: squeeze it horizontally back and forth.
    const width = size * Math.max(0.15, Math.abs(Math.cos(this.bobTime * 3)));
    DrawUtils.shadow(ctx, this.x, this.y + size * 0.55, size * 0.3, 0.25);
    ctx.drawImage(SpriteCache.get(sprites.coin, size), this.x - width / 2, this.y - size / 2 + bob, width, size);
  }
}
