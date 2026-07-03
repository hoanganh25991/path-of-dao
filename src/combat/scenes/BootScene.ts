import Phaser from 'phaser';
import { getMapConfig, resolveTiledUrl } from '@/combat/map/MapLoader';
import { createPlaceholderTextures } from '@/combat/textures/placeholderTextures';
import { registerStickyManAssets } from '@/combat/art/stickyManAssets';
import { registerPixelVfxAssets } from '@/combat/art/pixelVfxDraw';
import { MapScene } from '@/combat/scenes/MapScene';

export const tilemapKey = (mapId: string): string => `tilemap:${mapId}`;

/** Loads the Tiled map + placeholder art, then hands off to MapScene. */
export class BootScene extends Phaser.Scene {
  static readonly KEY = 'BootScene';

  private mapId = '';

  constructor() {
    super(BootScene.KEY);
  }

  init(data: { mapId?: string }): void {
    this.mapId = data.mapId ?? (this.registry.get('mapId') as string);
    if (!this.mapId) {
      throw new Error('BootScene: no mapId provided (init data or registry)');
    }
  }

  preload(): void {
    const config = getMapConfig(this.mapId);
    this.load.tilemapTiledJSON(tilemapKey(this.mapId), resolveTiledUrl(config));
  }

  create(): void {
    createPlaceholderTextures(this);
    registerPixelVfxAssets(this);
    registerStickyManAssets(this);
    this.scene.start(MapScene.KEY, { mapId: this.mapId });
  }
}
