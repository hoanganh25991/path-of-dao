import { type TileDef, TILE_SIZE, SURFACE_H } from './TilesetTypes';

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.replace('#', ''), 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}

function rgbStr(r: number, g: number, b: number, a = 1): string {
  return `rgba(${r},${g},${b},${a})`;
}

function fillRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function pixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function hLine(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x1, y, x2 - x1, 1);
}

function seededRandom(seed: number): number {
  let s = seed;
  s = (s * 16807 + 0) % 2147483647;
  return (s - 1) / 2147483646;
}

let globalSeed = 0;
function nextSeed(): number {
  globalSeed = (globalSeed * 16807 + 1) % 2147483647;
  return globalSeed;
}

/** Full-tile seamless surface (no 2.5D edge) for ground tiles. */
function drawSeamlessSurface(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fillRect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, def.surface);

  for (let i = 0; i < 35; i++) {
    const sx = Math.floor(seededRandom(nextSeed()) * TILE_SIZE);
    const sy = Math.floor(seededRandom(nextSeed()) * TILE_SIZE);
    pixel(ctx, sx, sy, def.speckle);
  }

  const hl = def.highlight as string;
  for (let i = 0; i < 10; i++) {
    const hx = Math.floor(seededRandom(nextSeed()) * TILE_SIZE);
    const hy = Math.floor(seededRandom(nextSeed()) * 8);
    pixel(ctx, hx, hy, hl);
  }

  const sd = def.shadow as string;
  for (let i = 0; i < 8; i++) {
    const dx = Math.floor(seededRandom(nextSeed()) * TILE_SIZE);
    const dy = TILE_SIZE - 6 + Math.floor(seededRandom(nextSeed()) * 5);
    pixel(ctx, dx, dy, sd);
  }
}

/** 2.5D surface area on top portion of tile (for structures). */
function drawSurfaceArea(ctx: CanvasRenderingContext2D, def: TileDef, yStart: number, yEnd: number): void {
  fillRect(ctx, 0, yStart, TILE_SIZE, yEnd - yStart, def.surface);

  for (let i = 0; i < 28; i++) {
    const sx = Math.floor(seededRandom(nextSeed()) * TILE_SIZE);
    const sy = yStart + Math.floor(seededRandom(nextSeed()) * (yEnd - yStart));
    pixel(ctx, sx, sy, def.speckle);
  }

  const hl = def.highlight as string;
  for (let i = 0; i < 8; i++) {
    const hx = Math.floor(seededRandom(nextSeed()) * TILE_SIZE);
    const hy = yStart + Math.floor(seededRandom(nextSeed()) * 6);
    pixel(ctx, hx, hy, hl);
  }
  hLine(ctx, 0, TILE_SIZE, yStart, hl);
}

/** 2.5D front-face edge band below the surface (for structures). */
function drawFrontFace(ctx: CanvasRenderingContext2D, def: TileDef, yStart: number): void {
  fillRect(ctx, 0, yStart, TILE_SIZE, TILE_SIZE - yStart, def.edge);

  const sd = def.shadow as string;
  hLine(ctx, 0, TILE_SIZE, yStart, sd);

  for (let i = 0; i < 6; i++) {
    const ex = Math.floor(seededRandom(nextSeed()) * TILE_SIZE);
    const ey = yStart + 2 + Math.floor(seededRandom(nextSeed()) * (TILE_SIZE - yStart - 4));
    pixel(ctx, ex, ey, sd);
  }
}

// ── Seamless ground tiles (full 32x32, no 2.5D edge) ──

function drawGrass(ctx: CanvasRenderingContext2D, def: TileDef): void {
  drawSeamlessSurface(ctx, def);
}

function drawGrassAlt(ctx: CanvasRenderingContext2D, def: TileDef): void {
  drawSeamlessSurface(ctx, def);
  for (let t = 0; t < 4; t++) {
    const tx = 4 + Math.floor(seededRandom(nextSeed()) * 28);
    const th = 3 + Math.floor(seededRandom(nextSeed()) * 4);
    const hl = def.highlight as string;
    pixel(ctx, tx - 1, TILE_SIZE - th, hl);
    pixel(ctx, tx, TILE_SIZE - th - 1, hl);
    pixel(ctx, tx + 1, TILE_SIZE - th, hl);
  }
}

function drawDirt(ctx: CanvasRenderingContext2D, def: TileDef): void {
  drawSeamlessSurface(ctx, def);
  const edgeC = def.shadow as string;
  for (let i = 0; i < 12; i++) {
    const dx = Math.floor(seededRandom(nextSeed()) * TILE_SIZE);
    const dy = TILE_SIZE - 2 + Math.floor(seededRandom(nextSeed()) * 3);
    pixel(ctx, dx, dy, edgeC);
  }
}

function drawSand(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fillRect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, def.surface);
  for (let i = 0; i < 40; i++) {
    const sx = Math.floor(seededRandom(nextSeed()) * TILE_SIZE);
    const sy = Math.floor(seededRandom(nextSeed()) * TILE_SIZE);
    const shade = seededRandom(nextSeed()) > 0.5 ? def.speckle : def.detail;
    pixel(ctx, sx, sy, shade);
  }
  const hl = def.highlight as string;
  for (let i = 0; i < 6; i++) {
    const hx = Math.floor(seededRandom(nextSeed()) * TILE_SIZE);
    const hy = Math.floor(seededRandom(nextSeed()) * 4);
    pixel(ctx, hx, hy, hl);
  }
}

function drawGravel(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fillRect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, def.detail);
  for (let i = 0; i < 30; i++) {
    const gx = Math.floor(seededRandom(nextSeed()) * TILE_SIZE);
    const gy = Math.floor(seededRandom(nextSeed()) * TILE_SIZE);
    const sz = 1 + Math.floor(seededRandom(nextSeed()) * 2);
    fillRect(ctx, gx, gy, sz, sz, def.surface);
  }
  for (let i = 0; i < 15; i++) {
    const gx = Math.floor(seededRandom(nextSeed()) * TILE_SIZE);
    const gy = Math.floor(seededRandom(nextSeed()) * TILE_SIZE);
    pixel(ctx, gx, gy, def.highlight as string);
  }
}

function drawCobblestone(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fillRect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, def.surface);
  const stones = [
    { x: 2, y: 2, w: 8, h: 6 }, { x: 12, y: 1, w: 7, h: 5 },
    { x: 22, y: 3, w: 8, h: 5 }, { x: 4, y: 10, w: 6, h: 5 },
    { x: 15, y: 8, w: 9, h: 6 }, { x: 5, y: 17, w: 7, h: 5 },
    { x: 18, y: 16, w: 8, h: 5 }, { x: 3, y: 24, w: 6, h: 5 },
    { x: 14, y: 23, w: 10, h: 5 }, { x: 23, y: 25, w: 7, h: 4 },
  ];
  const hl = def.highlight as string;
  for (const s of stones) {
    fillRect(ctx, s.x, s.y, s.w, s.h, def.detail);
    hLine(ctx, s.x, s.x + s.w, s.y, hl);
    pixel(ctx, s.x + s.w - 1, s.y + s.h - 1, def.shadow as string);
  }
}

function drawPath(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fillRect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, def.surface);
  for (let i = 0; i < 20; i++) {
    const px = 2 + Math.floor(seededRandom(nextSeed()) * 28);
    const py = 2 + Math.floor(seededRandom(nextSeed()) * 28);
    pixel(ctx, px, py, def.highlight as string);
    pixel(ctx, px + 1, py + 1, def.shadow as string);
  }
}

// ── Seamless water tiles ──

function drawShallowWater(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fillRect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, def.surface);
  const hl = def.highlight as string;
  for (let row = 3; row < TILE_SIZE - 2; row += 6) {
    ctx.fillStyle = rgbStr(...hexToRgb(hl), 0.2);
    const offset = Math.floor(seededRandom(nextSeed()) * 6);
    const len = 14 + Math.floor(seededRandom(nextSeed()) * 12);
    ctx.fillRect(4 + offset, row, len, 1);
  }
  for (let i = 0; i < 14; i++) {
    const wx = Math.floor(seededRandom(nextSeed()) * TILE_SIZE);
    const wy = 2 + Math.floor(seededRandom(nextSeed()) * (TILE_SIZE - 4));
    pixel(ctx, wx, wy, def.speckle);
  }
}

function drawDeepWater(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fillRect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, def.surface);
  const hl = def.highlight as string;
  for (let row = 4; row < TILE_SIZE - 3; row += 7) {
    ctx.fillStyle = rgbStr(...hexToRgb(hl), 0.12);
    const offset = Math.floor(seededRandom(nextSeed()) * 4);
    const len = 10 + Math.floor(seededRandom(nextSeed()) * 8);
    ctx.fillRect(6 + offset, row, len, 1);
  }
  for (let i = 0; i < 10; i++) {
    const wx = Math.floor(seededRandom(nextSeed()) * TILE_SIZE);
    const wy = 3 + Math.floor(seededRandom(nextSeed()) * (TILE_SIZE - 6));
    pixel(ctx, wx, wy, def.speckle);
  }
}

function drawWaterEdgeN(ctx: CanvasRenderingContext2D, def: TileDef): void {
  drawShallowWater(ctx, def);
  const edge = '#2d5a26';
  for (let x = 0; x < TILE_SIZE; x++) {
    const wave = Math.sin(x * 0.4) * 2;
    const ey = Math.max(0, SURFACE_H - 4 + wave);
    pixel(ctx, x, Math.floor(ey), edge);
    pixel(ctx, x, Math.floor(ey) + 1, edge);
  }
}

function drawWaterEdgeW(ctx: CanvasRenderingContext2D, def: TileDef): void {
  drawShallowWater(ctx, def);
  const edge = '#2d5a26';
  for (let y = 3; y < SURFACE_H + 4; y++) {
    const wave = Math.sin(y * 0.5) * 2;
    const ex = Math.max(0, 6 + wave);
    pixel(ctx, Math.floor(ex), y, edge);
    pixel(ctx, Math.floor(ex) + 1, y, '#5ea852');
  }
}

// ── Structure tiles with 2.5D depth edge ──

function drawBush(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fillRect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, 'transparent');
  const cx = 16, cy = SURFACE_H - 4;
  for (let r = 12; r >= 4; r -= 2) {
    const shade = r % 4 === 0 ? def.detail : r % 4 === 2 ? (def.highlight as string) : def.surface;
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(cx, cy - 2, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let r = 10; r >= 4; r -= 2) {
    const shade = r % 4 === 0 ? def.detail : def.surface;
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(cx - 6, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 6, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  drawFrontFace(ctx, def, SURFACE_H + 2);
}

function drawTallGrass(ctx: CanvasRenderingContext2D, def: TileDef): void {
  drawSeamlessSurface(ctx, def);
  for (let i = 0; i < 8; i++) {
    const gx = 2 + Math.floor(seededRandom(nextSeed()) * 28);
    const gh = 4 + Math.floor(seededRandom(nextSeed()) * 10);
    const colors = [def.highlight as string, def.speckle, def.detail];
    const gc = colors[i % 3] as string;
    pixel(ctx, gx, TILE_SIZE - gh, gc);
    pixel(ctx, gx, TILE_SIZE - gh + 1, gc);
    pixel(ctx, gx - 1, TILE_SIZE - gh + 2, gc);
    if (gh > 7) pixel(ctx, gx + 1, TILE_SIZE - gh + 3, gc);
  }
}

function drawTreeTrunk(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fillRect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, 'transparent');
  fillRect(ctx, 11, 0, 10, TILE_SIZE, def.surface);
  fillRect(ctx, 11, 0, 10, TILE_SIZE - 4, def.highlight as string);
  fillRect(ctx, 11, TILE_SIZE - 4, 10, 4, def.edge);
  hLine(ctx, 11, 21, SURFACE_H, def.detail);
  for (let y = 3; y < TILE_SIZE - 6; y += 6) {
    const bx = 12 + Math.floor(seededRandom(nextSeed()) * 6);
    hLine(ctx, bx, bx + 2, y, def.shadow as string);
  }
}

function drawCanopy(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fillRect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, 'transparent');
  const clusters = [
    { x: 16, y: SURFACE_H - 6, r: 10 },
    { x: 8, y: SURFACE_H - 2, r: 8 },
    { x: 24, y: SURFACE_H - 2, r: 8 },
    { x: 4, y: SURFACE_H + 4, r: 6 },
    { x: 28, y: SURFACE_H + 4, r: 6 },
    { x: 16, y: SURFACE_H + 5, r: 7 },
  ];
  for (const c of clusters) {
    ctx.fillStyle = (def.shadow as string);
    ctx.beginPath();
    ctx.arc(c.x + 1, c.y + 1, c.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = def.surface;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = (def.highlight as string);
    ctx.beginPath();
    ctx.arc(c.x - 2, c.y - 2, c.r * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFlower(ctx: CanvasRenderingContext2D, def: TileDef): void {
  drawSeamlessSurface(ctx, def);
  const stemX = 16;
  for (let y = TILE_SIZE - 2; y >= 8; y--) {
    pixel(ctx, stemX, y, '#3a7030');
  }
  const petalColors = [def.detail, def.highlight as string, def.detail, def.highlight as string];
  for (let p = 0; p < 4; p++) {
    const angle = (p * Math.PI) / 2;
    const px = Math.round(stemX + Math.cos(angle) * 3);
    const py = Math.round(8 + Math.sin(angle) * 3);
    pixel(ctx, px, py, petalColors[p] as string);
  }
  pixel(ctx, stemX, 8, '#ffe880');
}

function drawRock(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fillRect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, 'transparent');
  fillRect(ctx, 6, SURFACE_H - 12, 20, 16, def.surface);
  fillRect(ctx, 6, SURFACE_H - 12, 20, 4, def.highlight as string);
  fillRect(ctx, 6, SURFACE_H - 8, 20, 3, def.detail);
  fillRect(ctx, 6, SURFACE_H + 4, 20, 8, def.edge);
  hLine(ctx, 6, 26, SURFACE_H + 4, def.shadow as string);
  for (let i = 0; i < 5; i++) {
    const cx = 8 + Math.floor(seededRandom(nextSeed()) * 16);
    const cy = SURFACE_H - 10 + Math.floor(seededRandom(nextSeed()) * 8);
    pixel(ctx, cx, cy, def.speckle);
    pixel(ctx, cx + 1, cy, def.shadow as string);
  }
}

function drawCliff(ctx: CanvasRenderingContext2D, def: TileDef): void {
  drawSurfaceArea(ctx, def, 0, SURFACE_H - 4);
  fillRect(ctx, 0, SURFACE_H - 4, TILE_SIZE, TILE_SIZE - (SURFACE_H - 4), def.edge);
  for (let row = SURFACE_H - 2; row < TILE_SIZE - 3; row += 4) {
    hLine(ctx, 2, TILE_SIZE - 2, row, def.shadow as string);
  }
  for (let i = 0; i < 10; i++) {
    const rx = Math.floor(seededRandom(nextSeed()) * TILE_SIZE);
    const ry = SURFACE_H - 2 + Math.floor(seededRandom(nextSeed()) * (TILE_SIZE - SURFACE_H));
    pixel(ctx, rx, ry, def.speckle);
  }
  hLine(ctx, 0, TILE_SIZE, SURFACE_H - 4, '#000000');
}

function drawCave(ctx: CanvasRenderingContext2D, def: TileDef): void {
  drawSurfaceArea(ctx, def, 0, SURFACE_H + 2);
  fillRect(ctx, 8, 6, 16, 18, '#000000');
  fillRect(ctx, 6, 4, 20, 3, def.highlight as string);
  fillRect(ctx, 6, 24, 20, 3, def.shadow as string);
  fillRect(ctx, 6, 7, 2, 17, def.highlight as string);
  fillRect(ctx, 24, 7, 2, 17, def.highlight as string);
  drawFrontFace(ctx, def, SURFACE_H + 4);
}

function drawWoodFence(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fillRect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, 'transparent');
  fillRect(ctx, 2, SURFACE_H - 8, 28, 5, def.surface);
  fillRect(ctx, 2, SURFACE_H - 3, 28, 5, def.surface);
  hLine(ctx, 2, 30, SURFACE_H - 3, def.highlight as string);
  hLine(ctx, 2, 30, SURFACE_H - 8, def.highlight as string);
  fillRect(ctx, 12, SURFACE_H - 8, 8, TILE_SIZE - (SURFACE_H - 8), def.edge);
  fillRect(ctx, 12, SURFACE_H - 8, 8, TILE_SIZE - (SURFACE_H - 8) - 2, def.detail);
}

function drawStoneWall(ctx: CanvasRenderingContext2D, def: TileDef): void {
  const brickH = 6, brickW = 10;
  for (let row = 0; row < 6; row++) {
    const y = row * brickH;
    const offset = row % 2 === 1 ? 5 : 0;
    for (let col = -1; col < 4; col++) {
      const x = col * brickW + offset;
      fillRect(ctx, x, y, brickW - 1, brickH - 1, def.surface);
      fillRect(ctx, x, y, brickW - 1, 2, def.highlight as string);
      pixel(ctx, x + brickW - 2, y + brickH - 2, def.shadow as string);
    }
  }
}

function drawRoof(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fillRect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, 'transparent');
  for (let row = 0; row < 6; row++) {
    const y = row * 4 + 4;
    fillRect(ctx, 0, y, TILE_SIZE, 4, def.surface);
    hLine(ctx, 0, TILE_SIZE, y, def.highlight as string);
    hLine(ctx, 0, TILE_SIZE, y + 3, def.shadow as string);
  }
  fillRect(ctx, 0, 24, TILE_SIZE, 8, def.edge);
}

function drawBridge(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fillRect(ctx, 0, 0, TILE_SIZE, TILE_SIZE, 'transparent');
  fillRect(ctx, 2, SURFACE_H - 6, 28, 4, def.surface);
  fillRect(ctx, 2, SURFACE_H - 2, 28, 4, def.surface);
  hLine(ctx, 2, 30, SURFACE_H - 2, def.highlight as string);
  fillRect(ctx, 0, SURFACE_H - 8, 4, 10, def.edge);
  fillRect(ctx, 28, SURFACE_H - 8, 4, 10, def.edge);
  fillRect(ctx, 14, SURFACE_H - 10, 4, 12, def.detail);
}

function drawShadow(ctx: CanvasRenderingContext2D, _def: TileDef): void {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
}

function drawLantern(ctx: CanvasRenderingContext2D, def: TileDef): void {
  drawSeamlessSurface(ctx, def);
  fillRect(ctx, 14, SURFACE_H - 18, 4, 18, '#584028');
  hLine(ctx, 14, 18, SURFACE_H - 18, '#806848');
  fillRect(ctx, 11, SURFACE_H - 22, 10, 6, def.detail);
  fillRect(ctx, 11, SURFACE_H - 22, 10, 2, def.highlight as string);
  const glowX = 16, glowY = SURFACE_H - 22;
  ctx.fillStyle = 'rgba(255,232,128,0.3)';
  ctx.beginPath();
  ctx.arc(glowX, glowY + 3, 7, 0, Math.PI * 2);
  ctx.fill();
  pixel(ctx, glowX, glowY + 3, '#ffffff');
  pixel(ctx, glowX - 1, glowY + 2, '#ffe880');
  pixel(ctx, glowX + 1, glowY + 2, '#ffe880');
  pixel(ctx, glowX, glowY + 1, '#ffe880');
}

type DrawFn = (ctx: CanvasRenderingContext2D, def: TileDef) => void;

const DRAW_MAP: Record<string, DrawFn> = {
  'Grass': drawGrass,
  'Grass Alt': drawGrassAlt,
  'Dirt': drawDirt,
  'Sand': drawSand,
  'Shallow Water': drawShallowWater,
  'Deep Water': drawDeepWater,
  'Water Edge N': drawWaterEdgeN,
  'Water Edge W': drawWaterEdgeW,
  'Bush': drawBush,
  'Tall Grass': drawTallGrass,
  'Tree Trunk': drawTreeTrunk,
  'Canopy': drawCanopy,
  'Flower': drawFlower,
  'Rock': drawRock,
  'Cliff': drawCliff,
  'Gravel': drawGravel,
  'Cave': drawCave,
  'Wood Fence': drawWoodFence,
  'Stone Wall': drawStoneWall,
  'Roof': drawRoof,
  'Cobblestone': drawCobblestone,
  'Path': drawPath,
  'Bridge': drawBridge,
  'Shadow': drawShadow,
  'Lantern': drawLantern,
};

export function drawTile(ctx: CanvasRenderingContext2D, def: TileDef): void {
  ctx.save();
  const drawFn = DRAW_MAP[def.name];
  if (drawFn) {
    drawFn(ctx, def);
  } else {
    drawGrass(ctx, def);
  }
  ctx.restore();
}