import ancientsJson from '../../content/demo/ancients.json';
import { SECONDS_PER_CULTIVATION_YEAR } from '@/progression/CombatPower';
import { checksumOf } from '@/core/save/checksum';
import { SaveManager } from '@/core/save/SaveManager';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { EventBus } from '@/core/EventBus';
import { gameStore } from '@/core/store/gameStore';
import { INSIGHT_XP_TO_FULL, listInsightIntentIds } from '@/progression/InsightDefinitions';
import { stopPathWalk } from '@/progression/PathWalkManager';
import { seedDefaultInsights } from '@/progression/InsightSystem';
import { syncRealmProgress } from '@/progression/BreakthroughManager';
import { normalizeLoadout } from '@/progression/SkillLoadout';
import { coerceDivineArts } from '@/progression/SkillSlots';
import { buildPlayerStats } from '@/progression/playerStats';
import {
  ancientsFileSchema,
  type AncientPathStep,
  type AncientProfile,
  type AncientSaveTemplate,
} from '@/shared/schemas/ancient-demo';

const ancientsData = ancientsFileSchema.parse(ancientsJson);
const BACKUP_KEY = 'path-of-dao:ancient-demo-backup';

let activeAncientId: string | null = null;
let journeyBackup: PlayerSaveV1 | null = null;

function profileById(ancientId: string): AncientProfile {
  const profile = ancientsData.ancients.find((entry) => entry.id === ancientId);
  if (!profile) {
    throw new Error(`AncientDemoManager: unknown ancient "${ancientId}"`);
  }
  return profile;
}

/** Builds a curated save snapshot for walking in an ancient's footsteps. */
export function buildAncientSave(ancientId: string): PlayerSaveV1 {
  const profile = profileById(ancientId);
  const template = profile.save;
  const base = SaveManager.createNew();
  const stats = buildPlayerStats('hero.wanderer', template.level, template.realmId);
  if (template.spirit !== undefined) {
    stats.spirit = template.spirit;
  }

  const insights = seedDefaultInsights();
  for (const intentId of listInsightIntentIds()) {
    if (template.insightReadyIntents.includes(intentId)) {
      insights[intentId] = { xp: INSIGHT_XP_TO_FULL, awakened: false, totalUses: 60 };
      continue;
    }
    const awakened = template.awakenedIntents.includes(intentId);
    insights[intentId] = {
      xp: awakened ? INSIGHT_XP_TO_FULL : insights[intentId]!.xp,
      awakened,
      totalUses: awakened ? 120 : insights[intentId]!.totalUses,
    };
  }

  const interimForRealm: PlayerSaveV1 = {
    ...base,
    stats,
    insights,
    progress: {
      ...base.progress,
      clearedBosses: [...template.clearedBosses],
      clearedMaps: [...template.clearedMaps],
    },
    realm: { id: template.realmId, tier: template.realmTier, breakthroughReady: false },
  } as PlayerSaveV1;
  const { realm } = syncRealmProgress(interimForRealm);

  const save: PlayerSaveV1 = {
    ...base,
    stats,
    runtime: { hp: stats.hpMax, mana: stats.manaMax },
    xp: template.level * 100,
    realm,
    insights,
    divineArts: normalizeLoadout(coerceDivineArts(template.divineArts), profile.unlockedSkills),
    unlockedSkills: [...profile.unlockedSkills],
    inventory: {
      gold: template.gold,
      items: template.inventoryItemIds.map((id) => ({ id, qty: 1 })),
    },
    equipped: { ...template.equipped },
    progress: {
      ...base.progress,
      clearedMaps: [...template.clearedMaps],
      clearedBosses: [...template.clearedBosses],
      unlockedChapters: [
        ...new Set([...base.progress.unlockedChapters, ...template.storySeen]),
      ],
      storySeen: [...template.storySeen],
      encountersFound: [...template.encountersFound],
      bestiary: [...template.bestiary],
      loreUnlocked: [...template.loreUnlocked],
      currentMapId: profile.startMapId,
    },
    cosmetics: { pet: template.pet },
    meta: {
      ...base.meta,
      totalPlaySeconds: template.yearsCultivated * SECONDS_PER_CULTIVATION_YEAR,
    },
  };

  save.realm = syncRealmProgress(save).realm;
  save.checksum = checksumOf(save);
  return save;
}

export function listAncientProfiles(): AncientProfile[] {
  return [...ancientsData.ancients];
}

const FOCUS_ORDER = [
  'demo.focus.breakthrough',
  'demo.focus.awakening',
  'demo.focus.combat',
  'demo.focus.fortune',
  'demo.focus.endgame',
] as const;

/** Profiles grouped by focusKey for Play panel sections. */
export function listAncientProfilesGrouped(): Array<{ focusKey: string; profiles: AncientProfile[] }> {
  const groups = new Map<string, AncientProfile[]>();
  for (const profile of ancientsData.ancients) {
    const list = groups.get(profile.focusKey) ?? [];
    list.push(profile);
    groups.set(profile.focusKey, list);
  }

  const ordered: Array<{ focusKey: string; profiles: AncientProfile[] }> = [];
  for (const key of FOCUS_ORDER) {
    const profiles = groups.get(key);
    if (profiles?.length) ordered.push({ focusKey: key, profiles });
    groups.delete(key);
  }
  for (const [focusKey, profiles] of groups) {
    ordered.push({ focusKey, profiles });
  }
  return ordered;
}

export function getAncientProfile(ancientId: string): AncientProfile {
  return profileById(ancientId);
}

/** The ordered road an ancient walked to reach their power — the "follow his path" content. */
export function getAncientPath(ancientId: string): AncientPathStep[] {
  return [...profileById(ancientId).path];
}

export function isAncientDemoActive(): boolean {
  return activeAncientId !== null;
}

export function getActiveAncientId(): string | null {
  return activeAncientId;
}

export function hasJourneyBackup(): boolean {
  return journeyBackup !== null || sessionStorageHasBackup();
}

function sessionStorageHasBackup(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(BACKUP_KEY) !== null;
}

function readBackupFromSession(): PlayerSaveV1 | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(BACKUP_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlayerSaveV1;
  } catch {
    return null;
  }
}

function writeBackupToSession(save: PlayerSaveV1): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(BACKUP_KEY, JSON.stringify(save));
}

function clearBackupSession(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(BACKUP_KEY);
}

/** True when the save looks like real player progress worth pausing. */
export function hasMeaningfulProgress(save: PlayerSaveV1): boolean {
  if (save.stats.level > 1) return true;
  if (save.xp > 0) return true;
  if (save.inventory.gold > 0) return true;
  if (save.progress.clearedMaps.length > 0) return true;
  if (save.progress.clearedBosses.length > 0) return true;
  if (save.progress.encountersFound.length > 0) return true;
  if (Object.values(save.insights).some((entry) => entry.awakened || entry.xp > 0)) {
    return true;
  }
  return false;
}

export interface EnterAncientDemoOptions {
  divineArts?: AncientSaveTemplate['divineArts'];
  /** Run the echo on this map instead of the profile's default — lets the player
   *  relive the exact map they are currently on, feeling the power gap. */
  mapId?: string;
}

/** Enter ancient demo — pauses real journey in session backup, does not write demo to IDB. */
export async function enterAncientDemo(
  ancientId: string,
  options: EnterAncientDemoOptions = {},
): Promise<void> {
  const { divineArts, mapId } = options;
  const store = gameStore.getState();
  const current = store.save;
  if (!current) throw new Error('AncientDemoManager: no save loaded');

  if (!activeAncientId && hasMeaningfulProgress(current)) {
    journeyBackup = structuredClone(current);
    writeBackupToSession(journeyBackup);
  }

  activeAncientId = ancientId;
  const demoSave = buildAncientSave(ancientId);
  let mutated = false;
  if (mapId) {
    demoSave.progress = { ...demoSave.progress, currentMapId: mapId };
    mutated = true;
  }
  if (divineArts) {
    demoSave.divineArts = normalizeLoadout(
      coerceDivineArts(divineArts),
      profileById(ancientId).unlockedSkills,
    );
    mutated = true;
  }
  if (mutated) {
    demoSave.checksum = checksumOf(demoSave);
  }
  store.patch(demoSave);

  EventBus.emit('loadout:changed', { divineArts: demoSave.divineArts });
  EventBus.emit('demo:entered', { ancientId });
}

/** Restore the player's journey and persist to IndexedDB. */
export async function exitAncientDemo(): Promise<void> {
  if (!activeAncientId) return;

  const store = gameStore.getState();
  const backup = journeyBackup ?? readBackupFromSession();

  activeAncientId = null;
  journeyBackup = null;
  clearBackupSession();
  stopPathWalk();

  if (backup) {
    store.patch(backup);
    await store.persist();
    EventBus.emit('loadout:changed', { divineArts: backup.divineArts });
  } else {
    const fresh = SaveManager.createNew();
    store.patch(fresh);
    await store.persist();
    EventBus.emit('loadout:changed', { divineArts: fresh.divineArts });
  }

  EventBus.emit('demo:exited', undefined);
}

/** @internal Reset session state for tests. */
export function resetAncientDemoSession(): void {
  activeAncientId = null;
  journeyBackup = null;
  clearBackupSession();
  stopPathWalk();
}

export class AncientDemoManager {
  static listProfiles = listAncientProfiles;
  static getProfile = getAncientProfile;
  static getPath = getAncientPath;
  static buildSave = buildAncientSave;
  static isActive = isAncientDemoActive;
  static getActiveId = getActiveAncientId;
  static hasBackup = hasJourneyBackup;
  static hasMeaningfulProgress = hasMeaningfulProgress;
  static enter = enterAncientDemo;
  static exit = exitAncientDemo;
  static resetSession = resetAncientDemoSession;
}
