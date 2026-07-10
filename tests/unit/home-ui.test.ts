/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/SceneRouter', () => ({
  SceneRouter: {
    instance: {
      switchTo: vi.fn(async () => undefined),
    },
  },
}));

import { EventBus } from '@/core/EventBus';
import { I18nManager } from '@/core/i18n/I18nManager';
import { SaveManager } from '@/core/save/SaveManager';
import { gameStore } from '@/core/store/gameStore';
import { EquipmentManager } from '@/progression/EquipmentManager';
import { formatCombatPower } from '@/progression/CombatPower';
import { HomeUI } from '@/ui/home/HomeUI';
import { showSettingsModal } from '@/ui/modals/SettingsModal';

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

    HomeUI.openTab('profile');
    expect(HomeUI.getActiveTab()).toBe('profile');
    expect(uiRoot.querySelector('[data-panel="profile"]')).toBeTruthy();
    expect(uiRoot.querySelector('[data-panel="play"]')).toBeNull();

    HomeUI.openTab('echoes');
    expect(HomeUI.getActiveTab()).toBe('echoes');
    expect(uiRoot.querySelector('[data-testid="home-echoes"]')).toBeTruthy();

    HomeUI.openTab('story');
    expect(uiRoot.querySelector('[data-panel="story"]')).toBeTruthy();
  });

  it('profile Dharma unequip from slot then inventory card opens detail', () => {
    gameStore.getState().patch({
      inventory: {
        items: [
          { id: 'item.bracelet.copper', qty: 1 },
          { id: 'item.ring.speed', qty: 1 },
        ],
        gold: 0,
      },
      equipped: {
        weapon: null,
        armor: 'item.robe.novice',
        accessory: null,
        spirit: null,
      },
    });

    const uiRoot = document.getElementById('ui-root')!;
    HomeUI.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'home', payload: undefined });
    HomeUI.openTab('profile');

    const dharmaTab = uiRoot.querySelector<HTMLButtonElement>('.home-profile__sub-tab[data-sub-tab="dharma"]');
    dharmaTab!.click();

    const armorSlot = uiRoot.querySelector<HTMLButtonElement>('.home-dharma__slot--filled');
    expect(armorSlot).toBeTruthy();
    armorSlot!.click();

    const copperCard = uiRoot.querySelector<HTMLButtonElement>('.home-dharma__card[data-item-id="item.bracelet.copper"]');
    expect(copperCard).toBeTruthy();
    copperCard!.click();

    const detail = uiRoot.querySelector('.home-item-detail');
    expect(detail).toBeTruthy();
    expect(detail?.querySelector('.home-item-detail__name')?.textContent).toBeTruthy();
    expect(uiRoot.contains(detail)).toBe(true);
  });

  it('profile Dharma Treasures equip button calls EquipmentManager', () => {
    gameStore.getState().patch({
      inventory: {
        items: [{ id: 'item.sword.iron', qty: 1 }],
        gold: 0,
      },
    });

    const equipSpy = vi.spyOn(EquipmentManager, 'equip');

    const uiRoot = document.getElementById('ui-root')!;
    HomeUI.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'home', payload: undefined });
    HomeUI.openTab('profile');

    // Switch to Dharma sub-tab
    const dharmaTab = uiRoot.querySelector<HTMLButtonElement>('.home-profile__sub-tab[data-sub-tab="dharma"]');
    expect(dharmaTab).toBeTruthy();
    dharmaTab!.click();

    const ironCard = uiRoot.querySelector<HTMLButtonElement>('.home-dharma__card[data-item-id="item.sword.iron"]');
    expect(ironCard).toBeTruthy();
    ironCard!.click();

    const equipBtn = document.querySelector<HTMLButtonElement>('[data-action="equip"]');
    expect(equipBtn).toBeTruthy();
    equipBtn!.click();

    expect(equipSpy).toHaveBeenCalledWith('item.sword.iron');
    equipSpy.mockRestore();
  });

  it('play panel shows begin journey on a fresh save', () => {
    const uiRoot = document.getElementById('ui-root')!;
    HomeUI.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'home', payload: undefined });

    const continueBtn = uiRoot.querySelector('[data-testid="continue-journey-btn"]');
    expect(continueBtn).toBeTruthy();
    expect(continueBtn?.textContent).toBe('Begin Journey');

    const hint = uiRoot.querySelector('[data-testid="continue-journey-hint"]');
    expect(hint?.textContent).toContain('Next:');
  });

  it('play panel shows continue journey after the road has started', () => {
    const save = SaveManager.createNew();
    gameStore.setState({
      save: {
        ...save,
        progress: { ...save.progress, currentMapId: 'map.fallen_village.01' },
      },
    });

    const uiRoot = document.getElementById('ui-root')!;
    HomeUI.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'home', payload: undefined });

    const continueBtn = uiRoot.querySelector('[data-testid="continue-journey-btn"]');
    expect(continueBtn?.textContent).toBe('Continue Journey');
  });

  it('play panel echoes button opens echoes tab', () => {
    const uiRoot = document.getElementById('ui-root')!;
    HomeUI.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'home', payload: undefined });

    const echoesBtn = uiRoot.querySelector<HTMLButtonElement>('.home-play__echoes');
    expect(echoesBtn?.textContent).toBe('Echoes of the Ancients');
    echoesBtn!.click();

    expect(HomeUI.getActiveTab()).toBe('echoes');
    expect(uiRoot.querySelector('[data-testid="home-echoes"]')).toBeTruthy();
  });

  it('echoes tab opens from bottom nav', () => {
    const uiRoot = document.getElementById('ui-root')!;
    HomeUI.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'home', payload: undefined });

    HomeUI.openTab('echoes');
    expect(HomeUI.getActiveTab()).toBe('echoes');
    expect(uiRoot.querySelector('[data-testid="home-echoes"]')).toBeTruthy();
    expect(uiRoot.querySelector('.home-play__echoes')).toBeNull();

    const card = uiRoot.querySelector('.home-ancient-card');
    expect(card?.querySelector('.skill-icon-strip')).toBeTruthy();
    expect(card?.querySelector('.skill-showcase')).toBeNull();
    expect(card?.querySelector('.home-ancient-card__teaser')).toBeNull();
  });

  it('profile header shows combat power from save stats', () => {
    const uiRoot = document.getElementById('ui-root')!;
    HomeUI.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'home', payload: undefined });

    const cpValue = uiRoot.querySelector('.home-profile__stat-value');
    expect(cpValue?.textContent).toBeTruthy();
    expect(cpValue!.textContent!.length).toBeGreaterThan(0);
  });

  it('profile header updates combat power and years after progress reset', async () => {
    gameStore.getState().patch({
      realm: { id: 'qi_condensation', tier: 'late', breakthroughReady: false },
      meta: { ...gameStore.getState().save!.meta, totalPlaySeconds: 86_400 * 8 },
    });

    const uiRoot = document.getElementById('ui-root')!;
    HomeUI.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'home', payload: undefined });

    const statValues = (): string[] =>
      [...uiRoot.querySelectorAll('.home-profile__stat-value')].map(
        (el) => el.textContent ?? '',
      );

    const [cpBefore, yearsBefore = ''] = statValues();
    expect(cpBefore).not.toBe(formatCombatPower(844, 'en'));

    void showSettingsModal(uiRoot);
    document.querySelector<HTMLButtonElement>('[data-testid="settings-reset-btn"]')!.click();
    document.querySelector<HTMLButtonElement>('[data-testid="settings-reset-confirm-btn"]')!.click();

    await vi.waitFor(() => {
      const [cpAfter, yearsAfter = ''] = statValues();
      expect(cpAfter).toBe(formatCombatPower(844, 'en'));
      expect(yearsAfter).toBe('0');
      expect(Number.parseInt(yearsAfter, 10)).toBeLessThan(Number.parseInt(yearsBefore, 10));
    });
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
    expect(I18nManager.t('home.nav.play')).toBe('Journey');
    expect(I18nManager.t('home.nav.echoes')).toBe('Echoes');
    expect(I18nManager.t('home.map_portal')).toBe('Map Portal');
  });

  it('loads Vietnamese home strings', async () => {
    await I18nManager.load('vi');
    expect(I18nManager.t('home.nav.play')).toBe('Hành Trình');
  });
});
