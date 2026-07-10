import { z } from 'zod';
import { groundPaletteSchema } from '@/combat/world/GroundPalette';

export const worldFogSchema = z.object({
  enabled: z.boolean().default(true),
  color: z.string().default('#8a9aa8'),
  alpha: z.number().min(0).max(1).default(0.32),
});

/** Prop types for `settlements[].structures` — `map-design-canon.md` §2.2. */
export const settlementStructureTypeSchema = z.enum([
  'house_ruin',
  'house_intact',
  'hut',
  'well',
  'wall_segment',
  'watchtower',
  'pavilion',
  'shrine',
  'sect_gate',
]);
export type SettlementStructureType = z.infer<typeof settlementStructureTypeSchema>;

/** Named cluster archetypes — `map-design-canon.md` §2.3. */
export const settlementTypeSchema = z.enum([
  'ruin_village',
  'hamlet',
  'outpost',
  'sect_courtyard',
  'shrine_cluster',
  'nomad_camp',
  'palace_ruin',
]);
export type SettlementType = z.infer<typeof settlementTypeSchema>;

/**
 * Named prop cluster near a seeded world anchor — decorative only (no collision),
 * spaced to leave walkable gaps. Position is derived from world seed unless `anchorCell` is set.
 */
export const settlementConfigSchema = z.object({
  id: z.string().min(1).optional(),
  type: settlementTypeSchema.default('hamlet'),
  structures: z
    .array(settlementStructureTypeSchema)
    .min(1)
    .default(['hut', 'house_ruin', 'well']),
  /** Cluster spread radius in px around the anchor. */
  radius: z.number().positive().default(220),
  /** Seeded anchor distance band from the world origin, in cells (ignored if `anchorCell` set). */
  minDistCells: z.number().min(0).default(1),
  maxDistCells: z.number().min(1).default(3),
  /** Explicit cell anchor override — skips the seeded distance band. */
  anchorCell: z.object({ x: z.number().int(), y: z.number().int() }).optional(),
});
export type SettlementConfig = z.infer<typeof settlementConfigSchema>;

/** One navigational landmark tree per map — `map-design-canon.md` §4. */
export const signatureTreeConfigSchema = z.object({
  propId: z.string().min(1).default('prop.tree.signature'),
  displayNameKey: z.string().optional(),
  /** Scale over the base biome tree sprite — reads as a landmark from across the map. */
  scale: z.number().positive().default(2.6),
  minDistCells: z.number().min(0).default(2),
  maxDistCells: z.number().min(1).default(5),
  anchorCell: z.object({ x: z.number().int(), y: z.number().int() }).optional(),
});
export type SignatureTreeConfig = z.infer<typeof signatureTreeConfigSchema>;

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
  /** Settlement clusters — defaults to one seeded hamlet if omitted (§2.3). */
  settlements: z.array(settlementConfigSchema).default([]),
  /** Signature landmark tree — defaults to one seeded tree if omitted (§4). */
  signatureTree: signatureTreeConfigSchema.nullable().default(null),
});

export type ProceduralWorldConfig = z.infer<typeof proceduralWorldSchema>;
export type WorldFogConfig = z.infer<typeof worldFogSchema>;
