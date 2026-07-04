import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TILE = 32;
const chScale = [0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

const mapsDir = resolve(import.meta.dirname ?? '.', '..', 'content', 'maps');

const mapFiles = [
  'map.fallen_village.02.json',
  'map.mist_forest.01.json',
  'map.mist_forest.02.json',
  'map.stone_canyon.01.json',
  'map.stone_canyon.02.json',
  'map.moon_lake.01.json',
  'map.moon_lake.02.json',
  'map.burning_desert.01.json',
  'map.burning_desert.02.json',
  'map.thunder_peaks.01.json',
  'map.thunder_peaks.02.json',
  'map.frozen_palace.01.json',
  'map.frozen_palace.02.json',
  'map.abyss_rift.01.json',
  'map.abyss_rift.02.json',
  'map.heavenly_gate.01.json',
  'map.heavenly_gate.02.json',
  'map.void_throne.01.json',
  'map.void_throne.02.json',
];

for (const filename of mapFiles) {
  const path = resolve(mapsDir, filename);
  const config = JSON.parse(readFileSync(path, 'utf-8'));

  const chMatch = config.chapterId?.match(/chapter\.(\d+)/);
  if (!chMatch) {
    console.log(`  SKIP ${filename}: cannot parse chapterId`);
    continue;
  }
  const ch = parseInt(chMatch[1], 10);
  const scale = chScale[ch];
  if (!scale) {
    console.log(`  SKIP ${filename}: no scale for ch${ch}`);
    continue;
  }

  const oldW = config.bounds.width;
  const oldH = config.bounds.height;
  const newW = 50 * scale * TILE;
  const newH = 38 * scale * TILE;

  if (oldW === newW && oldH === newH) {
    console.log(`  SKIP ${filename}: already ${newW}x${newH}`);
    continue;
  }

  config.bounds.width = newW;
  config.bounds.height = newH;

  if (config.spawn) {
    config.spawn.x = Math.round(config.spawn.x * scale);
    config.spawn.y = Math.round(config.spawn.y * scale);
  }

  if (config.pois) {
    for (const poi of config.pois) {
      poi.x = Math.round(poi.x * scale);
      poi.y = Math.round(poi.y * scale);
      if (poi.radius) poi.radius = Math.round(poi.radius * scale);
    }
  }

  writeFileSync(path, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  console.log(`  ${filename}: ${oldW}x${oldH} -> ${newW}x${newH} (ch${ch}, ${scale}x)`);
}

console.log('\nDone.');