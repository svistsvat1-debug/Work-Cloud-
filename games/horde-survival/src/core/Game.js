/** The states the game can be in. Using constants avoids typos like 'gamover'. */
const GameState = Object.freeze({
  PLAYING: 'playing', // the normal game
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
    this.spawner = new Spawner(this); // creates enemies
    this.weapons = new WeaponSystem(this); // fires at enemies
    this.collisions = new CollisionSystem(this); // checks what touches what
    this.effects = new EffectsSystem(this); // puffs and damage numbers
    this.renderer = new Renderer(this); // draws the world
    this.ui = new UISystem(this); // draws the HUD and menus

    // World objects
    this.enemies = [];
    this.projectiles = [];

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
    this.survivalTime = 0;
    this.kills = 0;

    this.spawner.reset();
    this.weapons.reset();
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
    if (this.state === GameState.GAME_OVER) {
      // The world stays frozen. Only listen for a restart.
      if (this.input.wasPressed('restart') || this.input.wasClicked(this.ui.restartButton)) {
        this.startNewRun();
      }
      return;
    }

    this.survivalTime += dt;

    this.player.update(dt, this);
    this.camera.follow(this.player);
    this.camera.update(dt);

    this.spawner.update(dt);
    this.weapons.update(dt);
    for (const enemy of this.enemies) enemy.update(dt, this);
    for (const projectile of this.projectiles) projectile.update(dt, this);

    this.collisions.update();
    this.effects.update(dt);
    this.ui.update(dt);

    ArrayUtils.removeDead(this.enemies);
    ArrayUtils.removeDead(this.projectiles);
  }

  /** Called by an enemy the moment it dies. */
  onEnemyKilled(enemy) {
    this.kills += 1;
    this.effects.spawnPuff(enemy.x, enemy.y, enemy.stats.color, enemy.drawSize * 0.5);
  }

  /** Called by the player when health reaches 0. */
  onPlayerDied() {
    this.state = GameState.GAME_OVER;
  }

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
