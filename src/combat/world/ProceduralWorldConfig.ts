import { z } from 'zod';
import { groundPaletteSchema } from '@/combat/world/GroundPalette';

export const worldFogSchema = z.object({
  enabled: z.boolean().default(true),
  color: z.string().default('#8a9aa8'),
  alpha: z.number().min(0).max(1).default(0.32),
});

/** Per-region endless world tuning — `content/world/{id}.json`. */
export const proceduralWorldSchema = z.object({
  id: z.string().min(1),
  /** Grid cell size in pixels — one spawn roll per cell. */
  cellSize: z.number().int().min(400).default(640),
  /** No spawns within this many cells of the player spawn origin. */
  safeRadiusCells: z.number().int().min(0).default(2),
  /** Common roam enemies for solo / cluster rolls. */
  mobPool: z.array(z.string().min(1)).min(1),
  /** Stronger cultivators for elite clusters. */
  strongPool: z.array(z.string().min(1)).min(1),
  /** Boss ids that can appear in the wild (multiple per map). */
  bossPool: z.array(z.string().min(1)).min(1),
  /** Minimum cell distance from origin before any boss can spawn. */
  bossMinDistCells: z.number().int().min(1).default(3),
  /** Fraction of filled cells that roll a boss (0–1). */
  bossCellChance: z.number().min(0).max(1).default(0.06),
  fog: worldFogSchema.nullable().default(null),
  /** Coherent terrain patches — primary grass + clustered dirt/water. */
  groundPalette: groundPaletteSchema.optional(),
  /** @deprecated Use groundPalette — kept for legacy JSON migration. */
  groundTiles: z.array(z.number().int().min(0)).optional(),
});

export type ProceduralWorldConfig = z.infer<typeof proceduralWorldSchema>;
export type WorldFogConfig = z.infer<typeof worldFogSchema>;
