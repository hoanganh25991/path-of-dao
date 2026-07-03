import { AudioManager } from '@/core/audio/AudioManager';
import { I18nManager } from '@/core/i18n/I18nManager';
import '@/core/audio/audio.css';

const OVERLAY_ID = 'audio-unlock-overlay';

/** iOS / autoplay policy — first tap resumes AudioContext (sub-plan 25). */
export class AudioUnlock {
  private static mounted = false;

  static mount(root: HTMLElement): void {
    if (AudioManager.isUnlocked() || AudioUnlock.mounted) return;
    AudioUnlock.mounted = true;

    const overlay = document.createElement('button');
    overlay.id = OVERLAY_ID;
    overlay.type = 'button';
    overlay.className = 'audio-unlock';
    overlay.dataset.testid = 'audio-unlock';
    overlay.setAttribute('aria-label', I18nManager.t('system.audio.unlock'));
    overlay.textContent = I18nManager.t('system.audio.unlock');

    const dismiss = async (): Promise<void> => {
      await AudioManager.unlock();
      overlay.remove();
      document.removeEventListener('pointerdown', onPointer, true);
    };

    const onPointer = (event: PointerEvent): void => {
      if (event.target === overlay || overlay.contains(event.target as Node)) {
        void dismiss();
        return;
      }
      void dismiss();
    };

    overlay.addEventListener('click', () => {
      void dismiss();
    });
    root.append(overlay);
    document.addEventListener('pointerdown', onPointer, true);
  }

  static resetForTests(): void {
    document.getElementById(OVERLAY_ID)?.remove();
    AudioUnlock.mounted = false;
  }
}
