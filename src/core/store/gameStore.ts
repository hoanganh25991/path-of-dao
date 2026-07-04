import { createStore } from 'zustand/vanilla';
import { checksumOf } from '@/core/save/checksum';
import { SaveManager } from '@/core/save/SaveManager';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { isAncientDemoActive, resetAncientDemoSession } from '@/progression/AncientDemoManager';
import { notifyCombatPowerChanged } from '@/progression/CombatPower';

type SavePatch =
  | Partial<PlayerSaveV1>
  | ((current: PlayerSaveV1) => Partial<PlayerSaveV1>);

export interface GameStore {
  save: PlayerSaveV1 | null;
  isLoaded: boolean;
  /** Load existing save, or create + persist a new game when none exists. */
  load(): Promise<void>;
  /** Immutable shallow merge; bumps meta.updatedAt. Persist separately. */
  patch(partial: SavePatch): void;
  /** Write current state through SaveManager to IndexedDB. */
  persist(): Promise<void>;
  /** Wipe slot and start a fresh save (also persisted). */
  newGame(options?: { preserveSettings?: boolean }): Promise<void>;
}

export const gameStore = createStore<GameStore>()((set, get) => ({
  save: null,
  isLoaded: false,

  async load() {
    await SaveManager.init();

    let save: PlayerSaveV1;
    if (SaveManager.hasSave && SaveManager.current) {
      save = SaveManager.current;
    } else {
      save = SaveManager.createNew();
      await SaveManager.save(save);
    }

    set({ save, isLoaded: true });
  },

  patch(partial) {
    const current = get().save;
    if (!current) {
      throw new Error('gameStore.patch called before load()');
    }

    const delta = typeof partial === 'function' ? partial(current) : partial;
    const next: PlayerSaveV1 = {
      ...current,
      ...delta,
      meta: {
        ...current.meta,
        ...(delta.meta ?? {}),
        updatedAt: new Date().toISOString(),
      },
    };

    set({ save: next });
  },

  async persist() {
    // Demo walks are ephemeral — real journey stays in session backup until exit.
    if (isAncientDemoActive()) return;

    const snapshot = get().save;
    if (!snapshot) return;

    await SaveManager.save(snapshot);

    // A slower persist started before newGame() must not clobber the fresh save.
    const latest = get().save;
    if (latest && latest !== snapshot) {
      await SaveManager.save(latest);
    }
  },

  async newGame(options) {
    SaveManager.cancelPendingAutosave();

    const current = get().save;
    resetAncientDemoSession();

    let save = SaveManager.createNew();
    if (options?.preserveSettings && current) {
      save = { ...save, settings: { ...current.settings } };
      save.checksum = checksumOf(save);
    }

    await SaveManager.save(save);
    set({ save: SaveManager.current ?? save, isLoaded: true });
    notifyCombatPowerChanged(SaveManager.current ?? save);
  },
}));

/** Wire the store into SaveManager autosave triggers. Call once at boot. */
export function connectAutosave(): () => void {
  return SaveManager.onAutosave(() => {
    void gameStore.getState().persist();
  });
}

const PLAY_TIME_TICK_SECONDS = 60;

/** Accrue play time every 60s while the tab is visible. Call once at boot. */
export function startPlayTimeTracking(): () => void {
  const interval = setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    const state = gameStore.getState();
    if (!state.save) return;

    state.patch((current) => ({
      meta: {
        ...current.meta,
        totalPlaySeconds: current.meta.totalPlaySeconds + PLAY_TIME_TICK_SECONDS,
      },
    }));
  }, PLAY_TIME_TICK_SECONDS * 1000);

  return () => clearInterval(interval);
}
