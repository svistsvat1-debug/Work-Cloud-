/**
 * WeaponSystem holds the weapons the player owns and runs them every frame.
 * Each weapon attacks automatically on its own cooldown.
 */
class WeaponSystem {
  constructor(game) {
    this.game = game;
    this.weapons = [];
  }

  /** Clears all weapons and gives the starting weapon. */
  reset() {
    this.weapons = [];
    this.addWeapon(GameConfig.weapons.startingWeapon);
  }

  addWeapon(id) {
    const weapon = this.createWeapon(id);
    this.weapons.push(weapon);
    return weapon;
  }

  createWeapon(id) {
    const definition = WeaponDefinitions[id];
    const WeaponClass = WeaponSystem.BEHAVIORS[definition.behavior];
    return new WeaponClass(id, this.game);
  }

  /** Replaces a weapon with its evolved form, in the same slot. */
  evolve(weaponId, evolvedId) {
    const index = this.weapons.findIndex((weapon) => weapon.id === weaponId);
    if (index === -1) return null;
    const evolved = this.createWeapon(evolvedId);
    this.weapons[index] = evolved;
    return evolved;
  }

  /** True if the player has this weapon, or already evolved it into something else. */
  ownsOrEvolved(id) {
    if (this.getWeapon(id)) return true;
    return EvolutionDefinitions.some((evolution) => evolution.weapon === id && this.getWeapon(evolution.result));
  }

  getWeapon(id) {
    return this.weapons.find((weapon) => weapon.id === id) || null;
  }

  hasFreeSlot() {
    return this.weapons.length < GameConfig.weapons.maxSlots;
  }

  update(dt) {
    for (const weapon of this.weapons) weapon.update(dt);
  }

  render(ctx, sprites) {
    for (const weapon of this.weapons) weapon.render(ctx, sprites);
  }
}

/** Which class runs each `behavior` from WeaponDefinitions. */
WeaponSystem.BEHAVIORS = {
  projectile: ProjectileWeapon,
  orbit: OrbitWeapon,
  pulse: PulseWeapon,
  strike: StrikeWeapon,
};
