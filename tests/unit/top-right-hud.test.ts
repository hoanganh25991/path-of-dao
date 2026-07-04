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

  it('mounts FPS counter left of scene indicator row', () => {
    const uiRoot = document.getElementById('ui-root')!;
    TopRightHud.init(uiRoot);

    const bar = uiRoot.querySelector('[data-testid="top-right-hud"]');
    expect(bar).toBeTruthy();
    expect(bar?.firstElementChild?.matches('[data-testid="fps-counter"]')).toBe(true);
    expect(bar?.querySelector('[data-testid="scene-indicator"]')).toBeTruthy();
  });

  it('highlights active scene and shows pause slot in combat', () => {
    const uiRoot = document.getElementById('ui-root')!;
    TopRightHud.init(uiRoot);

    EventBus.emit('scene:changed', { id: 'home', payload: undefined });
    expect(uiRoot.querySelector('.scene-indicator__chip--home')?.classList.contains('scene-indicator__chip--active')).toBe(true);
    expect(uiRoot.querySelector('.scene-indicator__pause-slot--visible')).toBeNull();

    EventBus.emit('scene:changed', { id: 'combat', payload: { mapId: 'test' } });
    expect(uiRoot.querySelector('.scene-indicator__chip--combat')?.classList.contains('scene-indicator__chip--active')).toBe(true);
    expect(uiRoot.querySelector('.scene-indicator__pause-slot--visible')).toBeTruthy();
    expect(uiRoot.querySelector('[data-testid="combat-pause-btn"]')).toBeTruthy();
  });
});
