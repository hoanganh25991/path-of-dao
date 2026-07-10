/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { I18nManager } from '@/core/i18n/I18nManager';
import { CombatHUD } from '@/ui/hud/CombatHUD';
import { TopRightHud } from '@/ui/hud/TopRightHud';

describe('CombatHUD', () => {
  beforeEach(async () => {
    document.body.innerHTML = '<div id="ui-root"></div>';
    await I18nManager.load('en');
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

  it('places satellite buttons on arc around attack anchor', () => {
    const uiRoot = document.getElementById('ui-root')!;
    TopRightHud.init(uiRoot);
    CombatHUD.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'combat', payload: { mapId: 'test' } });

    expect(uiRoot.querySelector('.action-btn--attack')?.classList.contains('action-btn--arc')).toBe(
      false,
    );
    expect(uiRoot.querySelector('.action-btn--dodge')?.classList.contains('action-btn--arc')).toBe(true);
    expect(uiRoot.querySelector('.action-btn--health')?.classList.contains('action-btn--arc')).toBe(
      true,
    );
    expect(uiRoot.querySelector('.action-btn--skill')?.classList.contains('action-btn--arc')).toBe(
      true,
    );
    expect(uiRoot.querySelector('.action-btn--swap-skills')?.classList.contains('action-btn--arc')).toBe(
      true,
    );
  });

  it('shows loot drop rate hint in combat', () => {
    const uiRoot = document.getElementById('ui-root')!;
    TopRightHud.init(uiRoot);
    CombatHUD.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'combat', payload: { mapId: 'test' } });

    const hint = uiRoot.querySelector('[data-testid="combat-loot-hint"]');
    expect(hint?.textContent).toContain('12%');
    expect(hint?.textContent).toContain('28%');
  });
});
