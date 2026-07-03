import { z } from 'zod';

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const unlockRuleSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('default') }),
  z.object({ type: z.literal('clearMap'), required: z.string().min(1) }),
  z.object({ type: z.literal('clearBoss'), required: z.string().min(1) }),
  z.object({ type: z.literal('chapterGate'), required: z.string().min(1) }),
]);

const worldMapNodeSchema = z.object({
  mapId: z.string().min(1),
  position: positionSchema,
  unlock: unlockRuleSchema,
});

const worldRegionSchema = z.object({
  chapterId: z.string().min(1),
  displayNameKey: z.string().min(1),
  position: positionSchema,
  maps: z.array(worldMapNodeSchema).min(1),
});

export const worldMapFileSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  regions: z.array(worldRegionSchema).min(1),
});

export type WorldMapFile = z.infer<typeof worldMapFileSchema>;
export type WorldRegion = z.infer<typeof worldRegionSchema>;
export type WorldMapNode = z.infer<typeof worldMapNodeSchema>;
export type UnlockRule = z.infer<typeof unlockRuleSchema>;
