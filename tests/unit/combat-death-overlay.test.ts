/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { CombatDeathOverlay } from '@/ui/hud/CombatDeathOverlay';
import { CombatHUD } from '@/ui/hud/CombatHUD';

describe('CombatDeathOverlay', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="ui-root"></div>';
  });

  afterEach(() => {
    EventBus.clear();
    CombatHUD.resetForTests();
    document.body.innerHTML = '';
  });

  it('opens on player death and offers retry or return home', () => {
    const uiRoot = document.getElementById('ui-root')!;
    CombatHUD.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'combat', payload: { mapId: 'test' } });

    EventBus.emit('player:died', undefined);

    const overlay = uiRoot.querySelector('[data-testid="combat-death-overlay"]');
    expect(overlay?.classList.contains('combat-pause-menu--active')).toBe(true);
    expect(CombatDeathOverlay.isOpen()).toBe(true);
    expect(uiRoot.querySelector('button')?.textContent).toBeTruthy();
  });
});
