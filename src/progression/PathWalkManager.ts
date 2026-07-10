import { SceneRouter } from '@/app/SceneRouter';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { getChapterByStoryScene } from '@/progression/ChapterLoader';
import { exitAncientDemo, getAncientPath } from '@/progression/AncientDemoManager';
import { findTimelineShardByMapId } from '@/progression/TimelineLoader';
import type { AncientPathStep } from '@/shared/schemas/ancient-demo';

export type PathWalkRoute =
  | { action: 'story'; sceneId: string; chapterId: string }
  | { action: 'combat'; mapId: string }
  | { action: 'home' };

interface PathWalkSession {
  ancientId: string;
  stepIndex: number;
}

let session: PathWalkSession | null = null;

export function startPathWalk(ancientId: string): void {
  const path = getAncientPath(ancientId);
  if (path.length === 0) {
    throw new Error(`PathWalkManager: ancient "${ancientId}" has no path`);
  }
  session = { ancientId, stepIndex: 0 };
}

export function stopPathWalk(): void {
  session = null;
}

export function isPathWalkActive(): boolean {
  return session !== null;
}

export function getPathWalkAncientId(): string | null {
  return session?.ancientId ?? null;
}

export function getCurrentPathStep(): AncientPathStep | null {
  if (!session) return null;
  return getAncientPath(session.ancientId)[session.stepIndex] ?? null;
}

/** Dao Scroll shard for a path-walk stop, if any — auto-read between maps, skippable
 *  (sub-plan 31 §6.3). Pure lookup; caller (MapScene) owns opening the reader. */
export function getPathWalkTimelineShardId(mapId: string): string | null {
  return findTimelineShardByMapId(mapId)?.id ?? null;
}

/** Pure — mark a Dao Scroll shard seen (idempotent) on whichever save is active during
 *  the walk. The ancient demo save is session-only and never persisted to IndexedDB, so
 *  this never pollutes the player's real progress (track 28: "demo walks never persist"). */
export function markPathWalkTimelineShardSeen(
  save: PlayerSaveV1,
  shardId: string,
): PlayerSaveV1['progress'] {
  if (save.progress.timelineSeen.includes(shardId)) return save.progress;
  return { ...save.progress, timelineSeen: [...save.progress.timelineSeen, shardId] };
}

/** Map cleared during a guided ancient walk — queue story or advance to the next stop. */
export function onPathStepMapCleared(mapId: string): PathWalkRoute {
  if (!session) return { action: 'home' };

  const step = getCurrentPathStep();
  if (!step || step.mapId !== mapId) {
    return finishPathWalk();
  }

  if (step.storySceneId) {
    const chapter = getChapterByStoryScene(step.storySceneId);
    if (chapter) {
      return {
        action: 'story',
        sceneId: step.storySceneId,
        chapterId: chapter.id,
      };
    }
  }

  return consumeStepAndAdvance();
}

/** Story finished during a guided walk — advance to the next map or finish. */
export function onPathStepStoryFinished(): PathWalkRoute {
  if (!session) return { action: 'home' };
  return consumeStepAndAdvance();
}

function consumeStepAndAdvance(): PathWalkRoute {
  if (!session) return { action: 'home' };

  session = { ...session, stepIndex: session.stepIndex + 1 };
  const path = getAncientPath(session.ancientId);

  if (session.stepIndex >= path.length) {
    return finishPathWalk();
  }

  return { action: 'combat', mapId: path[session.stepIndex]!.mapId };
}

function finishPathWalk(): PathWalkRoute {
  stopPathWalk();
  return { action: 'home' };
}

/** Route the next leg of a guided ancient path (combat, story, or return Home). */
export async function routePathWalk(route: PathWalkRoute): Promise<void> {
  if (route.action === 'story') {
    await SceneRouter.instance.switchTo('story', {
      chapterId: route.chapterId,
      sceneId: route.sceneId,
      replay: true,
      pathWalk: true,
    });
    return;
  }

  if (route.action === 'combat') {
    await SceneRouter.instance.switchTo('combat', { mapId: route.mapId });
    return;
  }

  await exitAncientDemo();
  await SceneRouter.instance.switchTo('home');
}

/** @internal Reset session state for tests. */
export function resetPathWalkSession(): void {
  session = null;
}
