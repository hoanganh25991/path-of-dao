import ancientsJson from '../../content/demo/ancients.json';
import { checksumOf } from '@/core/save/checksum';
import { SaveManager } from '@/core/save/SaveManager';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { EventBus } from '@/core/EventBus';
import { gameStore } from '@/core/store/gameStore';
import { INSIGHT_XP_TO_FULL, listInsightIntentIds } from '@/progression/InsightDefinitions';
import { seedDefaultInsights } from '@/progression/InsightSystem';
import { buildPlayerStats } from '@/progression/playerStats';
import {
  ancientsFileSchema,
  type AncientProfile,
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

  const insights = seedDefaultInsights();
  for (const intentId of listInsightIntentIds()) {
    const awakened = template.awakenedIntents.includes(intentId);
    insights[intentId] = {
      xp: awakened ? INSIGHT_XP_TO_FULL : insights[intentId]!.xp,
      awakened,
      totalUses: awakened ? 120 : insights[intentId]!.totalUses,
    };
  }

  const save: PlayerSaveV1 = {
    ...base,
    stats,
    runtime: { hp: stats.hpMax, mana: stats.manaMax },
    xp: template.level * 100,
    realm: {
      id: template.realmId,
      tier: template.realmTier,
      breakthroughReady: false,
    },
    insights,
    equippedSkills: { ...template.equippedSkills },
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
      totalPlaySeconds: template.yearsCultivated * 3600,
    },
  };

  save.checksum = checksumOf(save);
  return save;
}

export function listAncientProfiles(): AncientProfile[] {
  return [...ancientsData.ancients];
}

export function getAncientProfile(ancientId: string): AncientProfile {
  return profileById(ancientId);
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

/** Enter ancient demo — pauses real journey in session backup, does not write demo to IDB. */
export async function enterAncientDemo(ancientId: string): Promise<void> {
  const store = gameStore.getState();
  const current = store.save;
  if (!current) throw new Error('AncientDemoManager: no save loaded');

  if (!activeAncientId && hasMeaningfulProgress(current)) {
    journeyBackup = structuredClone(current);
    writeBackupToSession(journeyBackup);
  }

  activeAncientId = ancientId;
  const demoSave = buildAncientSave(ancientId);
  store.patch(demoSave);

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

  if (backup) {
    store.patch(backup);
    await store.persist();
  } else {
    const fresh = SaveManager.createNew();
    store.patch(fresh);
    await store.persist();
  }

  EventBus.emit('demo:exited', undefined);
}

/** @internal Reset session state for tests. */
export function resetAncientDemoSession(): void {
  activeAncientId = null;
  journeyBackup = null;
  clearBackupSession();
}

export class AncientDemoManager {
  static listProfiles = listAncientProfiles;
  static getProfile = getAncientProfile;
  static buildSave = buildAncientSave;
  static isActive = isAncientDemoActive;
  static getActiveId = getActiveAncientId;
  static hasBackup = hasJourneyBackup;
  static hasMeaningfulProgress = hasMeaningfulProgress;
  static enter = enterAncientDemo;
  static exit = exitAncientDemo;
  static resetSession = resetAncientDemoSession;
}
