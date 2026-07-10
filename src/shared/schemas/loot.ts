import { z } from 'zod';

const lootEntrySchema = z.object({
  itemId: z.string().min(1),
  weight: z.number().positive(),
  qty: z.tuple([z.number().int().min(1), z.number().int().min(1)]).optional(),
});

export const lootTableSchema = z.object({
  id: z.string().min(1),
  entries: z.array(lootEntrySchema).default([]),
  guaranteed: z
    .array(z.object({ itemId: z.string().min(1), qty: z.number().int().positive() }))
    .optional(),
});

export type LootTable = z.infer<typeof lootTableSchema>;

export const lootDropRatesSchema = z.object({
  /** Per-defeat chance for grunt-tier cultivators (category grunt or unset). */
  gruntChance: z.number().min(0).max(1).default(0.12),
  /** Per-defeat chance for elite cultivators. */
  eliteChance: z.number().min(0).max(1).default(0.28),
  /** Boss rematch — one weighted roll, no guaranteed table. */
  bossRematchChance: z.number().min(0).max(1).default(0.35),
  /** First boss clear also rolls once from table entries after guaranteed drops. */
  bossFirstClearBonusRoll: z.boolean().default(true),
});

export type LootDropRates = z.infer<typeof lootDropRatesSchema>;
