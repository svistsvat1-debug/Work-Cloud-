// Endless scrolling world: a seamless floor tile + decorations placed per "chunk".
// Each chunk's decorations come from a seeded random generator, so the same place
// always looks the same when you come back. Decorations never block movement.

import { hash2, seededRandom } from '../core/MathUtils.js';

const CHUNK = 640;
const SMALL_DECOR = ['rock', 'rock', 'grass', 'grass', 'grass', 'bones', 'skull', 'mushrooms', 'candle'];
const SIZES = { rock: 76, grass: 70, bones: 70, skull: 46, mushrooms: 64, candle: 56, ruin: 140 };

export class WorldMap {
  constructor(sprites) {
    this.sprites = sprites;
    this.pattern = null;
    this.chunks = new Map();
  }

  getChunk(cx, cy) {
    const key = `${cx},${cy}`;
    let chunk = this.chunks.get(key);
    if (chunk) return chunk;

    const rand = seededRandom(hash2(cx, cy));
    chunk = [];
    const add = (kind, x, y) => {
      const variants = this.sprites.decorations.get(kind);
      chunk.push({
        kind,
        image: variants[Math.floor(rand() * variants.length)],
        x: cx * CHUNK + x,
        y: cy * CHUNK + y,
        size: Math.round(SIZES[kind] * (0.85 + rand() * 0.3) / 4) * 4, // few distinct sizes = small cache
        flip: rand() > 0.5,
        phase: rand() * 10,
      });
    };

    // a few scattered small things (kept sparse to avoid clutter)
    const count = Math.floor(rand() * 5);
    for (let i = 0; i < count; i++) {
      add(SMALL_DECOR[Math.floor(rand() * SMALL_DECOR.length)], rand() * CHUNK, rand() * CHUNK);
    }
    // sometimes a small ruin with candles — a little landmark
    if (rand() < 0.12) {
      const x = 120 + rand() * (CHUNK - 240);
      const y = 120 + rand() * (CHUNK - 240);
      add('ruin', x, y);
      add('ruin', x + 90 + rand() * 40, y + 20);
      add('candle', x + 40, y + 70);
      add('candle', x - 30, y + 60);
      add('skull', x + 60, y + 90);
    }

    chunk.sort((a, b) => a.y - b.y);
    this.chunks.set(key, chunk);
    if (this.chunks.size > 400) this.chunks.clear();
    return chunk;
  }

  /** Draws in world coordinates (the camera transform is already applied). */
  render(ctx, camera, time) {
    if (!this.pattern) this.pattern = ctx.createPattern(this.sprites.floorTile, 'repeat');
    ctx.fillStyle = this.pattern;
    ctx.fillRect(camera.left - 40, camera.top - 40, camera.width + 80, camera.height + 80);

    const minCx = Math.floor((camera.left - 100) / CHUNK);
    const maxCx = Math.floor((camera.right + 100) / CHUNK);
    const minCy = Math.floor((camera.top - 100) / CHUNK);
    const maxCy = Math.floor((camera.bottom + 100) / CHUNK);

    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        for (const d of this.getChunk(cx, cy)) {
          if (!camera.isVisible(d.x, d.y, d.size)) continue;
          this.sprites.blit(ctx, d.image, d.x, d.y, d.size, d.flip);
          if (d.kind === 'candle') this.drawFlame(ctx, d, time);
        }
      }
    }
  }

  drawFlame(ctx, d, time) {
    const flicker = 0.8 + Math.sin(time * 9 + d.phase) * 0.12 + Math.sin(time * 23 + d.phase) * 0.08;
    const fx = d.x;
    const fy = d.y - d.size * 0.2;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.45 * flicker;
    this.sprites.blit(ctx, this.sprites.get('glow_orange'), fx, fy, 120);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ffd56b';
    ctx.beginPath();
    ctx.ellipse(fx, fy, 3.5, 7 * flicker, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
