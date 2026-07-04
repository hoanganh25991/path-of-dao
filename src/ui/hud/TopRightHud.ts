import type { SceneId } from '@/app/SceneId';
import { EventBus } from '@/core/EventBus';
import { FpsCounter } from '@/ui/hud/FpsCounter';
import { CombatPauseMenu } from '@/ui/hud/CombatPauseMenu';
import '@/ui/hud/top-right-hud.css';

/** Top-right row: FPS readout + combat pause (combat only). */
export class TopRightHud {
  private static mounted = false;
  private static root: HTMLElement | null = null;
  private static pauseSlot: HTMLElement | null = null;
  private static unsubscribeScene: (() => void) | null = null;

  static init(uiRoot: HTMLElement): void {
    if (TopRightHud.mounted) return;

    const root = document.createElement('div');
    root.className = 'top-right-hud';
    root.dataset.testid = 'top-right-hud';

    const fps = document.createElement('div');
    fps.className = 'fps-counter';
    fps.dataset.testid = 'fps-counter';
    fps.setAttribute('aria-label', 'Frames per second');
    fps.textContent = '—';

    const pauseSlot = document.createElement('div');
    pauseSlot.className = 'top-right-hud__pause-slot';
    pauseSlot.dataset.testid = 'top-right-pause-slot';

    root.append(fps, pauseSlot);
    uiRoot.appendChild(root);

    TopRightHud.root = root;
    TopRightHud.pauseSlot = pauseSlot;

    FpsCounter.mount(fps);
    CombatPauseMenu.mountPauseButton(pauseSlot);

    TopRightHud.unsubscribeScene = EventBus.on('scene:changed', ({ id }) => {
      TopRightHud.applyScene(id);
    });
    TopRightHud.applyScene('home');

    TopRightHud.mounted = true;
  }

  static destroy(): void {
    TopRightHud.unsubscribeScene?.();
    TopRightHud.unsubscribeScene = null;
    CombatPauseMenu.unmountPauseButton();
    FpsCounter.destroy();
    TopRightHud.root?.remove();
    TopRightHud.root = null;
    TopRightHud.pauseSlot = null;
    TopRightHud.mounted = false;
  }

  /** @internal Exposed for unit tests. */
  static resetForTests(): void {
    TopRightHud.destroy();
  }

  private static applyScene(id: SceneId): void {
    TopRightHud.pauseSlot?.classList.toggle('top-right-hud__pause-slot--visible', id === 'combat');
  }
}
