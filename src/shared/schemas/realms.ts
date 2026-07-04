import { z } from 'zod';

const statMultiplierSchema = z.object({
  hpMax: z.number().positive(),
  manaMax: z.number().positive(),
  atk: z.number().positive(),
  def: z.number().positive(),
  crit: z.number().positive(),
  critDmg: z.number().positive(),
  speed: z.number().positive(),
  spirit: z.number().positive(),
});

const breakthroughSchema = z.object({
  nextRealm: z.string().min(1),
  spiritCost: z.number().min(0),
  /** Tiên Ngọc (Immortal Jade) consumed from inventory when > 0. */
  jadeCost: z.number().int().min(0).default(0),
  requiredBoss: z.string().nullable(),
  requiredMap: z.string().nullable(),
});

export const realmDefinitionSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  levelMin: z.number().int().min(1),
  levelMax: z.number().int().min(1),
  displayKey: z.string().min(1),
  statMultiplier: statMultiplierSchema,
  auraTier: z.enum(['none', 'faint', 'swirling', 'void', 'true_dao']),
  breakthrough: breakthroughSchema.nullable(),
});

export const realmsFileSchema = z.object({
  realms: z.array(realmDefinitionSchema).min(1),
});

export type RealmDefinition = z.infer<typeof realmDefinitionSchema>;
export type RealmStatMultiplier = z.infer<typeof statMultiplierSchema>;
