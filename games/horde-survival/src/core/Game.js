/** The states the game can be in. Using constants avoids typos like 'gamover'. */
const GameState = Object.freeze({
  START: 'start', // title screen
  SHOP: 'shop', // permanent upgrades between runs
  PLAYING: 'playing', // the normal game
  PAUSED: 'paused', // Esc / P, or the window lost focus
  LEVEL_UP: 'levelup', // the action is paused while the player picks an upgrade
  CHEST: 'chest', // the action is paused while a treasure chest opens
  GAME_OVER: 'gameover', // the player died; the run summary is shown
});

/**
 * Game owns everything: the main loop, the world objects and the systems.
 * It decides the order things happen in each frame; the systems do the actual work.
 *
 * Flow: START -> SHOP -> PLAYING (with LEVEL_UP / CHEST pauses) -> GAME_OVER -> SHOP or PLAYING
 */
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = GameConfig.width;
    this.height = GameConfig.height;

    this.input = new Input(canvas);
    this.camera = new Camera(this.width, this.height);
    this.audio = new AudioSystem(); // generated sounds, starts after the first click/key
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
    // Picture files replace the code-drawn sprites as soon as they load.
    ImageSprites.loadInto(this.sprites, this.renderer.world.art);

    // World objects
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];

    // Frame timing
    this.clock = 0; // real seconds since the page opened (for animations that never pause)
    this.lastTimestamp = null;
    this.fps = 0;
    this.fpsFrames = 0;
    this.fpsTimer = 0;

    // The browser calls loop() without an object, so bind it to this Game.
    this.loop = this.loop.bind(this);

    // Pause automatically when the player switches to another window or tab.
    window.addEventListener('blur', () => this.pause());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pause();
    });
    this.frameTime = 0; // milliseconds spent on update + render (debug panel)
    this.godMode = false; // debug cheat
    this.previousState = null; // to notice when the screen changes (see update)

    this.startNewRun(); // prepares an empty world...
    this.showStartScreen(); // ...but we begin on the title screen
  }

  start() {
    requestAnimationFrame(this.loop);
  }

  // ---------------------------------------------------------------- Screens and runs

  showStartScreen() {
    this.state = GameState.START;
  }

  openShop() {
    this.ui.shopScreen.open();
    this.state = GameState.SHOP;
  }

  /** Resets the world for a fresh attempt, with the permanent upgrades from the shop. */
  startNewRun() {
    const permanent = SaveData.data.upgrades;
    this.player = new Player(0, 0, permanent);
    this.enemies.length = 0;
    this.projectiles.length = 0;
    this.pickups.length = 0;
    this.survivalTime = 0;
    this.kills = 0;
    this.bossesDefeated = 0;
    this.weaponsEvolved = []; // names of weapons evolved this run
    this.runCoins = ShopDefinitions.startingCoins.perLevel * (permanent.startingCoins || 0);
    this.xpGemCount = 0;

    this.camera.reset();
    this.collisions.reset();
    this.spawner.reset();
    this.waves.reset();
    this.weapons.reset(); // also gives the starting weapon
    this.effects.reset();
    this.ui.reset();
    this.camera.follow(this.player);
    this.state = GameState.PLAYING;
  }

  // ---------------------------------------------------------------- Main loop

  /** The main loop: runs once per screen refresh (usually 60 times per second). */
  loop(timestamp) {
    // Delta time = seconds since the previous frame. Every movement is multiplied
    // by it, so the game runs at the same speed on 60 Hz and 144 Hz screens.
    const rawDt = this.lastTimestamp === null ? 0 : (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    this.clock = timestamp / 1000;
    const dt = Math.min(rawDt, GameConfig.maxDeltaTime);

    this.measureFps(rawDt);
    const workStart = performance.now();
    this.update(dt);
    this.render();
    this.frameTime = MathUtils.lerp(this.frameTime, performance.now() - workStart, 0.1);
    this.input.endFrame();

    requestAnimationFrame(this.loop);
  }

  update(dt) {
    // When a menu opens or closes, a finger still on the screen must be lifted
    // and put down again to steer: a tap on a menu card never moves the hero.
    if (this.state !== this.previousState) {
      this.input.releaseStick();
      this.previousState = this.state;
    }

    // Mute works on every screen (M key or the speaker button).
    const padding = GameConfig.touch.buttonPadding;
    if (this.input.wasPressed('mute') || this.input.wasClicked(GameConfig.ui.muteButton, padding)) {
      this.audio.toggleMute();
      this.input.pointer.pressed = false; // the click must not also press something underneath
    }
    if (this.input.wasPressed('debug')) this.ui.showDebugPanel = !this.ui.showDebugPanel;

    switch (this.state) {
      case GameState.START:
        this.ui.startScreen.update(dt);
        break;
      case GameState.SHOP:
        this.ui.shopScreen.update(dt);
        break;
      case GameState.PLAYING:
        if (this.input.wasPressed('pause') || this.input.wasClicked(GameConfig.ui.pauseButton, padding)) {
          this.input.pointer.pressed = false; // the tap must not also press the pause menu's buttons
          this.pause();
          break;
        }
        if (this.ui.showDebugPanel) this.handleDebugKeys();
        this.updatePlaying(dt);
        break;
      case GameState.PAUSED:
        this.ui.pauseScreen.update(dt);
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

  // ---------------------------------------------------------------- Pause and debug

  pause() {
    if (this.state === GameState.PLAYING) this.state = GameState.PAUSED;
  }

  resume() {
    if (this.state === GameState.PAUSED) this.state = GameState.PLAYING;
  }

  /** "End run" in the pause menu: same as dying (coins are kept). */
  endRun() {
    this.player.currentHealth = 0;
    this.onPlayerDied();
  }

  /** Test cheats, only while the debug panel (F3) is open. */
  handleDebugKeys() {
    const keys = this.input.keysPressed;
    const player = this.player;
    if (keys.has('KeyL')) player.addXp(player.xpToNextLevel - player.xp);
    if (keys.has('KeyT')) this.survivalTime += 60;
    if (keys.has('KeyE')) this.spawner.spawnGroup('elite', 1, this.waves.scaling(this.survivalTime));
    if (keys.has('KeyB')) this.spawner.spawnGroup('boss', 1, this.waves.scaling(this.survivalTime));
    if (keys.has('KeyK')) for (const enemy of this.enemies) enemy.takeDamage(1e9, this);
    if (keys.has('KeyG')) this.godMode = !this.godMode;
    if (keys.has('KeyI')) ImageSprites.setEnabled(!ImageSprites.enabled); // pictures <-> code-drawn art
    if (this.godMode) player.invulnerableTimer = Math.max(player.invulnerableTimer, 0.1);
  }

  // ---------------------------------------------------------------- Events

  /** Called by an enemy the moment it dies. */
  onEnemyKilled(enemy) {
    this.kills += 1;
    this.effects.spawnPuff(enemy.x, enemy.y, enemy.stats.color, enemy.drawSize * 0.5);
    // Bigger enemies burst into more particles.
    this.effects.burst(enemy.x, enemy.y, enemy.stats.color, Math.round(6 + enemy.radius / 5), 160 + enemy.radius * 2);
    if (enemy.stats.isBoss) {
      this.bossesDefeated += 1;
      const shake = GameConfig.shakes.bossDeath;
      this.camera.shake(shake.strength, shake.duration);
      this.effects.burst(enemy.x, enemy.y, '#ffd166', 40, 420, 9);
      this.audio.play('bossDeath');
    } else {
      this.audio.play('death');
    }
    this.dropXp(enemy.x, enemy.y, enemy.stats.xp);
    this.dropCoins(enemy);

    // Bosses always drop a treasure chest, elites sometimes.
    const chestChance = enemy.stats.chestChance || 0;
    if (Math.random() < chestChance) this.pickups.push(new Chest(enemy.x, enemy.y));
  }

  addCoins(amount) {
    this.runCoins += amount;
  }

  /** Called by the player when health reaches 0. */
  onPlayerDied() {
    this.audio.play('gameOver');
    this.bankRun();
    this.ui.gameOverScreen.open();
    this.state = GameState.GAME_OVER;
  }

  /** Adds this run's coins to the saved total and remembers the best time. */
  bankRun() {
    const save = SaveData.data;
    save.totalCoins += this.runCoins;
    this.isNewBestTime = this.survivalTime > save.bestTime;
    if (this.isNewBestTime) save.bestTime = this.survivalTime;
    SaveData.save();
  }

  // ---------------------------------------------------------------- Drops

  /** Drops an XP gem. Sometimes it is a more valuable one (bonusDrops). */
  dropXp(x, y, baseValue) {
    const config = GameConfig.xpGems;
    let value = baseValue;
    const luck = 1 + this.player.stats.luck; // Wishing Chime makes valuable gems more likely
    for (const bonus of config.bonusDrops) {
      if (Math.random() < bonus.chance * luck) {
        value = Math.max(value, bonus.value);
        break;
      }
    }

    // Too many gems on the ground? Merge into the nearest one instead (no XP is lost).
    if (this.xpGemCount >= config.maxOnGround) {
      let nearest = null;
      let nearestDistanceSq = Infinity;
      for (const pickup of this.pickups) {
        if (!(pickup instanceof XPGem) || pickup.dead) continue;
        const distanceSq = MathUtils.distanceSquared(x, y, pickup.x, pickup.y);
        if (distanceSq < nearestDistanceSq) {
          nearest = pickup;
          nearestDistanceSq = distanceSq;
        }
      }
      if (nearest) {
        nearest.addValue(value);
        return;
      }
    }
    this.pickups.push(new XPGem(x, y, value));
    this.xpGemCount += 1;
  }

  /** Elites and bosses always drop a handful of coins; other enemies sometimes drop one. */
  dropCoins(enemy) {
    let count = 0;
    if (enemy.stats.coins) {
      count = MathUtils.randomInt(enemy.stats.coins[0], enemy.stats.coins[1]);
    } else if (Math.random() < GameConfig.coins.dropChance * (1 + this.player.stats.luck)) {
      count = 1;
    }
    const spread = count > 1 ? enemy.radius : 0;
    for (let i = 0; i < count; i++) {
      const x = enemy.x + MathUtils.randomRange(-spread, spread);
      const y = enemy.y + MathUtils.randomRange(-spread, spread);
      this.pickups.push(new Coin(x, y));
    }
  }

  // ---------------------------------------------------------------- Level-ups

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
    this.audio.play('levelUp');
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

  /** Menus (start, shop) cover the whole screen; otherwise the world is drawn under the HUD. */
  isMenuScreen() {
    return this.state === GameState.START || this.state === GameState.SHOP;
  }

  render() {
    if (!this.isMenuScreen()) this.renderer.render();
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
