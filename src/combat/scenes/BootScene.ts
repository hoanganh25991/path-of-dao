import Phaser from 'phaser';
import { getMapConfig, resolveTiledUrl } from '@/combat/map/MapLoader';
import { createPlaceholderTextures } from '@/combat/textures/placeholderTextures';
import { registerStickyManAssets } from '@/combat/art/stickyManAssets';
import { registerPixelVfxAssets } from '@/combat/art/pixelVfxDraw';
import { setTilesetBiome, BIOME_PALETTES } from '@/combat/art/tileset/TilesetRegistry';
import { MapScene } from '@/combat/scenes/MapScene';

export const tilemapKey = (mapId: string): string => `tilemap:${mapId}`;

const CHAPTER_BIOME: Record<string, keyof typeof BIOME_PALETTES> = {
  'chapter.01.fallen_village': 'village',
  'chapter.02.mist_forest': 'mist',
  'chapter.03.stone_canyon': 'canyon',
  'chapter.04.moon_lake': 'lake',
  'chapter.05.burning_desert': 'desert',
  'chapter.06.thunder_peaks': 'storm',
  'chapter.07.frozen_palace': 'ice',
  'chapter.08.abyss_rift': 'void',
  'chapter.09.heavenly_gate': 'village',
  'chapter.10.void_throne': 'void',
};

export class BootScene extends Phaser.Scene {
  static readonly KEY = 'BootScene';

  private mapId = '';
  private spawnFromPortal?: string;

  constructor() {
    super(BootScene.KEY);
  }

  init(data: { mapId?: string; spawnFromPortal?: string }): void {
    this.mapId = data.mapId ?? (this.registry.get('mapId') as string);
    this.spawnFromPortal = data.spawnFromPortal;
    if (!this.mapId) {
      throw new Error('BootScene: no mapId provided (init data or registry)');
    }
  }

  preload(): void {
    const config = getMapConfig(this.mapId);
    const biomeKey = CHAPTER_BIOME[config.chapterId] ?? 'village';
    const biome = BIOME_PALETTES[biomeKey];
    if (biome) setTilesetBiome(biome);
    this.load.tilemapTiledJSON(tilemapKey(this.mapId), resolveTiledUrl(config));
  }

  create(): void {
    createPlaceholderTextures(this);
    registerPixelVfxAssets(this);
    registerStickyManAssets(this);
    this.scene.start(MapScene.KEY, { mapId: this.mapId, spawnFromPortal: this.spawnFromPortal });
  }
}