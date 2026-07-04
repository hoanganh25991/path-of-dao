import { z } from 'zod';

export const SAVE_VERSION = 1 as const;

/** One recorded milestone on the player's cultivation road (My Path scroll). */
export const journeyEntrySchema = z.object({
  kind: z.enum(['map_clear', 'boss', 'breakthrough', 'encounter', 'story']),
  /** What was reached: mapId / bossId / realmId / encounterId / storySceneId. */
  refId: z.string(),
  /** Where it happened, when known. */
  mapId: z.string().nullable().default(null),
  /** Strength snapshot at the moment of this step — "how strong I was here". */
  realmId: z.string(),
  level: z.number().int().min(1),
  cp: z.number().min(0),
  at: z.string(),
});

export type JourneyEntry = z.infer<typeof journeyEntrySchema>;

const baseStatsSchema = z.object({
  level: z.number().int().min(1),
  hpMax: z.number().positive(),
  manaMax: z.number().positive(),
  atk: z.number().min(0),
  def: z.number().min(0),
  crit: z.number().min(0).max(1),
  critDmg: z.number().min(1),
  speed: z.number().positive(),
  spirit: z.number().min(0),
});

export const playerSaveV1Schema = z.object({
  version: z.literal(SAVE_VERSION),
  checksum: z.string(),
  heroId: z.literal('hero.wanderer'),
  stats: baseStatsSchema,
  runtime: z.object({
    hp: z.number().min(0),
    mana: z.number().min(0),
  }),
  xp: z.number().min(0),
  realm: z.object({
    id: z.string(),
    tier: z.enum(['early', 'mid', 'late', 'peak']),
    breakthroughReady: z.boolean(),
  }),
  insights: z.record(
    z.string(),
    z.object({
      xp: z.number().min(0),
      awakened: z.boolean(),
      totalUses: z.number().int().min(0).default(0),
    }),
  ),
  equippedSkills: z
    .object({
      primary: z.string(),
      secondary: z.string(),
      ultimate: z.string(),
    })
    .default({
      primary: '',
      secondary: '',
      ultimate: '',
    }),
  unlockedSkills: z.array(z.string()).default([]),
  inventory: z.object({
    items: z.array(z.object({ id: z.string(), qty: z.number().int().min(0) })),
    gold: z.number().min(0),
  }),
  equipped: z.object({
    weapon: z.string().nullable(),
    armor: z.string().nullable(),
    accessory: z.string().nullable(),
    spirit: z.string().nullable(),
  }),
  progress: z.object({
    clearedMaps: z.array(z.string()),
    clearedBosses: z.array(z.string()),
    unlockedChapters: z.array(z.string()),
    storySeen: z.array(z.string()),
    encountersFound: z.array(z.string()),
    // default([]) keeps pre-bestiary v1 saves loadable (added in sub-plan 08).
    bestiary: z.array(z.string()).default([]),
    loreUnlocked: z.array(z.string()).default([]),
    // default([]) keeps pre-journey v1 saves loadable (added in sub-plan 28).
    journey: z.array(journeyEntrySchema).default([]),
    currentMapId: z.string().nullable(),
    weaponMilestone: z.enum(['none', 'ancient_sword']).default('none'),
  }),
  cosmetics: z
    .object({
      pet: z.string().nullable(),
    })
    .default({ pet: null }),
  settings: z.object({
    locale: z.enum(['system', 'en', 'vi']).default('system'),
    quality: z.enum(['auto', 'low', 'mid', 'high']).default('auto'),
    sfxVolume: z.number().min(0).max(1),
    musicVolume: z.number().min(0).max(1),
    fullscreen: z.boolean().default(true),
  }),
  meta: z.object({
    totalPlaySeconds: z.number().min(0),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export type PlayerSaveV1 = z.infer<typeof playerSaveV1Schema>;
