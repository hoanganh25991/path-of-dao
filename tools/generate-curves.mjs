// Generates content/curves/level-xp.json and base-stats.json.
// Tuning anchors (hero.wanderer): L1 HP100/ATK10/DEF5, L10 ~280/35/18, L50 ~1200/180/90.
// Re-run after changing formulas: node tools/generate-curves.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'content', 'curves');
mkdirSync(outDir, { recursive: true });

const MAX_LEVEL = 100;

// xpToNext[level] = XP required to go from `level` to `level + 1`.
// Index 0 unused (levels start at 1); last playable index is MAX_LEVEL - 1.
const xpToNext = Array.from({ length: MAX_LEVEL }, (_, level) =>
  level === 0 ? 0 : 25 * level * (level + 3),
);

writeFileSync(
  join(outDir, 'level-xp.json'),
  JSON.stringify({ maxLevel: MAX_LEVEL, xpToNext }, null, 2) + '\n',
);

const levels = [];
for (let level = 1; level <= MAX_LEVEL; level += 1) {
  const n = level - 1;
  levels.push({
    level,
    hpMax: Math.round(100 + 20 * n + 0.06 * n * n),
    manaMax: Math.round(50 + 8 * n),
    atk: Math.round(10 + 2.5 * n + 0.02 * n * n),
    def: Math.round(5 + 1.3 * n + 0.01 * n * n),
    crit: 0.05,
    critDmg: 1.5,
    speed: 100,
    spirit: Math.round(10 + 2 * n),
  });
}

writeFileSync(
  join(outDir, 'base-stats.json'),
  JSON.stringify({ heroes: { 'hero.wanderer': { levels } } }, null, 2) + '\n',
);

console.log(`Wrote level-xp.json (${MAX_LEVEL} levels) and base-stats.json to ${outDir}`);
