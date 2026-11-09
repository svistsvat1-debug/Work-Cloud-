/**
 * The title screen: game name, best time, total coins and a Play button.
 * Play (or Enter / Space) opens the upgrade shop, where the run starts.
 */
class StartScreen {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.playButton = { x: 760, y: 790, width: 400, height: 104 };
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.wasPressed('confirm') || input.wasClicked(this.playButton)) this.game.openShop();
  }

  render(ctx) {
    const { width } = this.game;
    const centerX = width / 2;
    MenuBackground.render(ctx, this.game, this.time);

    DrawUtils.text(ctx, GameConfig.ui.title, centerX, 70, {
      size: 120,
      weight: 'bold',
      align: 'center',
      color: '#ffd166',
    });
    DrawUtils.text(ctx, GameConfig.ui.tagline, centerX, 214, { size: 38, align: 'center', color: '#fff3e0' });

    DrawUtils.button(ctx, this.playButton, 'PLAY', this.game.input.isPointerOver(this.playButton), 'primary', 48);

    const save = SaveData.data;
    DrawUtils.text(ctx, `Coins: ${save.totalCoins}   ·   Best time: ${MathUtils.formatTime(save.bestTime)}`, centerX, 920, {
      size: 32,
      align: 'center',
      color: '#ffd166',
    });
    DrawUtils.text(ctx, 'Move with WASD or the arrow keys · weapons attack on their own · Enter to play · M to mute', centerX, 980, {
      size: 26,
      align: 'center',
      color: '#e3e8ee',
    });
  }
}
