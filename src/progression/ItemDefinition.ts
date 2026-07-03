import { z } from 'zod';
import type { ModifiableStat } from '@/progression/types';

export const EQUIPMENT_SLOTS = ['weapon', 'armor', 'accessory', 'spirit'] as const;
export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];

export const ITEM_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
export type ItemRarity = (typeof ITEM_RARITIES)[number];

export type EquipmentSlots = Record<EquipmentSlot, string | null>;

const modifiableStatSchema = z.enum([
  'hpMax',
  'manaMax',
  'atk',
  'def',
  'crit',
  'critDmg',
  'speed',
  'spirit',
]) satisfies z.ZodType<ModifiableStat>;

/** Validates content/items/{itemId}.json at load (sub-plan 11 §4). */
export const itemDefinitionSchema = z.object({
  id: z.string().min(1),
  displayNameKey: z.string().min(1),
  descriptionKey: z.string().min(1),
  slot: z.enum(EQUIPMENT_SLOTS),
  rarity: z.enum(ITEM_RARITIES),
  modelId: z.string().min(1),
  modifiers: z.array(
    z.object({
      stat: modifiableStatSchema,
      kind: z.enum(['flat', 'percent']),
      value: z.number(),
    }),
  ),
  requiredLevel: z.number().int().min(1),
});

export type ItemDefinition = z.infer<typeof itemDefinitionSchema>;
