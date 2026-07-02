import { z } from 'zod';

export const SAVE_VERSION = 1 as const;

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
    }),
  ),
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
    currentMapId: z.string().nullable(),
  }),
  settings: z.object({
    locale: z.enum(['en', 'vi']),
    sfxVolume: z.number().min(0).max(1),
    musicVolume: z.number().min(0).max(1),
  }),
  meta: z.object({
    totalPlaySeconds: z.number().min(0),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export type PlayerSaveV1 = z.infer<typeof playerSaveV1Schema>;
