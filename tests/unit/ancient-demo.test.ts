import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import {
  buildAncientSave,
  enterAncientDemo,
  exitAncientDemo,
  hasMeaningfulProgress,
  isAncientDemoActive,
  listAncientProfiles,
  resetAncientDemoSession,
} from '@/progression/AncientDemoManager';
import { gameStore } from '@/core/store/gameStore';

beforeEach(async () => {
  resetAncientDemoSession();
  await SaveManager.destroy();
  indexedDB = new IDBFactory();
  gameStore.setState({ save: null, isLoaded: false });
  await gameStore.getState().load();
});

describe('AncientDemoManager', () => {
  it('lists three ancient cultivator profiles', () => {
    expect(listAncientProfiles()).toHaveLength(3);
  });

  it('builds void walker with awakened void and high realm', () => {
    const save = buildAncientSave('ancient.void_walker');
    expect(save.realm.id).toBe('void_spirit');
    expect(save.insights.void?.awakened).toBe(true);
    expect(save.equippedSkills.primary).toBe('skill.void.slash.awakened');
    expect(save.cosmetics.pet).toBe('pet.spirit_fox');
    expect(save.stats.level).toBeGreaterThan(50);
  });

  it('detects meaningful progress on leveled save', () => {
    const fresh = SaveManager.createNew();
    expect(hasMeaningfulProgress(fresh)).toBe(false);

    const leveled = { ...fresh, stats: { ...fresh.stats, level: 3 }, xp: 50 };
    expect(hasMeaningfulProgress(leveled)).toBe(true);
  });

  it('enter and exit restores paused journey', async () => {
    gameStore.getState().patch({ xp: 999, stats: { ...gameStore.getState().save!.stats, level: 4 } });
    await gameStore.getState().persist();

    await enterAncientDemo('ancient.sword_ancestor');
    expect(isAncientDemoActive()).toBe(true);
    expect(gameStore.getState().save!.realm.id).toBe('core_formation');

    await exitAncientDemo();
    expect(isAncientDemoActive()).toBe(false);
    expect(gameStore.getState().save!.xp).toBe(999);
    expect(gameStore.getState().save!.stats.level).toBe(4);
  });

  it('does not persist demo stats to IndexedDB while active', async () => {
    await enterAncientDemo('ancient.flame_sovereign');
    await gameStore.getState().persist();

    const fromDb = await SaveManager.load();
    expect(fromDb.stats.level).toBe(1);
  });
});
