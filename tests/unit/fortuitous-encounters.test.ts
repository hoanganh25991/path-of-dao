import { beforeEach, describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import { getEncounterDefinition, listEncounterIds } from '@/progression/EncounterLoader';
import {
  applyEncounterReward,
  resetEncounterRng,
  rollOnKillStreak,
  rollOnMapEnter,
  setEncounterRng,
  wasFound,
  wasPoiFound,
} from '@/progression/FortuitousEncounterManager';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';

function makeSave(overrides: Partial<PlayerSaveV1> = {}): PlayerSaveV1 {
  const base = SaveManager.createNew();
  return { ...base, ...overrides };
}

beforeEach(() => {
  resetEncounterRng();
});

describe('FortuitousEncounterManager', () => {
  it('rolls map enter when RNG below rate', () => {
    setEncounterRng(() => 0.01);
    const save = makeSave();
    const encounter = rollOnMapEnter('map.test.grove', save);
    expect(encounter?.id).toBe('encounter.ancient_inheritance');
  });

  it('skips unique encounter when already found', () => {
    setEncounterRng(() => 0.01);
    const save = makeSave({
      progress: {
        ...makeSave().progress,
        encountersFound: ['encounter.ancient_inheritance'],
      },
    });
    expect(rollOnMapEnter('map.test.grove', save)).toBeNull();
  });

  it('respects kill streak threshold', () => {
    setEncounterRng(() => 0.005);
    const save = makeSave();
    expect(rollOnKillStreak(9, save)).toBeNull();
    expect(rollOnKillStreak(10, save)?.id).toBe('encounter.forgotten_memory');
  });

  it('skips forgotten memory after lore is already unlocked', () => {
    setEncounterRng(() => 0.005);
    const save = makeSave({
      progress: {
        ...makeSave().progress,
        encountersFound: ['encounter.forgotten_memory'],
        loreUnlocked: ['lore.fallen_village.memory_01'],
      },
    });
    expect(rollOnKillStreak(10, save)).toBeNull();
  });

  it('apply forgotten memory unlocks lore once', () => {
    const save = makeSave();
    const encounter = getEncounterDefinition('encounter.forgotten_memory');
    const next = { ...save, ...applyEncounterReward(encounter, save) };

    expect(wasFound(encounter.id, next)).toBe(true);
    expect(next.progress.loreUnlocked).toContain('lore.fallen_village.memory_01');
  });

  it('apply inheritance adds epic item to inventory', () => {
    setEncounterRng(() => 0.99);
    const save = makeSave();
    const encounter = getEncounterDefinition('encounter.ancient_inheritance');
    const next = { ...save, ...applyEncounterReward(encounter, save) };

    expect(wasFound(encounter.id, next)).toBe(true);
    expect(next.inventory.items.some((item) => item.id === 'item.spirit.jade')).toBe(true);
  });

  it('apply ancient sword POI sets milestone and equips blade', () => {
    const save = makeSave();
    const encounter = getEncounterDefinition('encounter.ancient_sword');
    const next = { ...save, ...applyEncounterReward(encounter, save, 'sword.fallen_village') };

    expect(next.progress.weaponMilestone).toBe('ancient_sword');
    expect(next.equipped?.weapon).toBe('item.sword.ancient');
    expect(next.inventory.items.some((item) => item.id === 'item.sword.ancient')).toBe(false);
  });

  it('POI encounter tracks per poi key', () => {
    const save = makeSave({ progress: { ...makeSave().progress, currentMapId: 'map.test.grove' } });
    const encounter = getEncounterDefinition('encounter.hidden_cave');
    const poiKey = 'cave.grove';
    const next = { ...save, ...applyEncounterReward(encounter, save, poiKey) };

    expect(wasPoiFound(encounter.id, poiKey, next)).toBe(true);
    expect(wasFound(encounter.id, next)).toBe(false);
    expect(next.inventory.gold).toBeGreaterThan(0);
    expect(next.progress.journey.some((e) => e.kind === 'encounter' && e.refId.includes(poiKey))).toBe(
      true,
    );
  });

  it('secret manual unlocks and equips a skill variant', () => {
    const save = makeSave();
    const encounter = getEncounterDefinition('encounter.secret_manual');
    const next = { ...save, ...applyEncounterReward(encounter, save) };

    expect(next.unlockedSkills).toContain('skill.flame.bolt');
    expect(Object.values(next.equippedSkills ?? {})).toContain('skill.flame.bolt');
  });

  it('spirit beast unlocks pet cosmetic', () => {
    const save = makeSave();
    const encounter = getEncounterDefinition('encounter.spirit_beast');
    const next = { ...save, ...applyEncounterReward(encounter, save) };
    expect(next.cosmetics.pet).toBe('pet.spirit_fox');
  });
});

describe('EncounterLoader', () => {
  it('loads all six MVP encounter types', () => {
    expect(listEncounterIds()).toEqual(
      [
        'encounter.ancient_inheritance',
        'encounter.ancient_sword',
        'encounter.forgotten_memory',
        'encounter.hidden_cave',
        'encounter.secret_manual',
        'encounter.spirit_beast',
      ].sort(),
    );
  });
});
