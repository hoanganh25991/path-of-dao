#!/usr/bin/env node
/**
 * Patches enemy JSON with loot tables, bestiary, boss phases (sub-plan 23).
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const enemiesDir = join(root, 'content', 'enemies');

const BOSS_PHASES = {
  default: [
    { hpThreshold: 1.0, skills: [], spawnAdds: [] },
    { hpThreshold: 0.5, skills: [], spawnAdds: [] },
  ],
  rift_horror: [
    { hpThreshold: 1.0, skills: [], spawnAdds: [] },
    { hpThreshold: 0.5, skills: [], spawnAdds: [{ id: 'enemy.rift.spawn', count: 2 }] },
  ],
  void_sovereign: [
    { hpThreshold: 1.0, skills: [], spawnAdds: [] },
    { hpThreshold: 0.5, skills: [], spawnAdds: [] },
    { hpThreshold: 0.25, skills: [], spawnAdds: [{ id: 'enemy.void.shade', count: 2 }] },
  ],
};

function lootFor(enemy) {
  if (enemy.id.startsWith('boss.')) {
    return enemy.id === 'boss.void_sovereign' ? 'loot.boss.final' : 'loot.boss.standard';
  }
  if (enemy.id.includes('elite')) return 'loot.tier.uncommon';
  if (enemy.archetype === 'stationary' || enemy.id.includes('totem')) return 'loot.tier.rare';
  return 'loot.tier.common';
}

function categoryFor(enemy) {
  if (enemy.id.startsWith('boss.') || enemy.bossClearId) return 'boss';
  if (enemy.id.includes('elite')) return 'elite';
  return 'grunt';
}

let patched = 0;
for (const file of readdirSync(enemiesDir).filter((f) => f.endsWith('.json'))) {
  const path = join(enemiesDir, file);
  const enemy = JSON.parse(readFileSync(path, 'utf8'));
  const id = enemy.id;

  enemy.lootTable = lootFor(enemy);
  enemy.category = categoryFor(enemy);
  enemy.bestiaryKey = `bestiary.${id.replace(/\./g, '_')}.desc`;
  enemy.weakness = enemy.archetype === 'stationary' ? 'lightning' : 'spirit';
  enemy.resistance = id.includes('ice') || id.includes('frost') ? 'physical' : 'none';

  if (enemy.archetype === 'boss' || enemy.bossClearId) {
    const key = id.replace('boss.', '');
    enemy.phases = BOSS_PHASES[key] ?? BOSS_PHASES.default;
  }

  writeFileSync(path, `${JSON.stringify(enemy, null, 2)}\n`);
  patched++;
}

console.log(`Patched ${patched} enemy files`);
