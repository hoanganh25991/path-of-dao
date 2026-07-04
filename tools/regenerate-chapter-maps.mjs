#!/usr/bin/env node
/**
 * Regenerates chapter combat maps at progressive sizes using procedural layout.
 * Replaces the old expand-tilemap modulo loop (which tiled 50×38 chunks visibly).
 *
 * Run: node tools/regenerate-chapter-maps.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTiledMap, TILE } from './lib/tiled-map-builder.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'assets', 'maps');
const mapsDir = join(root, 'content', 'maps');

const LEGACY_PX_W = 50 * TILE;
const LEGACY_PX_H = 38 * TILE;

/** Chapter → tile size for explore (01) and ordeal (02) maps. */
const CHAPTER_LAYOUT = [
  { chapter: 1, slug: 'fallen_village', theme: 'village', tilesW: 250, tilesH: 190, cp: [800, 1500] },
  { chapter: 2, slug: 'mist_forest', theme: 'forest', tilesW: 300, tilesH: 228, cp: [2500, 4000] },
  { chapter: 3, slug: 'stone_canyon', theme: 'canyon', tilesW: 350, tilesH: 266, cp: [6000, 9000] },
  { chapter: 4, slug: 'moon_lake', theme: 'lake', tilesW: 400, tilesH: 304, cp: [12000, 18000] },
  { chapter: 5, slug: 'burning_desert', theme: 'desert', tilesW: 450, tilesH: 342, cp: [25000, 35000] },
  { chapter: 6, slug: 'thunder_peaks', theme: 'thunder', tilesW: 500, tilesH: 380, cp: [45000, 65000] },
  { chapter: 7, slug: 'frozen_palace', theme: 'frozen', tilesW: 550, tilesH: 418, cp: [80000, 120000] },
  { chapter: 8, slug: 'abyss_rift', theme: 'abyss', tilesW: 600, tilesH: 456, cp: [150000, 220000] },
  { chapter: 9, slug: 'heavenly_gate', theme: 'celestial', tilesW: 650, tilesH: 494, cp: [280000, 400000] },
  { chapter: 10, slug: 'void_throne', theme: 'void', tilesW: 700, tilesH: 532, cp: [500000, 750000] },
];

function scalePoi(poi, tilesW, tilesH) {
  const xFrac = poi.x / LEGACY_PX_W;
  const yFrac = poi.y / LEGACY_PX_H;
  return {
    ...poi,
    x: Math.floor(tilesW * xFrac) * TILE,
    y: Math.floor(tilesH * yFrac) * TILE,
  };
}

function spawnFromTiled(tiled) {
  const spawn = tiled.layers
    .find((layer) => layer.name === 'objects')
    ?.objects.find((obj) => obj.type === 'spawn');
  return { x: spawn?.x ?? 0, y: spawn?.y ?? 0 };
}

for (const ch of CHAPTER_LAYOUT) {
  const chapterId = `chapter.${String(ch.chapter).padStart(2, '0')}.${ch.slug}`;
  const realmOrder = Math.min(7, 1 + Math.floor((ch.chapter - 1) / 1.5));

  for (let stageIdx = 0; stageIdx < 2; stageIdx++) {
    const stage = String(stageIdx + 1).padStart(2, '0');
    const mapId = `map.${ch.slug}.${stage}`;
    const tiledName = `${ch.slug}-${stage}`;
    const configPath = join(mapsDir, `${mapId}.json`);

    // Chapter 1 explore uses the star-domain generator — only regenerate ordeal + ch2+.
    if (ch.chapter === 1 && stageIdx === 0) continue;

    const existing = JSON.parse(readFileSync(configPath, 'utf-8'));
    const isBoss = stageIdx === 1;
    const seed = ch.chapter * 1000 + stageIdx * 17 + 42;

    const tiled = buildTiledMap({
      width: ch.tilesW,
      height: ch.tilesH,
      seed,
      theme: ch.theme,
      bossArena: isBoss,
    });

    writeFileSync(join(assetsDir, `${tiledName}.json`), JSON.stringify(tiled));
    const spawn = spawnFromTiled(tiled);

    const updated = {
      ...existing,
      spawn,
      bounds: { width: ch.tilesW * TILE, height: ch.tilesH * TILE },
      recommendedCp: ch.cp[stageIdx],
      recommendedRealmOrder: realmOrder,
      chapterId,
      pois: (existing.pois ?? []).map((poi) => scalePoi(poi, ch.tilesW, ch.tilesH)),
    };

    writeFileSync(configPath, `${JSON.stringify(updated, null, 2)}\n`);
    console.log(`  ${mapId}: ${ch.tilesW}×${ch.tilesH} (${updated.bounds.width}×${updated.bounds.height}px)`);
  }
}

console.log('\nDone — chapter maps regenerated procedurally (no 50×38 tiling).');
