/**
 * Procedural Tiled-format map builder (sub-plan 21).
 * Same 8-tile grove tileset as test-grove; region themes vary layout via seed.
 */

const TILE = 32;
const G = { GRASS: 1, GRASS_VAR: 2, DIRT: 3, ROCK: 4, BUSH: 5, TRUNK: 6, CANOPY: 7, WATER: 8 };

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

  // Main path east from spawn (tile ~10,15)
  for (let x = 6; x <= width - 10; x++) {
    for (let y = 14; y <= 16; y++) ground[idx(width, x, y)] = G.DIRT;
  }
  for (let y = 8; y <= 16; y++) {
    for (let x = width - 15; x <= width - 13; x++) ground[idx(width, x, y)] = G.DIRT;
  }

  // Border walls
  for (let x = 0; x < width; x++) {
    collision[idx(width, x, 0)] = G.ROCK;
    collision[idx(width, x, height - 1)] = G.ROCK;
  }
  for (let y = 0; y < height; y++) {
    collision[idx(width, 0, y)] = G.ROCK;
    collision[idx(width, width - 1, y)] = G.ROCK;
  }

  // Theme features
  if (theme === 'lake' || theme === 'forest' || theme === 'frozen') {
    const cx = theme === 'lake' ? 12 : theme === 'frozen' ? 20 : 28;
    const cy = theme === 'lake' ? 28 : theme === 'frozen' ? 24 : 22;
    for (let y = cy - 4; y <= cy + 4; y++) {
      for (let x = cx - 5; x <= cx + 5; x++) {
        if (x < 1 || y < 1 || x >= width - 1 || y >= height - 1) continue;
        const oval = ((x - cx) / 5) ** 2 + ((y - cy) / 4) ** 2 <= 1;
        if (oval) {
          collision[idx(width, x, y)] = G.WATER;
          ground[idx(width, x, y)] = G.DIRT;
        }
      }
    }
  }

  const rockThemes = { canyon: 8, desert: 4, thunder: 12, abyss: 6, void: 10, celestial: 2, frozen: 2 };
  const rockCount = rockThemes[theme] ?? 0;
  if (rockCount > 0) {
    for (let i = 0; i < rockCount; i++) {
      const rx = 8 + Math.floor(rand() * (width - 16));
      const ry = 4 + Math.floor(rand() * (height - 12));
      const span = theme === 'void' ? 5 : 4;
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < span; dx++) {
          collision[idx(width, rx + dx, ry + dy)] = G.ROCK;
        }
      }
    }
  }

  if (theme === 'abyss' || theme === 'void') {
    for (let i = 0; i < 6; i++) {
      const x = 10 + Math.floor(rand() * (width - 20));
      const y = 6 + Math.floor(rand() * (height - 14));
      ground[idx(width, x, y)] = G.GRASS_VAR;
    }
  }

  if (bossArena) {
    const enc = { x0: width - 18, y0: 4, x1: width - 6, y1: 12 };
    const gapX = width - 14;
    for (let x = enc.x0; x <= enc.x1; x++) {
      collision[idx(width, x, enc.y0)] = G.ROCK;
      if (x < gapX || x > gapX + 2) collision[idx(width, x, enc.y1)] = G.ROCK;
    }
    for (let y = enc.y0; y <= enc.y1; y++) {
      collision[idx(width, enc.x0, y)] = G.ROCK;
      collision[idx(width, enc.x1, y)] = G.ROCK;
    }
  }

  const treeCount = {
    village: 8, forest: 14, canyon: 6, lake: 10, desert: 4,
    thunder: 3, frozen: 6, abyss: 12, celestial: 7, void: 2,
  }[theme] ?? 8;
  for (let i = 0; i < treeCount; i++) {
    const tx = 3 + Math.floor(rand() * (width - 6));
    const ty = 3 + Math.floor(rand() * (height - 6));
    if (ground[idx(width, tx, ty)] === G.DIRT) continue;
    if (collision[idx(width, tx, ty)] !== 0) continue;
    collision[idx(width, tx, ty)] = G.TRUNK;
    foreground[idx(width, tx, ty - 1)] = G.CANOPY;
    foreground[idx(width, tx - 1, ty - 1)] = G.CANOPY;
    foreground[idx(width, tx + 1, ty - 1)] = G.CANOPY;
    foreground[idx(width, tx, ty - 2)] = G.CANOPY;
  }

  for (let i = 0; i < 50; i++) {
    const x = 2 + Math.floor(rand() * (width - 4));
    const y = 2 + Math.floor(rand() * (height - 4));
    if (collision[idx(width, x, y)] === 0 && decoration[idx(width, x, y)] === 0) {
      decoration[idx(width, x, y)] = G.BUSH;
    }
  }

  // Spawn safe zone (tile 10,15 → 320,480)
  for (let y = 13; y <= 17; y++) {
    for (let x = 8; x <= 13; x++) {
      collision[idx(width, x, y)] = 0;
      decoration[idx(width, x, y)] = 0;
      foreground[idx(width, x, y)] = 0;
    }
  }

  for (let i = 0; i < collision.length; i++) {
    if (collision[i] !== 0) decoration[i] = collision[i];
  }

  const spawnX = 10 * TILE;
  const spawnY = 15 * TILE;
  const exitX = (width - 6) * TILE;
  const exitY = 14 * TILE;
  const waveX = Math.floor(width * 0.5) * TILE;
  const waveY = 15 * TILE;

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
