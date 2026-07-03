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
  listAncientProfilesGrouped,
  resetAncientDemoSession,
} from '@/progression/AncientDemoManager';
import { checkAwakeningReady } from '@/progression/InsightSystem';
import { gameStore } from '@/core/store/gameStore';

beforeEach(async () => {
  resetAncientDemoSession();
  await SaveManager.destroy();
  indexedDB = new IDBFactory();
  gameStore.setState({ save: null, isLoaded: false });
  await gameStore.getState().load();
});

describe('AncientDemoManager', () => {
  it('lists six ancient cultivator profiles', () => {
    expect(listAncientProfiles()).toHaveLength(6);
    expect(listAncientProfilesGrouped()).toHaveLength(5);
  });

  it('breakthrough sage is ready to cultivate', () => {
    const save = buildAncientSave('ancient.breakthrough_sage');
    expect(save.realm.id).toBe('qi_condensation');
    expect(save.realm.breakthroughReady).toBe(true);
    expect(save.stats.spirit).toBeGreaterThanOrEqual(50);
  });

  it('insight seeker can awaken void and sword', () => {
    const save = buildAncientSave('ancient.insight_seeker');
    expect(checkAwakeningReady(save, 'void')).toBe(true);
    expect(checkAwakeningReady(save, 'sword')).toBe(true);
    expect(save.insights.void?.awakened).toBe(false);
  });

  it('fortune emissary has all encounter types recorded', () => {
    const save = buildAncientSave('ancient.fortune_emissary');
    expect(save.progress.encountersFound.length).toBeGreaterThanOrEqual(6);
    expect(save.progress.loreUnlocked.length).toBeGreaterThanOrEqual(2);
    expect(save.cosmetics.pet).toBe('pet.spirit_fox');
  });

  it('builds void walker with awakened void and high realm', () => {
    const save = buildAncientSave('ancient.void_walker');
    expect(save.realm.id).toBe('void_spirit');
    expect(save.insights.void?.awakened).toBe(true);
    expect(save.equippedSkills.primary).toBe('skill.void.slash.awakened');
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

  it('enter with custom loadout applies equipped skills', async () => {
    await enterAncientDemo('ancient.sword_ancestor', {
      primary: 'skill.lightning.strike.awakened',
      secondary: 'skill.sword.slash.awakened',
      ultimate: 'skill.flame.bolt.awakened',
    });
    expect(gameStore.getState().save!.equippedSkills.primary).toBe('skill.lightning.strike.awakened');
    await exitAncientDemo();
  });

  it('each ancient exposes at least four unlocked skills', () => {
    for (const profile of listAncientProfiles()) {
      expect(profile.unlockedSkills.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('does not persist demo stats to IndexedDB while active', async () => {
    await enterAncientDemo('ancient.flame_sovereign');
    await gameStore.getState().persist();

    const fromDb = await SaveManager.load();
    expect(fromDb.stats.level).toBe(1);
  });
});
