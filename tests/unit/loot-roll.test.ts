import { describe, expect, it } from 'vitest';
import { getEnemyConfig } from '@/combat/cultivators/CultivatorLoader';
import { rollCultivatorLoot } from '@/combat/systems/lootRoll';

const slime = getEnemyConfig('enemy.slime');
const eliteShadow = getEnemyConfig('enemy.elite.shadow');
const bossJade = getEnemyConfig('boss.jade_guardian');

describe('rollCultivatorLoot', () => {
  it('returns nothing when cultivator has no loot table', () => {
    const training = getEnemyConfig('enemy.training.dummy');
    const noTable = { ...training, lootTable: null };
    expect(rollCultivatorLoot(noTable, { isBoss: false, wasRematch: false }, () => 0)).toEqual([]);
  });

  it('grants weighted loot for grunts when roll passes chance gate', () => {
    const drops = rollCultivatorLoot(slime, { isBoss: false, wasRematch: false }, () => 0);
    expect(drops).toHaveLength(1);
    expect(drops[0]?.itemId).toBe('item.sword.wood');
  });

  it('skips grunt drop when roll fails chance gate', () => {
    const drops = rollCultivatorLoot(slime, { isBoss: false, wasRematch: false }, () => 0.99);
    expect(drops).toEqual([]);
  });

  it('uses elite drop chance for elite cultivators', () => {
    const pass = rollCultivatorLoot(eliteShadow, { isBoss: false, wasRematch: false }, () => 0.2);
    expect(pass).toHaveLength(1);

    const fail = rollCultivatorLoot(eliteShadow, { isBoss: false, wasRematch: false }, () => 0.95);
    expect(fail).toEqual([]);
  });

  it('boss first clear grants guaranteed drops plus bonus roll', () => {
    const drops = rollCultivatorLoot(bossJade, { isBoss: true, wasRematch: false }, () => 0);
    const ids = drops.map((d) => d.itemId);
    expect(ids).toContain('item.spirit.jade');
    expect(ids).toContain('item.consumable.immortal_jade');
    expect(drops.length).toBeGreaterThanOrEqual(3);
  });

  it('boss rematch only rolls when chance passes and skips guaranteed', () => {
    const pass = rollCultivatorLoot(bossJade, { isBoss: true, wasRematch: true }, () => 0.2);
    expect(pass).toHaveLength(1);
    expect(pass[0]?.itemId).toBe('item.sword.iron');

    const fail = rollCultivatorLoot(bossJade, { isBoss: true, wasRematch: true }, () => 0.99);
    expect(fail).toEqual([]);
  });
});
