/**
 * The treasure chest screen. The game is paused while it plays:
 *   1. the chest shakes harder and harder,
 *   2. it bursts open in a flash of light,
 *   3. the rewards pop in one by one.
 * Space, Enter or a click skips the animation, and closes the screen at the end.
 */
class ChestScreen {
  constructor(game) {
    this.game = game;
    this.rewards = [];
    this.time = 0;
  }

  open(rewards) {
    this.rewards = rewards;
    this.time = 0;
  }

  /** Seconds from opening until the last reward is fully visible. */
  get revealEnd() {
    return ChestScreen.OPEN_AT + 0.3 + this.rewards.length * ChestScreen.REWARD_DELAY;
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    const pressed = input.wasPressed('confirm') || input.pointer.pressed;
    if (!pressed) return;
    if (this.time < this.revealEnd) {
      this.time = this.revealEnd; // first press: skip the animation
    } else {
      this.game.closeChest();
    }
  }

  render(ctx) {
    const { width, height, sprites } = this.game;
    const centerX = width / 2;
    const chestY = 360;
    const opened = this.time >= ChestScreen.OPEN_AT;

    ctx.fillStyle = 'rgba(8, 6, 14, 0.82)';
    ctx.fillRect(0, 0, width, height);

    DrawUtils.text(ctx, opened ? 'TREASURE!' : 'Opening chest...', centerX, 110, {
      size: 72,
      weight: 'bold',
      align: 'center',
      color: '#ffd166',
    });

    if (opened) this.renderLightRays(ctx, centerX, chestY);

    // The chest: shakes before opening, then sits open.
    const shakeStrength = opened ? 0 : 3 + 14 * (this.time / ChestScreen.OPEN_AT);
    const offsetX = (Math.random() * 2 - 1) * shakeStrength;
    const offsetY = (Math.random() * 2 - 1) * shakeStrength * 0.5;
    const size = 230;
    ctx.drawImage(opened ? sprites.chestOpen : sprites.chest, centerX - size / 2 + offsetX, chestY - size / 2 + offsetY, size, size);

    // A white flash right when it opens
    const flash = 1 - (this.time - ChestScreen.OPEN_AT) / 0.35;
    if (opened && flash > 0) {
      ctx.fillStyle = `rgba(255, 250, 220, ${flash * 0.85})`;
      ctx.fillRect(0, 0, width, height);
    }

    if (opened) this.renderRewards(ctx);

    if (this.time >= this.revealEnd && Math.floor(this.time * 2) % 2 === 0) {
      DrawUtils.text(ctx, 'Press Space or click to continue', centerX, 960, {
        size: 32,
        align: 'center',
        color: '#e8eef5',
      });
    }
  }

  /** Rotating golden rays behind the open chest. */
  renderLightRays(ctx, x, y) {
    const rays = 12;
    const spin = this.time * 0.6;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#ffe9a8';
    for (let i = 0; i < rays; i++) {
      const angle = spin + (i * Math.PI * 2) / rays;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 520, angle - 0.09, angle + 0.09);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  renderRewards(ctx) {
    const cardWidth = 340;
    const cardHeight = 330;
    const gap = 40;
    const total = this.rewards.length * cardWidth + (this.rewards.length - 1) * gap;
    const startX = (this.game.width - total) / 2;

    this.rewards.forEach((reward, index) => {
      const appearAt = ChestScreen.OPEN_AT + 0.3 + index * ChestScreen.REWARD_DELAY;
      const progress = MathUtils.clamp((this.time - appearAt) / 0.25, 0, 1);
      if (progress <= 0) return;

      // Pop in: grows from 60% to 100% and fades in.
      const scale = 0.6 + 0.4 * progress;
      const x = startX + index * (cardWidth + gap) + cardWidth / 2;
      const y = 520 + cardHeight / 2;
      ctx.save();
      ctx.globalAlpha = progress;
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      this.renderRewardCard(ctx, reward, cardWidth, cardHeight);
      ctx.restore();
    });
  }

  /** One reward card, drawn around (0, 0). */
  renderRewardCard(ctx, reward, width, height) {
    const left = -width / 2;
    const top = -height / 2;
    DrawUtils.roundRect(ctx, left, top, width, height, 22);
    ctx.fillStyle = '#231a33';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = reward.color || '#ffd166';
    ctx.stroke();

    ctx.drawImage(this.game.sprites[reward.icon], -60, top + 28, 120, 120);
    DrawUtils.text(ctx, reward.title, 0, top + 166, { size: 30, weight: 'bold', align: 'center' });
    DrawUtils.text(ctx, reward.name, 0, top + 210, { size: 26, align: 'center', color: '#d7e0ea' });
    DrawUtils.text(ctx, reward.effect, 0, top + 256, {
      size: 32,
      weight: 'bold',
      align: 'center',
      color: reward.color || '#7ee08a',
    });
  }
}

ChestScreen.OPEN_AT = 0.9; // seconds of shaking before the chest opens
ChestScreen.REWARD_DELAY = 0.25; // seconds between rewards popping in
