import Phaser from 'phaser';
import { TEXTURE_KEYS } from '@/combat/textures/placeholderTextures';
import type { GroundPalette } from '@/combat/world/GroundPalette';
import { generateGroundTileFrame } from '@/combat/world/GroundTerrain';

const TILE_PX = 32;
const CHUNK_TILES = 16;
const CHUNK_PX = TILE_PX * CHUNK_TILES;
const LOAD_RADIUS = 4;
const UNLOAD_RADIUS = 6;
const CHUNKS_PER_FRAME = 2;

interface ChunkRecord {
  layer: Phaser.Tilemaps.TilemapLayer;
  map: Phaser.Tilemaps.Tilemap;
}

/**
 * Streams ground via lightweight tilemap chunks (not per-tile sprites).
 * A solid biome base fill prevents black gaps while chunks load.
 */
export class EndlessGroundManager {
  private readonly chunks = new Map<string, ChunkRecord>();
  private readonly pending: { chunkX: number; chunkY: number; key: string }[] = [];
  private readonly pendingKeys = new Set<string>();
  private baseFill: Phaser.GameObjects.Rectangle | null = null;
  private lastQueueCx = Number.NaN;
  private lastQueueCy = Number.NaN;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly worldSeed: number,
    private readonly groundPalette: GroundPalette,
    private readonly tilesetName: string,
    private readonly baseColor: number,
    private readonly depth = 0,
  ) {}

  /** Solid underlay + preload chunks around spawn before the first frame. */
  warmStart(centerX: number, centerY: number, radius = 3): void {
    this.ensureBaseFill(centerX, centerY);
    this.queueChunksAround(
      Math.floor(centerX / CHUNK_PX),
      Math.floor(centerY / CHUNK_PX),
      radius,
    );
    while (this.pending.length > 0) {
      this.drainPending(CHUNKS_PER_FRAME * 4);
    }
  }

  update(playerX: number, playerY: number, velX = 0, velY = 0): void {
    const cx = Math.floor(playerX / CHUNK_PX);
    const cy = Math.floor(playerY / CHUNK_PX);

    this.queueChunksAround(cx, cy, LOAD_RADIUS);

    if (Math.abs(velX) > 80 || Math.abs(velY) > 80) {
      const aheadX = playerX + Math.sign(velX || 1) * CHUNK_PX * 2;
      const aheadY = playerY + Math.sign(velY || 1) * CHUNK_PX * 2;
      this.queueChunksAround(Math.floor(aheadX / CHUNK_PX), Math.floor(aheadY / CHUNK_PX), 2);
    }

    if (cx !== this.lastQueueCx || cy !== this.lastQueueCy) {
      this.lastQueueCx = cx;
      this.lastQueueCy = cy;
      this.unloadDistant(cx, cy);
    }

    const speed = Math.hypot(velX, velY);
    const budget = speed > 280 ? CHUNKS_PER_FRAME * 3 : CHUNKS_PER_FRAME;
    this.drainPending(budget);
  }

  destroy(): void {
    for (const record of this.chunks.values()) {
      record.layer.destroy();
      record.map.destroy();
    }
    this.chunks.clear();
    this.pending.length = 0;
    this.pendingKeys.clear();
    this.baseFill?.destroy();
    this.baseFill = null;
  }

  private ensureBaseFill(centerX: number, centerY: number): void {
    if (this.baseFill) return;
    const extent = 600_000;
    this.baseFill = this.scene.add
      .rectangle(centerX, centerY, extent, extent, this.baseColor, 1)
      .setDepth(this.depth - 1);
  }

  private queueChunksAround(cx: number, cy: number, radius: number): void {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        this.enqueueChunk(cx + dx, cy + dy);
      }
    }
  }

  private enqueueChunk(chunkX: number, chunkY: number): void {
    const key = `${chunkX},${chunkY}`;
    if (this.chunks.has(key) || this.pendingKeys.has(key)) return;
    this.pendingKeys.add(key);
    this.pending.push({ chunkX, chunkY, key });
  }

  private drainPending(max: number): void {
    let built = 0;
    while (built < max && this.pending.length > 0) {
      const next = this.pending.shift();
      if (!next) break;
      this.pendingKeys.delete(next.key);
      if (this.chunks.has(next.key)) continue;
      this.buildChunk(next.chunkX, next.chunkY, next.key);
      built++;
    }
  }

  private unloadDistant(cx: number, cy: number): void {
    for (const [key, record] of [...this.chunks.entries()]) {
      const [sx, sy] = key.split(',').map(Number);
      if (Math.abs(sx - cx) > UNLOAD_RADIUS || Math.abs(sy - cy) > UNLOAD_RADIUS) {
        record.layer.destroy();
        record.map.destroy();
        this.chunks.delete(key);
      }
    }
  }

  private buildChunk(chunkX: number, chunkY: number, key: string): void {
    const map = this.scene.make.tilemap({
      tileWidth: TILE_PX,
      tileHeight: TILE_PX,
      width: CHUNK_TILES,
      height: CHUNK_TILES,
    });
    const tileset = map.addTilesetImage(this.tilesetName, TEXTURE_KEYS.tileset, TILE_PX, TILE_PX);
    if (!tileset) {
      map.destroy();
      return;
    }

    const layer = map.createBlankLayer(`ground-${key}`, tileset, 0, 0, CHUNK_TILES, CHUNK_TILES);
    if (!layer) {
      map.destroy();
      return;
    }

    const originX = chunkX * CHUNK_PX;
    const originY = chunkY * CHUNK_PX;
    const rows: number[][] = [];

    for (let ty = 0; ty < CHUNK_TILES; ty++) {
      const row: number[] = [];
      for (let tx = 0; tx < CHUNK_TILES; tx++) {
        const worldTileX = chunkX * CHUNK_TILES + tx;
        const worldTileY = chunkY * CHUNK_TILES + ty;
        const frame = generateGroundTileFrame(this.worldSeed, worldTileX, worldTileY, this.groundPalette);
        row.push(frame + 1);
      }
      rows.push(row);
    }

    layer.putTilesAt(rows, 0, 0);
    layer.setPosition(originX, originY);
    layer.setDepth(this.depth);
    this.chunks.set(key, { layer, map });
  }
}
