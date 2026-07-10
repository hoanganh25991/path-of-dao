import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const LEGACY_W = 50;
const LEGACY_H = 38;

function tilingRatio(tiledPath: string): number {
  const raw = JSON.parse(readFileSync(resolve(__dirname, '../../', tiledPath), 'utf-8')) as {
    width: number;
    height: number;
    layers: { name: string; data: number[] }[];
  };
  const ground = raw.layers.find((layer) => layer.name === 'ground')?.data;
  if (!ground) throw new Error(`missing ground layer in ${tiledPath}`);

  let matches = 0;
  const total = raw.width * raw.height;
  for (let y = 0; y < raw.height; y++) {
    for (let x = 0; x < raw.width; x++) {
      const legacyX = x % LEGACY_W;
      const legacyY = y % LEGACY_H;
      if (ground[y * raw.width + x] === ground[legacyY * LEGACY_W + legacyX]) matches++;
    }
  }
  return matches / total;
}

/**
 * Ratio of the outer rim that is impassable (any nonzero collision tile).
 * Post-C1 (procedural endless) the border no longer relies on a single legacy
 * "rock" tile id (4) — the 25-tile 2.5D set uses several border/collision ids
 * (5, 6, 11, 15, 19, ...) — so this checks for any collision tile, not a fixed id.
 */
function borderRockCoverage(tiledPath: string): number {
  const raw = JSON.parse(readFileSync(resolve(__dirname, '../../', tiledPath), 'utf-8')) as {
    width: number;
    height: number;
    layers: { name: string; data: number[] }[];
  };
  const collision = raw.layers.find((layer) => layer.name === 'collision')?.data;
  if (!collision) throw new Error(`missing collision layer in ${tiledPath}`);

  let rock = 0;
  let rim = 0;
  const w = raw.width;
  const h = raw.height;
  for (let x = 0; x < w; x++) {
    for (const y of [0, 1, h - 2, h - 1]) {
      rim++;
      if (collision[y * w + x] !== 0) rock++;
    }
  }
  for (let y = 2; y < h - 2; y++) {
    for (const x of [0, 1, w - 2, w - 1]) {
      rim++;
      if (collision[y * w + x] !== 0) rock++;
    }
  }
  return rock / rim;
}

describe('procedural map quality', () => {
  it('fallen village ordeal map is not a 50×38 modulo loop', () => {
    expect(tilingRatio('assets/maps/fallen_village-02.json')).toBeLessThan(0.75);
  });

  it('mist forest explore map is not a 50×38 modulo loop', () => {
    expect(tilingRatio('assets/maps/mist_forest-01.json')).toBeLessThan(0.75);
  });

  it('fallen village star west is not a 50×38 modulo loop', () => {
    expect(tilingRatio('assets/maps/fallen_village-star-west.json')).toBeLessThan(0.75);
  });

  it('chapter maps have thick impassable outer rim', () => {
    for (const asset of [
      'assets/maps/fallen_village-02.json',
      'assets/maps/fallen_village-star-west.json',
      'assets/maps/mist_forest-01.json',
    ]) {
      expect(borderRockCoverage(asset)).toBeGreaterThan(0.85);
    }
  });
});
