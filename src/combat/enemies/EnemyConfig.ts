import { z } from 'zod';

export const ENEMY_ARCHETYPES = [
  'melee_chaser',
  'ranged_kiter',
  'stationary',
  'patrol',
  'boss',
] as const;

export type EnemyArchetype = (typeof ENEMY_ARCHETYPES)[number];

/** Validates content/enemies/{enemyId}.json at load (sub-plan 08 §4). */
export const enemyConfigSchema = z.object({
  id: z.string().min(1),
  displayNameKey: z.string().min(1),
  archetype: z.enum(ENEMY_ARCHETYPES),
  stats: z.object({
    hpMax: z.number().positive(),
    atk: z.number().min(0),
    def: z.number().min(0),
    /** Movement stat, same scale as the player (100 → 180 px/s). */
    speed: z.number().min(0),
    crit: z.number().min(0).max(1),
    critDmg: z.number().min(1),
  }),
  aggroRange: z.number().positive(),
  attackRange: z.number().positive(),
  attackCooldownMs: z.number().positive(),
  xpReward: z.number().min(0),
  goldReward: z.tuple([z.number().int().min(0), z.number().int().min(0)]),
  lootTable: z.string().nullable(),
  spriteKey: z.string().min(1),
  /** When set, killing this enemy appends the id to progress.clearedBosses. */
  bossClearId: z.string().nullable().optional(),
});

export type EnemyConfig = z.infer<typeof enemyConfigSchema>;

export const encounterConfigSchema = z.object({
  id: z.string().min(1),
  waves: z
    .array(
      z.object({
        trigger: z.enum(['onEnter', 'onWaveCleared']),
        enemies: z.array(
          z.object({
            id: z.string().min(1),
            count: z.number().int().positive(),
            spread: z.number().min(0),
          }),
        ),
      }),
    )
    .min(1),
});

export type EncounterConfig = z.infer<typeof encounterConfigSchema>;
