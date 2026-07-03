import { EventBus } from '@/core/EventBus';
import { I18nManager } from '@/core/i18n/I18nManager';
import { gameStore } from '@/core/store/gameStore';
import { getMapConfig } from '@/combat/map/MapLoader';
import { getNextJourneyMapId, hasStartedJourney } from '@/progression/WorldProgression';
import { enterMapCombat, showWorldMap } from '@/ui/world/WorldMap';

export interface PlayPanelHandles {
  root: HTMLElement;
  refresh(): void;
  destroy(): void;
}

export function createPlayPanel(): PlayPanelHandles {
  const root = document.createElement('div');
  root.className = 'home-panel home-play';
  root.dataset.panel = 'play';

  const title = document.createElement('h2');
  title.className = 'home-panel__title';
  title.textContent = I18nManager.t('home.nav.play');

  const continueBtn = document.createElement('button');
  continueBtn.type = 'button';
  continueBtn.className = 'home-play__portal home-play__continue';
  continueBtn.dataset.testid = 'continue-journey-btn';
  continueBtn.addEventListener('click', () => {
    const save = gameStore.getState().save;
    if (!save) return;
    const mapId = getNextJourneyMapId(save);
    if (mapId) enterMapCombat(mapId);
  });

  const continueHint = document.createElement('p');
  continueHint.className = 'home-play__hint';
  continueHint.dataset.testid = 'continue-journey-hint';

  const completeHint = document.createElement('p');
  completeHint.className = 'home-play__hint home-play__hint--complete';
  completeHint.dataset.testid = 'journey-complete-hint';
  completeHint.hidden = true;

  const echoesBtn = document.createElement('button');
  echoesBtn.type = 'button';
  echoesBtn.className = 'home-play__echoes home-play__portal home-play__portal--secondary';
  echoesBtn.textContent = I18nManager.t('home.echoes_travel');
  echoesBtn.addEventListener('click', () => {
    EventBus.emit('home:open-tab', { tab: 'echoes' });
  });

  const echoesHint = document.createElement('p');
  echoesHint.className = 'home-play__hint home-play__hint--muted';
  echoesHint.textContent = I18nManager.t('home.echoes_travel_hint');

  const portalBtn = document.createElement('button');
  portalBtn.type = 'button';
  portalBtn.className = 'home-play__portal home-play__portal--secondary';
  portalBtn.dataset.testid = 'map-portal-btn';
  portalBtn.textContent = I18nManager.t('home.map_portal');
  portalBtn.addEventListener('click', () => {
    const uiRoot = document.getElementById('ui-root');
    if (!uiRoot) return;
    showWorldMap(uiRoot);
  });

  const portalHint = document.createElement('p');
  portalHint.className = 'home-play__hint home-play__hint--muted';
  portalHint.textContent = I18nManager.t('home.map_portal_hint');

  root.append(
    title,
    continueBtn,
    continueHint,
    completeHint,
    echoesBtn,
    echoesHint,
    portalBtn,
    portalHint,
  );

  const refresh = (): void => {
    const save = gameStore.getState().save;
    const mapId = save ? getNextJourneyMapId(save) : null;

    if (!mapId) {
      continueBtn.hidden = true;
      continueHint.hidden = true;
      if (save && hasStartedJourney(save)) {
        completeHint.hidden = false;
        completeHint.textContent = I18nManager.t('home.journey_complete');
      } else {
        completeHint.hidden = true;
      }
      return;
    }

    completeHint.hidden = true;
    try {
      const config = getMapConfig(mapId);
      continueBtn.hidden = false;
      continueHint.hidden = false;
      const labelKey = save && hasStartedJourney(save) ? 'home.continue' : 'home.begin_journey';
      continueBtn.textContent = I18nManager.t(labelKey);
      continueHint.textContent = I18nManager.t('home.continue_to', {
        map: I18nManager.t(config.displayNameKey),
      });
    } catch {
      continueBtn.hidden = true;
      continueHint.hidden = true;
    }
  };

  refresh();

  return { root, refresh, destroy: () => root.remove() };
}
