import { SceneRouter } from '@/app/SceneRouter';

/** DEV-only keyboard scene shortcuts — no on-screen Home/Combat icons (use Journey + pause menu). */
export function initDevControls(): void {
  if (!import.meta.env.DEV) return;

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

/** @internal Exposed for unit tests. */
export function resetDevControlsForTests(): void {
  // no-op — keyboard listener persists for test session; tests don't mount dev UI
}
