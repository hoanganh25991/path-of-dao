import type Phaser from 'phaser';
import { EventBus } from '@/core/EventBus';
import { InputManager } from '@/core/input/InputManager';
import type { StatSheet } from '@/progression/StatSheet';
import { EntityBase } from '@/combat/entities/EntityBase';
import { PlayerStateMachine } from '@/combat/state/PlayerStateMachine';
import { MovementComponent, normalizeMove } from '@/combat/components/MovementComponent';
import { CombatComponent } from '@/combat/components/CombatComponent';
import { DodgeComponent } from '@/combat/components/DodgeComponent';
import { PlayerAnimController } from '@/combat/animations/PlayerAnimController';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';

const RESPAWN_FADE_MS = 1000;
const RESPAWN_HP_PCT = 0.5;

/** Player entity: consumes InputManager, drives state machine + components. */
export class Player extends EntityBase {
  readonly sm = new PlayerStateMachine();
  readonly combat: CombatComponent;

  private readonly movement: MovementComponent;
  private readonly dodge: DodgeComponent;
  private readonly anim: PlayerAnimController;
  private readonly spawnPoint: { x: number; y: number };
  private respawning = false;

  constructor(scene: Phaser.Scene, x: number, y: number, stats: StatSheet) {
    super(scene, x, y, TEXTURE_KEYS.player, stats);

    this.spawnPoint = { x, y };
    this.sprite.setDepth(10);
    this.sprite.setCollideWorldBounds(true);
    this.body.setSize(22, 26);
    this.body.setOffset(3, 10);

    this.movement = new MovementComponent(this);
    this.combat = new CombatComponent(this);
    this.dodge = new DodgeComponent(this);
    this.anim = new PlayerAnimController(this);

    this.emitStatsChanged();
  }

  get isInvulnerable(): boolean {
    return this.sm.isInvulnerable;
  }

  update(dtMs: number): void {
    const input = InputManager.consume();
    const move = normalizeMove(input.move);
    const moving = Math.hypot(move.x, move.y) > 0.1;

    this.sm.update(dtMs, moving);

    if (this.sm.state !== 'dead' && !this.respawning) {
      if (input.dodge.pressed) this.dodge.tryStart(move);
      if (input.attack.pressed) this.combat.tryAttack();
      if (input.skill.pressed) this.combat.trySkill();
    }

    this.movement.update(move);
    this.dodge.update(dtMs);
    this.anim.update();
  }

  /** Applies raw damage; handles hitstun/i-frames/death (wired up in 08/09). */
  applyDamage(amount: number): number {
    if (this.sm.state === 'dead' || this.isInvulnerable) return 0;

    const lost = this.stats.applyDamage(amount);
    if (lost > 0) {
      this.emitStatsChanged();
      if (this.stats.isDead) {
        this.die();
      } else {
        this.sm.applyHit();
      }
    }
    return lost;
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
    this.anim.destroy();
    super.destroy();
  }

  /** MVP death: fade out, respawn at spawn point with 50% HP (07 §10). */
  private die(): void {
    this.sm.kill();
    this.body.setVelocity(0, 0);
    this.respawning = true;
    EventBus.emit('player:died', undefined);

    const camera = this.scene.cameras.main;
    camera.fadeOut(RESPAWN_FADE_MS, 0, 0, 0);
    camera.once('camerafadeoutcomplete', () => {
      this.sprite.setPosition(this.spawnPoint.x, this.spawnPoint.y);
      this.stats.heal(this.stats.resolved.hpMax * RESPAWN_HP_PCT);
      this.sm.revive();
      this.respawning = false;
      this.emitStatsChanged();
      camera.fadeIn(RESPAWN_FADE_MS / 2, 0, 0, 0);
    });
  }
}
