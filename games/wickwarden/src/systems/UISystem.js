// Draws the HUD and every screen (title, shop, level-up, chest, pause, game over)
// directly on the canvas, and keeps a list of clickable buttons for the current frame.

import { GameConfig } from '../config/GameConfig.js';
import { META_UPGRADES, getMetaCost } from '../config/MetaUpgrades.js';
import { WAVES } from '../config/Waves.js';
import { PASSIVES } from '../config/Passives.js';
import { formatTime, clamp, TAU } from '../core/MathUtils.js';
import { drawSprite } from '../assets/ProceduralSprites.js';

const W = GameConfig.width;
const H = GameConfig.height;
const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';
const TITLE_FONT = 'Georgia, "Times New Roman", serif';

export class UISystem {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.banners = [];
    this.resetConfirmTime = -10;
  }

  // ---------- banners ("Wave 3", "Boss approaches!") ----------

  announce(title, subtitle = null, color = '#ffe9b0') {
    this.banners.push({ title, subtitle, color, time: 0, duration: 2.6 });
    if (this.banners.length > 3) this.banners.shift();
  }

  update(dt) {
    if (this.banners.length === 0) return;
    this.banners[0].time += dt;
    if (this.banners[0].time >= this.banners[0].duration) this.banners.shift();
  }

  // ---------- buttons ----------

  beginFrame() {
    this.buttons.length = 0;
  }

  getClickedButton() {
    const mouse = this.game.input.mouse;
    if (!mouse.clicked) return null;
    for (let i = this.buttons.length - 1; i >= 0; i--) {
      const b = this.buttons[i];
      if (b.enabled && this.isInside(mouse, b.x, b.y, b.w, b.h)) return b.id;
    }
    return null;
  }

  isInside(point, x, y, w, h) {
    return point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h;
  }

  isHovered(x, y, w, h) {
    return this.isInside(this.game.input.mouse, x, y, w, h);
  }

  // ---------- drawing primitives ----------

  text(ctx, str, x, y, size, color, align = 'left', options = {}) {
    ctx.font = `${options.weight || 'bold'} ${size}px ${options.font || FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    if (options.stroke !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(3, size / 7);
      ctx.strokeStyle = 'rgba(8,5,14,0.9)';
      ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  /** Draws text wrapped to maxWidth; returns the y after the last line. */
  wrapText(ctx, str, x, y, maxWidth, size, color, align = 'center', lineHeight = size * 1.3) {
    ctx.font = `bold ${size}px ${FONT}`;
    const words = str.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        this.text(ctx, line, x, y, size, color, align, { stroke: false });
        line = word;
        y += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) this.text(ctx, line, x, y, size, color, align, { stroke: false });
    return y + lineHeight;
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  panel(ctx, x, y, w, h, { fill = 'rgba(20,14,30,0.88)', border = 'rgba(170,150,210,0.5)', radius = 14, lineWidth = 3, glow = null } = {}) {
    ctx.save();
    if (glow) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 24;
    }
    this.roundRect(ctx, x, y, w, h, radius);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
    if (border) {
      this.roundRect(ctx, x, y, w, h, radius);
      ctx.strokeStyle = border;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  button(ctx, id, label, x, y, w, h, { enabled = true, primary = false, size = 28 } = {}) {
    this.buttons.push({ id, x, y, w, h, enabled });
    const hover = enabled && this.isHovered(x, y, w, h);
    let fill = primary ? '#b8452f' : 'rgba(40,30,58,0.95)';
    if (hover) fill = primary ? '#d85a3a' : 'rgba(70,54,98,0.98)';
    if (!enabled) fill = 'rgba(40,36,48,0.8)';
    this.panel(ctx, x, y, w, h, {
      fill,
      border: enabled ? (primary ? '#ffd76a' : 'rgba(200,180,240,0.6)') : 'rgba(120,110,130,0.4)',
      glow: hover ? (primary ? 'rgba(255,170,80,0.8)' : 'rgba(170,140,255,0.6)') : null,
    });
    this.text(ctx, label, x + w / 2, y + h / 2 + size * 0.36, size, enabled ? '#ffffff' : '#8a8494', 'center');
  }

  bar(ctx, x, y, w, h, ratio, colorA, colorB, radius = 6) {
    this.panel(ctx, x, y, w, h, { fill: 'rgba(10,6,16,0.8)', border: 'rgba(0,0,0,0.9)', radius, lineWidth: 2 });
    const fillW = Math.max(0, (w - 4) * clamp(ratio, 0, 1));
    if (fillW > 0) {
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, colorB);
      g.addColorStop(1, colorA);
      this.roundRect(ctx, x + 2, y + 2, fillW, h - 4, Math.max(1, radius - 2));
      ctx.fillStyle = g;
      ctx.fill();
    }
  }

  icon(ctx, iconName, x, y, size) {
    drawSprite(ctx, this.game.sprites.icon(iconName), x, y, size);
  }

  overlay(ctx, color = 'rgba(8,5,14,0.75)') {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
  }

  muteButton(ctx, x = W - 84, y = 34) {
    const size = 50;
    const muted = this.game.save.muted;
    this.buttons.push({ id: 'mute', x, y, w: size, h: size, enabled: true });
    const hover = this.isHovered(x, y, size, size);
    this.panel(ctx, x, y, size, size, { fill: hover ? 'rgba(70,54,98,0.95)' : 'rgba(20,14,30,0.8)', radius: 10 });
    // speaker icon
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 20);
    ctx.lineTo(x + 19, y + 20);
    ctx.lineTo(x + 28, y + 12);
    ctx.lineTo(x + 28, y + 38);
    ctx.lineTo(x + 19, y + 30);
    ctx.lineTo(x + 12, y + 30);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = muted ? '#ff6a6a' : '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (muted) {
      ctx.moveTo(x + 32, y + 18);
      ctx.lineTo(x + 42, y + 32);
      ctx.moveTo(x + 42, y + 18);
      ctx.lineTo(x + 32, y + 32);
    } else {
      ctx.arc(x + 29, y + 25, 8, -0.8, 0.8);
      ctx.moveTo(x + 39, y + 14);
      ctx.arc(x + 29, y + 25, 14, -0.8, 0.8);
    }
    ctx.stroke();
  }

  // ---------- HUD ----------

  drawHUD(ctx) {
    const game = this.game;
    const player = game.player;
    const run = game.run;

    // XP bar across the top
    this.bar(ctx, 0, 0, W, 22, player.xp / player.xpToNext, '#2f6bff', '#7fe3ff', 0);
    this.text(ctx, `LV ${player.level}`, W - 14, 18, 18, '#ffffff', 'right');

    // HP bar
    const hpRatio = player.health / player.stats.maxHealth;
    this.bar(ctx, 32, 38, 420, 32, hpRatio, '#a3202c', hpRatio < 0.25 ? '#ff9a9a' : '#ff5a5a');
    this.text(ctx, `${Math.ceil(player.health)} / ${player.stats.maxHealth}`, 242, 62, 20, '#ffffff', 'center');

    // weapon slots
    for (let i = 0; i < GameConfig.player.maxWeapons; i++) {
      const w = player.weapons[i];
      const x = 32 + i * 78;
      if (!w) {
        this.panel(ctx, x, 84, 68, 68, { fill: 'rgba(20,14,30,0.4)', border: 'rgba(170,150,210,0.2)', radius: 10 });
        continue;
      }
      const evolved = !!w.def.evolution;
      const maxed = w.level >= w.def.maxLevel;
      this.panel(ctx, x, 84, 68, 68, {
        fill: evolved ? 'rgba(70,46,10,0.9)' : 'rgba(20,14,30,0.85)',
        border: evolved ? '#ffd76a' : maxed ? '#ff9a4a' : 'rgba(170,150,210,0.6)',
        radius: 10,
        glow: evolved ? 'rgba(255,200,80,0.9)' : null,
      });
      this.icon(ctx, w.def.icon, x + 34, 118, 56);
      this.text(ctx, evolved ? 'EVO' : maxed ? 'MAX' : `${w.level}`, x + 62, 147, 16, evolved ? '#ffd76a' : '#ffffff', 'right');
    }

    // passive slots
    for (let i = 0; i < GameConfig.player.maxPassives; i++) {
      const p = player.passives[i];
      const x = 32 + i * 58;
      if (!p) {
        this.panel(ctx, x, 162, 50, 50, { fill: 'rgba(20,14,30,0.35)', border: 'rgba(170,150,210,0.18)', radius: 8 });
        continue;
      }
      const def = PASSIVES[p.id];
      this.panel(ctx, x, 162, 50, 50, { fill: 'rgba(20,14,30,0.85)', border: p.level >= def.maxLevel ? '#6bd7ff' : 'rgba(170,150,210,0.5)', radius: 8 });
      this.icon(ctx, def.icon, x + 25, 187, 40);
      this.text(ctx, p.level >= def.maxLevel ? 'M' : `${p.level}`, x + 46, 208, 14, '#ffffff', 'right');
    }

    // timer + wave
    this.text(ctx, formatTime(run.time), W / 2, 84, 58, '#ffffff', 'center');
    const wave = WAVES[Math.max(0, game.spawner.waveIndex)];
    this.text(ctx, `Wave ${game.spawner.waveIndex + 1} · ${wave.name}`, W / 2, 116, 22, '#cdbfe6', 'center');

    // kills + gold
    this.text(ctx, `Kills ${run.kills}`, W - 108, 66, 28, '#ffffff', 'right');
    this.text(ctx, `${run.coins}`, W - 108, 106, 28, '#ffd76a', 'right');
    this.icon(ctx, 'coin', W - 108 - ctx.measureText(`${run.coins}`).width - 24, 96, 32);
    this.muteButton(ctx);

    this.drawBossBar(ctx);
    this.drawBanner(ctx);
    if (game.save.showDebug) this.drawDebug(ctx);
    this.text(ctx, 'Esc pause · M mute · F3 debug', W - 24, H - 20, 16, 'rgba(220,210,240,0.55)', 'right', { stroke: false });
  }

  drawBossBar(ctx) {
    const boss = this.game.enemies.find((e) => e.active && e.isBoss);
    if (!boss) return;
    this.text(ctx, boss.def.name, W / 2, H - 78, 28, '#ff8a8a', 'center', { font: TITLE_FONT });
    this.bar(ctx, W / 2 - 420, H - 66, 840, 30, boss.health / boss.maxHealth, '#8a1630', '#ff4d6a');
  }

  drawBanner(ctx) {
    const b = this.banners[0];
    if (!b) return;
    const fadeIn = clamp(b.time / 0.3, 0, 1);
    const fadeOut = clamp((b.duration - b.time) / 0.5, 0, 1);
    ctx.globalAlpha = Math.min(fadeIn, fadeOut);
    const scale = 1 + (1 - fadeIn) * 0.2;
    this.text(ctx, b.title, W / 2, 300, Math.round(64 * scale), b.color, 'center', { font: TITLE_FONT });
    if (b.subtitle) this.text(ctx, b.subtitle, W / 2, 346, 26, '#e8def8', 'center');
    ctx.globalAlpha = 1;
  }

  drawDebug(ctx) {
    const game = this.game;
    const lines = [
      `FPS ${Math.round(game.fps)}`,
      `Enemies ${game.enemies.length} · Projectiles ${game.projectiles.length}`,
      `Particles ${game.effects.particleCount} · Pickups ${game.gems.length + game.coins.length + game.chestsOnGround.length}`,
      `Player ${Math.round(game.player.x)}, ${Math.round(game.player.y)}`,
    ];
    this.panel(ctx, 20, H - 148, 430, 128, { fill: 'rgba(0,0,0,0.5)', border: null, radius: 8 });
    lines.forEach((line, i) => this.text(ctx, line, 34, H - 118 + i * 28, 18, '#b8f5c8', 'left', { stroke: false, weight: 'normal' }));
  }

  // ---------- title & shop ----------

  drawGameTitle(ctx, y = 190, size = 150) {
    ctx.save();
    ctx.shadowColor = 'rgba(255,170,80,0.9)';
    ctx.shadowBlur = 40;
    const g = ctx.createLinearGradient(0, y - size, 0, y);
    g.addColorStop(0, '#fff3c4');
    g.addColorStop(1, '#ffb347');
    ctx.font = `bold ${size}px ${TITLE_FONT}`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#2a1020';
    ctx.strokeText(GameConfig.title, W / 2, y);
    ctx.fillStyle = g;
    ctx.fillText(GameConfig.title, W / 2, y);
    ctx.restore();
  }

  drawTitle(ctx) {
    const save = this.game.save;
    this.drawGameTitle(ctx);
    this.text(ctx, GameConfig.subtitle, W / 2, 252, 34, '#ffe6c4', 'center', { font: TITLE_FONT, weight: 'italic' });
    this.button(ctx, 'start', 'Start  (Enter)', W / 2 - 170, 560, 340, 86, { primary: true, size: 34 });
    this.text(ctx, `Gold ${save.totalCoins}  ·  Best time ${formatTime(save.bestTime)}`, W / 2, 700, 26, '#ffe9b0', 'center');
    this.text(ctx, 'Move: WASD / Arrows (or drag on touch)  ·  Weapons fire automatically  ·  Survive the night', W / 2, H - 36, 22, '#e8def8', 'center');
    this.muteButton(ctx);
  }

  drawShop(ctx) {
    const game = this.game;
    const save = game.save;
    this.overlay(ctx, 'rgba(8,5,14,0.62)');
    this.text(ctx, 'UPGRADE SHOP', W / 2, 118, 70, '#ffd76a', 'center', { font: TITLE_FONT });
    this.icon(ctx, 'coin', W / 2 - 90, 165, 36);
    this.text(ctx, `${save.totalCoins} gold`, W / 2 - 62, 177, 32, '#ffe9b0', 'left');

    const cardW = 500;
    const cardH = 250;
    const gap = 40;
    const startX = (W - (cardW * 3 + gap * 2)) / 2;
    META_UPGRADES.forEach((up, i) => {
      const x = startX + (i % 3) * (cardW + gap);
      const y = 220 + Math.floor(i / 3) * (cardH + 40);
      const level = save.meta[up.id] || 0;
      const maxed = level >= up.maxLevel;
      const cost = getMetaCost(up, level);
      this.panel(ctx, x, y, cardW, cardH, { border: maxed ? '#6bd7ff' : 'rgba(170,150,210,0.5)' });
      this.icon(ctx, up.icon, x + 75, y + 90, 110);
      this.text(ctx, up.name, x + 150, y + 62, 32, '#ffffff');
      this.text(ctx, `${up.description} per level`, x + 150, y + 98, 21, '#d8cfe8', 'left', { stroke: false });
      for (let p = 0; p < up.maxLevel; p++) {
        ctx.fillStyle = p < level ? '#ffd76a' : 'rgba(255,255,255,0.15)';
        ctx.fillRect(x + 150 + p * 32, y + 118, 26, 14);
      }
      this.button(ctx, `buy:${up.id}`, maxed ? 'MAXED' : `Buy · ${cost} gold`, x + 150, y + 160, 320, 60, {
        enabled: !maxed && save.totalCoins >= cost,
        size: 24,
      });
    });

    this.button(ctx, 'begin', 'Begin Run  (Enter)', W / 2 - 210, 820, 420, 88, { primary: true, size: 34 });
    this.button(ctx, 'back', 'Back  (Esc)', 170, 832, 260, 64, { size: 24 });
    const confirming = game.time - this.resetConfirmTime < 3;
    this.button(ctx, 'reset', confirming ? 'Click again to reset' : 'Reset Save', W - 170 - 300, 832, 300, 64, { size: 24 });
    this.text(ctx, 'Gold is earned during runs and added to your total when the run ends.', W / 2, 980, 22, '#cdbfe6', 'center', { stroke: false });
    this.muteButton(ctx);
  }

  // ---------- level up ----------

  drawLevelUp(ctx) {
    const game = this.game;
    this.overlay(ctx);
    const pulse = 1 + Math.sin(game.time * 5) * 0.03;
    this.text(ctx, 'LEVEL UP!', W / 2, 190, Math.round(86 * pulse), '#ffd76a', 'center', { font: TITLE_FONT });
    const extra = game.run.pendingLevelUps > 1 ? `  (+${game.run.pendingLevelUps - 1} more)` : '';
    this.text(ctx, `Level ${game.player.level - game.run.pendingLevelUps + 1} — choose one${extra}`, W / 2, 238, 28, '#e8def8', 'center');

    const choices = game.levelUpChoices;
    const cardW = 460;
    const cardH = 520;
    const gap = 50;
    const startX = (W - (choices.length * cardW + (choices.length - 1) * gap)) / 2;
    const ready = game.levelUpTimer > 0.25;
    choices.forEach((choice, i) => {
      const x = startX + i * (cardW + gap);
      const hover = ready && this.isHovered(x, 290, cardW, cardH);
      const y = 290 - (hover ? 10 : 0);
      this.buttons.push({ id: `choice:${i}`, x, y: 290, w: cardW, h: cardH, enabled: ready });
      this.panel(ctx, x, y, cardW, cardH, {
        fill: hover ? 'rgba(46,32,70,0.97)' : 'rgba(26,18,40,0.95)',
        border: hover ? '#ffd76a' : choice.tagColor,
        glow: hover ? 'rgba(255,200,100,0.7)' : null,
        lineWidth: 4,
      });
      // number badge
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.arc(x + 40, y + 40, 24, 0, TAU);
      ctx.fill();
      this.text(ctx, `${i + 1}`, x + 40, y + 50, 28, '#ffffff', 'center');
      this.text(ctx, choice.tag, x + cardW - 24, y + 48, 20, choice.tagColor, 'right');

      this.icon(ctx, choice.icon, x + cardW / 2, y + 165, 150);
      this.text(ctx, choice.name, x + cardW / 2, y + 300, 36, '#ffffff', 'center');
      this.text(ctx, choice.levelText, x + cardW / 2, y + 344, 26, choice.levelText === 'NEW!' ? '#7dff9a' : '#ffd76a', 'center');
      this.wrapText(ctx, choice.description, x + cardW / 2, y + 400, cardW - 70, 24, '#d8cfe8');
    });
    this.text(ctx, `Press ${choices.map((_, i) => i + 1).join(', ')} or click a card`, W / 2, 900, 24, '#cdbfe6', 'center');
  }

  // ---------- chest ----------

  drawChest(ctx) {
    const game = this.game;
    const state = game.chestState;
    const reveal = GameConfig.chest.revealTime;
    const t = state.timer;
    const cx = W / 2;
    const cy = 470;
    this.overlay(ctx, 'rgba(6,4,12,0.82)');

    if (t < reveal) {
      const k = t / reveal;
      const shake = k * 28;
      const sx = (Math.random() - 0.5) * shake;
      const sy = (Math.random() - 0.5) * shake * 0.4;
      if (k > 0.55) {
        // light leaking from the chest, growing into a burst
        const r = 120 + (k - 0.55) * 1400;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(255,236,170,${0.9 * k})`);
        g.addColorStop(1, 'rgba(255,200,100,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      drawSprite(ctx, game.sprites.get('chest', 0), cx + sx, cy + sy, 320);
      this.text(ctx, 'Something stirs inside…', W / 2, 760, 30, '#e8def8', 'center');
      return;
    }

    const since = t - reveal;
    this.drawRays(ctx, cx, cy, game.time, state.isEvolution ? '#ffe9a0' : '#ffd76a');
    drawSprite(ctx, game.sprites.get('chest', 1), cx, cy, 320);

    if (state.isEvolution) {
      const hue = (game.time * 120) % 360;
      ctx.save();
      ctx.shadowColor = `hsl(${hue},100%,65%)`;
      ctx.shadowBlur = 30;
      this.text(ctx, 'WEAPON EVOLVED!', W / 2, 180, Math.round(96 * (1 + Math.max(0, 0.3 - since))), `hsl(${hue},100%,75%)`, 'center', { font: TITLE_FONT });
      ctx.restore();
    } else {
      this.text(ctx, 'TREASURE!', W / 2, 180, 90, '#ffd76a', 'center', { font: TITLE_FONT });
    }

    state.rewards.forEach((reward, i) => {
      const appear = clamp((since - i * 0.25) / 0.25, 0, 1);
      if (appear <= 0) return;
      const big = reward.type === 'evolution';
      const w = big ? 900 : 720;
      const h = big ? 180 : 120;
      const y = 650 + i * 150 + (1 - appear) * 30;
      ctx.globalAlpha = appear;
      this.panel(ctx, W / 2 - w / 2, y, w, h, { border: reward.color, glow: reward.color, lineWidth: 4 });
      this.icon(ctx, reward.icon, W / 2 - w / 2 + 80, y + h / 2, big ? 130 : 90);
      const tx = W / 2 - w / 2 + 160;
      this.text(ctx, reward.bonus ? `BONUS · ${reward.title}` : reward.title, tx, y + 36, 20, reward.color);
      this.text(ctx, reward.name, tx, y + (big ? 86 : 74), big ? 46 : 36, '#ffffff');
      this.text(ctx, reward.detail, tx, y + (big ? 124 : 106), 24, '#d8cfe8', 'left', { stroke: false });
      if (big && reward.description) this.text(ctx, reward.description, tx, y + 158, 22, '#ffe9b0', 'left', { stroke: false });
      ctx.globalAlpha = 1;
    });

    // white flash right at the reveal
    if (since < 0.35) {
      ctx.fillStyle = `rgba(255,250,230,${(1 - since / 0.35) * 0.7})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (since > 0.4 && Math.floor(game.time * 2) % 2 === 0) {
      this.text(ctx, 'Press Space or click to continue', W / 2, H - 40, 26, '#ffffff', 'center');
    }
  }

  drawRays(ctx, cx, cy, time, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 0.4);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = color;
    for (let i = 0; i < 14; i++) {
      ctx.rotate(TAU / 14);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-50, -900);
      ctx.lineTo(50, -900);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300);
    g.addColorStop(0, 'rgba(255,236,170,0.6)');
    g.addColorStop(1, 'rgba(255,200,100,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - 300, cy - 300, 600, 600);
  }

  // ---------- pause & game over ----------

  drawPause(ctx) {
    this.overlay(ctx);
    this.text(ctx, 'PAUSED', W / 2, 380, 96, '#ffffff', 'center', { font: TITLE_FONT });
    this.button(ctx, 'resume', 'Resume  (Esc)', W / 2 - 180, 480, 360, 80, { primary: true, size: 30 });
    this.button(ctx, 'giveup', 'Give up  (Q)', W / 2 - 180, 590, 360, 70, { size: 26 });
    this.muteButton(ctx);
  }

  drawGameOver(ctx) {
    const game = this.game;
    const run = game.run;
    const player = game.player;
    this.overlay(ctx, 'rgba(12,4,8,0.84)');
    this.text(ctx, 'THE LIGHT GOES OUT', W / 2, 140, 78, '#ff7a5a', 'center', { font: TITLE_FONT });
    if (run.newBest) this.text(ctx, 'New best time!', W / 2, 186, 30, '#ffd76a', 'center');

    const px = 460;
    const pw = 1000;
    this.panel(ctx, px, 210, pw, 640);
    const rows = [
      ['Survival time', formatTime(run.time)],
      ['Level reached', `${player.level}`],
      ['Enemies killed', `${run.kills}`],
      ['Bosses defeated', `${run.bossesDefeated}`],
      ['Gold earned', `+${run.coins}`],
      ['Total gold', `${game.save.totalCoins}`],
    ];
    rows.forEach(([label, value], i) => {
      const y = 272 + i * 50;
      this.text(ctx, label, px + 60, y, 28, '#d8cfe8', 'left', { stroke: false });
      this.text(ctx, value, px + pw - 60, y, 30, i === 4 || i === 5 ? '#ffd76a' : '#ffffff', 'right');
    });

    this.text(ctx, 'Weapons', px + 60, 600, 26, '#ffcf6b', 'left', { stroke: false });
    const weapons = player.weapons.map((w) => (w.def.evolution ? `${w.def.name} (EVO)` : `${w.def.name} Lv${w.level}`)).join(' · ');
    this.wrapText(ctx, weapons || 'None', px + 60, 640, pw - 120, 24, '#ffffff', 'left');
    this.text(ctx, 'Evolutions', px + 60, 730, 26, '#ffcf6b', 'left', { stroke: false });
    this.wrapText(ctx, run.evolutions.length ? run.evolutions.join(' · ') : 'None yet — max a weapon, own its item, open a chest', px + 60, 770, pw - 120, 24, '#ffffff', 'left');

    this.button(ctx, 'restart', 'Restart  (R)', 470, 890, 310, 76, { primary: true, size: 28 });
    this.button(ctx, 'shop', 'Upgrade Shop  (S)', 805, 890, 310, 76, { size: 28 });
    this.button(ctx, 'title', 'Title  (T)', 1140, 890, 310, 76, { size: 28 });
  }
}
