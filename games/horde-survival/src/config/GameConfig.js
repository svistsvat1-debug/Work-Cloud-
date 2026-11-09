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

  // Optional image files that replace sprites drawn with code (see ImageSprites.js).
  // Key = sprite name, value = path. Example: player: 'assets/sprites/player.png'
  spriteImages: {},

  // Longest time step simulated in one frame. Prevents huge jumps after the
  // tab was hidden or the browser froze for a moment.
  maxDeltaTime: 0.05,

  // Name of the localStorage entry that keeps coins, upgrades and settings.
  saveKey: 'horde-survival-save-v1',

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
    walkBounce: { speed: 16, amount: 0.025 },
    walkFrameRate: 8, // walk-cycle frames per second
    healthBar: { width: 84, height: 9, offsetY: 0.6 }, // offsetY: fraction of drawSize above the center
    pickupRadius: 36, // gems closer than this are collected
    magnetRadius: 180, // gems closer than this start flying toward the player
  },

  // ---------------------------------------------------------------- Experience
  // XP needed to go from `level` to `level + 1`:
  //   base + linear * (level - 1) + quadratic * (level - 1)^2
  // -> 3, 5, 8, 11, 15, 19, 23 ... ~38 at level 10, ~101 at level 20:
  // very frequent level-ups early (about 5 in the first minute), then gradually slower.
  xp: {
    base: 3,
    linear: 2.2,
    quadratic: 0.2,
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

  // Coins: any enemy may drop one; elites and bosses drop a handful (enemy "coins").
  coins: {
    dropChance: 0.04, // 4% per normal enemy (luck raises it)
    radius: 14,
    drawSize: 34,
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
  // Which enemies appear when is decided by WaveDefinitions.js.
  //   group: how many spawn together [min, max]
  //   knockbackMultiplier: 1 = normal, lower = heavier (hardly pushed back)
  //   shadowOffset: how far below the center the shadow sits (bats fly, so theirs is lower)
  //   alwaysShowHealthBar: show the bar even before the first hit
  //   chestChance: chance to drop a treasure chest (chests arrive in a later step)
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
      group: [1, 3],
      wobble: null,
      animation: { style: 'squish', speed: 7, squash: 0.06, frameRate: 3 },
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
      group: [2, 4],
      wobble: { strength: 70, speed: 5 }, // sideways flutter while chasing
      animation: { style: 'flap', speed: 9, lift: 6, squash: 0.03, frameRate: 12 },
      shadowOffset: 0.55,
      color: '#b98af0',
    },
    crawler: {
      name: 'Crawler',
      maxHealth: 24,
      speed: 105,
      damage: 9,
      xp: 2,
      radius: 26, // a bit smaller than its body: easy to slip past
      drawSize: 96,
      knockbackMultiplier: 1.1,
      group: [1, 3],
      wobble: null,
      animation: { style: 'scuttle', speed: 18, squash: 0.04, frameRate: 10 },
      shadowOffset: 0.36,
      color: '#ef8a3c',
    },
    brute: {
      name: 'Brute',
      maxHealth: 110,
      speed: 52,
      damage: 16,
      xp: 5,
      radius: 50,
      drawSize: 150,
      knockbackMultiplier: 0.3,
      group: [1, 1],
      wobble: null,
      animation: { style: 'stomp', speed: 5, lift: 6, squash: 0.05, frameRate: 4 },
      shadowOffset: 0.42,
      color: '#a8896a',
    },
    elite: {
      name: 'Elite',
      maxHealth: 320,
      speed: 82,
      damage: 20,
      xp: 10,
      radius: 56,
      drawSize: 172,
      knockbackMultiplier: 0.2,
      group: [1, 1],
      wobble: null,
      animation: { style: 'stomp', speed: 6, lift: 5, squash: 0.04, frameRate: 3 },
      shadowOffset: 0.42,
      color: '#ff5a5a',
      alwaysShowHealthBar: true,
      chestChance: 0.4,
      coins: [5, 10], // always drops this many coins (min, max)
    },
    boss: {
      name: 'Dread Colossus',
      maxHealth: 800,
      speed: 58, // slightly slower than normal enemies
      damage: 25,
      xp: 30,
      radius: 82,
      drawSize: 290, // the 182x182 sprite drawn much bigger
      knockbackMultiplier: 0.05,
      group: [1, 1],
      wobble: null,
      animation: { style: 'stomp', speed: 3.5, lift: 8, squash: 0.04, frameRate: 3 },
      shadowOffset: 0.42,
      color: '#c77dff',
      isBoss: true, // gets the big health bar at the top of the screen
      chestChance: 1,
      coins: [20, 35],
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
    edgeMargin: 120, // enemies appear this far outside the visible screen
    groupSpread: 60, // members of a group appear this close to each other
    maxEnemies: 350, // above this, spawning waits instead of slowing the game down
    recycleDistance: 1700, // enemies further than this are moved back near the screen
  },

  // How the game gets harder over time (on top of WaveDefinitions).
  difficulty: {
    healthGrowthPerMinute: 0.15, // +15% enemy HP per minute
    speedGrowthPerMinute: 0.03, // +3% enemy speed per minute...
    maxSpeedMultiplier: 1.3, // ...but never more than +30%, so the player can always outrun them
    extraSpawnsPerMinute: 0.5, // after the last wave: +0.5 spawns per second, every minute
    maxSpawnsPerSecond: 9,
  },

  // A boss arrives on a fixed timer and always drops a treasure chest.
  bosses: {
    firstAt: 120, // seconds
    interval: 120, // a new boss every 2 minutes
    healthGrowthPerBoss: 0.5, // each next boss has +50% health (on top of the time scaling)
  },

  // Treasure chests (from bosses, sometimes from elites).
  chests: {
    drawSize: 112,
    radius: 44,
    coins: { min: 20, max: 40, perMinute: 6 }, // every chest gives coins; more later in the run
    extraRewardChances: [0.4, 0.15], // chance for a 2nd and a 3rd item reward (luck adds to it)
    healBelowFraction: 0.7, // the chest also heals if HP is below 70%...
    healFraction: 0.3, // ...by 30% of max HP
    fallbackCoins: 60, // extra coins when every weapon and passive is already maxed
  },

  // Elites come on their own timer, not from the wave weights.
  elites: {
    firstAt: 150, // seconds
    interval: 60, // seconds between elites at first...
    minInterval: 30, // ...getting shorter over time, but never below this
    intervalDecreasePerMinute: 4,
  },

  // ---------------------------------------------------------------- Combat
  collision: {
    gridCellSize: 128, // size of the spatial grid cells used to find nearby enemies quickly
  },

  performance: {
    squashEnemyLimit: 120, // above this many enemies, skip the squash animation (faster drawing)
  },

  combat: {
    hitFlashTime: 0.1, // how long an enemy flashes white when hit
    knockbackDecay: 9, // how fast knockback fades (higher = shorter push)
    contactPadding: 2, // enemies this close to the player count as touching
    enemySeparation: 0.5, // how strongly overlapping enemies push apart (0..1)
  },

  // ---------------------------------------------------------------- Effects
  effects: {
    maxParticles: 600, // hard cap: extra particles are simply skipped
    puffDuration: 0.35,
    maxDamageNumbers: 50, // the oldest numbers disappear first when there are more
    damageNumberDuration: 0.7,
    damageNumberRise: 46, // pixels a number floats up during its life
    damageNumberSize: 30,
  },

  // ---------------------------------------------------------------- World
  // The endless ground (see WorldRenderer). Sizes in pixels.
  world: {
    tileSize: 256, // seamless ground tiles
    groundVariants: 4, // different tiles mixed at random, so no pattern is visible
    patches: {
      cellSize: 640, // at most one big patch per 640x640 area...
      chance: 0.55, // ...with this chance
      minSize: 380,
      maxSize: 760,
      weights: { moss: 4, dirt: 3, meadow: 2, stone: 1.2 },
    },
    decorations: {
      cellSize: 210, // at most one decoration per 210x210 area (keeps the ground clean)
      chance: 0.2,
      types: [
        { sprite: 'decoGrass', weight: 5, size: [56, 84] },
        { sprite: 'decoStones', weight: 3, size: [50, 74] },
        { sprite: 'decoRock', weight: 2.5, size: [72, 110] },
        { sprite: 'decoBones', weight: 1.4, size: [62, 84] },
        { sprite: 'decoCandles', weight: 1, size: [62, 78], flames: true },
        { sprite: 'decoGrave', weight: 1, size: [82, 110] },
        { sprite: 'decoPillar', weight: 0.7, size: [104, 150] },
        { sprite: 'decoBell', weight: 0.6, size: [72, 92] },
      ],
    },
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
    confirm: ['Space', 'Enter', 'NumpadEnter'],
    back: ['Escape'],
    mute: ['KeyM'],
    pause: ['Escape', 'KeyP'],
    debug: ['F3', 'Backquote'], // debug panel with performance numbers and test cheats
  },

  // ---------------------------------------------------------------- Audio
  audio: {
    volume: 0.5,
    // Minimum seconds between two plays of the same sound (keeps big fights from getting noisy).
    minGap: { shoot: 0.07, hit: 0.045, death: 0.035, pickup: 0.03, coin: 0.05, hurt: 0.2 },
  },

  // Screen shakes (pixels, seconds). Small on purpose: shake should be felt, not annoying.
  shakes: {
    bossDeath: { strength: 14, duration: 0.45 },
    chestOpen: { strength: 8, duration: 0.25 },
    evolution: { strength: 13, duration: 0.4 },
  },

  // ---------------------------------------------------------------- UI
  ui: {
    title: 'Horde Survival',
    tagline: 'Survive the endless horde',
    // Picture behind the start screen and the shop. null = a background drawn with code.
    menuBackgroundImage: 'assets/images/menu-background.jpg',
    font: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
    showDebugInfo: true, // FPS and player position at the bottom right
    // 'damaged' shows enemy health bars only after the first hit (less clutter), 'always' shows all.
    enemyHealthBars: 'damaged',
    enemyHealthBar: { widthFactor: 0.55, height: 5, offsetY: 0.42 },
    bannerDuration: 2.6, // seconds a banner stays on screen (several banners queue up)
    bossBar: { width: 760, height: 24, y: 168 },
    muteButton: { x: 1852, y: 136, width: 48, height: 48 },
    lowHealthWarning: 0.25, // red pulsing edges below 25% HP
    playerHealthBar: { x: 40, y: 50, width: 460, height: 30 },
    xpBar: { height: 26 },
    slotIconSize: 60, // weapon icons under the HP bar
    restartButton: { x: 780, y: 690, width: 360, height: 84 },
  },
};
