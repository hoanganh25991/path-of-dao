#!/usr/bin/env node
/**
 * Generates MVP content for chapters 1–5 (sub-plan 21 basics).
 * Run: node tools/generate-mvp-chapters-1-5.mjs
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
    slug: 'fallen_village',
    chapter: 1,
    theme: 'village',
    cp: [800, 1500],
    pois: [
      [],
      [{ type: 'ancient_sword', x: 720, y: 560, radius: 36, id: 'sword.fallen_village' }],
    ],
  },
  {
    slug: 'mist_forest',
    chapter: 2,
    theme: 'forest',
    cp: [2500, 4000],
    pois: [[], []],
  },
  {
    slug: 'stone_canyon',
    chapter: 3,
    theme: 'canyon',
    cp: [6000, 9000],
    pois: [
      [{ type: 'hidden_cave', x: 640, y: 640, radius: 40, id: 'cave.stone_canyon' }],
      [],
    ],
  },
  {
    slug: 'moon_lake',
    chapter: 4,
    theme: 'lake',
    cp: [12000, 18000],
    pois: [
      [{ type: 'hidden_cave', x: 480, y: 720, radius: 40, id: 'cave.moon_lake' }],
      [],
    ],
  },
  {
    slug: 'burning_desert',
    chapter: 5,
    theme: 'desert',
    cp: [25000, 35000],
    pois: [
      [{ type: 'hidden_cave', x: 960, y: 480, radius: 40, id: 'cave.burning_desert' }],
      [],
    ],
  },
];

const ENCOUNTERS = {
  'encounter.fallen_village.01': {
    waves: [{ trigger: 'onEnter', enemies: [{ id: 'enemy.slime', count: 3, spread: 100 }, { id: 'enemy.wolf', count: 2, spread: 120 }] }],
  },
  'encounter.fallen_village.02': {
    waves: [
      { trigger: 'onEnter', enemies: [{ id: 'enemy.bandit.thug', count: 4, spread: 140 }] },
      { trigger: 'onWaveCleared', enemies: [{ id: 'boss.jade_guardian', count: 1, spread: 0 }] },
    ],
  },
  'encounter.mist_forest.01': {
    waves: [{ trigger: 'onEnter', enemies: [{ id: 'enemy.spirit.wisp', count: 4, spread: 130 }, { id: 'enemy.spirit.moth', count: 3, spread: 160 }] }],
  },
  'encounter.mist_forest.02': {
    waves: [
      { trigger: 'onEnter', enemies: [{ id: 'enemy.spirit.wisp', count: 3, spread: 120 }] },
      { trigger: 'onWaveCleared', enemies: [{ id: 'boss.mist_stalker', count: 1, spread: 0 }] },
    ],
  },
  'encounter.stone_canyon.01': {
    waves: [{ trigger: 'onEnter', enemies: [{ id: 'enemy.guard.patrol', count: 5, spread: 150 }] }],
  },
  'encounter.stone_canyon.02': {
    waves: [
      { trigger: 'onEnter', enemies: [{ id: 'enemy.bandit.thug', count: 3, spread: 120 }, { id: 'enemy.bandit.archer', count: 2, spread: 160 }] },
      { trigger: 'onWaveCleared', enemies: [{ id: 'boss.bandit_lord', count: 1, spread: 0 }] },
    ],
  },
  'encounter.moon_lake.01': {
    waves: [{ trigger: 'onEnter', enemies: [{ id: 'enemy.water.sprite', count: 5, spread: 140 }] }],
  },
  'encounter.moon_lake.02': {
    waves: [
      { trigger: 'onEnter', enemies: [{ id: 'enemy.cultist.acolyte', count: 4, spread: 130 }] },
      { trigger: 'onWaveCleared', enemies: [{ id: 'boss.seal_warden', count: 1, spread: 0 }] },
    ],
  },
  'encounter.burning_desert.01': {
    waves: [{ trigger: 'onEnter', enemies: [{ id: 'enemy.scorpion', count: 4, spread: 120 }, { id: 'enemy.sand.wisp', count: 3, spread: 150 }] }],
  },
  'encounter.burning_desert.02': {
    waves: [
      { trigger: 'onEnter', enemies: [{ id: 'enemy.sand.spirit', count: 3, spread: 100 }] },
      { trigger: 'onWaveCleared', enemies: [{ id: 'boss.desert_sovereign', count: 1, spread: 0 }] },
    ],
  },
};

function grunt(ch, tier, archetype, spriteKey, overrides = {}) {
  const scale = 1 + (ch - 1) * 0.55 + (tier - 1) * 0.25;
  const hp = Math.round(40 * scale);
  const atk = Math.round(8 * scale);
  const def = Math.round(2 * scale);
  const speed = archetype === 'stationary' ? 0 : archetype === 'ranged_kiter' ? 75 + ch * 5 : 65 + ch * 8;
  return {
    stats: { hpMax: hp, atk, def, speed, crit: 0.05 + ch * 0.02, critDmg: 1.5 },
    aggroRange: 180 + ch * 20,
    attackRange: archetype === 'ranged_kiter' ? 160 + ch * 15 : archetype === 'stationary' ? 90 : 36 + ch * 4,
    attackCooldownMs: archetype === 'ranged_kiter' ? 1600 : archetype === 'stationary' ? 2200 : 1100,
    xpReward: Math.round(12 * scale),
    goldReward: [Math.max(1, ch), Math.max(3, ch * 3)],
    lootTable: null,
    spriteKey,
    archetype,
    ...overrides,
  };
}

const ENEMIES = {
  'enemy.wolf': { id: 'enemy.wolf', displayNameKey: 'enemy.wolf.name', ...grunt(1, 1, 'melee_chaser', 'enemy_slime') },
  'enemy.bandit.thug': { id: 'enemy.bandit.thug', displayNameKey: 'enemy.bandit.thug.name', ...grunt(1, 2, 'melee_chaser', 'enemy_slime', { stats: { hpMax: 55, atk: 12, def: 3, speed: 80, crit: 0.08, critDmg: 1.5 } }) },
  'enemy.spirit.moth': { id: 'enemy.spirit.moth', displayNameKey: 'enemy.spirit.moth.name', ...grunt(2, 1, 'ranged_kiter', 'enemy_archer') },
  'enemy.spirit.wisp': { id: 'enemy.spirit.wisp', displayNameKey: 'enemy.spirit.wisp.name', ...grunt(2, 1, 'melee_chaser', 'enemy_slime') },
  'enemy.guard.patrol': { id: 'enemy.guard.patrol', displayNameKey: 'enemy.guard.patrol.name', ...grunt(3, 1, 'patrol', 'enemy_archer') },
  'enemy.bandit.archer': { id: 'enemy.bandit.archer', displayNameKey: 'enemy.bandit.archer.name', ...grunt(3, 2, 'ranged_kiter', 'enemy_archer') },
  'enemy.water.sprite': { id: 'enemy.water.sprite', displayNameKey: 'enemy.water.sprite.name', ...grunt(4, 1, 'ranged_kiter', 'enemy_archer') },
  'enemy.cultist.acolyte': { id: 'enemy.cultist.acolyte', displayNameKey: 'enemy.cultist.acolyte.name', ...grunt(4, 2, 'melee_chaser', 'enemy_slime') },
  'enemy.scorpion': { id: 'enemy.scorpion', displayNameKey: 'enemy.scorpion.name', ...grunt(5, 1, 'melee_chaser', 'enemy_slime') },
  'enemy.sand.wisp': { id: 'enemy.sand.wisp', displayNameKey: 'enemy.sand.wisp.name', ...grunt(5, 1, 'ranged_kiter', 'enemy_archer') },
  'enemy.sand.spirit': { id: 'enemy.sand.spirit', displayNameKey: 'enemy.sand.spirit.name', ...grunt(5, 2, 'stationary', 'enemy_totem') },
  'boss.jade_guardian': {
    id: 'boss.jade_guardian',
    displayNameKey: 'boss.jade_guardian.name',
    archetype: 'boss',
    stats: { hpMax: 320, atk: 18, def: 8, speed: 55, crit: 0.1, critDmg: 1.8 },
    aggroRange: 280,
    attackRange: 48,
    attackCooldownMs: 1400,
    xpReward: 120,
    goldReward: [15, 40],
    lootTable: null,
    spriteKey: 'enemy_totem',
    bossClearId: 'boss.jade_guardian',
  },
  'boss.mist_stalker': {
    id: 'boss.mist_stalker',
    displayNameKey: 'boss.mist_stalker.name',
    archetype: 'boss',
    stats: { hpMax: 480, atk: 22, def: 10, speed: 95, crit: 0.12, critDmg: 1.8 },
    aggroRange: 300,
    attackRange: 44,
    attackCooldownMs: 1200,
    xpReward: 180,
    goldReward: [20, 55],
    lootTable: null,
    spriteKey: 'enemy_totem',
    bossClearId: 'boss.mist_stalker',
  },
  'boss.bandit_lord': {
    id: 'boss.bandit_lord',
    displayNameKey: 'boss.bandit_lord.name',
    archetype: 'boss',
    stats: { hpMax: 720, atk: 28, def: 14, speed: 70, crit: 0.15, critDmg: 2 },
    aggroRange: 300,
    attackRange: 52,
    attackCooldownMs: 1100,
    xpReward: 260,
    goldReward: [30, 80],
    lootTable: null,
    spriteKey: 'enemy_totem',
    bossClearId: 'boss.bandit_lord',
  },
  'boss.seal_warden': {
    id: 'boss.seal_warden',
    displayNameKey: 'boss.seal_warden.name',
    archetype: 'boss',
    stats: { hpMax: 980, atk: 32, def: 18, speed: 60, crit: 0.12, critDmg: 1.9 },
    aggroRange: 320,
    attackRange: 180,
    attackCooldownMs: 1500,
    xpReward: 340,
    goldReward: [40, 100],
    lootTable: null,
    spriteKey: 'enemy_totem',
    bossClearId: 'boss.seal_warden',
  },
  'boss.desert_sovereign': {
    id: 'boss.desert_sovereign',
    displayNameKey: 'boss.desert_sovereign.name',
    archetype: 'boss',
    stats: { hpMax: 1280, atk: 38, def: 22, speed: 65, crit: 0.14, critDmg: 2 },
    aggroRange: 340,
    attackRange: 56,
    attackCooldownMs: 1300,
    xpReward: 420,
    goldReward: [50, 120],
    lootTable: null,
    spriteKey: 'enemy_totem',
    bossClearId: 'boss.desert_sovereign',
  },
};

let mapCount = 0;
let encounterCount = 0;
let enemyCount = 0;

for (const ch of CHAPTERS) {
  const chapterId = `chapter.${String(ch.chapter).padStart(2, '0')}.${ch.slug}`;
  const realmOrder = Math.min(7, 1 + Math.floor((ch.chapter - 1) / 1.5));

  for (let stageIdx = 0; stageIdx < 2; stageIdx++) {
    const stage = String(stageIdx + 1).padStart(2, '0');
    const mapId = `map.${ch.slug}.${stage}`;
    const tiledName = `${ch.slug}-${stage}`;
    const isBoss = stageIdx === 1;
    const seed = ch.chapter * 1000 + stageIdx * 17 + 42;

    const tiled = buildTiledMap({
      width: 50,
      height: 38,
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
      bounds: { width: 50 * TILE, height: 38 * TILE },
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
