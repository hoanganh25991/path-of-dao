import { z } from 'zod';

/** Validates content/curves/level-xp.json at load; fail fast in dev. */
export const levelXpSchema = z
  .object({
    maxLevel: z.number().int().min(1).max(1000),
    xpToNext: z.array(z.number().int().min(0)),
  })
  .refine((data) => data.xpToNext.length === data.maxLevel, {
    message: 'xpToNext must have exactly maxLevel entries',
  });

export type LevelXpData = z.infer<typeof levelXpSchema>;

export const statRowSchema = z.object({
  level: z.number().int().min(1),
  hpMax: z.number().positive(),
  manaMax: z.number().positive(),
  atk: z.number().positive(),
  def: z.number().min(0),
  crit: z.number().min(0).max(1),
  critDmg: z.number().min(1),
  speed: z.number().positive(),
  spirit: z.number().min(0),
});

/** Validates content/curves/base-stats.json at load. */
export const baseStatsSchema = z.object({
  heroes: z.record(
    z.string(),
    z.object({
      levels: z.array(statRowSchema).min(1),
    }),
  ),
});

export type BaseStatsData = z.infer<typeof baseStatsSchema>;
