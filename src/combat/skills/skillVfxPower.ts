/** Visual power tier parsed from skill id — scales juice as arts evolve (v1→v5, awakened). */
export type SkillVfxTier = 'low' | 'medium' | 'high' | 'ultra' | 'god';

const TIER_MULTIPLIER: Record<SkillVfxTier, number> = {
  low: 1,
  medium: 1.28,
  high: 1.55,
  ultra: 1.95,
  god: 4.5,
};

/** Map skill id suffix to cultivation art maturity (low → god). */
export function skillVfxTierFromId(skillId: string): SkillVfxTier {
  if (skillId.endsWith('.awakened')) return 'ultra';
  const version = skillId.match(/\.v(\d+)$/);
  if (version) {
    const v = Number(version[1]);
    if (v >= 5) return 'ultra';
    if (v >= 4) return 'high';
    if (v >= 2) return 'medium';
    return 'low';
  }
  return 'low';
}

/** Combined visual power — ancient god mode overrides tier. */
export function skillVfxPower(skillId: string, godAmp: number): number {
  if (godAmp > 1) return godAmp;
  return TIER_MULTIPLIER[skillVfxTierFromId(skillId)];
}
