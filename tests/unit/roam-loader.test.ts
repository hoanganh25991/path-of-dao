import { describe, expect, it } from 'vitest';
import { getRoamConfig, listRoamIds } from '@/combat/map/RoamLoader';
import { roamConfigSchema } from '@/combat/map/RoamConfig';

describe('roamConfigSchema', () => {
  it('accepts a valid roam table', () => {
    const result = roamConfigSchema.safeParse({
      id: 'roam.test',
      spawns: [{ enemyId: 'enemy.slime', x: 100, y: 200, respawnMs: 12000, patrolRadius: 64 }],
    });
    expect(result.success).toBe(true);
  });
});

describe('RoamLoader', () => {
  it('loads fallen village west roam table', () => {
    expect(listRoamIds()).toContain('roam.fallen_village.01');
    const roam = getRoamConfig('roam.fallen_village.01');
    expect(roam.spawns.length).toBeGreaterThanOrEqual(4);
    expect(roam.spawns[0]?.enemyId).toBeTruthy();
  });

  it('loads east sub-zone roam spawns', () => {
    const roam = getRoamConfig('roam.fallen_village.01.east');
    expect(roam.spawns.some((s) => (s.enemyId ? s.enemyId === 'enemy.bandit.thug' : s.enemyPool?.includes('enemy.bandit.thug')))).toBe(true);
  });
});
