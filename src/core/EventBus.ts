import type { QualityPreference } from '@/app/QualityProfile';
import type { SceneId } from '@/app/SceneId';
import type { Locale, LocalePreference } from '@/core/i18n/I18nManager';
import type { AuraTier } from '@/home/realmAura';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
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
  'map:cultivator-defeated': { cultivatorId: string; isBoss: boolean; wasRematch: boolean };
  /** @deprecated Back-compat alias — prefer map:cultivator-defeated */
  'map:enemy-killed': { enemyId: string; isBoss: boolean; wasRematch: boolean };
  'boss:defeated': { bossId: string };
  /** Boss HP crossed a phase threshold (sub-plan 23 — distinct boss patterns). */
  'combat:boss-phase-changed': { bossId: string; phaseIndex: number; hpThreshold: number };
  'combat:hit-landed': {
    isCrit: boolean;
    finalDamage: number;
    skillMultiplier: number;
    x: number;
    y: number;
    attackerTeam: 'player' | 'cultivator';
    victimTeam: 'player' | 'cultivator';
  };
  'player:attack-started': { step: 1 | 2 | 3 };
  'player:dodge-started': undefined;
  'player:meditate-started': undefined;
  'player:meditate-ended': undefined;
  'skill:cast': { intent: string };
  'progression:xp-gained': { xpTotal: number; xpGained: number; level: number };
  'progression:level-up': { level: number; realmId: string; tier: PlayerSaveV1['realm']['tier'] };
  'demo:entered': { ancientId: string };
  'demo:exited': undefined;
  'combat:open-skill-picker': { slot?: 0 | 1 | 2 | 3 | 4 | 5 };
  'loadout:changed': { divineArts: import('@/progression/SkillSlots').DivineArtsLoadout };
  'skill:cooldown-state': import('@/progression/SkillSlots').SkillCooldownState;
  'health:cooldown-state': { remainingMs: number; totalMs: number };
  'home:open-tab': { tab: HomeTab };
  'settings:locale-changed': { preference: LocalePreference; locale: Locale };
  'settings:quality-changed': { preference: QualityPreference };
  'settings:fullscreen-changed': { enabled: boolean };
  'layout:changed': { width: number; height: number; portraitRotate: boolean };
  'cp:changed': { cp: number };
  'skill:learned': { skillIds: string[] };
  'chapter:unlocked': { chapterId: string };
  'combat:pause-changed': { paused: boolean };
  'combat:request-save': undefined;
  'combat:request-exit': { wavesCleared: boolean };
  'combat:request-retry': undefined;
  'combat:map-loaded': {
    displayNameKey: string;
  };
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
