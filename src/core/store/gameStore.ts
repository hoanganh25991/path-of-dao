import { createStore } from 'zustand/vanilla';
import { SaveManager } from '@/core/save/SaveManager';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';

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
  newGame(): Promise<void>;
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
    const current = get().save;
    if (!current) return;
    await SaveManager.save(current);
  },

  async newGame() {
    const save = SaveManager.createNew();
    await SaveManager.save(save);
    set({ save, isLoaded: true });
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
