import { Entity } from './Entity.js';
import { GameConfig } from '../config/GameConfig.js';
import { TAU } from '../core/MathUtils.js';

const BOSS = GameConfig.boss;
let nextEnemyId = 1;

export class Enemy extends Entity {
  constructor() {
    super();
    this.hitTimes = new Map(); // weaponId -> last time this enemy was hit (for orbit weapons)
  }

  /** Called when the enemy is taken from the pool. */
  reset(typeId, x, y, scaling) {
    const def = GameConfig.enemies[typeId];
    this.id = nextEnemyId++;
    this.type = typeId;
    this.def = def;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.active = true;

    this.maxHealth = Math.round(def.hp * scaling.health);
    this.health = this.maxHealth;
    this.speed = def.speed * scaling.speed;
    this.damage = Math.round(def.damage * scaling.damage);
    this.radius = def.radius;
    this.drawSize = def.drawSize;
    this.xpValue = def.xp;
    this.knockbackResist = def.knockbackResist;
    this.isBoss = !!def.isBoss;
    this.isElite = !!def.isElite;

    this.knockX = 0;
    this.knockY = 0;
    this.flashTimer = 0;
    this.animTime = Math.random() * 10;
    this.wobblePhase = Math.random() * TAU;
    this.hitTimes.clear();

    // Boss dash: chase -> windup (telegraph) -> dash -> chase
    this.dashState = 'chase';
    this.dashTimer = BOSS.dashCooldown;
    this.dashX = 0;
    this.dashY = 0;
    return this;
  }

  update(dt, game) {
    const player = game.player;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    let dirX = dx / dist;
    let dirY = dy / dist;
    let speed = this.speed;

    if (this.isBoss) {
      ({ dirX, dirY, speed } = this.updateBossDash(dt, dirX, dirY, speed, game));
    } else if (this.def.wobble) {
      // moths flutter side to side while approaching
      const wobble = Math.sin(this.animTime * 6 + this.wobblePhase) * 0.6;
      const wx = dirX - dirY * wobble;
      const wy = dirY + dirX * wobble;
      const len = Math.hypot(wx, wy) || 1;
      dirX = wx / len;
      dirY = wy / len;
    }

    this.vx = dirX * speed;
    this.vy = dirY * speed;
    this.x += (this.vx + this.knockX) * dt;
    this.y += (this.vy + this.knockY) * dt;

    const decay = Math.exp(-9 * dt);
    this.knockX *= decay;
    this.knockY *= decay;
    if (this.flashTimer > 0) this.flashTimer -= dt;
    this.animTime += dt;
  }

  updateBossDash(dt, dirX, dirY, speed, game) {
    this.dashTimer -= dt;
    if (this.dashState === 'chase' && this.dashTimer <= 0) {
      this.dashState = 'windup';
      this.dashTimer = BOSS.dashWindup;
      this.dashX = dirX;
      this.dashY = dirY;
      game.audio.play('bossRoar');
    } else if (this.dashState === 'windup') {
      speed = 0;
      if (this.dashTimer <= 0) {
        this.dashState = 'dash';
        this.dashTimer = BOSS.dashDuration;
      }
    } else if (this.dashState === 'dash') {
      dirX = this.dashX;
      dirY = this.dashY;
      speed *= BOSS.dashSpeedMult;
      if (this.dashTimer <= 0) {
        this.dashState = 'chase';
        this.dashTimer = BOSS.dashCooldown;
      }
    }
    return { dirX, dirY, speed };
  }

  applyKnockback(kx, ky) {
    const factor = 1 - this.knockbackResist;
    this.knockX += kx * factor;
    this.knockY += ky * factor;
  }

  render(ctx, game) {
    const sprites = game.sprites;
    const name = this.def.sprite;
    const frame = Math.floor(this.animTime * (this.def.wobble ? 10 : 4)) % 2;
    const flip = game.player.x < this.x;
    let x = this.x;
    let y = this.y - this.drawSize * 0.18;

    if (this.dashState === 'windup') {
      // telegraph: shake + red glow so the player can react
      x += (Math.random() - 0.5) * 8;
      ctx.globalCompositeOperation = 'lighter';
      sprites.blit(ctx, sprites.get('glow_red'), this.x, this.y, this.drawSize * 1.3);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (this.isElite || this.isBoss) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35;
      sprites.blit(ctx, sprites.get(this.isBoss ? 'glow_red' : 'glow_white'), this.x, y, this.drawSize * 1.1);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    sprites.blit(ctx, sprites.get(name, frame), x, y, this.drawSize, flip);
    if (this.flashTimer > 0) {
      // hit flash: a white silhouette on top, fading out
      // bigger enemies flash softer so a boss under constant fire stays readable
      ctx.globalAlpha = Math.min(1, this.flashTimer / 0.1) * (this.isBoss || this.isElite ? 0.4 : 0.8);
      sprites.blit(ctx, sprites.getFlash(name, frame), x, y, this.drawSize, flip);
      ctx.globalAlpha = 1;
    }
  }
}
