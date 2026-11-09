/**
 * The upgrade shop between runs. Coins buy permanent upgrades (ShopDefinitions),
 * which are saved in localStorage and applied at the start of every run.
 */
class ShopScreen {
  constructor(game) {
    this.game = game;
    this.cards = this.layoutCards();
    this.startButton = { x: 1400, y: 900, width: 380, height: 100 };
    this.backButton = { x: 140, y: 910, width: 240, height: 84 };
    this.resetButton = { x: 410, y: 910, width: 320, height: 84 };
    this.open();
  }

  open() {
    this.time = 0;
    this.message = null;
    this.resetConfirmTimer = 0;
  }

  /** 3 columns x 2 rows of upgrade cards, each with its own Buy button. */
  layoutCards() {
    const width = 520;
    const height = 300;
    const gap = 40;
    const startX = (GameConfig.width - (3 * width + 2 * gap)) / 2;
    return Object.keys(ShopDefinitions).map((id, index) => {
      const x = startX + (index % 3) * (width + gap);
      const y = 220 + Math.floor(index / 3) * (height + 30);
      return { id, x, y, width, height, buyButton: { x: x + 170, y: y + height - 84, width: width - 200, height: 62 } };
    });
  }

  levelOf(id) {
    return SaveData.data.upgrades[id] || 0;
  }

  /** Each level costs more than the last: baseCost * costGrowth ^ level. */
  costOf(id) {
    const upgrade = ShopDefinitions[id];
    return Math.round(upgrade.baseCost * Math.pow(upgrade.costGrowth, this.levelOf(id)));
  }

  update(dt) {
    this.time += dt;
    this.resetConfirmTimer = Math.max(0, this.resetConfirmTimer - dt);
    if (this.message) {
      this.message.time -= dt;
      if (this.message.time <= 0) this.message = null;
    }

    const input = this.game.input;
    for (const card of this.cards) {
      if (input.wasClicked(card.buyButton)) this.buy(card.id);
    }
    if (input.wasClicked(this.resetButton)) this.pressReset();
    if (input.wasPressed('confirm') || input.wasClicked(this.startButton)) {
      this.game.startNewRun();
    } else if (input.wasPressed('back') || input.wasClicked(this.backButton)) {
      this.game.showStartScreen();
    }
  }

  buy(id) {
    const upgrade = ShopDefinitions[id];
    const save = SaveData.data;
    const level = this.levelOf(id);
    if (level >= upgrade.maxLevel) {
      this.say(`${upgrade.name} is already at max level`, '#ffd166');
      return;
    }
    const cost = this.costOf(id);
    if (save.totalCoins < cost) {
      this.say(`Not enough coins: ${cost} needed`, '#ff8a8a');
      return;
    }
    save.totalCoins -= cost;
    save.upgrades[id] = level + 1;
    SaveData.save();
    this.say(`${upgrade.name} is now level ${level + 1}!`, '#7ee08a');
  }

  /** Reset needs two clicks within 3 seconds, so it can't happen by accident. */
  pressReset() {
    if (this.resetConfirmTimer > 0) {
      SaveData.reset();
      this.resetConfirmTimer = 0;
      this.say('Save data reset: coins and upgrades are back to zero', '#ff9c9c');
    } else {
      this.resetConfirmTimer = 3;
      this.say('Click "Reset save" again to confirm', '#ffb3b3');
    }
  }

  say(text, color) {
    this.message = { text, color, time: 2.5 };
  }

  render(ctx) {
    const { width, input } = this.game;
    MenuBackground.render(ctx, this.game, this.time, 0.55);

    DrawUtils.text(ctx, 'Upgrade Shop', width / 2, 50, { size: 72, weight: 'bold', align: 'center', color: '#ffd166' });
    DrawUtils.text(ctx, 'Permanent upgrades for every run', width / 2, 140, { size: 30, align: 'center', color: '#e8eef5' });
    ctx.drawImage(this.game.sprites.coin, width - 330, 62, 52, 52);
    DrawUtils.text(ctx, `${SaveData.data.totalCoins}`, width - 266, 66, { size: 44, weight: 'bold', color: '#ffd166' });

    for (const card of this.cards) this.renderCard(ctx, card);

    DrawUtils.button(ctx, this.backButton, 'Back', input.isPointerOver(this.backButton), 'secondary', 32);
    const resetLabel = this.resetConfirmTimer > 0 ? 'Really reset?' : 'Reset save';
    DrawUtils.button(ctx, this.resetButton, resetLabel, input.isPointerOver(this.resetButton), 'danger', 30);
    DrawUtils.button(ctx, this.startButton, 'START RUN', input.isPointerOver(this.startButton), 'primary', 44);
    DrawUtils.text(ctx, 'Enter: start  ·  Esc: back', 1590, 1018, { size: 22, align: 'center', color: '#b9c4bd' });

    if (this.message) {
      ctx.globalAlpha = Math.min(1, this.message.time / 0.4);
      DrawUtils.text(ctx, this.message.text, width / 2, 850, { size: 32, weight: 'bold', align: 'center', color: this.message.color });
      ctx.globalAlpha = 1;
    }
  }

  renderCard(ctx, card) {
    const upgrade = ShopDefinitions[card.id];
    const level = this.levelOf(card.id);
    const maxed = level >= upgrade.maxLevel;
    const cost = this.costOf(card.id);
    const affordable = SaveData.data.totalCoins >= cost;
    const hovered = this.game.input.isPointerOver(card);

    DrawUtils.roundRect(ctx, card.x, card.y, card.width, card.height, 22);
    ctx.fillStyle = 'rgba(24, 30, 46, 0.93)';
    ctx.fill();
    ctx.lineWidth = hovered ? 5 : 3;
    ctx.strokeStyle = hovered ? '#ffd166' : '#4a5878';
    ctx.stroke();

    ctx.drawImage(this.game.sprites[upgrade.icon], card.x + 26, card.y + 30, 120, 120);
    DrawUtils.text(ctx, upgrade.name, card.x + 170, card.y + 26, { size: 36, weight: 'bold' });
    DrawUtils.text(ctx, upgrade.description, card.x + 170, card.y + 76, { size: 23, color: '#c9d3e0' });

    // Level pips: filled = bought
    for (let i = 0; i < upgrade.maxLevel; i++) {
      ctx.fillStyle = i < level ? '#ffd166' : 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(card.x + 182 + i * 28, card.y + 136, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    const total = upgrade.perLevel * level;
    const current = upgrade.unit === 'percent' ? `+${Math.round(total * 100)}%` : `+${Math.round(total)}`;
    DrawUtils.text(ctx, `Level ${level} / ${upgrade.maxLevel}   ·   now ${level > 0 ? current : 'nothing'}`, card.x + 170, card.y + 162, {
      size: 22,
      color: '#9fb0c8',
    });

    const label = maxed ? 'MAX' : `Buy · ${cost}`;
    const style = maxed || !affordable ? 'disabled' : 'primary';
    DrawUtils.button(ctx, card.buyButton, label, this.game.input.isPointerOver(card.buyButton), style, 30);
  }
}
