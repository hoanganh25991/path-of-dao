import { describe, expect, it } from 'vitest';
import {
  LEGACY_MAP_TILE_HEIGHT,
  LEGACY_MAP_TILE_WIDTH,
  STAR_ZONE_PIXEL_HEIGHT,
  STAR_ZONE_PIXEL_WIDTH,
  STAR_ZONE_TILE_HEIGHT,
  STAR_ZONE_TILE_WIDTH,
} from '@/combat/map/StarConstants';

describe('StarConstants', () => {
  it('defines star zone ~25× legacy tile footprint', () => {
    const legacyArea = LEGACY_MAP_TILE_WIDTH * LEGACY_MAP_TILE_HEIGHT;
    const zoneArea = STAR_ZONE_TILE_WIDTH * STAR_ZONE_TILE_HEIGHT;
    expect(zoneArea / legacyArea).toBeGreaterThanOrEqual(24);
  });

  it('pixel bounds match tile dimensions', () => {
    expect(STAR_ZONE_PIXEL_WIDTH).toBe(STAR_ZONE_TILE_WIDTH * 32);
    expect(STAR_ZONE_PIXEL_HEIGHT).toBe(STAR_ZONE_TILE_HEIGHT * 32);
  });
});
