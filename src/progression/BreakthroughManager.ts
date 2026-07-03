import { EventBus } from '@/core/EventBus';
import { SaveManager } from '@/core/save/SaveManager';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { gameStore } from '@/core/store/gameStore';
import { notifyCombatPowerChanged } from '@/progression/CombatPower';
import { CultivationRealm } from '@/progression/CultivationRealm';
import { getRealmDefinition } from '@/progression/RealmStatScaling';
import { realmToAuraTier } from '@/home/realmAura';
import { recordJourney } from '@/progression/JourneyLog';

export interface StatDelta {
  hpMax: number;
  atk: number;
  def: number;
  spirit: number;
}

/** Reconcile tier + breakthroughReady after level, boss, or spirit changes. */
export function syncRealmProgress(save: PlayerSaveV1): {
  realm: PlayerSaveV1['realm'];
  emitReady: boolean;
} {
  const wasReady = save.realm.breakthroughReady;
  const realm = CultivationRealm.syncRealmState(save);
  return { realm, emitReady: realm.breakthroughReady && !wasReady };
}

export function applyRealmProgressPatch(current: PlayerSaveV1): Partial<PlayerSaveV1> {
  const { realm } = syncRealmProgress(current);
  return { realm };
}

export class BreakthroughManager {
  /** Apply breakthrough to save, persist, and emit events. Returns stat deltas for UI. */
  static applyBreakthrough(): StatDelta | null {
    const store = gameStore.getState();
    const save = store.save;
    if (!save || !save.realm.breakthroughReady) return null;

    const before = save.stats;
    let next: PlayerSaveV1;

    try {
      next = CultivationRealm.performBreakthrough(save);
    } catch {
      return null;
    }

    const delta: StatDelta = {
      hpMax: next.stats.hpMax - before.hpMax,
      atk: next.stats.atk - before.atk,
      def: next.stats.def - before.def,
      spirit: next.stats.spirit - before.spirit,
    };

    next = {
      ...next,
      progress: {
        ...next.progress,
        journey: recordJourney(next, 'breakthrough', next.realm.id, null),
      },
    };

    store.patch(next);
    void store.persist();
    SaveManager.autosaveNow();

    EventBus.emit('realm:breakthrough', {
      realmId: next.realm.id,
      auraTier: realmToAuraTier(next.realm.id),
    });
    notifyCombatPowerChanged(next);

    return delta;
  }

  static getNextRealmDisplayKey(save: PlayerSaveV1): string | null {
    const def = getRealmDefinition(save.realm.id);
    if (!def.breakthrough) return null;
    return getRealmDefinition(def.breakthrough.nextRealm).displayKey;
  }
}
