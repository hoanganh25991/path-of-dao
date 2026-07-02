import { describe, expect, it } from 'vitest';
import { mapConfigSchema } from '@/combat/map/MapConfig';

const validConfig = {
  id: 'map.test.grove',
  chapterId: 'chapter.00.test',
  displayNameKey: 'map.test.grove.name',
  tiledPath: 'assets/maps/test-grove.json',
  tilesetName: 'grove',
  spawn: { x: 320, y: 480 },
  bounds: { width: 1600, height: 1216 },
  recommendedCp: 1000,
  connections: [],
  encounterTable: null,
  bgm: null,
};

describe('mapConfigSchema', () => {
  it('accepts a valid map config', () => {
    const result = mapConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('rejects a config missing spawn', () => {
    const { spawn: _spawn, ...withoutSpawn } = validConfig;
    const result = mapConfigSchema.safeParse(withoutSpawn);
    expect(result.success).toBe(false);
  });

  it('rejects non-positive bounds', () => {
    const result = mapConfigSchema.safeParse({
      ...validConfig,
      bounds: { width: 0, height: 1216 },
    });
    expect(result.success).toBe(false);
  });
});
