import { FullscreenManager } from '@/app/FullscreenManager';
import { SceneRouter } from '@/app/SceneRouter';
import { AudioDirector } from '@/core/audio/AudioDirector';
import { AudioManager } from '@/core/audio/AudioManager';
import { I18nManager } from '@/core/i18n/I18nManager';
import '@/core/audio/audio.css';

const OVERLAY_ID = 'audio-unlock-overlay';

/** iOS / autoplay policy — first tap resumes AudioContext (sub-plan 25). */
export class AudioUnlock {
  private static mounted = false;
  private static pointerHandler: ((event: PointerEvent) => void) | null = null;

  static mount(root: HTMLElement): void {
    if (AudioManager.isUnlocked() || AudioUnlock.mounted) return;
    AudioUnlock.mounted = true;

    const finishUnlock = async (): Promise<void> => {
      FullscreenManager.requestOnBootGesture();
      await AudioManager.unlock();
      AudioUnlock.teardown();
      AudioUnlock.resumeSceneAudio();
    };

    const onPointer = (): void => {
      void finishUnlock();
    };

    AudioUnlock.pointerHandler = onPointer;

    if (AudioManager.hasPersistedUnlock()) {
      document.addEventListener('pointerdown', onPointer, true);
      return;
    }

    const overlay = document.createElement('button');
    overlay.id = OVERLAY_ID;
    overlay.type = 'button';
    overlay.className = 'audio-unlock';
    overlay.dataset.testid = 'audio-unlock';
    overlay.setAttribute('aria-label', I18nManager.t('system.audio.unlock'));
    overlay.textContent = I18nManager.t('system.audio.unlock');

    overlay.addEventListener('click', () => {
      void finishUnlock();
    });
    root.append(overlay);
    document.addEventListener('pointerdown', onPointer, true);
  }

  private static resumeSceneAudio(): void {
    try {
      const sceneId = SceneRouter.instance.current;
      if (sceneId) AudioDirector.playSceneBgm(sceneId);
    } catch {
      /* router not ready yet — scene:changed will pick up BGM */
    }
  }

  private static teardown(): void {
    document.getElementById(OVERLAY_ID)?.remove();
    if (AudioUnlock.pointerHandler) {
      document.removeEventListener('pointerdown', AudioUnlock.pointerHandler, true);
      AudioUnlock.pointerHandler = null;
    }
    AudioUnlock.mounted = false;
  }

  static resetForTests(): void {
    AudioUnlock.teardown();
  }
}
