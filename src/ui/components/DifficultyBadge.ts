/** Map difficulty tier from player CP vs map recommended CP (sub-plan 16 §6). */
export type DifficultyTier = 'trivial' | 'balanced' | 'challenging' | 'hard' | 'deadly';

const THRESHOLDS: { minRatio: number; tier: DifficultyTier }[] = [
  { minRatio: 1.5, tier: 'trivial' },
  { minRatio: 1.0, tier: 'balanced' },
  { minRatio: 0.7, tier: 'challenging' },
  { minRatio: 0.5, tier: 'hard' },
  { minRatio: 0, tier: 'deadly' },
];

export function getDifficultyTier(playerCp: number, mapRecommendedCp: number): DifficultyTier {
  if (mapRecommendedCp <= 0) return 'balanced';
  const ratio = playerCp / mapRecommendedCp;
  return THRESHOLDS.find((entry) => ratio >= entry.minRatio)?.tier ?? 'deadly';
}

export function difficultyTierLabelKey(tier: DifficultyTier): string {
  return `difficulty.${tier}`;
}

export function createDifficultyBadgeElement(
  tier: DifficultyTier,
  label: string,
): HTMLElement {
  const el = document.createElement('span');
  el.className = `difficulty-badge difficulty-badge--${tier}`;
  el.dataset.tier = tier;
  el.textContent = label;
  return el;
}
