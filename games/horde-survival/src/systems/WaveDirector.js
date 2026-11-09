/**
 * WaveDirector decides WHAT spawns and WHEN, based on the survival timer:
 *   - the current wave (WaveDefinitions) sets the enemy mix and spawn rate,
 *   - enemies get more health and speed every minute (GameConfig.difficulty),
 *   - elites arrive on their own timer (GameConfig.elites),
 *   - spawning waits when there are already too many enemies.
 */
class WaveDirector {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.waveIndex = -1;
    this.spawnBudget = 0; // grows every frame; each enemy spawned spends 1
    this.nextEliteTime = GameConfig.elites.firstAt;
  }

  get currentWave() {
    return WaveDefinitions[Math.max(0, this.waveIndex)];
  }

  get waveNumber() {
    return this.waveIndex + 1;
  }

  update(dt) {
    const time = this.game.survivalTime;
    this.updateWave(time);
    this.spawnRegularEnemies(dt, time);
    this.spawnElite(time);
  }

  /** Finds the wave for the current time and announces it when it changes. */
  updateWave(time) {
    let index = 0;
    WaveDefinitions.forEach((wave, i) => {
      if (time >= wave.start) index = i;
    });
    if (index === this.waveIndex) return;
    this.waveIndex = index;
    const wave = this.currentWave;
    this.game.ui.showBanner(`Wave ${index + 1}: ${wave.name}`, wave.message);
  }

  /** Enemies per second right now. Keeps growing after the last wave. */
  spawnRate(time) {
    const config = GameConfig.difficulty;
    const wave = this.currentWave;
    let rate = wave.spawnsPerSecond;
    if (this.waveIndex === WaveDefinitions.length - 1) {
      rate += ((time - wave.start) / 60) * config.extraSpawnsPerMinute;
    }
    return Math.min(rate, config.maxSpawnsPerSecond);
  }

  /** Health and speed multipliers for enemies spawned right now. */
  scaling(time) {
    const config = GameConfig.difficulty;
    const minutes = time / 60;
    return {
      health: 1 + config.healthGrowthPerMinute * minutes,
      speed: Math.min(config.maxSpeedMultiplier, 1 + config.speedGrowthPerMinute * minutes),
    };
  }

  spawnRegularEnemies(dt, time) {
    this.spawnBudget += this.spawnRate(time) * dt;
    while (this.spawnBudget >= 1) {
      if (this.game.enemies.length >= GameConfig.spawn.maxEnemies) {
        // Too many enemies: wait (but don't save up a huge burst for later).
        this.spawnBudget = Math.min(this.spawnBudget, 1);
        return;
      }
      const type = this.pickEnemyType();
      const [min, max] = GameConfig.enemies[type].group;
      const groupSize = MathUtils.randomInt(min, max);
      this.game.spawner.spawnGroup(type, groupSize, this.scaling(time));
      this.spawnBudget -= groupSize; // may go below 0: the next spawn simply waits longer
    }
  }

  pickEnemyType() {
    const weights = this.currentWave.weights;
    return MathUtils.pickWeighted(Object.keys(weights), (type) => weights[type]);
  }

  spawnElite(time) {
    if (time < this.nextEliteTime) return;
    const config = GameConfig.elites;
    this.game.spawner.spawnGroup('elite', 1, this.scaling(time));
    this.game.ui.showBanner('An Elite approaches!', 'A strong enemy with a big reward', '#ff7a7a');
    const interval = Math.max(config.minInterval, config.interval - (time / 60) * config.intervalDecreasePerMinute);
    this.nextEliteTime = time + interval;
  }
}
