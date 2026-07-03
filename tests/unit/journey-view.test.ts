import { describe, expect, it } from 'vitest';
import { I18nManager } from '@/core/i18n/I18nManager';
import { describeJourneyEntry } from '@/ui/home/journeyView';

describe('describeJourneyEntry', () => {
  it('resolves encounter titles from encounter definitions', async () => {
    await I18nManager.load('en');
    const view = describeJourneyEntry({
      kind: 'encounter',
      refId: 'encounter.ancient_inheritance',
      mapId: 'map.fallen_village.01',
      realmId: 'mortal_body',
      level: 1,
      cp: 800,
      at: new Date().toISOString(),
    });

    expect(view.title).toBe('Ancient Inheritance');
    expect(view.kindLabel).toBe('Fortune');
  });

  it('resolves boss titles from enemy definitions', async () => {
    await I18nManager.load('en');
    const view = describeJourneyEntry({
      kind: 'boss',
      refId: 'boss.bandit_lord',
      mapId: 'map.stone_canyon.02',
      realmId: 'mortal_body',
      level: 5,
      cp: 1200,
      at: new Date().toISOString(),
    });

    expect(view.title).toBe('Bandit Lord');
    expect(view.kindLabel).toBe('Boss');
  });
});
