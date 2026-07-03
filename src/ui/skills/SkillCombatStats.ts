import { resolveSkillEffects } from '@/combat/skills/resolveSkillEffects';
import { getInsightIntentConfig } from '@/progression/InsightDefinitions';
import { getSkillCooldownMs } from '@/progression/SkillCooldown';
import { getSkillDefinition } from '@/progression/SkillLoader';
import type { SkillKind } from '@/progression/SkillDefinition';

/** Mirrors combat arc defaults in CombatComponent. */
const SKILL_ARC_REACH_PX = 52;
const SLASH_HALF_ARC_RAD = Math.PI / 3;
const BOLT_RANGE_PX = 400;
const BOLT_HIT_RADIUS_PX = 12;

export interface SkillDisplayStats {
  kind: SkillKind;
  tier: 'base' | 'awakened';
  damageText: string;
  manaCost: number;
  cooldownMs: number;
  aoeText: string;
  rangeText: string;
  difficultyStars: number;
}

function arcDegrees(halfArcRad: number): number {
  return Math.round((halfArcRad * 2 * 180) / Math.PI);
}

export function buildSkillDisplayStats(skillId: string): SkillDisplayStats {
  const skill = getSkillDefinition(skillId);
  const tier = skill.id.endsWith('.awakened') ? 'awakened' : 'base';
  const overrides = skill.awakenedOverrides;
  const cooldownMs = getSkillCooldownMs(skill);

  if (skill.kind === 'arc') {
    const halfArc = overrides?.arcHalfAngle ?? SLASH_HALF_ARC_RAD;
    const reach = SKILL_ARC_REACH_PX + (overrides?.arcReachBonus ?? 0);
    return {
      kind: skill.kind,
      tier,
      damageText: `×${skill.skillMultiplier.toFixed(1)}`,
      manaCost: skill.manaCost,
      cooldownMs,
      aoeText: `${arcDegrees(halfArc)}°`,
      rangeText: `${reach}px`,
      difficultyStars: tier === 'awakened' ? 4 : 2,
    };
  }

  if (skill.kind === 'bolt') {
    const effects = resolveSkillEffects(skill);
    const projectile = effects.find((e) => e.type === 'projectile');
    const pullField = effects.some((e) => e.type === 'pull_field');
    const pull =
      pullField ||
      (projectile?.type === 'projectile' && projectile.pullForce != null) ||
      Boolean(overrides?.pullForce);
    const aoe = effects.find((e) => e.type === 'aoe_circle');
    if (aoe?.type === 'aoe_circle') {
      return {
        kind: skill.kind,
        tier,
        damageText: `×${aoe.damage.skillMultiplier.toFixed(1)}`,
        manaCost: skill.manaCost,
        cooldownMs,
        aoeText: `${aoe.radius}px · ${aoe.ticks}×`,
        rangeText: 'Self',
        difficultyStars: tier === 'awakened' ? 5 : 2,
      };
    }
    return {
      kind: skill.kind,
      tier,
      damageText: `×${skill.skillMultiplier.toFixed(1)}`,
      manaCost: skill.manaCost,
      cooldownMs,
      aoeText: pull ? `${BOLT_HIT_RADIUS_PX}px · pull` : `${BOLT_HIT_RADIUS_PX}px`,
      rangeText: `${BOLT_RANGE_PX}px`,
      difficultyStars: tier === 'awakened' ? 5 : 2,
    };
  }

  const healPct = (overrides?.healPct ?? 0.1) * 100;
  return {
    kind: skill.kind,
    tier,
    damageText: `${Math.round(healPct)}% HP`,
    manaCost: skill.manaCost,
    cooldownMs,
    aoeText: 'Self',
    rangeText: '—',
    difficultyStars: tier === 'awakened' ? 3 : 1,
  };
}

export function skillDescKey(nameKey: string): string {
  return nameKey.endsWith('.name') ? nameKey.replace(/\.name$/, '.desc') : `${nameKey}.desc`;
}

export function skillLoreKey(skillId: string): string {
  return `${skillId}.lore`;
}

export function skillDifficultyKey(skillId: string): string {
  return `${skillId}.difficulty`;
}

export function skillUnlockText(skillId: string): string {
  if (skillId.endsWith('.awakened')) {
    return 'skill.detail.unlock_awakened';
  }
  return 'skill.detail.unlock_base';
}

export function skillUnlockParams(skillId: string): Record<string, string> {
  const skill = getSkillDefinition(skillId);
  const config = getInsightIntentConfig(skill.intent);
  const req = config.awakenRequirement;

  if (skillId.endsWith('.awakened')) {
    return {
      realm: `realm.${req.minRealm}.name`,
      uses: String(req.minUses),
      xp: String(req.xp),
      intent: config.displayKey,
    };
  }

  return { intent: config.displayKey };
}
