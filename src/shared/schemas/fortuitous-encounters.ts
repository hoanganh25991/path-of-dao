import { z } from 'zod';

export const ENCOUNTER_TRIGGERS = [
  'mapEnter',
  'waveClear',
  'killStreak',
  'poiHiddenCave',
  'poiAncientSword',
  'bossRematch',
] as const;

export type EncounterTriggerKind = (typeof ENCOUNTER_TRIGGERS)[number];

const rewardSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('item'),
    itemIds: z.array(z.string()).min(1),
  }),
  z.object({
    type: z.literal('gold_insight'),
    gold: z.number().int().min(0),
    intentId: z.string(),
    xpGain: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('pet'),
    petId: z.string(),
  }),
  z.object({
    type: z.literal('lore'),
    loreId: z.string(),
  }),
  z.object({
    type: z.literal('skill_variant'),
    skillId: z.string(),
  }),
]);

export const encounterDefinitionSchema = z.object({
  id: z.string().min(1),
  displayNameKey: z.string().min(1),
  flavorKey: z.string().min(1),
  theme: z.string().min(1),
  trigger: z.enum(ENCOUNTER_TRIGGERS),
  unique: z.boolean(),
  rate: z.number().min(0).max(1).default(0),
  killStreakThreshold: z.number().int().min(1).optional(),
  reward: rewardSchema,
});

export type EncounterDefinition = z.infer<typeof encounterDefinitionSchema>;
export type EncounterReward = z.infer<typeof rewardSchema>;

export const encounterTablesSchema = z.object({
  spiritRateBonusPerPoint: z.number().min(0).default(0.0002),
  discoveryRateBonusPerMap: z.number().min(0).default(0.001),
  pityMinutes: z.number().min(0).default(25),
  pityEnabled: z.boolean().default(false),
  devRateMultiplier: z.number().min(1).default(1),
});

export type EncounterTables = z.infer<typeof encounterTablesSchema>;
