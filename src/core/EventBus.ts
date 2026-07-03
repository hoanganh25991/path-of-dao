import type { SceneId } from '@/app/SceneId';
import type { StatModifier } from '@/progression/StatModifier';

export type GameEvents = {
  'scene:changed': { id: SceneId; payload?: unknown };
  'app:pause': undefined;
  'app:resume': undefined;
  'player:stats-changed': { hp: number; hpMax: number; mana: number; manaMax: number };
  'player:died': undefined;
  'map:wave-cleared': { encounterId: string; waveIndex: number };
  'equipment:changed': { modifiers: StatModifier[] };
};

type Listener<K extends keyof GameEvents> = (payload: GameEvents[K]) => void;

class EventBusImpl {
  private listeners = new Map<keyof GameEvents, Listener<keyof GameEvents>[]>();

  on<K extends keyof GameEvents>(event: K, listener: Listener<K>): () => void {
    const list = this.listeners.get(event) ?? [];
    list.push(listener as Listener<keyof GameEvents>);
    this.listeners.set(event, list);

    return () => {
      const current = this.listeners.get(event);
      if (!current) return;
      const index = current.indexOf(listener as Listener<keyof GameEvents>);
      if (index >= 0) current.splice(index, 1);
    };
  }

  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    const list = this.listeners.get(event);
    if (!list) return;
    for (const listener of [...list]) {
      listener(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const EventBus = new EventBusImpl();
