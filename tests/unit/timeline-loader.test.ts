import { describe, expect, it } from 'vitest';
import { I18nManager } from '@/core/i18n/I18nManager';
import {
  findTimelineShardByMapId,
  getTimelineShard,
  listTimelineShardIds,
  listTimelineShardsInRoadOrder,
} from '@/progression/TimelineLoader';
import { INTENT_LESSON_IDS } from '@/shared/schemas/timeline';
import { getMapConfig } from '@/combat/map/MapLoader';

describe('TimelineLoader', () => {
  it('loads all 20 shards', () => {
    const ids = listTimelineShardIds();
    expect(ids).toHaveLength(20);
  });

  it('every shard parses, has a unique mapId, and a valid intentLesson', () => {
    const ids = listTimelineShardIds();
    const mapIds = new Set<string>();

    for (const id of ids) {
      const shard = getTimelineShard(id);
      expect(shard.id).toBe(id);
      expect(INTENT_LESSON_IDS).toContain(shard.intentLesson);
      expect(shard.slides.length).toBeGreaterThanOrEqual(2);
      expect(mapIds.has(shard.mapId)).toBe(false);
      mapIds.add(shard.mapId);
    }

    expect(mapIds.size).toBe(20);
  });

  it('every shard mapId resolves to a map config declaring the same timelineShardId', () => {
    for (const id of listTimelineShardIds()) {
      const shard = getTimelineShard(id);
      const map = getMapConfig(shard.mapId);
      expect(map.timelineShardId).toBe(id);
    }
  });

  it('findTimelineShardByMapId resolves the fallen village shard', () => {
    const shard = findTimelineShardByMapId('map.fallen_village.01');
    expect(shard?.id).toBe('timeline.map.fallen_village.01');
    expect(shard?.intentLesson).toBe('life_death');
    expect(findTimelineShardByMapId('map.test.grove')).toBeNull();
  });

  it('lists shards in road order (fallen_village → void_throne)', () => {
    const shards = listTimelineShardsInRoadOrder();
    expect(shards).toHaveLength(20);
    expect(shards[0]!.mapId).toBe('map.fallen_village.01');
    expect(shards[1]!.mapId).toBe('map.fallen_village.02');
    expect(shards.at(-1)!.mapId).toBe('map.void_throne.02');
    expect(shards.at(-2)!.mapId).toBe('map.void_throne.01');
  });

  it('all locale keys resolve in en and vi', async () => {
    for (const locale of ['en', 'vi'] as const) {
      await I18nManager.load(locale);
      for (const id of listTimelineShardIds()) {
        const shard = getTimelineShard(id);
        for (const slide of shard.slides) {
          expect(I18nManager.t(slide.textKey)).not.toMatch(/^\[missing:/);
        }
        expect(I18nManager.t(shard.punchlineKey)).not.toMatch(/^\[missing:/);
        expect(I18nManager.t(shard.punchlineAttributionKey)).not.toMatch(/^\[missing:/);
        expect(I18nManager.t(`${shard.id}.title`)).not.toMatch(/^\[missing:/);
      }
    }
  });
});
