/**
 * @vitest-environment jsdom
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { I18nManager } from '@/core/i18n/I18nManager';
import { SaveManager } from '@/core/save/SaveManager';
import { listWorldRegions } from '@/progression/WorldMapLoader';
import { createRegionNode } from '@/ui/world/RegionNode';

beforeAll(async () => {
  await I18nManager.load('en');
});

function findRegion(mapId: string) {
  const region = listWorldRegions().find((r) => r.maps.some((m) => m.mapId === mapId));
  if (!region) throw new Error(`no region for ${mapId}`);
  return region;
}

/** Dao Scroll world map pin tooltip — punch-line if shard seen, "?" if locked (sub-plan 31 §6.4). */
describe('RegionNode timeline tooltip', () => {
  it('shows "?" when the shard has not been read yet', () => {
    const region = findRegion('map.fallen_village.01');
    const save = SaveManager.createNew();

    const root = createRegionNode({ region, save, onSelectMap: () => {} });
    const pin = root.querySelector<HTMLButtonElement>('[data-map-id="map.fallen_village.01"]');

    expect(pin?.title).toBe('?');
    expect(pin?.dataset.timelineTooltip).toBe('?');
  });

  it('shows the punch-line one-liner once the shard is in timelineSeen', () => {
    const region = findRegion('map.fallen_village.01');
    const save = SaveManager.createNew();
    save.progress = {
      ...save.progress,
      timelineSeen: ['timeline.map.fallen_village.01'],
    };

    const root = createRegionNode({ region, save, onSelectMap: () => {} });
    const pin = root.querySelector<HTMLButtonElement>('[data-map-id="map.fallen_village.01"]');

    const expected = I18nManager.t('timeline.ch01.map01.punchline');
    expect(expected).not.toMatch(/^\[missing:/);
    expect(pin?.title).toBe(expected);
  });

  it('falls back to the map label when there is no timeline shard for the map', () => {
    const region = findRegion('map.fallen_village.01');
    const withoutShard = {
      ...region,
      maps: [{ ...region.maps[0]!, mapId: 'map.test.grove' }],
    };
    const save = SaveManager.createNew();

    const root = createRegionNode({ region: withoutShard, save, onSelectMap: () => {} });
    const pin = root.querySelector<HTMLButtonElement>('[data-map-id="map.test.grove"]');

    expect(pin?.dataset.timelineTooltip).toBeUndefined();
    expect(pin?.title).toBe(I18nManager.t('map.test.grove.name'));
  });
});
