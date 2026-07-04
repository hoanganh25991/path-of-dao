import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { SaveManager } from '@/core/save/SaveManager';
import { gameStore } from '@/core/store/gameStore';
import {
  enterAncientDemo,
  hasJourneyBackup,
  isAncientDemoActive,
} from '@/progression/AncientDemoManager';
import {
  computeCombatPowerFromSave,
  yearsCultivated,
} from '@/progression/CombatPower';
import { getRealmOrder } from '@/progression/RealmStatScaling';

beforeEach(async () => {
  await SaveManager.destroy();
  indexedDB = new IDBFactory();
  gameStore.setState({ save: null, isLoaded: false });
});

afterEach(async () => {
  await SaveManager.destroy();
  EventBus.clear();
});

describe('gameStore', () => {
  it('load creates a new game when no save exists', async () => {
    await gameStore.getState().load();

    const { save, isLoaded } = gameStore.getState();
    expect(isLoaded).toBe(true);
    expect(save?.stats.level).toBe(1);
    expect(SaveManager.hasSave).toBe(true);
  });

  it('patch merges immutably and bumps updatedAt', async () => {
    await gameStore.getState().load();
    const before = gameStore.getState().save!;

    await new Promise((resolve) => setTimeout(resolve, 5));
    gameStore.getState().patch({ xp: 250 });

    const after = gameStore.getState().save!;
    expect(after).not.toBe(before);
    expect(after.xp).toBe(250);
    expect(before.xp).toBe(0);
    expect(after.meta.updatedAt >= before.meta.updatedAt).toBe(true);
  });

  it('patch accepts a function of current state', async () => {
    await gameStore.getState().load();
    gameStore.getState().patch({ xp: 100 });
    gameStore.getState().patch((s) => ({ xp: s.xp + 50 }));
    expect(gameStore.getState().save?.xp).toBe(150);
  });

  it('persist writes through to IndexedDB', async () => {
    await gameStore.getState().load();
    gameStore.getState().patch({ xp: 777 });
    await gameStore.getState().persist();

    const loaded = await SaveManager.load();
    expect(loaded.xp).toBe(777);
  });

  it('load restores previously persisted save', async () => {
    await gameStore.getState().load();
    gameStore.getState().patch({ xp: 42 });
    await gameStore.getState().persist();

    // Simulate app restart: destroy manager, keep DB contents.
    await SaveManager.destroy();
    gameStore.setState({ save: null, isLoaded: false });

    await gameStore.getState().load();
    expect(gameStore.getState().save?.xp).toBe(42);
  });

  it('newGame resets progress', async () => {
    await gameStore.getState().load();
    gameStore.getState().patch({
      xp: 999,
      meta: { ...gameStore.getState().save!.meta, totalPlaySeconds: 86_400 * 20 },
    });
    await gameStore.getState().persist();

    await gameStore.getState().newGame();
    const save = gameStore.getState().save!;
    expect(save.xp).toBe(0);
    expect(save.meta.totalPlaySeconds).toBe(0);
    expect(save.realm.id).toBe('mortal_body');
    expect(computeCombatPowerFromSave(save)).toBe(844);
    expect(
      yearsCultivated(save.meta.totalPlaySeconds, getRealmOrder(save.realm.id)),
    ).toBe(0);

    const loaded = await SaveManager.load();
    expect(loaded.xp).toBe(0);
    expect(loaded.meta.totalPlaySeconds).toBe(0);
  });

  it('persist does not overwrite a newer save after newGame', async () => {
    await gameStore.getState().load();
    gameStore.getState().patch({
      realm: { id: 'foundation_establishment', tier: 'peak', breakthroughReady: false },
      meta: { ...gameStore.getState().save!.meta, totalPlaySeconds: 999_999 },
    });

    let resolveSave!: () => void;
    const saveGate = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });

    const originalSave = SaveManager.save.bind(SaveManager);
    vi.spyOn(SaveManager, 'save').mockImplementation(async (state, slot) => {
      if (state.meta.totalPlaySeconds === 999_999) {
        await saveGate;
      }
      return originalSave(state, slot);
    });

    const slowPersist = gameStore.getState().persist();
    await gameStore.getState().newGame({ preserveSettings: true });
    resolveSave();
    await slowPersist;

    const loaded = await SaveManager.load();
    expect(loaded.meta.totalPlaySeconds).toBe(0);
    expect(loaded.realm.id).toBe('mortal_body');
    expect(computeCombatPowerFromSave(loaded)).toBe(844);

    vi.restoreAllMocks();
  });

  it('newGame preserves settings when requested', async () => {
    await gameStore.getState().load();
    gameStore.getState().patch({
      xp: 500,
      settings: { locale: 'vi', quality: 'high', sfxVolume: 0.4, musicVolume: 0.6, fullscreen: true },
    });
    await gameStore.getState().persist();

    await gameStore.getState().newGame({ preserveSettings: true });

    const save = gameStore.getState().save!;
    expect(save.xp).toBe(0);
    expect(save.settings).toEqual({
      locale: 'vi',
      quality: 'high',
      sfxVolume: 0.4,
      musicVolume: 0.6,
      fullscreen: true,
    });

    const loaded = await SaveManager.load();
    expect(loaded.settings.locale).toBe('vi');
    expect(loaded.xp).toBe(0);
  });

  it('newGame resets combat power and cultivation years', async () => {
    await gameStore.getState().load();
    gameStore.getState().patch({
      realm: { id: 'foundation_establishment', tier: 'peak', breakthroughReady: false },
      meta: { ...gameStore.getState().save!.meta, totalPlaySeconds: 86_400 * 5 },
    });

    const before = gameStore.getState().save!;
    expect(computeCombatPowerFromSave(before)).toBeGreaterThan(844);
    expect(
      yearsCultivated(before.meta.totalPlaySeconds, getRealmOrder(before.realm.id)),
    ).toBeGreaterThan(0);

    await gameStore.getState().newGame({ preserveSettings: true });

    const after = gameStore.getState().save!;
    expect(after.realm.id).toBe('mortal_body');
    expect(after.meta.totalPlaySeconds).toBe(0);
    expect(computeCombatPowerFromSave(after)).toBe(844);
    expect(
      yearsCultivated(after.meta.totalPlaySeconds, getRealmOrder(after.realm.id)),
    ).toBe(0);
  });

  it('newGame clears ancient demo session and journey backup', async () => {
    await gameStore.getState().load();
    gameStore.getState().patch({ xp: 500 });
    await enterAncientDemo('ancient.breakthrough_sage');

    expect(isAncientDemoActive()).toBe(true);
    expect(hasJourneyBackup()).toBe(true);

    await gameStore.getState().newGame({ preserveSettings: true });

    expect(isAncientDemoActive()).toBe(false);
    expect(hasJourneyBackup()).toBe(false);
    expect(gameStore.getState().save?.xp).toBe(0);
    expect(gameStore.getState().save?.realm.id).toBe('mortal_body');
  });
});
