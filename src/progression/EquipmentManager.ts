import { EventBus } from '@/core/EventBus';
import { SaveManager } from '@/core/save/SaveManager';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { gameStore } from '@/core/store/gameStore';
import { notifyCombatPowerChanged } from '@/progression/CombatPower';
import { patchAncientSwordMilestone } from '@/progression/WeaponProgression';
import {
  type EquipmentSlot,
  type EquipmentSlots,
  EQUIPMENT_SLOTS,
} from '@/progression/ItemDefinition';
import { getItemDefinition } from '@/progression/ItemLoader';
import type { StatModifier } from '@/progression/StatModifier';

export type EquipFailureReason =
  | 'unknown_item'
  | 'wrong_slot'
  | 'level_too_low'
  | 'not_in_inventory';

export interface EquipResult {
  ok: boolean;
  reason?: EquipFailureReason;
  modifiers: StatModifier[];
}

function inventoryQty(items: PlayerSaveV1['inventory']['items'], itemId: string): number {
  return items.find((entry) => entry.id === itemId)?.qty ?? 0;
}

function addToInventory(
  items: PlayerSaveV1['inventory']['items'],
  itemId: string,
  qty: number,
): PlayerSaveV1['inventory']['items'] {
  const next = items.map((entry) =>
    entry.id === itemId ? { ...entry, qty: entry.qty + qty } : entry,
  );
  if (!next.some((entry) => entry.id === itemId)) {
    next.push({ id: itemId, qty });
  }
  return next;
}

function removeFromInventory(
  items: PlayerSaveV1['inventory']['items'],
  itemId: string,
  qty: number,
): PlayerSaveV1['inventory']['items'] {
  return items
    .map((entry) => (entry.id === itemId ? { ...entry, qty: entry.qty - qty } : entry))
    .filter((entry) => entry.qty > 0);
}

function itemModifiers(itemId: string, slot: EquipmentSlot): StatModifier[] {
  const def = getItemDefinition(itemId);
  return def.modifiers.map((mod, index) => ({
    id: `equip:${slot}:${itemId}:${index}`,
    stat: mod.stat,
    kind: mod.kind,
    value: mod.value,
  }));
}

/**
 * Equip/unequip logic — inventory ↔ equipped slots, stat modifiers, events.
 */
export class EquipmentManager {
  static canEquip(
    itemId: string,
    save: PlayerSaveV1,
    slot?: EquipmentSlot,
  ): EquipFailureReason | null {
    let def;
    try {
      def = getItemDefinition(itemId);
    } catch {
      return 'unknown_item';
    }

    if (slot && def.slot !== slot) return 'wrong_slot';
    if (save.stats.level < def.requiredLevel) return 'level_too_low';

    const inInventory = inventoryQty(save.inventory.items, itemId) > 0;
    const alreadyEquipped = EQUIPMENT_SLOTS.some((s) => save.equipped[s] === itemId);
    if (!inInventory && !alreadyEquipped) return 'not_in_inventory';

    return null;
  }

  static getModifiers(equipped: EquipmentSlots): StatModifier[] {
    const modifiers: StatModifier[] = [];
    for (const slot of EQUIPMENT_SLOTS) {
      const itemId = equipped[slot];
      if (!itemId) continue;
      modifiers.push(...itemModifiers(itemId, slot));
    }
    return modifiers;
  }

  static equip(itemId: string): EquipResult {
    const save = gameStore.getState().save;
    if (!save) {
      throw new Error('EquipmentManager.equip called before save loaded');
    }

    const failure = EquipmentManager.canEquip(itemId, save);
    if (failure) {
      return { ok: false, reason: failure, modifiers: EquipmentManager.getModifiers(save.equipped) };
    }

    const def = getItemDefinition(itemId);
    const slot = def.slot;
    const previous = save.equipped[slot];

    let items = save.inventory.items;
    const inInventory = inventoryQty(items, itemId) > 0;

    if (previous && previous !== itemId) {
      items = addToInventory(items, previous, 1);
    }

    if (inInventory) {
      items = removeFromInventory(items, itemId, 1);
    }

    const equipped: EquipmentSlots = { ...save.equipped, [slot]: itemId };
    const modifiers = EquipmentManager.getModifiers(equipped);
    const milestonePatch = patchAncientSwordMilestone(save, itemId);

    gameStore.getState().patch({
      inventory: { ...save.inventory, items },
      equipped: milestonePatch?.equipped ?? equipped,
      ...(milestonePatch?.progress ? { progress: milestonePatch.progress } : {}),
    });

    EventBus.emit('equipment:changed', { modifiers });
    notifyCombatPowerChanged(gameStore.getState().save!);
    SaveManager.scheduleAutosave();

    return { ok: true, modifiers };
  }

  static unequip(slot: EquipmentSlot): StatModifier[] {
    const save = gameStore.getState().save;
    if (!save) {
      throw new Error('EquipmentManager.unequip called before save loaded');
    }

    const itemId = save.equipped[slot];
    if (!itemId) {
      return EquipmentManager.getModifiers(save.equipped);
    }

    const items = addToInventory(save.inventory.items, itemId, 1);
    const equipped: EquipmentSlots = { ...save.equipped, [slot]: null };
    const modifiers = EquipmentManager.getModifiers(equipped);

    gameStore.getState().patch({
      inventory: { ...save.inventory, items },
      equipped,
    });

    EventBus.emit('equipment:changed', { modifiers });
    notifyCombatPowerChanged(gameStore.getState().save!);
    SaveManager.scheduleAutosave();

    return modifiers;
  }

  /** Apply all equipped item visuals to the hero viewer. */
  static async syncHeroEquipment(
    equipped: EquipmentSlots,
    attach: (slot: EquipmentSlot, modelId: string | null) => void | Promise<void>,
  ): Promise<void> {
    for (const slot of EQUIPMENT_SLOTS) {
      const itemId = equipped[slot];
      if (!itemId) {
        await attach(slot, null);
        continue;
      }
      await attach(slot, getItemDefinition(itemId).modelId);
    }
  }
}
