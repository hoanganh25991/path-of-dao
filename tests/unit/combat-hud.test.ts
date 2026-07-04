/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { CombatHUD } from '@/ui/hud/CombatHUD';
import { TopRightHud } from '@/ui/hud/TopRightHud';

describe('CombatHUD', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="ui-root"></div>';
  });

  afterEach(() => {
    EventBus.clear();
    CombatHUD.resetForTests();
    TopRightHud.resetForTests();
    document.body.innerHTML = '';
  });

  it('shows controls only in combat scene', () => {
    const uiRoot = document.getElementById('ui-root')!;
    TopRightHud.init(uiRoot);
    CombatHUD.init(uiRoot);

    const hud = uiRoot.querySelector<HTMLElement>('.combat-hud');
    expect(hud?.hidden).toBe(true);

    EventBus.emit('scene:changed', { id: 'combat', payload: { mapId: 'test' } });
    expect(hud?.hidden).toBe(false);
    expect(uiRoot.querySelector('#joystick')).toBeTruthy();
    expect(uiRoot.querySelector('.action-buttons')).toBeTruthy();
    expect(uiRoot.querySelector('[data-testid="combat-pause-btn"]')).toBeTruthy();

    EventBus.emit('scene:changed', { id: 'home', payload: undefined });
    expect(hud?.hidden).toBe(true);
  });
});
