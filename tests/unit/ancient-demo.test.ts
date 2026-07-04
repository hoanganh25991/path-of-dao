import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import {
  buildAncientSave,
  enterAncientDemo,
  exitAncientDemo,
  getAncientPath,
  hasMeaningfulProgress,
  isAncientDemoActive,
  listAncientProfiles,
  listAncientProfilesGrouped,
  resetAncientDemoSession,
} from '@/progression/AncientDemoManager';
import { checkAwakeningReady } from '@/progression/InsightSystem';
import { findWorldMapNode } from '@/progression/WorldMapLoader';
import { getRealmOrder } from '@/progression/RealmStatScaling';
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
    expect(save.equippedSkills[0]).toBe('skill.void.slash.awakened');
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

  it('enter applies normalized default loadout', async () => {
    await enterAncientDemo('ancient.sword_ancestor');
    const skills = gameStore.getState().save!.equippedSkills;
    expect(new Set(skills.filter(Boolean)).size).toBe(3);
    await exitAncientDemo();
  });

  it('buildAncientSave seeds profile unlocked skills', () => {
    const save = buildAncientSave('ancient.sword_ancestor');
    expect(save.unlockedSkills).toContain('skill.sword.slash.awakened');
    expect(save.equippedSkills[0]).toBe('skill.sword.slash.awakened');
    expect(save.equippedSkills[2]).toBe('skill.flame.bolt.awakened');
  });

  it('enter replaces hero loadout and exit restores it', async () => {
    const heroLoadout = [
      'skill.void.slash',
      'skill.sword.slash',
      'skill.sword.crescent.v1',
      '',
      '',
      '',
    ] as const;
    gameStore.getState().patch({
      xp: 100,
      stats: { ...gameStore.getState().save!.stats, level: 3 },
      equippedSkills: [...heroLoadout],
      unlockedSkills: heroLoadout.filter(Boolean),
    });

    await enterAncientDemo('ancient.breakthrough_sage');
    expect(gameStore.getState().save!.equippedSkills).toEqual([
      'skill.void.slash',
      'skill.sword.slash',
      'skill.flame.bolt',
      '',
      '',
      '',
    ]);

    await exitAncientDemo();
    expect(gameStore.getState().save!.equippedSkills).toEqual([...heroLoadout]);
  });

  it('each ancient exposes at least four unlocked skills', () => {
    for (const profile of listAncientProfiles()) {
      expect(profile.unlockedSkills.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('each ancient has an ordered road of real maps', () => {
    for (const profile of listAncientProfiles()) {
      const path = getAncientPath(profile.id);
      expect(path.length).toBeGreaterThanOrEqual(2);

      let prevOrder = 0;
      for (const step of path) {
        expect(findWorldMapNode(step.mapId)).not.toBeNull();
        const order = getRealmOrder(step.realmId);
        expect(order).toBeGreaterThanOrEqual(prevOrder);
        prevOrder = order;
      }
    }
  });

  it('does not persist demo stats to IndexedDB while active', async () => {
    await enterAncientDemo('ancient.flame_sovereign');
    await gameStore.getState().persist();

    const fromDb = await SaveManager.load();
    expect(fromDb.stats.level).toBe(1);
  });
});
