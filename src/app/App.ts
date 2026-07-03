import { GameShell } from '@/app/GameShell';
import { SceneRouter } from '@/app/SceneRouter';
import { createDefaultSceneHost } from '@/app/createDefaultSceneHost';
import { EventBus } from '@/core/EventBus';
import { GameClock } from '@/core/GameClock';
import { I18nManager } from '@/core/i18n/I18nManager';
import { connectAutosave, gameStore, startPlayTimeTracking } from '@/core/store/gameStore';
import { CombatHUD } from '@/ui/hud/CombatHUD';
import { HomeUI } from '@/ui/home/HomeUI';

export class App {
  private static initialized = false;

  static async init(): Promise<void> {
    if (App.initialized) return;

    const root = document.getElementById('app');
    if (!root) {
      throw new Error('App.init: #app element not found');
    }

    await gameStore.getState().load();
    connectAutosave();
    startPlayTimeTracking();

    const save = gameStore.getState().save;
    if (save) {
      await I18nManager.load(save.settings.locale);
    }

    const elements = GameShell.mount(root);
    CombatHUD.init(elements.uiRoot);
    HomeUI.init(elements.uiRoot);
    App.mountDevControls(elements.uiRoot);
    App.registerVisibilityHandlers();

    const router = SceneRouter.init(elements, createDefaultSceneHost);
    await router.switchTo('home');

    App.initialized = true;
  }

  private static registerVisibilityHandlers(): void {
    document.addEventListener('visibilitychange', () => {
      const router = SceneRouter.instance;

      if (document.hidden) {
        GameClock.pause();
        EventBus.emit('app:pause', undefined);
        router.pauseActiveHost();
        return;
      }

      GameClock.resume();
      EventBus.emit('app:resume', undefined);
      router.resumeActiveHost();
    });
  }

  private static mountDevControls(uiRoot: HTMLElement): void {
    if (!import.meta.env.DEV) return;

    // Debug handles for browser smoke tests / console poking.
    (window as unknown as Record<string, unknown>).__gameStore = gameStore;
    (window as unknown as Record<string, unknown>).__eventBus = EventBus;

    const panel = document.createElement('div');
    panel.className = 'dev-nav';
    panel.innerHTML = `
      <button type="button" data-scene="home">Home (H)</button>
      <button type="button" data-scene="combat">Combat (C)</button>
    `;

    panel.addEventListener('click', (event) => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-scene]');
      if (!target) return;
      void App.switchDevScene(target.dataset.scene);
    });

    uiRoot.appendChild(panel);

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

  private static async switchDevScene(scene: string | undefined): Promise<void> {
    if (scene === 'home') {
      await SceneRouter.instance.switchTo('home');
      return;
    }
    if (scene === 'combat') {
      await SceneRouter.instance.switchTo('combat', { mapId: 'map.test.grove' });
    }
  }
}
