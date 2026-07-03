import { SceneRouter } from '@/app/SceneRouter';
import { EventBus } from '@/core/EventBus';
import { SaveManager } from '@/core/save/SaveManager';
import { gameStore } from '@/core/store/gameStore';
import { applyMapClearPatch } from '@/progression/ChapterManager';
import { getEncounterDefinition } from '@/progression/EncounterLoader';
import { enterMapCombat } from '@/ui/world/WorldMap';
import { showEncounterModal } from '@/ui/modals/EncounterModal';
import {
  simulateBossClearPendingStory,
  simulateReadyForOrdeal,
  simulateRoadThroughChapter,
} from '@/progression/RoadProgressSimulator';

/** DEV/E2E — fast-forward save to after chapter N finale (story included). */
export async function seedRoadProgress(chaptersComplete: number): Promise<void> {
  const save = simulateRoadThroughChapter(chaptersComplete);
  gameStore.getState().patch(() => save);
  await gameStore.getState().persist();
  SaveManager.scheduleAutosave();
}

/** DEV/E2E — chapter boss cleared; story scene not yet viewed. */
export async function seedBossClearPendingStory(chapterIndex: number): Promise<void> {
  const save = simulateBossClearPendingStory(chapterIndex);
  gameStore.getState().patch(() => save);
  await gameStore.getState().persist();
  SaveManager.scheduleAutosave();
}

/** DEV/E2E — explore cleared; next stop is the chapter boss map. */
export async function seedReadyForOrdeal(chapterIndex: number): Promise<void> {
  const save = simulateReadyForOrdeal(chapterIndex);
  gameStore.getState().patch(() => save);
  await gameStore.getState().persist();
  SaveManager.scheduleAutosave();
}

/** DEV/E2E — open a story scene (same route as post-boss map exit). */
export function devEnterStory(chapterId: string, sceneId: string): void {
  void SceneRouter.instance.switchTo('story', { chapterId, sceneId });
}

/** DEV/E2E — trigger map exit while in combat (depart portal / pause flow). */
export function devRequestMapExit(wavesCleared: boolean): void {
  EventBus.emit('combat:request-exit', { wavesCleared });
}

/** DEV/E2E — apply map clear + route home/story (fallback when combat exit stalls). */
export async function devSimulateMapClear(mapId: string, wavesCleared: boolean): Promise<void> {
  const store = gameStore.getState();
  const save = store.save;
  if (!save) return;

  if (wavesCleared) {
    const { patch, result } = applyMapClearPatch(save, mapId, true);
    if (Object.keys(patch).length > 0) {
      store.patch(patch);
    }
    await store.persist();
    SaveManager.scheduleAutosave();
    if (result.pendingStory) {
      await SceneRouter.instance.switchTo('story', result.pendingStory);
      return;
    }
  }

  await SceneRouter.instance.switchTo('home');
}

/** DEV/E2E — enter a map (same as Journey CTA / world map Enter). */
export function devEnterMapCombat(mapId: string): void {
  enterMapCombat(mapId);
}

/** DEV/E2E — show encounter modal (reward applied on confirm). */
export async function devShowEncounter(encounterId: string): Promise<void> {
  const uiRoot = document.getElementById('ui-root');
  if (!uiRoot) return;
  await showEncounterModal(uiRoot, {
    encounter: getEncounterDefinition(encounterId),
  });
}
