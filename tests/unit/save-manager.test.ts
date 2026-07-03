import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { checksumOf } from '@/core/save/checksum';
import { migrate, SaveMigrationError } from '@/core/save/SaveMigration';
import { SaveCorruptError, SaveManager } from '@/core/save/SaveManager';
import { DB_NAME, DB_VERSION, STORE_NAME, slotKey } from '@/core/save/SaveSlot';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';

async function resetDb(): Promise<void> {
  await SaveManager.destroy();
  indexedDB = new IDBFactory();
}

/** Write raw data straight into IndexedDB, bypassing SaveManager. */
async function writeRaw(data: unknown, slot = 0): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, DB_VERSION);
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains(STORE_NAME)) {
        open.result.createObjectStore(STORE_NAME);
      }
    };
    open.onsuccess = () => {
      const tx = open.result.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(data, slotKey(slot));
      tx.oncomplete = () => {
        open.result.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };
    open.onerror = () => reject(open.error);
  });
}

beforeEach(async () => {
  await resetDb();
});

afterEach(async () => {
  await SaveManager.destroy();
  EventBus.clear();
  vi.useRealTimers();
});

describe('SaveManager', () => {
  it('createNew produces a valid level-1 save with correct checksum', () => {
    const save = SaveManager.createNew();
    expect(save.version).toBe(1);
    expect(save.stats.level).toBe(1);
    expect(save.stats.hpMax).toBe(100);
    expect(save.runtime.hp).toBe(save.stats.hpMax);
    expect(save.progress.unlockedChapters).toEqual(['chapter.01.fallen_village']);
    expect(save.equipped.weapon).toBe('item.sword.wood');
    expect(save.equipped.armor).toBe('item.robe.novice');
    expect(checksumOf(save)).toBe(save.checksum);
  });

  it('save → load round trip (deep equal except updatedAt)', async () => {
    await SaveManager.init();
    const save = SaveManager.createNew();
    await SaveManager.save(save);

    const loaded = await SaveManager.load();
    const { meta: loadedMeta, checksum: _c1, ...loadedRest } = loaded;
    const { meta: originalMeta, checksum: _c2, ...originalRest } = save;

    expect(loadedRest).toEqual(originalRest);
    expect(loadedMeta.createdAt).toBe(originalMeta.createdAt);
    expect(SaveManager.hasSave).toBe(true);
  });

  it('load throws when slot is empty', async () => {
    await SaveManager.init();
    await expect(SaveManager.load()).rejects.toThrow(/No save in slot/);
  });

  it('tampered save fails checksum with SaveCorruptError', async () => {
    const save = SaveManager.createNew();
    const tampered: PlayerSaveV1 = {
      ...save,
      inventory: { ...save.inventory, gold: 999_999 },
    };
    await writeRaw(tampered);

    await SaveManager.init();
    await expect(SaveManager.load()).rejects.toThrow(SaveCorruptError);
  });

  it('export → import round trip', async () => {
    await SaveManager.init();
    const save = SaveManager.createNew();
    await SaveManager.save(save);
    await SaveManager.load();

    const json = SaveManager.exportJson();
    await SaveManager.delete();
    expect(SaveManager.hasSave).toBe(false);

    const imported = await SaveManager.importJson(json);
    expect(imported.stats).toEqual(save.stats);
    expect(SaveManager.hasSave).toBe(true);
  });

  it('importJson rejects invalid JSON and tampered payloads', async () => {
    await SaveManager.init();
    await expect(SaveManager.importJson('not json')).rejects.toThrow(/not valid JSON/);

    const save = SaveManager.createNew();
    const tampered = JSON.stringify({ ...save, xp: 12_345 });
    await expect(SaveManager.importJson(tampered)).rejects.toThrow(SaveCorruptError);
  });

  it('autosave fires debounced on scene change', async () => {
    await SaveManager.init();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    const autosave = vi.fn();
    SaveManager.onAutosave(autosave);

    EventBus.emit('scene:changed', { id: 'combat' });
    EventBus.emit('scene:changed', { id: 'home' });
    expect(autosave).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);
    expect(autosave).toHaveBeenCalledTimes(1);
  });

  it('autosaveNow fires immediately and cancels pending debounce', async () => {
    await SaveManager.init();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    const autosave = vi.fn();
    SaveManager.onAutosave(autosave);

    SaveManager.scheduleAutosave();
    SaveManager.autosaveNow();
    expect(autosave).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    expect(autosave).toHaveBeenCalledTimes(1);
  });
});

describe('migrate', () => {
  it('accepts a valid v1 save', () => {
    const save = SaveManager.createNew();
    expect(migrate(save)).toEqual(save);
  });

  it('throws on unsupported version', () => {
    const save = SaveManager.createNew();
    expect(() => migrate({ ...save, version: 99 })).toThrow(SaveMigrationError);
  });

  it('throws on non-object payloads', () => {
    expect(() => migrate('nope')).toThrow(SaveMigrationError);
    expect(() => migrate(null)).toThrow(SaveMigrationError);
  });

  it('throws on schema violations', () => {
    const save = SaveManager.createNew();
    expect(() => migrate({ ...save, stats: { broken: true } })).toThrow(SaveMigrationError);
  });
});
