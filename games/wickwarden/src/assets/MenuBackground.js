// Procedural pixel-art menu background.
// The scene is painted once on a small 480x270 canvas and scaled 4x (to 1920x1080)
// with smoothing disabled, which gives crisp pixel-art. A few things (fog, embers,
// window lights) are animated on top every frame.
// Composition: castle on a crag (right), warrior knight on a ledge (left),
// clean open sky in the upper center for the title.

import { createCanvas } from './ProceduralSprites.js';
import { seededRandom } from '../core/MathUtils.js';
import { GameConfig } from '../config/GameConfig.js';

const W = 480;
const H = 270;
const SCALE = 4;

const SKY = ['#1d1633', '#2b1d45', '#45255a', '#6b2f5e', '#94405c', '#c2575a', '#e07a52', '#f2a35a', '#f8c66e'];

export class MenuBackground {
  constructor() {
    this.rand = seededRandom(2024);
    this.windows = []; // castle window positions (in 480x270 space)
    this.canvas = createCanvas(W, H);
    this.ctx = this.canvas.getContext('2d');
    this.paint();
    this.embers = Array.from({ length: 40 }, () => this.newEmber(true));

    // If a painted background is configured, use it once it has loaded.
    this.image = null;
    if (GameConfig.menuBackgroundImage) {
      const img = new Image();
      img.onload = () => { this.image = img; };
      img.onerror = () => console.warn('Menu background image not found, using the procedural scene.');
      img.src = GameConfig.menuBackgroundImage;
    }
  }

  px(x, y, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }

  rect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  /** Fills a terrain layer: every column x is filled from heightFn(x) down to the bottom. */
  layer(heightFn, color, rimColor, from = 0, to = W) {
    for (let x = from; x < to; x++) {
      const top = Math.round(heightFn(x));
      this.rect(x, top, 1, H - top, color);
      if (rimColor) this.px(x, top, rimColor);
    }
  }

  paint() {
    const r = this.rand;
    this.paintSky();

    // sun low behind the castle
    for (let y = -22; y <= 22; y++) {
      for (let x = -22; x <= 22; x++) {
        const d = Math.hypot(x, y);
        if (d <= 22) this.px(392 + x, 124 + y, d > 18 ? '#ffd88a' : '#fff0bf');
      }
    }

    // long pixel clouds
    for (let i = 0; i < 9; i++) {
      const y = 70 + r() * 60;
      const x = r() * W;
      const len = 30 + r() * 70;
      const color = y < 95 ? '#8c4a6a' : '#e8916a';
      this.rect(x, y, len, 1, color);
      this.rect(x + 6, y + 1, len * 0.7, 1, color);
    }

    // far mountains (purple haze)
    this.layer((x) => 150 + Math.sin(x * 0.021) * 12 + Math.sin(x * 0.063 + 1) * 6 + Math.abs(Math.sin(x * 0.011)) * -18, '#5b3a66', '#8a5577');

    // crag under the castle (lit from behind by the sun)
    this.layer((x) => {
      const d = (x - 395) / 70;
      return 125 + d * d * 60 + Math.sin(x * 0.4) * 2;
    }, '#33263f', '#c0707a', 300, 480);

    this.paintCastle();

    // mid hills + small pines (cool, hazy)
    const midHill = (x) => 182 + Math.sin(x * 0.018 + 2) * 9 + Math.sin(x * 0.05) * 4;
    this.layer(midHill, '#2f4a40', '#7d8a5a');
    for (let i = 0; i < 26; i++) {
      const x = r() * W;
      this.pine(x, midHill(x) + 2, 7 + r() * 8, '#203a32');
    }

    // fog band
    for (let y = 186; y < 204; y++) {
      const a = 0.18 * Math.sin(((y - 186) / 18) * Math.PI);
      this.ctx.fillStyle = `rgba(255,214,196,${a.toFixed(3)})`;
      this.ctx.fillRect(0, y, W, 1);
    }

    // near hills (green, golden edge)
    const nearHill = (x) => 212 + Math.sin(x * 0.012 + 0.5) * 10 + Math.sin(x * 0.041) * 4;
    this.layer(nearHill, '#2c5a35', '#9cc25a');
    for (let x = 0; x < W; x++) {
      const top = Math.round(nearHill(x));
      this.px(x, top + 1, '#6f9a45');
      if (r() < 0.3) this.px(x, top + 3 + Math.floor(r() * 10), '#244d2c');
    }
    // big foreground pines on the right
    for (let i = 0; i < 7; i++) {
      const x = 330 + i * 24 + r() * 10;
      this.pine(x, nearHill(x) + 30, 34 + r() * 26, '#152a1e', '#3c5a30');
    }

    this.paintLedge();
    this.paintKnight(74, 181);

    // bottom vignette
    for (let y = 230; y < H; y++) {
      this.ctx.fillStyle = `rgba(10,6,16,${((y - 230) / 40) * 0.55})`;
      this.ctx.fillRect(0, y, W, 1);
    }
  }

  paintSky() {
    const horizon = 175;
    const band = horizon / SKY.length;
    for (let y = 0; y < H; y++) {
      const i = Math.min(SKY.length - 1, Math.floor(y / band));
      this.rect(0, y, W, 1, SKY[i]);
      // dither the two rows before the next band for a smooth pixel transition
      const next = SKY[i + 1];
      const into = y - i * band;
      if (next && into > band - 3) {
        for (let x = (y % 2); x < W; x += 2) this.px(x, y, next);
      }
    }
    // stars in the dark top
    const r = this.rand;
    for (let i = 0; i < 70; i++) this.px(r() * W, r() * 50, r() > 0.7 ? '#ffffff' : '#9c8fc8');
  }

  pine(x, baseY, height, color, rim) {
    const layers = Math.max(3, Math.floor(height / 6));
    for (let i = 0; i < height; i++) {
      const y = baseY - i;
      const t = i / height;
      const step = (i % Math.ceil(height / layers)) / Math.ceil(height / layers);
      const half = Math.max(0, (1 - t) * height * 0.32 * (0.6 + step * 0.4));
      this.rect(x - half, y, half * 2 + 1, 1, color);
      if (rim && half > 1) this.px(x + half, y, rim);
    }
    this.rect(x, baseY, 1, 3, '#2a1c14');
  }

  paintCastle() {
    const wall = '#2a2036';
    const lit = '#4d3a55';
    const r = this.rand;
    const tower = (x, top, w, roofH, roofColor = '#3b2440') => {
      this.rect(x, top, w, 130 - top, wall);
      this.rect(x + w - 1, top, 1, 130 - top, lit);
      for (let i = 0; i < roofH; i++) {
        const half = Math.round((i / roofH) * (w / 2 + 1));
        this.rect(x + w / 2 - half, top - roofH + i, half * 2, 1, roofColor);
      }
      this.px(x + w / 2, top - roofH - 1, '#c0707a');
      // windows
      for (let y = top + 4; y < 124; y += 7) {
        if (r() < 0.55) this.windows.push({ x: x + Math.floor(w / 2), y, phase: r() * 10 });
      }
    };
    // curtain wall with crenellations
    this.rect(352, 106, 86, 26, wall);
    for (let x = 352; x < 438; x += 3) this.rect(x, 104, 2, 2, wall);
    this.rect(352, 106, 86, 1, lit);
    // towers
    tower(356, 96, 9, 10);
    tower(372, 86, 12, 12);
    tower(388, 72, 12, 16, '#45284a');
    tower(404, 84, 10, 12);
    tower(422, 94, 9, 9);
    // banner
    this.rect(394, 44, 1, 12, '#1a1220');
    this.rect(395, 45, 6, 3, '#c43a3a');
    // gate glow
    this.rect(392, 120, 4, 6, '#ffb45a');
  }

  paintLedge() {
    const r = this.rand;
    const top = (x) => 213 + Math.sin(x * 0.07) * 2 + (x > 150 ? (x - 150) * 0.35 : 0);
    for (let x = 0; x < 200; x++) {
      const t = Math.round(top(x));
      this.rect(x, t, 1, H - t, x > 185 ? '#2e2620' : '#4a4038');
      this.px(x, t, '#e0a060'); // golden rim light
      this.px(x, t + 1, '#7a6450');
      if (r() < 0.25) this.px(x, t + 4 + Math.floor(r() * 40), '#3a322c');
      if (r() < 0.12) this.px(x, t + 3 + Math.floor(r() * 30), '#5c5044');
    }
    // grass tufts on the ledge
    for (let i = 0; i < 30; i++) {
      const x = Math.floor(r() * 190);
      const t = Math.round(top(x));
      const h = 2 + Math.floor(r() * 4);
      this.rect(x, t - h, 1, h, r() > 0.5 ? '#5f8a3a' : '#7fa84a');
    }
  }

  /**
   * 32x32 pixel knight seen from behind, sword lowered in the right hand.
   * Shapes are filled first, then an outline is added around every filled pixel.
   */
  paintKnight(ox, oy) {
    const grid = Array.from({ length: 32 }, () => new Array(32).fill(null));
    const set = (x, y, c) => { if (x >= 0 && x < 32 && y >= 0 && y < 32) grid[y][x] = c; };
    const P = {
      helm: '#c3cad6', helmMid: '#858fa0', helmDark: '#4f5768', plume: '#b8323a',
      cape: '#9b2335', capeDark: '#5e1426', rim: '#f08a4b', armor: '#8d96a6',
      armorDark: '#4d5566', armorRim: '#ffd27a', blade: '#e6ecf3', bladeShade: '#8f9bb0',
      gold: '#e3b341', boot: '#2e2420', glove: '#3a2e28',
    };

    // cape (flares out toward the bottom, ragged hem)
    for (let y = 10; y <= 28; y++) {
      const left = 10 - Math.floor((y - 10) * 0.25);
      const right = 20 + Math.floor((y - 10) * 0.2);
      for (let x = left; x <= right; x++) {
        if (y === 28 && x % 3 === 0) continue;
        let c = P.cape;
        if ((x + Math.floor(y / 4)) % 4 === 0) c = P.capeDark;
        if (x === left) c = P.capeDark;
        if (x === right) c = P.rim;
        set(x, y, c);
      }
    }
    // boots below the cape
    for (const bx of [11, 16]) {
      for (let x = bx; x < bx + 3; x++) { set(x, 29, P.boot); set(x, 30, P.boot); }
    }
    // pauldrons + gorget
    for (let x = 8; x <= 22; x++) {
      set(x, 9, x >= 13 && x <= 17 ? P.armorDark : P.armor);
      if (x <= 12 || x >= 18) { set(x, 10, P.armor); set(x, 11, P.armorDark); }
    }
    for (let x = 8; x <= 12; x++) set(x, 9, P.helm);
    set(22, 9, P.armorRim);
    set(22, 10, P.armorRim);
    // right (sword) arm
    for (let y = 11; y <= 16; y++) {
      set(21, y, P.armorDark);
      set(22, y, P.armor);
      set(23, y, P.armorRim);
    }
    set(22, 17, P.glove); set(23, 17, P.glove); set(22, 18, P.glove);
    // helmet
    for (let y = 3; y <= 8; y++) {
      const inset = y === 3 || y === 8 ? 1 : 0;
      for (let x = 12 + inset; x <= 18 - inset; x++) {
        let c = P.helm;
        if (x >= 16) c = P.helmMid;
        if (x === 18 - inset) c = P.helmDark;
        if (y === 6) c = P.armorDark;
        set(x, y, c);
      }
    }
    set(18, 4, P.armorRim);
    set(18, 5, P.armorRim);
    // plume
    for (const [x, y] of [[14, 2], [15, 2], [16, 2], [15, 1], [16, 1], [17, 2], [17, 1], [18, 0]]) set(x, y, P.plume);

    // sword: pommel, guard, then a diagonal blade down to the ground
    set(23, 16, P.gold);
    for (let x = 20; x <= 25; x++) set(x, 19, P.gold);
    for (let y = 20; y <= 31; y++) {
      const x = 22 + Math.round(((y - 20) * 5) / 11);
      set(x, y, P.blade);
      set(x + 1, y, P.bladeShade);
    }

    // outline pass
    const outline = [];
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        if (grid[y][x]) continue;
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[y + dy] && grid[y + dy][x + dx]);
        if (near) outline.push([x, y]);
      }
    }
    for (const [x, y] of outline) this.px(ox + x, oy + y, '#120e16');
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) if (grid[y][x]) this.px(ox + x, oy + y, grid[y][x]);
    }
  }

  newEmber(randomY = false) {
    return {
      x: Math.random() * 1920,
      y: randomY ? Math.random() * 1080 : 1090,
      speed: 20 + Math.random() * 40,
      drift: Math.random() * Math.PI * 2,
      size: Math.random() > 0.7 ? 8 : 4,
    };
  }

  render(ctx, time, dt) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.image || this.canvas, 0, 0, W * SCALE, H * SCALE);

    // flickering castle windows (only match the procedural scene)
    for (const w of this.image ? [] : this.windows) {
      const flicker = 0.65 + 0.35 * Math.sin(time * 3 + w.phase) * Math.sin(time * 7.3 + w.phase * 2);
      ctx.fillStyle = `rgba(255,207,107,${flicker.toFixed(3)})`;
      ctx.fillRect(w.x * SCALE, w.y * SCALE, SCALE, SCALE * 2);
    }

    // drifting fog
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const x = ((time * (12 + i * 6) + i * 700) % 2600) - 340;
      const y = 760 + i * 40;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 420);
      g.addColorStop(0, 'rgba(255,220,210,0.10)');
      g.addColorStop(1, 'rgba(255,220,210,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 420, y - 420, 840, 840);
    }
    ctx.restore();

    // embers rising (pixel squares)
    for (const e of this.embers) {
      e.y -= e.speed * dt;
      e.drift += dt;
      e.x += Math.sin(e.drift) * 12 * dt;
      if (e.y < -10) Object.assign(e, this.newEmber());
      ctx.fillStyle = e.size > 4 ? 'rgba(255,190,100,0.8)' : 'rgba(255,140,80,0.7)';
      ctx.fillRect(Math.round(e.x / 4) * 4, Math.round(e.y / 4) * 4, e.size, e.size);
    }
    ctx.imageSmoothingEnabled = true;
  }
}
