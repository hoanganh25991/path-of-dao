import type Phaser from 'phaser';
import { EventBus } from '@/core/EventBus';
import { InputManager } from '@/core/input/InputManager';
import type { StatSheet } from '@/progression/StatSheet';
import type { DamageResult } from '@/progression/types';
import { EntityBase } from '@/combat/entities/EntityBase';
import { PlayerStateMachine } from '@/combat/state/PlayerStateMachine';
import { MovementComponent, normalizeMove } from '@/combat/components/MovementComponent';
import { CombatComponent } from '@/combat/components/CombatComponent';
import { DodgeComponent } from '@/combat/components/DodgeComponent';
import { PlayerAnimController } from '@/combat/animations/PlayerAnimController';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';
import { applyStickyManSprite } from '@/combat/art/stickyManAssets';
import {
  applyAncientHeroVisual,
  mapAncientToHeroAnim,
  tickAncientCombatFx,
  type AncientCombatFx,
} from '@/combat/art/ancientHeroVisuals';
import type { AncientProfile } from '@/shared/schemas/ancient-demo';
import type { HurtboxEntity, CombatTeam } from '@/combat/combat/Hurtbox';
import type { Hitbox } from '@/combat/combat/Hitbox';
import type { HitboxManager } from '@/combat/combat/HitboxManager';
import { startKnockback, tickKnockback, type KnockbackState } from '@/combat/combat/Knockback';
import { clearHitFlash } from '@/combat/combat/HitFlash';

const RESPAWN_FADE_MS = 1000;

/** Player entity: consumes InputManager, drives state machine + components. */
export class Player extends EntityBase implements HurtboxEntity {
  readonly team: CombatTeam = 'player';
  readonly sm = new PlayerStateMachine();
  readonly combat: CombatComponent;

  private readonly movement: MovementComponent;
  private readonly dodge: DodgeComponent;
  private readonly anim: PlayerAnimController;
  private readonly spawnPoint: { x: number; y: number };
  private respawning = false;
  private knockback: KnockbackState | null = null;
  /** Cultivation realm order for damage bonus vs lower maps. */
  attackerRealmOrder = 1;
  /** Map recommended realm order — applied to enemies hurt by player. */
  mapRecommendedRealmOrder = 1;
  /** Set when walking an ancient echo — custom sprite palette + tags. */
  ancientId: string | null = null;

  private ancientFx: AncientCombatFx | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    stats: StatSheet,
    hitboxes: HitboxManager,
  ) {
    super(scene, x, y, TEXTURE_KEYS.player, stats);

    this.spawnPoint = { x, y };
    applyStickyManSprite(this.sprite);
    this.sprite.setDepth(10);
    this.sprite.setCollideWorldBounds(true);

    this.movement = new MovementComponent(this);
    this.combat = new CombatComponent(this, hitboxes);
    this.dodge = new DodgeComponent(this);
    this.anim = new PlayerAnimController(this);

    this.emitStatsChanged();
  }

  get invulnerable(): boolean {
    return this.isInvulnerable;
  }

  get isInvulnerable(): boolean {
    return this.sm.isInvulnerable;
  }

  getDefenderStats() {
    return this.stats.resolved;
  }

  receiveHit(result: DamageResult, hitbox: Hitbox): void {
    if (this.sm.state === 'dead' || this.isInvulnerable || this.stats.isGodMode) return;

    const lost = this.stats.applyDamage(result.final);
    if (lost <= 0) return;

    if (hitbox.knockback && hitbox.knockback > 0) {
      this.knockback = startKnockback(hitbox.shape.x, hitbox.shape.y, this.x, this.y, hitbox.knockback);
    }

    this.emitStatsChanged();
    if (this.stats.isDead) {
      this.die();
    } else {
      this.sm.applyHit();
    }
  }

  update(dtMs: number): void {
    const input = InputManager.consume();
    const move = normalizeMove(input.move);
    const moving = Math.hypot(move.x, move.y) > 0.1;

    this.sm.update(dtMs, moving);

    if (this.sm.state !== 'dead' && !this.respawning) {
      if (input.dodge.pressed) this.dodge.tryStart(move);
      if (input.attack.pressed) this.combat.tryAttack();
      if (input.skillPrimary.held) this.combat.trySkill('primary');
      if (input.skillSecondary.held) this.combat.trySkill('secondary');
      if (input.skillUltimate.held) this.combat.trySkill('ultimate');
    }

    this.movement.update(move);
    this.dodge.update(dtMs);
    this.combat.update(dtMs);
    EventBus.emit('skill:cooldown-state', this.combat.getCooldownSnapshot());
    this.applyKnockback(dtMs);
    this.anim.update();
    if (this.ancientFx) {
      tickAncientCombatFx(this.ancientFx, this.x, this.y);
    }
  }

  applyAncientEcho(profile: AncientProfile, displayName: string, epithet: string): void {
    this.ancientId = profile.id;
    this.ancientFx = applyAncientHeroVisual(
      this.scene,
      this.sprite,
      profile,
      displayName,
      epithet,
    );
  }

  resolveAnim(key: string): string {
    if (!this.ancientId) return key;
    return mapAncientToHeroAnim(this.ancientId, key);
  }

  heal(amount: number): void {
    this.stats.heal(amount);
    this.emitStatsChanged();
  }

  emitStatsChanged(): void {
    const runtime = this.stats.runtime;
    EventBus.emit('player:stats-changed', {
      hp: runtime.hp,
      hpMax: runtime.hpMax,
      mana: runtime.mana,
      manaMax: runtime.manaMax,
    });
  }

  override destroy(): void {
    this.ancientFx?.aura.destroy();
    this.ancientFx?.nameTag.destroy();
    this.ancientFx?.titleTag.destroy();
    this.ancientFx = null;
    clearHitFlash(this.sprite);
    this.anim.destroy();
    super.destroy();
  }

  /** MVP death: fade out, respawn at spawn point with full HP/mana. */
  private die(): void {
    this.sm.kill();
    this.knockback = null;
    this.body.setVelocity(0, 0);
    this.respawning = true;
    EventBus.emit('player:died', undefined);

    const camera = this.scene.cameras.main;
    camera.fadeOut(RESPAWN_FADE_MS, 0, 0, 0);
    camera.once('camerafadeoutcomplete', () => {
      this.sprite.setPosition(this.spawnPoint.x, this.spawnPoint.y);
      this.stats.refill();
      this.sm.revive();
      this.respawning = false;
      this.emitStatsChanged();
      camera.fadeIn(RESPAWN_FADE_MS / 2, 0, 0, 0);
    });
  }

  private applyKnockback(dtMs: number): void {
    if (!this.knockback) return;
    this.body.setVelocity(this.knockback.vx, this.knockback.vy);
    this.knockback = tickKnockback(this.knockback, dtMs);
  }
}
