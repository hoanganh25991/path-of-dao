import { getMapConfig } from '@/combat/map/MapLoader';
import { I18nManager } from '@/core/i18n/I18nManager';
import { realmCapLabelKeyForOrder } from '@/progression/CultivationDisplay';
import '@/ui/modals/map-intro.css';

export interface MapIntroModalOptions {
  mapId: string;
}

/** Story-as-you-play intro when entering a map for the first time. */
export function showMapIntroModal(
  uiRoot: HTMLElement,
  options: MapIntroModalOptions,
): Promise<void> {
  return new Promise((resolve) => {
    const config = getMapConfig(options.mapId);
    const name = I18nManager.t(config.displayNameKey);
    const descKey = `${options.mapId}.desc`;
    const descRaw = I18nManager.t(descKey);
    const desc = descRaw !== descKey && !descRaw.startsWith('[missing:') ? descRaw : '';

    const realmCapKey = realmCapLabelKeyForOrder(config.recommendedRealmOrder);
    const realmCap = I18nManager.t(realmCapKey);

    const overlay = document.createElement('div');
    overlay.className = 'map-intro-modal home-ui__interactive';
    overlay.dataset.testid = 'map-intro-modal';

    const backdrop = document.createElement('div');
    backdrop.className = 'map-intro-modal__backdrop';

    const panel = document.createElement('div');
    panel.className = 'map-intro-modal__panel';

    const title = document.createElement('h2');
    title.className = 'map-intro-modal__title';
    title.textContent = name;

    panel.append(title);

    if (desc) {
      const lore = document.createElement('p');
      lore.className = 'map-intro-modal__lore';
      lore.textContent = desc;
      panel.append(lore);
    }

    const cap = document.createElement('p');
    cap.className = 'map-intro-modal__cap';
    cap.textContent = I18nManager.t('map.intro.realm_cap', { realm: realmCap });
    panel.append(cap);

    const continueBtn = document.createElement('button');
    continueBtn.type = 'button';
    continueBtn.className = 'map-intro-modal__continue';
    continueBtn.textContent = I18nManager.t('map.intro.continue');
    continueBtn.addEventListener('click', () => finish());

    panel.append(continueBtn);
    overlay.append(backdrop, panel);
    uiRoot.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('map-intro-modal--active'));

    const finish = (): void => {
      overlay.classList.remove('map-intro-modal--active');
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 280);
    };

    backdrop.addEventListener('click', finish);
  });
}
