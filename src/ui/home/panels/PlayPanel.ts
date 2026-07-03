import { EventBus } from '@/core/EventBus';
import { I18nManager } from '@/core/i18n/I18nManager';
import { showWorldMap } from '@/ui/world/WorldMap';

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

  const devSlot = document.createElement('div');
  devSlot.className = 'home-play__dev-slot';

  const echoesBtn = document.createElement('button');
  echoesBtn.type = 'button';
  echoesBtn.className = 'home-play__echoes home-play__portal';
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
  portalBtn.textContent = I18nManager.t('home.map_portal');
  portalBtn.addEventListener('click', () => {
    const uiRoot = document.getElementById('ui-root');
    if (!uiRoot) return;
    showWorldMap(uiRoot);
  });

  const portalHint = document.createElement('p');
  portalHint.className = 'home-play__hint home-play__hint--muted';
  portalHint.textContent = I18nManager.t('home.map_portal_hint');

  root.append(title, devSlot, echoesBtn, echoesHint, portalBtn, portalHint);

  const refresh = (): void => {};

  refresh();

  return { root, refresh, destroy: () => root.remove() };
}
