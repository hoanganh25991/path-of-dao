import { describe, expect, it } from 'vitest';
import { pickThunderChainTargets } from '@/combat/skills/effects/runEffects';
import type { HurtboxEntity } from '@/combat/combat/Hurtbox';
import type { Player } from '@/combat/entities/Player';

function mockEnemy(id: string, x: number, y: number): HurtboxEntity {
  return {
    id,
    team: 'cultivator',
    x,
    y,
    hurtRadius: 20,
    invulnerable: false,
    sprite: { displayHeight: 48 } as HurtboxEntity['sprite'],
    receiveHit: () => {},
    getDefenderStats: () => ({
      level: 1,
      hpMax: 100,
      manaMax: 50,
      atk: 10,
      def: 5,
      crit: 0.05,
      critDmg: 1.5,
      speed: 100,
      spirit: 20,
    }),
  };
}

const playerFacingRight = { facing: 1, x: 100, y: 200 } as Player;

describe('pickThunderChainTargets', () => {
  it('chains nearest in-front foes within acquire and jump radius', () => {
    const enemies = [
      mockEnemy('a', 180, 200),
      mockEnemy('b', 260, 200),
      mockEnemy('c', 320, 200),
      mockEnemy('behind', 60, 200),
    ];
    const chain = pickThunderChainTargets(playerFacingRight, enemies, 300, 120, 3);
    expect(chain.map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });

  it('skips foes outside chain radius after first jump', () => {
    const enemies = [
      mockEnemy('near', 180, 200),
      mockEnemy('far', 400, 200),
    ];
    const chain = pickThunderChainTargets(playerFacingRight, enemies, 300, 100, 4);
    expect(chain.map((e) => e.id)).toEqual(['near']);
  });
});
