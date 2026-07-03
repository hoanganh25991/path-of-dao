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
