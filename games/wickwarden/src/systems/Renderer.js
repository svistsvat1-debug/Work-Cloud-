// Draws one frame: world (with camera), lighting, HUD, then the current screen.

import { GameConfig } from '../config/GameConfig.js';
import { createCanvas } from '../assets/ProceduralSprites.js';

const W = GameConfig.width;
const H = GameConfig.height;
const LIGHT = GameConfig.lighting;

/** Paints a radial gradient onto a new canvas once, so it can be reused every frame. */
function gradientCanvas(width, height, cx, cy, inner, outer, stops) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
  for (const [offset, color] of stops) g.addColorStop(offset, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  return canvas;
}

export class Renderer {
  constructor(game) {
    this.game = game;
    this.visibleEnemies = [];

    // The player is always at the screen center, so the lighting layers never change:
    // render them once instead of building full-screen gradients every frame.
    const pad = 40; // room for screen shake
    this.darkness = gradientCanvas(W + pad * 2, H + pad * 2, W / 2 + pad, H / 2 + pad - 20, LIGHT.innerRadius, LIGHT.outerRadius, [
      [0, 'rgba(10,6,22,0)'],
      [1, `rgba(10,6,22,${LIGHT.darkness})`],
    ]);
    this.darknessPad = pad;
    const warmSize = Math.round(LIGHT.innerRadius * 2.8);
    this.warmGlow = gradientCanvas(warmSize, warmSize, warmSize / 2, warmSize / 2, 0, warmSize / 2, [
      [0, 'rgba(255,150,60,0.10)'],
      [1, 'rgba(255,150,60,0)'],
    ]);
    this.redVignette = gradientCanvas(W, H, W / 2, H / 2, 380, 1100, [
      [0, 'rgba(160,0,20,0)'],
      [1, 'rgba(160,0,20,1)'],
    ]);
  }

  render() {
    const game = this.game;
    const ctx = game.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    game.ui.beginFrame();

    if (game.state === 'title' || game.state === 'shop') {
      game.menuBackground.render(ctx, game.time, game.frameDt);
      if (game.state === 'title') game.ui.drawTitle(ctx);
      else game.ui.drawShop(ctx);
      return;
    }

    this.renderWorld(ctx);
    this.renderLighting(ctx);
    game.ui.drawHUD(ctx);

    if (game.state === 'levelup') game.ui.drawLevelUp(ctx);
    else if (game.state === 'chest') game.ui.drawChest(ctx);
    else if (game.state === 'paused') game.ui.drawPause(ctx);
    else if (game.state === 'gameover') game.ui.drawGameOver(ctx);
  }

  renderWorld(ctx) {
    const game = this.game;
    const camera = game.camera;
    ctx.save();
    camera.apply(ctx);

    game.world.render(ctx, camera, game.time);

    for (const chest of game.chestsOnGround) if (chest.active) chest.render(ctx, game);
    for (const gem of game.gems) if (gem.active && camera.isVisible(gem.x, gem.y, 40)) gem.render(ctx, game);
    for (const coin of game.coins) if (coin.active && camera.isVisible(coin.x, coin.y, 40)) coin.render(ctx, game);

    game.effects.renderUnder(ctx);
    game.weapons.renderUnder(ctx);

    // enemies sorted by y so lower ones overlap upper ones
    const visible = this.visibleEnemies;
    visible.length = 0;
    for (const enemy of game.enemies) {
      if (enemy.active && camera.isVisible(enemy.x, enemy.y, enemy.drawSize)) visible.push(enemy);
    }
    visible.sort((a, b) => a.y - b.y);
    for (const enemy of visible) enemy.render(ctx, game);

    game.player.render(ctx, game);
    game.weapons.render(ctx);
    for (const projectile of game.projectiles) if (projectile.active) projectile.render(ctx, game);
    game.effects.renderOver(ctx, game.sprites);

    this.renderHealthBars(ctx, visible);
    ctx.restore();
  }

  renderHealthBars(ctx, visible) {
    // small enemy bars — only once an enemy is damaged, to keep the screen clean
    for (const enemy of visible) {
      if (enemy.isBoss || enemy.health >= enemy.maxHealth || !enemy.active) continue;
      const w = Math.min(84, enemy.radius * 2);
      const x = enemy.x - w / 2;
      const y = enemy.y - enemy.drawSize * 0.68;
      ctx.fillStyle = 'rgba(10,6,16,0.75)';
      ctx.fillRect(x - 1, y - 1, w + 2, 7);
      ctx.fillStyle = enemy.isElite ? '#ff6fe0' : '#ff5a5a';
      ctx.fillRect(x, y, w * (enemy.health / enemy.maxHealth), 5);
    }
    // player bar above the head
    const player = this.game.player;
    const w = 90;
    const x = player.x - w / 2;
    const y = player.y - 98;
    ctx.fillStyle = 'rgba(10,6,16,0.8)';
    ctx.fillRect(x - 2, y - 2, w + 4, 12);
    ctx.fillStyle = '#ff5a5a';
    ctx.fillRect(x, y, w * (player.health / player.stats.maxHealth), 8);
  }

  /** The lantern's light: the world fades into darkness away from the player. */
  renderLighting(ctx) {
    const game = this.game;
    const camera = game.camera;
    const pad = this.darknessPad;
    ctx.drawImage(this.darkness, Math.round(camera.offsetX - pad), Math.round(camera.offsetY - pad));

    // warm tint near the lantern, gently flickering
    const flicker = 0.85 + Math.sin(game.time * 7) * 0.1 + Math.sin(game.time * 13) * 0.05;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = flicker;
    ctx.drawImage(this.warmGlow, Math.round(W / 2 + camera.offsetX - this.warmGlow.width / 2), Math.round(H / 2 + camera.offsetY - 20 - this.warmGlow.height / 2));
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // low-health warning: a soft red pulse at the screen edges
    const player = game.player;
    if (player.health > 0 && player.health / player.stats.maxHealth < 0.25) {
      ctx.globalAlpha = 0.28 + Math.sin(game.time * 6) * 0.12;
      ctx.drawImage(this.redVignette, 0, 0);
      ctx.globalAlpha = 1;
    }
  }
}
