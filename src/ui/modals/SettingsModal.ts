import '@/ui/modals/settings.css';
import { EventBus } from '@/core/EventBus';
import { I18nManager, type LocalePreference } from '@/core/i18n/I18nManager';
import type { QualityPreference } from '@/app/QualityProfile';
import { VERSION } from '@/app/version';
import { gameStore } from '@/core/store/gameStore';

const LOCALE_OPTIONS: LocalePreference[] = ['system', 'en', 'vi'];
const QUALITY_OPTIONS: QualityPreference[] = ['auto', 'low', 'mid', 'high'];

function localeLabelKey(preference: LocalePreference): string {
  return `home.settings.locale.${preference}`;
}

function qualityLabelKey(preference: QualityPreference): string {
  return `home.settings.quality.${preference}`;
}

/** Settings overlay — language, performance, version. */
export function showSettingsModal(uiRoot: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const save = gameStore.getState().save;
    if (!save) {
      resolve();
      return;
    }

    let selectedLocale = save.settings.locale;
    let selectedQuality = save.settings.quality;

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

    const localeTitle = document.createElement('p');
    localeTitle.className = 'settings-modal__section-title';
    localeTitle.textContent = I18nManager.t('home.settings.language');

    const localeOptions = document.createElement('div');
    localeOptions.className = 'settings-modal__options';
    localeOptions.setAttribute('role', 'radiogroup');
    localeOptions.setAttribute('aria-label', I18nManager.t('home.settings.language'));

    const qualityTitle = document.createElement('p');
    qualityTitle.className = 'settings-modal__section-title';
    qualityTitle.textContent = I18nManager.t('home.settings.quality');

    const qualityOptions = document.createElement('div');
    qualityOptions.className = 'settings-modal__options';
    qualityOptions.setAttribute('role', 'radiogroup');
    qualityOptions.setAttribute('aria-label', I18nManager.t('home.settings.quality'));

    const version = document.createElement('p');
    version.className = 'settings-modal__version';
    version.textContent = I18nManager.t('home.settings.version', { version: VERSION });

    const localeButtons: HTMLLabelElement[] = [];
    const qualityButtons: HTMLLabelElement[] = [];

    const syncLocaleSelection = (): void => {
      for (const label of localeButtons) {
        const value = label.dataset.value as LocalePreference;
        const input = label.querySelector('input');
        const active = value === selectedLocale;
        label.classList.toggle('settings-modal__option--selected', active);
        if (input instanceof HTMLInputElement) input.checked = active;
      }
    };

    const syncQualitySelection = (): void => {
      for (const label of qualityButtons) {
        const value = label.dataset.value as QualityPreference;
        const input = label.querySelector('input');
        const active = value === selectedQuality;
        label.classList.toggle('settings-modal__option--selected', active);
        if (input instanceof HTMLInputElement) input.checked = active;
      }
    };

    const refreshModalCopy = (): void => {
      title.textContent = I18nManager.t('home.settings.title');
      closeBtn.setAttribute('aria-label', I18nManager.t('home.settings.close'));
      localeTitle.textContent = I18nManager.t('home.settings.language');
      localeOptions.setAttribute('aria-label', I18nManager.t('home.settings.language'));
      qualityTitle.textContent = I18nManager.t('home.settings.quality');
      qualityOptions.setAttribute('aria-label', I18nManager.t('home.settings.quality'));
      version.textContent = I18nManager.t('home.settings.version', { version: VERSION });

      for (const label of localeButtons) {
        const value = label.dataset.value as LocalePreference;
        const text = label.querySelector('span');
        if (text) text.textContent = I18nManager.t(localeLabelKey(value));
      }
      for (const label of qualityButtons) {
        const value = label.dataset.value as QualityPreference;
        const text = label.querySelector('span');
        if (text) text.textContent = I18nManager.t(qualityLabelKey(value));
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
        if (selectedLocale === preference) return;
        selectedLocale = preference;
        syncLocaleSelection();
        void applyLocalePreference(preference).then(refreshModalCopy);
      });

      localeButtons.push(label);
      localeOptions.appendChild(label);
    }

    for (const preference of QUALITY_OPTIONS) {
      const label = document.createElement('label');
      label.className = 'settings-modal__option';
      label.dataset.value = preference;

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'quality-preference';
      input.value = preference;

      const text = document.createElement('span');
      text.textContent = I18nManager.t(qualityLabelKey(preference));

      label.append(input, text);
      label.addEventListener('click', () => {
        if (selectedQuality === preference) return;
        selectedQuality = preference;
        syncQualitySelection();
        void applyQualityPreference(preference);
      });

      qualityButtons.push(label);
      qualityOptions.appendChild(label);
    }

    card.append(header, localeTitle, localeOptions, qualityTitle, qualityOptions, version);
    overlay.append(backdrop, card);
    uiRoot.appendChild(overlay);

    syncLocaleSelection();
    syncQualitySelection();
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

async function applyQualityPreference(preference: QualityPreference): Promise<void> {
  const current = gameStore.getState().save;
  if (!current || current.settings.quality === preference) return;

  gameStore.getState().patch((save) => ({
    settings: { ...save.settings, quality: preference },
  }));
  await gameStore.getState().persist();

  EventBus.emit('settings:quality-changed', { preference });
}
