import { GameShell } from '@/app/GameShell';
import { SceneRouter } from '@/app/SceneRouter';
import { createDefaultSceneHost } from '@/app/createDefaultSceneHost';
import { EventBus } from '@/core/EventBus';
import { GameClock } from '@/core/GameClock';
import { I18nManager } from '@/core/i18n/I18nManager';
import { OrientationManager } from '@/app/OrientationManager';
import { connectAutosave, gameStore, startPlayTimeTracking } from '@/core/store/gameStore';
import { syncRealmProgress } from '@/progression/BreakthroughManager';
import { devPrepareAwakening } from '@/combat/components/CombatComponent';
import { getEncounterDefinition } from '@/progression/EncounterLoader';
import { FortuitousEncounterManager } from '@/progression/FortuitousEncounterManager';
import { buildPlayerStats } from '@/progression/playerStats';
import { initDevControls } from '@/app/DevControls';
import { seedRoadProgress, seedBossClearPendingStory, seedReadyForOrdeal, devEnterStory, devRequestMapExit, devEnterMapCombat, devShowEncounter, devSimulateMapClear } from '@/dev/DevSaveSeeds';
import { CombatHUD } from '@/ui/hud/CombatHUD';
import { HomeUI } from '@/ui/home/HomeUI';
import { AudioManager } from '@/core/audio/AudioManager';
import { AudioDirector } from '@/core/audio/AudioDirector';
import { AudioUnlock } from '@/core/audio/AudioUnlock';
import { mountUiSounds } from '@/core/audio/UiSound';

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
      AudioManager.init(save);
      AudioDirector.mount();
    }

    const elements = GameShell.mount(root);
    AudioUnlock.mount(root);
    mountUiSounds(root);
    CombatHUD.init(elements.uiRoot);
    HomeUI.init(elements.uiRoot);
    App.mountDevControls(elements.uiRoot);
    App.registerVisibilityHandlers();

    const router = SceneRouter.init(elements, createDefaultSceneHost);
    OrientationManager.init();
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
    (window as unknown as Record<string, unknown>).__devPrepareBreakthrough = (): void => {
      gameStore.getState().patch((current) => {
        const stats = buildPlayerStats('hero.wanderer', 5, current.realm.id);
        const interim = { ...current, stats: { ...stats, spirit: 100 } };
        const { realm } = syncRealmProgress(interim);
        return { stats: interim.stats, realm };
      });
    };
    (window as unknown as Record<string, unknown>).__devPrepareAwakening = (
      intentId = 'void',
    ): void => {
      devPrepareAwakening(intentId);
    };
    (window as unknown as Record<string, unknown>).__devTriggerEncounter = (
      encounterId: string,
    ): void => {
      FortuitousEncounterManager.apply(getEncounterDefinition(encounterId));
    };
    (window as unknown as Record<string, unknown>).__devSeedRoadProgress = (
      chaptersComplete: number,
    ): Promise<void> => seedRoadProgress(chaptersComplete);
    (window as unknown as Record<string, unknown>).__devSeedBossPendingStory = (
      chapterIndex: number,
    ): Promise<void> => seedBossClearPendingStory(chapterIndex);
    (window as unknown as Record<string, unknown>).__devSeedReadyForOrdeal = (
      chapterIndex: number,
    ): Promise<void> => seedReadyForOrdeal(chapterIndex);
    (window as unknown as Record<string, unknown>).__devEnterStory = (
      chapterId: string,
      sceneId: string,
    ): void => devEnterStory(chapterId, sceneId);
    (window as unknown as Record<string, unknown>).__devRequestMapExit = (
      wavesCleared: boolean,
    ): void => devRequestMapExit(wavesCleared);
    (window as unknown as Record<string, unknown>).__devEnterMapCombat = (
      mapId: string,
    ): void => devEnterMapCombat(mapId);
    (window as unknown as Record<string, unknown>).__devShowEncounter = (
      encounterId: string,
    ): Promise<void> => devShowEncounter(encounterId);
    (window as unknown as Record<string, unknown>).__devSimulateMapClear = (
      mapId: string,
      wavesCleared: boolean,
    ): Promise<void> => devSimulateMapClear(mapId, wavesCleared);

    initDevControls();
  }
}
