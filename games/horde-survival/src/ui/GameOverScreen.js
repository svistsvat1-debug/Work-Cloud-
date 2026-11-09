/**
 * The run summary, shown when the player dies. The world stays frozen behind it.
 * Play again (R / Enter / button) or go to the upgrade shop (Esc / button).
 */
class GameOverScreen {
  constructor(game) {
    this.game = game;
    this.shopButton = { x: 530, y: 930, width: 400, height: 96 };
    this.playAgainButton = { x: 990, y: 930, width: 400, height: 96 };
    this.time = 0;
  }

  open() {
    this.time = 0;
  }

  update(dt) {
    this.time += dt;
    // A short pause, so a key held while dying doesn't skip the summary.
    if (this.time < GameOverScreen.INPUT_DELAY) return;
    const input = this.game.input;
    if (input.wasPressed('restart') || input.wasPressed('confirm') || input.wasClicked(this.playAgainButton)) {
      this.game.startNewRun();
    } else if (input.wasPressed('back') || input.wasClicked(this.shopButton)) {
      this.game.openShop();
    }
  }

  render(ctx) {
    const game = this.game;
    const { width, height, input } = game;

    ctx.fillStyle = 'rgba(6, 8, 12, 0.86)';
    ctx.fillRect(0, 0, width, height);

    DrawUtils.text(ctx, 'GAME OVER', width / 2, 50, { size: 96, weight: 'bold', align: 'center', color: '#ff6464' });
    if (game.isNewBestTime && Math.floor(this.time * 3) % 2 === 0) {
      DrawUtils.text(ctx, 'NEW BEST TIME!', width / 2, 160, { size: 40, weight: 'bold', align: 'center', color: '#ffd166' });
    }

    this.renderStats(ctx);
    this.renderWeapons(ctx);

    DrawUtils.button(ctx, this.shopButton, 'Upgrade Shop', input.isPointerOver(this.shopButton), 'secondary', 36);
    DrawUtils.button(ctx, this.playAgainButton, 'Play Again', input.isPointerOver(this.playAgainButton), 'primary', 40);
    if (!input.touchMode) {
      DrawUtils.text(ctx, 'R or Enter: play again  ·  Esc: shop', width / 2, 1040, { size: 22, align: 'center', color: '#9fb0c8' });
    }
  }

  /** Left column: the numbers of the run. */
  renderStats(ctx) {
    const game = this.game;
    const left = 240;
    const right = 880;
    const rows = [
      ['Survival time', MathUtils.formatTime(game.survivalTime)],
      ['Level reached', String(game.player.level)],
      ['Enemies killed', String(game.kills)],
      ['Bosses defeated', String(game.bossesDefeated)],
      ['Coins earned', `+${game.runCoins}`],
      ['Total coins', String(SaveData.data.totalCoins)],
    ];
    this.panel(ctx, left - 40, 230, right - left + 80, 620);
    rows.forEach(([label, value], index) => {
      const y = 270 + index * 92;
      DrawUtils.text(ctx, label, left, y, { size: 36, color: '#c9d3e0' });
      DrawUtils.text(ctx, value, right, y, {
        size: 40,
        weight: 'bold',
        align: 'right',
        color: label.includes('oins') ? '#ffd166' : '#ffffff',
      });
    });
  }

  /** Right column: weapons owned and evolutions achieved. */
  renderWeapons(ctx) {
    const game = this.game;
    const left = 1040;
    this.panel(ctx, left - 40, 230, 720, 620);
    DrawUtils.text(ctx, 'Weapons', left, 254, { size: 34, weight: 'bold', color: '#ffad5c' });

    game.weapons.weapons.forEach((weapon, index) => {
      const y = 310 + index * 70;
      ctx.drawImage(game.sprites[weapon.definition.icon], left, y, 58, 58);
      DrawUtils.text(ctx, weapon.name, left + 76, y + 10, { size: 30, color: weapon.isEvolved ? '#ff9cf0' : '#ffffff' });
      const badge = weapon.isEvolved ? 'EVOLVED' : weapon.isMaxLevel() ? 'MAX' : `Lv ${weapon.level}`;
      DrawUtils.text(ctx, badge, left + 620, y + 12, {
        size: 26,
        weight: 'bold',
        align: 'right',
        color: weapon.isEvolved ? '#ff9cf0' : '#ffd166',
      });
    });

    const evolutions = game.weaponsEvolved.length > 0 ? game.weaponsEvolved.join(', ') : 'none yet';
    ctx.font = `26px ${GameConfig.ui.font}`;
    const lines = DrawUtils.wrapText(ctx, `Evolutions: ${evolutions}`, 640).slice(0, 2);
    lines.forEach((line, index) => {
      DrawUtils.text(ctx, line, left, 768 + index * 34, { size: 26, color: '#ff9cf0' });
    });
  }

  panel(ctx, x, y, width, height) {
    DrawUtils.roundRect(ctx, x, y, width, height, 22);
    ctx.fillStyle = 'rgba(24, 30, 46, 0.9)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3c4762';
    ctx.stroke();
  }
}

GameOverScreen.INPUT_DELAY = 0.6;
