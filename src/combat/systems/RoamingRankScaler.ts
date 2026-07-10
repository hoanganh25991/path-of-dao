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

/** Procedural endless maps — steeper distance curve + map CP tier base power. */
export interface ProceduralRankConfig extends RoamingRankConfig {
  /** Multiplier from map recommendedCp vs ch1 baseline. */
  mapBaseMultiplier: number;
  /** Per-rank stat growth (procedural uses ~0.42). */
  rankStatStep: number;
  /** Extra rank per cell of Chebyshev distance from spawn origin. */
  cellRankFactor: number;
}

const DEFAULT_DIST_PER_RANK = 800;
const DEFAULT_SEC_PER_RANK = 45;
const CH1_CP_BASELINE = 800;

/**
 * Chapter power band from recommended CP — ch1 ≈ 1, ch3 ≈ 3, ch10 ≈ 10.
 */
export function chapterTierFromCp(recommendedCp: number): number {
  return Math.max(1, Math.floor(Math.log(Math.max(recommendedCp, CH1_CP_BASELINE) / 400) / Math.LN2));
}

export function buildProceduralRankConfig(
  recommendedCp: number,
  recommendedRealmOrder: number,
  cellSize: number,
): ProceduralRankConfig {
  const tier = chapterTierFromCp(recommendedCp);
  return {
    maxRank: 6 + tier * 5 + recommendedRealmOrder * 2,
    distPerRank: Math.max(280, Math.floor(cellSize * 0.4)),
    secPerRank: 90,
    mapBaseMultiplier: (recommendedCp / CH1_CP_BASELINE) ** 0.42,
    rankStatStep: 0.42,
    cellRankFactor: 1.75,
  };
}

/**
 * Rank for procedural cells — distance + cell depth + map tier combine.
 */
export function computeProceduralRank(
  distPx: number,
  elapsedSec: number,
  cellDistCells: number,
  slotBonusRank: number,
  kind: 'solo' | 'cluster' | 'elite' | 'boss',
  config: ProceduralRankConfig,
): RoamingRankResult {
  const distRank = Math.max(0, Math.floor(distPx / config.distPerRank));
  const timeRank = Math.max(0, Math.floor(elapsedSec / config.secPerRank));
  const cellRank = Math.floor(cellDistCells * config.cellRankFactor);
  const kindBonus = kind === 'boss' ? 5 : kind === 'elite' ? 2 : 0;
  const rank = Math.min(
    config.maxRank,
    distRank + timeRank + cellRank + slotBonusRank + kindBonus,
  );
  const rankMult = 1 + rank * config.rankStatStep;
  const statMultiplier = config.mapBaseMultiplier * rankMult;
  return { rank, statMultiplier };
}

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