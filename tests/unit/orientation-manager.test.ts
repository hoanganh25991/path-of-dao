/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { OrientationManager } from '@/app/OrientationManager';
import { RotatePrompt } from '@/app/RotatePrompt';

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
    document.body.innerHTML = '<div id="app"></div>';
    OrientationManager.init(document.getElementById('app')!);
  });

  afterEach(() => {
    EventBus.clear();
    OrientationManager.resetForTests();
    RotatePrompt.resetForTests();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-scene');
    document.documentElement.style.removeProperty('--layout-w');
    document.documentElement.style.removeProperty('--layout-h');
    document.body.innerHTML = '';
  });

  it('marks landscape layout on wide viewports', () => {
    expect(document.documentElement.classList.contains('landscape-layout')).toBe(true);
    expect(document.documentElement.classList.contains('needs-landscape')).toBe(false);
    expect(document.documentElement.classList.contains('portrait-rotate')).toBe(false);
    expect(OrientationManager.getLayoutSize()).toEqual({ width: 844, height: 390 });
    expect(OrientationManager.isPortraitRotateActive()).toBe(false);
    expect(RotatePrompt.isVisible()).toBe(false);
  });

  it('shows rotate prompt when viewport is tall', () => {
    setViewport(390, 844);
    window.dispatchEvent(new Event('resize'));

    expect(document.documentElement.classList.contains('needs-landscape')).toBe(true);
    expect(document.documentElement.classList.contains('portrait-rotate')).toBe(false);
    expect(OrientationManager.needsLandscapeOrientation()).toBe(true);
    expect(OrientationManager.isPortraitRotateActive()).toBe(false);
    expect(OrientationManager.getLayoutSize()).toEqual({ width: 390, height: 844 });
    expect(RotatePrompt.isVisible()).toBe(true);
  });

  it('hides rotate prompt when returning to landscape', () => {
    setViewport(390, 844);
    window.dispatchEvent(new Event('resize'));
    expect(RotatePrompt.isVisible()).toBe(true);

    setViewport(844, 390);
    window.dispatchEvent(new Event('resize'));

    expect(RotatePrompt.isVisible()).toBe(false);
    expect(document.documentElement.classList.contains('needs-landscape')).toBe(false);
  });

  it('tags scene class on scene change', async () => {
    EventBus.emit('scene:changed', { id: 'combat', payload: { mapId: 'map.test.grove' } });
    await Promise.resolve();

    expect(document.documentElement.classList.contains('scene-combat')).toBe(true);
    expect(OrientationManager.getScene()).toBe('combat');
  });
});
