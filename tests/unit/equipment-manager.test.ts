import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { SaveManager } from '@/core/save/SaveManager';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { gameStore } from '@/core/store/gameStore';
import { EquipmentManager } from '@/progression/EquipmentManager';
import { getItemDefinition, listItemIds } from '@/progression/ItemLoader';
import { applyModifiers } from '@/progression/StatModifier';

function makeSave(overrides: Partial<PlayerSaveV1> = {}): PlayerSaveV1 {
  const base = SaveManager.createNew();
  return { ...base, ...overrides };
}

beforeEach(async () => {
  await SaveManager.destroy();
  indexedDB = new IDBFactory();
  gameStore.setState({ save: null, isLoaded: false });
  await gameStore.getState().load();
});

afterEach(async () => {
  await SaveManager.destroy();
  EventBus.clear();
});

describe('ItemLoader', () => {
  it('loads all item configs', () => {
    expect(listItemIds()).toEqual([
      'item.bracelet.copper',
      'item.ring.speed',
      'item.robe.novice',
      'item.spirit.jade',
      'item.sword.ancient',
      'item.sword.iron',
      'item.sword.wood',
    ]);
  });

  it('validates item.sword.iron modifiers', () => {
    const item = getItemDefinition('item.sword.iron');
    expect(item.slot).toBe('weapon');
    expect(item.modifiers).toHaveLength(2);
  });
});

describe('EquipmentManager', () => {
  it('new game starts with starter weapon and armor equipped', () => {
    const save = gameStore.getState().save!;
    expect(save.equipped.weapon).toBe('item.sword.wood');
    expect(save.equipped.armor).toBe('item.robe.novice');
  });

  it('rejects equip when slot does not match item type', () => {
    const save = gameStore.getState().save!;
    expect(EquipmentManager.canEquip('item.robe.novice', save, 'weapon')).toBe('wrong_slot');
  });

  it('blocks equip when required level is too low', () => {
    const save = makeSave({
      stats: { ...makeSave().stats, level: 2 },
      inventory: { items: [{ id: 'item.ring.speed', qty: 1 }], gold: 0 },
    });
    expect(EquipmentManager.canEquip('item.ring.speed', save)).toBe('level_too_low');
  });

  it('stacks modifiers from equipped items', () => {
    const save = gameStore.getState().save!;
    const modifiers = EquipmentManager.getModifiers(save.equipped);
    const resolved = applyModifiers(save.stats, modifiers);

    expect(resolved.atk).toBe(save.stats.atk + 4);
    expect(resolved.def).toBe(save.stats.def + 6);
    expect(resolved.hpMax).toBe(save.stats.hpMax + 20);
  });

  it('equips iron sword, swaps wood sword back to inventory', () => {
    gameStore.getState().patch({
      inventory: { items: [{ id: 'item.sword.iron', qty: 1 }], gold: 0 },
    });

    const result = EquipmentManager.equip('item.sword.iron');
    expect(result.ok).toBe(true);

    const save = gameStore.getState().save!;
    expect(save.equipped.weapon).toBe('item.sword.iron');
    expect(save.inventory.items).toContainEqual({ id: 'item.sword.wood', qty: 1 });

    const resolved = applyModifiers(save.stats, result.modifiers);
    expect(resolved.atk).toBe(save.stats.atk + 12);
    expect(resolved.crit).toBeCloseTo(save.stats.crit + 0.02);
  });

  it('unequip returns item to inventory and removes modifiers', () => {
    const before = EquipmentManager.getModifiers(gameStore.getState().save!.equipped);
    expect(before.length).toBeGreaterThan(0);

    const modifiers = EquipmentManager.unequip('weapon');
    const save = gameStore.getState().save!;

    expect(save.equipped.weapon).toBeNull();
    expect(save.inventory.items).toContainEqual({ id: 'item.sword.wood', qty: 1 });
    expect(modifiers.some((m) => m.stat === 'atk')).toBe(false);
  });

  it('emits equipment:changed on equip', () => {
    gameStore.getState().patch({
      inventory: { items: [{ id: 'item.sword.iron', qty: 1 }], gold: 0 },
    });

    const listener = vi.fn();
    EventBus.on('equipment:changed', listener);

    EquipmentManager.equip('item.sword.iron');
    expect(listener).toHaveBeenCalledOnce();
    const payload = listener.mock.calls[0]?.[0];
    expect(payload?.modifiers.length).toBeGreaterThan(0);
  });

  it('cannot equip item not in inventory', () => {
    const save = gameStore.getState().save!;
    gameStore.getState().patch({
      equipped: { ...save.equipped, weapon: 'item.sword.wood' },
      inventory: {
        ...save.inventory,
        items: save.inventory.items.filter((entry) => entry.id !== 'item.sword.iron'),
      },
    });

    const result = EquipmentManager.equip('item.sword.iron');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('not_in_inventory');
  });
});
