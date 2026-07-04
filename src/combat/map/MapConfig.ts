import { z } from 'zod';

const portalSchema = z.object({
  id: z.string().min(1),
  targetMapId: z.string().min(1),
  /** Portal id on the destination map where the player appears. */
  targetPortalId: z.string().min(1),
  /** Optional override when Tiled object layer is absent. */
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().positive().default(64),
  height: z.number().positive().default(96),
});

/** Validates content/maps/{mapId}.json at load (sub-plan 06 §3). */
export const mapConfigSchema = z.object({
  id: z.string().min(1),
  chapterId: z.string().min(1),
  displayNameKey: z.string().min(1),
  /** Tu Chân Tinh id when this map is a sub-zone of a larger star. */
  starId: z.string().optional(),
  /** Sub-zone label within the star (e.g. village_west). */
  zoneId: z.string().optional(),
  /** Project-relative path to the Tiled JSON export. */
  tiledPath: z.string().min(1),
  /** Tileset name inside the Tiled JSON (matched by addTilesetImage). */
  tilesetName: z.string().min(1),
  spawn: z.object({ x: z.number(), y: z.number() }),
  bounds: z.object({ width: z.number().positive(), height: z.number().positive() }),
  recommendedCp: z.number().min(0),
  /** Cultivation realm order (1–7) for over-level damage bonus. Defaults to 1. */
  recommendedRealmOrder: z.number().int().min(1).max(7).default(1),
  connections: z.array(z.string()),
  /** Wave encounter table (legacy arena mode). */
  encounterTable: z.string().nullable(),
  /** Roaming spawn table for explore stars (`content/roam/{id}.json`). */
  roamTable: z.string().nullable().default(null),
  /** `wave` = legacy wave spawner; `roam` = placed enemies with respawn. */
  spawnMode: z.enum(['wave', 'roam']).default('wave'),
  /** Door/portals to other sub-zones on the same star. */
  portals: z.array(portalSchema).default([]),
  /** Spawn positions keyed by portal id (destination side). */
  portalSpawns: z
    .record(z.string(), z.object({ x: z.number(), y: z.number() }))
    .default({}),
  bgm: z.string().nullable(),
  pois: z
    .array(
      z.object({
        type: z.enum(['hidden_cave', 'ancient_sword']),
        x: z.number(),
        y: z.number(),
        radius: z.number().positive().default(32),
        id: z.string().optional(),
      }),
    )
    .default([]),
});

export type MapConfig = z.infer<typeof mapConfigSchema>;
