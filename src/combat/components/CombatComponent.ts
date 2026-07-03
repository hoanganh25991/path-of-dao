import { ATTACK_STEP_MULTIPLIERS, MAX_COMBO_STEP } from '@/combat/state/PlayerStateMachine';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';
import type { Player } from '@/combat/entities/Player';
import type { HitboxManager } from '@/combat/combat/HitboxManager';

export const SKILL_MANA_COST = 20;
const SLASH_VISIBLE_MS = 100;
const SLASH_OFFSET_PX = 26;
/** Arc reach per combo step (sub-plan 07 §5). */
const SLASH_REACH_PX = [40, 45, 60] as const;
const SLASH_TEXTURE_SIZE = 64;
const SLASH_HIT_MS = 80;
const SLASH_HALF_ARC = Math.PI / 3;
const COMBO_FINISHER_KNOCKBACK = 180;

const BOLT_SPEED_PX_PER_SEC = 420;
const BOLT_RANGE_PX = 400;

/** Attack combo + skill stub. Spawns arc hitboxes via HitboxManager (09). */
export class CombatComponent {
  /** Multiplier of the attack in progress — consumed by hit resolution. */
  currentMultiplier = 0;

  constructor(
    private readonly player: Player,
    private readonly hitboxes: HitboxManager,
  ) {}

  tryAttack(): boolean {
    const step = this.player.sm.tryAttack();
    if (step === null) return false;

    this.currentMultiplier = ATTACK_STEP_MULTIPLIERS[step - 1] ?? 1;
    this.player.body.setVelocity(0, 0);
    this.spawnSlash(step);
    this.spawnSlashHitbox(step);
    return true;
  }

  /** Skill stub: spend mana, fire skill.basic_bolt forward (full system in 19). */
  trySkill(): boolean {
    if (!this.player.sm.canAct) return false;
    if (!this.player.stats.spendMana(SKILL_MANA_COST)) return false;

    this.player.emitStatsChanged();
    this.spawnBolt();
    return true;
  }

  private spawnSlashHitbox(step: number): void {
    const { facing } = this.player;
    const reach = SLASH_REACH_PX[step - 1] ?? 40;
    const cx = this.player.x + facing * SLASH_OFFSET_PX;
    const cy = this.player.y;
    const startAngle = facing > 0 ? -SLASH_HALF_ARC : Math.PI - SLASH_HALF_ARC;
    const endAngle = facing > 0 ? SLASH_HALF_ARC : Math.PI + SLASH_HALF_ARC;

    this.hitboxes.spawn({
      ownerId: this.player.id,
      team: 'player',
      shape: { kind: 'arc', radius: reach + 12, startAngle, endAngle, x: cx, y: cy },
      damage: {
        attacker: this.player.stats.resolved,
        skillMultiplier: this.currentMultiplier,
        damageType: 'physical',
      },
      lifetimeMs: SLASH_HIT_MS,
      knockback: step === MAX_COMBO_STEP ? COMBO_FINISHER_KNOCKBACK : undefined,
      pierce: 8,
    });
  }

  private spawnSlash(step: number): void {
    const { scene, sprite, facing } = this.player;
    const scale = (SLASH_REACH_PX[step - 1] ?? 40) / SLASH_TEXTURE_SIZE;

    const slash = scene.add
      .image(sprite.x + facing * SLASH_OFFSET_PX, sprite.y, TEXTURE_KEYS.slash)
      .setFlipX(facing < 0)
      .setScale(scale)
      .setDepth(sprite.depth + 1);

    scene.time.delayedCall(SLASH_VISIBLE_MS, () => slash.destroy());
  }

  private spawnBolt(): void {
    const { scene, sprite, facing } = this.player;

    const bolt = scene.physics.add
      .image(sprite.x + facing * 20, sprite.y - 4, TEXTURE_KEYS.bolt)
      .setFlipX(facing < 0)
      .setDepth(sprite.depth + 1);
    bolt.setVelocity(facing * BOLT_SPEED_PX_PER_SEC, 0);

    const lifetimeMs = (BOLT_RANGE_PX / BOLT_SPEED_PX_PER_SEC) * 1000;
    scene.time.delayedCall(lifetimeMs, () => bolt.destroy());
  }
}
