import { describe, expect, it } from 'vitest';
import { getCultivatorConfig, listCultivatorIds } from '@/combat/cultivators/CultivatorLoader';

/** All ten MVP bosses (sub-plan 23 — distinct boss patterns, track 23 P1 #6). */
function bossIds(): string[] {
  return listCultivatorIds().filter((id) => id.startsWith('boss.'));
}

describe('Boss distinct patterns content (sub-plan 23)', () => {
  it('ships all ten MVP bosses', () => {
    expect(bossIds().sort()).toEqual(
      [
        'boss.bandit_lord',
        'boss.celestial_guardian',
        'boss.desert_sovereign',
        'boss.frost_queen',
        'boss.jade_guardian',
        'boss.mist_stalker',
        'boss.rift_horror',
        'boss.seal_warden',
        'boss.thunder_avatar',
        'boss.void_sovereign',
      ].sort(),
    );
  });

  it('every boss has at least 2 phases', () => {
    for (const id of bossIds()) {
      const boss = getCultivatorConfig(id);
      expect(boss.phases?.length ?? 0).toBeGreaterThanOrEqual(2);
    }
  });

  it('void_sovereign escalates across 3 phases as the final boss', () => {
    const boss = getCultivatorConfig('boss.void_sovereign');
    expect(boss.phases?.length).toBe(3);
  });

  it('at least 6 bosses have spawnAdds or a non-circle attack shape somewhere in their kit', () => {
    const distinctive = bossIds().filter((id) => {
      const boss = getCultivatorConfig(id);
      const hasNonCircleShape =
        boss.attackShape !== 'circle' || (boss.phases ?? []).some((p) => p.attackShape && p.attackShape !== 'circle');
      const hasAdds = (boss.phases ?? []).some((p) => (p.spawnAdds?.length ?? 0) > 0);
      return hasNonCircleShape || hasAdds;
    });
    expect(distinctive.length).toBeGreaterThanOrEqual(6);
  });

  it('every spawnAdds id references real, loadable enemy content', () => {
    const allIds = new Set(listCultivatorIds());
    for (const id of bossIds()) {
      const boss = getCultivatorConfig(id);
      for (const phase of boss.phases ?? []) {
        for (const add of phase.spawnAdds ?? []) {
          expect(allIds.has(add.id)).toBe(true);
          expect(() => getCultivatorConfig(add.id)).not.toThrow();
        }
      }
    }
  });

  it('bosses differ in attackShape, attackRange, and attackCooldownMs — not one-size-fits-all', () => {
    const shapes = new Set<string>();
    const ranges = new Set<number>();
    const cooldowns = new Set<number>();
    for (const id of bossIds()) {
      const boss = getCultivatorConfig(id);
      shapes.add(boss.attackShape);
      ranges.add(boss.attackRange);
      cooldowns.add(boss.attackCooldownMs);
    }
    expect(shapes.size).toBeGreaterThanOrEqual(3);
    expect(ranges.size).toBeGreaterThan(1);
    expect(cooldowns.size).toBeGreaterThan(1);
  });

  it('rift_horror keeps its existing rift.spawn adds', () => {
    const boss = getCultivatorConfig('boss.rift_horror');
    const allAdds = (boss.phases ?? []).flatMap((p) => p.spawnAdds ?? []);
    expect(allAdds.some((a) => a.id === 'enemy.rift.spawn')).toBe(true);
  });

  it('seal_warden and celestial_guardian keep their long attack ranges', () => {
    expect(getCultivatorConfig('boss.seal_warden').attackRange).toBe(180);
    expect(getCultivatorConfig('boss.celestial_guardian').attackRange).toBe(200);
  });

  it('mist_stalker raises attackRange toward a ranged 120+ threshold', () => {
    expect(getCultivatorConfig('boss.mist_stalker').attackRange).toBeGreaterThanOrEqual(120);
  });
});
