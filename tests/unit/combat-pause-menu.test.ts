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
import { CombatHUD } from '@/ui/hud/CombatHUD';
import { CombatPauseMenu } from '@/ui/hud/CombatPauseMenu';

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
  CombatHUD.resetForTests();
  document.body.innerHTML = '';
});

function enterPausedCombat(): HTMLElement {
  const uiRoot = document.getElementById('ui-root')!;
  CombatHUD.init(uiRoot);
  EventBus.emit('scene:changed', { id: 'combat', payload: { mapId: 'test' } });
  CombatPauseMenu.show();
  return uiRoot;
}

describe('CombatPauseMenu — Divine Arts row (plan 30 §4.3)', () => {
  it('shows a Divine Arts button alongside Resume / Save / Return Home', () => {
    const uiRoot = enterPausedCombat();

    const btn = uiRoot.querySelector<HTMLButtonElement>(
      '[data-testid="combat-pause-divine-arts-btn"]',
    );
    expect(btn?.textContent).toBe(I18nManager.t('combat.pause.divine_arts'));

    const actionLabels = Array.from(
      uiRoot.querySelectorAll(
        '[data-testid="combat-pause-menu"] .combat-pause-menu__actions .combat-pause-menu__btn',
      ),
    ).map((el) => el.textContent);
    expect(actionLabels).toEqual([
      I18nManager.t('combat.pause.resume'),
      I18nManager.t('combat.pause.divine_arts'),
      I18nManager.t('combat.pause.save'),
      I18nManager.t('combat.pause.return_home'),
    ]);
  });

  it('opens the 6-slot loadout picker inline without closing the pause menu', () => {
    const uiRoot = enterPausedCombat();

    const btn = uiRoot.querySelector<HTMLButtonElement>(
      '[data-testid="combat-pause-divine-arts-btn"]',
    );
    btn?.click();

    const picker = uiRoot.querySelector<HTMLElement>('.combat-skill-picker');
    expect(CombatPauseMenu.isOpen()).toBe(true);
    expect(picker?.hidden).toBe(false);
    expect(uiRoot.querySelectorAll('.ancient-demo-modal__slot')).toHaveLength(6);
  });

  it('assigning a slot patches the save and emits loadout:changed for the wheel', () => {
    const skillId = 'skill.life.mend';
    gameStore.getState().patch({ unlockedSkills: [skillId] });

    const uiRoot = enterPausedCombat();

    const events: unknown[] = [];
    const unsubscribe = EventBus.on('loadout:changed', (payload) => events.push(payload));

    uiRoot
      .querySelector<HTMLButtonElement>('[data-testid="combat-pause-divine-arts-btn"]')
      ?.click();

    const poolIcon = uiRoot.querySelector<HTMLButtonElement>('.skill-loadout__pool-icon');
    poolIcon?.click();

    expect(events).toHaveLength(1);
    expect(gameStore.getState().save?.divineArts[0]).toBe(skillId);

    unsubscribe();
  });
});
