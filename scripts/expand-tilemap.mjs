import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Expand a Tiled JSON tilemap to a target width/height (in tiles).
 * Pads tile layers by repeating the existing pattern and adjusts
 * object positions proportionally.
 */

const TILE = 32;

function expandData(oldData, oldW, oldH, newW, newH) {
  const out = new Array(newW * newH);
  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < newW; x++) {
      const sx = x % oldW;
      const sy = y % oldH;
      out[y * newW + x] = oldData[sy * oldW + sx];
    }
  }
  return out;
}

function expandMap(inputPath, outputPath, newW, newH) {
  const raw = readFileSync(inputPath, 'utf-8');
  const map = JSON.parse(raw);

  const oldW = map.width;
  const oldH = map.height;
  if (oldW === newW && oldH === newH) {
    console.log(`  SKIP ${inputPath}: already ${newW}x${newH}`);
    return;
  }

  const scaleX = newW / oldW;
  const scaleY = newH / oldH;

  map.width = newW;
  map.height = newH;

  for (const layer of map.layers) {
    if (layer.type === 'tilelayer' && Array.isArray(layer.data)) {
      layer.data = expandData(layer.data, oldW, oldH, newW, newH);
      layer.width = newW;
      layer.height = newH;
    }
    if (layer.type === 'objectgroup' && Array.isArray(layer.objects)) {
      for (const obj of layer.objects) {
        if (typeof obj.x === 'number') obj.x = Math.round(obj.x * scaleX);
        if (typeof obj.y === 'number') obj.y = Math.round(obj.y * scaleY);
        if (typeof obj.width === 'number') obj.width = Math.round(obj.width * scaleX);
        if (typeof obj.height === 'number') obj.height = Math.round(obj.height * scaleY);
      }
    }
  }

  writeFileSync(outputPath, JSON.stringify(map), 'utf-8');
  console.log(`  ${inputPath} -> ${outputPath}: ${oldW}x${oldH} -> ${newW}x${newH}`);
}

// Chapter → tile size progression (starting from ch1 map 02 which is currently 50x38)
// Map 01 is 250x190 (8000x6080) — already done, skip
// Map 02 (boss) same size as map 01
const chapterSizes = [
  { chapter: 1, tilesW: 250, tilesH: 190 },  // boss map of ch1, same as map 01
  { chapter: 2, tilesW: 300, tilesH: 228 },
  { chapter: 3, tilesW: 350, tilesH: 266 },
  { chapter: 4, tilesW: 400, tilesH: 304 },
  { chapter: 5, tilesW: 450, tilesH: 342 },
  { chapter: 6, tilesW: 500, tilesH: 380 },
  { chapter: 7, tilesW: 550, tilesH: 418 },
  { chapter: 8, tilesW: 600, tilesH: 456 },
  { chapter: 9, tilesW: 650, tilesH: 494 },
  { chapter: 10, tilesW: 700, tilesH: 532 },
];

const mapsDir = resolve(import.meta.dirname ?? '.', '..', 'assets', 'maps');

const mapFiles = {
  'chapter.01': ['fallen_village-02.json'],
  'chapter.02': ['mist_forest-01.json', 'mist_forest-02.json'],
  'chapter.03': ['stone_canyon-01.json', 'stone_canyon-02.json'],
  'chapter.04': ['moon_lake-01.json', 'moon_lake-02.json'],
  'chapter.05': ['burning_desert-01.json', 'burning_desert-02.json'],
  'chapter.06': ['thunder_peaks-01.json', 'thunder_peaks-02.json'],
  'chapter.07': ['frozen_palace-01.json', 'frozen_palace-02.json'],
  'chapter.08': ['abyss_rift-01.json', 'abyss_rift-02.json'],
  'chapter.09': ['heavenly_gate-01.json', 'heavenly_gate-02.json'],
  'chapter.10': ['void_throne-01.json', 'void_throne-02.json'],
};

for (const { chapter, tilesW, tilesH } of chapterSizes) {
  const files = mapFiles[`chapter.${String(chapter).padStart(2, '0')}`];
  if (!files) continue;
  console.log(`Chapter ${chapter}: ${tilesW}x${tilesH} tiles (${tilesW * TILE}x${tilesH * TILE}px)`);
  for (const filename of files) {
    const inputPath = resolve(mapsDir, filename);
    expandMap(inputPath, inputPath, tilesW, tilesH);
  }
}

console.log('\nDone. Now update content/maps/*.json bounds to match.');