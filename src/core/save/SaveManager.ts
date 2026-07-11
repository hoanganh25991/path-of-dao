import { openDB, type IDBPDatabase } from 'idb';
import { EventBus } from '@/core/EventBus';
import { checksumOf } from '@/core/save/checksum';
import { migrate } from '@/core/save/SaveMigration';
import { SAVE_VERSION, type PlayerSaveV1 } from '@/core/save/SaveSchema';
import { DB_NAME, DB_VERSION, DEFAULT_SLOT, STORE_NAME, slotKey } from '@/core/save/SaveSlot';
import { emptyDivineArts } from '@/progression/SkillSlots';
import { seedDefaultInsights } from '@/progression/InsightSystem';
import { buildPlayerStats } from '@/progression/playerStats';

export class SaveCorruptError extends Error {
  constructor(message = 'Save data failed checksum validation') {
    super(message);
    this.name = 'SaveCorruptError';
  }
}

const AUTOSAVE_DEBOUNCE_MS = 2000;

/**
 * Versioned save/load over IndexedDB with checksum integrity and
 * export/import JSON. All persistence must go through this class
 * (or the game store) — never touch IndexedDB elsewhere.
 */
export class SaveManager {
  private static db: IDBPDatabase | null = null;
  private static cached: PlayerSaveV1 | null = null;
  private static autosaveCallbacks: Array<() => void> = [];
  private static autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  private static unsubscribeScene: (() => void) | null = null;

  static async init(): Promise<void> {
    if (SaveManager.db) return;

    SaveManager.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });

    try {
      SaveManager.cached = await SaveManager.load();
    } catch {
      SaveManager.cached = null;
    }

    SaveManager.unsubscribeScene = EventBus.on('scene:changed', () => {
      SaveManager.scheduleAutosave();
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', SaveManager.onBeforeUnload);
    }
  }

  static async destroy(): Promise<void> {
    SaveManager.unsubscribeScene?.();
    SaveManager.unsubscribeScene = null;

    if (SaveManager.autosaveTimer !== null) {
      clearTimeout(SaveManager.autosaveTimer);
      SaveManager.autosaveTimer = null;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', SaveManager.onBeforeUnload);
    }

    SaveManager.db?.close();
    SaveManager.db = null;
    SaveManager.cached = null;
    SaveManager.autosaveCallbacks = [];
  }

  static get hasSave(): boolean {
    return SaveManager.cached !== null;
  }

  static get current(): PlayerSaveV1 | null {
    return SaveManager.cached;
  }

  /** Fresh level-1 save. Caller persists it via save(). */
  static createNew(): PlayerSaveV1 {
    const now = new Date().toISOString();
    const stats = buildPlayerStats('hero.wanderer', 1, 'mortal_body');
    const save: PlayerSaveV1 = {
      version: SAVE_VERSION,
      checksum: '',
      heroId: 'hero.wanderer',
      stats,
      runtime: { hp: stats.hpMax, mana: stats.manaMax },
      xp: 0,
      realm: { id: 'mortal_body', tier: 'early', breakthroughReady: false },
      insights: seedDefaultInsights(),
      divineArts: emptyDivineArts(),
      unlockedSkills: [],
      inventory: {
        items: [
          { id: 'item.bracelet.copper', qty: 1 },
          { id: 'item.ring.speed', qty: 1 },
        ],
        gold: 0,
      },
      equipped: {
        weapon: null,
        armor: 'item.robe.novice',
        accessory: null,
        spirit: null,
      },
      progress: {
        clearedMaps: [],
        clearedBosses: [],
        unlockedChapters: ['chapter.01.fallen_village'],
        storySeen: [],
        timelineSeen: [],
        encountersFound: [],
        bestiary: [],
        loreUnlocked: [],
        journey: [],
        currentMapId: null,
        weaponMilestone: 'none',
      },
      cosmetics: { pet: null },
      settings: { locale: 'system', quality: 'auto', sfxVolume: 1, musicVolume: 1, uiVolume: 0.82, fullscreen: true },
      meta: { totalPlaySeconds: 0, createdAt: now, updatedAt: now },
      destinyPoints: { dharma: 0, divine: 0, intent: 0, unspent: 0 },
    };

    save.checksum = checksumOf(save);
    return save;
  }

  static async load(slot: number = DEFAULT_SLOT): Promise<PlayerSaveV1> {
    const db = SaveManager.requireDb();
    const raw: unknown = await db.get(STORE_NAME, slotKey(slot));

    if (raw === undefined) {
      throw new Error(`No save in slot ${slot}`);
    }

    const parsed = migrate(raw);
    if (checksumOf(parsed) !== parsed.checksum) {
      throw new SaveCorruptError();
    }

    SaveManager.cached = parsed;
    return parsed;
  }

  static async save(state: PlayerSaveV1, slot: number = DEFAULT_SLOT): Promise<void> {
    const db = SaveManager.requireDb();

    const stamped: PlayerSaveV1 = {
      ...state,
      meta: { ...state.meta, updatedAt: new Date().toISOString() },
    };
    stamped.checksum = checksumOf(stamped);

    await db.put(STORE_NAME, stamped, slotKey(slot));
    SaveManager.cached = stamped;
  }

  static async delete(slot: number = DEFAULT_SLOT): Promise<void> {
    const db = SaveManager.requireDb();
    await db.delete(STORE_NAME, slotKey(slot));
    if (slot === DEFAULT_SLOT) SaveManager.cached = null;
  }

  static exportJson(): string {
    if (!SaveManager.cached) {
      throw new Error('No save loaded to export');
    }
    return JSON.stringify(SaveManager.cached, null, 2);
  }

  static async importJson(json: string, slot: number = DEFAULT_SLOT): Promise<PlayerSaveV1> {
    let raw: unknown;
    try {
      raw = JSON.parse(json);
    } catch {
      throw new Error('Import failed: not valid JSON');
    }

    const parsed = migrate(raw);
    if (checksumOf(parsed) !== parsed.checksum) {
      throw new SaveCorruptError('Imported save failed checksum validation');
    }

    await SaveManager.save(parsed, slot);
    return parsed;
  }

  /** Register autosave work (e.g. the game store persisting itself). */
  static onAutosave(cb: () => void): () => void {
    SaveManager.autosaveCallbacks.push(cb);
    return () => {
      SaveManager.autosaveCallbacks = SaveManager.autosaveCallbacks.filter((c) => c !== cb);
    };
  }

  /** Drop a pending debounced autosave (e.g. before wiping progress). */
  static cancelPendingAutosave(): void {
    if (SaveManager.autosaveTimer !== null) {
      clearTimeout(SaveManager.autosaveTimer);
      SaveManager.autosaveTimer = null;
    }
  }

  /** Debounced trigger — scene changes batch into one save 2s later. */
  static scheduleAutosave(): void {
    if (SaveManager.autosaveTimer !== null) {
      clearTimeout(SaveManager.autosaveTimer);
    }
    SaveManager.autosaveTimer = setTimeout(() => {
      SaveManager.autosaveTimer = null;
      SaveManager.runAutosave();
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  /** Immediate trigger — map cleared, boss defeated, breakthrough. */
  static autosaveNow(): void {
    if (SaveManager.autosaveTimer !== null) {
      clearTimeout(SaveManager.autosaveTimer);
      SaveManager.autosaveTimer = null;
    }
    SaveManager.runAutosave();
  }

  private static runAutosave(): void {
    for (const cb of [...SaveManager.autosaveCallbacks]) {
      cb();
    }
  }

  private static onBeforeUnload = (): void => {
    // Best effort: IndexedDB writes started here usually complete before teardown.
    SaveManager.autosaveNow();
  };

  private static requireDb(): IDBPDatabase {
    if (!SaveManager.db) {
      throw new Error('SaveManager.init() must be called first');
    }
    return SaveManager.db;
  }
}
