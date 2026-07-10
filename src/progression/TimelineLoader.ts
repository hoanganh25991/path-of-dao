import { timelineShardSchema, type TimelineShard } from '@/shared/schemas/timeline';
import { listWorldRegions } from '@/progression/WorldMapLoader';

const timelineModules = import.meta.glob('../../content/story-timeline/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const cache = new Map<string, TimelineShard>();

function fileIdFromPath(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.json$/, '');
}

export function listTimelineShardIds(): string[] {
  return Object.keys(timelineModules)
    .map(fileIdFromPath)
    .sort();
}

export function getTimelineShard(shardId: string): TimelineShard {
  const cached = cache.get(shardId);
  if (cached) return cached;

  const entry = Object.entries(timelineModules).find(([path]) => fileIdFromPath(path) === shardId);
  if (!entry) {
    throw new Error(`TimelineLoader: no timeline shard "${shardId}"`);
  }

  const parsed = timelineShardSchema.safeParse(entry[1]);
  if (!parsed.success) {
    throw new Error(`TimelineLoader: invalid timeline shard "${shardId}": ${parsed.error.message}`);
  }
  if (parsed.data.id !== shardId) {
    throw new Error(`TimelineLoader: shard "${shardId}" declares id "${parsed.data.id}"`);
  }

  cache.set(shardId, parsed.data);
  return parsed.data;
}

const byMapId = new Map<string, string>();
for (const shardId of listTimelineShardIds()) {
  byMapId.set(getTimelineShard(shardId).mapId, shardId);
}

export function findTimelineShardByMapId(mapId: string): TimelineShard | null {
  const shardId = byMapId.get(mapId);
  return shardId ? getTimelineShard(shardId) : null;
}

/**
 * All shards in road order (world map region + map order, matches plan 31 §5) —
 * this is the order the Dao Scroll list renders in, NOT filename/alpha order.
 */
export function listTimelineShardsInRoadOrder(): TimelineShard[] {
  const shards: TimelineShard[] = [];
  for (const region of listWorldRegions()) {
    for (const node of region.maps) {
      const shard = findTimelineShardByMapId(node.mapId);
      if (shard) shards.push(shard);
    }
  }
  return shards;
}
