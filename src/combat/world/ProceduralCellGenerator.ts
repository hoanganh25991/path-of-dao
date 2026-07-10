import type { ProceduralWorldConfig } from '@/combat/world/ProceduralWorldConfig';
import {
  cellSeed,
  pickFrom,
  seededFloat,
  seededInt,
} from '@/combat/world/seededRandom';

export type CellSpawnKind = 'solo' | 'cluster' | 'elite' | 'boss';

export interface GeneratedSpawn {
  enemyId: string;
  x: number;
  y: number;
  patrolRadius: number;
  kind: CellSpawnKind;
  /** Extra rank bonus on top of distance scaling. */
  bonusRank: number;
}

export interface CellLayout {
  cellX: number;
  cellY: number;
  spawns: GeneratedSpawn[];
}

function cellDist(cellX: number, cellY: number): number {
  return Math.max(Math.abs(cellX), Math.abs(cellY));
}

function pickMob(
  seed: number,
  profile: ProceduralWorldConfig,
  dist: number,
): string {
  const strongChance = 0.15 + dist * 0.14;
  const useStrong = dist >= 1 && seededFloat(seed, 11) < strongChance;
  const pool = useStrong ? profile.strongPool : profile.mobPool;
  return pickFrom(seed, 12, pool);
}

function clusterOffsets(seed: number, count: number, spread: number): { dx: number; dy: number }[] {
  const offsets: { dx: number; dy: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + seededFloat(seed, 20 + i) * 0.8;
    const r = spread * (0.35 + seededFloat(seed, 30 + i) * 0.55);
    offsets.push({
      dx: Math.round(Math.cos(angle) * r),
      dy: Math.round(Math.sin(angle) * r),
    });
  }
  return offsets;
}

/**
 * Deterministic cell content — same map seed + cell coords always produce the same spawns.
 */
export function generateCellLayout(
  worldSeed: number,
  cellX: number,
  cellY: number,
  profile: ProceduralWorldConfig,
  originX: number,
  originY: number,
): CellLayout | null {
  const dist = cellDist(cellX, cellY);
  if (dist < profile.safeRadiusCells) {
    return { cellX, cellY, spawns: [] };
  }

  const seed = cellSeed(worldSeed, cellX, cellY);
  const fillRoll = seededFloat(seed, 0);

  // Wilderness — ~22 % of cells stay empty.
  if (fillRoll < 0.22) {
    return { cellX, cellY, spawns: [] };
  }

  const centerX = originX + cellX * profile.cellSize + profile.cellSize / 2;
  const centerY = originY + cellY * profile.cellSize + profile.cellSize / 2;
  const spawns: GeneratedSpawn[] = [];

  const bossRoll = seededFloat(seed, 1);
  const canBoss = dist >= profile.bossMinDistCells && bossRoll < profile.bossCellChance;

  if (canBoss) {
    const bossId = pickFrom(seed, 2, profile.bossPool);
    spawns.push({
      enemyId: bossId,
      x: centerX + seededInt(seed, 3, -40, 40),
      y: centerY + seededInt(seed, 4, -40, 40),
      patrolRadius: 0,
      kind: 'boss',
      bonusRank: Math.min(12, Math.floor(dist * 0.85) + 3),
    });
    return { cellX, cellY, spawns };
  }

  const typeRoll = seededFloat(seed, 5);
  let kind: CellSpawnKind;
  let count: number;
  let spread: number;
  let bonusRank: number;

  if (typeRoll < 0.38) {
    kind = 'cluster';
    count = seededInt(seed, 6, 3, 5);
    spread = 52;
    bonusRank = Math.floor(dist * 0.5);
  } else if (typeRoll < 0.58) {
    kind = 'solo';
    count = 1;
    spread = 0;
    bonusRank = Math.floor(dist * 0.35);
  } else if (typeRoll < 0.88) {
    kind = 'elite';
    count = seededInt(seed, 7, 2, 3);
    spread = 44;
    bonusRank = Math.floor(dist * 0.65) + 1;
  } else {
    kind = 'cluster';
    count = seededInt(seed, 8, 4, 6);
    spread = 48;
    bonusRank = Math.floor(dist * 0.55) + 1;
  }

  const enemyId = pickMob(seed, profile, dist);
  const offsets = kind === 'solo' ? [{ dx: 0, dy: 0 }] : clusterOffsets(seed, count, spread);

  for (let i = 0; i < offsets.length; i++) {
    const off = offsets[i]!;
    spawns.push({
      enemyId,
      x: centerX + off.dx,
      y: centerY + off.dy,
      patrolRadius: kind === 'solo' ? 64 : 38 + (i % 3) * 4,
      kind,
      bonusRank,
    });
  }

  return { cellX, cellY, spawns };
}

export function cellKey(cellX: number, cellY: number): string {
  return `${cellX},${cellY}`;
}
