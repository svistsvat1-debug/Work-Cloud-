/**
 * Game owns everything: the main loop, the world objects and the systems.
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
    this.renderer = new Renderer(this);
    this.ui = new UISystem(this);

    this.player = new Player(0, 0);

    // Frame timing
    this.lastTimestamp = null;
    this.fps = 0;
    this.fpsFrames = 0;
    this.fpsTimer = 0;

    // The browser calls loop() without an object, so bind it to this Game.
    this.loop = this.loop.bind(this);
  }

  start() {
    requestAnimationFrame(this.loop);
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
    this.player.update(dt, this);
    this.camera.follow(this.player);
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
