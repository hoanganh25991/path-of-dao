import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getEnemyConfig } from '@/combat/enemies/EnemyLoader';
import { getMapConfig, resolveTiledUrl } from '@/combat/map/MapLoader';
import { validateAllContent } from '@/shared/content/validateAll';

const CH6_10_MAPS = [
  'map.thunder_peaks.01',
  'map.thunder_peaks.02',
  'map.frozen_palace.01',
  'map.frozen_palace.02',
  'map.abyss_rift.01',
  'map.abyss_rift.02',
  'map.heavenly_gate.01',
  'map.heavenly_gate.02',
  'map.void_throne.01',
  'map.void_throne.02',
];

const CH6_10_BOSSES = [
  'boss.thunder_avatar',
  'boss.frost_queen',
  'boss.rift_horror',
  'boss.celestial_guardian',
  'boss.void_sovereign',
];

describe('MVP maps chapters 6–10', () => {
  it('passes content validation', () => {
    const report = validateAllContent();
    expect(report.errors).toEqual([]);
  });

  for (const mapId of CH6_10_MAPS) {
    it(`loads ${mapId} with dedicated tiled asset`, () => {
      const config = getMapConfig(mapId);
      expect(config.encounterTable).toMatch(/^encounter\./);
      expect(config.tiledPath).not.toContain('test-grove');
      expect(resolveTiledUrl(config)).toMatch(new RegExp(config.tiledPath.replace(/^.*\//, '')));

      const raw = JSON.parse(
        readFileSync(resolve(__dirname, '../../', config.tiledPath), 'utf-8'),
      ) as { width: number; height: number; tilewidth: number; tileheight: number };

      expect(raw.width * raw.tilewidth).toBe(config.bounds.width);
      expect(raw.height * raw.tileheight).toBe(config.bounds.height);
    });
  }

  it('assigns endgame recommended CP bands', () => {
    expect(getMapConfig('map.thunder_peaks.01').recommendedCp).toBe(45000);
    expect(getMapConfig('map.void_throne.02').recommendedCp).toBe(320000);
  });

  it('uses larger bounds for void throne finale', () => {
    const finale = getMapConfig('map.void_throne.02');
    expect(finale.bounds.width).toBeGreaterThan(1600);
  });

  for (const bossId of CH6_10_BOSSES) {
    it(`defines boss ${bossId} with bossClearId`, () => {
      const boss = getEnemyConfig(bossId);
      expect(boss.archetype).toBe('boss');
      expect(boss.bossClearId).toBe(bossId);
    });
  }
});
