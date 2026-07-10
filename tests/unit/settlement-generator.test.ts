import { describe, expect, it } from 'vitest';
import {
  generateSettlementPlacements,
  generateSignatureTreePlacement,
} from '@/combat/world/ProceduralSettlementGenerator';
import { getWorldProfile } from '@/combat/world/ProceduralWorldLoader';

describe('ProceduralSettlementGenerator', () => {
  const authoredProfile = getWorldProfile('world.fallen_village');
  const defaultProfile = getWorldProfile('world.test');

  it('places at least one settlement cluster for an authored profile', () => {
    const placements = generateSettlementPlacements(12345, authoredProfile, 0, 0);
    expect(placements.length).toBeGreaterThanOrEqual(1);
    expect(placements[0]!.structures.length).toBeGreaterThanOrEqual(1);
  });

  it('places a settlement cluster even when the profile omits `settlements`', () => {
    expect(defaultProfile.settlements).toEqual([]);
    const placements = generateSettlementPlacements(12345, defaultProfile, 0, 0);
    expect(placements.length).toBeGreaterThanOrEqual(1);
  });

  it('places exactly one signature tree even when the profile omits `signatureTree`', () => {
    expect(defaultProfile.signatureTree).toBeNull();
    const tree = generateSignatureTreePlacement(12345, defaultProfile, 0, 0);
    expect(tree.propId.length).toBeGreaterThan(0);
    expect(Number.isFinite(tree.x)).toBe(true);
    expect(Number.isFinite(tree.y)).toBe(true);
  });

  it('is deterministic — identical settlement layout across two runs with the same seed', () => {
    const first = generateSettlementPlacements(777, authoredProfile, 1000, 2000);
    const second = generateSettlementPlacements(777, authoredProfile, 1000, 2000);
    expect(second).toEqual(first);
  });

  it('is deterministic — identical signature tree position across two runs with the same seed', () => {
    const first = generateSignatureTreePlacement(777, authoredProfile, 1000, 2000);
    const second = generateSignatureTreePlacement(777, authoredProfile, 1000, 2000);
    expect(second).toEqual(first);
  });

  it('varies with world seed (different maps get different settlement anchors)', () => {
    const a = generateSettlementPlacements(111, defaultProfile, 0, 0);
    const b = generateSettlementPlacements(222, defaultProfile, 0, 0);
    expect(a[0]!.center).not.toEqual(b[0]!.center);
  });

  it('keeps the settlement anchor away from the exact spawn origin', () => {
    const placements = generateSettlementPlacements(42, authoredProfile, 5000, 5000);
    for (const placement of placements) {
      const dist = Math.hypot(placement.center.x - 5000, placement.center.y - 5000);
      expect(dist).toBeGreaterThan(0);
    }
  });

  it('uses profile-declared type and structures for an authored settlement', () => {
    const [settlement] = generateSettlementPlacements(12345, authoredProfile, 0, 0);
    expect(settlement!.type).toBe('ruin_village');
    expect(settlement!.structures.map((s) => s.kind)).toEqual([
      'house_ruin',
      'house_ruin',
      'hut',
      'well',
      'shrine',
    ]);
  });

  it('uses the profile-declared signature tree propId when authored', () => {
    const tree = generateSignatureTreePlacement(12345, authoredProfile, 0, 0);
    expect(tree.propId).toBe('prop.tree.scorched_elm');
    expect(tree.displayNameKey).toBe('map.fallen_village.01.signature_tree');
  });
});
