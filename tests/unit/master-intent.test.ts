import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { filterSkillsForIntentGates, isIntentUnlocked } from '@/progression/MasterIntentSystem';
import { InsightSystem, seedDefaultInsights } from '@/progression/InsightSystem';
import { buildPlayerStats } from '@/progression/playerStats';
import { gameStore } from '@/core/store/gameStore';

type SaveOverrides = Partial<Omit<PlayerSaveV1, 'progress'>> & {
  progress?: Partial<PlayerSaveV1['progress']>;
};

function makeSave(overrides: SaveOverrides = {}): PlayerSaveV1 {
  const base = SaveManager.createNew();
  return {
    ...base,
    ...overrides,
    insights: { ...base.insights, ...(overrides.insights ?? {}) },
    progress: { ...base.progress, ...(overrides.progress ?? {}) },
  };
}

describe('MasterIntentSystem — main-flow (sequential)', () => {
  it('life_death is always unlocked (first in the curriculum)', () => {
    const save = makeSave();
    expect(isIntentUnlocked('life_death', save)).toBe(true);
  });

  it('cause_effect is locked until life_death is awakened', () => {
    const locked = makeSave();
    expect(isIntentUnlocked('cause_effect', locked)).toBe(false);

    const unlocked = makeSave({
      insights: { ...seedDefaultInsights(), life_death: { xp: 200, awakened: true, totalUses: 60 } },
    });
    expect(isIntentUnlocked('cause_effect', unlocked)).toBe(true);
  });

  it('truth_falsehood is locked until cause_effect is awakened', () => {
    const lifeDeathOnly = makeSave({
      insights: { ...seedDefaultInsights(), life_death: { xp: 200, awakened: true, totalUses: 60 } },
    });
    expect(isIntentUnlocked('truth_falsehood', lifeDeathOnly)).toBe(false);

    const bothAwakened = makeSave({
      insights: {
        ...seedDefaultInsights(),
        life_death: { xp: 200, awakened: true, totalUses: 60 },
        cause_effect: { xp: 200, awakened: true, totalUses: 60 },
      },
    });
    expect(isIntentUnlocked('truth_falsehood', bothAwakened)).toBe(true);
  });
});

describe('MasterIntentSystem — gate-flow (independent milestones)', () => {
  it('sword is locked without the ancient_sword weapon milestone', () => {
    const save = makeSave();
    expect(isIntentUnlocked('sword', save)).toBe(false);

    const armed = makeSave({ progress: { weaponMilestone: 'ancient_sword' } });
    expect(isIntentUnlocked('sword', armed)).toBe(true);
  });

  it('flame is locked until boss.desert_sovereign is cleared', () => {
    const save = makeSave();
    expect(isIntentUnlocked('flame', save)).toBe(false);

    const cleared = makeSave({ progress: { clearedBosses: ['boss.desert_sovereign'] } });
    expect(isIntentUnlocked('flame', cleared)).toBe(true);
  });

  it('lightning is locked until boss.thunder_avatar is cleared', () => {
    const save = makeSave();
    expect(isIntentUnlocked('lightning', save)).toBe(false);

    const cleared = makeSave({ progress: { clearedBosses: ['boss.thunder_avatar'] } });
    expect(isIntentUnlocked('lightning', cleared)).toBe(true);
  });

  it('clearing an unrelated boss does not unlock flame/lightning', () => {
    const save = makeSave({ progress: { clearedBosses: ['boss.bandit_lord'] } });
    expect(isIntentUnlocked('flame', save)).toBe(false);
    expect(isIntentUnlocked('lightning', save)).toBe(false);
  });
});

describe('MasterIntentSystem — filterSkillsForIntentGates', () => {
  it('drops gate-locked and main-flow-locked skills from the pool', () => {
    const save = makeSave();
    const pool = filterSkillsForIntentGates(save, [
      'skill.life.mend',
      'skill.time.slow',
      'skill.sword.slash',
      'skill.flame.bolt',
    ]);
    expect(pool).toEqual(['skill.life.mend']);
  });

  it('opens up cause_effect skills once life_death is awakened', () => {
    const save = makeSave({
      insights: { ...seedDefaultInsights(), life_death: { xp: 200, awakened: true, totalUses: 60 } },
    });
    const pool = filterSkillsForIntentGates(save, ['skill.life.mend', 'skill.time.slow']);
    expect(pool).toEqual(['skill.life.mend', 'skill.time.slow']);
  });

  it('basic skills always pass through regardless of gates', () => {
    const save = makeSave();
    expect(filterSkillsForIntentGates(save, ['skill.basic.meditate'])).toEqual(['skill.basic.meditate']);
  });
});

describe('MasterIntentSystem — awakening still swaps loadout', () => {
  it('applyAwakening swaps the equipped skill to its awakened variant once life_death is ready', async () => {
    await SaveManager.destroy();
    indexedDB = new IDBFactory();
    await SaveManager.init();

    const save = makeSave({
      stats: buildPlayerStats('hero.wanderer', 12, 'foundation_establishment'),
      realm: { id: 'foundation_establishment', tier: 'early', breakthroughReady: false },
      divineArts: ['skill.life.mend', '', '', '', '', ''],
      insights: { ...seedDefaultInsights(), life_death: { xp: 200, awakened: false, totalUses: 50 } },
    });
    await SaveManager.save(save);
    gameStore.setState({ save, isLoaded: true });

    const awakenedId = InsightSystem.applyAwakening('life_death');
    const next = gameStore.getState().save;

    expect(awakenedId).toBe('skill.life.mend.awakened');
    expect(next?.insights.life_death?.awakened).toBe(true);
    expect(next?.divineArts[0]).toBe('skill.life.mend.awakened');
    expect(isIntentUnlocked('cause_effect', next!)).toBe(true);
  });
});
