import '@/ui/modals/encounter.css';
import { I18nManager } from '@/core/i18n/I18nManager';
import { FortuitousEncounterManager } from '@/progression/FortuitousEncounterManager';
import type { EncounterDefinition } from '@/shared/schemas/fortuitous-encounters';

export interface EncounterModalOptions {
  encounter: EncounterDefinition;
  poiKey?: string;
}

const SLOWMO_MS = 1000;

/** Full-screen fortuitous encounter card (sub-plan 15 §6). */
export function showEncounterModal(
  uiRoot: HTMLElement,
  options: EncounterModalOptions,
): Promise<boolean> {
  return new Promise((resolve) => {
    const { encounter, poiKey } = options;
    const themeClass = `encounter-modal--${encounter.theme}`;

    const overlay = document.createElement('div');
    overlay.className = `encounter-modal ${themeClass}`.trim();
    overlay.dataset.testid = 'encounter-modal';

    const backdrop = document.createElement('div');
    backdrop.className = 'encounter-modal__backdrop';

    const card = document.createElement('div');
    card.className = 'encounter-modal__card';

    const art = document.createElement('div');
    art.className = 'encounter-modal__art';

    if (encounter.illustration) {
      const img = document.createElement('img');
      img.className = 'encounter-modal__art-img';
      img.src = encounter.illustration;
      img.alt = '';
      art.appendChild(img);
    }

    const title = document.createElement('p');
    title.className = 'encounter-modal__title';
    title.textContent = I18nManager.t(encounter.displayNameKey);

    const flavor = document.createElement('p');
    flavor.className = 'encounter-modal__flavor';
    flavor.textContent = I18nManager.t(encounter.flavorKey);

    const confirm = document.createElement('button');
    confirm.type = 'button';
    confirm.className = 'encounter-modal__confirm';
    confirm.textContent = I18nManager.t('encounter.confirm');
    confirm.hidden = true;

    const burst = document.createElement('div');
    burst.className = 'encounter-modal__burst';
    burst.hidden = true;

    card.append(art, title, flavor, confirm);
    overlay.append(backdrop, card, burst);
    uiRoot.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('encounter-modal--active'));

    const cleanup = (): void => {
      overlay.classList.remove('encounter-modal--active');
      setTimeout(() => overlay.remove(), 400);
    };

    setTimeout(() => {
      confirm.hidden = false;
      confirm.classList.add('encounter-modal__confirm--visible');
    }, SLOWMO_MS);

    confirm.addEventListener('click', () => {
      burst.hidden = false;
      burst.classList.add('encounter-modal__burst--active');
      FortuitousEncounterManager.apply(encounter, poiKey);
      showFortuneToast(I18nManager.t(encounter.displayNameKey));
      setTimeout(() => {
        cleanup();
        resolve(true);
      }, 500);
    });
  });
}

function showFortuneToast(displayNameKey: string): void {
  const toast = document.createElement('div');
  toast.className = 'home-toast home-ui__interactive';
  toast.textContent = I18nManager.t('home.fortune_received', {
    name: I18nManager.t(displayNameKey),
  });
  document.body.appendChild(toast);
  toast.addEventListener('animationend', () => toast.remove());
}
