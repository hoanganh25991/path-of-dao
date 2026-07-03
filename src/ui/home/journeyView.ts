import type { JourneyEntry } from '@/core/save/SaveSchema';
import { I18nManager } from '@/core/i18n/I18nManager';
import { formatCombatPower } from '@/progression/CombatPower';
import { getChapterByStoryScene } from '@/progression/ChapterLoader';
import { getEncounterDefinition } from '@/progression/EncounterLoader';
import { getEnemyConfig } from '@/combat/enemies/EnemyLoader';
import { findWorldMapNode } from '@/progression/WorldMapLoader';

export interface JourneyView {
  /** Human title of what was reached. */
  title: string;
  /** Short badge for the milestone kind (Cleared / Story / Breakthrough…). */
  kindLabel: string;
  /** Strength snapshot line — "how strong I was here". */
  strength: string;
  /** Present when this step can be replayed as a story scene. */
  replay?: { chapterId: string; sceneId: string };
}

function realmName(realmId: string): string {
  return I18nManager.t(`realm.${realmId}.name`);
}

function strengthLine(entry: JourneyEntry): string {
  const realm = realmName(entry.realmId);
  const lv = I18nManager.t('path.strength.level', { level: entry.level });
  const cp = I18nManager.t('path.strength.cp', {
    cp: formatCombatPower(entry.cp, I18nManager.locale),
  });
  return `${realm} · ${lv} · ${cp}`;
}

function mapTitle(mapId: string | null, fallback: string): string {
  if (!mapId) return fallback;
  const node = findWorldMapNode(mapId);
  if (!node) return fallback;
  const region = I18nManager.t(node.region.displayNameKey);
  const stageKey = mapId.endsWith('.01') ? 'path.stage.explore' : 'path.stage.ordeal';
  return `${region} · ${I18nManager.t(stageKey)}`;
}

/** Resolve a recorded journey step into display strings for the My Path scroll. */
export function describeJourneyEntry(entry: JourneyEntry): JourneyView {
  const strength = strengthLine(entry);

  switch (entry.kind) {
    case 'story': {
      const chapter = getChapterByStoryScene(entry.refId);
      return {
        title: chapter ? I18nManager.t(chapter.titleKey) : entry.refId,
        kindLabel: I18nManager.t('path.kind.story'),
        strength,
        replay: chapter ? { chapterId: chapter.id, sceneId: entry.refId } : undefined,
      };
    }
    case 'breakthrough':
      return {
        title: realmName(entry.refId),
        kindLabel: I18nManager.t('path.kind.breakthrough'),
        strength,
      };
    case 'boss': {
      let title = entry.refId;
      try {
        title = I18nManager.t(getEnemyConfig(entry.refId).displayNameKey);
      } catch {
        // unknown boss id — keep refId
      }
      return { title, kindLabel: I18nManager.t('path.kind.boss'), strength };
    }
    case 'encounter': {
      const encounterId = entry.refId.split('@')[0] ?? entry.refId;
      let title = entry.refId;
      try {
        title = I18nManager.t(getEncounterDefinition(encounterId).displayNameKey);
      } catch {
        // unknown encounter id — keep refId
      }
      return { title, kindLabel: I18nManager.t('path.kind.encounter'), strength };
    }
    case 'map_clear':
    default:
      return {
        title: mapTitle(entry.mapId, entry.refId),
        kindLabel: I18nManager.t('path.kind.map'),
        strength,
      };
  }
}
