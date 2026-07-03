import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { CultivationRealm } from '@/progression/CultivationRealm';
import { buildPlayerStats } from '@/progression/playerStats';
import { applyRealmScaling } from '@/progression/RealmStatScaling';
import { statsForLevel } from '@/progression/LevelCurve';

function makeSave(overrides: Partial<PlayerSaveV1> = {}): PlayerSaveV1 {
  const base = SaveManager.createNew();
  return { ...base, ...overrides, realm: { ...base.realm, ...overrides.realm } };
}

beforeEach(async () => {
  await SaveManager.destroy();
  indexedDB = new IDBFactory();
});

describe('CultivationRealm', () => {
  it('starts at Mortal Body early tier', () => {
    const save = SaveManager.createNew();
    expect(save.realm.id).toBe('mortal_body');
    expect(save.realm.tier).toBe('early');
    expect(save.realm.breakthroughReady).toBe(false);
  });

  it('updates tier every 3 levels within a realm band', () => {
    expect(CultivationRealm.updateTierFromLevel('foundation_establishment', 12)).toBe('early');
    expect(CultivationRealm.updateTierFromLevel('foundation_establishment', 15)).toBe('mid');
    expect(CultivationRealm.updateTierFromLevel('foundation_establishment', 18)).toBe('late');
    expect(CultivationRealm.updateTierFromLevel('foundation_establishment', 21)).toBe('peak');
  });

  it('cannot breakthrough when below requirements', () => {
    const save = makeSave({
      stats: { ...makeSave().stats, level: 4, spirit: 10 },
    });
    expect(CultivationRealm.checkBreakthroughReady(save)).toBe(false);
  });

  it('can breakthrough mortal → qi at level 5 with no spirit cost', () => {
    const save = makeSave({
      stats: buildPlayerStats('hero.wanderer', 5, 'mortal_body'),
    });
    expect(CultivationRealm.checkBreakthroughReady(save)).toBe(true);
  });

  it('requires spirit for qi → foundation', () => {
    const stats = buildPlayerStats('hero.wanderer', 12, 'qi_condensation');
    const save = makeSave({
      realm: { id: 'qi_condensation', tier: 'early', breakthroughReady: false },
      stats: { ...stats, spirit: 30 },
    });
    expect(CultivationRealm.checkBreakthroughReady(save)).toBe(false);

    save.stats.spirit = 50;
    expect(CultivationRealm.checkBreakthroughReady(save)).toBe(true);
  });

  it('requires boss clear for foundation → core', () => {
    const stats = buildPlayerStats('hero.wanderer', 22, 'foundation_establishment');
    const save = makeSave({
      realm: { id: 'foundation_establishment', tier: 'early', breakthroughReady: false },
      stats: { ...stats, spirit: 200 },
      progress: {
        ...makeSave().progress,
        clearedBosses: [],
      },
    });
    expect(CultivationRealm.checkBreakthroughReady(save)).toBe(false);

    save.progress.clearedBosses = ['boss.bandit_lord'];
    expect(CultivationRealm.checkBreakthroughReady(save)).toBe(true);
  });

  it('performBreakthrough advances realm, spends spirit, and boosts stats', () => {
    const stats = buildPlayerStats('hero.wanderer', 5, 'mortal_body');
    const save = makeSave({ stats });
    const beforeAtk = save.stats.atk;

    const next = CultivationRealm.performBreakthrough(save);

    expect(next.realm.id).toBe('qi_condensation');
    expect(next.realm.tier).toBe('early');
    expect(next.realm.breakthroughReady).toBe(false);
    expect(next.stats.atk).toBeGreaterThan(beforeAtk);
    expect(next.runtime.hp).toBe(next.stats.hpMax);
  });
});

describe('applyRealmScaling', () => {
  it('increases atk after breakthrough multipliers', () => {
    const base = statsForLevel('hero.wanderer', 12);
    const mortal = applyRealmScaling(base, 'mortal_body');
    const foundation = applyRealmScaling(base, 'foundation_establishment');

    expect(foundation.atk).toBeGreaterThan(mortal.atk);
    expect(foundation.hpMax).toBeGreaterThan(mortal.hpMax);
  });
});
