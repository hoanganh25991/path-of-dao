import { ATTACK_STEP_MULTIPLIERS } from '@/combat/state/PlayerStateMachine';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';
import type { Player } from '@/combat/entities/Player';

export const SKILL_MANA_COST = 20;
const SLASH_VISIBLE_MS = 100;
const SLASH_OFFSET_PX = 26;
/** Arc reach per combo step: 40 / 45 / 60 px (sub-plan 07 §5). */
const SLASH_SCALES = [40 / 64, 45 / 64, 60 / 64] as const;

const BOLT_SPEED_PX_PER_SEC = 420;
const BOLT_RANGE_PX = 400;

/**
 * Attack combo + skill stub. Hitbox overlap and damage application land in
 * sub-plan 09; this spawns the placeholder visuals and tracks multipliers.
 */
export class CombatComponent {
  /** Multiplier of the attack in progress — consumed by hit resolution (09). */
  currentMultiplier = 0;

  constructor(private readonly player: Player) {}

  tryAttack(): boolean {
    const step = this.player.sm.tryAttack();
    if (step === null) return false;

    this.currentMultiplier = ATTACK_STEP_MULTIPLIERS[step - 1] ?? 1;
    this.player.body.setVelocity(0, 0);
    this.spawnSlash(step);
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

  private spawnSlash(step: number): void {
    const { scene, sprite, facing } = this.player;
    const scale = SLASH_SCALES[step - 1] ?? 1;

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
