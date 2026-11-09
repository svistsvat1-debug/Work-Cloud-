// The Game owns all entities and systems and runs the state machine:
// title -> shop -> playing <-> (levelup | chest | paused) -> gameover -> shop / restart / title

import { GameConfig } from '../config/GameConfig.js';
import { STARTING_WEAPON, WEAPONS, EVOLUTIONS, getBaseWeaponIds } from '../config/Weapons.js';
import { META_UPGRADES, getMetaCost } from '../config/MetaUpgrades.js';
import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { Pool, removeInactive, releaseAll } from './Pool.js';
import { SaveData } from './Storage.js';
import { emptyModifiers, addModifiers } from './StatModifiers.js';
import { circlesOverlap, lerp } from './MathUtils.js';
import { SpriteLibrary } from '../assets/ProceduralSprites.js';
import { MenuBackground } from '../assets/MenuBackground.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import { XPGem } from '../entities/XPGem.js';
import { Coin } from '../entities/Coin.js';
import { Chest } from '../entities/Chest.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { EffectsSystem } from '../systems/EffectsSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import { ChestSystem } from '../systems/ChestSystem.js';
import { Spawner } from '../systems/Spawner.js';
import { WorldMap } from '../systems/WorldMap.js';
import { UISystem } from '../systems/UISystem.js';
import { Renderer } from '../systems/Renderer.js';

const GEM_PARTICLE_COLORS = { blue: '#7fc4ff', green: '#7dff9a', red: '#ff7a8a' };

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = GameConfig.width;
    this.height = GameConfig.height;
    canvas.width = this.width;
    canvas.height = this.height;
    this.debugMode = new URLSearchParams(window.location.search).has('debug');

    this.save = SaveData.load();

    this.input = new Input(canvas, this.width, this.height);
    this.audio = new AudioSystem(this.save.muted);
    this.input.onFirstInteraction = () => this.audio.unlock();
    this.input.onBlur = () => this.autoPause();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.autoPause();
    });

    this.camera = new Camera(this.width, this.height, GameConfig.effects.maxShake);
    this.sprites = new SpriteLibrary();
    this.world = new WorldMap(this.sprites);
    this.menuBackground = new MenuBackground();

    this.effects = new EffectsSystem(this);
    this.collision = new CollisionSystem(this);
    this.combat = new CombatSystem(this);
    this.weapons = new WeaponSystem(this);
    this.upgrades = new UpgradeSystem(this);
    this.chests = new ChestSystem(this);
    this.spawner = new Spawner(this);
    this.ui = new UISystem(this);
    this.renderer = new Renderer(this);

    this.player = new Player();
    this.enemies = [];
    this.projectiles = [];
    this.gems = [];
    this.coins = [];
    this.chestsOnGround = [];
    this.pools = {
      enemies: new Pool(() => new Enemy()),
      projectiles: new Pool(() => new Projectile()),
      gems: new Pool(() => new XPGem()),
      coins: new Pool(() => new Coin()),
    };

    this.state = 'title';
    this.time = 0; // real time, used for animations
    this.frameDt = 0;
    this.fps = 60;
    this.run = this.createRunStats(0);
    this.levelUpChoices = [];
    this.levelUpTimer = 0;
    this.chestState = null;
  }

  createRunStats(startCoins) {
    return { time: 0, kills: 0, bossesDefeated: 0, coins: startCoins, evolutions: [], pendingLevelUps: 0, newBest: false, ended: false };
  }

  /** Sum of all permanent shop upgrades. */
  metaModifiers() {
    const mods = emptyModifiers();
    for (const up of META_UPGRADES) addModifiers(mods, up.perLevel, this.save.meta[up.id] || 0);
    return mods;
  }

  // ---------- run lifecycle ----------

  startRun() {
    releaseAll(this.enemies, this.pools.enemies);
    releaseAll(this.projectiles, this.pools.projectiles);
    releaseAll(this.gems, this.pools.gems);
    releaseAll(this.coins, this.pools.coins);
    this.chestsOnGround.length = 0;

    const meta = this.metaModifiers();
    this.player.reset(meta);
    this.player.weapons.push(this.weapons.createWeapon(STARTING_WEAPON));
    this.run = this.createRunStats(meta.startCoins);

    this.weapons.clear();
    this.effects.clear();
    this.spawner.reset();
    this.camera.reset();
    this.ui.banners.length = 0;
    this.chestState = null;
    this.state = 'playing';
  }

  endRun() {
    if (this.run.ended) return;
    this.run.ended = true;
    this.state = 'gameover';
    this.save.totalCoins += this.run.coins;
    if (this.run.time > this.save.bestTime) {
      this.save.bestTime = this.run.time;
      this.run.newBest = true;
    }
    this.save.runs += 1;
    SaveData.save(this.save);
    this.audio.play('gameOver');
  }

  autoPause() {
    if (this.state === 'playing') this.state = 'paused';
  }

  toggleMute() {
    this.save.muted = !this.save.muted;
    this.audio.setMuted(this.save.muted);
    SaveData.save(this.save);
  }

  // ---------- spawning helpers (used by systems) ----------

  spawnEnemy(type, x, y, scaling) {
    const enemy = this.pools.enemies.get().reset(type, x, y, scaling);
    this.enemies.push(enemy);
    return enemy;
  }

  spawnProjectile(x, y, vx, vy, options) {
    this.projectiles.push(this.pools.projectiles.get().reset(x, y, vx, vy, options));
  }

  dropGem(x, y, value) {
    const cfg = GameConfig.gems;
    if (this.gems.length >= cfg.maxCount) {
      // Too many gems: merge this value into the closest existing gem instead.
      let best = this.gems[0];
      let bestDist = Infinity;
      for (const gem of this.gems) {
        const d = (gem.x - x) ** 2 + (gem.y - y) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = gem;
        }
      }
      best.setValue(best.value + value);
      return;
    }
    this.gems.push(this.pools.gems.get().reset(x, y, value));
  }

  dropCoin(x, y, value) {
    this.coins.push(this.pools.coins.get().reset(x, y, value));
  }

  dropChest(x, y) {
    this.chestsOnGround.push(new Chest(x, y));
  }

  // ---------- main update ----------

  /** Called once per animation frame by main.js. */
  frame(rawDt) {
    const dt = Math.min(rawDt, GameConfig.maxDeltaTime);
    this.frameDt = dt;
    if (rawDt > 0) this.fps = lerp(this.fps, 1 / rawDt, 0.05);
    this.update(dt);
    this.renderer.render();
  }

  update(dt) {
    this.time += dt;
    const input = this.input;
    const clicked = this.ui.getClickedButton();

    if (input.wasPressed('KeyM') || clicked === 'mute') this.toggleMute();
    if (input.wasPressed('F3')) {
      this.save.showDebug = !this.save.showDebug;
      SaveData.save(this.save);
    }
    if (clicked && clicked !== 'mute') this.audio.play('click');

    switch (this.state) {
      case 'title':
        if (input.wasPressed('Enter', 'Space') || clicked === 'start') this.state = 'shop';
        break;
      case 'shop':
        this.updateShop(clicked);
        break;
      case 'playing':
        if (input.wasPressed('Escape', 'KeyP') || clicked === 'pause') {
          this.state = 'paused';
          break;
        }
        if (this.debugMode) this.updateDebugKeys();
        this.updatePlaying(dt);
        break;
      case 'paused':
        if (input.wasPressed('Escape', 'KeyP') || clicked === 'resume') this.state = 'playing';
        else if (input.wasPressed('KeyQ') || clicked === 'giveup') this.endRun();
        break;
      case 'levelup':
        this.updateLevelUp(dt, clicked);
        break;
      case 'chest':
        this.updateChest(dt, clicked);
        break;
      case 'gameover':
        if (input.wasPressed('KeyR') || clicked === 'restart') this.startRun();
        else if (input.wasPressed('KeyS') || clicked === 'shop') this.state = 'shop';
        else if (input.wasPressed('KeyT', 'Escape') || clicked === 'title') this.state = 'title';
        break;
      default:
        break;
    }

    this.ui.update(dt);
    this.camera.update(dt);
    input.endFrame();
  }

  updatePlaying(dt) {
    const run = this.run;
    run.time += dt;

    this.player.update(dt, this);
    this.camera.follow(this.player);
    this.spawner.update(dt);

    for (const enemy of this.enemies) enemy.update(dt, this);
    this.collision.rebuild(this.enemies);
    this.collision.separateEnemies(this.enemies);

    this.weapons.update(dt);
    for (const projectile of this.projectiles) projectile.update(dt, this);
    this.collision.projectilesVsEnemies(this.projectiles);
    this.collision.enemiesVsPlayer();
    if (this.state !== 'playing') return; // the player just died

    this.updatePickups(dt);
    this.effects.update(dt);

    removeInactive(this.enemies, this.pools.enemies);
    removeInactive(this.projectiles, this.pools.projectiles);
    removeInactive(this.gems, this.pools.gems);
    removeInactive(this.coins, this.pools.coins);
    removeInactive(this.chestsOnGround, null);

    if (this.state === 'playing' && run.pendingLevelUps > 0) this.openLevelUp();
  }

  updatePickups(dt) {
    const player = this.player;
    for (const gem of this.gems) {
      if (!gem.active || !gem.update(dt, this)) continue;
      gem.active = false;
      this.run.pendingLevelUps += player.addXP(gem.value);
      this.audio.play('xp');
      this.effects.burst(gem.x, gem.y, GEM_PARTICLE_COLORS[gem.tier], 3, 120, 5, 0.3);
    }
    for (const coin of this.coins) {
      if (!coin.active || !coin.update(dt, this)) continue;
      coin.active = false;
      this.run.coins += coin.value;
      this.audio.play('coin');
      this.effects.text(coin.x, coin.y - 30, `+${coin.value}`, '#ffd76a', 20);
    }
    for (const chest of this.chestsOnGround) {
      chest.update(dt);
      if (chest.active && this.state === 'playing' && circlesOverlap(player.x, player.y, player.radius, chest.x, chest.y, chest.radius)) {
        chest.active = false;
        this.openChest();
      }
    }
  }

  // ---------- level up ----------

  openLevelUp() {
    this.levelUpChoices = this.upgrades.buildChoices(3);
    this.levelUpTimer = 0;
    this.state = 'levelup';
    this.audio.play('levelUp');
  }

  updateLevelUp(dt, clicked) {
    this.levelUpTimer += dt;
    if (this.levelUpTimer < 0.25) return; // avoid accidental picks
    const keys = [['Digit1', 'Numpad1'], ['Digit2', 'Numpad2'], ['Digit3', 'Numpad3']];
    let index = keys.findIndex((codes) => this.input.wasPressed(...codes));
    if (clicked && clicked.startsWith('choice:')) index = Number(clicked.split(':')[1]);
    if (index < 0 || index >= this.levelUpChoices.length) return;

    this.upgrades.apply(this.levelUpChoices[index]);
    this.effects.burst(this.player.x, this.player.y - 20, '#ffd76a', 16, 300, 7, 0.6);
    this.run.pendingLevelUps -= 1;
    if (this.run.pendingLevelUps > 0) this.openLevelUp();
    else this.state = 'playing';
  }

  // ---------- chests ----------

  openChest() {
    this.chestState = this.chests.open();
    this.state = 'chest';
    this.audio.play('chestOpen');
    this.camera.shake(GameConfig.effects.shake.chestOpen, 0.5);
  }

  updateChest(dt, clicked) {
    const st = this.chestState;
    const reveal = GameConfig.chest.revealTime;
    st.timer += dt;
    if (!st.revealed && st.timer >= reveal) {
      st.revealed = true;
      if (st.isEvolution) {
        this.audio.play('evolution');
        this.camera.shake(GameConfig.effects.shake.evolution, 0.7);
      } else {
        this.audio.play('chestReveal');
      }
    }
    const confirm = this.input.wasPressed('Space', 'Enter') || (this.input.mouse.clicked && clicked !== 'mute');
    if (!confirm) return;
    if (!st.revealed) st.timer = reveal; // skip the animation
    else if (st.timer > reveal + 0.3) {
      this.chestState = null;
      this.state = 'playing';
      if (st.isEvolution) this.effects.ring(this.player.x, this.player.y, 360, 'rgba(255,230,140,0.8)', 0.8);
    }
  }

  // ---------- shop ----------

  updateShop(clicked) {
    const input = this.input;
    if (input.wasPressed('Enter') || clicked === 'begin') {
      this.startRun();
      return;
    }
    if (input.wasPressed('Escape') || clicked === 'back') {
      this.state = 'title';
      return;
    }
    if (clicked === 'reset') {
      if (this.time - this.ui.resetConfirmTime < 3) {
        this.save = SaveData.reset(this.save);
        this.ui.resetConfirmTime = -10;
      } else {
        this.ui.resetConfirmTime = this.time;
      }
      return;
    }
    if (clicked && clicked.startsWith('buy:')) this.buyMetaUpgrade(clicked.slice(4));
  }

  buyMetaUpgrade(id) {
    const up = META_UPGRADES.find((u) => u.id === id);
    const level = this.save.meta[id] || 0;
    if (!up || level >= up.maxLevel) return;
    const cost = getMetaCost(up, level);
    if (this.save.totalCoins < cost) return;
    this.save.totalCoins -= cost;
    this.save.meta[id] = level + 1;
    SaveData.save(this.save);
    this.audio.play('coin');
  }

  // ---------- debug (open the game with ?debug in the URL) ----------

  updateDebugKeys() {
    const input = this.input;
    const player = this.player;
    if (input.wasPressed('KeyB')) this.spawner.spawnBoss();
    if (input.wasPressed('KeyC')) this.dropChest(player.x + 140, player.y);
    if (input.wasPressed('KeyL')) this.run.pendingLevelUps += player.addXP((player.xpToNext - player.xp) / player.stats.xpMult + 0.01);
    if (input.wasPressed('KeyT')) this.run.time += 60;
    if (input.wasPressed('KeyH')) player.heal(9999);
    if (input.wasPressed('KeyX')) {
      // own every base weapon at max level + every evolution item: next chest evolves
      for (const id of getBaseWeaponIds()) {
        if (!this.upgrades.ownsWeaponFamily(id) && player.weapons.length < GameConfig.player.maxWeapons) {
          player.weapons.push(this.weapons.createWeapon(id));
        }
      }
      for (const weapon of player.weapons) {
        if (weapon.def.evolution) continue;
        weapon.level = WEAPONS[weapon.id].maxLevel;
        this.weapons.refreshStats(weapon);
      }
      for (const evo of EVOLUTIONS) {
        if (!player.getPassive(evo.passive) && player.passives.length < GameConfig.player.maxPassives) {
          player.passives.push({ id: evo.passive, level: 1 });
        }
      }
      player.recalculateStats();
    }
  }
}
