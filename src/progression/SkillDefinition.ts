import { z } from 'zod';

export const skillKindSchema = z.enum(['arc', 'bolt', 'heal', 'meditate']);

export const skillAwakenedOverridesSchema = z.object({
  arcHalfAngle: z.number().positive().optional(),
  arcReachBonus: z.number().min(0).optional(),
  pullForce: z.number().positive().optional(),
  skillMultiplier: z.number().positive().optional(),
  healPct: z.number().min(0).max(1).optional(),
});

const skillDamageSchema = z.object({
  skillMultiplier: z.number().positive(),
  damageType: z.enum(['physical', 'spirit']).default('physical'),
});

const skillEffectSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('projectile'),
    speed: z.number().positive().default(420),
    rangePx: z.number().positive().default(400),
    hitRadius: z.number().positive().default(12),
    pullForce: z.number().positive().optional(),
    damage: skillDamageSchema,
  }),
  z.object({
    type: z.literal('melee_arc'),
    reach: z.number().positive().default(52),
    halfAngleDeg: z.number().positive().default(60),
    reachBonus: z.number().min(0).default(0),
    damage: skillDamageSchema,
  }),
  z.object({
    type: z.literal('heal'),
    healPct: z.number().min(0).max(1).default(0.1),
  }),
  z.object({
    type: z.literal('pull_field'),
    radius: z.number().positive().default(120),
    durationMs: z.number().positive().default(400),
    pullStrength: z.number().positive().default(140),
  }),
  z.object({
    type: z.literal('aoe_circle'),
    radius: z.number().positive().default(64),
    ticks: z.number().int().positive().default(1),
    tickIntervalMs: z.number().positive().default(300),
    damage: skillDamageSchema,
  }),
  z.object({
    type: z.literal('thunder_strike'),
    strikeRange: z.number().positive().default(200),
    fallHeight: z.number().positive().default(168),
    radius: z.number().positive().default(36),
    damage: skillDamageSchema,
  }),
  z.object({
    type: z.literal('thunder_chain'),
    maxJumps: z.number().int().positive().default(4),
    chainRadius: z.number().positive().default(150),
    acquireRange: z.number().positive().default(300),
    jumpDamageFalloff: z.number().min(0).max(1).default(0.78),
    damage: skillDamageSchema,
  }),
]);

export const skillVfxSchema = z.object({
  cast: z.string().optional(),
  impact: z.string().optional(),
});

export const skillDefinitionSchema = z.object({
  id: z.string().min(1),
  intent: z.enum(['sword', 'truth_falsehood', 'flame', 'lightning', 'cause_effect', 'life_death', 'basic']),
  nameKey: z.string().min(1),
  kind: skillKindSchema,
  manaCost: z.number().int().min(0),
  skillMultiplier: z.number().positive(),
  cooldownMs: z.number().int().positive().optional(),
  castTimeMs: z.number().int().min(0).optional(),
  effects: z.array(skillEffectSchema).optional(),
  vfx: skillVfxSchema.optional(),
  awakenedOverrides: skillAwakenedOverridesSchema.optional(),
});

export type SkillDefinition = z.infer<typeof skillDefinitionSchema>;
export type SkillKind = z.infer<typeof skillKindSchema>;
export type InsightIntentId = SkillDefinition['intent'];
export type SkillEffect = z.infer<typeof skillEffectSchema>;
export type SkillDamage = z.infer<typeof skillDamageSchema>;
