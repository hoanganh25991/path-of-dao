import type Phaser from 'phaser';
import { VFX_TEXTURE_KEYS } from '@/combat/art/pixelVfxDraw';
import { registerTileset, TILESET_KEY, getTileDefs, getTilesetTileCount } from '@/combat/art/tileset/TilesetRegistry';

export const TEXTURE_KEYS = {
  tileset: TILESET_KEY,
  player: 'hero_sticky',
  slash: VFX_TEXTURE_KEYS.slash,
  bolt: VFX_TEXTURE_KEYS.bolt,
  arrow: VFX_TEXTURE_KEYS.arrow,
  coin: VFX_TEXTURE_KEYS.coin,
} as const;

export const ENEMY_TEXTURE_KEYS = ['enemy_slime', 'enemy_archer', 'enemy_totem'] as const;

export function createPlaceholderTextures(scene: Phaser.Scene): void {
  registerTileset(scene);
}

export { getTileDefs, getTilesetTileCount };