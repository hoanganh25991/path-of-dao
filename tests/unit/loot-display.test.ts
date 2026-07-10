import { describe, expect, it } from 'vitest';
import { getEnemyConfig } from '@/combat/cultivators/CultivatorLoader';
import {
  describeCultivatorLootHint,
  getCultivatorLootItemIds,
  getMapLootHudHint,
} from '@/progression/LootDisplay';

describe('LootDisplay', () => {
  it('summarizes map HUD drop rates from config', () => {
    expect(getMapLootHudHint()).toEqual({
      gruntPercent: 12,
      elitePercent: 28,
      bossRematchPercent: 35,
    });
  });

  it('describes grunt loot chance and table items', () => {
    const slime = getEnemyConfig('enemy.slime');
    const hint = describeCultivatorLootHint(slime);
    expect(hint.tier).toBe('grunt');
    expect(hint.chancePercent).toBe(12);
    expect(getCultivatorLootItemIds(slime)).toContain('item.sword.wood');
  });

  it('describes boss first clear and rematch tiers', () => {
    const boss = getEnemyConfig('boss.jade_guardian');
    expect(describeCultivatorLootHint(boss, false).tier).toBe('boss_first');
    expect(describeCultivatorLootHint(boss, true).tier).toBe('boss_rematch');
    expect(describeCultivatorLootHint(boss, true).chancePercent).toBe(35);
  });
});
