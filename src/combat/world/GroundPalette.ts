import { z } from 'zod';
import type { ProceduralWorldConfig } from '@/combat/world/ProceduralWorldConfig';

/** Tileset frame indices — see TilesetTypes TILE_DEFS gid-1. */
export const groundPaletteSchema = z.object({
  /** Dominant walkable tile — usually grass (0). */
  primary: z.number().int().min(0),
  /** Subtle same-biome variation (e.g. grass alt). */
  variants: z.array(z.number().int().min(0)).default([]),
  /** Optional dirt / path patches — spawned in macro clusters. */
  dirt: z.number().int().min(0).optional(),
  sand: z.number().int().min(0).optional(),
  rock: z.number().int().min(0).optional(),
  gravel: z.number().int().min(0).optional(),
  waterShallow: z.number().int().min(0).optional(),
  waterDeep: z.number().int().min(0).optional(),
  /** Macro noise below this → water pocket (if water tiles defined). */
  waterMacroThreshold: z.number().min(0).max(1).default(0.045),
  /** Macro noise above this → dirt/sand/gravel patch. */
  dirtMacroThreshold: z.number().min(0).max(1).default(0.88),
  /** Macro noise above this → rock outcrop (if rock tile defined). */
  rockMacroThreshold: z.number().min(0).max(1).default(0.94),
});

export type GroundPalette = z.infer<typeof groundPaletteSchema>;

export const DEFAULT_GROUND_PALETTE: GroundPalette = {
  primary: 0,
  variants: [1],
  dirt: 2,
  waterShallow: 4,
  waterMacroThreshold: 0.045,
  dirtMacroThreshold: 0.88,
  rockMacroThreshold: 0.94,
};

/** Legacy flat list → mostly primary with variants only. */
export function groundPaletteFromLegacy(frames: readonly number[]): GroundPalette {
  const [primary = 0, ...rest] = frames;
  const variants = rest.filter((f) => f === 1 || f === primary);
  const dirt = frames.find((f) => f === 2);
  const sand = frames.find((f) => f === 3);
  const waterShallow = frames.find((f) => f === 4 || f === 8);
  const waterDeep = frames.find((f) => f === 5 || f === 6);
  return {
    primary,
    variants: variants.length > 0 ? variants : [1],
    dirt,
    sand,
    waterShallow,
    waterDeep,
    waterMacroThreshold: waterShallow != null ? 0.05 : 0,
    dirtMacroThreshold: dirt != null || sand != null ? 0.88 : 0.99,
    rockMacroThreshold: 0.94,
  };
}

export function resolveGroundPalette(profile: ProceduralWorldConfig): GroundPalette {
  if (profile.groundPalette) return profile.groundPalette;
  if (profile.groundTiles?.length) return groundPaletteFromLegacy(profile.groundTiles);
  return DEFAULT_GROUND_PALETTE;
}
