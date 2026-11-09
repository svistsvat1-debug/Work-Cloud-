// All art in the game is drawn with canvas code at startup — no image files needed.
// Characters, monsters, pickups and projectiles use 182x182 source canvases.
// They are drawn smaller on screen (see drawSize in GameConfig), and their
// collision circles are smaller still, so the game stays fair.

import { GameConfig } from '../config/GameConfig.js';
import { seededRandom, TAU } from '../core/MathUtils.js';

const S = GameConfig.spriteSize; // 182
const C = S / 2; // center (91)
const OUTLINE = '#120c16';

// ---------- small drawing helpers ----------

export function createCanvas(width, height = width) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function makeSprite(draw, width = S, height = width) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  draw(ctx, width, height);
  return canvas;
}

/** White silhouette of a sprite, used for the "hit flash". */
function makeFlash(source) {
  return makeSprite((ctx) => {
    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, source.width, source.height);
  }, source.width, source.height);
}

function ellipse(ctx, x, y, rx, ry, fill, stroke = OUTLINE, lineWidth = 5) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function polygon(ctx, points, fill, stroke = OUTLINE, lineWidth = 5) {
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function groundShadow(ctx, x, y, rx, ry) {
  ellipse(ctx, x, y, rx, ry, 'rgba(0,0,0,0.35)', null);
}

function radialGlow(ctx, x, y, radius, color, alpha = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.globalAlpha = 1;
}

function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

// ---------- characters ----------

function drawPlayer(ctx, frame) {
  const bob = [0, -4, 0, -4][frame];
  const swing = [0, 8, 0, -8][frame];
  groundShadow(ctx, C, 166, 40, 10);

  ctx.save();
  ctx.translate(0, bob);

  // boots
  ellipse(ctx, 77 + swing, 156, 12, 9, '#3b2a22');
  ellipse(ctx, 105 - swing, 156, 12, 9, '#3b2a22');

  // lantern staff (behind the cloak edge)
  line(ctx, 140, 160, 142, 44, OUTLINE, 12);
  line(ctx, 140, 160, 142, 44, '#7a5634', 6);

  // cloak
  ctx.beginPath();
  ctx.moveTo(C, 60);
  ctx.quadraticCurveTo(134, 94, 128, 152);
  ctx.quadraticCurveTo(C, 164, 54, 152);
  ctx.quadraticCurveTo(48, 94, C, 60);
  ctx.closePath();
  const cloak = ctx.createLinearGradient(0, 60, 0, 160);
  cloak.addColorStop(0, '#e0583f');
  cloak.addColorStop(1, '#7a2228');
  ctx.fillStyle = cloak;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 5;
  ctx.stroke();
  line(ctx, C + 4, 112, C + 8, 154, 'rgba(60,10,20,0.6)', 4);

  // golden sash
  ctx.beginPath();
  ctx.moveTo(60, 116);
  ctx.quadraticCurveTo(C, 128, 124, 116);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 12;
  ctx.stroke();
  ctx.strokeStyle = '#f0bf4c';
  ctx.lineWidth = 6;
  ctx.stroke();

  // hood (with a pointed tip — part of the silhouette)
  polygon(ctx, [62, 56, 44, 22, 84, 40], '#e9dcbc');
  ellipse(ctx, C + 2, 72, 36, 34, '#efe3c8');
  ellipse(ctx, C + 6, 79, 22, 20, '#231a2b', null);
  // glowing eyes
  radialGlow(ctx, C + 6, 79, 22, 'rgba(255,200,90,0.45)');
  ellipse(ctx, C - 1, 79, 4, 6, '#ffd56b', null);
  ellipse(ctx, C + 13, 79, 4, 6, '#ffd56b', null);

  // hand + lantern
  ellipse(ctx, 140, 112, 9, 9, '#efe3c8');
  radialGlow(ctx, 142, 40, 46, 'rgba(255,190,80,0.7)');
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(127, 22, 30, 34);
  ctx.fillStyle = '#ffd45e';
  ctx.fillRect(132, 27, 20, 24);
  ctx.fillStyle = '#fff6d0';
  ctx.fillRect(138, 32, 8, 14);
  line(ctx, 142, 22, 142, 14, OUTLINE, 5);

  ctx.restore();
}

function drawSlime(ctx, frame) {
  const sq = frame === 0 ? 1 : 0.86; // squash
  const sx = frame === 0 ? 1 : 1.1; // stretch
  const base = 150;
  const top = base - 100 * sq;
  groundShadow(ctx, C, 154, 56, 12);

  ctx.beginPath();
  ctx.moveTo(C - 60 * sx, base);
  ctx.bezierCurveTo(C - 64 * sx, base - 70 * sq, C - 34 * sx, top, C, top);
  ctx.bezierCurveTo(C + 34 * sx, top, C + 64 * sx, base - 70 * sq, C + 60 * sx, base);
  ctx.quadraticCurveTo(C, base + 12, C - 60 * sx, base);
  ctx.closePath();
  const g = ctx.createRadialGradient(C - 20, top + 30, 10, C, base - 40, 90);
  g.addColorStop(0, '#6b4ca3');
  g.addColorStop(1, '#1f1438');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 6;
  ctx.stroke();

  // drips
  ellipse(ctx, C - 40 * sx, base + 2, 7, 9, '#2a1b48', null);
  ellipse(ctx, C + 30 * sx, base + 4, 6, 8, '#2a1b48', null);
  // shine
  ellipse(ctx, C - 26 * sx, top + 26 * sq, 14, 8, 'rgba(255,255,255,0.3)', null);
  // eyes
  const ey = base - 52 * sq;
  ellipse(ctx, C - 16, ey, 9, 12, '#8ff6ff', OUTLINE, 3);
  ellipse(ctx, C + 18, ey, 9, 12, '#8ff6ff', OUTLINE, 3);
  ellipse(ctx, C - 14, ey + 2, 4, 6, '#0a0612', null);
  ellipse(ctx, C + 20, ey + 2, 4, 6, '#0a0612', null);
  // mouth
  ctx.beginPath();
  ctx.arc(C + 2, ey + 22, 9, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.strokeStyle = '#0a0612';
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawBat(ctx, frame) {
  const up = frame === 0;
  groundShadow(ctx, C, 164, 32, 8);
  const wingFill = '#7a665a';
  const spot = '#b49a72';
  for (const side of [-1, 1]) {
    const wx = (x) => C + side * x;
    // upper wing
    polygon(ctx, [wx(10), 84, wx(78), up ? 28 : 96, wx(84), up ? 70 : 118, wx(14), 100], wingFill);
    ellipse(ctx, wx(56), up ? 62 : 102, 9, 7, spot, null);
    // lower wing
    polygon(ctx, [wx(10), 100, wx(62), up ? 116 : 140, wx(30), up ? 132 : 150, wx(8), 112], '#5e4d44');
  }
  ellipse(ctx, C, 100, 16, 30, '#3e3230');
  // fuzzy stripes
  line(ctx, C - 12, 104, C + 12, 104, '#5d4b40', 4);
  line(ctx, C - 10, 116, C + 10, 116, '#5d4b40', 4);
  ellipse(ctx, C, 68, 17, 16, '#4b3c37');
  // antennae
  ctx.beginPath();
  ctx.moveTo(C - 6, 56);
  ctx.quadraticCurveTo(C - 14, 36, C - 28, 32);
  ctx.moveTo(C + 6, 56);
  ctx.quadraticCurveTo(C + 14, 36, C + 28, 32);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 4;
  ctx.stroke();
  radialGlow(ctx, C, 68, 26, 'rgba(255,120,40,0.45)');
  ellipse(ctx, C - 7, 67, 5, 5, '#ff8a3d', null);
  ellipse(ctx, C + 7, 67, 5, 5, '#ff8a3d', null);
}

function drawCrawler(ctx, frame) {
  groundShadow(ctx, C, 152, 54, 11);
  const off = frame === 0 ? 7 : -7;
  // legs
  for (let i = 0; i < 3; i++) {
    const lx = 62 + i * 26;
    const o = i % 2 === 0 ? off : -off;
    line(ctx, lx, 112, lx - 14 + o, 146, OUTLINE, 9);
    line(ctx, lx, 112, lx - 14 + o, 146, '#3d3433', 4);
    line(ctx, lx, 104, lx - 10 - o, 70, OUTLINE, 9);
    line(ctx, lx, 104, lx - 10 - o, 70, '#3d3433', 4);
  }
  // shell
  ellipse(ctx, C - 6, 108, 52, 36, '#2c2626', OUTLINE, 6);
  ellipse(ctx, C - 14, 96, 26, 12, 'rgba(255,255,255,0.08)', null);
  // glowing ember cracks
  ctx.save();
  ctx.shadowColor = '#ff7a2a';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(52, 104);
  ctx.lineTo(70, 112);
  ctx.lineTo(84, 98);
  ctx.lineTo(102, 114);
  ctx.lineTo(118, 102);
  ctx.strokeStyle = '#ff8a35';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
  // head + mandibles (facing right)
  ellipse(ctx, 138, 112, 20, 17, '#3a3130');
  line(ctx, 152, 104, 164, 98 + off * 0.3, OUTLINE, 5);
  line(ctx, 152, 120, 164, 126 - off * 0.3, OUTLINE, 5);
  ellipse(ctx, 146, 106, 4, 4, '#ffb347', null);
}

function drawBrute(ctx, frame) {
  const arm = frame === 0 ? -6 : 6;
  groundShadow(ctx, C, 168, 64, 13);
  // legs
  ellipse(ctx, 66, 156, 18, 12, '#2c2834');
  ellipse(ctx, 116, 156, 18, 12, '#2c2834');
  // arms (behind)
  ellipse(ctx, 34, 112 + arm, 20, 34, '#4a4556');
  ellipse(ctx, 148, 112 - arm, 20, 34, '#4a4556');
  ellipse(ctx, 32, 142 + arm, 16, 12, '#3a3644');
  ellipse(ctx, 150, 142 - arm, 16, 12, '#3a3644');
  // torso
  ctx.beginPath();
  ctx.moveTo(42, 160);
  ctx.quadraticCurveTo(34, 64, 74, 54);
  ctx.lineTo(108, 54);
  ctx.quadraticCurveTo(148, 64, 140, 160);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, 54, 0, 160);
  g.addColorStop(0, '#6a6377');
  g.addColorStop(1, '#2d2936');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 6;
  ctx.stroke();
  // smoke puffs on shoulders
  for (const [x, y, r] of [[52, 58, 16], [68, 46, 14], [118, 48, 14], [132, 60, 16]]) {
    ellipse(ctx, x, y, r, r, 'rgba(160,155,170,0.85)', 'rgba(18,12,22,0.6)', 3);
  }
  // horns
  polygon(ctx, [72, 52, 58, 22, 80, 42], '#e2d6bb');
  polygon(ctx, [110, 52, 124, 22, 102, 42], '#e2d6bb');
  // face
  ellipse(ctx, C, 74, 24, 18, '#3a3545');
  ctx.save();
  ctx.shadowColor = '#ff5a3c';
  ctx.shadowBlur = 8;
  polygon(ctx, [74, 70, 88, 74, 74, 76], '#ff5a3c', null);
  polygon(ctx, [108, 70, 94, 74, 108, 76], '#ff5a3c', null);
  ctx.restore();
  // teeth
  polygon(ctx, [76, 112, 106, 112, 100, 122, 94, 114, 88, 122, 82, 114], '#e8e0cc', OUTLINE, 3);
}

function drawElite(ctx, frame) {
  const sway = frame === 0 ? 0 : 5;
  groundShadow(ctx, C, 170, 48, 11);
  // cape
  polygon(ctx, [60, 74, 122, 74, 140 + sway, 166, 42 - sway, 166], '#4a2b6b');
  // legs
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(70, 136, 18, 30);
  ctx.fillRect(96, 136, 18, 30);
  ctx.fillStyle = '#4b5162';
  ctx.fillRect(73, 138, 12, 26);
  ctx.fillRect(99, 138, 12, 26);
  // torso armor
  polygon(ctx, [62, 76, 120, 76, 114, 142, 68, 142], '#3a3f4f');
  polygon(ctx, [70, 84, 112, 84, 106, 120, 76, 120], '#565d70', null);
  line(ctx, C, 86, C, 118, '#7d8597', 4);
  // pauldrons
  ellipse(ctx, 62, 82, 16, 12, '#5a6175');
  ellipse(ctx, 120, 82, 16, 12, '#5a6175');
  // candle-snuffer helmet: a tall bent cone
  polygon(ctx, [64, 78, 118, 78, 100, 24, 112, 10, 90, 20], '#4b5162');
  ellipse(ctx, C, 78, 30, 8, '#5f677a');
  ctx.save();
  ctx.shadowColor = '#ff4fd8';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#ff6fe0';
  ctx.fillRect(76, 60, 30, 6);
  ctx.restore();
  // snuffer pole weapon
  const tx = 150 + sway;
  line(ctx, 128, 132, tx, 40, OUTLINE, 9);
  line(ctx, 128, 132, tx, 40, '#8a7a5a', 4);
  polygon(ctx, [tx - 14, 46, tx + 14, 46, tx, 22], '#6b7186');
}

function drawBoss(ctx, frame) {
  const open = frame === 1;
  groundShadow(ctx, C, 172, 78, 14);
  // body
  const g = ctx.createRadialGradient(C - 20, 70, 10, C, 100, 90);
  g.addColorStop(0, '#3e2a4c');
  g.addColorStop(1, '#0c0711');
  ellipse(ctx, C, 104, 78, 70, g, OUTLINE, 6);
  // melted wax crown
  ctx.fillStyle = '#d9ccb2';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(40, 62);
  ctx.quadraticCurveTo(C, 22, 142, 62);
  ctx.lineTo(142, 70);
  for (let x = 142; x >= 40; x -= 17) {
    const drip = (x * 7) % 23;
    ctx.quadraticCurveTo(x - 4, 74 + drip, x - 9, 70);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // burnt wicks
  for (let i = 0; i < 5; i++) {
    const x = 56 + i * 17;
    const top = 34 - Math.abs(2 - i) * -2;
    line(ctx, x, 52, x + (i - 2) * 3, top - 4, '#1a1418', 5);
    ellipse(ctx, x + (i - 2) * 3, top - 6, 3, 3, i % 2 ? '#ff7b3a' : '#5a2a1a', null);
  }
  // eyes
  ctx.save();
  ctx.shadowColor = '#ffe066';
  ctx.shadowBlur = 10;
  for (const [x, y, r] of [[62, 92, 9], [C, 86, 12], [120, 92, 9], [44, 112, 5], [138, 112, 5]]) {
    ellipse(ctx, x, y, r, r * 0.8, '#ffe066', OUTLINE, 3);
    ellipse(ctx, x, y, r * 0.35, r * 0.6, '#1a0a08', null);
  }
  ctx.restore();
  // mouth
  if (open) {
    ellipse(ctx, C, 136, 46, 22, '#4a0d16', OUTLINE, 5);
    for (let i = 0; i < 6; i++) {
      const x = 52 + i * 15;
      polygon(ctx, [x, 118, x + 10, 118, x + 5, 130], '#efe6d0', OUTLINE, 2);
      polygon(ctx, [x + 4, 154, x + 14, 154, x + 9, 143], '#efe6d0', OUTLINE, 2);
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(48, 134);
    for (let i = 0; i <= 10; i++) ctx.lineTo(48 + i * 8.6, 134 + (i % 2 ? 8 : -2));
    ctx.strokeStyle = '#efe6d0';
    ctx.lineWidth = 5;
    ctx.stroke();
  }
}

// ---------- pickups ----------

const GEM_COLORS = {
  blue: ['#9ad8ff', '#3d8bff', '#1c3f8f'],
  green: ['#b4ffcf', '#3fd47a', '#16683a'],
  red: ['#ffc0c8', '#ff4d6a', '#8a1630'],
};

function drawGem(ctx, tier) {
  const [light, mid, dark] = GEM_COLORS[tier];
  polygon(ctx, [C, 30, 136, C, C, 152, 46, C], mid, OUTLINE, 7);
  polygon(ctx, [C, 30, 136, C, C, C], light, null);
  polygon(ctx, [C, 152, 46, C, C, C], dark, null);
  polygon(ctx, [C, 30, 136, C, C, 152, 46, C], null, OUTLINE, 7);
  polygon(ctx, [C - 12, 58, C - 2, 50, C - 4, 76], 'rgba(255,255,255,0.8)', null);
}

function drawCoin(ctx) {
  const g = ctx.createRadialGradient(C - 16, C - 16, 6, C, C, 60);
  g.addColorStop(0, '#fff1a8');
  g.addColorStop(1, '#c98a1c');
  ellipse(ctx, C, C, 52, 52, g, OUTLINE, 7);
  ellipse(ctx, C, C, 38, 38, null, '#a8701a', 5);
  // embossed flame
  ctx.beginPath();
  ctx.moveTo(C, C - 24);
  ctx.quadraticCurveTo(C + 20, C, C, C + 24);
  ctx.quadraticCurveTo(C - 20, C, C, C - 24);
  ctx.fillStyle = '#a8701a';
  ctx.fill();
}

function drawChest(ctx, open) {
  groundShadow(ctx, C, 152, 62, 12);
  if (open) {
    radialGlow(ctx, C, 86, 80, 'rgba(255,220,120,0.9)');
    // lid tipped back
    polygon(ctx, [38, 82, 144, 82, 136, 40, 46, 40], '#8a5530');
    line(ctx, 46, 52, 136, 52, '#f0c050', 6);
  }
  // body
  polygon(ctx, [36, 86, 146, 86, 140, 150, 42, 150], '#7a4a26', OUTLINE, 6);
  for (const y of [104, 122, 138]) line(ctx, 42, y, 140, y, 'rgba(40,20,10,0.5)', 3);
  // gold bands
  ctx.fillStyle = '#f0c050';
  ctx.fillRect(52, 86, 12, 64);
  ctx.fillRect(118, 86, 12, 64);
  if (!open) {
    ctx.beginPath();
    ctx.moveTo(36, 90);
    ctx.quadraticCurveTo(C, 30, 146, 90);
    ctx.closePath();
    ctx.fillStyle = '#93582c';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = '#f0c050';
    ctx.fillRect(52, 50, 12, 38);
    ctx.fillRect(118, 50, 12, 38);
  } else {
    ellipse(ctx, C, 90, 50, 10, '#ffe9a0', null);
  }
  // lock
  polygon(ctx, [80, 84, 102, 84, 102, 108, 80, 108], '#ffd76a', OUTLINE, 4);
  ellipse(ctx, C, 95, 3, 5, OUTLINE, null);
}

// ---------- projectiles & weapon visuals ----------

function drawBolt(ctx, hot) {
  const outer = hot ? 'rgba(140,200,255,0.9)' : 'rgba(255,120,40,0.9)';
  const mid = hot ? '#d8f0ff' : '#ffb347';
  radialGlow(ctx, C + 10, C, 70, outer);
  // tail (sprite faces right)
  ctx.beginPath();
  ctx.moveTo(C + 30, C - 24);
  ctx.quadraticCurveTo(C - 40, C - 10, C - 82, C);
  ctx.quadraticCurveTo(C - 40, C + 10, C + 30, C + 24);
  ctx.closePath();
  ctx.fillStyle = mid;
  ctx.globalAlpha = 0.75;
  ctx.fill();
  ctx.globalAlpha = 1;
  ellipse(ctx, C + 18, C, 30, 26, mid, null);
  ellipse(ctx, C + 24, C, 16, 14, '#ffffff', null);
}

function drawBlade(ctx, golden) {
  if (golden) radialGlow(ctx, C, C, 90, 'rgba(255,200,80,0.8)');
  const blade = golden ? '#ffe28a' : '#d7dde6';
  const edge = golden ? '#ffffff' : '#f6f9ff';
  // blade points right
  polygon(ctx, [66, 78, 150, C - 4, 172, C, 150, C + 4, 66, 104], blade, OUTLINE, 5);
  line(ctx, 72, C, 160, C, edge, 3);
  // guard + handle
  polygon(ctx, [58, 64, 70, 64, 70, 118, 58, 118], golden ? '#ff9f2a' : '#a07a3a', OUTLINE, 4);
  polygon(ctx, [18, 82, 58, 82, 58, 100, 18, 100], golden ? '#b8611a' : '#5a3b22', OUTLINE, 4);
}

function drawMark(ctx) {
  radialGlow(ctx, C, C, 80, 'rgba(120,200,255,0.6)');
  ellipse(ctx, C, C, 60, 60, null, '#9be7ff', 6);
  ellipse(ctx, C, C, 44, 44, null, 'rgba(155,231,255,0.6)', 3);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU;
    line(ctx, C + Math.cos(a) * 52, C + Math.sin(a) * 52, C + Math.cos(a) * 70, C + Math.sin(a) * 70, '#d8f6ff', 6);
  }
  polygon(ctx, [C + 8, C - 34, C - 14, C + 4, C + 2, C + 4, C - 8, C + 34, C + 16, C - 6, C, C - 6], '#e8faff', null);
}

function drawPulseIcon(ctx, nova) {
  radialGlow(ctx, C, C, 86, nova ? 'rgba(255,220,120,0.9)' : 'rgba(255,170,80,0.8)');
  if (nova) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      line(ctx, C + Math.cos(a) * 30, C + Math.sin(a) * 30, C + Math.cos(a) * 80, C + Math.sin(a) * 80, '#fff1b0', 6);
    }
  }
  ellipse(ctx, C, C, 56, 56, null, '#ffd06b', 9);
  ellipse(ctx, C, C, 24, 24, '#fff6d6', null);
}

function drawCrown(ctx) {
  radialGlow(ctx, C, C, 86, 'rgba(140,210,255,0.8)');
  polygon(ctx, [36, 126, 36, 64, 62, 94, C, 46, 120, 94, 146, 64, 146, 126], '#ffd76a', OUTLINE, 6);
  polygon(ctx, [C + 6, 70, C - 12, 104, C + 2, 104, C - 6, 132, C + 16, 96, C + 2, 96], '#e8faff', OUTLINE, 3);
}

function drawTempestIcon(ctx) {
  drawBolt(ctx, true);
  ctx.globalAlpha = 0.6;
  ctx.drawImage(makeSprite((c) => drawBolt(c, true)), -30, -40, 140, 140);
  ctx.drawImage(makeSprite((c) => drawBolt(c, true)), -30, 70, 140, 140);
  ctx.globalAlpha = 1;
}

// ---------- passive & shop icons ----------

const ICON_DRAWERS = {
  book(ctx) {
    polygon(ctx, [36, 44, 140, 44, 146, 146, 42, 146], '#7a3a2a');
    polygon(ctx, [50, 44, 140, 44, 146, 138, 56, 138], '#efe3c8', null);
    polygon(ctx, [36, 44, 140, 44, 146, 146, 42, 146], null);
    // candle on the book
    ctx.fillStyle = '#f4ead2';
    ctx.fillRect(84, 66, 16, 44);
    radialGlow(ctx, 92, 56, 26, 'rgba(255,190,80,0.9)');
    ellipse(ctx, 92, 56, 6, 10, '#ffd56b', null);
  },
  stone(ctx) {
    radialGlow(ctx, C, C, 80, 'rgba(255,120,40,0.7)');
    polygon(ctx, [C, 28, 142, 70, 128, 140, C, 158, 54, 140, 40, 70], '#5a3a30');
    ctx.save();
    ctx.shadowColor = '#ff7a2a';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(70, 70);
    ctx.lineTo(C, 100);
    ctx.lineTo(118, 74);
    ctx.moveTo(C, 100);
    ctx.lineTo(C - 4, 140);
    ctx.strokeStyle = '#ffae4a';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();
  },
  boots(ctx) {
    polygon(ctx, [58, 36, 100, 36, 100, 112, 146, 124, 146, 150, 52, 150], '#6b4a3a');
    line(ctx, 58, 60, 100, 60, '#8a6a4a', 6);
    for (let i = 0; i < 3; i++) line(ctx, 30 - i * 4, 80 + i * 22, 50, 80 + i * 22, 'rgba(220,220,240,0.7)', 5);
  },
  charm(ctx) {
    ctx.beginPath();
    ctx.arc(C, 84, 46, Math.PI, 0);
    ctx.lineTo(C + 46, 140);
    ctx.lineTo(C + 22, 140);
    ctx.lineTo(C + 22, 84);
    ctx.arc(C, 84, 22, 0, Math.PI, true);
    ctx.lineTo(C - 22, 140);
    ctx.lineTo(C - 46, 140);
    ctx.closePath();
    ctx.fillStyle = '#c94a4a';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = '#d7dde6';
    ctx.fillRect(C - 46, 124, 24, 16);
    ctx.fillRect(C + 22, 124, 24, 16);
  },
  heart(ctx) {
    ctx.beginPath();
    ctx.moveTo(C, 150);
    ctx.bezierCurveTo(20, 100, 40, 30, C, 66);
    ctx.bezierCurveTo(142, 30, 162, 100, C, 150);
    ctx.fillStyle = '#7a5a3a';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 7;
    ctx.stroke();
    // wood grain
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(C, 100, 14 + i * 12, Math.PI * 1.1, Math.PI * 1.9);
      ctx.strokeStyle = '#a07a4a';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ellipse(ctx, 66, 76, 10, 6, 'rgba(255,255,255,0.35)', null);
  },
  clover(ctx) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + Math.PI / 4;
      ellipse(ctx, C + Math.cos(a) * 30, 86 + Math.sin(a) * 30, 26, 26, '#4fbf5f');
    }
    ellipse(ctx, C, 86, 10, 10, '#2f8a3f', null);
    line(ctx, C, 112, C + 10, 160, '#2f8a3f', 8);
    radialGlow(ctx, C, 30, 24, 'rgba(255,200,90,0.9)');
    ellipse(ctx, C, 30, 6, 10, '#ffd56b', null);
  },
};

// ---------- world decorations (not characters, so not bound to 182px) ----------

function drawDecoration(ctx, kind, size, rand) {
  const c = size / 2;
  switch (kind) {
    case 'rock': {
      const n = 7;
      const pts = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        const r = size * (0.26 + rand() * 0.12);
        pts.push(c + Math.cos(a) * r, c + 8 + Math.sin(a) * r * 0.7);
      }
      polygon(ctx, pts, '#4b4f55', '#1a1c20', 4);
      ellipse(ctx, c - 8, c - 2, size * 0.12, size * 0.06, 'rgba(255,255,255,0.12)', null);
      break;
    }
    case 'bones': {
      for (let i = 0; i < 2; i++) {
        const y = c - 6 + i * 16;
        const tilt = (rand() - 0.5) * 20;
        line(ctx, c - 30, y + tilt / 2, c + 30, y - tilt / 2, '#1a1418', 9);
        line(ctx, c - 30, y + tilt / 2, c + 30, y - tilt / 2, '#cfc6b0', 5);
        ellipse(ctx, c - 32, y + tilt / 2, 6, 6, '#cfc6b0', '#1a1418', 3);
        ellipse(ctx, c + 32, y - tilt / 2, 6, 6, '#cfc6b0', '#1a1418', 3);
      }
      break;
    }
    case 'skull': {
      ellipse(ctx, c, c, 22, 19, '#d6ccb4', '#1a1418', 4);
      ctx.fillStyle = '#d6ccb4';
      ctx.fillRect(c - 11, c + 12, 22, 10);
      ellipse(ctx, c - 8, c + 2, 5, 6, '#1a1418', null);
      ellipse(ctx, c + 8, c + 2, 5, 6, '#1a1418', null);
      break;
    }
    case 'grass': {
      for (let i = 0; i < 9; i++) {
        const x = c - 26 + rand() * 52;
        const h = 14 + rand() * 22;
        line(ctx, x, c + 18, x + (rand() - 0.5) * 14, c + 18 - h, rand() > 0.5 ? '#4a6b3a' : '#3a5530', 4);
      }
      break;
    }
    case 'mushrooms': {
      for (let i = 0; i < 3; i++) {
        const x = c - 20 + i * 18;
        const h = 10 + rand() * 12;
        line(ctx, x, c + 18, x, c + 18 - h, '#d8d0bc', 5);
        ellipse(ctx, x, c + 16 - h, 10, 6, i === 1 ? '#7a5aa8' : '#5a7ab0', '#14101a', 3);
        ellipse(ctx, x - 3, c + 14 - h, 2, 2, 'rgba(200,240,255,0.9)', null);
      }
      break;
    }
    case 'candle': {
      // the flame itself is animated in WorldMap
      ellipse(ctx, c, c + 22, 18, 6, 'rgba(230,220,200,0.7)', null);
      ctx.fillStyle = '#14101a';
      ctx.fillRect(c - 9, c - 6, 18, 30);
      ctx.fillStyle = '#efe5cc';
      ctx.fillRect(c - 6, c - 4, 12, 27);
      line(ctx, c, c - 6, c, c - 12, '#14101a', 3);
      break;
    }
    case 'ruin': {
      polygon(ctx, [c - 22, size - 8, c - 22, 26, c - 10, 18, c + 4, 30, c + 22, 22, c + 22, size - 8], '#5b5a63', '#1c1b22', 5);
      for (let y = 40; y < size - 10; y += 22) line(ctx, c - 20, y, c + 20, y + 3, 'rgba(20,18,26,0.55)', 3);
      ellipse(ctx, c - 8, size - 14, 16, 8, '#3d5a32', null);
      break;
    }
    default:
      break;
  }
}

// ---------- floor tile ----------

function drawFloorTile(ctx, size) {
  const rand = seededRandom(1337);
  ctx.fillStyle = '#273126';
  ctx.fillRect(0, 0, size, size);

  // draws something at x,y and repeats it on the opposite edges so the tile wraps seamlessly
  const wrapped = (x, y, reach, draw) => {
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        const px = x + ox;
        const py = y + oy;
        if (px + reach < 0 || px - reach > size || py + reach < 0 || py - reach > size) continue;
        draw(px, py);
      }
    }
  };

  // soft dirt / moss patches
  for (let i = 0; i < 40; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 50 + rand() * 90;
    const color = rand() > 0.5 ? 'rgba(52,44,34,0.45)' : 'rgba(46,66,40,0.45)';
    wrapped(x, y, r, (px, py) => {
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
    });
  }

  // a few worn flagstones (low contrast so the repeat is not noticeable)
  for (let i = 0; i < 9; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 40 + rand() * 40;
    const h = 30 + rand() * 30;
    const shade = 50 + Math.floor(rand() * 14);
    wrapped(x, y, Math.max(w, h), (px, py) => {
      ctx.fillStyle = `rgba(${shade},${shade + 4},${shade + 2},0.3)`;
      ctx.strokeStyle = 'rgba(20,24,20,0.3)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px - w / 2, py - h / 2 + 4);
      ctx.lineTo(px + w / 2 - 4, py - h / 2);
      ctx.lineTo(px + w / 2, py + h / 2 - 3);
      ctx.lineTo(px - w / 2 + 3, py + h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }

  // speckle noise
  const speckles = ['#2f3a2c', '#222b20', '#34412f', '#2b2a22'];
  for (let i = 0; i < 10000; i++) {
    ctx.fillStyle = speckles[Math.floor(rand() * speckles.length)];
    const s = 2 + Math.floor(rand() * 3);
    ctx.fillRect(Math.floor(rand() * size), Math.floor(rand() * size), s, s);
  }

  // grass blades
  for (let i = 0; i < 320; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const h = 6 + rand() * 10;
    const lean = (rand() - 0.5) * 8;
    const color = rand() > 0.5 ? '#3c5233' : '#33472c';
    wrapped(x, y, 20, (px, py) => line(ctx, px, py, px + lean, py - h, color, 2));
  }
}

// ---------- the library ----------

export class SpriteLibrary {
  constructor() {
    this.sprites = new Map();
    this.flashes = new Map();
    this.decorations = new Map();
    this.scaledCache = new Map(); // source canvas -> Map("size|flip" -> pre-scaled canvas)
    this.build();
  }

  /**
   * Returns a copy of `image` already scaled to `size` (and mirrored if flipX).
   * Scaling a 182px sprite every frame is the most expensive part of drawing a big
   * horde, so each on-screen size is rendered once and reused.
   */
  scaled(image, size, flipX = false) {
    const px = Math.max(1, Math.round(size));
    let bySize = this.scaledCache.get(image);
    if (!bySize) {
      bySize = new Map();
      this.scaledCache.set(image, bySize);
    }
    const key = flipX ? -px : px;
    let canvas = bySize.get(key);
    if (!canvas) {
      canvas = makeSprite((ctx) => {
        if (flipX) {
          ctx.translate(px, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(image, 0, 0, px, px);
      }, px);
      bySize.set(key, canvas);
    }
    return canvas;
  }

  /** Fast path: draws a cached, pre-scaled sprite centered on (x, y) at whole pixels. */
  blit(ctx, image, x, y, size, flipX = false) {
    const canvas = this.scaled(image, size, flipX);
    ctx.drawImage(canvas, Math.round(x - canvas.width / 2), Math.round(y - canvas.height / 2));
  }

  add(name, frames, withFlash = false) {
    this.sprites.set(name, frames);
    if (withFlash) this.flashes.set(name, frames.map(makeFlash));
  }

  build() {
    this.add('player', [0, 1, 2, 3].map((f) => makeSprite((ctx) => drawPlayer(ctx, f))), true);
    this.add('slime', [0, 1].map((f) => makeSprite((ctx) => drawSlime(ctx, f))), true);
    this.add('bat', [0, 1].map((f) => makeSprite((ctx) => drawBat(ctx, f))), true);
    this.add('crawler', [0, 1].map((f) => makeSprite((ctx) => drawCrawler(ctx, f))), true);
    this.add('brute', [0, 1].map((f) => makeSprite((ctx) => drawBrute(ctx, f))), true);
    this.add('elite', [0, 1].map((f) => makeSprite((ctx) => drawElite(ctx, f))), true);
    this.add('boss', [0, 1].map((f) => makeSprite((ctx) => drawBoss(ctx, f))), true);

    for (const tier of Object.keys(GEM_COLORS)) this.add(`gem_${tier}`, [makeSprite((ctx) => drawGem(ctx, tier))]);
    this.add('coin', [makeSprite(drawCoin)]);
    this.add('chest', [makeSprite((ctx) => drawChest(ctx, false)), makeSprite((ctx) => drawChest(ctx, true))]);

    // weapon visuals (also used as UI icons)
    this.add('bolt', [makeSprite((ctx) => drawBolt(ctx, false))]);
    this.add('tempest', [makeSprite((ctx) => drawBolt(ctx, true))]);
    this.add('blade', [makeSprite((ctx) => drawBlade(ctx, false))]);
    this.add('sunblade', [makeSprite((ctx) => drawBlade(ctx, true))]);
    this.add('mark', [makeSprite(drawMark)]);
    this.add('pulse', [makeSprite((ctx) => drawPulseIcon(ctx, false))]);
    this.add('nova', [makeSprite((ctx) => drawPulseIcon(ctx, true))]);
    this.add('crown', [makeSprite(drawCrown)]);
    this.add('icon_tempest', [makeSprite(drawTempestIcon)]);

    for (const [name, draw] of Object.entries(ICON_DRAWERS)) this.add(`icon_${name}`, [makeSprite(draw)]);
    this.add('icon_coin', this.sprites.get('coin'));

    // soft round glows, drawn with additive blending
    for (const [name, color] of Object.entries({
      orange: 'rgba(255,150,60,1)',
      blue: 'rgba(130,200,255,1)',
      gold: 'rgba(255,215,110,1)',
      white: 'rgba(255,255,255,1)',
      red: 'rgba(255,60,80,1)',
    })) {
      this.add(`glow_${name}`, [makeSprite((ctx) => radialGlow(ctx, 64, 64, 64, color), 128)]);
    }

    // decorations: a few variants of each
    const rand = seededRandom(42);
    for (const kind of ['rock', 'bones', 'skull', 'grass', 'mushrooms', 'candle']) {
      const variants = [];
      for (let v = 0; v < 3; v++) variants.push(makeSprite((ctx) => drawDecoration(ctx, kind, 96, rand), 96));
      this.decorations.set(kind, variants);
    }
    this.decorations.set('ruin', [0, 1].map(() => makeSprite((ctx) => drawDecoration(ctx, 'ruin', 96, rand), 96)));

    this.floorTile = makeSprite((ctx, size) => drawFloorTile(ctx, size), 1024);
  }

  get(name, frame = 0) {
    const frames = this.sprites.get(name);
    return frames[frame % frames.length];
  }

  getFlash(name, frame = 0) {
    const frames = this.flashes.get(name);
    return frames ? frames[frame % frames.length] : this.get(name, frame);
  }

  frameCount(name) {
    return this.sprites.get(name).length;
  }

  /** Icon for any weapon / passive / shop item id used in the configs. */
  icon(iconName) {
    if (this.sprites.has(`icon_${iconName}`)) return this.get(`icon_${iconName}`);
    return this.get(iconName);
  }
}

/** Draws a sprite centered on (x, y) at the given on-screen size, optionally mirrored. */
export function drawSprite(ctx, image, x, y, size, flipX = false, rotation = 0) {
  if (!flipX && rotation === 0) {
    ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  if (rotation) ctx.rotate(rotation);
  if (flipX) ctx.scale(-1, 1);
  ctx.drawImage(image, -size / 2, -size / 2, size, size);
  ctx.restore();
}
