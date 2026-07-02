import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getMapConfig, listMapIds, resolveTiledUrl } from '@/combat/map/MapLoader';

describe('MapLoader', () => {
  it('lists the bundled test map', () => {
    expect(listMapIds()).toContain('map.test.grove');
  });

  it('loads and validates map.test.grove', () => {
    const config = getMapConfig('map.test.grove');
    expect(config.id).toBe('map.test.grove');
    expect(config.spawn).toEqual({ x: 320, y: 480 });
    expect(config.bounds).toEqual({ width: 1600, height: 1216 });
  });

  it('throws with the mapId in the message for unknown maps', () => {
    expect(() => getMapConfig('map.does.not.exist')).toThrowError(/map\.does\.not\.exist/);
  });

  it('resolves a bundler URL for the tiled asset', () => {
    const config = getMapConfig('map.test.grove');
    expect(resolveTiledUrl(config)).toMatch(/test-grove/);
  });

  it('tiled JSON on disk matches the config dimensions and layers', () => {
    const config = getMapConfig('map.test.grove');
    const raw = JSON.parse(
      readFileSync(resolve(__dirname, '../../', config.tiledPath), 'utf-8'),
    ) as {
      width: number;
      height: number;
      tilewidth: number;
      tileheight: number;
      layers: { name: string; type: string }[];
    };

    expect(raw.width * raw.tilewidth).toBe(config.bounds.width);
    expect(raw.height * raw.tileheight).toBe(config.bounds.height);

    const layerNames = raw.layers.map((l) => l.name);
    for (const required of ['ground', 'decoration', 'collision', 'foreground', 'objects']) {
      expect(layerNames).toContain(required);
    }
  });
});
