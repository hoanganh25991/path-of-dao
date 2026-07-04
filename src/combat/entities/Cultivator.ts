import Phaser from 'phaser';
import { StatSheet } from '@/progression/StatSheet';
import { moveSpeedPxPerSec } from '@/progression/DamageCalculator';
import type { BaseStats } from '@/progression/types';
import type { DamageResult } from '@/progression/types';
import { EntityBase } from '@/combat/entities/EntityBase';
import { createDecider } from '@/combat/ai/AIBrain';
import type { AIDecider, AIPlayerState } from '@/combat/ai/AITypes';
import type { CultivatorConfig } from '@/combat/cultivators/CultivatorConfig';
import type { HurtboxEntity, CombatTeam } from '@/combat/combat/Hurtbox';
import type { Hitbox } from '@/combat/combat/Hitbox';
import { startKnockback, tickKnockback, type KnockbackState } from '@/combat/combat/Knockback';
import { clearHitFlash } from '@/combat/combat/HitFlash';
import { computeHealthRegenPerSec } from '@/combat/combat/HealthRegen';
import {
  applyStickyManSprite,
  configureStickyManBody,
  cultivatorAnimKeys,
} from '@/combat/art/stickyManAssets';
import { BossPhaseTracker } from '@/combat/ai/BossPhaseTracker';
import { PatrolAI } from '@/combat/ai/PatrolAI';
import { DISPLAY_SCALE } from '@/combat/art/stickyManPalette';

export const TELEGRAPH_MS = 300;
export const STRIKE_MS = 100;
/** Brief stagger after HP hits zero before recovery timer runs. */
export const DEFEAT_STAGGER_MS = 450;
export const DEFAULT_RECOVERY_MS = 6000;
const HP_BAR_WIDTH = 26;
const HP_BAR_HEIGHT = 3;

type AttackPhase = 'none' | 'telegraph' | 'strike';

export interface CultivatorCallbacks {
  /** Attack lands (strike frame). Owner resolves damage/projectiles. */
  onStrike(cultivator: Cultivator): void;
  /** HP reached 0 — cultivator lost the exchange (non-lethal). */
  onDefeated(cultivator: Cultivator): void;
  /** Defeat pose finished — owner may release, queue refill, or schedule recovery. */
  onDefeatHoldComplete(cultivator: Cultivator): void;
  /** Boss phase crossed — queue add spawns. */
  onBossPhaseSpawns?(cultivator: Cultivator, adds: { id: string; count: number }[]): void;
}

function toBaseStats(config: CultivatorConfig): BaseStats {
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

/** Poolable cultivator entity: AI-driven movement + telegraphed attacks. */
export class Cultivator extends EntityBase implements HurtboxEntity {
  readonly team: CombatTeam = 'cultivator';
  readonly config: CultivatorConfig;

  alive = false;
  /** Lost the fight — HP at zero, recovering or awaiting pool release. */
  defeated = false;
  spawnX = 0;
  spawnY = 0;

  private brain: AIDecider;
  private cooldownMs = 0;
  private attackPhase: AttackPhase = 'none';
  private attackPhaseMs = 0;
  private defeatMs = 0;
  private recoveryMs = 0;
  private recoveryDurationMs = DEFAULT_RECOVERY_MS;
  private recovering = false;
  private defeatHoldDispatched = false;
  private knockback: KnockbackState | null = null;
  private animKeys!: ReturnType<typeof cultivatorAnimKeys>;
  private readonly hpBarBg: Phaser.GameObjects.Rectangle;
  private readonly hpBarFill: Phaser.GameObjects.Rectangle;
  private bossPhases: BossPhaseTracker | null = null;

  constructor(
    scene: Phaser.Scene,
    config: CultivatorConfig,
    private readonly callbacks: CultivatorCallbacks,
  ) {
    super(scene, -1000, -1000, config.spriteKey, new StatSheet(toBaseStats(config)));
    this.config = config;
    this.animKeys = cultivatorAnimKeys(config.spriteKey);
    this.brain = createDecider(config.archetype);
    this.bossPhases = config.phases?.length ? new BossPhaseTracker(config.phases) : null;
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
    return !this.alive || this.defeated;
  }

  get isCombatReady(): boolean {
    return this.alive && !this.defeated;
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
    this.defeated = false;
    this.cooldownMs = 0;
    this.attackPhase = 'none';
    this.attackPhaseMs = 0;
    this.defeatMs = 0;
    this.recoveryMs = 0;
    this.recovering = false;
    this.defeatHoldDispatched = false;
    this.knockback = null;
    this.brain = createDecider(this.config.archetype);
    this.bossPhases = this.config.phases?.length ? new BossPhaseTracker(this.config.phases) : null;
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

  /** Override patrol loop for roaming map spawns. */
  setPatrolWaypoints(offsets: ReadonlyArray<{ x: number; y: number }>): void {
    this.brain = new PatrolAI(offsets);
  }

  /** Milliseconds until full HP after defeat (roaming spawns set per slot). */
  setRecoveryDuration(ms: number): void {
    this.recoveryDurationMs = Math.max(500, ms);
  }

  deactivate(): void {
    this.alive = false;
    this.defeated = false;
    this.recovering = false;
    this.defeatHoldDispatched = false;
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
    if (this.defeated) {
      this.defeatMs += dtMs;
      if (this.recovering) {
        this.recoveryMs += dtMs;
        const regen = computeHealthRegenPerSec({
          realmOrder: 1,
          level: this.stats.resolved.level,
          state: 'meditate',
        });
        const healed = regen * (dtMs / 1000);
        if (healed > 0) {
          this.stats.heal(healed);
          this.updateHpBar();
        }
        const t = Math.min(1, this.recoveryMs / this.recoveryDurationMs);
        this.sprite.setAlpha(0.55 + t * 0.45);
        const atFullHp = this.stats.runtime.hp >= this.stats.resolved.hpMax;
        if (atFullHp || this.recoveryMs >= this.recoveryDurationMs) {
          this.recoverFromDefeat();
        }
      } else if (!this.defeatHoldDispatched && this.defeatMs >= DEFEAT_STAGGER_MS) {
        this.defeatHoldDispatched = true;
        this.callbacks.onDefeatHoldComplete(this);
      }
      this.trackHpBar();
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

    if (this.bossPhases) {
      const ratio = this.stats.runtime.hp / this.stats.resolved.hpMax;
      const spawns = this.bossPhases.onHpRatio(ratio);
      if (spawns.length > 0) this.callbacks.onBossPhaseSpawns?.(this, spawns);
    }

    if (this.stats.isDead) {
      this.startDefeat();
    }
  }

  /** Begin recovery timer in place — used by roaming spawns after defeat rewards. */
  beginRecovery(): void {
    if (!this.defeated) return;
    this.recovering = true;
    this.recoveryMs = 0;
    this.sprite.setAlpha(0.55);
    if (this.animKeys.sit) {
      this.sprite.play(this.animKeys.sit);
    }
  }

  recoverFromDefeat(): void {
    if (!this.defeated) return;
    this.defeated = false;
    this.recovering = false;
    this.defeatHoldDispatched = false;
    this.defeatMs = 0;
    this.recoveryMs = 0;
    this.stats.refill();
    this.body.enable = true;
    clearHitFlash(this.sprite);
    this.sprite.clearTint();
    this.sprite.setAlpha(1);
    this.sprite.setScale(DISPLAY_SCALE);
    this.updateHpBar();
    this.sprite.play(this.animKeys.idle);
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

  private startDefeat(): void {
    this.defeated = true;
    this.defeatMs = 0;
    this.recoveryMs = 0;
    this.recovering = false;
    this.defeatHoldDispatched = false;
    this.knockback = null;
    this.attackPhase = 'none';
    this.body.enable = false;
    this.body.stop();
    this.sprite.setPosition(this.spawnX, this.spawnY);
    clearHitFlash(this.sprite);
    this.sprite.setTint(0x9a9a9a);
    this.sprite.setAlpha(0.75);
    this.updateHpBar();
    if (this.animKeys.sit) {
      this.sprite.play(this.animKeys.sit);
    }
    this.callbacks.onDefeated(this);
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

/** @deprecated Use Cultivator */
export const Enemy = Cultivator;
/** @deprecated Use CultivatorCallbacks */
export type EnemyCallbacks = CultivatorCallbacks;
