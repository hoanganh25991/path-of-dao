import '@/ui/modals/settings.css';
import { EventBus } from '@/core/EventBus';
import { I18nManager, type LocalePreference } from '@/core/i18n/I18nManager';
import { gameStore } from '@/core/store/gameStore';

const LOCALE_OPTIONS: LocalePreference[] = ['system', 'en', 'vi'];

function localeLabelKey(preference: LocalePreference): string {
  return `home.settings.locale.${preference}`;
}

/** Settings overlay — language preference with system default support. */
export function showSettingsModal(uiRoot: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const save = gameStore.getState().save;
    if (!save) {
      resolve();
      return;
    }

    let selected = save.settings.locale;

    const overlay = document.createElement('div');
    overlay.className = 'settings-modal';
    overlay.dataset.testid = 'settings-modal';

    const backdrop = document.createElement('div');
    backdrop.className = 'settings-modal__backdrop';

    const card = document.createElement('div');
    card.className = 'settings-modal__card';

    const header = document.createElement('div');
    header.className = 'settings-modal__header';

    const title = document.createElement('h2');
    title.className = 'settings-modal__title';
    title.textContent = I18nManager.t('home.settings.title');

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'settings-modal__close';
    closeBtn.setAttribute('aria-label', I18nManager.t('home.settings.close'));
    closeBtn.textContent = '×';

    header.append(title, closeBtn);

    const sectionTitle = document.createElement('p');
    sectionTitle.className = 'settings-modal__section-title';
    sectionTitle.textContent = I18nManager.t('home.settings.language');

    const options = document.createElement('div');
    options.className = 'settings-modal__options';
    options.setAttribute('role', 'radiogroup');
    options.setAttribute('aria-label', I18nManager.t('home.settings.language'));

    const optionButtons: HTMLLabelElement[] = [];

    const syncSelection = (): void => {
      for (const label of optionButtons) {
        const value = label.dataset.value as LocalePreference;
        const input = label.querySelector('input');
        const active = value === selected;
        label.classList.toggle('settings-modal__option--selected', active);
        if (input instanceof HTMLInputElement) input.checked = active;
      }
    };

    const refreshModalCopy = (): void => {
      title.textContent = I18nManager.t('home.settings.title');
      closeBtn.setAttribute('aria-label', I18nManager.t('home.settings.close'));
      sectionTitle.textContent = I18nManager.t('home.settings.language');
      options.setAttribute('aria-label', I18nManager.t('home.settings.language'));
      for (const label of optionButtons) {
        const value = label.dataset.value as LocalePreference;
        const text = label.querySelector('span');
        if (text) text.textContent = I18nManager.t(localeLabelKey(value));
      }
    };

    for (const preference of LOCALE_OPTIONS) {
      const label = document.createElement('label');
      label.className = 'settings-modal__option';
      label.dataset.value = preference;

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'locale-preference';
      input.value = preference;

      const text = document.createElement('span');
      text.textContent = I18nManager.t(localeLabelKey(preference));

      label.append(input, text);
      label.addEventListener('click', () => {
        if (selected === preference) return;
        selected = preference;
        syncSelection();
        void applyLocalePreference(preference).then(refreshModalCopy);
      });

      optionButtons.push(label);
      options.appendChild(label);
    }

    card.append(header, sectionTitle, options);
    overlay.append(backdrop, card);
    uiRoot.appendChild(overlay);

    syncSelection();
    requestAnimationFrame(() => overlay.classList.add('settings-modal--active'));

    const cleanup = (): void => {
      overlay.classList.remove('settings-modal--active');
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 300);
    };

    closeBtn.addEventListener('click', cleanup);
    backdrop.addEventListener('click', cleanup);
  });
}

async function applyLocalePreference(preference: LocalePreference): Promise<void> {
  const current = gameStore.getState().save;
  if (!current || current.settings.locale === preference) return;

  gameStore.getState().patch((save) => ({
    settings: { ...save.settings, locale: preference },
  }));

  await I18nManager.load(preference);
  await gameStore.getState().persist();

  EventBus.emit('settings:locale-changed', {
    preference,
    locale: I18nManager.locale,
  });
}
