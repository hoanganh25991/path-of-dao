/**
 * Procedural Tiled-format map builder (sub-plan 21).
 * Same 8-tile grove tileset as test-grove; region themes vary layout via seed.
 */

const TILE = 32;
/** Impassable outer rim — two tiles thick so the boundary reads clearly and blocks movement. */
export const WALL_THICK = 2;
const G = { GRASS: 1, GRASS_VAR: 2, DIRT: 3, ROCK: 4, BUSH: 5, TRUNK: 6, CANOPY: 7, WATER: 8 };
const LEGACY_W = 50;
const LEGACY_H = 38;

function areaScale(width, height, baseW = LEGACY_W, baseH = LEGACY_H) {
  return (width * height) / (baseW * baseH);
}

function scaledCount(base, width, height, baseW = LEGACY_W, baseH = LEGACY_H) {
  if (base <= 0) return 0;
  return Math.max(1, Math.round(base * areaScale(width, height, baseW, baseH)));
}

/** Tile coords covered by portal rectangles — carved out of the border wall. */
function collectPortalTiles(portals, width, height) {
  const portalTiles = new Set();
  for (const portal of portals) {
    const tx0 = Math.max(0, Math.floor(portal.x / TILE));
    const ty0 = Math.max(0, Math.floor(portal.y / TILE));
    const tx1 = Math.min(width - 1, Math.ceil((portal.x + portal.width) / TILE) - 1);
    const ty1 = Math.min(height - 1, Math.ceil((portal.y + portal.height) / TILE) - 1);
    for (let y = ty0; y <= ty1; y++) {
      for (let x = tx0; x <= tx1; x++) {
        portalTiles.add(`${x},${y}`);
      }
    }
  }
  return portalTiles;
}

function paintBorderWalls(collision, width, height, portalTiles = new Set(), wallThick = WALL_THICK) {
  for (let t = 0; t < wallThick; t++) {
    for (let x = 0; x < width; x++) {
      if (!portalTiles.has(`${x},${t}`)) collision[idx(width, x, t)] = G.ROCK;
      if (!portalTiles.has(`${x},${height - 1 - t}`)) collision[idx(width, x, height - 1 - t)] = G.ROCK;
    }
    for (let y = 0; y < height; y++) {
      if (!portalTiles.has(`${t},${y}`)) collision[idx(width, t, y)] = G.ROCK;
      if (!portalTiles.has(`${width - 1 - t},${y}`)) collision[idx(width, width - 1 - t, y)] = G.ROCK;
    }
  }
}

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const idx = (w, x, y) => y * w + x;
const grid = (w, h) => new Array(w * h).fill(0);

/**
 * @param {object} opts
 * @param {number} [opts.width=50]
 * @param {number} [opts.height=38]
 * @param {number} opts.seed
 * @param {'village'|'forest'|'canyon'|'lake'|'desert'|'thunder'|'frozen'|'abyss'|'celestial'|'void'} opts.theme
 * @param {boolean} [opts.bossArena=false]
 */
export function buildTiledMap({ width = 50, height = 38, seed, theme, bossArena = false }) {
  const rand = mulberry32(seed);
  const ground = grid(width, height);
  const decoration = grid(width, height);
  const collision = grid(width, height);
  const foreground = grid(width, height);

  const grassVarChance = {
    village: 0.15, forest: 0.35, canyon: 0.1, lake: 0.25, desert: 0.08,
    thunder: 0.1, frozen: 0.2, abyss: 0.42, celestial: 0.12, void: 0.05,
  }[theme] ?? 0.15;
  const dirtBias = {
    village: 0.25, forest: 0.08, canyon: 0.12, lake: 0.1, desert: 0.45,
    thunder: 0.22, frozen: 0.08, abyss: 0.18, celestial: 0.16, void: 0.38,
  }[theme] ?? 0.15;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rand() < dirtBias) ground[idx(width, x, y)] = G.DIRT;
      else ground[idx(width, x, y)] = rand() < grassVarChance ? G.GRASS_VAR : G.GRASS;
    }
  }

  const spawnTileX = Math.max(WALL_THICK + 2, Math.floor(width * 0.2));
  const spawnTileY = Math.max(WALL_THICK + 2, Math.floor(height * 0.395));
  const pathY0 = spawnTileY - 1;
  const pathY1 = spawnTileY + 1;

  // Main path east from spawn
  for (let x = WALL_THICK + 2; x <= width - WALL_THICK - 4; x++) {
    for (let y = pathY0; y <= pathY1; y++) ground[idx(width, x, y)] = G.DIRT;
  }
  const branchY0 = Math.max(WALL_THICK + 2, Math.floor(height * 0.21));
  for (let y = branchY0; y <= spawnTileY; y++) {
    for (let x = width - WALL_THICK - 6; x <= width - WALL_THICK - 4; x++) {
      ground[idx(width, x, y)] = G.DIRT;
    }
  }

  paintBorderWalls(collision, width, height);

  // Theme features
  if (theme === 'lake' || theme === 'forest' || theme === 'frozen') {
    const cx = Math.floor(width * (theme === 'lake' ? 0.24 : theme === 'frozen' ? 0.4 : 0.56));
    const cy = Math.floor(height * (theme === 'lake' ? 0.74 : theme === 'frozen' ? 0.63 : 0.58));
    for (let y = cy - 4; y <= cy + 4; y++) {
      for (let x = cx - 5; x <= cx + 5; x++) {
        if (x < WALL_THICK || y < WALL_THICK || x >= width - WALL_THICK || y >= height - WALL_THICK) continue;
        const oval = ((x - cx) / 5) ** 2 + ((y - cy) / 4) ** 2 <= 1;
        if (oval) {
          collision[idx(width, x, y)] = G.WATER;
          ground[idx(width, x, y)] = G.DIRT;
        }
      }
    }
  }

  const rockThemes = { canyon: 8, desert: 4, thunder: 12, abyss: 6, void: 10, celestial: 2, frozen: 2 };
  const rockCount = scaledCount(rockThemes[theme] ?? 0, width, height);
  if (rockCount > 0) {
    for (let i = 0; i < rockCount; i++) {
      const rx = WALL_THICK + 2 + Math.floor(rand() * (width - (WALL_THICK + 2) * 2));
      const ry = WALL_THICK + 2 + Math.floor(rand() * (height - (WALL_THICK + 2) * 2));
      const span = theme === 'void' ? 5 : 4;
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < span; dx++) {
          collision[idx(width, rx + dx, ry + dy)] = G.ROCK;
        }
      }
    }
  }

  if (theme === 'abyss' || theme === 'void') {
    for (let i = 0; i < scaledCount(6, width, height); i++) {
      const x = WALL_THICK + 2 + Math.floor(rand() * (width - (WALL_THICK + 2) * 2));
      const y = WALL_THICK + 2 + Math.floor(rand() * (height - (WALL_THICK + 2) * 2));
      ground[idx(width, x, y)] = G.GRASS_VAR;
    }
  }

  if (bossArena) {
    const enc = {
      x0: width - Math.max(18, Math.floor(width * 0.36)),
      y0: WALL_THICK + 2,
      x1: width - WALL_THICK - 4,
      y1: Math.max(WALL_THICK + 8, Math.floor(height * 0.32)),
    };
    const gapX = width - Math.max(14, Math.floor(width * 0.28));
    for (let x = enc.x0; x <= enc.x1; x++) {
      collision[idx(width, x, enc.y0)] = G.ROCK;
      if (x < gapX || x > gapX + 2) collision[idx(width, x, enc.y1)] = G.ROCK;
    }
    for (let y = enc.y0; y <= enc.y1; y++) {
      collision[idx(width, enc.x0, y)] = G.ROCK;
      collision[idx(width, enc.x1, y)] = G.ROCK;
    }
  }

  const treeCount = scaledCount(
    {
      village: 8, forest: 14, canyon: 6, lake: 10, desert: 4,
      thunder: 3, frozen: 6, abyss: 12, celestial: 7, void: 2,
    }[theme] ?? 8,
    width,
    height,
  );
  for (let i = 0; i < treeCount; i++) {
    const tx = WALL_THICK + 1 + Math.floor(rand() * (width - (WALL_THICK + 1) * 2));
    const ty = WALL_THICK + 1 + Math.floor(rand() * (height - (WALL_THICK + 1) * 2));
    if (ground[idx(width, tx, ty)] === G.DIRT) continue;
    if (collision[idx(width, tx, ty)] !== 0) continue;
    collision[idx(width, tx, ty)] = G.TRUNK;
    foreground[idx(width, tx, ty - 1)] = G.CANOPY;
    foreground[idx(width, tx - 1, ty - 1)] = G.CANOPY;
    foreground[idx(width, tx + 1, ty - 1)] = G.CANOPY;
    foreground[idx(width, tx, ty - 2)] = G.CANOPY;
  }

  for (let i = 0; i < scaledCount(50, width, height); i++) {
    const x = WALL_THICK + 1 + Math.floor(rand() * (width - (WALL_THICK + 1) * 2));
    const y = WALL_THICK + 1 + Math.floor(rand() * (height - (WALL_THICK + 1) * 2));
    if (collision[idx(width, x, y)] === 0 && decoration[idx(width, x, y)] === 0) {
      decoration[idx(width, x, y)] = G.BUSH;
    }
  }

  // Spawn safe zone
  for (let y = spawnTileY - 2; y <= spawnTileY + 2; y++) {
    for (let x = spawnTileX - 2; x <= spawnTileX + 3; x++) {
      collision[idx(width, x, y)] = 0;
      decoration[idx(width, x, y)] = 0;
      foreground[idx(width, x, y)] = 0;
    }
  }

  for (let i = 0; i < collision.length; i++) {
    if (collision[i] !== 0) decoration[i] = collision[i];
  }

  const spawnX = spawnTileX * TILE;
  const spawnY = spawnTileY * TILE;
  const exitX = (width - WALL_THICK - 4) * TILE;
  const exitY = pathY0 * TILE;
  const waveX = Math.floor(width * 0.5) * TILE;
  const waveY = spawnTileY * TILE;

  return {
    type: 'map',
    version: '1.10',
    tiledversion: '1.10.2',
    orientation: 'orthogonal',
    renderorder: 'right-down',
    infinite: false,
    width,
    height,
    tilewidth: TILE,
    tileheight: TILE,
    nextlayerid: 6,
    nextobjectid: 4,
    tilesets: [
      {
        firstgid: 1,
        name: 'grove',
        tilewidth: TILE,
        tileheight: TILE,
        tilecount: 8,
        columns: 8,
        spacing: 0,
        margin: 0,
        image: 'grove.png',
        imagewidth: 256,
        imageheight: 32,
      },
    ],
    layers: [
      tileLayer(1, 'ground', ground, width, height),
      tileLayer(2, 'decoration', decoration, width, height),
      tileLayer(3, 'collision', collision, width, height, false),
      tileLayer(4, 'foreground', foreground, width, height),
      {
        id: 5,
        name: 'objects',
        type: 'objectgroup',
        x: 0,
        y: 0,
        opacity: 1,
        visible: true,
        objects: [
          { id: 1, name: 'spawn', type: 'spawn', x: spawnX, y: spawnY, width: 0, height: 0, point: true },
          { id: 2, name: 'exit_home', type: 'exit', x: exitX, y: exitY, width: 96, height: 128 },
          { id: 3, name: 'wave_center', type: 'encounter', x: waveX, y: waveY, width: 0, height: 0, point: true },
        ],
      },
    ],
  };
}

function tileLayer(id, name, data, width, height, visible = true) {
  return {
    id,
    name,
    type: 'tilelayer',
    width,
    height,
    x: 0,
    y: 0,
    opacity: 1,
    visible,
    data,
  };
}

export { TILE };

/**
 * Large Tu Chân Tinh sub-zone (~25× legacy footprint). Peaceful paths, portal gaps, roam markers.
 *
 * @param {object} opts
 * @param {number} [opts.width=250]
 * @param {number} [opts.height=190]
 * @param {number} opts.seed
 * @param {'village'|'forest'|'canyon'|'lake'|'desert'|'thunder'|'frozen'|'abyss'|'celestial'|'void'} opts.theme
 * @param {Array<{id:string,x:number,y:number,width:number,height:number}>} [opts.portals=[]]
 * @param {boolean} [opts.includeExit=false]
 * @param {{x:number,y:number}} [opts.spawn]
 */
export function buildStarZoneMap({
  width = 250,
  height = 190,
  seed,
  theme,
  portals = [],
  includeExit = false,
  spawn,
}) {
  const rand = mulberry32(seed);
  const ground = grid(width, height);
  const decoration = grid(width, height);
  const collision = grid(width, height);
  const foreground = grid(width, height);

  const grassVarChance = {
    village: 0.12, forest: 0.35, canyon: 0.1, lake: 0.25, desert: 0.08,
    thunder: 0.1, frozen: 0.2, abyss: 0.42, celestial: 0.12, void: 0.05,
  }[theme] ?? 0.15;
  const dirtBias = {
    village: 0.22, forest: 0.08, canyon: 0.12, lake: 0.1, desert: 0.45,
    thunder: 0.22, frozen: 0.08, abyss: 0.18, celestial: 0.16, void: 0.38,
  }[theme] ?? 0.15;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rand() < dirtBias) ground[idx(width, x, y)] = G.DIRT;
      else ground[idx(width, x, y)] = rand() < grassVarChance ? G.GRASS_VAR : G.GRASS;
    }
  }

  // Wandering paths — horizontal + vertical meanders for peaceful exploration
  for (let x = WALL_THICK + 4; x < width - WALL_THICK - 4; x++) {
    const pathY = Math.floor(height * 0.45 + Math.sin(x * 0.08) * 6);
    for (let dy = -1; dy <= 1; dy++) {
      const y = pathY + dy;
      if (y > WALL_THICK && y < height - WALL_THICK - 1) ground[idx(width, x, y)] = G.DIRT;
    }
  }
  for (let y = WALL_THICK + 4; y < height - WALL_THICK - 4; y++) {
    const pathX = Math.floor(width * 0.35 + Math.cos(y * 0.06) * 8);
    for (let dx = -1; dx <= 1; dx++) {
      const x = pathX + dx;
      if (x > WALL_THICK && x < width - WALL_THICK - 1) ground[idx(width, x, y)] = G.DIRT;
    }
  }

  const portalTiles = collectPortalTiles(portals, width, height);
  paintBorderWalls(collision, width, height, portalTiles);

  const STAR_BASE_W = 250;
  const STAR_BASE_H = 190;
  const treeCount = scaledCount(
    {
      village: 28, forest: 48, canyon: 18, lake: 32, desert: 14,
      thunder: 10, frozen: 22, abyss: 36, celestial: 20, void: 8,
    }[theme] ?? 24,
    width,
    height,
    STAR_BASE_W,
    STAR_BASE_H,
  );

  for (let i = 0; i < treeCount; i++) {
    const tx = WALL_THICK + 2 + Math.floor(rand() * (width - (WALL_THICK + 2) * 2));
    const ty = WALL_THICK + 2 + Math.floor(rand() * (height - (WALL_THICK + 2) * 2));
    if (ground[idx(width, tx, ty)] === G.DIRT) continue;
    if (collision[idx(width, tx, ty)] !== 0) continue;
    collision[idx(width, tx, ty)] = G.TRUNK;
    foreground[idx(width, tx, ty - 1)] = G.CANOPY;
    foreground[idx(width, tx - 1, ty - 1)] = G.CANOPY;
    foreground[idx(width, tx + 1, ty - 1)] = G.CANOPY;
    foreground[idx(width, tx, ty - 2)] = G.CANOPY;
  }

  for (let i = 0; i < scaledCount(120, width, height, STAR_BASE_W, STAR_BASE_H); i++) {
    const x = WALL_THICK + 1 + Math.floor(rand() * (width - (WALL_THICK + 1) * 2));
    const y = WALL_THICK + 1 + Math.floor(rand() * (height - (WALL_THICK + 1) * 2));
    if (collision[idx(width, x, y)] === 0 && decoration[idx(width, x, y)] === 0) {
      decoration[idx(width, x, y)] = G.BUSH;
    }
  }

  const spawnX = spawn?.x ?? Math.floor(width * 0.15) * TILE;
  const spawnY = spawn?.y ?? Math.floor(height * 0.5) * TILE;
  for (let y = Math.floor(spawnY / TILE) - 2; y <= Math.floor(spawnY / TILE) + 2; y++) {
    for (let x = Math.floor(spawnX / TILE) - 2; x <= Math.floor(spawnX / TILE) + 2; x++) {
      if (x < WALL_THICK || y < WALL_THICK || x >= width - WALL_THICK || y >= height - WALL_THICK) continue;
      collision[idx(width, x, y)] = 0;
      decoration[idx(width, x, y)] = 0;
      foreground[idx(width, x, y)] = 0;
    }
  }

  for (let i = 0; i < collision.length; i++) {
    if (collision[i] !== 0) decoration[i] = collision[i];
  }

  const objects = [
    { id: 1, name: 'spawn', type: 'spawn', x: spawnX, y: spawnY, width: 0, height: 0, point: true },
  ];

  let nextId = 2;
  for (const portal of portals) {
    objects.push({
      id: nextId++,
      name: portal.id,
      type: 'portal',
      x: portal.x,
      y: portal.y,
      width: portal.width,
      height: portal.height,
    });
  }

  if (includeExit) {
    const exitX = (width - WALL_THICK - 8) * TILE;
    const exitY = Math.floor(height * 0.48) * TILE;
    objects.push({
      id: nextId++,
      name: 'exit_home',
      type: 'exit',
      x: exitX,
      y: exitY,
      width: 96,
      height: 128,
    });
  }

  return {
    type: 'map',
    version: '1.10',
    tiledversion: '1.10.2',
    orientation: 'orthogonal',
    renderorder: 'right-down',
    infinite: false,
    width,
    height,
    tilewidth: TILE,
    tileheight: TILE,
    nextlayerid: 6,
    nextobjectid: nextId,
    tilesets: [
      {
        firstgid: 1,
        name: 'grove',
        tilewidth: TILE,
        tileheight: TILE,
        tilecount: 8,
        columns: 8,
        spacing: 0,
        margin: 0,
        image: 'grove.png',
        imagewidth: 256,
        imageheight: 32,
      },
    ],
    layers: [
      tileLayer(1, 'ground', ground, width, height),
      tileLayer(2, 'decoration', decoration, width, height),
      tileLayer(3, 'collision', collision, width, height, false),
      tileLayer(4, 'foreground', foreground, width, height),
      { id: 5, name: 'objects', type: 'objectgroup', x: 0, y: 0, opacity: 1, visible: true, objects },
    ],
  };
}
