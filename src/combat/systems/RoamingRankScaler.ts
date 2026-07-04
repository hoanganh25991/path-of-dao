/**
 * Computes a roaming cultivator rank from slot distance + map elapsed time,
 * capped by the map's level-design ceiling (recommendedRealmOrder).
 *
 * rank = 0 (weakest vanilla) … N (capped by maxRank).
 * Each rank adds 30 % stat multiplier and better visual polish.
 *
 * Scaling thresholds are tighter than default so cultivators grow stronger
 * faster as the player explores deeper on the map.
 */
export interface RoamingRankConfig {
  /** Maximum rank the map allows. Derived from recommendedRealmOrder. */
  maxRank: number;
  /** Pixels from player spawn to advance one rank. Default 800. */
  distPerRank: number;
  /** Seconds elapsed in map to advance one rank. Default 45. */
  secPerRank: number;
}

export interface RoamingRankResult {
  /** 0 = vanilla, 1+ = scaled */
  rank: number;
  /** 1 + rank * 0.30 */
  statMultiplier: number;
}

const DEFAULT_DIST_PER_RANK = 800;
const DEFAULT_SEC_PER_RANK = 45;

/**
 * Max rank from realm order: realm 1 = maxRank 5, realm 2 = maxRank 6, etc.
 * Allows maps with higher recRealmOrder to naturally have stronger enemies.
 */
function maxRankForRealmOrder(order: number): number {
  if (order <= 1) return 5;
  if (order === 2) return 6;
  if (order === 3) return 7;
  return 8;
}

export function buildRoamingRankConfig(
  recommendedRealmOrder: number,
  overrides?: Partial<RoamingRankConfig>,
): RoamingRankConfig {
  return {
    maxRank: maxRankForRealmOrder(recommendedRealmOrder),
    distPerRank: DEFAULT_DIST_PER_RANK,
    secPerRank: DEFAULT_SEC_PER_RANK,
    ...overrides,
  };
}

/**
 * Compute rank for one slot.
 * @param distPx  Euclidean distance from player spawn to slot in pixels
 * @param elapsedSec  Seconds since map entered
 * @param config  Rank config (maxRank / steps)
 */
export function computeRoamingRank(
  distPx: number,
  elapsedSec: number,
  config: RoamingRankConfig,
): RoamingRankResult {
  const distRank = Math.max(0, Math.floor(distPx / config.distPerRank));
  const timeRank = Math.max(0, Math.floor(elapsedSec / config.secPerRank));
  const rank = Math.min(config.maxRank, distRank + timeRank);
  const statMultiplier = 1 + rank * 0.30;
  return { rank, statMultiplier };
}