import { EventBus } from '@/core/EventBus';
import { SaveManager } from '@/core/save/SaveManager';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { gameStore } from '@/core/store/gameStore';
import {
  getEncounterTables,
  getEncountersForTrigger,
} from '@/progression/EncounterLoader';
import type { EncounterDefinition, EncounterTriggerKind } from '@/shared/schemas/fortuitous-encounters';

export type RngFn = () => number;

let rng: RngFn = Math.random;

/** @internal Seeded RNG for unit tests. */
export function setEncounterRng(next: RngFn): void {
  rng = next;
}

export function resetEncounterRng(): void {
  rng = Math.random;
}

function getRateMultiplier(): number {
  const tables = getEncounterTables();
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const dev = (window as unknown as Record<string, unknown>).__devEncounterRateMultiplier;
    if (typeof dev === 'number' && dev > 0) return tables.devRateMultiplier * dev;
  }
  return tables.devRateMultiplier;
}

function spiritBonus(save: PlayerSaveV1): number {
  const tables = getEncounterTables();
  return save.stats.spirit * tables.spiritRateBonusPerPoint;
}

function discoveryBonus(save: PlayerSaveV1): number {
  const tables = getEncounterTables();
  return save.progress.encountersFound.length * tables.discoveryRateBonusPerMap;
}

function effectiveRate(baseRate: number, save: PlayerSaveV1): number {
  const boosted = baseRate * getRateMultiplier() + spiritBonus(save) + discoveryBonus(save);
  return Math.min(1, Math.max(0, boosted));
}

export function wasFound(id: string, save: PlayerSaveV1): boolean {
  return save.progress.encountersFound.includes(id);
}

function poiFoundKey(encounterId: string, poiKey: string): string {
  return `${encounterId}@${poiKey}`;
}

export function wasPoiFound(encounterId: string, poiKey: string, save: PlayerSaveV1): boolean {
  return wasFound(poiFoundKey(encounterId, poiKey), save);
}

function pickRandomItem(itemIds: string[]): string {
  const index = Math.floor(rng() * itemIds.length);
  return itemIds[index] ?? itemIds[0]!;
}

function addInventoryItem(
  items: PlayerSaveV1['inventory']['items'],
  itemId: string,
): PlayerSaveV1['inventory']['items'] {
  const existing = items.find((entry) => entry.id === itemId);
  if (existing) {
    return items.map((entry) =>
      entry.id === itemId ? { ...entry, qty: entry.qty + 1 } : entry,
    );
  }
  return [...items, { id: itemId, qty: 1 }];
}

function rollFromPool(
  trigger: EncounterTriggerKind,
  save: PlayerSaveV1,
  opts?: { killStreak?: number; skipUnique?: boolean },
): EncounterDefinition | null {
  const pool = getEncountersForTrigger(trigger);
  if (pool.length === 0) return null;

  for (const def of pool) {
    if (def.unique && wasFound(def.id, save)) continue;
    if (def.killStreakThreshold && (opts?.killStreak ?? 0) < def.killStreakThreshold) {
      continue;
    }

    const rate = def.rate >= 1 ? 1 : effectiveRate(def.rate, save);
    if (rate >= 1 || rng() < rate) {
      return def;
    }
  }

  return null;
}

export function rollOnMapEnter(_mapId: string, save: PlayerSaveV1): EncounterDefinition | null {
  return rollFromPool('mapEnter', save);
}

export function rollOnWaveClear(_mapId: string, save: PlayerSaveV1): EncounterDefinition | null {
  return rollFromPool('waveClear', save);
}

export function rollOnKillStreak(count: number, save: PlayerSaveV1): EncounterDefinition | null {
  return rollFromPool('killStreak', save, { killStreak: count });
}

export function rollOnBossRematch(save: PlayerSaveV1): EncounterDefinition | null {
  return rollFromPool('bossRematch', save);
}

export function getPoiEncounter(poiType: 'hidden_cave' | 'ancient_sword'): EncounterDefinition {
  const trigger: EncounterTriggerKind =
    poiType === 'hidden_cave' ? 'poiHiddenCave' : 'poiAncientSword';
  const pool = getEncountersForTrigger(trigger);
  const def = pool[0];
  if (!def) {
    throw new Error(`FortuitousEncounterManager: no POI encounter for "${poiType}"`);
  }
  return def;
}

export function applyEncounterReward(
  encounter: EncounterDefinition,
  save: PlayerSaveV1,
  poiKey?: string,
): Partial<PlayerSaveV1> {
  const foundId = poiKey ? poiFoundKey(encounter.id, poiKey) : encounter.id;
  const encountersFound = save.progress.encountersFound.includes(foundId)
    ? save.progress.encountersFound
    : [...save.progress.encountersFound, foundId];

  let inventory = save.inventory;
  let insights = save.insights;
  let loreUnlocked = save.progress.loreUnlocked;
  let cosmetics = save.cosmetics;
  let equippedSkills = save.equippedSkills;

  switch (encounter.reward.type) {
    case 'item': {
      const itemId = pickRandomItem(encounter.reward.itemIds);
      inventory = {
        ...inventory,
        items: addInventoryItem(inventory.items, itemId),
      };
      break;
    }
    case 'gold_insight': {
      inventory = { ...inventory, gold: inventory.gold + encounter.reward.gold };
      const prev = save.insights[encounter.reward.intentId] ?? {
        xp: 0,
        awakened: false,
        totalUses: 0,
      };
      if (!prev.awakened) {
        insights = {
          ...save.insights,
          [encounter.reward.intentId]: {
            ...prev,
            xp: Math.min(200, prev.xp + encounter.reward.xpGain),
          },
        };
      }
      break;
    }
    case 'pet':
      cosmetics = { ...cosmetics, pet: encounter.reward.petId };
      break;
    case 'lore':
      loreUnlocked = loreUnlocked.includes(encounter.reward.loreId)
        ? loreUnlocked
        : [...loreUnlocked, encounter.reward.loreId];
      break;
    case 'skill_variant': {
      const skillId = encounter.reward.skillId;
      equippedSkills = { ...equippedSkills };
      const slots = ['primary', 'secondary', 'ultimate'] as const;
      if (!Object.values(equippedSkills).includes(skillId)) {
        equippedSkills.secondary = skillId;
      }
      void slots;
      break;
    }
  }

  EventBus.emit('encounter:completed', { encounterId: encounter.id, poiKey });

  if (import.meta.env.DEV) {
    console.info('[encounter]', encounter.id, poiKey ?? '');
  }

  return {
    inventory,
    insights,
    cosmetics,
    equippedSkills,
    progress: {
      ...save.progress,
      encountersFound,
      loreUnlocked,
    },
  };
}

export class FortuitousEncounterManager {
  static rollOnMapEnter = rollOnMapEnter;
  static rollOnWaveClear = rollOnWaveClear;
  static rollOnKillStreak = rollOnKillStreak;
  static rollOnBossRematch = rollOnBossRematch;
  static wasFound = wasFound;
  static wasPoiFound = wasPoiFound;
  static getPoiEncounter = getPoiEncounter;

  static apply(encounter: EncounterDefinition, poiKey?: string): void {
    const store = gameStore.getState();
    const save = store.save;
    if (!save) return;

    const patch = applyEncounterReward(encounter, save, poiKey);
    store.patch(patch);
    void store.persist();
    SaveManager.autosaveNow();
  }

  static applyToSave(
    encounter: EncounterDefinition,
    save: PlayerSaveV1,
    poiKey?: string,
  ): PlayerSaveV1 {
    const patch = applyEncounterReward(encounter, save, poiKey);
    return { ...save, ...patch };
  }
}
