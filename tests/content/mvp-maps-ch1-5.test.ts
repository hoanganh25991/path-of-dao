import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getEnemyConfig } from '@/combat/cultivators/CultivatorLoader';
import { getMapConfig, resolveTiledUrl } from '@/combat/map/MapLoader';
import { validateAllContent } from '@/shared/content/validateAll';

const CH1_5_MAPS = [
  'map.fallen_village.01',
  'map.fallen_village.02',
  'map.mist_forest.01',
  'map.mist_forest.02',
  'map.stone_canyon.01',
  'map.stone_canyon.02',
  'map.moon_lake.01',
  'map.moon_lake.02',
  'map.burning_desert.01',
  'map.burning_desert.02',
];

const CH1_5_BOSSES = [
  'boss.jade_guardian',
  'boss.mist_stalker',
  'boss.bandit_lord',
  'boss.seal_warden',
  'boss.desert_sovereign',
];

describe('MVP maps chapters 1–5', () => {
  it('passes content validation', () => {
    const report = validateAllContent();
    expect(report.errors).toEqual([]);
  });

  for (const mapId of CH1_5_MAPS) {
    it(`loads ${mapId} with dedicated tiled asset`, () => {
      const config = getMapConfig(mapId);
      if (config.spawnMode === 'roam') {
        expect(config.roamTable).toMatch(/^roam\./);
        expect(config.encounterTable).toBeNull();
      } else {
        expect(config.encounterTable).toMatch(/^encounter\./);
      }
      expect(config.tiledPath).not.toContain('test-grove');
      expect(resolveTiledUrl(config)).toMatch(new RegExp(config.tiledPath.replace(/^.*\//, '')));

      const raw = JSON.parse(
        readFileSync(resolve(__dirname, '../../', config.tiledPath), 'utf-8'),
      ) as { width: number; height: number; tilewidth: number; tileheight: number };

      expect(raw.width * raw.tilewidth).toBe(config.bounds.width);
      expect(raw.height * raw.tileheight).toBe(config.bounds.height);
    });
  }

  it('assigns recommended CP bands per chapter', () => {
    expect(getMapConfig('map.fallen_village.01').recommendedCp).toBe(800);
    expect(getMapConfig('map.fallen_village.02').recommendedCp).toBe(1500);
    expect(getMapConfig('map.burning_desert.02').recommendedCp).toBe(35000);
  });

  it('places POIs on boss and cave maps', () => {
    const sword = getMapConfig('map.fallen_village.02').pois;
    expect(sword.some((p) => p.type === 'ancient_sword')).toBe(true);
    const ch2Sword = getMapConfig('map.mist_forest.02').pois;
    expect(ch2Sword.some((p) => p.type === 'ancient_sword')).toBe(true);
    expect(getMapConfig('map.stone_canyon.01').pois.some((p) => p.type === 'hidden_cave')).toBe(true);
  });

  for (const bossId of CH1_5_BOSSES) {
    it(`defines boss ${bossId} with bossClearId`, () => {
      const boss = getEnemyConfig(bossId);
      expect(boss.archetype).toBe('boss');
      expect(boss.bossClearId).toBe(bossId);
    });
  }
});
