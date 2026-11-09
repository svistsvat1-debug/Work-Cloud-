/**
 * Pickup: an item lying on the ground (XP gems now; coins and chests later).
 * It stays where it fell. Once the player comes within the magnet radius,
 * it flies to the player, faster and faster. CollisionSystem collects it
 * when it reaches the player's pickup radius.
 */
class Pickup extends Entity {
  constructor(x, y, radius, drawSize, magnetic = true) {
    super(x, y, radius, drawSize);
    this.magnetic = magnetic;
    this.attracted = false;
    this.flySpeed = 0;
    this.bobTime = Math.random() * Math.PI * 2; // for the gentle floating animation
  }

  update(dt, game) {
    this.bobTime += dt;
    if (!this.magnetic) return;

    const player = game.player;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const config = GameConfig.pickups;

    if (!this.attracted && distance < player.magnetRadius) {
      this.attracted = true;
      this.flySpeed = config.attractStartSpeed;
    }
    if (!this.attracted || distance === 0) return;

    // Accelerate toward the player, so it always catches up even if the player runs.
    this.flySpeed = Math.min(config.attractMaxSpeed, this.flySpeed + config.attractAcceleration * dt);
    this.vx = (dx / distance) * this.flySpeed;
    this.vy = (dy / distance) * this.flySpeed;
    this.move(dt);
  }

  /** Called once when the player picks it up. Each pickup type decides what it gives. */
  collect(game) {}
}
