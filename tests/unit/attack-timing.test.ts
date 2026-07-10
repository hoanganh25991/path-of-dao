import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STRIKE_MS,
  DEFAULT_TELEGRAPH_COLOR,
  DEFAULT_TELEGRAPH_MS,
  dispatchAttackShape,
  resolveAttackTiming,
} from '@/combat/cultivators/attackTiming';
import type { CultivatorConfig } from '@/combat/cultivators/CultivatorConfig';

function makeConfig(overrides: Partial<CultivatorConfig> = {}): CultivatorConfig {
  return {
    id: 'boss.test',
    displayNameKey: 'boss.test.name',
    archetype: 'boss',
    opponentKind: 'cultivator',
    stats: { hpMax: 100, atk: 10, def: 5, speed: 60, crit: 0.1, critDmg: 1.5 },
    aggroRange: 200,
    attackRange: 60,
    attackCooldownMs: 1000,
    xpReward: 10,
    goldReward: [1, 2],
    lootTable: null,
    spriteKey: 'boss_test',
    attackShape: 'circle',
    ...overrides,
  };
}

describe('resolveAttackTiming (sub-plan 23 — distinct boss patterns)', () => {
  it('falls back to engine defaults when nothing overrides', () => {
    const timing = resolveAttackTiming(makeConfig(), null);
    expect(timing).toEqual({
      telegraphMs: DEFAULT_TELEGRAPH_MS,
      strikeMs: DEFAULT_STRIKE_MS,
      telegraphColor: DEFAULT_TELEGRAPH_COLOR,
      attackShape: 'circle',
    });
  });

  it('prefers cultivator-level overrides over engine defaults', () => {
    const config = makeConfig({ telegraphMs: 500, strikeMs: 150, telegraphColor: 0x00ff00, attackShape: 'projectile' });
    const timing = resolveAttackTiming(config, null);
    expect(timing).toEqual({
      telegraphMs: 500,
      strikeMs: 150,
      telegraphColor: 0x00ff00,
      attackShape: 'projectile',
    });
  });

  it('prefers the active boss phase over cultivator-level config', () => {
    const config = makeConfig({ telegraphMs: 500, attackShape: 'projectile' });
    const timing = resolveAttackTiming(config, { hpThreshold: 0.5, telegraphMs: 150, attackShape: 'aoe_ring' });
    expect(timing.telegraphMs).toBe(150);
    expect(timing.attackShape).toBe('aoe_ring');
  });
});

describe('dispatchAttackShape (sub-plan 23 — distinct boss patterns)', () => {
  it('forces projectile for ranged_kiter regardless of content shape', () => {
    expect(dispatchAttackShape('ranged_kiter', 'circle')).toBe('projectile');
  });

  it('forces aoe_ring for stationary regardless of content shape', () => {
    expect(dispatchAttackShape('stationary', 'circle')).toBe('aoe_ring');
  });

  it('lets boss/melee_chaser/patrol archetypes use the content-driven shape', () => {
    expect(dispatchAttackShape('boss', 'aoe_ring')).toBe('aoe_ring');
    expect(dispatchAttackShape('boss', 'projectile')).toBe('projectile');
    expect(dispatchAttackShape('melee_chaser', 'circle')).toBe('circle');
  });
});
