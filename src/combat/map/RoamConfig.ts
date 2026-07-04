import { z } from 'zod';

/** Validates content/roam/{roamId}.json — placed enemies for explore stars. */
export const roamSpawnSchema = z.object({
  /** Single enemy id (backward compat) or pick from enemyPool. */
  enemyId: z.string().min(1).optional(),
  /** Random pool — one is picked per activation, biased toward later entries for higher rank. */
  enemyPool: z.array(z.string().min(1)).optional(),
  x: z.number(),
  y: z.number(),
  respawnMs: z.number().int().min(3000).default(54000),
  patrolRadius: z.number().min(0).default(64),
});

export const roamConfigSchema = z.object({
  id: z.string().min(1),
  spawns: z.array(roamSpawnSchema).min(1),
});

export type RoamConfig = z.infer<typeof roamConfigSchema>;
export type RoamSpawn = z.infer<typeof roamSpawnSchema>;