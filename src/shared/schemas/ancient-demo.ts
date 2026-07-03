import { z } from 'zod';

export const ancientSaveTemplateSchema = z.object({
  level: z.number().int().min(1),
  realmId: z.string(),
  realmTier: z.enum(['early', 'mid', 'late', 'peak']),
  gold: z.number().int().min(0),
  awakenedIntents: z.array(z.string()),
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

export const ancientProfileSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  epithetKey: z.string().min(1),
  loreKey: z.string().min(1),
  highlightKeys: z.array(z.string()).min(1),
  startMapId: z.string().min(1),
  save: ancientSaveTemplateSchema,
});

export const ancientsFileSchema = z.object({
  ancients: z.array(ancientProfileSchema).min(1),
});

export type AncientProfile = z.infer<typeof ancientProfileSchema>;
export type AncientSaveTemplate = z.infer<typeof ancientSaveTemplateSchema>;
