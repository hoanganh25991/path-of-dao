import { z } from 'zod';

export const skillKindSchema = z.enum(['arc', 'bolt', 'heal']);

export const skillAwakenedOverridesSchema = z.object({
  arcHalfAngle: z.number().positive().optional(),
  arcReachBonus: z.number().min(0).optional(),
  pullForce: z.number().positive().optional(),
  skillMultiplier: z.number().positive().optional(),
  healPct: z.number().min(0).max(1).optional(),
});

export const skillDefinitionSchema = z.object({
  id: z.string().min(1),
  intent: z.enum(['sword', 'void', 'flame', 'lightning', 'time', 'life']),
  nameKey: z.string().min(1),
  kind: skillKindSchema,
  manaCost: z.number().int().min(0),
  skillMultiplier: z.number().positive(),
  awakenedOverrides: skillAwakenedOverridesSchema.optional(),
});

export type SkillDefinition = z.infer<typeof skillDefinitionSchema>;
export type SkillKind = z.infer<typeof skillKindSchema>;
export type InsightIntentId = SkillDefinition['intent'];
