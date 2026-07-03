#!/usr/bin/env node
/**
 * Generates MVP map config stubs (reuse test-grove tileset until sub-plans 21–22).
 * Run: node tools/generate-map-stubs.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'content', 'maps');
mkdirSync(outDir, { recursive: true });

const REGIONS = [
  { slug: 'fallen_village', chapter: 1 },
  { slug: 'mist_forest', chapter: 2 },
  { slug: 'stone_canyon', chapter: 3 },
  { slug: 'moon_lake', chapter: 4 },
  { slug: 'burning_desert', chapter: 5 },
  { slug: 'thunder_peaks', chapter: 6 },
  { slug: 'frozen_palace', chapter: 7 },
  { slug: 'abyss_rift', chapter: 8 },
  { slug: 'heavenly_gate', chapter: 9 },
  { slug: 'void_throne', chapter: 10 },
];

const TEMPLATE = {
  tiledPath: 'assets/maps/test-grove.json',
  tilesetName: 'grove',
  spawn: { x: 320, y: 480 },
  bounds: { width: 1600, height: 1216 },
  connections: [],
  encounterTable: 'encounters.test',
  bgm: null,
  pois: [],
};

for (const region of REGIONS) {
  const chapterId = `chapter.${String(region.chapter).padStart(2, '0')}.${region.slug}`;
  const baseCp = 800 + (region.chapter - 1) * 900;
  const realmOrder = Math.min(7, 1 + Math.floor((region.chapter - 1) / 1.5));

  for (const stage of [1, 2]) {
    const mapId = `map.${region.slug}.${String(stage).padStart(2, '0')}`;
    const config = {
      id: mapId,
      chapterId,
      displayNameKey: `${mapId}.name`,
      ...TEMPLATE,
      recommendedCp: baseCp + (stage - 1) * 400,
      recommendedRealmOrder: realmOrder,
    };
    writeFileSync(join(outDir, `${mapId}.json`), `${JSON.stringify(config, null, 2)}\n`);
  }
}

console.log(`Wrote ${REGIONS.length * 2} map stubs to content/maps/`);
