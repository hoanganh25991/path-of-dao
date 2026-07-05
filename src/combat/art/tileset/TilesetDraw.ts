import { type TileDef, TILE_SIZE, SURFACE_H } from './TilesetTypes';

const T = TILE_SIZE;
const SH = SURFACE_H;

function hex(hex: string): [number, number, number] {
  const v = parseInt(hex.replace('#', ''), 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hex(a);
  const [br, bg, bb] = hex(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

function rgbaStr(r: number, g: number, b: number, a: number): string {
  return `rgba(${r},${g},${b},${a})`;
}

function fill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string): void {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

function pset(ctx: CanvasRenderingContext2D, x: number, y: number, c: string): void {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, 1, 1);
}

function hline(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, c: string): void {
  ctx.fillStyle = c;
  ctx.fillRect(x1, y, x2 - x1, 1);
}

function vline(ctx: CanvasRenderingContext2D, x: number, y1: number, y2: number, c: string): void {
  ctx.fillStyle = c;
  ctx.fillRect(x, y1, 1, y2 - y1);
}

let seed = 0;
export function resetTileSeed(v: number): void { seed = v * 16807 + 1; }
function rs(): number {
  seed = (seed * 16807 + 1) % 2147483647;
  return seed / 2147483647;
}
function rng(max: number): number {
  return Math.floor(rs() * max);
}
function pick<T>(arr: readonly T[]): T {
  return arr[rng(arr.length)]!;
}

/** Vertical color ramp: top color to bottom color. */
function vRamp(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  top: string, bottom: string,
): void {
  for (let row = 0; row < h; row++) {
    const t = row / (h - 1);
    const c = mix(top, bottom, t);
    hline(ctx, x, x + w, y + row, c);
  }
}

/** Draw subtle grass blade clusters. */
function grassBlades(ctx: CanvasRenderingContext2D, c: string, count: number): void {
  for (let i = 0; i < count; i++) {
    const bx = rng(T);
    const by = rng(T);
    const bh = 2 + rng(4);
    for (let dy = 0; dy < bh; dy++) {
      const shade = dy === 0 ? c : mix(c, c, 1 - dy * 0.3);
      pset(ctx, bx, by - dy, shade);
      if (bh > 3 && rng(2) === 0) pset(ctx, bx + (rng(2) * 2 - 1), by - dy + 1, shade);
    }
  }
}

// ─── SEAMLESS GROUND TILES ───

function drawGrass(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, def.surface);
  grassBlades(ctx, def.speckle, 22);
  for (let i = 0; i < 6; i++) pset(ctx, rng(10), rng(8), def.highlight);
}

function drawGrassAlt(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, def.detail);
  grassBlades(ctx, def.highlight, 18);
  for (let i = 0; i < 4; i++) {
    const tx = rng(24) + 4;
    const th = 3 + rng(5);
    pset(ctx, tx - 1, T - th, def.highlight);
    pset(ctx, tx, T - th - 1, def.highlight);
    pset(ctx, tx + 1, T - th, def.highlight);
  }
}

function drawDirt(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, def.surface);
  for (let i = 0; i < 25; i++) {
    const dc = pick([def.detail, def.speckle, def.highlight]);
    pset(ctx, rng(T), rng(T), dc);
  }
}

function drawSand(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, def.surface);
  for (let i = 0; i < 35; i++) pset(ctx, rng(T), rng(T), pick([def.speckle, def.highlight, def.detail]));
  for (let i = 0; i < 6; i++) pset(ctx, rng(10), rng(6), def.highlight);
}

function drawGravel(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, def.detail);
  for (let i = 0; i < 40; i++) {
    const gx = rng(T);
    const gy = rng(T);
    const sz = 1 + rng(2);
    const sc = pick([def.surface, def.highlight, def.shadow]);
    fill(ctx, gx, gy, sz, sz, sc);
  }
}

function drawCobblestone(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, def.surface);
  const stones = [
    { x: 1, y: 1, w: 9, h: 7 }, { x: 12, y: 0, w: 8, h: 6 },
    { x: 22, y: 2, w: 9, h: 6 }, { x: 3, y: 9, w: 7, h: 6 },
    { x: 14, y: 8, w: 10, h: 7 }, { x: 5, y: 16, w: 8, h: 6 },
    { x: 16, y: 15, w: 9, h: 6 }, { x: 2, y: 23, w: 7, h: 6 },
    { x: 12, y: 22, w: 11, h: 6 }, { x: 24, y: 24, w: 7, h: 5 },
  ];
  for (const s of stones) {
    fill(ctx, s.x, s.y, s.w, s.h, def.detail);
    hline(ctx, s.x, s.x + s.w, s.y, def.highlight);
    pset(ctx, s.x + s.w - 1, s.y + s.h - 1, def.shadow);
    pset(ctx, s.x + s.w - 2, s.y + s.h - 1, def.shadow);
  }
}

function drawPath(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, def.surface);
  for (let i = 0; i < 24; i++) {
    const px = rng(26) + 3;
    const py = rng(26) + 3;
    const pc = pick([def.detail, def.surface, def.speckle]);
    pset(ctx, px, py, pc);
    if (rs() > 0.5) pset(ctx, px + 1, py, pick([def.highlight, def.shadow]));
  }
}

// ─── WATER TILES ───

function drawShallowWater(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, def.surface);

  // Ripple bands
  for (let row = 4; row < T - 3; row += 7) {
    const alpha = 0.15 + Math.abs(Math.sin(row * 0.8)) * 0.15;
    const [rr, rg, rb] = hex(def.highlight);
    ctx.fillStyle = rgbaStr(rr, rg, rb, alpha);
    const off = Math.floor(rs() * 8);
    ctx.fillRect(4 + off, row, 14 + rng(10), 2);
  }

  // Light sparkles
  for (let i = 0; i < 6; i++) {
    const sx = rng(28) + 2;
    const sy = rng(10) + 2;
    pset(ctx, sx, sy, 'rgba(255,255,255,0.5)');
  }
}

function drawDeepWater(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, def.surface);

  for (let row = 5; row < T - 4; row += 8) {
    const alpha = 0.08 + Math.abs(Math.sin(row * 0.6)) * 0.1;
    const [rr, rg, rb] = hex(def.highlight);
    ctx.fillStyle = rgbaStr(rr, rg, rb, alpha);
    ctx.fillRect(6 + Math.floor(rs() * 4), row, 10 + rng(8), 1);
  }
}

function drawWaterEdgeN(ctx: CanvasRenderingContext2D, def: TileDef): void {
  drawShallowWater(ctx, def);
  const edge = '#2d5a26';
  const foam = '#5ea852';
  for (let x = 0; x < T; x++) {
    const wave = Math.sin(x * 0.35 + seed * 0.2) * 2.5;
    const ey = Math.max(2, SH - 3 + Math.round(wave));
    pset(ctx, x, ey, edge);
    pset(ctx, x, ey + 1, edge);
    pset(ctx, x, ey + 2, foam);
    if (rs() > 0.6) pset(ctx, x, ey - 1, foam);
  }
}

function drawWaterEdgeW(ctx: CanvasRenderingContext2D, def: TileDef): void {
  drawShallowWater(ctx, def);
  const edge = '#2d5a26';
  const foam = '#5ea852';
  for (let y = 3; y < SH + 4; y++) {
    const wave = Math.sin(y * 0.45 + seed * 0.3) * 2;
    const ex = Math.max(2, 5 + Math.round(wave));
    pset(ctx, ex, y, edge);
    pset(ctx, ex + 1, y, foam);
    if (rs() > 0.5) pset(ctx, ex + 2, y, foam);
  }
}

// ─── STRUCTURE TILES WITH 2.5D DEPTH ───

function drawFrontFace(ctx: CanvasRenderingContext2D, def: TileDef, yStart: number): void {
  const h = T - yStart;
  if (h <= 0) return;

  vRamp(ctx, 0, yStart, T, h, def.edge, def.shadow);

  // Dither the front face for texture
  for (let row = yStart; row < T; row++) {
    for (let col = 0; col < T; col++) {
      if (((col + row) & 1) === 0) {
        pset(ctx, col, row, mix(def.edge, def.shadow, (row - yStart) / h * 0.3));
      }
    }
  }

  // Clean dividing line
  hline(ctx, 0, T, yStart, '#000000');
  hline(ctx, 0, T, yStart + 1, def.edge);
}

function drawSurfaceArea(ctx: CanvasRenderingContext2D, def: TileDef, yStart: number, yEnd: number): void {
  const h = yEnd - yStart;
  vRamp(ctx, 0, yStart, T, h, def.highlight, def.surface);

  for (let i = 0; i < 15; i++) {
    pset(ctx, rng(T), yStart + rng(h), def.speckle);
  }
}

function drawBush(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, 'rgba(0,0,0,0)');

  const cx = 15, cy = SH - 3;

  // Shadow under bush
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx + 1, cy + 6, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bush body - overlapping clusters of leaves
  const clusters = [
    { x: cx - 4, y: cy + 2, r: 7 }, { x: cx + 5, y: cy + 1, r: 8 },
    { x: cx, y: cy - 3, r: 9 }, { x: cx - 6, y: cy - 2, r: 6 },
    { x: cx + 7, y: cy - 3, r: 6 }, { x: cx, y: cy + 5, r: 6 },
  ];

  for (const cl of clusters) {
    ctx.fillStyle = def.shadow;
    ctx.beginPath();
    ctx.arc(cl.x + 1, cl.y + 1, cl.r, 0, Math.PI * 2);
    ctx.fill();

    vRamp(ctx, cl.x - cl.r, cl.y - cl.r, cl.r * 2, cl.r * 2, def.highlight, def.surface);
    ctx.fillStyle = 'rgba(0,0,0,0)';
    // Re-fill with clipped circle using def.surface as base
  }

  // Simpler approach: draw filled circles
  for (const cl of clusters) {
    ctx.fillStyle = def.surface;
    ctx.beginPath();
    ctx.arc(cl.x, cl.y, cl.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = def.highlight;
    ctx.beginPath();
    ctx.arc(cl.x - 2, cl.y - 2, cl.r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFrontFace(ctx, def, SH + 4);
}

function drawTallGrass(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, def.surface);
  grassBlades(ctx, def.speckle, 12);

  for (let i = 0; i < 10; i++) {
    const gx = rng(28) + 2;
    const gh = 4 + rng(10);
    const gc = pick([def.highlight, def.speckle, def.detail]);
    pset(ctx, gx, T - gh, gc);
    pset(ctx, gx, T - gh + 1, gc);
    pset(ctx, gx - 1, T - gh + 2, gc);
    if (gh > 7) {
      pset(ctx, gx + 1, T - gh + 3, gc);
      pset(ctx, gx, T - gh + 4, gc);
    }
  }
}

function drawTreeTrunk(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, 'rgba(0,0,0,0)');

  // Trunk body with slight taper
  for (let y = 0; y < T; y++) {
    const taper = 1 - y / T * 0.3;
    const halfW = Math.round(5 * taper);
    const cx = 15;
    for (let x = cx - halfW; x <= cx + halfW; x++) {
      const shade = x < cx ? def.surface : def.detail;
      pset(ctx, x, y, shade);
    }
  }

  // Bark lines
  for (let y = 3; y < T - 5; y += 5) {
    const bx = 11 + rng(8);
    hline(ctx, bx, bx + 2, y, def.shadow);
    hline(ctx, bx + 1, bx + 3, y + 1, def.shadow);
  }

  // Left highlight
  vline(ctx, 10, 2, T - 4, def.highlight);

  // Bottom roots
  fill(ctx, 8, T - 4, 14, 4, def.edge);
  pset(ctx, 8, T - 3, def.shadow);
  pset(ctx, 21, T - 3, def.shadow);
}

function drawCanopy(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, 'rgba(0,0,0,0)');

  const clusters = [
    { x: 16, y: SH - 5, r: 9 },
    { x: 8, y: SH - 1, r: 7 },
    { x: 24, y: SH - 1, r: 7 },
    { x: 4, y: SH + 4, r: 6 },
    { x: 28, y: SH + 4, r: 6 },
    { x: 16, y: SH + 5, r: 7 },
    { x: 10, y: SH + 7, r: 5 },
    { x: 22, y: SH + 7, r: 5 },
  ];

  for (const cl of clusters) {
    // Shadow
    ctx.fillStyle = def.shadow;
    ctx.beginPath();
    ctx.arc(cl.x + 1, cl.y + 1, cl.r, 0, Math.PI * 2);
    ctx.fill();
    // Body
    ctx.fillStyle = def.surface;
    ctx.beginPath();
    ctx.arc(cl.x, cl.y, cl.r, 0, Math.PI * 2);
    ctx.fill();
    // Highlight top-left
    ctx.fillStyle = def.highlight;
    ctx.beginPath();
    ctx.arc(cl.x - 2, cl.y - 2, cl.r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFlower(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, def.surface);
  grassBlades(ctx, def.speckle, 10);

  const sx = 15;
  for (let y = T - 2; y >= 8; y--) {
    pset(ctx, sx, y, '#3a7030');
    if (y < T - 2) pset(ctx, sx + 1, y, '#2d5a26');
  }

  // Petals
  const petals: [number, number][] = [
    [0, -3], [3, 0], [0, 3], [-3, 0],
    [2, -2], [2, 2], [-2, 2], [-2, -2],
  ];
  for (const [dx, dy] of petals) {
    pset(ctx, sx + dx, 8 + dy, def.detail);
  }
  // Center
  pset(ctx, sx, 8, '#ffe880');
  pset(ctx, sx - 1, 9, '#d4a840');
  pset(ctx, sx + 1, 9, '#d4a840');
}

function drawRock(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, 'rgba(0,0,0,0)');

  // Rock body - irregular shape
  for (let y = SH - 13; y < T; y++) {
    const midX = 15;
    const wobble = Math.sin(y * 0.4) * 3;
    const halfW = 8 + Math.floor(Math.abs(Math.sin(y * 0.3)) * 4);
    const cx = midX + Math.round(wobble);
    for (let x = cx - halfW; x <= cx + halfW; x++) {
      if (x < 3 || x > T - 3) continue;
      const shade = y < SH - 6
        ? def.highlight
        : y < SH + 2
          ? def.surface
          : def.edge;
      pset(ctx, x, y, shade);
    }
  }

  drawFrontFace(ctx, def, SH + 3);

  // Highlight edge
  for (let x = 7; x < 24; x++) {
    if (rs() > 0.5) pset(ctx, x, SH - 12, def.highlight);
  }
}

function drawCliff(ctx: CanvasRenderingContext2D, def: TileDef): void {
  // Deep space background
  vRamp(ctx, 0, 0, T, SH, '#0a1028', '#101838');

  // Nebula haze — large soft color patches
  for (let i = 0; i < 4; i++) {
    const nx = rng(T);
    const ny = rng(SH - 6);
    const nr = 4 + rng(8);
    const [nrR, nrG, nrB] = hex(def.detail);
    ctx.fillStyle = rgbaStr(nrR, nrG, nrB, 0.15 + rs() * 0.2);
    ctx.beginPath();
    ctx.arc(nx, ny, nr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bright stars — small white/blue dots
  for (let i = 0; i < 18; i++) {
    const sx = rng(T - 2) + 1;
    const sy = rng(SH - 4) + 1;
    const brightness = 0.4 + rs() * 0.6;
    const [sr, sg, sb] = hex(def.highlight);
    ctx.fillStyle = rgbaStr(sr, sg, sb, brightness);
    // Cross-shaped star
    pset(ctx, sx, sy, rgbaStr(sr, sg, sb, brightness));
    if (rs() > 0.5) {
      pset(ctx, sx - 1, sy, rgbaStr(sr, sg, sb, brightness * 0.6));
      pset(ctx, sx + 1, sy, rgbaStr(sr, sg, sb, brightness * 0.6));
      pset(ctx, sx, sy - 1, rgbaStr(sr, sg, sb, brightness * 0.6));
      pset(ctx, sx, sy + 1, rgbaStr(sr, sg, sb, brightness * 0.6));
    }
  }

  // Twinkling distant stars — single pixels
  for (let i = 0; i < 30; i++) {
    const tx = rng(T);
    const ty = rng(SH - 3);
    const alpha = 0.2 + rs() * 0.5;
    ctx.fillStyle = rgbaStr(200, 210, 255, alpha);
    pset(ctx, tx, ty, rgbaStr(200, 210, 255, alpha));
  }

  // Cosmic void front face with depth
  const faceH = T - (SH - 2);
  vRamp(ctx, 0, SH - 2, T, faceH, '#050810', '#020408');

  // Subtle void particles in the depth
  for (let i = 0; i < 8; i++) {
    const vx = rng(T);
    const vy = SH + rng(faceH - 2);
    ctx.fillStyle = rgbaStr(60, 70, 120, 0.3);
    pset(ctx, vx, vy, rgbaStr(60, 70, 120, 0.3));
  }

  // Clean horizon line between space and void
  hline(ctx, 0, T, SH - 2, 'rgba(48,64,160,0.4)');
  hline(ctx, 0, T, SH - 3, 'rgba(80,100,200,0.3)');
}

function drawCaveEntrance(ctx: CanvasRenderingContext2D, def: TileDef): void {
  drawSurfaceArea(ctx, def, 0, SH + 2);

  // Dark opening
  fill(ctx, 8, 5, 16, 20, '#000000');

  // Stone border
  hline(ctx, 6, 26, 4, def.highlight);
  hline(ctx, 6, 26, 25, def.shadow);
  vline(ctx, 6, 5, 25, def.highlight);
  vline(ctx, 25, 5, 25, def.highlight);

  // Depth shadow inside
  vRamp(ctx, 9, 6, 14, 4, 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0)');

  drawFrontFace(ctx, def, SH + 4);
}

function drawWoodFence(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, 'rgba(0,0,0,0)');

  // Two horizontal planks
  for (const y of [SH - 9, SH - 3]) {
    fill(ctx, 2, y, 28, 6, def.surface);
    hline(ctx, 2, 30, y, def.highlight);
    hline(ctx, 2, 30, y + 5, def.shadow);

    // Wood grain
    for (let x = 3; x < 29; x += 3) {
      pset(ctx, x, y + 2, def.detail);
    }
  }

  // Vertical posts
  fill(ctx, 11, SH - 9, 9, T - (SH - 9), def.edge);
  fill(ctx, 11, SH - 9, 9, 3, def.detail);
}

function drawStoneWall(ctx: CanvasRenderingContext2D, def: TileDef): void {
  const bh = 6, bw = 10;

  fill(ctx, 0, 0, T, T, def.shadow);

  for (let row = 0; row < 6; row++) {
    const y = row * bh;
    const offset = row % 2 === 1 ? 5 : 0;

    for (let col = -1; col < 4; col++) {
      const x = col * bw + offset;
      fill(ctx, x, y, bw - 1, bh - 1, def.surface);

      // Top highlight
      hline(ctx, x, x + bw - 1, y, def.highlight);
      // Bottom shadow
      hline(ctx, x, x + bw - 1, y + bh - 2, def.shadow);
      // Right shadow
      vline(ctx, x + bw - 2, y + 1, y + bh - 1, def.shadow);

      // Stone texture speckle
      if (rs() > 0.6) {
        pset(ctx, x + rng(bw - 3) + 1, y + rng(bh - 3) + 1, def.speckle);
      }
    }
  }
}

function drawRoof(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, 'rgba(0,0,0,0)');

  for (let row = 0; row < 5; row++) {
    const y = row * 5 + 3;
    fill(ctx, 0, y, T, 5, def.surface);
    hline(ctx, 0, T, y, def.highlight);
    hline(ctx, 0, T, y + 4, def.shadow);

    // Tile detail lines
    for (let x = 4; x < T; x += 8) {
      vline(ctx, x, y, y + 5, def.detail);
    }
  }

  // Bottom edge with deeper shadow
  fill(ctx, 0, 24, T, 8, def.edge);
  hline(ctx, 0, T, 24, '#000000');
}

function drawBridge(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, 'rgba(0,0,0,0)');

  // Planks
  for (const y of [SH - 7, SH - 2]) {
    fill(ctx, 1, y, 30, 5, def.surface);
    hline(ctx, 1, 31, y, def.highlight);
    hline(ctx, 1, 31, y + 4, def.shadow);

    // Plank gaps
    for (let x = 10; x < 31; x += 10) {
      vline(ctx, x, y, y + 5, def.detail);
    }
  }

  // Side rails
  fill(ctx, 0, SH - 9, 3, 11, def.edge);
  fill(ctx, 29, SH - 9, 3, 11, def.edge);
  hline(ctx, 0, 3, SH - 9, def.highlight);
  hline(ctx, 29, 32, SH - 9, def.highlight);

  // Posts
  fill(ctx, 14, SH - 11, 4, 13, def.detail);
  fill(ctx, 14, SH - 11, 4, 2, def.highlight);
}

function drawShadow(ctx: CanvasRenderingContext2D, _def: TileDef): void {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, T, T);
}

function drawLantern(ctx: CanvasRenderingContext2D, def: TileDef): void {
  fill(ctx, 0, 0, T, T, def.surface);
  grassBlades(ctx, def.speckle, 8);

  // Post
  fill(ctx, 14, SH - 20, 4, 20, '#584028');
  hline(ctx, 14, 18, SH - 20, '#806848');
  vline(ctx, 15, SH - 19, SH - 4, '#3d2a18');

  // Lantern body
  fill(ctx, 11, SH - 24, 10, 6, def.detail);
  fill(ctx, 11, SH - 24, 10, 2, def.highlight);
  hline(ctx, 11, 21, SH - 19, def.shadow);

  // Glow
  const [pr, pg, pb] = hex('#ffe880');
  ctx.fillStyle = rgbaStr(pr, pg, pb, 0.25);
  ctx.beginPath();
  ctx.arc(16, SH - 22, 7, 0, Math.PI * 2);
  ctx.fill();

  // Core
  pset(ctx, 15, SH - 22, '#ffffff');
  pset(ctx, 16, SH - 22, '#ffe880');
  pset(ctx, 17, SH - 22, '#ffe880');
  pset(ctx, 16, SH - 23, '#ffe880');
}

// ─── DRAW MAP ───

type DrawFn = (ctx: CanvasRenderingContext2D, def: TileDef) => void;

const DRAW: Record<string, DrawFn> = {
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
  'Space Border': drawCliff,
  'Gravel': drawGravel,
  'Cave': drawCaveEntrance,
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
  (DRAW[def.name] ?? drawGrass)(ctx, def);
  ctx.restore();
}