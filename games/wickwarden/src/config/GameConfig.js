// Central place for the numbers that tune the game.
// Change values here instead of hunting for "magic numbers" inside systems.

export const GameConfig = {
  title: 'WICKWARDEN',
  subtitle: 'Keep the last light burning',

  // The game always renders at this internal resolution and is scaled to fit the window (16:9).
  width: 1920,
  height: 1080,

  // Every character / monster source sprite is drawn on a canvas of this size.
  spriteSize: 182,

  // Clamp big frame gaps (e.g. after switching tabs) so the simulation never "teleports".
  maxDeltaTime: 0.05,

  saveKey: 'wickwarden.save.v1',

  // Optional painted menu background (1920x1080 PNG/JPG), e.g. 'assets/menu-background.png'.
  // Leave null to use the built-in procedural pixel-art scene.
  menuBackgroundImage: null,

  player: {
    maxHealth: 100,
    speed: 330, // pixels per second
    acceleration: 14, // higher = snappier start/stop
    radius: 28, // collision circle — much smaller than the 182px sprite
    drawSize: 124, // on-screen size of the 182px source sprite
    invincibleTime: 0.6, // seconds of protection after taking a hit
    pickupRadius: 48,
    magnetRadius: 180,
    maxWeapons: 4,
    maxPassives: 6,
    healOnLevelUpFallback: 30,
    coinsFallback: 25,
  },

  // XP needed to go from `level` to `level + 1`:
  // base + linear * (level - 1) + curve * (level - 1)^2
  xp: { base: 4, linear: 3.5, curve: 0.35 },

  gems: {
    // value thresholds -> visual tier
    tiers: [
      { minValue: 10, tier: 'red' },
      { minValue: 5, tier: 'green' },
      { minValue: 1, tier: 'blue' },
    ],
    radius: 14,
    drawSize: 44,
    maxCount: 320, // above this, new gems merge into nearby ones (performance)
    mergeDistance: 260,
  },

  coins: {
    radius: 14,
    drawSize: 40,
    baseDropChance: 0.06,
    luckDropBonus: 0.04, // added per 1.0 luck
  },

  pickups: {
    magnetAcceleration: 2600,
    magnetMaxSpeed: 1500,
  },

  enemies: {
    slime: { name: 'Inkling', hp: 12, speed: 80, damage: 7, radius: 28, drawSize: 104, xp: 1, knockbackResist: 0, sprite: 'slime' },
    bat: { name: 'Soot Moth', hp: 8, speed: 158, damage: 5, radius: 22, drawSize: 96, xp: 1, knockbackResist: 0, sprite: 'bat', wobble: true },
    crawler: { name: 'Ash Tick', hp: 20, speed: 122, damage: 7, radius: 21, drawSize: 96, xp: 2, knockbackResist: 0.2, sprite: 'crawler' },
    brute: { name: 'Smog Brute', hp: 120, speed: 62, damage: 13, radius: 46, drawSize: 164, xp: 5, knockbackResist: 0.7, sprite: 'brute' },
    elite: { name: 'Snuffer Knight', hp: 330, speed: 96, damage: 16, radius: 44, drawSize: 176, xp: 10, knockbackResist: 0.8, sprite: 'elite', isElite: true },
    boss: { name: 'The Wick-Eater', hp: 1800, speed: 76, damage: 22, radius: 76, drawSize: 300, xp: 40, knockbackResist: 0.96, sprite: 'boss', isBoss: true },
  },

  boss: {
    interval: 120, // a boss every 2 minutes
    healthGrowthPerBoss: 0.85, // boss #n has hp * (1 + growth * (n - 1))
    dashCooldown: 5.5,
    dashWindup: 0.75, // telegraph time before the dash — keeps it fair
    dashDuration: 0.55,
    dashSpeedMult: 3.6,
    gemCount: 8,
    coinCount: 20,
  },

  spawn: {
    margin: 140, // how far outside the visible screen enemies appear
    maxEnemies: 320, // performance cap — spawning is delayed above this
    despawnDistance: 2300, // enemies left far behind are moved back near the player
    groupSpread: 70,
    surroundStart: 90, // first "they close in" ring event (seconds)
    surroundInterval: 60,
    surroundRadius: 1180, // just outside the screen corners
  },

  // Enemies slowly get stronger over time (minutes = survival time / 60).
  scaling: {
    healthPerMinute: 0.18,
    healthPerMinuteSq: 0.015,
    speedPerMinute: 0.035,
    maxSpeedMult: 1.45,
    damagePerMinute: 0.08,
    lateGameStart: 300, // after this, spawn interval keeps shrinking
    lateGameRampSeconds: 900,
    minIntervalMult: 0.4,
  },

  chest: {
    eliteDropChance: 0.08,
    bonusRewardChance: 0.12, // + luck * 0.5
    coinReward: [30, 60],
    healReward: 40,
    revealTime: 1.15, // shake + light burst before the reward appears
  },

  effects: {
    maxParticles: 450,
    maxFloatingTexts: 45,
    maxShake: 16,
    shake: { playerHit: 6, bossDeath: 14, chestOpen: 7, evolution: 15 },
  },

  collision: {
    cellSize: 128,
    separationStrength: 0.45,
  },

  lighting: {
    innerRadius: 260,
    outerRadius: 1100,
    darkness: 0.5,
  },
};
