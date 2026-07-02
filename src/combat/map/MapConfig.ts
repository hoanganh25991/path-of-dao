import { z } from 'zod';

/** Validates content/maps/{mapId}.json at load (sub-plan 06 §3). */
export const mapConfigSchema = z.object({
  id: z.string().min(1),
  chapterId: z.string().min(1),
  displayNameKey: z.string().min(1),
  /** Project-relative path to the Tiled JSON export. */
  tiledPath: z.string().min(1),
  /** Tileset name inside the Tiled JSON (matched by addTilesetImage). */
  tilesetName: z.string().min(1),
  spawn: z.object({ x: z.number(), y: z.number() }),
  bounds: z.object({ width: z.number().positive(), height: z.number().positive() }),
  recommendedCp: z.number().min(0),
  connections: z.array(z.string()),
  encounterTable: z.string().nullable(),
  bgm: z.string().nullable(),
});

export type MapConfig = z.infer<typeof mapConfigSchema>;
