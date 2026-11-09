/**
 * GameConfig holds the numbers that shape the game.
 * Tune the game here instead of hunting for numbers inside the logic.
 */
const GameConfig = {
  // The game always renders at this internal resolution.
  // main.js scales the canvas to fit the window while keeping 16:9.
  width: 1920,
  height: 1080,

  // Every character and monster sprite is drawn into a canvas of this size.
  spriteSourceSize: 182,

  // Longest time step (seconds) simulated in one frame. Prevents huge jumps
  // after the tab was hidden or the browser froze for a moment.
  maxDeltaTime: 0.05,

  player: {
    speed: 300, // pixels per second
    acceleration: 14, // how fast the player reaches full speed (higher = snappier)
    drawSize: 128, // on-screen size of the 182x182 sprite
    radius: 28, // collision circle: smaller than the sprite, so hits feel fair
    maxHealth: 100,
    invulnerabilityTime: 0.6, // seconds of safety after taking a hit
    hurtFlashTime: 0.15, // red flash right after a hit
    hurtShake: { strength: 6, duration: 0.15 }, // a very small screen shake
  },

  combat: {
    hitFlashTime: 0.1, // how long an enemy flashes white when hit
    knockbackDecay: 9, // how fast knockback fades (higher = shorter push)
    contactPadding: 2, // enemies this close to the player count as touching
  },

  effects: {
    maxDamageNumbers: 80, // oldest numbers disappear first when there are more
    damageNumberDuration: 0.7,
    damageNumberRise: 46, // pixels a number floats up during its life
  },

  // Enemy types. spawnWeight: higher = appears more often.
  // shadowOffset: how far below the center the shadow sits (bats fly, so theirs is lower).
  enemies: {
    slime: {
      name: 'Slime',
      maxHealth: 20,
      speed: 70,
      radius: 34,
      drawSize: 104,
      damage: 10, // contact damage to the player
      knockbackMultiplier: 1, // 1 = normal, higher = flies back further
      spawnWeight: 3,
      animation: 'squish',
      wobble: 0,
      shadowOffset: 0.4,
      color: '#9be35a',
    },
    bat: {
      name: 'Bat',
      maxHealth: 10,
      speed: 145,
      radius: 24,
      drawSize: 92,
      damage: 6,
      knockbackMultiplier: 1.4,
      spawnWeight: 1,
      animation: 'flap',
      wobble: 70, // sideways flutter speed (pixels per second)
      shadowOffset: 0.55,
      color: '#b98af0',
    },
  },

  spawn: {
    startInterval: 1.1, // seconds between spawns at the start
    minInterval: 0.3, // the fastest it ever gets
    intervalDecreasePerSecond: 0.004,
    edgeMargin: 120, // enemies appear this far outside the visible screen
    maxEnemies: 300,
  },

  // The automatic magic bolt
  autoAttack: {
    cooldown: 0.6, // seconds between shots
    damage: 10,
    range: 950, // only enemies closer than this are targeted (about one screen)
    projectileSpeed: 900,
    projectileRadius: 12,
    projectileDrawSize: 64,
    projectileLifetime: 2,
    knockback: 280, // push speed given to an enemy on hit
  },

  collision: {
    enemySeparation: 0.5, // how strongly overlapping enemies push apart (0..1)
  },

  background: {
    tileSize: 128,
    colors: ['#1c2a21', '#1f2f25'],
    gridColor: 'rgba(255, 255, 255, 0.035)',
  },

  // Keyboard bindings use KeyboardEvent.code (the physical key),
  // so WASD also works on non-English keyboard layouts.
  controls: {
    up: ['KeyW', 'ArrowUp'],
    down: ['KeyS', 'ArrowDown'],
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    restart: ['KeyR'],
  },

  ui: {
    title: 'Horde Survival',
    font: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
    // 'damaged' shows enemy health bars only after the first hit (less clutter), 'always' shows all.
    enemyHealthBars: 'damaged',
  },
};
