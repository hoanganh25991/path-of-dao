import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { ZodType } from 'zod';
import { mapConfigSchema } from '@/combat/map/MapConfig';
import { enemyConfigSchema, encounterConfigSchema } from '@/combat/enemies/EnemyConfig';
import { skillDefinitionSchema } from '@/progression/SkillDefinition';
import { itemDefinitionSchema } from '@/progression/ItemDefinition';
import { chaptersIndexSchema } from '@/shared/schemas/chapter';
import { storySceneSchema } from '@/shared/schemas/story';
import { worldMapFileSchema } from '@/shared/schemas/world-map';
import { encounterDefinitionSchema } from '@/shared/schemas/fortuitous-encounters';
import { realmsFileSchema } from '@/shared/schemas/realms';
import type { ValidationReport } from '@/shared/content/types';
import { createReport } from '@/shared/content/types';

export interface ContentIndex {
  maps: Map<string, unknown>;
  enemies: Map<string, unknown>;
  skills: Map<string, unknown>;
  items: Map<string, unknown>;
  encounters: Map<string, unknown>;
  fortuitous: Map<string, unknown>;
  stories: Map<string, unknown>;
  locales: { en: Record<string, string>; vi: Record<string, string> };
  chapters: unknown;
  world: unknown;
  realms: unknown;
}

const ROOT = process.cwd();
const CONTENT = join(ROOT, 'content');

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function rel(path: string): string {
  return relative(ROOT, path).replace(/\\/g, '/');
}

function loadDir(
  subdir: string,
  opts?: { skipUnderscore?: boolean; nested?: boolean },
): Map<string, unknown> {
  const dir = join(CONTENT, subdir);
  const out = new Map<string, unknown>();
  if (!existsSync(dir)) return out;

  const files = opts?.nested
    ? readdirSync(dir, { recursive: true } as { recursive: boolean })
        .filter((f): f is string => typeof f === 'string' && f.endsWith('.json'))
    : readdirSync(dir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const base = file.replace(/\.json$/, '').replace(/^.*\//, '');
    if (opts?.skipUnderscore && base.startsWith('_')) continue;
    const full = join(dir, file);
    out.set(base, readJson(full));
  }
  return out;
}

function loadLocales(): ContentIndex['locales'] {
  const load = (locale: 'en' | 'vi'): Record<string, string> => {
    const dir = join(CONTENT, 'locales', locale);
    if (!existsSync(dir)) return {};
    const merged: Record<string, string> = {};
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      Object.assign(merged, readJson(join(dir, file)) as Record<string, string>);
    }
    return merged;
  };
  return { en: load('en'), vi: load('vi') };
}

export function loadContentIndex(): ContentIndex {
  return {
    maps: loadDir('maps'),
    enemies: loadDir('enemies'),
    skills: loadDir('skills', { skipUnderscore: true }),
    items: loadDir('items', { skipUnderscore: true }),
    encounters: loadDir('encounters', { skipUnderscore: true }),
    fortuitous: loadDir('encounters/fortuitous', { skipUnderscore: true }),
    stories: loadDir('story'),
    locales: loadLocales(),
    chapters: existsSync(join(CONTENT, 'chapters/index.json'))
      ? readJson(join(CONTENT, 'chapters/index.json'))
      : null,
    world: existsSync(join(CONTENT, 'world/world-map.json'))
      ? readJson(join(CONTENT, 'world/world-map.json'))
      : null,
    realms: existsSync(join(CONTENT, 'progression/realms.json'))
      ? readJson(join(CONTENT, 'progression/realms.json'))
      : null,
  };
}

function validateMap<K extends string>(
  report: ValidationReport,
  label: string,
  entries: Map<string, unknown>,
  schema: ZodType,
  idField: (data: { id: string }) => string = (d) => d.id,
): void {
  report.checked[label] = entries.size;
  for (const [fileId, raw] of entries) {
    const path = `${label}/${fileId}.json`;
    const result = schema.safeParse(raw);
    if (!result.success) {
      report.errors.push({ file: path, message: result.error.message, severity: 'error' });
      continue;
    }
    const id = idField(result.data as { id: string });
    if (id !== fileId) {
      report.errors.push({
        file: path,
        message: `id "${id}" does not match filename "${fileId}"`,
        severity: 'error',
      });
    }
  }
}

export function validateSchemas(index: ContentIndex): ValidationReport {
  const report = createReport();

  validateMap(report, 'maps', index.maps, mapConfigSchema);
  validateMap(report, 'enemies', index.enemies, enemyConfigSchema);
  validateMap(report, 'skills', index.skills, skillDefinitionSchema);
  validateMap(report, 'items', index.items, itemDefinitionSchema);
  validateMap(report, 'story', index.stories, storySceneSchema);

  for (const [fileId, raw] of index.encounters) {
    const path = `encounters/${fileId}.json`;
    const result = encounterConfigSchema.safeParse(raw);
    if (!result.success) {
      report.errors.push({ file: path, message: result.error.message, severity: 'error' });
    }
  }
  report.checked.encounters = index.encounters.size;

  for (const [fileId, raw] of index.fortuitous) {
    const path = `encounters/fortuitous/${fileId}.json`;
    const result = encounterDefinitionSchema.safeParse(raw);
    if (!result.success) {
      report.errors.push({ file: path, message: result.error.message, severity: 'error' });
    }
  }
  report.checked['fortuitous'] = index.fortuitous.size;

  if (index.chapters) {
    const ch = chaptersIndexSchema.safeParse(index.chapters);
    if (!ch.success) {
      report.errors.push({ file: 'chapters/index.json', message: ch.error.message, severity: 'error' });
    }
    report.checked.chapters = 1;
  }

  if (index.world) {
    const w = worldMapFileSchema.safeParse(index.world);
    if (!w.success) {
      report.errors.push({ file: 'world/world-map.json', message: w.error.message, severity: 'error' });
    }
    report.checked.world = 1;
  }

  if (index.realms) {
    const r = realmsFileSchema.safeParse(index.realms);
    if (!r.success) {
      report.errors.push({ file: 'progression/realms.json', message: r.error.message, severity: 'error' });
    }
    report.checked.realms = 1;
  }

  return report;
}

/** Resolve tiled asset path exists on disk. */
export function tiledAssetExists(tiledPath: string): boolean {
  return existsSync(join(ROOT, tiledPath));
}

export { CONTENT, rel };
