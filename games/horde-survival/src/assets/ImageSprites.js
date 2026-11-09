/**
 * ImageSprites lets real image files replace the procedural sprites.
 *
 * List the files in GameConfig.spriteImages, e.g. { player: 'assets/sprites/player.png' }.
 * Each image is drawn into a 182x182 canvas, so the rest of the game can't tell
 * the difference. Until an image has loaded (or if the file is missing), the
 * sprite drawn with code stays in place.
 */
const ImageSprites = {
  loadInto(sprites) {
    for (const [key, path] of Object.entries(GameConfig.spriteImages)) {
      const image = new Image();
      image.onload = () => this.apply(sprites, key, image);
      image.onerror = () => console.warn(`Sprite image not found, keeping the drawn sprite: ${path}`);
      image.src = path;
    }
  },

  apply(sprites, key, image) {
    const size = GameConfig.spriteSourceSize;
    const canvas = ProceduralSprites.createCanvas(size);
    canvas.getContext('2d').drawImage(image, 0, 0, size, size);

    if (Array.isArray(sprites[key])) {
      // Characters: one still frame; the bob/squash animation still brings it to life.
      sprites[key] = [canvas];
      ProceduralSprites.addHitTints(sprites);
    } else {
      sprites[key] = canvas;
    }
  },
};
