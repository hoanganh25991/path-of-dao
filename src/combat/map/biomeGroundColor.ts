import { BIOME_PALETTES } from '@/combat/art/tileset/TilesetRegistry';
import type { BiomePalette } from '@/combat/art/tileset/TilesetTypes';
import { DEFAULT_GROUND_PALETTE, type GroundPalette } from '@/combat/world/GroundPalette';

const CHAPTER_BIOME: Record<string, keyof typeof BIOME_PALETTES> = {
  'chapter.01.fallen_village': 'village',
  'chapter.02.mist_forest': 'mist',
  'chapter.03.stone_canyon': 'canyon',
  'chapter.04.moon_lake': 'lake',
  'chapter.05.burning_desert': 'desert',
  'chapter.06.thunder_peaks': 'storm',
  'chapter.07.frozen_palace': 'ice',
  'chapter.08.abyss_rift': 'void',
  'chapter.09.heavenly_gate': 'desert',
  'chapter.10.void_throne': 'void',
  'chapter.00.test': 'village',
};

function surfaceForFrame(frame: number, biome: BiomePalette): string {
  switch (frame) {
    case 0:
      return biome.grass.surface;
    case 1:
      return biome.grassAlt.surface;
    case 2:
      return biome.dirt.surface;
    case 3:
      return biome.sand.surface;
    case 4:
      return biome.waterShallow.surface;
    case 5:
      return biome.waterDeep.surface;
    case 13:
    case 14:
      return biome.rock.surface;
    case 15:
      return biome.gravel.surface;
    default:
      return biome.grass.surface;
  }
}

/** Camera / base-fill color matching the active biome and dominant ground tile. */
export function biomeGroundColor(chapterId: string, groundPalette?: GroundPalette): number {
  const key = CHAPTER_BIOME[chapterId] ?? 'village';
  const biome = BIOME_PALETTES[key] ?? BIOME_PALETTES.village!;
  const palette = groundPalette ?? DEFAULT_GROUND_PALETTE;
  const hex = surfaceForFrame(palette.primary, biome);
  return parseInt(hex.replace('#', ''), 16);
}
