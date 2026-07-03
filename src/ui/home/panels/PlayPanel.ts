import { SceneRouter } from '@/app/SceneRouter';
import { I18nManager } from '@/core/i18n/I18nManager';
import { gameStore } from '@/core/store/gameStore';

export interface PlayPanelHandles {
  root: HTMLElement;
  refresh(): void;
  destroy(): void;
}

function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'home-toast home-ui__interactive';
  toast.textContent = message;
  document.body.appendChild(toast);
  toast.addEventListener('animationend', () => toast.remove());
}

export function createPlayPanel(): PlayPanelHandles {
  const root = document.createElement('div');
  root.className = 'home-panel home-play';
  root.dataset.panel = 'play';

  const title = document.createElement('h2');
  title.className = 'home-panel__title';
  title.textContent = I18nManager.t('home.nav.play');

  const portalBtn = document.createElement('button');
  portalBtn.type = 'button';
  portalBtn.className = 'home-play__portal';
  portalBtn.textContent = I18nManager.t('home.map_portal');
  portalBtn.addEventListener('click', () => {
    showToast(I18nManager.t('home.coming_soon'));
  });

  const hint = document.createElement('p');
  hint.className = 'home-play__hint';
  hint.textContent = I18nManager.t('home.map_portal_hint');

  const continueBtn = document.createElement('button');
  continueBtn.type = 'button';
  continueBtn.className = 'home-play__continue';
  continueBtn.hidden = true;
  continueBtn.textContent = I18nManager.t('home.continue');
  continueBtn.addEventListener('click', () => {
    const mapId = gameStore.getState().save?.progress.currentMapId;
    if (!mapId) return;
    void SceneRouter.instance.switchTo('combat', { mapId });
  });

  root.append(title, portalBtn, hint, continueBtn);

  const refresh = (): void => {
    const mapId = gameStore.getState().save?.progress.currentMapId;
    continueBtn.hidden = !mapId;
  };

  refresh();

  return { root, refresh, destroy: () => root.remove() };
}
