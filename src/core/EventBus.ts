import type { SceneId } from '@/app/SceneId';
import type { Locale, LocalePreference } from '@/core/i18n/I18nManager';
import type { AuraTier } from '@/home/realmAura';
import type { StatModifier } from '@/progression/StatModifier';
import type { HomeTab } from '@/ui/home/types';

export type GameEvents = {
  'scene:changed': { id: SceneId; payload?: unknown };
  'app:pause': undefined;
  'app:resume': undefined;
  'player:stats-changed': { hp: number; hpMax: number; mana: number; manaMax: number };
  'player:died': undefined;
  'map:wave-cleared': { encounterId: string; waveIndex: number };
  'equipment:changed': { modifiers: StatModifier[] };
  'realm:breakthrough-ready': undefined;
  'realm:breakthrough': { realmId: string; auraTier: AuraTier };
  'insight:xp-changed': { intentId: string; xp: number; displayPct: number };
  'insight:ready-to-awaken': { intentId: string };
  'insight:awakened': { intentId: string; skillId: string };
  'encounter:completed': { encounterId: string; poiKey?: string };
  'map:enemy-killed': { enemyId: string; isBoss: boolean; wasRematch: boolean };
  'combat:hit-landed': {
    isCrit: boolean;
    finalDamage: number;
    skillMultiplier: number;
    x: number;
    y: number;
    attackerTeam: 'player' | 'enemy';
    victimTeam: 'player' | 'enemy';
  };
  'progression:level-up': { level: number };
  'demo:entered': { ancientId: string };
  'demo:exited': undefined;
  'combat:open-skill-picker': { slot?: 'primary' | 'secondary' | 'ultimate' };
  'loadout:changed': { equippedSkills: { primary: string; secondary: string; ultimate: string } };
  'skill:cooldown-state': {
    primary: { remainingMs: number; totalMs: number };
    secondary: { remainingMs: number; totalMs: number };
    ultimate: { remainingMs: number; totalMs: number };
  };
  'home:open-tab': { tab: HomeTab };
  'settings:locale-changed': { preference: LocalePreference; locale: Locale };
  'layout:changed': { width: number; height: number; portraitRotate: boolean };
  'cp:changed': { cp: number };
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
