#!/usr/bin/env node
/**
 * DA-08 auto-wire pipeline (plans/design-arts/08-auto-wire-pipeline.md).
 *
 * Scans assets/sprites/**\/*.png and rewrites assets/sprites/manifest.json.
 *
 * PNGs at the direct-file convention path (`{category}/{key}.png`, top-level,
 * category = hero|skills|items) are auto-wired by AssetArtRegistry without
 * any manifest row — this script leaves those out on purpose. It only adds
 * manifest rows for:
 *   - skills/items PNGs nested in subfolders (filename alone can't resolve them)
 *   - existing hero manifest entries, whose `sheet` path it re-validates
 *
 * It also prunes any existing manifest row whose target PNG no longer exists
 * on disk, so `manifest.json` never points at a stale/missing file.
 *
 * Run: node tools/generate-sprite-manifest.mjs  (alias: pnpm art:manifest)
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const spritesDir = join(root, 'assets', 'sprites');
const manifestPath = join(spritesDir, 'manifest.json');

function walkPngFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkPngFiles(full));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
      out.push(full);
    }
  }
  return out;
}

function relSprite(absPath) {
  return relative(spritesDir, absPath).replace(/\\/g, '/');
}

function loadManifest() {
  if (!existsSync(manifestPath)) return { hero: {}, skills: {}, items: {} };
  const raw = JSON.parse(readFileSync(manifestPath, 'utf8'));
  return { hero: raw.hero ?? {}, skills: raw.skills ?? {}, items: raw.items ?? {} };
}

const pngFiles = walkPngFiles(spritesDir).map(relSprite);
const pngSet = new Set(pngFiles);
const manifest = loadManifest();

const report = { autoWired: [], manifestAdded: [], manifestPruned: [] };

for (const category of ['skills', 'items']) {
  const nested = pngFiles.filter((p) => {
    if (!p.startsWith(`${category}/`)) return false;
    const rest = p.slice(category.length + 1);
    return rest.includes('/');
  });
  const topLevel = pngFiles.filter((p) => {
    if (!p.startsWith(`${category}/`)) return false;
    const rest = p.slice(category.length + 1);
    return !rest.includes('/');
  });
  for (const p of topLevel) {
    report.autoWired.push(p);
  }
  for (const p of nested) {
    const key = p.slice(category.length + 1).replace(/\.png$/i, '');
    if (manifest[category][key] !== p) {
      manifest[category][key] = p;
      report.manifestAdded.push(`${category}.${key} -> ${p}`);
    }
  }
  for (const key of Object.keys(manifest[category])) {
    const target = manifest[category][key];
    if (!pngSet.has(target)) {
      delete manifest[category][key];
      report.manifestPruned.push(`${category}.${key} -> ${target} (missing)`);
    }
  }
}

for (const p of pngFiles.filter((f) => f.startsWith('hero/'))) {
  const rest = p.slice('hero/'.length);
  if (!rest.includes('/')) report.autoWired.push(p);
}
for (const key of Object.keys(manifest.hero)) {
  const entry = manifest.hero[key];
  if (!entry?.sheet || !pngSet.has(entry.sheet)) {
    delete manifest.hero[key];
    report.manifestPruned.push(`hero.${key} -> ${entry?.sheet ?? '(no sheet)'} (missing)`);
  }
}

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Scanned ${pngFiles.length} PNG(s) under assets/sprites/`);
console.log(`Auto-wired (no manifest row needed): ${report.autoWired.length}`);
for (const p of report.autoWired) console.log(`  ${p}`);
console.log(`Manifest rows added: ${report.manifestAdded.length}`);
for (const line of report.manifestAdded) console.log(`  ${line}`);
console.log(`Manifest rows pruned (stale): ${report.manifestPruned.length}`);
for (const line of report.manifestPruned) console.log(`  ${line}`);
console.log(`Wrote ${relative(root, manifestPath)}`);
