import type { PlayerSaveV1 } from '@/core/save/SaveSchema';

const REALM_MULTIPLIER: Record<string, number> = {
  mortal_body: 0,
  qi_condensation: 0.1,
  foundation_establishment: 0.2,
  core_formation: 0.4,
  nascent_soul: 0.6,
  void_spirit: 0.8,
  true_dao: 1,
};

/** Stub CP until sub-plan 16 ships the canonical profile calculator. */
export function computeCombatPowerStub(save: PlayerSaveV1): number {
  const stats = save.stats;
  const realmMult = REALM_MULTIPLIER[save.realm.id] ?? 0;
  const insightBonus = Object.values(save.insights).reduce((sum, insight) => sum + insight.xp * 10, 0);

  return Math.floor(
    stats.hpMax * 0.15 +
      stats.manaMax * 0.08 +
      stats.atk * 2.5 +
      stats.def * 2.0 +
      stats.crit * 800 +
      stats.critDmg * 400 +
      stats.speed * 120 +
      stats.spirit * 1.5 +
      realmMult * 50_000 +
      insightBonus,
  );
}

export function formatCombatPower(value: number, locale: string = 'en'): string {
  return value.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US');
}
