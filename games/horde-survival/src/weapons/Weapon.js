/**
 * Weapon: the shared part of every weapon.
 *
 * A weapon reads its numbers from WeaponDefinitions[id], gets stronger with
 * each level and attacks on its own cooldown. Subclasses only decide what
 * "fire" means (shoot a bolt, release a pulse, call lightning...).
 */
class Weapon {
  constructor(id, game) {
    this.id = id;
    this.game = game;
    this.definition = WeaponDefinitions[id];
    this.level = 1;
    this.cooldownTimer = 0;
    this.recalculate();
  }

  get name() {
    return this.definition.name;
  }

  /** Evolved weapons are already at their peak: their only level is the max level. */
  get isEvolved() {
    return Boolean(this.definition.isEvolution);
  }

  get maxLevel() {
    return this.isEvolved ? 1 : GameConfig.weapons.maxLevel;
  }

  isMaxLevel() {
    return this.level >= this.maxLevel;
  }

  levelUp() {
    if (this.isMaxLevel()) return;
    this.level += 1;
    this.recalculate();
  }

  /** this.stats = base stats + the bonus of every level reached so far. */
  recalculate() {
    const stats = { ...this.definition.base };
    for (let level = 2; level <= this.level; level++) {
      const bonus = this.definition.levels[level - 2];
      for (const [stat, value] of Object.entries(bonus)) {
        stats[stat] = (stats[stat] || 0) + value;
      }
    }
    this.stats = stats;
  }

  // Final numbers, including the player's upgrades. Read them every time,
  // so a new upgrade affects all weapons immediately.
  get damage() {
    return this.stats.damage * this.game.player.stats.damageMultiplier;
  }

  get cooldown() {
    return Math.max(0.1, this.stats.cooldown * this.game.player.stats.cooldownMultiplier);
  }

  update(dt) {
    this.cooldownTimer -= dt;
    if (this.cooldownTimer > 0) return;
    // fire() returns false when there was nothing to attack: then we stay ready
    // and attack as soon as an enemy shows up.
    if (this.fire()) this.cooldownTimer = this.cooldown;
  }

  /** Override in subclasses. Return true if the weapon attacked. */
  fire() {
    return false;
  }

  /** Override to draw things the weapon owns (blades, rings, lightning). */
  render(ctx, sprites) {}

  /** Damages an enemy and pushes it straight away from the player. */
  hitAwayFromPlayer(enemy, knockback) {
    const player = this.game.player;
    const away = MathUtils.normalize(enemy.x - player.x, enemy.y - player.y);
    enemy.takeDamage(this.damage, this.game, away.x * knockback, away.y * knockback);
  }
}
