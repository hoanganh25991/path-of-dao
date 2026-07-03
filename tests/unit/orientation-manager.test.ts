/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { OrientationManager } from '@/app/OrientationManager';

describe('OrientationManager', () => {
  function setViewport(width: number, height: number): void {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
  }

  beforeEach(() => {
    setViewport(844, 390);
    OrientationManager.init();
  });

  afterEach(() => {
    EventBus.clear();
    OrientationManager.resetForTests();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-scene');
    document.documentElement.style.removeProperty('--layout-w');
    document.documentElement.style.removeProperty('--layout-h');
  });

  it('marks landscape layout on wide viewports', () => {
    expect(document.documentElement.classList.contains('landscape-layout')).toBe(true);
    expect(document.documentElement.classList.contains('portrait-rotate')).toBe(false);
    expect(OrientationManager.getLayoutSize()).toEqual({ width: 844, height: 390 });
  });

  it('portrait-rotates when viewport is tall', () => {
    setViewport(390, 844);
    window.dispatchEvent(new Event('resize'));

    expect(document.documentElement.classList.contains('portrait-rotate')).toBe(true);
    expect(OrientationManager.getLayoutSize()).toEqual({ width: 844, height: 390 });
  });

  it('tags scene class on scene change', async () => {
    EventBus.emit('scene:changed', { id: 'combat', payload: { mapId: 'map.test.grove' } });
    await Promise.resolve();

    expect(document.documentElement.classList.contains('scene-combat')).toBe(true);
    expect(OrientationManager.getScene()).toBe('combat');
  });
});
