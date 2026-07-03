#!/usr/bin/env node
/**
 * Generates MVP content for chapters 6–10 (sub-plan 22 basics).
 * Run: node tools/generate-mvp-chapters-6-10.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTiledMap, TILE } from './lib/tiled-map-builder.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'assets', 'maps');
const mapsDir = join(root, 'content', 'maps');
const enemiesDir = join(root, 'content', 'enemies');
const encountersDir = join(root, 'content', 'encounters');

mkdirSync(assetsDir, { recursive: true });
mkdirSync(mapsDir, { recursive: true });
mkdirSync(enemiesDir, { recursive: true });
mkdirSync(encountersDir, { recursive: true });

const CHAPTERS = [
  {
    slug: 'thunder_peaks',
    chapter: 6,
    theme: 'thunder',
    cp: [45000, 60000],
    pois: [[{ type: 'hidden_cave', x: 800, y: 520, radius: 40, id: 'cave.thunder_peaks' }], []],
  },
  {
    slug: 'frozen_palace',
    chapter: 7,
    theme: 'frozen',
    cp: [75000, 95000],
    pois: [[], []],
  },
  {
    slug: 'abyss_rift',
    chapter: 8,
    theme: 'abyss',
    cp: [120000, 150000],
    pois: [[{ type: 'hidden_cave', x: 560, y: 640, radius: 40, id: 'cave.abyss_rift' }], []],
  },
  {
    slug: 'heavenly_gate',
    chapter: 9,
    theme: 'celestial',
    cp: [180000, 220000],
    pois: [[], []],
  },
  {
    slug: 'void_throne',
    chapter: 10,
    theme: 'void',
    cp: [260000, 320000],
    pois: [[{ type: 'hidden_cave', x: 1120, y: 400, radius: 44, id: 'cave.void_throne' }], []],
    large: true,
  },
];

const ENCOUNTERS = {
  'encounter.thunder_peaks.01': {
    waves: [{
      trigger: 'onEnter',
      enemies: [
        { id: 'enemy.storm.hawk', count: 4, spread: 140 },
        { id: 'enemy.lightning.sprite', count: 3, spread: 120 },
      ],
    }],
  },
  'encounter.thunder_peaks.02': {
    waves: [
      { trigger: 'onEnter', enemies: [{ id: 'enemy.elite.storm', count: 2, spread: 100 }] },
      { trigger: 'onWaveCleared', enemies: [{ id: 'boss.thunder_avatar', count: 1, spread: 0 }] },
    ],
  },
  'encounter.frozen_palace.01': {
    waves: [{
      trigger: 'onEnter',
      enemies: [
        { id: 'enemy.ice.golem', count: 4, spread: 130 },
        { id: 'enemy.frost.shade', count: 3, spread: 150 },
      ],
    }],
  },
  'encounter.frozen_palace.02': {
    waves: [
      { trigger: 'onEnter', enemies: [{ id: 'enemy.elite.frost', count: 2, spread: 110 }] },
      { trigger: 'onWaveCleared', enemies: [{ id: 'boss.frost_queen', count: 1, spread: 0 }] },
    ],
  },
  'encounter.abyss_rift.01': {
    waves: [{
      trigger: 'onEnter',
      enemies: [
        { id: 'enemy.rift.spawn', count: 5, spread: 140 },
        { id: 'enemy.corrupted.cultist', count: 3, spread: 160 },
      ],
    }],
  },
  'encounter.abyss_rift.02': {
    waves: [
      { trigger: 'onEnter', enemies: [{ id: 'enemy.elite.rift', count: 2, spread: 100 }] },
      { trigger: 'onWaveCleared', enemies: [{ id: 'boss.rift_horror', count: 1, spread: 0 }] },
    ],
  },
  'encounter.heavenly_gate.01': {
    waves: [{
      trigger: 'onEnter',
      enemies: [
        { id: 'enemy.celestial.archer', count: 4, spread: 150 },
        { id: 'enemy.gate.sentinel', count: 3, spread: 130 },
      ],
    }],
  },
  'encounter.heavenly_gate.02': {
    waves: [
      { trigger: 'onEnter', enemies: [{ id: 'enemy.elite.celestial', count: 2, spread: 100 }] },
      { trigger: 'onWaveCleared', enemies: [{ id: 'boss.celestial_guardian', count: 1, spread: 0 }] },
    ],
  },
  'encounter.void_throne.01': {
    waves: [{
      trigger: 'onEnter',
      enemies: [
        { id: 'enemy.void.shade', count: 4, spread: 120 },
        { id: 'enemy.void.weaver', count: 2, spread: 90 },
      ],
    }],
  },
  'encounter.void_throne.02': {
    waves: [
      { trigger: 'onEnter', enemies: [{ id: 'enemy.void.shade', count: 3, spread: 100 }] },
      { trigger: 'onWaveCleared', enemies: [{ id: 'boss.void_sovereign', count: 1, spread: 0 }] },
    ],
  },
};

function grunt(ch, tier, archetype, spriteKey, overrides = {}) {
  const scale = 3 + (ch - 6) * 0.85 + (tier - 1) * 0.4;
  const hp = Math.round(80 * scale);
  const atk = Math.round(14 * scale);
  const def = Math.round(6 * scale);
  const speed = archetype === 'stationary' ? 0 : archetype === 'ranged_kiter' ? 85 + ch * 4 : 75 + ch * 6;
  return {
    stats: { hpMax: hp, atk, def, speed, crit: 0.08 + ch * 0.015, critDmg: 1.6 },
    aggroRange: 200 + ch * 25,
    attackRange: archetype === 'ranged_kiter' ? 180 + ch * 12 : archetype === 'stationary' ? 100 : 40 + ch * 5,
    attackCooldownMs: archetype === 'ranged_kiter' ? 1400 : archetype === 'stationary' ? 2000 : 1000,
    xpReward: Math.round(40 * scale),
    goldReward: [ch * 2, ch * 8],
    lootTable: null,
    spriteKey,
    archetype,
    ...overrides,
  };
}

function elite(ch, slug, archetype, spriteKey) {
  const g = grunt(ch, 2, archetype, spriteKey);
  g.stats.hpMax = Math.round(g.stats.hpMax * 1.6);
  g.stats.atk = Math.round(g.stats.atk * 1.3);
  g.xpReward = Math.round(g.xpReward * 1.5);
  return {
    id: `enemy.elite.${slug}`,
    displayNameKey: `enemy.elite.${slug}.name`,
    ...g,
  };
}

function boss(id, displayKey, hp, atk, def, speed, xp, gold) {
  return {
    id,
    displayNameKey: displayKey,
    archetype: 'boss',
    stats: { hpMax: hp, atk, def, speed, crit: 0.16, critDmg: 2.1 },
    aggroRange: 360,
    attackRange: id === 'boss.celestial_guardian' ? 200 : 56,
    attackCooldownMs: 1200,
    xpReward: xp,
    goldReward: gold,
    lootTable: null,
    spriteKey: 'enemy_totem',
    bossClearId: id,
  };
}

const ENEMIES = {
  'enemy.storm.hawk': { id: 'enemy.storm.hawk', displayNameKey: 'enemy.storm.hawk.name', ...grunt(6, 1, 'ranged_kiter', 'enemy_archer') },
  'enemy.lightning.sprite': { id: 'enemy.lightning.sprite', displayNameKey: 'enemy.lightning.sprite.name', ...grunt(6, 1, 'melee_chaser', 'enemy_slime') },
  'enemy.ice.golem': { id: 'enemy.ice.golem', displayNameKey: 'enemy.ice.golem.name', ...grunt(7, 1, 'melee_chaser', 'enemy_slime') },
  'enemy.frost.shade': { id: 'enemy.frost.shade', displayNameKey: 'enemy.frost.shade.name', ...grunt(7, 1, 'ranged_kiter', 'enemy_archer') },
  'enemy.rift.spawn': { id: 'enemy.rift.spawn', displayNameKey: 'enemy.rift.spawn.name', ...grunt(8, 1, 'melee_chaser', 'enemy_slime') },
  'enemy.corrupted.cultist': { id: 'enemy.corrupted.cultist', displayNameKey: 'enemy.corrupted.cultist.name', ...grunt(8, 1, 'ranged_kiter', 'enemy_archer') },
  'enemy.celestial.archer': { id: 'enemy.celestial.archer', displayNameKey: 'enemy.celestial.archer.name', ...grunt(9, 1, 'ranged_kiter', 'enemy_archer') },
  'enemy.gate.sentinel': { id: 'enemy.gate.sentinel', displayNameKey: 'enemy.gate.sentinel.name', ...grunt(9, 1, 'patrol', 'enemy_archer') },
  'enemy.void.shade': { id: 'enemy.void.shade', displayNameKey: 'enemy.void.shade.name', ...grunt(10, 1, 'melee_chaser', 'enemy_slime') },
  'enemy.void.weaver': { id: 'enemy.void.weaver', displayNameKey: 'enemy.void.weaver.name', ...grunt(10, 1, 'stationary', 'enemy_totem') },
  'enemy.elite.storm': elite(6, 'storm', 'melee_chaser', 'enemy_slime'),
  'enemy.elite.frost': elite(7, 'frost', 'melee_chaser', 'enemy_slime'),
  'enemy.elite.rift': elite(8, 'rift', 'ranged_kiter', 'enemy_archer'),
  'enemy.elite.celestial': elite(9, 'celestial', 'patrol', 'enemy_archer'),
  'boss.thunder_avatar': boss('boss.thunder_avatar', 'boss.thunder_avatar.name', 2400, 52, 24, 80, 800, [80, 200]),
  'boss.frost_queen': boss('boss.frost_queen', 'boss.frost_queen.name', 3200, 58, 28, 65, 1100, [100, 260]),
  'boss.rift_horror': boss('boss.rift_horror', 'boss.rift_horror.name', 4200, 64, 32, 70, 1400, [120, 320]),
  'boss.celestial_guardian': boss('boss.celestial_guardian', 'boss.celestial_guardian.name', 5400, 72, 38, 75, 1800, [150, 400]),
  'boss.void_sovereign': boss('boss.void_sovereign', 'boss.void_sovereign.name', 8000, 88, 48, 68, 2500, [200, 500]),
};

let mapCount = 0;
let encounterCount = 0;
let enemyCount = 0;

for (const ch of CHAPTERS) {
  const chapterId = `chapter.${String(ch.chapter).padStart(2, '0')}.${ch.slug}`;
  const realmOrder = Math.min(7, 1 + Math.floor((ch.chapter - 1) / 1.5));
  const mapW = ch.large ? 56 : 50;
  const mapH = ch.large ? 42 : 38;

  for (let stageIdx = 0; stageIdx < 2; stageIdx++) {
    const stage = String(stageIdx + 1).padStart(2, '0');
    const mapId = `map.${ch.slug}.${stage}`;
    const tiledName = `${ch.slug}-${stage}`;
    const isBoss = stageIdx === 1;
    const seed = ch.chapter * 1000 + stageIdx * 23 + 91;

    const tiled = buildTiledMap({
      width: mapW,
      height: mapH,
      seed,
      theme: ch.theme,
      bossArena: isBoss,
    });

    writeFileSync(join(assetsDir, `${tiledName}.json`), JSON.stringify(tiled));

    const encounterId = `encounter.${ch.slug}.${stage}`;
    const config = {
      id: mapId,
      chapterId,
      displayNameKey: `${mapId}.name`,
      tiledPath: `assets/maps/${tiledName}.json`,
      tilesetName: 'grove',
      spawn: { x: 10 * TILE, y: 15 * TILE },
      bounds: { width: mapW * TILE, height: mapH * TILE },
      connections: [],
      encounterTable: encounterId,
      bgm: null,
      pois: ch.pois[stageIdx],
      recommendedCp: ch.cp[stageIdx],
      recommendedRealmOrder: realmOrder,
    };
    writeFileSync(join(mapsDir, `${mapId}.json`), `${JSON.stringify(config, null, 2)}\n`);
    mapCount++;
  }
}

for (const [id, data] of Object.entries(ENCOUNTERS)) {
  writeFileSync(join(encountersDir, `${id}.json`), `${JSON.stringify({ id, ...data }, null, 2)}\n`);
  encounterCount++;
}

for (const [fileId, data] of Object.entries(ENEMIES)) {
  writeFileSync(join(enemiesDir, `${fileId}.json`), `${JSON.stringify(data, null, 2)}\n`);
  enemyCount++;
}

console.log(`Wrote ${mapCount} map configs + tiled assets, ${encounterCount} encounters, ${enemyCount} enemies`);
