import { z } from 'zod';

export const CULTIVATOR_ARCHETYPES = [
  'melee_chaser',
  'ranged_kiter',
  'stationary',
  'patrol',
  'boss',
] as const;

export type CultivatorArchetype = (typeof CULTIVATOR_ARCHETYPES)[number];

/** @deprecated Use CULTIVATOR_ARCHETYPES — content JSON still validates against this alias. */
export const ENEMY_ARCHETYPES = CULTIVATOR_ARCHETYPES;
/** @deprecated Use CultivatorArchetype */
export type EnemyArchetype = CultivatorArchetype;

const bossPhaseSchema = z.object({
  hpThreshold: z.number().min(0).max(1),
  skills: z.array(z.string()).optional(),
  spawnAdds: z
    .array(z.object({ id: z.string().min(1), count: z.number().int().positive() }))
    .optional(),
});

export type BossPhaseConfig = z.infer<typeof bossPhaseSchema>;

/** Validates content/enemies/{id}.json at load (sub-plan 08 §4). */
export const cultivatorConfigSchema = z.object({
  id: z.string().min(1),
  displayNameKey: z.string().min(1),
  archetype: z.enum(CULTIVATOR_ARCHETYPES),
  category: z.enum(['grunt', 'elite', 'boss']).optional(),
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
  /** When set, defeating this cultivator appends the id to progress.clearedBosses. */
  bossClearId: z.string().nullable().optional(),
  phases: z.array(bossPhaseSchema).optional(),
  bestiaryKey: z.string().optional(),
  weakness: z.string().optional(),
  resistance: z.string().optional(),
});

export type CultivatorConfig = z.infer<typeof cultivatorConfigSchema>;

/** @deprecated Use cultivatorConfigSchema */
export const enemyConfigSchema = cultivatorConfigSchema;
/** @deprecated Use CultivatorConfig */
export type EnemyConfig = CultivatorConfig;

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
