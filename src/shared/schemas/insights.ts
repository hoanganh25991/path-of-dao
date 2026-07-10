import { z } from 'zod';

export const insightXpSourcesSchema = z.object({
  skillUse: z.number().positive(),
  critKill: z.number().positive(),
  bossHit: z.number().positive(),
  shrineDiscovery: z.number().positive(),
});

/** Gate-flow unlock rule (plan 14 redesign) — independent milestone, not part of the main chain. */
export const insightGateSchema = z.object({
  kind: z.enum(['weaponMilestone', 'bossCleared']),
  value: z.string().min(1),
});

export const insightIntentSchema = z.object({
  displayKey: z.string().min(1),
  /** main = sequential curriculum (life_death → cause_effect → truth_falsehood); gate = independent milestone. */
  flow: z.enum(['main', 'gate']),
  /** Main-flow position (1-based) — next intent locked until the previous order's is awakened. */
  order: z.number().int().min(1).optional(),
  /** Required when flow is "gate" — the road milestone that unlocks this intent. */
  gate: insightGateSchema.optional(),
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
