import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { SaveManager } from '@/core/save/SaveManager';
import { gameStore } from '@/core/store/gameStore';

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
    gameStore.getState().patch({ xp: 999 });
    await gameStore.getState().persist();

    await gameStore.getState().newGame();
    expect(gameStore.getState().save?.xp).toBe(0);

    const loaded = await SaveManager.load();
    expect(loaded.xp).toBe(0);
  });
});
