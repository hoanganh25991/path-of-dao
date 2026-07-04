import { describe, expect, it } from 'vitest';
import { getMapConfig } from '@/combat/map/MapLoader';
import { resolvePortalSpawn } from '@/combat/map/portalSpawn';

describe('star zone map config', () => {
  it('fallen village entry is a roam star with portals', () => {
    const config = getMapConfig('map.fallen_village.01');
    expect(config.starId).toBe('star.fallen_village');
    expect(config.spawnMode).toBe('roam');
    expect(config.roamTable).toBe('roam.fallen_village.01');
    expect(config.portals.length).toBeGreaterThanOrEqual(2);
    expect(config.bounds.width).toBeGreaterThanOrEqual(8000);
    expect(config.bgm).toBe('bgm.combat.fallen_village');
  });

  it('east sub-zone links back to west entry', () => {
    const east = getMapConfig('map.fallen_village.01.east');
    const portal = east.portals.find((p) => p.id === 'portal.west');
    expect(portal?.targetMapId).toBe('map.fallen_village.01');
    expect(portal?.targetPortalId).toBe('portal.east');
  });

  it('resolvePortalSpawn returns configured coords', () => {
    const config = getMapConfig('map.fallen_village.01.east');
    const spawn = resolvePortalSpawn(config, 'portal.west');
    expect(spawn).toEqual(config.portalSpawns['portal.west']);
  });
});
