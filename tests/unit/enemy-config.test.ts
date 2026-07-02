import { describe, expect, it } from 'vitest';
import { enemyConfigSchema, encounterConfigSchema } from '@/combat/enemies/EnemyConfig';
import { getEnemyConfig, getEncounterConfig, listEnemyIds } from '@/combat/enemies/EnemyLoader';

const validEnemy = {
  id: 'enemy.test',
  displayNameKey: 'enemy.test.name',
  archetype: 'melee_chaser',
  stats: { hpMax: 40, atk: 8, def: 2, speed: 70, crit: 0.05, critDmg: 1.5 },
  aggroRange: 200,
  attackRange: 36,
  attackCooldownMs: 1200,
  xpReward: 15,
  goldReward: [1, 5],
  lootTable: null,
  spriteKey: 'enemy_slime',
};

describe('enemyConfigSchema', () => {
  it('accepts a valid enemy config', () => {
    expect(enemyConfigSchema.safeParse(validEnemy).success).toBe(true);
  });

  it('rejects an unknown archetype', () => {
    const result = enemyConfigSchema.safeParse({ ...validEnemy, archetype: 'necromancer' });
    expect(result.success).toBe(false);
  });

  it('rejects missing stats', () => {
    const { stats: _stats, ...withoutStats } = validEnemy;
    expect(enemyConfigSchema.safeParse(withoutStats).success).toBe(false);
  });
});

describe('encounterConfigSchema', () => {
  it('rejects an encounter without waves', () => {
    expect(encounterConfigSchema.safeParse({ id: 'encounters.x', waves: [] }).success).toBe(false);
  });
});

describe('EnemyLoader', () => {
  it('lists and loads the bundled test enemies', () => {
    expect(listEnemyIds()).toEqual(
      expect.arrayContaining(['enemy.slime', 'enemy.archer', 'enemy.totem']),
    );
    expect(getEnemyConfig('enemy.slime').archetype).toBe('melee_chaser');
    expect(getEnemyConfig('enemy.archer').archetype).toBe('ranged_kiter');
  });

  it('loads the test encounter with wave enemy ids that exist', () => {
    const encounter = getEncounterConfig('encounters.test');
    const ids = listEnemyIds();
    for (const wave of encounter.waves) {
      for (const group of wave.enemies) {
        expect(ids).toContain(group.id);
      }
    }
  });

  it('throws with the id in the message for unknown content', () => {
    expect(() => getEnemyConfig('enemy.missing')).toThrowError(/enemy\.missing/);
    expect(() => getEncounterConfig('encounters.missing')).toThrowError(/encounters\.missing/);
  });
});
