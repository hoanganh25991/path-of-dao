import { z } from 'zod';

export const insightXpSourcesSchema = z.object({
  skillUse: z.number().positive(),
  critKill: z.number().positive(),
  bossHit: z.number().positive(),
  shrineDiscovery: z.number().positive(),
});

export const insightIntentSchema = z.object({
  displayKey: z.string().min(1),
  baseSkillId: z.string().min(1),
  awakenedSkillId: z.string().min(1),
  awakenRequirement: z.object({
    minRealm: z.string().min(1),
    minUses: z.number().int().min(0),
    xp: z.number().positive(),
  }),
  xpSources: insightXpSourcesSchema,
});

export const insightsFileSchema = z.object({
  xpToFull: z.number().positive(),
  intents: z.record(z.string(), insightIntentSchema),
});

export type InsightIntentConfig = z.infer<typeof insightIntentSchema>;
export type InsightsFile = z.infer<typeof insightsFileSchema>;
export type InsightXpSourceKey = keyof z.infer<typeof insightXpSourcesSchema>;
