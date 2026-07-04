/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { TopRightHud } from '@/ui/hud/TopRightHud';

describe('TopRightHud', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="ui-root"></div>';
  });

  afterEach(() => {
    EventBus.clear();
    TopRightHud.resetForTests();
    document.body.innerHTML = '';
  });

  it('mounts FPS counter in the top-right bar', () => {
    const uiRoot = document.getElementById('ui-root')!;
    TopRightHud.init(uiRoot);

    const bar = uiRoot.querySelector('[data-testid="top-right-hud"]');
    expect(bar).toBeTruthy();
    expect(bar?.querySelector('[data-testid="fps-counter"]')).toBeTruthy();
    expect(bar?.querySelector('[data-testid="scene-indicator"]')).toBeNull();
  });

  it('shows pause control only in combat', () => {
    const uiRoot = document.getElementById('ui-root')!;
    TopRightHud.init(uiRoot);

    EventBus.emit('scene:changed', { id: 'home', payload: undefined });
    expect(uiRoot.querySelector('.top-right-hud__pause-slot--visible')).toBeNull();

    EventBus.emit('scene:changed', { id: 'combat', payload: { mapId: 'test' } });
    expect(uiRoot.querySelector('.top-right-hud__pause-slot--visible')).toBeTruthy();
    expect(uiRoot.querySelector('[data-testid="combat-pause-btn"]')).toBeTruthy();
  });
});
