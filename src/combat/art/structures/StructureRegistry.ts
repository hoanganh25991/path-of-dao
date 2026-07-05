import type Phaser from 'phaser';

interface TreeStyle {
  trunkW: number;
  trunkColor: string;
  trunkHi: string;
  trunkShadow: string;
  canopyColors: string[];
  canopyShape: 'round' | 'pine' | 'willow' | 'palm' | 'dead' | 'crystal';
  height: number;
  canopyH: number;
}

interface HouseStyle {
  width: number;
  height: number;
  wallColor: string;
  wallHi: string;
  wallShadow: string;
  roofColor: string;
  roofHi: string;
  roofShadow: string;
  doorColor: string;
  windowGlow: string;
  roofShape: 'slant' | 'flat' | 'tower' | 'pagoda';
  chimney: boolean;
}

const TREE_STYLES: Record<string, TreeStyle> = {
  'Fallen Village': { trunkW: 8, trunkColor: '#5a3a20', trunkHi: '#7a5830', trunkShadow: '#3a2010', canopyColors: ['#3a6a30', '#4a8038', '#589848', '#68a858'], canopyShape: 'round', height: 64, canopyH: 36 },
  'Mist Forest': { trunkW: 7, trunkColor: '#3a2818', trunkHi: '#5a4030', trunkShadow: '#201008', canopyColors: ['#1e4020', '#2a5830', '#387040', '#488a50'], canopyShape: 'pine', height: 76, canopyH: 48 },
  'Stone Canyon': { trunkW: 6, trunkColor: '#584838', trunkHi: '#706050', trunkShadow: '#382820', canopyColors: ['#4a3828', '#5a4830', '#685840'], canopyShape: 'dead', height: 64, canopyH: 28 },
  'Moon Lake': { trunkW: 7, trunkColor: '#4a6040', trunkHi: '#608050', trunkShadow: '#304830', canopyColors: ['#308078', '#40a090', '#50b8a8'], canopyShape: 'willow', height: 70, canopyH: 44 },
  'Burning Desert': { trunkW: 5, trunkColor: '#8a6a40', trunkHi: '#a08050', trunkShadow: '#604830', canopyColors: ['#589040', '#70a858', '#88c070'], canopyShape: 'palm', height: 82, canopyH: 34 },
  'Thunder Peaks': { trunkW: 9, trunkColor: '#4a4a38', trunkHi: '#606050', trunkShadow: '#303020', canopyColors: ['#2a4030', '#3a5040', '#4a6850', '#587860'], canopyShape: 'pine', height: 72, canopyH: 44 },
  'Frozen Palace': { trunkW: 8, trunkColor: '#687888', trunkHi: '#8898a8', trunkShadow: '#485868', canopyColors: ['#b8c8d8', '#c8d8e0', '#a0b0c0', '#d8e8f0'], canopyShape: 'pine', height: 74, canopyH: 46 },
  'Void Throne': { trunkW: 7, trunkColor: '#282038', trunkHi: '#403058', trunkShadow: '#181028', canopyColors: ['#583888', '#7858b8', '#9878d8', '#a888e8'], canopyShape: 'crystal', height: 66, canopyH: 40 },
};

const HOUSE_STYLES: Record<string, HouseStyle> = {
  'Fallen Village': { width: 64, height: 52, wallColor: '#c0a878', wallHi: '#d4c098', wallShadow: '#887048', roofColor: '#904830', roofHi: '#b06040', roofShadow: '#602818', doorColor: '#584028', windowGlow: '#ffe8a0', roofShape: 'slant', chimney: true },
  'Mist Forest': { width: 72, height: 56, wallColor: '#786048', wallHi: '#907860', wallShadow: '#584030', roofColor: '#4a3020', roofHi: '#684838', roofShadow: '#2a1810', doorColor: '#3a2010', windowGlow: '#ffd880', roofShape: 'slant', chimney: true },
  'Stone Canyon': { width: 68, height: 48, wallColor: '#a89880', wallHi: '#c0b098', wallShadow: '#786850', roofColor: '#686868', roofHi: '#888888', roofShadow: '#484848', doorColor: '#605040', windowGlow: '#e8d888', roofShape: 'flat', chimney: false },
  'Moon Lake': { width: 76, height: 60, wallColor: '#8898a8', wallHi: '#a8b8c0', wallShadow: '#607080', roofColor: '#307878', roofHi: '#48a098', roofShadow: '#205060', doorColor: '#405060', windowGlow: '#a0fff0', roofShape: 'pagoda', chimney: false },
  'Burning Desert': { width: 68, height: 50, wallColor: '#d4b888', wallHi: '#e8c8a0', wallShadow: '#a08060', roofColor: '#a87048', roofHi: '#c89060', roofShadow: '#784830', doorColor: '#684828', windowGlow: '#ffe098', roofShape: 'flat', chimney: false },
  'Thunder Peaks': { width: 56, height: 78, wallColor: '#686870', wallHi: '#808088', wallShadow: '#484850', roofColor: '#5a4840', roofHi: '#786050', roofShadow: '#3a2820', doorColor: '#4a4a4a', windowGlow: '#ffe8a0', roofShape: 'tower', chimney: true },
  'Frozen Palace': { width: 64, height: 76, wallColor: '#b8c8e0', wallHi: '#d0d8f0', wallShadow: '#8898b0', roofColor: '#90a8c8', roofHi: '#b0c8e0', roofShadow: '#6880a0', doorColor: '#708090', windowGlow: '#e0f0ff', roofShape: 'tower', chimney: false },
  'Void Throne': { width: 52, height: 84, wallColor: '#282840', wallHi: '#404060', wallShadow: '#181828', roofColor: '#382850', roofHi: '#584878', roofShadow: '#201838', doorColor: '#1a1a30', windowGlow: '#c0a0ff', roofShape: 'tower', chimney: false },
};

function pixel(ctx: CanvasRenderingContext2D, x: number, y: number, c: string): void {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, 1, 1);
}

function fillRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string): void {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

let seed = 0;
function rs(): number {
  seed = (seed * 16807 + 1) % 2147483647;
  return seed / 2147483647;
}
function rng(max: number): number { return Math.floor(rs() * max); }

export function resetStructureSeed(v: number): void { seed = v * 16807 + 1; }

export function drawTreeSprite(ctx: CanvasRenderingContext2D, style: TreeStyle): void {
  const { trunkW, trunkColor, trunkHi, trunkShadow, canopyColors, canopyShape, height, canopyH } = style;
  const cx = 32;
  const groundY = height;
  const trunkH = height - canopyH;
  const trunkTop = groundY - trunkH;

  // Trunk
  for (let y = trunkTop; y < groundY; y++) {
    const taper = 1 - (y - trunkTop) / trunkH * 0.2;
    const hw = Math.round(trunkW / 2 * taper);
    for (let x = cx - hw; x <= cx + hw; x++) {
      const c = x === cx - hw ? trunkHi : x === cx + hw ? trunkShadow : trunkColor;
      pixel(ctx, x, y, c);
    }
  }
  // Root base
  fillRect(ctx, cx - trunkW / 2, groundY - 3, trunkW, 4, trunkShadow);

  // Bark lines
  for (let i = 0; i < 8; i++) {
    const by = trunkTop + rng(trunkH - 8) + 4;
    const bx = cx - 3 + rng(6);
    pixel(ctx, bx, by, trunkShadow);
    pixel(ctx, bx + 1, by + 1, trunkShadow);
  }

  // Canopy
  if (canopyShape === 'round') {
    const clusters = [
      { x: cx, y: trunkTop - 10, r: 14 }, { x: cx - 8, y: trunkTop - 4, r: 10 },
      { x: cx + 9, y: trunkTop - 3, r: 11 }, { x: cx - 5, y: trunkTop + 4, r: 8 },
      { x: cx + 6, y: trunkTop + 5, r: 9 }, { x: cx, y: trunkTop + 8, r: 8 },
      { x: cx - 12, y: trunkTop + 2, r: 7 }, { x: cx + 13, y: trunkTop + 1, r: 7 },
    ];
    for (const cl of clusters) {
      for (let dy = -cl.r; dy < cl.r; dy++) {
        for (let dx = -cl.r; dx < cl.r; dx++) {
          if (dx * dx + dy * dy < cl.r * cl.r) {
            const x = cl.x + dx;
            const y = cl.y + dy;
            if (y < 0 || y >= height) continue;
            const d = Math.sqrt(dx * dx + dy * dy) / cl.r;
            const ci = Math.min(Math.floor(d * canopyColors.length), canopyColors.length - 1);
            const c = canopyColors[ci]!;
            if (rs() > 0.7) pixel(ctx, x, y, c);
            else {
              const dark = canopyColors[Math.min(ci + 1, canopyColors.length - 1)]!;
              pixel(ctx, x, y, dark);
            }
          }
        }
      }
    }
  } else if (canopyShape === 'pine') {
    for (let layer = 0; layer < 5; layer++) {
      const ly = trunkTop + 4 - layer * 9;
      const lw = 22 - layer * 3;
      for (let y = ly; y < ly + 10; y++) {
        const spread = lw * (1 - Math.abs(y - ly - 5) / 8);
        for (let x = cx - Math.round(spread); x <= cx + Math.round(spread); x++) {
          if (y < 0 || y >= height) continue;
          const ci = Math.min(layer + Math.floor(rs() * 1.5), canopyColors.length - 1);
          pixel(ctx, x, y, canopyColors[ci]!);
        }
      }
    }
  } else if (canopyShape === 'willow') {
    // Drooping branches from top
    for (let i = 0; i < 12; i++) {
      const bx = cx - 14 + rng(28);
      const by = trunkTop - 16 - rng(8);
      for (let d = 0; d < 14 + rng(18); d++) {
        const wx = bx + Math.round(Math.sin(d * 0.2 + i) * 3);
        const wy = by + d;
        if (wy < 0 || wy >= height) continue;
        const ci = Math.min(Math.floor(d / 8), canopyColors.length - 1);
        pixel(ctx, wx, wy, canopyColors[ci]!);
        if (d % 2 === 0) pixel(ctx, wx + 1, wy, canopyColors[Math.min(ci + 1, canopyColors.length - 1)]!);
      }
    }
  } else if (canopyShape === 'palm') {
    // Thin tall trunk, fronds at top
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2 + rs() * 0.4;
      const len = 12 + rng(10);
      for (let d = 0; d < len; d++) {
        const fx = cx + Math.round(Math.cos(angle) * d);
        const fy = trunkTop - Math.round(Math.sin(angle) * d * 0.6) - d * 0.4;
        if (fy < 0) continue;
        const ci = Math.min(Math.floor(d / 4), canopyColors.length - 1);
        pixel(ctx, fx, fy, canopyColors[ci]!);
      }
    }
    // Coconuts / center
    for (let i = 0; i < 4; i++) {
      pixel(ctx, cx - 2 + rng(5), trunkTop - 2 + rng(5), '#b89060');
    }
  } else if (canopyShape === 'dead') {
    // Bare branches
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI + rs() * 0.3;
      const len = 8 + rng(14);
      let bx = cx, by = trunkTop;
      for (let d = 0; d < len; d++) {
        const wx = bx + Math.round(Math.cos(angle + d * 0.15) * 1.5);
        const wy = by - Math.round(Math.sin(angle + d * 0.15) * 1.2) - d * 0.7;
        if (wy < 0) break;
        pixel(ctx, wx, wy, canopyColors[rng(canopyColors.length)]!);
        bx = wx; by = wy;
      }
    }
  } else if (canopyShape === 'crystal') {
    // Crystal shards at top
    for (let i = 0; i < 6; i++) {
      const sx = cx - 12 + rng(24);
      const sh = 8 + rng(16);
      for (let y = trunkTop - sh; y < trunkTop; y++) {
        const hw = Math.round((1 - (trunkTop - y) / sh) * 4);
        for (let x = sx - hw; x <= sx + hw; x++) {
          if (y < 0) continue;
          const ci = Math.min(y % canopyColors.length, canopyColors.length - 1);
          pixel(ctx, x, y, canopyColors[ci]!);
        }
      }
    }
  }
}

export function drawHouseSprite(ctx: CanvasRenderingContext2D, style: HouseStyle): void {
  const { width, height, wallColor, wallHi, wallShadow, roofColor, roofHi, roofShadow, doorColor, windowGlow, roofShape, chimney } = style;
  const cx = 40;
  const baseY = height;
  const wallH = roofShape === 'tower' ? height * 0.5 : height * 0.55;

  // Wall
  for (let y = baseY - wallH; y < baseY; y++) {
    const h = Math.floor(y / 4) % 2 === 0 ? wallColor : wallHi;
    fillRect(ctx, cx - width / 2 + 2, y, width - 4, 1, h);
  }
  // Wall outline
  fillRect(ctx, cx - width / 2, baseY - wallH, 2, wallH, wallShadow);
  fillRect(ctx, cx + width / 2 - 2, baseY - wallH, 2, wallH, wallShadow);
  fillRect(ctx, cx - width / 2, baseY - wallH, width, 2, wallHi);

  // Door
  const doorW = 10, doorH = 18;
  fillRect(ctx, cx - doorW / 2, baseY - doorH, doorW, doorH, doorColor);
  fillRect(ctx, cx - doorW / 2, baseY - doorH, doorW, 2, wallHi);
  // Door knob
  pixel(ctx, cx + doorW / 2 - 2, baseY - doorH / 2, '#d4a840');

  // Windows
  const winW = 6, winH = 6;
  for (const side of [-1, 1]) {
    const wx = cx + side * (width / 4 + 2);
    const wy = baseY - wallH * 0.65;
    fillRect(ctx, wx - winW / 2, wy - winH / 2, winW, winH, windowGlow);
    // Window frame
    fillRect(ctx, wx - winW / 2 - 1, wy - winH / 2 - 1, winW + 2, 1, wallShadow);
    fillRect(ctx, wx - winW / 2 - 1, wy + winH / 2, winW + 2, 1, wallShadow);
    fillRect(ctx, wx - winW / 2 - 1, wy - winH / 2, 1, winH, wallShadow);
    fillRect(ctx, wx + winW / 2, wy - winH / 2, 1, winH, wallShadow);
    // Cross pane
    fillRect(ctx, wx, wy - winH / 2, 1, winH, wallShadow);
    fillRect(ctx, wx - winW / 2, wy, winW, 1, wallShadow);
  }

  // Roof
  if (roofShape === 'slant') {
    for (let y = baseY - wallH - 16; y < baseY - wallH; y++) {
      const t = (y - (baseY - wallH - 16)) / 16;
      const hw = (width / 2 + 6) * (1 - t);
      fillRect(ctx, cx - Math.round(hw), y, Math.round(hw * 2), 1, roofColor);
      if ((y + 1) % 4 === 0) fillRect(ctx, cx - Math.round(hw), y, Math.round(hw * 2), 1, roofHi);
    }
    fillRect(ctx, cx - width / 2 - 6, baseY - wallH - 16, 2, 16, roofShadow);
    fillRect(ctx, cx + width / 2 + 4, baseY - wallH - 16, 2, 16, roofShadow);
  } else if (roofShape === 'flat') {
    fillRect(ctx, cx - width / 2 - 3, baseY - wallH - 3, width + 6, 5, roofColor);
    fillRect(ctx, cx - width / 2 - 3, baseY - wallH - 3, width + 6, 1, roofHi);
    fillRect(ctx, cx - width / 2 - 3, baseY - wallH + 1, width + 6, 1, roofShadow);
  } else if (roofShape === 'tower') {
    for (let y = baseY - wallH - 20; y < baseY - wallH; y++) {
      const t = (y - (baseY - wallH - 20)) / 20;
      const hw = (width / 2 + 2) * (1 - t);
      fillRect(ctx, cx - Math.round(hw), y, Math.round(hw * 2), 1, roofColor);
      if ((y + 2) % 5 === 0) fillRect(ctx, cx - Math.round(hw), y, Math.round(hw * 2), 1, roofHi);
    }
  } else if (roofShape === 'pagoda') {
    for (let tier = 0; tier < 3; tier++) {
      const ty = baseY - wallH - 6 - tier * 10;
      const tw = width - tier * 8;
      fillRect(ctx, cx - tw / 2, ty, tw, 5, roofColor);
      fillRect(ctx, cx - tw / 2, ty, tw, 1, roofHi);
      fillRect(ctx, cx - tw / 2, ty + 4, tw, 1, roofShadow);
      // Curved eaves
      fillRect(ctx, cx - tw / 2 - 2, ty + 2, 2, 3, roofHi);
      fillRect(ctx, cx + tw / 2, ty + 2, 2, 3, roofHi);
    }
  }

  // Chimney
  if (chimney) {
    fillRect(ctx, cx + width / 2 - 6, baseY - wallH - 22, 6, 24, '#605040');
    fillRect(ctx, cx + width / 2 - 6, baseY - wallH - 22, 6, 2, '#887868');
    // Smoke
    for (let i = 0; i < 4; i++) {
      const sx = cx + width / 2 - 3 + rng(8);
      const sy = baseY - wallH - 26 - i * 4;
      ctx.fillStyle = 'rgba(180,170,160,0.3)';
      ctx.beginPath();
      ctx.arc(sx, sy, 3 + rs() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

const STRUCTURE_TEXTURES = {
  tree: 'structure_tree',
  house: 'structure_house',
} as const;

function getStyle<T>(styles: Record<string, T>, key: string, fallback: string): T {
  return styles[key] ?? styles[fallback]!;
}

export function getBiomeTreeStyle(biomeName: string): TreeStyle {
  return getStyle(TREE_STYLES, biomeName, 'Fallen Village');
}

export function getBiomeHouseStyle(biomeName: string): HouseStyle {
  return getStyle(HOUSE_STYLES, biomeName, 'Fallen Village');
}

export function registerStructureTextures(scene: Phaser.Scene, biomeName: string): void {
  const treeStyle = getBiomeTreeStyle(biomeName);
  const houseStyle = getBiomeHouseStyle(biomeName);

  // Tree
  const treeCanvas = document.createElement('canvas');
  treeCanvas.width = 64;
  treeCanvas.height = treeStyle.height + 4;
  resetStructureSeed(1);
  drawTreeSprite(treeCanvas.getContext('2d')!, treeStyle);

  if (scene.textures.exists(STRUCTURE_TEXTURES.tree)) {
    scene.textures.remove(STRUCTURE_TEXTURES.tree);
  }
  scene.textures.addCanvas(STRUCTURE_TEXTURES.tree, treeCanvas);

  // House
  const houseCanvas = document.createElement('canvas');
  houseCanvas.width = 96;
  houseCanvas.height = houseStyle.height + 4;
  resetStructureSeed(2);
  drawHouseSprite(houseCanvas.getContext('2d')!, houseStyle);

  if (scene.textures.exists(STRUCTURE_TEXTURES.house)) {
    scene.textures.remove(STRUCTURE_TEXTURES.house);
  }
  scene.textures.addCanvas(STRUCTURE_TEXTURES.house, houseCanvas);
}

export { STRUCTURE_TEXTURES };