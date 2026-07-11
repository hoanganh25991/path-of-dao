import '@/ui/modals/settings.css';
import { AudioDirector } from '@/core/audio/AudioDirector';
import { AudioManager } from '@/core/audio/AudioManager';
import { EventBus } from '@/core/EventBus';
import { FullscreenManager } from '@/app/FullscreenManager';
import { I18nManager, type LocalePreference } from '@/core/i18n/I18nManager';
import type { QualityPreference } from '@/app/QualityProfile';
import { SceneRouter } from '@/app/SceneRouter';
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

/** Settings overlay — language, performance, fullscreen, version. */
export function showSettingsModal(uiRoot: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const save = gameStore.getState().save;
    if (!save) {
      resolve();
      return;
    }

    let selectedLocale = save.settings.locale;
    let selectedQuality = save.settings.quality;
    let selectedFullscreen = save.settings.fullscreen;
    let selectedMusicVolume = save.settings.musicVolume;
    let selectedSfxVolume = save.settings.sfxVolume;
    let selectedUiVolume = save.settings.uiVolume;

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

    const fullscreenTitle = document.createElement('p');
    fullscreenTitle.className = 'settings-modal__section-title';
    fullscreenTitle.textContent = I18nManager.t('home.settings.fullscreen');

    const fullscreenOptions = document.createElement('div');
    fullscreenOptions.className = 'settings-modal__options';
    fullscreenOptions.setAttribute('role', 'radiogroup');
    fullscreenOptions.setAttribute('aria-label', I18nManager.t('home.settings.fullscreen'));

    const soundTitle = document.createElement('p');
    soundTitle.className = 'settings-modal__section-title';
    soundTitle.textContent = I18nManager.t('home.settings.sound');

    const musicVolumeRow = document.createElement('div');
    musicVolumeRow.className = 'settings-modal__slider-row';

    const musicVolumeLabel = document.createElement('label');
    musicVolumeLabel.className = 'settings-modal__slider-label';
    musicVolumeLabel.htmlFor = 'settings-music-volume';
    musicVolumeLabel.textContent = I18nManager.t('home.settings.volume.music');

    const musicVolumeValue = document.createElement('span');
    musicVolumeValue.className = 'settings-modal__slider-value';

    const musicVolumeLabelRow = document.createElement('div');
    musicVolumeLabelRow.className = 'settings-modal__slider-label-row';
    musicVolumeLabelRow.append(musicVolumeLabel, musicVolumeValue);

    const musicVolumeInput = document.createElement('input');
    musicVolumeInput.type = 'range';
    musicVolumeInput.id = 'settings-music-volume';
    musicVolumeInput.className = 'settings-modal__slider';
    musicVolumeInput.dataset.testid = 'settings-music-volume';
    musicVolumeInput.min = '0';
    musicVolumeInput.max = '100';
    musicVolumeInput.step = '1';

    musicVolumeRow.append(musicVolumeLabelRow, musicVolumeInput);

    const sfxVolumeRow = document.createElement('div');
    sfxVolumeRow.className = 'settings-modal__slider-row';

    const sfxVolumeLabel = document.createElement('label');
    sfxVolumeLabel.className = 'settings-modal__slider-label';
    sfxVolumeLabel.htmlFor = 'settings-sfx-volume';
    sfxVolumeLabel.textContent = I18nManager.t('home.settings.volume.sfx');

    const sfxVolumeValue = document.createElement('span');
    sfxVolumeValue.className = 'settings-modal__slider-value';

    const sfxVolumeLabelRow = document.createElement('div');
    sfxVolumeLabelRow.className = 'settings-modal__slider-label-row';
    sfxVolumeLabelRow.append(sfxVolumeLabel, sfxVolumeValue);

    const sfxVolumeInput = document.createElement('input');
    sfxVolumeInput.type = 'range';
    sfxVolumeInput.id = 'settings-sfx-volume';
    sfxVolumeInput.className = 'settings-modal__slider';
    sfxVolumeInput.dataset.testid = 'settings-sfx-volume';
    sfxVolumeInput.min = '0';
    sfxVolumeInput.max = '100';
    sfxVolumeInput.step = '1';

    sfxVolumeRow.append(sfxVolumeLabelRow, sfxVolumeInput);

    const uiVolumeRow = document.createElement('div');
    uiVolumeRow.className = 'settings-modal__slider-row';

    const uiVolumeLabel = document.createElement('label');
    uiVolumeLabel.className = 'settings-modal__slider-label';
    uiVolumeLabel.htmlFor = 'settings-ui-volume';
    uiVolumeLabel.textContent = I18nManager.t('home.settings.volume.ui');

    const uiVolumeValue = document.createElement('span');
    uiVolumeValue.className = 'settings-modal__slider-value';

    const uiVolumeLabelRow = document.createElement('div');
    uiVolumeLabelRow.className = 'settings-modal__slider-label-row';
    uiVolumeLabelRow.append(uiVolumeLabel, uiVolumeValue);

    const uiVolumeInput = document.createElement('input');
    uiVolumeInput.type = 'range';
    uiVolumeInput.id = 'settings-ui-volume';
    uiVolumeInput.className = 'settings-modal__slider';
    uiVolumeInput.dataset.testid = 'settings-ui-volume';
    uiVolumeInput.min = '0';
    uiVolumeInput.max = '100';
    uiVolumeInput.step = '1';

    uiVolumeRow.append(uiVolumeLabelRow, uiVolumeInput);

    const version = document.createElement('p');
    version.className = 'settings-modal__version';
    version.textContent = I18nManager.t('home.settings.version', { version: VERSION });

    const progressTitle = document.createElement('p');
    progressTitle.className = 'settings-modal__section-title';
    progressTitle.textContent = I18nManager.t('home.settings.progress');

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'settings-modal__reset';
    resetBtn.dataset.testid = 'settings-reset-btn';
    resetBtn.textContent = I18nManager.t('home.settings.reset');

    const confirmPanel = document.createElement('div');
    confirmPanel.className = 'settings-modal__confirm';
    confirmPanel.dataset.testid = 'settings-reset-confirm';
    confirmPanel.hidden = true;

    const confirmMessage = document.createElement('p');
    confirmMessage.className = 'settings-modal__confirm-message';
    confirmMessage.textContent = I18nManager.t('home.settings.reset_confirm');

    const confirmActions = document.createElement('div');
    confirmActions.className = 'settings-modal__confirm-actions';

    const cancelResetBtn = document.createElement('button');
    cancelResetBtn.type = 'button';
    cancelResetBtn.className = 'settings-modal__confirm-btn';
    cancelResetBtn.dataset.testid = 'settings-reset-cancel';
    cancelResetBtn.textContent = I18nManager.t('home.settings.reset_cancel');

    const confirmResetBtn = document.createElement('button');
    confirmResetBtn.type = 'button';
    confirmResetBtn.className = 'settings-modal__confirm-btn settings-modal__confirm-btn--danger';
    confirmResetBtn.dataset.testid = 'settings-reset-confirm-btn';
    confirmResetBtn.textContent = I18nManager.t('home.settings.reset_confirm_action');

    confirmActions.append(cancelResetBtn, confirmResetBtn);
    confirmPanel.append(confirmMessage, confirmActions);

    const localeButtons: HTMLLabelElement[] = [];
    const qualityButtons: HTMLLabelElement[] = [];
    const fullscreenButtons: HTMLLabelElement[] = [];

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

    const syncMusicVolumeSelection = (): void => {
      const percent = Math.round(selectedMusicVolume * 100);
      musicVolumeInput.value = String(percent);
      musicVolumeValue.textContent = `${percent}%`;
    };

    const syncSfxVolumeSelection = (): void => {
      const percent = Math.round(selectedSfxVolume * 100);
      sfxVolumeInput.value = String(percent);
      sfxVolumeValue.textContent = `${percent}%`;
    };

    const syncUiVolumeSelection = (): void => {
      const percent = Math.round(selectedUiVolume * 100);
      uiVolumeInput.value = String(percent);
      uiVolumeValue.textContent = `${percent}%`;
    };

    const syncFullscreenSelection = (): void => {
      for (const label of fullscreenButtons) {
        const value = label.dataset.value === 'true';
        const input = label.querySelector('input');
        const active = value === selectedFullscreen;
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
      fullscreenTitle.textContent = I18nManager.t('home.settings.fullscreen');
      fullscreenOptions.setAttribute('aria-label', I18nManager.t('home.settings.fullscreen'));
      soundTitle.textContent = I18nManager.t('home.settings.sound');
      musicVolumeLabel.textContent = I18nManager.t('home.settings.volume.music');
      sfxVolumeLabel.textContent = I18nManager.t('home.settings.volume.sfx');
      uiVolumeLabel.textContent = I18nManager.t('home.settings.volume.ui');
      version.textContent = I18nManager.t('home.settings.version', { version: VERSION });
      progressTitle.textContent = I18nManager.t('home.settings.progress');
      resetBtn.textContent = I18nManager.t('home.settings.reset');
      confirmMessage.textContent = I18nManager.t('home.settings.reset_confirm');
      cancelResetBtn.textContent = I18nManager.t('home.settings.reset_cancel');
      confirmResetBtn.textContent = I18nManager.t('home.settings.reset_confirm_action');

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
      for (const label of fullscreenButtons) {
        const isOn = label.dataset.value === 'true';
        const text = label.querySelector('span');
        if (text) {
          text.textContent = I18nManager.t(isOn ? 'home.settings.fullscreen.on' : 'home.settings.fullscreen.off');
        }
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

    for (const value of [true, false]) {
      const label = document.createElement('label');
      label.className = 'settings-modal__option';
      label.dataset.value = String(value);

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'fullscreen-preference';
      input.value = String(value);

      const text = document.createElement('span');
      text.textContent = I18nManager.t(value ? 'home.settings.fullscreen.on' : 'home.settings.fullscreen.off');

      label.append(input, text);
      label.addEventListener('click', () => {
        if (selectedFullscreen === value) return;
        selectedFullscreen = value;
        syncFullscreenSelection();
        void applyFullscreenPreference(value);
      });

      fullscreenButtons.push(label);
      fullscreenOptions.appendChild(label);
    }

    musicVolumeInput.addEventListener('input', () => {
      const next = Number(musicVolumeInput.value) / 100;
      selectedMusicVolume = next;
      musicVolumeValue.textContent = `${Math.round(next * 100)}%`;
      AudioManager.setVolume('music', next);
    });
    musicVolumeInput.addEventListener('change', () => {
      void applyMusicVolumePreference(selectedMusicVolume);
    });

    sfxVolumeInput.addEventListener('input', () => {
      const next = Number(sfxVolumeInput.value) / 100;
      selectedSfxVolume = next;
      sfxVolumeValue.textContent = `${Math.round(next * 100)}%`;
      AudioManager.setVolume('sfx', next);
    });
    sfxVolumeInput.addEventListener('change', () => {
      void applySfxVolumePreference(selectedSfxVolume);
    });

    uiVolumeInput.addEventListener('input', () => {
      const next = Number(uiVolumeInput.value) / 100;
      selectedUiVolume = next;
      uiVolumeValue.textContent = `${Math.round(next * 100)}%`;
      AudioManager.setVolume('ui', next);
    });
    uiVolumeInput.addEventListener('change', () => {
      void applyUiVolumePreference(selectedUiVolume);
    });

    card.append(
      header,
      localeTitle,
      localeOptions,
      qualityTitle,
      qualityOptions,
      fullscreenTitle,
      fullscreenOptions,
      soundTitle,
      musicVolumeRow,
      sfxVolumeRow,
      uiVolumeRow,
      progressTitle,
      resetBtn,
      confirmPanel,
      version,
    );
    overlay.append(backdrop, card);
    uiRoot.appendChild(overlay);

    const hideResetConfirm = (): void => {
      confirmPanel.hidden = true;
      resetBtn.hidden = false;
    };

    const showResetConfirm = (): void => {
      resetBtn.hidden = true;
      confirmPanel.hidden = false;
    };

    resetBtn.addEventListener('click', showResetConfirm);
    cancelResetBtn.addEventListener('click', hideResetConfirm);

    confirmResetBtn.addEventListener('click', () => {
      void performProgressReset().then(cleanup);
    });

    AudioDirector.playPanelOpen();

    syncLocaleSelection();
    syncQualitySelection();
    syncFullscreenSelection();
    syncMusicVolumeSelection();
    syncSfxVolumeSelection();
    syncUiVolumeSelection();
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

async function performProgressReset(): Promise<void> {
  await gameStore.getState().newGame({ preserveSettings: true });
  EventBus.emit('home:open-tab', { tab: 'play' });
  await SceneRouter.instance.switchTo('home');
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

async function applyFullscreenPreference(enabled: boolean): Promise<void> {
  const current = gameStore.getState().save;
  if (!current || current.settings.fullscreen === enabled) return;

  gameStore.getState().patch((save) => ({
    settings: { ...save.settings, fullscreen: enabled },
  }));
  await gameStore.getState().persist();

  EventBus.emit('settings:fullscreen-changed', { enabled });

  // Clear the transient opt-out so re-enabling takes effect immediately.
  if (enabled) {
    FullscreenManager.clearOptOut();
    void FullscreenManager.requestOnPlay();
  }
}

async function applyMusicVolumePreference(volume: number): Promise<void> {
  const current = gameStore.getState().save;
  if (!current || current.settings.musicVolume === volume) return;

  gameStore.getState().patch((save) => ({
    settings: { ...save.settings, musicVolume: volume },
  }));
  await gameStore.getState().persist();

  EventBus.emit('settings:music-volume-changed', { volume });
}

async function applySfxVolumePreference(volume: number): Promise<void> {
  const current = gameStore.getState().save;
  if (!current || current.settings.sfxVolume === volume) return;

  gameStore.getState().patch((save) => ({
    settings: { ...save.settings, sfxVolume: volume },
  }));
  await gameStore.getState().persist();

  EventBus.emit('settings:sfx-volume-changed', { volume });
}

async function applyUiVolumePreference(volume: number): Promise<void> {
  const current = gameStore.getState().save;
  if (!current || current.settings.uiVolume === volume) return;

  gameStore.getState().patch((save) => ({
    settings: { ...save.settings, uiVolume: volume },
  }));
  await gameStore.getState().persist();

  EventBus.emit('settings:ui-volume-changed', { volume });
}