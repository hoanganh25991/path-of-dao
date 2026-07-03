import Phaser from 'phaser';
import { StatSheet } from '@/progression/StatSheet';
import { moveSpeedPxPerSec } from '@/progression/DamageCalculator';
import type { BaseStats } from '@/progression/types';
import type { DamageResult } from '@/progression/types';
import { EntityBase } from '@/combat/entities/EntityBase';
import { createDecider } from '@/combat/ai/AIBrain';
import type { AIDecider, AIPlayerState } from '@/combat/ai/AITypes';
import type { EnemyConfig } from '@/combat/enemies/EnemyConfig';
import type { HurtboxEntity, CombatTeam } from '@/combat/combat/Hurtbox';
import type { Hitbox } from '@/combat/combat/Hitbox';
import { startKnockback, tickKnockback, type KnockbackState } from '@/combat/combat/Knockback';
import { clearHitFlash } from '@/combat/combat/HitFlash';
import {
  applyStickyManSprite,
  configureStickyManBody,
  enemyAnimKeys,
} from '@/combat/art/stickyManAssets';
import { DISPLAY_SCALE } from '@/combat/art/stickyManPalette';

export const TELEGRAPH_MS = 300;
export const STRIKE_MS = 100;
export const DEATH_ANIM_MS = 400;
const HP_BAR_WIDTH = 26;
const HP_BAR_HEIGHT = 3;

type AttackPhase = 'none' | 'telegraph' | 'strike';

export interface EnemyCallbacks {
  /** Attack lands (strike frame). Owner resolves damage/projectiles. */
  onStrike(enemy: Enemy): void;
  /** HP reached 0 — death anim already started. */
  onDeath(enemy: Enemy): void;
  /** Death anim finished — owner releases the enemy to the pool. */
  onDeathAnimComplete(enemy: Enemy): void;
}

function toBaseStats(config: EnemyConfig): BaseStats {
  return {
    level: 1,
    hpMax: config.stats.hpMax,
    manaMax: 10,
    atk: config.stats.atk,
    def: config.stats.def,
    crit: config.stats.crit,
    critDmg: config.stats.critDmg,
    speed: Math.max(config.stats.speed, 1),
    spirit: 0,
  };
}

/** Poolable enemy entity: AI-driven movement + telegraphed attacks. */
export class Enemy extends EntityBase implements HurtboxEntity {
  readonly team: CombatTeam = 'enemy';
  readonly config: EnemyConfig;

  alive = false;
  /** Death anim in progress — ignore damage/AI but keep updating. */
  dying = false;
  spawnX = 0;
  spawnY = 0;

  private brain: AIDecider;
  private cooldownMs = 0;
  private attackPhase: AttackPhase = 'none';
  private attackPhaseMs = 0;
  private deathMs = 0;
  private knockback: KnockbackState | null = null;
  private animKeys!: ReturnType<typeof enemyAnimKeys>;
  private readonly hpBarBg: Phaser.GameObjects.Rectangle;
  private readonly hpBarFill: Phaser.GameObjects.Rectangle;

  constructor(
    scene: Phaser.Scene,
    config: EnemyConfig,
    private readonly callbacks: EnemyCallbacks,
  ) {
    super(scene, -1000, -1000, config.spriteKey, new StatSheet(toBaseStats(config)));
    this.config = config;
    this.animKeys = enemyAnimKeys(config.spriteKey);
    this.brain = createDecider(config.archetype);
    this.sprite.setDepth(9);
    applyStickyManSprite(this.sprite);

    this.hpBarBg = scene.add
      .rectangle(0, 0, HP_BAR_WIDTH, HP_BAR_HEIGHT, 0x000000, 0.6)
      .setDepth(21)
      .setVisible(false);
    this.hpBarFill = scene.add
      .rectangle(0, 0, HP_BAR_WIDTH, HP_BAR_HEIGHT, 0xd94a3a)
      .setOrigin(0, 0.5)
      .setDepth(22)
      .setVisible(false);

    this.deactivate();
  }

  get invulnerable(): boolean {
    return !this.alive || this.dying;
  }

  get isBoss(): boolean {
    return !!this.config.bossClearId;
  }

  getDefenderStats(): BaseStats {
    return this.stats.resolved;
  }

  /** Reset + activate at a position (pool acquire). */
  spawnAt(x: number, y: number): void {
    this.spawnX = x;
    this.spawnY = y;
    this.alive = true;
    this.dying = false;
    this.cooldownMs = 0;
    this.attackPhase = 'none';
    this.attackPhaseMs = 0;
    this.deathMs = 0;
    this.knockback = null;
    this.brain = createDecider(this.config.archetype);
    this.stats.refill();

    this.sprite.setPosition(x, y);
    this.sprite.setActive(true).setVisible(true).setAlpha(1).setScale(DISPLAY_SCALE);
    clearHitFlash(this.sprite);
    this.sprite.clearTint();
    this.body.enable = true;
    this.body.reset(x, y);
    this.configureBody();

    this.hpBarBg.setVisible(true);
    this.hpBarFill.setVisible(true).setScale(1, 1);
    this.updateHpBar();
    this.sprite.play(this.animKeys.idle);
  }

  /** Hide + disable (pool release). Does not destroy the GameObject. */
  deactivate(): void {
    this.alive = false;
    this.dying = false;
    this.knockback = null;
    clearHitFlash(this.sprite);
    this.sprite.setActive(false).setVisible(false);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.enable = false;
      body.stop();
    }
    this.hpBarBg.setVisible(false);
    this.hpBarFill.setVisible(false);
  }

  update(dtMs: number, player: AIPlayerState): void {
    if (this.dying) {
      this.deathMs += dtMs;
      const t = Math.min(1, this.deathMs / DEATH_ANIM_MS);
      this.sprite.setAlpha(1 - t).setScale(1 + t * 0.2, 1 - t * 0.6);
      if (this.deathMs >= DEATH_ANIM_MS) {
        this.callbacks.onDeathAnimComplete(this);
      }
      return;
    }
    if (!this.alive) return;

    this.cooldownMs = Math.max(0, this.cooldownMs - dtMs);

    if (this.knockback) {
      this.body.setVelocity(this.knockback.vx, this.knockback.vy);
      this.knockback = tickKnockback(this.knockback, dtMs);
      this.trackHpBar();
      return;
    }

    if (this.attackPhase !== 'none') {
      this.updateAttackPhase(dtMs);
      this.trackHpBar();
      return;
    }

    const decision = this.brain.decide(
      {
        x: this.x,
        y: this.y,
        spawnX: this.spawnX,
        spawnY: this.spawnY,
        speedPxPerSec: moveSpeedPxPerSec(this.stats.resolved.speed),
        aggroRange: this.config.aggroRange,
        attackRange: this.config.attackRange,
        cooldownReady: this.cooldownMs <= 0,
      },
      player,
      dtMs,
    );

    if (decision.attack) {
      this.beginAttack();
    } else {
      this.body.setVelocity(decision.vx, decision.vy);
      const moving = Math.abs(decision.vx) > 1 || Math.abs(decision.vy) > 1;
      this.updateLocomotionAnim(moving);
      if (Math.abs(decision.vx) > 1) {
        this.facing = decision.vx > 0 ? 1 : -1;
        this.sprite.setFlipX(this.facing < 0);
      }
    }

    this.trackHpBar();
  }

  receiveHit(result: DamageResult, hitbox: Hitbox): void {
    if (this.invulnerable) return;

    const lost = this.stats.applyDamage(result.final);
    if (lost <= 0) return;

    if (hitbox.pullForce && hitbox.pullForce > 0) {
      this.knockback = startKnockback(this.x, this.y, hitbox.shape.x, hitbox.shape.y, hitbox.pullForce);
      this.attackPhase = 'none';
    } else if (hitbox.knockback && hitbox.knockback > 0) {
      this.knockback = startKnockback(hitbox.shape.x, hitbox.shape.y, this.x, this.y, hitbox.knockback);
      this.attackPhase = 'none';
    }

    this.updateHpBar();

    if (this.stats.isDead) {
      this.startDeath();
    }
  }

  get attackCooldownRemainingMs(): number {
    return this.cooldownMs;
  }

  override destroy(): void {
    clearHitFlash(this.sprite);
    this.hpBarBg.destroy();
    this.hpBarFill.destroy();
    super.destroy();
  }

  private beginAttack(): void {
    this.attackPhase = 'telegraph';
    this.attackPhaseMs = 0;
    this.cooldownMs = this.config.attackCooldownMs;
    this.body.setVelocity(0, 0);
    this.sprite.setTint(0xff5a4a);
    if (this.animKeys.attack) {
      this.sprite.play(this.animKeys.attack);
    }
  }

  private updateAttackPhase(dtMs: number): void {
    this.attackPhaseMs += dtMs;

    if (this.attackPhase === 'telegraph' && this.attackPhaseMs >= TELEGRAPH_MS) {
      this.attackPhase = 'strike';
      this.attackPhaseMs = 0;
      this.sprite.clearTint();
      this.callbacks.onStrike(this);
    } else if (this.attackPhase === 'strike' && this.attackPhaseMs >= STRIKE_MS) {
      this.attackPhase = 'none';
      this.attackPhaseMs = 0;
    }
  }

  private startDeath(): void {
    this.alive = false;
    this.dying = true;
    this.deathMs = 0;
    this.knockback = null;
    this.attackPhase = 'none';
    this.body.enable = false;
    this.body.stop();
    clearHitFlash(this.sprite);
    this.sprite.clearTint();
    this.hpBarBg.setVisible(false);
    this.hpBarFill.setVisible(false);
    this.callbacks.onDeath(this);
  }

  private updateHpBar(): void {
    const { hp, hpMax } = this.stats.runtime;
    this.hpBarFill.setScale(Math.max(0, hp / hpMax), 1);
  }

  private trackHpBar(): void {
    const y = this.y - this.sprite.displayHeight - 4;
    this.hpBarBg.setPosition(this.x, y);
    this.hpBarFill.setPosition(this.x - HP_BAR_WIDTH / 2, y);
  }

  private configureBody(): void {
    configureStickyManBody(this.sprite);
  }

  private updateLocomotionAnim(moving: boolean): void {
    const key = moving ? this.animKeys.walk : this.animKeys.idle;
    if (this.sprite.anims.currentAnim?.key !== key) {
      this.sprite.play(key);
    }
  }
}
