#!/usr/bin/env node
/**
 * Generates assets/maps/test-grove.json — a Tiled-format orthogonal map used
 * until real Tiled authoring starts (sub-plan 06 §8).
 *
 * Layout: 50×38 tiles @ 32px. Grass field, dirt path, rock border walls,
 * one enclosed rock area with an opening, a water pond, bushes, tree canopies.
 *
 * Tile GIDs (tileset "grove", 8 tiles, 1 row):
 *   1 grass  2 grass-var  3 dirt  4 rock(collides)  5 bush
 *   6 trunk(collides)  7 canopy(foreground)  8 water(collides)
 *
 * Usage: node tools/generate-test-map.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WIDTH = 50;
const HEIGHT = 38;
const TILE = 32;

const G = { GRASS: 1, GRASS_VAR: 2, DIRT: 3, ROCK: 4, BUSH: 5, TRUNK: 6, CANOPY: 7, WATER: 8 };

// Deterministic PRNG so regeneration is stable in git diffs.
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(0xd40);

const idx = (x, y) => y * WIDTH + x;
const grid = () => new Array(WIDTH * HEIGHT).fill(0);

const ground = grid();
const decoration = grid();
const collision = grid();
const foreground = grid();

// --- ground: grass with variation ---
for (let y = 0; y < HEIGHT; y++) {
  for (let x = 0; x < WIDTH; x++) {
    ground[idx(x, y)] = rand() < 0.18 ? G.GRASS_VAR : G.GRASS;
  }
}

// --- dirt path: spawn area heading east, then north to the enclosure ---
for (let x = 6; x <= 40; x++) {
  for (let y = 14; y <= 16; y++) ground[idx(x, y)] = G.DIRT;
}
for (let y = 8; y <= 16; y++) {
  for (let x = 35; x <= 37; x++) ground[idx(x, y)] = G.DIRT;
}

// --- border walls (1 tile thick) ---
for (let x = 0; x < WIDTH; x++) {
  collision[idx(x, 0)] = G.ROCK;
  collision[idx(x, HEIGHT - 1)] = G.ROCK;
}
for (let y = 0; y < HEIGHT; y++) {
  collision[idx(0, y)] = G.ROCK;
  collision[idx(WIDTH - 1, y)] = G.ROCK;
}

// --- enclosed rock area (top-right) with a southern opening at x 35..37 ---
const enc = { x0: 30, y0: 3, x1: 44, y1: 8 };
for (let x = enc.x0; x <= enc.x1; x++) {
  collision[idx(x, enc.y0)] = G.ROCK;
  if (x < 35 || x > 37) collision[idx(x, enc.y1)] = G.ROCK;
}
for (let y = enc.y0; y <= enc.y1; y++) {
  collision[idx(enc.x0, y)] = G.ROCK;
  collision[idx(enc.x1, y)] = G.ROCK;
}

// --- water pond (bottom-left) ---
for (let y = 26; y <= 32; y++) {
  for (let x = 8; x <= 16; x++) {
    const oval =
      ((x - 12) / 4.5) ** 2 + ((y - 29) / 3.2) ** 2 <= 1;
    if (oval) {
      collision[idx(x, y)] = G.WATER;
      ground[idx(x, y)] = G.DIRT; // shore blends under water tile
    }
  }
}

// --- scattered trees (trunk collides, canopy renders above player) ---
const trees = [
  [5, 5], [12, 8], [22, 4], [45, 14], [42, 22], [24, 24],
  [33, 30], [44, 32], [6, 20], [18, 33], [28, 12],
];
for (const [tx, ty] of trees) {
  collision[idx(tx, ty)] = G.TRUNK;
  foreground[idx(tx, ty - 1)] = G.CANOPY;
  foreground[idx(tx - 1, ty - 1)] = G.CANOPY;
  foreground[idx(tx + 1, ty - 1)] = G.CANOPY;
  foreground[idx(tx, ty - 2)] = G.CANOPY;
}

// --- bushes (decoration only, no collision) ---
for (let i = 0; i < 60; i++) {
  const x = 2 + Math.floor(rand() * (WIDTH - 4));
  const y = 2 + Math.floor(rand() * (HEIGHT - 4));
  const clearOfPath = ground[idx(x, y)] !== G.DIRT;
  if (collision[idx(x, y)] === 0 && decoration[idx(x, y)] === 0 && clearOfPath) {
    decoration[idx(x, y)] = G.BUSH;
  }
}

// Keep the spawn tile and its neighbourhood clear (spawn = 320,480 → tile 10,15).
for (let y = 13; y <= 17; y++) {
  for (let x = 8; x <= 13; x++) {
    collision[idx(x, y)] = 0;
    decoration[idx(x, y)] = 0;
    foreground[idx(x, y)] = 0;
  }
}

// The collision layer is hidden at runtime — mirror its tiles onto the
// visible decoration layer so walls/water/trunks render.
for (let i = 0; i < collision.length; i++) {
  if (collision[i] !== 0) decoration[i] = collision[i];
}

function tileLayer(id, name, data, visible = true) {
  return {
    id,
    name,
    type: 'tilelayer',
    width: WIDTH,
    height: HEIGHT,
    x: 0,
    y: 0,
    opacity: 1,
    visible,
    data,
  };
}

const map = {
  type: 'map',
  version: '1.10',
  tiledversion: '1.10.2',
  orientation: 'orthogonal',
  renderorder: 'right-down',
  infinite: false,
  width: WIDTH,
  height: HEIGHT,
  tilewidth: TILE,
  tileheight: TILE,
  nextlayerid: 6,
  nextobjectid: 3,
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
    tileLayer(1, 'ground', ground),
    tileLayer(2, 'decoration', decoration),
    tileLayer(3, 'collision', collision, false),
    tileLayer(4, 'foreground', foreground),
    {
      id: 5,
      name: 'objects',
      type: 'objectgroup',
      x: 0,
      y: 0,
      opacity: 1,
      visible: true,
      objects: [
        { id: 1, name: 'spawn', type: 'spawn', x: 320, y: 480, width: 0, height: 0, point: true },
        { id: 2, name: 'exit_home', type: 'exit', x: 1472, y: 448, width: 96, height: 128 },
      ],
    },
  ],
};

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, '../assets/maps/test-grove.json');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(map));
console.log(`Wrote ${outPath} (${WIDTH}x${HEIGHT} tiles)`);
