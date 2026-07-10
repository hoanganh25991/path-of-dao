import { describe, expect, it } from 'vitest';
import { generateCellLayout } from '@/combat/world/ProceduralCellGenerator';
import { getWorldProfile } from '@/combat/world/ProceduralWorldLoader';
import { cellSeed, seededFloat } from '@/combat/world/seededRandom';
import {
  buildProceduralRankConfig,
  chapterTierFromCp,
  computeProceduralRank,
} from '@/combat/systems/RoamingRankScaler';

describe('seededRandom', () => {
  it('returns stable floats for the same seed and salt', () => {
    const a = seededFloat(cellSeed(42, 3, 7), 1);
    const b = seededFloat(cellSeed(42, 3, 7), 1);
    expect(a).toBe(b);
  });

  it('differs across cells', () => {
    const a = seededFloat(cellSeed(42, 3, 7), 0);
    const b = seededFloat(cellSeed(42, 4, 7), 0);
    expect(a).not.toBe(b);
  });
});

describe('ProceduralCellGenerator', () => {
  const profile = getWorldProfile('world.fallen_village');

  it('produces identical layout on repeat visits', () => {
    const first = generateCellLayout(12345, 5, -2, profile, 1000, 2000);
    const second = generateCellLayout(12345, 5, -2, profile, 1000, 2000);
    expect(second).toEqual(first);
  });

  it('can roll wild bosses away from origin', () => {
    let foundBoss = false;
    for (let x = 3; x <= 8 && !foundBoss; x++) {
      for (let y = -4; y <= 4 && !foundBoss; y++) {
        const layout = generateCellLayout(999, x, y, profile, 0, 0);
        if (layout?.spawns.some((s) => s.kind === 'boss')) foundBoss = true;
      }
    }
    expect(foundBoss).toBe(true);
  });

  it('keeps spawn origin safe', () => {
    const layout = generateCellLayout(999, 0, 0, profile, 0, 0);
    expect(layout?.spawns).toEqual([]);
  });
});

describe('procedural rank scaling', () => {
  it('stone canyon tier is higher than fallen village', () => {
    expect(chapterTierFromCp(6000)).toBeGreaterThan(chapterTierFromCp(800));
  });

  it('ch1 map base power is half of authored JSON (early-map TTK)', () => {
    const ch1 = buildProceduralRankConfig(800, 1, 640);
    expect(ch1.mapBaseMultiplier).toBeCloseTo(0.5, 5);
  });

  it('far cells on ch3 map hit much harder than near cells on ch1', () => {
    const ch1 = buildProceduralRankConfig(800, 1, 640);
    const ch3 = buildProceduralRankConfig(6000, 2, 800);
    const nearCh1 = computeProceduralRank(1200, 0, 3, 1, 'solo', ch1);
    const farCh3 = computeProceduralRank(12_000, 0, 12, 8, 'elite', ch3);
    expect(farCh3.statMultiplier).toBeGreaterThan(nearCh1.statMultiplier * 4);
  });

  it('boss depth adds meaningful rank on high-tier maps', () => {
    const ch3 = buildProceduralRankConfig(6000, 2, 800);
    const boss = computeProceduralRank(8000, 0, 8, 6, 'boss', ch3);
    expect(boss.rank).toBeGreaterThanOrEqual(10);
    expect(boss.statMultiplier).toBeGreaterThan(4);
  });
});
