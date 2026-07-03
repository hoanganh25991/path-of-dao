import { z } from 'zod';

export const ancientSaveTemplateSchema = z.object({
  level: z.number().int().min(1),
  realmId: z.string(),
  realmTier: z.enum(['early', 'mid', 'late', 'peak']),
  /** Override spirit after level curve (e.g. breakthrough-ready demos). */
  spirit: z.number().min(0).optional(),
  gold: z.number().int().min(0),
  awakenedIntents: z.array(z.string()),
  /** Max insight XP + uses, not yet awakened — Skills panel shows Awaken. */
  insightReadyIntents: z.array(z.string()).default([]),
  equippedSkills: z.object({
    primary: z.string(),
    secondary: z.string(),
    ultimate: z.string(),
  }),
  equipped: z.object({
    weapon: z.string().nullable(),
    armor: z.string().nullable(),
    accessory: z.string().nullable(),
    spirit: z.string().nullable(),
  }),
  inventoryItemIds: z.array(z.string()),
  pet: z.string().nullable(),
  yearsCultivated: z.number().int().min(0),
  encountersFound: z.array(z.string()).default([]),
  loreUnlocked: z.array(z.string()).default([]),
  storySeen: z.array(z.string()).default([]),
  clearedBosses: z.array(z.string()).default([]),
  clearedMaps: z.array(z.string()).default([]),
  bestiary: z.array(z.string()).default([]),
});

export const ANCIENT_START_SCENES = ['home', 'combat'] as const;

export const ANCIENT_VISUAL_THEMES = [
  'void',
  'sword',
  'flame',
  'fortune',
  'jade',
  'insight',
] as const;

/** One stop on an ancient's road — a map they conquered, the realm they held there,
 *  and the story beat that marks it. Reading these in order = "learn from history". */
export const ancientPathStepSchema = z.object({
  mapId: z.string().min(1),
  realmId: z.string(),
  storySceneId: z.string().nullable().default(null),
});

export const ancientProfileSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  epithetKey: z.string().min(1),
  loreKey: z.string().min(1),
  focusKey: z.string().min(1),
  highlightKeys: z.array(z.string()).min(1),
  visualTheme: z.enum(ANCIENT_VISUAL_THEMES).default('jade'),
  /** Skills the player may assign before walking this echo. */
  unlockedSkills: z.array(z.string()).min(3),
  startScene: z.enum(ANCIENT_START_SCENES).default('combat'),
  startMapId: z.string().min(1),
  /** Ordered road the ancient walked to reach their power (My Path parallel). */
  path: z.array(ancientPathStepSchema).default([]),
  save: ancientSaveTemplateSchema,
});

export const ancientsFileSchema = z.object({
  ancients: z.array(ancientProfileSchema).min(1),
});

export type AncientProfile = z.infer<typeof ancientProfileSchema>;
export type AncientSaveTemplate = z.infer<typeof ancientSaveTemplateSchema>;
export type AncientPathStep = z.infer<typeof ancientPathStepSchema>;
