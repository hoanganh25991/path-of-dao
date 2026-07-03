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
import { buildPlayerStats } from '@/progression/playerStats';
import { gameStore } from '@/core/store/gameStore';

function makeSave(overrides: Partial<PlayerSaveV1> = {}): PlayerSaveV1 {
  const base = SaveManager.createNew();
  return {
    ...base,
    ...overrides,
    insights: { ...base.insights, ...(overrides.insights ?? {}) },
    equippedSkills: { ...base.equippedSkills, ...(overrides.equippedSkills ?? {}) },
  };
}

beforeEach(async () => {
  await SaveManager.destroy();
  indexedDB = new IDBFactory();
});

describe('InsightSystem', () => {
  it('seeds all six intents in a new save', () => {
    const save = SaveManager.createNew();
    expect(Object.keys(save.insights).sort()).toEqual([
      'flame',
      'life',
      'lightning',
      'sword',
      'time',
      'void',
    ]);
  });

  it('accumulates XP on skill use', () => {
    const save = makeSave();
    const { insights } = grantInsightXp(save, 'void', 'skillUse');
    expect(insights.void?.xp).toBe(2);
    expect(insights.void?.totalUses).toBe(1);
    expect(insightDisplayPct(insights.void!.xp)).toBe(1);
  });

  it('caps XP after awakening and ignores further gains', () => {
    const save = makeSave({
      insights: {
        ...seedDefaultInsights(),
        void: { xp: 200, awakened: true, totalUses: 60 },
      },
    });
    const { insights } = grantInsightXp(save, 'void', 'skillUse');
    expect(insights.void?.xp).toBe(200);
    expect(insights.void?.totalUses).toBe(60);
  });

  it('blocks awakening when realm is too low', () => {
    const save = makeSave({
      stats: buildPlayerStats('hero.wanderer', 12, 'mortal_body'),
      insights: {
        ...seedDefaultInsights(),
        void: { xp: 200, awakened: false, totalUses: 50 },
      },
    });
    expect(checkAwakeningReady(save, 'void')).toBe(false);
  });

  it('allows awakening when XP, uses, and realm requirements are met', () => {
    const save = makeSave({
      stats: buildPlayerStats('hero.wanderer', 12, 'foundation_establishment'),
      realm: { id: 'foundation_establishment', tier: 'early', breakthroughReady: false },
      insights: {
        ...seedDefaultInsights(),
        void: { xp: 200, awakened: false, totalUses: 50 },
      },
    });
    expect(checkAwakeningReady(save, 'void')).toBe(true);
  });

  it('swaps equipped skill id to awakened variant on applyAwakening', async () => {
    await SaveManager.init();
    const save = makeSave({
      stats: buildPlayerStats('hero.wanderer', 12, 'foundation_establishment'),
      realm: { id: 'foundation_establishment', tier: 'early', breakthroughReady: false },
      equippedSkills: {
        primary: 'skill.void.slash',
        secondary: 'skill.sword.slash',
        ultimate: 'skill.time.slow',
      },
      insights: {
        ...seedDefaultInsights(),
        void: { xp: 200, awakened: false, totalUses: 50 },
      },
    });
    await SaveManager.save(save);
    gameStore.setState({ save, isLoaded: true });

    const awakenedId = InsightSystem.applyAwakening('void');
    const next = gameStore.getState().save;

    expect(awakenedId).toBe(getInsightIntentConfig('void').awakenedSkillId);
    expect(next?.insights.void?.awakened).toBe(true);
    expect(next?.equippedSkills.primary).toBe('skill.void.slash.awakened');
  });

  it('lists intents ready for awakening ceremony', () => {
    const save = makeSave({
      stats: buildPlayerStats('hero.wanderer', 12, 'foundation_establishment'),
      realm: { id: 'foundation_establishment', tier: 'early', breakthroughReady: false },
      insights: {
        ...seedDefaultInsights(),
        void: { xp: 200, awakened: false, totalUses: 50 },
        life: { xp: 50, awakened: false, totalUses: 5 },
      },
    });
    expect(listReadyAwakeningIntents(save)).toEqual(['void']);
  });
});
