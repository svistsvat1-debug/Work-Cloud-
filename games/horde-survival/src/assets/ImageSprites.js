/**
 * ImageSprites lets picture files replace the sprites drawn with code.
 *
 * GameConfig.spriteImages lists them, e.g. { player: 'assets/sprites/player.png' }.
 * A list of files means several animation frames (characters) or several
 * variants (ground tiles). Until a picture has loaded, or if a file is
 * missing, the sprite drawn with code stays in place, so the game always works.
 *
 * Both versions are kept in memory: setEnabled(false) brings the code-drawn
 * art back (key I while the debug panel is open), handy for comparing them.
 *
 * Pictures: square PNGs with a transparent background, 182x182 for characters,
 * items and decorations (any size works, it is scaled when drawn). A ground
 * tile is drawn at its own size, so its width is the tile size on screen.
 */
const ImageSprites = {
  sprites: null, // the game's sprites (characters, items, icons)
  worldArt: null, // the ground tiles and decorations (WorldRenderer)
  pictures: {}, // key -> canvas, or list of canvases, made from the files
  drawn: {}, // key -> the code-drawn sprite a picture replaced
  pictureCanvases: new WeakSet(), // to tell pictures and code-drawn art apart
  enabled: true,

  loadInto(sprites, worldArt) {
    this.sprites = sprites;
    this.worldArt = worldArt;
    this.enabled = GameConfig.useSpriteImages;

    for (const [key, files] of Object.entries(GameConfig.spriteImages)) {
      if (!this.targetOf(key)) {
        console.warn(`GameConfig.spriteImages: there is no sprite called "${key}"`);
        continue;
      }
      const paths = Array.isArray(files) ? files : [files];
      Promise.all(paths.map((path) => this.load(path)))
        .then((images) => this.add(key, images.map((image) => this.toCanvas(image))))
        .catch((path) => console.warn(`Sprite image not found, keeping the drawn sprite: ${path}`));
    }
  },

  /** Resolves with the loaded image, or fails with the path if the file is missing. */
  load(path) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(path);
      image.src = path;
    });
  },

  toCanvas(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext('2d').drawImage(image, 0, 0);
    this.pictureCanvases.add(canvas);
    return canvas;
  },

  add(key, canvases) {
    const target = this.targetOf(key);
    // Characters and ground tiles are lists (frames / variants); everything else is one image.
    this.pictures[key] = Array.isArray(target[key]) ? canvases : canvases[0];
    this.drawn[key] = target[key];
    if (this.enabled) this.put(key);
  },

  /** Shows the picture, or the code-drawn sprite when pictures are switched off. */
  put(key) {
    this.targetOf(key)[key] = this.enabled ? this.pictures[key] : this.drawn[key];
    // Characters have tinted copies for hit flashes; they must follow the new frames.
    if (key === 'player' || key in GameConfig.enemies) ProceduralSprites.addHitTints(this.sprites);
  },

  setEnabled(enabled) {
    this.enabled = enabled;
    for (const key of Object.keys(this.pictures)) this.put(key);
  },

  /** Which collection a sprite name belongs to (or undefined if none has it). */
  targetOf(key) {
    if (key in this.sprites) return this.sprites;
    if (this.worldArt && key in this.worldArt) return this.worldArt;
    return undefined;
  },

  isPicture(canvas) {
    return this.pictureCanvases.has(canvas);
  },
};
