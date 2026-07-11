import { describe, expect, it } from 'vitest';
import { getEnemyConfig, listEnemyIds } from '@/combat/cultivators/CultivatorLoader';
import { listSkillIds } from '@/progression/SkillLoader';
import { getLootTable, listLootTableIds } from '@/progression/LootLoader';
import {
  isSkillUnlocked,
  unlockSkillForBoss,
  unlockSkillsForLevel,
} from '@/progression/SkillUnlockManager';
import { BossPhaseTracker } from '@/combat/ai/BossPhaseTracker';
import { SaveManager } from '@/core/save/SaveManager';
import { validateAllContent } from '@/shared/content/validateAll';

describe('MVP content data (sub-plan 23)', () => {
  it('passes content validation', () => {
    const report = validateAllContent();
    expect(report.errors).toEqual([]);
  });

  it('has 41 skill definitions (incl. skill.basic.meditate)', () => {
    expect(listSkillIds().length).toBe(41);
  });

  it('has at least 25 enemy types', () => {
    expect(listEnemyIds().length).toBeGreaterThanOrEqual(25);
  });

  it('loads loot tables referenced by enemies', () => {
    expect(listLootTableIds().length).toBeGreaterThanOrEqual(5);
    expect(getLootTable('loot.tier.common').entries.length).toBeGreaterThan(0);
    const boss = getEnemyConfig('boss.jade_guardian');
    expect(boss.lootTable).toBeTruthy();
    getLootTable(boss.lootTable!);
  });

  it('bosses include phase scripts after metadata patch', () => {
    const boss = getEnemyConfig('boss.rift_horror');
    expect(boss.phases?.length).toBeGreaterThanOrEqual(2);
  });

  it('BossPhaseTracker emits spawns at threshold', () => {
    const tracker = new BossPhaseTracker([
      { hpThreshold: 1.0, spawnAdds: [] },
      { hpThreshold: 0.5, spawnAdds: [{ id: 'enemy.slime', count: 2 }] },
    ]);
    expect(tracker.onHpRatio(0.4).length).toBeGreaterThan(0);
  });

  it('unlocks skills on level and boss kill', () => {
    let save = SaveManager.createNew();
    expect(isSkillUnlocked(save, 'skill.void.slash')).toBe(false);
    save = unlockSkillsForLevel({ ...save, stats: { ...save.stats, level: 3 } }, 3, 4);
    expect(isSkillUnlocked(save, 'skill.life.bloom.v1')).toBe(true);
    save = unlockSkillForBoss(save, 'boss.jade_guardian');
    expect(isSkillUnlocked(save, 'skill.life.pulse.v2')).toBe(true);
  });
});
