import type { SceneId } from '@/app/SceneId';
import { EventBus } from '@/core/EventBus';
import { FpsCounter } from '@/ui/hud/FpsCounter';
import { CombatPauseMenu } from '@/ui/hud/CombatPauseMenu';
import '@/ui/hud/top-right-hud.css';

const SCENE_ICONS: Record<'home' | 'combat', string> = {
  home: '🏠',
  combat: '⚔',
};

/** Top-right row: FPS readout + scene indicator chips + combat pause. */
export class TopRightHud {
  private static mounted = false;
  private static root: HTMLElement | null = null;
  private static homeChip: HTMLElement | null = null;
  private static combatChip: HTMLElement | null = null;
  private static pauseSlot: HTMLElement | null = null;
  private static scene: SceneId = 'home';
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

    const sceneRow = document.createElement('div');
    sceneRow.className = 'scene-indicator';
    sceneRow.dataset.testid = 'scene-indicator';

    const homeChip = document.createElement('span');
    homeChip.className = 'scene-indicator__chip scene-indicator__chip--home';
    homeChip.dataset.testid = 'scene-indicator-home';
    homeChip.setAttribute('aria-hidden', 'true');
    homeChip.textContent = SCENE_ICONS.home;

    const combatChip = document.createElement('span');
    combatChip.className = 'scene-indicator__chip scene-indicator__chip--combat';
    combatChip.dataset.testid = 'scene-indicator-combat';
    combatChip.setAttribute('aria-hidden', 'true');
    combatChip.textContent = SCENE_ICONS.combat;

    const pauseSlot = document.createElement('div');
    pauseSlot.className = 'scene-indicator__pause-slot';
    pauseSlot.dataset.testid = 'scene-indicator-pause-slot';

    sceneRow.append(homeChip, combatChip, pauseSlot);
    root.append(fps, sceneRow);
    uiRoot.appendChild(root);

    TopRightHud.root = root;
    TopRightHud.homeChip = homeChip;
    TopRightHud.combatChip = combatChip;
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
    TopRightHud.homeChip = null;
    TopRightHud.combatChip = null;
    TopRightHud.pauseSlot = null;
    TopRightHud.mounted = false;
  }

  /** @internal Exposed for unit tests. */
  static resetForTests(): void {
    TopRightHud.destroy();
  }

  private static applyScene(id: SceneId): void {
    TopRightHud.scene = id;
    TopRightHud.homeChip?.classList.toggle('scene-indicator__chip--active', id === 'home');
    TopRightHud.combatChip?.classList.toggle('scene-indicator__chip--active', id === 'combat');
    TopRightHud.pauseSlot?.classList.toggle('scene-indicator__pause-slot--visible', id === 'combat');
  }
}
