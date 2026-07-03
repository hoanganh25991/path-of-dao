import { SceneRouter } from '@/app/SceneRouter';
import { EventBus } from '@/core/EventBus';

let panel: HTMLElement | null = null;
let uiRoot: HTMLElement | null = null;

/** DEV-only scene switcher — portal buttons on Home play panel, compact pill in combat. */
export function initDevControls(root: HTMLElement): void {
  if (!import.meta.env.DEV || panel) return;

  uiRoot = root;

  panel = document.createElement('div');
  panel.className = 'dev-nav dev-nav--compact';
  panel.innerHTML = `
    <button type="button" class="dev-nav__scene-btn" data-scene="home" aria-label="Home">
      <span class="dev-nav__emoji" aria-hidden="true">🏠</span>
      <span class="dev-nav__label">Home</span>
    </button>
    <button type="button" class="dev-nav__scene-btn" data-scene="combat" aria-label="Combat">
      <span class="dev-nav__emoji" aria-hidden="true">⚔️</span>
      <span class="dev-nav__label">Combat</span>
    </button>
  `;

  panel.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-scene]');
    if (!target?.dataset.scene) return;
    void switchDevScene(target.dataset.scene);
  });

  root.appendChild(panel);

  EventBus.on('scene:changed', ({ id }) => {
    if (id !== 'home') setCompactMode();
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.code === 'KeyH') {
      event.preventDefault();
      void SceneRouter.instance.switchTo('home');
    }
    if (event.code === 'KeyC') {
      event.preventDefault();
      void SceneRouter.instance.switchTo('combat', { mapId: 'map.test.grove' });
    }
  });
}

export function attachDevControlsToPlaySlot(slot: HTMLElement): void {
  if (!panel) return;
  slot.appendChild(panel);
  panel.className = 'dev-nav dev-nav--home';
}

export function detachDevControlsToRoot(): void {
  if (!panel || !uiRoot) return;
  uiRoot.appendChild(panel);
  setCompactMode();
}

function setCompactMode(): void {
  if (!panel) return;
  panel.className = 'dev-nav dev-nav--compact';
}

async function switchDevScene(scene: string): Promise<void> {
  if (scene === 'home') {
    await SceneRouter.instance.switchTo('home');
    return;
  }
  if (scene === 'combat') {
    await SceneRouter.instance.switchTo('combat', { mapId: 'map.test.grove' });
  }
}

/** @internal Exposed for unit tests. */
export function resetDevControlsForTests(): void {
  panel?.remove();
  panel = null;
  uiRoot = null;
}
