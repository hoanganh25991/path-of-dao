import { describe, expect, it } from 'vitest';
import { cultivatorConfigSchema, encounterConfigSchema } from '@/combat/cultivators/CultivatorConfig';
import {
  getCultivatorConfig,
  getEncounterConfig,
  listCultivatorIds,
} from '@/combat/cultivators/CultivatorLoader';

const validCultivator = {
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

describe('cultivatorConfigSchema', () => {
  it('accepts a valid cultivator config', () => {
    expect(cultivatorConfigSchema.safeParse(validCultivator).success).toBe(true);
  });

  it('rejects an unknown archetype', () => {
    const result = cultivatorConfigSchema.safeParse({ ...validCultivator, archetype: 'necromancer' });
    expect(result.success).toBe(false);
  });

  it('rejects missing stats', () => {
    const { stats: _stats, ...withoutStats } = validCultivator;
    expect(cultivatorConfigSchema.safeParse(withoutStats).success).toBe(false);
  });
});

describe('encounterConfigSchema', () => {
  it('rejects an encounter without waves', () => {
    expect(encounterConfigSchema.safeParse({ id: 'encounters.x', waves: [] }).success).toBe(false);
  });
});

describe('CultivatorLoader', () => {
  it('lists and loads bundled cultivator content', () => {
    expect(listCultivatorIds()).toEqual(
      expect.arrayContaining(['enemy.slime', 'enemy.archer', 'enemy.totem']),
    );
    expect(getCultivatorConfig('enemy.slime').archetype).toBe('melee_chaser');
    expect(getCultivatorConfig('enemy.archer').archetype).toBe('ranged_kiter');
  });

  it('loads the test encounter with wave ids that exist', () => {
    const encounter = getEncounterConfig('encounters.test');
    const ids = listCultivatorIds();
    for (const wave of encounter.waves) {
      for (const group of wave.enemies) {
        expect(ids).toContain(group.id);
      }
    }
  });

  it('throws with the id in the message for unknown content', () => {
    expect(() => getCultivatorConfig('enemy.missing')).toThrowError(/enemy\.missing/);
    expect(() => getEncounterConfig('encounters.missing')).toThrowError(/encounters\.missing/);
  });
});
