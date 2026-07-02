import type Phaser from 'phaser';

/**
 * Runtime-generated placeholder art (sub-plan 06 §5: colored squares OK).
 * Replaced by real sprite sheets in the asset pipeline later.
 */

export const TEXTURE_KEYS = {
  tileset: 'tiles-grove',
  player: 'player-placeholder',
  slash: 'slash-placeholder',
  bolt: 'bolt-placeholder',
} as const;

const TILE = 32;

interface TileSpec {
  base: string;
  speckle?: string;
}

/** Order matches GIDs 1..8 in assets/maps/test-grove.json. */
const TILE_SPECS: TileSpec[] = [
  { base: '#2f5233', speckle: '#3a6340' }, // 1 grass
  { base: '#35603a', speckle: '#457a4c' }, // 2 grass variation
  { base: '#6b5433', speckle: '#7d6640' }, // 3 dirt
  { base: '#4a4a55', speckle: '#5c5c68' }, // 4 rock wall
  { base: '#1f3b24', speckle: '#2c5232' }, // 5 bush
  { base: '#503a28', speckle: '#5f4630' }, // 6 tree trunk
  { base: '#234d2a', speckle: '#2f6338' }, // 7 canopy (foreground)
  { base: '#1d3b57', speckle: '#2a527a' }, // 8 water
];

function speckle(
  ctx: CanvasRenderingContext2D,
  ox: number,
  color: string,
  seed: number,
): void {
  ctx.fillStyle = color;
  for (let i = 0; i < 12; i++) {
    const n = Math.sin(seed * 374761 + i * 668265) * 43758.5453;
    const fx = n - Math.floor(n);
    const n2 = Math.sin(seed * 951274 + i * 285377) * 24634.6345;
    const fy = n2 - Math.floor(n2);
    ctx.fillRect(ox + Math.floor(fx * (TILE - 3)) + 1, Math.floor(fy * (TILE - 3)) + 1, 2, 2);
  }
}

export function createPlaceholderTextures(scene: Phaser.Scene): void {
  const textures = scene.textures;

  if (!textures.exists(TEXTURE_KEYS.tileset)) {
    const canvas = textures.createCanvas(TEXTURE_KEYS.tileset, TILE * TILE_SPECS.length, TILE);
    if (canvas) {
      const ctx = canvas.getContext();
      TILE_SPECS.forEach((spec, i) => {
        const ox = i * TILE;
        ctx.fillStyle = spec.base;
        ctx.fillRect(ox, 0, TILE, TILE);
        if (spec.speckle) speckle(ctx, ox, spec.speckle, i + 1);
        // subtle tile edge so the grid reads during dev
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.strokeRect(ox + 0.5, 0.5, TILE - 1, TILE - 1);
      });
      canvas.refresh();
    }
  }

  if (!textures.exists(TEXTURE_KEYS.player)) {
    const w = 28;
    const h = 36;
    const canvas = textures.createCanvas(TEXTURE_KEYS.player, w, h);
    if (canvas) {
      const ctx = canvas.getContext();
      ctx.fillStyle = '#d9c78f';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#8f7b4a';
      ctx.fillRect(0, 0, w, 10); // "head" band to make facing/flip readable
      ctx.fillStyle = '#3b2f1b';
      ctx.fillRect(w - 8, 3, 4, 4); // eye marks the facing side (right)
      canvas.refresh();
    }
  }

  if (!textures.exists(TEXTURE_KEYS.slash)) {
    const size = 64;
    const canvas = textures.createCanvas(TEXTURE_KEYS.slash, size, size);
    if (canvas) {
      const ctx = canvas.getContext();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, size / 2, size / 2 - 6, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
      canvas.refresh();
    }
  }

  if (!textures.exists(TEXTURE_KEYS.bolt)) {
    const canvas = textures.createCanvas(TEXTURE_KEYS.bolt, 16, 8);
    if (canvas) {
      const ctx = canvas.getContext();
      ctx.fillStyle = '#7fd4ff';
      ctx.fillRect(0, 0, 16, 8);
      ctx.fillStyle = '#d8f2ff';
      ctx.fillRect(10, 2, 6, 4);
      canvas.refresh();
    }
  }
}
