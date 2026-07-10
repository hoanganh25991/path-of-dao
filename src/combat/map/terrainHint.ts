import type { GroundPalette } from '@/combat/world/GroundPalette';

const TERRAIN_LABELS: Record<number, string> = {
  0: 'Grass',
  1: 'Grass alt',
  2: 'Dirt',
  3: 'Sand',
  4: 'Shallow water',
  5: 'Deep water',
  13: 'Rock',
  14: 'Cliff',
  15: 'Gravel',
};

export function terrainHintForPalette(palette: GroundPalette): string {
  return TERRAIN_LABELS[palette.primary] ?? `Tile ${palette.primary}`;
}
