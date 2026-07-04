/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { SaveManager } from '@/core/save/SaveManager';
import { gameStore } from '@/core/store/gameStore';
import { CombatHUD } from '@/ui/hud/CombatHUD';
import { getEnemyConfig } from '@/combat/cultivators/CultivatorLoader';
import { computeKillRewards } from '@/combat/systems/rewards';
import { emitKillProgressionEvents } from '@/combat/systems/killProgressionEvents';

beforeEach(async () => {
  document.body.innerHTML = '<div id="ui-root"></div>';
  await SaveManager.destroy();
  indexedDB = new IDBFactory();
  await gameStore.getState().load();
});

afterEach(() => {
  CombatHUD.resetForTests();
  EventBus.clear();
});

describe('PlayerStatusBar cultivation meter', () => {
  it('updates fill width when kill XP is granted', () => {
    const uiRoot = document.getElementById('ui-root')!;
    CombatHUD.init(uiRoot);
    EventBus.emit('scene:changed', { id: 'combat' });

    const meter = document.querySelector('[data-testid="cultivation-meter"] .status-bar__fill') as HTMLElement;
    expect(meter.style.width).toBe('0%');

    const save = gameStore.getState().save!;
    const slime = getEnemyConfig('enemy.slime');
    const rewards = computeKillRewards(save, slime, () => 0);

    gameStore.getState().patch({ xp: rewards.xpTotal });
    emitKillProgressionEvents(rewards, save.xp, save.realm.id);

    expect(meter.style.width).not.toBe('0%');
    expect(meter.style.width).toMatch(/%$/);
  });
});
