#!/usr/bin/env node
/** Build content/manifest.json — run via: pnpm content:pack */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const content = join(root, 'content');

function listIds(subdir, skipUnderscore = false) {
  const dir = join(content, subdir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json') && (!skipUnderscore || !f.startsWith('_')))
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
}

function listFortuitous() {
  const dir = join(content, 'encounters/fortuitous');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
}

const maps = listIds('maps');
const enemies = listIds('enemies');
const skills = listIds('skills', true);
const items = listIds('items', true);
const encounters = listIds('encounters', true);
const fortuitous = listFortuitous();
const stories = listIds('story');

const payload = JSON.stringify({ maps, enemies, skills, items, encounters, fortuitous, stories });
const checksum = createHash('sha256').update(payload).digest('hex').slice(0, 16);
const today = new Date().toISOString().slice(0, 10);

const manifest = {
  version: `content-${today}`,
  generatedAt: new Date().toISOString(),
  maps,
  enemies,
  skills,
  items,
  encounters,
  fortuitous,
  stories,
  checksum,
};

const out = join(content, 'manifest.json');
writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${out} (${maps.length} maps, checksum ${checksum})`);
