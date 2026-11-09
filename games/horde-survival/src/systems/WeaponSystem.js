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
    const definition = WeaponDefinitions[id];
    const WeaponClass = WeaponSystem.BEHAVIORS[definition.behavior];
    const weapon = new WeaponClass(id, this.game);
    this.weapons.push(weapon);
    return weapon;
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
