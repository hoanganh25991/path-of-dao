import type {
  AttackShape,
  BossPhaseConfig,
  CultivatorArchetype,
  CultivatorConfig,
} from '@/combat/cultivators/CultivatorConfig';

/** Engine defaults when neither the boss phase nor the cultivator config override them. */
export const DEFAULT_TELEGRAPH_MS = 300;
export const DEFAULT_STRIKE_MS = 100;
export const DEFAULT_TELEGRAPH_COLOR = 0xff5a4a;

export interface EffectiveAttackTiming {
  telegraphMs: number;
  strikeMs: number;
  telegraphColor: number;
  attackShape: AttackShape;
}

/**
 * Resolve the attack timing/shape currently in effect for a cultivator: the active
 * boss phase overrides the cultivator config, which overrides engine defaults
 * (sub-plan 23 — distinct boss patterns). Pure so it can be unit tested without Phaser.
 */
export function resolveAttackTiming(
  config: CultivatorConfig,
  activePhase: BossPhaseConfig | null,
): EffectiveAttackTiming {
  return {
    telegraphMs: activePhase?.telegraphMs ?? config.telegraphMs ?? DEFAULT_TELEGRAPH_MS,
    strikeMs: activePhase?.strikeMs ?? config.strikeMs ?? DEFAULT_STRIKE_MS,
    telegraphColor: activePhase?.telegraphColor ?? config.telegraphColor ?? DEFAULT_TELEGRAPH_COLOR,
    attackShape: activePhase?.attackShape ?? config.attackShape,
  };
}

/**
 * Legacy ranged/stationary archetypes always resolved to arrow/ring VFX regardless of content —
 * keep that guarantee so existing non-boss enemies don't regress, then let `attackShape` drive
 * everything else (mainly bosses, whose archetype is fixed to `'boss'`).
 */
export function dispatchAttackShape(
  archetype: CultivatorArchetype,
  attackShape: AttackShape,
): AttackShape {
  if (archetype === 'ranged_kiter') return 'projectile';
  if (archetype === 'stationary') return 'aoe_ring';
  return attackShape;
}
