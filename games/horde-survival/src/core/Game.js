/** The states the game can be in. Using constants avoids typos like 'gamover'. */
const GameState = Object.freeze({
  PLAYING: 'playing', // the normal game
  LEVEL_UP: 'levelup', // the action is paused while the player picks an upgrade
  CHEST: 'chest', // the action is paused while a treasure chest opens
  GAME_OVER: 'gameover', // the player died; the world is frozen until restart
});

/**
 * Game owns everything: the main loop, the world objects and the systems.
 * It decides the order things happen in each frame; the systems do the actual work.
 */
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = GameConfig.width;
    this.height = GameConfig.height;

    this.input = new Input(canvas);
    this.camera = new Camera(this.width, this.height);
    this.sprites = ProceduralSprites.createAll();

    // Systems: each one has a single job.
    this.spawner = new Spawner(this); // places enemies around the screen
    this.waves = new WaveDirector(this); // decides what spawns and when
    this.weapons = new WeaponSystem(this); // fires at enemies
    this.collisions = new CollisionSystem(this); // checks what touches what
    this.upgrades = new UpgradeSystem(this); // level-up choices and chest rewards
    this.effects = new EffectsSystem(this); // puffs and damage numbers
    this.renderer = new Renderer(this); // draws the world
    this.ui = new UISystem(this); // draws the HUD and menus

    // World objects
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];

    // Frame timing
    this.lastTimestamp = null;
    this.fps = 0;
    this.fpsFrames = 0;
    this.fpsTimer = 0;

    // The browser calls loop() without an object, so bind it to this Game.
    this.loop = this.loop.bind(this);

    this.startNewRun();
  }

  start() {
    requestAnimationFrame(this.loop);
  }

  /** Resets the world for a fresh attempt. */
  startNewRun() {
    this.player = new Player(0, 0);
    this.enemies.length = 0;
    this.projectiles.length = 0;
    this.pickups.length = 0;
    this.survivalTime = 0;
    this.kills = 0;
    this.bossesDefeated = 0;
    this.runCoins = 0; // coins earned during this run

    this.spawner.reset();
    this.waves.reset();
    this.weapons.reset(); // also gives the starting weapon
    this.effects.reset();
    this.ui.reset();
    this.camera.follow(this.player);
    this.state = GameState.PLAYING;
  }

  /** The main loop: runs once per screen refresh (usually 60 times per second). */
  loop(timestamp) {
    // Delta time = seconds since the previous frame. Every movement is multiplied
    // by it, so the game runs at the same speed on 60 Hz and 144 Hz screens.
    const rawDt = this.lastTimestamp === null ? 0 : (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    const dt = Math.min(rawDt, GameConfig.maxDeltaTime);

    this.measureFps(rawDt);
    this.update(dt);
    this.render();
    this.input.endFrame();

    requestAnimationFrame(this.loop);
  }

  update(dt) {
    switch (this.state) {
      case GameState.PLAYING:
        this.updatePlaying(dt);
        break;
      case GameState.LEVEL_UP:
        this.ui.levelUpMenu.update(dt); // the world is paused
        break;
      case GameState.CHEST:
        this.ui.chestScreen.update(dt); // the world is paused
        break;
      case GameState.GAME_OVER:
        this.ui.gameOverScreen.update(dt); // the world is frozen
        break;
    }
  }

  updatePlaying(dt) {
    this.survivalTime += dt;

    this.player.update(dt, this);
    this.camera.follow(this.player);
    this.camera.update(dt);

    this.waves.update(dt);
    this.spawner.update(dt);
    this.weapons.update(dt);
    for (const enemy of this.enemies) enemy.update(dt, this);
    for (const projectile of this.projectiles) projectile.update(dt, this);
    for (const pickup of this.pickups) pickup.update(dt, this);

    this.collisions.update();
    this.effects.update(dt);
    this.ui.update(dt);

    ArrayUtils.removeDead(this.enemies);
    ArrayUtils.removeDead(this.projectiles);
    ArrayUtils.removeDead(this.pickups);

    // Only open the menu while still playing (never on top of the game over screen).
    if (this.state === GameState.PLAYING && this.player.pendingLevelUps > 0) this.openLevelUpMenu();
  }

  // ---------------------------------------------------------------- Events

  /** Called by an enemy the moment it dies. */
  onEnemyKilled(enemy) {
    this.kills += 1;
    if (enemy.stats.isBoss) this.bossesDefeated += 1;
    this.effects.spawnPuff(enemy.x, enemy.y, enemy.stats.color, enemy.drawSize * 0.5);
    this.dropXp(enemy.x, enemy.y, enemy.stats.xp);

    // Bosses always drop a treasure chest, elites sometimes.
    const chestChance = enemy.stats.chestChance || 0;
    if (Math.random() < chestChance) this.pickups.push(new Chest(enemy.x, enemy.y));
  }

  addCoins(amount) {
    this.runCoins += amount;
  }

  /** Called by the player when health reaches 0. */
  onPlayerDied() {
    this.state = GameState.GAME_OVER;
  }

  // ---------------------------------------------------------------- XP and level-ups

  /** Drops an XP gem. Sometimes it is a more valuable one (bonusDrops). */
  dropXp(x, y, baseValue) {
    const config = GameConfig.xpGems;
    let value = baseValue;
    const luck = 1 + this.player.stats.luck; // Clover Coin makes valuable gems more likely
    for (const bonus of config.bonusDrops) {
      if (Math.random() < bonus.chance * luck) {
        value = Math.max(value, bonus.value);
        break;
      }
    }

    // Too many gems on the ground? Merge into the nearest one instead (no XP is lost).
    const gems = this.pickups.filter((pickup) => pickup instanceof XPGem);
    if (gems.length >= config.maxOnGround) {
      let nearest = gems[0];
      let nearestDistanceSq = Infinity;
      for (const gem of gems) {
        const distanceSq = MathUtils.distanceSquared(x, y, gem.x, gem.y);
        if (distanceSq < nearestDistanceSq) {
          nearest = gem;
          nearestDistanceSq = distanceSq;
        }
      }
      nearest.addValue(value);
      return;
    }
    this.pickups.push(new XPGem(x, y, value));
  }

  /** Returns false if there was nothing left to offer. */
  openLevelUpMenu() {
    const choices = this.upgrades.rollChoices(GameConfig.levelUp.choices);
    if (choices.length === 0) {
      // Everything is maxed out: nothing to choose.
      this.player.pendingLevelUps = 0;
      return false;
    }
    this.ui.levelUpMenu.open(choices);
    this.state = GameState.LEVEL_UP;
    return true;
  }

  /** Called by the level-up menu when the player picks a card. */
  chooseUpgrade(choice) {
    this.upgrades.apply(choice);
    this.player.pendingLevelUps -= 1;
    // More level-ups waiting? Show a fresh set of cards instead of resuming.
    if (this.player.pendingLevelUps > 0 && this.openLevelUpMenu()) return;
    this.resumePlaying();
  }

  // ---------------------------------------------------------------- Treasure chests

  /** Called when the player touches a chest. */
  openChest() {
    if (this.state !== GameState.PLAYING) return;
    const rewards = this.upgrades.openChest();
    this.ui.chestScreen.open(rewards);
    this.state = GameState.CHEST;
  }

  /** Called by the chest screen when the player continues. */
  closeChest() {
    this.resumePlaying();
  }

  /**
   * Back to the action after a menu. Gives the player a moment to breathe:
   * pushes nearby enemies back and grants brief safety.
   */
  resumePlaying() {
    const { resumePushRadius, resumePushForce, resumeInvulnerability } = GameConfig.levelUp;
    const player = this.player;
    for (const enemy of this.enemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 0 && distance < resumePushRadius) {
        enemy.applyKnockback((dx / distance) * resumePushForce, (dy / distance) * resumePushForce);
      }
    }
    player.invulnerableTimer = Math.max(player.invulnerableTimer, resumeInvulnerability);
    this.effects.spawnPuff(player.x, player.y, '#ffd166', resumePushRadius);
    this.state = GameState.PLAYING;
  }

  // ---------------------------------------------------------------- Drawing

  render() {
    this.renderer.render();
    this.ui.render();
  }

  /** Counts frames and refreshes the FPS number twice per second. */
  measureFps(rawDt) {
    this.fpsFrames += 1;
    this.fpsTimer += rawDt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsTimer);
      this.fpsFrames = 0;
      this.fpsTimer = 0;
    }
  }
}
