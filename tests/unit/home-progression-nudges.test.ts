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
import {
  initHomeProgressionNudges,
  resetHomeProgressionNudgesForTests,
} from '@/ui/home/HomeProgressionNudges';
import { getInsightIntentConfig } from '@/progression/InsightDefinitions';
import { INSIGHT_XP_TO_FULL } from '@/progression/InsightDefinitions';

beforeEach(async () => {
  document.body.innerHTML = '';
  await SaveManager.destroy();
  indexedDB = new IDBFactory();
  await gameStore.getState().load();
  await I18nManager.load('en');
});

afterEach(() => {
  EventBus.clear();
  resetHomeProgressionNudgesForTests();
});

describe('HomeProgressionNudges', () => {
  it('shows awakening toast when returning home with a ready intent', () => {
    const voidConfig = getInsightIntentConfig('void');
    gameStore.getState().patch({
      insights: {
        void: {
          xp: INSIGHT_XP_TO_FULL,
          awakened: false,
          totalUses: voidConfig.awakenRequirement.minUses,
        },
      },
      realm: { id: voidConfig.awakenRequirement.minRealm, tier: 'early', breakthroughReady: false },
    });

    initHomeProgressionNudges();
    EventBus.emit('scene:changed', { id: 'home', payload: undefined });

    const toast = document.querySelector('.home-toast');
    expect(toast?.textContent).toContain('Void Slash');
    expect(toast?.textContent).toContain('Skills');
  });
});
