#!/usr/bin/env node
/**
 * Generates the Fallen Village Tu Chân Tinh — 4 sub-zones (~100× legacy footprint).
 * Run: node tools/generate-star-fallen-village.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildStarZoneMap, TILE, WALL_THICK } from './lib/tiled-map-builder.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'assets', 'maps');
const mapsDir = join(root, 'content', 'maps');
const roamDir = join(root, 'content', 'roam');
const enemiesDir = join(root, 'content', 'enemies');

mkdirSync(assetsDir, { recursive: true });
mkdirSync(mapsDir, { recursive: true });
mkdirSync(roamDir, { recursive: true });
mkdirSync(enemiesDir, { recursive: true });

const W = 250;
const H = 190;
const PW = W * TILE;
const PH = H * TILE;

const PORTAL_W = 64;
const PORTAL_H = 96;

function edgePortal(id, edge, align = 0.5) {
  const along = (edge === 'east' || edge === 'west') ? H : W;
  const pos = Math.floor(along * align) * TILE;
  const portalSpan = (edge === 'east' || edge === 'west') ? PORTAL_H : PORTAL_W;
  const portalBreadth = (edge === 'east' || edge === 'west') ? PORTAL_W : PORTAL_H;
  if (edge === 'east') {
    return { id, x: (W - WALL_THICK) * TILE, y: pos - Math.floor(portalSpan / 2), width: portalBreadth, height: portalSpan };
  }
  if (edge === 'west') {
    return { id, x: WALL_THICK * TILE, y: pos - Math.floor(portalSpan / 2), width: portalBreadth, height: portalSpan };
  }
  if (edge === 'north') {
    return { id, x: pos - Math.floor(portalSpan / 2), y: WALL_THICK * TILE, width: portalSpan, height: portalBreadth };
  }
  return { id, x: pos - Math.floor(portalSpan / 2), y: (H - WALL_THICK) * TILE, width: portalSpan, height: portalBreadth };
}

const ZONES = [
  {
    mapId: 'map.fallen_village.01',
    asset: 'fallen_village-star-west.json',
    zoneId: 'zone.village_west',
    seed: 101,
    portals: [
      edgePortal('portal.east', 'east', 0.48),
      edgePortal('portal.south', 'south', 0.35),
    ],
    includeExit: true,
    portalSpawns: {
      'portal.west': { x: (WALL_THICK + 1) * TILE, y: Math.floor(H * 0.48) * TILE },
    },
    roamSpawns: [
      { enemyId: 'enemy.slime', x: 1200, y: 2800, patrolRadius: 72 },
      { enemyId: 'enemy.slime', x: 2400, y: 3200, patrolRadius: 64 },
      { enemyId: 'enemy.village.scavenger', x: 1800, y: 4200, patrolRadius: 80 },
      { enemyId: 'enemy.village.scavenger', x: 3200, y: 3600, patrolRadius: 70 },
      { enemyId: 'enemy.wolf', x: 4200, y: 2800, patrolRadius: 90 },
      { enemyId: 'enemy.slime', x: 5200, y: 4400, patrolRadius: 60 },
      { enemyId: 'enemy.village.spirit_pest', x: 2800, y: 5200, patrolRadius: 55 },
      { enemyId: 'enemy.wolf', x: 6000, y: 5200, patrolRadius: 85 },
    ],
    configPortals: [
      { id: 'portal.east', targetMapId: 'map.fallen_village.01.east', targetPortalId: 'portal.west' },
      { id: 'portal.south', targetMapId: 'map.fallen_village.01.south', targetPortalId: 'portal.north' },
    ],
  },
  {
    mapId: 'map.fallen_village.01.east',
    asset: 'fallen_village-star-east.json',
    zoneId: 'zone.village_east',
    seed: 102,
    portals: [
      edgePortal('portal.west', 'west', 0.48),
      edgePortal('portal.north', 'north', 0.55),
    ],
    portalSpawns: {
      'portal.west': { x: (WALL_THICK + 1) * TILE, y: Math.floor(H * 0.48) * TILE },
      'portal.south': { x: Math.floor(W * 0.55) * TILE, y: (H - WALL_THICK - 2) * TILE },
    },
    roamSpawns: [
      { enemyId: 'enemy.wolf', x: 2000, y: 3000, patrolRadius: 80 },
      { enemyId: 'enemy.wolf', x: 3800, y: 2600, patrolRadius: 75 },
      { enemyId: 'enemy.village.spirit_pest', x: 5200, y: 3400, patrolRadius: 65 },
      { enemyId: 'enemy.bandit.thug', x: 6400, y: 4200, patrolRadius: 70 },
      { enemyId: 'enemy.village.scavenger', x: 4400, y: 4800, patrolRadius: 72 },
      { enemyId: 'enemy.slime', x: 2800, y: 4400, patrolRadius: 60 },
      { enemyId: 'enemy.wolf', x: 7000, y: 3000, patrolRadius: 90 },
    ],
    configPortals: [
      { id: 'portal.west', targetMapId: 'map.fallen_village.01', targetPortalId: 'portal.east' },
      { id: 'portal.north', targetMapId: 'map.fallen_village.01.north', targetPortalId: 'portal.south' },
    ],
  },
  {
    mapId: 'map.fallen_village.01.north',
    asset: 'fallen_village-star-north.json',
    zoneId: 'zone.village_north',
    seed: 103,
    portals: [
      edgePortal('portal.south', 'south', 0.55),
      edgePortal('portal.west', 'west', 0.4),
    ],
    portalSpawns: {
      'portal.south': { x: Math.floor(W * 0.55) * TILE, y: (H - WALL_THICK - 2) * TILE },
      'portal.west': { x: (WALL_THICK + 1) * TILE, y: Math.floor(H * 0.4) * TILE },
    },
    roamSpawns: [
      { enemyId: 'enemy.bandit.thug', x: 2200, y: 3200, patrolRadius: 80 },
      { enemyId: 'enemy.bandit.thug', x: 4000, y: 2800, patrolRadius: 75 },
      { enemyId: 'enemy.wolf', x: 5600, y: 3600, patrolRadius: 85 },
      { enemyId: 'enemy.village.scavenger', x: 3400, y: 4600, patrolRadius: 70 },
      { enemyId: 'enemy.village.spirit_pest', x: 6200, y: 4800, patrolRadius: 60 },
      { enemyId: 'enemy.slime', x: 4800, y: 5200, patrolRadius: 55 },
    ],
    configPortals: [
      { id: 'portal.south', targetMapId: 'map.fallen_village.01.east', targetPortalId: 'portal.north' },
      { id: 'portal.west', targetMapId: 'map.fallen_village.01.south', targetPortalId: 'portal.east' },
    ],
  },
  {
    mapId: 'map.fallen_village.01.south',
    asset: 'fallen_village-star-south.json',
    zoneId: 'zone.village_south',
    seed: 104,
    portals: [
      edgePortal('portal.north', 'north', 0.35),
      edgePortal('portal.east', 'east', 0.42),
    ],
    portalSpawns: {
      'portal.north': { x: Math.floor(W * 0.35) * TILE, y: (WALL_THICK + 1) * TILE },
      'portal.west': { x: (WALL_THICK + 1) * TILE, y: Math.floor(H * 0.42) * TILE },
    },
    roamSpawns: [
      { enemyId: 'enemy.slime', x: 1600, y: 3400, patrolRadius: 65 },
      { enemyId: 'enemy.village.spirit_pest', x: 3000, y: 4000, patrolRadius: 70 },
      { enemyId: 'enemy.village.scavenger', x: 4600, y: 3200, patrolRadius: 75 },
      { enemyId: 'enemy.wolf', x: 5800, y: 4400, patrolRadius: 80 },
      { enemyId: 'enemy.slime', x: 7200, y: 3600, patrolRadius: 60 },
    ],
    configPortals: [
      { id: 'portal.north', targetMapId: 'map.fallen_village.01', targetPortalId: 'portal.south' },
      { id: 'portal.east', targetMapId: 'map.fallen_village.01.north', targetPortalId: 'portal.west' },
    ],
  },
];

for (const zone of ZONES) {
  const tiled = buildStarZoneMap({
    width: W,
    height: H,
    seed: zone.seed,
    theme: 'village',
    portals: zone.portals,
    includeExit: zone.includeExit ?? false,
  });
  writeFileSync(join(assetsDir, zone.asset), JSON.stringify(tiled, null, 2));

  const mapConfig = {
    id: zone.mapId,
    chapterId: 'chapter.01.fallen_village',
    displayNameKey: zone.mapId === 'map.fallen_village.01'
      ? 'map.fallen_village.01.name'
      : `map.${zone.zoneId}.name`,
    starId: 'star.fallen_village',
    zoneId: zone.zoneId,
    tiledPath: `assets/maps/${zone.asset}`,
    tilesetName: 'grove',
    spawn: { x: Math.floor(W * 0.15) * TILE, y: Math.floor(H * 0.5) * TILE },
    bounds: { width: PW, height: PH },
    connections: [],
    encounterTable: null,
    roamTable: `roam.${zone.mapId.replace('map.', '')}`,
    spawnMode: 'roam',
    portals: zone.configPortals,
    portalSpawns: zone.portalSpawns,
    bgm: 'bgm.combat.fallen_village',
    pois: [],
    recommendedCp: 800,
    recommendedRealmOrder: 1,
  };
  writeFileSync(join(mapsDir, `${zone.mapId}.json`), JSON.stringify(mapConfig, null, 2) + '\n');
}

for (const zone of ZONES) {
  const roamId = `roam.${zone.mapId.replace('map.', '')}`;
  writeFileSync(
    join(roamDir, `${roamId}.json`),
    JSON.stringify({ id: roamId, spawns: zone.roamSpawns }, null, 2) + '\n',
  );
}

// New low-level enemies for the ruined village star
writeFileSync(
  join(enemiesDir, 'enemy.village.scavenger.json'),
  JSON.stringify(
    {
      id: 'enemy.village.scavenger',
      displayNameKey: 'enemy.village.scavenger.name',
      archetype: 'patrol',
      stats: { hpMax: 35, atk: 7, def: 2, speed: 65, crit: 0.04, critDmg: 1.4 },
      aggroRange: 180,
      attackRange: 34,
      attackCooldownMs: 1300,
      xpReward: 12,
      goldReward: [1, 4],
      lootTable: 'loot.tier.common',
      spriteKey: 'enemy_slime',
      category: 'grunt',
      bestiaryKey: 'bestiary.enemy_village_scavenger.desc',
      weakness: 'spirit',
      resistance: 'none',
    },
    null,
    2,
  ) + '\n',
);

writeFileSync(
  join(enemiesDir, 'enemy.village.spirit_pest.json'),
  JSON.stringify(
    {
      id: 'enemy.village.spirit_pest',
      displayNameKey: 'enemy.village.spirit_pest.name',
      archetype: 'patrol',
      stats: { hpMax: 28, atk: 9, def: 1, speed: 90, crit: 0.06, critDmg: 1.5 },
      aggroRange: 160,
      attackRange: 32,
      attackCooldownMs: 1000,
      xpReward: 10,
      goldReward: [0, 3],
      lootTable: 'loot.tier.common',
      spriteKey: 'enemy_slime',
      category: 'grunt',
      bestiaryKey: 'bestiary.enemy_village_spirit_pest.desc',
      weakness: 'spirit',
      resistance: 'none',
    },
    null,
    2,
  ) + '\n',
);

console.log('Generated Fallen Village star: 4 zones, roam tables, 2 new enemies.');
