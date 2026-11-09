/**
 * GameConfig: the numbers that shape the game live here.
 * Tune the game by changing values in this file, not inside the logic.
 *
 * Units: distances and sizes in pixels, speeds in pixels per second, times in seconds.
 */
const GameConfig = {
  // ---------------------------------------------------------------- Screen
  // The game always renders at this internal resolution.
  // main.js scales the canvas to fit the window while keeping 16:9.
  width: 1920,
  height: 1080,

  // Every character and monster sprite is drawn into a canvas of this size,
  // then drawn smaller on screen (see drawSize below).
  spriteSourceSize: 182,

  // Longest time step simulated in one frame. Prevents huge jumps after the
  // tab was hidden or the browser froze for a moment.
  maxDeltaTime: 0.05,

  // ---------------------------------------------------------------- Player
  player: {
    speed: 300,
    acceleration: 14, // how fast the player reaches full speed (higher = snappier)
    maxHealth: 100,
    radius: 28, // collision circle: smaller than the sprite, so hits feel fair
    drawSize: 128, // on-screen size of the 182x182 sprite
    invulnerabilityTime: 0.6, // seconds of safety after taking a hit
    hurtFlashTime: 0.15, // red flash right after a hit
    hurtShake: { strength: 6, duration: 0.15 }, // a very small screen shake
    blinkRate: 14, // blinking speed while invulnerable
    walkBounce: { speed: 16, amount: 0.05 },
    healthBar: { width: 84, height: 9, offsetY: 0.6 }, // offsetY: fraction of drawSize above the center
    pickupRadius: 36, // gems closer than this are collected
    magnetRadius: 150, // gems closer than this start flying toward the player
  },

  // ---------------------------------------------------------------- Experience
  // XP needed to go from `level` to `level + 1`:
  //   base + linear * (level - 1) + quadratic * (level - 1)^2
  // -> 5, 13, 23, 33, 43 ... fast early level-ups, then a bit slower.
  xp: {
    base: 5,
    linear: 8,
    quadratic: 0.4,
  },

  xpGems: {
    // Bigger gems first. A gem looks like the biggest tier its value reaches.
    tiers: [
      { minValue: 10, sprite: 'gemRed', drawSize: 46 },
      { minValue: 5, sprite: 'gemGreen', drawSize: 40 },
      { minValue: 1, sprite: 'gemBlue', drawSize: 34 },
    ],
    radius: 14,
    // Small chance that an enemy drops a more valuable gem instead.
    bonusDrops: [
      { value: 10, chance: 0.01 },
      { value: 5, chance: 0.04 },
    ],
    maxOnGround: 400, // above this, new XP is merged into the nearest gem (nothing is lost)
  },

  // Pickups fly toward the player once inside the magnet radius.
  pickups: {
    attractStartSpeed: 260,
    attractAcceleration: 2600,
    attractMaxSpeed: 1600,
  },

  levelUp: {
    choices: 3,
    inputDelay: 0.35, // ignore clicks/keys right after the menu opens (avoids accidental picks)
    // When the game resumes, nearby enemies are pushed back and the player is safe for a moment.
    resumePushRadius: 240,
    resumePushForce: 700,
    resumeInvulnerability: 0.5,
  },

  // ---------------------------------------------------------------- Enemies
  // spawnWeight: higher = appears more often.
  // knockbackMultiplier: 1 = normal, higher = flies back further when hit.
  // shadowOffset: how far below the center the shadow sits (bats fly, so theirs is lower).
  enemies: {
    slime: {
      name: 'Slime',
      maxHealth: 20,
      speed: 70,
      damage: 10, // contact damage to the player
      xp: 1, // value of the gem it drops
      radius: 34,
      drawSize: 104,
      knockbackMultiplier: 1,
      spawnWeight: 3,
      wobble: null,
      animation: { style: 'squish', speed: 7, squash: 0.07 },
      shadowOffset: 0.4,
      color: '#9be35a',
    },
    bat: {
      name: 'Bat',
      maxHealth: 10,
      speed: 145,
      damage: 6,
      xp: 1,
      radius: 24,
      drawSize: 92,
      knockbackMultiplier: 1.4,
      spawnWeight: 1,
      wobble: { strength: 70, speed: 5 }, // sideways flutter while chasing
      animation: { style: 'flap', speed: 9, lift: 6, squash: 0.08 },
      shadowOffset: 0.55,
      color: '#b98af0',
    },
  },

  // ---------------------------------------------------------------- Weapons
  // Each weapon's own numbers live in WeaponDefinitions.js.
  weapons: {
    startingWeapon: 'bolt',
    maxSlots: 6, // how many different weapons the player can own
    maxLevel: 8,
    ownedUpgradeWeight: 1.3, // level-ups for owned weapons show up a bit more often than new ones
  },

  // Each passive's own numbers live in PassiveDefinitions.js.
  passives: {
    maxSlots: 6, // how many different passives the player can own
    maxLevel: 5,
    ownedUpgradeWeight: 1.2,
  },

  // ---------------------------------------------------------------- Spawning
  spawn: {
    startInterval: 1.1, // seconds between spawns at the start
    minInterval: 0.3, // the fastest it ever gets
    intervalDecreasePerSecond: 0.004,
    edgeMargin: 120, // enemies appear this far outside the visible screen
    maxEnemies: 300,
  },

  // ---------------------------------------------------------------- Combat
  combat: {
    hitFlashTime: 0.1, // how long an enemy flashes white when hit
    knockbackDecay: 9, // how fast knockback fades (higher = shorter push)
    contactPadding: 2, // enemies this close to the player count as touching
    enemySeparation: 0.5, // how strongly overlapping enemies push apart (0..1)
  },

  // ---------------------------------------------------------------- Effects
  effects: {
    puffDuration: 0.35,
    maxDamageNumbers: 80, // the oldest numbers disappear first when there are more
    damageNumberDuration: 0.7,
    damageNumberRise: 46, // pixels a number floats up during its life
    damageNumberSize: 30,
  },

  // ---------------------------------------------------------------- World
  background: {
    tileSize: 128,
    colors: ['#1c2a21', '#1f2f25'],
    gridColor: 'rgba(255, 255, 255, 0.035)',
  },

  // ---------------------------------------------------------------- Controls
  // Keyboard bindings use KeyboardEvent.code (the physical key),
  // so WASD also works on non-English keyboard layouts.
  controls: {
    up: ['KeyW', 'ArrowUp'],
    down: ['KeyS', 'ArrowDown'],
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    restart: ['KeyR'],
    choice1: ['Digit1', 'Numpad1'],
    choice2: ['Digit2', 'Numpad2'],
    choice3: ['Digit3', 'Numpad3'],
  },

  // ---------------------------------------------------------------- UI
  ui: {
    title: 'Horde Survival',
    font: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
    showDebugInfo: true, // FPS and player position at the bottom right
    // 'damaged' shows enemy health bars only after the first hit (less clutter), 'always' shows all.
    enemyHealthBars: 'damaged',
    enemyHealthBar: { widthFactor: 0.55, height: 5, offsetY: 0.42 },
    playerHealthBar: { x: 40, y: 50, width: 460, height: 30 },
    xpBar: { height: 26 },
    slotIconSize: 60, // weapon icons under the HP bar
    restartButton: { x: 780, y: 690, width: 360, height: 84 },
  },
};
