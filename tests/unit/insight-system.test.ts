import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { getInsightIntentConfig } from '@/progression/InsightDefinitions';
import {
  checkAwakeningReady,
  grantInsightXp,
  insightDisplayPct,
  InsightSystem,
  listReadyAwakeningIntents,
  seedDefaultInsights,
} from '@/progression/InsightSystem';
import { coerceDivineArts } from '@/progression/SkillSlots';
import { buildPlayerStats } from '@/progression/playerStats';
import { gameStore } from '@/core/store/gameStore';

function makeSave(overrides: Partial<PlayerSaveV1> = {}): PlayerSaveV1 {
  const base = SaveManager.createNew();
  return {
    ...base,
    ...overrides,
    insights: { ...base.insights, ...(overrides.insights ?? {}) },
    divineArts: coerceDivineArts(overrides.divineArts ?? base.divineArts),
  };
}

beforeEach(async () => {
  await SaveManager.destroy();
  indexedDB = new IDBFactory();
});

describe('InsightSystem', () => {
  it('seeds all six Master Intents in a new save', () => {
    const save = SaveManager.createNew();
    expect(Object.keys(save.insights).sort()).toEqual([
      'cause_effect',
      'flame',
      'life_death',
      'lightning',
      'sword',
      'truth_falsehood',
    ]);
  });

  it('accumulates XP on skill use', () => {
    const save = makeSave();
    const { insights } = grantInsightXp(save, 'life_death', 'skillUse');
    expect(insights.life_death?.xp).toBe(2);
    expect(insights.life_death?.totalUses).toBe(1);
    expect(insightDisplayPct(insights.life_death!.xp)).toBe(1);
  });

  it('caps XP after awakening and ignores further gains', () => {
    const save = makeSave({
      insights: {
        ...seedDefaultInsights(),
        life_death: { xp: 200, awakened: true, totalUses: 60 },
      },
    });
    const { insights } = grantInsightXp(save, 'life_death', 'skillUse');
    expect(insights.life_death?.xp).toBe(200);
    expect(insights.life_death?.totalUses).toBe(60);
  });

  it('blocks awakening when realm is too low', () => {
    const save = makeSave({
      stats: buildPlayerStats('hero.wanderer', 12, 'mortal_body'),
      insights: {
        ...seedDefaultInsights(),
        life_death: { xp: 200, awakened: false, totalUses: 50 },
      },
    });
    expect(checkAwakeningReady(save, 'life_death')).toBe(false);
  });

  it('allows awakening when XP, uses, and realm requirements are met', () => {
    const save = makeSave({
      stats: buildPlayerStats('hero.wanderer', 12, 'foundation_establishment'),
      realm: { id: 'foundation_establishment', tier: 'early', breakthroughReady: false },
      insights: {
        ...seedDefaultInsights(),
        life_death: { xp: 200, awakened: false, totalUses: 50 },
      },
    });
    expect(checkAwakeningReady(save, 'life_death')).toBe(true);
  });

  it('swaps equipped skill id to awakened variant on applyAwakening', async () => {
    await SaveManager.init();
    const save = makeSave({
      stats: buildPlayerStats('hero.wanderer', 12, 'foundation_establishment'),
      realm: { id: 'foundation_establishment', tier: 'early', breakthroughReady: false },
      divineArts: [
        'skill.life.mend',
        'skill.sword.slash',
        'skill.time.slow',
        '',
        '',
        '',
      ],
      insights: {
        ...seedDefaultInsights(),
        life_death: { xp: 200, awakened: false, totalUses: 50 },
      },
    });
    await SaveManager.save(save);
    gameStore.setState({ save, isLoaded: true });

    const awakenedId = InsightSystem.applyAwakening('life_death');
    const next = gameStore.getState().save;

    expect(awakenedId).toBe(getInsightIntentConfig('life_death').awakenedSkillId);
    expect(next?.insights.life_death?.awakened).toBe(true);
    expect(next?.divineArts[0]).toBe('skill.life.mend.awakened');
  });

  it('lists intents ready for awakening ceremony', () => {
    const save = makeSave({
      stats: buildPlayerStats('hero.wanderer', 12, 'foundation_establishment'),
      realm: { id: 'foundation_establishment', tier: 'early', breakthroughReady: false },
      insights: {
        ...seedDefaultInsights(),
        life_death: { xp: 200, awakened: false, totalUses: 50 },
        cause_effect: { xp: 50, awakened: false, totalUses: 5 },
      },
    });
    expect(listReadyAwakeningIntents(save)).toEqual(['life_death']);
  });
});
