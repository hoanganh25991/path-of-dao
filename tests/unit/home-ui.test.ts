/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { I18nManager } from '@/core/i18n/I18nManager';
import { SaveManager } from '@/core/save/SaveManager';
import { gameStore } from '@/core/store/gameStore';
import { EquipmentManager } from '@/progression/EquipmentManager';
import { HomeUI } from '@/ui/home/HomeUI';

beforeEach(async () => {
  document.body.innerHTML = '<div id="ui-root"></div>';
  await SaveManager.destroy();
  indexedDB = new IDBFactory();
  gameStore.setState({ save: null, isLoaded: false });
  await gameStore.getState().load();
  await I18nManager.load('en');
});

afterEach(() => {
  EventBus.clear();
  HomeUI.resetForTests();
  document.body.innerHTML = '';
});

describe('HomeUI', () => {
  it('shows home overlay only on home scene', () => {
    const uiRoot = document.getElementById('ui-root')!;
    HomeUI.init(uiRoot);

    expect(uiRoot.querySelector('[data-testid="home-ui"]')).toBeNull();

    EventBus.emit('scene:changed', { id: 'home', payload: undefined });
    const homeUi = uiRoot.querySelector<HTMLElement>('[data-testid="home-ui"]');
    expect(homeUi).toBeTruthy();
    expect(homeUi?.hidden).not.toBe(true);

    EventBus.emit('scene:changed', { id: 'combat', payload: { mapId: 'map.test.grove' } });
    expect(uiRoot.querySelector('[data-testid="home-ui"]')).toBeNull();
  });

  it('switches tabs and shows the matching panel', () => {
    const uiRoot = document.getElementById('ui-root')!;
    HomeUI.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'home', payload: undefined });

    expect(HomeUI.getActiveTab()).toBe('play');
    expect(uiRoot.querySelector('[data-panel="play"]')).toBeTruthy();

    HomeUI.openTab('inventory');
    expect(HomeUI.getActiveTab()).toBe('inventory');
    expect(uiRoot.querySelector('[data-panel="inventory"]')).toBeTruthy();
    expect(uiRoot.querySelector('[data-panel="play"]')).toBeNull();

    HomeUI.openTab('echoes');
    expect(HomeUI.getActiveTab()).toBe('echoes');
    expect(uiRoot.querySelector('[data-testid="home-echoes"]')).toBeTruthy();

    HomeUI.openTab('skills');
    expect(uiRoot.querySelector('[data-panel="skills"]')).toBeTruthy();

    HomeUI.openTab('story');
    expect(uiRoot.querySelector('[data-panel="story"]')).toBeTruthy();
  });

  it('inventory equip button calls EquipmentManager', () => {
    const equipSpy = vi.spyOn(EquipmentManager, 'equip');

    const uiRoot = document.getElementById('ui-root')!;
    HomeUI.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'home', payload: undefined });
    HomeUI.openTab('inventory');

    const ironCard = uiRoot.querySelector<HTMLButtonElement>('[data-item-id="item.sword.iron"]');
    expect(ironCard).toBeTruthy();
    ironCard!.click();

    const equipBtn = document.querySelector<HTMLButtonElement>('[data-action="equip"]');
    expect(equipBtn).toBeTruthy();
    equipBtn!.click();

    expect(equipSpy).toHaveBeenCalledWith('item.sword.iron');
    equipSpy.mockRestore();
  });

  it('play panel travel button opens echoes tab', () => {
    const uiRoot = document.getElementById('ui-root')!;
    HomeUI.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'home', payload: undefined });

    const travelBtn = uiRoot.querySelector<HTMLButtonElement>('.home-play__echoes');
    expect(travelBtn).toBeTruthy();
    travelBtn!.click();

    expect(HomeUI.getActiveTab()).toBe('echoes');
    expect(uiRoot.querySelector('[data-testid="home-echoes"]')).toBeTruthy();
  });

  it('profile header shows combat power from save stats', () => {
    const uiRoot = document.getElementById('ui-root')!;
    HomeUI.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'home', payload: undefined });

    const cpValue = uiRoot.querySelector('.home-profile__stat-value');
    expect(cpValue?.textContent).toBeTruthy();
    expect(cpValue!.textContent!.length).toBeGreaterThan(0);
  });

  it('opens settings modal from profile header', () => {
    const uiRoot = document.getElementById('ui-root')!;
    HomeUI.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'home', payload: undefined });

    const settingsBtn = uiRoot.querySelector<HTMLButtonElement>('.home-profile__settings');
    expect(settingsBtn).toBeTruthy();
    settingsBtn!.click();

    expect(document.querySelector('[data-testid="settings-modal"]')).toBeTruthy();
  });
});

describe('I18nManager', () => {
  it('loads English home strings', async () => {
    await I18nManager.load('en');
    expect(I18nManager.t('home.nav.play')).toBe('Play');
    expect(I18nManager.t('home.nav.echoes')).toBe('Echoes');
    expect(I18nManager.t('home.map_portal')).toBe('Map Portal');
  });

  it('loads Vietnamese home strings', async () => {
    await I18nManager.load('vi');
    expect(I18nManager.t('home.nav.play')).toBe('Chơi');
  });
});
