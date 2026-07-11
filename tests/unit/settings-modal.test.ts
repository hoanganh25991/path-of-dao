/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioManager } from '@/core/audio/AudioManager';
import { EventBus } from '@/core/EventBus';
import { I18nManager } from '@/core/i18n/I18nManager';
import { SaveManager } from '@/core/save/SaveManager';
import { gameStore } from '@/core/store/gameStore';
import { computeCombatPowerFromSave, yearsCultivated } from '@/progression/CombatPower';
import { getRealmOrder } from '@/progression/RealmStatScaling';
import { showSettingsModal } from '@/ui/modals/SettingsModal';

const switchToMock = vi.fn(async (_id?: string, _payload?: unknown) => undefined);

vi.mock('@/app/SceneRouter', () => ({
  SceneRouter: {
    instance: {
      switchTo: (...args: [id: string, payload?: unknown]) => switchToMock(...args),
    },
  },
}));

beforeEach(async () => {
  document.body.innerHTML = '<div id="ui-root"></div>';
  await SaveManager.destroy();
  indexedDB = new IDBFactory();
  gameStore.setState({ save: null, isLoaded: false });
  await gameStore.getState().load();
  await I18nManager.load('en');
  switchToMock.mockClear();
  AudioManager.resetForTests();
});

afterEach(() => {
  EventBus.clear();
  document.body.innerHTML = '';
  AudioManager.resetForTests();
});

describe('SettingsModal', () => {
  it('shows reset confirm before wiping progress', async () => {
    gameStore.getState().patch({
      xp: 900,
      progress: {
        ...gameStore.getState().save!.progress,
        currentMapId: 'map.fallen_village.01',
      },
    });

    const uiRoot = document.getElementById('ui-root')!;
    void showSettingsModal(uiRoot);

    const resetBtn = document.querySelector<HTMLButtonElement>('[data-testid="settings-reset-btn"]');
    expect(resetBtn?.textContent).toBe('Replay from Beginning');
    resetBtn!.click();

    const confirm = document.querySelector<HTMLElement>('[data-testid="settings-reset-confirm"]');
    expect(confirm).toBeTruthy();
    expect(confirm?.hidden).toBe(false);

    document.querySelector<HTMLButtonElement>('[data-testid="settings-reset-cancel"]')!.click();
    expect(document.querySelector<HTMLElement>('[data-testid="settings-reset-confirm"]')?.hidden).toBe(true);
    expect(gameStore.getState().save?.xp).toBe(900);
  });

  it('resets progress and keeps settings after confirm', async () => {
    gameStore.getState().patch({
      xp: 900,
      realm: { id: 'qi_condensation', tier: 'late', breakthroughReady: false },
      meta: { ...gameStore.getState().save!.meta, totalPlaySeconds: 86_400 * 12 },
      settings: { locale: 'vi', quality: 'low', sfxVolume: 0.25, musicVolume: 0.75, uiVolume: 0.6, fullscreen: true },
    });
    await gameStore.getState().persist();

    const before = gameStore.getState().save!;
    const cpBefore = computeCombatPowerFromSave(before);
    const yearsBefore = yearsCultivated(
      before.meta.totalPlaySeconds,
      getRealmOrder(before.realm.id),
    );

    const uiRoot = document.getElementById('ui-root')!;
    void showSettingsModal(uiRoot);

    document.querySelector<HTMLButtonElement>('[data-testid="settings-reset-btn"]')!.click();
    document.querySelector<HTMLButtonElement>('[data-testid="settings-reset-confirm-btn"]')!.click();

    await vi.waitFor(() => {
      expect(gameStore.getState().save?.xp).toBe(0);
    });

    const save = gameStore.getState().save!;
    expect(save.settings).toEqual({
      locale: 'vi',
      quality: 'low',
      sfxVolume: 0.25,
      musicVolume: 0.75,
      uiVolume: 0.6,
      fullscreen: true,
    });
    expect(save.meta.totalPlaySeconds).toBe(0);
    expect(save.realm.id).toBe('mortal_body');
    expect(computeCombatPowerFromSave(save)).toBeLessThan(cpBefore);
    expect(computeCombatPowerFromSave(save)).toBe(844);
    expect(
      yearsCultivated(save.meta.totalPlaySeconds, getRealmOrder(save.realm.id)),
    ).toBeLessThan(yearsBefore);
    expect(
      yearsCultivated(save.meta.totalPlaySeconds, getRealmOrder(save.realm.id)),
    ).toBe(0);
    expect(switchToMock).toHaveBeenCalledWith('home');

    const loaded = await SaveManager.load();
    expect(loaded.xp).toBe(0);
    expect(loaded.meta.totalPlaySeconds).toBe(0);
    expect(loaded.settings.locale).toBe('vi');
  });

  it('shows a dedicated UI volume slider seeded from the save', () => {
    gameStore.getState().patch((save) => ({
      settings: { ...save.settings, uiVolume: 0.4 },
    }));

    const uiRoot = document.getElementById('ui-root')!;
    void showSettingsModal(uiRoot);

    const slider = document.querySelector<HTMLInputElement>('[data-testid="settings-ui-volume"]');
    expect(slider).toBeTruthy();
    expect(slider!.value).toBe('40');
  });

  it('live-previews UI volume on drag and persists on release, independent of SFX', async () => {
    gameStore.getState().patch((save) => ({
      settings: { ...save.settings, sfxVolume: 1, uiVolume: 0.5 },
    }));
    AudioManager.init(gameStore.getState().save!);

    const uiRoot = document.getElementById('ui-root')!;
    void showSettingsModal(uiRoot);

    const slider = document.querySelector<HTMLInputElement>('[data-testid="settings-ui-volume"]')!;
    slider.value = '20';
    slider.dispatchEvent(new Event('input', { bubbles: true }));

    expect(AudioManager.getBusVolume('ui')).toBeCloseTo(0.2);
    expect(AudioManager.getBusVolume('sfx')).toBeCloseTo(1);
    // Not persisted yet — only the live audio preview updates on drag.
    expect(gameStore.getState().save?.settings.uiVolume).toBe(0.5);

    slider.dispatchEvent(new Event('change', { bubbles: true }));

    await vi.waitFor(() => {
      expect(gameStore.getState().save?.settings.uiVolume).toBeCloseTo(0.2);
    });

    const loaded = await SaveManager.load();
    expect(loaded.settings.uiVolume).toBeCloseTo(0.2);
    expect(loaded.settings.sfxVolume).toBe(1);
  });

  it('shows dedicated Music and SFX volume sliders seeded from the save', () => {
    gameStore.getState().patch((save) => ({
      settings: { ...save.settings, musicVolume: 0.3, sfxVolume: 0.7 },
    }));

    const uiRoot = document.getElementById('ui-root')!;
    void showSettingsModal(uiRoot);

    const musicSlider = document.querySelector<HTMLInputElement>('[data-testid="settings-music-volume"]');
    const sfxSlider = document.querySelector<HTMLInputElement>('[data-testid="settings-sfx-volume"]');
    expect(musicSlider).toBeTruthy();
    expect(sfxSlider).toBeTruthy();
    expect(musicSlider!.value).toBe('30');
    expect(sfxSlider!.value).toBe('70');
  });

  it('live-previews Music volume on drag and persists on release, independent of SFX/UI', async () => {
    gameStore.getState().patch((save) => ({
      settings: { ...save.settings, musicVolume: 0.5, sfxVolume: 1, uiVolume: 0.9 },
    }));
    AudioManager.init(gameStore.getState().save!);

    const uiRoot = document.getElementById('ui-root')!;
    void showSettingsModal(uiRoot);

    const slider = document.querySelector<HTMLInputElement>('[data-testid="settings-music-volume"]')!;
    slider.value = '15';
    slider.dispatchEvent(new Event('input', { bubbles: true }));

    expect(AudioManager.getBusVolume('music')).toBeCloseTo(0.15);
    expect(AudioManager.getBusVolume('sfx')).toBeCloseTo(1);
    expect(AudioManager.getBusVolume('ui')).toBeCloseTo(0.9);
    // Not persisted yet — only the live audio preview updates on drag.
    expect(gameStore.getState().save?.settings.musicVolume).toBe(0.5);

    slider.dispatchEvent(new Event('change', { bubbles: true }));

    await vi.waitFor(() => {
      expect(gameStore.getState().save?.settings.musicVolume).toBeCloseTo(0.15);
    });

    const loaded = await SaveManager.load();
    expect(loaded.settings.musicVolume).toBeCloseTo(0.15);
    expect(loaded.settings.sfxVolume).toBe(1);
    expect(loaded.settings.uiVolume).toBe(0.9);
  });

  it('live-previews SFX volume on drag and persists on release, independent of Music/UI', async () => {
    gameStore.getState().patch((save) => ({
      settings: { ...save.settings, musicVolume: 0.8, sfxVolume: 0.5, uiVolume: 0.9 },
    }));
    AudioManager.init(gameStore.getState().save!);

    const uiRoot = document.getElementById('ui-root')!;
    void showSettingsModal(uiRoot);

    const slider = document.querySelector<HTMLInputElement>('[data-testid="settings-sfx-volume"]')!;
    slider.value = '35';
    slider.dispatchEvent(new Event('input', { bubbles: true }));

    expect(AudioManager.getBusVolume('sfx')).toBeCloseTo(0.35);
    expect(AudioManager.getBusVolume('music')).toBeCloseTo(0.8);
    expect(AudioManager.getBusVolume('ui')).toBeCloseTo(0.9);
    // Not persisted yet — only the live audio preview updates on drag.
    expect(gameStore.getState().save?.settings.sfxVolume).toBe(0.5);

    slider.dispatchEvent(new Event('change', { bubbles: true }));

    await vi.waitFor(() => {
      expect(gameStore.getState().save?.settings.sfxVolume).toBeCloseTo(0.35);
    });

    const loaded = await SaveManager.load();
    expect(loaded.settings.sfxVolume).toBeCloseTo(0.35);
    expect(loaded.settings.musicVolume).toBe(0.8);
    expect(loaded.settings.uiVolume).toBe(0.9);
  });
});
