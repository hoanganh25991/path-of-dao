import { I18nManager } from '@/core/i18n/I18nManager';
import { getChapterByStoryScene } from '@/progression/ChapterLoader';
import { findWorldMapNode } from '@/progression/WorldMapLoader';
import type { AncientPathStep } from '@/shared/schemas/ancient-demo';

export interface AncientPathStepView {
  mapLabel: string;
  realmLabel: string;
  storyLabel: string | null;
}

function mapLabel(mapId: string): string {
  const node = findWorldMapNode(mapId);
  if (!node) return mapId;
  const region = I18nManager.t(node.region.displayNameKey);
  const stageKey = mapId.endsWith('.01') ? 'path.stage.explore' : 'path.stage.ordeal';
  return `${region} · ${I18nManager.t(stageKey)}`;
}

/** Resolve an ancient path stop into display strings for the modal road list. */
export function describeAncientPathStep(step: AncientPathStep): AncientPathStepView {
  const storyLabel = step.storySceneId
    ? (() => {
        const chapter = getChapterByStoryScene(step.storySceneId!);
        return chapter ? I18nManager.t(chapter.titleKey) : step.storySceneId;
      })()
    : null;

  return {
    mapLabel: mapLabel(step.mapId),
    realmLabel: I18nManager.t(`realm.${step.realmId}.name`),
    storyLabel,
  };
}
