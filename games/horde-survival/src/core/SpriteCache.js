/**
 * SpriteCache keeps copies of sprites already shrunk to the size they are
 * drawn at. Shrinking a 182x182 image every frame costs time; doing it once
 * per size and reusing the result is much cheaper with hundreds of enemies.
 */
const SpriteCache = {
  cache: new Map(), // source image -> Map("size" or "size-mirrored" -> shrunk canvas)

  /** mirrored = true gives a left-facing copy, so drawing never needs a flip. */
  get(image, size, mirrored = false) {
    const rounded = Math.max(1, Math.round(size));
    let versions = this.cache.get(image);
    if (!versions) {
      versions = new Map();
      this.cache.set(image, versions);
    }
    const key = mirrored ? -rounded : rounded;
    let canvas = versions.get(key);
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = rounded;
      canvas.height = rounded;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      if (mirrored) {
        ctx.translate(rounded, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(image, 0, 0, rounded, rounded);
      versions.set(key, canvas);
    }
    return canvas;
  },
};
