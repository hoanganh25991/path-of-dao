import { SceneRouter } from '@/app/SceneRouter';
import type { SceneHost } from '@/app/SceneHost';
import type { ScenePayload } from '@/app/SceneId';
import { SaveManager } from '@/core/save/SaveManager';
import { gameStore } from '@/core/store/gameStore';
import { completeStory } from '@/progression/ChapterManager';
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
    const store = gameStore.getState();
    const save = store.save;
    if (save) {
      const { save: next } = completeStory(save, this.payload.sceneId, !replay);
      store.patch(next);
      void store.persist();
      SaveManager.scheduleAutosave();
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
