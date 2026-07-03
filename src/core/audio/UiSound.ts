import { AudioDirector } from '@/core/audio/AudioDirector';

const INTERACTIVE_SELECTOR =
  'button, [role="button"], [role="tab"], a[href], .home-ui__interactive, .action-btn';

const SKIP_SELECTOR = '#audio-unlock-overlay';

/** Global UI click → ui.tap (sub-plan 25). Skips the audio-unlock overlay itself. */
export function mountUiSounds(root: HTMLElement): () => void {
  const onClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest(SKIP_SELECTOR)) return;
    if (!target.closest(INTERACTIVE_SELECTOR)) return;
    AudioDirector.playUiTap();
  };

  root.addEventListener('click', onClick, true);
  return () => root.removeEventListener('click', onClick, true);
}
