import type Phaser from 'phaser';
import { TILE_LIST, TILE_SIZE, type BiomePalette, type TileDef, applyBiomeToTile, BIOME_PALETTES } from './TilesetTypes';
import { drawTile, resetTileSeed } from './TilesetDraw';

export { BIOME_PALETTES };

export const TILESET_KEY = 'tiles-grove';

let _currentBiome: BiomePalette = BIOME_PALETTES['village']!;

export function setTilesetBiome(biome: BiomePalette): void {
  _currentBiome = biome;
}

export function setTilesetBiomeByName(name: string): void {
  const biome = BIOME_PALETTES[name];
  if (biome) _currentBiome = biome;
}

export function getCurrentBiome(): BiomePalette {
  return _currentBiome;
}

function generateTilesetCanvas(): HTMLCanvasElement {
  const tileCount = TILE_LIST.length;
  const canvas = document.createElement('canvas');
  canvas.width = tileCount * TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext('2d')!;

  for (const def of TILE_LIST) {
    resetTileSeed(def.gid);
    const biomeDef = applyBiomeToTile(def, _currentBiome);
    ctx.save();
    ctx.translate((def.gid - 1) * TILE_SIZE, 0);
    drawTile(ctx, biomeDef);
    ctx.restore();
  }

  return canvas;
}

export function registerTileset(scene: Phaser.Scene): void {
  if (scene.textures.exists(TILESET_KEY)) {
    scene.textures.remove(TILESET_KEY);
  }
  const canvas = generateTilesetCanvas();
  scene.textures.addCanvas(TILESET_KEY, canvas);
  const texture = scene.textures.get(TILESET_KEY);
  for (let i = 0; i < TILE_LIST.length; i++) {
    texture.add(i, 0, i * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
  }
}

export function getTileDefs(): TileDef[] {
  return TILE_LIST.map((d) => applyBiomeToTile(d, _currentBiome));
}

export function getTilesetTileCount(): number {
  return TILE_LIST.length;
}