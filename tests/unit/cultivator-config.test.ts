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

  it('defaults opponentKind to cultivator when omitted (combat-defeat-canon.md §4)', () => {
    const result = cultivatorConfigSchema.parse(validCultivator);
    expect(result.opponentKind).toBe('cultivator');
  });

  it('accepts an explicit beast opponentKind', () => {
    const result = cultivatorConfigSchema.safeParse({ ...validCultivator, opponentKind: 'beast' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.opponentKind).toBe('beast');
  });

  it('rejects an unknown opponentKind', () => {
    const result = cultivatorConfigSchema.safeParse({ ...validCultivator, opponentKind: 'ghost' });
    expect(result.success).toBe(false);
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

describe('opponentKind content population (combat-defeat-canon.md §1, tracks 06/08)', () => {
  it('sets every bundled enemy/boss to a valid opponentKind', () => {
    for (const id of listCultivatorIds()) {
      expect(['beast', 'cultivator']).toContain(getCultivatorConfig(id).opponentKind);
    }
  });

  it('marks all bosses as cultivator — ordeals are never despawn-on-defeat', () => {
    for (const id of listCultivatorIds().filter((cid) => cid.startsWith('boss.'))) {
      expect(getCultivatorConfig(id).opponentKind).toBe('cultivator');
    }
  });

  it('marks animal/spirit fodder as beast (despawn, no sit-recover)', () => {
    for (const id of ['enemy.wolf', 'enemy.spirit.fox', 'enemy.spirit.moth', 'enemy.slime']) {
      expect(getCultivatorConfig(id).opponentKind).toBe('beast');
    }
  });

  it('marks named humanoid opponents as cultivator (gather-qi recovery)', () => {
    for (const id of ['enemy.bandit.thug', 'enemy.heng_yue.disciple', 'enemy.guard.patrol']) {
      expect(getCultivatorConfig(id).opponentKind).toBe('cultivator');
    }
  });
});
