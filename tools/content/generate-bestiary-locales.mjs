#!/usr/bin/env node
/**
 * Generate bestiary locale stubs from enemy JSON (sub-plan 24).
 * Run: node tools/content/generate-bestiary-locales.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const enemiesDir = join(root, 'content', 'enemies');

const en = {};
const vi = {};

for (const file of readdirSync(enemiesDir).filter((f) => f.endsWith('.json'))) {
  const enemy = JSON.parse(readFileSync(join(enemiesDir, file), 'utf8'));
  if (!enemy.bestiaryKey) continue;
  const nameEn = enemy.displayNameKey;
  en[enemy.bestiaryKey] = `A cultivator's note on ${nameEn.replace('.name', '').split('.').pop()?.replace(/_/g, ' ') ?? enemy.id}.`;
  vi[enemy.bestiaryKey] = `Ghi chép tu sĩ về ${enemy.id.replace(/\./g, ' ')}.`;
}

writeFileSync(join(root, 'content/locales/en/bestiary.json'), `${JSON.stringify(en, null, 2)}\n`);
writeFileSync(join(root, 'content/locales/vi/bestiary.json'), `${JSON.stringify(vi, null, 2)}\n`);
console.log(`Wrote ${Object.keys(en).length} bestiary entries (en/vi)`);
