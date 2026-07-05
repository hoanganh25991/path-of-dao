import type Phaser from 'phaser';

/** Procedural pixel-art combat VFX textures (skills, bolts, AOE, sparks). */

export const VFX_TEXTURE_KEYS = {
  slash: 'vfx-slash',
  bolt: 'vfx-bolt',
  arrow: 'vfx-arrow',
  coin: 'vfx-coin',
  spark: 'vfx-spark',
  qiStream: 'vfx-qi-stream',
  ring: 'vfx-ring',
  aoeFlame: 'vfx-aoe-flame',
  voidCrack: 'vfx-void-crack',
  auraRing: 'vfx-aura-ring',
  lightningBolt: 'vfx-lightning-bolt',
  timeRipple: 'vfx-time-ripple',
  lifeBloom: 'vfx-life-bloom',
  iceSpike: 'vfx-ice-spike',
} as const;

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), size, size);
}

function pixelArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  startRad: number,
  endRad: number,
  color: string,
  thickness = 2,
): void {
  const steps = Math.max(12, Math.ceil(Math.abs(endRad - startRad) * r * 1.5));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = startRad + (endRad - startRad) * t;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    for (let ox = 0; ox < thickness; ox++) {
      for (let oy = 0; oy < thickness; oy++) {
        px(ctx, x + ox - Math.floor(thickness / 2), y + oy - Math.floor(thickness / 2), color);
      }
    }
  }
}

function pixelLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  thickness = 1,
): void {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const steps = Math.max(dx, dy, 1);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    for (let ox = 0; ox < thickness; ox++) {
      for (let oy = 0; oy < thickness; oy++) {
        px(ctx, x + ox, y + oy, color);
      }
    }
  }
}

function pixelRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
  thickness = 2,
): void {
  const steps = Math.max(24, Math.ceil(r * 8));
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    for (let ox = 0; ox < thickness; ox++) {
      for (let oy = 0; oy < thickness; oy++) {
        px(ctx, x + ox - Math.floor(thickness / 2), y + oy - Math.floor(thickness / 2), color);
      }
    }
  }
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function withCtx(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  return canvas;
}

/** Wide slash arc — authored facing right; tint for intent color. */
export function drawSlashCanvas(): HTMLCanvasElement {
  const size = 64;
  return withCtx(size, size, (ctx) => {
    const cy = size / 2;
    pixelArc(ctx, 6, cy, 50, -0.62, 0.62, '#1a2030', 4);
    pixelArc(ctx, 6, cy, 49, -0.6, 0.6, '#88b8ff', 3);
    pixelArc(ctx, 6, cy, 47, -0.58, 0.58, '#ffffff', 2);
    // Leading edge spark pixels
    px(ctx, 56, cy - 8, '#ffffff', 2);
    px(ctx, 57, cy, '#ffffff', 2);
    px(ctx, 56, cy + 6, '#ffffff', 2);
  });
}

/** Spirit bolt — authored facing right. */
export function drawBoltCanvas(): HTMLCanvasElement {
  return withCtx(24, 10, (ctx) => {
    const cy = 5;
    // Tail wisps
    px(ctx, 0, cy, '#4080a0');
    px(ctx, 1, cy - 1, '#5098b8');
    px(ctx, 1, cy + 1, '#5098b8');
    px(ctx, 2, cy - 2, '#60b0d0');
    px(ctx, 2, cy, '#80d0f0', 2);
    px(ctx, 2, cy + 2, '#60b0d0');
    // Body
    for (let x = 5; x <= 16; x++) {
      px(ctx, x, cy - 1, '#a0e8ff');
      px(ctx, x, cy, '#ffffff', 2);
      px(ctx, x, cy + 2, '#a0e8ff');
    }
    // Head
    px(ctx, 17, cy - 2, '#ffffff', 2);
    px(ctx, 19, cy - 1, '#ffffff', 3);
    px(ctx, 21, cy, '#ffffff', 2);
    px(ctx, 19, cy + 2, '#d0f8ff', 2);
  });
}

export function drawArrowCanvas(): HTMLCanvasElement {
  return withCtx(16, 6, (ctx) => {
    pixelLine(ctx, 0, 3, 10, 3, '#8a6840', 2);
    px(ctx, 10, 2, '#c9a86a');
    px(ctx, 11, 1, '#e8e4dc');
    px(ctx, 12, 0, '#ffffff', 2);
    px(ctx, 12, 4, '#ffffff', 2);
    px(ctx, 13, 1, '#f0ece4', 2);
    px(ctx, 13, 3, '#f0ece4', 2);
    px(ctx, 14, 2, '#ffffff', 2);
  });
}

export function drawCoinCanvas(): HTMLCanvasElement {
  return withCtx(12, 12, (ctx) => {
    pixelRing(ctx, 6, 6, 5, '#8f6b2f', 2);
    pixelRing(ctx, 6, 6, 4, '#e8c48f', 2);
    px(ctx, 5, 5, '#fff0c0', 2);
    px(ctx, 7, 7, '#c9a050');
  });
}

/** Small spark — tint for element color. */
export function drawSparkCanvas(): HTMLCanvasElement {
  return withCtx(8, 8, (ctx) => {
    px(ctx, 3, 3, '#ffffff', 2);
    px(ctx, 3, 0, '#ffffff');
    px(ctx, 3, 7, '#ffffff');
    px(ctx, 0, 3, '#ffffff');
    px(ctx, 7, 3, '#ffffff');
    px(ctx, 1, 1, '#d0e8ff');
    px(ctx, 6, 6, '#d0e8ff');
  });
}

/** Elongated qi streak — rotate toward target for inward airflow. */
export function drawQiStreamCanvas(): HTMLCanvasElement {
  return withCtx(10, 6, (ctx) => {
    pixelLine(ctx, 0, 3, 6, 3, '#60c888', 1);
    pixelLine(ctx, 4, 2, 8, 3, '#a0ffc0', 1);
    px(ctx, 8, 3, '#ffffff', 2);
    px(ctx, 9, 3, '#e8fff0');
  });
}

/** Hollow ring for cast / heal expand. */
export function drawRingCanvas(): HTMLCanvasElement {
  const size = 32;
  return withCtx(size, size, (ctx) => {
    const c = size / 2;
    pixelRing(ctx, c, c, 11, '#1a2030', 2);
    pixelRing(ctx, c, c, 10, '#ffffff', 2);
    // Corner rune ticks
    px(ctx, c, 2, '#ffffff');
    px(ctx, c, size - 3, '#ffffff');
    px(ctx, 2, c, '#ffffff');
    px(ctx, size - 3, c, '#ffffff');
  });
}

/** Flame AOE burst — orange core, white hot center. */
export function drawAoeFlameCanvas(): HTMLCanvasElement {
  const size = 48;
  return withCtx(size, size, (ctx) => {
    const c = size / 2;
    pixelRing(ctx, c, c, 6, '#ff6020', 2);
    px(ctx, c - 1, c - 1, '#ffffff', 2);
    const petals = 8;
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2 - Math.PI / 2;
      const dist = 14 + (i % 2) * 4;
      const px0 = c + Math.round(Math.cos(a) * dist);
      const py0 = c + Math.round(Math.sin(a) * dist);
      px(ctx, px0, py0, i % 2 === 0 ? '#ff9040' : '#ff6020', 2);
      const px1 = c + Math.round(Math.cos(a) * (dist + 6));
      const py1 = c + Math.round(Math.sin(a) * (dist + 6));
      px(ctx, px1, py1, '#ffb060');
      const px2 = c + Math.round(Math.cos(a) * (dist + 10));
      const py2 = c + Math.round(Math.sin(a) * (dist + 10));
      px(ctx, px2, py2, '#ffd080');
    }
    pixelRing(ctx, c, c, 20, '#ff8030', 1);
  });
}

/** Void pull field — jagged purple cracks radiating outward. */
export function drawVoidCrackCanvas(): HTMLCanvasElement {
  const size = 48;
  return withCtx(size, size, (ctx) => {
    const c = size / 2;
    pixelRing(ctx, c, c, 5, '#6040a0', 2);
    px(ctx, c - 1, c - 1, '#c0a0ff', 2);
    const spokes = 6;
    for (let i = 0; i < spokes; i++) {
      const base = (i / spokes) * Math.PI * 2;
      let x = c;
      let y = c;
      const steps = 5 + (i % 3);
      for (let s = 1; s <= steps; s++) {
        const jitter = ((i * 7 + s * 3) % 5) - 2;
        const a = base + jitter * 0.12;
        const dist = 4 + s * 3;
        const nx = c + Math.round(Math.cos(a) * dist);
        const ny = c + Math.round(Math.sin(a) * dist);
        pixelLine(ctx, x, y, nx, ny, s % 2 === 0 ? '#9060ff' : '#6040c0', 2);
        x = nx;
        y = ny;
      }
      px(ctx, x, y, '#e0c0ff', 2);
    }
    pixelRing(ctx, c, c, 18, '#5030a0', 1);
  });
}

/** Soft aura ring for ancient heroes — pulsing tint target. */
export function drawAuraRingCanvas(): HTMLCanvasElement {
  const size = 56;
  return withCtx(size, size, (ctx) => {
    const c = size / 2;
    pixelRing(ctx, c, c, 24, '#ffffff', 1);
    pixelRing(ctx, c, c, 20, '#ffffff', 1);
    pixelRing(ctx, c, c, 16, '#ffffff', 1);
  });
}

/** Zigzag lightning bolt — distinct from the rounded spirit bolt. */
export function drawLightningBoltCanvas(): HTMLCanvasElement {
  const size = 32;
  return withCtx(size, size, (ctx) => {
    const path = [
      [2, 26], [10, 20], [8, 14], [14, 12], [12, 6],
      [20, 8], [18, 14], [26, 10], [28, 4],
    ] as [number, number][];
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i]!;
      const b = path[i + 1]!;
      pixelLine(ctx, a[0], a[1], b[0], b[1], '#ffffff', 3);
    }
    // Glow halo
    const mid = path[4]!;
    pixelArc(ctx, mid[0], mid[1], 6, 0, Math.PI * 2, '#ffffff', 1);
    pixelArc(ctx, mid[0], mid[1], 8, 0, Math.PI * 2, 'rgba(255,232,0,0.6)', 1);
  });
}

/** Concentric time ripples — expanding circles. */
export function drawTimeRippleCanvas(): HTMLCanvasElement {
  const size = 40;
  return withCtx(size, size, (ctx) => {
    const c = size / 2;
    for (let r = 4; r <= 16; r += 3) {
      const alpha = 0.9 - (r - 4) / 16 * 0.6;
      px(ctx, c, c, `rgba(140,220,255,${alpha})`, 2);
    }
    pixelRing(ctx, c, c, 6, 'rgba(160,230,255,1)', 1);
    pixelRing(ctx, c, c, 10, 'rgba(100,200,240,0.8)', 1);
    pixelRing(ctx, c, c, 14, 'rgba(60,160,220,0.5)', 1);
    pixelRing(ctx, c, c, 18, 'rgba(30,120,200,0.3)', 1);
    // Tick marks
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      px(ctx, c + Math.round(Math.cos(a) * 12), c + Math.round(Math.sin(a) * 12), 'rgba(255,255,255,0.7)');
    }
  });
}

/** Flower bloom burst — petal shape, green/yellow. */
export function drawLifeBloomCanvas(): HTMLCanvasElement {
  const size = 40;
  return withCtx(size, size, (ctx) => {
    const c = size / 2;
    const petals = 6;
    for (let p = 0; p < petals; p++) {
      const a = (p / petals) * Math.PI * 2;
      for (let d = 1; d <= 10; d++) {
        const px2 = c + Math.round(Math.cos(a) * d);
        const py = c + Math.round(Math.sin(a) * d);
        const shade = d < 4 ? '#a0ffc0' : d < 7 ? '#50e878' : '#28b050';
        px(ctx, px2, py, shade);
      }
    }
    pixelArc(ctx, c, c, 5, 0, Math.PI * 2, '#e0ffe0', 2);
    px(ctx, c - 1, c - 1, '#ffffff', 2);
  });
}

/** Ice crystal spike shard — sharp geometric. */
export function drawIceSpikeCanvas(): HTMLCanvasElement {
  const size = 36;
  return withCtx(size, size, (ctx) => {
    const c = size / 2;
    // Outer hexagon
    const pts: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      pts.push([c + Math.round(Math.cos(a) * 14), c + Math.round(Math.sin(a) * 14)]);
    }
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i]!;
      const [x2, y2] = pts[(i + 1) % pts.length]!;
      pixelLine(ctx, x1, y1, x2, y2, '#d0e8ff', 2);
    }
    // Inner burst
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      pixelLine(ctx, c, c, c + Math.round(Math.cos(a) * 8), c + Math.round(Math.sin(a) * 8), '#b0d0f0', 1);
    }
    px(ctx, c - 1, c - 1, '#ffffff', 2);
    pixelArc(ctx, c, c, 12, 0, Math.PI * 2, 'rgba(160,200,255,0.4)', 1);
  });
}

function addCanvasTexture(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement): void {
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }
  scene.textures.addCanvas(key, canvas);
}

/** Register all pixel VFX canvases (BootScene, after tile placeholders). */
export function registerPixelVfxAssets(scene: Phaser.Scene): void {
  addCanvasTexture(scene, VFX_TEXTURE_KEYS.slash, drawSlashCanvas());
  addCanvasTexture(scene, VFX_TEXTURE_KEYS.bolt, drawBoltCanvas());
  addCanvasTexture(scene, VFX_TEXTURE_KEYS.arrow, drawArrowCanvas());
  addCanvasTexture(scene, VFX_TEXTURE_KEYS.coin, drawCoinCanvas());
  addCanvasTexture(scene, VFX_TEXTURE_KEYS.spark, drawSparkCanvas());
  addCanvasTexture(scene, VFX_TEXTURE_KEYS.qiStream, drawQiStreamCanvas());
  addCanvasTexture(scene, VFX_TEXTURE_KEYS.ring, drawRingCanvas());
  addCanvasTexture(scene, VFX_TEXTURE_KEYS.aoeFlame, drawAoeFlameCanvas());
  addCanvasTexture(scene, VFX_TEXTURE_KEYS.voidCrack, drawVoidCrackCanvas());
  addCanvasTexture(scene, VFX_TEXTURE_KEYS.auraRing, drawAuraRingCanvas());
  addCanvasTexture(scene, VFX_TEXTURE_KEYS.lightningBolt, drawLightningBoltCanvas());
  addCanvasTexture(scene, VFX_TEXTURE_KEYS.timeRipple, drawTimeRippleCanvas());
  addCanvasTexture(scene, VFX_TEXTURE_KEYS.lifeBloom, drawLifeBloomCanvas());
  addCanvasTexture(scene, VFX_TEXTURE_KEYS.iceSpike, drawIceSpikeCanvas());
}

/** Round world position so scaled sprites land on pixel grid. */
export function snapVfxPosition(obj: { x: number; y: number; setPosition(x: number, y: number): unknown }): void {
  obj.setPosition(Math.round(obj.x), Math.round(obj.y));
}
