import { describe, expect, it, vi } from 'vitest';

vi.mock('@/combat/combat/HitFlash', () => ({
  applyHitFlash: vi.fn(),
  updateHitFlashes: vi.fn(),
  clearHitFlash: vi.fn(),
}));

vi.mock('@/combat/skills/VFXLibrary', () => ({
  playHitSparks: vi.fn(),
}));

import { resolveHit } from '@/combat/combat/CombatResolver';
import { Hitbox } from '@/combat/combat/Hitbox';
import type { HurtboxEntity } from '@/combat/combat/Hurtbox';
import type { BaseStats } from '@/progression/types';
import type { DamageResult } from '@/progression/types';
import { resolveDamage } from '@/progression/DamageCalculator';

/**
 * TTK reference — level-1 hero (atk 10) vs slime (40 HP, def 2):
 *   combo step 1 → 9 dmg, step 2 → 10, step 3 → 13  (32 total)
 *   one more step-1 hit → 41 total → slime dies in 4 swing contacts (full combo + 1).
 */
function makeStats(overrides: Partial<BaseStats> = {}): BaseStats {
  return {
    level: 1,
    hpMax: 40,
    manaMax: 10,
    atk: 10,
    def: 2,
    crit: 0,
    critDmg: 1.5,
    speed: 100,
    spirit: 0,
    ...overrides,
  };
}

function mockTarget(overrides: Partial<HurtboxEntity> & { stats?: BaseStats }): HurtboxEntity {
  let hp = overrides.stats?.hpMax ?? 40;
  const stats = overrides.stats ?? makeStats();
  const hits: DamageResult[] = [];

  return {
    id: overrides.id ?? 'target_1',
    team: overrides.team ?? 'enemy',
    sprite: { active: true, setTint: vi.fn(), setTintMode: vi.fn(), clearTint: vi.fn(), tintTopLeft: 0xffffff } as unknown as HurtboxEntity['sprite'],
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    hurtRadius: overrides.hurtRadius ?? 12,
    invulnerable: overrides.invulnerable ?? false,
    getDefenderStats: () => ({ ...stats, hpMax: stats.hpMax, manaMax: stats.manaMax }),
    receiveHit(result: DamageResult) {
      hits.push(result);
      hp -= result.final;
    },
    ...overrides,
  };
}

function mockDeps() {
  return {
    damageNumbers: { spawn: vi.fn() },
    random: () => 1,
  };
}

describe('resolveHit', () => {
  it('skips invulnerable targets (dodge i-frames)', () => {
    const hitbox = new Hitbox({
      ownerId: 'player',
      team: 'player',
      shape: { kind: 'circle', radius: 40, x: 0, y: 0 },
      damage: { attacker: makeStats({ atk: 100 }), skillMultiplier: 1, damageType: 'physical' },
      lifetimeMs: 80,
    });
    const target = mockTarget({ invulnerable: true });
    const deps = mockDeps();

    expect(resolveHit(hitbox, target, deps)).toBeNull();
    expect(deps.damageNumbers.spawn).not.toHaveBeenCalled();
    expect(hitbox.alreadyHit.size).toBe(0);
  });

  it('pierce 2 hits two distinct enemies', () => {
    const hitbox = new Hitbox({
      ownerId: 'player',
      team: 'player',
      shape: { kind: 'circle', radius: 60, x: 0, y: 0 },
      damage: { attacker: makeStats({ atk: 50 }), skillMultiplier: 1, damageType: 'physical' },
      lifetimeMs: 80,
      pierce: 2,
    });
    const a = mockTarget({ id: 'a' });
    const b = mockTarget({ id: 'b' });
    const deps = mockDeps();

    resolveHit(hitbox, a, deps);
    resolveHit(hitbox, b, deps);

    expect(hitbox.alreadyHit.size).toBe(2);
    expect(hitbox.pierceRemaining).toBe(0);
  });

  it('does not double-hit the same target in one swing', () => {
    const hitbox = new Hitbox({
      ownerId: 'player',
      team: 'player',
      shape: { kind: 'circle', radius: 40, x: 0, y: 0 },
      damage: { attacker: makeStats({ atk: 100 }), skillMultiplier: 1, damageType: 'physical' },
      lifetimeMs: 80,
      pierce: 3,
    });
    const target = mockTarget({ id: 'slime' });
    const deps = mockDeps();

    resolveHit(hitbox, target, deps);
    resolveHit(hitbox, target, deps);

    expect(hitbox.alreadyHit.size).toBe(1);
  });

  it('propagates crit flag to damage number styling', () => {
    const hitbox = new Hitbox({
      ownerId: 'player',
      team: 'player',
      shape: { kind: 'circle', radius: 40, x: 0, y: 0 },
      damage: {
        attacker: makeStats({ atk: 100, crit: 1, critDmg: 2 }),
        skillMultiplier: 1,
        damageType: 'physical',
      },
      lifetimeMs: 80,
    });
    const target = mockTarget({});
    const deps = { ...mockDeps(), random: () => 0 };

    const result = resolveHit(hitbox, target, deps);
    expect(result?.isCrit).toBe(true);
    expect(deps.damageNumbers.spawn).toHaveBeenCalledWith(expect.any(Number), true, expect.any(Number), expect.any(Number));
  });

  it('enforces minimum 1 damage', () => {
    const hitbox = new Hitbox({
      ownerId: 'player',
      team: 'player',
      shape: { kind: 'circle', radius: 40, x: 0, y: 0 },
      damage: {
        attacker: makeStats({ atk: 1 }),
        skillMultiplier: 0.1,
        damageType: 'physical',
      },
      lifetimeMs: 80,
    });
    const target = mockTarget({ stats: makeStats({ def: 10_000 }) });
    const deps = mockDeps();

    const result = resolveHit(hitbox, target, deps);
    expect(result?.final).toBe(1);
  });
});

describe('slime TTK (level-1 hero combo)', () => {
  const hero = makeStats({ atk: 10, def: 5 });
  const slimeDef = makeStats({ hpMax: 40, def: 2, atk: 8 });
  const multipliers = [1.0, 1.1, 1.4] as const;
  const neverCrit = () => 1;

  it('kills slime in 4 hit contacts (3-hit combo + 1)', () => {
    let hp = slimeDef.hpMax;
    const swings = [...multipliers, multipliers[0]!];

    for (const mult of swings) {
      const result = resolveDamage(
        {
          attacker: hero,
          defender: slimeDef,
          skillMultiplier: mult,
          damageType: 'physical',
        },
        neverCrit,
      );
      hp -= result.final;
    }

    expect(hp).toBeLessThanOrEqual(0);
    expect(swings.length).toBe(4);
  });
});
