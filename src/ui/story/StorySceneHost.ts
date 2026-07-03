import { SceneRouter } from '@/app/SceneRouter';
import type { SceneHost } from '@/app/SceneHost';
import type { ScenePayload } from '@/app/SceneId';
import { EventBus } from '@/core/EventBus';
import { SaveManager } from '@/core/save/SaveManager';
import { gameStore } from '@/core/store/gameStore';
import { completeStory } from '@/progression/ChapterManager';
import { getNextJourneyMapId } from '@/progression/WorldProgression';
import { onPathStepStoryFinished, routePathWalk } from '@/progression/PathWalkManager';
import { openStoryReader } from '@/ui/story/StoryReader';

/** Full-screen HTML story mode — hides game canvases via GameShell. */
export class StorySceneHost implements SceneHost {
  readonly id = 'story' as const;

  private reader: ReturnType<typeof openStoryReader> | null = null;

  constructor(private readonly payload: ScenePayload['story']) {}

  async mount(_container: HTMLElement): Promise<void> {
    const uiRoot = document.getElementById('ui-root');
    if (!uiRoot) {
      throw new Error('StorySceneHost: #ui-root not found');
    }

    const replay = this.payload.replay === true;

    this.reader = openStoryReader(uiRoot, {
      sceneId: this.payload.sceneId,
      onFinished: () => {
        this.finishStory(replay);
      },
      onSkip: () => {
        this.finishStory(replay);
      },
    });
  }

  private finishStory(replay: boolean): void {
    if (this.payload.pathWalk) {
      void routePathWalk(onPathStepStoryFinished());
      return;
    }

    const store = gameStore.getState();
    const save = store.save;
    if (save) {
      const prevUnlocked = save.progress.unlockedChapters;
      const { save: completed } = completeStory(save, this.payload.sceneId, !replay);
      const nextMapId = getNextJourneyMapId(completed);
      const next = {
        ...completed,
        progress: {
          ...completed.progress,
          currentMapId: nextMapId,
        },
      };
      store.patch(next);
      void store.persist();
      SaveManager.scheduleAutosave();

      if (!replay) {
        const unlocked = next.progress.unlockedChapters.find((id) => !prevUnlocked.includes(id));
        if (unlocked) {
          EventBus.emit('chapter:unlocked', { chapterId: unlocked });
        }
      }
    }
    void SceneRouter.instance.switchTo('home');
  }

  async unmount(): Promise<void> {
    this.reader?.destroy();
    this.reader = null;
  }

  pause(): void {}

  resume(): void {}
}
