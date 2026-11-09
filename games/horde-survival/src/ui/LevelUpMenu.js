/**
 * The level-up menu: the action pauses and the player picks one of 3 cards
 * by clicking it or pressing 1, 2 or 3.
 */
class LevelUpMenu {
  constructor(game) {
    this.game = game;
    this.choices = [];
    this.cards = [];
    this.openTime = 0;
  }

  open(choices) {
    this.choices = choices;
    this.cards = this.layoutCards(choices.length);
    this.openTime = 0;
  }

  /** Card rectangles, centered on screen. */
  layoutCards(count) {
    const width = 440;
    const height = 500;
    const gap = 60;
    const totalWidth = count * width + (count - 1) * gap;
    const startX = (GameConfig.width - totalWidth) / 2;
    return Array.from({ length: count }, (_, index) => ({
      x: startX + index * (width + gap),
      y: 340,
      width,
      height,
    }));
  }

  update(dt) {
    this.openTime += dt;
    // A short delay prevents picking a card by accident with a key that was already pressed.
    if (this.openTime < GameConfig.levelUp.inputDelay) return;

    const input = this.game.input;
    for (let i = 0; i < this.choices.length; i++) {
      if (input.wasPressed(`choice${i + 1}`) || input.wasClicked(this.cards[i])) {
        this.game.chooseUpgrade(this.choices[i]);
        return;
      }
    }
  }

  render(ctx) {
    const { width, height, player } = this.game;
    const appear = Math.min(1, this.openTime / 0.2); // quick fade-in

    ctx.fillStyle = `rgba(5, 8, 14, ${0.65 * appear})`;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = appear;

    DrawUtils.text(ctx, 'LEVEL UP!', width / 2, 130, {
      size: 96,
      weight: 'bold',
      align: 'center',
      color: '#ffd166',
    });
    const how = this.game.input.touchMode ? 'tap an upgrade' : 'choose an upgrade: press 1, 2, 3 or click';
    DrawUtils.text(ctx, `Level ${player.level - player.pendingLevelUps + 1}  ·  ${how}`, width / 2, 250, {
      size: 32,
      align: 'center',
      color: '#d7e0ea',
    });

    this.choices.forEach((choice, index) => this.renderCard(ctx, choice, this.cards[index], index));
    ctx.globalAlpha = 1;
  }

  renderCard(ctx, choice, card, index) {
    const hovered = this.game.input.isPointerOver(card);
    const centerX = card.x + card.width / 2;

    // Panel
    DrawUtils.roundRect(ctx, card.x, card.y, card.width, card.height, 24);
    ctx.fillStyle = hovered ? '#28324a' : '#1b2233';
    ctx.fill();
    ctx.lineWidth = hovered ? 6 : 4;
    ctx.strokeStyle = hovered ? '#ffd166' : '#4a5878';
    ctx.stroke();

    // Key number badge (top-left)
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(card.x + 42, card.y + 42, 26, 0, Math.PI * 2);
    ctx.fill();
    DrawUtils.text(ctx, String(index + 1), card.x + 42, card.y + 24, {
      size: 32,
      weight: 'bold',
      align: 'center',
      color: '#1b2233',
    });

    // Category tag (WEAPON / UPGRADE) in the top-right corner
    const tagColor = LevelUpMenu.TAG_COLORS[choice.tag] || '#c9d3e0';
    DrawUtils.text(ctx, choice.tag, card.x + card.width - 26, card.y + 26, {
      size: 22,
      weight: 'bold',
      align: 'right',
      color: tagColor,
    });

    // Icon, name, level
    ctx.drawImage(this.game.sprites[choice.icon], centerX - 64, card.y + 36, 128, 128);
    DrawUtils.text(ctx, choice.name, centerX, card.y + 182, { size: 38, weight: 'bold', align: 'center' });
    DrawUtils.text(ctx, choice.levelText, centerX, card.y + 234, {
      size: 30,
      weight: 'bold',
      align: 'center',
      color: choice.isNew ? '#ffd166' : '#8fd3ff',
    });

    // Description and effect, wrapped to the card width
    this.drawWrapped(ctx, choice.description, centerX, card.y + 290, card.width - 60, 28, 'normal', '#c9d3e0', 3);
    this.drawWrapped(ctx, choice.effectText, centerX, card.y + card.height - 100, card.width - 50, 32, 'bold', '#7ee08a', 2);
  }

  drawWrapped(ctx, text, centerX, y, maxWidth, size, weight, color, maxLines) {
    ctx.font = `${weight} ${size}px ${GameConfig.ui.font}`;
    const lines = DrawUtils.wrapText(ctx, text, maxWidth).slice(0, maxLines);
    lines.forEach((line, index) => {
      DrawUtils.text(ctx, line, centerX, y + index * (size + 8), { size, weight, align: 'center', color });
    });
  }
}

/** Color of the category tag on each card. */
LevelUpMenu.TAG_COLORS = {
  WEAPON: '#ffad5c',
  PASSIVE: '#8fd3ff',
  REWARD: '#7ee08a',
};
