import { z } from 'zod';

/** Validates content/roam/{roamId}.json — placed enemies for explore stars. */
export const roamConfigSchema = z.object({
  id: z.string().min(1),
  spawns: z
    .array(
      z.object({
        enemyId: z.string().min(1),
        x: z.number(),
        y: z.number(),
        respawnMs: z.number().int().min(3000).default(18000),
        patrolRadius: z.number().min(0).default(64),
      }),
    )
    .min(1),
});

export type RoamConfig = z.infer<typeof roamConfigSchema>;
