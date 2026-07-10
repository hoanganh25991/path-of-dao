import type { GroundPalette } from '@/combat/world/GroundPalette';
import { cellSeed, pickFrom, seededFloat } from '@/combat/world/seededRandom';

/** Tiles per macro region — patches are this many tiles wide before terrain can change. */
const MACRO_TILES = 8;

function macroCoord(tile: number): number {
  return Math.floor(tile / MACRO_TILES);
}

function macroNoise(worldSeed: number, macroX: number, macroY: number): number {
  return seededFloat(cellSeed(worldSeed, macroX, macroY, 8000), 0);
}

function waterNeighborWeight(worldSeed: number, macroX: number, macroY: number): number {
  let weight = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const n = macroNoise(worldSeed, macroX + dx, macroY + dy);
      if (n < 0.12) weight++;
    }
  }
  return weight;
}

function highMacroNeighborWeight(
  worldSeed: number,
  macroX: number,
  macroY: number,
  threshold: number,
): number {
  let weight = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const n = macroNoise(worldSeed, macroX + dx, macroY + dy);
      if (n > threshold) weight++;
    }
  }
  return weight;
}

/**
 * Deterministic ground tile — macro patches of one terrain type, not per-tile noise.
 * Same coords always return the same frame; mostly primary with rare clustered pockets.
 */
export function generateGroundTileFrame(
  worldSeed: number,
  worldTileX: number,
  worldTileY: number,
  palette: GroundPalette,
): number {
  const mx = macroCoord(worldTileX);
  const my = macroCoord(worldTileY);
  const macro = macroNoise(worldSeed, mx, my);

  const hasWater = palette.waterShallow != null && palette.waterMacroThreshold > 0;
  if (hasWater) {
    const waterCore = macro < palette.waterMacroThreshold;
    const waterBleed = macro < palette.waterMacroThreshold * 2.2 && waterNeighborWeight(worldSeed, mx, my) >= 2;
    if (waterCore || waterBleed) {
      if (waterCore && palette.waterDeep != null && macro < palette.waterMacroThreshold * 0.45) {
        return palette.waterDeep;
      }
      return palette.waterShallow!;
    }
  }

  const rockThreshold = palette.rockMacroThreshold ?? 0.94;
  if (palette.rock != null) {
    const rockCore = macro > rockThreshold;
    const rockBleed = macro > rockThreshold - 0.07 && highMacroNeighborWeight(worldSeed, mx, my, rockThreshold - 0.05) >= 2;
    if (rockCore || rockBleed) {
      return palette.rock;
    }
  }

  const gravelStart = palette.dirtMacroThreshold + 0.05;
  if (palette.gravel != null && macro > gravelStart && macro <= rockThreshold + 0.02) {
    const gravelCore = macro > gravelStart + 0.04;
    const gravelBleed =
      macro > gravelStart &&
      highMacroNeighborWeight(worldSeed, mx, my, gravelStart) >= 2;
    if (gravelCore || gravelBleed) {
      return palette.gravel;
    }
  }

  const hasDirt = palette.dirt != null || palette.sand != null;
  if (hasDirt && macro > palette.dirtMacroThreshold) {
    const dirtCore = macro > palette.dirtMacroThreshold;
    const dirtBleed =
      macro > palette.dirtMacroThreshold - 0.08 &&
      highMacroNeighborWeight(worldSeed, mx, my, palette.dirtMacroThreshold - 0.05) >= 2;
    if (dirtCore || dirtBleed) {
      if (palette.sand != null && macro > palette.dirtMacroThreshold + 0.04) {
        return palette.sand;
      }
      return palette.dirt ?? palette.sand ?? palette.primary;
    }
  }

  const micro = seededFloat(cellSeed(worldSeed, worldTileX, worldTileY, 9001), 0);
  if (micro < 0.14 && palette.variants.length > 0) {
    return pickFrom(cellSeed(worldSeed, worldTileX, worldTileY, 9002), 0, palette.variants);
  }

  return palette.primary;
}
