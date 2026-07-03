import { SceneRouter } from '@/app/SceneRouter';
import type { SceneHost } from '@/app/SceneHost';
import type { ScenePayload } from '@/app/SceneId';
import { SaveManager } from '@/core/save/SaveManager';
import { gameStore } from '@/core/store/gameStore';
import { completeStory } from '@/progression/ChapterManager';
import { getChapter } from '@/progression/ChapterLoader';
import { I18nManager } from '@/core/i18n/I18nManager';
import { onPathStepStoryFinished, routePathWalk } from '@/progression/PathWalkManager';
import { openStoryReader } from '@/ui/story/StoryReader';

function showHomeToast(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'home-toast home-ui__interactive';
  toast.textContent = message;
  document.body.appendChild(toast);
  toast.addEventListener('animationend', () => toast.remove());
}

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
      const { save: next } = completeStory(save, this.payload.sceneId, !replay);
      store.patch(next);
      void store.persist();
      SaveManager.scheduleAutosave();

      if (!replay) {
        const unlocked = next.progress.unlockedChapters.find((id) => !prevUnlocked.includes(id));
        if (unlocked) {
          try {
            const chapter = getChapter(unlocked);
            showHomeToast(I18nManager.t('home.chapter_unlocked', {
              chapter: I18nManager.t(chapter.titleKey),
            }));
          } catch {
            // unknown chapter id — skip toast
          }
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
