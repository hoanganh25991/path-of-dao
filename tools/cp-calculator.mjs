#!/usr/bin/env node
/**
 * Dev CLI — print combat power for content balancing (sub-plan 16 §9).
 * Keep formula in sync with src/progression/CombatPower.ts.
 *
 * Usage:
 *   node tools/cp-calculator.mjs --level 35 --realm void_spirit
 *   node tools/cp-calculator.mjs --level 1 --realm mortal_body --gear item.sword.wood,item.robe.novice
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const REALM_CP_PER_ORDER = 50_000;
const INSIGHT_CP_PER_AWAKENING = 25_000;

function parseArgs(argv) {
  const opts = {
    level: 1,
    realm: 'mortal_body',
    gear: [],
    awakened: 0,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--level' && argv[i + 1]) {
      opts.level = Number(argv[++i]);
    } else if (arg === '--realm' && argv[i + 1]) {
      opts.realm = argv[++i];
    } else if (arg === '--gear' && argv[i + 1]) {
      opts.gear = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--awakened' && argv[i + 1]) {
      opts.awakened = Number(argv[++i]);
    } else if (arg === '--help' || arg === '-h') {
      opts.help = true;
    }
  }

  return opts;
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function statsForLevel(level) {
  const curves = loadJson(join(root, 'content/curves/base-stats.json'));
  const row = curves.heroes['hero.wanderer'].levels.find((entry) => entry.level === level);
  if (!row) throw new Error(`No base stats for level ${level}`);
  return { ...row };
}

function applyRealmScaling(base, realmId) {
  const realms = loadJson(join(root, 'content/progression/realms.json')).realms;
  const ordered = [...realms].sort((a, b) => a.order - b.order);
  let stats = { ...base };
  for (const def of ordered) {
    const m = def.statMultiplier;
    stats = {
      ...stats,
      hpMax: Math.floor(stats.hpMax * m.hpMax),
      manaMax: Math.floor(stats.manaMax * m.manaMax),
      atk: Math.floor(stats.atk * m.atk),
      def: Math.floor(stats.def * m.def),
      crit: Math.min(0.75, stats.crit * m.crit),
      critDmg: Math.min(3, Math.max(1.2, stats.critDmg * m.critDmg)),
      speed: Math.min(200, Math.max(50, Math.floor(stats.speed * m.speed))),
      spirit: Math.floor(stats.spirit * m.spirit),
    };
    if (def.id === realmId) break;
  }
  return stats;
}

function applyGear(stats, itemIds) {
  const resolved = { ...stats };
  for (const itemId of itemIds) {
    const item = loadJson(join(root, 'content/items', `${itemId}.json`));
    for (const mod of item.modifiers) {
      if (mod.kind === 'flat') {
        resolved[mod.stat] += mod.value;
      } else {
        resolved[mod.stat] = Math.floor(resolved[mod.stat] * (1 + mod.value));
      }
    }
  }
  return resolved;
}

function computeCombatPower(stats, realmOrder, awakenedCount) {
  const base =
    stats.hpMax * 0.15 +
    stats.manaMax * 0.08 +
    stats.atk * 2.5 +
    stats.def * 2.0 +
    stats.crit * 800 +
    stats.critDmg * 400 +
    stats.speed * 1.2 +
    stats.spirit * 1.5;

  return Math.floor(
    base + realmOrder * REALM_CP_PER_ORDER + awakenedCount * INSIGHT_CP_PER_AWAKENING,
  );
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    console.log(`Usage: node tools/cp-calculator.mjs [options]

Options:
  --level <n>       Player level (default 1)
  --realm <id>      Cultivation realm id (default mortal_body)
  --gear <ids>      Comma-separated item ids to apply as flat gear
  --awakened <n>    Awakened insight count (default 0)
`);
    process.exit(0);
  }

  const realms = loadJson(join(root, 'content/progression/realms.json')).realms;
  const realmDef = realms.find((r) => r.id === opts.realm);
  if (!realmDef) {
    console.error(`Unknown realm: ${opts.realm}`);
    process.exit(1);
  }

  const base = statsForLevel(opts.level);
  const scaled = applyRealmScaling(base, opts.realm);
  const stats = applyGear(scaled, opts.gear);
  const cp = computeCombatPower(stats, realmDef.order, opts.awakened);

  console.log(
    JSON.stringify(
      {
        level: opts.level,
        realm: opts.realm,
        realmOrder: realmDef.order,
        gear: opts.gear,
        awakened: opts.awakened,
        stats,
        combatPower: cp,
      },
      null,
      2,
    ),
  );
}

main();
