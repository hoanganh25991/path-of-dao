import { describe, expect, it } from 'vitest';
import {
  ENCOUNTER_ZOOM,
  engagementBoostCap,
  resolveEncounterScale,
  scaleEncounterForPower,
  zoomForActiveEnemies,
} from '@/combat/systems/EncounterScaling';
import { getEncounterConfig } from '@/combat/cultivators/CultivatorLoader';

describe('resolveEncounterScale', () => {
  it('solo when player is below map realm', () => {
    const scale = resolveEncounterScale(1, 3, 5);
    expect(scale).toEqual({ tier: 'solo', targetCount: 6, maxAlive: 6 });
  });

  it('squad at parity without level boost', () => {
    const scale = resolveEncounterScale(3, 3, 8);
    expect(scale).toEqual({ tier: 'squad', targetCount: 12, maxAlive: 12 });
  });

  it('horde when slightly over map realm', () => {
    const scale = resolveEncounterScale(4, 3, 8);
    expect(scale).toEqual({ tier: 'horde', targetCount: 24, maxAlive: 18 });
  });

  it('mass when far over map realm or high level', () => {
    expect(resolveEncounterScale(6, 3, 8)).toEqual({
      tier: 'mass',
      targetCount: 48,
      maxAlive: 24,
    });
    expect(resolveEncounterScale(3, 3, 12)).toEqual({
      tier: 'horde',
      targetCount: 24,
      maxAlive: 18,
    });
  });
});

describe('scaleEncounterForPower', () => {
  it('scales first wave toward target count', () => {
    const base = getEncounterConfig('encounters.test');
    const scaled = scaleEncounterForPower(base, resolveEncounterScale(6, 1, 15));
    const total = scaled.waves[0]!.enemies.reduce((sum, g) => sum + g.count, 0);
    expect(total).toBe(48);
  });
});

describe('zoomForActiveEnemies', () => {
  it('maps live count to encounter zoom tiers', () => {
    expect(zoomForActiveEnemies(1)).toBe(ENCOUNTER_ZOOM.solo);
    expect(zoomForActiveEnemies(10)).toBe(ENCOUNTER_ZOOM.squad);
    expect(zoomForActiveEnemies(50)).toBe(ENCOUNTER_ZOOM.horde);
    expect(zoomForActiveEnemies(200)).toBe(ENCOUNTER_ZOOM.mass);
  });
});

describe('engagementBoostCap', () => {
  it('reduces punch-in as more cultivators fight', () => {
    expect(engagementBoostCap(1)).toBeGreaterThan(engagementBoostCap(12));
    expect(engagementBoostCap(200)).toBe(0);
  });
});
