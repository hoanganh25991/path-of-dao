/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { I18nManager } from '@/core/i18n/I18nManager';
import { SaveManager } from '@/core/save/SaveManager';
import { gameStore } from '@/core/store/gameStore';
import { HomeUI } from '@/ui/home/HomeUI';
import { closeWorldMapOverlay } from '@/ui/world/WorldMap';

beforeEach(async () => {
  document.body.innerHTML = '<div id="ui-root"></div>';
  await SaveManager.destroy();
  indexedDB = new IDBFactory();
  gameStore.setState({ save: null, isLoaded: false });
  await gameStore.getState().load();
  await I18nManager.load('en');
});

afterEach(() => {
  closeWorldMapOverlay();
  EventBus.clear();
  HomeUI.resetForTests();
  document.body.innerHTML = '';
});

describe('WorldMap UI', () => {
  it('opens from Play panel map portal button', () => {
    const uiRoot = document.getElementById('ui-root')!;
    HomeUI.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'home', payload: undefined });

    const portalBtn = uiRoot.querySelector<HTMLButtonElement>('[data-testid="map-portal-btn"]');
    expect(portalBtn).toBeTruthy();
    portalBtn!.click();

    const worldMap = document.querySelector('[data-testid="world-map"]');
    expect(worldMap).toBeTruthy();
    expect(document.querySelectorAll('.world-region').length).toBe(10);
  });

  it('shows map detail with difficulty badge when a node is selected', () => {
    const uiRoot = document.getElementById('ui-root')!;
    HomeUI.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'home', payload: undefined });

    uiRoot.querySelector<HTMLButtonElement>('[data-testid="map-portal-btn"]')!.click();

    const node = document.querySelector<HTMLButtonElement>('[data-map-id="map.fallen_village.01"]');
    expect(node).toBeTruthy();
    node!.click();

    const detail = document.querySelector('[data-testid="world-map-detail"]');
    expect(detail).toBeTruthy();
    expect(detail?.querySelector('.difficulty-badge')).toBeTruthy();
    expect(detail?.querySelector('.world-map-detail__enter')).toBeTruthy();
  });
});
