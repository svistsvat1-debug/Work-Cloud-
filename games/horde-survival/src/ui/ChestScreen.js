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
    this.hasEvolution = rewards.some((reward) => reward.kind === 'evolution');
    this.burstPlayed = false;
    this.game.audio.play('chestShake');
  }

  /** Seconds from opening until the last reward is fully visible. */
  get revealEnd() {
    return ChestScreen.OPEN_AT + 0.3 + this.rewards.length * ChestScreen.REWARD_DELAY;
  }

  update(dt) {
    this.time += dt;
    if (!this.burstPlayed && this.time >= ChestScreen.OPEN_AT) {
      this.burstPlayed = true;
      this.game.audio.play(this.hasEvolution ? 'evolution' : 'chestOpen');
    }
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

    // A short screen shake when the chest bursts open (stronger for an evolution).
    const shake = this.hasEvolution ? GameConfig.shakes.evolution : GameConfig.shakes.chestOpen;
    const sinceOpen = this.time - ChestScreen.OPEN_AT;
    const shakePower = opened && sinceOpen < shake.duration ? shake.strength * (1 - sinceOpen / shake.duration) : 0;
    ctx.save();
    ctx.translate((Math.random() * 2 - 1) * shakePower, (Math.random() * 2 - 1) * shakePower);

    ctx.fillStyle = 'rgba(8, 6, 14, 0.82)';
    ctx.fillRect(0, 0, width, height);

    let title = opened ? 'TREASURE!' : 'Opening chest...';
    let titleColor = '#ffd166';
    if (opened && this.hasEvolution) {
      // The big moment: pulsing pink-gold title.
      title = 'WEAPON EVOLVED!';
      titleColor = Math.floor(this.time * 6) % 2 === 0 ? '#ff9cf0' : '#ffe08a';
    }
    DrawUtils.text(ctx, title, centerX, 110, { size: 72, weight: 'bold', align: 'center', color: titleColor });

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

    ctx.restore();

    if (this.time >= this.revealEnd && Math.floor(this.time * 2) % 2 === 0) {
      const hint = this.game.input.touchMode ? 'Tap to continue' : 'Press Space or click to continue';
      DrawUtils.text(ctx, hint, centerX, 960, {
        size: 32,
        align: 'center',
        color: '#e8eef5',
      });
    }
  }

  /** Rotating light rays behind the open chest (pink and faster for an evolution). */
  renderLightRays(ctx, x, y) {
    const rays = this.hasEvolution ? 18 : 12;
    const spin = this.time * (this.hasEvolution ? 1.2 : 0.6);
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = this.hasEvolution ? 0.36 : 0.28;
    ctx.fillStyle = this.hasEvolution ? '#ffc6f5' : '#ffe9a8';
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
    const cardHeight = 330;
    const gap = 40;
    const widths = this.rewards.map((reward) => (reward.kind === 'evolution' ? 460 : 340));
    const total = widths.reduce((sum, width) => sum + width, 0) + (this.rewards.length - 1) * gap;
    let left = (this.game.width - total) / 2;

    this.rewards.forEach((reward, index) => {
      const cardWidth = widths[index];
      const x = left + cardWidth / 2;
      left += cardWidth + gap;

      const appearAt = ChestScreen.OPEN_AT + 0.3 + index * ChestScreen.REWARD_DELAY;
      const progress = MathUtils.clamp((this.time - appearAt) / 0.25, 0, 1);
      if (progress <= 0) return;

      // Pop in: grows from 60% to 100% and fades in.
      const scale = 0.6 + 0.4 * progress;
      ctx.save();
      ctx.globalAlpha = progress;
      ctx.translate(x, 520 + cardHeight / 2);
      ctx.scale(scale, scale);
      if (reward.kind === 'evolution') this.renderEvolutionCard(ctx, reward, cardWidth, cardHeight);
      else this.renderRewardCard(ctx, reward, cardWidth, cardHeight);
      ctx.restore();
    });
  }

  /** The evolution card: old weapon -> new weapon, with a glowing animated border. */
  renderEvolutionCard(ctx, reward, width, height) {
    const left = -width / 2;
    const top = -height / 2;
    DrawUtils.roundRect(ctx, left, top, width, height, 24);
    ctx.fillStyle = '#2d1838';
    ctx.fill();
    ctx.lineWidth = 6 + Math.sin(this.time * 8) * 2;
    ctx.strokeStyle = Math.floor(this.time * 6) % 2 === 0 ? '#ff9cf0' : '#ffe08a';
    ctx.stroke();

    const sprites = this.game.sprites;
    ctx.globalAlpha *= 0.75;
    ctx.drawImage(sprites[reward.fromIcon], -150, top + 48, 86, 86);
    ctx.globalAlpha /= 0.75;
    DrawUtils.text(ctx, '→', -30, top + 62, { size: 52, weight: 'bold', align: 'center', color: '#ffe08a' });
    ctx.drawImage(sprites[reward.icon], 30, top + 26, 130, 130);

    DrawUtils.text(ctx, `${reward.fromName} evolved into`, 0, top + 172, { size: 24, align: 'center', color: '#d7e0ea' });
    DrawUtils.text(ctx, reward.name, 0, top + 206, { size: 38, weight: 'bold', align: 'center', color: '#ff9cf0' });
    ctx.font = `24px ${GameConfig.ui.font}`;
    DrawUtils.wrapText(ctx, reward.effect, width - 50).slice(0, 2).forEach((line, index) => {
      DrawUtils.text(ctx, line, 0, top + 258 + index * 30, { size: 24, align: 'center', color: '#ffe08a' });
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
