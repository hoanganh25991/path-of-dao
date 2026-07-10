import { describe, expect, it } from 'vitest';
import { DEFAULT_GROUND_PALETTE } from '@/combat/world/GroundPalette';
import { resolveGroundPalette } from '@/combat/world/GroundPalette';
import { generateGroundTileFrame } from '@/combat/world/GroundTerrain';
import { getWorldProfile } from '@/combat/world/ProceduralWorldLoader';

describe('GroundTerrain', () => {
  const palette = DEFAULT_GROUND_PALETTE;
  const seed = 42_424;

  it('is mostly primary grass across a wide area', () => {
    let grass = 0;
    const total = 64 * 64;
    for (let x = 0; x < 64; x++) {
      for (let y = 0; y < 64; y++) {
        const frame = generateGroundTileFrame(seed, x, y, palette);
        if (frame === 0 || frame === 1) grass++;
      }
    }
    expect(grass / total).toBeGreaterThan(0.75);
  });

  it('forms water clusters not isolated water tiles', () => {
    const waterTiles: { x: number; y: number }[] = [];
    for (let x = 0; x < 128; x++) {
      for (let y = 0; y < 128; y++) {
        const frame = generateGroundTileFrame(seed, x, y, palette);
        if (frame === 4 || frame === 5) waterTiles.push({ x, y });
      }
    }
    if (waterTiles.length === 0) return;
    let isolated = 0;
    for (const t of waterTiles) {
      const neighbors = waterTiles.filter(
        (n) => Math.abs(n.x - t.x) <= 1 && Math.abs(n.y - t.y) <= 1 && !(n.x === t.x && n.y === t.y),
      );
      if (neighbors.length === 0) isolated++;
    }
    expect(isolated / waterTiles.length).toBeLessThan(0.15);
  });

  it('is deterministic for the same coordinates', () => {
    const a = generateGroundTileFrame(seed, 10, 20, palette);
    const b = generateGroundTileFrame(seed, 10, 20, palette);
    expect(a).toBe(b);
  });

  it('each world profile uses a distinct dominant terrain primary', () => {
    const profiles = [
      'world.fallen_village',
      'world.fallen_village.gate',
      'world.mist_forest',
      'world.stone_canyon',
      'world.moon_lake',
      'world.burning_desert',
      'world.thunder_peaks',
      'world.frozen_palace',
      'world.abyss_rift',
      'world.heavenly_gate',
      'world.void_throne',
    ] as const;
    const primaries = new Set<number>();
    for (const id of profiles) {
      const ground = resolveGroundPalette(getWorldProfile(id));
      expect(ground.primary).toBeDefined();
      primaries.add(ground.primary);
      let themeCount = 0;
      const themeFrames = new Set([ground.primary, ...ground.variants]);
      const total = 48 * 48;
      for (let x = 0; x < 48; x++) {
        for (let y = 0; y < 48; y++) {
          const frame = generateGroundTileFrame(seed, x, y, ground);
          if (themeFrames.has(frame)) themeCount++;
        }
      }
      expect(themeCount / total).toBeGreaterThan(0.55);
    }
    expect(primaries.size).toBeGreaterThanOrEqual(4);
  });
});
