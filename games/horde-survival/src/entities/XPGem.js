/**
 * Experience dropped by defeated enemies. It never disappears on its own.
 * Its look depends on its value: blue (1), green (5) or red (10+).
 */
class XPGem extends Pickup {
  constructor(x, y, value) {
    super(x, y, GameConfig.xpGems.radius, 0);
    this.setValue(value);
  }

  setValue(value) {
    this.value = value;
    // Tiers are sorted from the biggest, so the first match is the right look.
    const tier = GameConfig.xpGems.tiers.find((t) => value >= t.minValue);
    this.sprite = tier.sprite;
    this.drawSize = tier.drawSize;
  }

  /** Used when too many gems are on the ground: this gem absorbs another one's XP. */
  addValue(extra) {
    this.setValue(this.value + extra);
  }

  collect(game) {
    game.player.addXp(this.value);
  }

  render(ctx, sprites) {
    const size = this.drawSize;
    const bob = Math.sin(this.bobTime * 4) * 4;
    DrawUtils.shadow(ctx, this.x, this.y + size * 0.55, size * 0.28, 0.25);
    ctx.drawImage(sprites[this.sprite], this.x - size / 2, this.y - size / 2 + bob, size, size);
  }
}
